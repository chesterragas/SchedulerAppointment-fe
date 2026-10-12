import { listUpcomingAppointments } from '@/services/event/event.service'

function formatWhen(appointment) {
  const [year, month, day] = (appointment.dateAppointment || '').split('-').map(Number)
  const [hour, minute] = (appointment.timeAppointment || '').split(':').map(Number)
  if (!year || !month || !day) {
    return ''
  }
  const when = new Date(year, month - 1, day, hour || 0, minute || 0)
  return when.toLocaleString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit'
  })
}

export default {
  name: 'AppointmentsView',
  data() {
    return {
      appointments: [],
      loading: true,
      error: ''
    }
  },
  async mounted() {
    await this.load()
  },
  methods: {
    formatWhen,
    async load() {
      this.loading = true
      this.error = ''
      try {
        const response = await listUpcomingAppointments()
        this.appointments = response.data || []
      } catch (error) {
        this.appointments = []
        this.error = 'Upcoming appointments could not be loaded.'
      } finally {
        this.loading = false
      }
    }
  }
}
