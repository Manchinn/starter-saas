<template>
  <AppLayout>
    <div class="space-y-5">

      <!-- Header -->
      <div class="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 class="text-xl font-semibold text-[#1C2434]">{{ t('erp.reports.generalLedger.title') }}</h1>
          <p class="text-sm text-[#637381] mt-0.5">{{ t('erp.reports.generalLedger.subtitle') }}</p>
        </div>
        <button v-if="report" @click="printReport" class="btn-secondary flex items-center gap-1.5">
          <PrinterIcon class="w-4 h-4" />
          {{ t('erp.reports.generalLedger.print') }}
        </button>
      </div>

      <!-- Filters -->
      <div class="bg-white border border-[#E2E8F0] shadow-sm px-5 py-4 flex flex-wrap gap-4 items-end">
        <div class="flex flex-col gap-1">
          <label class="text-xs font-medium text-[#637381]">{{ t('erp.reports.generalLedger.account') }}</label>
          <div class="w-72">
            <SearchSelect v-model="accountId" :options="accountOptions" track-by="id"
              :placeholder="t('erp.reports.generalLedger.selectAccount')" @change="fetch">
              <template #option="{ option }">{{ option.code }} — {{ option.name }}</template>
              <template #singleLabel="{ option }">{{ option.code }} — {{ option.name }}</template>
            </SearchSelect>
          </div>
        </div>
        <div class="flex flex-col gap-1">
          <label class="text-xs font-medium text-[#637381]">{{ t('erp.reports.generalLedger.fromDate') }}</label>
          <DateInput v-model="fromDate" @change="fetch" class="input w-44" />
        </div>
        <div class="flex flex-col gap-1">
          <label class="text-xs font-medium text-[#637381]">{{ t('erp.reports.generalLedger.toDate') }}</label>
          <DateInput v-model="toDate" @change="fetch" class="input w-44" />
        </div>
      </div>

      <!-- Empty state: no account chosen -->
      <div v-if="!accountId"
        class="bg-white border border-[#E2E8F0] shadow-sm flex flex-col items-center gap-3 py-16">
        <div class="w-12 h-12 bg-[#F1F5F9] flex items-center justify-center">
          <BookOpenIcon class="w-6 h-6 text-[#9BA7B0]" />
        </div>
        <p class="text-sm font-medium text-[#637381]">{{ t('erp.reports.generalLedger.pickAccount') }}</p>
      </div>

      <div v-else-if="loading" class="flex justify-center py-16">
        <div class="w-8 h-8 border-2 border-primary-500 border-t-transparent animate-spin"></div>
      </div>

      <template v-else-if="report">
        <div class="bg-white border border-[#E2E8F0] shadow-sm px-5 py-3 flex items-center justify-between">
          <div class="font-medium text-[#1C2434]">
            <span class="font-mono text-sm text-[#637381]">{{ report.account.code }}</span>
            <span class="ml-2">{{ report.account.name }}</span>
          </div>
        </div>

        <div class="bg-white border border-[#E2E8F0] shadow-sm overflow-hidden">
          <table class="w-full text-sm">
            <thead>
              <tr class="bg-[#F8FAFC] border-b border-[#E2E8F0]">
                <th class="px-4 py-3 text-left text-xs font-semibold text-[#637381] uppercase tracking-wide w-32">{{ t('erp.reports.generalLedger.colDate') }}</th>
                <th class="px-4 py-3 text-left text-xs font-semibold text-[#637381] uppercase tracking-wide w-32">{{ t('erp.reports.generalLedger.colRef') }}</th>
                <th class="px-4 py-3 text-left text-xs font-semibold text-[#637381] uppercase tracking-wide">{{ t('erp.reports.generalLedger.colDesc') }}</th>
                <th class="px-4 py-3 text-right text-xs font-semibold text-[#637381] uppercase tracking-wide w-32">{{ t('erp.reports.generalLedger.colDebit') }}</th>
                <th class="px-4 py-3 text-right text-xs font-semibold text-[#637381] uppercase tracking-wide w-32">{{ t('erp.reports.generalLedger.colCredit') }}</th>
                <th class="px-4 py-3 text-right text-xs font-semibold text-[#637381] uppercase tracking-wide w-36">{{ t('erp.reports.generalLedger.colBalance') }}</th>
              </tr>
            </thead>
            <tbody>
              <!-- Opening -->
              <tr class="border-b border-[#F1F5F9] bg-[#FAFBFC]">
                <td class="px-4 py-2.5 text-xs text-[#9BA7B0]" colspan="3">{{ t('erp.reports.generalLedger.opening') }}</td>
                <td class="px-4 py-2.5"></td>
                <td class="px-4 py-2.5"></td>
                <td class="px-4 py-2.5 text-right font-medium tabular-nums text-[#374151]">{{ fmtMoney(report.opening) }}</td>
              </tr>

              <tr v-if="report.entries.length === 0">
                <td colspan="6" class="px-4 py-8 text-center text-sm text-[#9BA7B0]">{{ t('erp.reports.generalLedger.noData') }}</td>
              </tr>

              <tr v-for="(e, i) in report.entries" :key="i" class="border-b border-[#F1F5F9] hover:bg-[#F8FAFC]">
                <td class="px-4 py-2.5 text-[#637381]">{{ e.date }}</td>
                <td class="px-4 py-2.5">
                  <RouterLink :to="`/erp/accounting/journals/${e.journalId}`"
                    class="font-mono text-xs font-medium text-primary-600 hover:underline">{{ e.refNo }}</RouterLink>
                </td>
                <td class="px-4 py-2.5 text-[#374151]">{{ e.description || '—' }}</td>
                <td class="px-4 py-2.5 text-right tabular-nums">
                  <span :class="e.debit > 0 ? 'text-[#374151]' : 'text-[#CBD5E1]'">{{ e.debit > 0 ? fmtMoney(e.debit) : '—' }}</span>
                </td>
                <td class="px-4 py-2.5 text-right tabular-nums">
                  <span :class="e.credit > 0 ? 'text-[#374151]' : 'text-[#CBD5E1]'">{{ e.credit > 0 ? fmtMoney(e.credit) : '—' }}</span>
                </td>
                <td class="px-4 py-2.5 text-right font-medium tabular-nums text-[#1C2434]">{{ fmtMoney(e.balance) }}</td>
              </tr>

              <!-- Closing -->
              <tr class="bg-[#F8FAFC] border-t-2 border-[#E2E8F0]">
                <td class="px-4 py-3 text-xs font-bold text-[#1C2434] uppercase tracking-wide" colspan="3">{{ t('erp.reports.generalLedger.closing') }}</td>
                <td class="px-4 py-3 text-right font-bold tabular-nums text-[#374151]">{{ fmtMoney(report.totals.debit) }}</td>
                <td class="px-4 py-3 text-right font-bold tabular-nums text-[#374151]">{{ fmtMoney(report.totals.credit) }}</td>
                <td class="px-4 py-3 text-right font-bold tabular-nums text-primary-700">{{ fmtMoney(report.closing) }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </template>
    </div>
  </AppLayout>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { RouterLink } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { PrinterIcon, BookOpenIcon } from '@heroicons/vue/24/outline'
import AppLayout from '@/layouts/AppLayout.vue'
import DateInput from '@/components/DateInput.vue'
import SearchSelect from '@/components/SearchSelect.vue'
import api from '@/api'
import { fmtMoney } from '@/utils/fmt'

const { t } = useI18n()

const loading       = ref(false)
const report        = ref(null)
const accountId     = ref('')
const accountOptions = ref([])
const fromDate      = ref('')
const toDate        = ref('')

async function fetch() {
  if (!accountId.value) { report.value = null; return }
  loading.value = true
  try {
    const params = { accountId: accountId.value }
    if (fromDate.value) params.fromDate = fromDate.value
    if (toDate.value)   params.toDate   = toDate.value
    const { data } = await api.get('/erp/accounting/reports/general-ledger', { params })
    report.value = data.data.report
  } finally {
    loading.value = false
  }
}

function printReport() {
  window.print()
}

onMounted(async () => {
  const { data } = await api.get('/erp/accounting/chart-of-accounts/all')
  accountOptions.value = data.data.accounts || []
})
</script>
