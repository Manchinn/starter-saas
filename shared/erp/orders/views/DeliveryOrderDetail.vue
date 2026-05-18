<template>
  <AppLayout>
    <div class="space-y-6">

      <!-- Header -->
      <div class="flex items-start gap-4">
        <RouterLink to="/erp/delivery-orders"
          class="mt-0.5 p-2 rounded-xl text-[#9BA7B0] hover:text-[#1C2434] hover:bg-white
                 border border-transparent hover:border-[#E2E8F0] transition-all flex-shrink-0">
          <ArrowLeftIcon class="w-[18px] h-[18px]" />
        </RouterLink>
        <div class="flex-1 min-w-0">
          <div class="flex items-center gap-2.5 flex-wrap">
            <h1 class="text-xl font-bold text-[#1C2434]">{{ loading ? '…' : (doc?.refNo || t('erp.deliveryOrders.title')) }}</h1>
            <span v-if="doc && !loading"
              class="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold capitalize"
              :class="statusBadge(doc.status)">
              <span class="w-1.5 h-1.5 rounded-full" :class="statusDot(doc.status)"></span>
              {{ doc.status }}
            </span>
            <DocCurrencyBadge v-if="doc" :currency="doc.currency" :exchange-rate="doc.exchangeRate" />
          </div>
          <nav class="flex items-center gap-1.5 mt-1">
            <RouterLink to="/erp/delivery-orders" class="text-[12px] text-[#9BA7B0] hover:text-[#637381] transition-colors">
              {{ t('erp.deliveryOrders.title') }}
            </RouterLink>
            <ChevronRightIcon class="w-3 h-3 text-[#CBD5E1]" />
            <span class="text-[12px] text-[#637381]">{{ doc?.refNo || '…' }}</span>
          </nav>
        </div>
      </div>

      <!-- Loading -->
      <div v-if="loading" class="flex items-center justify-center py-20">
        <div class="w-7 h-7 border-2 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
      </div>

      <!-- Not found -->
      <div v-else-if="notFound"
        class="flex items-start gap-3 bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3.5 rounded-xl">
        <ExclamationCircleIcon class="w-5 h-5 flex-shrink-0 mt-0.5" />
        <span>{{ t('erp.deliveryOrders.notFound') }}
          <RouterLink to="/erp/delivery-orders" class="underline ml-1">{{ t('erp.common.backToList') }}</RouterLink>
        </span>
      </div>

      <template v-else>
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">

          <!-- LEFT: Document content -->
          <div class="lg:col-span-2 space-y-5">

            <!-- Customer + Details cards -->
            <div class="grid grid-cols-2 gap-4">
              <div class="bg-white rounded-2xl border border-[#E2E8F0] shadow-card p-5">
                <div class="flex items-center gap-2 mb-3">
                  <div class="w-7 h-7 rounded-lg bg-primary-50 flex items-center justify-center flex-shrink-0">
                    <UserIcon class="w-3.5 h-3.5 text-primary-500" />
                  </div>
                  <p class="text-[11px] font-semibold text-[#637381] uppercase tracking-wider">{{ t('erp.common.customer') }}</p>
                </div>
                <template v-if="doc.customer">
                  <p class="text-sm font-semibold text-[#1C2434]">{{ doc.customer.name }}</p>
                  <p v-if="doc.customer.company" class="text-xs text-[#637381] mt-0.5">{{ doc.customer.company }}</p>
                  <p v-if="doc.customer.phone"   class="text-xs text-[#9BA7B0] mt-0.5">{{ doc.customer.phone }}</p>
                </template>
                <p v-else class="text-sm text-[#9BA7B0]">—</p>
              </div>

              <div class="bg-white rounded-2xl border border-[#E2E8F0] shadow-card p-5">
                <div class="flex items-center gap-2 mb-3">
                  <div class="w-7 h-7 rounded-lg bg-purple-50 flex items-center justify-center flex-shrink-0">
                    <TruckIcon class="w-3.5 h-3.5 text-purple-600" />
                  </div>
                  <p class="text-[11px] font-semibold text-[#637381] uppercase tracking-wider">{{ t('erp.deliveryOrders.info') }}</p>
                </div>
                <div class="space-y-1.5">
                  <p class="text-xs text-[#637381]">
                    {{ t('erp.common.date') }}: <span class="font-semibold text-[#1C2434] ml-1">{{ doc.date }}</span>
                  </p>
                  <p class="text-xs text-[#637381]">
                    {{ t('erp.deliveryOrders.colDeliveryDate') }}: <span class="font-semibold text-[#1C2434] ml-1">{{ doc.deliveryDate || '—' }}</span>
                  </p>
                  <p v-if="doc.salesOrder" class="text-xs text-[#637381]">
                    {{ t('erp.deliveryOrders.referenceSO') }}:
                    <RouterLink :to="`/erp/orders/${doc.salesOrder.id}`"
                      class="font-semibold text-primary-500 hover:underline ml-1">
                      {{ doc.salesOrder.orderNumber }}
                    </RouterLink>
                  </p>
                </div>
              </div>
            </div>

            <!-- Delivery Address -->
            <div v-if="doc.address" class="bg-white rounded-2xl border border-[#E2E8F0] shadow-card p-5">
              <p class="text-[11px] font-semibold text-[#637381] uppercase tracking-wider mb-2">{{ t('erp.deliveryOrders.deliveryAddress') }}</p>
              <p class="text-sm text-[#374151] whitespace-pre-line">{{ doc.address }}</p>
            </div>

            <!-- Items table -->
            <div class="bg-white rounded-2xl border border-[#E2E8F0] shadow-card overflow-hidden">
              <div class="px-6 py-4 border-b border-[#E2E8F0] flex items-center gap-3">
                <div class="w-8 h-8 rounded-xl bg-green-50 flex items-center justify-center flex-shrink-0">
                  <ClipboardDocumentListIcon class="w-4 h-4 text-green-600" />
                </div>
                <div>
                  <h2 class="text-sm font-semibold text-[#1C2434]">{{ t('erp.common.items') }}</h2>
                  <p class="text-[11px] text-[#9BA7B0]">
                    {{ doc.items?.length || 0 }} item{{ (doc.items?.length || 0) !== 1 ? 's' : '' }}
                  </p>
                </div>
              </div>
              <table class="w-full text-sm">
                <thead class="bg-[#F7F9FC] border-b border-[#E2E8F0]">
                  <tr>
                    <th class="px-5 py-3 text-left text-[11px] font-semibold text-[#637381] uppercase tracking-wider">#</th>
                    <th class="px-5 py-3 text-left text-[11px] font-semibold text-[#637381] uppercase tracking-wider">{{ t('erp.deliveryOrders.colProduct') }}</th>
                    <th class="px-5 py-3 text-left text-[11px] font-semibold text-[#637381] uppercase tracking-wider">{{ t('erp.deliveryOrders.colNotes') }}</th>
                    <th class="px-5 py-3 text-right text-[11px] font-semibold text-[#637381] uppercase tracking-wider">{{ t('erp.deliveryOrders.colQty') }}</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-[#E2E8F0]">
                  <tr v-for="(item, idx) in doc.items" :key="item.id" class="hover:bg-[#F7F9FC] transition-colors">
                    <td class="px-5 py-3.5 text-xs text-[#CBD5E1] font-semibold">{{ idx + 1 }}</td>
                    <td class="px-5 py-3.5">
                      <p v-if="item.product" class="font-mono text-xs text-[#9BA7B0]">{{ item.product.sku }}</p>
                      <p class="font-medium text-[#1C2434]">{{ item.productName }}</p>
                    </td>
                    <td class="px-5 py-3.5 text-xs text-[#637381]">{{ item.notes || '—' }}</td>
                    <td class="px-5 py-3.5 text-right font-semibold text-[#1C2434] tabular-nums">
                      {{ Number(item.qty).toLocaleString() }}
                    </td>
                  </tr>
                </tbody>
              </table>
              <div class="border-t border-[#E2E8F0] px-5 py-3.5 bg-[#F7F9FC] flex items-center justify-between">
                <span class="text-sm font-semibold text-[#637381]">{{ t('erp.deliveryOrders.totalItems') }}</span>
                <span class="text-sm font-bold text-[#1C2434]">{{ doc.items?.length || 0 }}</span>
              </div>
            </div>

            <!-- Notes -->
            <div v-if="doc.notes" class="bg-white rounded-2xl border border-[#E2E8F0] shadow-card p-5">
              <p class="text-[11px] font-semibold text-[#637381] uppercase tracking-wider mb-2">{{ t('erp.common.notes') }}</p>
              <p class="text-sm text-[#374151] whitespace-pre-line">{{ doc.notes }}</p>
            </div>

          </div>

          <!-- RIGHT: Workflow sidebar -->
          <div class="space-y-4">

            <!-- Workflow card -->
            <div class="bg-white rounded-2xl border border-[#E2E8F0] shadow-card overflow-hidden">
              <div class="px-5 py-4 border-b border-[#E2E8F0] flex items-center gap-2.5">
                <BoltIcon class="w-4 h-4 text-[#9BA7B0]" />
                <h3 class="text-sm font-semibold text-[#1C2434]">{{ t('erp.common.workflow') }}</h3>
                <span class="ml-auto inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold capitalize"
                  :class="statusBadge(doc.status)">
                  <span class="w-1.5 h-1.5 rounded-full" :class="statusDot(doc.status)"></span>
                  {{ doc.status }}
                </span>
              </div>

              <!-- Vertical stepper -->
              <div class="px-5 py-5">
                <template v-for="(step, i) in FLOW_STEPS" :key="step.key">
                  <div class="flex items-center gap-3">
                    <div class="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ring-2 flex-shrink-0 transition-all"
                      :class="stepNodeClass(step.key)">
                      <CheckIcon v-if="stepState(step.key) === 'completed'" class="w-3.5 h-3.5" />
                      <span v-else-if="stepState(step.key) === 'current'" class="w-2 h-2 rounded-full bg-white"></span>
                      <span v-else class="text-[10px]">{{ i + 1 }}</span>
                    </div>
                    <div class="flex-1 py-1">
                      <p class="text-xs font-semibold" :class="stepLabelClass(step.key)">{{ step.label }}</p>
                      <p v-if="stepState(step.key) === 'current' && !isCancelled"
                        class="text-[10px] text-primary-400 mt-0.5">{{ t('erp.common.currentStatus') }}</p>
                    </div>
                  </div>
                  <div v-if="i < FLOW_STEPS.length - 1" class="flex gap-3">
                    <div class="w-7 flex justify-center flex-shrink-0">
                      <div class="w-0.5 h-5 rounded-full" :class="connectorClass(step.key)"></div>
                    </div>
                  </div>
                </template>

                <!-- Cancelled terminal -->
                <template v-if="isCancelled">
                  <div class="flex gap-3">
                    <div class="w-7 flex justify-center flex-shrink-0">
                      <div class="w-0.5 h-4 rounded-full bg-red-200"></div>
                    </div>
                  </div>
                  <div class="flex items-center gap-3">
                    <div class="w-7 h-7 rounded-full bg-red-100 ring-2 ring-red-200 flex items-center justify-center flex-shrink-0">
                      <XMarkIcon class="w-3.5 h-3.5 text-red-500" />
                    </div>
                    <div class="py-1">
                      <p class="text-xs font-semibold text-red-600">{{ t('erp.common.cancelled') }}</p>
                      <p class="text-[10px] text-red-400 mt-0.5">{{ t('erp.common.terminalState') }}</p>
                    </div>
                  </div>
                </template>
              </div>

              <!-- Actions -->
              <div v-can="'erp.orders.edit'" v-if="availableTransitions.length"
                class="border-t border-[#E2E8F0] px-5 pb-5 pt-4 space-y-2.5">
                <p class="text-[11px] font-semibold text-[#637381] uppercase tracking-wider mb-3">{{ t('erp.common.actions') }}</p>
                <button v-for="s in forwardTransitions" :key="s"
                  @click="changeStatus(s)" :disabled="updatingStatus"
                  class="w-full py-2.5 text-sm font-semibold rounded-xl transition-colors disabled:opacity-50
                         flex items-center justify-center gap-2"
                  :class="forwardBtnClass(s)">
                  <ArrowPathIcon v-if="updatingStatus" class="w-4 h-4 animate-spin" />
                  <template v-else>{{ transitionLabel(s) }}</template>
                </button>
                <button v-if="cancelTransitions.length"
                  @click="changeStatus('cancel')" :disabled="updatingStatus"
                  class="w-full py-2 text-sm font-medium border border-red-200 text-red-600
                         hover:bg-red-50 rounded-xl transition-colors disabled:opacity-50">
                  {{ t('erp.deliveryOrders.cancelOrder') }}
                </button>
                <p v-if="statusError" class="text-xs text-red-600">{{ statusError }}</p>
              </div>
            </div>

            <!-- Conversion: DO → Invoice (when shipped or delivered) -->
            <div v-if="['shipped', 'delivered'].includes(doc.status)" v-can="'erp.invoices.edit'"
              class="bg-white rounded-2xl border border-[#E2E8F0] shadow-card p-4 space-y-2">
              <p class="text-[11px] font-semibold text-[#637381] uppercase tracking-wider">{{ t('erp.common.actions') }}</p>
              <button @click="convertToInvoice" :disabled="converting || !!doc.linkedInvoice"
                :title="doc.linkedInvoice ? `Already linked to ${doc.linkedInvoice.invoiceNumber}` : ''"
                class="w-full py-2.5 text-sm font-medium bg-primary-50 text-primary-600 border border-primary-200
                       rounded-xl hover:bg-primary-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2">
                <DocumentTextIcon class="w-4 h-4" />
                {{ converting ? t('erp.common.saving') : t('erp.deliveryOrders.createInvoice') }}
              </button>
              <RouterLink v-if="doc.linkedInvoice" :to="`/erp/invoices/${doc.linkedInvoice.id}`"
                class="block text-center text-xs text-blue-700 hover:text-blue-900 hover:underline font-medium">
                → {{ doc.linkedInvoice.invoiceNumber }}
              </RouterLink>
              <p v-if="convertError" class="text-xs text-red-600">{{ convertError }}</p>
            </div>

            <!-- Delete (draft only) -->
            <div v-if="doc.status === 'draft'" v-can="'erp.orders.delete'"
              class="bg-white rounded-2xl border border-[#E2E8F0] shadow-card p-4">
              <button @click="confirmDelete"
                class="w-full py-2 text-sm font-medium text-red-500 border border-red-200
                       rounded-xl hover:bg-red-50 transition-colors flex items-center justify-center gap-2">
                <TrashIcon class="w-4 h-4" />
                {{ t('erp.deliveryOrders.deleteOrder') }}
              </button>
            </div>

          </div>
        </div>
        <ActivityTimeline v-if="doc" ref-type="DeliveryOrder" :ref-id="doc.id" />
      </template>
    </div>
  </AppLayout>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import ActivityTimeline from '@/components/ActivityTimeline.vue'
import DocCurrencyBadge from '@/components/DocCurrencyBadge.vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import {
  ArrowLeftIcon, ChevronRightIcon, UserIcon, TruckIcon, DocumentTextIcon,
  ClipboardDocumentListIcon, CheckIcon, XMarkIcon, TrashIcon,
  BoltIcon, ArrowPathIcon, ExclamationCircleIcon,
} from '@heroicons/vue/24/outline'
import AppLayout from '@/layouts/AppLayout.vue'
import api from '@/api'

const { t } = useI18n()
const route          = useRoute()
const router         = useRouter()
const doc            = ref(null)
const loading        = ref(true)
const notFound       = ref(false)
const updatingStatus = ref(false)
const statusError    = ref('')
const converting     = ref(false)
const convertError   = ref('')

async function convertToInvoice() {
  convertError.value = ''
  converting.value = true
  try {
    const { data } = await api.post(`/erp/delivery-orders/${doc.value.id}/create-invoice`)
    router.push(`/erp/invoices/${data.data.id}`)
  } catch (err) {
    convertError.value = err.response?.data?.message || 'Failed to create invoice'
  } finally { converting.value = false }
}

// ── Workflow ──────────────────────────────────────────────
const FLOW_STEPS = computed(() => [
  { key: 'draft',     label: t('erp.common.draft') },
  { key: 'confirmed', label: t('erp.common.confirmed') },
  { key: 'shipped',   label: t('erp.deliveryOrders.statusShipped') },
  { key: 'delivered', label: t('erp.deliveryOrders.statusDelivered') },
])

const COMPLETED_BEFORE = {
  draft:     [],
  confirmed: ['draft'],
  shipped:   ['draft', 'confirmed'],
  delivered: ['draft', 'confirmed', 'shipped'],
  cancelled: [],
}

const TRANSITIONS = {
  draft:     ['confirmed', 'cancelled'],
  confirmed: ['shipped', 'cancelled'],
  shipped:   ['delivered', 'cancelled'],
  delivered: [],
  cancelled: [],
}

const availableTransitions = computed(() => TRANSITIONS[doc.value?.status] || [])
const forwardTransitions   = computed(() => availableTransitions.value.filter(s => s !== 'cancelled'))
const cancelTransitions    = computed(() => availableTransitions.value.filter(s => s === 'cancelled'))
const isCancelled          = computed(() => doc.value?.status === 'cancelled')

function stepState(key) {
  const cur = doc.value?.status
  if (!cur) return 'upcoming'
  if (cur === key) return 'current'
  return (COMPLETED_BEFORE[cur] || []).includes(key) ? 'completed' : 'upcoming'
}
function stepNodeClass(key) {
  const s = stepState(key)
  if (s === 'completed') return 'bg-green-500 text-white ring-green-200'
  if (s === 'current')   return 'bg-primary-500 text-white ring-primary-200'
  return 'bg-white text-[#CBD5E1] ring-[#E2E8F0]'
}
function stepLabelClass(key) {
  const s = stepState(key)
  if (s === 'completed') return 'text-green-700'
  if (s === 'current')   return 'text-primary-600 font-bold'
  return 'text-[#9BA7B0]'
}
function connectorClass(key) {
  const s = stepState(key)
  if (s === 'completed') return 'bg-green-300'
  if (s === 'current')   return 'bg-primary-200'
  return 'bg-[#E2E8F0]'
}

const FORWARD_BTN = {
  confirmed: 'bg-blue-600 text-white hover:bg-blue-700',
  shipped:   'bg-purple-600 text-white hover:bg-purple-700',
  delivered: 'bg-green-600 text-white hover:bg-green-700',
}
function forwardBtnClass(s) { return FORWARD_BTN[s] || 'bg-primary-500 text-white hover:bg-primary-600' }

function transitionLabel(s) {
  const labels = {
    confirmed: t('erp.deliveryOrders.confirmOrder'),
    shipped:   t('erp.deliveryOrders.markShipped'),
    delivered: t('erp.deliveryOrders.markDelivered'),
  }
  return labels[s] || s
}

const STATUS_BADGE = {
  draft:     'bg-[#F1F5F9] text-[#637381]',
  confirmed: 'bg-blue-50 text-blue-700',
  shipped:   'bg-purple-50 text-purple-700',
  delivered: 'bg-green-50 text-green-700',
  cancelled: 'bg-red-50 text-red-600',
}
const STATUS_DOT = {
  draft:     'bg-slate-400',
  confirmed: 'bg-blue-500',
  shipped:   'bg-purple-500',
  delivered: 'bg-green-500',
  cancelled: 'bg-red-500',
}
function statusBadge(s) { return STATUS_BADGE[s] || STATUS_BADGE.draft }
function statusDot(s)   { return STATUS_DOT[s]   || STATUS_DOT.draft }

// ── Data ──────────────────────────────────────────────────
onMounted(fetchDoc)

async function fetchDoc() {
  loading.value = true
  try {
    const { data } = await api.get(`/erp/delivery-orders/${route.params.id}`)
    doc.value = data.data.deliveryOrder
  } catch {
    notFound.value = true
  } finally {
    loading.value = false
  }
}

const ENDPOINT_MAP = { confirmed: 'confirm', shipped: 'ship', delivered: 'deliver', cancelled: 'cancel' }

async function changeStatus(status) {
  statusError.value    = ''
  updatingStatus.value = true
  try {
    const endpoint = ENDPOINT_MAP[status] || status
    const { data } = await api.post(`/erp/delivery-orders/${doc.value.id}/${endpoint}`)
    doc.value = data.data.deliveryOrder
  } catch (err) {
    statusError.value = err.response?.data?.message || 'Failed to update status'
  } finally {
    updatingStatus.value = false
  }
}

async function confirmDelete() {
  if (!confirm(`Delete delivery order ${doc.value.refNo}? This cannot be undone.`)) return
  try {
    await api.delete(`/erp/delivery-orders/${doc.value.id}`)
    router.push('/erp/delivery-orders')
  } catch (err) {
    statusError.value = err.response?.data?.message || 'Delete failed'
  }
}
</script>
