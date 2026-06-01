import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import api from '@/api'
import { disconnectSocket } from '@/api/socket'

// Tokens are NOT kept in client-readable storage. The refresh token lives in an
// httpOnly cookie managed by the server; the access token is held only in
// memory here and re-minted from the cookie on page load (see `bootstrap`).

// One-time cleanup of tokens left in web storage by older builds.
function scrubLegacyStorage() {
  for (const k of ['accessToken', 'refreshToken', 'impersonatedFrom']) {
    localStorage.removeItem(k)
    sessionStorage.removeItem(k)
  }
}

export const useAuthStore = defineStore('auth', () => {
  const user        = ref(null)
  const roles       = ref([])
  const permissions = ref([])
  const accessToken = ref(null)        // in-memory only
  const impersonating = ref(false)

  const isAuthenticated = computed(() => !!accessToken.value && !!user.value)
  const isAdmin         = computed(() => user.value?.role === 'admin')

  function hasPermission(slug) {
    if (isAdmin.value) return true
    if (permissions.value.includes('*')) return true
    return permissions.value.includes(slug)
  }

  function hasRole(slug) {
    return roles.value.some((r) => r.slug === slug)
  }

  function setAccessToken(token) {
    accessToken.value = token
  }

  function clearSession() {
    accessToken.value  = null
    user.value         = null
    roles.value        = []
    permissions.value  = []
    impersonating.value = false
    disconnectSocket()
  }

  // Called by the API interceptor after a silent token refresh.
  function syncTokensFromRefresh(access) {
    accessToken.value = access
  }

  function applySession(data) {
    user.value        = data.user
    roles.value       = data.user?.roles ?? []
    permissions.value = data.permissions ?? []
    if (typeof data.impersonating === 'boolean') impersonating.value = data.impersonating
  }

  async function fetchMe() {
    const { data } = await api.get('/auth/me')
    applySession(data.data)
  }

  // Restore the session on app load: the httpOnly refresh cookie (if any) mints
  // a fresh access token, then we load the profile. Stays logged out on 401.
  async function bootstrap() {
    scrubLegacyStorage()
    try {
      const { data } = await api.post('/auth/refresh')
      setAccessToken(data.data.accessToken)
      await fetchMe()
    } catch {
      clearSession()
    }
  }

  async function login(email, password, remember = true) {
    const { data } = await api.post('/auth/login', { email, password, remember })
    setAccessToken(data.data.accessToken)
    applySession(data.data)
  }

  async function register(name, email, password) {
    const { data } = await api.post('/auth/register', { name, email, password })
    setAccessToken(data.data.accessToken)
    applySession(data.data)
  }

  async function install(name, email, password) {
    const { data } = await api.post('/auth/install', { name, email, password })
    setAccessToken(data.data.accessToken)
    applySession(data.data)
  }

  async function logout() {
    try {
      await api.post('/auth/logout')
    } finally {
      clearSession()
    }
  }

  async function changePassword(currentPassword, newPassword) {
    await api.put('/auth/change-password', { currentPassword, newPassword })
  }

  // Impersonation is server-side: login-as parks the admin's refresh token in a
  // separate httpOnly cookie; returnToAdmin restores it. No tokens touch JS.
  async function loginAs(targetUserId) {
    const { data } = await api.post(`/auth/login-as/${targetUserId}`)
    setAccessToken(data.data.accessToken)
    applySession(data.data)
    impersonating.value = true
  }

  async function returnToAdmin() {
    const { data } = await api.post('/auth/return')
    setAccessToken(data.data.accessToken)
    applySession(data.data)
    impersonating.value = false
  }

  return {
    user, roles, permissions, accessToken, impersonating,
    isAuthenticated, isAdmin,
    hasPermission, hasRole,
    fetchMe, bootstrap, login, register, install, logout, changePassword,
    loginAs, returnToAdmin,
    setAccessToken, clearSession, syncTokensFromRefresh,
  }
})
