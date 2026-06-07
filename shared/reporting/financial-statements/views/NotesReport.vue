<template>
  <AppLayout>
    <div class="space-y-5">
      <div class="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 class="text-xl font-semibold text-[#1C2434]">{{ t('erp.financialStatements.notes.title') }}</h1>
          <p class="text-sm text-[#637381] mt-0.5">{{ t('erp.financialStatements.notes.subtitle') }}</p>
        </div>
        <button @click="printReport" class="btn-secondary flex items-center gap-1.5">
          <PrinterIcon class="w-4 h-4" />{{ t('erp.financialStatements.print') }}
        </button>
      </div>

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
        <!-- Policy notes (template text) -->
        <div v-for="(note, i) in policyNotes" :key="'p'+i" class="bg-white border border-[#E2E8F0] shadow-sm px-5 py-4">
          <h2 class="text-sm font-semibold text-[#1C2434]">{{ i + 1 }}. {{ note.title }}</h2>
          <p class="text-sm text-[#637381] mt-1.5 whitespace-pre-line leading-relaxed">{{ note.body }}</p>
        </div>

        <!-- Supporting schedules -->
        <div class="bg-white border border-[#E2E8F0] shadow-sm px-5 py-4">
          <h2 class="text-sm font-semibold text-[#1C2434] mb-3">
            {{ policyNotes.length + 1 }}. {{ t('erp.financialStatements.notes.supportingSchedules') }}
          </h2>
          <div v-if="report.schedules.length === 0" class="text-sm text-[#9BA7B0]">{{ t('erp.financialStatements.notes.noSchedules') }}</div>
          <div v-for="sch in report.schedules" :key="sch.category" class="mb-5 last:mb-0">
            <h3 class="text-xs font-semibold text-[#637381] uppercase tracking-wide mb-1.5">{{ cat(sch.category) }}</h3>
            <table class="w-full text-sm">
              <thead>
                <tr class="border-b border-[#E2E8F0]">
                  <th class="px-3 py-1.5 text-left text-[11px] font-semibold text-[#9BA7B0]">{{ t('erp.financialStatements.notes.account') }}</th>
                  <th class="px-3 py-1.5 text-right text-[11px] font-semibold text-[#9BA7B0] w-40">{{ report.asOfDate }}</th>
                  <th class="px-3 py-1.5 text-right text-[11px] font-semibold text-[#9BA7B0] w-40">{{ report.comparativeDate || '—' }}</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="a in sch.accounts" :key="a.code" class="border-b border-[#F1F5F9]">
                  <td class="px-3 py-1.5 text-[#374151]"><span class="font-mono text-xs text-[#9BA7B0]">{{ a.code }}</span> {{ a.name }}</td>
                  <td class="px-3 py-1.5 text-right tabular-nums text-[#374151]">{{ fmtMoney(a.current) }}</td>
                  <td class="px-3 py-1.5 text-right tabular-nums text-[#9BA7B0]">{{ fmtMoney(a.prior) }}</td>
                </tr>
                <tr class="border-t border-[#E2E8F0]">
                  <td class="px-3 py-1.5 font-semibold text-[#1C2434]">{{ t('erp.financialStatements.notes.total') }}</td>
                  <td class="px-3 py-1.5 text-right font-semibold tabular-nums text-[#1C2434]">{{ fmtMoney(sch.totalCurrent) }}</td>
                  <td class="px-3 py-1.5 text-right font-semibold tabular-nums text-[#637381]">{{ fmtMoney(sch.totalPrior) }}</td>
                </tr>
              </tbody>
            </table>
          </div>
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
const report = ref(null)
const asOfDate = ref(new Date().toISOString().slice(0, 10))
const comparativeDate = ref(`${new Date().getFullYear() - 1}-12-31`)

const cat = (key) => t(`erp.accounting.statementCategories.${key}`)

const policyNotes = computed(() => ['generalInfo', 'basisOfPreparation', 'accountingPolicies'].map((k) => ({
  title: t(`erp.financialStatements.notes.${k}.title`),
  body: t(`erp.financialStatements.notes.${k}.body`),
})))

async function fetch() {
  loading.value = true
  try {
    const params = { asOfDate: asOfDate.value, comparativeDate: comparativeDate.value }
    const { data } = await api.get('/erp/accounting/financial-statements/notes', { params })
    report.value = data.data.report
  } finally {
    loading.value = false
  }
}

function printReport() { window.print() }

onMounted(fetch)
</script>
