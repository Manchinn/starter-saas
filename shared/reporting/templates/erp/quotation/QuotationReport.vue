<template>
  <!-- ── Quotation document (ใบเสนอราคา — receipt tax-invoice layout) ── -->
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
            <th class="border border-[#1C2434] px-2 py-2 text-left w-[80px]">{{ t('erp.quotations.colCode') }}</th>
            <th class="border border-[#1C2434] px-2 py-2 text-left w-[265px]">{{ t('erp.quotations.colItem') }}</th>
            <th class="border border-[#1C2434] px-2 py-2 text-right w-[59px]">{{ t('erp.quotations.colQty') }}</th>
            <th class="border border-[#1C2434] px-2 py-2 text-right w-[85px]">{{ t('erp.quotations.colUnitPrice') }}</th>
            <th class="border border-[#1C2434] px-2 py-2 text-right w-[64px]">{{ t('erp.quotations.tax') }} %</th>
            <th class="border border-[#1C2434] px-2 py-2 text-right w-[88px]">{{ t('erp.quotations.colTotal') }}</th>
          </tr>
        </thead>
        <tbody>
          <template v-for="(item, idx) in topLevelItems" :key="item.id || idx">
            <tr class="align-top">
              <td class="border-x border-b border-x-[#1C2434] border-b-[#E2E8F0] px-2 py-1.5 font-mono text-[11px] text-[#637381]">{{ itemCode(item) || '—' }}</td>
              <td class="border-x border-b border-x-[#1C2434] border-b-[#E2E8F0] px-2 py-1.5">
                <span class="text-[10px] text-[#1C2434]">{{ itemName(item) }}</span>
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
</template>

<script setup>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { fmtMoney, fmtDate, numToWords } from '@/utils/fmt'
import { useAuthStore } from '@/stores/auth'

const props = defineProps({
  // The quotation record (with customer, items, salesperson, totals, status, …).
  quotation: { type: Object, required: true },
  // Master-data payment-term options used to resolve a friendly label.
  paymentTerms: { type: Array, default: () => [] },
})

const { t, locale } = useI18n()
const auth = useAuthStore()

// Company profile from current organization (same pattern as OrderDetail)
const org = computed(() => auth.user?.organization || {})
const companyName    = computed(() => org.value.companyName || org.value.name || 'Your Company')
const companyAddress = computed(() => org.value.address || '')
const companyPhone   = computed(() => org.value.phone   || '')
const companyTaxId   = computed(() => org.value.taxId   || '')
const companyLogoSrc = computed(() => {
  const p = org.value.logoPath
  if (!p) return ''
  if (/^https?:\/\//i.test(p)) return p
  return p
})

const billingAddressDisplay = computed(() => props.quotation?.billingAddress || props.quotation?.customer?.address || '')

const totalInWords = computed(() => {
  if (!props.quotation) return ''
  return numToWords(props.quotation.total, locale.value, props.quotation.currency)
})

const topLevelItems = computed(() => (props.quotation?.items || []).filter(it => !it.parentItemId))
function childrenOf(parentId) {
  return (props.quotation?.items || []).filter(it => it.parentItemId === parentId)
}

// ── Document helpers (mirror Receipt tax-invoice layout) ──
const fillerRows    = computed(() => Math.max(0, 8 - (props.quotation?.items?.length || 0)))
const customerTaxId = computed(() => props.quotation?.customer?.taxId || '')
const vatRate       = computed(() => {
  const base = (Number(props.quotation?.subtotal) || 0) - (Number(props.quotation?.discountAmount) || 0)
  const tax  = Number(props.quotation?.tax) || 0
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

function paymentTermLabel(v) {
  if (!v) return '—'
  const hit = props.paymentTerms.find(opt => opt.code === v || opt.name === v)
  return hit?.name || v
}

const stampLabel = computed(() => {
  const s = props.quotation?.status
  if (s === 'draft')     return 'Draft'
  if (s === 'rejected')  return 'Rejected'
  if (s === 'converted') return 'Converted'
  return ''
})
const stampClass = computed(() => {
  const s = props.quotation?.status
  if (s === 'rejected')  return 'text-red-600 border-red-600'
  if (s === 'converted') return 'text-purple-600 border-purple-600'
  return 'text-[#1C2434] border-[#1C2434]'
})
</script>
