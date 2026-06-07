<template>
  <AppLayout>
    <div class="space-y-5">

      <PageHeader :title="t('erp.uomConversion.title')"
        :breadcrumb="[{ label: `${total} record${total !== 1 ? 's' : ''}` }]">
        <template #actions>
          <KeyboardShortcuts :shortcuts="shortcuts" />

          <RouterLink to="/erp/uom-conversion/create" class="btn-primary">
            <PlusIcon class="w-4 h-4" />
            {{ t('erp.uomConversion.new') }}
          </RouterLink>
        </template>
      </PageHeader>

      <div class="bg-white border border-[#E2E8F0] shadow-sm overflow-hidden">

        <div class="px-5 py-3 border-b border-[#E2E8F0] flex items-center gap-3">
          <div class="relative flex-1 min-w-0">
            <MagnifyingGlassIcon class="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#9BA7B0] pointer-events-none" />
            <input ref="searchInputRef" v-model="search" type="search" :placeholder="t('erp.uomConversion.searchPh')"
              class="input pl-9 w-full" />
          </div>
        </div>

        <DataTable ref="dataTableRef" :columns="columns" :data="filtered" :loading="loading" :total="filtered.length"
          v-model:page="page" :page-size="20"
          :selected-row-index="selectedRowIndex" row-clickable @row-click="openRow">
          <template #empty>
            <EmptyState :icon="ArrowsRightLeftIcon" :title="t('erp.uomConversion.noFound')"
              :subtitle="search ? t('erp.uomConversion.tryDifferentSearch') : ''" padding="md" />
          </template>
        </DataTable>

      </div>
    </div>

    <!-- Delete confirm modal -->
    <Teleport to="body">
      <div v-if="deleteModal.open" class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
        <div class="bg-white shadow-xl w-full max-w-sm p-6 space-y-4">
          <h2 class="text-base font-semibold text-[#1C2434]">{{ t('erp.uomConversion.deleteTitle') }}</h2>
          <p class="text-sm text-[#637381]">
            {{ t('erp.uomConversion.deleteConfirm') }}
            <span class="font-mono font-semibold text-[#1C2434]">
              {{ deleteModal.item?.fromUom?.abbreviation }} → {{ deleteModal.item?.toUom?.abbreviation }}
            </span>
          </p>
          <ErrorBanner :message="deleteModal.error" />
          <div class="flex justify-end gap-3">
            <button @click="deleteModal.open = false"
              class="px-4 py-2 text-sm border border-[#E2E8F0] hover:bg-[#F7F9FC] transition-colors">
              {{ t('common.cancel') }}
            </button>
            <button @click="doDelete" :disabled="deleteModal.saving"
              class="px-5 py-2 text-sm bg-red-600 text-white hover:bg-red-700 disabled:opacity-50 transition-colors">
              {{ deleteModal.saving ? t('erp.common.deleting') : t('common.delete') }}
            </button>
          </div>
        </div>
      </div>
    </Teleport>
  </AppLayout>
</template>

<script setup>
import { h, ref, computed, reactive, onMounted } from 'vue'
import { RouterLink, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { createColumnHelper } from '@tanstack/vue-table'
import {
  PlusIcon, MagnifyingGlassIcon, PencilIcon, TrashIcon, ArrowsRightLeftIcon,
} from '@heroicons/vue/24/outline'
import AppLayout from '@/layouts/AppLayout.vue'
import DataTable from '@/components/DataTable.vue'
import KeyboardShortcuts from '@/components/KeyboardShortcuts.vue'
import PageHeader from '@/components/form/PageHeader.vue'
import EmptyState from '@/components/form/EmptyState.vue'
import ErrorBanner from '@/components/form/ErrorBanner.vue'
import { useListShortcuts } from '@/composables/useShortcuts'
import api from '@/api'

const { t } = useI18n()
const router = useRouter()

const conversions    = ref([])
const loading        = ref(false)
const page           = ref(1)
const search         = ref('')
const dataTableRef   = ref(null)
const searchInputRef = ref(null)

const deleteModal = reactive({ open: false, item: null, saving: false, error: '' })

const total = computed(() => conversions.value.length)

const filtered = computed(() => {
  const q = search.value.trim().toLowerCase()
  if (!q) return conversions.value
  return conversions.value.filter(c =>
    (c.fromUom?.name || '').toLowerCase().includes(q) ||
    (c.fromUom?.abbreviation || '').toLowerCase().includes(q) ||
    (c.toUom?.name || '').toLowerCase().includes(q) ||
    (c.toUom?.abbreviation || '').toLowerCase().includes(q) ||
    (c.notes || '').toLowerCase().includes(q)
  )
})

const totalPages = computed(() => Math.ceil(filtered.value.length / 20))

const { selectedIndex: selectedRowIndex, shortcuts, open: openRow } = useListShortcuts({
  rows: filtered, page, totalPages,
  open:        c => router.push(`/erp/uom-conversion/${c.id}/edit`),
  create:      () => router.push('/erp/uom-conversion/create'),
  remove:      c => confirmDelete(c),
  focusSearch: () => searchInputRef.value?.focus(),
  newLabel: 'New conversion',
})

async function load() {
  loading.value = true
  try {
    const { data } = await api.get('/erp/uom-conversion')
    conversions.value = data.data.conversions
    selectedRowIndex.value = -1
  } finally {
    loading.value = false
  }
}
onMounted(load)

function confirmDelete(item) {
  deleteModal.item = item
  deleteModal.error = ''
  deleteModal.open = true
}

async function doDelete() {
  deleteModal.saving = true
  deleteModal.error = ''
  try {
    await api.delete(`/erp/uom-conversion/${deleteModal.item.id}`)
    deleteModal.open = false
    await load()
  } catch (err) {
    deleteModal.error = err.response?.data?.message || t('erp.uomConversion.deleteFailed')
  } finally {
    deleteModal.saving = false
  }
}

const columnHelper = createColumnHelper()

const columns = [
  columnHelper.display({
    id: 'fromUom',
    header: () => t('erp.uomConversion.colFromUom'),
    cell: info => h('span', {}, [
      h('span', { class: 'font-medium text-[#1C2434]' }, info.row.original.fromUom?.name || '—'),
      info.row.original.fromUom?.abbreviation
        ? h('span', { class: 'ml-1 text-xs text-[#9BA7B0] font-mono' }, `(${info.row.original.fromUom.abbreviation})`)
        : null,
    ]),
  }),
  columnHelper.display({
    id: 'arrow',
    header: () => '',
    meta: { thClass: 'w-10 text-center', tdClass: 'text-center text-[#CBD5E1]' },
    cell: () => h(ArrowsRightLeftIcon, { class: 'w-4 h-4 inline-block' }),
  }),
  columnHelper.display({
    id: 'toUom',
    header: () => t('erp.uomConversion.colToUom'),
    cell: info => h('span', {}, [
      h('span', { class: 'font-medium text-[#1C2434]' }, info.row.original.toUom?.name || '—'),
      info.row.original.toUom?.abbreviation
        ? h('span', { class: 'ml-1 text-xs text-[#9BA7B0] font-mono' }, `(${info.row.original.toUom.abbreviation})`)
        : null,
    ]),
  }),
  columnHelper.accessor('factor', {
    header: () => t('erp.uomConversion.colFactor'),
    cell: info => h('span', { class: 'font-mono font-semibold text-primary-600 tabular-nums' }, String(Number(info.getValue()))),
    meta: { thClass: 'text-right w-32', tdClass: 'text-right' },
  }),
  columnHelper.accessor('notes', {
    header: () => t('erp.uomConversion.colNotes'),
    cell: info => h('span', { class: 'text-xs text-[#637381]' }, info.getValue() || '—'),
  }),
  columnHelper.display({
    id: 'actions',
    header: () => '',
    meta: { thClass: 'w-20', tdClass: '' },
    cell: info => h('div', { class: 'flex items-center justify-end gap-1' }, [
      h(RouterLink, {
        to: `/erp/uom-conversion/${info.row.original.id}/edit`,
        class: 'p-1.5 text-[#9BA7B0] hover:text-primary-500 hover:bg-primary-50 transition-colors',
        title: t('common.edit'),
      }, () => h(PencilIcon, { class: 'w-4 h-4' })),
      h('button', {
        onClick: () => confirmDelete(info.row.original),
        class: 'p-1.5 text-[#9BA7B0] hover:text-red-600 hover:bg-red-50 transition-colors',
        title: t('common.delete'),
      }, h(TrashIcon, { class: 'w-4 h-4' })),
    ]),
  }),
]
</script>
