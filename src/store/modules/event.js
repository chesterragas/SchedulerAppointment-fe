import { defineStore } from 'pinia'
import {
  createEvent,
  deleteEvent,
  listEvents,
  updateEvent
} from '@/services/event/event.service'

export const useEventStore = defineStore('event', {
  state: () => ({
    events: [],
    loading: false,
    error: ''
  }),
  actions: {
    async load(start, end, calendarId) {
      this.loading = true
      this.error = ''
      try {
        const response = await listEvents(start, end, calendarId)
        this.events = response.data
        return this.events
      } catch (error) {
        this.error = 'Could not load appointments.'
        throw error
      } finally {
        this.loading = false
      }
    },
    async create(model) {
      const response = await createEvent(model)
      return response.data
    },
    async update(id, model) {
      const response = await updateEvent(id, model)
      return response.data
    },
    async remove(id) {
      await deleteEvent(id)
    }
  }
})
