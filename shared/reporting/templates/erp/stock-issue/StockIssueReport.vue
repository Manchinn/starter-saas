<template>
  <!-- ── Stock-issue document (receipt tax-invoice layout) ──────────── -->
  <DocFrame :stamp-label="stampLabel" :stamp-class="stampClass">
    <!-- Header -->
    <DocHeader :title="t('erp.stockIssue.documentTitle')"
      :phone-label="t('erp.orders.docPhoneAbbr')" :tax-id-label="t('erp.orders.docTaxId')" show-email />

    <!-- Store / Reason + meta boxes -->
    <div class="mt-5 grid grid-cols-1 sm:grid-cols-2 border border-[#1C2434]">
      <div class="p-3 border-b sm:border-b-0 sm:border-r border-[#1C2434] text-[12px] space-y-1.5">
        <div class="grid grid-cols-[78px_1fr] gap-x-2">
          <span class="text-[#637381]">{{ t('erp.common.store') }}</span>
          <span class="font-semibold text-[#1C2434]">
            {{ issue.store?.name || '—' }}
            <span v-if="issue.store?.code" class="font-mono text-[11px] text-[#9BA7B0]">({{ issue.store.code }})</span>
          </span>
        </div>
        <div class="grid grid-cols-[78px_1fr] gap-x-2">
          <span class="text-[#637381]">{{ t('erp.stockIssue.reason') }}</span>
          <span class="font-medium text-[#1C2434]">{{ issue.reason || '—' }}</span>
        </div>
      </div>
      <div class="p-3 text-[12px] space-y-1.5">
        <div class="grid grid-cols-[124px_1fr] gap-x-2">
          <span class="text-[#637381]">{{ t('erp.stockIssue.colRefNo') }}</span>
          <span class="font-bold text-[#1C2434] tabular-nums">{{ issue.refNo }}</span>
        </div>
        <div class="grid grid-cols-[124px_1fr] gap-x-2">
          <span class="text-[#637381]">{{ t('erp.common.date') }}</span>
          <span class="font-medium text-[#1C2434] tabular-nums">{{ fmtDate(issue.date) || '—' }}</span>
        </div>
      </div>
    </div>

    <!-- Line items -->
    <table class="w-full mt-4 border-collapse text-[12px] table-fixed">
      <thead>
        <tr class="bg-[#FAFBFD] text-[10px] font-bold text-[#1C2434] uppercase tracking-wide">
          <th class="border border-[#1C2434] px-2 py-2 text-right w-[32px]">#</th>
          <th class="border border-[#1C2434] px-2 py-2 text-left w-[92px]">{{ t('erp.stockIssue.colSku') }}</th>
          <th class="border border-[#1C2434] px-2 py-2 text-left w-[222px]">{{ t('erp.common.product') }}</th>
          <th class="border border-[#1C2434] px-2 py-2 text-right w-[64px]">{{ t('erp.stockIssue.colQtyIssued') }}</th>
          <th class="border border-[#1C2434] px-2 py-2 text-left w-[74px]">{{ t('erp.common.batchId') }}</th>
          <th class="border border-[#1C2434] px-2 py-2 text-left w-[74px]">{{ t('erp.common.expiryDate') }}</th>
          <th class="border border-[#1C2434] px-2 py-2 text-left w-[93px]">{{ t('erp.common.notes') }}</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="(item, idx) in (issue.items || [])" :key="item.id" class="align-top">
          <td class="border-x border-b border-x-[#1C2434] border-b-[#E2E8F0] px-2 py-1.5 text-right tabular-nums text-[#9BA7B0]">{{ idx + 1 }}</td>
          <td class="border-x border-b border-x-[#1C2434] border-b-[#E2E8F0] px-2 py-1.5 font-mono text-[11px] text-[#637381]">{{ item.product?.sku || '—' }}</td>
          <td class="border-x border-b border-x-[#1C2434] border-b-[#E2E8F0] px-2 py-1.5">
            <span class="text-[#1C2434]">{{ item.product?.name || '—' }}</span>
          </td>
          <td class="border-x border-b border-x-[#1C2434] border-b-[#E2E8F0] px-2 py-1.5 text-right tabular-nums font-bold text-red-600">−{{ Number(item.qty) }}</td>
          <td class="border-x border-b border-x-[#1C2434] border-b-[#E2E8F0] px-2 py-1.5 font-mono text-[11px] text-[#637381]">{{ item.batchId || '—' }}</td>
          <td class="border-x border-b border-x-[#1C2434] border-b-[#E2E8F0] px-2 py-1.5 text-[11px] text-[#637381]">{{ item.expiryDate || '—' }}</td>
          <td class="border-x border-b border-x-[#1C2434] border-b-[#E2E8F0] px-2 py-1.5 text-[#637381]">{{ item.notes || '—' }}</td>
        </tr>
        <DocFillerRows :count="fillerRows" :cols="7" />
      </tbody>
    </table>

    <!-- Notes + issue totals -->
    <DocSummary>
      <template #notes>
        <div class="p-3 text-[11px] text-[#374151] space-y-1">
          <div v-if="issue.notes" class="grid grid-cols-[64px_1fr] gap-x-2">
            <span class="text-[#9BA7B0]">{{ t('erp.common.notes') }}</span>
            <span class="whitespace-pre-line leading-snug">{{ issue.notes }}</span>
          </div>
          <p v-else class="text-[#9BA7B0] italic">—</p>
        </div>
      </template>
      <template #totals>
        <div class="flex items-center justify-between px-3 pt-[7px] pb-[9px] border-b border-[#1C2434]">
          <span class="text-[#637381]">{{ t('erp.common.items') }}</span>
          <span class="tabular-nums text-[#1C2434]">{{ (issue.items || []).length }}</span>
        </div>
        <div class="flex items-center justify-between px-3 py-2 bg-[#FAFBFD]">
          <span class="font-bold text-[#1C2434]">{{ t('erp.stockIssue.totalIssueQty') }}</span>
          <span class="font-extrabold text-red-600 tabular-nums">−{{ totalQty }}</span>
        </div>
      </template>
    </DocSummary>

    <!-- Signatures -->
    <DocSignatures :signatures="signatures" :date-label="t('erp.common.date')" />
  </DocFrame>
</template>

<script setup>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { fmtDate } from '@/utils/fmt'
import DocFrame from '@shared/reporting/templates/components/DocFrame.vue'
import DocHeader from '@shared/reporting/templates/components/DocHeader.vue'
import DocSummary from '@shared/reporting/templates/components/DocSummary.vue'
import DocSignatures from '@shared/reporting/templates/components/DocSignatures.vue'
import DocFillerRows from '@shared/reporting/templates/components/DocFillerRows.vue'

const props = defineProps({
  // The stock-issue record (with store, reason, items, notes, status, …).
  issue: { type: Object, required: true },
})

const { t } = useI18n()

const totalQty = computed(() => (props.issue?.items || []).reduce((s, i) => s + (Number(i.qty) || 0), 0))

const fillerRows = computed(() => Math.max(0, 8 - (props.issue?.items?.length || 0)))
const signatures = computed(() => [
  t('erp.stockIssue.docPreparedBy'),
  t('erp.stockIssue.docApprovedBy'),
])
const stampLabel = computed(() => {
  const s = props.issue?.status
  if (s === 'draft')     return 'Draft'
  if (s === 'confirmed') return 'Confirmed'
  return ''
})
const stampClass = computed(() =>
  props.issue?.status === 'confirmed'
    ? 'text-green-600 border-green-600'
    : 'text-amber-500 border-amber-400'
)
</script>
