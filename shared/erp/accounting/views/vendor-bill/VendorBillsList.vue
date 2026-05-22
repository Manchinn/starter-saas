<template>
  <AppLayout>
    <div class="space-y-5">
      <div class="flex items-center justify-between gap-4">
        <div>
          <h1 class="text-xl font-semibold text-[#1C2434]">{{ t('erp.bills.title') }}</h1>
          <p class="text-sm text-[#637381] mt-0.5">{{ total }} record{{ total !== 1 ? 's' : '' }}</p>
        </div>
        <RouterLink v-can="'erp.bills.edit'" to="/erp/purchasing/bills/create" class="btn-primary">
          <PlusIcon class="w-4 h-4" />
          {{ t('erp.bills.new') }}
        </RouterLink>
      </div>

      <div class="bg-white border border-[#E2E8F0] shadow-sm overflow-hidden">
        <DataTable :columns="columns" :data="items" :loading="loading" :total="total"
          v-model:page="page" v-model:global-filter="search" :page-size="limit"
          searchable :search-placeholder="t('erp.bills.searchPh')">

          <template #toolbar>
            <div class="w-40">
              <SearchSelect v-model="filterStatus" :options="statusOptions" :placeholder="t('common.all')" @change="onFilterChange" />
            </div>
          </template>

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
import { h, ref, computed, watch, onMounted } from 'vue'
import { RouterLink } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { DocumentTextIcon, EyeIcon, PlusIcon } from '@heroicons/vue/24/outline'
import { createColumnHelper } from '@tanstack/vue-table'
import AppLayout from '@/layouts/AppLayout.vue'
import DataTable from '@/components/DataTable.vue'
import SearchSelect from '@/components/SearchSelect.vue'
import api from '@/api'
import { fmtDate } from '@/utils/fmt'

const { t } = useI18n()

const statusOptions = computed(() => [
  { id: 'draft',     name: t('erp.common.draft')        },
  { id: 'approved',  name: t('erp.bills.statusApproved') },
  { id: 'paid',      name: t('erp.bills.statusPaid')     },
  { id: 'cancelled', name: t('erp.common.cancelled')     },
])
const items        = ref([])
const total        = ref(0)
const page         = ref(1)
const limit        = 20
const search       = ref('')
const filterStatus = ref('')
const loading      = ref(false)

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

function onFilterChange() { page.value = 1; loadItems() }

watch([page, search], loadItems)
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
  columnHelper.accessor('billDate', { header: () => t('erp.bills.colDate'), cell: info => fmtDate(info.getValue()) || '—' }),
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
      return h('span', { class: `inline-flex items-center px-2.5 py-1 text-xs font-semibold capitalize ${STATUS_CLASS[s] || ''}` }, s)
    },
  }),
  columnHelper.display({
    id: 'actions',
    header: () => '',
    cell: info => h(RouterLink, {
      to: `/erp/purchasing/bills/${info.row.original.id}`,
      class: 'p-1.5 text-[#9BA7B0] hover:text-primary-500 hover:bg-primary-50 transition-colors',
    }, () => h(EyeIcon, { class: 'w-4 h-4' })),
  }),
]
</script>
