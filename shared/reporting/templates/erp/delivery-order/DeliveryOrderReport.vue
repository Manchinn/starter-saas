<template>
  <!-- ── Delivery-order document (receipt layout) ─────────── -->
  <article class="relative mx-auto bg-white border border-[#E2E8F0] shadow-card max-w-[186mm] w-full
                  print:border-0 print:shadow-none print:max-w-none print:mx-0
                  overflow-hidden">

    <!-- DRAFT / CANCELLED diagonal stamp -->
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
              <p v-if="companyPhone">{{ t('erp.deliveryOrders.docPhoneAbbr') }} {{ companyPhone }}</p>
              <p v-if="companyTaxId" class="tabular-nums">
                {{ t('erp.deliveryOrders.docTaxId') }} {{ companyTaxId }}
              </p>
            </div>
          </div>
        </div>
        <div class="text-right flex-shrink-0">
          <h2 class="text-[18px] font-bold text-[#1C2434] leading-tight">{{ t('erp.deliveryOrders.documentTitle') }}</h2>
          <p class="text-[11px] text-[#9BA7B0] mt-1">({{ t('erp.deliveryOrders.docOriginal') }})</p>
        </div>
      </header>

      <!-- Customer + meta boxes -->
      <div class="mt-5 grid grid-cols-1 sm:grid-cols-2 border border-[#1C2434]">
        <div class="p-3 border-b sm:border-b-0 sm:border-r border-[#1C2434] text-[12px] space-y-1.5">
          <div class="grid grid-cols-[78px_1fr] gap-x-2">
            <span class="text-[#637381]">{{ t('erp.deliveryOrders.docCustomerCode') }}</span>
            <span class="font-medium text-[#1C2434]">{{ doc.customer?.code || '—' }}</span>
          </div>
          <div class="grid grid-cols-[78px_1fr] gap-x-2">
            <span class="text-[#637381]">{{ t('erp.deliveryOrders.docCustomerName') }}</span>
            <span class="font-semibold text-[#1C2434]">{{ doc.customer?.company || doc.customer?.name || '—' }}</span>
          </div>
          <div class="grid grid-cols-[78px_1fr] gap-x-2">
            <span class="text-[#637381]">{{ t('erp.deliveryOrders.docAddress') }}</span>
            <span class="text-[#1C2434] whitespace-pre-line leading-snug">{{ billingAddressDisplay || '—' }}</span>
          </div>
          <div v-if="shippingAddressDisplay" class="grid grid-cols-[78px_1fr] gap-x-2">
            <span class="text-[#637381]">{{ t('erp.deliveryOrders.docShipTo') }}</span>
            <span class="text-[#1C2434] whitespace-pre-line leading-snug">{{ shippingAddressDisplay }}</span>
          </div>
        </div>
        <div class="p-3 text-[12px] space-y-1.5">
          <div class="grid grid-cols-[124px_1fr] gap-x-2">
            <span class="text-[#637381]">{{ t('erp.deliveryOrders.docTaxId') }}</span>
            <span class="font-medium text-[#1C2434] tabular-nums">{{ customerTaxId || '—' }}</span>
          </div>
          <div class="grid grid-cols-[124px_1fr] gap-x-2">
            <span class="text-[#637381]">{{ t('erp.deliveryOrders.docRefNo') }}</span>
            <span class="font-bold text-[#1C2434] tabular-nums">{{ doc.refNo }}</span>
          </div>
          <div class="grid grid-cols-[124px_1fr] gap-x-2">
            <span class="text-[#637381]">{{ t('erp.deliveryOrders.docDate') }}</span>
            <span class="font-medium text-[#1C2434] tabular-nums">{{ fmtDate(doc.date) || '—' }}</span>
          </div>
          <div class="grid grid-cols-[124px_1fr] gap-x-2">
            <span class="text-[#637381]">{{ t('erp.deliveryOrders.docDeliveryDate') }}</span>
            <span class="font-medium text-[#1C2434] tabular-nums">{{ fmtDate(doc.deliveryDate) || '—' }}</span>
          </div>
          <div v-if="doc.referenceNumber" class="grid grid-cols-[124px_1fr] gap-x-2">
            <span class="text-[#637381]">{{ t('erp.deliveryOrders.docPO') }}</span>
            <span class="font-medium text-[#1C2434]">{{ doc.referenceNumber }}</span>
          </div>
          <div v-if="doc.salesOrder" class="grid grid-cols-[124px_1fr] gap-x-2">
            <span class="text-[#637381]">{{ t('erp.deliveryOrders.refSO') }}</span>
            <RouterLink :to="`/erp/orders/${doc.salesOrder.id}`"
              class="font-medium text-primary-500 hover:underline">
              {{ doc.salesOrder.orderNumber }}
            </RouterLink>
          </div>
        </div>
      </div>

      <!-- Line items -->
      <table class="w-full mt-4 border-collapse text-[12px] table-fixed">
        <thead>
          <tr class="bg-[#FAFBFD] text-[10px] font-bold text-[#1C2434] uppercase tracking-wide">
            <th class="border border-[#1C2434] px-2 py-2 text-left w-[90px]">{{ t('erp.deliveryOrders.colCode') }}</th>
            <th class="border border-[#1C2434] px-2 py-2 text-left w-[320px]">{{ t('erp.deliveryOrders.colProduct') }}</th>
            <th class="border border-[#1C2434] px-2 py-2 text-right w-[70px]">{{ t('erp.deliveryOrders.colQty') }}</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(item, idx) in doc.items" :key="item.id || idx" class="align-top">
            <td class="border-x border-b border-x-[#1C2434] border-b-[#E2E8F0] px-2 py-1.5 font-mono text-[11px] text-[#637381]">{{ itemCode(item) || '—' }}</td>
            <td class="border-x border-b border-x-[#1C2434] border-b-[#E2E8F0] px-2 py-1.5">
              <span class="text-[#1C2434]">{{ item.productName }}</span>
              <span v-if="item.notes" class="block text-[11px] text-[#9BA7B0]">{{ item.notes }}</span>
            </td>
            <td class="border-x border-b border-x-[#1C2434] border-b-[#E2E8F0] px-2 py-1.5 text-right tabular-nums font-medium text-[#1C2434]">{{ fmtQty(item.qty) }}</td>
          </tr>
          <!-- filler rows keep the goods area tall like a printed form -->
          <tr v-for="n in fillerRows" :key="'filler-' + n" class="h-[26px]">
            <td class="border-x border-[#1C2434]"></td>
            <td class="border-x border-[#1C2434]"></td>
            <td class="border-x border-[#1C2434]"></td>
          </tr>
        </tbody>
      </table>

      <!-- Terms + summary -->
      <div class="flex items-stretch border-x border-t border-b border-[#1C2434]">
        <div class="flex-1 min-w-0 flex flex-col">
          <div class="p-3 text-[11px] text-[#374151] space-y-1">
            <div v-if="paymentTermLabel(doc.paymentTerms) !== '—'" class="grid grid-cols-[96px_1fr] gap-x-2">
              <span class="text-[#9BA7B0]">{{ t('erp.deliveryOrders.paymentTerms') }}</span>
              <span>{{ paymentTermLabel(doc.paymentTerms) }}</span>
            </div>
            <div v-if="doc.salesperson?.name" class="grid grid-cols-[96px_1fr] gap-x-2">
              <span class="text-[#9BA7B0]">{{ t('erp.deliveryOrders.salesperson') }}</span>
              <span>{{ doc.salesperson.name }}</span>
            </div>
            <p v-for="(term, i) in docTerms" :key="'t' + i" class="leading-snug">- {{ term }}</p>
            <p v-if="doc.notes" class="leading-snug whitespace-pre-line">- {{ doc.notes }}</p>
          </div>
        </div>
        <div class="w-[241px] flex-shrink-0 border-l border-[#1C2434] text-[12px]">
          <div class="flex items-center justify-between px-3 pt-[7px] pb-[9px] border-b border-[#1C2434]">
            <span class="text-[#637381]">{{ t('erp.deliveryOrders.totalItems') }}</span>
            <span class="tabular-nums text-[#1C2434]">{{ doc.items?.length || 0 }}</span>
          </div>
          <div class="flex items-center justify-between px-3 py-2 bg-[#FAFBFD]">
            <span class="font-bold text-[#1C2434]">{{ t('erp.deliveryOrders.colQty') }}</span>
            <span class="font-extrabold text-[#1C2434] tabular-nums">{{ fmtQty(totalQty) }}</span>
          </div>
        </div>
      </div>

      <!-- Signatures -->
      <div class="grid grid-cols-3 gap-8 mt-12 px-2">
        <div v-for="(sig, i) in signatures" :key="'sig' + i" class="text-center">
          <div class="border-b border-dotted border-[#1C2434] h-8"></div>
          <p class="text-[11px] text-[#637381] mt-1.5">{{ sig }}</p>
          <p class="text-[10px] text-[#9BA7B0] mt-2">{{ t('erp.deliveryOrders.docDate') }} ......./......./.......</p>
        </div>
      </div>
    </div>
  </article>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { RouterLink } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { fmtDate } from '@/utils/fmt'
import { useAuthStore } from '@/stores/auth'
import api from '@/api'

const props = defineProps({
  doc: { type: Object, required: true },
})

const { t } = useI18n()
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

const shippingAddressDisplay = computed(() =>
  props.doc?.shippingAddress || props.doc?.address || ''
)
const billingAddressDisplay  = computed(() =>
  props.doc?.billingAddress || props.doc?.customer?.address || ''
)

function itemCode(item) {
  if (item.salePackage) return item.salePackage.code || ''
  return item.saleItem?.code || item.product?.sku || ''
}

const fillerRows    = computed(() => Math.max(0, 8 - (props.doc?.items?.length || 0)))
const customerTaxId = computed(() => props.doc?.customer?.taxId || '')
const totalQty      = computed(() =>
  (props.doc?.items || []).reduce((sum, it) => sum + (Number(it.qty) || 0), 0)
)
const docTerms   = computed(() => [t('erp.deliveryOrders.docTerm1'), t('erp.deliveryOrders.docTerm2')])
const signatures = computed(() => [
  t('erp.deliveryOrders.docPreparedBy'),
  t('erp.deliveryOrders.docApprovedBy'),
  t('erp.deliveryOrders.docReceiverSignature'),
])

function fmtQty(q) {
  return (Number(q) || 0).toLocaleString(undefined, { maximumFractionDigits: 3 })
}

const stampLabel = computed(() => {
  const s = props.doc?.status
  if (s === 'draft')     return 'Draft'
  if (s === 'cancelled') return 'Cancelled'
  return ''
})
const stampClass = computed(() => {
  if (props.doc?.status === 'cancelled') return 'text-red-600 border-red-600'
  return 'text-[#1C2434] border-[#1C2434]'
})

const paymentTerms = ref([])
onMounted(async () => {
  try {
    const { data } = await api.get('/erp/master-data/payment-terms')
    paymentTerms.value = data.data.values || []
  } catch { /* labels fall back to raw stored value */ }
})
function paymentTermLabel(v) {
  if (!v) return '—'
  const hit = paymentTerms.value.find(opt => opt.code === v || opt.name === v)
  return hit?.name || v
}
</script>
