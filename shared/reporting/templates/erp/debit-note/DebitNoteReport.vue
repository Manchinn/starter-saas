<template>
  <DocFrame :stamp-label="stampLabel" :stamp-class="stampClass">
    <!-- Header -->
    <DocHeader :title="t('erp.debitNotes.documentTitle')" :subtitle="t('erp.debitNotes.docOriginal')"
      :phone-label="t('erp.debitNotes.docPhoneAbbr')" :tax-id-label="t('erp.debitNotes.docTaxId')" />

    <!-- Customer + meta boxes -->
    <div class="mt-5 grid grid-cols-1 sm:grid-cols-2 border border-[#1C2434]">
      <div class="p-3 border-b sm:border-b-0 sm:border-r border-[#1C2434] text-[12px] space-y-1.5">
        <div class="grid grid-cols-[78px_1fr] gap-x-2">
          <span class="text-[#637381]">{{ t('erp.debitNotes.docCustomerCode') }}</span>
          <span class="font-medium text-[#1C2434]">{{ dn.customer?.code || '—' }}</span>
        </div>
        <div class="grid grid-cols-[78px_1fr] gap-x-2">
          <span class="text-[#637381]">{{ t('erp.debitNotes.docCustomerName') }}</span>
          <span class="font-semibold text-[#1C2434]">{{ dn.customer?.company || dn.customer?.name || '—' }}</span>
        </div>
        <div class="grid grid-cols-[78px_1fr] gap-x-2">
          <span class="text-[#637381]">{{ t('erp.debitNotes.docAddress') }}</span>
          <span class="text-[#1C2434] whitespace-pre-line leading-snug">{{ dn.customer?.address || '—' }}</span>
        </div>
      </div>
      <div class="p-3 text-[12px] space-y-1.5">
        <div class="grid grid-cols-[124px_1fr] gap-x-2">
          <span class="text-[#637381]">{{ t('erp.debitNotes.docTaxId') }}</span>
          <span class="font-medium text-[#1C2434] tabular-nums">{{ customerTaxId || '—' }}</span>
        </div>
        <div class="grid grid-cols-[124px_1fr] gap-x-2">
          <span class="text-[#637381]">{{ t('erp.debitNotes.docRefNo') }}</span>
          <span class="font-bold text-[#1C2434] tabular-nums">{{ dn.refNo }}</span>
        </div>
        <div class="grid grid-cols-[124px_1fr] gap-x-2">
          <span class="text-[#637381]">{{ t('erp.debitNotes.docDate') }}</span>
          <span class="font-medium text-[#1C2434] tabular-nums">{{ fmtDate(dn.date) || '—' }}</span>
        </div>
        <div v-if="dn.invoice" class="grid grid-cols-[124px_1fr] gap-x-2">
          <span class="text-[#637381]">{{ t('erp.debitNotes.docLinkedInvoice') }}</span>
          <RouterLink :to="`/erp/invoices/${dn.invoice.id}`"
            class="font-medium text-primary-600 hover:underline font-mono">{{ dn.invoice.invoiceNumber }}</RouterLink>
        </div>
      </div>
    </div>

    <!-- Reason / line item -->
    <table class="w-full mt-4 border-collapse text-[12px] table-fixed">
      <thead>
        <tr class="bg-[#FAFBFD] text-[10px] font-bold text-[#1C2434] uppercase tracking-wide">
          <th class="border border-[#1C2434] px-2 py-2 text-right w-[44px]">#</th>
          <th class="border border-[#1C2434] px-2 py-2 text-left">{{ t('erp.debitNotes.docColReason') }}</th>
          <th class="border border-[#1C2434] px-2 py-2 text-right w-[241px]">{{ t('erp.debitNotes.colAmount') }}</th>
        </tr>
      </thead>
      <tbody>
        <tr class="align-top">
          <td class="border-x border-b border-x-[#1C2434] border-b-[#E2E8F0] px-2 py-1.5 text-right tabular-nums text-[#9BA7B0]">1</td>
          <td class="border-x border-b border-x-[#1C2434] border-b-[#E2E8F0] px-2 py-1.5 text-[#374151] whitespace-pre-line leading-snug">{{ dn.reason || '—' }}</td>
          <td class="border-x border-b border-x-[#1C2434] border-b-[#E2E8F0] px-2 py-1.5 text-right tabular-nums font-medium text-[#1C2434]">{{ fmtMoney(dn.amount) }}</td>
        </tr>
        <DocFillerRows :count="fillerRows" :cols="3" />
      </tbody>
    </table>

    <!-- Terms / amount-in-words + totals -->
    <DocSummary :total-in-words="totalInWords">
      <template #notes>
        <div class="p-3 text-[11px] text-[#374151] space-y-1">
          <p v-for="(term, i) in docTerms" :key="'t' + i" class="leading-snug">- {{ term }}</p>
          <p v-if="dn.notes" class="leading-snug whitespace-pre-line">- {{ dn.notes }}</p>
        </div>
      </template>
      <template #totals>
        <div class="flex items-center justify-between px-3 py-2 bg-[#FAFBFD]">
          <span class="font-bold text-[#1C2434]">{{ t('erp.debitNotes.docNetTotal') }}</span>
          <span class="font-extrabold text-[#1C2434] tabular-nums">{{ fmtMoney(dn.amount) }}</span>
        </div>
      </template>
    </DocSummary>

    <!-- Signatures -->
    <DocSignatures :signatures="signatures" :date-label="t('erp.debitNotes.docDate')" />
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

const props = defineProps({ dn: { type: Object, required: true } })

const { t, locale } = useI18n()

const customerTaxId = computed(() => props.dn.customer?.taxId || '')
const fillerRows    = 6
const docTerms      = computed(() => [t('erp.debitNotes.docTerm1'), t('erp.debitNotes.docTerm2')])
const signatures    = computed(() => [
  t('erp.debitNotes.docPreparedBy'),
  t('erp.debitNotes.docApprovedBy'),
  t('erp.debitNotes.docCustomerSignature'),
])
const totalInWords = computed(() => numToWords(props.dn.amount, locale.value, props.dn.currency))

const stampLabel = computed(() => {
  const s = props.dn.status
  if (s === 'draft')     return 'Draft'
  if (s === 'issued')    return 'Issued'
  if (s === 'cancelled') return 'Cancelled'
  return ''
})
const stampClass = computed(() => {
  const s = props.dn.status
  if (s === 'cancelled') return 'text-red-600 border-red-600'
  if (s === 'issued')    return 'text-blue-600 border-blue-600'
  return 'text-[#1C2434] border-[#1C2434]'
})
</script>
