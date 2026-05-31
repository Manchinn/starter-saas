<template>
  <AppLayout>
    <div class="space-y-5">
      <div class="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 class="text-xl font-semibold text-[#1C2434]">{{ t('erp.financialStatements.incomeStatement.title') }}</h1>
          <p class="text-sm text-[#637381] mt-0.5">{{ t('erp.financialStatements.incomeStatement.subtitle') }}</p>
        </div>
        <button @click="printReport" class="btn-secondary flex items-center gap-1.5">
          <PrinterIcon class="w-4 h-4" />{{ t('erp.financialStatements.print') }}
        </button>
      </div>

      <div class="bg-white border border-[#E2E8F0] shadow-sm px-5 py-4 flex flex-wrap gap-4 items-end">
        <div class="flex flex-col gap-1">
          <label class="text-xs font-medium text-[#637381]">{{ t('erp.financialStatements.fromDate') }}</label>
          <DateInput v-model="fromDate" @change="fetch" class="input w-44" />
        </div>
        <div class="flex flex-col gap-1">
          <label class="text-xs font-medium text-[#637381]">{{ t('erp.financialStatements.toDate') }}</label>
          <DateInput v-model="toDate" @change="fetch" class="input w-44" />
        </div>
      </div>

      <div v-if="loading" class="flex justify-center py-16">
        <div class="w-8 h-8 border-2 border-primary-500 border-t-transparent animate-spin"></div>
      </div>

      <div v-else-if="report" class="bg-white border border-[#E2E8F0] shadow-sm overflow-hidden">
        <table class="w-full text-sm">
          <thead>
            <tr class="bg-[#F8FAFC] border-b border-[#E2E8F0]">
              <th class="px-4 py-3 text-left text-xs font-semibold text-[#637381] uppercase tracking-wide"></th>
              <th class="px-4 py-3 text-right text-xs font-semibold text-[#637381] uppercase tracking-wide w-44">{{ t('erp.financialStatements.current') }}</th>
              <th class="px-4 py-3 text-right text-xs font-semibold text-[#9BA7B0] uppercase tracking-wide w-44">{{ t('erp.financialStatements.prior') }}</th>
            </tr>
          </thead>
          <tbody>
            <component :is="row" v-for="(row, i) in rows" :key="i" />
          </tbody>
        </table>
      </div>
    </div>
  </AppLayout>
</template>

<script setup>
import { ref, computed, onMounted, h } from 'vue'
import { useI18n } from 'vue-i18n'
import { PrinterIcon } from '@heroicons/vue/24/outline'
import AppLayout from '@/layouts/AppLayout.vue'
import DateInput from '@/components/DateInput.vue'
import api from '@/api'
import { fmtMoney } from '@/utils/fmt'

const { t } = useI18n()

const loading = ref(false)
const report = ref(null)
const year = new Date().getFullYear()
const fromDate = ref(`${year}-01-01`)
const toDate = ref(new Date().toISOString().slice(0, 10))

const amountCell = (v, cls) => h('td', { class: `px-4 py-2 text-right tabular-nums ${cls}` },
  v === null || v === undefined ? '—' : fmtMoney(v))

function line(label, key, { sub = false, total = false, emphasize = false } = {}) {
  const cur = report.value?.current?.[key]
  const pri = report.value?.prior?.[key]
  const rowCls = emphasize ? 'bg-[#F8FAFC] border-y-2 border-[#E2E8F0]'
    : total ? 'border-t border-[#E2E8F0]'
    : 'border-b border-[#F1F5F9]'
  const labelCls = total || emphasize ? 'px-4 py-2.5 font-bold text-[#1C2434]' : `px-4 py-2 text-[#374151] ${sub ? 'pl-8' : ''}`
  const numCls = total || emphasize ? 'font-bold text-[#1C2434]' : 'text-[#374151]'
  const priCls = total || emphasize ? 'font-bold text-[#637381]' : 'text-[#9BA7B0]'
  return () => h('tr', { class: rowCls }, [
    h('td', { class: labelCls }, label),
    amountCell(cur, numCls),
    amountCell(pri === undefined ? null : pri, priCls),
  ])
}

const rows = computed(() => {
  if (!report.value) return []
  const L = (k) => t(`erp.financialStatements.incomeStatement.${k}`)
  return [
    line(L('revenue'), 'revenue', { sub: true }),
    line(L('costOfSales'), 'costOfSales', { sub: true }),
    line(L('grossProfit'), 'grossProfit', { total: true }),
    line(L('otherIncome'), 'otherIncome', { sub: true }),
    line(L('sellingAdmin'), 'sellingAdmin', { sub: true }),
    line(L('otherExpenses'), 'otherExpenses', { sub: true }),
    line(L('profitBeforeFinanceTax'), 'profitBeforeFinanceTax', { total: true }),
    line(L('financeCosts'), 'financeCosts', { sub: true }),
    line(L('profitBeforeTax'), 'profitBeforeTax', { total: true }),
    line(L('incomeTax'), 'incomeTax', { sub: true }),
    line(L('netProfit'), 'netProfit', { emphasize: true }),
  ]
})

async function fetch() {
  loading.value = true
  try {
    const params = { fromDate: fromDate.value, toDate: toDate.value }
    const { data } = await api.get('/erp/accounting/financial-statements/income-statement', { params })
    report.value = data.data.report
  } finally {
    loading.value = false
  }
}

function printReport() { window.print() }

onMounted(fetch)
</script>
