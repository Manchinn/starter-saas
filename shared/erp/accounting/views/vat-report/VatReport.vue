<template>
  <AppLayout>
    <div class="space-y-6">
      <div class="flex items-center gap-3">
        <RouterLink to="/erp/accounting/tax-periods" class="text-[#9BA7B0] hover:text-[#637381] transition">
          <ArrowLeftIcon class="w-5 h-5" />
        </RouterLink>
        <div class="flex-1 min-w-0">
          <h1 class="text-xl font-semibold text-[#1C2434]">{{ t('erp.vatReport.title') }}</h1>
          <p v-if="report?.period" class="text-sm text-[#637381] mt-0.5">
            {{ report.period.name }} · {{ report.period.startDate }} → {{ report.period.endDate }}
            <span :class="['ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold capitalize',
              report.period.status === 'closed' ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700']">
              {{ report.period.status }}
            </span>
          </p>
        </div>
      </div>

      <div v-if="loading" class="py-12 text-center text-[#9BA7B0]">{{ t('common.loading') }}</div>

      <template v-else-if="report">
        <div v-if="report.message" class="bg-amber-50 border border-amber-200 text-amber-800 text-sm px-4 py-3 rounded-xl">
          {{ report.message }}
        </div>

        <!-- Summary cards -->
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div class="bg-white rounded-2xl border border-[#E2E8F0] p-5">
            <p class="text-[11px] font-semibold text-[#9BA7B0] uppercase tracking-wider mb-2">{{ t('erp.vatReport.outputTax') }}</p>
            <p class="text-2xl font-bold text-green-700 tabular-nums">{{ fmt(report.outputTax.total) }}</p>
            <p class="text-xs text-[#9BA7B0] mt-1">{{ report.outputTax.lines.length }} {{ t('erp.vatReport.lines') }}</p>
          </div>
          <div class="bg-white rounded-2xl border border-[#E2E8F0] p-5">
            <p class="text-[11px] font-semibold text-[#9BA7B0] uppercase tracking-wider mb-2">{{ t('erp.vatReport.inputTax') }}</p>
            <p class="text-2xl font-bold text-blue-700 tabular-nums">{{ fmt(report.inputTax.total) }}</p>
            <p class="text-xs text-[#9BA7B0] mt-1">{{ report.inputTax.lines.length }} {{ t('erp.vatReport.lines') }}</p>
          </div>
          <div class="rounded-2xl border p-5"
            :class="report.netPayable > 0 ? 'bg-red-50 border-red-200' : report.netPayable < 0 ? 'bg-emerald-50 border-emerald-200' : 'bg-white border-[#E2E8F0]'">
            <p class="text-[11px] font-semibold uppercase tracking-wider mb-2"
              :class="report.netPayable > 0 ? 'text-red-600' : report.netPayable < 0 ? 'text-emerald-700' : 'text-[#9BA7B0]'">
              {{ report.netPayable >= 0 ? t('erp.vatReport.netPayable') : t('erp.vatReport.netRefundable') }}
            </p>
            <p class="text-2xl font-bold tabular-nums"
              :class="report.netPayable > 0 ? 'text-red-700' : report.netPayable < 0 ? 'text-emerald-700' : 'text-[#1C2434]'">
              {{ fmt(Math.abs(report.netPayable)) }}
            </p>
            <p class="text-[11px] text-[#9BA7B0] mt-1">{{ t('erp.vatReport.formula') }}</p>
          </div>
        </div>

        <!-- Output VAT lines -->
        <div class="bg-white rounded-2xl border border-[#E2E8F0] shadow-sm overflow-hidden">
          <div class="px-5 py-3 border-b border-[#E2E8F0] flex items-center justify-between bg-green-50/40">
            <h2 class="text-sm font-semibold text-[#1C2434]">{{ t('erp.vatReport.outputTaxLines') }}</h2>
            <span class="text-xs text-[#637381]">{{ t('erp.vatReport.outputHint') }}</span>
          </div>
          <table class="w-full text-sm">
            <thead class="bg-[#F7F9FC] text-left">
              <tr>
                <th class="px-4 py-2.5 font-medium text-[#637381] w-36">{{ t('erp.vatReport.colDate') }}</th>
                <th class="px-4 py-2.5 font-medium text-[#637381] w-44">{{ t('erp.vatReport.colJournal') }}</th>
                <th class="px-4 py-2.5 font-medium text-[#637381] w-44">{{ t('erp.vatReport.colSource') }}</th>
                <th class="px-4 py-2.5 font-medium text-[#637381]">{{ t('erp.vatReport.colDescription') }}</th>
                <th class="px-4 py-2.5 font-medium text-[#637381] w-32 text-right">{{ t('erp.vatReport.colAmount') }}</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-[#E2E8F0]">
              <tr v-if="!report.outputTax.lines.length"><td colspan="5" class="py-8 text-center text-[#9BA7B0]">{{ t('erp.vatReport.noLines') }}</td></tr>
              <tr v-for="l in report.outputTax.lines" :key="l.id" class="hover:bg-[#F7F9FC]">
                <td class="px-4 py-2 text-xs text-[#637381] tabular-nums">{{ l.journalDate }}</td>
                <td class="px-4 py-2"><RouterLink :to="`/erp/accounting/journals/${l.journalId}`" class="font-mono text-xs text-primary-600 hover:underline">{{ l.journalRefNo }}</RouterLink></td>
                <td class="px-4 py-2 text-xs text-[#637381]">{{ l.sourceType || '—' }}</td>
                <td class="px-4 py-2 text-xs text-[#374151]">{{ l.description || '—' }}</td>
                <td class="px-4 py-2 text-right font-medium text-green-700 tabular-nums">{{ fmt(l.amount) }}</td>
              </tr>
            </tbody>
            <tfoot v-if="report.outputTax.lines.length" class="border-t-2 border-[#E2E8F0] bg-[#F7F9FC]">
              <tr>
                <td colspan="4" class="px-4 py-2 text-xs font-semibold text-[#374151] text-right">{{ t('erp.vatReport.total') }}</td>
                <td class="px-4 py-2 text-right font-bold text-green-700 tabular-nums">{{ fmt(report.outputTax.total) }}</td>
              </tr>
            </tfoot>
          </table>
        </div>

        <!-- Input VAT lines -->
        <div class="bg-white rounded-2xl border border-[#E2E8F0] shadow-sm overflow-hidden">
          <div class="px-5 py-3 border-b border-[#E2E8F0] flex items-center justify-between bg-blue-50/40">
            <h2 class="text-sm font-semibold text-[#1C2434]">{{ t('erp.vatReport.inputTaxLines') }}</h2>
            <span class="text-xs text-[#637381]">{{ t('erp.vatReport.inputHint') }}</span>
          </div>
          <table class="w-full text-sm">
            <thead class="bg-[#F7F9FC] text-left">
              <tr>
                <th class="px-4 py-2.5 font-medium text-[#637381] w-36">{{ t('erp.vatReport.colDate') }}</th>
                <th class="px-4 py-2.5 font-medium text-[#637381] w-44">{{ t('erp.vatReport.colJournal') }}</th>
                <th class="px-4 py-2.5 font-medium text-[#637381] w-44">{{ t('erp.vatReport.colSource') }}</th>
                <th class="px-4 py-2.5 font-medium text-[#637381]">{{ t('erp.vatReport.colDescription') }}</th>
                <th class="px-4 py-2.5 font-medium text-[#637381] w-32 text-right">{{ t('erp.vatReport.colAmount') }}</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-[#E2E8F0]">
              <tr v-if="!report.inputTax.lines.length"><td colspan="5" class="py-8 text-center text-[#9BA7B0]">{{ t('erp.vatReport.noLines') }}</td></tr>
              <tr v-for="l in report.inputTax.lines" :key="l.id" class="hover:bg-[#F7F9FC]">
                <td class="px-4 py-2 text-xs text-[#637381] tabular-nums">{{ l.journalDate }}</td>
                <td class="px-4 py-2"><RouterLink :to="`/erp/accounting/journals/${l.journalId}`" class="font-mono text-xs text-primary-600 hover:underline">{{ l.journalRefNo }}</RouterLink></td>
                <td class="px-4 py-2 text-xs text-[#637381]">{{ l.sourceType || '—' }}</td>
                <td class="px-4 py-2 text-xs text-[#374151]">{{ l.description || '—' }}</td>
                <td class="px-4 py-2 text-right font-medium text-blue-700 tabular-nums">{{ fmt(l.amount) }}</td>
              </tr>
            </tbody>
            <tfoot v-if="report.inputTax.lines.length" class="border-t-2 border-[#E2E8F0] bg-[#F7F9FC]">
              <tr>
                <td colspan="4" class="px-4 py-2 text-xs font-semibold text-[#374151] text-right">{{ t('erp.vatReport.total') }}</td>
                <td class="px-4 py-2 text-right font-bold text-blue-700 tabular-nums">{{ fmt(report.inputTax.total) }}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </template>

      <div v-if="error" class="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-2 rounded-lg">{{ error }}</div>
    </div>
  </AppLayout>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, RouterLink } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { ArrowLeftIcon } from '@heroicons/vue/24/outline'
import AppLayout from '@/layouts/AppLayout.vue'
import api from '@/api'

const { t } = useI18n()
const route   = useRoute()
const report  = ref(null)
const loading = ref(true)
const error   = ref('')

const fmt = (n) => Number(n || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })

async function load() {
  loading.value = true
  try {
    const { data } = await api.get(`/erp/accounting/tax-periods/${route.params.id}/vat-report`)
    report.value = data.data
  } catch (err) {
    error.value = err.response?.data?.message || 'Failed to load VAT report'
  } finally { loading.value = false }
}
onMounted(load)
</script>
