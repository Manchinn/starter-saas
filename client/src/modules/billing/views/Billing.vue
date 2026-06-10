<template>
  <component :is="layout">
    <div class="space-y-5">

      <SubscriptionLockedBanner />

      <!-- Pending plan request -->
      <div v-if="store.request"
        class="flex items-center gap-3 px-5 py-3 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-800">
        <ClockIcon class="w-5 h-5 flex-shrink-0 text-blue-500" />
        {{ t('billing.requestPendingFor', { plan: store.request.plan?.name }) }}
      </div>

      <!-- Header -->
      <div class="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
        <div>
          <h1 class="page-title">{{ t('billing.title') }}</h1>
          <p class="page-subtitle">{{ t('billing.subtitle') }}</p>
        </div>
        <RouterLink v-if="store.canManage" to="/billing/plans" class="btn-primary">
          <ArrowUpCircleIcon class="w-4 h-4" />
          {{ t('billing.changePlan') }}
        </RouterLink>
      </div>

      <div v-if="store.loading" class="card p-10 flex justify-center">
        <div class="w-5 h-5 border-2 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
      </div>

      <template v-else>
        <!-- Current plan -->
        <div class="card p-6">
          <div class="flex flex-wrap items-start justify-between gap-4">
            <div>
              <div class="flex items-center gap-2">
                <h2 class="text-lg font-semibold text-slate-800">{{ store.plan?.name || '—' }}</h2>
                <span :class="['badge', statusTone]">{{ t('billing.status.' + (store.subscription?.status || 'none')) }}</span>
              </div>
              <p class="text-sm text-slate-500 mt-1">{{ store.plan?.description }}</p>
            </div>
            <div class="text-right">
              <div class="text-2xl font-semibold text-slate-800">
                {{ price(store.plan?.price, store.plan?.currency) }}
                <span v-if="Number(store.plan?.price) > 0" class="text-sm font-normal text-slate-400">/ {{ t('billing.interval.' + (store.plan?.interval || 'month')) }}</span>
              </div>
              <p v-if="store.subscription?.currentPeriodEnd" class="text-xs text-slate-400 mt-1">
                {{ store.isCanceling ? t('billing.endsOn') : t('billing.renewsOn') }}
                {{ formatDate(store.subscription.currentPeriodEnd) }}
              </p>
            </div>
          </div>

          <div v-if="store.isCanceling" class="mt-4 flex items-center gap-2 bg-amber-50 border border-amber-200 text-amber-800 text-sm px-4 py-3 rounded">
            <ExclamationTriangleIcon class="w-4 h-4 flex-shrink-0" />
            {{ t('billing.cancelNotice') }}
          </div>

          <div v-if="store.canManage && store.subscription && !store.isCanceling && Number(store.plan?.price) > 0" class="mt-5">
            <button @click="onCancel" :disabled="busy" class="text-sm text-red-600 hover:text-red-700 font-medium disabled:opacity-50">
              {{ t('billing.cancelPlan') }}
            </button>
          </div>
        </div>

        <!-- Usage vs limits -->
        <div v-if="store.usage.length" class="card p-6">
          <h2 class="text-sm font-semibold text-slate-700 mb-4">{{ t('billing.usage') }}</h2>
          <div class="space-y-4">
            <div v-for="u in store.usage" :key="u.metric">
              <div class="flex justify-between text-sm mb-1">
                <span class="text-slate-600">{{ metricLabel(u.metric) }}</span>
                <span class="text-slate-500 tabular-nums">
                  {{ u.used }}<template v-if="u.limit !== null"> / {{ u.limit }}</template>
                  <span v-else class="text-emerald-600">· {{ t('billing.unlimited') }}</span>
                </span>
              </div>
              <div v-if="u.limit !== null" class="h-2 bg-slate-100 rounded-full overflow-hidden">
                <div class="h-full rounded-full transition-all"
                     :class="barTone(u)"
                     :style="{ width: pct(u) + '%' }"></div>
              </div>
            </div>
          </div>
        </div>

        <!-- Invoice history -->
        <div class="table-wrap">
          <div class="px-5 py-3 border-b border-[#E2E8F0]">
            <h2 class="text-sm font-semibold text-slate-700">{{ t('billing.invoices') }}</h2>
          </div>
          <table class="w-full text-sm">
            <thead class="bg-[#F7F9FC] border-b border-[#E2E8F0]">
              <tr class="text-left">
                <th class="th">{{ t('billing.colDate') }}</th>
                <th class="th">{{ t('billing.colPlan') }}</th>
                <th class="th text-right">{{ t('billing.colAmount') }}</th>
                <th class="th">{{ t('billing.colStatus') }}</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-50">
              <tr v-if="!store.invoices.length">
                <td colspan="4" class="text-center py-10 text-slate-400">{{ t('billing.noInvoices') }}</td>
              </tr>
              <tr v-for="inv in store.invoices" :key="inv.id" class="hover:bg-[#F7F9FC]">
                <td class="px-5 py-3 text-slate-600">{{ formatDate(inv.createdAt) }}</td>
                <td class="px-5 py-3 text-slate-600">{{ inv.plan?.name || '—' }}</td>
                <td class="px-5 py-3 text-right tabular-nums text-slate-700">{{ price(inv.amount, inv.currency) }}</td>
                <td class="px-5 py-3"><span :class="['badge', invoiceTone(inv.status)]">{{ t('billing.invStatus.' + inv.status) }}</span></td>
              </tr>
            </tbody>
          </table>
        </div>
      </template>
    </div>
  </component>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { ArrowUpCircleIcon, ExclamationTriangleIcon, ClockIcon } from '@heroicons/vue/24/outline'
import AppLayout from '@/layouts/AppLayout.vue'
import BillingOnlyLayout from '@/layouts/BillingOnlyLayout.vue'
import SubscriptionLockedBanner from '../components/SubscriptionLockedBanner.vue'
import { useBillingStore } from '@/stores/billing'
import { useAuthStore } from '@/stores/auth'

const { t } = useI18n()
const store = useBillingStore()
const auth = useAuthStore()
const busy = ref(false)

// Locked tenants get a minimal shell (no module nav / alerts) so it doesn't
// fire the API calls that billing-only mode blocks.
const layout = computed(() => (auth.locked ? BillingOnlyLayout : AppLayout))

onMounted(async () => {
  await store.fetchSubscription()
  await store.fetchInvoices()
})

const statusTone = computed(() => {
  const s = store.subscription?.status
  if (s === 'active' || s === 'trialing') return 'badge-green'
  if (s === 'past_due') return 'badge-amber'
  if (s === 'canceled' || s === 'expired') return 'badge-gray'
  return 'badge-gray'
})

const invoiceTone = (s) => (s === 'paid' ? 'badge-green' : s === 'void' ? 'badge-gray' : 'badge-amber')

const pct = (u) => (u.limit > 0 ? Math.min(100, Math.round((u.used / u.limit) * 100)) : 0)
const barTone = (u) => {
  const p = pct(u)
  if (p >= 100) return 'bg-red-500'
  if (p >= 80) return 'bg-amber-500'
  return 'bg-primary-500'
}

function metricLabel(metric) {
  const key = `billing.metric.${metric}`
  const translated = t(key)
  return translated === key ? metric : translated
}

function price(amount, currency) {
  if (amount == null) return '—'
  const n = Number(amount)
  if (n === 0) return t('billing.freePrice')
  return `${n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${currency || ''}`.trim()
}

function formatDate(d) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString()
}

async function onCancel() {
  if (!confirm(t('billing.confirmCancel'))) return
  busy.value = true
  try { await store.cancel(false) } finally { busy.value = false }
}
</script>
