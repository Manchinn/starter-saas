<template>
  <AppLayout>
    <div class="space-y-5">

      <!-- Header -->
      <div class="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 class="text-xl font-semibold text-[#1C2434]">{{ t('erp.cashFlow.title') }}</h1>
          <p class="text-sm text-[#637381] mt-0.5">{{ t('erp.cashFlow.subtitle') }}</p>
        </div>
        <button @click="printReport" class="btn-secondary flex items-center gap-1.5">
          <PrinterIcon class="w-4 h-4" />
          {{ t('erp.cashFlow.print') }}
        </button>
      </div>

      <!-- Filters -->
      <div class="bg-white border border-[#E2E8F0] shadow-sm px-5 py-4 flex flex-wrap gap-4 items-end">
        <div class="flex flex-col gap-1">
          <label class="text-xs font-medium text-[#637381]">{{ t('erp.cashFlow.fromDate') }}</label>
          <DateInput v-model="fromDate" @change="fetch" class="input w-44" />
        </div>
        <div class="flex flex-col gap-1">
          <label class="text-xs font-medium text-[#637381]">{{ t('erp.cashFlow.toDate') }}</label>
          <DateInput v-model="toDate" @change="fetch" class="input w-44" />
        </div>
      </div>

      <div v-if="loading" class="flex justify-center py-16">
        <div class="w-8 h-8 border-2 border-primary-500 border-t-transparent animate-spin"></div>
      </div>

      <template v-else-if="report">
        <div class="bg-white border border-[#E2E8F0] shadow-sm overflow-hidden max-w-3xl">
          <table class="w-full text-sm">
            <tbody>
              <template v-for="sec in sections" :key="sec.key">
                <tr class="bg-[#F8FAFC] border-y border-[#E2E8F0]">
                  <td class="px-4 py-2.5 font-semibold text-[#1C2434]">{{ sec.label }}</td>
                  <td class="px-4 py-2.5 text-right font-semibold tabular-nums"
                    :class="report[sec.key].amount < 0 ? 'text-red-600' : 'text-[#1C2434]'">
                    {{ fmtSigned(report[sec.key].amount) }}
                  </td>
                </tr>
                <tr v-for="(e, i) in report[sec.key].entries" :key="sec.key + i" class="border-b border-[#F1F5F9]">
                  <td class="px-4 py-2 pl-8 text-xs text-[#637381]">
                    <span class="font-mono text-[10px] text-[#9BA7B0] mr-2">{{ e.date }}</span>
                    {{ e.account ? e.account.name : (e.description || '—') }}
                  </td>
                  <td class="px-4 py-2 text-right text-xs tabular-nums" :class="e.amount < 0 ? 'text-red-600' : 'text-[#374151]'">
                    {{ fmtSigned(e.amount) }}
                  </td>
                </tr>
                <tr v-if="!report[sec.key].entries.length" class="border-b border-[#F1F5F9]">
                  <td class="px-4 py-2 pl-8 text-xs text-[#CBD5E1]" colspan="2">{{ t('erp.cashFlow.noActivity') }}</td>
                </tr>
              </template>

              <tr class="border-t-2 border-[#E2E8F0]">
                <td class="px-4 py-3 font-bold text-[#1C2434] uppercase tracking-wide text-xs">{{ t('erp.cashFlow.netChange') }}</td>
                <td class="px-4 py-3 text-right font-bold tabular-nums" :class="report.netChange < 0 ? 'text-red-600' : 'text-primary-700'">{{ fmtSigned(report.netChange) }}</td>
              </tr>
              <tr class="border-b border-[#F1F5F9]">
                <td class="px-4 py-2 text-[#637381]">{{ t('erp.cashFlow.beginning') }}</td>
                <td class="px-4 py-2 text-right tabular-nums text-[#374151]">{{ fmtMoney(report.beginning) }}</td>
              </tr>
              <tr class="bg-primary-50">
                <td class="px-4 py-3 font-bold text-primary-700">{{ t('erp.cashFlow.ending') }}</td>
                <td class="px-4 py-3 text-right font-bold tabular-nums text-primary-700 text-base">{{ fmtMoney(report.ending) }}</td>
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
import { PrinterIcon } from '@heroicons/vue/24/outline'
import AppLayout from '@/layouts/AppLayout.vue'
import DateInput from '@/components/DateInput.vue'
import api from '@/api'
import { fmtMoney } from '@/utils/fmt'

const { t } = useI18n()

const loading = ref(false)
const report  = ref(null)

const today = new Date()
const fromDate = ref(new Date(today.getFullYear(), today.getMonth(), 1).toISOString().slice(0, 10))
const toDate   = ref(today.toISOString().slice(0, 10))

const sections = computed(() => [
  { key: 'operating', label: t('erp.cashFlow.operating') },
  { key: 'investing', label: t('erp.cashFlow.investing') },
  { key: 'financing', label: t('erp.cashFlow.financing') },
])

function fmtSigned(v) {
  const n = Number(v) || 0
  return (n < 0 ? '(' + fmtMoney(Math.abs(n)) + ')' : fmtMoney(n))
}

async function fetch() {
  loading.value = true
  try {
    const { data } = await api.get('/erp/accounting/cash-flow', { params: { fromDate: fromDate.value, toDate: toDate.value } })
    report.value = data.data.report
  } finally {
    loading.value = false
  }
}

function printReport() { window.print() }

onMounted(fetch)
</script>
