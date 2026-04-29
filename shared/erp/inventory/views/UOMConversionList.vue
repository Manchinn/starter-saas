<template>
  <AppLayout>
    <div class="space-y-6">

      <div class="flex items-center justify-between gap-4">
        <div>
          <h1 class="text-xl font-semibold text-[#1C2434]">{{ t('erp.uomConversion.title') }}</h1>
          <p class="text-sm text-[#637381] mt-0.5">{{ conversions.length }} conversion{{ conversions.length !== 1 ? 's' : '' }}</p>
        </div>
        <RouterLink to="/erp/uom-conversion/create" class="btn-primary">
          <PlusIcon class="w-4 h-4" />
          {{ t('erp.uomConversion.new') }}
        </RouterLink>
      </div>

      <div class="bg-white rounded-2xl border border-[#E2E8F0] overflow-hidden">
        <DataTable :columns="columns" :data="conversions" :loading="loading" :total="conversions.length"
          v-model:page="page" :page-size="conversions.length || 20">
          <template #empty>
            <p class="text-sm text-[#9BA7B0]">{{ t('erp.uomConversion.noFound') }}</p>
          </template>
        </DataTable>
      </div>

    </div>

  </AppLayout>
</template>

<script setup>
import { h, ref, onMounted } from 'vue'
import { RouterLink } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { createColumnHelper } from '@tanstack/vue-table'
import { PlusIcon } from '@heroicons/vue/24/outline'
import AppLayout from '@/layouts/AppLayout.vue'
import DataTable from '@/components/DataTable.vue'
import api from '@/api'

const { t } = useI18n()

const conversions = ref([])
const loading     = ref(false)
const page        = ref(1)

async function load() {
  loading.value = true
  try {
    const { data } = await api.get('/erp/uom-conversion')
    conversions.value = data.data.conversions
  } finally {
    loading.value = false
  }
}

onMounted(load)

async function confirmDelete(c) {
  if (!confirm(`Delete conversion "${c.fromUom?.abbreviation} → ${c.toUom?.abbreviation}"?`)) return
  try {
    await api.delete(`/erp/uom-conversion/${c.id}`)
    load()
  } catch (err) {
    alert(err.response?.data?.message || 'Delete failed')
  }
}

const columnHelper = createColumnHelper()

const columns = [
  columnHelper.display({
    id: 'fromUom',
    header: () => t('erp.uomConversion.colFromUom'),
    cell: info => h('span', {}, [
      h('span', { class: 'font-medium text-[#1C2434]' }, info.row.original.fromUom?.name),
      h('span', { class: 'ml-1 text-xs text-[#9BA7B0] font-mono' }, `(${info.row.original.fromUom?.abbreviation})`),
    ]),
  }),
  columnHelper.display({
    id: 'arrow',
    header: () => '→',
    meta: { thClass: 'text-center', tdClass: 'text-center text-[#9BA7B0]' },
    cell: () => '→',
  }),
  columnHelper.display({
    id: 'toUom',
    header: () => t('erp.uomConversion.colToUom'),
    cell: info => h('span', {}, [
      h('span', { class: 'font-medium text-[#1C2434]' }, info.row.original.toUom?.name),
      h('span', { class: 'ml-1 text-xs text-[#9BA7B0] font-mono' }, `(${info.row.original.toUom?.abbreviation})`),
    ]),
  }),
  columnHelper.accessor('factor', {
    header: () => t('erp.uomConversion.colFactor'),
    cell: info => h('span', { class: 'font-mono font-semibold text-primary-500' }, String(Number(info.getValue()))),
    meta: { thClass: 'text-right', tdClass: 'text-right' },
  }),
  columnHelper.accessor('notes', {
    header: () => t('erp.uomConversion.colNotes'),
    cell: info => h('span', { class: 'text-xs text-[#637381]' }, info.getValue() || '—'),
  }),
  columnHelper.display({
    id: 'actions',
    header: () => t('erp.uomConversion.colActions'),
    meta: { thClass: 'text-right', tdClass: 'text-right whitespace-nowrap' },
    cell: info => h('span', {}, [
      h(RouterLink, {
        to: `/erp/uom-conversion/${info.row.original.id}/edit`,
        class: 'text-primary-500 hover:underline text-xs mr-3',
      }, () => t('common.edit')),
      h('button', {
        onClick: () => confirmDelete(info.row.original),
        class: 'text-red-500 hover:underline text-xs',
      }, t('common.delete')),
    ]),
  }),
]
</script>
