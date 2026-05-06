<template>
  <AppLayout>
    <div class="space-y-5">

      <div class="flex items-center justify-between gap-4">
        <div>
          <h1 class="text-xl font-semibold text-[#1C2434]">{{ t('erp.goodReceive.title') }}</h1>
          <p class="text-sm text-[#637381] mt-0.5">{{ total }} record{{ total !== 1 ? 's' : '' }}</p>
        </div>
        <RouterLink to="/erp/good-receive/create" class="btn-primary">
          <PlusIcon class="w-4 h-4" />
          {{ t('erp.goodReceive.new') }}
        </RouterLink>
      </div>

      <div class="bg-white rounded-2xl border border-[#E2E8F0] shadow-sm overflow-hidden">

        <!-- ── Toolbar ─────────────────────────────────────────────── -->
        <div class="px-5 py-3 border-b border-[#E2E8F0] flex items-center gap-3">
          <div class="relative flex-1 min-w-0">
            <MagnifyingGlassIcon class="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#9BA7B0] pointer-events-none" />
            <input v-model="search" @input="onSearch" type="search" :placeholder="t('erp.goodReceive.searchPh')"
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
                    <option value="draft">Draft</option>
                    <option value="confirmed">Confirmed</option>
                  </select>
                </div>
                <div>
                  <label class="block text-xs font-medium text-[#637381] mb-1.5">{{ t('common.dateFrom') }}</label>
                  <DateInput v-model="filterDateFrom" @change="onFilterChange" class="input text-sm" />
                </div>
                <div>
                  <label class="block text-xs font-medium text-[#637381] mb-1.5">{{ t('common.dateTo') }}</label>
                  <DateInput v-model="filterDateTo" @change="onFilterChange" class="input text-sm" />
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
          <span v-if="filterDateFrom" class="inline-flex items-center gap-1 pl-2.5 pr-1 py-1 bg-white border border-[#E2E8F0] rounded-full text-xs font-medium text-[#374151]">
            {{ t('common.dateFrom') }}: <span class="font-semibold ml-0.5">{{ filterDateFrom }}</span>
            <button @click="filterDateFrom = ''; onFilterChange()" class="ml-1 p-0.5 text-[#9BA7B0] hover:text-red-500 rounded-full transition-colors">
              <XMarkIcon class="w-3 h-3" />
            </button>
          </span>
          <span v-if="filterDateTo" class="inline-flex items-center gap-1 pl-2.5 pr-1 py-1 bg-white border border-[#E2E8F0] rounded-full text-xs font-medium text-[#374151]">
            {{ t('common.dateTo') }}: <span class="font-semibold ml-0.5">{{ filterDateTo }}</span>
            <button @click="filterDateTo = ''; onFilterChange()" class="ml-1 p-0.5 text-[#9BA7B0] hover:text-red-500 rounded-full transition-colors">
              <XMarkIcon class="w-3 h-3" />
            </button>
          </span>
          <button @click="clearFilters" class="ml-auto text-xs text-red-500 hover:text-red-700 font-medium transition-colors">
            {{ t('common.clearAll') }}
          </button>
        </div>

        <DataTable :columns="columns" :data="rows" :loading="loading" :total="total" v-model:page="page" :page-size="limit">
          <template #empty>
            <div class="flex flex-col items-center gap-3 py-4">
              <div class="w-10 h-10 bg-[#F1F5F9] rounded-xl flex items-center justify-center">
                <InboxArrowDownIcon class="w-5 h-5 text-[#9BA7B0]" />
              </div>
              <div class="text-center">
                <p class="text-sm font-medium text-[#637381]">{{ t('erp.goodReceive.noFound') }}</p>
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
import { createColumnHelper } from '@tanstack/vue-table'
import {
  PlusIcon, MagnifyingGlassIcon, EyeIcon, CheckCircleIcon, TrashIcon, InboxArrowDownIcon,
  AdjustmentsHorizontalIcon, XMarkIcon,
} from '@heroicons/vue/24/outline'
import AppLayout from '@/layouts/AppLayout.vue'
import DataTable from '@/components/DataTable.vue'
import api from '@/api'

const { t } = useI18n()

const rows            = ref([])
const total           = ref(0)
const page            = ref(1)
const limit           = 20
const search          = ref('')
const filterStatus    = ref('')
const filterDateFrom  = ref('')
const filterDateTo    = ref('')
const showFilters     = ref(false)
const loading         = ref(false)
const approvingId     = ref(null)
let searchTimeout     = null

const activeFilterCount = computed(() => [filterStatus.value, filterDateFrom.value, filterDateTo.value].filter(Boolean).length)

const ch = createColumnHelper()

const columns = [
  ch.accessor('refNo', {
    header: () => t('erp.goodReceive.colRefNo'),
    cell: info => h('span', { class: 'font-mono font-medium text-[#1C2434]' }, info.getValue()),
  }),
  ch.accessor('date', {
    header: () => t('erp.goodReceive.colDate'),
    cell: info => h('span', { class: 'text-[#637381] text-xs' }, info.getValue()),
  }),
  ch.accessor('store', {
    header: () => t('erp.goodReceive.colStore'),
    cell: info => h('span', { class: 'font-medium text-[#374151]' }, info.getValue()?.name || '—'),
  }),
  ch.accessor('supplier', {
    header: () => t('erp.goodReceive.colSupplier'),
    cell: info => h('span', { class: 'text-[#637381]' }, info.getValue() || '—'),
  }),
  ch.accessor('status', {
    header: () => t('erp.goodReceive.colStatus'),
    cell: info => {
      const s = info.getValue()
      const confirmed = s === 'confirmed'
      return h('span', {
        class: `inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold capitalize ${confirmed ? 'bg-green-50 text-green-700' : 'bg-amber-50 text-amber-700'}`,
      }, [
        h('span', { class: `w-1.5 h-1.5 rounded-full ${confirmed ? 'bg-green-500' : 'bg-amber-500'}` }),
        s,
      ])
    },
  }),
  ch.display({
    id: 'actions',
    meta: { thClass: 'w-32' },
    cell: ({ row }) => {
      const r = row.original
      return h('div', { class: 'flex items-center justify-end gap-1.5' }, [
        h(RouterLink, {
          to: `/erp/good-receive/${r.id}`,
          class: 'p-1.5 text-[#9BA7B0] hover:text-primary-500 hover:bg-primary-50 rounded-md transition-colors',
          title: 'View',
        }, () => h(EyeIcon, { class: 'w-4 h-4' })),
        r.status === 'draft' && h('button', {
          onClick: () => approveRow(r),
          disabled: approvingId.value === r.id,
          class: 'p-1.5 text-[#9BA7B0] hover:text-green-700 hover:bg-green-50 rounded-md transition-colors disabled:opacity-40',
          title: 'Approve',
        }, h(CheckCircleIcon, { class: 'w-4 h-4' })),
        r.status === 'draft' && h('button', {
          onClick: () => confirmDelete(r),
          class: 'p-1.5 text-[#9BA7B0] hover:text-red-600 hover:bg-red-50 rounded-md transition-colors',
          title: 'Delete',
        }, h(TrashIcon, { class: 'w-4 h-4' })),
      ].filter(Boolean))
    },
  }),
]

async function load() {
  loading.value = true
  try {
    const { data } = await api.get('/erp/good-receive', {
      params: {
        page: page.value, limit, search: search.value,
        status: filterStatus.value || undefined,
        dateFrom: filterDateFrom.value || undefined,
        dateTo: filterDateTo.value || undefined,
      },
    })
    rows.value = data.data.goodReceives
    total.value = data.data.total
  } finally { loading.value = false }
}

function onSearch() { clearTimeout(searchTimeout); searchTimeout = setTimeout(() => { page.value = 1; load() }, 300) }
function onFilterChange() { page.value = 1; load() }
function clearFilters() { filterStatus.value = ''; filterDateFrom.value = ''; filterDateTo.value = ''; page.value = 1; load() }

watch(page, load)
onMounted(load)

async function approveRow(row) {
  if (!confirm(`Approve ${row.refNo}? Stock will be updated and this cannot be undone.`)) return
  approvingId.value = row.id
  try { await api.post(`/erp/good-receive/${row.id}/confirm`); load() }
  catch (err) { alert(err.response?.data?.message || 'Approve failed') }
  finally { approvingId.value = null }
}

async function confirmDelete(row) {
  if (!confirm(`Delete ${row.refNo}? This cannot be undone.`)) return
  try { await api.delete(`/erp/good-receive/${row.id}`); load() }
  catch (err) { alert(err.response?.data?.message || 'Delete failed') }
}
</script>
