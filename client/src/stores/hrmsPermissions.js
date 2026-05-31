import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import api from '@/api'

// Read-only HRMS permission catalog (ERP / Reporting / AI Assistant / HRMS).
export const useHrmsPermissionsStore = defineStore('hrmsPermissions', () => {
  const permissions = ref([])
  const loading = ref(false)

  // Grouped by the `group` field, preserving the API's group ordering.
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
      const { data } = await api.get('/hrms/permissions')
      permissions.value = data.data.permissions
    } finally {
      loading.value = false
    }
  }

  return { permissions, grouped, loading, fetchAll }
})
