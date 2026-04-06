import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import api from '@/api'

export const usePermissionsStore = defineStore('permissions', () => {
  const permissions = ref([])
  const loading = ref(false)

  // Grouped by the `group` field
  const grouped = computed(() => {
    const groups = {}
    for (const p of permissions.value) {
      if (!groups[p.group]) groups[p.group] = []
      groups[p.group].push(p)
    }
    return groups
  })

  async function fetchAll() {
    loading.value = true
    try {
      const { data } = await api.get('/permissions')
      permissions.value = data.data.permissions
    } finally {
      loading.value = false
    }
  }

  async function create(payload) {
    const { data } = await api.post('/permissions', payload)
    permissions.value.push(data.data.permission)
    return data.data.permission
  }

  async function update(id, payload) {
    const { data } = await api.put(`/permissions/${id}`, payload)
    const idx = permissions.value.findIndex((p) => p.id === id)
    if (idx !== -1) permissions.value[idx] = data.data.permission
    return data.data.permission
  }

  async function remove(id) {
    await api.delete(`/permissions/${id}`)
    permissions.value = permissions.value.filter((p) => p.id !== id)
  }

  return { permissions, grouped, loading, fetchAll, create, update, remove }
})
