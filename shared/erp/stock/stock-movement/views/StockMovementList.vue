<template>
  <AppLayout>
    <div class="space-y-5">

      <div>
        <h1 class="text-xl font-semibold text-[#1C2434]">{{ t('erp.stockMovement.title') }}</h1>
        <p class="text-sm text-[#637381] mt-0.5">{{ total }} movement{{ total !== 1 ? 's' : '' }}</p>
      </div>

      <div class="bg-white rounded-2xl border border-[#E2E8F0] shadow-sm overflow-hidden">
        <DataTable :columns="columns" :data="rows" :loading="loading" :total="total"
          v-model:page="page" v-model:global-filter="search" :page-size="limit"
          searchable :search-placeholder="t('erp.stockMovement.searchPh', 'Search by ref no…')">

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
                  <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                    <div>
                      <label class="block text-xs font-medium text-[#637381] mb-1.5">{{ t('erp.stockMovement.colType') }}</label>
                      <SearchSelect v-model="filterType" :options="typeOptions" :placeholder="t('erp.stockMovement.allTypes')" @change="onFilterChange" />
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
              <span v-if="filterType" class="inline-flex items-center gap-1 pl-2.5 pr-1 py-1 bg-white border border-[#E2E8F0] rounded-full text-xs font-medium text-[#374151]">
                {{ t('erp.stockMovement.colType') }}: <span class="font-semibold ml-0.5 capitalize">{{ filterType.replace('_', ' ') }}</span>
                <button @click="filterType = ''; onFilterChange()" class="ml-1 p-0.5 text-[#9BA7B0] hover:text-red-500 rounded-full transition-colors">
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
          </template>

          <template #empty>
            <div class="flex flex-col items-center gap-3 py-4">
              <div class="w-10 h-10 bg-[#F1F5F9] rounded-xl flex items-center justify-center">
                <ArrowsRightLeftIcon class="w-5 h-5 text-[#9BA7B0]" />
              </div>
              <div class="text-center">
                <p class="text-sm font-medium text-[#637381]">{{ t('erp.stockMovement.noFound') }}</p>
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
import { useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { createColumnHelper } from '@tanstack/vue-table'
import {
  ArrowsRightLeftIcon,
  AdjustmentsHorizontalIcon, XMarkIcon,
} from '@heroicons/vue/24/outline'
import AppLayout from '@/layouts/AppLayout.vue'
import DataTable from '@/components/DataTable.vue'
import SearchSelect from '@/components/SearchSelect.vue'
import api from '@/api'
import { fmtDateTime } from '@/utils/fmt'

const { t } = useI18n()

const typeOptions = computed(() => [
  { id: 'receive',         name: t('erp.stockMovement.typeReceive')     },
  { id: 'sale',            name: t('erp.stockMovement.typeSale')        },
  { id: 'adjust',          name: t('erp.stockMovement.typeAdjustment')  },
  { id: 'issue',           name: 'Issue'                                },
  { id: 'count',           name: 'Count'                                },
  { id: 'transfer_in',     name: t('erp.stockMovement.typeTransferIn')  },
  { id: 'transfer_out',    name: t('erp.stockMovement.typeTransferOut') },
  { id: 'customer_return', name: 'Customer Return'                      },
  { id: 'vendor_return',   name: 'Vendor Return'                        },
])
const route          = useRoute()
const rows           = ref([])
const products       = ref([])
const stores         = ref([])
const total          = ref(0)
const page           = ref(1)
const limit          = 20
const search         = ref('')
const filterProduct  = ref(route.query.productId || '')
const filterStore    = ref('')
const filterType     = ref('')
const filterDateFrom = ref('')
const filterDateTo   = ref('')
const showFilters    = ref(false)
const loading        = ref(false)

const activeFilterCount = computed(() => [filterType.value, filterDateFrom.value, filterDateTo.value].filter(Boolean).length)

const TYPE_BADGE = {
  receive:      'bg-blue-50 text-blue-700',
  adjust:       'bg-purple-50 text-purple-700',
  transfer_in:  'bg-green-50 text-green-700',
  transfer_out: 'bg-orange-50 text-orange-700',
  sale:         'bg-red-50 text-red-700',
}
const typeBadge = (type) => TYPE_BADGE[type] || 'bg-[#F1F5F9] text-[#637381]'
const ch = createColumnHelper()

const columns = [
  ch.accessor('createdAt', {
    header: () => t('erp.stockMovement.colDate'),
    cell: info => h('span', { class: 'text-[#637381] text-xs whitespace-nowrap' }, fmtDateTime(info.getValue())),
  }),
  ch.accessor('product', {
    header: () => t('erp.stockMovement.colProduct'),
    cell: info => h('span', { class: 'font-medium text-[#1C2434]' }, info.getValue()?.name),
  }),
  ch.accessor('store', {
    header: () => t('erp.stockMovement.colStore'),
    cell: info => h('span', { class: 'text-[#637381]' }, info.getValue()?.name || '—'),
  }),
  ch.accessor('type', {
    header: () => t('erp.stockMovement.colType'),
    cell: info => {
      const v = info.getValue()
      return h('span', {
        class: `inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold capitalize ${typeBadge(v)}`,
      }, v?.replace('_', ' '))
    },
  }),
  ch.accessor('qty', {
    header: () => t('erp.stockMovement.colQty'),
    meta: { thClass: 'text-right', tdClass: 'text-right' },
    cell: info => {
      const qty = info.getValue()
      return h('span', {
        class: `font-semibold tabular-nums ${qty > 0 ? 'text-green-700' : 'text-red-600'}`,
      }, `${qty > 0 ? '+' : ''}${qty}`)
    },
  }),
  ch.accessor('stockBefore', {
    header: () => t('erp.stockMovement.colBefore'),
    meta: { thClass: 'text-right', tdClass: 'text-right' },
    cell: info => h('span', { class: 'text-[#637381] tabular-nums' }, info.getValue()),
  }),
  ch.accessor('stockAfter', {
    header: () => t('erp.stockMovement.colAfter'),
    meta: { thClass: 'text-right', tdClass: 'text-right' },
    cell: info => h('span', { class: 'font-semibold text-[#1C2434] tabular-nums' }, info.getValue()),
  }),
  ch.accessor('refNo', {
    header: () => t('erp.stockMovement.colRef'),
    cell: info => h('span', { class: 'font-mono text-xs text-[#637381]' }, info.getValue() || '—'),
  }),
]

async function load() {
  loading.value = true
  try {
    const { data } = await api.get('/erp/stock-movements', {
      params: {
        page: page.value, limit,
        search: search.value || undefined,
        productId: filterProduct.value || undefined,
        storeId: filterStore.value || undefined,
        type: filterType.value || undefined,
        dateFrom: filterDateFrom.value || undefined,
        dateTo: filterDateTo.value || undefined,
      },
    })
    rows.value  = data.data.movements
    total.value = data.data.total
  } finally { loading.value = false }
}

async function loadLookups() {
  try {
    const [prodRes, storeRes] = await Promise.all([
      api.get('/erp/item-master', { params: { limit: 200 } }),
      api.get('/erp/item-master/stores-lookup'),
    ])
    products.value = prodRes.data.data.products
    stores.value   = storeRes.data.data.stores
  } catch (err) { console.error(err.message) }
}

function onFilterChange() { page.value = 1; load() }
function clearFilters() { filterType.value = ''; filterDateFrom.value = ''; filterDateTo.value = ''; page.value = 1; load() }

watch([page, search], load)
onMounted(() => { load(); loadLookups() })
</script>
