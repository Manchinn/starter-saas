<template>
  <AppLayout>
    <div class="space-y-5">

      <div class="flex items-center justify-between gap-4">
        <div>
          <h1 class="text-xl font-semibold text-[#1C2434]">{{ t('erp.saleItems.title') }}</h1>
          <p class="text-sm text-[#637381] mt-0.5">{{ total }} record{{ total !== 1 ? 's' : '' }}</p>
        </div>
        <RouterLink to="/erp/sale-items/create"
          class="btn-primary">
          <PlusIcon class="w-4 h-4" />
          {{ t('erp.saleItems.new') }}
        </RouterLink>
      </div>

      <div class="bg-white rounded-2xl border border-[#E2E8F0] shadow-sm overflow-hidden">

        <div class="px-5 py-3 border-b border-[#E2E8F0] flex items-center gap-3 flex-wrap">
          <div class="relative flex-1 min-w-48 max-w-64">
            <MagnifyingGlassIcon class="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#9BA7B0] pointer-events-none" />
            <input v-model="search" @input="onSearch" type="search" :placeholder="t('erp.saleItems.searchPh')"
              class="input pl-9" />
          </div>
          <select v-model="filterStatus" @change="() => { page = 1; loadItems() }"
            class="input">
            <option value="">{{ t('erp.common.allStatuses') }}</option>
            <option value="active">{{ t('common.active') }}</option>
            <option value="inactive">{{ t('common.inactive') }}</option>
          </select>
        </div>

        <DataTable :columns="columns" :data="items" :loading="loading" :total="total"
          v-model:page="page" :page-size="limit">
          <template #empty>
            <div class="flex flex-col items-center gap-2">
              <div class="w-10 h-10 bg-[#F1F5F9] rounded-xl flex items-center justify-center">
                <TagIcon class="w-5 h-5 text-[#9BA7B0]" />
              </div>
              <p class="text-sm text-[#9BA7B0] font-medium">{{ t('erp.saleItems.noFound') }}</p>
            </div>
          </template>
        </DataTable>

      </div>
    </div>

    <!-- Delete confirm modal -->
    <Teleport to="body">
      <div v-if="deleteModal.open" class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
        <div class="bg-white rounded-xl shadow-xl w-full max-w-sm p-6 space-y-4">
          <h2 class="text-base font-semibold text-[#1C2434]">{{ t('erp.saleItems.deleteSaleItem') }}</h2>
          <p class="text-sm text-[#637381]">
            Delete <span class="font-semibold">{{ deleteModal.item?.name }}</span>? This cannot be undone.
          </p>
          <div v-if="deleteModal.error" class="bg-red-50 border border-red-200 text-red-700 text-sm px-3 py-2 rounded-lg">
            {{ deleteModal.error }}
          </div>
          <div class="flex justify-end gap-3">
            <button @click="deleteModal.open = false"
              class="px-4 py-2 text-sm border border-[#E2E8F0] rounded-lg hover:bg-[#F7F9FC] transition-colors">
              {{ t('common.cancel') }}
            </button>
            <button @click="doDelete" :disabled="deleteModal.saving"
              class="px-5 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors">
              {{ deleteModal.saving ? 'Deleting…' : t('common.delete') }}
            </button>
          </div>
        </div>
      </div>
    </Teleport>
  </AppLayout>
</template>

<script setup>
import { h, ref, reactive, watch, onMounted } from 'vue'
import { RouterLink } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { PlusIcon, MagnifyingGlassIcon, PencilIcon, TrashIcon, TagIcon } from '@heroicons/vue/24/outline'
import { createColumnHelper } from '@tanstack/vue-table'
import AppLayout from '@/layouts/AppLayout.vue'
import DataTable from '@/components/DataTable.vue'
import api from '@/api'

const { t } = useI18n()

const items        = ref([])
const total        = ref(0)
const page         = ref(1)
const limit        = 20
const search       = ref('')
const filterStatus = ref('')
const loading      = ref(false)
let searchTimeout  = null

const deleteModal = reactive({ open: false, item: null, saving: false, error: '' })

async function loadItems() {
  loading.value = true
  try {
    const { data } = await api.get('/erp/sale-items', {
      params: { page: page.value, limit, search: search.value, status: filterStatus.value || undefined },
    })
    items.value = data.data.items
    total.value = data.data.total
  } finally { loading.value = false }
}

function onSearch() { clearTimeout(searchTimeout); searchTimeout = setTimeout(() => { page.value = 1; loadItems() }, 300) }
watch(page, loadItems)
onMounted(loadItems)

function confirmDelete(item) { deleteModal.item = item; deleteModal.error = ''; deleteModal.open = true }

async function doDelete() {
  deleteModal.saving = true; deleteModal.error = ''
  try { await api.delete(`/erp/sale-items/${deleteModal.item.id}`); deleteModal.open = false; loadItems() }
  catch (err) { deleteModal.error = err.response?.data?.message || 'Delete failed' }
  finally { deleteModal.saving = false }
}

const columnHelper = createColumnHelper()

const columns = [
  columnHelper.accessor('code', {
    header: () => t('erp.saleItems.colCode'),
    cell: info => h('span', { class: 'font-mono text-xs text-[#637381]' }, info.getValue() || '—'),
  }),
  columnHelper.accessor('name', {
    header: () => t('erp.saleItems.colName'),
    cell: info => info.getValue() || '—',
  }),
  columnHelper.display({
    id: 'product',
    header: () => t('erp.saleItems.colProductMaster'),
    cell: info => {
      const item = info.row.original
      if (item.product) {
        return h('span', {}, [
          item.product.name,
          item.product.sku ? h('span', { class: 'ml-1 text-xs text-[#9BA7B0] font-mono' }, `(${item.product.sku})`) : null,
        ])
      }
      return h('span', { class: 'text-[#CBD5E1]' }, '—')
    },
  }),
  columnHelper.accessor('status', {
    header: () => t('erp.saleItems.colStatus'),
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
        to: `/erp/sale-items/${info.row.original.id}/edit`,
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
