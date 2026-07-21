<template>
  <AppLayout>
    <div class="space-y-6">
      <PageHeader
        :title="t('billing.editSubscription')"
        :back-to="`/admin/billing/subscriptions/${orgId}`"
      />
      <p class="text-sm text-[#637381] -mt-3">{{ t('billing.editSubscriptionDesc') }}</p>

      <LoadingSpinner v-if="loading" padding="md" />

      <form v-else class="card p-6 space-y-5 max-w-xl" @submit.prevent="save">
        <div>
          <label class="block text-sm font-medium text-slate-700 mb-1">{{ t('billing.colPlan') }}</label>
          <select v-model="form.planId" class="w-full border border-slate-300 rounded px-3 py-2 text-sm">
            <option v-for="p in store.adminPlans" :key="p.id" :value="p.id">{{ p.name }}</option>
          </select>
        </div>

        <div>
          <label class="block text-sm font-medium text-slate-700 mb-1">{{ t('billing.statusField') }}</label>
          <select v-model="form.status" class="w-full border border-slate-300 rounded px-3 py-2 text-sm">
            <option v-for="st in STATUSES" :key="st" :value="st">{{ t('billing.' + st) }}</option>
          </select>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium text-slate-700 mb-1">{{ t('billing.startsAt') }}</label>
            <input v-model="form.currentPeriodStart" type="date" class="w-full border border-slate-300 rounded px-3 py-2 text-sm" />
          </div>
          <div>
            <label class="block text-sm font-medium text-slate-700 mb-1">{{ t('billing.periodEnd') }}</label>
            <input v-model="form.currentPeriodEnd" type="date" class="w-full border border-slate-300 rounded px-3 py-2 text-sm" />
          </div>
        </div>

        <label class="flex items-center gap-2.5 text-sm text-slate-700">
          <input v-model="form.suspended" type="checkbox" class="rounded border-slate-300 text-primary-600 focus:ring-primary-500" />
          {{ t('billing.suspend') }}
        </label>

        <div v-if="error" class="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded">
          <ExclamationCircleIcon class="w-4 h-4 flex-shrink-0" />
          {{ error }}
        </div>

        <div class="flex items-center gap-3 pt-2">
          <button type="submit" class="btn-primary disabled:opacity-50" :disabled="saving">{{ t('common.save') }}</button>
          <RouterLink :to="`/admin/billing/subscriptions/${orgId}`" class="btn-secondary">{{ t('common.cancel') }}</RouterLink>
        </div>
      </form>
    </div>
  </AppLayout>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { ExclamationCircleIcon } from '@heroicons/vue/24/outline'
import AppLayout from '@/layouts/AppLayout.vue'
import PageHeader from '@/components/form/PageHeader.vue'
import LoadingSpinner from '@/components/form/LoadingSpinner.vue'
import { useBillingStore } from '@/stores/billing'

const { t } = useI18n()
const route = useRoute()
const router = useRouter()
const store = useBillingStore()

const orgId = route.params.orgId
const loading = ref(true)
const saving = ref(false)
const error = ref('')

const STATUSES = ['trialing', 'active', 'past_due', 'canceled', 'expired']
const form = reactive({ planId: '', status: 'active', suspended: false, currentPeriodStart: '', currentPeriodEnd: '' })

const toDateInput = (d) => (d ? new Date(d).toISOString().slice(0, 10) : '')

onMounted(async () => {
  try {
    const [data] = await Promise.all([store.getAdminSubscription(orgId), store.fetchAdminPlans()])
    const s = data.subscription
    if (s) {
      form.planId = s.planId
      form.status = s.status
      form.suspended = !!s.suspended
      form.currentPeriodStart = toDateInput(s.currentPeriodStart)
      form.currentPeriodEnd = toDateInput(s.currentPeriodEnd)
    }
  } finally {
    loading.value = false
  }
})

async function save() {
  saving.value = true
  error.value = ''
  try {
    await store.setSubscription(orgId, {
      planId: form.planId,
      status: form.status,
      suspended: form.suspended,
      currentPeriodStart: form.currentPeriodStart || null,
      currentPeriodEnd: form.currentPeriodEnd || null,
    })
    router.push(`/admin/billing/subscriptions/${orgId}`)
  } catch (err) {
    error.value = err.response?.data?.message || t('billing.saveFailed')
  } finally {
    saving.value = false
  }
}
</script>
