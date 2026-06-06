<template>
  <DocFrame :stamp-label="stampLabel" :stamp-class="stampClass">
    <!-- Header -->
    <DocHeader :title="t('erp.po.title')" title-uppercase
      phone-label="Tel:" tax-id-label="Tax ID:" muted-tax-id-label show-email show-website />

    <!-- Vendor + meta boxes -->
    <div class="mt-5 grid grid-cols-1 sm:grid-cols-2 border border-[#1C2434]">
      <div class="p-3 border-b sm:border-b-0 sm:border-r border-[#1C2434] text-[12px] space-y-1.5">
        <div class="grid grid-cols-[88px_1fr] gap-x-2">
          <span class="text-[#637381]">{{ t('erp.po.vendor') }}</span>
          <span class="font-semibold text-[#1C2434]">
            {{ po.vendor?.name || '—' }}
            <span v-if="po.vendor?.code" class="font-mono text-[11px] text-[#9BA7B0]">({{ po.vendor.code }})</span>
          </span>
        </div>
        <div class="grid grid-cols-[88px_1fr] gap-x-2">
          <span class="text-[#637381]">{{ t('erp.po.deliveryDate') }}</span>
          <span class="font-medium text-[#1C2434] tabular-nums">{{ fmtDate(po.deliveryDate) || '—' }}</span>
        </div>
      </div>
      <div class="p-3 text-[12px] space-y-1.5">
        <div class="grid grid-cols-[110px_1fr] gap-x-2">
          <span class="text-[#637381]">{{ t('erp.po.colRefNo') }}</span>
          <span class="font-bold text-[#1C2434] tabular-nums">{{ po.refNo }}</span>
        </div>
        <div class="grid grid-cols-[110px_1fr] gap-x-2">
          <span class="text-[#637381]">{{ t('erp.po.date') }}</span>
          <span class="font-medium text-[#1C2434] tabular-nums">{{ fmtDate(po.date) || '—' }}</span>
        </div>
        <div v-if="po.requisition" class="grid grid-cols-[110px_1fr] gap-x-2">
          <span class="text-[#637381]">PR</span>
          <RouterLink :to="`/erp/purchasing/requisitions/${po.requisition.id}`"
            class="font-medium text-primary-600 hover:underline">{{ po.requisition.refNo }}</RouterLink>
        </div>
        <div class="grid grid-cols-[110px_1fr] gap-x-2">
          <span class="text-[#637381]">{{ t('erp.common.currency') }}</span>
          <span class="font-medium text-[#1C2434] tabular-nums">{{ po.currency || '—' }}</span>
        </div>
      </div>
    </div>

    <!-- Line items -->
    <table class="w-full mt-4 border-collapse text-[12px] table-fixed">
      <thead>
        <tr class="bg-[#FAFBFD] text-[10px] font-bold text-[#1C2434] uppercase tracking-wide">
          <th class="border border-[#1C2434] px-2 py-2 text-right w-[32px]">#</th>
          <th class="border border-[#1C2434] px-2 py-2 text-left w-[96px]">{{ t('erp.po.colCode') }}</th>
          <th class="border border-[#1C2434] px-2 py-2 text-left w-[282px]">{{ t('erp.po.colItem') }}</th>
          <th class="border border-[#1C2434] px-2 py-2 text-right w-[60px]">{{ t('erp.po.colQty') }}</th>
          <th class="border border-[#1C2434] px-2 py-2 text-right w-[86px]">{{ t('erp.po.colUnitPrice') }}</th>
          <th class="border border-[#1C2434] px-2 py-2 text-right w-[95px]">{{ t('erp.po.colSubtotal') }}</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="(item, idx) in (po.items || [])" :key="item.id" class="align-top">
          <td class="border-x border-b border-x-[#1C2434] border-b-[#E2E8F0] px-2 py-1.5 text-right tabular-nums text-[#9BA7B0]">{{ idx + 1 }}</td>
          <td class="border-x border-b border-x-[#1C2434] border-b-[#E2E8F0] px-2 py-1.5 font-mono text-[11px] text-[#637381]">{{ item.product?.sku || '—' }}</td>
          <td class="border-x border-b border-x-[#1C2434] border-b-[#E2E8F0] px-2 py-1.5">
            <span class="text-[#1C2434]">{{ item.product?.name || item.description || '—' }}</span>
            <span v-if="item.product?.name && item.description" class="block text-[11px] text-[#9BA7B0]">{{ item.description }}</span>
          </td>
          <td class="border-x border-b border-x-[#1C2434] border-b-[#E2E8F0] px-2 py-1.5 text-right tabular-nums text-[#374151]">{{ Number(item.qty) }}</td>
          <td class="border-x border-b border-x-[#1C2434] border-b-[#E2E8F0] px-2 py-1.5 text-right tabular-nums text-[#374151]">{{ fmtMoney(item.unitPrice) }}</td>
          <td class="border-x border-b border-x-[#1C2434] border-b-[#E2E8F0] px-2 py-1.5 text-right tabular-nums font-medium text-[#1C2434]">{{ fmtMoney(Number(item.qty) * Number(item.unitPrice)) }}</td>
        </tr>
        <DocFillerRows :count="fillerRows" :cols="6" />
      </tbody>
    </table>

    <!-- Amount-in-words + totals -->
    <DocSummary :total-in-words="totalInWords">
      <template #notes>
        <div class="p-3 text-[11px] text-[#374151] space-y-1">
          <div v-if="po.notes" class="grid grid-cols-[64px_1fr] gap-x-2">
            <span class="text-[#9BA7B0]">{{ t('erp.po.notes') }}</span>
            <span class="whitespace-pre-line leading-snug">{{ po.notes }}</span>
          </div>
          <p v-else class="text-[#9BA7B0] italic">—</p>
        </div>
      </template>
      <template #totals>
        <div class="flex items-center justify-between px-3 pt-[7px] pb-[9px] border-b border-[#1C2434]">
          <span class="text-[#637381]">{{ t('erp.po.totalItems') }}</span>
          <span class="tabular-nums text-[#1C2434]">{{ totalQty }}</span>
        </div>
        <div class="flex items-center justify-between px-3 py-2 bg-[#FAFBFD]">
          <span class="font-bold text-[#1C2434]">{{ t('erp.po.grandTotal') }}</span>
          <span class="font-extrabold text-[#1C2434] tabular-nums">{{ grandTotalFmt }}</span>
        </div>
      </template>
    </DocSummary>

    <!-- Signatures -->
    <DocSignatures :signatures="signatures" :date-label="t('erp.po.date')" />
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

const props = defineProps({ po: { type: Object, required: true } })

const { t, locale } = useI18n()

const fillerRows  = computed(() => Math.max(0, 8 - (props.po.items?.length || 0)))
const signatures  = ['Authorised Signature', 'Vendor Acceptance']
const totalQty    = computed(() => (props.po.items || []).reduce((s, i) => s + Number(i.qty), 0).toLocaleString())
const grandTotal  = computed(() => (props.po.items || []).reduce((s, i) => s + Number(i.qty) * Number(i.unitPrice), 0))
const grandTotalFmt  = computed(() => fmtMoney(grandTotal.value))
const totalInWords   = computed(() => numToWords(grandTotal.value, locale.value, props.po.currency))

const stampLabel = computed(() => {
  const s = props.po.status
  if (s === 'draft')     return 'Draft'
  if (s === 'cancelled') return 'Cancelled'
  return ''
})
const stampClass = computed(() => {
  if (props.po.status === 'cancelled') return 'text-red-600 border-red-600'
  return 'text-[#1C2434] border-[#1C2434]'
})
</script>
