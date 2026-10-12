import { api } from '@/api/api'

export function listUnavailableDays(calendarId, start, end) {
  return api.get('/api/v1/UnavailableDays', {
    params: { calendarId, start, end }
  })
}

export function setUnavailableDay(model) {
  return api.put('/api/v1/UnavailableDays', model)
}
