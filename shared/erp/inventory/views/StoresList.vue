<template>
  <AppLayout>
    <div class="space-y-5">

      <div class="flex items-center justify-between gap-4">
        <div>
          <h1 class="text-xl font-semibold text-[#1C2434]">{{ t('erp.stores.title') }}</h1>
          <p class="text-sm text-[#637381] mt-0.5">{{ total }} store{{ total !== 1 ? 's' : '' }}</p>
        </div>
        <RouterLink to="/erp/stores/create"
          class="btn-primary">
          <PlusIcon class="w-4 h-4" />
          {{ t('erp.stores.new') }}
        </RouterLink>
      </div>

      <div class="bg-white rounded-2xl border border-[#E2E8F0] shadow-sm overflow-hidden">

        <div class="px-5 py-3 border-b border-[#E2E8F0] flex items-center gap-3">
          <div class="relative flex-1 min-w-48 max-w-64">
            <MagnifyingGlassIcon class="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#9BA7B0] pointer-events-none" />
            <input v-model="search" @input="onSearch" type="search" :placeholder="t('erp.stores.searchPh')"
              class="input pl-9" />
          </div>
        </div>

        <DataTable :columns="columns" :data="stores" :loading="loading" :total="total"
          v-model:page="page" :page-size="limit">
          <template #empty>
            <div class="flex flex-col items-center gap-2">
              <div class="w-10 h-10 bg-[#F1F5F9] rounded-xl flex items-center justify-center">
                <BuildingStorefrontIcon class="w-5 h-5 text-[#9BA7B0]" />
              </div>
              <p class="text-sm text-[#9BA7B0] font-medium">{{ t('erp.stores.noFound') }}</p>
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
import { PlusIcon, MagnifyingGlassIcon, PencilIcon, TrashIcon, BuildingStorefrontIcon } from '@heroicons/vue/24/outline'
import { createColumnHelper } from '@tanstack/vue-table'
import AppLayout from '@/layouts/AppLayout.vue'
import DataTable from '@/components/DataTable.vue'
import api from '@/api'

const { t } = useI18n()

const stores  = ref([])
const total   = ref(0)
const page    = ref(1)
const limit   = 20
const search  = ref('')
const loading = ref(false)
let searchTimeout = null

async function load() {
  loading.value = true
  try {
    const { data } = await api.get('/erp/stores', { params: { page: page.value, limit, search: search.value } })
    stores.value = data.data.stores
    total.value  = data.data.total
  } finally { loading.value = false }
}

function onSearch() { clearTimeout(searchTimeout); searchTimeout = setTimeout(() => { page.value = 1; load() }, 300) }
watch(page, load)
onMounted(load)

async function confirmDelete(s) {
  if (!confirm(`Delete "${s.name}"? This cannot be undone.`)) return
  try { await api.delete(`/erp/stores/${s.id}`); load() }
  catch (err) { alert(err.response?.data?.message || 'Delete failed') }
}

const columnHelper = createColumnHelper()

const columns = [
  columnHelper.accessor('code', {
    header: () => t('erp.stores.colCode'),
    cell: info => h('span', { class: 'font-mono text-xs text-[#637381]' }, info.getValue() || '—'),
  }),
  columnHelper.accessor('name', {
    header: () => t('erp.stores.colName'),
    cell: info => info.getValue() || '—',
  }),
  columnHelper.accessor('address', {
    header: () => t('erp.stores.colAddress'),
    cell: info => info.getValue() || '—',
  }),
  columnHelper.accessor('phone', {
    header: () => t('erp.stores.colPhone'),
    cell: info => h('span', { class: 'text-xs' }, info.getValue() || '—'),
  }),
  columnHelper.accessor('status', {
    header: () => t('erp.stores.colStatus'),
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
        to: `/erp/stores/${info.row.original.id}/edit`,
        class: 'p-1.5 text-[#9BA7B0] hover:text-primary-500 hover:bg-primary-50 rounded-md transition-colors',
        title: t('common.edit'),
      }, () => h(PencilIcon, { class: 'w-4 h-4' })),
      h('button', {
        onClick: () => confirmDelete(info.row.original),
        class: 'p-1.5 text-[#9BA7B0] hover:text-red-600 hover:bg-red-50 rounded-md transition-colors',
        title: t('common.delete'),
      }, h(TrashIcon, { class: 'w-4 h-4' })),
    ]),
  }),
]
</script>
