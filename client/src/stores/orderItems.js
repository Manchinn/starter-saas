import { defineStore } from 'pinia'
import { ref } from 'vue'
import api from '@/api'

export const useOrderItemsStore = defineStore('orderItems', () => {
  const orderItems = ref([])
  const total = ref(0)
  const loading = ref(false)
  const masterItems = ref([])
  const orders = ref([])

  async function fetchMasterItems() {
    const { data } = await api.get('/order-items/items-lookup')
    masterItems.value = data.data.items
  }

  async function fetchOrders() {
    const { data } = await api.get('/erp/orders', { params: { limit: 200 } })
    orders.value = data.data.orders
  }

  async function fetchAll({ page = 1, limit = 20, search = '', orderId = '' } = {}) {
    loading.value = true
    try {
      const { data } = await api.get('/order-items', { params: { page, limit, search, orderId } })
      orderItems.value = data.data.orderItems
      total.value = data.data.total
    } finally {
      loading.value = false
    }
  }

  async function create(payload) {
    const { data } = await api.post('/order-items', payload)
    orderItems.value.unshift(data.data.orderItem)
    total.value++
    return data.data.orderItem
  }

  async function update(id, payload) {
    const { data } = await api.put(`/order-items/${id}`, payload)
    const idx = orderItems.value.findIndex((i) => i.id === id)
    if (idx !== -1) orderItems.value[idx] = data.data.orderItem
    return data.data.orderItem
  }

  async function remove(id) {
    await api.delete(`/order-items/${id}`)
    orderItems.value = orderItems.value.filter((i) => i.id !== id)
    total.value--
  }

  return { orderItems, total, loading, masterItems, orders, fetchMasterItems, fetchOrders, fetchAll, create, update, remove }
})
