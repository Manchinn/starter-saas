<template>
  <AppLayout>
    <div class="space-y-5">
      <div>
        <h1 class="page-title">{{ t('billing.adminSubscriptions') }}</h1>
        <p class="page-subtitle">{{ t('billing.adminSubscriptionsDesc') }}</p>
      </div>

      <div class="table-wrap">
        <table class="w-full text-sm">
          <thead class="bg-[#F7F9FC] border-b border-[#E2E8F0]">
            <tr class="text-left">
              <th class="th">{{ t('billing.colOrg') }}</th>
              <th class="th">{{ t('billing.colPlan') }}</th>
              <th class="th">{{ t('billing.colStatus') }}</th>
              <th class="th">{{ t('billing.renews') }}</th>
              <th class="th w-72">{{ t('billing.override') }}</th>
              <th class="th w-24 text-right">{{ t('common.actions') }}</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-50">
            <tr v-if="loading">
              <td colspan="6" class="text-center py-14">
                <div class="inline-block w-5 h-5 border-2 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
              </td>
            </tr>
            <tr v-else-if="!store.adminSubscriptions.length">
              <td colspan="6" class="text-center py-14 text-slate-400">{{ t('billing.noSubscriptions') }}</td>
            </tr>
            <tr v-for="s in store.adminSubscriptions" :key="s.id" class="hover:bg-[#F7F9FC] align-middle">
              <td class="px-5 py-3">
                <RouterLink :to="`/admin/billing/subscriptions/${s.organizationId}`" class="font-medium text-slate-800 hover:text-primary-600">
                  {{ s.organization?.name || '—' }}
                </RouterLink>
                <div class="text-xs text-slate-400">{{ s.organization?.email }}</div>
              </td>
              <td class="px-5 py-3 text-slate-600">{{ s.plan?.name || '—' }}</td>
              <td class="px-5 py-3"><span :class="['badge', statusTone(s.status)]">{{ t('billing.status.' + s.status) }}</span></td>
              <td class="px-5 py-3 text-slate-500">{{ formatDate(s.currentPeriodEnd) }}</td>
              <td class="px-5 py-3">
                <div class="flex items-center gap-2">
                  <select v-model="edits[s.organizationId].planId" class="input py-1.5 text-xs">
                    <option v-for="p in store.adminPlans" :key="p.id" :value="p.id">{{ p.name }}</option>
                  </select>
                  <select v-model="edits[s.organizationId].status" class="input py-1.5 text-xs">
                    <option v-for="st in STATUSES" :key="st" :value="st">{{ t('billing.status.' + st) }}</option>
                  </select>
                  <button @click="apply(s)" :disabled="busyId === s.organizationId"
                    class="px-3 py-1.5 text-xs font-medium bg-primary-500 text-white hover:bg-primary-700 disabled:opacity-50 rounded">
                    {{ t('billing.apply') }}
                  </button>
                </div>
              </td>
              <td class="px-5 py-3 text-right">
                <RouterLink :to="`/admin/billing/subscriptions/${s.organizationId}`"
                  class="text-primary-600 hover:text-primary-700 text-xs font-medium whitespace-nowrap">
                  {{ t('billing.manage') }} →
                </RouterLink>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div v-if="error" class="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded">
        <ExclamationCircleIcon class="w-4 h-4 flex-shrink-0" />
        {{ error }}
      </div>
    </div>
  </AppLayout>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { ExclamationCircleIcon } from '@heroicons/vue/24/outline'
import AppLayout from '@/layouts/AppLayout.vue'
import { useBillingStore } from '@/stores/billing'

const { t } = useI18n()
const store = useBillingStore()
const loading = ref(true)
const busyId = ref(null)
const error = ref('')
const edits = reactive({})

const STATUSES = ['trialing', 'active', 'past_due', 'canceled', 'expired']

onMounted(async () => {
  try {
    await Promise.all([store.fetchAdminSubscriptions(), store.fetchAdminPlans()])
    for (const s of store.adminSubscriptions) {
      edits[s.organizationId] = { planId: s.planId, status: s.status }
    }
  } finally {
    loading.value = false
  }
})

const statusTone = (s) =>
  s === 'active' || s === 'trialing' ? 'badge-green' : s === 'past_due' ? 'badge-amber' : 'badge-gray'

function formatDate(d) {
  return d ? new Date(d).toLocaleDateString() : '—'
}

async function apply(s) {
  error.value = ''
  busyId.value = s.organizationId
  try {
    const updated = await store.setSubscription(s.organizationId, edits[s.organizationId])
    const idx = store.adminSubscriptions.findIndex((x) => x.organizationId === s.organizationId)
    if (idx !== -1 && updated) store.adminSubscriptions[idx] = updated
  } catch (err) {
    error.value = err.response?.data?.message || t('billing.saveFailed')
  } finally {
    busyId.value = null
  }
}
</script>
