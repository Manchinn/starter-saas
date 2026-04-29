<template>
  <AppLayout>
    <div class="space-y-5">

      <!-- Header -->
      <div class="flex items-center justify-between gap-4">
        <div>
          <h1 class="text-xl font-semibold text-[#1C2434]">{{ t('erp.vendors.title') }}</h1>
          <p class="text-sm text-[#637381] mt-0.5">{{ total }} vendor{{ total !== 1 ? 's' : '' }}</p>
        </div>
        <RouterLink to="/erp/vendors/create"
          class="btn-primary">
          <PlusIcon class="w-4 h-4" />
          {{ t('erp.vendors.new') }}
        </RouterLink>
      </div>

      <!-- Table card -->
      <div class="bg-white rounded-2xl border border-[#E2E8F0] shadow-sm overflow-hidden">

        <!-- Filter bar -->
        <div class="px-5 py-3 border-b border-[#E2E8F0] flex items-center gap-3 flex-wrap">
          <div class="relative flex-1 min-w-48 max-w-64">
            <MagnifyingGlassIcon class="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#9BA7B0] pointer-events-none" />
            <input v-model="search" @input="onSearch" type="search" :placeholder="t('erp.vendors.searchPh')"
              class="input pl-9" />
          </div>
          <select v-model="statusFilter" @change="page = 1; load()"
            class="input">
            <option value="">{{ t('erp.common.allStatuses') }}</option>
            <option value="active">{{ t('common.active') }}</option>
            <option value="inactive">{{ t('common.inactive') }}</option>
          </select>
          <select v-model="typeFilter" @change="page = 1; load()"
            class="input">
            <option value="">{{ t('erp.vendors.allTypes') }}</option>
            <option value="supplier">{{ t('erp.vendors.supplier') }}</option>
            <option value="service_provider">{{ t('erp.vendors.serviceProvider') }}</option>
          </select>
        </div>

        <DataTable :columns="columns" :data="vendors" :loading="loading" :total="total"
          v-model:page="page" :page-size="limit">
          <template #empty>
            <div class="flex flex-col items-center gap-2">
              <div class="w-10 h-10 bg-[#F1F5F9] rounded-xl flex items-center justify-center">
                <BuildingOfficeIcon class="w-5 h-5 text-[#9BA7B0]" />
              </div>
              <p class="text-sm text-[#9BA7B0] font-medium">{{ t('erp.vendors.noFound') }}</p>
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
import {
  PlusIcon, MagnifyingGlassIcon, PencilIcon, TrashIcon, BuildingOfficeIcon,
} from '@heroicons/vue/24/outline'
import { createColumnHelper } from '@tanstack/vue-table'
import AppLayout from '@/layouts/AppLayout.vue'
import DataTable from '@/components/DataTable.vue'
import api from '@/api'

const { t } = useI18n()
const vendors      = ref([])
const total        = ref(0)
const page         = ref(1)
const limit        = 20
const search       = ref('')
const statusFilter = ref('')
const typeFilter   = ref('')
const loading      = ref(false)
let searchTimeout  = null

async function load() {
  loading.value = true
  try {
    const { data } = await api.get('/erp/vendors', {
      params: { page: page.value, limit, search: search.value, status: statusFilter.value, typeFilter: typeFilter.value },
    })
    vendors.value = data.data.vendors
    total.value   = data.data.total
  } finally {
    loading.value = false
  }
}

function onSearch() {
  clearTimeout(searchTimeout)
  searchTimeout = setTimeout(() => { page.value = 1; load() }, 300)
}

watch(page, load)
onMounted(load)

async function confirmDelete(v) {
  if (!confirm(`Delete vendor "${v.name}"? This cannot be undone.`)) return
  try {
    await api.delete(`/erp/vendors/${v.id}`)
    load()
  } catch (err) {
    alert(err.response?.data?.message || 'Delete failed')
  }
}

const columnHelper = createColumnHelper()

const columns = [
  columnHelper.accessor('code', {
    header: () => t('erp.vendors.colCode'),
    cell: info => h('span', { class: 'font-mono text-xs text-[#637381]' }, info.getValue() || '—'),
  }),
  columnHelper.accessor('name', {
    header: () => t('erp.vendors.colName'),
    cell: info => info.getValue() || '—',
  }),
  columnHelper.accessor('contactPerson', {
    header: () => t('erp.vendors.colContact'),
    cell: info => info.getValue() || '—',
  }),
  columnHelper.accessor('email', {
    header: () => t('erp.vendors.colEmail'),
    cell: info => h('span', { class: 'text-xs' }, info.getValue() || '—'),
  }),
  columnHelper.accessor('phone', {
    header: () => t('erp.vendors.colPhone'),
    cell: info => h('span', { class: 'text-xs' }, info.getValue() || '—'),
  }),
  columnHelper.display({
    id: 'vendorTypes',
    header: () => t('erp.vendors.colType'),
    cell: info => {
      const types = info.row.original.vendorTypes
      if (!types?.length) return h('span', { class: 'text-[#9BA7B0] text-xs' }, '—')
      return h('div', { class: 'flex flex-wrap gap-1' }, types.map(vType =>
        h('span', {
          key: vType,
          class: `inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${vType === 'service_provider' ? 'bg-purple-50 text-purple-700' : 'bg-blue-50 text-blue-700'}`
        }, vType === 'service_provider' ? t('erp.vendors.serviceProvider') : t('erp.vendors.supplier'))
      ))
    },
  }),
  columnHelper.accessor('status', {
    header: () => t('erp.vendors.colStatus'),
    cell: info => {
      const s = info.getValue()
      return h('span', {
        class: `inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold capitalize ${s === 'active' ? 'bg-green-50 text-green-700' : 'bg-[#F1F5F9] text-[#637381]'}`
      }, [
        h('span', { class: `w-1.5 h-1.5 rounded-full ${s === 'active' ? 'bg-green-500' : 'bg-slate-400'}` }),
        s,
      ])
    },
  }),
  columnHelper.display({
    id: 'actions',
    header: () => '',
    meta: { thClass: 'w-20', tdClass: '' },
    cell: info => h('div', { class: 'flex items-center justify-end gap-1' }, [
      h(RouterLink, {
        to: `/erp/vendors/${info.row.original.id}/edit`,
        class: 'p-1.5 text-[#9BA7B0] hover:text-primary-500 hover:bg-primary-50 rounded-md transition-colors',
        title: 'Edit',
      }, () => h(PencilIcon, { class: 'w-4 h-4' })),
      h('button', {
        onClick: () => confirmDelete(info.row.original),
        class: 'p-1.5 text-[#9BA7B0] hover:text-red-600 hover:bg-red-50 rounded-md transition-colors',
        title: 'Delete',
      }, h(TrashIcon, { class: 'w-4 h-4' })),
    ]),
  }),
]
</script>
