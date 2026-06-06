<template>
  <!-- ── Journal document (double-entry ledger layout) ──────────────── -->
  <DocFrame :stamp-label="stampLabel" :stamp-class="stampClass">
    <!-- Header -->
    <DocHeader :title="t('erp.journals.title')" title-uppercase
      phone-label="Tel:" tax-id-label="Tax ID:" muted-tax-id-label show-email show-website />

    <!-- Description + meta boxes -->
    <div class="mt-5 grid grid-cols-1 sm:grid-cols-2 border border-[#1C2434]">
      <div class="p-3 border-b sm:border-b-0 sm:border-r border-[#1C2434] text-[12px] space-y-1.5">
        <div class="grid grid-cols-[78px_1fr] gap-x-2">
          <span class="text-[#637381]">{{ t('erp.journals.colDescription') }}</span>
          <span class="text-[#1C2434] whitespace-pre-line leading-snug">{{ journal.description || '—' }}</span>
        </div>
        <div class="grid grid-cols-[78px_1fr] gap-x-2">
          <span class="text-[#637381]">{{ t('erp.common.source') }}</span>
          <span class="font-medium text-[#1C2434]">{{ journal.sourceType || 'Manual' }}</span>
        </div>
      </div>
      <div class="p-3 text-[12px] space-y-1.5">
        <div class="grid grid-cols-[110px_1fr] gap-x-2">
          <span class="text-[#637381]">{{ t('erp.journals.colRefNo') }}</span>
          <span class="font-bold text-[#1C2434] tabular-nums">{{ journal.refNo }}</span>
        </div>
        <div class="grid grid-cols-[110px_1fr] gap-x-2">
          <span class="text-[#637381]">{{ t('erp.common.date') }}</span>
          <span class="font-medium text-[#1C2434] tabular-nums">{{ fmtDate(journal.date) || '—' }}</span>
        </div>
        <div class="grid grid-cols-[110px_1fr] gap-x-2">
          <span class="text-[#637381]">{{ t('erp.journals.lines') }}</span>
          <span class="font-medium text-[#1C2434] tabular-nums">{{ journal.lines?.length || 0 }}</span>
        </div>
      </div>
    </div>

    <!-- Lines -->
    <table class="w-full mt-4 border-collapse text-[12px] table-fixed">
      <thead>
        <tr class="bg-[#FAFBFD] text-[10px] font-bold text-[#1C2434] uppercase tracking-wide">
          <th class="border border-[#1C2434] px-2 py-2 text-right w-[32px]">#</th>
          <th class="border border-[#1C2434] px-2 py-2 text-left w-[190px]">{{ t('erp.journals.colAccount') }}</th>
          <th class="border border-[#1C2434] px-2 py-2 text-left">{{ t('erp.journals.colDescription') }}</th>
          <th class="border border-[#1C2434] px-2 py-2 text-right w-[108px]">{{ t('erp.journals.colDebit') }}</th>
          <th class="border border-[#1C2434] px-2 py-2 text-right w-[108px]">{{ t('erp.journals.colCredit') }}</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="(line, idx) in (journal.lines || [])" :key="line.id" class="align-top">
          <td class="border-x border-b border-x-[#1C2434] border-b-[#E2E8F0] px-2 py-1.5 text-right tabular-nums text-[#9BA7B0]">{{ line.lineNo || idx + 1 }}</td>
          <td class="border-x border-b border-x-[#1C2434] border-b-[#E2E8F0] px-2 py-1.5">
            <span class="text-[#1C2434]">{{ line.account?.name || '—' }}</span>
            <span class="block text-[10px] font-mono text-[#9BA7B0]">{{ line.account?.code }}</span>
          </td>
          <td class="border-x border-b border-x-[#1C2434] border-b-[#E2E8F0] px-2 py-1.5 text-[#637381] whitespace-pre-line leading-snug">{{ line.description || '—' }}</td>
          <td class="border-x border-b border-x-[#1C2434] border-b-[#E2E8F0] px-2 py-1.5 text-right tabular-nums font-medium text-[#1C2434]">{{ Number(line.debit) > 0 ? fmtMoney(line.debit) : '' }}</td>
          <td class="border-x border-b border-x-[#1C2434] border-b-[#E2E8F0] px-2 py-1.5 text-right tabular-nums font-medium text-[#1C2434]">{{ Number(line.credit) > 0 ? fmtMoney(line.credit) : '' }}</td>
        </tr>
        <DocFillerRows :count="fillerRows" :cols="5" />
        <!-- Totals row (double-entry must balance) -->
        <tr class="bg-[#FAFBFD] font-bold text-[#1C2434]">
          <td colspan="3" class="border border-[#1C2434] px-2 py-2 text-right text-[11px] uppercase tracking-wider">{{ t('erp.journals.totals') }}</td>
          <td class="border border-[#1C2434] px-2 py-2 text-right tabular-nums">{{ fmtMoney(journal.totalDebit) }}</td>
          <td class="border border-[#1C2434] px-2 py-2 text-right tabular-nums">{{ fmtMoney(journal.totalDebit) }}</td>
        </tr>
      </tbody>
    </table>

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
import DocSignatures from '@shared/reporting/templates/components/DocSignatures.vue'
import DocFillerRows from '@shared/reporting/templates/components/DocFillerRows.vue'

const props = defineProps({
  journal: { type: Object, required: true },
})

const { t } = useI18n()

const fillerRows = computed(() => Math.max(0, 8 - (props.journal?.lines?.length || 0)))
const signatures = ['Prepared By', 'Approved By']

const stampLabel = computed(() => {
  const s = props.journal?.status
  if (s === 'draft')  return 'Draft'
  if (s === 'posted') return 'Posted'
  if (s === 'voided') return 'Voided'
  return ''
})
const stampClass = computed(() => {
  const s = props.journal?.status
  if (s === 'voided') return 'text-red-600 border-red-600'
  if (s === 'posted') return 'text-green-600 border-green-600'
  return 'text-[#1C2434] border-[#1C2434]'
})
</script>
