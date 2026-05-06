import { defineStore } from 'pinia'
import { ref } from 'vue'
import api from '@/api'

export const useMasterDataStore = defineStore('masterData', () => {
  const categories = ref([])
  const loading    = ref(false)
  const cache      = ref({})  // slug → value[]

  async function fetchAll() {
    loading.value = true
    try {
      const { data } = await api.get('/erp/master-data/categories')
      categories.value = data.data.categories
    } finally {
      loading.value = false
    }
  }

  async function getValues(slug) {
    if (cache.value[slug]) return cache.value[slug]
    const { data } = await api.get(`/erp/master-data/${slug}`)
    const vals = (data.data.values || []).filter(v => v.isActive !== false)
    cache.value[slug] = vals
    return vals
  }

  function clearCache(slug) {
    if (slug) delete cache.value[slug]
    else cache.value = {}
  }

  async function createCategory(payload) {
    const { data } = await api.post('/erp/master-data/categories', payload)
    categories.value.push(data.data.category)
    return data.data.category
  }

  async function updateCategory(id, payload) {
    const { data } = await api.put(`/erp/master-data/categories/${id}`, payload)
    const idx = categories.value.findIndex(c => c.id === id)
    if (idx !== -1) categories.value[idx] = data.data.category
    clearCache(data.data.category?.slug)
    return data.data.category
  }

  async function deleteCategory(id) {
    await api.delete(`/erp/master-data/categories/${id}`)
    const cat = categories.value.find(c => c.id === id)
    if (cat) clearCache(cat.slug)
    categories.value = categories.value.filter(c => c.id !== id)
  }

  return { categories, loading, fetchAll, getValues, clearCache, createCategory, updateCategory, deleteCategory }
})
