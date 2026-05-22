<template>
  <AppLayout>
    <div class="space-y-5">

      <!-- Page header -->
      <div class="flex items-center justify-between gap-4">
        <div>
          <h1 class="text-xl font-semibold text-[#1C2434]">{{ t('erp.po.title') }}</h1>
          <p class="text-sm text-[#637381] mt-0.5">
            <template v-if="!loading">{{ total.toLocaleString() }} {{ t('erp.po.records') }}</template>
            <template v-else>{{ t('common.loading') }}</template>
          </p>
        </div>
        <RouterLink v-can="'erp.purchasing.edit'" to="/erp/purchasing/orders/create" class="btn-primary">
          <PlusIcon class="w-4 h-4" />
          {{ t('erp.po.new') }}
        </RouterLink>
      </div>

      <!-- Table card -->
      <div class="bg-white rounded-2xl border border-[#E2E8F0] shadow-sm overflow-hidden">
        <DataTable :columns="columns" :data="orders" :loading="loading" :total="total"
          v-model:page="page" v-model:global-filter="search" :page-size="limit"
          searchable :search-placeholder="t('erp.po.searchPh')">

          <template #toolbar>
            <button @click="showFilters = !showFilters"
              :class="['flex items-center gap-1.5 px-3 py-2 text-sm font-medium border transition-colors whitespace-nowrap',
                (filterStatus || showFilters)
                  ? 'bg-primary-50 border-primary-200 text-primary-600'
                  : 'bg-white border-[#E2E8F0] text-[#637381] hover:bg-slate-50']">
              <AdjustmentsHorizontalIcon class="w-4 h-4" />
              {{ t('common.filters') }}
              <span v-if="filterStatus" class="min-w-[18px] h-[18px] bg-primary-500 text-white text-[10px] rounded-full flex items-center justify-center font-bold leading-none">1</span>
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
              <div v-if="showFilters" class="border-b border-[#E2E8F0] bg-slate-50 px-5 py-4">
                <div class="grid grid-cols-2 sm:grid-cols-3 gap-4">
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
            </Transition>
          </template>

          <template #empty>
            <div class="flex flex-col items-center gap-3 py-4">
              <div class="w-10 h-10 bg-[#F1F5F9] rounded-xl flex items-center justify-center">
                <DocumentTextIcon class="w-5 h-5 text-[#9BA7B0]" />
              </div>
              <p class="text-sm font-medium text-[#637381]">{{ t('erp.po.noFound') }}</p>
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
  PlusIcon, AdjustmentsHorizontalIcon,
  TrashIcon, DocumentTextIcon,
} from '@heroicons/vue/24/outline'
import { createColumnHelper } from '@tanstack/vue-table'
import AppLayout from '@/layouts/AppLayout.vue'
import DataTable from '@/components/DataTable.vue'
import SearchSelect from '@/components/SearchSelect.vue'
import api from '@/api'
import { useAuthStore } from '@/stores/auth'
import { fmtDate } from '@/utils/fmt'

const { t }  = useI18n()
const auth   = useAuthStore()

const STATUS_FILTER_OPTIONS = computed(() => [
  { id: 'draft',     name: t('erp.po.statusDraft') },
  { id: 'confirmed', name: t('erp.po.statusConfirmed') },
  { id: 'received',  name: t('erp.po.statusReceived') },
  { id: 'cancelled', name: t('erp.po.statusCancelled') },
])

const orders       = ref([])
const total        = ref(0)
const page         = ref(1)
const limit        = 20
const search       = ref('')
const filterStatus = ref('')
const showFilters  = ref(false)
const loading      = ref(false)

const statusClass = {
  draft:     'bg-slate-100 text-slate-600',
  confirmed: 'bg-blue-50 text-blue-700',
  received:  'bg-green-50 text-green-700',
  cancelled: 'bg-red-50 text-red-600',
}

async function fetch() {
  loading.value = true
  try {
    const { data } = await api.get('/erp/purchasing/orders', {
      params: { page: page.value, limit, search: search.value || undefined, status: filterStatus.value || undefined },
    })
    orders.value = data.data.orders
    total.value  = data.data.total
  } finally {
    loading.value = false
  }
}

function onFilterChange() { page.value = 1; fetch() }
function clearFilters()   { filterStatus.value = ''; page.value = 1; fetch() }

watch([page, search], fetch)
onMounted(fetch)

async function confirmDelete(row) {
  if (!confirm(`Delete "${row.refNo}"? This cannot be undone.`)) return
  try {
    await api.delete(`/erp/purchasing/orders/${row.id}`)
    fetch()
  } catch (err) {
    alert(err.response?.data?.message || 'Delete failed')
  }
}

const columnHelper = createColumnHelper()
const columns = [
  columnHelper.accessor('refNo', {
    header: () => t('erp.po.colRefNo'),
    cell: info => h(RouterLink, {
      to: `/erp/purchasing/orders/${info.row.original.id}`,
      class: 'font-mono text-sm text-primary-600 hover:underline font-medium',
    }, () => info.getValue()),
  }),
  columnHelper.accessor('date', {
    header: () => t('erp.po.colDate'),
    cell: info => h('span', { class: 'text-sm text-[#374151]' }, fmtDate(info.getValue())),
  }),
  columnHelper.display({
    id: 'vendor',
    header: () => t('erp.po.colVendor'),
    cell: info => {
      const v = info.row.original.vendor
      return h('div', [
        h('p', { class: 'text-sm font-medium text-[#1C2434]' }, v?.name || '—'),
        v?.code ? h('p', { class: 'text-xs text-[#9BA7B0] font-mono' }, v.code) : null,
      ])
    },
  }),
  columnHelper.accessor('deliveryDate', {
    header: () => t('erp.po.colDeliveryDate'),
    cell: info => h('span', { class: 'text-sm text-[#637381]' }, fmtDate(info.getValue()) || '—'),
  }),
  columnHelper.accessor('status', {
    header: () => t('erp.common.status'),
    cell: info => {
      const s   = info.getValue()
      const cls = statusClass[s] || 'bg-slate-100 text-slate-600'
      const lbl = t(`erp.po.status${s.charAt(0).toUpperCase() + s.slice(1)}`)
      return h('span', { class: `inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold capitalize ${cls}` }, lbl)
    },
  }),
  columnHelper.display({
    id: 'actions',
    header: () => '',
    meta: { thClass: 'w-16', tdClass: '' },
    cell: info => h('div', { class: 'flex items-center justify-end gap-1' }, [
      auth.hasPermission('erp.purchasing.delete') && info.row.original.status === 'draft'
        ? h('button', {
            onClick: () => confirmDelete(info.row.original),
            class: 'p-1.5 text-[#9BA7B0] hover:text-red-600 hover:bg-red-50 rounded-md transition-colors',
          }, h(TrashIcon, { class: 'w-4 h-4' }))
        : null,
    ]),
  }),
]
</script>
