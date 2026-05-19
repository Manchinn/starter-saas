<template>
  <AppLayout>
    <div class="space-y-5">

      <!-- Page header -->
      <div class="flex items-center justify-between gap-4">
        <div>
          <h1 class="text-xl font-semibold text-[#1C2434]">{{ t('erp.accounting.title') }}</h1>
          <p class="text-sm text-[#637381] mt-0.5">
            <template v-if="!loading">{{ total.toLocaleString() }} {{ total !== 1 ? t('erp.accounting.accounts') : t('erp.accounting.account') }}</template>
            <template v-else>{{ t('common.loading') }}</template>
          </p>
        </div>
        <RouterLink v-can="'erp.accounting.edit'" to="/erp/accounting/chart-of-accounts/create" class="btn-primary">
          <PlusIcon class="w-4 h-4" />
          {{ t('erp.accounting.new') }}
        </RouterLink>
      </div>

      <!-- Table card -->
      <div class="bg-white rounded-2xl border border-[#E2E8F0] shadow-sm overflow-hidden">
        <DataTable :columns="columns" :data="accounts" :loading="loading" :total="total"
          v-model:page="page" v-model:global-filter="search" :page-size="limit"
          searchable :search-placeholder="t('erp.accounting.searchPh')">

          <template #toolbar>
            <button @click="showFilters = !showFilters"
              :class="['flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-lg border transition-colors whitespace-nowrap',
                (activeFilterCount > 0 || showFilters)
                  ? 'bg-primary-50 border-primary-200 text-primary-600'
                  : 'bg-white border-[#E2E8F0] text-[#637381] hover:bg-slate-50']">
              <AdjustmentsHorizontalIcon class="w-4 h-4" />
              {{ t('common.filters') }}
              <span v-if="activeFilterCount" class="min-w-[18px] h-[18px] bg-primary-500 text-white text-[10px] rounded-full flex items-center justify-center font-bold leading-none">
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
                  <div class="grid grid-cols-2 sm:grid-cols-3 gap-4">
                    <div>
                      <label class="block text-xs font-medium text-[#637381] mb-1.5">{{ t('erp.accounting.accountType') }}</label>
                      <SearchSelect v-model="filterType" :options="accountTypeOptions" track-by="code" :placeholder="t('common.all')" @change="onFilterChange" />
                    </div>
                    <div>
                      <label class="block text-xs font-medium text-[#637381] mb-1.5">{{ t('erp.common.status') }}</label>
                      <SearchSelect v-model="filterStatus" :options="STATUS_FILTER_OPTIONS" :placeholder="t('common.all')" @change="onFilterChange" />
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
              <span v-if="filterType" class="inline-flex items-center gap-1 pl-2.5 pr-1 py-1 bg-white border border-[#E2E8F0] rounded-full text-xs font-medium text-[#374151]">
                {{ t('erp.accounting.accountType') }}: <span class="font-semibold ml-0.5">{{ typeName(filterType) }}</span>
                <button @click="filterType = ''; onFilterChange()" class="ml-1 p-0.5 text-[#9BA7B0] hover:text-red-500 rounded-full transition-colors">
                  <XMarkIcon class="w-3 h-3" />
                </button>
              </span>
              <span v-if="filterStatus" class="inline-flex items-center gap-1 pl-2.5 pr-1 py-1 bg-white border border-[#E2E8F0] rounded-full text-xs font-medium text-[#374151]">
                {{ t('erp.common.status') }}: <span class="capitalize font-semibold ml-0.5">{{ filterStatus }}</span>
                <button @click="filterStatus = ''; onFilterChange()" class="ml-1 p-0.5 text-[#9BA7B0] hover:text-red-500 rounded-full transition-colors">
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
              <div class="w-10 h-10 bg-[#F1F5F9] rounded-xl flex items-center justify-center">
                <BookOpenIcon class="w-5 h-5 text-[#9BA7B0]" />
              </div>
              <div class="text-center">
                <p class="text-sm font-medium text-[#637381]">{{ t('erp.accounting.noFound') }}</p>
                <p v-if="activeFilterCount > 0" class="text-xs text-[#9BA7B0] mt-1">Try adjusting your filters</p>
              </div>
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
import {
  PlusIcon, PencilIcon, TrashIcon,
  AdjustmentsHorizontalIcon, XMarkIcon, BookOpenIcon,
} from '@heroicons/vue/24/outline'
import { createColumnHelper } from '@tanstack/vue-table'
import AppLayout from '@/layouts/AppLayout.vue'
import DataTable from '@/components/DataTable.vue'
import SearchSelect from '@/components/SearchSelect.vue'
import { useAuthStore } from '@/stores/auth'
import api from '@/api'
const { t } = useI18n()
const auth = useAuthStore()

const STATUS_FILTER_OPTIONS = computed(() => [
  { id: 'active',   name: t('common.active') },
  { id: 'inactive', name: t('common.inactive') },
])

const accounts          = ref([])
const total             = ref(0)
const page              = ref(1)
const limit             = 20
const search            = ref('')
const filterType        = ref('')
const filterStatus      = ref('')
const showFilters       = ref(false)
const loading           = ref(false)
const accountTypeOptions = ref([])

const typeColors = {
  asset:     'bg-blue-50 text-blue-700',
  liability: 'bg-orange-50 text-orange-700',
  equity:    'bg-purple-50 text-purple-700',
  revenue:   'bg-green-50 text-green-700',
  expense:   'bg-red-50 text-red-700',
}

function typeName(code) {
  return accountTypeOptions.value.find(v => v.code === code)?.name || code
}

const activeFilterCount = computed(() => [filterType.value, filterStatus.value].filter(Boolean).length)

async function fetch() {
  loading.value = true
  try {
    const { data } = await api.get('/erp/accounting/chart-of-accounts', {
      params: {
        page: page.value, limit,
        search:      search.value       || undefined,
        accountType: filterType.value   || undefined,
        status:      filterStatus.value || undefined,
      },
    })
    accounts.value = data.data.accounts
    total.value    = data.data.total
  } finally {
    loading.value = false
  }
}

function onFilterChange() { page.value = 1; fetch() }
function clearFilters() { filterType.value = ''; filterStatus.value = ''; page.value = 1; fetch() }

watch([page, search], fetch)

onMounted(async () => {
  const { data } = await api.get('/erp/master-data/by-name/Account Types')
  accountTypeOptions.value = data.data.values || []
  fetch()
})

async function confirmDelete(account) {
  if (!confirm(`Delete "${account.code} — ${account.name}"? This cannot be undone.`)) return
  try {
    await api.delete(`/erp/accounting/chart-of-accounts/${account.id}`)
    fetch()
  } catch (err) {
    alert(err.response?.data?.message || 'Delete failed')
  }
}

const columnHelper = createColumnHelper()
const columns = [
  columnHelper.display({
    id: 'account',
    header: () => t('erp.accounting.colAccount'),
    cell: info => {
      const a = info.row.original
      const indent = (a.level - 1) * 16
      return h('div', { style: `padding-left: ${indent}px` }, [
        h('p', { class: 'font-mono text-xs text-[#9BA7B0]' }, a.code),
        h('p', { class: 'font-medium text-[#1C2434]' }, a.name),
      ])
    },
  }),
  columnHelper.accessor('accountType', {
    header: () => t('erp.accounting.colType'),
    cell: info => {
      const code  = info.getValue()
      const color = typeColors[code] || 'bg-slate-50 text-slate-600'
      const label = typeName(code)
      return h('span', { class: `inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium ${color}` }, label)
    },
  }),
  columnHelper.accessor('normalBalance', {
    header: () => t('erp.accounting.colNormalBalance'),
    cell: info => h('span', { class: 'text-sm text-[#637381] capitalize' }, info.getValue()),
  }),
  columnHelper.display({
    id: 'parent',
    header: () => t('erp.accounting.colParent'),
    cell: info => {
      const parent = info.row.original.parent
      return parent
        ? h('span', { class: 'text-sm text-[#637381]' }, `${parent.code} — ${parent.name}`)
        : h('span', { class: 'text-[#9BA7B0] text-xs' }, '—')
    },
  }),
  columnHelper.accessor('status', {
    header: () => t('erp.accounting.colStatus'),
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
      auth.hasPermission('erp.accounting.edit') ? h(RouterLink, {
        to: `/erp/accounting/chart-of-accounts/${info.row.original.id}/edit`,
        class: 'p-1.5 text-[#9BA7B0] hover:text-primary-500 hover:bg-primary-50 rounded-md transition-colors',
        title: 'Edit',
      }, () => h(PencilIcon, { class: 'w-4 h-4' })) : null,
      auth.hasPermission('erp.accounting.delete') ? h('button', {
        onClick: () => confirmDelete(info.row.original),
        class: 'p-1.5 text-[#9BA7B0] hover:text-red-600 hover:bg-red-50 rounded-md transition-colors',
        title: 'Delete',
      }, h(TrashIcon, { class: 'w-4 h-4' })) : null,
    ]),
  }),
]
</script>
