<template>
  <AppLayout>
    <div class="space-y-5">

      <div class="flex items-center justify-between gap-4">
        <div>
          <h1 class="text-xl font-semibold text-[#1C2434]">Invoices</h1>
          <p class="text-sm text-[#637381] mt-0.5">{{ total }} invoice{{ total !== 1 ? 's' : '' }}</p>
        </div>
        <RouterLink
          v-can="'erp.invoices.edit'"
          to="/erp/invoices/create"
          class="btn-primary">
          <PlusIcon class="w-4 h-4" />
          New Invoice
        </RouterLink>
      </div>

      <div class="bg-white rounded-2xl border border-[#E2E8F0] shadow-sm overflow-hidden">

        <div class="px-5 py-3 border-b border-[#E2E8F0] flex items-center gap-3 flex-wrap">
          <div class="relative flex-1 min-w-48 max-w-64">
            <MagnifyingGlassIcon class="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#9BA7B0] pointer-events-none" />
            <input v-model="search" @input="onSearch" type="search" placeholder="Search invoice number…"
              class="input pl-9" />
          </div>
          <select v-model="statusFilter" @change="page = 1; fetchInvoices()"
            class="input">
            <option value="">All Statuses</option>
            <option value="draft">Draft</option>
            <option value="sent">Sent</option>
            <option value="paid">Paid</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>

        <DataTable :columns="columns" :data="invoices" :loading="loading" :total="total"
          v-model:page="page" :page-size="limit">
          <template #empty>
            <div class="flex flex-col items-center gap-2">
              <div class="w-10 h-10 bg-[#F1F5F9] rounded-xl flex items-center justify-center">
                <DocumentTextIcon class="w-5 h-5 text-[#9BA7B0]" />
              </div>
              <p class="text-sm text-[#9BA7B0] font-medium">No invoices found</p>
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
import {
  PlusIcon, MagnifyingGlassIcon, EyeIcon, DocumentTextIcon,
} from '@heroicons/vue/24/outline'
import { createColumnHelper } from '@tanstack/vue-table'
import AppLayout from '@/layouts/AppLayout.vue'
import DataTable from '@/components/DataTable.vue'
import api from '@/api'
import { fmtMoney } from '@/utils/fmt'

const invoices     = ref([])
const total        = ref(0)
const page         = ref(1)
const limit        = 20
const search       = ref('')
const statusFilter = ref('')
const loading      = ref(false)
let searchTimeout  = null

async function fetchInvoices() {
  loading.value = true
  try {
    const { data } = await api.get('/erp/invoices', {
      params: { page: page.value, limit, search: search.value, status: statusFilter.value },
    })
    invoices.value = data.data.invoices
    total.value    = data.data.total
  } finally {
    loading.value = false
  }
}

function onSearch() {
  clearTimeout(searchTimeout)
  searchTimeout = setTimeout(() => { page.value = 1; fetchInvoices() }, 350)
}

function isOverdue(inv) {
  return inv.status === 'sent' && inv.dueDate && new Date(inv.dueDate) < new Date()
}

watch(page, fetchInvoices)
onMounted(fetchInvoices)

const STATUS_STYLE = {
  draft:     { badge: 'bg-[#F1F5F9] text-[#637381]',   dot: 'bg-slate-400' },
  sent:      { badge: 'bg-blue-50 text-blue-700',    dot: 'bg-blue-500' },
  paid:      { badge: 'bg-green-50 text-green-700',  dot: 'bg-green-500' },
  cancelled: { badge: 'bg-red-50 text-red-600',      dot: 'bg-red-500' },
}
function statusClass(s) { return (STATUS_STYLE[s] || STATUS_STYLE.draft).badge }
function statusDot(s)   { return (STATUS_STYLE[s] || STATUS_STYLE.draft).dot }

const columnHelper = createColumnHelper()

const columns = [
  columnHelper.accessor('invoiceNumber', {
    header: () => 'Invoice #',
    cell: info => h('span', { class: 'font-mono text-sm font-medium text-[#1C2434]' }, info.getValue()),
  }),
  columnHelper.display({
    id: 'customer',
    header: () => 'Customer',
    cell: info => info.row.original.customer?.name || '—',
  }),
  columnHelper.accessor('invoiceDate', {
    header: () => 'Date',
    cell: info => h('span', { class: 'text-xs' }, info.getValue()),
  }),
  columnHelper.accessor('dueDate', {
    header: () => 'Due Date',
    cell: info => {
      const inv = info.row.original
      return h('span', { class: `text-xs ${isOverdue(inv) ? 'text-red-500 font-medium' : 'text-[#637381]'}` }, info.getValue() || '—')
    },
  }),
  columnHelper.accessor('total', {
    header: () => 'Total',
    cell: info => fmtMoney(info.getValue()),
    meta: { thClass: 'text-right', tdClass: 'text-right font-semibold text-[#1C2434] tabular-nums' },
  }),
  columnHelper.accessor('status', {
    header: () => 'Status',
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
        to: `/erp/invoices/${info.row.original.id}`,
        class: 'p-1.5 text-[#9BA7B0] hover:text-primary-500 hover:bg-primary-50 rounded-md transition-colors',
        title: 'View',
      }, () => h(EyeIcon, { class: 'w-4 h-4' })),
    ]),
  }),
]
</script>
