<template>
  <AppLayout>
    <div class="space-y-5">

      <div class="flex items-center justify-between gap-4">
        <div>
          <h1 class="text-xl font-semibold text-[#1C2434]">{{ t('erp.settings.seqTitle') }}</h1>
          <p class="text-sm text-[#637381] mt-0.5">{{ t('erp.settings.seqDesc') }}</p>
        </div>
        <RouterLink to="/erp/settings/sequence/create" class="btn-primary">
          <PlusIcon class="w-4 h-4" />
          {{ t('erp.settings.newSeq') }}
        </RouterLink>
      </div>

      <!-- Format hint -->
      <div class="bg-blue-50 border border-blue-100 px-5 py-4">
        <p class="text-sm font-semibold text-blue-800 mb-2">{{ t('erp.settings.formatTokens') }}</p>
        <div class="flex flex-wrap gap-x-6 gap-y-1.5 text-xs text-blue-700">
          <span><code class="bg-blue-100 px-1.5 py-0.5 font-mono">{####}</code> → padded number</span>
          <span><code class="bg-blue-100 px-1.5 py-0.5 font-mono">{YYYY}</code> → 4-digit year</span>
          <span><code class="bg-blue-100 px-1.5 py-0.5 font-mono">{YY}</code> → 2-digit year</span>
          <span><code class="bg-blue-100 px-1.5 py-0.5 font-mono">{MM}</code> → month</span>
          <span><code class="bg-blue-100 px-1.5 py-0.5 font-mono">{DD}</code> → day</span>
        </div>
        <p class="mt-2 text-xs text-blue-600">
          Example: <code class="bg-blue-100 px-1.5 py-0.5 font-mono">GR-{YYYY}{MM}-{####}</code>
          → <strong>GR-202504-0001</strong>
        </p>
      </div>

      <div class="bg-white border border-[#E2E8F0] shadow-sm overflow-hidden">
        <DataTable :columns="columns" :data="rows" :loading="loading" :total="rows.length" :page-size="9999"
          row-clickable @row-click="openRow">
          <template #empty>
            <p class="text-center text-sm text-[#9BA7B0] font-medium">{{ t('erp.settings.noSeqs') }}</p>
          </template>
        </DataTable>
      </div>

    </div>
  </AppLayout>
</template>

<script setup>
import { h, ref, onMounted } from 'vue'
import { RouterLink, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { createColumnHelper } from '@tanstack/vue-table'
import { PlusIcon, PencilIcon, TrashIcon } from '@heroicons/vue/24/outline'
import AppLayout from '@/layouts/AppLayout.vue'
import DataTable from '@/components/DataTable.vue'
import api from '@/api'

const { t } = useI18n()
const router = useRouter()

function openRow(r) { router.push(`/erp/settings/sequence/${r.id}/edit`) }

const rows    = ref([])
const loading = ref(false)

const BUILT_IN = ['GR', 'ADJ', 'CNT', 'STR', 'RTN']
const isBuiltIn = (code) => BUILT_IN.includes(code)

const RESEED_CLASSES = {
  F: 'bg-[#F1F5F9] text-[#637381]',
  D: 'bg-blue-50 text-blue-700',
  M: 'bg-purple-50 text-purple-700',
  Y: 'bg-orange-50 text-orange-700',
}
const reseedLabel = (p) => ({ F: t('erp.settings.fixed'), D: t('erp.settings.daily'), M: t('erp.settings.monthly'), Y: t('erp.settings.yearly') })[p] || p
const reseedClass = (p) => RESEED_CLASSES[p] || 'bg-[#F1F5F9] text-[#637381]'

const ch = createColumnHelper()

const columns = [
  ch.accessor('code', {
    header: () => t('erp.settings.seqColCode'),
    cell: info => h('span', { class: 'font-mono font-bold text-[#1C2434]' }, info.getValue()),
  }),
  ch.accessor('name', {
    header: () => t('erp.settings.seqColName'),
    cell: info => h('span', { class: 'text-[#374151]' }, info.getValue()),
  }),
  ch.accessor('format', {
    header: () => t('erp.settings.seqColFormat'),
    cell: info => h('span', { class: 'font-mono text-xs text-[#637381]' }, info.getValue()),
  }),
  ch.accessor('runningValue', {
    header: () => t('erp.settings.seqColRunning'),
    meta: { thClass: 'text-right', tdClass: 'text-right' },
    cell: info => h('span', { class: 'font-semibold text-[#1C2434] tabular-nums' }, info.getValue()),
  }),
  ch.accessor('reseedPeriod', {
    header: () => t('erp.settings.seqColReseed'),
    cell: info => h('span', {
      class: `inline-flex items-center px-2.5 py-1 text-xs font-semibold ${reseedClass(info.getValue())}`,
    }, reseedLabel(info.getValue())),
  }),
  ch.accessor('preview', {
    header: () => t('erp.settings.seqColNextRef'),
    cell: info => h('span', { class: 'font-mono text-xs font-semibold text-primary-500' }, info.getValue()),
  }),
  ch.display({
    id: 'actions',
    meta: { thClass: 'w-20' },
    cell: ({ row }) => {
      const r = row.original
      return h('div', { class: 'flex items-center justify-end gap-1' }, [
        h(RouterLink, {
          to: `/erp/settings/sequence/${r.id}/edit`,
          class: 'p-1.5 text-[#9BA7B0] hover:text-primary-500 hover:bg-primary-50 transition-colors',
          title: 'Edit',
        }, () => h(PencilIcon, { class: 'w-4 h-4' })),
        !isBuiltIn(r.code) && h('button', {
          onClick: () => deleteRow(r),
          class: 'p-1.5 text-[#9BA7B0] hover:text-red-600 hover:bg-red-50 transition-colors',
          title: 'Delete',
        }, h(TrashIcon, { class: 'w-4 h-4' })),
      ].filter(Boolean))
    },
  }),
]

async function load() {
  loading.value = true
  try {
    const { data } = await api.get('/erp/sequences')
    rows.value = data.data.sequences
  } finally { loading.value = false }
}

async function deleteRow(row) {
  if (!confirm(`Delete sequence '${row.code}'? This cannot be undone.`)) return
  try { await api.delete(`/erp/sequences/${row.id}`); load() }
  catch (err) { alert(err.response?.data?.message || 'Delete failed') }
}

onMounted(load)
</script>
