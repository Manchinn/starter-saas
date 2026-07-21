<template>
  <component :is="layout">
    <div class="space-y-6">
      <SubscriptionLockedBanner :show-action="false" />

      <div class="flex items-center gap-3">
        <RouterLink to="/billing" class="text-[#9BA7B0] hover:text-[#637381] transition">
          <ArrowLeftIcon class="w-5 h-5" />
        </RouterLink>
        <div>
          <h1 class="page-title">{{ t('billing.plans') }}</h1>
          <p class="page-subtitle">{{ t('billing.choosePlanDesc') }}</p>
        </div>
      </div>

      <div v-if="loading" class="table-wrap p-8 text-sm text-[#637381]">Loading...</div>
      <div v-else class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div
          v-for="p in store.plans"
          :key="p.id"
          class="table-wrap p-6 flex flex-col"
          :class="isCurrent(p) ? 'ring-2 ring-primary-500' : ''"
        >
          <div class="flex-1">
            <div class="flex items-start justify-between gap-2">
              <h2 class="text-lg font-semibold text-[#1C2434]">{{ p.name }}</h2>
              <span
                v-if="isCurrent(p)"
                class="text-xs font-medium uppercase tracking-wide text-primary-600"
              >
                {{ t('billing.currentPlan') }}
              </span>
            </div>
            <p class="mt-1 text-sm text-[#637381]">{{ p.description }}</p>
            <p class="mt-4 text-2xl font-semibold text-[#1C2434]">
              {{ price(p.price, p.currency) }}
              <span v-if="Number(p.price) > 0" class="text-sm font-normal text-[#637381]">
                / {{ p.interval === 'year' ? t('billing.yearly') : t('billing.monthly') }}
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
            :disabled="busyId === p.id || isCurrent(p) || !canChoose"
            @click="choose(p)"
          >
            {{ isCurrent(p) ? t('billing.currentPlan') : t('billing.choosePlan') }}
          </button>
        </div>
      </div>

      <div
        v-if="error"
        class="flex items-start gap-2 border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
      >
        <ExclamationCircleIcon class="w-5 h-5 flex-shrink-0" />
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

const layout = computed(() => (auth.locked ? BillingOnlyLayout : AppLayout))
// Org owners manage plans (canManage). Locked staff see the catalog but only
// the owner can re-subscribe via POST /billing/subscribe.
const canChoose = computed(() => store.canManage)

onMounted(async () => {
  try {
    await Promise.all([store.fetchPlans(), store.fetchSubscription()])
  } finally {
    loading.value = false
  }
})

const price = (amount, currency) =>
  Number(amount || 0) === 0 ? t('billing.free') : `${Number(amount).toLocaleString()} ${currency || ''}`.trim()

function isCurrent(p) {
  return store.subscription?.planId === p.id && ['active', 'trialing'].includes(store.subscription?.status)
}

function featureList(p) {
  const features = p.features
  if (!features || typeof features !== 'object') return []
  return Object.entries(features)
    .filter(([, v]) => !!v)
    .map(([k]) => k)
}

async function choose(p) {
  if (!canChoose.value) return
  error.value = ''
  busyId.value = p.id
  try {
    await store.subscribe(p.id)
    await store.fetchSubscription()
    // Locked tenant re-subscribed — refresh session to clear billing-only mode.
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
