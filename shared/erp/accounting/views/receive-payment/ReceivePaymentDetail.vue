<template>
  <AppLayout>
    <div class="space-y-5">

      <!-- Top action bar (hidden on print) -->
      <div class="flex items-start gap-3 print:hidden">
        <RouterLink to="/erp/billing/receive-payments"
          class="mt-0.5 p-2 text-[#9BA7B0] hover:text-[#1C2434] hover:bg-white
                 border border-transparent hover:border-[#E2E8F0] transition-all flex-shrink-0">
          <ArrowLeftIcon class="w-[18px] h-[18px]" />
        </RouterLink>
        <div class="flex-1 min-w-0">
          <div class="flex items-center gap-2.5 flex-wrap">
            <h1 class="text-xl font-bold text-[#1C2434]">{{ loading ? '…' : (rp?.refNo || 'Payment') }}</h1>
            <span v-if="rp && !loading"
              class="inline-flex items-center gap-1.5 px-2.5 py-0.5 text-[11px] font-semibold capitalize"
              :class="statusBadge(rp.status)">
              <span class="w-1.5 h-1.5" :class="statusDot(rp.status)"></span>
              {{ rp.status }}
            </span>
          </div>
          <nav class="flex items-center gap-1.5 mt-1">
            <RouterLink to="/erp/billing/receive-payments" class="text-[12px] text-[#9BA7B0] hover:text-[#637381] transition-colors">
              Receive Payments
            </RouterLink>
            <ChevronRightIcon class="w-3 h-3 text-[#CBD5E1]" />
            <span class="text-[12px] text-[#637381]">{{ rp?.refNo || '…' }}</span>
          </nav>
        </div>
        <!-- Quick actions -->
        <div v-if="rp && !loading" class="flex items-center gap-2 flex-shrink-0">
          <KeyboardShortcuts :shortcuts="shortcuts" width="w-56" />
          <button @click="onPrint" type="button"
            title="Print this document (Ctrl+P)"
            class="inline-flex items-center gap-1.5 px-3 py-2 text-[12px] font-semibold
                   text-[#637381] bg-white border border-[#E2E8F0] hover:bg-[#F7F9FC] hover:text-[#1C2434] transition-colors">
            <PrinterIcon class="w-4 h-4" />
            Print
          </button>
          <button v-if="rp.status === 'draft'" v-can="'erp.accounting.delete'" @click="confirmDelete" type="button"
            class="inline-flex items-center gap-1.5 px-3 py-2 text-[12px] font-semibold
                   text-red-600 bg-white border border-red-200 hover:bg-red-50 transition-colors">
            <TrashIcon class="w-4 h-4" />
          </button>
        </div>
      </div>

      <!-- Loading -->
      <div v-if="loading" class="flex items-center justify-center py-20 print:hidden">
        <div class="w-7 h-7 border-2 border-primary-500 border-t-transparent animate-spin"></div>
      </div>

      <!-- Not found -->
      <div v-else-if="notFound"
        class="flex items-start gap-3 bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3.5 print:hidden">
        <ExclamationCircleIcon class="w-5 h-5 flex-shrink-0 mt-0.5" />
        <span>Payment not found.
          <RouterLink to="/erp/billing/receive-payments" class="underline ml-1">Back to list</RouterLink>
        </span>
      </div>

      <template v-else>
        <!-- Compact workflow strip -->
        <div class="bg-white border border-[#E2E8F0] shadow-card px-5 py-3 print:hidden">
          <div class="flex items-center gap-1 flex-wrap">
            <template v-for="(step, i) in FLOW_STEPS" :key="step.key">
              <div class="flex items-center gap-2 px-2.5 py-1"
                :class="stepChipClass(step.key)">
                <CheckIcon v-if="stepState(step.key) === 'completed'" class="w-3.5 h-3.5" />
                <span v-else-if="stepState(step.key) === 'current'" class="w-2 h-2 bg-current"></span>
                <span v-else class="text-[10px] font-bold opacity-50">{{ i + 1 }}</span>
                <span class="text-[12px] font-semibold">{{ step.label }}</span>
              </div>
              <ChevronRightIcon v-if="i < FLOW_STEPS.length - 1" class="w-3 h-3 text-[#CBD5E1] flex-shrink-0" />
            </template>
            <span v-if="isCancelled" class="ml-2 inline-flex items-center gap-1.5 px-2.5 py-1 bg-red-50 text-red-600">
              <XMarkIcon class="w-3.5 h-3.5" />
              <span class="text-[12px] font-semibold">Cancelled</span>
            </span>
          </div>
        </div>

        <!-- Printable document (extracted report view) -->
        <ReceivePaymentReport :rp="rp" />

        <!-- Status transitions (draft only) -->
        <div v-can="'erp.accounting.edit'" v-if="rp.status === 'draft'"
          class="bg-white border border-[#E2E8F0] shadow-card px-5 py-4 print:hidden
                 flex items-center justify-between flex-wrap gap-3">
          <div>
            <p class="text-[11px] font-semibold text-[#9BA7B0] uppercase tracking-wider">Next Action</p>
            <p class="text-[13px] text-[#637381] mt-0.5">Confirm this payment to mark the linked invoices as paid.</p>
          </div>
          <div class="flex items-center gap-2.5">
            <button @click="changeStatus('confirmed')" :disabled="updatingStatus"
              class="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold
                     bg-green-600 text-white hover:bg-green-700 transition-colors disabled:opacity-50">
              <ArrowPathIcon v-if="updatingStatus" class="w-4 h-4 animate-spin" />
              <template v-else>
                <BanknotesIcon class="w-4 h-4" />
                Confirm Payment
              </template>
            </button>
            <button @click="changeStatus('cancelled')" :disabled="updatingStatus"
              class="px-4 py-2 text-sm font-medium border border-red-200 text-red-600
                     hover:bg-red-50 transition-colors disabled:opacity-50">
              Cancel Payment
            </button>
          </div>
        </div>
        <p v-if="statusError" class="text-xs text-red-600 print:hidden">{{ statusError }}</p>

        <!-- Confirmed info -->
        <div v-if="rp.status === 'confirmed'"
          class="bg-white border border-[#E2E8F0] shadow-card px-5 py-4 print:hidden flex items-center gap-3">
          <div class="w-8 h-8 bg-green-50 flex items-center justify-center flex-shrink-0">
            <CheckIcon class="w-4 h-4 text-green-600" />
          </div>
          <div>
            <p class="text-[13px] font-semibold text-[#1C2434]">Payment confirmed</p>
            <p class="text-[12px] text-[#637381] mt-0.5">Linked invoices have been marked as paid.</p>
          </div>
        </div>

      </template>
    </div>
  </AppLayout>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'
import {
  ArrowLeftIcon, ChevronRightIcon, BanknotesIcon,
  CheckIcon, XMarkIcon, TrashIcon,
  ArrowPathIcon, ExclamationCircleIcon, PrinterIcon,
} from '@heroicons/vue/24/outline'
import AppLayout from '@/layouts/AppLayout.vue'
import KeyboardShortcuts from '@/components/KeyboardShortcuts.vue'
import { useDetailShortcuts } from '@/composables/useShortcuts'
import api from '@/api'
import ReceivePaymentReport from '@shared/reporting/templates/erp/receive-payment/ReceivePaymentReport.vue'

const route          = useRoute()
const router         = useRouter()
const rp             = ref(null)
const loading        = ref(true)
const notFound       = ref(false)
const updatingStatus = ref(false)
const statusError    = ref('')

const { shortcuts } = useDetailShortcuts({
  enabled: () => !loading.value && !!rp.value,
  print: onPrint,
  back:  () => router.push('/erp/billing/receive-payments'),
})

function onPrint() { window.print() }

// ── Workflow ──────────────────────────────────────────────
const FLOW_STEPS = [
  { key: 'draft',     label: 'Draft' },
  { key: 'confirmed', label: 'Confirmed' },
]
const COMPLETED_BEFORE = {
  draft:     [],
  confirmed: ['draft'],
  cancelled: [],
}
const isCancelled = computed(() => rp.value?.status === 'cancelled')

function stepState(key) {
  const cur = rp.value?.status
  if (!cur || cur === key) return cur === key ? 'current' : 'upcoming'
  return (COMPLETED_BEFORE[cur] || []).includes(key) ? 'completed' : 'upcoming'
}
function stepChipClass(key) {
  const s = stepState(key)
  if (s === 'completed') return 'bg-green-50 text-green-700'
  if (s === 'current')   return 'bg-primary-50 text-primary-700 ring-1 ring-primary-200'
  return 'bg-[#F7F9FC] text-[#9BA7B0]'
}

// ── Status badge ──────────────────────────────────────────
const STATUS_BADGE = {
  draft:     'bg-[#F1F5F9] text-[#637381]',
  confirmed: 'bg-green-50 text-green-700',
  cancelled: 'bg-red-50 text-red-600',
}
const STATUS_DOT = {
  draft:     'bg-slate-400',
  confirmed: 'bg-green-500',
  cancelled: 'bg-red-500',
}
function statusBadge(s) { return STATUS_BADGE[s] || STATUS_BADGE.draft }
function statusDot(s)   { return STATUS_DOT[s]   || STATUS_DOT.draft }

// ── Data ──────────────────────────────────────────────────
onMounted(fetchPayment)

async function fetchPayment() {
  loading.value = true
  try {
    const { data } = await api.get(`/erp/billing/receive-payments/${route.params.id}`)
    rp.value = data.data.receivePayment
  } catch {
    notFound.value = true
  } finally {
    loading.value = false
  }
}

const STATUS_ENDPOINT = { confirmed: 'confirm', cancelled: 'cancel' }

async function changeStatus(status) {
  statusError.value    = ''
  updatingStatus.value = true
  try {
    const { data } = await api.post(`/erp/billing/receive-payments/${rp.value.id}/${STATUS_ENDPOINT[status]}`)
    rp.value = data.data.receivePayment
  } catch (err) {
    statusError.value = err.response?.data?.message || 'Failed to update status'
  } finally {
    updatingStatus.value = false
  }
}

async function confirmDelete() {
  if (!confirm(`Delete payment ${rp.value.refNo}? This cannot be undone.`)) return
  try {
    await api.delete(`/erp/billing/receive-payments/${rp.value.id}`)
    router.push('/erp/billing/receive-payments')
  } catch (err) {
    statusError.value = err.response?.data?.message || 'Delete failed'
  }
}
</script>

<style>
@page {
  size: A4;
  margin: 12mm;
}
@media print {
  aside, header, nav.print\:hidden { display: none !important; }
  body { background: white !important; }
  .shadow-card { box-shadow: none !important; }
  article {
    width: 186mm !important;
    max-width: 186mm !important;
    margin: 0 auto !important;
    overflow: visible !important;
  }
  article table { table-layout: fixed; width: 100% !important; }
}
</style>
