<template>
  <component :is="layout">
    <div class="space-y-6">

      <SubscriptionLockedBanner :show-action="false" />

      <!-- Header -->
      <div class="flex items-center gap-3">
        <RouterLink to="/billing" class="text-[#9BA7B0] hover:text-[#637381] transition">
          <ArrowLeftIcon class="w-5 h-5" />
        </RouterLink>
        <div>
          <h1 class="page-title">{{ t('billing.choosePlan') }}</h1>
          <p class="page-subtitle">{{ t('billing.choosePlanDesc') }}</p>
        </div>
      </div>

      <div v-if="loading" class="card p-10 flex justify-center">
        <div class="w-5 h-5 border-2 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
      </div>

      <div v-else class="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
        <div v-for="p in store.plans" :key="p.id"
             class="card p-6 flex flex-col"
             :class="isCurrent(p) ? 'ring-2 ring-primary-500' : ''">
          <div class="flex items-center justify-between">
            <h2 class="text-lg font-semibold text-slate-800">{{ p.name }}</h2>
            <span v-if="isCurrent(p)" class="badge badge-blue">{{ t('billing.current') }}</span>
          </div>
          <div class="mt-3 mb-1">
            <span class="text-3xl font-bold text-slate-900">{{ price(p.price, p.currency) }}</span>
            <span v-if="Number(p.price) > 0" class="text-sm text-slate-400">/ {{ t('billing.interval.' + p.interval) }}</span>
          </div>
          <p class="text-sm text-slate-500 min-h-[40px]">{{ p.description }}</p>

          <ul class="mt-4 space-y-2 text-sm flex-1">
            <li v-for="(val, key) in p.limits" :key="key" class="flex items-center gap-2 text-slate-600">
              <CheckIcon class="w-4 h-4 text-emerald-500 flex-shrink-0" />
              <span>{{ limitLabel(key, val) }}</span>
            </li>
            <li v-for="(on, key) in enabledFeatures(p)" :key="key" class="flex items-center gap-2 text-slate-600">
              <CheckIcon class="w-4 h-4 text-emerald-500 flex-shrink-0" />
              <span>{{ featureLabel(key) }}</span>
            </li>
          </ul>

          <button
            class="btn-primary w-full justify-center mt-6"
            :disabled="!store.canManage || isCurrent(p) || busyId === p.id"
            @click="choose(p)">
            <span v-if="busyId === p.id">{{ t('common.saving') }}</span>
            <span v-else-if="isCurrent(p)">{{ t('billing.current') }}</span>
            <span v-else>{{ p.trialDays > 0 ? t('billing.startTrial', { n: p.trialDays }) : t('billing.selectPlan') }}</span>
          </button>
        </div>
      </div>

      <div v-if="error" class="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded">
        <ExclamationCircleIcon class="w-4 h-4 flex-shrink-0" />
        {{ error }}
      </div>
    </div>
  </component>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { ArrowLeftIcon, CheckIcon, ExclamationCircleIcon } from '@heroicons/vue/24/outline'
import AppLayout from '@/layouts/AppLayout.vue'
import BillingOnlyLayout from '@/layouts/BillingOnlyLayout.vue'
import SubscriptionLockedBanner from '../components/SubscriptionLockedBanner.vue'
import { useBillingStore } from '@/stores/billing'
import { useAuthStore } from '@/stores/auth'

const { t } = useI18n()
const router = useRouter()
const store = useBillingStore()
const auth = useAuthStore()
const loading = ref(true)
const busyId = ref(null)
const error = ref('')

// Locked tenants get a minimal shell (see Billing.vue).
const layout = computed(() => (auth.locked ? BillingOnlyLayout : AppLayout))

onMounted(async () => {
  try {
    await Promise.all([store.fetchPlans(), store.fetchSubscription()])
  } finally {
    loading.value = false
  }
})

const isCurrent = (p) => store.plan?.id === p.id

const enabledFeatures = (p) =>
  Object.fromEntries(Object.entries(p.features || {}).filter(([, v]) => v))

function limitLabel(key, val) {
  const unlimited = val === -1 || val === null
  const k = `billing.metric.${key}`
  const name = t(k) === k ? key : t(k)
  return unlimited ? t('billing.unlimitedOf', { name }) : `${val} ${name}`
}

function featureLabel(key) {
  const k = `billing.feature.${key}`
  return t(k) === k ? key : t(k)
}

function price(amount, currency) {
  const n = Number(amount)
  if (n === 0) return t('billing.freePrice')
  return `${n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${currency || ''}`.trim()
}

async function choose(p) {
  error.value = ''
  busyId.value = p.id
  try {
    const res = await store.subscribe(p.id)
    if (res?.checkoutUrl) { window.location.href = res.checkoutUrl; return }
    await store.fetchSubscription()
    // If this was a locked tenant re-subscribing, the subscription is now active
    // — refresh the session to clear billing-only mode and return to the app.
    if (auth.locked) {
      await auth.fetchMe()
      if (!auth.locked) router.push(auth.user?.defaultPage || '/dashboard')
    }
  } catch (err) {
    error.value = err.response?.data?.message || t('billing.subscribeFailed')
  } finally {
    busyId.value = null
  }
}
</script>
