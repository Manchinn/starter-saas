<template>
  <AppLayout>
    <div class="space-y-5">

      <!-- Top action bar (hidden on print) -->
      <div class="flex items-start gap-3 print:hidden">
        <RouterLink to="/erp/quotations"
          class="mt-0.5 p-2 text-[#9BA7B0] hover:text-[#1C2434] hover:bg-white
                 border border-transparent hover:border-[#E2E8F0] transition-all flex-shrink-0">
          <ArrowLeftIcon class="w-[18px] h-[18px]" />
        </RouterLink>
        <div class="flex-1 min-w-0">
          <div class="flex items-center gap-2.5 flex-wrap">
            <h1 class="text-xl font-bold text-[#1C2434]">
              {{ loading ? '…' : (quotation?.refNo || t('erp.quotations.detail')) }}
            </h1>
            <span v-if="quotation && !loading"
              class="inline-flex items-center gap-1.5 px-2.5 py-0.5 text-[11px] font-semibold capitalize"
              :class="statusBadge(quotation.status)">
              <span class="w-1.5 h-1.5" :class="statusDot(quotation.status)"></span>
              {{ t('erp.quotations.' + quotation.status) }}
            </span>
            <DocCurrencyBadge v-if="quotation" :currency="quotation.currency" :exchange-rate="quotation.exchangeRate" :total="quotation.total" />
          </div>
          <nav class="flex items-center gap-1.5 mt-1">
            <RouterLink to="/erp/quotations" class="text-[12px] text-[#9BA7B0] hover:text-[#637381] transition-colors">
              {{ t('erp.quotations.title') }}
            </RouterLink>
            <ChevronRightIcon class="w-3 h-3 text-[#CBD5E1]" />
            <span class="text-[12px] text-[#637381]">{{ quotation?.refNo || '…' }}</span>
          </nav>
        </div>
        <!-- Quick actions -->
        <div v-if="quotation && !loading" class="flex items-center gap-2 flex-shrink-0">
          <KeyboardShortcuts :shortcuts="shortcuts" width="w-56" />
          <button @click="onPrint" type="button"
            :title="t('erp.quotations.printDocument')"
            class="inline-flex items-center gap-1.5 px-3 py-2 text-[12px] font-semibold
                   text-[#637381] bg-white border border-[#E2E8F0] hover:bg-[#F7F9FC] hover:text-[#1C2434] transition-colors">
            <PrinterIcon class="w-4 h-4" />
            {{ t('common.print') }}
          </button>
          <RouterLink v-if="quotation.status === 'draft'" v-can="'erp.quotations.edit'" :to="`/erp/quotations/${quotation.id}/edit`"
            class="inline-flex items-center gap-1.5 px-3 py-2 text-[12px] font-semibold
                   text-primary-600 bg-primary-50 hover:bg-primary-100 border border-primary-200 transition-colors">
            <PencilSquareIcon class="w-4 h-4" />
            {{ t('common.edit') }}
          </RouterLink>
          <button v-if="quotation.status === 'draft'" v-can="'erp.quotations.delete'" @click="confirmDelete" type="button"
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
        <span>{{ t('erp.quotations.notFound') }}
          <RouterLink to="/erp/quotations" class="underline ml-1">{{ t('erp.common.backToList') }}</RouterLink>
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
            <span v-if="isRejected" class="ml-2 inline-flex items-center gap-1.5 px-2.5 py-1 bg-red-50 text-red-600">
              <XMarkIcon class="w-3.5 h-3.5" />
              <span class="text-[12px] font-semibold">{{ t('erp.quotations.rejected') }}</span>
            </span>
          </div>
        </div>

        <!-- Document — quotation (ใบเสนอราคา) -->
        <article class="relative mx-auto bg-white border border-[#E2E8F0] shadow-card max-w-[186mm] w-full
                        print:border-0 print:shadow-none print:max-w-none print:mx-0
                        overflow-hidden">

          <!-- DRAFT / REJECTED / CONVERTED stamp -->
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
                    <p v-if="companyPhone">{{ t('erp.quotations.docPhoneAbbr') }} {{ companyPhone }}</p>
                    <p v-if="companyTaxId" class="tabular-nums">
                      {{ t('erp.quotations.docTaxId') }} {{ companyTaxId }}
                    </p>
                  </div>
                </div>
              </div>
              <div class="text-right flex-shrink-0">
                <h2 class="text-[18px] font-bold text-[#1C2434] leading-tight">{{ t('erp.quotations.documentTitle') }}</h2>
                <p class="text-[11px] text-[#9BA7B0] mt-1">({{ t('erp.quotations.docOriginal') }})</p>
              </div>
            </header>

            <!-- Customer + meta boxes -->
            <div class="mt-5 grid grid-cols-1 sm:grid-cols-2 border border-[#1C2434]">
              <div class="p-3 border-b sm:border-b-0 sm:border-r border-[#1C2434] text-[12px] space-y-1.5">
                <div class="grid grid-cols-[78px_1fr] gap-x-2">
                  <span class="text-[#637381]">{{ t('erp.quotations.docCustomerCode') }}</span>
                  <span class="font-medium text-[#1C2434]">{{ quotation.customer?.code || '—' }}</span>
                </div>
                <div class="grid grid-cols-[78px_1fr] gap-x-2">
                  <span class="text-[#637381]">{{ t('erp.quotations.docCustomerName') }}</span>
                  <span class="font-semibold text-[#1C2434]">{{ quotation.customer?.company || quotation.customer?.name || '—' }}</span>
                </div>
                <div class="grid grid-cols-[78px_1fr] gap-x-2">
                  <span class="text-[#637381]">{{ t('erp.quotations.docAddress') }}</span>
                  <span class="text-[#1C2434] whitespace-pre-line leading-snug">{{ billingAddressDisplay || '—' }}</span>
                </div>
              </div>
              <div class="p-3 text-[12px] space-y-1.5">
                <div class="grid grid-cols-[124px_1fr] gap-x-2">
                  <span class="text-[#637381]">{{ t('erp.quotations.docTaxId') }}</span>
                  <span class="font-medium text-[#1C2434] tabular-nums">{{ customerTaxId || '—' }}</span>
                </div>
                <div class="grid grid-cols-[124px_1fr] gap-x-2">
                  <span class="text-[#637381]">{{ t('erp.quotations.docQuotationNo') }}</span>
                  <span class="font-bold text-[#1C2434] tabular-nums">{{ quotation.refNo }}</span>
                </div>
                <div class="grid grid-cols-[124px_1fr] gap-x-2">
                  <span class="text-[#637381]">{{ t('erp.quotations.docDate') }}</span>
                  <span class="font-medium text-[#1C2434] tabular-nums">{{ fmtDate(quotation.quotationDate) || '—' }}</span>
                </div>
                <div class="grid grid-cols-[124px_1fr] gap-x-2">
                  <span class="text-[#637381]">{{ t('erp.quotations.docValidUntil') }}</span>
                  <span class="font-medium text-[#1C2434] tabular-nums">{{ fmtDate(quotation.validUntil) || '—' }}</span>
                </div>
                <div v-if="quotation.referenceNumber" class="grid grid-cols-[124px_1fr] gap-x-2">
                  <span class="text-[#637381]">{{ t('erp.quotations.docPO') }}</span>
                  <span class="font-medium text-[#1C2434]">{{ quotation.referenceNumber }}</span>
                </div>
              </div>
            </div>

            <!-- Line items -->
            <table class="w-full mt-4 border-collapse text-[12px] table-fixed">
              <thead>
                <tr class="bg-[#FAFBFD] text-[10px] font-bold text-[#1C2434] uppercase tracking-wide">
                  <th class="border border-[#1C2434] px-2 py-2 text-left w-[13%]">{{ t('erp.quotations.colCode') }}</th>
                  <th class="border border-[#1C2434] px-2 py-2 text-left w-[39%]">{{ t('erp.quotations.colItem') }}</th>
                  <th class="border border-[#1C2434] px-2 py-2 text-right w-[10%]">{{ t('erp.quotations.colQty') }}</th>
                  <th class="border border-[#1C2434] px-2 py-2 text-right w-[15%]">{{ t('erp.quotations.colUnitPrice') }}</th>
                  <th class="border border-[#1C2434] px-2 py-2 text-right w-[10%]">{{ t('erp.quotations.tax') }} %</th>
                  <th class="border border-[#1C2434] px-2 py-2 text-right w-[13%]">{{ t('erp.quotations.colTotal') }}</th>
                </tr>
              </thead>
              <tbody>
                <template v-for="(item, idx) in topLevelItems" :key="item.id || idx">
                  <tr class="align-top">
                    <td class="border-x border-b border-x-[#1C2434] border-b-[#E2E8F0] px-2 py-1.5 font-mono text-[11px] text-[#637381]">{{ itemCode(item) || '—' }}</td>
                    <td class="border-x border-b border-x-[#1C2434] border-b-[#E2E8F0] px-2 py-1.5">
                      <span class="text-[#1C2434]">{{ itemName(item) }}</span>
                    </td>
                    <td class="border-x border-b border-x-[#1C2434] border-b-[#E2E8F0] px-2 py-1.5 text-right tabular-nums text-[#374151]">{{ fmtQty(item.quantity) }}</td>
                    <td class="border-x border-b border-x-[#1C2434] border-b-[#E2E8F0] px-2 py-1.5 text-right tabular-nums text-[#374151]">{{ fmtMoney(item.unitPrice) }}</td>
                    <td class="border-x border-b border-x-[#1C2434] border-b-[#E2E8F0] px-2 py-1.5 text-right tabular-nums text-[#374151]">{{ Number(item.taxRate || 0) }}%</td>
                    <td class="border-x border-b border-x-[#1C2434] border-b-[#E2E8F0] px-2 py-1.5 text-right tabular-nums font-medium text-[#1C2434]">{{ fmtMoney(lineAmount(item)) }}</td>
                  </tr>
                  <tr v-for="child in childrenOf(item.id)" :key="child.id" class="align-top text-[11px]">
                    <td class="border-x border-b border-x-[#1C2434] border-b-[#E2E8F0] px-2 py-1 font-mono text-[10px] text-[#9BA7B0]">{{ itemCode(child) || '—' }}</td>
                    <td colspan="5" class="border-x border-b border-x-[#1C2434] border-b-[#E2E8F0] px-2 py-1 pl-6 text-[#637381]">
                      <span class="text-[#CBD5E1] mr-1.5">↳</span>{{ child.productName }}
                      <span class="text-[10px] font-semibold text-[#9BA7B0] tabular-nums ml-2">× {{ child.quantity }}</span>
                    </td>
                  </tr>
                </template>
                <!-- filler rows keep the goods area tall like a printed form -->
                <tr v-for="n in fillerRows" :key="'filler-' + n" class="h-[26px]">
                  <td class="border-x border-[#1C2434]"></td>
                  <td class="border-x border-[#1C2434]"></td>
                  <td class="border-x border-[#1C2434]"></td>
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
                  <div v-if="paymentTermLabel(quotation.paymentTerms) !== '—'" class="grid grid-cols-[96px_1fr] gap-x-2">
                    <span class="text-[#9BA7B0]">{{ t('erp.quotations.paymentTerms') }}</span>
                    <span>{{ paymentTermLabel(quotation.paymentTerms) }}</span>
                  </div>
                  <div v-if="quotation.salesperson?.name" class="grid grid-cols-[96px_1fr] gap-x-2">
                    <span class="text-[#9BA7B0]">{{ t('erp.quotations.salesperson') }}</span>
                    <span>{{ quotation.salesperson.name }}</span>
                  </div>
                  <p v-for="(term, i) in docTerms" :key="'t' + i" class="leading-snug">- {{ term }}</p>
                  <p v-if="quotation.notes" class="leading-snug whitespace-pre-line">- {{ quotation.notes }}</p>
                </div>
              </div>
              <div class="w-[241px] flex-shrink-0 border-l border-[#1C2434] text-[12px]">
                <div class="flex items-center justify-between px-3 pt-[7px] pb-[9px] border-b border-[#1C2434]">
                  <span class="text-[#637381]">{{ t('erp.quotations.subtotal') }}</span>
                  <span class="tabular-nums text-[#1C2434]">{{ fmtMoney(quotation.subtotal) }}</span>
                </div>
                <div v-if="Number(quotation.discountAmount) > 0" class="flex items-center justify-between px-3 py-1.5 border-b border-[#1C2434]">
                  <span class="text-[#637381]">{{ t('erp.quotations.discount') }}</span>
                  <span class="tabular-nums text-[#1C2434]">−{{ fmtMoney(quotation.discountAmount) }}</span>
                </div>
                <div class="flex items-center justify-between px-3 py-1.5 border-b border-[#1C2434]">
                  <span class="text-[#637381]">{{ t('erp.quotations.docVat') }} {{ vatRate }}%</span>
                  <span class="tabular-nums text-[#1C2434]">{{ fmtMoney(quotation.tax) }}</span>
                </div>
                <div class="flex items-center justify-between px-3 py-2 bg-[#FAFBFD]">
                  <span class="font-bold text-[#1C2434]">{{ t('erp.quotations.docNetTotal') }}</span>
                  <span class="font-extrabold text-[#1C2434] tabular-nums">{{ fmtMoney(quotation.total) }}</span>
                </div>
              </div>
            </div>

            <!-- Signatures -->
            <div class="grid grid-cols-3 gap-8 mt-12 px-2">
              <div v-for="(sig, i) in signatures" :key="'sig' + i" class="text-center">
                <div class="border-b border-dotted border-[#1C2434] h-8"></div>
                <p class="text-[11px] text-[#637381] mt-1.5">{{ sig }}</p>
                <p class="text-[10px] text-[#9BA7B0] mt-2">{{ t('erp.quotations.docDate') }} ......./......./.......</p>
              </div>
            </div>
          </div>
        </article>

        <!-- Status transitions -->
        <div v-can="'erp.quotations.edit'" v-if="forwardTransitions.length || cancelTransitions.length"
          class="bg-white border border-[#E2E8F0] shadow-card px-5 py-4 print:hidden
                 flex items-center justify-between flex-wrap gap-3">
          <div>
            <p class="text-[11px] font-semibold text-[#9BA7B0] uppercase tracking-wider">
              {{ t('erp.quotations.nextAction') }}
            </p>
            <p class="text-[13px] text-[#637381] mt-0.5">
              {{ t('erp.quotations.nextActionHint') }}
            </p>
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
              {{ t('erp.quotations.markRejected') }}
            </button>
          </div>
        </div>
        <p v-if="statusError" class="text-xs text-red-600 print:hidden">{{ statusError }}</p>

        <!-- Convert to Sales Order (accepted only) / linked-order indicator -->
        <div v-if="quotation.status === 'accepted' || quotation.convertedToOrderId"
          class="bg-white border border-[#E2E8F0] shadow-card px-5 py-4 print:hidden
                 flex items-center flex-wrap gap-3">
          <p class="text-[11px] font-semibold text-[#9BA7B0] uppercase tracking-wider mr-2">
            {{ t('erp.quotations.convertActions') }}
          </p>
          <button v-can="'erp.orders.edit'" v-if="quotation.status === 'accepted' && !quotation.convertedToOrderId"
            @click="convertToOrder"
            :disabled="converting"
            class="flex items-center gap-1.5 px-4 py-2 text-sm font-medium bg-primary-50 text-primary-600 border border-primary-200
                   hover:bg-primary-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
            <ArrowRightIcon class="w-4 h-4" />
            {{ converting ? t('erp.common.saving') : t('erp.quotations.convertToOrder') }}
          </button>
          <RouterLink v-if="quotation.convertedToOrderId" :to="`/erp/orders/${quotation.convertedToOrderId}`"
            class="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-blue-50 text-blue-700 hover:bg-blue-100">
            <ArrowRightIcon class="w-3.5 h-3.5" />
            {{ t('erp.quotations.viewOrder') }}
          </RouterLink>
          <span v-if="convertError" class="self-center text-xs text-red-600">{{ convertError }}</span>
        </div>

        <ActivityTimeline v-if="quotation" ref-type="Quotation" :ref-id="quotation.id" class="print:hidden" />
      </template>
    </div>
  </AppLayout>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { RouterLink, useRoute, useRouter } from 'vue-router'
import ActivityTimeline from '@/components/ActivityTimeline.vue'
import DocCurrencyBadge from '@/components/DocCurrencyBadge.vue'
import KeyboardShortcuts from '@/components/KeyboardShortcuts.vue'
import { useDetailShortcuts } from '@/composables/useShortcuts'
import {
  ArrowLeftIcon, ChevronRightIcon, ArrowRightIcon,
  CheckIcon, XMarkIcon, TrashIcon, PencilSquareIcon,
  ArrowPathIcon, ExclamationCircleIcon, PrinterIcon,
} from '@heroicons/vue/24/outline'
import AppLayout from '@/layouts/AppLayout.vue'
import api from '@/api'
import { fmtMoney, fmtDate, numToWords } from '@/utils/fmt'
import { useAuthStore } from '@/stores/auth'

const { t, locale } = useI18n()
const route    = useRoute()
const router   = useRouter()
const auth     = useAuthStore()

const quotation      = ref(null)
const loading        = ref(true)
const notFound       = ref(false)
const updatingStatus = ref(false)
const statusError    = ref('')
const converting     = ref(false)
const convertError   = ref('')

const { shortcuts } = useDetailShortcuts({
  enabled: () => !loading.value && !!quotation.value,
  canEdit: () => quotation.value?.status === 'draft',
  edit:  () => router.push(`/erp/quotations/${quotation.value.id}/edit`),
  print: onPrint,
  back:  () => router.push('/erp/quotations'),
})

// Company profile from auth.user.organization, mirrors Order detail.
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

const billingAddressDisplay = computed(() => quotation.value?.billingAddress || quotation.value?.customer?.address || '')

const totalInWords = computed(() => {
  if (!quotation.value) return ''
  return numToWords(quotation.value.total, locale.value, quotation.value.currency)
})

const topLevelItems = computed(() => (quotation.value?.items || []).filter(it => !it.parentItemId))
function childrenOf(parentId) {
  return (quotation.value?.items || []).filter(it => it.parentItemId === parentId)
}

// ── Document helpers (mirror Receipt tax-invoice layout) ──
const fillerRows    = computed(() => Math.max(0, 8 - (quotation.value?.items?.length || 0)))
const customerTaxId = computed(() => quotation.value?.customer?.taxId || '')
const vatRate       = computed(() => {
  const base = (Number(quotation.value?.subtotal) || 0) - (Number(quotation.value?.discountAmount) || 0)
  const tax  = Number(quotation.value?.tax) || 0
  if (base > 0 && tax > 0) return Math.round((tax / base) * 100)
  return 7
})
const docTerms   = computed(() => [t('erp.quotations.docTerm1'), t('erp.quotations.docTerm2')])
const signatures = computed(() => [
  t('erp.quotations.docPreparedBy'),
  t('erp.quotations.docApprovedBy'),
  t('erp.quotations.docCustomerSignature'),
])

function lineAmount(item) {
  return (Number(item.quantity) || 0) * (Number(item.unitPrice) || 0)
}
function fmtQty(q) {
  return (Number(q) || 0).toLocaleString(undefined, { maximumFractionDigits: 3 })
}

function itemCode(item) {
  if (item.salePackageId) return item.salePackage?.code || ''
  return item.saleItem?.code || item.product?.sku || ''
}
function itemName(item) {
  if (item.salePackageId) {
    const code = item.salePackage?.code
    const name = item.productName || ''
    if (code && name.endsWith(` (${code})`)) return name.slice(0, -(` (${code})`).length)
    return name
  }
  return item.productName || ''
}

function onPrint() { window.print() }

// ── Workflow ──────────────────────────────────────────────
const FLOW_STEPS = [
  { key: 'draft',     label: 'Draft' },
  { key: 'sent',      label: 'Sent' },
  { key: 'accepted',  label: 'Accepted' },
  { key: 'converted', label: 'Converted' },
]
const COMPLETED_BEFORE = {
  draft:     [],
  sent:      ['draft'],
  accepted:  ['draft', 'sent'],
  converted: ['draft', 'sent', 'accepted'],
  rejected:  ['draft', 'sent'],
}
const TRANSITIONS = {
  draft:     ['sent'],
  sent:      ['accepted', 'rejected'],
  accepted:  [],
  converted: [],
  rejected:  ['draft'],
}

const availableTransitions = computed(() => TRANSITIONS[quotation.value?.status] || [])
const forwardTransitions   = computed(() => availableTransitions.value.filter(s => s !== 'rejected'))
const cancelTransitions    = computed(() => availableTransitions.value.filter(s => s === 'rejected'))
const isRejected           = computed(() => quotation.value?.status === 'rejected')

function stepState(key) {
  const cur = quotation.value?.status
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
  sent:      'bg-blue-600 text-white hover:bg-blue-700',
  accepted:  'bg-green-600 text-white hover:bg-green-700',
}
function forwardBtnClass(s) { return FORWARD_BTN[s] || 'bg-primary-500 text-white hover:bg-primary-600' }

const TRANSITION_LABELS = {
  sent:      'Mark as Sent',
  accepted:  'Mark as Accepted',
  rejected:  'Mark as Rejected',
  draft:     'Back to Draft',
}
function transitionLabel(s) { return TRANSITION_LABELS[s] || s }

const STATUS_BADGE = {
  draft:     'bg-[#F1F5F9] text-[#637381]',
  sent:      'bg-blue-50 text-blue-700',
  accepted:  'bg-green-50 text-green-700',
  rejected:  'bg-red-50 text-red-600',
  converted: 'bg-purple-50 text-purple-700',
}
const STATUS_DOT = {
  draft:     'bg-slate-400',
  sent:      'bg-blue-500',
  accepted:  'bg-green-500',
  rejected:  'bg-red-500',
  converted: 'bg-purple-500',
}
function statusBadge(s) { return STATUS_BADGE[s] || STATUS_BADGE.draft }
function statusDot(s)   { return STATUS_DOT[s]   || STATUS_DOT.draft }

const stampLabel = computed(() => {
  const s = quotation.value?.status
  if (s === 'draft')     return 'Draft'
  if (s === 'rejected')  return 'Rejected'
  if (s === 'converted') return 'Converted'
  return ''
})
const stampClass = computed(() => {
  const s = quotation.value?.status
  if (s === 'rejected')  return 'text-red-600 border-red-600'
  if (s === 'converted') return 'text-purple-600 border-purple-600'
  return 'text-[#1C2434] border-[#1C2434]'
})

// ── Data ──────────────────────────────────────────────────
onMounted(fetchQuotation)

async function fetchQuotation() {
  loading.value = true
  try {
    const { data } = await api.get(`/erp/quotations/${route.params.id}`)
    quotation.value = data.data.quotation
  } catch {
    notFound.value = true
  } finally {
    loading.value = false
  }
}

async function changeStatus(status) {
  statusError.value    = ''
  updatingStatus.value = true
  try {
    const { data } = await api.patch(`/erp/quotations/${quotation.value.id}/status`, { status })
    quotation.value = data.data.quotation
  } catch (err) {
    statusError.value = err.response?.data?.message || 'Failed to update status'
  } finally {
    updatingStatus.value = false
  }
}

async function convertToOrder() {
  convertError.value = ''
  converting.value   = true
  try {
    const { data } = await api.post(`/erp/quotations/${quotation.value.id}/convert`)
    if (data.data?.orderId) {
      router.push(`/erp/orders/${data.data.orderId}`)
    } else {
      await fetchQuotation()
    }
  } catch (err) {
    convertError.value = err.response?.data?.message || 'Failed to convert'
  } finally {
    converting.value = false
  }
}

async function confirmDelete() {
  if (!confirm(`Delete quotation ${quotation.value.refNo}? This cannot be undone.`)) return
  try {
    await api.delete(`/erp/quotations/${quotation.value.id}`)
    router.push('/erp/quotations')
  } catch (err) {
    statusError.value = err.response?.data?.message || 'Delete failed'
  }
}

// Payment-terms labels come from master-data.
const paymentTerms = ref([])
onMounted(async () => {
  try {
    const { data } = await api.get('/erp/master-data/payment-terms')
    paymentTerms.value = data.data.values || []
  } catch { /* lookup failed — labels fall back to raw stored value */ }
})
function paymentTermLabel(v) {
  if (!v) return '—'
  const hit = paymentTerms.value.find(opt => opt.code === v || opt.name === v)
  return hit?.name || v
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
