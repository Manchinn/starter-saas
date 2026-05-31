<template>
  <AppLayout>
    <div class="space-y-5">
      <!-- Header -->
      <div class="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 class="text-xl font-semibold text-[#1C2434]">{{ t('erp.financialStatements.balanceSheet.title') }}</h1>
          <p class="text-sm text-[#637381] mt-0.5">{{ t('erp.financialStatements.balanceSheet.subtitle') }}</p>
        </div>
        <button @click="printReport" class="btn-secondary flex items-center gap-1.5">
          <PrinterIcon class="w-4 h-4" />{{ t('erp.financialStatements.print') }}
        </button>
      </div>

      <!-- Filters -->
      <div class="bg-white border border-[#E2E8F0] shadow-sm px-5 py-4 flex flex-wrap gap-4 items-end">
        <div class="flex flex-col gap-1">
          <label class="text-xs font-medium text-[#637381]">{{ t('erp.financialStatements.asOfDate') }}</label>
          <DateInput v-model="asOfDate" @change="fetch" class="input w-44" />
        </div>
        <div class="flex flex-col gap-1">
          <label class="text-xs font-medium text-[#637381]">{{ t('erp.financialStatements.comparativeDate') }}</label>
          <DateInput v-model="comparativeDate" @change="fetch" class="input w-44" />
        </div>
      </div>

      <div v-if="loading" class="flex justify-center py-16">
        <div class="w-8 h-8 border-2 border-primary-500 border-t-transparent animate-spin"></div>
      </div>

      <template v-else-if="report">
        <span class="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold"
          :class="report.current.balanced ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'">
          <span class="w-1.5 h-1.5 rounded-full" :class="report.current.balanced ? 'bg-emerald-500' : 'bg-red-500'"></span>
          {{ report.current.balanced ? t('erp.financialStatements.balanceSheet.balanced') : t('erp.financialStatements.balanceSheet.outOfBalance') }}
        </span>

        <div class="bg-white border border-[#E2E8F0] shadow-sm overflow-hidden">
          <table class="w-full text-sm">
            <thead>
              <tr class="bg-[#F8FAFC] border-b border-[#E2E8F0]">
                <th class="px-4 py-3 text-left text-xs font-semibold text-[#637381] uppercase tracking-wide"></th>
                <th class="px-4 py-3 text-right text-xs font-semibold text-[#637381] uppercase tracking-wide w-44">{{ report.asOfDate }}</th>
                <th class="px-4 py-3 text-right text-xs font-semibold text-[#9BA7B0] uppercase tracking-wide w-44">{{ report.comparativeDate || '—' }}</th>
              </tr>
            </thead>
            <tbody>
              <!-- ASSETS -->
              <SectionHeader :label="t('erp.financialStatements.balanceSheet.assets')" />
              <SubHeader :label="t('erp.financialStatements.balanceSheet.currentAssets')" />
              <LineRow v-for="(l, i) in report.current.assets.current.lines" :key="'ca'+i"
                :label="cat(l.category)" :current="l.amount" :prior="priorLine('assets','current',i)" />
              <SubHeader :label="t('erp.financialStatements.balanceSheet.nonCurrentAssets')" />
              <LineRow v-for="(l, i) in report.current.assets.nonCurrent.lines" :key="'nca'+i"
                :label="cat(l.category)" :current="l.amount" :prior="priorLine('assets','nonCurrent',i)" />
              <TotalRow :label="t('erp.financialStatements.balanceSheet.totalAssets')"
                :current="report.current.assets.total" :prior="report.prior && report.prior.assets.total" emphasize />

              <!-- LIABILITIES -->
              <SectionHeader :label="t('erp.financialStatements.balanceSheet.liabilities')" />
              <SubHeader :label="t('erp.financialStatements.balanceSheet.currentLiabilities')" />
              <LineRow v-for="(l, i) in report.current.liabilities.current.lines" :key="'cl'+i"
                :label="cat(l.category)" :current="l.amount" :prior="priorLine('liabilities','current',i)" />
              <SubHeader :label="t('erp.financialStatements.balanceSheet.nonCurrentLiabilities')" />
              <LineRow v-for="(l, i) in report.current.liabilities.nonCurrent.lines" :key="'ncl'+i"
                :label="cat(l.category)" :current="l.amount" :prior="priorLine('liabilities','nonCurrent',i)" />
              <TotalRow :label="t('erp.financialStatements.balanceSheet.totalLiabilities')"
                :current="report.current.liabilities.total" :prior="report.prior && report.prior.liabilities.total" />

              <!-- EQUITY -->
              <SectionHeader :label="t('erp.financialStatements.balanceSheet.equity')" />
              <LineRow :label="t('erp.financialStatements.balanceSheet.ownersCapital')"
                :current="report.current.equity.ownersCapital" :prior="report.prior && report.prior.equity.ownersCapital" />
              <LineRow :label="t('erp.financialStatements.balanceSheet.retainedEarnings')"
                :current="report.current.equity.retainedEarnings" :prior="report.prior && report.prior.equity.retainedEarnings" />
              <LineRow :label="t('erp.financialStatements.balanceSheet.profitForYear')"
                :current="report.current.equity.profitForYear" :prior="report.prior && report.prior.equity.profitForYear" />
              <TotalRow :label="t('erp.financialStatements.balanceSheet.totalEquity')"
                :current="report.current.equity.total" :prior="report.prior && report.prior.equity.total" />

              <TotalRow :label="t('erp.financialStatements.balanceSheet.totalLiabilitiesEquity')"
                :current="report.current.liabilitiesAndEquity" :prior="report.prior && report.prior.liabilitiesAndEquity" emphasize />
            </tbody>
          </table>
        </div>
      </template>
    </div>
  </AppLayout>
</template>

<script setup>
import { ref, onMounted, h } from 'vue'
import { useI18n } from 'vue-i18n'
import { PrinterIcon } from '@heroicons/vue/24/outline'
import AppLayout from '@/layouts/AppLayout.vue'
import DateInput from '@/components/DateInput.vue'
import api from '@/api'
import { fmtMoney } from '@/utils/fmt'

const { t } = useI18n()

// Lightweight presentational row components (kept local to this report).
const SectionHeader = (props) => h('tr', { class: 'bg-[#F1F5F9] border-y border-[#E2E8F0]' }, [
  h('td', { class: 'px-4 py-2 text-xs font-bold text-[#1C2434] uppercase tracking-wide', colspan: 3 }, props.label),
])
const SubHeader = (props) => h('tr', {}, [
  h('td', { class: 'px-4 pt-3 pb-1 text-xs font-semibold text-[#637381]', colspan: 3 }, props.label),
])
const amountCell = (v, cls) => h('td', { class: `px-4 py-2 text-right tabular-nums ${cls}` },
  v === null || v === undefined ? '—' : fmtMoney(v))
const LineRow = (props) => h('tr', { class: 'border-b border-[#F1F5F9] hover:bg-[#F8FAFC]' }, [
  h('td', { class: 'px-4 py-2 pl-8 text-[#374151]' }, props.label),
  amountCell(props.current, 'text-[#374151]'),
  amountCell(props.prior, 'text-[#9BA7B0]'),
])
const TotalRow = (props) => h('tr', { class: props.emphasize ? 'bg-[#F8FAFC] border-y-2 border-[#E2E8F0]' : 'border-t border-[#E2E8F0]' }, [
  h('td', { class: 'px-4 py-2.5 font-bold text-[#1C2434]' }, props.label),
  amountCell(props.current, 'font-bold text-[#1C2434]'),
  amountCell(props.prior, 'font-bold text-[#637381]'),
])

const loading = ref(false)
const report = ref(null)
const asOfDate = ref(new Date().toISOString().slice(0, 10))
const comparativeDate = ref(`${new Date().getFullYear() - 1}-12-31`)

const cat = (key) => t(`erp.accounting.statementCategories.${key}`)
function priorLine(section, group, i) {
  const l = report.value?.prior?.[section]?.[group]?.lines?.[i]
  return l ? l.amount : null
}

async function fetch() {
  loading.value = true
  try {
    const params = { asOfDate: asOfDate.value, comparativeDate: comparativeDate.value }
    const { data } = await api.get('/erp/accounting/financial-statements/balance-sheet', { params })
    report.value = data.data.report
  } finally {
    loading.value = false
  }
}

function printReport() { window.print() }

onMounted(fetch)
</script>
