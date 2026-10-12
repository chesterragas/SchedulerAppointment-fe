import axios from 'axios'

const TOKEN_KEY = 'scheduling.token'

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE,
  timeout: 300000,
  headers: {
    'Content-Type': 'application/json'
  }
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem(TOKEN_KEY)
  if (token) {
    config.headers = config.headers || {}
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status
    const url = error.config?.url || ''
    const isLogin = url.toLowerCase().includes('/api/v1/login')
    if (status === 401 && !isLogin) {
      const hadToken = Boolean(localStorage.getItem(TOKEN_KEY))
      localStorage.removeItem(TOKEN_KEY)
      localStorage.removeItem('scheduling.username')
      localStorage.removeItem('scheduling.doctor')
      localStorage.removeItem('scheduling.admin')
      if (hadToken && !window.location.pathname.startsWith('/login')) {
        window.location.assign('/login')
      }
    }
    return Promise.reject(error)
  }
)

export default {
  api
}
