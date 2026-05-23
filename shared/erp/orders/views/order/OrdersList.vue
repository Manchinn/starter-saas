<template>
  <AppLayout>
    <div class="space-y-5">

      <!-- Header -->
      <div class="flex items-center justify-between gap-4">
        <div>
          <h1 class="text-xl font-semibold text-[#1C2434]">{{ t('erp.orders.title') }}</h1>
          <p class="text-sm text-[#637381] mt-0.5">{{ total }} order{{ total !== 1 ? 's' : '' }}</p>
        </div>
        <div class="flex items-center gap-2">
          <button @click="shortcutsOpen = !shortcutsOpen" type="button"
            title="Keyboard shortcuts (?)"
            :class="['hidden sm:inline-flex items-center gap-1.5 px-2.5 py-2 text-[11px] font-medium border transition-colors',
                     shortcutsOpen
                       ? 'border-primary-300 bg-primary-50 text-primary-600'
                       : 'border-[#E2E8F0] text-[#9BA7B0] hover:bg-[#F7F9FC] hover:text-[#637381]']">
            <kbd class="font-mono text-[13px] leading-none">?</kbd>
            <span class="hidden lg:inline">Shortcuts</span>
          </button>
          <RouterLink
            v-can="'erp.orders.edit'"
            to="/erp/orders/create"
            class="btn-primary">
            <PlusIcon class="w-4 h-4" />
            {{ t('erp.orders.new') }}
          </RouterLink>
        </div>
      </div>

      <!-- Table card -->
      <div ref="tableWrapRef" class="bg-white border border-[#E2E8F0] shadow-sm overflow-hidden">
        <DataTable :columns="columns" :data="orders" :loading="loading" :total="total"
          v-model:page="page" v-model:global-filter="search" :page-size="limit"
          searchable :search-placeholder="t('erp.orders.searchPh')">

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
                      <SearchSelect v-model="filterStatus" :options="STATUS_FILTER_OPTIONS" :placeholder="t('common.all')" @change="onFilterChange" />
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
              <span v-if="filterDateFrom" class="inline-flex items-center gap-1 pl-2.5 pr-1 py-1 bg-white border border-[#E2E8F0] text-xs font-medium text-[#374151]">
                {{ t('common.dateFrom') }}: <span class="font-semibold ml-0.5">{{ filterDateFrom }}</span>
                <button @click="filterDateFrom = ''; onFilterChange()" class="ml-1 p-0.5 text-[#9BA7B0] hover:text-red-500 transition-colors">
                  <XMarkIcon class="w-3 h-3" />
                </button>
              </span>
              <span v-if="filterDateTo" class="inline-flex items-center gap-1 pl-2.5 pr-1 py-1 bg-white border border-[#E2E8F0] text-xs font-medium text-[#374151]">
                {{ t('common.dateTo') }}: <span class="font-semibold ml-0.5">{{ filterDateTo }}</span>
                <button @click="filterDateTo = ''; onFilterChange()" class="ml-1 p-0.5 text-[#9BA7B0] hover:text-red-500 transition-colors">
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
                <DocumentTextIcon class="w-5 h-5 text-[#9BA7B0]" />
              </div>
              <div class="text-center">
                <p class="text-sm font-medium text-[#637381]">{{ t('erp.orders.noFound') }}</p>
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

    <!-- Keyboard shortcuts panel -->
    <Teleport to="body">
      <Transition
        enter-active-class="transition duration-150 ease-out"
        enter-from-class="opacity-0 translate-y-2"
        enter-to-class="opacity-100 translate-y-0"
        leave-active-class="transition duration-100 ease-in"
        leave-from-class="opacity-100 translate-y-0"
        leave-to-class="opacity-0 translate-y-2"
      >
        <div v-if="shortcutsOpen"
          class="fixed bottom-6 right-6 z-30 w-72 bg-white border border-[#E2E8F0] shadow-xl overflow-hidden">

          <div class="px-4 py-2.5 bg-[#F7F9FC] border-b border-[#E2E8F0] flex items-center justify-between">
            <div class="flex items-center gap-2">
              <span class="text-[12px] font-semibold text-[#1C2434]">Keyboard Shortcuts</span>
              <kbd class="px-1 py-0.5 border border-[#E2E8F0] bg-white font-mono text-[10px] text-[#9BA7B0]">?</kbd>
            </div>
            <button @click="shortcutsOpen = false" type="button"
              class="w-5 h-5 flex items-center justify-center text-[#9BA7B0] hover:text-[#374151]">
              <XMarkIcon class="w-3.5 h-3.5" />
            </button>
          </div>

          <div class="px-4 py-3 space-y-3.5 text-[12px]">

            <div>
              <p class="text-[10px] font-semibold text-[#9BA7B0] uppercase tracking-wider mb-2">Actions</p>
              <div class="space-y-1.5">
                <div class="flex items-center justify-between">
                  <span class="text-[#374151]">New order</span>
                  <div class="flex items-center gap-1">
                    <kbd class="px-1.5 py-0.5 border border-[#E2E8F0] bg-[#F7F9FC] font-mono text-[10px] text-[#637381]">N</kbd>
                    <span class="text-[10px] text-[#9BA7B0]">or</span>
                    <kbd class="px-1.5 py-0.5 border border-[#E2E8F0] bg-[#F7F9FC] font-mono text-[10px] text-[#637381]">C</kbd>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <p class="text-[10px] font-semibold text-[#9BA7B0] uppercase tracking-wider mb-2">Search & Filter</p>
              <div class="space-y-1.5">
                <div class="flex items-center justify-between">
                  <span class="text-[#374151]">Focus search</span>
                  <kbd class="px-1.5 py-0.5 border border-[#E2E8F0] bg-[#F7F9FC] font-mono text-[10px] text-[#637381]">/</kbd>
                </div>
                <div class="flex items-center justify-between">
                  <span class="text-[#374151]">Toggle filters</span>
                  <kbd class="px-1.5 py-0.5 border border-[#E2E8F0] bg-[#F7F9FC] font-mono text-[10px] text-[#637381]">F</kbd>
                </div>
                <div class="flex items-center justify-between">
                  <span class="text-[#374151]">Clear search / close filters</span>
                  <kbd class="px-1.5 py-0.5 border border-[#E2E8F0] bg-[#F7F9FC] font-mono text-[10px] text-[#637381]">Esc</kbd>
                </div>
              </div>
            </div>

            <div class="pt-2 border-t border-[#E2E8F0]">
              <div class="flex items-center justify-between mt-2">
                <span class="text-[#374151]">Show / hide shortcuts</span>
                <kbd class="px-1.5 py-0.5 border border-[#E2E8F0] bg-[#F7F9FC] font-mono text-[10px] text-[#637381]">?</kbd>
              </div>
            </div>

          </div>
        </div>
      </Transition>
    </Teleport>

  </AppLayout>
</template>

<script setup>
import { h, ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { RouterLink, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import {
  PlusIcon, EyeIcon, DocumentTextIcon,
  AdjustmentsHorizontalIcon, XMarkIcon,
} from '@heroicons/vue/24/outline'
import { createColumnHelper } from '@tanstack/vue-table'
import AppLayout from '@/layouts/AppLayout.vue'
import DataTable from '@/components/DataTable.vue'
import SearchSelect from '@/components/SearchSelect.vue'
import DateInput from '@/components/DateInput.vue'
import api from '@/api'
import { fmtMoney, fmtDate } from '@/utils/fmt'

const { t }  = useI18n()
const router = useRouter()

const STATUS_FILTER_OPTIONS = computed(() => [
  { id: 'draft',     name: t('erp.orders.draft') },
  { id: 'confirmed', name: t('erp.orders.confirmed') },
  { id: 'shipped',   name: t('erp.orders.shipped') },
  { id: 'delivered', name: t('erp.orders.delivered') },
  { id: 'cancelled', name: t('erp.orders.cancelled') },
])

const orders         = ref([])
const total          = ref(0)
const page           = ref(1)
const limit          = 20
const search         = ref('')
const filterStatus   = ref('')
const filterDateFrom = ref('')
const filterDateTo   = ref('')
const showFilters    = ref(false)
const loading        = ref(false)

const activeFilterCount = computed(() => [filterStatus.value, filterDateFrom.value, filterDateTo.value].filter(Boolean).length)

const shortcutsOpen = ref(false)
const tableWrapRef  = ref(null)

function focusSearch() {
  const input = tableWrapRef.value?.querySelector('input[type="search"]')
    || tableWrapRef.value?.querySelector('input')
  input?.focus()
  input?.select()
}

function onKeydown(e) {
  const typing = ['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement?.tagName)

  // Shortcuts panel: Esc or ? closes it.
  if (shortcutsOpen.value) {
    if (e.key === 'Escape' || e.key === '?') { e.preventDefault(); shortcutsOpen.value = false }
    return
  }

  if (e.key === 'Escape') {
    if (showFilters.value) { e.preventDefault(); showFilters.value = false; return }
    if (search.value)      { e.preventDefault(); search.value = ''; return }
    return
  }

  if (typing) return

  if      (e.key === 'n' || e.key === 'c') { e.preventDefault(); router.push('/erp/orders/create') }
  else if (e.key === '/')                  { e.preventDefault(); focusSearch() }
  else if (e.key === 'f')                  { e.preventDefault(); showFilters.value = !showFilters.value }
  else if (e.key === '?')                  { e.preventDefault(); shortcutsOpen.value = true }
}

onMounted(() => document.addEventListener('keydown', onKeydown))
onUnmounted(() => document.removeEventListener('keydown', onKeydown))

async function fetchOrders() {
  loading.value = true
  try {
    const { data } = await api.get('/erp/orders', {
      params: {
        page: page.value, limit, search: search.value,
        status: filterStatus.value || undefined,
        dateFrom: filterDateFrom.value || undefined,
        dateTo: filterDateTo.value || undefined,
      },
    })
    orders.value = data.data.orders
    total.value  = data.data.total
  } finally {
    loading.value = false
  }
}

function onFilterChange() { page.value = 1; fetchOrders() }
function clearFilters() { filterStatus.value = ''; filterDateFrom.value = ''; filterDateTo.value = ''; page.value = 1; fetchOrders() }

watch([page, search], fetchOrders)
onMounted(fetchOrders)

const STATUS_STYLE = {
  draft:     { badge: 'bg-[#F1F5F9] text-[#637381]',    dot: 'bg-slate-400' },
  confirmed: { badge: 'bg-blue-50 text-blue-700',     dot: 'bg-blue-500' },
  shipped:   { badge: 'bg-amber-50 text-amber-700',   dot: 'bg-amber-500' },
  delivered: { badge: 'bg-green-50 text-green-700',   dot: 'bg-green-500' },
  cancelled: { badge: 'bg-red-50 text-red-600',       dot: 'bg-red-500' },
}
function statusClass(s) { return (STATUS_STYLE[s] || STATUS_STYLE.draft).badge }
function statusDot(s)   { return (STATUS_STYLE[s] || STATUS_STYLE.draft).dot }

const columnHelper = createColumnHelper()

const columns = [
  columnHelper.accessor('orderNumber', {
    header: () => t('erp.common.refNo'),
    cell: info => h('span', { class: 'font-mono text-sm font-medium text-[#1C2434]' }, info.getValue()),
  }),
  columnHelper.display({
    id: 'customer',
    header: () => t('erp.orders.customer'),
    cell: info => info.row.original.customer?.name || '—',
  }),
  columnHelper.accessor('orderDate', {
    header: () => t('erp.common.date'),
    cell: info => h('span', { class: 'text-xs' }, fmtDate(info.getValue())),
  }),
  columnHelper.accessor('total', {
    header: () => t('erp.orders.total'),
    cell: info => fmtMoney(info.getValue()),
    meta: { thClass: 'text-right', tdClass: 'text-right font-semibold text-[#1C2434] tabular-nums' },
  }),
  columnHelper.accessor('status', {
    header: () => t('erp.common.status'),
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
    meta: { thClass: 'w-16', tdClass: '' },
    cell: info => h('div', { class: 'flex items-center justify-end' }, [
      h(RouterLink, {
        to: `/erp/orders/${info.row.original.id}`,
        class: 'p-1.5 text-[#9BA7B0] hover:text-primary-500 hover:bg-primary-50 transition-colors',
        title: 'View',
      }, () => h(EyeIcon, { class: 'w-4 h-4' })),
    ]),
  }),
]
</script>
