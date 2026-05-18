<template>
  <AppLayout>
    <div class="space-y-5">

      <!-- Header -->
      <div class="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 class="text-xl font-semibold text-[#1C2434]">{{ t('erp.arAging.title') }}</h1>
          <p class="text-sm text-[#637381] mt-0.5">{{ t('erp.arAging.subtitle') }}</p>
        </div>
        <button @click="printReport" class="btn-secondary flex items-center gap-1.5">
          <PrinterIcon class="w-4 h-4" />
          {{ t('erp.arAging.print') }}
        </button>
      </div>

      <!-- Filters -->
      <div class="bg-white rounded-2xl border border-[#E2E8F0] shadow-sm px-5 py-4 flex flex-wrap gap-4 items-end">
        <div class="flex flex-col gap-1">
          <label class="text-xs font-medium text-[#637381]">{{ t('erp.arAging.asOfDate') }}</label>
          <DateInput v-model="asOfDate" @change="fetch" class="input w-44" />
        </div>
        <div class="flex flex-col gap-1">
          <label class="text-xs font-medium text-[#637381]">{{ t('erp.arAging.customer') }}</label>
          <div class="w-52">
            <SearchSelect v-model="filterCustomerId" :options="customerOptions" :placeholder="t('erp.arAging.allCustomers')" @change="fetch" />
          </div>
        </div>
      </div>

      <!-- Loading -->
      <div v-if="loading" class="flex justify-center py-16">
        <div class="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
      </div>

      <template v-else-if="report">

        <!-- Summary Cards -->
        <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <div v-for="card in summaryCards" :key="card.key"
            class="bg-white rounded-2xl border border-[#E2E8F0] shadow-sm px-4 py-4 flex flex-col gap-1">
            <p class="text-[11px] font-semibold uppercase tracking-wide" :class="card.labelClass">{{ card.label }}</p>
            <p class="text-lg font-bold text-[#1C2434] tabular-nums">{{ fmtMoney(report.summary[card.key]) }}</p>
            <p class="text-[11px] text-[#9BA7B0]">
              {{ report.summary.total > 0
                ? pct(report.summary[card.key], report.summary.total) + '%'
                : '0%' }}
            </p>
          </div>
          <div class="bg-primary-50 border border-primary-200 rounded-2xl px-4 py-4 flex flex-col gap-1">
            <p class="text-[11px] font-semibold uppercase tracking-wide text-primary-600">{{ t('erp.arAging.grandTotal') }}</p>
            <p class="text-lg font-bold text-primary-700 tabular-nums">{{ fmtMoney(report.summary.total) }}</p>
            <p class="text-[11px] text-primary-500">{{ report.customers.length }} customers</p>
          </div>
        </div>

        <!-- No data state -->
        <div v-if="report.customers.length === 0"
          class="bg-white rounded-2xl border border-[#E2E8F0] shadow-sm flex flex-col items-center gap-3 py-16">
          <div class="w-12 h-12 bg-[#F1F5F9] rounded-xl flex items-center justify-center">
            <ChartBarIcon class="w-6 h-6 text-[#9BA7B0]" />
          </div>
          <div class="text-center">
            <p class="text-sm font-medium text-[#637381]">{{ t('erp.arAging.noData') }}</p>
            <p class="text-xs text-[#9BA7B0] mt-1">{{ t('erp.arAging.noDataHint') }}</p>
          </div>
        </div>

        <!-- Aging Table per customer -->
        <div v-else class="bg-white rounded-2xl border border-[#E2E8F0] shadow-sm overflow-hidden">
          <table class="w-full text-sm">
            <thead>
              <tr class="bg-[#F8FAFC] border-b border-[#E2E8F0]">
                <th class="px-4 py-3 text-left text-xs font-semibold text-[#637381] uppercase tracking-wide w-52">{{ t('erp.arAging.customer') }}</th>
                <th class="px-4 py-3 text-right text-xs font-semibold text-[#637381] uppercase tracking-wide">{{ t('erp.arAging.bucketCurrent') }}</th>
                <th class="px-4 py-3 text-right text-xs font-semibold text-amber-600 uppercase tracking-wide">{{ t('erp.arAging.bucket1_30') }}</th>
                <th class="px-4 py-3 text-right text-xs font-semibold text-orange-600 uppercase tracking-wide">{{ t('erp.arAging.bucket31_60') }}</th>
                <th class="px-4 py-3 text-right text-xs font-semibold text-red-500 uppercase tracking-wide">{{ t('erp.arAging.bucket61_90') }}</th>
                <th class="px-4 py-3 text-right text-xs font-semibold text-red-700 uppercase tracking-wide">{{ t('erp.arAging.bucket91plus') }}</th>
                <th class="px-4 py-3 text-right text-xs font-semibold text-[#1C2434] uppercase tracking-wide">{{ t('erp.arAging.grandTotal') }}</th>
                <th class="px-4 py-3 w-8"></th>
              </tr>
            </thead>
            <tbody>
              <template v-for="entry in report.customers" :key="entry.customer.id">
                <!-- Customer summary row -->
                <tr class="border-b border-[#F1F5F9] hover:bg-[#F8FAFC] cursor-pointer transition-colors"
                  @click="toggleCustomer(entry.customer.id)">
                  <td class="px-4 py-3">
                    <div class="font-medium text-[#1C2434]">{{ entry.customer.name }}</div>
                    <div v-if="entry.customer.company" class="text-xs text-[#9BA7B0]">{{ entry.customer.company }}</div>
                  </td>
                  <td class="px-4 py-3 text-right tabular-nums text-[#374151]">
                    <span :class="entry.summary.current > 0 ? 'font-medium' : 'text-[#CBD5E1]'">
                      {{ entry.summary.current > 0 ? fmtMoney(entry.summary.current) : '—' }}
                    </span>
                  </td>
                  <td class="px-4 py-3 text-right tabular-nums">
                    <span :class="entry.summary.days1_30 > 0 ? 'font-medium text-amber-600' : 'text-[#CBD5E1]'">
                      {{ entry.summary.days1_30 > 0 ? fmtMoney(entry.summary.days1_30) : '—' }}
                    </span>
                  </td>
                  <td class="px-4 py-3 text-right tabular-nums">
                    <span :class="entry.summary.days31_60 > 0 ? 'font-medium text-orange-600' : 'text-[#CBD5E1]'">
                      {{ entry.summary.days31_60 > 0 ? fmtMoney(entry.summary.days31_60) : '—' }}
                    </span>
                  </td>
                  <td class="px-4 py-3 text-right tabular-nums">
                    <span :class="entry.summary.days61_90 > 0 ? 'font-medium text-red-500' : 'text-[#CBD5E1]'">
                      {{ entry.summary.days61_90 > 0 ? fmtMoney(entry.summary.days61_90) : '—' }}
                    </span>
                  </td>
                  <td class="px-4 py-3 text-right tabular-nums">
                    <span :class="entry.summary.days91plus > 0 ? 'font-bold text-red-700' : 'text-[#CBD5E1]'">
                      {{ entry.summary.days91plus > 0 ? fmtMoney(entry.summary.days91plus) : '—' }}
                    </span>
                  </td>
                  <td class="px-4 py-3 text-right font-bold tabular-nums text-[#1C2434]">
                    {{ fmtMoney(entry.summary.total) }}
                  </td>
                  <td class="px-4 py-3 text-center">
                    <ChevronDownIcon class="w-4 h-4 text-[#9BA7B0] transition-transform"
                      :class="expandedCustomers.has(entry.customer.id) ? 'rotate-180' : ''" />
                  </td>
                </tr>

                <!-- Expanded invoice rows -->
                <template v-if="expandedCustomers.has(entry.customer.id)">
                  <tr v-for="inv in entry.invoices" :key="inv.id"
                    class="border-b border-[#F1F5F9] bg-[#FAFBFC]">
                    <td class="px-4 py-2.5 pl-8" colspan="1">
                      <div class="flex items-center gap-2">
                        <span class="w-1.5 h-1.5 rounded-full flex-shrink-0" :class="bucketDot(inv.bucket)"></span>
                        <RouterLink :to="`/erp/invoices/${inv.id}`"
                          class="font-mono text-xs font-medium text-primary-600 hover:underline">
                          {{ inv.invoiceNumber }}
                        </RouterLink>
                      </div>
                    </td>
                    <td class="px-4 py-2.5 text-right text-xs text-[#637381] tabular-nums">
                      <span v-if="inv.bucket === 'current'" class="text-[#374151]">{{ fmtMoney(inv.total) }}</span>
                      <span v-else class="text-[#CBD5E1]">—</span>
                    </td>
                    <td class="px-4 py-2.5 text-right text-xs tabular-nums">
                      <span v-if="inv.bucket === 'days1_30'" class="text-amber-600">{{ fmtMoney(inv.total) }}</span>
                      <span v-else class="text-[#CBD5E1]">—</span>
                    </td>
                    <td class="px-4 py-2.5 text-right text-xs tabular-nums">
                      <span v-if="inv.bucket === 'days31_60'" class="text-orange-600">{{ fmtMoney(inv.total) }}</span>
                      <span v-else class="text-[#CBD5E1]">—</span>
                    </td>
                    <td class="px-4 py-2.5 text-right text-xs tabular-nums">
                      <span v-if="inv.bucket === 'days61_90'" class="text-red-500">{{ fmtMoney(inv.total) }}</span>
                      <span v-else class="text-[#CBD5E1]">—</span>
                    </td>
                    <td class="px-4 py-2.5 text-right text-xs tabular-nums">
                      <span v-if="inv.bucket === 'days91plus'" class="font-semibold text-red-700">{{ fmtMoney(inv.total) }}</span>
                      <span v-else class="text-[#CBD5E1]">—</span>
                    </td>
                    <td class="px-4 py-2.5 text-right text-xs font-medium tabular-nums text-[#374151]">
                      {{ fmtMoney(inv.total) }}
                    </td>
                    <td class="px-4 py-2.5">
                      <!-- invoice meta: due date + overdue badge -->
                      <div class="flex items-center justify-end gap-1.5">
                        <span v-if="inv.daysOverdue > 0"
                          class="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold"
                          :class="overdueBadge(inv.bucket)">
                          +{{ inv.daysOverdue }}d
                        </span>
                      </div>
                    </td>
                  </tr>
                </template>
              </template>

              <!-- Grand total row -->
              <tr class="bg-[#F8FAFC] border-t-2 border-[#E2E8F0]">
                <td class="px-4 py-3 text-xs font-bold text-[#1C2434] uppercase tracking-wide">
                  {{ t('erp.arAging.grandTotal') }}
                </td>
                <td class="px-4 py-3 text-right font-bold tabular-nums text-[#374151]">{{ fmtMoney(report.summary.current) }}</td>
                <td class="px-4 py-3 text-right font-bold tabular-nums text-amber-600">{{ fmtMoney(report.summary.days1_30) }}</td>
                <td class="px-4 py-3 text-right font-bold tabular-nums text-orange-600">{{ fmtMoney(report.summary.days31_60) }}</td>
                <td class="px-4 py-3 text-right font-bold tabular-nums text-red-500">{{ fmtMoney(report.summary.days61_90) }}</td>
                <td class="px-4 py-3 text-right font-bold tabular-nums text-red-700">{{ fmtMoney(report.summary.days91plus) }}</td>
                <td class="px-4 py-3 text-right font-bold tabular-nums text-primary-700 text-base">{{ fmtMoney(report.summary.total) }}</td>
                <td></td>
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
import { RouterLink } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { ChartBarIcon, PrinterIcon, ChevronDownIcon } from '@heroicons/vue/24/outline'
import AppLayout from '@/layouts/AppLayout.vue'
import DateInput from '@/components/DateInput.vue'
import SearchSelect from '@/components/SearchSelect.vue'
import api from '@/api'
import { fmtMoney } from '@/utils/fmt'

const { t } = useI18n()

const loading         = ref(false)
const report          = ref(null)
const asOfDate        = ref(new Date().toISOString().slice(0, 10))
const filterCustomerId = ref('')
const expandedCustomers = ref(new Set())

const customerOptions = computed(() => {
  if (!report.value) return []
  return report.value.customers.map(e => e.customer)
})

const summaryCards = computed(() => {
  if (!report.value) return []
  return [
    { key: 'current',    label: t('erp.arAging.bucketCurrent'), labelClass: 'text-[#637381]' },
    { key: 'days1_30',   label: t('erp.arAging.bucket1_30'),    labelClass: 'text-amber-600' },
    { key: 'days31_60',  label: t('erp.arAging.bucket31_60'),   labelClass: 'text-orange-600' },
    { key: 'days61_90',  label: t('erp.arAging.bucket61_90'),   labelClass: 'text-red-500' },
    { key: 'days91plus', label: t('erp.arAging.bucket91plus'),  labelClass: 'text-red-700' },
  ]
})

async function fetch() {
  loading.value = true
  try {
    const params = { asOfDate: asOfDate.value }
    if (filterCustomerId.value) params.customerId = filterCustomerId.value
    const { data } = await api.get('/erp/accounting/ar-aging', { params })
    report.value = data.data.report
    expandedCustomers.value = new Set()
  } finally {
    loading.value = false
  }
}

function toggleCustomer(id) {
  const s = expandedCustomers.value
  const next = new Set(s)
  if (next.has(id)) next.delete(id)
  else next.add(id)
  expandedCustomers.value = next
}

function pct(part, total) {
  if (!total) return '0'
  return Math.round((part / total) * 100)
}

function bucketDot(bucket) {
  return {
    current:    'bg-slate-400',
    days1_30:   'bg-amber-400',
    days31_60:  'bg-orange-500',
    days61_90:  'bg-red-500',
    days91plus: 'bg-red-700',
  }[bucket] || 'bg-slate-400'
}

function overdueBadge(bucket) {
  return {
    days1_30:   'bg-amber-50 text-amber-700',
    days31_60:  'bg-orange-50 text-orange-700',
    days61_90:  'bg-red-50 text-red-600',
    days91plus: 'bg-red-100 text-red-800',
  }[bucket] || ''
}

function printReport() {
  window.print()
}

onMounted(fetch)
</script>
