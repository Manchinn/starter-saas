<template>
  <AppLayout>
    <div class="space-y-5">

      <div class="flex items-center justify-between gap-4">
        <div>
          <h1 class="text-xl font-semibold text-[#1C2434]">{{ t('erp.productCategories.title') }}</h1>
          <p class="text-sm text-[#637381] mt-0.5">{{ total }} categor{{ total !== 1 ? 'ies' : 'y' }}</p>
        </div>
        <RouterLink to="/erp/product-categories/create" class="btn-primary">
          <PlusIcon class="w-4 h-4" />
          {{ t('erp.productCategories.new') }}
        </RouterLink>
      </div>

      <div class="bg-white rounded-2xl border border-[#E2E8F0] shadow-sm overflow-hidden">
        <DataTable :columns="columns" :data="categories" :loading="loading" :total="total"
          v-model:page="page" v-model:global-filter="search" :page-size="limit"
          searchable :search-placeholder="t('erp.productCategories.searchPh')">

          <template #toolbar>
            <button @click="showFilters = !showFilters"
              :class="['flex items-center gap-1.5 px-3 py-2 text-sm font-medium border transition-colors whitespace-nowrap',
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
                  <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                    <div>
                      <label class="block text-xs font-medium text-[#637381] mb-1.5">{{ t('erp.common.status') }}</label>
                      <SearchSelect v-model="filterStatus" :options="statusOptions" :placeholder="t('common.all')" @change="onFilterChange" />
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
              <span v-if="filterStatus" class="inline-flex items-center gap-1 pl-2.5 pr-1 py-1 bg-white border border-[#E2E8F0] rounded-full text-xs font-medium text-[#374151]">
                {{ t('erp.common.status') }}: <span class="capitalize font-semibold ml-0.5">{{ filterStatus }}</span>
                <button @click="filterStatus = ''; onFilterChange()" class="ml-1 p-0.5 text-[#9BA7B0] hover:text-red-500 rounded-full transition-colors">
                  <XMarkIcon class="w-3 h-3" />
                </button>
              </span>
              <span v-if="filterActiveFrom" class="inline-flex items-center gap-1 pl-2.5 pr-1 py-1 bg-white border border-[#E2E8F0] rounded-full text-xs font-medium text-[#374151]">
                {{ t('erp.common.activeFrom') }}: <span class="font-semibold ml-0.5">{{ filterActiveFrom }}</span>
                <button @click="filterActiveFrom = ''; onFilterChange()" class="ml-1 p-0.5 text-[#9BA7B0] hover:text-red-500 rounded-full transition-colors">
                  <XMarkIcon class="w-3 h-3" />
                </button>
              </span>
              <span v-if="filterActiveTo" class="inline-flex items-center gap-1 pl-2.5 pr-1 py-1 bg-white border border-[#E2E8F0] rounded-full text-xs font-medium text-[#374151]">
                {{ t('erp.common.activeTo') }}: <span class="font-semibold ml-0.5">{{ filterActiveTo }}</span>
                <button @click="filterActiveTo = ''; onFilterChange()" class="ml-1 p-0.5 text-[#9BA7B0] hover:text-red-500 rounded-full transition-colors">
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
                <FolderIcon class="w-5 h-5 text-[#9BA7B0]" />
              </div>
              <div class="text-center">
                <p class="text-sm font-medium text-[#637381]">{{ t('erp.productCategories.noFound') }}</p>
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
import { h, ref, computed, watch, onMounted } from 'vue'
import { RouterLink } from 'vue-router'
import { useI18n } from 'vue-i18n'
import {
  PlusIcon, PencilIcon, TrashIcon, FolderIcon,
  AdjustmentsHorizontalIcon, XMarkIcon,
} from '@heroicons/vue/24/outline'
import { createColumnHelper } from '@tanstack/vue-table'
import AppLayout from '@/layouts/AppLayout.vue'
import DataTable from '@/components/DataTable.vue'
import SearchSelect from '@/components/SearchSelect.vue'
import api from '@/api'

const { t } = useI18n()

const statusOptions = computed(() => [
  { id: 'active',   name: t('common.active')   },
  { id: 'inactive', name: t('common.inactive') },
])

const categories   = ref([])
const total        = ref(0)
const page         = ref(1)
const limit        = 20
const search       = ref('')
const filterStatus     = ref('')
const filterActiveFrom = ref('')
const filterActiveTo   = ref('')
const showFilters      = ref(false)
const loading          = ref(false)

const activeFilterCount = computed(() => [filterStatus.value, filterActiveFrom.value, filterActiveTo.value].filter(Boolean).length)

async function load() {
  loading.value = true
  try {
    const { data } = await api.get('/erp/product-categories', {
      params: { page: page.value, limit, search: search.value, status: filterStatus.value || undefined, activeFrom: filterActiveFrom.value || undefined, activeTo: filterActiveTo.value || undefined },
    })
    categories.value = data.data.categories
    total.value = data.data.total
  } finally { loading.value = false }
}

function onFilterChange() { page.value = 1; load() }
function clearFilters() { filterStatus.value = ''; filterActiveFrom.value = ''; filterActiveTo.value = ''; page.value = 1; load() }

watch([page, search], load)
onMounted(load)

async function confirmDelete(cat) {
  if (!confirm(`Delete "${cat.name}"? This cannot be undone.`)) return
  try { await api.delete(`/erp/product-categories/${cat.id}`); load() }
  catch (err) { alert(err.response?.data?.message || 'Delete failed') }
}

const columnHelper = createColumnHelper()

const columns = [
  columnHelper.accessor('code', {
    header: () => t('erp.productCategories.colCode'),
    cell: info => h('span', { class: 'font-mono text-xs text-[#637381]' }, info.getValue() || '—'),
  }),
  columnHelper.display({
    id: 'name',
    header: () => t('erp.productCategories.colName'),
    cell: info => {
      const cat = info.row.original
      return h('span', { class: 'font-medium text-[#1C2434]' }, [
        cat.parentId ? h('span', { class: 'text-[#CBD5E1] mr-1' }, '↳') : null,
        cat.name,
      ])
    },
  }),
  columnHelper.display({
    id: 'parent',
    header: () => t('erp.productCategories.colParent'),
    cell: info => info.row.original.parent?.name || '—',
  }),
  columnHelper.accessor('description', {
    header: () => t('erp.productCategories.colDesc'),
    cell: info => info.getValue() || '—',
  }),
  columnHelper.accessor('status', {
    header: () => t('erp.productCategories.colStatus'),
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
        to: `/erp/product-categories/${info.row.original.id}/edit`,
        class: 'p-1.5 text-[#9BA7B0] hover:text-primary-500 hover:bg-primary-50 rounded-md transition-colors inline-flex items-center',
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
