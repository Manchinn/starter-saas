<template>
  <AppLayout>
    <div class="space-y-5">

      <div class="flex items-center justify-between gap-4">
        <div>
          <h1 class="text-xl font-semibold text-[#1C2434]">{{ t('erp.customerGroups.title') }}</h1>
          <p class="text-sm text-[#637381] mt-0.5">{{ total }} group{{ total !== 1 ? 's' : '' }}</p>
        </div>
        <div class="flex items-center gap-2">
          <!-- Keyboard shortcuts popover -->
          <div class="relative" ref="shortcutsRef">
            <button @click="showShortcuts = !showShortcuts"
              class="h-8 px-2 flex items-center gap-1 border border-[#E2E8F0] text-[#9BA7B0] hover:text-[#374151] hover:bg-[#F7F9FC] transition-colors text-sm font-semibold"
              title="Keyboard shortcuts">
              <span>?</span>
              <span class="text-xs font-medium">Shortcuts</span>
            </button>
            <Transition
              enter-active-class="transition-all duration-150 ease-out"
              enter-from-class="opacity-0 translate-y-1"
              enter-to-class="opacity-100 translate-y-0"
              leave-active-class="transition-all duration-100 ease-in"
              leave-from-class="opacity-100 translate-y-0"
              leave-to-class="opacity-0 translate-y-1">
              <div v-if="showShortcuts"
                class="absolute right-0 top-10 z-50 w-64 bg-white border border-[#E2E8F0] shadow-lg p-4 space-y-2">
                <p class="text-xs font-semibold text-[#374151] uppercase tracking-wide mb-3">Keyboard Shortcuts</p>
                <div v-for="s in SHORTCUTS" :key="s.key" class="flex items-center justify-between gap-3">
                  <span class="text-xs text-[#637381]">{{ s.label }}</span>
                  <kbd class="inline-flex items-center px-1.5 py-0.5 border border-[#E2E8F0] bg-[#F7F9FC] text-[10px] font-mono text-[#374151] whitespace-nowrap">{{ s.key }}</kbd>
                </div>
              </div>
            </Transition>
          </div>

          <AppButton v-can="'erp.customer-groups.edit'" to="/erp/customer-groups/create" variant="primary">
            <PlusIcon class="w-4 h-4" />
            {{ t('erp.customerGroups.new') }}
          </AppButton>
        </div>
      </div>

      <div class="bg-white border border-[#E2E8F0] shadow-sm overflow-hidden">
        <DataTable ref="dataTableRef" :columns="columns" :data="groups" :loading="loading" :total="total"
          v-model:page="page" v-model:global-filter="search" :page-size="limit"
          :selected-row-index="selectedRowIndex"
          searchable :search-placeholder="t('erp.customerGroups.searchPh')">

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
                    <SearchSelectWithLabel v-model="filterStatus" :label="t('erp.common.status')" :label-class="FILTER_LABEL" :options="statusOptions" :placeholder="t('common.all')" @change="onFilterChange" />
                    <DateInputWithLabel v-model="filterActiveFrom" :label="t('erp.common.activeFrom')" :label-class="FILTER_LABEL" input-class="text-sm" @change="onFilterChange" />
                    <DateInputWithLabel v-model="filterActiveTo" :label="t('erp.common.activeTo')" :label-class="FILTER_LABEL" input-class="text-sm" @change="onFilterChange" />
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
                <UserGroupIcon class="w-5 h-5 text-[#9BA7B0]" />
              </div>
              <div class="text-center">
                <p class="text-sm font-medium text-[#637381]">{{ t('erp.customerGroups.noFound') }}</p>
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
  </AppLayout>
</template>

<script setup>
import { h, ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { RouterLink, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import {
  PlusIcon, PencilIcon, TrashIcon, UserGroupIcon,
  AdjustmentsHorizontalIcon, XMarkIcon,
} from '@heroicons/vue/24/outline'
import { createColumnHelper } from '@tanstack/vue-table'
import AppLayout from '@/layouts/AppLayout.vue'
import DataTable from '@/components/DataTable.vue'
import AppButton from '@/components/AppButton.vue'
import SearchSelectWithLabel from '@/components/SearchSelectWithLabel.vue'
import DateInputWithLabel from '@/components/DateInputWithLabel.vue'
import api from '@/api'
import { useAuthStore } from '@/stores/auth'

const FILTER_LABEL = 'block text-xs font-medium text-[#637381] mb-1.5'

const { t } = useI18n()
const router = useRouter()
const auth = useAuthStore()

const SHORTCUTS = [
  { key: '↑ / ↓',   label: 'Move row selection' },
  { key: '← / →',   label: 'Previous / next page' },
  { key: 'Enter',    label: 'Edit selected row' },
  { key: 'Shift+S',  label: 'Focus search' },
  { key: 'Shift+C',  label: 'New group' },
  { key: 'Shift+D',  label: 'Delete selected row' },
]

const groups           = ref([])
const total            = ref(0)
const page             = ref(1)
const limit            = 20
const search           = ref('')
const filterStatus     = ref('')
const filterActiveFrom = ref('')
const filterActiveTo   = ref('')
const showFilters      = ref(false)
const loading          = ref(false)
const selectedRowIndex = ref(-1)
const dataTableRef     = ref(null)
const showShortcuts    = ref(false)
const shortcutsRef     = ref(null)

const activeFilterCount = computed(() => [filterStatus.value, filterActiveFrom.value, filterActiveTo.value].filter(Boolean).length)
const totalPages        = computed(() => Math.ceil(total.value / limit))
const statusOptions = computed(() => [
  { id: 'active',   name: t('common.active')   },
  { id: 'inactive', name: t('common.inactive') },
])

function onClickOutsideShortcuts(e) {
  if (shortcutsRef.value && !shortcutsRef.value.contains(e.target)) {
    showShortcuts.value = false
  }
}

function onKeydown(e) {
  const tag = document.activeElement?.tagName?.toLowerCase()
  if (tag === 'input' || tag === 'textarea' || tag === 'select') return

  if (e.key === 'ArrowDown') {
    e.preventDefault()
    selectedRowIndex.value = Math.min(selectedRowIndex.value + 1, groups.value.length - 1)
  } else if (e.key === 'ArrowUp') {
    e.preventDefault()
    selectedRowIndex.value = Math.max(selectedRowIndex.value - 1, 0)
  } else if (e.key === 'ArrowRight' && page.value < totalPages.value) {
    e.preventDefault()
    page.value++
  } else if (e.key === 'ArrowLeft' && page.value > 1) {
    e.preventDefault()
    page.value--
  } else if (e.key === 'Enter' && selectedRowIndex.value >= 0) {
    const g = groups.value[selectedRowIndex.value]
    if (g) router.push(`/erp/customer-groups/${g.id}/edit`)
  } else if (e.shiftKey && e.key === 'C') {
    e.preventDefault()
    router.push('/erp/customer-groups/create')
  } else if (e.shiftKey && e.key === 'S') {
    e.preventDefault()
    dataTableRef.value?.focusSearch()
  } else if (e.shiftKey && e.key === 'D') {
    e.preventDefault()
    const g = groups.value[selectedRowIndex.value]
    if (g) confirmDelete(g)
  }
}

async function fetchGroups() {
  loading.value = true
  try {
    const { data } = await api.get('/erp/customer-groups', {
      params: { page: page.value, limit, search: search.value, status: filterStatus.value || undefined, activeFrom: filterActiveFrom.value || undefined, activeTo: filterActiveTo.value || undefined },
    })
    groups.value = data.data.groups
    total.value  = data.data.total
    selectedRowIndex.value = -1
  } finally { loading.value = false }
}

function onFilterChange() { page.value = 1; fetchGroups() }
function clearFilters() { filterStatus.value = ''; filterActiveFrom.value = ''; filterActiveTo.value = ''; page.value = 1; fetchGroups() }

watch([page, search], fetchGroups)
onMounted(() => {
  fetchGroups()
  window.addEventListener('keydown', onKeydown)
  document.addEventListener('mousedown', onClickOutsideShortcuts)
})
onUnmounted(() => {
  window.removeEventListener('keydown', onKeydown)
  document.removeEventListener('mousedown', onClickOutsideShortcuts)
})

async function confirmDelete(g) {
  if (!confirm(`Delete "${g.name}"? This cannot be undone.`)) return
  try { await api.delete(`/erp/customer-groups/${g.id}`); fetchGroups() }
  catch (err) { alert(err.response?.data?.message || 'Delete failed') }
}

const columnHelper = createColumnHelper()

const columns = [
  columnHelper.accessor('code', {
    header: () => t('erp.customerGroups.colCode'),
    cell: info => info.getValue()
      ? h('span', { class: 'font-mono text-sm text-[#374151]' }, info.getValue())
      : h('span', { class: 'text-[#9BA7B0] text-xs' }, '—'),
  }),
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
        class: `inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold capitalize ${s === 'active' ? 'bg-green-50 text-green-700' : 'bg-[#F1F5F9] text-[#637381]'}`
      }, [
        h('span', { class: `w-1.5 h-1.5 ${s === 'active' ? 'bg-green-500' : 'bg-slate-400'}` }),
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
        class: 'p-1.5 text-[#9BA7B0] hover:text-primary-500 hover:bg-primary-50 transition-colors',
        title: 'Edit',
      }, () => h(PencilIcon, { class: 'w-4 h-4' })) : null,
      auth.hasPermission('erp.customer-groups.delete') ? h('button', {
        onClick: () => confirmDelete(info.row.original),
        class: 'p-1.5 text-[#9BA7B0] hover:text-red-600 hover:bg-red-50 transition-colors',
        title: 'Delete',
      }, h(TrashIcon, { class: 'w-4 h-4' })) : null,
    ]),
  }),
]
</script>
