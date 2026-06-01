import { defineStore } from 'pinia'
import { ref } from 'vue'
import api from '@/api'

export const useModulesStore = defineStore('modules', () => {
  const modules = ref([])
  const userModules = ref([])
  const loading = ref(false)

  async function fetchAll() {
    loading.value = true
    try {
      const { data } = await api.get('/modules')
      modules.value = data.data.modules
    } finally {
      loading.value = false
    }
  }

  async function fetchMyModules() {
    const { data } = await api.get('/organizations/my-modules')
    userModules.value = data.data.modules
  }

  async function toggle(id) {
    const { data } = await api.patch(`/modules/${id}/toggle`)
    const idx = modules.value.findIndex((m) => m.id === id)
    if (idx !== -1) modules.value[idx] = data.data.module
    return data.data.module
  }

  async function create(payload) {
    const { data } = await api.post('/modules', payload)
    modules.value.push(data.data.module)
    return data.data.module
  }

  async function update(id, payload) {
    const { data } = await api.put(`/modules/${id}`, payload)
    const idx = modules.value.findIndex((m) => m.id === id)
    if (idx !== -1) modules.value[idx] = data.data.module
    return data.data.module
  }

  async function remove(id) {
    await api.delete(`/modules/${id}`)
    modules.value = modules.value.filter((m) => m.id !== id)
  }

  return { modules, userModules, loading, fetchAll, fetchMyModules, toggle, create, update, remove }
})
