<template>
  <AppLayout>
    <div class="space-y-5">

      <!-- Header -->
      <div class="flex items-center justify-between gap-4">
        <div>
          <h1 class="text-xl font-semibold text-[#1C2434]">{{ t('erp.quotations.title') }}</h1>
          <p class="text-sm text-[#637381] mt-0.5">{{ total }} {{ t('erp.quotations.title').toLowerCase() }}</p>
        </div>
        <div class="flex items-center gap-2">
          <KeyboardShortcuts :shortcuts="shortcuts" />
          <RouterLink to="/erp/quotations/create" class="btn-primary">
            <PlusIcon class="w-4 h-4" />
            {{ t('erp.quotations.new') }}
          </RouterLink>
        </div>
      </div>

      <!-- Table card -->
      <div class="bg-white border border-[#E2E8F0] shadow-sm overflow-hidden">
        <DataTable ref="dataTableRef" :columns="columns" :data="quotations" :loading="loading" :total="total"
          v-model:page="page" v-model:global-filter="search" :page-size="limit"
          :selected-row-index="selectedRowIndex" row-clickable @row-click="openQuotation"
          searchable :search-placeholder="t('erp.quotations.searchPh')">

          <template #toolbar>
            <button @click="showFilters = !showFilters"
              :class="['flex items-center gap-1.5 px-3 py-2 text-sm font-medium border transition-colors whitespace-nowrap',
                (activeFilterCount > 0 || showFilters)
                  ? 'bg-primary-50 border-primary-200 text-primary-600'
                  : 'bg-white border-[#E2E8F0] text-[#637381] hover:bg-slate-50']">
              <AdjustmentsHorizontalIcon class="w-4 h-4" />
              {{ t('common.filters') }}
              <span v-if="activeFilterCount" class="min-w-[18px] h-[18px] bg-primary-500 text-white text-[10px] flex items-center justify-center font-bold leading-none">
                {{ activeFilterCount }}
              </span>
            </button>
          </template>

          <template #filters>
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
                      <label class="block text-xs font-medium text-[#637381] mb-1.5">{{ t('erp.common.status') }}</label>
                      <SearchSelect v-model="filterStatus" :options="statusOptions" :placeholder="t('common.all')" @change="onFilterChange" />
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
          </template>

          <template #active-filters>
            <div v-if="activeFilterCount > 0" class="px-5 py-2.5 border-b border-[#E2E8F0] flex items-center gap-2 flex-wrap bg-primary-50/40">
              <span class="text-xs font-medium text-[#637381]">{{ t('common.activeFilters') }}:</span>
              <span v-if="filterStatus" class="inline-flex items-center gap-1 pl-2.5 pr-1 py-1 bg-white border border-[#E2E8F0] text-xs font-medium text-[#374151]">
                {{ t('erp.common.status') }}: <span class="capitalize font-semibold ml-0.5">{{ filterStatus }}</span>
                <button @click="filterStatus = ''; onFilterChange()" class="ml-1 p-0.5 text-[#9BA7B0] hover:text-red-500 transition-colors">
                  <XMarkIcon class="w-3 h-3" />
                </button>
              </span>
              <span v-if="filterDateFrom" class="inline-flex items-center gap-1 pl-2.5 pr-1 py-1 bg-white border border-[#E2E8F0] text-xs font-medium text-[#374151]">
                {{ t('common.dateFrom') }}: <span class="font-semibold ml-0.5">{{ filterDateFrom }}</span>
                <button @click="filterDateFrom = ''; onFilterChange()" class="ml-1 p-0.5 text-[#9BA7B0] hover:text-red-500 transition-colors">
                  <XMarkIcon class="w-3 h-3" />
                </button>
              </span>
              <span v-if="filterDateTo" class="inline-flex items-center gap-1 pl-2.5 pr-1 py-1 bg-white border border-[#E2E8F0] text-xs font-medium text-[#374151]">
                {{ t('common.dateTo') }}: <span class="font-semibold ml-0.5">{{ filterDateTo }}</span>
                <button @click="filterDateTo = ''; onFilterChange()" class="ml-1 p-0.5 text-[#9BA7B0] hover:text-red-500 transition-colors">
                  <XMarkIcon class="w-3 h-3" />
                </button>
              </span>
              <button @click="clearFilters" class="ml-auto text-xs text-red-500 hover:text-red-700 font-medium transition-colors">
                {{ t('common.clearAll') }}
              </button>
            </div>
          </template>

          <template #empty>
            <div class="flex flex-col items-center gap-3 py-4">
              <div class="w-10 h-10 bg-[#F1F5F9] flex items-center justify-center">
                <DocumentTextIcon class="w-5 h-5 text-[#9BA7B0]" />
              </div>
              <div class="text-center">
                <p class="text-sm font-medium text-[#637381]">{{ t('erp.quotations.noFound') }}</p>
                <p v-if="activeFilterCount > 0" class="text-xs text-[#9BA7B0] mt-1">Try adjusting your filters</p>
              </div>
              <button v-if="activeFilterCount > 0" @click="clearFilters"
                class="text-xs text-primary-500 hover:text-primary-700 font-medium underline">
                Clear all filters
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
import { RouterLink, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import {
  PlusIcon, TrashIcon, DocumentTextIcon, EyeIcon,
  AdjustmentsHorizontalIcon, XMarkIcon,
} from '@heroicons/vue/24/outline'
import { createColumnHelper } from '@tanstack/vue-table'
import AppLayout from '@/layouts/AppLayout.vue'
import DataTable from '@/components/DataTable.vue'
import KeyboardShortcuts from '@/components/KeyboardShortcuts.vue'
import SearchSelect from '@/components/SearchSelect.vue'
import { useListShortcuts } from '@/composables/useShortcuts'
import api from '@/api'
import { fmtDate } from '@/utils/fmt'

const { t } = useI18n()
const router = useRouter()

const statusOptions = computed(() => [
  { id: 'draft',     name: t('erp.quotations.draft')     },
  { id: 'sent',      name: t('erp.quotations.sent')      },
  { id: 'accepted',  name: t('erp.quotations.accepted')  },
  { id: 'rejected',  name: t('erp.quotations.rejected')  },
  { id: 'converted', name: t('erp.quotations.converted') },
])
const quotations    = ref([])
const total         = ref(0)
const page          = ref(1)
const limit         = 20
const search        = ref('')
const filterStatus  = ref('')
const filterDateFrom = ref('')
const filterDateTo  = ref('')
const showFilters   = ref(false)
const loading       = ref(false)
const dataTableRef  = ref(null)

const activeFilterCount = computed(() => [filterStatus.value, filterDateFrom.value, filterDateTo.value].filter(Boolean).length)
const totalPages = computed(() => Math.ceil(total.value / limit))

function openQuotation(q) { router.push(`/erp/quotations/${q.id}`) }

const { selectedIndex: selectedRowIndex, shortcuts } = useListShortcuts({
  rows: quotations, page, totalPages,
  open:        openQuotation,
  create:      () => router.push('/erp/quotations/create'),
  remove:      r => confirmDelete(r),
  focusSearch: () => dataTableRef.value?.focusSearch(),
  newLabel: 'New quotation',
})

async function load() {
  loading.value = true
  try {
    const { data } = await api.get('/erp/quotations', {
      params: {
        page: page.value, limit, search: search.value,
        status: filterStatus.value || undefined,
        dateFrom: filterDateFrom.value || undefined,
        dateTo: filterDateTo.value || undefined,
      },
    })
    quotations.value = data.data.quotations
    total.value      = data.data.total
    selectedRowIndex.value = -1
  } finally {
    loading.value = false
  }
}

function onFilterChange() { page.value = 1; load() }
function clearFilters() { filterStatus.value = ''; filterDateFrom.value = ''; filterDateTo.value = ''; page.value = 1; load() }

watch([page, search], load)
onMounted(load)

async function confirmDelete(q) {
  if (!confirm(`Delete quotation "${q.refNo}"? This cannot be undone.`)) return
  try {
    await api.delete(`/erp/quotations/${q.id}`)
    load()
  } catch (err) {
    alert(err.response?.data?.message || 'Delete failed')
  }
}

function fmtAmount(v) {
  if (v == null) return '—'
  return Number(v).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function statusClass(s) {
  return {
    draft:     'bg-[#F1F5F9] text-[#637381]',
    sent:      'bg-blue-50 text-blue-700',
    accepted:  'bg-green-50 text-green-700',
    rejected:  'bg-red-50 text-red-700',
    converted: 'bg-purple-50 text-purple-700',
  }[s] || 'bg-[#F1F5F9] text-[#637381]'
}

function statusDot(s) {
  return {
    draft:     'bg-slate-400',
    sent:      'bg-blue-500',
    accepted:  'bg-green-500',
    rejected:  'bg-red-500',
    converted: 'bg-purple-500',
  }[s] || 'bg-slate-400'
}

const columnHelper = createColumnHelper()

const columns = [
  columnHelper.accessor('refNo', {
    header: () => t('erp.quotations.colRefNo'),
    cell: info => h(RouterLink, {
      to: `/erp/quotations/${info.row.original.id}`,
      class: 'font-mono text-xs font-semibold text-primary-500 hover:underline',
    }, () => info.getValue()),
  }),
  columnHelper.display({
    id: 'customer',
    header: () => t('erp.quotations.colCustomer'),
    cell: info => info.row.original.customer?.name || '—',
  }),
  columnHelper.accessor('quotationDate', {
    header: () => t('erp.quotations.colDate'),
    cell: info => h('span', { class: 'text-xs' }, fmtDate(info.getValue())),
  }),
  columnHelper.accessor('validUntil', {
    header: () => t('erp.quotations.colValidUntil'),
    cell: info => h('span', { class: 'text-xs' }, fmtDate(info.getValue()) || '—'),
  }),
  columnHelper.accessor('total', {
    header: () => t('erp.quotations.colTotal'),
    cell: info => fmtAmount(info.getValue()),
    meta: { thClass: 'text-right', tdClass: 'text-right font-semibold text-[#1C2434] tabular-nums' },
  }),
  columnHelper.accessor('status', {
    header: () => t('erp.quotations.colStatus'),
    cell: info => {
      const s = info.getValue()
      return h('span', {
        class: `inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold capitalize ${statusClass(s)}`
      }, [
        h('span', { class: `w-1.5 h-1.5 ${statusDot(s)}` }),
        t('erp.quotations.' + s),
      ])
    },
  }),
  columnHelper.display({
    id: 'actions',
    header: () => '',
    meta: { thClass: 'w-20', tdClass: '' },
    cell: info => {
      const q = info.row.original
      return h('div', { class: 'flex items-center justify-end gap-1' }, [
        h(RouterLink, {
          to: `/erp/quotations/${q.id}`,
          class: 'p-1.5 text-[#9BA7B0] hover:text-primary-500 hover:bg-primary-50 transition-colors',
          title: 'View',
        }, () => h(EyeIcon, { class: 'w-4 h-4' })),
        q.status === 'draft' ? h('button', {
          onClick: () => confirmDelete(q),
          class: 'p-1.5 text-[#9BA7B0] hover:text-red-600 hover:bg-red-50 transition-colors',
          title: 'Delete',
        }, h(TrashIcon, { class: 'w-4 h-4' })) : null,
      ])
    },
  }),
]
</script>
