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
          <KeyboardShortcuts :shortcuts="pageShortcuts" width="w-56" />
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

        <!-- ── Document ─────────────────────────────────────────── -->
        <article class="relative mx-auto bg-white border border-[#E2E8F0] shadow-card max-w-[860px] w-full
                        print:border-0 print:shadow-none print:max-w-none print:mx-0 print:
                        overflow-hidden">

          <!-- DRAFT / CANCELLED stamp -->
          <div v-if="stampLabel"
            class="pointer-events-none absolute inset-0 flex items-center justify-center z-10"
            aria-hidden="true">
            <span class="select-none font-black tracking-[0.2em] uppercase border-[6px] px-6 py-2
                         text-[64px] sm:text-[88px] -rotate-[18deg] opacity-[0.12]"
              :class="stampClass">
              {{ stampLabel }}
            </span>
          </div>

          <!-- Document header -->
          <header class="px-10 pt-10 pb-6 flex items-start justify-between gap-8 border-b border-dashed border-[#E2E8F0]">
            <div class="flex-1 min-w-0 flex items-start gap-4">
              <img v-if="companyLogoSrc" :src="companyLogoSrc" :alt="companyName"
                class="max-h-16 max-w-[160px] object-contain flex-shrink-0" />
              <div class="min-w-0">
                <p class="text-[20px] font-bold text-[#1C2434] tracking-tight">{{ companyName }}</p>
                <p v-if="companyAddress" class="text-[11px] text-[#637381] mt-1 whitespace-pre-line leading-snug">
                  {{ companyAddress }}
                </p>
                <div class="text-[11px] text-[#637381] mt-1 space-y-0.5">
                  <p v-if="companyPhone">Tel: {{ companyPhone }}</p>
                  <p v-if="companyEmail">{{ companyEmail }}</p>
                  <p v-if="companyWebsite">{{ companyWebsite }}</p>
                  <p v-if="companyTaxId" class="tabular-nums">
                    <span class="text-[#9BA7B0]">Tax ID:</span> {{ companyTaxId }}
                  </p>
                </div>
              </div>
            </div>
            <div class="text-right flex-shrink-0">
              <h2 class="text-[26px] font-extrabold tracking-[0.18em] text-[#1C2434] uppercase">
                Payment Receipt
              </h2>
              <dl class="mt-3 text-[12px] grid grid-cols-[auto_auto] gap-x-3 gap-y-1 justify-end">
                <dt class="text-[#9BA7B0] uppercase tracking-wider text-[10px] font-semibold pt-0.5 text-right">#</dt>
                <dd class="font-bold text-[#1C2434] tabular-nums text-right">{{ rp.refNo }}</dd>

                <dt class="text-[#9BA7B0] uppercase tracking-wider text-[10px] font-semibold pt-0.5 text-right">Date</dt>
                <dd class="font-semibold text-[#1C2434] tabular-nums text-right">{{ fmtDate(rp.date) || '—' }}</dd>

                <template v-if="rp.reference">
                  <dt class="text-[#9BA7B0] uppercase tracking-wider text-[10px] font-semibold pt-0.5 text-right">Ref</dt>
                  <dd class="font-semibold text-[#1C2434] text-right font-mono">{{ rp.reference }}</dd>
                </template>
              </dl>
            </div>
          </header>

          <!-- Received From -->
          <section class="px-10 py-6 grid grid-cols-1 sm:grid-cols-2 gap-x-10 gap-y-6 border-b border-dashed border-[#E2E8F0]">
            <div>
              <p class="text-[10px] font-bold text-[#9BA7B0] uppercase tracking-[0.15em] mb-2">Received From</p>
              <p class="text-[14px] font-bold text-[#1C2434]">{{ rp.customer?.name || '—' }}</p>
              <p v-if="rp.customer?.company" class="text-[12px] text-[#374151]">{{ rp.customer.company }}</p>
              <p v-if="rp.customer?.email" class="text-[11px] text-[#637381] mt-1.5">{{ rp.customer.email }}</p>
              <p v-if="rp.customer?.phone" class="text-[11px] text-[#637381]">{{ rp.customer.phone }}</p>
            </div>
            <div>
              <p class="text-[10px] font-bold text-[#9BA7B0] uppercase tracking-[0.15em] mb-2">Amount Received</p>
              <p class="text-[24px] font-extrabold text-green-600 tabular-nums leading-tight">
                {{ fmtMoney(rp.amount) }}
              </p>
            </div>
          </section>

          <!-- Metadata strip -->
          <section class="px-10 py-4 grid grid-cols-2 sm:grid-cols-3 gap-x-6 gap-y-3 border-b border-dashed border-[#E2E8F0] bg-[#FAFBFD]">
            <div>
              <p class="text-[9px] font-bold text-[#9BA7B0] uppercase tracking-[0.15em]">Payment Date</p>
              <p class="text-[12px] font-semibold text-[#1C2434] tabular-nums mt-0.5">{{ fmtDate(rp.date) || '—' }}</p>
            </div>
            <div>
              <p class="text-[9px] font-bold text-[#9BA7B0] uppercase tracking-[0.15em]">Payment Method</p>
              <p class="mt-0.5">
                <span class="inline-flex items-center px-2 py-0.5 text-[11px] font-semibold bg-blue-50 text-blue-700">
                  {{ rp.paymentMethod || '—' }}
                </span>
              </p>
            </div>
            <div>
              <p class="text-[9px] font-bold text-[#9BA7B0] uppercase tracking-[0.15em]">Reference</p>
              <p class="text-[12px] font-semibold text-[#1C2434] font-mono mt-0.5">{{ rp.reference || '—' }}</p>
            </div>
          </section>

          <!-- Applied invoices table -->
          <section class="px-10 pt-6 pb-2">
            <table class="w-full text-[12px]">
              <thead>
                <tr class="border-b-2 border-[#1C2434] text-[10px] font-bold text-[#1C2434] uppercase tracking-wider">
                  <th class="py-2.5 text-left w-8">#</th>
                  <th class="py-2.5 text-left w-32">Invoice #</th>
                  <th class="py-2.5 text-left w-28">Invoice Date</th>
                  <th class="py-2.5 text-left w-28">Due Date</th>
                  <th class="py-2.5 text-left">Status</th>
                  <th class="py-2.5 text-right w-32">Amount Applied</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(line, idx) in (rp.lines || [])" :key="line.id"
                  class="border-b border-[#F1F5F9]">
                  <td class="py-2.5 align-top text-[#9BA7B0] tabular-nums">{{ idx + 1 }}</td>
                  <td class="py-2.5 align-top">
                    <RouterLink :to="`/erp/invoices/${line.invoiceId}`"
                      class="font-mono font-medium text-primary-600 hover:underline transition-colors">
                      {{ line.invoice?.invoiceNumber || '—' }}
                    </RouterLink>
                  </td>
                  <td class="py-2.5 align-top text-[#637381] tabular-nums">{{ fmtDate(line.invoice?.invoiceDate) || '—' }}</td>
                  <td class="py-2.5 align-top text-[#637381] tabular-nums">{{ fmtDate(line.invoice?.dueDate) || '—' }}</td>
                  <td class="py-2.5 align-top">
                    <span class="inline-flex items-center px-2 py-0.5 text-[10px] font-semibold capitalize"
                      :class="invStatusClass(line.invoice?.status)">
                      {{ line.invoice?.status }}
                    </span>
                  </td>
                  <td class="py-2.5 align-top text-right font-semibold text-[#1C2434] tabular-nums">
                    {{ fmtMoney(line.amount) }}
                  </td>
                </tr>
                <tr v-if="!rp.lines?.length">
                  <td colspan="6" class="py-6 text-center text-[12px] text-[#9BA7B0] italic">
                    No invoices applied
                  </td>
                </tr>
              </tbody>
            </table>
          </section>

          <!-- Total -->
          <section class="px-10 pb-6 flex items-start justify-between gap-6">
            <p v-if="totalInWords" class="text-[13px] font-semibold text-[#1C2434] italic flex-1 min-w-0 text-center">
              {{ totalInWords }}
            </p>
            <dl class="w-full sm:w-72 flex-shrink-0 text-[12px] space-y-1.5">
              <div class="flex items-center justify-between pt-2 mt-1 border-t-2 border-[#1C2434]">
                <dt class="text-[11px] font-bold text-[#1C2434] uppercase tracking-wider">Total Received</dt>
                <dd class="text-[16px] font-extrabold text-green-600 tabular-nums">{{ fmtMoney(rp.amount) }}</dd>
              </div>
            </dl>
          </section>

          <!-- Notes -->
          <section v-if="rp.notes" class="px-10 pt-2 pb-6 border-t border-dashed border-[#E2E8F0]">
            <p class="text-[10px] font-bold text-[#9BA7B0] uppercase tracking-[0.15em] mb-1.5">Notes</p>
            <p class="text-[12px] text-[#374151] whitespace-pre-line leading-relaxed">{{ rp.notes }}</p>
          </section>

          <!-- Signatures footer -->
          <footer class="px-10 pt-6 pb-8 border-t border-dashed border-[#E2E8F0]">
            <div class="grid grid-cols-2 gap-10">
              <div>
                <div class="h-10 border-b border-[#1C2434]"></div>
                <p class="text-[10px] text-[#637381] mt-1.5 text-center uppercase tracking-wider">
                  Received By
                </p>
              </div>
              <div>
                <div class="h-10 border-b border-[#1C2434]"></div>
                <p class="text-[10px] text-[#637381] mt-1.5 text-center uppercase tracking-wider">
                  Customer Signature
                </p>
              </div>
            </div>
            <p class="text-center text-[10px] text-[#9BA7B0] mt-6">
              Thank you for your payment.
            </p>
          </footer>
        </article>

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
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { RouterLink, useRoute, useRouter } from 'vue-router'
import {
  ArrowLeftIcon, ChevronRightIcon, BanknotesIcon,
  CheckIcon, XMarkIcon, TrashIcon,
  ArrowPathIcon, ExclamationCircleIcon, PrinterIcon,
} from '@heroicons/vue/24/outline'
import AppLayout from '@/layouts/AppLayout.vue'
import KeyboardShortcuts from '@/components/KeyboardShortcuts.vue'
import api from '@/api'
import { fmtDate, fmtMoney, numToWords } from '@/utils/fmt'
import { useAuthStore } from '@/stores/auth'

const { locale }     = useI18n()
const route          = useRoute()
const router         = useRouter()
const auth           = useAuthStore()
const rp             = ref(null)
const totalInWords   = computed(() => rp.value ? numToWords(rp.value.amount, locale.value, rp.value.currency) : '')
const loading        = ref(true)
const notFound       = ref(false)
const updatingStatus = ref(false)
const statusError    = ref('')

// Company profile pulled from auth.user.organization — mirrors SO/Invoice detail.
const org = computed(() => auth.user?.organization || {})
const companyName    = computed(() => org.value.companyName || org.value.name || 'Your Company')
const companyAddress = computed(() => org.value.address  || '')
const companyPhone   = computed(() => org.value.phone    || '')
const companyEmail   = computed(() => org.value.email    || '')
const companyTaxId   = computed(() => org.value.taxId    || '')
const companyWebsite = computed(() => org.value.website  || '')
const companyLogoSrc = computed(() => {
  const p = org.value.logoPath
  if (!p) return ''
  if (/^https?:\/\//i.test(p)) return p
  return p
})

const pageShortcuts = computed(() => [
  { key: 'Ctrl+P', label: 'Print' },
  { key: 'Escape', label: 'Back to list' },
  { key: 'Backspace', label: 'Back to list' },
])

function isTyping() {
  const el = document.activeElement
  return el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.isContentEditable)
}

function onKeydown(e) {
  if (isTyping() || loading.value || !rp.value) return
  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'p') {
    e.preventDefault(); onPrint()
  } else if ((e.key === 'Escape' || e.key === 'Backspace') && !e.ctrlKey && !e.metaKey) {
    router.push('/erp/billing/receive-payments')
  }
}

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

// ── Status badge / stamp ──────────────────────────────────
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

const INV_STATUS_CLASS = {
  draft:     'bg-[#F1F5F9] text-[#637381]',
  sent:      'bg-blue-50 text-blue-700',
  paid:      'bg-green-50 text-green-700',
  cancelled: 'bg-red-50 text-red-600',
}
function invStatusClass(s) { return INV_STATUS_CLASS[s] || INV_STATUS_CLASS.draft }

const stampLabel = computed(() => {
  const s = rp.value?.status
  if (s === 'draft')     return 'Draft'
  if (s === 'cancelled') return 'Cancelled'
  if (s === 'confirmed') return 'Paid'
  return ''
})
const stampClass = computed(() => {
  const s = rp.value?.status
  if (s === 'cancelled') return 'text-red-600 border-red-600'
  if (s === 'confirmed') return 'text-green-600 border-green-600'
  return 'text-[#1C2434] border-[#1C2434]'
})

// ── Data ──────────────────────────────────────────────────
onMounted(() => { fetchPayment(); document.addEventListener('keydown', onKeydown) })
onUnmounted(() => document.removeEventListener('keydown', onKeydown))

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
@media print {
  aside, header, nav.print\:hidden { display: none !important; }
  body { background: white !important; }
  .shadow-card { box-shadow: none !important; }
  article { max-width: none !important; margin: 0 !important; }
}
</style>
