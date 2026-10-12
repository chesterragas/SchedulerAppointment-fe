import { api } from '@/api/api'

export function getProfile() {
  return api.get('/api/v1/Profile')
}

export function updateProfile(model) {
  return api.put('/api/v1/Profile', model)
}
