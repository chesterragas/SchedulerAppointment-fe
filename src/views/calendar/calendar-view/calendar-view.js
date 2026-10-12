import FullCalendar from '@fullcalendar/vue3'
import dayGridPlugin from '@fullcalendar/daygrid'
import timeGridPlugin from '@fullcalendar/timegrid'
import interactionPlugin from '@fullcalendar/interaction'
import AppButton from '@/components/app-button/app-button.vue'
import AppDialog from '@/components/app-dialog/app-dialog.vue'
import AppInput from '@/components/app-input/app-input.vue'
import { getProfile } from '@/services/profile/profile.service'
import { listCalendars } from '@/services/calendar/calendar.service'
import { listUnavailableDays } from '@/services/unavailable-day/unavailable-day.service'
import { useAuthStore } from '@/store/modules/auth'
import { useEventStore } from '@/store/modules/event'
import { addDateString, pad, toDateInput } from '@/utils/dates'
import QRCode from 'qrcode'

function compactCalendar() {
  return window.matchMedia('(max-width: 720px)').matches
}

function calendarToolbar() {
  return {
    left: 'prev,next',
    center: 'title',
    right: ''
  }
}

function blankEditor() {
  return {
    open: false,
    id: '',
    firstName: '',
    lastName: '',
    address: '',
    email: '',
    phoneNumber: '',
    dateAppointment: '',
    timeAppointment: '',
    calendarId: '',
    error: '',
    saving: false,
    loading: false
  }
}

function slotFromDate(date) {
  return {
    dateAppointment: toDateInput(date),
    timeAppointment: `${pad(date.getHours())}:${pad(date.getMinutes())}`
  }
}

function appointmentTitle(appointment) {
  return `${appointment.firstName || ''} ${appointment.lastName || ''}`.trim()
}

function blankShare() {
  return {
    open: false,
    url: '',
    qr: '',
    loading: false,
    error: '',
    copied: false
  }
}

async function writeClipboard(value) {
  try {
    await navigator.clipboard.writeText(value)
    return true
  } catch (error) {
    const area = document.createElement('textarea')
    area.value = value
    area.setAttribute('readonly', '')
    area.style.position = 'fixed'
    area.style.left = '-9999px'
    document.body.appendChild(area)
    area.select()
    let copied = false
    try {
      copied = document.execCommand('copy')
    } catch (commandError) {
      copied = false
    }
    document.body.removeChild(area)
    return copied
  }
}

export default {
  name: 'CalendarView',
  components: {
    FullCalendar,
    AppButton,
    AppDialog,
    AppInput
  },
  data() {
    const compact = compactCalendar()
    return {
      rangeKey: '',
      visibleStart: '',
      visibleEnd: '',
      error: '',
      notice: '',
      unavailableBlocks: [],
      loading: false,
      calendars: [],
      editor: blankEditor(),
      confirm: {
        open: false,
        mode: '',
        title: ''
      },
      confirming: false,
      share: blankShare(),
      calendarOptions: {
        plugins: [dayGridPlugin, timeGridPlugin, interactionPlugin],
        initialView: compact ? 'timeGridDay' : 'timeGridWeek',
        headerToolbar: calendarToolbar(),
        windowResize: () => this.syncCalendarView(),
        height: compact ? 640 : '100%',
        allDaySlot: false,
        slotDuration: '00:30:00',
        slotLabelInterval: '01:00',
        defaultTimedEventDuration: '00:30:00',
        forceEventDuration: true,
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
        editable: false,
        eventDurationEditable: false,
        events: [],
        datesSet: (info) => this.onDatesSet(info),
        dateClick: (info) => this.openCreate(info.date),
        eventClick: (info) => this.openEdit(info.event),
        eventDrop: (info) => this.onMove(info)
      }
    }
  },
  computed: {
    signedIn() {
      return useAuthStore().isAuthorized
    },
    ownsCalendar() {
      const selected = this.selectedCalendar
      const userId = (useAuthStore().userId || '').toLowerCase()
      return Boolean(selected && (selected.doctorUserId || '').toLowerCase() === userId)
    },
    calendarId() {
      const match = this.calendars.find((item) => this.sameId(item.id, this.$route.params.calendarId))
      return match?.id || ''
    },
    selectedCalendar() {
      return this.calendars.find((item) => item.id === this.calendarId) || null
    },
    confirmingSlot() {
      return this.signedIn && !this.ownsCalendar && !this.editor.id
    },
    dialogTitle() {
      if (this.editor.id) {
        return 'Edit appointment'
      }
      return this.confirmingSlot ? 'Confirm appointment' : 'New appointment'
    },
    submitLabel() {
      return this.confirmingSlot ? 'Confirm' : 'Save'
    },
    needsProfile() {
      return this.confirmingSlot && !this.editor.loading && !this.editor.error && !this.hasContact(this.editor)
    },
    slotLabel() {
      const { dateAppointment, timeAppointment } = this.editor
      if (!dateAppointment || !timeAppointment) {
        return ''
      }
      const [year, month, day] = dateAppointment.split('-').map(Number)
      const [hour, minute] = timeAppointment.split(':').map(Number)
      const when = new Date(year, month - 1, day, hour || 0, minute || 0)
      return when.toLocaleString(undefined, {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit'
      })
    }
  },
  watch: {
    ownsCalendar: {
      immediate: true,
      handler(ownsCalendar) {
        this.calendarOptions.editable = ownsCalendar
      }
    },
    calendarId() {
      if (this.visibleStart) {
        this.refresh()
      }
    },
    '$route.params.calendarId'(next, previous) {
      if (next !== previous) {
        this.loadCalendars()
      }
    },
    async signedIn() {
      await this.loadCalendars()
      if (this.visibleStart) {
        this.rangeKey = ''
        this.refresh()
      }
    }
  },
  created() {
    this.pendingMove = null
  },
  async mounted() {
    await this.loadCalendars()
    if (this.visibleStart && !this.rangeKey) {
      this.onDatesSet({ startStr: this.visibleStart, endStr: this.visibleEnd })
    }
  },
  methods: {
    sameId(left, right) {
      return String(left || '').toLowerCase() === String(right || '').toLowerCase()
    },
    isUnavailable(date) {
      const key = toDateInput(date)
      const time = `${pad(date.getHours())}:${pad(date.getMinutes())}`
      return this.unavailableBlocks.some((block) => {
        if (block.date !== key) {
          return false
        }
        if (!block.startTime || !block.endTime) {
          return true
        }
        return block.startTime <= time && time < block.endTime
      })
    },
    async openShare() {
      if (!this.ownsCalendar || !this.calendarId) {
        return
      }
      const resolved = this.$router.resolve({ name: 'calendar', params: { calendarId: this.calendarId } })
      const url = new URL(resolved.href, window.location.origin).href
      this.share = { ...blankShare(), open: true, loading: true }
      try {
        const qr = await QRCode.toDataURL(url, {
          errorCorrectionLevel: 'M',
          margin: 4,
          width: 560,
          color: {
            dark: '#163047',
            light: '#ffffff'
          }
        })
        if (!this.share.open) {
          return
        }
        this.share.url = url
        this.share.qr = qr
        this.$nextTick(() => {
          document.getElementById('doctor-calendar-qr')?.focus()
        })
      } catch (error) {
        if (this.share.open) {
          this.share.error = 'The calendar link could not be created.'
        }
      } finally {
        if (this.share.open) {
          this.share.loading = false
        }
      }
    },
    closeShare() {
      this.share = blankShare()
    },
    async copyShare() {
      if (!this.share.url) {
        return
      }
      const copied = await writeClipboard(this.share.url)
      if (!copied) {
        this.share.error = 'Copy the link from the dialog.'
        return
      }
      this.share.error = ''
      this.share.copied = true
    },
    async loadCalendars() {
      const request = (this.calendarRequest || 0) + 1
      this.calendarRequest = request
      this.loading = true
      this.error = ''
      try {
        const response = await listCalendars()
        if (request !== this.calendarRequest) {
          return
        }
        const all = response.data || []
        const routeId = this.$route.params.calendarId
        if (routeId) {
          const match = all.find((item) => this.sameId(item.id, routeId))
          this.calendars = match ? [match] : []
          if (!match) {
            this.error = 'This calendar link is not valid.'
          }
          return
        }
        const userId = (useAuthStore().userId || '').toLowerCase()
        const mine = all.find((item) => (item.doctorUserId || '').toLowerCase() === userId)
        this.calendars = []
        if (mine) {
          await this.$router.replace({ name: 'calendar', params: { calendarId: mine.id } })
        }
      } catch (error) {
        if (request !== this.calendarRequest) {
          return
        }
        this.calendars = []
        this.error = 'The calendar could not be loaded.'
      } finally {
        if (request === this.calendarRequest) {
          this.loading = false
        }
      }
    },
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
      calendar.setOption('headerToolbar', calendarToolbar())
      calendar.setOption('height', compact ? 640 : '100%')
      calendar.changeView(target)
    },
    async onDatesSet(info) {
      const key = `${info.startStr}|${info.endStr}`
      this.visibleStart = info.startStr
      this.visibleEnd = info.endStr
      if (key === this.rangeKey || !this.$refs.calendar) {
        return
      }
      this.notice = ''
      this.rangeKey = key
      await this.refresh()
    },
    async refresh() {
      if (!this.visibleStart || !this.visibleEnd || !this.calendarId) {
        return
      }
      this.error = ''
      try {
        const [appointments, closed] = await Promise.all([
          useEventStore().load(this.visibleStart, this.visibleEnd, this.calendarId),
          listUnavailableDays(this.calendarId, this.visibleStart, this.visibleEnd)
        ])
        this.unavailableBlocks = closed.data || []
        const calendar = this.$refs.calendar?.getApi()
        if (!calendar) {
          return
        }
        calendar.removeAllEvents()
        this.unavailableBlocks.forEach((block) => {
          if (!block.startTime) {
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
            start: `${block.date}T${block.startTime}`,
            end,
            display: 'background',
            classNames: ['fc-unavailable']
          })
        })
        appointments.forEach((appointment) => {
          const slot = `${appointment.dateAppointment}T${appointment.timeAppointment}`
          calendar.addEvent({
            id: appointment.id,
            title: appointmentTitle(appointment),
            start: slot,
            allDay: false,
            extendedProps: {
              firstName: appointment.firstName,
              lastName: appointment.lastName,
              address: appointment.address,
              email: appointment.email,
              phoneNumber: appointment.phoneNumber,
              calendarId: appointment.calendarId
            }
          })
        })
      } catch (error) {
        this.error = 'The calendar could not load appointments.'
      }
    },
    openCreate(date) {
      if (!(date instanceof Date) || Number.isNaN(date.getTime())) {
        return
      }
      if (!this.calendarId) {
        this.error = 'Open a doctor\'s calendar before booking. Appointments are created on that calendar.'
        return
      }
      if (!this.ownsCalendar && this.isUnavailable(date)) {
        this.notice = 'The doctor is unavailable at that time.'
        return
      }
      this.notice = ''
      const confirmSlot = this.signedIn && !this.ownsCalendar
      this.editor = {
        ...blankEditor(),
        open: true,
        loading: confirmSlot,
        calendarId: this.calendarId,
        ...slotFromDate(date)
      }
      if (confirmSlot) {
        this.bookerRequest = (this.bookerRequest || 0) + 1
        this.loadBooker(this.bookerRequest)
        return
      }
      this.$nextTick(() => {
        document.getElementById('appointment-first-name')?.focus()
      })
    },
    async loadBooker(request) {
      try {
        const response = await getProfile()
        if (request !== this.bookerRequest || !this.editor.open || this.editor.id) {
          return
        }
        const user = response.data || {}
        this.editor.firstName = user.firstName || ''
        this.editor.lastName = user.lastName || ''
        this.editor.address = user.address || ''
        this.editor.email = user.email || ''
        this.editor.phoneNumber = user.phoneNumber || ''
      } catch (error) {
        if (request === this.bookerRequest && this.editor.open && !this.editor.id) {
          this.editor.error = 'Your details could not be loaded.'
        }
      } finally {
        if (request === this.bookerRequest && this.editor.open && !this.editor.id) {
          this.editor.loading = false
        }
      }
    },
    hasContact(source) {
      return Boolean(
        source.firstName.trim()
        && source.lastName.trim()
        && source.address.trim()
        && source.email.trim()
        && source.phoneNumber.trim()
      )
    },
    openEdit(event) {
      if (!this.ownsCalendar) {
        return
      }
      const slot = slotFromDate(event.start)
      this.editor = {
        ...blankEditor(),
        open: true,
        id: event.id,
        firstName: event.extendedProps.firstName || '',
        lastName: event.extendedProps.lastName || '',
        address: event.extendedProps.address || '',
        email: event.extendedProps.email || '',
        phoneNumber: event.extendedProps.phoneNumber || '',
        calendarId: event.extendedProps.calendarId || this.calendarId,
        ...slot
      }
      this.$nextTick(() => {
        document.getElementById('appointment-first-name')?.focus()
      })
    },
    closeEditor() {
      this.editor = blankEditor()
    },
    payloadFromEditor() {
      return {
        firstName: this.editor.firstName.trim(),
        lastName: this.editor.lastName.trim(),
        address: this.editor.address.trim(),
        email: this.editor.email.trim(),
        phoneNumber: this.editor.phoneNumber.trim(),
        dateAppointment: this.editor.dateAppointment,
        timeAppointment: this.editor.timeAppointment,
        calendarId: this.editor.calendarId
      }
    },
    async save() {
      this.editor.error = ''
      const payload = this.payloadFromEditor()
      if (!this.hasContact(payload)) {
        this.editor.error = this.confirmingSlot
          ? 'Complete your profile before booking.'
          : 'Fill in every field.'
        return
      }
      if (!payload.dateAppointment || !payload.timeAppointment) {
        this.editor.error = 'Choose a time on the calendar.'
        return
      }
      if (this.editor.id) {
        this.confirm = { open: true, mode: 'edit', title: appointmentTitle(payload) }
        return
      }
      await this.persistEdit()
    },
    async confirmUpdate() {
      const mode = this.confirm.mode
      const move = this.pendingMove
      this.confirm.open = false
      this.pendingMove = null
      this.confirming = true
      try {
        if (mode === 'move') {
          await this.persistMove(move)
        } else {
          await this.persistEdit()
        }
      } finally {
        this.confirming = false
      }
    },
    dismissConfirm() {
      if (this.confirm.mode === 'move' && this.pendingMove) {
        this.pendingMove.revert()
        this.pendingMove = null
      }
      this.confirm = { open: false, mode: '', title: '' }
    },
    async persistEdit() {
      const payload = this.payloadFromEditor()
      this.editor.saving = true
      const events = useEventStore()
      try {
        if (this.editor.id) {
          await events.update(this.editor.id, payload)
        } else {
          await events.create(payload)
        }
        this.closeEditor()
        await this.refresh()
      } catch (error) {
        this.editor.error = error.response?.data?.Message || error.response?.data || 'The appointment was not saved.'
        if (typeof this.editor.error !== 'string') {
          this.editor.error = 'The appointment was not saved.'
        }
      } finally {
        this.editor.saving = false
      }
    },
    async remove() {
      const events = useEventStore()
      try {
        await events.remove(this.editor.id)
        this.closeEditor()
        await this.refresh()
      } catch (error) {
        this.editor.error = 'The appointment was not deleted.'
      }
    },
    onMove(info) {
      if (!this.ownsCalendar) {
        info.revert()
        return
      }
      this.pendingMove = info
      this.confirm = { open: true, mode: 'move', title: info.event.title }
    },
    async persistMove(info) {
      const event = info.event
      const slot = slotFromDate(event.start)
      try {
        await useEventStore().update(event.id, {
          firstName: event.extendedProps.firstName,
          lastName: event.extendedProps.lastName,
          address: event.extendedProps.address,
          email: event.extendedProps.email,
          phoneNumber: event.extendedProps.phoneNumber,
          dateAppointment: slot.dateAppointment,
          timeAppointment: slot.timeAppointment,
          calendarId: event.extendedProps.calendarId || this.calendarId
        })
      } catch (error) {
        info.revert()
        this.error = 'That change was not saved.'
      }
    }
  }
}
