<template>
  <AppLayout>
    <div class="space-y-5">

      <div class="flex items-start gap-3">
        <RouterLink to="/erp/billing/make-payments"
          class="mt-0.5 p-2 text-[#9BA7B0] hover:text-[#1C2434] hover:bg-white border border-transparent hover:border-[#E2E8F0] transition-all flex-shrink-0">
          <ArrowLeftIcon class="w-[18px] h-[18px]" />
        </RouterLink>
        <div class="flex-1 min-w-0">
          <div class="flex items-center gap-2.5 flex-wrap">
            <h1 class="text-xl font-bold text-[#1C2434]">{{ loading ? '…' : (vp?.refNo || 'Payment') }}</h1>
            <span v-if="vp && !loading" class="inline-flex items-center gap-1.5 px-2.5 py-0.5 text-[11px] font-semibold capitalize" :class="statusBadge(vp.status)">
              <span class="w-1.5 h-1.5" :class="statusDot(vp.status)"></span>{{ vp.status }}
            </span>
          </div>
          <nav class="flex items-center gap-1.5 mt-1">
            <RouterLink to="/erp/billing/make-payments" class="text-[12px] text-[#9BA7B0] hover:text-[#637381]">Make Payments</RouterLink>
            <ChevronRightIcon class="w-3 h-3 text-[#CBD5E1]" />
            <span class="text-[12px] text-[#637381]">{{ vp?.refNo || '…' }}</span>
          </nav>
        </div>
        <div v-if="vp && !loading && vp.status === 'draft'" class="flex items-center gap-2 flex-shrink-0">
          <button v-can="'erp.accounting.delete'" @click="confirmDelete" type="button"
            class="inline-flex items-center gap-1.5 px-3 py-2 text-[12px] font-semibold text-red-600 bg-white border border-red-200 hover:bg-red-50 transition-colors">
            <TrashIcon class="w-4 h-4" />
          </button>
        </div>
      </div>

      <div v-if="loading" class="flex items-center justify-center py-20">
        <div class="w-7 h-7 border-2 border-primary-500 border-t-transparent animate-spin"></div>
      </div>

      <div v-else-if="notFound" class="flex items-start gap-3 bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3.5">
        <ExclamationCircleIcon class="w-5 h-5 flex-shrink-0 mt-0.5" />
        <span>Payment not found. <RouterLink to="/erp/billing/make-payments" class="underline ml-1">Back to list</RouterLink></span>
      </div>

      <template v-else>
        <!-- Info -->
        <div class="bg-white border border-[#E2E8F0] shadow-sm grid grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-4 px-6 py-5">
          <div><p class="text-[11px] font-semibold text-[#9BA7B0] uppercase">Vendor</p><p class="text-sm text-[#1C2434] mt-0.5">{{ vp.vendor?.name || '—' }}</p></div>
          <div><p class="text-[11px] font-semibold text-[#9BA7B0] uppercase">Date</p><p class="text-sm text-[#1C2434] mt-0.5">{{ fmtDate(vp.date) }}</p></div>
          <div><p class="text-[11px] font-semibold text-[#9BA7B0] uppercase">Method</p><p class="text-sm text-[#1C2434] mt-0.5">{{ vp.paymentMethod || '—' }}</p></div>
          <div><p class="text-[11px] font-semibold text-[#9BA7B0] uppercase">Amount</p><p class="text-base font-bold text-green-600 mt-0.5 tabular-nums">{{ fmtMoney(vp.amount) }}</p></div>
          <div v-if="vp.reference" class="col-span-2"><p class="text-[11px] font-semibold text-[#9BA7B0] uppercase">Reference</p><p class="text-sm text-[#1C2434] mt-0.5">{{ vp.reference }}</p></div>
          <div v-if="vp.notes" class="col-span-2"><p class="text-[11px] font-semibold text-[#9BA7B0] uppercase">Notes</p><p class="text-sm text-[#637381] mt-0.5 whitespace-pre-line">{{ vp.notes }}</p></div>
        </div>

        <!-- Allocations -->
        <div class="bg-white border border-[#E2E8F0] shadow-sm overflow-hidden">
          <div class="px-5 py-3 border-b border-[#E2E8F0]"><h2 class="text-sm font-semibold text-[#374151]">Allocated Bills</h2></div>
          <table class="w-full text-sm">
            <thead>
              <tr class="bg-[#F7F9FC] border-b border-[#E2E8F0] text-left">
                <th class="px-4 py-2.5 text-[11px] font-semibold text-[#9BA7B0] uppercase">Bill #</th>
                <th class="px-4 py-2.5 text-[11px] font-semibold text-[#9BA7B0] uppercase">Bill Date</th>
                <th class="px-4 py-2.5 text-[11px] font-semibold text-[#9BA7B0] uppercase text-right">Bill Total</th>
                <th class="px-4 py-2.5 text-[11px] font-semibold text-[#9BA7B0] uppercase text-right">Applied</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-[#F1F5F9]">
              <tr v-for="line in vp.lines" :key="line.id">
                <td class="px-4 py-2.5">
                  <RouterLink :to="`/erp/purchasing/bills/${line.vendorBillId}`" class="font-mono text-xs font-medium text-primary-600 hover:underline">{{ line.bill?.billNumber || '—' }}</RouterLink>
                </td>
                <td class="px-4 py-2.5 text-xs text-[#637381]">{{ fmtDate(line.bill?.billDate) }}</td>
                <td class="px-4 py-2.5 text-right tabular-nums text-[#637381]">{{ fmtMoney(line.bill?.total) }}</td>
                <td class="px-4 py-2.5 text-right tabular-nums font-semibold text-[#1C2434]">{{ fmtMoney(line.amount) }}</td>
              </tr>
            </tbody>
            <tfoot>
              <tr class="bg-[#F7F9FC] border-t border-[#E2E8F0]">
                <td colspan="3" class="px-4 py-2.5 text-right text-[11px] font-semibold text-[#9BA7B0] uppercase">Total</td>
                <td class="px-4 py-2.5 text-right font-bold tabular-nums text-green-600">{{ fmtMoney(vp.amount) }}</td>
              </tr>
            </tfoot>
          </table>
        </div>

        <!-- Status actions -->
        <div v-can="'erp.accounting.edit'" v-if="vp.status === 'draft'"
          class="bg-white border border-[#E2E8F0] shadow-sm px-5 py-4 flex items-center justify-between flex-wrap gap-3">
          <div>
            <p class="text-[11px] font-semibold text-[#9BA7B0] uppercase tracking-wider">Next Action</p>
            <p class="text-[13px] text-[#637381] mt-0.5">Confirm to post the GL journal (Dr A/P · Cr Cash) and update the bills.</p>
          </div>
          <div class="flex items-center gap-2.5">
            <button @click="changeStatus('confirmed')" :disabled="updatingStatus"
              class="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold bg-green-600 text-white hover:bg-green-700 transition-colors disabled:opacity-50">
              <ArrowPathIcon v-if="updatingStatus" class="w-4 h-4 animate-spin" />
              <template v-else><BanknotesIcon class="w-4 h-4" />Confirm Payment</template>
            </button>
            <button @click="changeStatus('cancelled')" :disabled="updatingStatus"
              class="px-4 py-2 text-sm font-medium border border-red-200 text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50">Cancel Payment</button>
          </div>
        </div>
        <div v-else-if="vp.status === 'confirmed'" v-can="'erp.accounting.edit'"
          class="bg-white border border-[#E2E8F0] shadow-sm px-5 py-4 flex items-center justify-between flex-wrap gap-3">
          <div class="flex items-center gap-3">
            <div class="w-8 h-8 bg-green-50 flex items-center justify-center"><CheckIcon class="w-4 h-4 text-green-600" /></div>
            <div><p class="text-[13px] font-semibold text-[#1C2434]">Payment confirmed</p><p class="text-[12px] text-[#637381]">Bills updated and GL posted.</p></div>
          </div>
          <button @click="changeStatus('cancelled')" :disabled="updatingStatus"
            class="px-4 py-2 text-sm font-medium border border-red-200 text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50">Cancel & Reverse</button>
        </div>
        <p v-if="statusError" class="text-xs text-red-600">{{ statusError }}</p>
      </template>
    </div>
  </AppLayout>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'
import {
  ArrowLeftIcon, ChevronRightIcon, BanknotesIcon, CheckIcon, TrashIcon, ArrowPathIcon, ExclamationCircleIcon,
} from '@heroicons/vue/24/outline'
import AppLayout from '@/layouts/AppLayout.vue'
import api from '@/api'
import { fmtMoney, fmtDate } from '@/utils/fmt'

const route          = useRoute()
const router         = useRouter()
const vp             = ref(null)
const loading        = ref(true)
const notFound       = ref(false)
const updatingStatus = ref(false)
const statusError    = ref('')

const STATUS_BADGE = { draft: 'bg-[#F1F5F9] text-[#637381]', confirmed: 'bg-green-50 text-green-700', cancelled: 'bg-red-50 text-red-600' }
const STATUS_DOT   = { draft: 'bg-slate-400', confirmed: 'bg-green-500', cancelled: 'bg-red-500' }
function statusBadge(s) { return STATUS_BADGE[s] || STATUS_BADGE.draft }
function statusDot(s)   { return STATUS_DOT[s]   || STATUS_DOT.draft }

onMounted(fetchPayment)
async function fetchPayment() {
  loading.value = true
  try {
    const { data } = await api.get(`/erp/billing/make-payments/${route.params.id}`)
    vp.value = data.data.vendorPayment
  } catch {
    notFound.value = true
  } finally {
    loading.value = false
  }
}

const STATUS_ENDPOINT = { confirmed: 'confirm', cancelled: 'cancel' }
async function changeStatus(status) {
  statusError.value = ''
  updatingStatus.value = true
  try {
    const { data } = await api.post(`/erp/billing/make-payments/${vp.value.id}/${STATUS_ENDPOINT[status]}`)
    vp.value = data.data.vendorPayment
  } catch (err) {
    statusError.value = err.response?.data?.message || 'Failed to update status'
  } finally {
    updatingStatus.value = false
  }
}

async function confirmDelete() {
  if (!confirm(`Delete payment ${vp.value.refNo}? This cannot be undone.`)) return
  try {
    await api.delete(`/erp/billing/make-payments/${vp.value.id}`)
    router.push('/erp/billing/make-payments')
  } catch (err) {
    statusError.value = err.response?.data?.message || 'Delete failed'
  }
}
</script>
