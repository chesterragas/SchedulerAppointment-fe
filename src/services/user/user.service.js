import { api } from '@/api/api'

export function listUsers() {
  return api.get('/api/v1/Users')
}

export function createUser(model) {
  return api.post('/api/v1/Users', model)
}

export function updateUser(id, model) {
  return api.put(`/api/v1/Users/${id}`, model)
}

export function deleteUser(id) {
  return api.delete(`/api/v1/Users/${id}`)
}
