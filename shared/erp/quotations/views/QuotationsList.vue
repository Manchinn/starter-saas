<template>
  <AppLayout>
    <div class="space-y-5">

      <!-- Header -->
      <div class="flex items-center justify-between gap-4">
        <div>
          <h1 class="text-xl font-semibold text-[#1C2434]">{{ t('erp.quotations.title') }}</h1>
          <p class="text-sm text-[#637381] mt-0.5">{{ total }} {{ t('erp.quotations.title').toLowerCase() }}</p>
        </div>
        <RouterLink to="/erp/quotations/create"
          class="btn-primary">
          <PlusIcon class="w-4 h-4" />
          {{ t('erp.quotations.new') }}
        </RouterLink>
      </div>

      <!-- Table card -->
      <div class="bg-white rounded-2xl border border-[#E2E8F0] shadow-sm overflow-hidden">

        <!-- Filter bar -->
        <div class="px-5 py-3 border-b border-[#E2E8F0] flex items-center gap-3 flex-wrap">
          <div class="relative flex-1 min-w-48 max-w-64">
            <MagnifyingGlassIcon class="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#9BA7B0] pointer-events-none" />
            <input v-model="search" @input="onSearch" type="search" :placeholder="t('erp.quotations.searchPh')"
              class="input pl-9" />
          </div>
          <select v-model="statusFilter" @change="page = 1; load()"
            class="input">
            <option value="">{{ t('erp.common.allStatuses') }}</option>
            <option value="draft">{{ t('erp.quotations.draft') }}</option>
            <option value="sent">{{ t('erp.quotations.sent') }}</option>
            <option value="accepted">{{ t('erp.quotations.accepted') }}</option>
            <option value="rejected">{{ t('erp.quotations.rejected') }}</option>
            <option value="converted">{{ t('erp.quotations.converted') }}</option>
          </select>
        </div>

        <DataTable :columns="columns" :data="quotations" :loading="loading" :total="total"
          v-model:page="page" :page-size="limit">
          <template #empty>
            <div class="flex flex-col items-center gap-2">
              <div class="w-10 h-10 bg-[#F1F5F9] rounded-xl flex items-center justify-center">
                <DocumentTextIcon class="w-5 h-5 text-[#9BA7B0]" />
              </div>
              <p class="text-sm text-[#9BA7B0] font-medium">{{ t('erp.quotations.noFound') }}</p>
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
  PlusIcon, MagnifyingGlassIcon, TrashIcon, DocumentTextIcon, EyeIcon,
} from '@heroicons/vue/24/outline'
import { createColumnHelper } from '@tanstack/vue-table'
import AppLayout from '@/layouts/AppLayout.vue'
import DataTable from '@/components/DataTable.vue'
import api from '@/api'

const { t } = useI18n()
const quotations   = ref([])
const total        = ref(0)
const page         = ref(1)
const limit        = 20
const search       = ref('')
const statusFilter = ref('')
const loading      = ref(false)
let searchTimeout  = null

async function load() {
  loading.value = true
  try {
    const { data } = await api.get('/erp/quotations', {
      params: { page: page.value, limit, search: search.value, status: statusFilter.value },
    })
    quotations.value = data.data.quotations
    total.value      = data.data.total
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
    cell: info => h('span', { class: 'text-xs' }, info.getValue()),
  }),
  columnHelper.accessor('validUntil', {
    header: () => t('erp.quotations.colValidUntil'),
    cell: info => h('span', { class: 'text-xs' }, info.getValue() || '—'),
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
        class: `inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold capitalize ${statusClass(s)}`
      }, [
        h('span', { class: `w-1.5 h-1.5 rounded-full ${statusDot(s)}` }),
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
          class: 'p-1.5 text-[#9BA7B0] hover:text-primary-500 hover:bg-primary-50 rounded-md transition-colors',
          title: 'View',
        }, () => h(EyeIcon, { class: 'w-4 h-4' })),
        q.status === 'draft' ? h('button', {
          onClick: () => confirmDelete(q),
          class: 'p-1.5 text-[#9BA7B0] hover:text-red-600 hover:bg-red-50 rounded-md transition-colors',
          title: 'Delete',
        }, h(TrashIcon, { class: 'w-4 h-4' })) : null,
      ])
    },
  }),
]
</script>
