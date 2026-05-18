<template>
  <AppLayout>
    <div class="space-y-5">

      <div class="flex items-center justify-between gap-4">
        <div>
          <h1 class="text-xl font-semibold text-[#1C2434]">{{ t('erp.debitNotes.title') }}</h1>
          <p class="text-sm text-[#637381] mt-0.5">{{ total }} debit note{{ total !== 1 ? 's' : '' }}</p>
        </div>
        <RouterLink
          v-can="'erp.accounting.edit'"
          to="/erp/billing/debit-notes/create"
          class="btn-primary">
          <PlusIcon class="w-4 h-4" />
          {{ t('erp.debitNotes.new') }}
        </RouterLink>
      </div>

      <div class="bg-white rounded-2xl border border-[#E2E8F0] shadow-sm overflow-hidden">

        <!-- Toolbar -->
        <div class="px-5 py-3 border-b border-[#E2E8F0] flex items-center gap-3">
          <div class="relative flex-1 min-w-0">
            <MagnifyingGlassIcon class="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#9BA7B0] pointer-events-none" />
            <input v-model="search" @input="onSearch" type="search" :placeholder="t('erp.debitNotes.searchPh')"
              class="input pl-9 w-full" />
          </div>
          <div class="w-40">
            <SearchSelect v-model="filterStatus" :options="STATUS_FILTER_OPTIONS" :placeholder="t('erp.common.allStatuses')" @change="onFilterChange" />
          </div>
        </div>

        <DataTable :columns="columns" :data="debitNotes" :loading="loading" :total="total"
          v-model:page="page" :page-size="limit">
          <template #empty>
            <div class="flex flex-col items-center gap-3 py-4">
              <div class="w-10 h-10 bg-[#F1F5F9] rounded-xl flex items-center justify-center">
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
import { RouterLink } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { PlusIcon, MagnifyingGlassIcon, EyeIcon, ArrowTrendingUpIcon } from '@heroicons/vue/24/outline'
import { createColumnHelper } from '@tanstack/vue-table'
import AppLayout from '@/layouts/AppLayout.vue'
import DataTable from '@/components/DataTable.vue'
import SearchSelect from '@/components/SearchSelect.vue'
import api from '@/api'
import { fmtMoney } from '@/utils/fmt'

const { t } = useI18n()

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
let searchTimeout   = null

async function fetchDebitNotes() {
  loading.value = true
  try {
    const { data } = await api.get('/erp/billing/debit-notes', {
      params: { page: page.value, limit, search: search.value, status: filterStatus.value || undefined },
    })
    debitNotes.value = data.data.debitNotes
    total.value      = data.data.total
  } finally {
    loading.value = false
  }
}

function onSearch() {
  clearTimeout(searchTimeout)
  searchTimeout = setTimeout(() => { page.value = 1; fetchDebitNotes() }, 350)
}
function onFilterChange() { page.value = 1; fetchDebitNotes() }

watch(page, fetchDebitNotes)
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
    cell: info => h('span', { class: 'text-xs' }, info.getValue()),
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
        to: `/erp/billing/debit-notes/${info.row.original.id}`,
        class: 'p-1.5 text-[#9BA7B0] hover:text-primary-500 hover:bg-primary-50 rounded-md transition-colors',
        title: 'View',
      }, () => h(EyeIcon, { class: 'w-4 h-4' })),
    ]),
  }),
]
</script>
