import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import api from '@/api'

export const useBillingStore = defineStore('billing', () => {
  // ── Self-service state ────────────────────────────────────────────────────
  const subscription = ref(null)
  const plan         = ref(null)   // effective plan (subscription or default)
  const usage        = ref([])     // [{ metric, limit, used }]
  const canManage    = ref(false)
  const plans        = ref([])     // public plans (pricing)
  const invoices     = ref([])
  const loading      = ref(false)

  // ── Admin state ────────────────────────────────────────────────────────────
  const adminPlans         = ref([])
  const adminSubscriptions = ref([])

  // Feature/limit helpers other modules can consult on the client to hide UI
  // the plan doesn't allow (the server still enforces — this is cosmetic).
  const hasFeature = (key) => !!plan.value?.features?.[key]
  const limitFor   = (metric) => plan.value?.limits?.[metric]
  const usageFor   = (metric) => usage.value.find((u) => u.metric === metric) || null

  const isCanceling = computed(() => !!subscription.value?.cancelAtPeriodEnd)

  async function fetchSubscription() {
    loading.value = true
    try {
      const { data } = await api.get('/billing/subscription')
      subscription.value = data.data.subscription
      plan.value         = data.data.plan
      usage.value        = data.data.usage || []
      canManage.value    = !!data.data.canManage
    } finally {
      loading.value = false
    }
  }

  async function fetchPlans() {
    const { data } = await api.get('/billing/plans')
    plans.value = data.data.plans
    return plans.value
  }

  async function fetchInvoices() {
    const { data } = await api.get('/billing/invoices')
    invoices.value = data.data.invoices
    return invoices.value
  }

  // Returns { checkoutUrl } when a gateway redirect is required, else null.
  async function subscribe(planId) {
    const { data } = await api.post('/billing/subscribe', { planId })
    if (data.data?.checkoutUrl) return { checkoutUrl: data.data.checkoutUrl }
    await fetchSubscription()
    return null
  }

  async function cancel(immediate = false) {
    const { data } = await api.post('/billing/cancel', { immediate })
    subscription.value = data.data.subscription
    return subscription.value
  }

  // ── Admin: plans ─────────────────────────────────────────────────────────────
  async function fetchAdminPlans() {
    const { data } = await api.get('/billing/admin/plans')
    adminPlans.value = data.data.plans
    return adminPlans.value
  }

  async function getAdminPlan(id) {
    const { data } = await api.get(`/billing/admin/plans/${id}`)
    return data.data.plan
  }

  async function createPlan(payload) {
    const { data } = await api.post('/billing/admin/plans', payload)
    return data.data.plan
  }

  async function updatePlan(id, payload) {
    const { data } = await api.put(`/billing/admin/plans/${id}`, payload)
    return data.data.plan
  }

  async function deletePlan(id) {
    await api.delete(`/billing/admin/plans/${id}`)
    adminPlans.value = adminPlans.value.filter((p) => p.id !== id)
  }

  // ── Admin: subscriptions ──────────────────────────────────────────────────────
  async function fetchAdminSubscriptions() {
    const { data } = await api.get('/billing/admin/subscriptions')
    adminSubscriptions.value = data.data.subscriptions
    return adminSubscriptions.value
  }

  async function setSubscription(orgId, payload) {
    const { data } = await api.put(`/billing/admin/subscriptions/${orgId}`, payload)
    return data.data.subscription
  }

  return {
    subscription, plan, usage, canManage, plans, invoices, loading,
    adminPlans, adminSubscriptions,
    hasFeature, limitFor, usageFor, isCanceling,
    fetchSubscription, fetchPlans, fetchInvoices, subscribe, cancel,
    fetchAdminPlans, getAdminPlan, createPlan, updatePlan, deletePlan,
    fetchAdminSubscriptions, setSubscription,
  }
})
