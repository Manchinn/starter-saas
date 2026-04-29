<template>
  <AppLayout>
    <div class="space-y-6">

      <div class="flex items-center justify-between gap-4">
        <div>
          <h1 class="text-xl font-semibold text-[#1C2434]">{{ t('erp.departments.title') }}</h1>
          <p class="text-sm text-[#637381] mt-0.5">{{ total }} department{{ total !== 1 ? 's' : '' }}</p>
        </div>
        <RouterLink v-can="'erp.departments.edit'" to="/erp/hrms/departments/create" class="btn-primary">
          <PlusIcon class="w-4 h-4" />
          {{ t('erp.departments.new') }}
        </RouterLink>
      </div>

      <div class="bg-white rounded-2xl border border-[#E2E8F0] shadow-sm overflow-hidden">
        <div class="px-5 py-3 border-b border-[#E2E8F0] flex items-center gap-3">
          <div class="relative flex-1 min-w-48 max-w-64">
            <MagnifyingGlassIcon class="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#9BA7B0] pointer-events-none" />
            <input v-model="search" @input="onSearch" type="search" :placeholder="t('erp.departments.searchPh')" class="input pl-9" />
          </div>
        </div>

        <DataTable :columns="columns" :data="departments" :loading="loading" :total="total" v-model:page="page" :page-size="limit">
          <template #empty>
            <div class="flex flex-col items-center gap-2">
              <div class="w-10 h-10 bg-[#F1F5F9] rounded-xl flex items-center justify-center">
                <UserGroupIcon class="w-5 h-5 text-[#9BA7B0]" />
              </div>
              <p class="text-sm text-[#9BA7B0] font-medium">{{ t('erp.departments.noFound') }}</p>
            </div>
          </template>
        </DataTable>
      </div>

    </div>
  </AppLayout>
</template>

<script setup>
import { h, ref, onMounted, watch } from 'vue'
import { RouterLink } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { createColumnHelper } from '@tanstack/vue-table'
import { PlusIcon, MagnifyingGlassIcon, PencilIcon, TrashIcon, UserGroupIcon } from '@heroicons/vue/24/outline'
import AppLayout from '@/layouts/AppLayout.vue'
import DataTable from '@/components/DataTable.vue'
import api from '@/api'

const { t } = useI18n()

const departments = ref([])
const total       = ref(0)
const page        = ref(1)
const limit       = 20
const search      = ref('')
const loading     = ref(false)

let searchTimeout = null

const ch = createColumnHelper()

const columns = [
  ch.accessor('code', {
    header: () => t('erp.departments.colCode'),
    cell: info => h('span', { class: 'font-mono text-[#637381] text-xs' }, info.getValue() || '—'),
  }),
  ch.accessor('name', {
    header: () => t('erp.departments.colName'),
    cell: info => h('span', { class: 'font-medium text-[#1C2434]' }, info.getValue()),
  }),
  ch.accessor('description', {
    header: () => t('erp.departments.colDesc'),
    cell: info => h('span', { class: 'text-[#637381] max-w-xs truncate block' }, info.getValue() || '—'),
  }),
  ch.accessor('isActive', {
    header: () => t('erp.departments.colStatus'),
    cell: info => h('span', {
      class: `inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${info.getValue() ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`,
    }, info.getValue() ? t('common.active') : t('common.inactive')),
  }),
  ch.display({
    id: 'actions',
    meta: { thClass: 'w-28', tdClass: 'text-right' },
    cell: ({ row }) => {
      const d = row.original
      return h('div', { class: 'flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity' }, [
        h(RouterLink, {
          to: `/erp/hrms/departments/${d.id}/edit`,
          class: 'p-1.5 text-[#9BA7B0] hover:text-primary-500 hover:bg-primary-50 rounded-md transition-colors',
          title: 'Edit',
        }, () => h(PencilIcon, { class: 'w-4 h-4' })),
        h('button', {
          onClick: () => confirmDelete(d),
          class: 'p-1.5 text-[#9BA7B0] hover:text-red-600 hover:bg-red-50 rounded-md transition-colors',
          title: 'Delete',
        }, h(TrashIcon, { class: 'w-4 h-4' })),
      ])
    },
  }),
]

async function fetchDepartments() {
  loading.value = true
  try {
    const { data } = await api.get('/erp/hrms/departments', {
      params: { page: page.value, limit, search: search.value }
    })
    departments.value = data.data.departments
    total.value = data.data.total
  } finally {
    loading.value = false
  }
}

function onSearch() {
  clearTimeout(searchTimeout)
  searchTimeout = setTimeout(() => { page.value = 1; fetchDepartments() }, 350)
}

async function confirmDelete(row) {
  if (!confirm(`Delete department "${row.name}"? This cannot be undone.`)) return
  try {
    await api.delete(`/erp/hrms/departments/${row.id}`)
    fetchDepartments()
  } catch (err) {
    alert(err.response?.data?.message || 'Delete failed')
  }
}

watch(page, fetchDepartments)
onMounted(fetchDepartments)
</script>
