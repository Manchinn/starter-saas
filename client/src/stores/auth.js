import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import api from '@/api'
import { disconnectSocket } from '@/api/socket'

// Tokens are stored in localStorage (persist across tabs/restarts) when the
// user checks "Remember me", otherwise in sessionStorage (cleared on tab close).
function readToken(key) {
  return localStorage.getItem(key) ?? sessionStorage.getItem(key)
}

function saveToken(key, value, persist) {
  if (persist) {
    localStorage.setItem(key, value)
    sessionStorage.removeItem(key)
  } else {
    sessionStorage.setItem(key, value)
    localStorage.removeItem(key)
  }
}

function removeToken(key) {
  localStorage.removeItem(key)
  sessionStorage.removeItem(key)
}

export const useAuthStore = defineStore('auth', () => {
  const user        = ref(null)
  const roles       = ref([])
  const permissions = ref([])
  const accessToken  = ref(readToken('accessToken'))
  const refreshToken = ref(readToken('refreshToken'))
  const locked      = ref(false) // billing-only mode (inactive subscription)

  const isAuthenticated = computed(() => !!accessToken.value && !!user.value)
  const isAdmin         = computed(() => user.value?.role === 'admin')
  const impersonating   = computed(() => !!localStorage.getItem('impersonatedFrom'))

  function hasPermission(slug) {
    if (isAdmin.value) return true
    if (permissions.value.includes('*')) return true
    return permissions.value.includes(slug)
  }

  function hasRole(slug) {
    return roles.value.some((r) => r.slug === slug)
  }

  function setTokens(access, refresh, persist = true) {
    accessToken.value  = access
    refreshToken.value = refresh
    saveToken('accessToken',  access,  persist)
    saveToken('refreshToken', refresh, persist)
  }

  function clearSession() {
    accessToken.value  = null
    refreshToken.value = null
    user.value         = null
    roles.value        = []
    permissions.value  = []
    locked.value       = false
    removeToken('accessToken')
    removeToken('refreshToken')
    disconnectSocket()
  }

  // Called by the API interceptor after a silent token refresh so the store
  // stays in sync with storage (storage is already updated by the interceptor).
  function syncTokensFromRefresh(access, refresh) {
    accessToken.value  = access
    refreshToken.value = refresh
  }

  // Enter billing-only mode mid-session when the API reports SUBSCRIPTION_INACTIVE.
  function markLocked() {
    locked.value = true
  }

  function applySession(data) {
    user.value        = data.user
    roles.value       = data.user?.roles ?? []
    permissions.value = data.permissions ?? []
    locked.value      = !!data.user?.locked
  }

  async function fetchMe() {
    const { data } = await api.get('/auth/me')
    applySession(data.data)
  }

  async function login(email, password, remember = true) {
    const { data } = await api.post('/auth/login', { email, password })
    setTokens(data.data.accessToken, data.data.refreshToken, remember)
    applySession(data.data)
  }

  async function register(name, email, password) {
    const { data } = await api.post('/auth/register', { name, email, password })
    setTokens(data.data.accessToken, data.data.refreshToken, true)
    applySession(data.data)
  }

  async function install(name, email, password) {
    const { data } = await api.post('/auth/install', { name, email, password })
    setTokens(data.data.accessToken, data.data.refreshToken, true)
    applySession(data.data)
  }

  async function logout() {
    try {
      await api.post('/auth/logout', { refreshToken: refreshToken.value })
    } finally {
      clearSession()
    }
  }

  async function changePassword(currentPassword, newPassword) {
    await api.put('/auth/change-password', { currentPassword, newPassword })
  }

  async function loginAs(targetUserId) {
    localStorage.setItem('impersonatedFrom', JSON.stringify({
      user:         user.value,
      permissions:  permissions.value,
      accessToken:  accessToken.value,
      refreshToken: refreshToken.value,
    }))
    const { data } = await api.post(`/auth/login-as/${targetUserId}`)
    setTokens(data.data.accessToken, data.data.refreshToken, true)
    applySession(data.data)
  }

  function returnToAdmin() {
    const raw = localStorage.getItem('impersonatedFrom')
    if (!raw) return
    const prev = JSON.parse(raw)
    localStorage.removeItem('impersonatedFrom')
    setTokens(prev.accessToken, prev.refreshToken, true)
    user.value        = prev.user
    roles.value       = prev.user?.roles ?? []
    permissions.value = prev.permissions ?? []
    locked.value      = false
  }

  return {
    user, roles, permissions, accessToken, locked,
    isAuthenticated, isAdmin, impersonating,
    hasPermission, hasRole,
    fetchMe, login, register, install, logout, changePassword,
    loginAs, returnToAdmin,
    clearSession, syncTokensFromRefresh, markLocked,
  }
})
