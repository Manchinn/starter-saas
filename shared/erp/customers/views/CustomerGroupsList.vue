<template>
  <AppLayout>
    <div class="space-y-5">

      <div class="flex items-center justify-between gap-4">
        <div>
          <h1 class="text-xl font-semibold text-[#1C2434]">{{ t('erp.customerGroups.title') }}</h1>
          <p class="text-sm text-[#637381] mt-0.5">{{ total }} group{{ total !== 1 ? 's' : '' }}</p>
        </div>
        <RouterLink v-can="'erp.customer-groups.edit'" to="/erp/customer-groups/create"
          class="btn-primary">
          <PlusIcon class="w-4 h-4" />
          {{ t('erp.customerGroups.new') }}
        </RouterLink>
      </div>

      <div class="bg-white rounded-2xl border border-[#E2E8F0] shadow-sm overflow-hidden">

        <div class="px-5 py-3 border-b border-[#E2E8F0] flex items-center gap-3">
          <div class="relative flex-1 min-w-48 max-w-64">
            <MagnifyingGlassIcon class="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#9BA7B0] pointer-events-none" />
            <input v-model="search" @input="onSearch" type="search" :placeholder="t('erp.customerGroups.searchPh')"
              class="input pl-9" />
          </div>
        </div>

        <DataTable :columns="columns" :data="groups" :loading="loading" :total="total"
          v-model:page="page" :page-size="limit">
          <template #empty>
            <div class="flex flex-col items-center gap-2">
              <div class="w-10 h-10 bg-[#F1F5F9] rounded-xl flex items-center justify-center">
                <UserGroupIcon class="w-5 h-5 text-[#9BA7B0]" />
              </div>
              <p class="text-sm text-[#9BA7B0] font-medium">{{ t('erp.customerGroups.noFound') }}</p>
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
import { PlusIcon, MagnifyingGlassIcon, PencilIcon, TrashIcon, UserGroupIcon } from '@heroicons/vue/24/outline'
import { createColumnHelper } from '@tanstack/vue-table'
import AppLayout from '@/layouts/AppLayout.vue'
import DataTable from '@/components/DataTable.vue'
import api from '@/api'
import { useAuthStore } from '@/stores/auth'

const { t } = useI18n()
const auth = useAuthStore()
const groups  = ref([])
const total   = ref(0)
const page    = ref(1)
const limit   = 20
const search  = ref('')
const loading = ref(false)
let searchTimeout = null

async function fetchGroups() {
  loading.value = true
  try {
    const { data } = await api.get('/erp/customer-groups', { params: { page: page.value, limit, search: search.value } })
    groups.value = data.data.groups
    total.value  = data.data.total
  } finally { loading.value = false }
}

function onSearch() { clearTimeout(searchTimeout); searchTimeout = setTimeout(() => { page.value = 1; fetchGroups() }, 350) }
watch(page, fetchGroups)
onMounted(fetchGroups)

async function confirmDelete(g) {
  if (!confirm(`Delete "${g.name}"? This cannot be undone.`)) return
  try { await api.delete(`/erp/customer-groups/${g.id}`); fetchGroups() }
  catch (err) { alert(err.response?.data?.message || 'Delete failed') }
}

const columnHelper = createColumnHelper()

const columns = [
  columnHelper.accessor('name', {
    header: () => t('erp.customerGroups.colName'),
    cell: info => info.getValue() || '—',
  }),
  columnHelper.accessor('description', {
    header: () => t('erp.customerGroups.colDesc'),
    cell: info => info.getValue() || '—',
  }),
  columnHelper.accessor('status', {
    header: () => t('erp.customerGroups.colStatus'),
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
      auth.hasPermission('erp.customer-groups.edit') ? h(RouterLink, {
        to: `/erp/customer-groups/${info.row.original.id}/edit`,
        class: 'p-1.5 text-[#9BA7B0] hover:text-primary-500 hover:bg-primary-50 rounded-md transition-colors',
        title: 'Edit',
      }, () => h(PencilIcon, { class: 'w-4 h-4' })) : null,
      auth.hasPermission('erp.customer-groups.delete') ? h('button', {
        onClick: () => confirmDelete(info.row.original),
        class: 'p-1.5 text-[#9BA7B0] hover:text-red-600 hover:bg-red-50 rounded-md transition-colors',
        title: 'Delete',
      }, h(TrashIcon, { class: 'w-4 h-4' })) : null,
    ]),
  }),
]
</script>
