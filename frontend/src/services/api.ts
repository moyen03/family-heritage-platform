import axios from 'axios'

const BASE_URL = '/api'

export const api = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
})

// ── Token management ─────────────────────────────────────────────────────────

let accessToken: string | null = null

export const setAccessToken = (token: string | null) => {
  accessToken = token
  if (token) {
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`
  } else {
    delete api.defaults.headers.common['Authorization']
  }
}

export const getRefreshToken = () => localStorage.getItem('refresh_token')
export const setRefreshToken = (token: string | null) => {
  if (token) localStorage.setItem('refresh_token', token)
  else localStorage.removeItem('refresh_token')
}

// ── Request interceptor: attach token ────────────────────────────────────────

api.interceptors.request.use((config) => {
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`
  }
  return config
})

// ── Response interceptor: auto-refresh on 401 ────────────────────────────────

let isRefreshing = false
let failedQueue: Array<{
  resolve: (value: string) => void
  reject: (reason: unknown) => void
}> = []

const processQueue = (error: unknown, token: string | null) => {
  failedQueue.forEach(({ resolve, reject }) => {
    if (error) reject(error)
    else resolve(token as string)
  })
  failedQueue = []
}

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config

    if (error.response?.status !== 401 || original._retry) {
      return Promise.reject(error)
    }

    if (isRefreshing) {
      return new Promise<string>((resolve, reject) => {
        failedQueue.push({ resolve, reject })
      }).then((token) => {
        original.headers.Authorization = `Bearer ${token}`
        return api(original)
      })
    }

    original._retry = true
    isRefreshing = true

    const refreshToken = getRefreshToken()
    if (!refreshToken) {
      isRefreshing = false
      return Promise.reject(error)
    }

    try {
      const { data } = await axios.post(`${BASE_URL}/auth/refresh`, {
        refresh_token: refreshToken,
      })
      setAccessToken(data.token)
      setRefreshToken(data.refresh_token)
      processQueue(null, data.token)
      original.headers.Authorization = `Bearer ${data.token}`
      return api(original)
    } catch (refreshError) {
      processQueue(refreshError, null)
      setAccessToken(null)
      setRefreshToken(null)
      window.location.href = '/login'
      return Promise.reject(refreshError)
    } finally {
      isRefreshing = false
    }
  }
)

export default api

