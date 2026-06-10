import axios from 'axios'
import { useAuthStore } from '@/stores/auth'

// withCredentials so the httpOnly refresh cookie rides along on /api requests.
const api = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true,
})

// Attach the in-memory access token to every request.
api.interceptors.request.use((config) => {
  let token = null
  try { token = useAuthStore().accessToken } catch {}
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// Clear the session and bounce to the login screen, stashing a one-time notice
// the login page can display (e.g. why the session ended).
function forceLogout(message) {
  try { useAuthStore().clearSession() } catch {}
  if (message) { try { sessionStorage.setItem('authNotice', message) } catch {} }
  if (!window.location.pathname.startsWith('/login')) window.location.href = '/login'
}

// Auto-refresh on 401 TOKEN_EXPIRED — the refresh token is sent automatically
// as the httpOnly cookie, so the call carries no token in the body.
let isRefreshing = false
let refreshQueue = []

api.interceptors.response.use(
  (res) => res,
  async (err) => {
    const original = err.config
    const data = err.response?.data

    // Subscription is inactive — enter billing-only mode rather than logging out,
    // so the tenant can re-subscribe. Mark the session locked and bounce any
    // non-billing page to /billing (the router guard keeps them there).
    if (err.response?.status === 403 && data?.code === 'SUBSCRIPTION_INACTIVE') {
      try { useAuthStore().markLocked() } catch {}
      const p = window.location.pathname
      if (!p.startsWith('/billing') && !p.startsWith('/login')) window.location.href = '/billing'
      return Promise.reject(err)
    }

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
        // Bare axios call (no interceptors); cookie is sent via withCredentials.
        const { data: res } = await axios.post('/api/auth/refresh', {}, { withCredentials: true })
        const accessToken = res.data.accessToken

        // Keep the Pinia store in sync so auth state stays correct.
        try { useAuthStore().syncTokensFromRefresh(accessToken) } catch {}

        refreshQueue.forEach(({ resolve }) => resolve(accessToken))
        refreshQueue = []

        original.headers.Authorization = `Bearer ${accessToken}`
        return api(original)
      } catch (refreshErr) {
        refreshQueue.forEach(({ reject }) => reject(refreshErr))
        refreshQueue = []

        // Only force-logout on an explicit 401 from the refresh endpoint (invalid/
        // expired refresh cookie). Network errors or 5xx should NOT clear the
        // session — the access token may still become valid once the server recovers.
        if (refreshErr.response?.status === 401) forceLogout()

        return Promise.reject(refreshErr)
      } finally {
        isRefreshing = false
      }
    }

    return Promise.reject(err)
  }
)

export default api
