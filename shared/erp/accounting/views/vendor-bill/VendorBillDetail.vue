<template>
  <AppLayout>
    <div class="space-y-5">

      <!-- Top action bar (hidden on print) -->
      <div class="flex items-start gap-3 print:hidden">
        <RouterLink to="/erp/purchasing/bills"
          class="mt-0.5 p-2 text-[#9BA7B0] hover:text-[#1C2434] hover:bg-white
                 border border-transparent hover:border-[#E2E8F0] transition-all flex-shrink-0">
          <ArrowLeftIcon class="w-[18px] h-[18px]" />
        </RouterLink>
        <div class="flex-1 min-w-0">
          <div class="flex items-center gap-2.5 flex-wrap">
            <h1 class="text-xl font-bold text-[#1C2434]">
              {{ loading ? '…' : (bill?.billNumber || t('erp.bills.title')) }}
            </h1>
            <span v-if="bill && !loading"
              class="inline-flex items-center gap-1.5 px-2.5 py-0.5 text-[11px] font-semibold capitalize"
              :class="statusBadge(bill.status)">
              <span class="w-1.5 h-1.5" :class="statusDot(bill.status)"></span>
              {{ t(`erp.bills.status${capitalize(bill.status)}`) }}
            </span>
            <DocCurrencyBadge v-if="bill" :currency="bill.currency" :exchange-rate="bill.exchangeRate" :total="bill.total" />
          </div>
          <nav class="flex items-center gap-1.5 mt-1">
            <RouterLink to="/erp/purchasing/bills" class="text-[12px] text-[#9BA7B0] hover:text-[#637381] transition-colors">
              {{ t('erp.bills.title') }}
            </RouterLink>
            <ChevronRightIcon class="w-3 h-3 text-[#CBD5E1]" />
            <span class="text-[12px] text-[#637381]">{{ bill?.billNumber || '…' }}</span>
          </nav>
        </div>
        <div v-if="bill && !loading" class="flex items-center gap-2 flex-shrink-0">
          <KeyboardShortcuts :shortcuts="shortcuts" width="w-56" />
          <button @click="onPrint" type="button"
            :title="t('erp.bills.printDocument')"
            class="inline-flex items-center gap-1.5 px-3 py-2 text-[12px] font-semibold
                   text-[#637381] bg-white border border-[#E2E8F0] hover:bg-[#F7F9FC] hover:text-[#1C2434] transition-colors">
            <PrinterIcon class="w-4 h-4" />
            {{ t('common.print') }}
          </button>
          <RouterLink v-if="bill.status === 'draft'" v-can="'erp.bills.edit'" :to="`/erp/purchasing/bills/${bill.id}/edit`"
            class="inline-flex items-center gap-1.5 px-3 py-2 text-[12px] font-semibold
                   text-primary-600 bg-primary-50 hover:bg-primary-100 border border-primary-200 transition-colors">
            <PencilSquareIcon class="w-4 h-4" />
            {{ t('common.edit') }}
          </RouterLink>
          <button v-if="bill.status === 'draft'" v-can="'erp.bills.delete'" @click="confirmDelete" type="button"
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
      <div v-else-if="!bill"
        class="flex items-start gap-3 bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3.5 print:hidden">
        <ExclamationCircleIcon class="w-5 h-5 flex-shrink-0 mt-0.5" />
        <span>{{ t('erp.bills.notFound') }}
          <RouterLink to="/erp/purchasing/bills" class="underline ml-1">{{ t('erp.common.backToList') }}</RouterLink>
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
              <span class="text-[12px] font-semibold">{{ t('erp.bills.statusCancelled') }}</span>
            </span>
          </div>
        </div>

        <!-- Document (receipt tax-invoice layout) -->
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
                <h2 class="text-[18px] font-bold text-[#1C2434] leading-tight uppercase">{{ t('erp.bills.title') }}</h2>
              </div>
            </header>

            <!-- Vendor + meta boxes -->
            <div class="mt-5 grid grid-cols-1 sm:grid-cols-2 border border-[#1C2434]">
              <div class="p-3 border-b sm:border-b-0 sm:border-r border-[#1C2434] text-[12px] space-y-1.5">
                <div class="grid grid-cols-[88px_1fr] gap-x-2">
                  <span class="text-[#637381]">{{ t('erp.bills.vendor') }}</span>
                  <span class="font-semibold text-[#1C2434]">
                    {{ bill.vendor?.name || '—' }}
                    <span v-if="bill.vendor?.code" class="font-mono text-[11px] text-[#9BA7B0]">({{ bill.vendor.code }})</span>
                  </span>
                </div>
                <div class="grid grid-cols-[88px_1fr] gap-x-2">
                  <span class="text-[#637381]">{{ t('erp.bills.dueDate') }}</span>
                  <span class="font-medium text-[#1C2434] tabular-nums">{{ fmtDate(bill.dueDate) || '—' }}</span>
                </div>
                <div v-if="bill.vendorInvoiceNo" class="grid grid-cols-[88px_1fr] gap-x-2">
                  <span class="text-[#637381]">{{ t('erp.bills.vendorInvoiceNo') }}</span>
                  <span class="font-medium text-[#1C2434]">{{ bill.vendorInvoiceNo }}</span>
                </div>
              </div>
              <div class="p-3 text-[12px] space-y-1.5">
                <div class="grid grid-cols-[110px_1fr] gap-x-2">
                  <span class="text-[#637381]">{{ t('erp.bills.colBillNumber') }}</span>
                  <span class="font-bold text-[#1C2434] tabular-nums">{{ bill.billNumber }}</span>
                </div>
                <div class="grid grid-cols-[110px_1fr] gap-x-2">
                  <span class="text-[#637381]">{{ t('erp.bills.billDate') }}</span>
                  <span class="font-medium text-[#1C2434] tabular-nums">{{ fmtDate(bill.billDate) || '—' }}</span>
                </div>
                <div v-if="bill.purchaseOrder" class="grid grid-cols-[110px_1fr] gap-x-2">
                  <span class="text-[#637381]">{{ t('erp.bills.linkedPO') }}</span>
                  <RouterLink :to="`/erp/purchasing/orders/${bill.purchaseOrder.id}`"
                    class="font-medium font-mono text-primary-600 hover:underline">{{ bill.purchaseOrder.refNo }}</RouterLink>
                </div>
                <div v-if="bill.goodReceive" class="grid grid-cols-[110px_1fr] gap-x-2">
                  <span class="text-[#637381]">{{ t('erp.bills.linkedGR') }}</span>
                  <RouterLink :to="`/erp/good-receive/${bill.goodReceive.id}`"
                    class="font-medium font-mono text-primary-600 hover:underline">{{ bill.goodReceive.refNo }}</RouterLink>
                </div>
                <div class="grid grid-cols-[110px_1fr] gap-x-2">
                  <span class="text-[#637381]">{{ t('erp.common.currency') }}</span>
                  <span class="font-medium text-[#1C2434] tabular-nums">{{ bill.currency || '—' }}</span>
                </div>
              </div>
            </div>

            <!-- Line items -->
            <table class="w-full mt-4 border-collapse text-[12px] table-fixed">
              <thead>
                <tr class="bg-[#FAFBFD] text-[10px] font-bold text-[#1C2434] uppercase tracking-wide">
                  <th class="border border-[#1C2434] px-2 py-2 text-right w-[32px]">#</th>
                  <th class="border border-[#1C2434] px-2 py-2 text-left w-[314px]">{{ t('erp.bills.colItem') }}</th>
                  <th class="border border-[#1C2434] px-2 py-2 text-right w-[64px]">{{ t('erp.bills.colQty') }}</th>
                  <th class="border border-[#1C2434] px-2 py-2 text-right w-[120px]">{{ t('erp.bills.colUnitPrice') }}</th>
                  <th class="border border-[#1C2434] px-2 py-2 text-right w-[121px]">{{ t('erp.bills.colSubtotal') }}</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(item, idx) in (bill.items || [])" :key="item.id" class="align-top">
                  <td class="border-x border-b border-x-[#1C2434] border-b-[#E2E8F0] px-2 py-1.5 text-right tabular-nums text-[#9BA7B0]">{{ idx + 1 }}</td>
                  <td class="border-x border-b border-x-[#1C2434] border-b-[#E2E8F0] px-2 py-1.5 text-[#1C2434]">{{ item.description }}</td>
                  <td class="border-x border-b border-x-[#1C2434] border-b-[#E2E8F0] px-2 py-1.5 text-right tabular-nums text-[#374151]">{{ Number(item.quantity) }}</td>
                  <td class="border-x border-b border-x-[#1C2434] border-b-[#E2E8F0] px-2 py-1.5 text-right tabular-nums text-[#374151]">{{ fmtMoney(item.unitPrice) }}</td>
                  <td class="border-x border-b border-x-[#1C2434] border-b-[#E2E8F0] px-2 py-1.5 text-right tabular-nums font-medium text-[#1C2434]">{{ fmtMoney(item.total) }}</td>
                </tr>
                <!-- filler rows keep the goods area tall like a printed form -->
                <tr v-for="n in fillerRows" :key="'filler-' + n" class="h-[26px]">
                  <td class="border-x border-[#1C2434]"></td>
                  <td class="border-x border-[#1C2434]"></td>
                  <td class="border-x border-[#1C2434]"></td>
                  <td class="border-x border-[#1C2434]"></td>
                  <td class="border-x border-[#1C2434]"></td>
                </tr>
              </tbody>
            </table>

            <!-- Amount-in-words + totals -->
            <div class="flex items-stretch border-x border-t border-b border-[#1C2434]">
              <div class="flex-1 min-w-0 flex flex-col">
                <div v-if="totalInWords" class="border-b border-[#1C2434] px-3 py-2 text-center">
                  <p class="text-[12px] font-semibold text-[#1C2434] italic">({{ totalInWords }})</p>
                </div>
                <div class="p-3 text-[11px] text-[#374151] space-y-1">
                  <div v-if="bill.notes" class="grid grid-cols-[64px_1fr] gap-x-2">
                    <span class="text-[#9BA7B0]">{{ t('erp.bills.notes') }}</span>
                    <span class="whitespace-pre-line leading-snug">{{ bill.notes }}</span>
                  </div>
                  <p v-else class="text-[#9BA7B0] italic">—</p>
                </div>
              </div>
              <div class="w-[241px] flex-shrink-0 border-l border-[#1C2434] text-[12px]">
                <div class="flex items-center justify-between px-3 pt-[7px] pb-[9px] border-b border-[#1C2434]">
                  <span class="text-[#637381]">{{ t('erp.bills.subtotal') }}</span>
                  <span class="tabular-nums text-[#1C2434]">{{ fmtMoney(bill.subtotal) }}</span>
                </div>
                <div class="flex items-center justify-between px-3 py-1.5 border-b border-[#1C2434]">
                  <span class="text-[#637381]">{{ t('erp.bills.tax') }}</span>
                  <span class="tabular-nums text-[#1C2434]">{{ fmtMoney(bill.tax) }}</span>
                </div>
                <div class="flex items-center justify-between px-3 py-2 bg-[#FAFBFD]">
                  <span class="font-bold text-[#1C2434]">{{ t('erp.bills.total') }}</span>
                  <span class="font-extrabold text-[#1C2434] tabular-nums">{{ fmtMoney(bill.total) }}</span>
                </div>
              </div>
            </div>

            <!-- Signatures -->
            <div class="grid grid-cols-2 gap-8 mt-12 px-2">
              <div v-for="(sig, i) in signatures" :key="'sig' + i" class="text-center">
                <div class="border-b border-dotted border-[#1C2434] h-8"></div>
                <p class="text-[11px] text-[#637381] mt-1.5">{{ sig }}</p>
                <p class="text-[10px] text-[#9BA7B0] mt-2">{{ t('erp.bills.billDate') }} ......./......./.......</p>
              </div>
            </div>
          </div>
        </article>

        <!-- Status transitions -->
        <div v-can="'erp.bills.edit'" v-if="forwardTransitions.length || cancelTransitions.length"
          class="bg-white border border-[#E2E8F0] shadow-card px-5 py-4 print:hidden
                 flex items-center justify-between flex-wrap gap-3">
          <div>
            <p class="text-[11px] font-semibold text-[#9BA7B0] uppercase tracking-wider">{{ t('erp.bills.nextAction') }}</p>
            <p class="text-[13px] text-[#637381] mt-0.5">{{ t('erp.bills.nextActionHint') }}</p>
          </div>
          <div class="flex items-center gap-2.5">
            <button v-for="s in forwardTransitions" :key="s"
              @click="setStatus(s)" :disabled="acting"
              class="px-4 py-2.5 text-sm font-semibold transition-colors disabled:opacity-50
                     flex items-center gap-2"
              :class="forwardBtnClass(s)">
              <ArrowPathIcon v-if="acting" class="w-4 h-4 animate-spin" />
              <template v-else>{{ transitionLabel(s) }}</template>
            </button>
            <button v-for="s in cancelTransitions" :key="s"
              @click="setStatus(s)" :disabled="acting"
              class="px-4 py-2 text-sm font-medium border border-red-200 text-red-600
                     hover:bg-red-50 transition-colors disabled:opacity-50">
              {{ t('erp.bills.cancel') }}
            </button>
          </div>
        </div>

        <p v-if="error" class="text-xs text-red-600 print:hidden">{{ error }}</p>

        <AttachmentsPanel v-if="bill" ref-type="VendorBill" :ref-id="bill.id" class="print:hidden" />
        <ActivityTimeline v-if="bill" ref-type="VendorBill" :ref-id="bill.id" class="print:hidden" />
      </template>
    </div>

    <!-- Confirm dialog (replaces window.confirm) -->
    <Teleport to="body">
      <div v-if="confirmOpen" class="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 px-4 print:hidden">
        <div class="w-full max-w-sm bg-white shadow-2xl overflow-hidden">
          <div class="px-5 py-4 flex items-start gap-3">
            <div class="w-9 h-9 bg-red-100 flex items-center justify-center flex-shrink-0">
              <ExclamationCircleIcon class="w-5 h-5 text-red-600" />
            </div>
            <div class="flex-1 min-w-0">
              <p class="text-sm font-semibold text-[#1C2434]">{{ confirmTitle }}</p>
              <p v-if="confirmMessage" class="mt-1 text-[12px] text-[#637381] leading-snug">{{ confirmMessage }}</p>
            </div>
          </div>
          <div class="px-5 py-3 bg-[#F7F9FC] flex items-center justify-end gap-2">
            <button type="button" @click="confirmAnswer(false)"
              class="px-4 py-2 text-sm font-medium text-[#637381] hover:text-[#1C2434]">{{ t('common.cancel') }}</button>
            <button type="button" @click="confirmAnswer(true)"
              class="px-4 py-2 text-sm font-semibold bg-red-500 text-white hover:bg-red-600 shadow-sm">
              {{ confirmOkLabel }}
            </button>
          </div>
        </div>
      </div>
    </Teleport>
  </AppLayout>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter, RouterLink } from 'vue-router'
import { useI18n } from 'vue-i18n'
import {
  ArrowLeftIcon, ChevronRightIcon,
  CheckIcon, XMarkIcon, TrashIcon, PencilSquareIcon,
  ArrowPathIcon, ExclamationCircleIcon, PrinterIcon,
} from '@heroicons/vue/24/outline'
import AppLayout from '@/layouts/AppLayout.vue'
import AttachmentsPanel from '@/components/AttachmentsPanel.vue'
import ActivityTimeline from '@/components/ActivityTimeline.vue'
import DocCurrencyBadge from '@/components/DocCurrencyBadge.vue'
import KeyboardShortcuts from '@/components/KeyboardShortcuts.vue'
import { useDetailShortcuts } from '@/composables/useShortcuts'
import api from '@/api'
import { fmtDate, fmtMoney, numToWords } from '@/utils/fmt'
import { useAuthStore } from '@/stores/auth'

const { t, locale }   = useI18n()
const route   = useRoute()
const router  = useRouter()
const auth    = useAuthStore()

const bill    = ref(null)
const totalInWords = computed(() => bill.value ? numToWords(bill.value.total, locale.value, bill.value.currency) : '')
const loading = ref(true)

// ── Document helpers (mirror Invoice/Receipt tax-invoice layout) ──
const fillerRows = computed(() => Math.max(0, 8 - (bill.value?.items?.length || 0)))
const signatures = ['Prepared By', 'Approved By']
const acting  = ref(false)
const error   = ref('')

const capitalize = s => (s || '').charAt(0).toUpperCase() + (s || '').slice(1)

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

const { shortcuts } = useDetailShortcuts({
  enabled:   () => !loading.value && !!bill.value,
  canEdit:   () => bill.value?.status === 'draft',
  canRemove: () => bill.value?.status === 'draft',
  edit:   () => router.push(`/erp/purchasing/bills/${bill.value.id}/edit`),
  remove: () => confirmDelete(),
  print:  onPrint,
  back:   () => router.push('/erp/purchasing/bills'),
})

// ── Workflow ──────────────────────────────────────────────
const FLOW_STEPS = computed(() => [
  { key: 'draft',    label: t('erp.bills.statusDraft') },
  { key: 'approved', label: t('erp.bills.statusApproved') },
  { key: 'paid',     label: t('erp.bills.statusPaid') },
])
const COMPLETED_BEFORE = {
  draft:     [],
  approved:  ['draft'],
  paid:      ['draft', 'approved'],
  cancelled: [],
}
const TRANSITIONS = {
  draft:     ['approved', 'cancelled'],
  approved:  ['paid',     'cancelled'],
  paid:      [],
  cancelled: [],
}
const availableTransitions = computed(() => TRANSITIONS[bill.value?.status] || [])
const forwardTransitions   = computed(() => availableTransitions.value.filter(s => s !== 'cancelled'))
const cancelTransitions    = computed(() => availableTransitions.value.filter(s => s === 'cancelled'))
const isCancelled          = computed(() => bill.value?.status === 'cancelled')

function stepState(key) {
  const cur = bill.value?.status
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
  approved: 'bg-blue-600 text-white hover:bg-blue-700',
  paid:     'bg-green-600 text-white hover:bg-green-700',
}
function forwardBtnClass(s) { return FORWARD_BTN[s] || 'bg-primary-500 text-white hover:bg-primary-600' }

function transitionLabel(s) {
  if (s === 'approved') return t('erp.bills.approve')
  if (s === 'paid')     return t('erp.bills.markPaid')
  return s
}

// ── Status badge / stamp ──────────────────────────────────
const STATUS_BADGE = {
  draft:     'bg-[#F1F5F9] text-[#637381]',
  approved:  'bg-blue-50 text-blue-700',
  paid:      'bg-green-50 text-green-700',
  cancelled: 'bg-red-50 text-red-600',
}
const STATUS_DOT = {
  draft:     'bg-slate-400',
  approved:  'bg-blue-500',
  paid:      'bg-green-500',
  cancelled: 'bg-red-500',
}
function statusBadge(s) { return STATUS_BADGE[s] || STATUS_BADGE.draft }
function statusDot(s)   { return STATUS_DOT[s]   || STATUS_DOT.draft }

const stampLabel = computed(() => {
  const s = bill.value?.status
  if (s === 'draft')     return 'Draft'
  if (s === 'paid')      return 'Paid'
  if (s === 'cancelled') return 'Cancelled'
  return ''
})
const stampClass = computed(() => {
  const s = bill.value?.status
  if (s === 'paid')      return 'text-green-600 border-green-600'
  if (s === 'cancelled') return 'text-red-600 border-red-600'
  return 'text-[#1C2434] border-[#1C2434]'
})

// ── Data ──────────────────────────────────────────────────
onMounted(load)
async function load() {
  loading.value = true
  try {
    const { data } = await api.get(`/erp/purchasing/bills/${route.params.id}`)
    bill.value = data.data.bill
  } catch (err) {
    error.value = err.response?.data?.message || 'Failed to load'
  } finally { loading.value = false }
}

async function setStatus(status) {
  error.value = ''
  acting.value = true
  try {
    const { data } = await api.patch(`/erp/purchasing/bills/${route.params.id}/status`, { status })
    bill.value = data.data.bill
  } catch (err) {
    error.value = err.response?.data?.message || 'Action failed'
  } finally { acting.value = false }
}

// ── Custom confirm modal (replaces window.confirm) ──────────────────────
const confirmOpen    = ref(false)
const confirmTitle   = ref('')
const confirmMessage = ref('')
const confirmOkLabel = ref('OK')
let confirmResolver  = null
function confirmAsync({ title, message, okLabel } = {}) {
  confirmTitle.value   = title   || ''
  confirmMessage.value = message || ''
  confirmOkLabel.value = okLabel || 'OK'
  confirmOpen.value    = true
  return new Promise(resolve => { confirmResolver = resolve })
}
function confirmAnswer(ok) {
  confirmOpen.value = false
  if (confirmResolver) { confirmResolver(ok); confirmResolver = null }
}

async function confirmDelete() {
  const ok = await confirmAsync({
    title:   t('erp.bills.delete'),
    message: `Delete "${bill.value?.billNumber}"? This cannot be undone.`,
    okLabel: t('common.delete') || 'Delete',
  })
  if (!ok) return
  try {
    await api.delete(`/erp/purchasing/bills/${route.params.id}`)
    router.push('/erp/purchasing/bills')
  } catch (err) {
    error.value = err.response?.data?.message || 'Delete failed'
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
