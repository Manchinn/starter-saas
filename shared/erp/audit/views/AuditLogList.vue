<template>
  <AppLayout>
    <div class="space-y-5">
      <PageHeader :title="t('erp.audit.title')"
        :breadcrumb="[{ label: `${logs.length}${hasMore ? '+' : ''} ${t('erp.audit.loaded')}` }]" />

      <!-- Filters -->
      <div class="bg-white border border-[#E2E8F0] p-4 grid grid-cols-1 sm:grid-cols-4 gap-3">
        <div>
          <FieldLabel :text="t('erp.audit.entityType')" />
          <SearchSelect v-model="filterEntityType" :options="entityTypeOptions" :placeholder="t('common.all')" @change="onFilter" />
        </div>
        <div>
          <FieldLabel :text="t('erp.audit.action')" />
          <input v-model="filterAction" @input="onSearch" type="search" :placeholder="t('erp.audit.actionPh')" class="input text-sm" />
        </div>
        <div>
          <FieldLabel :text="t('common.dateFrom')" />
          <DateInput v-model="filterDateFrom" @change="onFilter" class="input text-sm" />
        </div>
        <div>
          <FieldLabel :text="t('common.dateTo')" />
          <DateInput v-model="filterDateTo" @change="onFilter" class="input text-sm" />
        </div>
      </div>

      <!-- Table -->
      <div class="bg-white border border-[#E2E8F0] shadow-sm overflow-hidden">
        <table class="w-full text-sm">
          <thead class="bg-[#F7F9FC] border-b border-[#E2E8F0] text-left">
            <tr>
              <th class="px-4 py-2.5 font-medium text-[#637381] w-44">{{ t('erp.audit.colWhen') }}</th>
              <th class="px-4 py-2.5 font-medium text-[#637381] w-52">{{ t('erp.audit.colUser') }}</th>
              <th class="px-4 py-2.5 font-medium text-[#637381] w-40">{{ t('erp.audit.colAction') }}</th>
              <th class="px-4 py-2.5 font-medium text-[#637381] w-80">{{ t('erp.audit.colDataId') }}</th>
              <th class="px-4 py-2.5 font-medium text-[#637381]">{{ t('erp.audit.colSummary') }}</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-[#E2E8F0]">
            <tr v-if="loading && !logs.length">
              <td colspan="5"><LoadingSpinner size="sm" padding="sm" /></td>
            </tr>
            <tr v-else-if="!logs.length">
              <td colspan="5">
                <EmptyState :icon="ClipboardDocumentListIcon" :title="t('erp.audit.noLogs')" padding="md" />
              </td>
            </tr>
            <tr v-for="l in logs" :key="l.id" class="hover:bg-[#F7F9FC]">
              <td class="px-4 py-2 text-xs text-[#637381] tabular-nums">{{ fmtDateTime(l.createdAt) }}</td>
              <td class="px-4 py-2 text-xs">{{ l.userEmail || '—' }}</td>
              <td class="px-4 py-2">
                <span class="inline-flex items-center px-2 py-0.5 text-[11px] font-mono bg-[#F1F5F9] text-[#374151]">{{ l.action }}</span>
              </td>
              <td class="px-4 py-2 text-xs align-top">
                <p class="font-medium text-[#1C2434]">{{ l.entityType }}</p>
                <p v-if="l.entityId" class="font-mono text-[10px] text-[#9BA7B0] whitespace-nowrap">{{ l.entityId }}</p>
              </td>
              <td class="px-4 py-2 text-xs text-[#637381]">
                <code v-if="l.summary" class="text-[11px]">{{ summarize(l.summary) }}</code>
                <span v-else class="text-[#CBD5E1]">—</span>
              </td>
            </tr>
          </tbody>
        </table>

        <div v-if="hasMore" class="px-4 py-3 border-t border-[#E2E8F0] flex items-center justify-center">
          <button @click="load()" :disabled="loading"
            class="px-4 py-1.5 text-xs border hover:bg-slate-50 disabled:opacity-40">
            {{ t('erp.audit.loadMore') }}
          </button>
        </div>
      </div>
    </div>
  </AppLayout>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { ClipboardDocumentListIcon } from '@heroicons/vue/24/outline'
import AppLayout from '@/layouts/AppLayout.vue'
import DateInput from '@/components/DateInput.vue'
import SearchSelect from '@/components/SearchSelect.vue'
import PageHeader from '@/components/form/PageHeader.vue'
import FieldLabel from '@/components/form/FieldLabel.vue'
import LoadingSpinner from '@/components/form/LoadingSpinner.vue'
import EmptyState from '@/components/form/EmptyState.vue'
import api from '@/api'
import { fmtDateTime } from '@/utils/fmt'

const { t } = useI18n()

const entityTypeOptions = [
  { id: 'Customer',            name: 'Customer'             },
  { id: 'CustomerGroup',       name: 'Customer Group'       },
  { id: 'Vendor',              name: 'Vendor'               },
  { id: 'Product',             name: 'Product'              },
  { id: 'ProductCategory',     name: 'Product Category'     },
  { id: 'Order',               name: 'Sales Order'          },
  { id: 'DeliveryOrder',       name: 'Delivery Order'       },
  { id: 'Quotation',           name: 'Quotation'            },
  { id: 'Invoice',             name: 'Invoice'              },
  { id: 'Receipt',             name: 'Receipt'              },
  { id: 'PurchaseOrder',       name: 'Purchase Order'       },
  { id: 'PurchaseRequisition', name: 'Purchase Requisition' },
  { id: 'VendorBill',          name: 'Vendor Bill'          },
  { id: 'GoodReceive',         name: 'Good Receive'         },
  { id: 'StockAdjust',         name: 'Stock Adjustment'     },
  { id: 'StockIssue',          name: 'Stock Issue'          },
  { id: 'StockReturn',         name: 'Stock Return'         },
  { id: 'Store',               name: 'Store'                },
  { id: 'Uom',                 name: 'Unit of Measure'      },
]
const logs       = ref([])
const nextCursor = ref(null)
const hasMore    = ref(false)
const limit      = 50
const loading    = ref(false)

const filterEntityType = ref('')
const filterAction     = ref('')
const filterDateFrom   = ref('')
const filterDateTo     = ref('')
let searchTimer = null

// Render a summary as `key=value · key=value`, JSON-stringifying any nested
// object/array value so the raw JSON shows instead of "[object Object]".
const summarize = (s) => {
  try {
    return Object.entries(s)
      .map(([k, v]) => `${k}=${v !== null && typeof v === 'object' ? JSON.stringify(v) : v}`)
      .join(' · ')
  } catch {
    return JSON.stringify(s)
  }
}

// Keyset pagination: load() appends the next page; reset() starts a fresh
// query (called when filters change) by clearing the cursor and rows first.
async function load() {
  loading.value = true
  try {
    const { data } = await api.get('/erp/audit-log', {
      params: {
        limit, cursor: nextCursor.value || undefined,
        entityType: filterEntityType.value || undefined,
        action:     filterAction.value     || undefined,
        dateFrom:   filterDateFrom.value   || undefined,
        dateTo:     filterDateTo.value     || undefined,
      },
    })
    logs.value.push(...data.data.logs)
    nextCursor.value = data.data.nextCursor
    hasMore.value    = data.data.hasMore
  } finally { loading.value = false }
}
function reset() {
  logs.value = []
  nextCursor.value = null
  hasMore.value = false
  load()
}
onMounted(reset)
function onFilter() { reset() }
function onSearch() { clearTimeout(searchTimer); searchTimer = setTimeout(reset, 300) }
</script>
