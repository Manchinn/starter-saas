<template>
  <!-- ── Stock-return document (receipt tax-invoice layout) ─────────── -->
  <DocFrame :stamp-label="stampLabel" :stamp-class="stampClass">
    <!-- Header (custom title block: document title + return-type badge) -->
    <DocHeader :phone-label="t('erp.orders.docPhoneAbbr')" :tax-id-label="t('erp.orders.docTaxId')" show-email>
      <template #title>
        <h2 class="text-[18px] font-bold text-[#1C2434] leading-tight">{{ t('erp.stockReturn.documentTitle') }}</h2>
        <p class="mt-1 text-[10px] font-bold tracking-wider uppercase"
          :class="sr.type === 'customer_return' ? 'text-blue-600' : 'text-orange-600'">
          {{ sr.type === 'customer_return' ? t('erp.stockReturn.customerReturn') : t('erp.stockReturn.returnToVendor') }}
        </p>
      </template>
    </DocHeader>

    <!-- Counterparty + meta boxes -->
    <div class="mt-5 grid grid-cols-1 sm:grid-cols-2 border border-[#1C2434]">
      <div class="p-3 border-b sm:border-b-0 sm:border-r border-[#1C2434] text-[12px] space-y-1.5">
        <div class="grid grid-cols-[78px_1fr] gap-x-2">
          <span class="text-[#637381]">
            {{ sr.type === 'customer_return' ? t('erp.stockReturn.customer') : t('erp.stockReturn.vendor') }}
          </span>
          <span class="font-semibold text-[#1C2434]">
            {{ sr.type === 'customer_return' ? (sr.customer?.name || '—') : (sr.vendor?.name || '—') }}
            <span v-if="sr.type === 'vendor_return' && sr.vendor?.code" class="font-mono text-[11px] text-[#9BA7B0]">({{ sr.vendor.code }})</span>
            <span v-if="sr.type === 'customer_return' && sr.customer?.company" class="block font-normal text-[11px] text-[#637381]">{{ sr.customer.company }}</span>
          </span>
        </div>
        <div class="grid grid-cols-[78px_1fr] gap-x-2">
          <span class="text-[#637381]">{{ t('erp.common.store') }}</span>
          <span class="font-semibold text-[#1C2434]">
            {{ sr.store?.name || '—' }}
            <span v-if="sr.store?.code" class="font-mono text-[11px] text-[#9BA7B0]">({{ sr.store.code }})</span>
          </span>
        </div>
      </div>
      <div class="p-3 text-[12px] space-y-1.5">
        <div class="grid grid-cols-[124px_1fr] gap-x-2">
          <span class="text-[#637381]">{{ t('erp.stockReturn.colRefNo') }}</span>
          <span class="font-bold text-[#1C2434] tabular-nums">{{ sr.refNo }}</span>
        </div>
        <div class="grid grid-cols-[124px_1fr] gap-x-2">
          <span class="text-[#637381]">{{ t('erp.common.date') }}</span>
          <span class="font-medium text-[#1C2434] tabular-nums">{{ fmtDate(sr.date) || '—' }}</span>
        </div>
      </div>
    </div>

    <!-- Line items -->
    <table class="w-full mt-4 border-collapse text-[12px] table-fixed">
      <thead>
        <tr class="bg-[#FAFBFD] text-[10px] font-bold text-[#1C2434] uppercase tracking-wide">
          <th class="border border-[#1C2434] px-2 py-2 text-right w-[36px]">#</th>
          <th class="border border-[#1C2434] px-2 py-2 text-left w-[104px]">{{ t('erp.stockReturn.colSku') }}</th>
          <th class="border border-[#1C2434] px-2 py-2 text-left w-[260px]">{{ t('erp.common.product') }}</th>
          <th class="border border-[#1C2434] px-2 py-2 text-right w-[55px]">{{ t('erp.stockReturn.colQty') }}</th>
          <th class="border border-[#1C2434] px-2 py-2 text-right w-[80px]">{{ t('erp.stockReturn.colCost') }}</th>
          <th class="border border-[#1C2434] px-2 py-2 text-right w-[100px]">{{ t('erp.stockReturn.totalValue') }}</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="(item, idx) in (sr.items || [])" :key="item.id" class="align-top">
          <td class="border-x border-b border-x-[#1C2434] border-b-[#E2E8F0] px-2 py-1.5 text-right tabular-nums text-[#9BA7B0]">{{ idx + 1 }}</td>
          <td class="border-x border-b border-x-[#1C2434] border-b-[#E2E8F0] px-2 py-1.5 font-mono text-[11px] text-[#637381]">{{ item.product?.sku || '—' }}</td>
          <td class="border-x border-b border-x-[#1C2434] border-b-[#E2E8F0] px-2 py-1.5">
            <span class="text-[#1C2434]">{{ item.product?.name || '—' }}</span>
            <span v-if="item.batchId" class="block text-[10px] text-[#9BA7B0] font-mono mt-0.5">
              {{ t('erp.common.batchId') }}: {{ item.batchId }}
            </span>
            <span v-if="item.reason" class="block text-[10px] text-[#9BA7B0] mt-0.5">{{ item.reason }}</span>
          </td>
          <td class="border-x border-b border-x-[#1C2434] border-b-[#E2E8F0] px-2 py-1.5 text-right tabular-nums font-bold"
            :class="sr.type === 'customer_return' ? 'text-green-700' : 'text-red-600'">
            {{ sr.type === 'customer_return' ? '+' : '−' }}{{ Number(item.qty) }}
          </td>
          <td class="border-x border-b border-x-[#1C2434] border-b-[#E2E8F0] px-2 py-1.5 text-right tabular-nums text-[#374151]">{{ fmtMoney(item.cost) }}</td>
          <td class="border-x border-b border-x-[#1C2434] border-b-[#E2E8F0] px-2 py-1.5 text-right tabular-nums font-medium text-[#1C2434]">{{ fmtMoney(Number(item.qty) * Number(item.cost)) }}</td>
        </tr>
        <DocFillerRows :count="fillerRows" :cols="6" />
      </tbody>
    </table>

    <!-- Notes + return totals -->
    <DocSummary>
      <template #notes>
        <div class="p-3 text-[11px] text-[#374151] space-y-1">
          <div v-if="sr.notes" class="grid grid-cols-[64px_1fr] gap-x-2">
            <span class="text-[#9BA7B0]">{{ t('erp.common.notes') }}</span>
            <span class="whitespace-pre-line leading-snug">{{ sr.notes }}</span>
          </div>
          <p v-else class="text-[#9BA7B0] italic">—</p>
        </div>
      </template>
      <template #totals>
        <div class="flex items-center justify-between px-3 pt-[7px] pb-[9px] border-b border-[#1C2434]">
          <span class="text-[#637381]">{{ t('erp.common.items') }}</span>
          <span class="tabular-nums text-[#1C2434]">{{ (sr.items || []).length }}</span>
        </div>
        <div class="flex items-center justify-between px-3 py-1.5 border-b border-[#1C2434]">
          <span class="text-[#637381]">{{ t('erp.stockReturn.totalReturnQty') }}</span>
          <span class="tabular-nums font-medium"
            :class="sr.type === 'customer_return' ? 'text-green-700' : 'text-red-600'">
            {{ sr.type === 'customer_return' ? '+' : '−' }}{{ totalQty }}
          </span>
        </div>
        <div class="flex items-center justify-between px-3 py-2 bg-[#FAFBFD]">
          <span class="font-bold text-[#1C2434]">{{ t('erp.stockReturn.totalValue') }}</span>
          <span class="font-extrabold text-[#1C2434] tabular-nums">{{ fmtMoney(totalValue) }}</span>
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
  // The stock-return record (with type, customer/vendor, store, items, status, …).
  sr: { type: Object, required: true },
})

const { t } = useI18n()

const totalQty   = computed(() => (props.sr?.items || []).reduce((s, i) => s + (Number(i.qty) || 0), 0))
const totalValue = computed(() => (props.sr?.items || []).reduce((s, i) => s + ((Number(i.qty) || 0) * (Number(i.cost) || 0)), 0))

const fillerRows = computed(() => Math.max(0, 8 - (props.sr?.items?.length || 0)))
const signatures = computed(() => [
  t('erp.stockReturn.docPreparedBy'),
  t('erp.stockReturn.docApprovedBy'),
])
const stampLabel = computed(() => {
  const s = props.sr?.status
  if (s === 'draft')     return 'Draft'
  if (s === 'confirmed') return 'Confirmed'
  return ''
})
const stampClass = computed(() =>
  props.sr?.status === 'confirmed'
    ? 'text-green-600 border-green-600'
    : 'text-amber-500 border-amber-400'
)
</script>
