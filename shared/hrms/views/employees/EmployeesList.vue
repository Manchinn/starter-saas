<template>
  <AppLayout>
    <div class="space-y-5">

      <div class="flex items-center justify-between gap-4">
        <div>
          <h1 class="text-xl font-semibold text-[#1C2434]">{{ t('erp.employees.title') }}</h1>
          <p class="text-sm text-[#637381] mt-0.5">{{ total }} employee{{ total !== 1 ? 's' : '' }}</p>
        </div>
        <div class="flex items-center gap-2">
          <KeyboardShortcuts :shortcuts="shortcuts" />
          <AppButton :to="createTo" variant="primary">
            <PlusIcon class="w-4 h-4" />
            {{ t('erp.employees.new') }}
          </AppButton>
        </div>
      </div>

      <!-- Admin org-scope banner: shown when viewing a specific org's staff. -->
      <div v-if="orgId" class="flex items-center justify-between gap-3 px-4 py-2.5 bg-primary-50 border border-primary-200 text-sm">
        <span class="text-primary-700">
          {{ t('erp.employees.viewingOrg', { org: orgName || t('erp.employees.thisOrg') }) }}
        </span>
        <RouterLink to="/hrms/employees" class="font-medium text-primary-600 hover:text-primary-700 whitespace-nowrap">
          {{ t('erp.employees.viewAll') }}
        </RouterLink>
      </div>

      <div class="bg-white border border-[#E2E8F0] shadow-sm overflow-hidden">
        <DataTable ref="dataTableRef" :columns="columns" :data="employees" :loading="loading" :total="total"
          v-model:page="page" v-model:global-filter="search" :page-size="limit"
          :selected-row-index="selectedRowIndex"
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
import { RouterLink, useRouter, useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import {
  PlusIcon, PencilIcon, TrashIcon, IdentificationIcon,
  AdjustmentsHorizontalIcon, XMarkIcon,
} from '@heroicons/vue/24/outline'
import { createColumnHelper } from '@tanstack/vue-table'
import AppLayout from '@/layouts/AppLayout.vue'
import DataTable from '@/components/DataTable.vue'
import AppButton from '@/components/AppButton.vue'
import KeyboardShortcuts from '@/components/KeyboardShortcuts.vue'
import SearchSelect from '@/components/SearchSelect.vue'
import { useListShortcuts } from '@/composables/useShortcuts'
import api from '@/api'
import { fmtDate } from '@/utils/fmt'

const { t } = useI18n()
const router = useRouter()
const route  = useRoute()

// Admins can drill into a specific organization's staff (e.g. from the
// Organizations list). The id is carried in the URL and threaded through every
// read/write so the actions target that org; absent for normal HRMS users.
const orgId   = computed(() => route.query.organizationId || '')
const orgName = ref('')
const orgQuery = computed(() => (orgId.value ? { organizationId: orgId.value } : {}))
const editTo = (id) => ({ path: `/hrms/employees/${id}/edit`, query: orgQuery.value })
const createTo = computed(() => ({ path: '/hrms/employees/create', query: orgQuery.value }))

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
const dataTableRef     = ref(null)

const deleteModal = reactive({ open: false, emp: null, saving: false, error: '' })

const totalPages = computed(() => Math.ceil(total.value / limit))

const { selectedIndex: selectedRowIndex, shortcuts } = useListShortcuts({
  rows: employees, page, totalPages,
  open:        e => router.push(editTo(e.id)),
  create:      () => router.push(createTo.value),
  remove:      e => confirmDelete(e),
  focusSearch: () => dataTableRef.value?.focusSearch(),
  newLabel: 'New employee',
})

const activeFilterCount = computed(() => [filterStatus.value, filterDeptId.value, filterActiveFrom.value, filterActiveTo.value].filter(Boolean).length)
const deptLabel = computed(() => departments.value.find(d => d.id === filterDeptId.value)?.name || '')

async function fetchDepartments() {
  try {
    const { data } = await api.get('/hrms/departments', { params: { limit: 100 } })
    departments.value = data.data.departments
  } catch (err) { console.error(err.message) }
}

// When scoped to a specific org (admin drill-in), resolve its name for the banner.
async function fetchOrgName() {
  if (!orgId.value) return
  try {
    const { data } = await api.get(`/organizations/${orgId.value}`)
    orgName.value = data.data.organization?.name || ''
  } catch { /* non-fatal: banner falls back to a generic label */ }
}

async function load() {
  loading.value = true
  try {
    const { data } = await api.get('/hrms/employees', {
      params: {
        page: page.value, limit, search: search.value,
        status: filterStatus.value || undefined,
        departmentId: filterDeptId.value || undefined,
        activeFrom: filterActiveFrom.value || undefined,
        activeTo: filterActiveTo.value || undefined,
        organizationId: orgId.value || undefined,
      },
    })
    employees.value = data.data.employees
    total.value     = data.data.total
    selectedRowIndex.value = -1
  } finally { loading.value = false }
}

function onFilterChange() { page.value = 1; load() }
function clearFilters() { filterStatus.value = ''; filterDeptId.value = ''; filterActiveFrom.value = ''; filterActiveTo.value = ''; page.value = 1; load() }

watch([page, search], load)
watch(orgId, () => { page.value = 1; fetchOrgName(); load() })
onMounted(() => { fetchDepartments(); fetchOrgName(); load() })

function statusClass(s) {
  return s === 'active' ? 'bg-green-50 text-green-700' : s === 'terminated' ? 'bg-red-50 text-red-700' : 'bg-[#F1F5F9] text-[#637381]'
}
function statusDot(s) {
  return s === 'active' ? 'bg-green-500' : s === 'terminated' ? 'bg-red-500' : 'bg-slate-400'
}

function confirmDelete(emp) { deleteModal.emp = emp; deleteModal.error = ''; deleteModal.open = true }

// Distinct permission display-names resolved from an employee's HRMS roles.
function rolePermNames(roles) {
  const map = new Map()
  for (const r of roles || []) for (const p of (r.permissions || [])) map.set(p.slug, p.name || p.slug)
  return [...map.values()]
}

async function doDelete() {
  deleteModal.saving = true; deleteModal.error = ''
  try {
    await api.delete(`/hrms/employees/${deleteModal.emp.id}`, { params: { organizationId: orgId.value || undefined } })
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
  columnHelper.display({
    id: 'roles',
    header: () => t('erp.employees.colRoles'),
    cell: info => {
      const roles = info.row.original.roles || []
      if (!roles.length) return h('span', { class: 'text-[#9BA7B0]' }, '—')
      const children = roles.map(r => h('span', {
        key: r.id,
        class: 'inline-block px-2 py-0.5 text-[11px] font-medium text-white whitespace-nowrap',
        style: { backgroundColor: r.color || '#6366f1' },
      }, r.name))
      const perms = rolePermNames(roles)
      if (perms.length) {
        children.push(h('span', {
          class: 'text-[11px] text-[#9BA7B0] whitespace-nowrap cursor-help',
          title: perms.join(', '),
        }, `· ${perms.length} ${t('erp.employees.permissions')}`))
      }
      return h('div', { class: 'flex flex-wrap items-center gap-1' }, children)
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
        to: editTo(info.row.original.id),
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
