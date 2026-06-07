<template>
  <AppLayout>
    <div class="space-y-5">

      <div class="flex items-center justify-between gap-4">
        <div>
          <h1 class="text-xl font-semibold text-[#1C2434]">{{ t('erp.debitNotes.title') }}</h1>
          <p class="text-sm text-[#637381] mt-0.5">{{ total }} debit note{{ total !== 1 ? 's' : '' }}</p>
        </div>
        <div class="flex items-center gap-2">
          <KeyboardShortcuts :shortcuts="shortcuts" />
          <RouterLink
            v-can="'erp.accounting.edit'"
            to="/erp/billing/debit-notes/create"
            class="btn-primary">
            <PlusIcon class="w-4 h-4" />
            {{ t('erp.debitNotes.new') }}
          </RouterLink>
        </div>
      </div>

      <div class="bg-white border border-[#E2E8F0] shadow-sm overflow-hidden">
        <DataTable ref="dataTableRef" :columns="columns" :data="debitNotes" :loading="loading" :total="total"
          v-model:page="page" v-model:global-filter="search" :page-size="limit"
          :selected-row-index="selectedRowIndex" row-clickable @row-click="openRow"
          searchable :search-placeholder="t('erp.debitNotes.searchPh')">

          <template #toolbar>
            <div class="w-40">
              <SearchSelect v-model="filterStatus" :options="STATUS_FILTER_OPTIONS" :placeholder="t('erp.common.allStatuses')" @change="onFilterChange" />
            </div>
          </template>

          <template #empty>
            <div class="flex flex-col items-center gap-3 py-4">
              <div class="w-10 h-10 bg-[#F1F5F9] flex items-center justify-center">
                <ArrowTrendingUpIcon class="w-5 h-5 text-[#9BA7B0]" />
              </div>
              <div class="text-center">
                <p class="text-sm font-medium text-[#637381]">{{ t('erp.debitNotes.noFound') }}</p>
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
import { PlusIcon, EyeIcon, ArrowTrendingUpIcon } from '@heroicons/vue/24/outline'
import { createColumnHelper } from '@tanstack/vue-table'
import AppLayout from '@/layouts/AppLayout.vue'
import DataTable from '@/components/DataTable.vue'
import KeyboardShortcuts from '@/components/KeyboardShortcuts.vue'
import SearchSelect from '@/components/SearchSelect.vue'
import { useListShortcuts } from '@/composables/useShortcuts'
import api from '@/api'
import { fmtMoney, fmtDate } from '@/utils/fmt'

const { t } = useI18n()
const router = useRouter()

const STATUS_FILTER_OPTIONS = computed(() => [
  { id: 'draft',     name: t('erp.common.draft') },
  { id: 'issued',    name: t('erp.debitNotes.statusIssued') },
  { id: 'cancelled', name: t('erp.common.cancelled') },
])

const debitNotes    = ref([])
const total         = ref(0)
const page          = ref(1)
const limit         = 20
const search        = ref('')
const filterStatus  = ref('')
const loading       = ref(false)
const dataTableRef  = ref(null)

const totalPages = computed(() => Math.ceil(total.value / limit))

const { selectedIndex: selectedRowIndex, shortcuts, open: openRow } = useListShortcuts({
  rows: debitNotes, page, totalPages,
  open:        r => router.push(`/erp/billing/debit-notes/${r.id}`),
  create:      () => router.push('/erp/billing/debit-notes/create'),
  focusSearch: () => dataTableRef.value?.focusSearch(),
  newLabel: 'New debit note',
})

async function fetchDebitNotes() {
  loading.value = true
  try {
    const { data } = await api.get('/erp/billing/debit-notes', {
      params: { page: page.value, limit, search: search.value, status: filterStatus.value || undefined },
    })
    debitNotes.value = data.data.debitNotes
    total.value      = data.data.total
    selectedRowIndex.value = -1
  } finally {
    loading.value = false
  }
}

function onFilterChange() { page.value = 1; fetchDebitNotes() }

watch([page, search], fetchDebitNotes)
onMounted(fetchDebitNotes)

const STATUS_STYLE = {
  draft:     { badge: 'bg-[#F1F5F9] text-[#637381]', dot: 'bg-slate-400' },
  issued:    { badge: 'bg-blue-50 text-blue-700',     dot: 'bg-blue-500' },
  cancelled: { badge: 'bg-red-50 text-red-600',       dot: 'bg-red-500' },
}
function statusClass(s) { return (STATUS_STYLE[s] || STATUS_STYLE.draft).badge }
function statusDot(s)   { return (STATUS_STYLE[s] || STATUS_STYLE.draft).dot }

const columnHelper = createColumnHelper()
const columns = [
  columnHelper.accessor('refNo', {
    header: () => t('erp.debitNotes.colRefNo'),
    cell: info => h('span', { class: 'font-mono text-sm font-medium text-[#1C2434]' }, info.getValue()),
  }),
  columnHelper.display({
    id: 'customer',
    header: () => t('erp.common.customer'),
    cell: info => info.row.original.customer?.name || '—',
  }),
  columnHelper.display({
    id: 'invoice',
    header: () => t('erp.debitNotes.colInvoice'),
    cell: info => {
      const inv = info.row.original.invoice
      if (!inv) return h('span', { class: 'text-[#9BA7B0] text-xs' }, '—')
      return h(RouterLink, {
        to: `/erp/invoices/${inv.id}`,
        class: 'font-mono text-xs text-primary-500 hover:underline',
      }, () => inv.invoiceNumber)
    },
  }),
  columnHelper.accessor('reason', {
    header: () => t('erp.debitNotes.colReason'),
    cell: info => h('span', { class: 'text-sm text-[#374151] line-clamp-1 max-w-xs' }, info.getValue()),
  }),
  columnHelper.accessor('date', {
    header: () => t('erp.common.date'),
    cell: info => h('span', { class: 'text-xs' }, fmtDate(info.getValue())),
  }),
  columnHelper.accessor('amount', {
    header: () => t('erp.debitNotes.colAmount'),
    cell: info => fmtMoney(info.getValue()),
    meta: { thClass: 'text-right', tdClass: 'text-right font-semibold text-[#1C2434] tabular-nums' },
  }),
  columnHelper.accessor('status', {
    header: () => t('common.status'),
    cell: info => {
      const s = info.getValue()
      return h('span', {
        class: `inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold capitalize ${statusClass(s)}`
      }, [
        h('span', { class: `w-1.5 h-1.5 ${statusDot(s)}` }),
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
        to: `/erp/billing/debit-notes/${info.row.original.id}`,
        class: 'p-1.5 text-[#9BA7B0] hover:text-primary-500 hover:bg-primary-50 transition-colors',
        title: 'View',
      }, () => h(EyeIcon, { class: 'w-4 h-4' })),
    ]),
  }),
]
</script>
