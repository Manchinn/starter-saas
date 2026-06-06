<template>
  <!-- ── Stock-transfer request document (receipt tax-invoice layout) ── -->
  <DocFrame :stamp-label="stampLabel" :stamp-class="stampClass">
    <!-- Header -->
    <DocHeader :title="t('erp.stockTransfer.documentTitle')"
      :phone-label="t('erp.orders.docPhoneAbbr')" :tax-id-label="t('erp.orders.docTaxId')" show-email />

    <!-- From-store / To-store + meta boxes -->
    <div class="mt-5 grid grid-cols-1 sm:grid-cols-2 border border-[#1C2434]">
      <div class="p-3 border-b sm:border-b-0 sm:border-r border-[#1C2434] text-[12px] space-y-1.5">
        <div class="grid grid-cols-[78px_1fr] gap-x-2">
          <span class="text-[#637381]">{{ t('erp.stockTransfer.fromStore') }}</span>
          <span class="font-semibold text-[#1C2434]">
            {{ req.fromStore?.name || '—' }}
            <span v-if="req.fromStore?.code" class="font-mono text-[11px] text-[#9BA7B0]">({{ req.fromStore.code }})</span>
          </span>
        </div>
        <div class="grid grid-cols-[78px_1fr] gap-x-2">
          <span class="text-[#637381]">{{ t('erp.stockTransfer.toStore') }}</span>
          <span class="font-semibold text-[#1C2434]">
            {{ req.toStore?.name || '—' }}
            <span v-if="req.toStore?.code" class="font-mono text-[11px] text-[#9BA7B0]">({{ req.toStore.code }})</span>
          </span>
        </div>
      </div>
      <div class="p-3 text-[12px] space-y-1.5">
        <div class="grid grid-cols-[124px_1fr] gap-x-2">
          <span class="text-[#637381]">{{ t('erp.stockTransfer.colRefNo') }}</span>
          <span class="font-bold text-[#1C2434] tabular-nums">{{ req.refNo }}</span>
        </div>
        <div class="grid grid-cols-[124px_1fr] gap-x-2">
          <span class="text-[#637381]">{{ t('erp.common.date') }}</span>
          <span class="font-medium text-[#1C2434] tabular-nums">{{ fmtDate(req.date) || '—' }}</span>
        </div>
      </div>
    </div>

    <!-- Line items -->
    <table class="w-full mt-4 border-collapse text-[12px] table-fixed">
      <thead>
        <tr class="bg-[#FAFBFD] text-[10px] font-bold text-[#1C2434] uppercase tracking-wide">
          <th class="border border-[#1C2434] px-2 py-2 text-right w-[45px]">#</th>
          <th class="border border-[#1C2434] px-2 py-2 text-left w-[80px]">{{ t('erp.stockTransfer.colSku') }}</th>
          <th class="border border-[#1C2434] px-2 py-2 text-left w-[285px]">{{ t('erp.common.product') }}</th>
          <th class="border border-[#1C2434] px-2 py-2 text-right w-[72px]">{{ t('erp.stockTransfer.colQty') }}</th>
          <th class="border border-[#1C2434] px-2 py-2 text-left w-[169px]">{{ t('erp.common.notes') }}</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="(item, idx) in (req.items || [])" :key="item.id" class="align-top">
          <td class="border-x border-b border-x-[#1C2434] border-b-[#E2E8F0] px-2 py-1.5 text-right tabular-nums text-[#9BA7B0]">{{ idx + 1 }}</td>
          <td class="border-x border-b border-x-[#1C2434] border-b-[#E2E8F0] px-2 py-1.5 font-mono text-[11px] text-[#637381]">{{ item.product?.sku || '—' }}</td>
          <td class="border-x border-b border-x-[#1C2434] border-b-[#E2E8F0] px-2 py-1.5">
            <span class="text-[#1C2434]">{{ item.product?.name || '—' }}</span>
          </td>
          <td class="border-x border-b border-x-[#1C2434] border-b-[#E2E8F0] px-2 py-1.5 text-right tabular-nums font-medium text-violet-700">{{ Number(item.qty) }}</td>
          <td class="border-x border-b border-x-[#1C2434] border-b-[#E2E8F0] px-2 py-1.5 text-[#637381]">{{ item.notes || '—' }}</td>
        </tr>
        <DocFillerRows :count="fillerRows" :cols="5" />
      </tbody>
    </table>

    <!-- Notes + transfer totals -->
    <DocSummary>
      <template #notes>
        <div class="p-3 text-[11px] text-[#374151] space-y-1">
          <div v-if="req.notes" class="grid grid-cols-[64px_1fr] gap-x-2">
            <span class="text-[#9BA7B0]">{{ t('erp.common.notes') }}</span>
            <span class="whitespace-pre-line leading-snug">{{ req.notes }}</span>
          </div>
          <p v-else class="text-[#9BA7B0] italic">—</p>
        </div>
      </template>
      <template #totals>
        <div class="flex items-center justify-between px-3 pt-[7px] pb-[9px] border-b border-[#1C2434]">
          <span class="text-[#637381]">{{ t('erp.common.items') }}</span>
          <span class="tabular-nums text-[#1C2434]">{{ (req.items || []).length }}</span>
        </div>
        <div class="flex items-center justify-between px-3 py-2 bg-[#FAFBFD]">
          <span class="font-bold text-[#1C2434]">{{ t('erp.stockTransfer.totalTransferQty') }}</span>
          <span class="font-extrabold text-violet-700 tabular-nums">{{ totalQty }}</span>
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
  // The stock-transfer request record (with from/to store, items, notes, status, …).
  req: { type: Object, required: true },
})

const { t } = useI18n()

const totalQty = computed(() => (props.req?.items || []).reduce((s, i) => s + (Number(i.qty) || 0), 0))

const fillerRows = computed(() => Math.max(0, 8 - (props.req?.items?.length || 0)))
const signatures = computed(() => [
  t('erp.stockTransfer.docPreparedBy'),
  t('erp.stockTransfer.docApprovedBy'),
])
const stampLabel = computed(() => {
  const s = props.req?.status
  if (s === 'draft')     return 'Draft'
  if (s === 'confirmed') return 'Confirmed'
  return ''
})
const stampClass = computed(() =>
  props.req?.status === 'confirmed'
    ? 'text-green-600 border-green-600'
    : 'text-amber-500 border-amber-400'
)
</script>
