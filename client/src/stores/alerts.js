import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import api from '@/api'
import { connectSocket, disconnectSocket, getSocket } from '@/api/socket'

export const useAlertsStore = defineStore('alerts', () => {
  const alerts  = ref([])
  const unread  = ref(0)
  const loading = ref(false)

  const hasUnread = computed(() => unread.value > 0)

  async function fetch() {
    loading.value = true
    try {
      const { data } = await api.get('/erp/alerts/feed', { params: { limit: 50 } })
      alerts.value = data.data.alerts
      unread.value = data.data.unread
    } catch {
      // A failed feed load shouldn't crash the bell (start() fires this unawaited).
      alerts.value = []
      unread.value = 0
    } finally {
      loading.value = false
    }
  }

  async function markRead(id) {
    const a = alerts.value.find((x) => x.id === id)
    if (!a || a.isRead) return
    a.isRead = true
    unread.value = Math.max(0, unread.value - 1)
    try {
      await api.post(`/erp/alerts/${id}/read`)
    } catch {
      // Roll back optimistic update on failure.
      a.isRead = false
      unread.value += 1
    }
  }

  async function markAllRead() {
    alerts.value.forEach((a) => { a.isRead = true })
    unread.value = 0
    await api.post('/erp/alerts/read-all')
  }

  async function remove(id) {
    await api.delete(`/erp/alerts/${id}`)
    await fetch()
  }

  // Debounce realtime refreshes so a burst of events triggers one fetch.
  let refreshTimer = null
  function scheduleRefresh() {
    clearTimeout(refreshTimer)
    refreshTimer = setTimeout(fetch, 200)
  }

  // Idempotent & self-healing: ensures the socket is connected and the handler
  // is attached, then refreshes. Safe to call on every bell (re)mount — each
  // page renders its own layout, so the bell mounts repeatedly during a session.
  function start() {
    const s = connectSocket()
    s.off('alerts:changed')
    s.on('alerts:changed', scheduleRefresh)
    fetch()
  }

  function stop() {
    const s = getSocket()
    s.off('alerts:changed')
    disconnectSocket()
    alerts.value = []
    unread.value = 0
  }

  return { alerts, unread, loading, hasUnread, fetch, markRead, markAllRead, remove, start, stop }
})
