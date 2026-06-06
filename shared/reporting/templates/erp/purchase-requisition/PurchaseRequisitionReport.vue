<template>
  <DocFrame :stamp-label="stampLabel" :stamp-class="stampClass">
    <!-- Header -->
    <DocHeader :title="t('erp.purchasing.title')" title-uppercase
      phone-label="Tel:" tax-id-label="Tax ID:" muted-tax-id-label show-email show-website />

    <!-- Requestor/Vendor + meta boxes -->
    <div class="mt-5 grid grid-cols-1 sm:grid-cols-2 border border-[#1C2434]">
      <div class="p-3 border-b sm:border-b-0 sm:border-r border-[#1C2434] text-[12px] space-y-1.5">
        <div class="grid grid-cols-[88px_1fr] gap-x-2">
          <span class="text-[#637381]">{{ t('erp.purchasing.requestedBy') }}</span>
          <span class="font-semibold text-[#1C2434]">{{ req.requestedBy || '—' }}</span>
        </div>
        <div class="grid grid-cols-[88px_1fr] gap-x-2">
          <span class="text-[#637381]">{{ t('erp.purchasing.vendor') }}</span>
          <span class="font-semibold text-[#1C2434]">
            {{ req.vendor?.name || '—' }}
            <span v-if="req.vendor?.code" class="font-mono text-[11px] text-[#9BA7B0]">({{ req.vendor.code }})</span>
          </span>
        </div>
      </div>
      <div class="p-3 text-[12px] space-y-1.5">
        <div class="grid grid-cols-[110px_1fr] gap-x-2">
          <span class="text-[#637381]">{{ t('erp.purchasing.colRefNo') }}</span>
          <span class="font-bold text-[#1C2434] tabular-nums">{{ req.refNo }}</span>
        </div>
        <div class="grid grid-cols-[110px_1fr] gap-x-2">
          <span class="text-[#637381]">{{ t('erp.purchasing.date') }}</span>
          <span class="font-medium text-[#1C2434] tabular-nums">{{ fmtDate(req.date) || '—' }}</span>
        </div>
        <div class="grid grid-cols-[110px_1fr] gap-x-2">
          <span class="text-[#637381]">{{ t('erp.purchasing.department') }}</span>
          <span class="font-medium text-[#1C2434]">{{ req.department || '—' }}</span>
        </div>
        <div class="grid grid-cols-[110px_1fr] gap-x-2">
          <span class="text-[#637381]">{{ t('erp.common.currency') }}</span>
          <span class="font-medium text-[#1C2434] tabular-nums">{{ req.currency || '—' }}</span>
        </div>
      </div>
    </div>

    <!-- Line items -->
    <table class="w-full mt-4 border-collapse text-[12px] table-fixed">
      <thead>
        <tr class="bg-[#FAFBFD] text-[10px] font-bold text-[#1C2434] uppercase tracking-wide">
          <th class="border border-[#1C2434] px-2 py-2 text-right w-[32px]">#</th>
          <th class="border border-[#1C2434] px-2 py-2 text-left w-[88px]">{{ t('erp.common.sku') }}</th>
          <th class="border border-[#1C2434] px-2 py-2 text-left w-[290px]">{{ t('erp.purchasing.colItem') }}</th>
          <th class="border border-[#1C2434] px-2 py-2 text-right w-[64px]">{{ t('erp.purchasing.colQty') }}</th>
          <th class="border border-[#1C2434] px-2 py-2 text-right w-[84px]">{{ t('erp.purchasing.colUnitPrice') }}</th>
          <th class="border border-[#1C2434] px-2 py-2 text-right w-[93px]">{{ t('erp.purchasing.colSubtotal') }}</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="(item, idx) in (req.items || [])" :key="item.id" class="align-top">
          <td class="border-x border-b border-x-[#1C2434] border-b-[#E2E8F0] px-2 py-1.5 text-right tabular-nums text-[#9BA7B0]">{{ idx + 1 }}</td>
          <td class="border-x border-b border-x-[#1C2434] border-b-[#E2E8F0] px-2 py-1.5 font-mono text-[11px] text-[#637381]">{{ item.product?.sku || '—' }}</td>
          <td class="border-x border-b border-x-[#1C2434] border-b-[#E2E8F0] px-2 py-1.5">
            <span class="text-[#1C2434]">{{ item.product?.name || item.description || '—' }}</span>
            <span v-if="item.product?.name && item.description" class="block text-[11px] text-[#9BA7B0]">{{ item.description }}</span>
          </td>
          <td class="border-x border-b border-x-[#1C2434] border-b-[#E2E8F0] px-2 py-1.5 text-right tabular-nums text-[#374151]">{{ Number(item.qty) }}</td>
          <td class="border-x border-b border-x-[#1C2434] border-b-[#E2E8F0] px-2 py-1.5 text-right tabular-nums text-[#374151]">{{ item.unitPrice != null ? fmtMoney(item.unitPrice) : '—' }}</td>
          <td class="border-x border-b border-x-[#1C2434] border-b-[#E2E8F0] px-2 py-1.5 text-right tabular-nums font-medium text-[#1C2434]">{{ item.unitPrice != null ? fmtMoney(Number(item.qty) * Number(item.unitPrice)) : '—' }}</td>
        </tr>
        <DocFillerRows :count="fillerRows" :cols="6" />
      </tbody>
    </table>

    <!-- Notes + totals -->
    <DocSummary>
      <template #notes>
        <div class="p-3 text-[11px] text-[#374151] space-y-1">
          <div v-if="req.notes" class="grid grid-cols-[64px_1fr] gap-x-2">
            <span class="text-[#9BA7B0]">{{ t('erp.purchasing.notes') }}</span>
            <span class="whitespace-pre-line leading-snug">{{ req.notes }}</span>
          </div>
          <p v-else class="text-[#9BA7B0] italic">—</p>
        </div>
      </template>
      <template #totals>
        <div class="flex items-center justify-between px-3 pt-[7px] pb-[9px] border-b border-[#1C2434]">
          <span class="text-[#637381]">{{ t('erp.purchasing.totalQty') }}</span>
          <span class="tabular-nums text-[#1C2434]">{{ totalQty }}</span>
        </div>
        <div class="flex items-center justify-between px-3 py-2 bg-[#FAFBFD]">
          <span class="font-bold text-[#1C2434]">{{ t('erp.purchasing.estimatedTotal') }}</span>
          <span class="font-extrabold text-[#1C2434] tabular-nums">{{ estimatedTotal }}</span>
        </div>
      </template>
    </DocSummary>

    <!-- Signatures -->
    <DocSignatures :signatures="signatures" :date-label="t('erp.purchasing.date')" />
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

const props = defineProps({ req: { type: Object, required: true } })

const { t } = useI18n()

const fillerRows     = computed(() => Math.max(0, 8 - (props.req.items?.length || 0)))
const signatures     = ['Requested By', 'Approved By']
const totalQty       = computed(() => (props.req.items || []).reduce((s, i) => s + Number(i.qty), 0).toLocaleString())
const estimatedTotal = computed(() =>
  fmtMoney((props.req.items || []).reduce((s, i) => s + Number(i.qty) * (Number(i.unitPrice) || 0), 0))
)

const stampLabel = computed(() => {
  const s = props.req.status
  if (s === 'draft')    return 'Draft'
  if (s === 'approved') return 'Approved'
  if (s === 'rejected') return 'Rejected'
  return ''
})
const stampClass = computed(() => {
  const s = props.req.status
  if (s === 'rejected') return 'text-red-600 border-red-600'
  if (s === 'approved') return 'text-green-600 border-green-600'
  return 'text-[#1C2434] border-[#1C2434]'
})
</script>
