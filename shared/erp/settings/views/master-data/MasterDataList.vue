<template>
  <AppLayout>
    <div class="space-y-5">

      <!-- Header -->
      <div class="flex items-center justify-between gap-4">
        <div>
          <h1 class="text-xl font-semibold text-[#1C2434]">{{ t('erp.masterData.title') }}</h1>
          <p class="text-sm text-[#637381] mt-0.5">{{ filtered.length }} {{ t('erp.masterData.title').toLowerCase() }}</p>
        </div>
        <RouterLink to="/erp/settings/master-data/create" class="btn-primary">
          <PlusIcon class="w-4 h-4" />
          {{ t('erp.masterData.new') }}
        </RouterLink>
      </div>

      <!-- Table card -->
      <div class="bg-white rounded-2xl border border-[#E2E8F0] shadow-sm overflow-hidden">

        <!-- Filter bar -->
        <div class="px-5 py-3 border-b border-[#E2E8F0] flex items-center gap-3">
          <div class="relative flex-1 min-w-48 max-w-64">
            <MagnifyingGlassIcon class="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#9BA7B0] pointer-events-none" />
            <input v-model="search" type="search" :placeholder="t('common.search')"
              class="input pl-9" />
          </div>
        </div>

        <DataTable :columns="columns" :data="filtered" :loading="store.loading"
          :total="filtered.length" :page="1" :page-size="filtered.length || 1"
          :initial-sorting="[{ id: 'name', desc: true }]">
          <template #empty>
            <div class="flex flex-col items-center gap-2">
              <div class="w-10 h-10 bg-[#F1F5F9] rounded-xl flex items-center justify-center">
                <CircleStackIcon class="w-5 h-5 text-[#9BA7B0]" />
              </div>
              <p class="text-sm text-[#9BA7B0] font-medium">{{ t('erp.masterData.noFound') }}</p>
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
import {
  PlusIcon, MagnifyingGlassIcon, CircleStackIcon, PencilIcon, TrashIcon,
} from '@heroicons/vue/24/outline'
import { createColumnHelper } from '@tanstack/vue-table'
import AppLayout from '@/layouts/AppLayout.vue'
import DataTable from '@/components/DataTable.vue'
import { useMasterDataStore } from '@/stores/masterData'

const { t }  = useI18n()
const store  = useMasterDataStore()
const search = ref('')

onMounted(() => store.fetchAll())

const filtered = computed(() => {
  const q = search.value.trim().toLowerCase()
  if (!q) return store.categories
  return store.categories.filter(c =>
    c.name.toLowerCase().includes(q) ||
    c.slug.toLowerCase().includes(q) ||
    (c.description || '').toLowerCase().includes(q)
  )
})

async function confirmDelete(cat) {
  if (!confirm(t('erp.masterData.confirmDelete', { name: cat.name }))) return
  try {
    await store.deleteCategory(cat.id)
  } catch (err) {
    alert(err.response?.data?.message || t('erp.masterData.saveFailed'))
  }
}

const columnHelper = createColumnHelper()

const columns = [
  columnHelper.accessor('slug', {
    header: () => t('common.code'),
    cell: info => h('span', {
      class: 'font-mono text-xs text-[#637381] bg-[#F7F9FC] border border-[#E2E8F0] px-2 py-0.5 rounded',
    }, info.getValue()),
  }),
  columnHelper.accessor('name', {
    header: () => t('common.name'),
    cell: info => {
      const cat = info.row.original
      return h('div', { class: 'flex items-center gap-2.5' }, [
        h('div', { class: 'w-7 h-7 bg-primary-50 flex items-center justify-center flex-shrink-0' },
          h(CircleStackIcon, { class: 'w-3.5 h-3.5 text-primary-500' })
        ),
        h('span', { class: 'font-semibold text-[#1C2434]' }, cat.name),
        cat.isSystem
          ? h('span', {
              class: 'px-1.5 py-0.5 bg-amber-50 text-amber-600 border border-amber-200 text-[10px] font-semibold rounded uppercase tracking-wide',
            }, t('erp.masterData.systemBadge'))
          : null,
      ])
    },
  }),
  columnHelper.accessor('description', {
    header: () => t('common.description'),
    enableSorting: false,
    cell: info => h('span', { class: 'text-sm text-[#9BA7B0]' }, info.getValue() || '—'),
    meta: { tdClass: 'max-w-xs truncate' },
  }),
  columnHelper.accessor(row => row._count?.values ?? row.valuesCount ?? 0, {
    id: 'valuesCount',
    header: () => t('erp.masterData.valuesCount'),
    meta: { thClass: 'text-center', tdClass: 'text-center' },
    cell: info => h('span', {
      class: 'inline-flex items-center justify-center min-w-[2rem] px-2 py-0.5 bg-[#F1F5F9] text-[#637381] text-xs font-semibold rounded-full tabular-nums',
    }, String(info.getValue())),
  }),
  columnHelper.display({
    id: 'actions',
    header: () => '',
    enableSorting: false,
    meta: { thClass: 'w-24', tdClass: '' },
    cell: info => {
      const cat = info.row.original
      return h('div', { class: 'flex items-center justify-end gap-1' }, [
        h(RouterLink, {
          to: `/erp/settings/master-data/${cat.id}`,
          class: 'p-1.5 text-[#9BA7B0] hover:text-primary-500 hover:bg-primary-50 rounded-md transition-colors',
          title: t('common.edit'),
        }, () => h(PencilIcon, { class: 'w-4 h-4' })),
        !cat.isSystem
          ? h('button', {
              onClick: () => confirmDelete(cat),
              class: 'p-1.5 text-[#9BA7B0] hover:text-red-600 hover:bg-red-50 rounded-md transition-colors',
              title: t('common.delete'),
            }, h(TrashIcon, { class: 'w-4 h-4' }))
          : null,
      ])
    },
  }),
]
</script>
