<template>
  <AppLayout>
    <div class="space-y-5">

      <!-- Top action bar (hidden on print) -->
      <div class="flex items-start gap-3 print:hidden">
        <RouterLink to="/erp/billing/credit-notes"
          class="mt-0.5 p-2 text-[#9BA7B0] hover:text-[#1C2434] hover:bg-white
                 border border-transparent hover:border-[#E2E8F0] transition-all flex-shrink-0">
          <ArrowLeftIcon class="w-[18px] h-[18px]" />
        </RouterLink>
        <div class="flex-1 min-w-0">
          <div class="flex items-center gap-2.5 flex-wrap">
            <h1 class="text-xl font-bold text-[#1C2434]">
              {{ loading ? '…' : (cn?.refNo || t('erp.creditNotes.title')) }}
            </h1>
            <span v-if="cn && !loading"
              class="inline-flex items-center gap-1.5 px-2.5 py-0.5 text-[11px] font-semibold capitalize"
              :class="statusBadge(cn.status)">
              <span class="w-1.5 h-1.5" :class="statusDot(cn.status)"></span>
              {{ cn.status }}
            </span>
          </div>
          <nav class="flex items-center gap-1.5 mt-1">
            <RouterLink to="/erp/billing/credit-notes" class="text-[12px] text-[#9BA7B0] hover:text-[#637381] transition-colors">
              {{ t('erp.creditNotes.title') }}
            </RouterLink>
            <ChevronRightIcon class="w-3 h-3 text-[#CBD5E1]" />
            <span class="text-[12px] text-[#637381]">{{ cn?.refNo || '…' }}</span>
          </nav>
          <!-- Source-doc badge -->
          <div v-if="cn && !loading && cn.invoice" class="flex items-center gap-1.5 mt-2 flex-wrap">
            <span class="text-[11px] text-[#9BA7B0] font-medium">{{ t('erp.common.source') }}:</span>
            <RouterLink :to="`/erp/invoices/${cn.invoice.id}`"
              class="inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-medium bg-indigo-50 text-indigo-700 hover:bg-indigo-100">
              <DocumentTextIcon class="w-3 h-3" /> {{ cn.invoice.invoiceNumber }}
            </RouterLink>
          </div>
        </div>
        <div v-if="cn && !loading" class="flex items-center gap-2 flex-shrink-0">
          <KeyboardShortcuts :shortcuts="shortcuts" width="w-56" />
          <button @click="onPrint" type="button"
            :title="t('erp.creditNotes.printDocument')"
            class="inline-flex items-center gap-1.5 px-3 py-2 text-[12px] font-semibold
                   text-[#637381] bg-white border border-[#E2E8F0] hover:bg-[#F7F9FC] hover:text-[#1C2434] transition-colors">
            <PrinterIcon class="w-4 h-4" />
            {{ t('common.print') }}
          </button>
          <button v-if="cn.status === 'draft'" v-can="'erp.accounting.delete'" @click="confirmDelete" type="button"
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
        <span>{{ t('erp.creditNotes.notFound') }}
          <RouterLink to="/erp/billing/credit-notes" class="underline ml-1">{{ t('erp.common.backToList') }}</RouterLink>
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

        <!-- Document — credit note (ใบลดหนี้) -->
        <article class="relative mx-auto bg-white border border-[#E2E8F0] shadow-card max-w-[186mm] w-full
                        print:border-0 print:shadow-none print:max-w-none print:mx-0
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

          <div class="p-6">
            <!-- Header -->
            <header class="flex items-start justify-between gap-6">
              <div class="flex items-start gap-4 min-w-0">
                <img v-if="companyLogoSrc" :src="companyLogoSrc" :alt="companyName"
                  class="max-h-16 max-w-[140px] object-contain flex-shrink-0" />
                <div class="min-w-0">
                  <p class="text-[18px] font-bold text-[#1C2434] leading-tight">{{ companyName }}</p>
                  <p v-if="companyAddress" class="text-[11px] text-[#637381] mt-1 whitespace-pre-line leading-snug">
                    {{ companyAddress }}
                  </p>
                  <div class="text-[11px] text-[#637381] mt-1 space-y-0.5">
                    <p v-if="companyPhone">{{ t('erp.creditNotes.docPhoneAbbr') }} {{ companyPhone }}</p>
                    <p v-if="companyTaxId" class="tabular-nums">
                      {{ t('erp.creditNotes.docTaxId') }} {{ companyTaxId }}
                    </p>
                  </div>
                </div>
              </div>
              <div class="text-right flex-shrink-0">
                <h2 class="text-[18px] font-bold text-[#1C2434] leading-tight">{{ t('erp.creditNotes.documentTitle') }}</h2>
                <p class="text-[11px] text-[#9BA7B0] mt-1">({{ t('erp.creditNotes.docOriginal') }})</p>
              </div>
            </header>

            <!-- Customer + meta boxes -->
            <div class="mt-5 grid grid-cols-1 sm:grid-cols-2 border border-[#1C2434]">
              <div class="p-3 border-b sm:border-b-0 sm:border-r border-[#1C2434] text-[12px] space-y-1.5">
                <div class="grid grid-cols-[78px_1fr] gap-x-2">
                  <span class="text-[#637381]">{{ t('erp.creditNotes.docCustomerCode') }}</span>
                  <span class="font-medium text-[#1C2434]">{{ cn.customer?.code || '—' }}</span>
                </div>
                <div class="grid grid-cols-[78px_1fr] gap-x-2">
                  <span class="text-[#637381]">{{ t('erp.creditNotes.docCustomerName') }}</span>
                  <span class="font-semibold text-[#1C2434]">{{ cn.customer?.company || cn.customer?.name || '—' }}</span>
                </div>
                <div class="grid grid-cols-[78px_1fr] gap-x-2">
                  <span class="text-[#637381]">{{ t('erp.creditNotes.docAddress') }}</span>
                  <span class="text-[#1C2434] whitespace-pre-line leading-snug">{{ cn.customer?.address || '—' }}</span>
                </div>
              </div>
              <div class="p-3 text-[12px] space-y-1.5">
                <div class="grid grid-cols-[124px_1fr] gap-x-2">
                  <span class="text-[#637381]">{{ t('erp.creditNotes.docTaxId') }}</span>
                  <span class="font-medium text-[#1C2434] tabular-nums">{{ customerTaxId || '—' }}</span>
                </div>
                <div class="grid grid-cols-[124px_1fr] gap-x-2">
                  <span class="text-[#637381]">{{ t('erp.creditNotes.docRefNo') }}</span>
                  <span class="font-bold text-[#1C2434] tabular-nums">{{ cn.refNo }}</span>
                </div>
                <div class="grid grid-cols-[124px_1fr] gap-x-2">
                  <span class="text-[#637381]">{{ t('erp.creditNotes.docDate') }}</span>
                  <span class="font-medium text-[#1C2434] tabular-nums">{{ fmtDate(cn.date) || '—' }}</span>
                </div>
                <div v-if="cn.invoice" class="grid grid-cols-[124px_1fr] gap-x-2">
                  <span class="text-[#637381]">{{ t('erp.creditNotes.docLinkedInvoice') }}</span>
                  <RouterLink :to="`/erp/invoices/${cn.invoice.id}`"
                    class="font-medium text-primary-600 hover:underline font-mono">{{ cn.invoice.invoiceNumber }}</RouterLink>
                </div>
              </div>
            </div>

            <!-- Reason / line item -->
            <table class="w-full mt-4 border-collapse text-[12px] table-fixed">
              <thead>
                <tr class="bg-[#FAFBFD] text-[10px] font-bold text-[#1C2434] uppercase tracking-wide">
                  <th class="border border-[#1C2434] px-2 py-2 text-right w-[44px]">#</th>
                  <th class="border border-[#1C2434] px-2 py-2 text-left w-[365px]">{{ t('erp.creditNotes.docColReason') }}</th>
                  <th class="border border-[#1C2434] px-2 py-2 text-right w-[241px]">{{ t('erp.creditNotes.colAmount') }}</th>
                </tr>
              </thead>
              <tbody>
                <tr class="align-top">
                  <td class="border-x border-b border-x-[#1C2434] border-b-[#E2E8F0] px-2 py-1.5 text-right tabular-nums text-[#9BA7B0]">1</td>
                  <td class="border-x border-b border-x-[#1C2434] border-b-[#E2E8F0] px-2 py-1.5 text-[#374151] whitespace-pre-line leading-snug">{{ cn.reason || '—' }}</td>
                  <td class="border-x border-b border-x-[#1C2434] border-b-[#E2E8F0] px-2 py-1.5 text-right tabular-nums font-medium text-green-600">−{{ fmtMoney(cn.amount) }}</td>
                </tr>
                <!-- filler rows keep the goods area tall like a printed form -->
                <tr v-for="n in fillerRows" :key="'filler-' + n" class="h-[26px]">
                  <td class="border-x border-[#1C2434]"></td>
                  <td class="border-x border-[#1C2434]"></td>
                  <td class="border-x border-[#1C2434]"></td>
                </tr>
              </tbody>
            </table>

            <!-- Terms / amount-in-words + totals -->
            <div class="flex items-stretch border-x border-t border-b border-[#1C2434]">
              <div class="flex-1 min-w-0 flex flex-col">
                <div v-if="totalInWords"
                  class="border-b border-[#1C2434] px-3 py-2 text-center">
                  <p class="text-[12px] font-semibold text-[#1C2434] italic">({{ totalInWords }})</p>
                </div>
                <div class="p-3 text-[11px] text-[#374151] space-y-1">
                  <p v-for="(term, i) in docTerms" :key="'t' + i" class="leading-snug">- {{ term }}</p>
                  <p v-if="cn.notes" class="leading-snug whitespace-pre-line">- {{ cn.notes }}</p>
                </div>
              </div>
              <div class="w-[241px] flex-shrink-0 border-l border-[#1C2434] text-[12px]">
                <div class="flex items-center justify-between px-3 py-2 bg-[#FAFBFD]">
                  <span class="font-bold text-[#1C2434]">{{ t('erp.creditNotes.docNetTotal') }}</span>
                  <span class="font-extrabold text-green-600 tabular-nums">−{{ fmtMoney(cn.amount) }}</span>
                </div>
              </div>
            </div>

            <!-- Signatures -->
            <div class="grid grid-cols-3 gap-8 mt-12 px-2">
              <div v-for="(sig, i) in signatures" :key="'sig' + i" class="text-center">
                <div class="border-b border-dotted border-[#1C2434] h-8"></div>
                <p class="text-[11px] text-[#637381] mt-1.5">{{ sig }}</p>
                <p class="text-[10px] text-[#9BA7B0] mt-2">{{ t('erp.creditNotes.docDate') }} ......./......./.......</p>
              </div>
            </div>
          </div>
        </article>

        <!-- Status transitions -->
        <div v-can="'erp.accounting.edit'" v-if="forwardTransitions.length || cancelTransitions.length"
          class="bg-white border border-[#E2E8F0] shadow-card px-5 py-4 print:hidden
                 flex items-center justify-between flex-wrap gap-3">
          <div>
            <p class="text-[11px] font-semibold text-[#9BA7B0] uppercase tracking-wider">{{ t('erp.creditNotes.nextAction') }}</p>
            <p class="text-[13px] text-[#637381] mt-0.5">{{ t('erp.creditNotes.nextActionHint') }}</p>
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
              {{ t('erp.creditNotes.cancelNote') }}
            </button>
          </div>
        </div>
        <p v-if="statusError" class="text-xs text-red-600 print:hidden">{{ statusError }}</p>

        <ActivityTimeline v-if="cn" ref-type="CreditNote" :ref-id="cn.id" class="print:hidden" />
      </template>
    </div>
  </AppLayout>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import {
  ArrowLeftIcon, ChevronRightIcon, DocumentTextIcon,
  CheckIcon, XMarkIcon, TrashIcon,
  ArrowPathIcon, ExclamationCircleIcon, PrinterIcon,
} from '@heroicons/vue/24/outline'
import AppLayout from '@/layouts/AppLayout.vue'
import ActivityTimeline from '@/components/ActivityTimeline.vue'
import KeyboardShortcuts from '@/components/KeyboardShortcuts.vue'
import { useDetailShortcuts } from '@/composables/useShortcuts'
import api from '@/api'
import { fmtDate, fmtMoney, numToWords } from '@/utils/fmt'
import { useAuthStore } from '@/stores/auth'

const { t, locale } = useI18n()
const route          = useRoute()
const router         = useRouter()
const auth           = useAuthStore()
const cn             = ref(null)
const totalInWords   = computed(() => cn.value ? numToWords(cn.value.amount, locale.value, cn.value.currency) : '')
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

// ── Document helpers (mirror Invoice / Receipt tax-invoice layout) ──
const customerTaxId = computed(() => cn.value?.customer?.taxId || '')
const fillerRows    = computed(() => 6)
const docTerms      = computed(() => [t('erp.creditNotes.docTerm1'), t('erp.creditNotes.docTerm2')])
const signatures    = computed(() => [
  t('erp.creditNotes.docPreparedBy'),
  t('erp.creditNotes.docApprovedBy'),
  t('erp.creditNotes.docCustomerSignature'),
])

const { shortcuts } = useDetailShortcuts({
  enabled: () => !loading.value && !!cn.value,
  print: onPrint,
  back:  () => router.push('/erp/billing/credit-notes'),
})

// ── Workflow ──────────────────────────────────────────────
const FLOW_STEPS = computed(() => [
  { key: 'draft',  label: t('erp.common.draft') },
  { key: 'issued', label: t('erp.creditNotes.statusIssued') },
])

const COMPLETED_BEFORE = {
  draft:     [],
  issued:    ['draft'],
  cancelled: [],
}

const TRANSITIONS = {
  draft:     ['issued', 'cancelled'],
  issued:    ['cancelled'],
  cancelled: [],
}

const availableTransitions = computed(() => TRANSITIONS[cn.value?.status] || [])
const forwardTransitions   = computed(() => availableTransitions.value.filter(s => s !== 'cancelled'))
const cancelTransitions    = computed(() => availableTransitions.value.filter(s => s === 'cancelled'))
const isCancelled          = computed(() => cn.value?.status === 'cancelled')

function stepState(key) {
  const cur = cn.value?.status
  if (!cur || cur === key) return cur === key ? 'current' : 'upcoming'
  return (COMPLETED_BEFORE[cur] || []).includes(key) ? 'completed' : 'upcoming'
}
function stepChipClass(key) {
  const s = stepState(key)
  if (s === 'completed') return 'bg-green-50 text-green-700'
  if (s === 'current')   return 'bg-primary-50 text-primary-700 ring-1 ring-primary-200'
  return 'bg-[#F7F9FC] text-[#9BA7B0]'
}

const FORWARD_BTN = { issued: 'bg-green-600 text-white hover:bg-green-700' }
function forwardBtnClass(s) { return FORWARD_BTN[s] || 'bg-primary-500 text-white hover:bg-primary-600' }

function transitionLabel(s) {
  const labels = { issued: t('erp.creditNotes.issueNote') }
  return labels[s] || s
}

const STATUS_BADGE = {
  draft:     'bg-[#F1F5F9] text-[#637381]',
  issued:    'bg-green-50 text-green-700',
  cancelled: 'bg-red-50 text-red-600',
}
const STATUS_DOT = {
  draft:     'bg-slate-400',
  issued:    'bg-green-500',
  cancelled: 'bg-red-500',
}
function statusBadge(s) { return STATUS_BADGE[s] || STATUS_BADGE.draft }
function statusDot(s)   { return STATUS_DOT[s]   || STATUS_DOT.draft }

const stampLabel = computed(() => {
  const s = cn.value?.status
  if (s === 'draft')     return 'Draft'
  if (s === 'issued')    return 'Issued'
  if (s === 'cancelled') return 'Cancelled'
  return ''
})
const stampClass = computed(() => {
  const s = cn.value?.status
  if (s === 'cancelled') return 'text-red-600 border-red-600'
  if (s === 'issued')    return 'text-green-600 border-green-600'
  return 'text-[#1C2434] border-[#1C2434]'
})

onMounted(fetchCreditNote)

async function fetchCreditNote() {
  loading.value = true
  try {
    const { data } = await api.get(`/erp/billing/credit-notes/${route.params.id}`)
    cn.value = data.data.creditNote
  } catch {
    notFound.value = true
  } finally {
    loading.value = false
  }
}

const STATUS_ENDPOINT = { issued: 'issue', cancelled: 'cancel' }

async function changeStatus(status) {
  statusError.value    = ''
  updatingStatus.value = true
  try {
    const endpoint = STATUS_ENDPOINT[status]
    const { data } = await api.post(`/erp/billing/credit-notes/${cn.value.id}/${endpoint}`)
    cn.value = data.data.creditNote
  } catch (err) {
    statusError.value = err.response?.data?.message || 'Failed to update status'
  } finally {
    updatingStatus.value = false
  }
}

async function confirmDelete() {
  if (!confirm(`Delete credit note ${cn.value.refNo}? This cannot be undone.`)) return
  try {
    await api.delete(`/erp/billing/credit-notes/${cn.value.id}`)
    router.push('/erp/billing/credit-notes')
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
  /* Pin the document to the A4 printable width (210mm − 2×12mm margins)
     so the table never overflows the page. */
  article {
    width: 186mm !important;
    max-width: 186mm !important;
    margin: 0 auto !important;
    overflow: visible !important;
  }
  article table { table-layout: fixed; width: 100% !important; }
}
</style>
