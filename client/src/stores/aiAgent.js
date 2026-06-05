import { defineStore } from 'pinia'
import { ref } from 'vue'
import api from '@/api'
import router from '@/router'

export const useAiAgentStore = defineStore('aiAgent', () => {
  const settings      = ref(null)
  const conversations = ref([])
  const messages      = ref([])           // current thread
  const conversationId = ref(null)
  const loading       = ref(false)        // sending a message
  const loadingThread = ref(false)

  // ── Settings ────────────────────────────────────────────────────────────────
  async function loadSettings() {
    const { data } = await api.get('/ai-agent/settings')
    settings.value = data.data
    return settings.value
  }

  async function saveSettings(patch) {
    const { data } = await api.put('/ai-agent/settings', patch)
    settings.value = data.data
    return settings.value
  }

  async function testConnection({ provider, baseUrl, apiKey } = {}) {
    const { data } = await api.get('/ai-agent/settings/models', { params: { provider, baseUrl, apiKey } })
    return data.data.models || []
  }

  // ── Dashboard ─────────────────────────────────────────────────────────────────
  async function loadTokenStats() {
    const { data } = await api.get('/ai-agent/stats/tokens')
    return data.data
  }

  // ── Conversations ─────────────────────────────────────────────────────────────
  async function loadConversations() {
    const { data } = await api.get('/ai-agent/chat/conversations')
    conversations.value = data.data
  }

  async function openConversation(id) {
    loadingThread.value = true
    try {
      const { data } = await api.get(`/ai-agent/chat/conversations/${id}`)
      conversationId.value = data.data.id
      messages.value = data.data.messages
    } finally {
      loadingThread.value = false
    }
  }

  function newConversation() {
    conversationId.value = null
    messages.value = []
  }

  async function removeConversation(id) {
    await api.delete(`/ai-agent/chat/conversations/${id}`)
    conversations.value = conversations.value.filter((c) => c.id !== id)
    if (conversationId.value === id) newConversation()
  }

  async function clearAllConversations() {
    await api.delete('/ai-agent/chat/conversations')
    conversations.value = []
    newConversation()
  }

  // Run client-side actions returned by the agent (e.g. SPA navigation).
  function applyActions(actions = []) {
    for (const a of actions) {
      if (a.type === 'navigate' && a.path) router.push(a.path).catch(() => {})
    }
  }

  // ── Chat ────────────────────────────────────────────────────────────────────
  async function send(content) {
    const text = (content || '').trim()
    if (!text || loading.value) return

    // Optimistic user bubble.
    messages.value.push({ id: `tmp-${Date.now()}`, role: 'user', content: text, actions: [] })
    loading.value = true
    try {
      const { data } = await api.post('/ai-agent/chat', {
        conversationId: conversationId.value,
        content: text,
        // Reply in the user's selected UI language (persisted by the app /
        // language switcher); defaults to English.
        lang: localStorage.getItem('app-lang') || 'en',
      })
      const res = data.data
      const isNew = !conversationId.value
      conversationId.value = res.conversationId
      messages.value.push(res.message)
      // Auto-run returned actions only when the user opted in. The chat UIs
      // always render the actions as clickable chips, so when autoAction is
      // off the user can still trigger them manually. Settings may not be
      // loaded yet in the chat/panel context, so fetch them once on demand;
      // a missing/unknown flag defaults to auto-running (preserves prior UX).
      if (settings.value === null) { try { await loadSettings() } catch { /* keep default */ } }
      if (settings.value?.autoAction !== false) applyActions(res.message.actions)
      // Refresh the sidebar list (title may have been set / order changed).
      if (isNew) await loadConversations()
      else {
        const c = conversations.value.find((x) => x.id === res.conversationId)
        if (c) c.title = res.title
      }
      return res
    } finally {
      loading.value = false
    }
  }

  return {
    settings, conversations, messages, conversationId, loading, loadingThread,
    loadSettings, saveSettings, testConnection,
    loadTokenStats,
    loadConversations, openConversation, newConversation, removeConversation, clearAllConversations,
    send,
  }
})
