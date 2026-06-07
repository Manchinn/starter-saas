<template>
  <AppLayout>
    <div class="space-y-5">

      <!-- Header -->
      <div class="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 class="text-xl font-semibold text-[#1C2434]">{{ t('erp.apAging.title') }}</h1>
          <p class="text-sm text-[#637381] mt-0.5">{{ t('erp.apAging.subtitle') }}</p>
        </div>
        <button @click="printReport" class="btn-secondary flex items-center gap-1.5">
          <PrinterIcon class="w-4 h-4" />
          {{ t('erp.apAging.print') }}
        </button>
      </div>

      <!-- Filters -->
      <div class="bg-white border border-[#E2E8F0] shadow-sm px-5 py-4 flex flex-wrap gap-4 items-end">
        <div class="flex flex-col gap-1">
          <label class="text-xs font-medium text-[#637381]">{{ t('erp.apAging.asOfDate') }}</label>
          <DateInput v-model="asOfDate" @change="fetch" class="input w-44" />
        </div>
        <div class="flex flex-col gap-1">
          <label class="text-xs font-medium text-[#637381]">{{ t('erp.apAging.vendor') }}</label>
          <div class="w-52">
            <SearchSelect v-model="filterVendorId" :options="vendorOptions" :placeholder="t('erp.apAging.allVendors')" @change="fetch" />
          </div>
        </div>
      </div>

      <!-- Loading -->
      <div v-if="loading" class="flex justify-center py-16">
        <div class="w-8 h-8 border-2 border-primary-500 border-t-transparent animate-spin"></div>
      </div>

      <template v-else-if="report">

        <!-- Summary Cards -->
        <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <div v-for="card in summaryCards" :key="card.key"
            class="bg-white border border-[#E2E8F0] shadow-sm px-4 py-4 flex flex-col gap-1">
            <p class="text-[11px] font-semibold uppercase tracking-wide" :class="card.labelClass">{{ card.label }}</p>
            <p class="text-lg font-bold text-[#1C2434] tabular-nums">{{ fmtMoney(report.summary[card.key]) }}</p>
            <p class="text-[11px] text-[#9BA7B0]">
              {{ report.summary.total > 0 ? pct(report.summary[card.key], report.summary.total) + '%' : '0%' }}
            </p>
          </div>
          <div class="bg-primary-50 border border-primary-200 px-4 py-4 flex flex-col gap-1">
            <p class="text-[11px] font-semibold uppercase tracking-wide text-primary-600">{{ t('erp.apAging.grandTotal') }}</p>
            <p class="text-lg font-bold text-primary-700 tabular-nums">{{ fmtMoney(report.summary.total) }}</p>
            <p class="text-[11px] text-primary-500">{{ report.vendors.length }} {{ t('erp.apAging.vendorsLabel') }}</p>
          </div>
        </div>

        <!-- No data state -->
        <div v-if="report.vendors.length === 0"
          class="bg-white border border-[#E2E8F0] shadow-sm flex flex-col items-center gap-3 py-16">
          <div class="w-12 h-12 bg-[#F1F5F9] flex items-center justify-center">
            <ChartBarIcon class="w-6 h-6 text-[#9BA7B0]" />
          </div>
          <div class="text-center">
            <p class="text-sm font-medium text-[#637381]">{{ t('erp.apAging.noData') }}</p>
            <p class="text-xs text-[#9BA7B0] mt-1">{{ t('erp.apAging.noDataHint') }}</p>
          </div>
        </div>

        <!-- Aging Table per vendor -->
        <div v-else class="bg-white border border-[#E2E8F0] shadow-sm overflow-hidden">
          <table class="w-full text-sm">
            <thead>
              <tr class="bg-[#F8FAFC] border-b border-[#E2E8F0]">
                <th class="px-4 py-3 text-left text-xs font-semibold text-[#637381] uppercase tracking-wide w-52">{{ t('erp.apAging.vendor') }}</th>
                <th class="px-4 py-3 text-right text-xs font-semibold text-[#637381] uppercase tracking-wide">{{ t('erp.apAging.bucketCurrent') }}</th>
                <th class="px-4 py-3 text-right text-xs font-semibold text-amber-600 uppercase tracking-wide">{{ t('erp.apAging.bucket1_30') }}</th>
                <th class="px-4 py-3 text-right text-xs font-semibold text-orange-600 uppercase tracking-wide">{{ t('erp.apAging.bucket31_60') }}</th>
                <th class="px-4 py-3 text-right text-xs font-semibold text-red-500 uppercase tracking-wide">{{ t('erp.apAging.bucket61_90') }}</th>
                <th class="px-4 py-3 text-right text-xs font-semibold text-red-700 uppercase tracking-wide">{{ t('erp.apAging.bucket91plus') }}</th>
                <th class="px-4 py-3 text-right text-xs font-semibold text-[#1C2434] uppercase tracking-wide">{{ t('erp.apAging.grandTotal') }}</th>
                <th class="px-4 py-3 w-8"></th>
              </tr>
            </thead>
            <tbody>
              <template v-for="entry in report.vendors" :key="entry.vendor.id">
                <tr class="border-b border-[#F1F5F9] hover:bg-[#F8FAFC] cursor-pointer transition-colors"
                  @click="toggleVendor(entry.vendor.id)">
                  <td class="px-4 py-3">
                    <div class="font-medium text-[#1C2434]">{{ entry.vendor.name }}</div>
                    <div v-if="entry.vendor.code" class="text-xs text-[#9BA7B0]">{{ entry.vendor.code }}</div>
                  </td>
                  <td class="px-4 py-3 text-right tabular-nums text-[#374151]">
                    <span :class="entry.summary.current > 0 ? 'font-medium' : 'text-[#CBD5E1]'">{{ entry.summary.current > 0 ? fmtMoney(entry.summary.current) : '—' }}</span>
                  </td>
                  <td class="px-4 py-3 text-right tabular-nums">
                    <span :class="entry.summary.days1_30 > 0 ? 'font-medium text-amber-600' : 'text-[#CBD5E1]'">{{ entry.summary.days1_30 > 0 ? fmtMoney(entry.summary.days1_30) : '—' }}</span>
                  </td>
                  <td class="px-4 py-3 text-right tabular-nums">
                    <span :class="entry.summary.days31_60 > 0 ? 'font-medium text-orange-600' : 'text-[#CBD5E1]'">{{ entry.summary.days31_60 > 0 ? fmtMoney(entry.summary.days31_60) : '—' }}</span>
                  </td>
                  <td class="px-4 py-3 text-right tabular-nums">
                    <span :class="entry.summary.days61_90 > 0 ? 'font-medium text-red-500' : 'text-[#CBD5E1]'">{{ entry.summary.days61_90 > 0 ? fmtMoney(entry.summary.days61_90) : '—' }}</span>
                  </td>
                  <td class="px-4 py-3 text-right tabular-nums">
                    <span :class="entry.summary.days91plus > 0 ? 'font-bold text-red-700' : 'text-[#CBD5E1]'">{{ entry.summary.days91plus > 0 ? fmtMoney(entry.summary.days91plus) : '—' }}</span>
                  </td>
                  <td class="px-4 py-3 text-right font-bold tabular-nums text-[#1C2434]">{{ fmtMoney(entry.summary.total) }}</td>
                  <td class="px-4 py-3 text-center">
                    <ChevronDownIcon class="w-4 h-4 text-[#9BA7B0] transition-transform" :class="expandedVendors.has(entry.vendor.id) ? 'rotate-180' : ''" />
                  </td>
                </tr>

                <template v-if="expandedVendors.has(entry.vendor.id)">
                  <tr v-for="bill in entry.bills" :key="bill.id" class="border-b border-[#F1F5F9] bg-[#FAFBFC]">
                    <td class="px-4 py-2.5 pl-8">
                      <div class="flex items-center gap-2">
                        <span class="w-1.5 h-1.5 flex-shrink-0" :class="bucketDot(bill.bucket)"></span>
                        <RouterLink :to="`/erp/purchasing/bills/${bill.id}`" class="font-mono text-xs font-medium text-primary-600 hover:underline">{{ bill.billNumber }}</RouterLink>
                      </div>
                    </td>
                    <td class="px-4 py-2.5 text-right text-xs tabular-nums"><span v-if="bill.bucket === 'current'" class="text-[#374151]">{{ fmtMoney(bill.total) }}</span><span v-else class="text-[#CBD5E1]">—</span></td>
                    <td class="px-4 py-2.5 text-right text-xs tabular-nums"><span v-if="bill.bucket === 'days1_30'" class="text-amber-600">{{ fmtMoney(bill.total) }}</span><span v-else class="text-[#CBD5E1]">—</span></td>
                    <td class="px-4 py-2.5 text-right text-xs tabular-nums"><span v-if="bill.bucket === 'days31_60'" class="text-orange-600">{{ fmtMoney(bill.total) }}</span><span v-else class="text-[#CBD5E1]">—</span></td>
                    <td class="px-4 py-2.5 text-right text-xs tabular-nums"><span v-if="bill.bucket === 'days61_90'" class="text-red-500">{{ fmtMoney(bill.total) }}</span><span v-else class="text-[#CBD5E1]">—</span></td>
                    <td class="px-4 py-2.5 text-right text-xs tabular-nums"><span v-if="bill.bucket === 'days91plus'" class="font-semibold text-red-700">{{ fmtMoney(bill.total) }}</span><span v-else class="text-[#CBD5E1]">—</span></td>
                    <td class="px-4 py-2.5 text-right text-xs font-medium tabular-nums text-[#374151]">{{ fmtMoney(bill.total) }}</td>
                    <td class="px-4 py-2.5">
                      <div class="flex items-center justify-end gap-1.5">
                        <span v-if="bill.daysOverdue > 0" class="inline-flex items-center px-1.5 py-0.5 text-[10px] font-semibold" :class="overdueBadge(bill.bucket)">+{{ bill.daysOverdue }}d</span>
                      </div>
                    </td>
                  </tr>
                </template>
              </template>

              <tr class="bg-[#F8FAFC] border-t-2 border-[#E2E8F0]">
                <td class="px-4 py-3 text-xs font-bold text-[#1C2434] uppercase tracking-wide">{{ t('erp.apAging.grandTotal') }}</td>
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

const loading        = ref(false)
const report         = ref(null)
const asOfDate       = ref(new Date().toISOString().slice(0, 10))
const filterVendorId = ref('')
const expandedVendors = ref(new Set())

const vendorOptions = computed(() => report.value ? report.value.vendors.map(e => e.vendor) : [])

const summaryCards = computed(() => {
  if (!report.value) return []
  return [
    { key: 'current',    label: t('erp.apAging.bucketCurrent'), labelClass: 'text-[#637381]' },
    { key: 'days1_30',   label: t('erp.apAging.bucket1_30'),    labelClass: 'text-amber-600' },
    { key: 'days31_60',  label: t('erp.apAging.bucket31_60'),   labelClass: 'text-orange-600' },
    { key: 'days61_90',  label: t('erp.apAging.bucket61_90'),   labelClass: 'text-red-500' },
    { key: 'days91plus', label: t('erp.apAging.bucket91plus'),  labelClass: 'text-red-700' },
  ]
})

async function fetch() {
  loading.value = true
  try {
    const params = { asOfDate: asOfDate.value }
    if (filterVendorId.value) params.vendorId = filterVendorId.value
    const { data } = await api.get('/erp/accounting/ap-aging', { params })
    report.value = data.data.report
    expandedVendors.value = new Set()
  } finally {
    loading.value = false
  }
}

function toggleVendor(id) {
  const next = new Set(expandedVendors.value)
  next.has(id) ? next.delete(id) : next.add(id)
  expandedVendors.value = next
}

function pct(part, total) { return !total ? '0' : Math.round((part / total) * 100) }

function bucketDot(bucket) {
  return { current: 'bg-slate-400', days1_30: 'bg-amber-400', days31_60: 'bg-orange-500', days61_90: 'bg-red-500', days91plus: 'bg-red-700' }[bucket] || 'bg-slate-400'
}
function overdueBadge(bucket) {
  return { days1_30: 'bg-amber-50 text-amber-700', days31_60: 'bg-orange-50 text-orange-700', days61_90: 'bg-red-50 text-red-600', days91plus: 'bg-red-100 text-red-800' }[bucket] || ''
}
function printReport() { window.print() }

onMounted(fetch)
</script>
