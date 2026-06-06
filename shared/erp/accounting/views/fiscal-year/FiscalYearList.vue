<template>
  <AppLayout>
    <div class="space-y-5">

      <div class="flex items-center justify-between gap-4">
        <div>
          <h1 class="text-xl font-semibold text-[#1C2434]">{{ t('erp.fiscalYears.title') }}</h1>
          <p class="text-sm text-[#637381] mt-0.5">{{ total }} fiscal year{{ total !== 1 ? 's' : '' }}</p>
        </div>
        <div class="flex items-center gap-2">
          <KeyboardShortcuts :shortcuts="shortcuts" />
          <RouterLink
            v-can="'erp.accounting.edit'"
            to="/erp/accounting/fiscal-years/create"
            class="btn-primary">
            <PlusIcon class="w-4 h-4" />
            {{ t('erp.fiscalYears.new') }}
          </RouterLink>
        </div>
      </div>

      <div class="bg-white border border-[#E2E8F0] shadow-sm overflow-hidden">
        <DataTable ref="dataTableRef" :columns="columns" :data="fiscalYears" :loading="loading" :total="total"
          v-model:page="page" v-model:global-filter="search" :page-size="limit"
          :selected-row-index="selectedRowIndex" row-clickable @row-click="openRow"
          searchable :search-placeholder="t('erp.fiscalYears.searchPh')">

          <template #toolbar>
            <div class="w-36">
              <SearchSelect v-model="filterStatus" :options="statusOptions" :placeholder="t('erp.common.allStatuses')" @change="onFilterChange" />
            </div>
          </template>

          <template #empty>
            <div class="flex flex-col items-center gap-3 py-4">
              <div class="w-10 h-10 bg-[#F1F5F9] flex items-center justify-center">
                <CalendarDaysIcon class="w-5 h-5 text-[#9BA7B0]" />
              </div>
              <div class="text-center">
                <p class="text-sm font-medium text-[#637381]">{{ t('erp.fiscalYears.noFound') }}</p>
                <p v-if="filterStatus" class="text-xs text-[#9BA7B0] mt-1">{{ t('common.tryAdjustingFilters') }}</p>
              </div>
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
import { PlusIcon, EyeIcon, CalendarDaysIcon, LockClosedIcon } from '@heroicons/vue/24/outline'
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
  { id: 'open',   name: t('erp.fiscalYears.statusOpen')   },
  { id: 'closed', name: t('erp.fiscalYears.statusClosed') },
])

const fiscalYears  = ref([])
const total        = ref(0)
const page         = ref(1)
const limit        = 20
const search       = ref('')
const filterStatus = ref('')
const loading      = ref(false)
const dataTableRef = ref(null)

const totalPages = computed(() => Math.ceil(total.value / limit))

const { selectedIndex: selectedRowIndex, shortcuts, open: openRow } = useListShortcuts({
  rows: fiscalYears, page, totalPages,
  open:        r => router.push(`/erp/accounting/fiscal-years/${r.id}`),
  create:      () => router.push('/erp/accounting/fiscal-years/create'),
  focusSearch: () => dataTableRef.value?.focusSearch(),
  newLabel: 'New fiscal year',
})

async function fetchFiscalYears() {
  loading.value = true
  try {
    const { data } = await api.get('/erp/accounting/fiscal-years', {
      params: { page: page.value, limit, search: search.value, status: filterStatus.value || undefined },
    })
    fiscalYears.value = data.data.fiscalYears
    total.value       = data.data.total
    selectedRowIndex.value = -1
  } finally {
    loading.value = false
  }
}

function onFilterChange() { page.value = 1; fetchFiscalYears() }

watch([page, search], fetchFiscalYears)
onMounted(fetchFiscalYears)

function durationDays(start, end) {
  if (!start || !end) return '—'
  const ms = new Date(end) - new Date(start)
  return `${Math.round(ms / 86_400_000) + 1} days`
}

const STATUS_STYLE = {
  open:   { badge: 'bg-green-50 text-green-700',  dot: 'bg-green-500' },
  closed: { badge: 'bg-[#F1F5F9] text-[#637381]', dot: 'bg-slate-400' },
}
function statusClass(s) { return (STATUS_STYLE[s] || STATUS_STYLE.open).badge }
function statusDot(s)   { return (STATUS_STYLE[s] || STATUS_STYLE.open).dot }

const columnHelper = createColumnHelper()
const columns = [
  columnHelper.accessor('name', {
    header: () => t('erp.fiscalYears.colName'),
    cell: info => h('span', { class: 'font-semibold text-sm text-[#1C2434]' }, info.getValue()),
  }),
  columnHelper.accessor('startDate', {
    header: () => t('erp.fiscalYears.colStartDate'),
    cell: info => h('span', { class: 'text-xs text-[#637381]' }, fmtDate(info.getValue())),
  }),
  columnHelper.accessor('endDate', {
    header: () => t('erp.fiscalYears.colEndDate'),
    cell: info => h('span', { class: 'text-xs text-[#637381]' }, fmtDate(info.getValue())),
  }),
  columnHelper.display({
    id: 'duration',
    header: () => t('erp.fiscalYears.colDuration'),
    cell: info => h('span', { class: 'text-xs text-[#9BA7B0]' },
      durationDays(info.row.original.startDate, info.row.original.endDate)),
  }),
  columnHelper.accessor('status', {
    header: () => t('common.status'),
    cell: info => {
      const s = info.getValue()
      return h('span', {
        class: `inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold capitalize ${statusClass(s)}`
      }, [
        s === 'closed'
          ? h(LockClosedIcon, { class: 'w-3 h-3' })
          : h('span', { class: `w-1.5 h-1.5 ${statusDot(s)}` }),
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
        to: `/erp/accounting/fiscal-years/${info.row.original.id}`,
        class: 'p-1.5 text-[#9BA7B0] hover:text-primary-500 hover:bg-primary-50 transition-colors',
        title: 'View',
      }, () => h(EyeIcon, { class: 'w-4 h-4' })),
    ]),
  }),
]
</script>
