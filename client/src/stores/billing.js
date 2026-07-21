import { ref } from 'vue'
import { defineStore } from 'pinia'
import api from '@/api'

export const useBillingStore = defineStore('billing', () => {
  const subscription = ref(null)
  const plan = ref(null)
  const usage = ref([])
  const invoices = ref([])
  const plans = ref([])
  const adminPlans = ref([])
  const subscriptions = ref([])
  const loading = ref(false)
  const canManage = ref(false)

  async function fetchSubscription() {
    loading.value = true
    try {
      const { data } = await api.get('/billing/subscription')
      subscription.value = data.data.subscription
      plan.value = data.data.plan
      usage.value = data.data.usage || []
      canManage.value = !!data.data.canManage
    } finally { loading.value = false }
  }
  async function fetchInvoices() {
    const { data } = await api.get('/billing/invoices')
    invoices.value = data.data.invoices || []
  }
  async function fetchPlans() {
    const { data } = await api.get('/billing/plans')
    plans.value = data.data.plans || []
    return plans.value
  }
  async function subscribe(planId) {
    const { data } = await api.post('/billing/subscribe', { planId })
    subscription.value = data.data.subscription
    return data.data
  }
  async function cancel(immediate = false) {
    const { data } = await api.post('/billing/cancel', { immediate })
    subscription.value = data.data.subscription
  }
  async function fetchAdminPlans() {
    const { data } = await api.get('/billing/admin/plans')
    adminPlans.value = data.data.plans || []
  }
  async function createPlan(payload) {
    const { data } = await api.post('/billing/admin/plans', payload)
    return data.data.plan
  }
  async function updatePlan(id, payload) {
    const { data } = await api.put(`/billing/admin/plans/${id}`, payload)
    return data.data.plan
  }
  async function deletePlan(id) { await api.delete(`/billing/admin/plans/${id}`) }
  async function fetchSubscriptions() {
    const { data } = await api.get('/billing/admin/subscriptions')
    subscriptions.value = data.data.subscriptions || []
  }
  async function setSubscription(organizationId, payload) {
    return api.put(`/billing/admin/subscriptions/${organizationId}`, payload)
  }

  return {
    subscription, plan, usage, invoices, plans, adminPlans, subscriptions, loading, canManage,
    fetchSubscription, fetchInvoices, fetchPlans, subscribe, cancel,
    fetchAdminPlans, createPlan, updatePlan, deletePlan,
    fetchSubscriptions, setSubscription,
  }
})
