<template>
  <AppLayout>
    <div class="space-y-6">
      <PageHeader
        :title="`${t('billing.subscriptionTitle')} — ${orgName}`"
        back-to="/admin/billing/subscriptions"
      >
        <template #badge>
          <span v-if="sub" :class="['badge', statusTone]">{{ statusLabel }}</span>
        </template>
        <template v-if="sub" #actions>
          <RouterLink :to="`/admin/billing/subscriptions/${orgId}/edit`" class="btn-secondary">
            <PencilSquareIcon class="w-4 h-4" />
            {{ t('common.edit') }}
          </RouterLink>
        </template>
      </PageHeader>
      <p v-if="sub" class="text-sm text-[#637381] -mt-3">
        {{ planName }} · {{ t('billing.createdAt') }} {{ formatDate(sub.createdAt) }}
      </p>

      <LoadingSpinner v-if="loading" padding="lg" />

      <div v-else-if="!sub" class="card p-8 text-center py-14 text-slate-400">
        {{ t('billing.notFound') }}
      </div>

      <div v-else class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div class="lg:col-span-2 space-y-6">
          <div class="card overflow-hidden">
            <div class="flex items-center justify-between px-5 py-4 border-b border-slate-100">
              <h2 class="flex items-center gap-2 font-semibold text-slate-800">
                <DocumentTextIcon class="w-5 h-5 text-slate-400" />
                {{ t('billing.subscriptionDetails') }}
              </h2>
              <span :class="['badge', statusTone]">{{ statusLabel }}</span>
            </div>

            <div class="bg-gradient-to-r from-indigo-50/60 to-transparent px-5 py-5 flex items-start justify-between">
              <div>
                <p class="text-[11px] font-semibold tracking-wide text-slate-400 uppercase">{{ t('billing.colPlan') }}</p>
                <p class="text-3xl font-bold text-slate-900 mt-1">{{ planName }}</p>
                <p class="text-sm text-slate-500 mt-0.5">{{ planPrice }}</p>
              </div>
              <div class="text-right">
                <p class="text-sm font-semibold text-emerald-600 capitalize">{{ intervalLabel }}</p>
                <p class="text-xs text-slate-400">{{ t('billing.billingCycle') }}</p>
              </div>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x divide-slate-100 border-t border-slate-100">
              <div class="flex items-center gap-3 px-5 py-4">
                <span class="grid place-items-center w-9 h-9 rounded-lg bg-emerald-50 text-emerald-600 flex-shrink-0">
                  <CalendarDaysIcon class="w-5 h-5" />
                </span>
                <div>
                  <p class="text-[11px] font-semibold tracking-wide text-slate-400 uppercase">{{ t('billing.startsAt') }}</p>
                  <p class="text-sm font-medium text-slate-800">{{ formatDate(sub.currentPeriodStart) }}</p>
                </div>
              </div>
              <div class="flex items-center gap-3 px-5 py-4">
                <span class="grid place-items-center w-9 h-9 rounded-lg bg-amber-50 text-amber-600 flex-shrink-0">
                  <CalendarDaysIcon class="w-5 h-5" />
                </span>
                <div>
                  <p class="text-[11px] font-semibold tracking-wide text-slate-400 uppercase">{{ t('billing.endsAt') }}</p>
                  <p class="text-sm font-medium text-slate-800">{{ formatDate(sub.currentPeriodEnd) }}</p>
                  <p v-if="endsRelative" class="text-xs text-slate-400">{{ endsRelative }}</p>
                </div>
              </div>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 px-5 py-4 border-t border-slate-100 bg-slate-50/50">
              <div>
                <p class="text-[11px] font-semibold tracking-wide text-slate-400 uppercase">{{ t('billing.createdAt') }}</p>
                <p class="text-sm text-slate-700 mt-0.5">{{ formatDateTime(sub.createdAt) }}</p>
              </div>
              <div>
                <p class="text-[11px] font-semibold tracking-wide text-slate-400 uppercase">{{ t('billing.updatedAt') }}</p>
                <p class="text-sm text-slate-700 mt-0.5">{{ formatDateTime(sub.updatedAt) }}</p>
              </div>
              <div>
                <p class="text-[11px] font-semibold tracking-wide text-slate-400 uppercase">{{ t('billing.daysRemaining') }}</p>
                <p class="text-sm font-medium text-slate-800 mt-0.5">
                  {{ daysRemaining === null ? '—' : t('billing.daysValue', { n: daysRemaining }) }}
                </p>
              </div>
            </div>
          </div>

          <div class="card overflow-hidden">
            <div class="flex items-center justify-between px-5 py-4 border-b border-slate-100">
              <h2 class="flex items-center gap-2 font-semibold text-slate-800">
                <ReceiptPercentIcon class="w-5 h-5 text-slate-400" />
                {{ t('billing.paymentHistory') }}
              </h2>
              <span class="text-xs text-slate-400">{{ t('billing.paymentsCount', { n: invoices.length }) }}</span>
            </div>
            <table class="w-full text-sm">
              <thead class="bg-[#F7F9FC] border-b border-[#E2E8F0]">
                <tr class="text-left">
                  <th class="px-5 py-3">{{ t('billing.colInvoice') }}</th>
                  <th class="px-5 py-3 text-right">{{ t('billing.colAmount') }}</th>
                  <th class="px-5 py-3">{{ t('billing.colGateway') }}</th>
                  <th class="px-5 py-3">{{ t('billing.colStatus') }}</th>
                  <th class="px-5 py-3">{{ t('billing.colDate') }}</th>
                  <th class="px-5 py-3 w-12"></th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-50">
                <tr v-if="!invoices.length">
                  <td colspan="6" class="text-center py-12 text-slate-400">{{ t('billing.noPayments') }}</td>
                </tr>
                <tr v-for="inv in invoices" :key="inv.id" class="hover:bg-[#F7F9FC]">
                  <td class="px-5 py-3 font-medium text-slate-800">{{ invoiceNo(inv) }}</td>
                  <td class="px-5 py-3 text-right tabular-nums text-slate-700">{{ money(inv.amount, inv.currency) }}</td>
                  <td class="px-5 py-3 text-slate-600">{{ gateway(inv.provider) }}</td>
                  <td class="px-5 py-3"><span :class="['badge', invTone(inv.status)]">{{ t('billing.invStatus.' + inv.status) }}</span></td>
                  <td class="px-5 py-3 text-slate-500">{{ formatDate(inv.createdAt) }}</td>
                  <td class="px-5 py-3 text-right">
                    <button type="button" class="p-1.5 text-slate-400 hover:text-primary-600 hover:bg-slate-100 rounded" @click="viewInvoice = inv">
                      <EyeIcon class="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div class="space-y-6">
          <div class="card p-5">
            <h2 class="flex items-center gap-2 font-semibold text-slate-800 mb-4">
              <BuildingOffice2Icon class="w-5 h-5 text-slate-400" />
              {{ t('billing.tenant') }}
            </h2>
            <div class="flex items-center gap-3">
              <span class="grid place-items-center w-11 h-11 rounded-lg bg-primary-500 text-white font-semibold flex-shrink-0">
                {{ initials }}
              </span>
              <div class="min-w-0">
                <p class="font-semibold text-slate-800 truncate">{{ orgName }}</p>
                <p v-if="org?.companyName && org.companyName !== orgName" class="text-xs text-slate-400 truncate">{{ org.companyName }}</p>
                <p class="text-xs text-slate-500 truncate">{{ org?.email }}</p>
              </div>
            </div>
            <RouterLink v-if="org" :to="`/admin/organizations/${org.id}/edit`" class="btn-secondary w-full mt-4 justify-center">
              {{ t('billing.viewTenant') }}
              <ArrowRightIcon class="w-4 h-4" />
            </RouterLink>
          </div>

          <div class="card p-5">
            <h2 class="flex items-center gap-2 font-semibold text-slate-800 mb-3">
              <TagIcon class="w-5 h-5 text-slate-400" />
              {{ t('billing.colPlan') }}
            </h2>
            <p class="text-lg font-bold text-slate-900">{{ planName }}</p>
            <p class="text-sm text-slate-500">{{ planPrice }}</p>
          </div>

          <div class="card p-5">
            <h2 class="flex items-center gap-2 font-semibold text-slate-800 mb-4">
              <BoltIcon class="w-5 h-5 text-slate-400" />
              {{ t('billing.actionsTitle') }}
            </h2>
            <div class="space-y-2.5">
              <button type="button" class="btn-secondary w-full justify-center disabled:opacity-50" :disabled="busy" @click="toggleSuspend">
                <PauseCircleIcon class="w-4 h-4" />
                {{ sub.suspended ? t('billing.resume') : t('billing.suspend') }}
              </button>
              <button
                type="button"
                class="btn-secondary w-full justify-center disabled:opacity-50"
                :disabled="busy || sub.status === 'canceled'"
                @click="cancelSub"
              >
                <XCircleIcon class="w-4 h-4" />
                {{ t('billing.cancelSubscription') }}
              </button>
              <RouterLink :to="`/admin/billing/subscriptions/${orgId}/edit`" class="btn-secondary w-full justify-center">
                <PencilSquareIcon class="w-4 h-4" />
                {{ t('billing.editSubscription') }}
              </RouterLink>
            </div>
          </div>
        </div>
      </div>

      <div v-if="error" class="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded">
        <ExclamationCircleIcon class="w-4 h-4 flex-shrink-0" />
        {{ error }}
      </div>
    </div>

    <div v-if="viewInvoice" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40" @click.self="viewInvoice = null">
      <div class="card w-full max-w-md p-6 space-y-4">
        <div class="flex items-center justify-between">
          <h3 class="font-semibold text-slate-800">{{ t('billing.invoiceDetails') }}</h3>
          <button type="button" class="p-1 text-slate-400 hover:text-slate-700" @click="viewInvoice = null">
            <XMarkIcon class="w-5 h-5" />
          </button>
        </div>
        <dl class="text-sm divide-y divide-slate-100">
          <div class="flex justify-between py-2"><dt class="text-slate-500">{{ t('billing.colInvoice') }}</dt><dd class="font-medium text-slate-800">{{ invoiceNo(viewInvoice) }}</dd></div>
          <div class="flex justify-between py-2"><dt class="text-slate-500">{{ t('billing.colAmount') }}</dt><dd class="font-medium text-slate-800 tabular-nums">{{ money(viewInvoice.amount, viewInvoice.currency) }}</dd></div>
          <div class="flex justify-between py-2"><dt class="text-slate-500">{{ t('billing.colGateway') }}</dt><dd class="text-slate-700">{{ gateway(viewInvoice.provider) }}</dd></div>
          <div class="flex justify-between py-2"><dt class="text-slate-500">{{ t('billing.colStatus') }}</dt><dd><span :class="['badge', invTone(viewInvoice.status)]">{{ t('billing.invStatus.' + viewInvoice.status) }}</span></dd></div>
          <div class="flex justify-between py-2"><dt class="text-slate-500">{{ t('billing.period') }}</dt><dd class="text-slate-700">{{ formatDate(viewInvoice.periodStart) }} – {{ formatDate(viewInvoice.periodEnd) }}</dd></div>
          <div class="flex justify-between py-2"><dt class="text-slate-500">{{ t('billing.paidAt') }}</dt><dd class="text-slate-700">{{ viewInvoice.paidAt ? formatDateTime(viewInvoice.paidAt) : '—' }}</dd></div>
        </dl>
      </div>
    </div>
  </AppLayout>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import {
  PencilSquareIcon, DocumentTextIcon, CalendarDaysIcon, ReceiptPercentIcon,
  BuildingOffice2Icon, TagIcon, BoltIcon, PauseCircleIcon, XCircleIcon,
  EyeIcon, ArrowRightIcon, XMarkIcon, ExclamationCircleIcon,
} from '@heroicons/vue/24/outline'
import AppLayout from '@/layouts/AppLayout.vue'
import PageHeader from '@/components/form/PageHeader.vue'
import LoadingSpinner from '@/components/form/LoadingSpinner.vue'
import { useBillingStore } from '@/stores/billing'

const { t } = useI18n()
const route = useRoute()
const store = useBillingStore()

const orgId = route.params.orgId
const loading = ref(true)
const busy = ref(false)
const error = ref('')
const sub = ref(null)
const invoices = ref([])
const viewInvoice = ref(null)

const org = computed(() => sub.value?.organization)
const plan = computed(() => sub.value?.plan)
const orgName = computed(() => org.value?.name || '—')
const planName = computed(() => plan.value?.name || '—')
const intervalLabel = computed(() => (plan.value ? t('billing.intervalLabels.' + plan.value.interval) : ''))
const initials = computed(() =>
  (orgName.value || '?').split(' ').filter(Boolean).slice(0, 2).map((w) => w[0]).join('').toUpperCase() || '?')

const planPrice = computed(() => {
  if (!plan.value) return ''
  const n = Number(plan.value.price)
  if (n === 0) return t('billing.freePrice')
  return `${plan.value.currency || ''} ${n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} / ${intervalLabel.value}`.trim()
})

const statusLabel = computed(() =>
  sub.value?.suspended ? t('billing.suspended') : t('billing.' + sub.value.status))
const statusTone = computed(() => {
  if (sub.value?.suspended) return 'badge-amber'
  const s = sub.value?.status
  return s === 'active' || s === 'trialing' ? 'badge-green' : s === 'past_due' ? 'badge-amber' : 'badge-gray'
})

const daysRemaining = computed(() => {
  if (!sub.value?.currentPeriodEnd) return null
  const ms = new Date(sub.value.currentPeriodEnd) - new Date()
  return Math.max(0, Math.ceil(ms / 86400000))
})
const endsRelative = computed(() => {
  const d = daysRemaining.value
  if (d === null || d <= 0) return ''
  const months = Math.round(d / 30)
  const txt = months >= 1 ? `${months} ${months === 1 ? 'month' : 'months'}` : `${d} ${d === 1 ? 'day' : 'days'}`
  return t('billing.fromNow', { t: txt })
})

function formatDate(d) { return d ? new Date(d).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: '2-digit' }) : '—' }
function formatDateTime(d) { return d ? new Date(d).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' }) : '—' }
function money(amount, currency) {
  return `${Number(amount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${currency || ''}`.trim()
}
function invoiceNo(inv) { return inv.number || `#${String(inv.id).slice(0, 8).toUpperCase()}` }
function gateway(p) { return p ? p.charAt(0).toUpperCase() + p.slice(1) : '—' }
function invTone(s) { return s === 'paid' ? 'badge-green' : s === 'open' ? 'badge-amber' : 'badge-gray' }

async function load() {
  loading.value = true
  error.value = ''
  try {
    const data = await store.getAdminSubscription(orgId)
    sub.value = data.subscription
    invoices.value = data.invoices || []
  } catch (err) {
    if (err.response?.status !== 404) error.value = err.response?.data?.message || t('billing.saveFailed')
  } finally {
    loading.value = false
  }
}

async function toggleSuspend() {
  const next = !sub.value.suspended
  if (!confirm(next ? t('billing.confirmSuspend') : t('billing.confirmResume'))) return
  busy.value = true
  error.value = ''
  try {
    const updated = await store.suspendSubscription(orgId, next)
    sub.value = { ...sub.value, ...updated, organization: sub.value.organization, plan: updated.plan || sub.value.plan }
  } catch (err) {
    error.value = err.response?.data?.message || t('billing.saveFailed')
  } finally {
    busy.value = false
  }
}

async function cancelSub() {
  if (!confirm(t('billing.confirmCancelAdmin'))) return
  busy.value = true
  error.value = ''
  try {
    const updated = await store.cancelSubscription(orgId, true)
    sub.value = { ...sub.value, ...updated, organization: sub.value.organization, plan: updated.plan || sub.value.plan }
  } catch (err) {
    error.value = err.response?.data?.message || t('billing.saveFailed')
  } finally {
    busy.value = false
  }
}

onMounted(load)
</script>
