import FullCalendar from '@fullcalendar/vue3'
import timeGridPlugin from '@fullcalendar/timegrid'
import interactionPlugin from '@fullcalendar/interaction'
import { listCalendars } from '@/services/calendar/calendar.service'
import { listUnavailableDays, setUnavailableDay } from '@/services/unavailable-day/unavailable-day.service'
import { useAuthStore } from '@/store/modules/auth'
import { addDateString, pad, toDateInput } from '@/utils/dates'

function compactCalendar() {
  return window.matchMedia('(max-width: 720px)').matches
}

function calendarToolbar(compact) {
  return {
    left: compact ? 'prev,next' : 'prev,next today',
    center: 'title',
    right: ''
  }
}

function errorMessage(error, fallback) {
  const data = error.response?.data
  if (typeof data === 'string' && data) {
    return data
  }
  if (data?.Message) {
    return data.Message
  }
  if (data?.message) {
    return data.message
  }
  return fallback
}

function timeText(date) {
  return `${pad(date.getHours())}:${pad(date.getMinutes())}`
}

function allDayParts(start, end) {
  const parts = []
  const cursor = new Date(start.getFullYear(), start.getMonth(), start.getDate())
  const stop = new Date(end.getFullYear(), end.getMonth(), end.getDate())
  while (cursor < stop) {
    parts.push({ date: toDateInput(cursor) })
    cursor.setDate(cursor.getDate() + 1)
  }
  return parts
}

function splitTimed(start, end) {
  const parts = []
  let cursor = new Date(start.getTime())
  while (cursor < end) {
    const midnight = new Date(cursor.getFullYear(), cursor.getMonth(), cursor.getDate() + 1)
    const sliceEnd = midnight < end ? midnight : end
    const endsAtMidnight = sliceEnd.getHours() === 0 && sliceEnd.getMinutes() === 0 && sliceEnd > cursor
    parts.push({
      date: toDateInput(cursor),
      startTime: timeText(cursor),
      endTime: endsAtMidnight ? '24:00' : timeText(sliceEnd)
    })
    cursor = sliceEnd
  }
  return parts
}

export default {
  name: 'AvailabilityView',
  components: {
    FullCalendar
  },
  data() {
    const compact = compactCalendar()
    return {
      calendarId: '',
      blocks: [],
      rangeKey: '',
      visibleStart: '',
      visibleEnd: '',
      error: '',
      saveError: '',
      loading: false,
      ready: false,
      saving: false,
      calendarOptions: {
        plugins: [timeGridPlugin, interactionPlugin],
        initialView: compact ? 'timeGridDay' : 'timeGridWeek',
        headerToolbar: calendarToolbar(compact),
        windowResize: () => this.syncCalendarView(),
        height: compact ? 640 : 720,
        allDaySlot: true,
        allDayText: 'All day',
        slotDuration: '00:30:00',
        snapDuration: '00:30:00',
        slotLabelInterval: '01:00',
        slotLabelFormat: {
          hour: 'numeric',
          minute: '2-digit',
          meridiem: 'short'
        },
        eventTimeFormat: {
          hour: 'numeric',
          minute: '2-digit',
          meridiem: 'short'
        },
        dayHeaderFormat: {
          weekday: 'short',
          month: 'numeric',
          day: 'numeric'
        },
        nowIndicator: true,
        scrollTime: '08:00:00',
        selectable: true,
        selectMirror: true,
        unselectAuto: true,
        editable: false,
        events: [],
        datesSet: (info) => this.onDatesSet(info),
        select: (info) => this.closeSelection(info),
        eventClick: (info) => this.openBlock(info)
      }
    }
  },
  computed: {
    statusLabel() {
      if (this.saving) {
        return 'Saving…'
      }
      if (this.loading) {
        return 'Loading times…'
      }
      const count = this.blocks.length
      if (!count) {
        return 'No unavailable times in view.'
      }
      return count === 1 ? '1 unavailable block in view.' : `${count} unavailable blocks in view.`
    }
  },
  async mounted() {
    await this.loadCalendar()
    if (this.visibleStart && !this.rangeKey) {
      this.onDatesSet({ startStr: this.visibleStart, endStr: this.visibleEnd })
    }
  },
  methods: {
    syncCalendarView() {
      const calendar = this.$refs.calendar?.getApi()
      if (!calendar) {
        return
      }
      const compact = window.matchMedia('(max-width: 720px)').matches
      const target = compact ? 'timeGridDay' : 'timeGridWeek'
      if (calendar.view.type === target) {
        return
      }
      calendar.setOption('headerToolbar', calendarToolbar(compact))
      calendar.setOption('height', compact ? 640 : 720)
      calendar.changeView(target)
    },
    async loadCalendar() {
      if (!useAuthStore().isDoctor) {
        this.error = 'Only a doctor can set unavailable times.'
        return
      }
      this.loading = true
      this.error = ''
      try {
        const response = await listCalendars()
        const userId = (useAuthStore().userId || '').toLowerCase()
        const mine = (response.data || []).find((item) => (item.doctorUserId || '').toLowerCase() === userId)
        if (!mine) {
          this.error = 'Your calendar is not ready yet.'
          return
        }
        this.calendarId = mine.id
        this.ready = true
      } catch (error) {
        this.error = 'The calendar could not be loaded.'
      } finally {
        this.loading = false
      }
    },
    async onDatesSet(info) {
      const key = `${info.startStr}|${info.endStr}`
      this.visibleStart = info.startStr
      this.visibleEnd = info.endStr
      if (key === this.rangeKey || !this.calendarId) {
        return
      }
      this.rangeKey = key
      await this.refresh()
    },
    async refresh() {
      if (!this.calendarId || !this.visibleStart || !this.visibleEnd) {
        return
      }
      this.loading = true
      try {
        const response = await listUnavailableDays(this.calendarId, this.visibleStart, this.visibleEnd)
        this.blocks = response.data || []
        await this.$nextTick()
        this.paint()
      } catch (error) {
        this.error = 'Unavailable times could not be loaded.'
      } finally {
        this.loading = false
      }
    },
    paint() {
      const calendar = this.$refs.calendar?.getApi()
      if (!calendar) {
        return
      }
      calendar.updateSize()
      calendar.removeAllEvents()
      this.blocks.forEach((block) => {
        if (!block.startTime) {
          calendar.addEvent({
            id: block.id,
            title: 'Unavailable',
            start: block.date,
            allDay: true,
            classNames: ['availability-event']
          })
          calendar.addEvent({
            start: block.date,
            end: addDateString(block.date, 1),
            display: 'background',
            classNames: ['fc-unavailable']
          })
          return
        }
        const end = block.endTime === '24:00'
          ? `${addDateString(block.date, 1)}T00:00:00`
          : `${block.date}T${block.endTime}`
        calendar.addEvent({
          id: block.id,
          title: 'Unavailable',
          start: `${block.date}T${block.startTime}`,
          end,
          classNames: ['availability-event']
        })
      })
    },
    dayIsClosed(date) {
      const key = toDateInput(date)
      return this.blocks.some((block) => block.date === key && !block.startTime)
    },
    async closeSelection(info) {
      const calendar = this.$refs.calendar?.getApi()
      if (calendar) {
        calendar.unselect()
      }
      if (this.saving || !this.calendarId || !(info.start instanceof Date) || !(info.end instanceof Date)) {
        return
      }
      if (!info.allDay && this.dayIsClosed(info.start)) {
        return
      }
      const parts = info.allDay ? allDayParts(info.start, info.end) : splitTimed(info.start, info.end)
      if (!parts.length) {
        return
      }
      this.saving = true
      this.saveError = ''
      try {
        for (let index = 0; index < parts.length; index += 1) {
          const part = parts[index]
          await setUnavailableDay({
            calendarId: this.calendarId,
            date: part.date,
            startTime: part.startTime,
            endTime: part.endTime,
            unavailable: true
          })
        }
        await this.refresh()
      } catch (error) {
        this.saveError = error.response?.status === 403
          ? 'Only the doctor for this calendar can change unavailable times.'
          : errorMessage(error, 'That time was not saved.')
      } finally {
        this.saving = false
      }
    },
    async openBlock(info) {
      const id = info.event?.id
      if (!id || String(id).startsWith('_') || this.saving || !this.calendarId) {
        return
      }
      this.saving = true
      this.saveError = ''
      try {
        await setUnavailableDay({
          calendarId: this.calendarId,
          id,
          unavailable: false
        })
        await this.refresh()
      } catch (error) {
        this.saveError = error.response?.status === 403
          ? 'Only the doctor for this calendar can change unavailable times.'
          : errorMessage(error, 'That time was not opened.')
      } finally {
        this.saving = false
      }
    }
  }
}
