<template>
  <AppLayout>
    <div class="space-y-5">

      <PageHeader :title="t('erp.stores.title')"
        :breadcrumb="[{ label: `${total} store${total !== 1 ? 's' : ''}` }]">
        <template #actions>
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

          <AppButton to="/erp/stores/create" variant="primary">
            <PlusIcon class="w-4 h-4" />
            {{ t('erp.stores.new') }}
          </AppButton>
        </template>
      </PageHeader>

      <div class="bg-white border border-[#E2E8F0] shadow-sm overflow-hidden">
        <DataTable ref="dataTableRef" :columns="columns" :data="stores" :loading="loading" :total="total"
          v-model:page="page" v-model:global-filter="search" :page-size="limit"
          :selected-row-index="selectedRowIndex"
          searchable :search-placeholder="t('erp.stores.searchPh')">

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
                      <FieldLabel :text="t('erp.common.status')" />
                      <SearchSelect v-model="filterStatus" :options="statusOptions" :placeholder="t('common.all')" @change="onFilterChange" />
                    </div>
                    <div>
                      <FieldLabel :text="t('erp.common.activeFrom')" />
                      <DateInput v-model="filterActiveFrom" @change="onFilterChange" class="input text-sm" />
                    </div>
                    <div>
                      <FieldLabel :text="t('erp.common.activeTo')" />
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
            <EmptyState :icon="BuildingStorefrontIcon" :title="t('erp.stores.noFound')"
              :subtitle="activeFilterCount > 0 ? 'Try adjusting your filters' : ''"
              :action-label="activeFilterCount > 0 ? 'Clear all filters' : ''"
              padding="md" @action="clearFilters" />
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
  PlusIcon, PencilIcon, TrashIcon, BuildingStorefrontIcon,
  AdjustmentsHorizontalIcon, XMarkIcon,
} from '@heroicons/vue/24/outline'
import { createColumnHelper } from '@tanstack/vue-table'
import AppLayout from '@/layouts/AppLayout.vue'
import DataTable from '@/components/DataTable.vue'
import AppButton from '@/components/AppButton.vue'
import SearchSelect from '@/components/SearchSelect.vue'
import PageHeader from '@/components/form/PageHeader.vue'
import FieldLabel from '@/components/form/FieldLabel.vue'
import EmptyState from '@/components/form/EmptyState.vue'
import api from '@/api'

const { t } = useI18n()
const router = useRouter()

const SHORTCUTS = [
  { key: '↑ / ↓',   label: 'Move row selection' },
  { key: '← / →',   label: 'Previous / next page' },
  { key: 'Enter',    label: 'Edit selected row' },
  { key: 'Shift+S',  label: 'Focus search' },
  { key: 'Shift+C',  label: 'New store' },
  { key: 'Shift+D',  label: 'Delete selected row' },
]

const statusOptions = computed(() => [
  { id: 'active',   name: t('common.active')   },
  { id: 'inactive', name: t('common.inactive') },
])

const stores           = ref([])
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
    selectedRowIndex.value = Math.min(selectedRowIndex.value + 1, stores.value.length - 1)
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
    const s = stores.value[selectedRowIndex.value]
    if (s) router.push(`/erp/stores/${s.id}/edit`)
  } else if (e.shiftKey && e.key === 'C') {
    e.preventDefault()
    router.push('/erp/stores/create')
  } else if (e.shiftKey && e.key === 'S') {
    e.preventDefault()
    dataTableRef.value?.focusSearch()
  } else if (e.shiftKey && e.key === 'D') {
    e.preventDefault()
    const s = stores.value[selectedRowIndex.value]
    if (s) confirmDelete(s)
  }
}

async function load() {
  loading.value = true
  try {
    const { data } = await api.get('/erp/stores', {
      params: { page: page.value, limit, search: search.value, status: filterStatus.value || undefined, activeFrom: filterActiveFrom.value || undefined, activeTo: filterActiveTo.value || undefined },
    })
    stores.value = data.data.stores
    total.value  = data.data.total
    selectedRowIndex.value = -1
  } finally { loading.value = false }
}

function onFilterChange() { page.value = 1; load() }
function clearFilters() { filterStatus.value = ''; filterActiveFrom.value = ''; filterActiveTo.value = ''; page.value = 1; load() }

watch([page, search], load)
onMounted(() => {
  load()
  window.addEventListener('keydown', onKeydown)
  document.addEventListener('mousedown', onClickOutsideShortcuts)
})
onUnmounted(() => {
  window.removeEventListener('keydown', onKeydown)
  document.removeEventListener('mousedown', onClickOutsideShortcuts)
})

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
      h(RouterLink, {
        to: `/erp/stores/${info.row.original.id}/edit`,
        class: 'p-1.5 text-[#9BA7B0] hover:text-primary-500 hover:bg-primary-50 transition-colors',
        title: t('common.edit'),
      }, () => h(PencilIcon, { class: 'w-4 h-4' })),
      h('button', {
        onClick: () => confirmDelete(info.row.original),
        class: 'p-1.5 text-[#9BA7B0] hover:text-red-600 hover:bg-red-50 transition-colors',
        title: t('common.delete'),
      }, h(TrashIcon, { class: 'w-4 h-4' })),
    ]),
  }),
]
</script>
