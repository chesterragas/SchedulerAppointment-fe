import { api } from '@/api/api'

export function login(username, password) {
  return api.post('/api/v1/Login', { username, password })
}
