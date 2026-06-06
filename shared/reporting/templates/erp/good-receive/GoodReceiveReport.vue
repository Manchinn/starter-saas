<template>
  <DocFrame :stamp-label="stampLabel" :stamp-class="stampClass">
    <!-- Header -->
    <DocHeader :title="t('erp.goodReceive.title')" title-uppercase
      phone-label="Tel:" tax-id-label="Tax ID:" muted-tax-id-label show-email show-website />

    <!-- Supplier/Store + meta boxes -->
    <div class="mt-5 grid grid-cols-1 sm:grid-cols-2 border border-[#1C2434]">
      <div class="p-3 border-b sm:border-b-0 sm:border-r border-[#1C2434] text-[12px] space-y-1.5">
        <div class="grid grid-cols-[78px_1fr] gap-x-2">
          <span class="text-[#637381]">{{ t('erp.goodReceive.supplier') }}</span>
          <span class="font-semibold text-[#1C2434]">{{ gr.supplier || '—' }}</span>
        </div>
        <div class="grid grid-cols-[78px_1fr] gap-x-2">
          <span class="text-[#637381]">{{ t('erp.common.store') }}</span>
          <span class="font-semibold text-[#1C2434]">
            {{ gr.store?.name || '—' }}
            <span v-if="gr.store?.code" class="font-mono text-[11px] text-[#9BA7B0]">({{ gr.store.code }})</span>
          </span>
        </div>
      </div>
      <div class="p-3 text-[12px] space-y-1.5">
        <div class="grid grid-cols-[124px_1fr] gap-x-2">
          <span class="text-[#637381]">{{ t('erp.goodReceive.colRefNo') }}</span>
          <span class="font-bold text-[#1C2434] tabular-nums">{{ gr.refNo }}</span>
        </div>
        <div class="grid grid-cols-[124px_1fr] gap-x-2">
          <span class="text-[#637381]">{{ t('erp.common.date') }}</span>
          <span class="font-medium text-[#1C2434] tabular-nums">{{ fmtDate(gr.date) || '—' }}</span>
        </div>
        <div class="grid grid-cols-[124px_1fr] gap-x-2">
          <span class="text-[#637381]">{{ t('erp.goodReceive.docType') }}</span>
          <span class="font-medium text-[#1C2434] capitalize">
            {{ gr.docType === 'delivery' ? t('erp.goodReceive.delivery') : t('erp.goodReceive.invoice') }}
          </span>
        </div>
        <div v-if="gr.docType === 'invoice' && gr.invoiceNo" class="grid grid-cols-[124px_1fr] gap-x-2">
          <span class="text-[#637381]">{{ t('erp.goodReceive.invoiceNo') }}</span>
          <span class="font-medium text-[#1C2434] font-mono">{{ gr.invoiceNo }}</span>
        </div>
        <div v-if="gr.docType === 'invoice' && gr.invoiceDate" class="grid grid-cols-[124px_1fr] gap-x-2">
          <span class="text-[#637381]">{{ t('erp.goodReceive.invoiceDate') }}</span>
          <span class="font-medium text-[#1C2434] tabular-nums">{{ fmtDate(gr.invoiceDate) || '—' }}</span>
        </div>
        <div v-if="gr.docType === 'delivery' && gr.deliveryNo" class="grid grid-cols-[124px_1fr] gap-x-2">
          <span class="text-[#637381]">{{ t('erp.goodReceive.deliveryNo') }}</span>
          <span class="font-medium text-[#1C2434] font-mono">{{ gr.deliveryNo }}</span>
        </div>
      </div>
    </div>

    <!-- Line items -->
    <table class="w-full mt-4 border-collapse text-[12px] table-fixed">
      <thead>
        <tr class="bg-[#FAFBFD] text-[10px] font-bold text-[#1C2434] uppercase tracking-wide">
          <th class="border border-[#1C2434] px-1.5 py-2 text-right w-[28px]">#</th>
          <th class="border border-[#1C2434] px-1.5 py-2 text-left w-[75px]">{{ t('erp.common.sku') }}</th>
          <th class="border border-[#1C2434] px-1.5 py-2 text-left w-[216px]">{{ t('erp.common.product') }}</th>
          <th class="border border-[#1C2434] px-1.5 py-2 text-right w-[46px]">{{ t('erp.common.qty') }}</th>
          <th class="border border-[#1C2434] px-1.5 py-2 text-left w-[44px]">UOM</th>
          <th class="border border-[#1C2434] px-1.5 py-2 text-right w-[44px]">{{ t('erp.goodReceive.freeQty') }}</th>
          <th class="border border-[#1C2434] px-1.5 py-2 text-right w-[72px]">Cost/Unit</th>
          <th class="border border-[#1C2434] px-1.5 py-2 text-right w-[41px]">{{ t('erp.goodReceive.discPct') }}</th>
          <th class="border border-[#1C2434] px-1.5 py-2 text-right w-[84px]">{{ t('erp.goodReceive.netAmount') }}</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="(item, idx) in (gr.items || [])" :key="item.id" class="align-top">
          <td class="border-x border-b border-x-[#1C2434] border-b-[#E2E8F0] px-1.5 py-1.5 text-right tabular-nums text-[#9BA7B0]">{{ idx + 1 }}</td>
          <td class="border-x border-b border-x-[#1C2434] border-b-[#E2E8F0] px-1.5 py-1.5 font-mono text-[11px] text-[#637381]">{{ item.product?.sku || '—' }}</td>
          <td class="border-x border-b border-x-[#1C2434] border-b-[#E2E8F0] px-1.5 py-1.5">
            <span class="text-[#1C2434]">{{ item.product?.name || '—' }}</span>
            <p v-if="item.batchId || item.expiryDate" class="text-[10px] text-[#9BA7B0] mt-0.5">
              <span v-if="item.batchId">Batch: <span class="font-mono">{{ item.batchId }}</span></span>
              <span v-if="item.batchId && item.expiryDate"> · </span>
              <span v-if="item.expiryDate">Exp: {{ fmtDate(item.expiryDate) }}</span>
            </p>
            <p v-if="item.comments" class="text-[11px] text-[#9BA7B0] mt-0.5 italic">{{ item.comments }}</p>
          </td>
          <td class="border-x border-b border-x-[#1C2434] border-b-[#E2E8F0] px-1.5 py-1.5 text-right tabular-nums text-[#374151]">{{ fmtQty(item.qty) }}</td>
          <td class="border-x border-b border-x-[#1C2434] border-b-[#E2E8F0] px-1.5 py-1.5 text-[10px] text-[#637381]">{{ item.qtyUom?.abbreviation || item.qtyUom?.name || '—' }}</td>
          <td class="border-x border-b border-x-[#1C2434] border-b-[#E2E8F0] px-1.5 py-1.5 text-right tabular-nums text-[#637381]">{{ Number(item.freeQty) > 0 ? fmtQty(item.freeQty) : '—' }}</td>
          <td class="border-x border-b border-x-[#1C2434] border-b-[#E2E8F0] px-1.5 py-1.5 text-right tabular-nums text-[#374151]">{{ fmtMoney(item.cost) }}</td>
          <td class="border-x border-b border-x-[#1C2434] border-b-[#E2E8F0] px-1.5 py-1.5 text-right tabular-nums text-[#637381]">{{ Number(item.discountPct) ? `${Number(item.discountPct)}%` : '—' }}</td>
          <td class="border-x border-b border-x-[#1C2434] border-b-[#E2E8F0] px-1.5 py-1.5 text-right tabular-nums font-medium text-[#1C2434]">{{ fmtMoney(item.netAmount) }}</td>
        </tr>
        <DocFillerRows :count="fillerRows" :cols="9" />
      </tbody>
    </table>

    <!-- Notes + totals -->
    <DocSummary>
      <template #notes>
        <div class="p-3 text-[11px] text-[#374151] space-y-1">
          <div v-if="gr.notes" class="grid grid-cols-[64px_1fr] gap-x-2">
            <span class="text-[#9BA7B0]">{{ t('erp.common.notes') }}</span>
            <span class="whitespace-pre-line leading-snug">{{ gr.notes }}</span>
          </div>
          <p v-else class="text-[#9BA7B0] italic">—</p>
        </div>
      </template>
      <template #totals>
        <div class="flex items-center justify-between px-3 pt-[7px] pb-[9px] border-b border-[#1C2434]">
          <span class="text-[#637381]">Gross</span>
          <span class="tabular-nums text-[#1C2434]">{{ fmtMoney(totalGross) }}</span>
        </div>
        <div class="flex items-center justify-between px-3 py-1.5 border-b border-[#1C2434]">
          <span class="text-[#637381]">Net</span>
          <span class="tabular-nums text-[#1C2434]">{{ fmtMoney(totalNet) }}</span>
        </div>
        <div v-if="gr.docType === 'invoice' && Number(gr.invoiceDiscount) > 0"
          class="flex items-center justify-between px-3 py-1.5 border-b border-[#1C2434]">
          <span class="text-[#637381]">{{ t('erp.goodReceive.invoiceDiscount') }}</span>
          <span class="tabular-nums text-red-600">−{{ fmtMoney(gr.invoiceDiscount) }}</span>
        </div>
        <div class="flex items-center justify-between px-3 py-2 bg-[#FAFBFD]">
          <span class="font-bold text-[#1C2434]">{{ t('erp.goodReceive.netAmount') }}</span>
          <span class="font-extrabold text-[#1C2434] tabular-nums">
            {{ fmtMoney(gr.docType === 'invoice' ? gr.invoiceNetAmount : totalNet) }}
          </span>
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
import { fmtDate, fmtMoney } from '@/utils/fmt'
import DocFrame from '@shared/reporting/templates/components/DocFrame.vue'
import DocHeader from '@shared/reporting/templates/components/DocHeader.vue'
import DocSummary from '@shared/reporting/templates/components/DocSummary.vue'
import DocSignatures from '@shared/reporting/templates/components/DocSignatures.vue'
import DocFillerRows from '@shared/reporting/templates/components/DocFillerRows.vue'

const props = defineProps({
  // The good-receive record (with supplier, store, items, notes, status, …).
  gr: { type: Object, required: true },
})

const { t } = useI18n()

function fmtQty(val) {
  const n = parseFloat(val) || 0
  return n % 1 === 0 ? String(n) : n.toFixed(4).replace(/\.?0+$/, '')
}

const totalGross = computed(() =>
  (props.gr?.items || []).reduce((s, i) => s + Number(i.qty) * Number(i.cost), 0)
)
const totalNet = computed(() =>
  (props.gr?.items || []).reduce((s, i) => s + Number(i.netAmount || 0), 0)
)

const fillerRows = computed(() => Math.max(0, 8 - (props.gr?.items?.length || 0)))
const signatures = ['Received By', 'Approved By']

const stampLabel = computed(() => {
  const s = props.gr?.status
  if (s === 'draft')     return 'Draft'
  if (s === 'confirmed') return 'Received'
  return ''
})
const stampClass = computed(() => {
  if (props.gr?.status === 'confirmed') return 'text-green-600 border-green-600'
  return 'text-[#1C2434] border-[#1C2434]'
})
</script>
