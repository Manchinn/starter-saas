<template>
  <AppLayout>
    <div class="space-y-5">

      <!-- Top action bar (hidden on print) -->
      <div class="flex items-start gap-3 print:hidden">
        <RouterLink to="/erp/billing/billing-notes"
          class="mt-0.5 p-2 text-[#9BA7B0] hover:text-[#1C2434] hover:bg-white
                 border border-transparent hover:border-[#E2E8F0] transition-all flex-shrink-0">
          <ArrowLeftIcon class="w-[18px] h-[18px]" />
        </RouterLink>
        <div class="flex-1 min-w-0">
          <div class="flex items-center gap-2.5 flex-wrap">
            <h1 class="text-xl font-bold text-[#1C2434]">
              {{ loading ? '…' : (bn?.refNo || t('erp.billingNotes.title')) }}
            </h1>
            <span v-if="bn && !loading"
              class="inline-flex items-center gap-1.5 px-2.5 py-0.5 text-[11px] font-semibold capitalize"
              :class="statusBadge(bn.status)">
              <span class="w-1.5 h-1.5" :class="statusDot(bn.status)"></span>
              {{ bn.status }}
            </span>
            <DocCurrencyBadge v-if="bn" :currency="bn.currency" :exchange-rate="bn.exchangeRate" :total="bn.total" />
          </div>
          <nav class="flex items-center gap-1.5 mt-1">
            <RouterLink to="/erp/billing/billing-notes" class="text-[12px] text-[#9BA7B0] hover:text-[#637381] transition-colors">
              {{ t('erp.billingNotes.title') }}
            </RouterLink>
            <ChevronRightIcon class="w-3 h-3 text-[#CBD5E1]" />
            <span class="text-[12px] text-[#637381]">{{ bn?.refNo || '…' }}</span>
          </nav>
        </div>
        <div v-if="bn && !loading" class="flex items-center gap-2 flex-shrink-0">
          <button @click="onPrint" type="button"
            title="Print this document"
            class="inline-flex items-center gap-1.5 px-3 py-2 text-[12px] font-semibold
                   text-[#637381] bg-white border border-[#E2E8F0] hover:bg-[#F7F9FC] hover:text-[#1C2434] transition-colors">
            <PrinterIcon class="w-4 h-4" />
            {{ t('common.print') }}
          </button>
          <button v-if="bn.status === 'draft'" v-can="'erp.accounting.delete'" @click="confirmDelete" type="button"
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
        <span>{{ t('erp.billingNotes.notFound') }}
          <RouterLink to="/erp/billing/billing-notes" class="underline ml-1">{{ t('erp.common.backToList') }}</RouterLink>
        </span>
      </div>

      <template v-else>
        <!-- Workflow strip -->
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
              <span class="text-[12px] font-semibold">{{ t('erp.common.cancelled') }}</span>
            </span>
          </div>
        </div>

        <!-- Document -->
        <article class="relative mx-auto bg-white border border-[#E2E8F0] shadow-card max-w-[860px] w-full
                        print:border-0 print:shadow-none print:max-w-none print:mx-0 print:
                        overflow-hidden">

          <div v-if="stampLabel"
            class="pointer-events-none absolute inset-0 flex items-center justify-center z-10"
            aria-hidden="true">
            <span class="select-none font-black tracking-[0.2em] uppercase border-[6px] px-6 py-2
                         text-[64px] sm:text-[88px] -rotate-[18deg] opacity-[0.12]"
              :class="stampClass">
              {{ stampLabel }}
            </span>
          </div>

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
                {{ t('erp.billingNotes.title') }}
              </h2>
              <dl class="mt-3 text-[12px] grid grid-cols-[auto_auto] gap-x-3 gap-y-1 justify-end">
                <dt class="text-[#9BA7B0] uppercase tracking-wider text-[10px] font-semibold pt-0.5 text-right">#</dt>
                <dd class="font-bold text-[#1C2434] tabular-nums text-right">{{ bn.refNo }}</dd>

                <dt class="text-[#9BA7B0] uppercase tracking-wider text-[10px] font-semibold pt-0.5 text-right">
                  {{ t('erp.common.date') }}
                </dt>
                <dd class="font-semibold text-[#1C2434] tabular-nums text-right">{{ fmtDate(bn.date) || '—' }}</dd>

                <template v-if="bn.dueDate">
                  <dt class="text-[#9BA7B0] uppercase tracking-wider text-[10px] font-semibold pt-0.5 text-right">
                    {{ t('erp.billingNotes.dueDate') }}
                  </dt>
                  <dd class="font-semibold text-right tabular-nums"
                    :class="isOverdue ? 'text-red-600' : 'text-[#1C2434]'">
                    {{ fmtDate(bn.dueDate) }}
                  </dd>
                </template>
              </dl>
            </div>
          </header>

          <!-- Bill To -->
          <section class="px-10 py-6 grid grid-cols-1 sm:grid-cols-2 gap-x-10 gap-y-6 border-b border-dashed border-[#E2E8F0]">
            <div>
              <p class="text-[10px] font-bold text-[#9BA7B0] uppercase tracking-[0.15em] mb-2">
                Bill To
              </p>
              <p class="text-[14px] font-bold text-[#1C2434]">{{ bn.customer?.name || '—' }}</p>
              <p v-if="bn.customer?.company" class="text-[12px] text-[#374151]">{{ bn.customer.company }}</p>
              <p v-if="bn.customer?.address" class="text-[12px] text-[#374151] mt-1 whitespace-pre-line leading-snug">
                {{ bn.customer.address }}
              </p>
              <p v-if="bn.customer?.email" class="text-[11px] text-[#637381] mt-1.5">{{ bn.customer.email }}</p>
              <p v-if="bn.customer?.phone" class="text-[11px] text-[#637381]">{{ bn.customer.phone }}</p>
            </div>
            <div>
              <p class="text-[10px] font-bold text-[#9BA7B0] uppercase tracking-[0.15em] mb-2">
                {{ t('erp.billingNotes.grandTotal') }}
              </p>
              <p class="text-[24px] font-extrabold text-[#1C2434] tabular-nums leading-tight">
                {{ fmtMoney(bn.total) }}
              </p>
              <p class="text-[11px] text-[#9BA7B0] mt-1">
                {{ bn.lines?.length || 0 }} {{ (bn.lines?.length || 0) === 1 ? 'invoice' : 'invoices' }}
              </p>
            </div>
          </section>

          <!-- Metadata strip -->
          <section class="px-10 py-4 grid grid-cols-2 sm:grid-cols-4 gap-x-6 gap-y-3 border-b border-dashed border-[#E2E8F0] bg-[#FAFBFD]">
            <div>
              <p class="text-[9px] font-bold text-[#9BA7B0] uppercase tracking-[0.15em]">{{ t('erp.common.date') }}</p>
              <p class="text-[12px] font-semibold text-[#1C2434] tabular-nums mt-0.5">{{ fmtDate(bn.date) || '—' }}</p>
            </div>
            <div>
              <p class="text-[9px] font-bold text-[#9BA7B0] uppercase tracking-[0.15em]">{{ t('erp.billingNotes.dueDate') }}</p>
              <p class="text-[12px] font-semibold tabular-nums mt-0.5"
                :class="isOverdue ? 'text-red-600' : 'text-[#1C2434]'">
                {{ fmtDate(bn.dueDate) || '—' }}
              </p>
            </div>
            <div>
              <p class="text-[9px] font-bold text-[#9BA7B0] uppercase tracking-[0.15em]">{{ t('erp.common.status') }}</p>
              <p class="mt-0.5">
                <span class="inline-flex items-center px-2 py-0.5 text-[11px] font-semibold capitalize"
                  :class="statusBadge(bn.status)">
                  {{ bn.status }}
                </span>
              </p>
            </div>
            <div>
              <p class="text-[9px] font-bold text-[#9BA7B0] uppercase tracking-[0.15em]">{{ t('erp.common.currency') }}</p>
              <p class="text-[12px] font-semibold text-[#1C2434] tabular-nums mt-0.5">{{ bn.currency || '—' }}</p>
            </div>
          </section>

          <!-- Included invoices -->
          <section class="px-10 pt-6 pb-2">
            <table class="w-full text-[12px]">
              <thead>
                <tr class="border-b-2 border-[#1C2434] text-[10px] font-bold text-[#1C2434] uppercase tracking-wider">
                  <th class="py-2.5 text-left w-8">#</th>
                  <th class="py-2.5 text-left w-32">{{ t('erp.billingNotes.colInvoiceNo') }}</th>
                  <th class="py-2.5 text-left w-28">{{ t('erp.billingNotes.colInvoiceDate') }}</th>
                  <th class="py-2.5 text-left w-28">{{ t('erp.billingNotes.colDueDate') }}</th>
                  <th class="py-2.5 text-left">{{ t('erp.common.status') }}</th>
                  <th class="py-2.5 text-right w-32">{{ t('erp.billingNotes.colAmount') }}</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(line, idx) in (bn.lines || [])" :key="line.id"
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
                <tr v-if="!bn.lines?.length">
                  <td colspan="6" class="py-6 text-center text-[12px] text-[#9BA7B0] italic">
                    {{ t('erp.common.noItems') }}
                  </td>
                </tr>
              </tbody>
            </table>
          </section>

          <!-- Total -->
          <section class="px-10 pb-6 flex justify-end">
            <dl class="w-full sm:w-72 text-[12px] space-y-1.5">
              <div class="flex items-center justify-between pt-2 mt-1 border-t-2 border-[#1C2434]">
                <dt class="text-[11px] font-bold text-[#1C2434] uppercase tracking-wider">{{ t('erp.billingNotes.colTotal') }}</dt>
                <dd class="text-[16px] font-extrabold text-[#1C2434] tabular-nums">{{ fmtMoney(bn.total) }}</dd>
              </div>
            </dl>
          </section>

          <!-- Notes -->
          <section v-if="bn.notes" class="px-10 pt-2 pb-6 border-t border-dashed border-[#E2E8F0]">
            <p class="text-[10px] font-bold text-[#9BA7B0] uppercase tracking-[0.15em] mb-1.5">
              {{ t('erp.common.notes') }}
            </p>
            <p class="text-[12px] text-[#374151] whitespace-pre-line leading-relaxed">{{ bn.notes }}</p>
          </section>

          <footer class="px-10 pt-6 pb-8 border-t border-dashed border-[#E2E8F0]">
            <div class="grid grid-cols-2 gap-10">
              <div>
                <div class="h-10 border-b border-[#1C2434]"></div>
                <p class="text-[10px] text-[#637381] mt-1.5 text-center uppercase tracking-wider">
                  Authorised Signature
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
              Thank you for your business.
            </p>
          </footer>
        </article>

        <!-- Status transitions -->
        <div v-can="'erp.accounting.edit'" v-if="forwardTransitions.length || cancelTransitions.length"
          class="bg-white border border-[#E2E8F0] shadow-card px-5 py-4 print:hidden
                 flex items-center justify-between flex-wrap gap-3">
          <div>
            <p class="text-[11px] font-semibold text-[#9BA7B0] uppercase tracking-wider">Next Action</p>
            <p class="text-[13px] text-[#637381] mt-0.5">Move this billing note forward through its workflow.</p>
          </div>
          <div class="flex items-center gap-2.5">
            <button v-for="s in forwardTransitions" :key="s"
              @click="changeStatus(s)" :disabled="updatingStatus"
              class="px-4 py-2.5 text-sm font-semibold transition-colors disabled:opacity-50
                     flex items-center gap-2"
              :class="forwardBtnClass(s)">
              <ArrowPathIcon v-if="updatingStatus" class="w-4 h-4 animate-spin" />
              <template v-else>{{ transitionLabel(s) }}</template>
            </button>
            <button v-for="s in cancelTransitions" :key="s"
              @click="changeStatus(s)" :disabled="updatingStatus"
              class="px-4 py-2 text-sm font-medium border border-red-200 text-red-600
                     hover:bg-red-50 transition-colors disabled:opacity-50">
              {{ t('erp.billingNotes.cancelNote') }}
            </button>
          </div>
        </div>
        <p v-if="statusError" class="text-xs text-red-600 print:hidden">{{ statusError }}</p>

        <ActivityTimeline v-if="bn" ref-type="BillingNote" :ref-id="bn.id" class="print:hidden" />
      </template>
    </div>
  </AppLayout>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import {
  ArrowLeftIcon, ChevronRightIcon,
  CheckIcon, XMarkIcon, TrashIcon,
  ArrowPathIcon, ExclamationCircleIcon, PrinterIcon,
} from '@heroicons/vue/24/outline'
import AppLayout from '@/layouts/AppLayout.vue'
import ActivityTimeline from '@/components/ActivityTimeline.vue'
import DocCurrencyBadge from '@/components/DocCurrencyBadge.vue'
import api from '@/api'
import { fmtDate, fmtMoney } from '@/utils/fmt'
import { useAuthStore } from '@/stores/auth'

const { t } = useI18n()
const route          = useRoute()
const router         = useRouter()
const auth           = useAuthStore()
const bn             = ref(null)
const loading        = ref(true)
const notFound       = ref(false)
const updatingStatus = ref(false)
const statusError    = ref('')

// Company profile from auth.user.organization, mirrors SO/Invoice detail.
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

function onPrint() { window.print() }

const isOverdue = computed(() =>
  bn.value?.status === 'sent' &&
  bn.value?.dueDate &&
  new Date(bn.value.dueDate) < new Date()
)

// ── Workflow ──────────────────────────────────────────────
const FLOW_STEPS = computed(() => [
  { key: 'draft', label: t('erp.common.draft') },
  { key: 'sent',  label: t('erp.billingNotes.statusSent') },
  { key: 'paid',  label: t('erp.billingNotes.statusPaid') },
])

const COMPLETED_BEFORE = {
  draft:     [],
  sent:      ['draft'],
  paid:      ['draft', 'sent'],
  cancelled: [],
}

const TRANSITIONS = {
  draft:     ['sent', 'cancelled'],
  sent:      ['paid', 'cancelled'],
  paid:      [],
  cancelled: [],
}

const availableTransitions = computed(() => TRANSITIONS[bn.value?.status] || [])
const forwardTransitions   = computed(() => availableTransitions.value.filter(s => s !== 'cancelled'))
const cancelTransitions    = computed(() => availableTransitions.value.filter(s => s === 'cancelled'))
const isCancelled          = computed(() => bn.value?.status === 'cancelled')

function stepState(key) {
  const cur = bn.value?.status
  if (!cur || cur === key) return cur === key ? 'current' : 'upcoming'
  return (COMPLETED_BEFORE[cur] || []).includes(key) ? 'completed' : 'upcoming'
}
function stepChipClass(key) {
  const s = stepState(key)
  if (s === 'completed') return 'bg-green-50 text-green-700'
  if (s === 'current')   return 'bg-primary-50 text-primary-700 ring-1 ring-primary-200'
  return 'bg-[#F7F9FC] text-[#9BA7B0]'
}

const FORWARD_BTN = {
  sent: 'bg-blue-600 text-white hover:bg-blue-700',
  paid: 'bg-green-600 text-white hover:bg-green-700',
}
function forwardBtnClass(s) { return FORWARD_BTN[s] || 'bg-primary-500 text-white hover:bg-primary-600' }

function transitionLabel(s) {
  const labels = { sent: t('erp.billingNotes.markSent'), paid: t('erp.billingNotes.markPaid') }
  return labels[s] || s
}

const STATUS_BADGE = {
  draft:     'bg-[#F1F5F9] text-[#637381]',
  sent:      'bg-blue-50 text-blue-700',
  paid:      'bg-green-50 text-green-700',
  cancelled: 'bg-red-50 text-red-600',
}
const STATUS_DOT = {
  draft:     'bg-slate-400',
  sent:      'bg-blue-500',
  paid:      'bg-green-500',
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
  const s = bn.value?.status
  if (s === 'draft')     return 'Draft'
  if (s === 'paid')      return 'Paid'
  if (s === 'cancelled') return 'Cancelled'
  return ''
})
const stampClass = computed(() => {
  const s = bn.value?.status
  if (s === 'cancelled') return 'text-red-600 border-red-600'
  if (s === 'paid')      return 'text-green-600 border-green-600'
  return 'text-[#1C2434] border-[#1C2434]'
})

onMounted(fetchBillingNote)

async function fetchBillingNote() {
  loading.value = true
  try {
    const { data } = await api.get(`/erp/billing/billing-notes/${route.params.id}`)
    bn.value = data.data.billingNote
  } catch {
    notFound.value = true
  } finally {
    loading.value = false
  }
}

const STATUS_ENDPOINT = { sent: 'send', paid: 'pay', cancelled: 'cancel' }

async function changeStatus(status) {
  statusError.value    = ''
  updatingStatus.value = true
  try {
    const endpoint = STATUS_ENDPOINT[status]
    const { data } = await api.post(`/erp/billing/billing-notes/${bn.value.id}/${endpoint}`)
    bn.value = data.data.billingNote
  } catch (err) {
    statusError.value = err.response?.data?.message || 'Failed to update status'
  } finally {
    updatingStatus.value = false
  }
}

async function confirmDelete() {
  if (!confirm(`Delete billing note ${bn.value.refNo}? This cannot be undone.`)) return
  try {
    await api.delete(`/erp/billing/billing-notes/${bn.value.id}`)
    router.push('/erp/billing/billing-notes')
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
