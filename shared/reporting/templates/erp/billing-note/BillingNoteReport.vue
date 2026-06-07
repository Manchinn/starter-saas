<template>
  <DocFrame :stamp-label="stampLabel" :stamp-class="stampClass">
    <!-- Header -->
    <DocHeader :title="t('erp.billingNotes.documentTitle')" :subtitle="t('erp.billingNotes.docOriginal')"
      :phone-label="t('erp.billingNotes.docPhoneAbbr')" :tax-id-label="t('erp.billingNotes.docTaxId')" />

    <!-- Customer + meta boxes -->
    <div class="mt-5 grid grid-cols-1 sm:grid-cols-2 border border-[#1C2434]">
      <div class="p-3 border-b sm:border-b-0 sm:border-r border-[#1C2434] text-[12px] space-y-1.5">
        <div class="grid grid-cols-[78px_1fr] gap-x-2">
          <span class="text-[#637381]">{{ t('erp.billingNotes.docCustomerCode') }}</span>
          <span class="font-medium text-[#1C2434]">{{ bn.customer?.code || '—' }}</span>
        </div>
        <div class="grid grid-cols-[78px_1fr] gap-x-2">
          <span class="text-[#637381]">{{ t('erp.billingNotes.docCustomerName') }}</span>
          <span class="font-semibold text-[#1C2434]">{{ bn.customer?.company || bn.customer?.name || '—' }}</span>
        </div>
        <div class="grid grid-cols-[78px_1fr] gap-x-2">
          <span class="text-[#637381]">{{ t('erp.billingNotes.docAddress') }}</span>
          <span class="text-[#1C2434] whitespace-pre-line leading-snug">{{ bn.customer?.address || '—' }}</span>
        </div>
      </div>
      <div class="p-3 text-[12px] space-y-1.5">
        <div class="grid grid-cols-[124px_1fr] gap-x-2">
          <span class="text-[#637381]">{{ t('erp.billingNotes.docTaxId') }}</span>
          <span class="font-medium text-[#1C2434] tabular-nums">{{ customerTaxId || '—' }}</span>
        </div>
        <div class="grid grid-cols-[124px_1fr] gap-x-2">
          <span class="text-[#637381]">{{ t('erp.billingNotes.docRefNo') }}</span>
          <span class="font-bold text-[#1C2434] tabular-nums">{{ bn.refNo }}</span>
        </div>
        <div class="grid grid-cols-[124px_1fr] gap-x-2">
          <span class="text-[#637381]">{{ t('erp.billingNotes.docDate') }}</span>
          <span class="font-medium text-[#1C2434] tabular-nums">{{ fmtDate(bn.date) || '—' }}</span>
        </div>
        <div class="grid grid-cols-[124px_1fr] gap-x-2">
          <span class="text-[#637381]">{{ t('erp.billingNotes.docDueDate') }}</span>
          <span class="font-medium tabular-nums" :class="isOverdue ? 'text-red-600' : 'text-[#1C2434]'">{{ fmtDate(bn.dueDate) || '—' }}</span>
        </div>
      </div>
    </div>

    <!-- Included invoices -->
    <table class="w-full mt-4 border-collapse text-[12px] table-fixed">
      <thead>
        <tr class="bg-[#FAFBFD] text-[10px] font-bold text-[#1C2434] uppercase tracking-wide">
          <th class="border border-[#1C2434] px-2 py-2 text-right w-[44px]">#</th>
          <th class="border border-[#1C2434] px-2 py-2 text-left w-[120px]">{{ t('erp.billingNotes.docColInvoiceNo') }}</th>
          <th class="border border-[#1C2434] px-2 py-2 text-right w-[100px]">{{ t('erp.billingNotes.docColInvoiceDate') }}</th>
          <th class="border border-[#1C2434] px-2 py-2 text-right w-[100px]">{{ t('erp.billingNotes.docColDueDate') }}</th>
          <th class="border border-[#1C2434] px-2 py-2 text-left w-[80px]">{{ t('erp.common.status') }}</th>
          <th class="border border-[#1C2434] px-2 py-2 text-right w-[134px]">{{ t('erp.billingNotes.colAmount') }}</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="(line, idx) in (bn.lines || [])" :key="line.id" class="align-top">
          <td class="border-x border-b border-x-[#1C2434] border-b-[#E2E8F0] px-2 py-1.5 text-right tabular-nums text-[#9BA7B0]">{{ idx + 1 }}</td>
          <td class="border-x border-b border-x-[#1C2434] border-b-[#E2E8F0] px-2 py-1.5">
            <RouterLink :to="`/erp/invoices/${line.invoiceId}`"
              class="font-mono text-[11px] font-medium text-primary-600 hover:underline transition-colors">
              {{ line.invoice?.invoiceNumber || '—' }}
            </RouterLink>
          </td>
          <td class="border-x border-b border-x-[#1C2434] border-b-[#E2E8F0] px-2 py-1.5 text-right tabular-nums text-[#374151]">{{ fmtDate(line.invoice?.invoiceDate) || '—' }}</td>
          <td class="border-x border-b border-x-[#1C2434] border-b-[#E2E8F0] px-2 py-1.5 text-right tabular-nums text-[#374151]">{{ fmtDate(line.invoice?.dueDate) || '—' }}</td>
          <td class="border-x border-b border-x-[#1C2434] border-b-[#E2E8F0] px-2 py-1.5">
            <span class="inline-flex items-center px-2 py-0.5 text-[10px] font-semibold capitalize"
              :class="invStatusClass(line.invoice?.status)">
              {{ line.invoice?.status }}
            </span>
          </td>
          <td class="border-x border-b border-x-[#1C2434] border-b-[#E2E8F0] px-2 py-1.5 text-right tabular-nums font-medium text-[#1C2434]">{{ fmtMoney(line.amount) }}</td>
        </tr>
        <DocFillerRows :count="fillerRows" :cols="6" />
      </tbody>
    </table>

    <!-- Terms / amount-in-words + totals -->
    <DocSummary :total-in-words="totalInWords">
      <template #notes>
        <div class="p-3 text-[11px] text-[#374151] space-y-1">
          <p v-for="(term, i) in docTerms" :key="'t' + i" class="leading-snug">- {{ term }}</p>
          <p v-if="bn.notes" class="leading-snug whitespace-pre-line">- {{ bn.notes }}</p>
        </div>
      </template>
      <template #totals>
        <div class="flex items-center justify-between px-3 py-2 bg-[#FAFBFD]">
          <span class="font-bold text-[#1C2434]">{{ t('erp.billingNotes.docNetTotal') }}</span>
          <span class="font-extrabold text-[#1C2434] tabular-nums">{{ fmtMoney(bn.total) }}</span>
        </div>
      </template>
    </DocSummary>

    <!-- Signatures -->
    <DocSignatures :signatures="signatures" :date-label="t('erp.billingNotes.docDate')" />
  </DocFrame>
</template>

<script setup>
import { computed } from 'vue'
import { RouterLink } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { fmtDate, fmtMoney, numToWords } from '@/utils/fmt'
import DocFrame from '@shared/reporting/templates/components/DocFrame.vue'
import DocHeader from '@shared/reporting/templates/components/DocHeader.vue'
import DocSummary from '@shared/reporting/templates/components/DocSummary.vue'
import DocSignatures from '@shared/reporting/templates/components/DocSignatures.vue'
import DocFillerRows from '@shared/reporting/templates/components/DocFillerRows.vue'

const props = defineProps({ bn: { type: Object, required: true } })

const { t, locale } = useI18n()

const customerTaxId = computed(() => props.bn.customer?.taxId || '')
const fillerRows    = computed(() => Math.max(0, 8 - (props.bn.lines?.length || 0)))
const docTerms      = computed(() => [t('erp.billingNotes.docTerm1'), t('erp.billingNotes.docTerm2')])
const signatures    = computed(() => [
  t('erp.billingNotes.docPreparedBy'),
  t('erp.billingNotes.docApprovedBy'),
  t('erp.billingNotes.docCustomerSignature'),
])
const totalInWords = computed(() => numToWords(props.bn.total, locale.value, props.bn.currency))

const isOverdue = computed(() =>
  props.bn.status === 'sent' &&
  props.bn.dueDate &&
  new Date(props.bn.dueDate) < new Date()
)

const INV_STATUS_CLASS = {
  draft:     'bg-[#F1F5F9] text-[#637381]',
  sent:      'bg-blue-50 text-blue-700',
  paid:      'bg-green-50 text-green-700',
  cancelled: 'bg-red-50 text-red-600',
}
function invStatusClass(s) { return INV_STATUS_CLASS[s] || INV_STATUS_CLASS.draft }

const stampLabel = computed(() => {
  const s = props.bn.status
  if (s === 'draft')     return 'Draft'
  if (s === 'paid')      return 'Paid'
  if (s === 'cancelled') return 'Cancelled'
  return ''
})
const stampClass = computed(() => {
  const s = props.bn.status
  if (s === 'cancelled') return 'text-red-600 border-red-600'
  if (s === 'paid')      return 'text-green-600 border-green-600'
  return 'text-[#1C2434] border-[#1C2434]'
})
</script>
