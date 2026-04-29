<template>
  <AppLayout>
    <div class="space-y-5">

      <div>
        <h1 class="text-xl font-semibold text-[#1C2434]">{{ t('erp.stockMovement.title') }}</h1>
        <p class="text-sm text-[#637381] mt-0.5">{{ total }} movement{{ total !== 1 ? 's' : '' }}</p>
      </div>

      <div class="bg-white rounded-2xl border border-[#E2E8F0] shadow-sm overflow-hidden">
        <div class="px-5 py-3 border-b border-[#E2E8F0] flex items-center gap-3 flex-wrap">
          <select v-model="filterProduct" @change="onFilter"
            class="px-3 py-2 border border-[#E2E8F0] rounded-lg text-sm bg-[#F7F9FC] focus:bg-white
                   focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent
                   text-[#374151] transition-colors min-w-44 max-w-52">
            <option value="">{{ t('erp.stockMovement.allProducts') }}</option>
            <option v-for="p in products" :key="p.id" :value="p.id">{{ p.name }}</option>
          </select>
          <select v-model="filterStore" @change="onFilter"
            class="px-3 py-2 border border-[#E2E8F0] rounded-lg text-sm bg-[#F7F9FC] focus:bg-white
                   focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent
                   text-[#374151] transition-colors">
            <option value="">{{ t('erp.stockMovement.allStores') }}</option>
            <option v-for="s in stores" :key="s.id" :value="s.id">{{ s.name }}</option>
          </select>
          <select v-model="filterType" @change="onFilter"
            class="px-3 py-2 border border-[#E2E8F0] rounded-lg text-sm bg-[#F7F9FC] focus:bg-white
                   focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent
                   text-[#374151] transition-colors">
            <option value="">{{ t('erp.stockMovement.allTypes') }}</option>
            <option value="receive">{{ t('erp.stockMovement.typeReceive') }}</option>
            <option value="adjust">{{ t('erp.stockMovement.typeAdjustment') }}</option>
            <option value="transfer_in">{{ t('erp.stockMovement.typeTransferIn') }}</option>
            <option value="transfer_out">{{ t('erp.stockMovement.typeTransferOut') }}</option>
            <option value="sale">{{ t('erp.stockMovement.typeSale') }}</option>
          </select>
        </div>

        <DataTable :columns="columns" :data="rows" :loading="loading" :total="total" v-model:page="page" :page-size="limit">
          <template #empty>
            <div class="flex flex-col items-center gap-2">
              <div class="w-10 h-10 bg-[#F1F5F9] rounded-xl flex items-center justify-center">
                <ArrowsRightLeftIcon class="w-5 h-5 text-[#9BA7B0]" />
              </div>
              <p class="text-sm text-[#9BA7B0] font-medium">{{ t('erp.stockMovement.noFound') }}</p>
            </div>
          </template>
        </DataTable>
      </div>

    </div>
  </AppLayout>
</template>

<script setup>
import { h, ref, watch, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { createColumnHelper } from '@tanstack/vue-table'
import { ArrowsRightLeftIcon } from '@heroicons/vue/24/outline'
import AppLayout from '@/layouts/AppLayout.vue'
import DataTable from '@/components/DataTable.vue'
import api from '@/api'

const { t } = useI18n()
const route         = useRoute()
const rows          = ref([])
const products      = ref([])
const stores        = ref([])
const total         = ref(0)
const page          = ref(1)
const limit         = 20
const filterProduct = ref(route.query.productId || '')
const filterStore   = ref('')
const filterType    = ref('')
const loading       = ref(false)

const TYPE_BADGE = {
  receive:      'bg-blue-50 text-blue-700',
  adjust:       'bg-purple-50 text-purple-700',
  transfer_in:  'bg-green-50 text-green-700',
  transfer_out: 'bg-orange-50 text-orange-700',
  sale:         'bg-red-50 text-red-700',
}
const typeBadge = (type) => TYPE_BADGE[type] || 'bg-[#F1F5F9] text-[#637381]'
const formatDate = (d) => new Date(d).toLocaleString()

const ch = createColumnHelper()

const columns = [
  ch.accessor('createdAt', {
    header: () => t('erp.stockMovement.colDate'),
    cell: info => h('span', { class: 'text-[#637381] text-xs whitespace-nowrap' }, formatDate(info.getValue())),
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
      params: { page: page.value, limit, productId: filterProduct.value, storeId: filterStore.value, type: filterType.value },
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

function onFilter() { page.value = 1; load() }
watch(page, load)
onMounted(() => { load(); loadLookups() })
</script>
