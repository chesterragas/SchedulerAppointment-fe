import { calendarPath } from '@/utils/calendar-link'

export function safeRedirect(value) {
  if (typeof value !== 'string' || !value.startsWith('/') || value.startsWith('//') || value.startsWith('/\\')) {
    return calendarPath()
  }
  if (value === '/login' || value.startsWith('/login?') || value.startsWith('/login/')) {
    return calendarPath()
  }
  if (value === '/signup' || value.startsWith('/signup?') || value.startsWith('/signup/')) {
    return calendarPath()
  }
  if (value === '/calendar' || value === '/calendar/') {
    return calendarPath()
  }
  return value
}

export function signedInLanding(isDoctor, requested) {
  const redirect = safeRedirect(requested)
  if (isDoctor && redirect.startsWith('/calendar')) {
    return { name: 'calendar' }
  }
  if (!isDoctor) {
    if (typeof requested === 'string' && /^\/calendar\/[^/]+/.test(requested)) {
      return requested
    }
    if (typeof requested === 'string' && requested.startsWith('/') && !requested.startsWith('/calendar')) {
      return redirect
    }
    return { name: 'appointments' }
  }
  return redirect
}
