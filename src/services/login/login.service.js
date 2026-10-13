import { api } from '@/api/api'

export function login(username, password) {
  return api.post('/api/v1/Login', { username, password })
}

export function signup(model) {
  return api.post('/api/v1/Signup', model)
}
