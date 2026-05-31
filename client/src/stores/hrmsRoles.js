import { defineStore } from 'pinia'
import { ref } from 'vue'
import api from '@/api'

// HRMS-local roles (separate from the platform-wide roles store).
export const useHrmsRolesStore = defineStore('hrmsRoles', () => {
  const roles = ref([])
  const loading = ref(false)

  async function fetchAll() {
    loading.value = true
    try {
      const { data } = await api.get('/hrms/roles')
      roles.value = data.data.roles
    } finally {
      loading.value = false
    }
  }

  async function create(payload) {
    const { data } = await api.post('/hrms/roles', payload)
    roles.value.push(data.data.role)
    return data.data.role
  }

  async function update(id, payload) {
    const { data } = await api.put(`/hrms/roles/${id}`, payload)
    const idx = roles.value.findIndex((r) => r.id === id)
    if (idx !== -1) roles.value[idx] = data.data.role
    return data.data.role
  }

  async function assignPermissions(id, permissionIds) {
    const { data } = await api.put(`/hrms/roles/${id}/permissions`, { permissionIds })
    const idx = roles.value.findIndex((r) => r.id === id)
    if (idx !== -1) roles.value[idx] = data.data.role
    return data.data.role
  }

  async function remove(id) {
    await api.delete(`/hrms/roles/${id}`)
    roles.value = roles.value.filter((r) => r.id !== id)
  }

  return { roles, loading, fetchAll, create, update, assignPermissions, remove }
})
