<template>
  <AppLayout>
    <div class="space-y-5">

      <div class="flex items-center justify-between gap-4">
        <div>
          <h1 class="text-xl font-semibold text-[#1C2434]">{{ t('erp.receipts.title') }}</h1>
          <p class="text-sm text-[#637381] mt-0.5">{{ total }} receipt{{ total !== 1 ? 's' : '' }}</p>
        </div>
        <RouterLink
          v-can="'erp.receipts.edit'"
          to="/erp/receipts/create"
          class="btn-primary">
          <PlusIcon class="w-4 h-4" />
          {{ t('erp.receipts.new') }}
        </RouterLink>
      </div>

      <div class="bg-white rounded-2xl border border-[#E2E8F0] shadow-sm overflow-hidden">

        <!-- ── Toolbar ─────────────────────────────────────────────── -->
        <div class="px-5 py-3 border-b border-[#E2E8F0] flex items-center gap-3">
          <div class="relative flex-1 min-w-0">
            <MagnifyingGlassIcon class="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#9BA7B0] pointer-events-none" />
            <input v-model="search" @input="onSearch" type="search" :placeholder="t('erp.receipts.searchPh')"
              class="input pl-9 w-full" />
          </div>
          <button @click="showFilters = !showFilters"
            :class="['flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-lg border transition-colors whitespace-nowrap',
              (activeFilterCount > 0 || showFilters)
                ? 'bg-primary-50 border-primary-200 text-primary-600'
                : 'bg-white border-[#E2E8F0] text-[#637381] hover:bg-slate-50']">
            <AdjustmentsHorizontalIcon class="w-4 h-4" />
            {{ t('common.filters') }}
            <span v-if="activeFilterCount" class="min-w-[18px] h-[18px] bg-primary-500 text-white text-[10px] rounded-full flex items-center justify-center font-bold leading-none">
              {{ activeFilterCount }}
            </span>
          </button>
        </div>

        <!-- ── Advanced filter panel ──────────────────────────────── -->
        <Transition
          enter-active-class="transition-all duration-150 ease-out"
          enter-from-class="opacity-0 -translate-y-1"
          enter-to-class="opacity-100 translate-y-0"
          leave-active-class="transition-all duration-100 ease-in"
          leave-from-class="opacity-100 translate-y-0"
          leave-to-class="opacity-0 -translate-y-1">
          <div v-if="showFilters" class="border-b border-[#E2E8F0] bg-slate-50">
            <div class="px-5 py-4">
              <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                <div>
                  <label class="block text-xs font-medium text-[#637381] mb-1.5">{{ t('common.status') }}</label>
                  <SearchSelect v-model="filterStatus" :options="statusOptions" :placeholder="t('common.all')" @change="onFilterChange" />
                </div>
                <div>
                  <label class="block text-xs font-medium text-[#637381] mb-1.5">{{ t('erp.receipts.paymentMethod') }}</label>
                  <SearchSelect v-model="filterPaymentMethod" :options="paymentMethodOptions" :placeholder="t('erp.receipts.allMethods')" @change="onFilterChange" />
                </div>
                <div>
                  <label class="block text-xs font-medium text-[#637381] mb-1.5">{{ t('common.dateFrom') }}</label>
                  <DateInput v-model="filterDateFrom" @change="onFilterChange" class="input text-sm" />
                </div>
                <div>
                  <label class="block text-xs font-medium text-[#637381] mb-1.5">{{ t('common.dateTo') }}</label>
                  <DateInput v-model="filterDateTo" @change="onFilterChange" class="input text-sm" />
                </div>
              </div>
              <div class="mt-3 flex justify-end">
                <button @click="clearFilters" class="text-xs text-[#9BA7B0] hover:text-red-500 transition-colors font-medium">
                  {{ t('common.resetFilters') }}
                </button>
              </div>
            </div>
          </div>
        </Transition>

        <!-- ── Active filter chips ────────────────────────────────── -->
        <div v-if="activeFilterCount > 0" class="px-5 py-2.5 border-b border-[#E2E8F0] flex items-center gap-2 flex-wrap bg-primary-50/40">
          <span class="text-xs font-medium text-[#637381]">{{ t('common.activeFilters') }}</span>
          <span v-if="filterStatus" class="inline-flex items-center gap-1 pl-2.5 pr-1 py-1 bg-white border border-[#E2E8F0] rounded-full text-xs font-medium text-[#374151]">
            {{ t('common.status') }}: <span class="capitalize font-semibold ml-0.5">{{ filterStatus }}</span>
            <button @click="filterStatus = ''; onFilterChange()" class="ml-1 p-0.5 text-[#9BA7B0] hover:text-red-500 rounded-full transition-colors">
              <XMarkIcon class="w-3 h-3" />
            </button>
          </span>
          <span v-if="filterPaymentMethod" class="inline-flex items-center gap-1 pl-2.5 pr-1 py-1 bg-white border border-[#E2E8F0] rounded-full text-xs font-medium text-[#374151]">
            {{ t('erp.receipts.methodFilter') }} <span class="font-semibold ml-0.5">{{ methodLabel(filterPaymentMethod) }}</span>
            <button @click="filterPaymentMethod = ''; onFilterChange()" class="ml-1 p-0.5 text-[#9BA7B0] hover:text-red-500 rounded-full transition-colors">
              <XMarkIcon class="w-3 h-3" />
            </button>
          </span>
          <span v-if="filterDateFrom" class="inline-flex items-center gap-1 pl-2.5 pr-1 py-1 bg-white border border-[#E2E8F0] rounded-full text-xs font-medium text-[#374151]">
            {{ t('common.from') }}: <span class="font-semibold ml-0.5">{{ filterDateFrom }}</span>
            <button @click="filterDateFrom = ''; onFilterChange()" class="ml-1 p-0.5 text-[#9BA7B0] hover:text-red-500 rounded-full transition-colors">
              <XMarkIcon class="w-3 h-3" />
            </button>
          </span>
          <span v-if="filterDateTo" class="inline-flex items-center gap-1 pl-2.5 pr-1 py-1 bg-white border border-[#E2E8F0] rounded-full text-xs font-medium text-[#374151]">
            {{ t('common.to') }}: <span class="font-semibold ml-0.5">{{ filterDateTo }}</span>
            <button @click="filterDateTo = ''; onFilterChange()" class="ml-1 p-0.5 text-[#9BA7B0] hover:text-red-500 rounded-full transition-colors">
              <XMarkIcon class="w-3 h-3" />
            </button>
          </span>
          <button @click="clearFilters" class="ml-auto text-xs text-red-500 hover:text-red-700 font-medium transition-colors">
            {{ t('common.clearAll') }}
          </button>
        </div>

        <DataTable :columns="columns" :data="receipts" :loading="loading" :total="total"
          v-model:page="page" :page-size="limit">
          <template #empty>
            <div class="flex flex-col items-center gap-3 py-4">
              <div class="w-10 h-10 bg-[#F1F5F9] rounded-xl flex items-center justify-center">
                <BanknotesIcon class="w-5 h-5 text-[#9BA7B0]" />
              </div>
              <div class="text-center">
                <p class="text-sm font-medium text-[#637381]">{{ t('erp.receipts.noFound') }}</p>
                <p v-if="activeFilterCount > 0" class="text-xs text-[#9BA7B0] mt-1">{{ t('common.tryAdjustingFilters') }}</p>
              </div>
              <button v-if="activeFilterCount > 0" @click="clearFilters"
                class="text-xs text-primary-500 hover:text-primary-700 font-medium underline">
                {{ t('common.clearAll') }}
              </button>
            </div>
          </template>
        </DataTable>

      </div>

    </div>
  </AppLayout>
</template>

<script setup>
import { h, ref, computed, watch, onMounted } from 'vue'
import { RouterLink } from 'vue-router'
import { useI18n } from 'vue-i18n'
import {
  PlusIcon, MagnifyingGlassIcon, EyeIcon, BanknotesIcon,
  AdjustmentsHorizontalIcon, XMarkIcon,
} from '@heroicons/vue/24/outline'
import { createColumnHelper } from '@tanstack/vue-table'
import AppLayout from '@/layouts/AppLayout.vue'
import DataTable from '@/components/DataTable.vue'
import SearchSelect from '@/components/SearchSelect.vue'
import api from '@/api'
import { fmtMoney } from '@/utils/fmt'

const { t } = useI18n()

const statusOptions = computed(() => [
  { id: 'draft',     name: t('erp.common.draft')     },
  { id: 'confirmed', name: t('erp.common.confirmed') },
  { id: 'cancelled', name: t('erp.common.cancelled') },
])
const paymentMethodOptions = computed(() => [
  { id: 'cash',          name: t('erp.receipts.cash')         },
  { id: 'bank_transfer', name: t('erp.receipts.bankTransfer') },
  { id: 'cheque',        name: t('erp.receipts.cheque')       },
  { id: 'credit_card',   name: t('erp.receipts.creditCard')   },
  { id: 'other',         name: t('erp.receipts.other')        },
])

const receipts            = ref([])
const total               = ref(0)
const page                = ref(1)
const limit               = 20
const search              = ref('')
const filterStatus        = ref('')
const filterPaymentMethod = ref('')
const filterDateFrom      = ref('')
const filterDateTo        = ref('')
const showFilters         = ref(false)
const loading             = ref(false)
let searchTimeout         = null

const activeFilterCount = computed(() => [filterStatus.value, filterPaymentMethod.value, filterDateFrom.value, filterDateTo.value].filter(Boolean).length)

async function fetchReceipts() {
  loading.value = true
  try {
    const { data } = await api.get('/erp/receipts', {
      params: {
        page: page.value, limit, search: search.value,
        status: filterStatus.value || undefined,
        paymentMethod: filterPaymentMethod.value || undefined,
        dateFrom: filterDateFrom.value || undefined,
        dateTo: filterDateTo.value || undefined,
      },
    })
    receipts.value = data.data.receipts
    total.value    = data.data.total
  } finally {
    loading.value = false
  }
}

function onSearch() {
  clearTimeout(searchTimeout)
  searchTimeout = setTimeout(() => { page.value = 1; fetchReceipts() }, 350)
}
function onFilterChange() { page.value = 1; fetchReceipts() }
function clearFilters() {
  filterStatus.value = ''; filterPaymentMethod.value = ''; filterDateFrom.value = ''; filterDateTo.value = ''
  page.value = 1; fetchReceipts()
}

watch(page, fetchReceipts)
onMounted(fetchReceipts)

const METHOD_LABELS = {
  cash:          'Cash',
  bank_transfer: 'Bank Transfer',
  cheque:        'Cheque',
  credit_card:   'Credit Card',
  other:         'Other',
}
function methodLabel(m) { return METHOD_LABELS[m] || m }

const STATUS_STYLE = {
  draft:     { badge: 'bg-[#F1F5F9] text-[#637381]',   dot: 'bg-slate-400' },
  confirmed: { badge: 'bg-green-50 text-green-700',  dot: 'bg-green-500' },
  cancelled: { badge: 'bg-red-50 text-red-600',      dot: 'bg-red-500' },
}
function statusClass(s) { return (STATUS_STYLE[s] || STATUS_STYLE.draft).badge }
function statusDot(s)   { return (STATUS_STYLE[s] || STATUS_STYLE.draft).dot }

const columnHelper = createColumnHelper()

const columns = [
  columnHelper.accessor('receiptNumber', {
    header: () => t('erp.receipts.colReceiptNo'),
    cell: info => h('span', { class: 'font-mono text-sm font-medium text-[#1C2434]' }, info.getValue()),
  }),
  columnHelper.display({
    id: 'customer',
    header: () => t('erp.receipts.colCustomer'),
    cell: info => info.row.original.customer?.name || '—',
  }),
  columnHelper.accessor('receiptDate', {
    header: () => t('erp.receipts.colDate'),
    cell: info => h('span', { class: 'text-xs' }, info.getValue()),
  }),
  columnHelper.accessor('paymentMethod', {
    header: () => t('erp.receipts.colMethod'),
    cell: info => h('span', {
      class: 'inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-[#F1F5F9] text-xs font-medium text-[#637381]'
    }, methodLabel(info.getValue())),
  }),
  columnHelper.accessor('amount', {
    header: () => t('erp.receipts.colAmount'),
    cell: info => fmtMoney(info.getValue()),
    meta: { thClass: 'text-right', tdClass: 'text-right font-semibold text-[#1C2434] tabular-nums' },
  }),
  columnHelper.accessor('status', {
    header: () => t('common.status'),
    cell: info => {
      const s = info.getValue()
      return h('span', {
        class: `inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold capitalize ${statusClass(s)}`
      }, [
        h('span', { class: `w-1.5 h-1.5 rounded-full ${statusDot(s)}` }),
        s,
      ])
    },
  }),
  columnHelper.display({
    id: 'actions',
    header: () => '',
    meta: { thClass: 'w-16', tdClass: '' },
    cell: info => h('div', { class: 'flex items-center justify-end' }, [
      h(RouterLink, {
        to: `/erp/receipts/${info.row.original.id}`,
        class: 'p-1.5 text-[#9BA7B0] hover:text-primary-500 hover:bg-primary-50 rounded-md transition-colors',
        title: 'View',
      }, () => h(EyeIcon, { class: 'w-4 h-4' })),
    ]),
  }),
]
</script>
