<template>
  <AppLayout>
    <div class="space-y-5">

      <div class="flex items-center justify-between gap-4">
        <div>
          <h1 class="text-xl font-semibold text-[#1C2434]">{{ t('erp.stockReturn.title') }}</h1>
          <p class="text-sm text-[#637381] mt-0.5">{{ total }} record{{ total !== 1 ? 's' : '' }}</p>
        </div>
        <RouterLink to="/erp/stock-return/create" class="btn-primary">
          <PlusIcon class="w-4 h-4" />
          {{ t('erp.stockReturn.new') }}
        </RouterLink>
      </div>

      <div class="bg-white rounded-2xl border border-[#E2E8F0] shadow-sm overflow-hidden">
        <div class="px-5 py-3 border-b border-[#E2E8F0] flex items-center gap-3 flex-wrap">
          <div class="flex items-center gap-1 p-1 bg-[#F1F5F9] rounded-lg">
            <button v-for="opt in typeOptions" :key="opt.value"
              @click="typeFilter = opt.value; page = 1; load()"
              :class="typeFilter === opt.value ? 'bg-white shadow text-[#1C2434]' : 'text-[#637381] hover:text-[#374151]'"
              class="px-3 py-1.5 rounded-md text-xs font-medium transition-colors whitespace-nowrap">
              {{ opt.label }}
            </button>
          </div>
          <div class="relative flex-1 min-w-48 max-w-64">
            <MagnifyingGlassIcon class="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#9BA7B0] pointer-events-none" />
            <input v-model="search" @input="onSearch" type="search" :placeholder="t('erp.stockReturn.searchPh')" class="input pl-9" />
          </div>
        </div>

        <DataTable :columns="columns" :data="rows" :loading="loading" :total="total" v-model:page="page" :page-size="limit">
          <template #empty>
            <div class="flex flex-col items-center gap-2">
              <div class="w-10 h-10 bg-[#F1F5F9] rounded-xl flex items-center justify-center">
                <ArrowUturnLeftIcon class="w-5 h-5 text-[#9BA7B0]" />
              </div>
              <p class="text-sm text-[#9BA7B0] font-medium">{{ t('erp.stockReturn.noFound') }}</p>
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
import { createColumnHelper } from '@tanstack/vue-table'
import { PlusIcon, MagnifyingGlassIcon, EyeIcon, CheckCircleIcon, TrashIcon, ArrowUturnLeftIcon } from '@heroicons/vue/24/outline'
import AppLayout from '@/layouts/AppLayout.vue'
import DataTable from '@/components/DataTable.vue'
import api from '@/api'

const { t } = useI18n()

const rows        = ref([])
const total       = ref(0)
const page        = ref(1)
const limit       = 20
const search      = ref('')
const typeFilter  = ref('')
const loading     = ref(false)
const approvingId = ref(null)
let searchTimeout = null

const typeOptions = computed(() => [
  { value: '',                label: t('erp.stockReturn.all') },
  { value: 'customer_return', label: t('erp.stockReturn.customerReturn') },
  { value: 'vendor_return',   label: t('erp.stockReturn.returnToVendor') },
])

const ch = createColumnHelper()

const columns = [
  ch.accessor('refNo', {
    header: () => t('erp.stockReturn.colRefNo'),
    cell: info => h('span', { class: 'font-mono font-medium text-[#1C2434]' }, info.getValue()),
  }),
  ch.accessor('date', {
    header: () => t('erp.stockReturn.colDate'),
    cell: info => h('span', { class: 'text-[#637381] text-xs' }, info.getValue()),
  }),
  ch.accessor('type', {
    header: () => t('erp.stockReturn.colType'),
    cell: info => {
      const v = info.getValue()
      const isCustomer = v === 'customer_return'
      return h('span', {
        class: `inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${isCustomer ? 'bg-blue-50 text-blue-700' : 'bg-orange-50 text-orange-700'}`,
      }, isCustomer ? t('erp.stockReturn.customerReturn') : t('erp.stockReturn.returnToVendor'))
    },
  }),
  ch.accessor('store', {
    header: () => t('erp.stockReturn.colStore'),
    cell: info => h('span', { class: 'font-medium text-[#374151]' }, info.getValue()?.name || '—'),
  }),
  ch.display({
    id: 'counterparty',
    header: () => t('erp.stockReturn.colCustomerVendor'),
    cell: ({ row }) => {
      const r = row.original
      const name = r.type === 'customer_return' ? (r.customer?.name || '—') : (r.vendor?.name || '—')
      return h('span', { class: 'text-[#637381] text-xs' }, name)
    },
  }),
  ch.accessor('status', {
    header: () => t('erp.stockReturn.colStatus'),
    cell: info => {
      const s = info.getValue()
      const confirmed = s === 'confirmed'
      return h('span', {
        class: `inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold capitalize ${confirmed ? 'bg-green-50 text-green-700' : 'bg-amber-50 text-amber-700'}`,
      }, [
        h('span', { class: `w-1.5 h-1.5 rounded-full ${confirmed ? 'bg-green-500' : 'bg-amber-500'}` }),
        s,
      ])
    },
  }),
  ch.display({
    id: 'actions',
    meta: { thClass: 'w-28' },
    cell: ({ row }) => {
      const r = row.original
      return h('div', { class: 'flex items-center justify-end gap-1.5' }, [
        h(RouterLink, {
          to: `/erp/stock-return/${r.id}`,
          class: 'p-1.5 text-[#9BA7B0] hover:text-primary-500 hover:bg-primary-50 rounded-md transition-colors',
          title: 'View',
        }, () => h(EyeIcon, { class: 'w-4 h-4' })),
        r.status === 'draft' && h('button', {
          onClick: () => approveRow(r),
          disabled: approvingId.value === r.id,
          class: 'p-1.5 text-[#9BA7B0] hover:text-green-700 hover:bg-green-50 rounded-md transition-colors disabled:opacity-40',
          title: 'Confirm',
        }, h(CheckCircleIcon, { class: 'w-4 h-4' })),
        r.status === 'draft' && h('button', {
          onClick: () => deleteRow(r),
          class: 'p-1.5 text-[#9BA7B0] hover:text-red-600 hover:bg-red-50 rounded-md transition-colors',
          title: 'Delete',
        }, h(TrashIcon, { class: 'w-4 h-4' })),
      ].filter(Boolean))
    },
  }),
]

async function load() {
  loading.value = true
  try {
    const { data } = await api.get('/erp/stock-return', {
      params: { page: page.value, limit, search: search.value, type: typeFilter.value },
    })
    rows.value  = data.data.returns
    total.value = data.data.total
  } finally { loading.value = false }
}

function onSearch() { clearTimeout(searchTimeout); searchTimeout = setTimeout(() => { page.value = 1; load() }, 300) }
watch(page, load)
onMounted(load)

async function approveRow(row) {
  if (!confirm(`Confirm ${row.refNo}? Stock will be updated and this cannot be undone.`)) return
  approvingId.value = row.id
  try { await api.post(`/erp/stock-return/${row.id}/confirm`); load() }
  catch (err) { alert(err.response?.data?.message || 'Confirm failed') }
  finally { approvingId.value = null }
}

async function deleteRow(row) {
  if (!confirm(`Delete ${row.refNo}? This cannot be undone.`)) return
  try { await api.delete(`/erp/stock-return/${row.id}`); load() }
  catch (err) { alert(err.response?.data?.message || 'Delete failed') }
}
</script>
