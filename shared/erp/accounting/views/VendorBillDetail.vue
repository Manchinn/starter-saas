<template>
  <AppLayout>
    <div class="space-y-6">
      <div class="flex items-center gap-3">
        <RouterLink to="/erp/purchasing/bills" class="text-[#9BA7B0] hover:text-[#637381] transition">
          <ArrowLeftIcon class="w-5 h-5" />
        </RouterLink>
        <div class="flex-1 min-w-0">
          <h1 class="text-2xl font-bold text-[#1C2434]">{{ bill?.billNumber }}</h1>
        </div>
        <span v-if="bill" :class="['px-3 py-1.5 rounded-full text-xs font-semibold capitalize', statusClass[bill.status]]">
          {{ bill.status }}
        </span>
      </div>

      <div v-if="loading" class="py-12 text-center text-[#9BA7B0]">{{ t('common.loading') }}</div>

      <template v-else-if="bill">
        <!-- Header -->
        <div class="bg-white rounded-2xl border border-[#E2E8F0] p-6">
          <h2 class="text-xs font-semibold text-[#9BA7B0] uppercase tracking-wide mb-4">{{ t('erp.bills.details') }}</h2>
          <dl class="grid grid-cols-2 sm:grid-cols-3 gap-4">
            <div>
              <dt class="text-xs text-[#9BA7B0]">{{ t('erp.bills.billDate') }}</dt>
              <dd class="mt-0.5 text-sm font-medium text-[#1C2434]">{{ bill.billDate }}</dd>
            </div>
            <div>
              <dt class="text-xs text-[#9BA7B0]">{{ t('erp.bills.dueDate') }}</dt>
              <dd class="mt-0.5 text-sm font-medium text-[#1C2434]">{{ bill.dueDate || '—' }}</dd>
            </div>
            <div>
              <dt class="text-xs text-[#9BA7B0]">{{ t('erp.bills.vendor') }}</dt>
              <dd class="mt-0.5 text-sm font-medium text-[#1C2434]">{{ bill.vendor?.name || '—' }}</dd>
            </div>
            <div>
              <dt class="text-xs text-[#9BA7B0]">{{ t('erp.bills.vendorInvoiceNo') }}</dt>
              <dd class="mt-0.5 text-sm font-medium text-[#1C2434]">{{ bill.vendorInvoiceNo || '—' }}</dd>
            </div>
            <div>
              <dt class="text-xs text-[#9BA7B0]">{{ t('erp.bills.linkedPO') }}</dt>
              <dd class="mt-0.5 text-sm font-medium">
                <RouterLink v-if="bill.purchaseOrder" :to="`/erp/purchasing/orders/${bill.purchaseOrder.id}`"
                  class="text-primary-600 hover:underline font-mono">{{ bill.purchaseOrder.refNo }}</RouterLink>
                <span v-else class="text-[#9BA7B0]">—</span>
              </dd>
            </div>
            <div>
              <dt class="text-xs text-[#9BA7B0]">{{ t('erp.bills.linkedGR') }}</dt>
              <dd class="mt-0.5 text-sm font-medium">
                <RouterLink v-if="bill.goodReceive" :to="`/erp/good-receive/${bill.goodReceive.id}`"
                  class="text-primary-600 hover:underline font-mono">{{ bill.goodReceive.refNo }}</RouterLink>
                <span v-else class="text-[#9BA7B0]">—</span>
              </dd>
            </div>
            <div class="col-span-full">
              <dt class="text-xs text-[#9BA7B0]">{{ t('erp.bills.notes') }}</dt>
              <dd class="mt-0.5 text-sm text-[#637381]">{{ bill.notes || '—' }}</dd>
            </div>
          </dl>
        </div>

        <!-- Items -->
        <div class="bg-white rounded-2xl border border-[#E2E8F0] p-6">
          <h2 class="text-xs font-semibold text-[#9BA7B0] uppercase tracking-wide mb-4">{{ t('erp.bills.items') }}</h2>
          <div class="overflow-x-auto">
            <table class="w-full text-sm">
              <thead>
                <tr class="border-b border-[#E2E8F0]">
                  <th class="text-left text-xs font-medium text-[#637381] pb-2 pr-3">#</th>
                  <th class="text-left text-xs font-medium text-[#637381] pb-2 pr-3">{{ t('erp.bills.colDescription') }}</th>
                  <th class="text-right text-xs font-medium text-[#637381] pb-2 pr-3">{{ t('erp.bills.colQty') }}</th>
                  <th class="text-right text-xs font-medium text-[#637381] pb-2 pr-3">{{ t('erp.bills.colUnitPrice') }}</th>
                  <th class="text-right text-xs font-medium text-[#637381] pb-2">{{ t('erp.bills.colTotal') }}</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(item, idx) in bill.items" :key="item.id" class="border-b border-[#F1F5F9]">
                  <td class="py-2.5 pr-3 text-[#9BA7B0] text-xs">{{ idx + 1 }}</td>
                  <td class="py-2.5 pr-3 font-medium text-[#1C2434]">{{ item.description }}</td>
                  <td class="py-2.5 pr-3 text-right text-[#1C2434]">{{ Number(item.quantity).toLocaleString() }}</td>
                  <td class="py-2.5 pr-3 text-right text-[#637381] tabular-nums">{{ fmt(item.unitPrice) }}</td>
                  <td class="py-2.5 text-right font-medium text-[#1C2434] tabular-nums">{{ fmt(item.total) }}</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div class="flex justify-end mt-4">
            <div class="w-72 space-y-2">
              <div class="flex justify-between text-sm text-[#637381]">
                <span>{{ t('erp.bills.subtotal') }}</span>
                <span class="tabular-nums">{{ fmt(bill.subtotal) }}</span>
              </div>
              <div class="flex justify-between text-sm text-[#637381]">
                <span>{{ t('erp.bills.tax') }}</span>
                <span class="tabular-nums">{{ fmt(bill.tax) }}</span>
              </div>
              <div class="flex justify-between text-base font-bold text-[#1C2434] border-t border-[#E2E8F0] pt-2">
                <span>{{ t('erp.bills.total') }}</span>
                <span class="tabular-nums">{{ fmt(bill.total) }}</span>
              </div>
            </div>
          </div>
        </div>

        <div v-if="error" class="bg-red-50 text-red-700 text-sm px-4 py-2 rounded-lg">{{ error }}</div>

        <!-- Actions -->
        <div class="flex justify-between items-center">
          <button v-if="bill.status === 'draft'" @click="confirmDelete"
            class="px-4 py-2 text-sm text-red-500 border border-red-200 rounded-lg hover:bg-red-50 transition">
            {{ t('common.delete') }}
          </button>
          <div class="flex gap-3 ml-auto">
            <button v-if="bill.status === 'draft'" @click="setStatus('approved')" :disabled="acting"
              class="px-5 py-2 text-sm bg-primary-500 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 transition">
              {{ acting ? t('common.loading') : t('erp.bills.approve') }}
            </button>
            <button v-if="bill.status === 'approved'" @click="setStatus('paid')" :disabled="acting"
              class="px-5 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition">
              {{ acting ? t('common.loading') : t('erp.bills.markPaid') }}
            </button>
            <button v-if="['draft', 'approved'].includes(bill.status)" @click="setStatus('cancelled')" :disabled="acting"
              class="px-4 py-2 text-sm border border-red-200 text-red-600 rounded-lg hover:bg-red-50 transition disabled:opacity-50">
              {{ t('erp.bills.cancel') }}
            </button>
          </div>
        </div>
        <AttachmentsPanel v-if="bill" ref-type="VendorBill" :ref-id="bill.id" />
      </template>
    </div>
  </AppLayout>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter, RouterLink } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { ArrowLeftIcon } from '@heroicons/vue/24/outline'
import AppLayout from '@/layouts/AppLayout.vue'
import AttachmentsPanel from '@/components/AttachmentsPanel.vue'
import api from '@/api'

const { t } = useI18n()
const route   = useRoute()
const router  = useRouter()
const bill    = ref(null)
const loading = ref(true)
const acting  = ref(false)
const error   = ref('')

const statusClass = {
  draft:     'bg-slate-100 text-slate-600',
  approved:  'bg-blue-50 text-blue-700',
  paid:      'bg-green-50 text-green-700',
  cancelled: 'bg-red-50 text-red-600',
}

const fmt = (n) => Number(n || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })

async function load() {
  loading.value = true
  try {
    const { data } = await api.get(`/erp/purchasing/bills/${route.params.id}`)
    bill.value = data.data.bill
  } catch (err) {
    error.value = err.response?.data?.message || 'Failed to load'
  } finally { loading.value = false }
}
onMounted(load)

async function setStatus(status) {
  error.value = ''
  acting.value = true
  try {
    const { data } = await api.patch(`/erp/purchasing/bills/${route.params.id}/status`, { status })
    bill.value = data.data.bill
  } catch (err) {
    error.value = err.response?.data?.message || 'Action failed'
  } finally { acting.value = false }
}

async function confirmDelete() {
  if (!confirm(`Delete "${bill.value?.billNumber}"?`)) return
  try {
    await api.delete(`/erp/purchasing/bills/${route.params.id}`)
    router.push('/erp/purchasing/bills')
  } catch (err) {
    error.value = err.response?.data?.message || 'Delete failed'
  }
}
</script>
