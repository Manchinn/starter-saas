<template>
  <component :is="layout">
    <main class="space-y-5">
      <SubscriptionLockedBanner :show-action="false" />

      <div
        v-if="store.request"
        class="flex items-center gap-3 px-5 py-3 bg-blue-50 border border-blue-200 text-sm text-blue-800"
      >
        <ClockIcon class="w-5 h-5 flex-shrink-0 text-blue-500" />
        {{ t('billing.requestPendingFor', { plan: store.request.plan?.name }) }}
      </div>

      <header>
        <h1 class="page-title">{{ t('billing.title') }}</h1>
        <p class="page-subtitle">{{ t('billing.subtitle') }}</p>
      </header>

      <div v-if="initialLoading" class="table-wrap p-8 text-sm text-[#637381]">Loading...</div>

      <template v-else>
        <!-- Current plan + usage -->
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <section class="table-wrap p-6 lg:col-span-2">
            <div class="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p class="text-xs font-medium uppercase text-[#637381]">{{ t('billing.currentPlan') }}</p>
                <h2 class="mt-1 text-xl font-semibold text-[#1C2434]">
                  {{ store.plan?.name || t('billing.noPlan') }}
                </h2>
                <p class="mt-1 text-sm text-[#637381]">{{ store.plan?.description }}</p>
              </div>
              <div class="text-right">
                <p class="text-xl font-semibold text-[#1C2434]">
                  {{ price(store.plan?.price, store.plan?.currency) }}
                  <span
                    v-if="Number(store.plan?.price) > 0"
                    class="text-sm font-normal text-[#637381]"
                  >
                    / {{ intervalLabel(store.plan?.interval) }}
                  </span>
                </p>
                <p class="mt-1 text-sm text-[#637381]">{{ statusLabel(store.subscription?.status) }}</p>
                <p
                  v-if="store.subscription?.currentPeriodEnd"
                  class="mt-1 text-xs text-[#9BA7B0]"
                >
                  {{ store.subscription?.cancelAtPeriodEnd ? t('billing.endsOn') : t('billing.renewsOn') }}
                  {{ formatDate(store.subscription.currentPeriodEnd) }}
                </p>
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
              type="button"
              class="mt-5 text-sm font-medium text-red-700 hover:text-red-800 disabled:opacity-50"
              :disabled="busyCancel"
              @click="onCancel"
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
                  <div
                    class="h-full transition-all"
                    :class="barTone(item)"
                    :style="{ width: `${percentage(item)}%` }"
                  />
                </div>
              </div>
            </div>
          </section>
        </div>

        <!-- Plan picker (merged from /billing/plans) -->
        <section class="space-y-4">
          <div>
            <h2 class="text-base font-semibold text-[#1C2434]">{{ t('billing.choosePlan') }}</h2>
            <p class="text-sm text-[#637381]">{{ t('billing.choosePlanDesc') }}</p>
          </div>

          <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div
              v-for="p in store.plans"
              :key="p.id"
              class="table-wrap p-6 flex flex-col"
              :class="isCurrent(p) ? 'ring-2 ring-primary-500' : ''"
            >
              <div class="flex-1">
                <div class="flex items-start justify-between gap-2">
                  <h3 class="text-lg font-semibold text-[#1C2434]">{{ p.name }}</h3>
                  <span
                    v-if="isCurrent(p)"
                    class="text-xs font-medium uppercase tracking-wide text-primary-600"
                  >
                    {{ t('billing.currentPlan') }}
                  </span>
                  <span
                    v-else-if="requestedPlanId === p.id"
                    class="text-xs font-medium uppercase tracking-wide text-amber-600"
                  >
                    {{ t('billing.requested') }}
                  </span>
                </div>
                <p class="mt-1 text-sm text-[#637381]">{{ p.description }}</p>
                <p class="mt-4 text-2xl font-semibold text-[#1C2434]">
                  {{ price(p.price, p.currency) }}
                  <span v-if="Number(p.price) > 0" class="text-sm font-normal text-[#637381]">
                    / {{ intervalLabel(p.interval) }}
                  </span>
                </p>
                <ul v-if="featureList(p).length" class="mt-4 space-y-2">
                  <li
                    v-for="(f, i) in featureList(p)"
                    :key="i"
                    class="flex items-start gap-2 text-sm text-[#374151]"
                  >
                    <CheckIcon class="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                    <span>{{ f }}</span>
                  </li>
                </ul>
              </div>
              <button
                type="button"
                class="btn-primary mt-6 w-full"
                :disabled="
                  busyId === p.id
                    || isCurrent(p)
                    || !canChoose
                    || requestedPlanId === p.id
                    || (!isCurrent(p) && planExceeded(p))
                "
                @click="choose(p)"
              >
                <span v-if="busyId === p.id">{{ t('common.saving') }}</span>
                <span v-else-if="isCurrent(p)">{{ t('billing.currentPlan') }}</span>
                <span v-else-if="requestedPlanId === p.id">{{ t('billing.requested') }}</span>
                <span v-else-if="planExceeded(p)">{{ t('billing.usageOverLimit') }}</span>
                <span v-else>{{ t('billing.requestPlan') }}</span>
              </button>
            </div>
          </div>
        </section>

        <!-- Invoice history -->
        <section class="table-wrap">
          <div class="border-b border-[#E2E8F0] px-5 py-4">
            <h2 class="text-sm font-semibold text-[#1C2434]">{{ t('billing.invoices') }}</h2>
          </div>
          <table class="w-full text-sm">
            <thead class="bg-[#F7F9FC] text-left text-[#637381]">
              <tr>
                <th class="px-5 py-3">{{ t('billing.colDate') }}</th>
                <th class="px-5 py-3">{{ t('billing.colPlan') }}</th>
                <th class="px-5 py-3 text-right">{{ t('billing.colAmount') }}</th>
                <th class="px-5 py-3">{{ t('billing.colStatus') }}</th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="!store.invoices.length">
                <td colspan="4" class="px-5 py-8 text-center text-[#637381]">{{ t('billing.noInvoices') }}</td>
              </tr>
              <tr
                v-for="invoice in store.invoices"
                :key="invoice.id"
                class="border-t border-[#E2E8F0]"
              >
                <td class="px-5 py-3 text-[#637381]">{{ formatDate(invoice.createdAt) }}</td>
                <td class="px-5 py-3">{{ invoice.plan?.name || '—' }}</td>
                <td class="px-5 py-3 text-right tabular-nums">{{ price(invoice.amount, invoice.currency) }}</td>
                <td class="px-5 py-3">{{ statusLabel(invoice.status) }}</td>
              </tr>
            </tbody>
          </table>
        </section>
      </template>

      <div
        v-if="error"
        class="flex items-start gap-2 border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
      >
        <ExclamationCircleIcon class="w-5 h-5 flex-shrink-0" />
        {{ error }}
      </div>
    </main>
  </component>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { ClockIcon, CheckIcon, ExclamationCircleIcon } from '@heroicons/vue/24/outline'
import AppLayout from '@/layouts/AppLayout.vue'
import BillingOnlyLayout from '@/layouts/BillingOnlyLayout.vue'
import SubscriptionLockedBanner from '../components/SubscriptionLockedBanner.vue'
import { useBillingStore } from '@/stores/billing'
import { useAuthStore } from '@/stores/auth'

const { t } = useI18n()
const store = useBillingStore()
const auth = useAuthStore()

const layout = computed(() => (auth.locked ? BillingOnlyLayout : AppLayout))
const canChoose = computed(() => store.canManage)
const requestedPlanId = computed(() => store.request?.planId)

// Full-page spinner only on first load — silent refresh must not flash the page.
const initialLoading = ref(true)
const busyId = ref(null)
const busyCancel = ref(false)
const error = ref('')

async function refresh({ withInvoices = false } = {}) {
  const hadRequest = !!store.request
  await store.fetchSubscription()
  if (withInvoices || (hadRequest && !store.request)) {
    await store.fetchInvoices()
  }
  // Approval lifts billing-only mode once the session re-reads lock state.
  if (hadRequest && !store.request) await auth.fetchMe()
}

function onFocusRefresh() {
  if (document.visibilityState && document.visibilityState !== 'visible') return
  refresh()
}

onMounted(async () => {
  try {
    await Promise.all([store.fetchSubscription(), store.fetchInvoices(), store.fetchPlans()])
  } finally {
    initialLoading.value = false
  }
  // Event-driven refresh (tab focus) so admin approval shows without interval polling.
  window.addEventListener('focus', onFocusRefresh)
  document.addEventListener('visibilitychange', onFocusRefresh)
})
onUnmounted(() => {
  window.removeEventListener('focus', onFocusRefresh)
  document.removeEventListener('visibilitychange', onFocusRefresh)
})

const price = (amount, currency) =>
  Number(amount || 0) === 0 ? t('billing.free') : `${Number(amount).toLocaleString()} ${currency || ''}`.trim()
const statusLabel = (status) => t(`billing.${status || 'active'}`)
const intervalLabel = (interval) => t(`billing.intervalLabels.${interval || 'month'}`)
const metricLabel = (metric) => {
  const key = `billing.metric.${metric}`
  const translated = t(key)
  return translated === key ? metric : translated
}
const percentage = (item) => (item.limit > 0 ? Math.min(100, Math.round((item.used / item.limit) * 100)) : 0)
const barTone = (item) => {
  const p = percentage(item)
  if (p >= 100) return 'bg-red-500'
  if (p >= 80) return 'bg-amber-500'
  return 'bg-primary-500'
}

function formatDate(d) {
  return d ? new Date(d).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: '2-digit' }) : '—'
}

function isCurrent(p) {
  return store.subscription?.planId === p.id && ['active', 'trialing'].includes(store.subscription?.status)
}

const usedByMetric = computed(() => Object.fromEntries((store.usage || []).map((u) => [u.metric, u.used])))
function planExceeded(p) {
  const limits = p.limits || {}
  return Object.keys(limits).some((m) => {
    const lim = limits[m]
    if (lim === -1 || lim == null) return false
    const used = usedByMetric.value[m]
    return used != null && used > Number(lim)
  })
}

function featureList(p) {
  const features = p.features
  if (!features || typeof features !== 'object') return []
  return Object.entries(features)
    .filter(([, v]) => !!v)
    .map(([k]) => k)
}

async function choose(p) {
  if (!canChoose.value || planExceeded(p)) return
  error.value = ''
  busyId.value = p.id
  try {
    await store.requestPlanChange(p.id)
  } catch (err) {
    error.value = err.response?.data?.message || t('billing.requestFailed')
  } finally {
    busyId.value = null
  }
}

async function onCancel() {
  if (!confirm(t('billing.confirmCancel'))) return
  busyCancel.value = true
  try {
    await store.cancel()
  } finally {
    busyCancel.value = false
  }
}
</script>
