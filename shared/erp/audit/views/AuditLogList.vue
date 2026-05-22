<template>
  <AppLayout>
    <div class="space-y-5">
      <div class="flex items-center justify-between gap-4">
        <div>
          <h1 class="text-xl font-semibold text-[#1C2434]">{{ t('erp.audit.title') }}</h1>
          <p class="text-sm text-[#637381] mt-0.5">{{ total }} record{{ total !== 1 ? 's' : '' }}</p>
        </div>
      </div>

      <!-- Filters -->
      <div class="bg-white rounded-2xl border border-[#E2E8F0] p-4 grid grid-cols-1 sm:grid-cols-4 gap-3">
        <div>
          <label class="block text-xs font-medium text-[#637381] mb-1">{{ t('erp.audit.entityType') }}</label>
          <SearchSelect v-model="filterEntityType" :options="entityTypeOptions" :placeholder="t('common.all')" @change="onFilter" />
        </div>
        <div>
          <label class="block text-xs font-medium text-[#637381] mb-1">{{ t('erp.audit.action') }}</label>
          <input v-model="filterAction" @input="onSearch" type="search" :placeholder="t('erp.audit.actionPh')" class="input text-sm" />
        </div>
        <div>
          <label class="block text-xs font-medium text-[#637381] mb-1">{{ t('common.dateFrom') }}</label>
          <DateInput v-model="filterDateFrom" @change="onFilter" class="input text-sm" />
        </div>
        <div>
          <label class="block text-xs font-medium text-[#637381] mb-1">{{ t('common.dateTo') }}</label>
          <DateInput v-model="filterDateTo" @change="onFilter" class="input text-sm" />
        </div>
      </div>

      <!-- Table -->
      <div class="bg-white rounded-2xl border border-[#E2E8F0] shadow-sm overflow-hidden">
        <table class="w-full text-sm">
          <thead class="bg-[#F7F9FC] border-b border-[#E2E8F0] text-left">
            <tr>
              <th class="px-4 py-2.5 font-medium text-[#637381] w-44">{{ t('erp.audit.colWhen') }}</th>
              <th class="px-4 py-2.5 font-medium text-[#637381] w-52">{{ t('erp.audit.colUser') }}</th>
              <th class="px-4 py-2.5 font-medium text-[#637381] w-40">{{ t('erp.audit.colAction') }}</th>
              <th class="px-4 py-2.5 font-medium text-[#637381] w-48">{{ t('erp.audit.colEntity') }}</th>
              <th class="px-4 py-2.5 font-medium text-[#637381]">{{ t('erp.audit.colSummary') }}</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-[#E2E8F0]">
            <tr v-if="loading">
              <td colspan="5" class="py-8 text-center text-[#9BA7B0]">{{ t('common.loading') }}</td>
            </tr>
            <tr v-else-if="!logs.length">
              <td colspan="5" class="py-8 text-center text-[#9BA7B0]">{{ t('erp.audit.noLogs') }}</td>
            </tr>
            <tr v-for="l in logs" :key="l.id" class="hover:bg-[#F7F9FC]">
              <td class="px-4 py-2 text-xs text-[#637381] tabular-nums">{{ fmtDateTime(l.createdAt) }}</td>
              <td class="px-4 py-2 text-xs">{{ l.userEmail || '—' }}</td>
              <td class="px-4 py-2">
                <span class="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-mono bg-[#F1F5F9] text-[#374151]">{{ l.action }}</span>
              </td>
              <td class="px-4 py-2 text-xs">
                <p class="font-medium text-[#1C2434]">{{ l.entityType }}</p>
                <p v-if="l.entityId" class="font-mono text-[10px] text-[#9BA7B0]">{{ l.entityId.slice(0, 8) }}…</p>
              </td>
              <td class="px-4 py-2 text-xs text-[#637381]">
                <code v-if="l.summary" class="text-[11px]">{{ summarize(l.summary) }}</code>
                <span v-else class="text-[#CBD5E1]">—</span>
              </td>
            </tr>
          </tbody>
        </table>

        <div v-if="total > limit" class="px-4 py-3 border-t border-[#E2E8F0] flex items-center justify-between text-xs text-[#637381]">
          <span>{{ t('common.showing') }} {{ (page - 1) * limit + 1 }}–{{ Math.min(page * limit, total) }} {{ t('common.of') }} {{ total }}</span>
          <div class="flex items-center gap-2">
            <button @click="page = Math.max(1, page - 1); load()" :disabled="page === 1"
              class="px-3 py-1 border hover:bg-slate-50 disabled:opacity-40">&larr;</button>
            <span class="px-2">{{ page }} / {{ Math.ceil(total / limit) }}</span>
            <button @click="page = Math.min(Math.ceil(total / limit), page + 1); load()" :disabled="page * limit >= total"
              class="px-3 py-1 border rounded-md hover:bg-slate-50 disabled:opacity-40">&rarr;</button>
          </div>
        </div>
      </div>
    </div>
  </AppLayout>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import AppLayout from '@/layouts/AppLayout.vue'
import DateInput from '@/components/DateInput.vue'
import SearchSelect from '@/components/SearchSelect.vue'
import api from '@/api'
import { fmtDateTime } from '@/utils/fmt'

const { t } = useI18n()

const entityTypeOptions = [
  { id: 'Invoice',             name: 'Invoice'              },
  { id: 'Receipt',             name: 'Receipt'              },
  { id: 'PurchaseOrder',       name: 'Purchase Order'       },
  { id: 'PurchaseRequisition', name: 'Purchase Requisition' },
  { id: 'VendorBill',          name: 'Vendor Bill'          },
  { id: 'GoodReceive',         name: 'Good Receive'         },
]
const logs    = ref([])
const total   = ref(0)
const page    = ref(1)
const limit   = 50
const loading = ref(false)

const filterEntityType = ref('')
const filterAction     = ref('')
const filterDateFrom   = ref('')
const filterDateTo     = ref('')
let searchTimer = null

const summarize = (s) => {
  try { return Object.entries(s).map(([k, v]) => `${k}=${v}`).join(' · ') }
  catch { return JSON.stringify(s) }
}

async function load() {
  loading.value = true
  try {
    const { data } = await api.get('/erp/audit-log', {
      params: {
        page: page.value, limit,
        entityType: filterEntityType.value || undefined,
        action:     filterAction.value     || undefined,
        dateFrom:   filterDateFrom.value   || undefined,
        dateTo:     filterDateTo.value     || undefined,
      },
    })
    logs.value  = data.data.logs
    total.value = data.data.total
  } finally { loading.value = false }
}
onMounted(load)
function onFilter() { page.value = 1; load() }
function onSearch() { clearTimeout(searchTimer); searchTimer = setTimeout(onFilter, 300) }
</script>
