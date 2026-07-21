<template>
  <AppLayout>
    <div class="space-y-5">

      <div class="flex items-center justify-between gap-4">
        <div class="flex items-start gap-3 min-w-0">
          <button
            v-if="organizationId"
            type="button"
            class="btn-secondary px-2.5 py-2 mt-0.5"
            @click="$router.back()"
          >
            <ArrowLeftIcon class="w-4 h-4" />
          </button>
          <div class="min-w-0">
            <h1 class="text-xl font-semibold text-[#1C2434]">
              {{ organizationId ? t('erp.employees.titleOrg') : t('erp.employees.title') }}
            </h1>
            <p class="text-sm text-[#637381] mt-0.5">
              {{ organizationId ? t('erp.employees.descOrg') : `${total} employee${total !== 1 ? 's' : ''}` }}
            </p>
          </div>
        </div>
        <RouterLink :to="withOrgQuery('/hrms/employees/create')"
          class="btn-primary">
          <PlusIcon class="w-4 h-4" />
          {{ t('erp.employees.new') }}
        </RouterLink>
      </div>

      <div class="bg-white border border-[#E2E8F0] shadow-sm overflow-hidden">
        <DataTable :columns="columns" :data="employees" :loading="loading" :total="total"
          v-model:page="page" v-model:global-filter="search" :page-size="limit"
          row-clickable @row-click="e => $router.push(withOrgQuery(`/hrms/employees/${e.id}/edit`))"
          searchable :search-placeholder="t('erp.employees.searchPh')">

          <template #toolbar>
            <button @click="showFilters = !showFilters"
              :class="['flex items-center gap-1.5 px-3 py-2 text-sm font-medium border transition-colors whitespace-nowrap',
                (activeFilterCount > 0 || showFilters)
                  ? 'bg-primary-50 border-primary-200 text-primary-600'
                  : 'bg-white border-[#E2E8F0] text-[#637381] hover:bg-slate-50']">
              <AdjustmentsHorizontalIcon class="w-4 h-4" />
              {{ t('common.filters') }}
              <span v-if="activeFilterCount" class="min-w-[18px] h-[18px] bg-primary-500 text-white text-[10px] flex items-center justify-center font-bold leading-none">
                {{ activeFilterCount }}
              </span>
            </button>
          </template>

          <template #filters>
            <Transition
              enter-active-class="transition-all duration-150 ease-out"
              enter-from-class="opacity-0 -translate-y-1"
              enter-to-class="opacity-100 translate-y-0"
              leave-active-class="transition-all duration-100 ease-in"
              leave-from-class="opacity-100 translate-y-0"
              leave-to-class="opacity-0 -translate-y-1">
              <div v-if="showFilters" class="border-b border-[#E2E8F0] bg-slate-50">
                <div class="px-5 py-4">
                  <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                    <div>
                      <label class="block text-xs font-medium text-[#637381] mb-1.5">{{ t('erp.common.status') }}</label>
                      <SearchSelect v-model="filterStatus" :options="statusOptions" :placeholder="t('common.all')" @change="onFilterChange" />
                    </div>
                    <div>
                      <label class="block text-xs font-medium text-[#637381] mb-1.5">{{ t('erp.employees.colDepartment') }}</label>
                      <SearchSelect v-model="filterDeptId" :options="departments" :placeholder="t('common.all')" @change="onFilterChange" />
                    </div>
                    <div>
                      <label class="block text-xs font-medium text-[#637381] mb-1.5">{{ t('erp.common.activeFrom') }}</label>
                      <DateInput v-model="filterActiveFrom" @change="onFilterChange" class="input text-sm" />
                    </div>
                    <div>
                      <label class="block text-xs font-medium text-[#637381] mb-1.5">{{ t('erp.common.activeTo') }}</label>
                      <DateInput v-model="filterActiveTo" @change="onFilterChange" class="input text-sm" />
                    </div>
                  </div>
                  <div class="mt-3 flex justify-end">
                    <button @click="clearFilters" class="text-xs text-[#9BA7B0] hover:text-red-500 transition-colors font-medium">
                      {{ t('common.resetFilters') }}
                    </button>
                  </div>
                </div>
              </div>
            </Transition>
          </template>

          <template #active-filters>
            <div v-if="activeFilterCount > 0" class="px-5 py-2.5 border-b border-[#E2E8F0] flex items-center gap-2 flex-wrap bg-primary-50/40">
              <span class="text-xs font-medium text-[#637381]">{{ t('common.activeFilters') }}:</span>
              <span v-if="filterStatus" class="inline-flex items-center gap-1 pl-2.5 pr-1 py-1 bg-white border border-[#E2E8F0] text-xs font-medium text-[#374151]">
                {{ t('erp.common.status') }}: <span class="capitalize font-semibold ml-0.5">{{ filterStatus }}</span>
                <button @click="filterStatus = ''; onFilterChange()" class="ml-1 p-0.5 text-[#9BA7B0] hover:text-red-500 transition-colors">
                  <XMarkIcon class="w-3 h-3" />
                </button>
              </span>
              <span v-if="filterDeptId" class="inline-flex items-center gap-1 pl-2.5 pr-1 py-1 bg-white border border-[#E2E8F0] text-xs font-medium text-[#374151]">
                {{ t('erp.employees.colDepartment') }}: <span class="font-semibold ml-0.5">{{ deptLabel }}</span>
                <button @click="filterDeptId = ''; onFilterChange()" class="ml-1 p-0.5 text-[#9BA7B0] hover:text-red-500 transition-colors">
                  <XMarkIcon class="w-3 h-3" />
                </button>
              </span>
              <span v-if="filterActiveFrom" class="inline-flex items-center gap-1 pl-2.5 pr-1 py-1 bg-white border border-[#E2E8F0] text-xs font-medium text-[#374151]">
                {{ t('erp.common.activeFrom') }}: <span class="font-semibold ml-0.5">{{ filterActiveFrom }}</span>
                <button @click="filterActiveFrom = ''; onFilterChange()" class="ml-1 p-0.5 text-[#9BA7B0] hover:text-red-500 transition-colors">
                  <XMarkIcon class="w-3 h-3" />
                </button>
              </span>
              <span v-if="filterActiveTo" class="inline-flex items-center gap-1 pl-2.5 pr-1 py-1 bg-white border border-[#E2E8F0] text-xs font-medium text-[#374151]">
                {{ t('erp.common.activeTo') }}: <span class="font-semibold ml-0.5">{{ filterActiveTo }}</span>
                <button @click="filterActiveTo = ''; onFilterChange()" class="ml-1 p-0.5 text-[#9BA7B0] hover:text-red-500 transition-colors">
                  <XMarkIcon class="w-3 h-3" />
                </button>
              </span>
              <button @click="clearFilters" class="ml-auto text-xs text-red-500 hover:text-red-700 font-medium transition-colors">
                {{ t('common.clearAll') }}
              </button>
            </div>
          </template>

          <template #empty>
            <div class="flex flex-col items-center gap-3 py-4">
              <div class="w-10 h-10 bg-[#F1F5F9] flex items-center justify-center">
                <IdentificationIcon class="w-5 h-5 text-[#9BA7B0]" />
              </div>
              <div class="text-center">
                <p class="text-sm font-medium text-[#637381]">{{ t('erp.employees.noFound') }}</p>
                <p v-if="activeFilterCount > 0" class="text-xs text-[#9BA7B0] mt-1">Try adjusting your filters</p>
              </div>
              <button v-if="activeFilterCount > 0" @click="clearFilters"
                class="text-xs text-primary-500 hover:text-primary-700 font-medium underline">
                Clear all filters
              </button>
            </div>
          </template>
        </DataTable>

      </div>
    </div>

    <!-- Delete confirm modal -->
    <Teleport to="body">
      <div v-if="deleteModal.open" class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
        <div class="bg-white shadow-xl w-full max-w-sm p-6 space-y-4">
          <h2 class="text-base font-semibold text-[#1C2434]">{{ t('erp.employees.deleteEmployee') }}</h2>
          <p class="text-sm text-[#637381]">
            Delete <span class="font-semibold">{{ deleteModal.emp?.firstName }} {{ deleteModal.emp?.lastName }}</span>?
            <span v-if="deleteModal.emp?.userId" class="block mt-1">Note: Their linked login account will also be disconnected from this record.</span>
            This action cannot be undone.
          </p>
          <div v-if="deleteModal.error" class="bg-red-50 border border-red-200 text-red-700 text-sm px-3 py-2">{{ deleteModal.error }}</div>
          <div class="flex justify-end gap-3">
            <button @click="deleteModal.open = false" class="px-4 py-2 text-sm border border-[#E2E8F0] hover:bg-[#F7F9FC] transition-colors">{{ t('common.cancel') }}</button>
            <button @click="doDelete" :disabled="deleteModal.saving"
              class="px-5 py-2 text-sm bg-red-600 text-white hover:bg-red-700 disabled:opacity-50 transition-colors">
              {{ deleteModal.saving ? 'Deleting…' : 'Delete' }}
            </button>
          </div>
        </div>
      </div>
    </Teleport>
  </AppLayout>
</template>

<script setup>
import { h, ref, computed, reactive, watch, onMounted } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import {
  PlusIcon, PencilIcon, TrashIcon, IdentificationIcon, ArrowLeftIcon,
  AdjustmentsHorizontalIcon, XMarkIcon,
} from '@heroicons/vue/24/outline'
import { createColumnHelper } from '@tanstack/vue-table'
import AppLayout from '@/layouts/AppLayout.vue'
import DataTable from '@/components/DataTable.vue'
import SearchSelect from '@/components/SearchSelect.vue'
import api from '@/api'
import { fmtDate } from '@/utils/fmt'

const { t } = useI18n()
const route = useRoute()
const organizationId = computed(() => route.query.organizationId || '')

function withOrgQuery(path) {
  if (!organizationId.value) return path
  const sep = path.includes('?') ? '&' : '?'
  return `${path}${sep}organizationId=${encodeURIComponent(organizationId.value)}`
}

function orgParams(extra = {}) {
  return {
    ...extra,
    ...(organizationId.value ? { organizationId: organizationId.value } : {}),
  }
}

const statusOptions = computed(() => [
  { id: 'active',     name: t('erp.employees.active')     },
  { id: 'inactive',   name: t('erp.employees.inactive')   },
  { id: 'terminated', name: t('erp.employees.terminated') },
])

const employees    = ref([])
const departments  = ref([])
const total        = ref(0)
const page         = ref(1)
const limit        = 20
const search       = ref('')
const filterStatus     = ref('')
const filterDeptId     = ref('')
const filterActiveFrom = ref('')
const filterActiveTo   = ref('')
const showFilters      = ref(false)
const loading          = ref(false)

const deleteModal = reactive({ open: false, emp: null, saving: false, error: '' })

const activeFilterCount = computed(() => [filterStatus.value, filterDeptId.value, filterActiveFrom.value, filterActiveTo.value].filter(Boolean).length)
const deptLabel = computed(() => departments.value.find(d => d.id === filterDeptId.value)?.name || '')

async function fetchDepartments() {
  try {
    const { data } = await api.get('/hrms/departments', { params: orgParams({ limit: 100 }) })
    departments.value = data.data.departments
  } catch (err) { console.error(err.message) }
}

async function load() {
  loading.value = true
  try {
    const { data } = await api.get('/hrms/employees', {
      params: orgParams({
        page: page.value, limit, search: search.value,
        status: filterStatus.value || undefined,
        departmentId: filterDeptId.value || undefined,
        activeFrom: filterActiveFrom.value || undefined,
        activeTo: filterActiveTo.value || undefined,
      }),
    })
    employees.value = data.data.employees
    total.value     = data.data.total
  } finally { loading.value = false }
}

function onFilterChange() { page.value = 1; load() }
function clearFilters() { filterStatus.value = ''; filterDeptId.value = ''; filterActiveFrom.value = ''; filterActiveTo.value = ''; page.value = 1; load() }

watch([page, search], load)
watch(organizationId, () => {
  page.value = 1
  filterDeptId.value = ''
  fetchDepartments()
  load()
})
onMounted(() => { fetchDepartments(); load() })

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
    await api.delete(`/hrms/employees/${deleteModal.emp.id}`, {
      params: orgParams(),
    })
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
        h('div', { class: 'w-8 h-8 bg-primary-100 text-primary-500 flex items-center justify-center font-bold text-sm flex-shrink-0' },
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
          h('span', { key: d.id, class: 'inline-block px-1.5 py-0.5 bg-[#F1F5F9] text-[10px] font-medium text-[#637381]' }, d.name)
        ))
      }
      return h('span', { class: 'text-[#9BA7B0]' }, '—')
    },
  }),
  columnHelper.accessor('startDate', {
    header: () => t('erp.employees.colStartDate'),
    cell: info => h('span', { class: 'text-xs' }, fmtDate(info.getValue()) || '—'),
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
        class: `inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold capitalize ${statusClass(s)}`
      }, [
        h('span', { class: `w-1.5 h-1.5 ${statusDot(s)}` }),
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
        to: withOrgQuery(`/hrms/employees/${info.row.original.id}/edit`),
        class: 'p-1.5 text-[#9BA7B0] hover:text-primary-500 hover:bg-primary-50 transition-colors',
        title: 'Edit',
      }, () => h(PencilIcon, { class: 'w-4 h-4' })),
      h('button', {
        onClick: () => confirmDelete(info.row.original),
        class: 'p-1.5 text-[#9BA7B0] hover:text-red-600 hover:bg-red-50 transition-colors',
        title: 'Delete',
      }, h(TrashIcon, { class: 'w-4 h-4' })),
    ]),
  }),
]
</script>
