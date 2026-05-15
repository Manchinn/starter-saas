<template>
  <AppLayout>
    <div class="space-y-5">

      <div class="flex items-center justify-between gap-4">
        <div>
          <h1 class="text-xl font-semibold text-[#1C2434]">{{ t('erp.billingNotes.title') }}</h1>
          <p class="text-sm text-[#637381] mt-0.5">{{ total }} billing note{{ total !== 1 ? 's' : '' }}</p>
        </div>
        <RouterLink
          v-can="'erp.accounting.edit'"
          to="/erp/billing/billing-notes/create"
          class="btn-primary">
          <PlusIcon class="w-4 h-4" />
          {{ t('erp.billingNotes.new') }}
        </RouterLink>
      </div>

      <div class="bg-white rounded-2xl border border-[#E2E8F0] shadow-sm overflow-hidden">

        <!-- Toolbar -->
        <div class="px-5 py-3 border-b border-[#E2E8F0] flex items-center gap-3">
          <div class="relative flex-1 min-w-0">
            <MagnifyingGlassIcon class="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#9BA7B0] pointer-events-none" />
            <input v-model="search" @input="onSearch" type="search" :placeholder="t('erp.billingNotes.searchPh')"
              class="input pl-9 w-full" />
          </div>
          <select v-model="filterStatus" @change="onFilterChange" class="input text-sm w-40">
            <option value="">{{ t('erp.common.allStatuses') }}</option>
            <option value="draft">{{ t('erp.common.draft') }}</option>
            <option value="sent">{{ t('erp.billingNotes.statusSent') }}</option>
            <option value="paid">{{ t('erp.billingNotes.statusPaid') }}</option>
            <option value="cancelled">{{ t('erp.common.cancelled') }}</option>
          </select>
        </div>

        <DataTable :columns="columns" :data="billingNotes" :loading="loading" :total="total"
          v-model:page="page" :page-size="limit">
          <template #empty>
            <div class="flex flex-col items-center gap-3 py-4">
              <div class="w-10 h-10 bg-[#F1F5F9] rounded-xl flex items-center justify-center">
                <DocumentTextIcon class="w-5 h-5 text-[#9BA7B0]" />
              </div>
              <div class="text-center">
                <p class="text-sm font-medium text-[#637381]">{{ t('erp.billingNotes.noFound') }}</p>
                <p v-if="filterStatus" class="text-xs text-[#9BA7B0] mt-1">{{ t('common.tryAdjustingFilters') }}</p>
              </div>
            </div>
          </template>
        </DataTable>

      </div>
    </div>
  </AppLayout>
</template>

<script setup>
import { h, ref, watch, onMounted } from 'vue'
import { RouterLink } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { PlusIcon, MagnifyingGlassIcon, EyeIcon, DocumentTextIcon } from '@heroicons/vue/24/outline'
import { createColumnHelper } from '@tanstack/vue-table'
import AppLayout from '@/layouts/AppLayout.vue'
import DataTable from '@/components/DataTable.vue'
import api from '@/api'
import { fmtMoney } from '@/utils/fmt'

const { t } = useI18n()

const billingNotes  = ref([])
const total         = ref(0)
const page          = ref(1)
const limit         = 20
const search        = ref('')
const filterStatus  = ref('')
const loading       = ref(false)
let searchTimeout   = null

async function fetchBillingNotes() {
  loading.value = true
  try {
    const { data } = await api.get('/erp/billing/billing-notes', {
      params: { page: page.value, limit, search: search.value, status: filterStatus.value || undefined },
    })
    billingNotes.value = data.data.billingNotes
    total.value        = data.data.total
  } finally {
    loading.value = false
  }
}

function onSearch() {
  clearTimeout(searchTimeout)
  searchTimeout = setTimeout(() => { page.value = 1; fetchBillingNotes() }, 350)
}
function onFilterChange() { page.value = 1; fetchBillingNotes() }

watch(page, fetchBillingNotes)
onMounted(fetchBillingNotes)

const STATUS_STYLE = {
  draft:     { badge: 'bg-[#F1F5F9] text-[#637381]',  dot: 'bg-slate-400' },
  sent:      { badge: 'bg-blue-50 text-blue-700',   dot: 'bg-blue-500' },
  paid:      { badge: 'bg-green-50 text-green-700', dot: 'bg-green-500' },
  cancelled: { badge: 'bg-red-50 text-red-600',     dot: 'bg-red-500' },
}
function statusClass(s) { return (STATUS_STYLE[s] || STATUS_STYLE.draft).badge }
function statusDot(s)   { return (STATUS_STYLE[s] || STATUS_STYLE.draft).dot }

const columnHelper = createColumnHelper()
const columns = [
  columnHelper.accessor('refNo', {
    header: () => t('erp.billingNotes.colRefNo'),
    cell: info => h('span', { class: 'font-mono text-sm font-medium text-[#1C2434]' }, info.getValue()),
  }),
  columnHelper.display({
    id: 'customer',
    header: () => t('erp.common.customer'),
    cell: info => info.row.original.customer?.name || '—',
  }),
  columnHelper.accessor('date', {
    header: () => t('erp.common.date'),
    cell: info => h('span', { class: 'text-xs' }, info.getValue()),
  }),
  columnHelper.accessor('dueDate', {
    header: () => t('erp.billingNotes.colDueDate'),
    cell: info => h('span', { class: 'text-xs text-[#637381]' }, info.getValue() || '—'),
  }),
  columnHelper.accessor('total', {
    header: () => t('erp.billingNotes.colTotal'),
    cell: info => fmtMoney(info.getValue()),
    meta: { thClass: 'text-right', tdClass: 'text-right font-semibold text-[#1C2434] tabular-nums' },
  }),
  columnHelper.accessor('status', {
    header: () => t('common.status'),
    cell: info => {
      const s = info.getValue()
      return h('span', {
        class: `inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold capitalize ${statusClass(s)}`
      }, [
        h('span', { class: `w-1.5 h-1.5 rounded-full ${statusDot(s)}` }),
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
        to: `/erp/billing/billing-notes/${info.row.original.id}`,
        class: 'p-1.5 text-[#9BA7B0] hover:text-primary-500 hover:bg-primary-50 rounded-md transition-colors',
        title: 'View',
      }, () => h(EyeIcon, { class: 'w-4 h-4' })),
    ]),
  }),
]
</script>
