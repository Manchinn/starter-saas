<template>
  <AppLayout>
    <div class="space-y-5">
      <div class="flex items-center justify-between gap-4">
        <div>
          <h1 class="text-xl font-semibold text-[#1C2434]">{{ t('erp.bills.title') }}</h1>
          <p class="text-sm text-[#637381] mt-0.5">{{ total }} record{{ total !== 1 ? 's' : '' }}</p>
        </div>
      </div>

      <div class="bg-white rounded-2xl border border-[#E2E8F0] shadow-sm overflow-hidden">
        <div class="px-5 py-3 border-b border-[#E2E8F0] flex items-center gap-3">
          <div class="relative flex-1 min-w-0">
            <MagnifyingGlassIcon class="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#9BA7B0] pointer-events-none" />
            <input v-model="search" @input="onSearch" type="search" :placeholder="t('erp.bills.searchPh')"
              class="input pl-9 w-full" />
          </div>
          <select v-model="filterStatus" @change="onFilterChange" class="input text-sm w-40">
            <option value="">{{ t('common.all') }}</option>
            <option value="draft">{{ t('erp.common.draft') }}</option>
            <option value="approved">{{ t('erp.bills.statusApproved') }}</option>
            <option value="paid">{{ t('erp.bills.statusPaid') }}</option>
            <option value="cancelled">{{ t('erp.common.cancelled') }}</option>
          </select>
        </div>

        <DataTable :columns="columns" :data="items" :loading="loading" :total="total"
          v-model:page="page" :page-size="limit">
          <template #empty>
            <div class="flex flex-col items-center gap-3 py-4">
              <DocumentTextIcon class="w-8 h-8 text-[#CBD5E1]" />
              <p class="text-sm text-[#637381]">{{ t('erp.bills.noFound') }}</p>
            </div>
          </template>
        </DataTable>
      </div>
    </div>
  </AppLayout>
</template>

<script setup>
import { h, ref, watch, onMounted } from 'vue'
import { RouterLink } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { MagnifyingGlassIcon, DocumentTextIcon, EyeIcon } from '@heroicons/vue/24/outline'
import { createColumnHelper } from '@tanstack/vue-table'
import AppLayout from '@/layouts/AppLayout.vue'
import DataTable from '@/components/DataTable.vue'
import api from '@/api'

const { t } = useI18n()
const items        = ref([])
const total        = ref(0)
const page         = ref(1)
const limit        = 20
const search       = ref('')
const filterStatus = ref('')
const loading      = ref(false)
let searchTimeout  = null

async function loadItems() {
  loading.value = true
  try {
    const { data } = await api.get('/erp/purchasing/bills', {
      params: { page: page.value, limit, search: search.value, status: filterStatus.value || undefined },
    })
    items.value = data.data.bills
    total.value = data.data.total
  } finally { loading.value = false }
}

function onSearch() { clearTimeout(searchTimeout); searchTimeout = setTimeout(() => { page.value = 1; loadItems() }, 300) }
function onFilterChange() { page.value = 1; loadItems() }

watch(page, loadItems)
onMounted(loadItems)

const fmtMoney = (n) => Number(n || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })

const STATUS_CLASS = {
  draft:     'bg-slate-100 text-slate-600',
  approved:  'bg-blue-50 text-blue-700',
  paid:      'bg-green-50 text-green-700',
  cancelled: 'bg-red-50 text-red-600',
}

const columnHelper = createColumnHelper()
const columns = [
  columnHelper.accessor('billNumber', {
    header: () => t('erp.bills.colBillNumber'),
    cell: info => h(RouterLink, { to: `/erp/purchasing/bills/${info.row.original.id}`, class: 'font-mono text-xs text-primary-600 hover:underline' }, () => info.getValue()),
  }),
  columnHelper.accessor('billDate', { header: () => t('erp.bills.colDate'), cell: info => info.getValue() || '—' }),
  columnHelper.accessor('vendor.name', { header: () => t('erp.bills.colVendor'), cell: info => info.getValue() || '—' }),
  columnHelper.accessor('vendorInvoiceNo', { header: () => t('erp.bills.colVendorInvoice'), cell: info => info.getValue() || '—' }),
  columnHelper.accessor('total', {
    header: () => t('erp.bills.colTotal'),
    cell: info => h('span', { class: 'tabular-nums font-semibold' }, fmtMoney(info.getValue())),
  }),
  columnHelper.accessor('status', {
    header: () => t('erp.bills.colStatus'),
    cell: info => {
      const s = info.getValue()
      return h('span', { class: `inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold capitalize ${STATUS_CLASS[s] || ''}` }, s)
    },
  }),
  columnHelper.display({
    id: 'actions',
    header: () => '',
    cell: info => h(RouterLink, {
      to: `/erp/purchasing/bills/${info.row.original.id}`,
      class: 'p-1.5 text-[#9BA7B0] hover:text-primary-500 hover:bg-primary-50 rounded-md transition-colors',
    }, () => h(EyeIcon, { class: 'w-4 h-4' })),
  }),
]
</script>
