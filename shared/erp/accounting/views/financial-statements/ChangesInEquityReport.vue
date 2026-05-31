<template>
  <AppLayout>
    <div class="space-y-5">
      <div class="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 class="text-xl font-semibold text-[#1C2434]">{{ t('erp.financialStatements.changesInEquity.title') }}</h1>
          <p class="text-sm text-[#637381] mt-0.5">{{ t('erp.financialStatements.changesInEquity.subtitle') }}</p>
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

      <template v-else-if="report">
        <PeriodTable v-if="report.prior" :data="report.prior" :title="t('erp.financialStatements.changesInEquity.priorPeriod')" />
        <PeriodTable :data="report.current" :title="t('erp.financialStatements.changesInEquity.currentPeriod')" />
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

const num = (v, cls = 'text-[#374151]') => h('td', { class: `px-4 py-2 text-right tabular-nums ${cls}` }, fmtMoney(v))

// One period block: rows opening → contributions → drawings → profit → closing,
// columns owners' capital / retained earnings / total.
const PeriodTable = (props) => {
  const d = props.data
  const oc = d.opening.ownersCapital, re = d.opening.retainedEarnings
  const ocClose = d.closing.ownersCapital, reClose = d.closing.retainedEarnings
  const L = (k) => t(`erp.financialStatements.changesInEquity.${k}`)
  const row = (label, c1, c2, total, opts = {}) => {
    const cls = opts.total ? 'bg-[#F8FAFC] border-y border-[#E2E8F0]' : 'border-b border-[#F1F5F9]'
    const tc = opts.total ? 'font-bold text-[#1C2434]' : 'text-[#374151]'
    return h('tr', { class: cls }, [
      h('td', { class: `px-4 py-2 ${opts.total ? 'font-bold text-[#1C2434]' : 'text-[#374151]'}` }, label),
      num(c1, tc), num(c2, tc), num(total, opts.total ? 'font-bold text-[#1C2434]' : 'text-[#1C2434]'),
    ])
  }
  return h('div', { class: 'bg-white border border-[#E2E8F0] shadow-sm overflow-hidden' }, [
    h('div', { class: 'px-5 py-3 border-b border-[#E2E8F0] text-sm font-semibold text-[#1C2434]' },
      `${props.title} (${d.fromDate} — ${d.toDate})`),
    h('table', { class: 'w-full text-sm' }, [
      h('thead', {}, h('tr', { class: 'bg-[#F8FAFC] border-b border-[#E2E8F0]' }, [
        h('th', { class: 'px-4 py-3 text-left text-xs font-semibold text-[#637381] uppercase tracking-wide' }, ''),
        h('th', { class: 'px-4 py-3 text-right text-xs font-semibold text-[#637381] uppercase tracking-wide w-40' }, L('ownersCapital')),
        h('th', { class: 'px-4 py-3 text-right text-xs font-semibold text-[#637381] uppercase tracking-wide w-40' }, L('retainedEarnings')),
        h('th', { class: 'px-4 py-3 text-right text-xs font-semibold text-[#1C2434] uppercase tracking-wide w-40' }, L('total')),
      ])),
      h('tbody', {}, [
        row(L('opening'), oc, re, oc + re, { total: true }),
        row(L('contributions'), d.contributions, 0, d.contributions),
        row(L('drawings'), -d.drawings, 0, -d.drawings),
        row(L('profit'), 0, d.profitForPeriod, d.profitForPeriod),
        row(L('closing'), ocClose, reClose, ocClose + reClose, { total: true }),
      ]),
    ]),
  ])
}

const loading = ref(false)
const report = ref(null)
const year = new Date().getFullYear()
const fromDate = ref(`${year}-01-01`)
const toDate = ref(new Date().toISOString().slice(0, 10))

async function fetch() {
  loading.value = true
  try {
    const params = { fromDate: fromDate.value, toDate: toDate.value }
    const { data } = await api.get('/erp/accounting/financial-statements/changes-in-equity', { params })
    report.value = data.data.report
  } finally {
    loading.value = false
  }
}

function printReport() { window.print() }

onMounted(fetch)
</script>
