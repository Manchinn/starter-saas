<template>
  <AppLayout>
    <div class="space-y-5">

      <!-- Header -->
      <div class="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 class="text-xl font-semibold text-[#1C2434]">{{ t('erp.reports.trialBalance.title') }}</h1>
          <p class="text-sm text-[#637381] mt-0.5">{{ t('erp.reports.trialBalance.subtitle') }}</p>
        </div>
        <button @click="printReport" class="btn-secondary flex items-center gap-1.5">
          <PrinterIcon class="w-4 h-4" />
          {{ t('erp.reports.trialBalance.print') }}
        </button>
      </div>

      <!-- Filters -->
      <div class="bg-white border border-[#E2E8F0] shadow-sm px-5 py-4 flex flex-wrap gap-4 items-end">
        <div class="flex flex-col gap-1">
          <label class="text-xs font-medium text-[#637381]">{{ t('erp.reports.trialBalance.asOfDate') }}</label>
          <DateInput v-model="asOfDate" @change="fetch" class="input w-44" />
        </div>
        <label class="flex items-center gap-2 text-sm text-[#374151] cursor-pointer pb-1.5">
          <input type="checkbox" v-model="includeZero" @change="fetch" class="rounded border-[#CBD5E1]" />
          {{ t('erp.reports.trialBalance.includeZero') }}
        </label>
      </div>

      <!-- Loading -->
      <div v-if="loading" class="flex justify-center py-16">
        <div class="w-8 h-8 border-2 border-primary-500 border-t-transparent animate-spin"></div>
      </div>

      <template v-else-if="report">
        <!-- Balance indicator -->
        <div class="flex items-center gap-2">
          <span class="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold"
            :class="isBalanced ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'">
            <span class="w-1.5 h-1.5 rounded-full" :class="isBalanced ? 'bg-emerald-500' : 'bg-red-500'"></span>
            {{ isBalanced ? t('erp.reports.trialBalance.balanced') : t('erp.reports.trialBalance.outOfBalance') }}
          </span>
        </div>

        <div v-if="report.rows.length === 0"
          class="bg-white border border-[#E2E8F0] shadow-sm flex flex-col items-center gap-3 py-16">
          <div class="w-12 h-12 bg-[#F1F5F9] flex items-center justify-center">
            <TableCellsIcon class="w-6 h-6 text-[#9BA7B0]" />
          </div>
          <p class="text-sm font-medium text-[#637381]">{{ t('erp.reports.trialBalance.noData') }}</p>
        </div>

        <div v-else class="bg-white border border-[#E2E8F0] shadow-sm overflow-hidden">
          <table class="w-full text-sm">
            <thead>
              <tr class="bg-[#F8FAFC] border-b border-[#E2E8F0]">
                <th class="px-4 py-3 text-left text-xs font-semibold text-[#637381] uppercase tracking-wide w-28">{{ t('erp.reports.trialBalance.colCode') }}</th>
                <th class="px-4 py-3 text-left text-xs font-semibold text-[#637381] uppercase tracking-wide">{{ t('erp.reports.trialBalance.colAccount') }}</th>
                <th class="px-4 py-3 text-right text-xs font-semibold text-[#637381] uppercase tracking-wide w-40">{{ t('erp.reports.trialBalance.colDebit') }}</th>
                <th class="px-4 py-3 text-right text-xs font-semibold text-[#637381] uppercase tracking-wide w-40">{{ t('erp.reports.trialBalance.colCredit') }}</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="row in report.rows" :key="row.code" class="border-b border-[#F1F5F9] hover:bg-[#F8FAFC]">
                <td class="px-4 py-2.5 font-mono text-xs text-[#637381]">{{ row.code }}</td>
                <td class="px-4 py-2.5 text-[#1C2434]">{{ row.name }}</td>
                <td class="px-4 py-2.5 text-right tabular-nums">
                  <span :class="row.debit > 0 ? 'text-[#374151]' : 'text-[#CBD5E1]'">{{ row.debit > 0 ? fmtMoney(row.debit) : '—' }}</span>
                </td>
                <td class="px-4 py-2.5 text-right tabular-nums">
                  <span :class="row.credit > 0 ? 'text-[#374151]' : 'text-[#CBD5E1]'">{{ row.credit > 0 ? fmtMoney(row.credit) : '—' }}</span>
                </td>
              </tr>
              <tr class="bg-[#F8FAFC] border-t-2 border-[#E2E8F0]">
                <td class="px-4 py-3 text-xs font-bold text-[#1C2434] uppercase tracking-wide" colspan="2">{{ t('erp.reports.trialBalance.total') }}</td>
                <td class="px-4 py-3 text-right font-bold tabular-nums text-[#1C2434]">{{ fmtMoney(report.totals.debit) }}</td>
                <td class="px-4 py-3 text-right font-bold tabular-nums text-[#1C2434]">{{ fmtMoney(report.totals.credit) }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </template>
    </div>
  </AppLayout>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { PrinterIcon, TableCellsIcon } from '@heroicons/vue/24/outline'
import AppLayout from '@/layouts/AppLayout.vue'
import DateInput from '@/components/DateInput.vue'
import api from '@/api'
import { fmtMoney } from '@/utils/fmt'

const { t } = useI18n()

const loading     = ref(false)
const report      = ref(null)
const asOfDate    = ref(new Date().toISOString().slice(0, 10))
const includeZero = ref(false)

const isBalanced = computed(() =>
  report.value && Math.abs(report.value.totals.debit - report.value.totals.credit) < 0.01)

async function fetch() {
  loading.value = true
  try {
    const params = { asOfDate: asOfDate.value, includeZero: includeZero.value }
    const { data } = await api.get('/erp/accounting/reports/trial-balance', { params })
    report.value = data.data.report
  } finally {
    loading.value = false
  }
}

function printReport() {
  window.print()
}

onMounted(fetch)
</script>
