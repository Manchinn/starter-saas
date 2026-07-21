<template>
  <AppLayout>
    <div class="space-y-5">
      <div class="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
        <div>
          <h1 class="page-title">{{ t('billing.planRequests') }}</h1>
          <p class="page-subtitle">{{ t('billing.planRequestsDesc') }}</p>
        </div>
        <select v-model="statusFilter" class="input w-auto py-1.5 text-sm" @change="load">
          <option value="">{{ t('billing.allStatuses') }}</option>
          <option v-for="s in STATUSES" :key="s" :value="s">{{ t('billing.requestStatus.' + s) }}</option>
        </select>
      </div>

      <div class="table-wrap">
        <table class="w-full text-sm">
          <thead class="bg-[#F7F9FC] border-b border-[#E2E8F0]">
            <tr class="text-left">
              <th class="px-5 py-3">{{ t('billing.organization') }}</th>
              <th class="px-5 py-3">{{ t('billing.requestedPlan') }}</th>
              <th class="px-5 py-3">{{ t('billing.colStatus') }}</th>
              <th class="px-5 py-3">{{ t('billing.requestedOn') }}</th>
              <th class="px-5 py-3">{{ t('billing.decided') }}</th>
              <th class="px-5 py-3 w-44 text-right">{{ t('billing.actions') }}</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-50">
            <tr v-if="loading">
              <td colspan="6" class="text-center py-14">
                <div class="inline-block w-5 h-5 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
              </td>
            </tr>
            <tr v-else-if="!store.adminPlanRequests.length">
              <td colspan="6" class="text-center py-14 text-slate-400">{{ t('billing.noRequests') }}</td>
            </tr>
            <tr
              v-for="r in store.adminPlanRequests"
              :key="r.id"
              class="hover:bg-[#F7F9FC] align-middle cursor-pointer"
              @click="goTo(r.organizationId)"
            >
              <td class="px-5 py-3">
                <div class="font-medium text-slate-800">{{ r.organization?.name || '—' }}</div>
                <div class="text-xs text-slate-400">{{ r.organization?.email }}</div>
              </td>
              <td class="px-5 py-3 text-slate-700">
                {{ r.plan?.name || '—' }}
                <span class="text-xs text-slate-400">{{ money(r.plan?.price, r.plan?.currency) }}</span>
              </td>
              <td class="px-5 py-3">
                <span :class="['badge', statusTone(r.status)]">{{ t('billing.requestStatus.' + r.status) }}</span>
              </td>
              <td class="px-5 py-3 text-slate-500">{{ formatDate(r.createdAt) }}</td>
              <td class="px-5 py-3 text-slate-500">
                <template v-if="r.decidedAt">
                  {{ formatDate(r.decidedAt) }}
                  <div v-if="r.decisionNote" class="text-xs text-slate-400 italic">{{ r.decisionNote }}</div>
                </template>
                <span v-else>—</span>
              </td>
              <td class="px-5 py-3 text-right">
                <div v-if="r.status === 'pending'" class="flex items-center justify-end gap-2" @click.stop>
                  <button
                    type="button"
                    class="px-3 py-1.5 text-xs font-medium bg-emerald-500 text-white hover:bg-emerald-600 disabled:opacity-50"
                    :disabled="busyId === r.id"
                    @click="approve(r)"
                  >
                    {{ t('billing.approve') }}
                  </button>
                  <button
                    type="button"
                    class="px-3 py-1.5 text-xs font-medium bg-white border border-red-200 text-red-600 hover:bg-red-50 disabled:opacity-50"
                    :disabled="busyId === r.id"
                    @click="reject(r)"
                  >
                    {{ t('billing.reject') }}
                  </button>
                </div>
                <span v-else class="text-xs text-slate-400">—</span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div
        v-if="error"
        class="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3"
      >
        <ExclamationCircleIcon class="w-4 h-4 flex-shrink-0" />
        {{ error }}
      </div>
    </div>
  </AppLayout>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { ExclamationCircleIcon } from '@heroicons/vue/24/outline'
import AppLayout from '@/layouts/AppLayout.vue'
import { useBillingStore } from '@/stores/billing'

const { t } = useI18n()
const router = useRouter()
const store = useBillingStore()
const loading = ref(true)
const busyId = ref(null)
const error = ref('')
const statusFilter = ref('pending')

const STATUSES = ['pending', 'approved', 'rejected', 'canceled']
const goTo = (orgId) => router.push(`/admin/billing/subscriptions/${orgId}`)

async function load() {
  loading.value = true
  error.value = ''
  try {
    await store.fetchAdminPlanRequests(statusFilter.value || undefined)
  } finally {
    loading.value = false
  }
}

onMounted(load)

const statusTone = (s) =>
  s === 'approved' ? 'badge-green' : s === 'pending' ? 'badge-amber' : 'badge-gray'

function formatDate(d) {
  return d ? new Date(d).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: '2-digit' }) : '—'
}
function money(amount, currency) {
  if (amount == null) return ''
  const n = Number(amount)
  if (n === 0) return ''
  return `· ${n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${currency || ''}`.trim()
}

async function approve(r) {
  if (!confirm(t('billing.confirmApprove', { org: r.organization?.name, plan: r.plan?.name }))) return
  busyId.value = r.id
  error.value = ''
  try {
    await store.approvePlanRequest(r.id)
    await load()
  } catch (err) {
    error.value = err.response?.data?.message || t('billing.saveFailed')
  } finally {
    busyId.value = null
  }
}

async function reject(r) {
  const note = prompt(t('billing.rejectPrompt'))
  if (note === null) return
  busyId.value = r.id
  error.value = ''
  try {
    await store.rejectPlanRequest(r.id, note)
    await load()
  } catch (err) {
    error.value = err.response?.data?.message || t('billing.saveFailed')
  } finally {
    busyId.value = null
  }
}
</script>
