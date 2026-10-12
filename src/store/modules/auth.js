import { defineStore } from 'pinia'
import { login as loginRequest } from '@/services/login/login.service'

const TOKEN_KEY = 'scheduling.token'
const USERNAME_KEY = 'scheduling.username'
const DOCTOR_KEY = 'scheduling.doctor'
const ADMIN_KEY = 'scheduling.admin'

function userIdFromToken(token) {
  if (!token) {
    return ''
  }
  const segment = token.split('.')[1]
  if (!segment) {
    return ''
  }
  try {
    const padded = segment.replace(/-/g, '+').replace(/_/g, '/')
    const pad = padded.length % 4 === 0 ? '' : '='.repeat(4 - (padded.length % 4))
    const payload = JSON.parse(atob(padded + pad))
    return payload.sub || ''
  } catch (error) {
    return ''
  }
}

export const useAuthStore = defineStore('auth', {
  state: () => ({
    token: localStorage.getItem(TOKEN_KEY) || '',
    username: localStorage.getItem(USERNAME_KEY) || '',
    doctor: localStorage.getItem(DOCTOR_KEY) === 'true',
    admin: localStorage.getItem(ADMIN_KEY) === 'true'
  }),
  getters: {
    isAuthorized: (state) => Boolean(state.token),
    isDoctor: (state) => state.doctor,
    isAdmin: (state) => state.admin,
    userId: (state) => userIdFromToken(state.token)
  },
  actions: {
    async login(username, password) {
      const response = await loginRequest(username, password)
      this.token = response.data.token
      this.username = response.data.username
      this.doctor = Boolean(response.data.isDoctor)
      this.admin = Boolean(response.data.isAdmin)
      localStorage.setItem(TOKEN_KEY, this.token)
      localStorage.setItem(USERNAME_KEY, this.username)
      localStorage.setItem(DOCTOR_KEY, this.doctor ? 'true' : 'false')
      localStorage.setItem(ADMIN_KEY, this.admin ? 'true' : 'false')
    },
    applyProfile({ username, isDoctor, isAdmin }) {
      if (username) {
        this.username = username
        localStorage.setItem(USERNAME_KEY, username)
      }
      this.doctor = Boolean(isDoctor)
      this.admin = Boolean(isAdmin)
      localStorage.setItem(DOCTOR_KEY, this.doctor ? 'true' : 'false')
      localStorage.setItem(ADMIN_KEY, this.admin ? 'true' : 'false')
    },
    logout() {
      this.token = ''
      this.username = ''
      this.doctor = false
      this.admin = false
      localStorage.removeItem(TOKEN_KEY)
      localStorage.removeItem(USERNAME_KEY)
      localStorage.removeItem(DOCTOR_KEY)
      localStorage.removeItem(ADMIN_KEY)
    }
  }
})
