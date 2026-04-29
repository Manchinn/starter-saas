<template>
  <AppLayout>
    <div class="space-y-5">

      <div class="flex items-center justify-between gap-4">
        <div>
          <h1 class="text-xl font-semibold text-[#1C2434]">{{ t('erp.employees.title') }}</h1>
          <p class="text-sm text-[#637381] mt-0.5">{{ total }} employee{{ total !== 1 ? 's' : '' }}</p>
        </div>
        <RouterLink to="/erp/hrms/employees/create"
          class="btn-primary">
          <PlusIcon class="w-4 h-4" />
          {{ t('erp.employees.new') }}
        </RouterLink>
      </div>

      <div class="bg-white rounded-2xl border border-[#E2E8F0] shadow-sm overflow-hidden">

        <div class="px-5 py-3 border-b border-[#E2E8F0] flex items-center gap-3 flex-wrap">
          <div class="relative flex-1 min-w-48 max-w-72">
            <MagnifyingGlassIcon class="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#9BA7B0] pointer-events-none" />
            <input v-model="search" @input="onSearch" type="search" :placeholder="t('erp.employees.searchPh')"
              class="input pl-9" />
          </div>
          <select v-model="filterStatus" @change="() => { page = 1; load() }"
            class="px-3 py-2 border border-[#E2E8F0] rounded-lg text-sm bg-[#F7F9FC] focus:bg-white
                   focus:outline-none focus:ring-2 focus:ring-primary-500 text-[#374151] transition-colors">
            <option value="">{{ t('erp.common.allStatuses') }}</option>
            <option value="active">{{ t('erp.employees.active') }}</option>
            <option value="inactive">{{ t('erp.employees.inactive') }}</option>
            <option value="terminated">{{ t('erp.employees.terminated') }}</option>
          </select>
        </div>

        <DataTable :columns="columns" :data="employees" :loading="loading" :total="total"
          v-model:page="page" :page-size="limit">
          <template #empty>
            <div class="flex flex-col items-center gap-2">
              <div class="w-10 h-10 bg-[#F1F5F9] rounded-xl flex items-center justify-center">
                <IdentificationIcon class="w-5 h-5 text-[#9BA7B0]" />
              </div>
              <p class="text-sm text-[#9BA7B0] font-medium">{{ t('erp.employees.noFound') }}</p>
            </div>
          </template>
        </DataTable>

      </div>
    </div>

    <!-- Delete confirm modal -->
    <Teleport to="body">
      <div v-if="deleteModal.open" class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
        <div class="bg-white rounded-xl shadow-xl w-full max-w-sm p-6 space-y-4">
          <h2 class="text-base font-semibold text-[#1C2434]">{{ t('erp.employees.deleteEmployee') }}</h2>
          <p class="text-sm text-[#637381]">
            Delete <span class="font-semibold">{{ deleteModal.emp?.firstName }} {{ deleteModal.emp?.lastName }}</span>?
            <span v-if="deleteModal.emp?.userId" class="block mt-1">Note: Their linked login account will also be disconnected from this record.</span>
            This action cannot be undone.
          </p>
          <div v-if="deleteModal.error" class="bg-red-50 border border-red-200 text-red-700 text-sm px-3 py-2 rounded-lg">{{ deleteModal.error }}</div>
          <div class="flex justify-end gap-3">
            <button @click="deleteModal.open = false" class="px-4 py-2 text-sm border border-[#E2E8F0] rounded-lg hover:bg-[#F7F9FC] transition-colors">{{ t('common.cancel') }}</button>
            <button @click="doDelete" :disabled="deleteModal.saving"
              class="px-5 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors">
              {{ deleteModal.saving ? 'Deleting…' : 'Delete' }}
            </button>
          </div>
        </div>
      </div>
    </Teleport>
  </AppLayout>
</template>

<script setup>
import { h, ref, reactive, watch, onMounted } from 'vue'
import { RouterLink } from 'vue-router'
import { useI18n } from 'vue-i18n'
import {
  PlusIcon, MagnifyingGlassIcon, PencilIcon, TrashIcon, IdentificationIcon,
} from '@heroicons/vue/24/outline'
import { createColumnHelper } from '@tanstack/vue-table'
import AppLayout from '@/layouts/AppLayout.vue'
import DataTable from '@/components/DataTable.vue'
import api from '@/api'

const { t } = useI18n()

const employees    = ref([])
const total        = ref(0)
const page         = ref(1)
const limit        = 20
const search       = ref('')
const filterStatus = ref('')
const loading      = ref(false)
let   searchTimeout = null

const deleteModal = reactive({ open: false, emp: null, saving: false, error: '' })

async function load() {
  loading.value = true
  try {
    const { data } = await api.get('/erp/hrms/employees', {
      params: { page: page.value, limit, search: search.value, status: filterStatus.value },
    })
    employees.value = data.data.employees
    total.value     = data.data.total
  } finally { loading.value = false }
}

function onSearch() {
  clearTimeout(searchTimeout)
  searchTimeout = setTimeout(() => { page.value = 1; load() }, 300)
}

watch(page, load)
onMounted(load)

function statusClass(s) {
  return s === 'active' ? 'bg-green-50 text-green-700' : s === 'terminated' ? 'bg-red-50 text-red-700' : 'bg-[#F1F5F9] text-[#637381]'
}
function statusDot(s) {
  return s === 'active' ? 'bg-green-500' : s === 'terminated' ? 'bg-red-500' : 'bg-slate-400'
}

function confirmDelete(emp) { deleteModal.emp = emp; deleteModal.error = ''; deleteModal.open = true }

async function doDelete() {
  deleteModal.saving = true; deleteModal.error = ''
  try {
    await api.delete(`/erp/hrms/employees/${deleteModal.emp.id}`)
    deleteModal.open = false
    load()
  } catch (err) {
    deleteModal.error = err.response?.data?.message || 'Delete failed'
  } finally { deleteModal.saving = false }
}

const columnHelper = createColumnHelper()

const columns = [
  columnHelper.accessor('employeeCode', {
    header: () => t('erp.employees.colCode'),
    cell: info => h('span', { class: 'font-mono text-xs text-[#637381]' }, info.getValue() || '—'),
  }),
  columnHelper.display({
    id: 'employee',
    header: () => t('erp.employees.colEmployee'),
    cell: info => {
      const emp = info.row.original
      return h('div', { class: 'flex items-center gap-2.5' }, [
        h('div', { class: 'w-8 h-8 rounded-full bg-primary-100 text-primary-500 flex items-center justify-center font-bold text-sm flex-shrink-0' },
          emp.firstName.charAt(0).toUpperCase()
        ),
        h('div', {}, [
          h('p', { class: 'font-medium text-[#1C2434] leading-tight' }, `${emp.firstName} ${emp.lastName}`),
          h('p', { class: 'text-xs text-[#9BA7B0]' }, emp.phone || '—'),
        ]),
      ])
    },
  }),
  columnHelper.accessor('position', {
    header: () => t('erp.employees.colPosition'),
    cell: info => info.getValue() || '—',
  }),
  columnHelper.display({
    id: 'departments',
    header: () => t('erp.employees.colDepartment'),
    cell: info => {
      const emp = info.row.original
      if (emp.departments && emp.departments.length) {
        return h('div', { class: 'flex flex-wrap gap-1' }, emp.departments.map(d =>
          h('span', { key: d.id, class: 'inline-block px-1.5 py-0.5 bg-[#F1F5F9] text-[10px] font-medium text-[#637381] rounded' }, d.name)
        ))
      }
      return h('span', { class: 'text-[#9BA7B0]' }, '—')
    },
  }),
  columnHelper.accessor('startDate', {
    header: () => t('erp.employees.colStartDate'),
    cell: info => h('span', { class: 'text-xs' }, info.getValue() || '—'),
  }),
  columnHelper.display({
    id: 'login',
    header: () => t('erp.employees.colLogin'),
    cell: info => {
      const emp = info.row.original
      if (emp.user) {
        return h('div', { class: 'space-y-0.5' }, [
          h('p', { class: 'text-xs text-[#637381]' }, emp.user.email),
          h('span', { class: `text-xs font-medium ${emp.user.isActive ? 'text-green-600' : 'text-red-500'}` },
            emp.user.isActive ? t('erp.employees.active') : t('common.inactive')
          ),
        ])
      }
      return h('span', { class: 'text-[#9BA7B0] text-xs' }, '—')
    },
  }),
  columnHelper.accessor('status', {
    header: () => t('erp.employees.colStatus'),
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
    meta: { thClass: 'w-20', tdClass: '' },
    cell: info => h('div', { class: 'flex items-center justify-end gap-1' }, [
      h(RouterLink, {
        to: `/erp/hrms/employees/${info.row.original.id}/edit`,
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
