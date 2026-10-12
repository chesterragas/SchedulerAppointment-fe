import { calendarPath } from '@/utils/calendar-link'

export function safeRedirect(value) {
  if (typeof value !== 'string' || !value.startsWith('/') || value.startsWith('//') || value.startsWith('/\\')) {
    return calendarPath()
  }
  if (value === '/login' || value.startsWith('/login?') || value.startsWith('/login/')) {
    return calendarPath()
  }
  if (value === '/calendar' || value === '/calendar/') {
    return calendarPath()
  }
  return value
}
