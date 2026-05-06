<template>
  <AppLayout>
    <div class="space-y-5">

      <div class="flex items-center justify-between gap-4">
        <div>
          <h1 class="text-xl font-semibold text-[#1C2434]">{{ t('erp.stores.title') }}</h1>
          <p class="text-sm text-[#637381] mt-0.5">{{ total }} store{{ total !== 1 ? 's' : '' }}</p>
        </div>
        <RouterLink to="/erp/stores/create" class="btn-primary">
          <PlusIcon class="w-4 h-4" />
          {{ t('erp.stores.new') }}
        </RouterLink>
      </div>

      <div class="bg-white rounded-2xl border border-[#E2E8F0] shadow-sm overflow-hidden">

        <!-- ── Toolbar ─────────────────────────────────────────────── -->
        <div class="px-5 py-3 border-b border-[#E2E8F0] flex items-center gap-3">
          <div class="relative flex-1 min-w-0">
            <MagnifyingGlassIcon class="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#9BA7B0] pointer-events-none" />
            <input v-model="search" @input="onSearch" type="search" :placeholder="t('erp.stores.searchPh')"
              class="input pl-9 w-full" />
          </div>
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
        </div>

        <!-- ── Advanced filter panel ──────────────────────────────── -->
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
                  <select v-model="filterStatus" @change="onFilterChange" class="input text-sm">
                    <option value="">{{ t('common.all') }}</option>
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
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

        <!-- ── Active filter chips ────────────────────────────────── -->
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

        <DataTable :columns="columns" :data="stores" :loading="loading" :total="total"
          v-model:page="page" :page-size="limit">
          <template #empty>
            <div class="flex flex-col items-center gap-3 py-4">
              <div class="w-10 h-10 bg-[#F1F5F9] rounded-xl flex items-center justify-center">
                <BuildingStorefrontIcon class="w-5 h-5 text-[#9BA7B0]" />
              </div>
              <div class="text-center">
                <p class="text-sm font-medium text-[#637381]">{{ t('erp.stores.noFound') }}</p>
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
  PlusIcon, MagnifyingGlassIcon, PencilIcon, TrashIcon, BuildingStorefrontIcon,
  AdjustmentsHorizontalIcon, XMarkIcon,
} from '@heroicons/vue/24/outline'
import { createColumnHelper } from '@tanstack/vue-table'
import AppLayout from '@/layouts/AppLayout.vue'
import DataTable from '@/components/DataTable.vue'
import api from '@/api'

const { t } = useI18n()

const stores       = ref([])
const total        = ref(0)
const page         = ref(1)
const limit        = 20
const search       = ref('')
const filterStatus     = ref('')
const filterActiveFrom = ref('')
const filterActiveTo   = ref('')
const showFilters      = ref(false)
const loading          = ref(false)
let searchTimeout      = null

const activeFilterCount = computed(() => [filterStatus.value, filterActiveFrom.value, filterActiveTo.value].filter(Boolean).length)

async function load() {
  loading.value = true
  try {
    const { data } = await api.get('/erp/stores', {
      params: { page: page.value, limit, search: search.value, status: filterStatus.value || undefined, activeFrom: filterActiveFrom.value || undefined, activeTo: filterActiveTo.value || undefined },
    })
    stores.value = data.data.stores
    total.value  = data.data.total
  } finally { loading.value = false }
}

function onSearch() { clearTimeout(searchTimeout); searchTimeout = setTimeout(() => { page.value = 1; load() }, 300) }
function onFilterChange() { page.value = 1; load() }
function clearFilters() { filterStatus.value = ''; filterActiveFrom.value = ''; filterActiveTo.value = ''; page.value = 1; load() }

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
