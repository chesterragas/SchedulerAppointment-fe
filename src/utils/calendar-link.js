const KEY = 'schedule-calendar'
const ID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export function rememberCalendar(id) {
  if (typeof id === 'string' && ID.test(id)) {
    sessionStorage.setItem(KEY, id.toLowerCase())
  }
}

export function rememberedCalendar() {
  const id = sessionStorage.getItem(KEY) || ''
  return ID.test(id) ? id : ''
}

export function calendarPath() {
  const id = rememberedCalendar()
  return id ? `/calendar/${id}` : '/calendar'
}
