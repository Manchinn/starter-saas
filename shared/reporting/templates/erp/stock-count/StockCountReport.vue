<template>
  <!-- ── Stock-count document (receipt tax-invoice layout) ──────────── -->
  <DocFrame :stamp-label="stampLabel" :stamp-class="stampClass">
    <!-- Header -->
    <DocHeader :title="t('erp.stockCount.documentTitle')"
      :phone-label="t('erp.orders.docPhoneAbbr')" :tax-id-label="t('erp.orders.docTaxId')" show-email />

    <!-- Store + meta boxes -->
    <div class="mt-5 grid grid-cols-1 sm:grid-cols-2 border border-[#1C2434]">
      <div class="p-3 border-b sm:border-b-0 sm:border-r border-[#1C2434] text-[12px] space-y-1.5">
        <div class="grid grid-cols-[78px_1fr] gap-x-2">
          <span class="text-[#637381]">{{ t('erp.common.store') }}</span>
          <span class="font-semibold text-[#1C2434]">{{ sc.store?.name || '—' }}</span>
        </div>
        <div class="grid grid-cols-[78px_1fr] gap-x-2">
          <span class="text-[#637381]">{{ t('erp.common.code') }}</span>
          <span class="font-medium text-[#1C2434] font-mono">{{ sc.store?.code || '—' }}</span>
        </div>
      </div>
      <div class="p-3 text-[12px] space-y-1.5">
        <div class="grid grid-cols-[124px_1fr] gap-x-2">
          <span class="text-[#637381]">{{ t('erp.stockCount.colRefNo') }}</span>
          <span class="font-bold text-[#1C2434] tabular-nums">{{ sc.refNo }}</span>
        </div>
        <div class="grid grid-cols-[124px_1fr] gap-x-2">
          <span class="text-[#637381]">{{ t('erp.common.date') }}</span>
          <span class="font-medium text-[#1C2434] tabular-nums">{{ fmtDate(sc.date) || '—' }}</span>
        </div>
        <div class="grid grid-cols-[124px_1fr] gap-x-2">
          <span class="text-[#637381]">{{ t('erp.stockCount.movementLocked') }}</span>
          <span class="font-medium flex items-center gap-1.5"
            :class="sc.movementLocked ? 'text-red-600' : 'text-[#1C2434]'">
            <LockClosedIcon v-if="sc.movementLocked" class="w-3.5 h-3.5" />
            <LockOpenIcon   v-else                  class="w-3.5 h-3.5 text-[#9BA7B0]" />
            {{ sc.movementLocked ? 'Yes' : 'No' }}
          </span>
        </div>
      </div>
    </div>

    <!-- Line items -->
    <table class="w-full mt-4 border-collapse text-[12px] table-fixed">
      <thead>
        <tr class="bg-[#FAFBFD] text-[10px] font-bold text-[#1C2434] uppercase tracking-wide">
          <th class="border border-[#1C2434] px-2 py-2 text-right w-[36px]">#</th>
          <th class="border border-[#1C2434] px-2 py-2 text-left w-[120px]">{{ t('erp.stockCount.colSku') }}</th>
          <th class="border border-[#1C2434] px-2 py-2 text-left w-[258px]">{{ t('erp.stockCount.colProduct') }}</th>
          <th class="border border-[#1C2434] px-2 py-2 text-right w-[80px]">{{ t('erp.stockCount.colSystemQty') }}</th>
          <th class="border border-[#1C2434] px-2 py-2 text-right w-[80px]">{{ t('erp.stockCount.colCountedQty') }}</th>
          <th class="border border-[#1C2434] px-2 py-2 text-right w-[81px]">{{ t('erp.stockCount.colVariance') }}</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="(item, idx) in sc.items" :key="item.id" class="align-top">
          <td class="border-x border-b border-x-[#1C2434] border-b-[#E2E8F0] px-2 py-1.5 text-right tabular-nums text-[#9BA7B0]">{{ idx + 1 }}</td>
          <td class="border-x border-b border-x-[#1C2434] border-b-[#E2E8F0] px-2 py-1.5 font-mono text-[11px] text-[#637381]">{{ item.product?.sku || '—' }}</td>
          <td class="border-x border-b border-x-[#1C2434] border-b-[#E2E8F0] px-2 py-1.5">
            <span class="text-[#1C2434]">{{ item.product?.name || '—' }}</span>
          </td>
          <td class="border-x border-b border-x-[#1C2434] border-b-[#E2E8F0] px-2 py-1.5 text-right tabular-nums text-[#374151]">{{ item.systemQty }}</td>
          <td class="border-x border-b border-x-[#1C2434] border-b-[#E2E8F0] px-2 py-1.5 text-right tabular-nums font-medium text-[#1C2434]">{{ item.countedQty }}</td>
          <td class="border-x border-b border-x-[#1C2434] border-b-[#E2E8F0] px-2 py-1.5 text-right tabular-nums font-bold"
            :class="variance(item) > 0 ? 'text-green-700' : variance(item) < 0 ? 'text-red-600' : 'text-[#9BA7B0]'">
            {{ variance(item) > 0 ? '+' : '' }}{{ variance(item) }}
          </td>
        </tr>
        <DocFillerRows :count="fillerRows" :cols="6" />
      </tbody>
    </table>

    <!-- Notes + variance totals -->
    <DocSummary>
      <template #notes>
        <div class="p-3 text-[11px] text-[#374151] space-y-1">
          <div v-if="sc.notes" class="grid grid-cols-[64px_1fr] gap-x-2">
            <span class="text-[#9BA7B0]">{{ t('erp.common.notes') }}</span>
            <span class="whitespace-pre-line leading-snug">{{ sc.notes }}</span>
          </div>
          <p v-else class="text-[#9BA7B0] italic">—</p>
        </div>
      </template>
      <template #totals>
        <div class="flex items-center justify-between px-3 pt-[7px] pb-[9px] border-b border-[#1C2434]">
          <span class="text-[#637381]">{{ t('erp.stockCount.totalProducts') }}</span>
          <span class="tabular-nums text-[#1C2434]">{{ sc.items.length }}</span>
        </div>
        <div class="flex items-center justify-between px-3 py-1.5 border-b border-[#1C2434]">
          <span class="text-[#637381]">{{ t('erp.stockCount.variancesFound') }}</span>
          <span class="tabular-nums"
            :class="varianceCount > 0 ? 'text-amber-700' : 'text-green-700'">{{ varianceCount }}</span>
        </div>
        <div class="flex items-center justify-between px-3 py-2 bg-[#FAFBFD]">
          <span class="font-bold text-[#1C2434]">{{ t('erp.stockCount.netVariance') }}</span>
          <span class="font-extrabold tabular-nums"
            :class="netVariance > 0 ? 'text-green-700' : netVariance < 0 ? 'text-red-600' : 'text-[#1C2434]'">
            {{ netVariance > 0 ? '+' : '' }}{{ netVariance }}
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
import { LockClosedIcon, LockOpenIcon } from '@heroicons/vue/24/outline'
import { fmtDate } from '@/utils/fmt'
import DocFrame from '@shared/reporting/templates/components/DocFrame.vue'
import DocHeader from '@shared/reporting/templates/components/DocHeader.vue'
import DocSummary from '@shared/reporting/templates/components/DocSummary.vue'
import DocSignatures from '@shared/reporting/templates/components/DocSignatures.vue'
import DocFillerRows from '@shared/reporting/templates/components/DocFillerRows.vue'

const props = defineProps({
  // The stock-count record (with store, items, notes, status, …).
  sc: { type: Object, required: true },
})

const { t } = useI18n()

function variance(item) {
  return parseFloat(item.countedQty) - parseFloat(item.systemQty)
}

const varianceCount = computed(() => (props.sc?.items || []).filter((i) => variance(i) !== 0).length)
const netVariance   = computed(() => (props.sc?.items || []).reduce((sum, i) => sum + variance(i), 0))

const fillerRows = computed(() => Math.max(0, 8 - (props.sc?.items?.length || 0)))
const signatures = computed(() => [
  t('erp.stockCount.docPreparedBy'),
  t('erp.stockCount.docApprovedBy'),
])
const stampLabel = computed(() => {
  const s = props.sc?.status
  if (s === 'draft')     return 'Draft'
  if (s === 'confirmed') return 'Confirmed'
  return ''
})
const stampClass = computed(() =>
  props.sc?.status === 'confirmed'
    ? 'text-green-600 border-green-600'
    : 'text-amber-500 border-amber-400'
)
</script>
