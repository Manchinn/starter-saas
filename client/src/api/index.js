import axios from 'axios'
import { useAuthStore } from '@/stores/auth'

const api = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
})

// Helpers — mirror the store's storage strategy (localStorage vs sessionStorage)
function getToken(key) {
  return localStorage.getItem(key) ?? sessionStorage.getItem(key)
}

function setToken(key, value) {
  // Preserve whichever storage was originally used
  if (localStorage.getItem(key) !== null) {
    localStorage.setItem(key, value)
  } else {
    sessionStorage.setItem(key, value)
  }
}

function removeTokens() {
  ['accessToken', 'refreshToken'].forEach((k) => {
    localStorage.removeItem(k)
    sessionStorage.removeItem(k)
  })
}

// Attach access token to every request
api.interceptors.request.use((config) => {
  const token = getToken('accessToken')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// Auto-refresh on 401 TOKEN_EXPIRED
let isRefreshing = false
let refreshQueue = []

api.interceptors.response.use(
  (res) => res,
  async (err) => {
    const original = err.config
    const data = err.response?.data

    if (err.response?.status === 401 && data?.code === 'TOKEN_EXPIRED' && !original._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          refreshQueue.push({ resolve, reject })
        }).then((token) => {
          original.headers.Authorization = `Bearer ${token}`
          return api(original)
        })
      }

      original._retry = true
      isRefreshing = true

      try {
        const refreshToken = getToken('refreshToken')
        const { data: res } = await axios.post('/api/auth/refresh', { refreshToken })
        const { accessToken, refreshToken: newRefresh } = res.data

        setToken('accessToken', accessToken)
        setToken('refreshToken', newRefresh)

        // Keep Pinia store in sync so auth state (isAuthenticated, logout) stays correct
        try { useAuthStore().syncTokensFromRefresh(accessToken, newRefresh) } catch {}

        refreshQueue.forEach(({ resolve }) => resolve(accessToken))
        refreshQueue = []

        original.headers.Authorization = `Bearer ${accessToken}`
        return api(original)
      } catch (refreshErr) {
        refreshQueue.forEach(({ reject }) => reject(refreshErr))
        refreshQueue = []

        // Only force-logout on an explicit 401 from the refresh endpoint (invalid/expired
        // refresh token). Network errors or 5xx responses should NOT clear the session —
        // the access token may still become valid once the server recovers.
        if (refreshErr.response?.status === 401) {
          removeTokens()
          try { useAuthStore().clearSession() } catch {}
          window.location.href = '/login'
        }

        return Promise.reject(refreshErr)
      } finally {
        isRefreshing = false
      }
    }

    return Promise.reject(err)
  }
)

export default api
