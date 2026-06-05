<template>
  <!-- ── Tax-invoice / receipt document (ใบกำกับภาษี / ใบเสร็จรับเงิน) ─── -->
  <article class="relative mx-auto bg-white border border-[#E2E8F0] shadow-card max-w-[186mm] w-full
                  print:border-0 print:shadow-none print:max-w-none print:mx-0
                  overflow-hidden">

    <!-- DRAFT / CONFIRMED / CANCELLED stamp -->
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
              <p v-if="companyPhone">{{ t('erp.receipts.docTel') }} {{ companyPhone }}</p>
              <p v-if="companyTaxId" class="tabular-nums">
                {{ t('erp.receipts.docTaxId') }} {{ companyTaxId }}
              </p>
            </div>
          </div>
        </div>
        <div class="text-right flex-shrink-0">
          <h2 class="text-[18px] font-bold text-[#1C2434] leading-tight">{{ t('erp.receipts.documentTitle') }}</h2>
          <p class="text-[11px] text-[#9BA7B0] mt-1">({{ t('erp.receipts.docOriginal') }})</p>
        </div>
      </header>

      <!-- Customer + meta boxes -->
      <div class="mt-5 grid grid-cols-1 sm:grid-cols-2 border border-[#1C2434]">
        <div class="p-3 border-b sm:border-b-0 sm:border-r border-[#1C2434] text-[12px] space-y-1.5">
          <div class="grid grid-cols-[78px_1fr] gap-x-2">
            <span class="text-[#637381]">{{ t('erp.receipts.docCustomerCode') }}</span>
            <span class="font-medium text-[#1C2434]">{{ receipt.customer?.code || '—' }}</span>
          </div>
          <div class="grid grid-cols-[78px_1fr] gap-x-2">
            <span class="text-[#637381]">{{ t('erp.receipts.docCustomerName') }}</span>
            <span class="font-semibold text-[#1C2434]">{{ receipt.customer?.company || receipt.customer?.name || '—' }}</span>
          </div>
          <div class="grid grid-cols-[78px_1fr] gap-x-2">
            <span class="text-[#637381]">{{ t('erp.receipts.docAddress') }}</span>
            <span class="text-[#1C2434] whitespace-pre-line leading-snug">{{ receipt.customer?.address || '—' }}</span>
          </div>
        </div>
        <div class="p-3 text-[12px] space-y-1.5">
          <div class="grid grid-cols-[124px_1fr] gap-x-2">
            <span class="text-[#637381]">{{ t('erp.receipts.docTaxId') }}</span>
            <span class="font-medium text-[#1C2434] tabular-nums">{{ customerTaxId || '—' }}</span>
          </div>
          <div class="grid grid-cols-[124px_1fr] gap-x-2">
            <span class="text-[#637381]">{{ t('erp.receipts.docBranch') }}</span>
            <span class="text-[#1C2434]">{{ t('erp.receipts.docBranchHead') }}</span>
          </div>
          <div class="grid grid-cols-[124px_1fr] gap-x-2">
            <span class="text-[#637381]">{{ t('erp.receipts.docReceiptNo') }}</span>
            <span class="font-bold text-[#1C2434] tabular-nums">{{ receipt.receiptNumber }}</span>
          </div>
          <div class="grid grid-cols-[124px_1fr] gap-x-2">
            <span class="text-[#637381]">{{ t('erp.receipts.docDate') }}</span>
            <span class="font-medium text-[#1C2434] tabular-nums">{{ fmtDate(receipt.receiptDate) || '—' }}</span>
          </div>
        </div>
      </div>

      <!-- Line items -->
      <table class="w-full mt-4 border-collapse text-[12px] table-fixed">
        <thead>
          <tr class="bg-[#FAFBFD] text-[10px] font-bold text-[#1C2434] uppercase tracking-wide">
            <th class="border border-[#1C2434] px-2 py-2 text-left w-[12%]">{{ t('erp.receipts.colItemCode') }}</th>
            <th class="border border-[#1C2434] px-2 py-2 text-left w-[34%]">{{ t('erp.receipts.colDescription') }}</th>
            <th class="border border-[#1C2434] px-2 py-2 text-center w-[8%]">{{ t('erp.receipts.colUnit') }}</th>
            <th class="border border-[#1C2434] px-2 py-2 text-right w-[9%]">{{ t('erp.receipts.colQty') }}</th>
            <th class="border border-[#1C2434] px-2 py-2 text-right w-[13%]">{{ t('erp.receipts.colUnitPrice') }}</th>
            <th class="border border-[#1C2434] px-2 py-2 text-right w-[10%]">{{ t('erp.receipts.colDiscount') }}</th>
            <th class="border border-[#1C2434] px-2 py-2 text-right w-[14%]">{{ t('erp.receipts.colLineAmount') }}</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(item, idx) in lineItems" :key="item.id || idx" class="align-top">
            <td class="border-x border-b border-x-[#1C2434] border-b-[#E2E8F0] px-2 py-1.5 font-mono text-[11px] text-[#637381]">{{ itemCode(item) || '—' }}</td>
            <td class="border-x border-b border-x-[#1C2434] border-b-[#E2E8F0] px-2 py-1.5">
              <span class="text-[#1C2434]">{{ itemName(item) }}</span>
              <span v-if="item.description" class="block text-[11px] text-[#9BA7B0]">{{ item.description }}</span>
            </td>
            <td class="border-x border-b border-x-[#1C2434] border-b-[#E2E8F0] px-2 py-1.5 text-center text-[#374151]">{{ item.unit || '—' }}</td>
            <td class="border-x border-b border-x-[#1C2434] border-b-[#E2E8F0] px-2 py-1.5 text-right tabular-nums text-[#374151]">{{ fmtQty(item.quantity) }}</td>
            <td class="border-x border-b border-x-[#1C2434] border-b-[#E2E8F0] px-2 py-1.5 text-right tabular-nums text-[#374151]">{{ fmtMoney(item.unitPrice) }}</td>
            <td class="border-x border-b border-x-[#1C2434] border-b-[#E2E8F0] px-2 py-1.5 text-right tabular-nums text-[#374151]">{{ Number(item.discount) ? fmtMoney(item.discount) : '' }}</td>
            <td class="border-x border-b border-x-[#1C2434] border-b-[#E2E8F0] px-2 py-1.5 text-right tabular-nums font-medium text-[#1C2434]">{{ fmtMoney(lineAmount(item)) }}</td>
          </tr>
          <!-- filler rows keep the goods area tall like a printed form -->
          <tr v-for="n in fillerRows" :key="'filler-' + n" class="h-[26px]">
            <td class="border-x border-[#1C2434]"></td>
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
          <div class="p-3 text-[11px] text-[#374151]">
            <p v-for="(term, i) in docTerms" :key="'t' + i" class="leading-snug mt-1 first:mt-0">- {{ term }}</p>
            <p v-if="receipt.notes" class="leading-snug mt-1 whitespace-pre-line">- {{ receipt.notes }}</p>
          </div>
        </div>
        <div class="w-[241px] flex-shrink-0 border-l border-[#1C2434] text-[12px]">
          <div class="flex items-center justify-between px-3 pt-[7px] pb-[9px] border-b border-[#1C2434]">
            <span class="text-[#637381]">{{ t('erp.receipts.docGoodsTotal') }}</span>
            <span class="tabular-nums text-[#1C2434]">{{ fmtMoney(goodsTotal) }}</span>
          </div>
          <div class="flex items-center justify-between px-3 py-1.5 border-b border-[#1C2434]">
            <span class="text-[#637381]">{{ t('erp.receipts.docExtraDiscount') }}</span>
            <span class="tabular-nums text-[#1C2434]">{{ discountAmount > 0 ? '−' : '' }}{{ fmtMoney(discountAmount) }}</span>
          </div>
          <div class="flex items-center justify-between px-3 py-1.5 border-b border-[#1C2434]">
            <span class="text-[#637381]">{{ t('erp.receipts.docVat') }} {{ vatRate }}%</span>
            <span class="tabular-nums text-[#1C2434]">{{ fmtMoney(vatAmount) }}</span>
          </div>
          <div class="flex items-center justify-between px-3 py-2 bg-[#FAFBFD]">
            <span class="font-bold text-[#1C2434]">{{ t('erp.receipts.docNetTotal') }}</span>
            <span class="font-extrabold text-[#1C2434] tabular-nums">{{ fmtMoney(netTotal) }}</span>
          </div>
        </div>
      </div>

      <!-- Signatures -->
      <div class="grid grid-cols-3 gap-8 mt-12 px-2">
        <div v-for="(sig, i) in signatures" :key="'sig' + i" class="text-center">
          <div class="border-b border-dotted border-[#1C2434] h-8"></div>
          <p class="text-[11px] text-[#637381] mt-1.5">{{ sig }}</p>
          <p class="text-[10px] text-[#9BA7B0] mt-2">{{ t('erp.receipts.docDate') }} ......./......./.......</p>
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
  receipt: { type: Object, required: true },
})

const { t, locale } = useI18n()
const auth = useAuthStore()

const org = computed(() => auth.user?.organization || {})
const companyName    = computed(() => org.value.companyName || org.value.name || 'Your Company')
const companyAddress = computed(() => org.value.address  || '')
const companyPhone   = computed(() => org.value.phone    || '')
const companyTaxId   = computed(() => org.value.taxId    || '')
const companyLogoSrc = computed(() => {
  const p = org.value.logoPath
  if (!p) return ''
  if (/^https?:\/\//i.test(p)) return p
  return p
})

// Render the linked invoice's goods + totals; fall back to a single payment
// line when the receipt isn't tied to an invoice (manual payment).
const inv        = computed(() => props.receipt?.invoice || null)
const rawItems   = computed(() => (inv.value?.items || []).filter(it => !it.parentItemId))
const lineItems  = computed(() => {
  if (rawItems.value.length) return rawItems.value
  if (!props.receipt) return []
  return [{
    id: 'payment',
    productName: props.receipt.notes || methodLabel(props.receipt.paymentMethod),
    quantity: 1,
    unitPrice: Number(props.receipt.amount) || 0,
  }]
})

const fillerRows     = computed(() => Math.max(0, 8 - lineItems.value.length))
const discountAmount = computed(() => Number(inv.value?.discountAmount) || 0)
const goodsTotal     = computed(() => inv.value ? Number(inv.value.subtotal) || 0 : Number(props.receipt?.amount) || 0)
const vatAmount      = computed(() => inv.value ? Number(inv.value.tax) || 0 : 0)
const netTotal       = computed(() => inv.value ? Number(inv.value.total) || 0 : Number(props.receipt?.amount) || 0)
const vatRate        = computed(() => {
  const base = goodsTotal.value - discountAmount.value
  if (base > 0 && vatAmount.value > 0) return Math.round((vatAmount.value / base) * 100)
  return 7
})
const customerTaxId = computed(() => props.receipt?.customer?.taxId || '')
const totalInWords  = computed(() =>
  props.receipt ? numToWords(netTotal.value, locale.value, props.receipt.currency) : ''
)
const docTerms   = computed(() => [t('erp.receipts.docTerm1'), t('erp.receipts.docTerm2')])
const signatures = computed(() => [
  t('erp.receipts.docReceiver'), t('erp.receipts.docSender'), t('erp.receipts.docManager'),
])

function lineAmount(item) {
  return (Number(item.quantity) || 0) * (Number(item.unitPrice) || 0)
}
function fmtQty(q) {
  return (Number(q) || 0).toLocaleString(undefined, { maximumFractionDigits: 3 })
}
function itemCode(item) {
  if (item.itemCode) return item.itemCode
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
function methodLabel(m) {
  const labels = {
    cash:          t('erp.receipts.cash'),
    bank_transfer: t('erp.receipts.bankTransfer'),
    cheque:        t('erp.receipts.cheque'),
    credit_card:   t('erp.receipts.creditCard'),
    other:         t('erp.receipts.other'),
  }
  return labels[m] || m || '—'
}

const stampLabel = computed(() => {
  const s = props.receipt?.status
  if (s === 'draft')     return 'Draft'
  if (s === 'confirmed') return 'Paid'
  if (s === 'cancelled') return 'Cancelled'
  return ''
})
const stampClass = computed(() => {
  const s = props.receipt?.status
  if (s === 'cancelled') return 'text-red-600 border-red-600'
  if (s === 'confirmed') return 'text-green-600 border-green-600'
  return 'text-[#1C2434] border-[#1C2434]'
})
</script>
