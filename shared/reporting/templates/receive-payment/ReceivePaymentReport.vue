<template>
  <!-- ── Payment receipt document (receipt layout) ─────────── -->
  <article class="relative mx-auto bg-white border border-[#E2E8F0] shadow-card max-w-[186mm] w-full
                  print:border-0 print:shadow-none print:max-w-none print:mx-0
                  overflow-hidden">

    <!-- DRAFT / CANCELLED / PAID stamp -->
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
              <p v-if="companyPhone">Tel. {{ companyPhone }}</p>
              <p v-if="companyTaxId" class="tabular-nums">Tax ID {{ companyTaxId }}</p>
            </div>
          </div>
        </div>
        <div class="text-right flex-shrink-0">
          <h2 class="text-[18px] font-bold text-[#1C2434] leading-tight">Payment Receipt</h2>
          <p class="text-[11px] text-[#9BA7B0] mt-1">(Original)</p>
        </div>
      </header>

      <!-- Customer + meta boxes -->
      <div class="mt-5 grid grid-cols-1 sm:grid-cols-2 border border-[#1C2434]">
        <div class="p-3 border-b sm:border-b-0 sm:border-r border-[#1C2434] text-[12px] space-y-1.5">
          <div class="grid grid-cols-[88px_1fr] gap-x-2">
            <span class="text-[#637381]">Customer Code</span>
            <span class="font-medium text-[#1C2434]">{{ rp.customer?.code || '—' }}</span>
          </div>
          <div class="grid grid-cols-[88px_1fr] gap-x-2">
            <span class="text-[#637381]">Received From</span>
            <span class="font-semibold text-[#1C2434]">{{ rp.customer?.company || rp.customer?.name || '—' }}</span>
          </div>
          <div class="grid grid-cols-[88px_1fr] gap-x-2">
            <span class="text-[#637381]">Address</span>
            <span class="text-[#1C2434] whitespace-pre-line leading-snug">{{ rp.customer?.address || '—' }}</span>
          </div>
        </div>
        <div class="p-3 text-[12px] space-y-1.5">
          <div class="grid grid-cols-[112px_1fr] gap-x-2">
            <span class="text-[#637381]">Tax ID</span>
            <span class="font-medium text-[#1C2434] tabular-nums">{{ customerTaxId || '—' }}</span>
          </div>
          <div class="grid grid-cols-[112px_1fr] gap-x-2">
            <span class="text-[#637381]">Payment No.</span>
            <span class="font-bold text-[#1C2434] tabular-nums">{{ rp.refNo }}</span>
          </div>
          <div class="grid grid-cols-[112px_1fr] gap-x-2">
            <span class="text-[#637381]">Date</span>
            <span class="font-medium text-[#1C2434] tabular-nums">{{ fmtDate(rp.date) || '—' }}</span>
          </div>
          <div class="grid grid-cols-[112px_1fr] gap-x-2">
            <span class="text-[#637381]">Method</span>
            <span class="font-medium text-[#1C2434] capitalize">{{ rp.paymentMethod || '—' }}</span>
          </div>
          <div v-if="rp.reference" class="grid grid-cols-[112px_1fr] gap-x-2">
            <span class="text-[#637381]">Reference</span>
            <span class="font-medium text-[#1C2434] font-mono">{{ rp.reference }}</span>
          </div>
        </div>
      </div>

      <!-- Applied invoices -->
      <table class="w-full mt-4 border-collapse text-[12px] table-fixed">
        <thead>
          <tr class="bg-[#FAFBFD] text-[10px] font-bold text-[#1C2434] uppercase tracking-wide">
            <th class="border border-[#1C2434] px-2 py-2 text-left w-[189px]">Invoice #</th>
            <th class="border border-[#1C2434] px-2 py-2 text-left w-[110px]">Invoice Date</th>
            <th class="border border-[#1C2434] px-2 py-2 text-left w-[110px]">Due Date</th>
            <th class="border border-[#1C2434] px-2 py-2 text-left w-[80px]">Status</th>
            <th class="border border-[#1C2434] px-2 py-2 text-right w-[160px]">Amount Applied</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="line in (rp.lines || [])" :key="line.id" class="align-top">
            <td class="border-x border-b border-x-[#1C2434] border-b-[#E2E8F0] px-2 py-1.5">
              <RouterLink :to="`/erp/invoices/${line.invoiceId}`"
                class="font-mono font-medium text-primary-600 hover:underline transition-colors">
                {{ line.invoice?.invoiceNumber || '—' }}
              </RouterLink>
            </td>
            <td class="border-x border-b border-x-[#1C2434] border-b-[#E2E8F0] px-2 py-1.5 tabular-nums text-[#637381]">{{ fmtDate(line.invoice?.invoiceDate) || '—' }}</td>
            <td class="border-x border-b border-x-[#1C2434] border-b-[#E2E8F0] px-2 py-1.5 tabular-nums text-[#637381]">{{ fmtDate(line.invoice?.dueDate) || '—' }}</td>
            <td class="border-x border-b border-x-[#1C2434] border-b-[#E2E8F0] px-2 py-1.5">
              <span class="inline-flex items-center px-2 py-0.5 text-[10px] font-semibold capitalize"
                :class="invStatusClass(line.invoice?.status)">
                {{ line.invoice?.status }}
              </span>
            </td>
            <td class="border-x border-b border-x-[#1C2434] border-b-[#E2E8F0] px-2 py-1.5 text-right tabular-nums font-medium text-[#1C2434]">{{ fmtMoney(line.amount) }}</td>
          </tr>
          <tr v-if="!rp.lines?.length">
            <td colspan="5" class="border-x border-b border-x-[#1C2434] border-b-[#E2E8F0] px-2 py-6 text-center text-[#9BA7B0] italic">
              No invoices applied
            </td>
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

      <!-- Terms / amount-in-words + total -->
      <div class="flex items-stretch border-x border-t border-b border-[#1C2434]">
        <div class="flex-1 min-w-0 flex flex-col">
          <div v-if="totalInWords"
            class="border-b border-[#1C2434] px-3 py-2 text-center">
            <p class="text-[12px] font-semibold text-[#1C2434] italic">({{ totalInWords }})</p>
          </div>
          <div class="p-3 text-[11px] text-[#374151] space-y-1">
            <div v-if="rp.paymentMethod" class="grid grid-cols-[96px_1fr] gap-x-2">
              <span class="text-[#9BA7B0]">Payment Method</span>
              <span class="capitalize">{{ rp.paymentMethod }}</span>
            </div>
            <div v-if="rp.reference" class="grid grid-cols-[96px_1fr] gap-x-2">
              <span class="text-[#9BA7B0]">Reference</span>
              <span class="font-mono">{{ rp.reference }}</span>
            </div>
            <p v-for="(term, i) in docTerms" :key="'t' + i" class="leading-snug">- {{ term }}</p>
            <p v-if="rp.notes" class="leading-snug whitespace-pre-line">- {{ rp.notes }}</p>
          </div>
        </div>
        <div class="w-[241px] flex-shrink-0 border-l border-[#1C2434] text-[12px]">
          <div class="flex items-center justify-between px-3 py-2 bg-[#FAFBFD]">
            <span class="font-bold text-[#1C2434]">Total Received</span>
            <span class="font-extrabold text-green-600 tabular-nums">{{ fmtMoney(rp.amount) }}</span>
          </div>
        </div>
      </div>

      <!-- Signatures -->
      <div class="grid grid-cols-3 gap-8 mt-12 px-2">
        <div v-for="(sig, i) in signatures" :key="'sig' + i" class="text-center">
          <div class="border-b border-dotted border-[#1C2434] h-8"></div>
          <p class="text-[11px] text-[#637381] mt-1.5">{{ sig }}</p>
          <p class="text-[10px] text-[#9BA7B0] mt-2">Date ......./......./.......</p>
        </div>
      </div>
    </div>
  </article>
</template>

<script setup>
import { computed } from 'vue'
import { RouterLink } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { fmtDate, fmtMoney, numToWords } from '@/utils/fmt'
import { useAuthStore } from '@/stores/auth'

const props = defineProps({
  rp: { type: Object, required: true },
})

const { locale } = useI18n()
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

const totalInWords  = computed(() => props.rp ? numToWords(props.rp.amount, locale.value, props.rp.currency) : '')
const fillerRows    = computed(() => Math.max(0, 8 - (props.rp?.lines?.length || 0)))
const customerTaxId = computed(() => props.rp?.customer?.taxId || '')

const docTerms = [
  'This receipt confirms the payment applied to the invoices listed above.',
  'Payment is acknowledged subject to the clearance of cheques or transfers.',
]
const signatures = ['Received By', 'Approved By', 'Customer Signature']

const INV_STATUS_CLASS = {
  draft:     'bg-[#F1F5F9] text-[#637381]',
  sent:      'bg-blue-50 text-blue-700',
  paid:      'bg-green-50 text-green-700',
  cancelled: 'bg-red-50 text-red-600',
}
function invStatusClass(s) { return INV_STATUS_CLASS[s] || INV_STATUS_CLASS.draft }

const stampLabel = computed(() => {
  const s = props.rp?.status
  if (s === 'draft')     return 'Draft'
  if (s === 'cancelled') return 'Cancelled'
  if (s === 'confirmed') return 'Paid'
  return ''
})
const stampClass = computed(() => {
  const s = props.rp?.status
  if (s === 'cancelled') return 'text-red-600 border-red-600'
  if (s === 'confirmed') return 'text-green-600 border-green-600'
  return 'text-[#1C2434] border-[#1C2434]'
})
</script>
