import { api } from '@/api/api'

export function listCalendars() {
  return api.get('/api/v1/Calendars')
}
