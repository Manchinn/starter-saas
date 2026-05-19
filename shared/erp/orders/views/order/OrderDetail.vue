<template>
  <AppLayout>
    <div class="space-y-6">

      <!-- Header -->
      <div class="flex items-start gap-4">
        <RouterLink to="/erp/orders"
          class="mt-0.5 p-2 rounded-xl text-[#9BA7B0] hover:text-[#1C2434] hover:bg-white
                 border border-transparent hover:border-[#E2E8F0] transition-all flex-shrink-0">
          <ArrowLeftIcon class="w-[18px] h-[18px]" />
        </RouterLink>
        <div class="flex-1 min-w-0">
          <div class="flex items-center gap-2.5 flex-wrap">
            <h1 class="text-xl font-bold text-[#1C2434]">
              {{ loading ? '…' : (order?.orderNumber || t('erp.orders.detail')) }}
            </h1>
            <span v-if="order && !loading"
              class="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold capitalize"
              :class="statusBadge(order.status)">
              <span class="w-1.5 h-1.5 rounded-full" :class="statusDot(order.status)"></span>
              {{ order.status }}
            </span>
            <DocCurrencyBadge v-if="order" :currency="order.currency" :exchange-rate="order.exchangeRate" :total="order.total" />
          </div>
          <nav class="flex items-center gap-1.5 mt-1">
            <RouterLink to="/erp/orders" class="text-[12px] text-[#9BA7B0] hover:text-[#637381] transition-colors">
              Orders
            </RouterLink>
            <ChevronRightIcon class="w-3 h-3 text-[#CBD5E1]" />
            <span class="text-[12px] text-[#637381]">{{ order?.orderNumber || '…' }}</span>
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
        <span>{{ t('erp.common.notFound') }}
          <RouterLink to="/erp/orders" class="underline ml-1">{{ t('erp.common.backToList') }}</RouterLink>
        </span>
      </div>

      <template v-else>
        <div class="space-y-5">

          <!-- Workflow stepper card -->
          <div class="bg-white rounded-2xl border border-[#E2E8F0] shadow-card overflow-hidden">
            <div class="px-6 py-4 border-b border-[#E2E8F0] flex items-center gap-2.5">
              <BoltIcon class="w-4 h-4 text-[#9BA7B0]" />
              <h3 class="text-sm font-semibold text-[#1C2434]">Workflow</h3>
              <span class="ml-auto inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold capitalize"
                :class="statusBadge(order.status)">
                <span class="w-1.5 h-1.5 rounded-full" :class="statusDot(order.status)"></span>
                {{ order.status }}
              </span>
            </div>
            <div class="px-8 py-6">
              <div class="flex items-start">
                <template v-for="(step, i) in FLOW_STEPS" :key="step.key">
                  <div class="flex flex-col items-center flex-shrink-0 w-24">
                    <div class="w-8 h-8 rounded-full flex items-center justify-center ring-2 transition-all"
                      :class="stepNodeClass(step.key)">
                      <CheckIcon v-if="stepState(step.key) === 'completed'" class="w-4 h-4" />
                      <span v-else-if="stepState(step.key) === 'current'" class="w-2.5 h-2.5 rounded-full bg-white"></span>
                      <span v-else class="text-[11px] font-bold">{{ i + 1 }}</span>
                    </div>
                    <p class="mt-2 text-[11px] font-semibold text-center leading-tight" :class="stepLabelClass(step.key)">
                      {{ step.label }}
                    </p>
                  </div>
                  <div v-if="i < FLOW_STEPS.length - 1"
                    class="flex-1 h-0.5 mt-4 mx-1 rounded-full"
                    :class="connectorClass(step.key)">
                  </div>
                </template>

                <!-- Cancelled terminal -->
                <template v-if="isCancelled">
                  <div class="flex-1 h-0.5 mt-4 mx-1 rounded-full bg-red-200"></div>
                  <div class="flex flex-col items-center flex-shrink-0 w-24">
                    <div class="w-8 h-8 rounded-full bg-red-100 ring-2 ring-red-200 flex items-center justify-center">
                      <XMarkIcon class="w-4 h-4 text-red-500" />
                    </div>
                    <p class="mt-2 text-[11px] font-semibold text-center text-red-600 leading-tight">Cancelled</p>
                  </div>
                </template>
              </div>
            </div>
          </div>

            <!-- Customer + Order info -->
            <div class="grid grid-cols-2 gap-4">
              <div class="bg-white rounded-2xl border border-[#E2E8F0] shadow-card p-5">
                <div class="flex items-center gap-2 mb-3">
                  <div class="w-7 h-7 rounded-lg bg-primary-50 flex items-center justify-center flex-shrink-0">
                    <UserIcon class="w-3.5 h-3.5 text-primary-500" />
                  </div>
                  <p class="text-[11px] font-semibold text-[#637381] uppercase tracking-wider">
                    {{ t('erp.orders.customer') }}
                  </p>
                </div>
                <template v-if="order.customer">
                  <p class="text-sm font-semibold text-[#1C2434]">{{ order.customer.name }}</p>
                  <p v-if="order.customer.company" class="text-xs text-[#637381] mt-0.5">
                    {{ order.customer.company }}
                  </p>
                </template>
                <p v-else class="text-sm text-[#9BA7B0]">—</p>
              </div>

              <div class="bg-white rounded-2xl border border-[#E2E8F0] shadow-card p-5">
                <div class="flex items-center gap-2 mb-3">
                  <div class="w-7 h-7 rounded-lg bg-emerald-50 flex items-center justify-center flex-shrink-0">
                    <DocumentTextIcon class="w-3.5 h-3.5 text-emerald-600" />
                  </div>
                  <p class="text-[11px] font-semibold text-[#637381] uppercase tracking-wider">
                    {{ t('erp.orders.salesOrderInfo') }}
                  </p>
                </div>
                <div class="space-y-1.5">
                  <p class="text-xs text-[#637381]">
                    {{ t('erp.orders.orderDate') }}:
                    <span class="font-semibold text-[#1C2434] ml-1">{{ order.orderDate }}</span>
                  </p>
                  <p class="text-xs text-[#637381]">
                    Created:
                    <span class="font-semibold text-[#1C2434] ml-1">{{ fmtDate(order.createdAt) }}</span>
                  </p>
                </div>
              </div>
            </div>

            <!-- Line Items -->
            <div class="bg-white rounded-2xl border border-[#E2E8F0] shadow-card overflow-hidden">
              <div class="px-6 py-4 border-b border-[#E2E8F0] flex items-center gap-3">
                <div class="w-8 h-8 rounded-xl bg-emerald-50 flex items-center justify-center flex-shrink-0">
                  <ClipboardDocumentListIcon class="w-4 h-4 text-emerald-600" />
                </div>
                <div>
                  <h2 class="text-sm font-semibold text-[#1C2434]">{{ t('erp.orders.lineItems') }}</h2>
                  <p class="text-[11px] text-[#9BA7B0]">
                    {{ order.items?.length || 0 }} item{{ order.items?.length !== 1 ? 's' : '' }}
                  </p>
                </div>
              </div>
              <table class="w-full text-sm">
                <thead class="bg-[#F7F9FC] border-b border-[#E2E8F0]">
                  <tr>
                    <th class="px-5 py-3 text-left text-[11px] font-semibold text-[#637381] uppercase tracking-wider">
                      {{ t('erp.orders.colItem') }}
                    </th>
                    <th class="px-5 py-3 text-right text-[11px] font-semibold text-[#637381] uppercase tracking-wider">
                      {{ t('erp.orders.colQty') }}
                    </th>
                    <th class="px-5 py-3 text-right text-[11px] font-semibold text-[#637381] uppercase tracking-wider">
                      {{ t('erp.orders.colUnitPrice') }}
                    </th>
                    <th class="px-5 py-3 text-right text-[11px] font-semibold text-[#637381] uppercase tracking-wider">
                      {{ t('erp.orders.tax') }} %
                    </th>
                    <th class="px-5 py-3 text-right text-[11px] font-semibold text-[#637381] uppercase tracking-wider">
                      {{ t('erp.orders.colTotal') }}
                    </th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-[#E2E8F0]">
                  <template v-for="item in order.items" :key="item.id">
                    <tr v-if="item.salePackageId && !item.parentItemId" class="bg-primary-50/40">
                      <td class="px-5 py-3 font-semibold text-primary-700">
                        <span class="inline-flex items-center gap-1.5">
                          <CubeIcon class="w-4 h-4" />
                          {{ item.productName }}
                          <span class="text-[11px] font-normal text-[#9BA7B0] ml-1">· {{ t('erp.orders.salePackage') }}</span>
                        </span>
                      </td>
                      <td colspan="3" class="px-5 py-3 text-right text-[12px] italic text-[#637381]">
                        {{ packageChildCount(item.id) }} item{{ packageChildCount(item.id) !== 1 ? 's' : '' }}
                      </td>
                      <td class="px-5 py-3 text-right font-bold text-primary-700 tabular-nums">
                        {{ fmtMoney(packageChildTotal(item.id)) }}
                      </td>
                    </tr>
                    <tr v-else class="hover:bg-[#F7F9FC] transition-colors"
                        :class="item.parentItemId ? 'bg-[#FAFBFD]' : ''">
                      <td class="px-5 py-3.5 font-medium text-[#1C2434]"
                          :class="item.parentItemId ? 'pl-10' : ''">
                        <span v-if="item.parentItemId" class="text-[#CBD5E1] mr-1">↳</span>
                        {{ item.productName }}
                        <span v-if="item.product?.sku" class="text-xs text-[#9BA7B0] ml-1.5">
                          ({{ item.product.sku }})
                        </span>
                      </td>
                      <td class="px-5 py-3.5 text-right text-[#637381] tabular-nums">{{ item.quantity }}</td>
                      <td class="px-5 py-3.5 text-right text-[#637381] tabular-nums">{{ fmtMoney(item.unitPrice) }}</td>
                      <td class="px-5 py-3.5 text-right text-[#637381] tabular-nums">{{ Number(item.taxRate || 0) }}%</td>
                      <td class="px-5 py-3.5 text-right font-semibold text-[#1C2434] tabular-nums">
                        {{ fmtMoney((Number(item.quantity) || 0) * (Number(item.unitPrice) || 0)) }}
                      </td>
                    </tr>
                  </template>
                </tbody>
              </table>
              <div class="border-t border-[#E2E8F0] px-5 py-3 bg-[#F7F9FC] flex items-center justify-between text-sm text-[#637381]">
                <span>{{ order.items?.length || 0 }} item{{ order.items?.length !== 1 ? 's' : '' }}</span>
                <span class="font-semibold text-[#1C2434] tabular-nums">{{ fmtMoney(order.subtotal) }}</span>
              </div>
            </div>

            <!-- Notes -->
            <div v-if="order.notes" class="bg-white rounded-2xl border border-[#E2E8F0] shadow-card p-5">
              <p class="text-[11px] font-semibold text-[#637381] uppercase tracking-wider mb-2">
                {{ t('erp.orders.notes') }}
              </p>
              <p class="text-sm text-[#374151] whitespace-pre-line">{{ order.notes }}</p>
            </div>

          <!-- Summary + Actions -->
          <div class="bg-white rounded-2xl border border-[#E2E8F0] shadow-card overflow-hidden">
            <div class="px-6 py-4 border-b border-[#E2E8F0] flex items-center gap-2.5">
              <CalculatorIcon class="w-4 h-4 text-[#9BA7B0]" />
              <h2 class="text-sm font-semibold text-[#1C2434]">{{ t('erp.orders.orderSummary') }}</h2>
            </div>
            <div class="px-6 py-4 grid grid-cols-3 gap-6">
              <div>
                <p class="text-[11px] font-semibold text-[#9BA7B0] uppercase tracking-wider mb-1">
                  {{ t('erp.orders.items') }}
                </p>
                <p class="text-xl font-bold text-[#1C2434]">{{ order.items?.length || 0 }}</p>
              </div>
              <div>
                <p class="text-[11px] font-semibold text-[#9BA7B0] uppercase tracking-wider mb-1">
                  {{ t('erp.orders.subtotal') }}
                </p>
                <p class="text-xl font-bold text-[#1C2434] tabular-nums">{{ fmtMoney(order.subtotal) }}</p>
              </div>
              <div>
                <p class="text-[11px] font-semibold text-[#9BA7B0] uppercase tracking-wider mb-1">
                  {{ t('erp.orders.tax') }}
                </p>
                <p class="text-xl font-bold text-[#1C2434] tabular-nums">{{ fmtMoney(order.tax) }}</p>
              </div>
            </div>
            <div class="px-6 py-5 bg-[#F7F9FC] border-t border-[#E2E8F0] flex items-center justify-between">
              <div>
                <p class="text-[11px] font-semibold text-[#9BA7B0] uppercase tracking-wider">
                  {{ t('erp.orders.total') }}
                </p>
                <p class="text-2xl font-bold text-primary-600 tabular-nums mt-0.5">{{ fmtMoney(order.total) }}</p>
              </div>
              <div v-can="'erp.orders.edit'" class="flex items-center gap-2.5">
                <button v-for="s in forwardTransitions" :key="s"
                  @click="changeStatus(s)" :disabled="updatingStatus"
                  class="px-4 py-2.5 text-sm font-semibold rounded-xl transition-colors disabled:opacity-50
                         flex items-center gap-2"
                  :class="forwardBtnClass(s)">
                  <ArrowPathIcon v-if="updatingStatus" class="w-4 h-4 animate-spin" />
                  <template v-else>{{ transitionLabel(s) }}</template>
                </button>
                <button v-for="s in cancelTransitions" :key="s"
                  @click="changeStatus(s)" :disabled="updatingStatus"
                  class="px-4 py-2 text-sm font-medium border border-red-200 text-red-600
                         hover:bg-red-50 rounded-xl transition-colors disabled:opacity-50">
                  {{ t('erp.orders.cancelOrder') }}
                </button>
              </div>
            </div>
            <p v-if="statusError" class="px-6 py-3 text-xs text-red-600 border-t border-[#E2E8F0]">
              {{ statusError }}
            </p>
          </div>

          <!-- Conversion actions (confirmed / shipped / delivered) -->
          <div v-if="['confirmed', 'shipped', 'delivered'].includes(order.status)" class="flex flex-wrap gap-2 items-center">
            <button v-can="'erp.orders.edit'" @click="convertToDeliveryOrder"
              :disabled="converting || !!order.linkedDeliveryOrder"
              :title="order.linkedDeliveryOrder ? `Already linked to ${order.linkedDeliveryOrder.refNo}` : ''"
              class="flex items-center gap-1.5 px-4 py-2 text-sm font-medium bg-primary-50 text-primary-600 border border-primary-200
                     rounded-xl hover:bg-primary-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
              <TruckIcon class="w-4 h-4" />
              {{ converting === 'do' ? t('erp.common.saving') : t('erp.orders.createDeliveryOrder') }}
            </button>
            <RouterLink v-if="order.linkedDeliveryOrder" :to="`/erp/delivery-orders/${order.linkedDeliveryOrder.id}`"
              class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700 hover:bg-blue-100">
              → {{ order.linkedDeliveryOrder.refNo }}
            </RouterLink>

            <button v-can="'erp.invoices.edit'" @click="convertToInvoice"
              :disabled="converting || !!order.linkedInvoice"
              :title="order.linkedInvoice ? `Already linked to ${order.linkedInvoice.invoiceNumber}` : ''"
              class="flex items-center gap-1.5 px-4 py-2 text-sm font-medium bg-primary-50 text-primary-600 border border-primary-200
                     rounded-xl hover:bg-primary-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
              <DocumentTextIcon class="w-4 h-4" />
              {{ converting === 'inv' ? t('erp.common.saving') : t('erp.orders.createInvoice') }}
            </button>
            <RouterLink v-if="order.linkedInvoice" :to="`/erp/invoices/${order.linkedInvoice.id}`"
              class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700 hover:bg-blue-100">
              → {{ order.linkedInvoice.invoiceNumber }}
            </RouterLink>

            <span v-if="convertError" class="self-center text-xs text-red-600">{{ convertError }}</span>
          </div>

          <!-- Edit / Delete (draft only) -->
          <div v-if="order.status === 'draft'" class="flex justify-end gap-2">
            <RouterLink v-can="'erp.orders.edit'" :to="`/erp/orders/${order.id}/edit`"
              class="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-primary-600 border border-primary-200
                     rounded-xl hover:bg-primary-50 transition-colors">
              <PencilSquareIcon class="w-4 h-4" />
              {{ t('erp.orders.editOrder') }}
            </RouterLink>
            <button v-can="'erp.orders.delete'" @click="confirmDelete"
              class="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-red-500 border border-red-200
                     rounded-xl hover:bg-red-50 transition-colors">
              <TrashIcon class="w-4 h-4" />
              {{ t('erp.orders.deleteOrder') }}
            </button>
          </div>

        </div>
        <ActivityTimeline v-if="order" ref-type="Order" :ref-id="order.id" />
      </template>
    </div>
  </AppLayout>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { RouterLink, useRoute, useRouter } from 'vue-router'
import ActivityTimeline from '@/components/ActivityTimeline.vue'
import DocCurrencyBadge from '@/components/DocCurrencyBadge.vue'
import {
  ArrowLeftIcon, ChevronRightIcon, UserIcon, DocumentTextIcon,
  ClipboardDocumentListIcon, CheckIcon, XMarkIcon, TrashIcon, PencilSquareIcon,
  BoltIcon, ArrowPathIcon, ExclamationCircleIcon, CalculatorIcon, TruckIcon,
  CubeIcon,
} from '@heroicons/vue/24/outline'
import AppLayout from '@/layouts/AppLayout.vue'
import api from '@/api'
import { fmtMoney } from '@/utils/fmt'

const { t }          = useI18n()
const route          = useRoute()
const router         = useRouter()
const order          = ref(null)
const loading        = ref(true)
const notFound       = ref(false)
const updatingStatus = ref(false)
const statusError    = ref('')
const converting     = ref('')
const convertError   = ref('')

async function convertToDeliveryOrder() {
  convertError.value = ''
  converting.value = 'do'
  try {
    const { data } = await api.post(`/erp/orders/${order.value.id}/create-delivery-order`)
    router.push(`/erp/delivery-orders/${data.data.id}`)
  } catch (err) {
    convertError.value = err.response?.data?.message || 'Failed to create delivery order'
  } finally { converting.value = '' }
}

async function convertToInvoice() {
  convertError.value = ''
  converting.value = 'inv'
  try {
    const { data } = await api.post(`/erp/orders/${order.value.id}/create-invoice`)
    router.push(`/erp/invoices/${data.data.id}`)
  } catch (err) {
    convertError.value = err.response?.data?.message || 'Failed to create invoice'
  } finally { converting.value = '' }
}

// ── Workflow ──────────────────────────────────────────────
const FLOW_STEPS = [
  { key: 'draft',     label: 'Draft' },
  { key: 'confirmed', label: 'Confirmed' },
  { key: 'shipped',   label: 'Shipped' },
  { key: 'delivered', label: 'Delivered' },
]

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

const availableTransitions = computed(() => TRANSITIONS[order.value?.status] || [])
const forwardTransitions   = computed(() => availableTransitions.value.filter(s => s !== 'cancelled'))
const cancelTransitions    = computed(() => availableTransitions.value.filter(s => s === 'cancelled'))
const isCancelled          = computed(() => order.value?.status === 'cancelled')

function stepState(key) {
  const cur = order.value?.status
  if (!cur || cur === key) return cur === key ? 'current' : 'upcoming'
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
  shipped:   'bg-amber-500 text-white hover:bg-amber-600',
  delivered: 'bg-green-600 text-white hover:bg-green-700',
}
function forwardBtnClass(s) { return FORWARD_BTN[s] || 'bg-primary-500 text-white hover:bg-primary-600' }

const TRANSITION_LABELS = {
  confirmed: 'Confirm Order',
  shipped:   'Mark as Shipped',
  delivered: 'Mark as Delivered',
}
function transitionLabel(s) { return TRANSITION_LABELS[s] || s }

// ── Status badge ──────────────────────────────────────────
const STATUS_BADGE = {
  draft:     'bg-[#F1F5F9] text-[#637381]',
  confirmed: 'bg-blue-50 text-blue-700',
  shipped:   'bg-amber-50 text-amber-700',
  delivered: 'bg-green-50 text-green-700',
  cancelled: 'bg-red-50 text-red-600',
}
const STATUS_DOT = {
  draft:     'bg-slate-400',
  confirmed: 'bg-blue-500',
  shipped:   'bg-amber-500',
  delivered: 'bg-green-500',
  cancelled: 'bg-red-500',
}
function statusBadge(s) { return STATUS_BADGE[s] || STATUS_BADGE.draft }
function statusDot(s)   { return STATUS_DOT[s]   || STATUS_DOT.draft }

// ── Data ──────────────────────────────────────────────────
onMounted(fetchOrder)

async function fetchOrder() {
  loading.value = true
  try {
    const { data } = await api.get(`/erp/orders/${route.params.id}`)
    order.value = data.data.order
  } catch {
    notFound.value = true
  } finally {
    loading.value = false
  }
}

async function changeStatus(status) {
  statusError.value    = ''
  updatingStatus.value = true
  try {
    const { data } = await api.patch(`/erp/orders/${order.value.id}/status`, { status })
    order.value = data.data.order
  } catch (err) {
    statusError.value = err.response?.data?.message || 'Failed to update status'
  } finally {
    updatingStatus.value = false
  }
}

async function confirmDelete() {
  if (!confirm(`Delete order ${order.value.orderNumber}? This cannot be undone.`)) return
  try {
    await api.delete(`/erp/orders/${order.value.id}`)
    router.push('/erp/orders')
  } catch (err) {
    statusError.value = err.response?.data?.message || 'Delete failed'
  }
}

function fmtDate(d) { return d ? new Date(d).toLocaleDateString() : '—' }

function packageChildren(parentId) {
  return (order.value?.items || []).filter(i => i.parentItemId === parentId)
}
function packageChildCount(parentId) { return packageChildren(parentId).length }
function packageChildTotal(parentId) {
  return packageChildren(parentId).reduce(
    (s, c) => s + (Number(c.quantity) || 0) * (Number(c.unitPrice) || 0),
    0,
  )
}
</script>
