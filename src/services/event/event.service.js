import { api } from '@/api/api'

export function listEvents(start, end, calendarId) {
  return api.get('/api/v1/Events', {
    params: { start, end, calendarId }
  })
}

export function listUpcomingAppointments() {
  return api.get('/api/v1/Events/upcoming')
}

export function createEvent(model) {
  return api.post('/api/v1/Events', model)
}

export function updateEvent(id, model) {
  return api.put(`/api/v1/Events/${id}`, model)
}

export function deleteEvent(id) {
  return api.delete(`/api/v1/Events/${id}`)
}
