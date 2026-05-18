<template>
  <AppLayout>
    <div class="space-y-5">

      <div class="flex items-center justify-between gap-4">
        <div>
          <h1 class="text-xl font-semibold text-[#1C2434]">{{ t('erp.stockBalance.title') }}</h1>
          <p class="text-sm text-[#637381] mt-0.5">{{ rows.length }} line{{ rows.length !== 1 ? 's' : '' }}</p>
        </div>
        <button @click="load" :disabled="loading"
          class="inline-flex items-center gap-1.5 px-4 py-2 text-sm border border-[#E2E8F0] rounded-lg
                 hover:bg-[#F7F9FC] transition-colors disabled:opacity-40 text-[#637381]">
          <ArrowPathIcon class="w-4 h-4" :class="{ 'animate-spin': loading }" />
          {{ t('erp.stockBalance.refresh') }}
        </button>
      </div>

      <!-- Summary cards -->
      <div class="grid grid-cols-3 gap-4">
        <div class="bg-white rounded-2xl border border-[#E2E8F0] shadow-sm p-5">
          <p class="text-xs font-semibold text-[#637381] uppercase tracking-wide mb-1">{{ t('erp.stockBalance.totalLines') }}</p>
          <p class="text-2xl font-bold text-[#1C2434] tabular-nums">{{ rows.length }}</p>
        </div>
        <div class="bg-white rounded-2xl border border-[#E2E8F0] shadow-sm p-5">
          <p class="text-xs font-semibold text-[#637381] uppercase tracking-wide mb-1">{{ t('erp.stockBalance.totalQty') }}</p>
          <p class="text-2xl font-bold text-[#1C2434] tabular-nums">{{ fmtQty(totalQty) }}</p>
        </div>
        <div class="bg-white rounded-2xl border border-[#E2E8F0] shadow-sm p-5">
          <p class="text-xs font-semibold text-[#637381] uppercase tracking-wide mb-1">{{ t('erp.stockBalance.totalValue') }}</p>
          <p class="text-2xl font-bold text-primary-500 tabular-nums">{{ fmtMoney(totalValue) }}</p>
        </div>
      </div>

      <!-- Filters -->
      <div class="bg-white rounded-2xl border border-[#E2E8F0] shadow-sm px-5 py-4">
        <div class="flex flex-wrap items-end gap-4">
          <div class="w-48">
            <label class="block text-xs font-semibold text-[#637381] uppercase tracking-wide mb-1.5">{{ t('erp.stockBalance.colStore') }}</label>
            <SearchSelect v-model="filters.storeId" :options="storeOptions" :placeholder="t('erp.stockMovement.allStores')" @change="load" />
          </div>
          <div class="w-56">
            <label class="block text-xs font-semibold text-[#637381] uppercase tracking-wide mb-1.5">{{ t('erp.stockBalance.colProduct') }}</label>
            <SearchSelect v-model="filters.productId" :options="productOptions" :placeholder="t('erp.stockMovement.allProducts')" @change="load" />
          </div>
          <label class="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" v-model="filters.includeZero" @change="load" class="rounded w-4 h-4" />
            <span class="text-sm text-[#374151]">{{ t('erp.stockBalance.includeZeroQty') }}</span>
          </label>
          <button @click="resetFilters"
            class="text-xs text-[#9BA7B0] hover:text-[#374151] transition-colors underline">
            {{ t('erp.stockBalance.reset') }}
          </button>
        </div>
      </div>

      <!-- Table -->
      <div class="bg-white rounded-2xl border border-[#E2E8F0] shadow-sm overflow-hidden">
        <DataTable :columns="columns" :data="rows" :loading="loading" :total="rows.length" :page-size="9999">
          <template #empty>
            <div class="flex flex-col items-center gap-2">
              <div class="w-10 h-10 bg-[#F1F5F9] rounded-xl flex items-center justify-center">
                <ChartBarIcon class="w-5 h-5 text-[#9BA7B0]" />
              </div>
              <p class="text-sm text-[#9BA7B0] font-medium">{{ t('erp.stockBalance.noFound') }}</p>
            </div>
          </template>
        </DataTable>
      </div>

    </div>
  </AppLayout>
</template>

<script setup>
import { h, ref, computed, onMounted } from 'vue'
import { RouterLink } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { createColumnHelper } from '@tanstack/vue-table'
import { ArrowPathIcon, ChartBarIcon } from '@heroicons/vue/24/outline'
import AppLayout from '@/layouts/AppLayout.vue'
import DataTable from '@/components/DataTable.vue'
import SearchSelect from '@/components/SearchSelect.vue'
import api from '@/api'
import { fmtMoney, fmtQty } from '@/utils/fmt'

const { t } = useI18n()
const rows     = ref([])
const stores   = ref([])
const products = ref([])
const loading  = ref(false)

const filters = ref({ storeId: '', productId: '', includeZero: false })

const storeOptions   = computed(() => stores.value.map(s => ({ id: s.id, name: `${s.name}${s.code ? ` (${s.code})` : ''}` })))
const productOptions = computed(() => products.value.map(p => ({ id: p.id, name: `${p.name}${p.sku ? ` [${p.sku}]` : ''}` })))

const totalQty   = computed(() => rows.value.reduce((s, r) => s + r.qty, 0))
const totalValue = computed(() => rows.value.reduce((s, r) => s + parseFloat(r.value || 0), 0))

const ch = createColumnHelper()

const columns = [
  ch.accessor('store', {
    header: () => t('erp.stockBalance.colStore'),
    cell: info => h('span', { class: 'text-[#374151] font-medium' }, info.getValue()?.name || '—'),
  }),
  ch.display({
    id: 'product',
    header: () => t('erp.stockBalance.colProduct'),
    cell: ({ row }) => {
      const r = row.original
      return h(RouterLink, {
        to: `/erp/stock-balance/product/${r.product?.id}`,
        class: 'text-primary-500 font-medium hover:underline',
      }, () => r.product?.name || '—')
    },
  }),
  ch.accessor('product', {
    id: 'sku',
    header: () => t('erp.stockBalance.colSku'),
    cell: info => h('span', { class: 'font-mono text-xs text-[#9BA7B0]' }, info.getValue()?.sku || '—'),
  }),
  ch.accessor('qty', {
    header: () => t('erp.stockBalance.colQty'),
    meta: { thClass: 'text-right', tdClass: 'text-right' },
    cell: info => {
      const qty = info.getValue()
      return h('span', { class: `font-semibold tabular-nums ${qty > 0 ? 'text-[#1C2434]' : 'text-red-500'}` }, fmtQty(qty))
    },
  }),
  ch.accessor('uom', {
    header: () => t('erp.stockBalance.colUom'),
    cell: info => h('span', { class: 'text-[#637381]' }, info.getValue()?.abbreviation || info.getValue()?.name || '—'),
  }),
  ch.accessor('wac', {
    header: () => t('erp.stockBalance.colWac'),
    meta: { thClass: 'text-right', tdClass: 'text-right' },
    cell: info => h('span', { class: 'text-[#637381] tabular-nums' }, fmtMoney(info.getValue())),
  }),
  ch.accessor('value', {
    header: () => t('erp.stockBalance.colValue'),
    meta: { thClass: 'text-right', tdClass: 'text-right' },
    cell: info => h('span', { class: 'font-semibold text-[#1C2434] tabular-nums' }, fmtMoney(info.getValue())),
  }),
]

async function load() {
  loading.value = true
  try {
    const { data } = await api.get('/erp/stock-balance', {
      params: {
        storeId:     filters.value.storeId   || undefined,
        productId:   filters.value.productId || undefined,
        includeZero: filters.value.includeZero ? 'true' : undefined,
      },
    })
    rows.value = data.data.balances
  } finally { loading.value = false }
}

function resetFilters() { filters.value = { storeId: '', productId: '', includeZero: false }; load() }

onMounted(async () => {
  try {
    const { data } = await api.get('/erp/stock-balance/lookups')
    stores.value   = data.data.stores
    products.value = data.data.products
  } catch (err) { console.error('Failed to load lookups:', err.message) }
  load()
})
</script>
