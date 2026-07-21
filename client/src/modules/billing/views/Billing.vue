<template>
  <component :is="layout">
    <main class="space-y-5">
      <SubscriptionLockedBanner />

      <div
        v-if="store.request"
        class="flex items-center gap-3 px-5 py-3 bg-blue-50 border border-blue-200 text-sm text-blue-800"
      >
        <ClockIcon class="w-5 h-5 flex-shrink-0 text-blue-500" />
        {{ t('billing.requestPendingFor', { plan: store.request.plan?.name }) }}
      </div>

      <header class="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
        <div>
          <h1 class="page-title">{{ t('billing.title') }}</h1>
          <p class="page-subtitle">{{ t('billing.subtitle') }}</p>
        </div>
        <RouterLink
          v-if="store.canManage || auth.locked"
          to="/billing/plans"
          class="btn-primary"
        >
          {{ t('billing.choosePlan') }}
        </RouterLink>
      </header>

      <div v-if="store.loading" class="table-wrap p-8 text-sm text-[#637381]">Loading...</div>
      <template v-else>
        <section class="table-wrap p-6">
          <div class="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p class="text-xs font-medium uppercase text-[#637381]">{{ t('billing.currentPlan') }}</p>
              <h2 class="mt-1 text-xl font-semibold text-[#1C2434]">{{ store.plan?.name || t('billing.noPlan') }}</h2>
              <p class="mt-1 text-sm text-[#637381]">{{ store.plan?.description }}</p>
            </div>
            <div class="text-right">
              <p class="text-xl font-semibold text-[#1C2434]">{{ price(store.plan?.price, store.plan?.currency) }}</p>
              <p class="mt-1 text-sm text-[#637381]">{{ statusLabel(store.subscription?.status) }}</p>
            </div>
          </div>
          <div
            v-if="store.subscription?.cancelAtPeriodEnd"
            class="mt-5 border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800"
          >
            {{ t('billing.cancelAtPeriodEnd') }}
          </div>
          <button
            v-if="store.canManage && store.subscription && !store.subscription.cancelAtPeriodEnd && !auth.locked"
            class="mt-5 text-sm font-medium text-red-700 hover:text-red-800"
            @click="cancel"
          >
            {{ t('billing.cancelPlan') }}
          </button>
        </section>

        <section v-if="store.usage.length" class="table-wrap p-6">
          <h2 class="text-sm font-semibold text-[#1C2434]">{{ t('billing.usage') }}</h2>
          <div class="mt-4 space-y-4">
            <div v-for="item in store.usage" :key="item.metric">
              <div class="mb-1 flex justify-between text-sm">
                <span class="text-[#374151]">{{ metricLabel(item.metric) }}</span>
                <span class="tabular-nums text-[#637381]">
                  {{ item.used }}
                  <template v-if="item.limit !== null"> / {{ item.limit }}</template>
                  <template v-else> · {{ t('billing.unlimited') }}</template>
                </span>
              </div>
              <div v-if="item.limit !== null" class="h-2 overflow-hidden bg-[#E2E8F0]">
                <div class="h-full bg-primary-500" :style="{ width: `${percentage(item)}%` }" />
              </div>
            </div>
          </div>
        </section>

        <section class="table-wrap">
          <div class="border-b border-[#E2E8F0] px-5 py-4">
            <h2 class="text-sm font-semibold text-[#1C2434]">{{ t('billing.invoices') }}</h2>
          </div>
          <table class="w-full text-sm">
            <thead class="bg-[#F7F9FC] text-left text-[#637381]">
              <tr>
                <th class="px-5 py-3">{{ t('billing.plan') }}</th>
                <th class="px-5 py-3">{{ t('billing.price') }}</th>
                <th class="px-5 py-3">{{ t('billing.status') }}</th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="!store.invoices.length">
                <td colspan="3" class="px-5 py-8 text-center text-[#637381]">{{ t('billing.noInvoices') }}</td>
              </tr>
              <tr v-for="invoice in store.invoices" :key="invoice.id" class="border-t border-[#E2E8F0]">
                <td class="px-5 py-3">{{ invoice.plan?.name || '—' }}</td>
                <td class="px-5 py-3">{{ price(invoice.amount, invoice.currency) }}</td>
                <td class="px-5 py-3">{{ statusLabel(invoice.status) }}</td>
              </tr>
            </tbody>
          </table>
        </section>
      </template>
    </main>
  </component>
</template>

<script setup>
import { computed, onMounted, onUnmounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { ClockIcon } from '@heroicons/vue/24/outline'
import AppLayout from '@/layouts/AppLayout.vue'
import BillingOnlyLayout from '@/layouts/BillingOnlyLayout.vue'
import SubscriptionLockedBanner from '../components/SubscriptionLockedBanner.vue'
import { useBillingStore } from '@/stores/billing'
import { useAuthStore } from '@/stores/auth'

const { t } = useI18n()
const store = useBillingStore()
const auth = useAuthStore()

const layout = computed(() => (auth.locked ? BillingOnlyLayout : AppLayout))

// While a request is pending, poll so the page reflects the admin's decision
// (approval activates the new plan and clears the request) without a manual
// reload. Refreshing the session also lifts billing-only mode once approved.
let pollTimer = null
function stopPolling() {
  if (pollTimer) { clearInterval(pollTimer); pollTimer = null }
}
function startPolling() {
  stopPolling()
  if (store.request) pollTimer = setInterval(poll, 8000)
}
async function poll() {
  const hadRequest = !!store.request
  await store.fetchSubscription()
  if (hadRequest && !store.request) {
    stopPolling()
    await Promise.all([store.fetchInvoices(), auth.fetchMe()])
  }
}

onMounted(async () => {
  await Promise.all([store.fetchSubscription(), store.fetchInvoices()])
  startPolling()
})
onUnmounted(stopPolling)

const price = (amount, currency) =>
  Number(amount || 0) === 0 ? t('billing.free') : `${Number(amount).toLocaleString()} ${currency || ''}`.trim()
const statusLabel = (status) => t(`billing.${status || 'active'}`)
const metricLabel = (metric) => {
  const key = `billing.metric.${metric}`
  const translated = t(key)
  return translated === key ? metric : translated
}
const percentage = (item) => (item.limit > 0 ? Math.min(100, Math.round((item.used / item.limit) * 100)) : 0)
async function cancel() {
  if (confirm(t('billing.confirmCancel'))) await store.cancel()
}
</script>
