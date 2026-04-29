<template>
  <AppLayout>
    <div class="space-y-5">

      <div class="flex items-center justify-between gap-4">
        <div>
          <h1 class="text-xl font-semibold text-[#1C2434]">{{ t('erp.stockAdjust.title') }}</h1>
          <p class="text-sm text-[#637381] mt-0.5">{{ total }} record{{ total !== 1 ? 's' : '' }}</p>
        </div>
        <RouterLink to="/erp/stock-adjust/create" class="btn-primary">
          <PlusIcon class="w-4 h-4" />
          {{ t('erp.stockAdjust.new') }}
        </RouterLink>
      </div>

      <div class="bg-white rounded-2xl border border-[#E2E8F0] shadow-sm overflow-hidden">
        <div class="px-5 py-3 border-b border-[#E2E8F0] flex items-center gap-3">
          <div class="relative flex-1 min-w-48 max-w-64">
            <MagnifyingGlassIcon class="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#9BA7B0] pointer-events-none" />
            <input v-model="search" @input="onSearch" type="search" :placeholder="t('erp.stockAdjust.searchPh')" class="input pl-9" />
          </div>
        </div>

        <DataTable :columns="columns" :data="rows" :loading="loading" :total="total" v-model:page="page" :page-size="limit">
          <template #empty>
            <div class="flex flex-col items-center gap-2">
              <div class="w-10 h-10 bg-[#F1F5F9] rounded-xl flex items-center justify-center">
                <AdjustmentsHorizontalIcon class="w-5 h-5 text-[#9BA7B0]" />
              </div>
              <p class="text-sm text-[#9BA7B0] font-medium">{{ t('erp.stockAdjust.noFound') }}</p>
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
import { createColumnHelper } from '@tanstack/vue-table'
import { PlusIcon, MagnifyingGlassIcon, EyeIcon, CheckCircleIcon, TrashIcon, AdjustmentsHorizontalIcon } from '@heroicons/vue/24/outline'
import AppLayout from '@/layouts/AppLayout.vue'
import DataTable from '@/components/DataTable.vue'
import api from '@/api'

const { t } = useI18n()

const rows        = ref([])
const total       = ref(0)
const page        = ref(1)
const limit       = 20
const search      = ref('')
const loading     = ref(false)
const approvingId = ref(null)
let searchTimeout = null

const ch = createColumnHelper()

const columns = [
  ch.accessor('refNo', {
    header: () => t('erp.stockAdjust.colRefNo'),
    cell: info => h('span', { class: 'font-mono font-medium text-[#1C2434]' }, info.getValue()),
  }),
  ch.accessor('date', {
    header: () => t('erp.stockAdjust.colDate'),
    cell: info => h('span', { class: 'text-[#637381] text-xs' }, info.getValue()),
  }),
  ch.accessor('store', {
    header: () => t('erp.stockAdjust.colStore'),
    cell: info => h('span', { class: 'font-medium text-[#374151]' }, info.getValue()?.name || '—'),
  }),
  ch.accessor('reason', {
    header: () => t('erp.stockAdjust.colReason'),
    cell: info => h('span', { class: 'text-[#637381]' }, info.getValue() || '—'),
  }),
  ch.accessor('status', {
    header: () => t('erp.stockAdjust.colStatus'),
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
          to: `/erp/stock-adjust/${r.id}`,
          class: 'p-1.5 text-[#9BA7B0] hover:text-primary-500 hover:bg-primary-50 rounded-md transition-colors',
          title: 'View',
        }, () => h(EyeIcon, { class: 'w-4 h-4' })),
        r.status === 'draft' && h('button', {
          onClick: () => approveRow(r),
          disabled: approvingId.value === r.id,
          class: 'p-1.5 text-[#9BA7B0] hover:text-green-700 hover:bg-green-50 rounded-md transition-colors disabled:opacity-40',
          title: 'Approve',
        }, h(CheckCircleIcon, { class: 'w-4 h-4' })),
        r.status === 'draft' && h('button', {
          onClick: () => confirmDelete(r),
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
    const { data } = await api.get('/erp/stock-adjust', { params: { page: page.value, limit, search: search.value } })
    rows.value = data.data.adjustments
    total.value = data.data.total
  } finally { loading.value = false }
}

function onSearch() { clearTimeout(searchTimeout); searchTimeout = setTimeout(() => { page.value = 1; load() }, 300) }
watch(page, load)
onMounted(load)

async function approveRow(row) {
  if (!confirm(`Approve ${row.refNo}? Stock will be adjusted and this cannot be undone.`)) return
  approvingId.value = row.id
  try { await api.post(`/erp/stock-adjust/${row.id}/confirm`); load() }
  catch (err) { alert(err.response?.data?.message || 'Approve failed') }
  finally { approvingId.value = null }
}

async function confirmDelete(row) {
  if (!confirm(`Delete ${row.refNo}? This cannot be undone.`)) return
  try { await api.delete(`/erp/stock-adjust/${row.id}`); load() }
  catch (err) { alert(err.response?.data?.message || 'Delete failed') }
}
</script>
