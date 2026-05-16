<template>
  <AppLayout>
    <div class="max-w-7xl space-y-6">

      <!-- Header -->
      <div class="flex items-start gap-4">
        <RouterLink to="/erp/invoices"
          class="mt-0.5 p-2 rounded-xl text-[#9BA7B0] hover:text-[#1C2434] hover:bg-white
                 border border-transparent hover:border-[#E2E8F0] transition-all flex-shrink-0">
          <ArrowLeftIcon class="w-[18px] h-[18px]" />
        </RouterLink>
        <div class="flex-1 min-w-0">
          <div class="flex items-center gap-2.5 flex-wrap">
            <h1 class="text-xl font-bold text-[#1C2434]">{{ loading ? '…' : (invoice?.invoiceNumber || t('erp.invoices.title')) }}</h1>
            <span v-if="invoice && !loading"
              class="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold capitalize"
              :class="statusBadge(invoice.status)">
              <span class="w-1.5 h-1.5 rounded-full" :class="statusDot(invoice.status)"></span>
              {{ invoice.status }}
            </span>
            <span v-if="isOverdue"
              class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold
                     bg-red-100 text-red-600 border border-red-200">
              <ExclamationTriangleIcon class="w-3 h-3" />
              {{ t('erp.invoices.overdue') }}
            </span>
          </div>
          <nav class="flex items-center gap-1.5 mt-1">
            <RouterLink to="/erp/invoices" class="text-[12px] text-[#9BA7B0] hover:text-[#637381] transition-colors">
              {{ t('erp.invoices.title') }}
            </RouterLink>
            <ChevronRightIcon class="w-3 h-3 text-[#CBD5E1]" />
            <span class="text-[12px] text-[#637381]">{{ invoice?.invoiceNumber || '…' }}</span>
          </nav>
          <!-- Source-doc badges -->
          <div v-if="invoice && !loading && (invoice.order || invoice.deliveryOrder)" class="flex items-center gap-1.5 mt-2 flex-wrap">
            <span class="text-[11px] text-[#9BA7B0] font-medium">{{ t('erp.common.source') }}:</span>
            <RouterLink v-if="invoice.order" :to="`/erp/orders/${invoice.order.id}`"
              class="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium bg-indigo-50 text-indigo-700 hover:bg-indigo-100">
              <ShoppingCartIcon class="w-3 h-3" /> {{ invoice.order.orderNumber }}
            </RouterLink>
            <RouterLink v-if="invoice.deliveryOrder" :to="`/erp/delivery-orders/${invoice.deliveryOrder.id}`"
              class="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium bg-purple-50 text-purple-700 hover:bg-purple-100">
              <TruckIcon class="w-3 h-3" /> {{ invoice.deliveryOrder.refNo }}
            </RouterLink>
          </div>
        </div>
        <RouterLink
          v-if="invoice?.status === 'draft'"
          v-can="'erp.invoices.edit'"
          :to="`/erp/invoices/${invoice.id}/edit`"
          class="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-[#637381]
                 bg-white border border-[#E2E8F0] rounded-xl hover:bg-[#F7F9FC] transition-colors flex-shrink-0">
          <PencilIcon class="w-4 h-4" />
          {{ t('common.edit') }}
        </RouterLink>
      </div>

      <!-- Loading -->
      <div v-if="loading" class="flex items-center justify-center py-20">
        <div class="w-7 h-7 border-2 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
      </div>

      <!-- Not found -->
      <div v-else-if="notFound"
        class="flex items-start gap-3 bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3.5 rounded-xl">
        <ExclamationCircleIcon class="w-5 h-5 flex-shrink-0 mt-0.5" />
        <span>{{ t('erp.invoices.notFound') }}
          <RouterLink to="/erp/invoices" class="underline ml-1">{{ t('erp.common.backToList') }}</RouterLink>
        </span>
      </div>

      <template v-else>
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">

          <!-- LEFT: Document content (2 cols) -->
          <div class="lg:col-span-2 space-y-5">

            <!-- Customer + Invoice details -->
            <div class="grid grid-cols-2 gap-4">
              <div class="bg-white rounded-2xl border border-[#E2E8F0] shadow-card p-5">
                <div class="flex items-center gap-2 mb-3">
                  <div class="w-7 h-7 rounded-lg bg-primary-50 flex items-center justify-center flex-shrink-0">
                    <UserIcon class="w-3.5 h-3.5 text-primary-500" />
                  </div>
                  <p class="text-[11px] font-semibold text-[#637381] uppercase tracking-wider">{{ t('erp.common.customer') }}</p>
                </div>
                <template v-if="invoice.customer">
                  <p class="text-sm font-semibold text-[#1C2434]">{{ invoice.customer.name }}</p>
                  <p v-if="invoice.customer.company" class="text-xs text-[#637381] mt-0.5">
                    {{ invoice.customer.company }}
                  </p>
                </template>
                <p v-else class="text-sm text-[#9BA7B0]">—</p>
              </div>

              <div class="bg-white rounded-2xl border border-[#E2E8F0] shadow-card p-5">
                <div class="flex items-center gap-2 mb-3">
                  <div class="w-7 h-7 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0">
                    <DocumentTextIcon class="w-3.5 h-3.5 text-blue-600" />
                  </div>
                  <p class="text-[11px] font-semibold text-[#637381] uppercase tracking-wider">{{ t('erp.invoices.title') }}</p>
                </div>
                <div class="space-y-1.5">
                  <p class="text-xs text-[#637381]">
                    {{ t('erp.invoices.invoiceDate') }}: <span class="font-semibold text-[#1C2434] ml-1">{{ invoice.invoiceDate }}</span>
                  </p>
                  <p class="text-xs" :class="isOverdue ? 'text-red-600' : 'text-[#637381]'">
                    {{ t('erp.invoices.dueDate') }}:
                    <span class="font-semibold ml-1" :class="isOverdue ? 'text-red-700' : 'text-[#1C2434]'">
                      {{ invoice.dueDate || '—' }}
                    </span>
                  </p>
                  <p v-if="invoice.order" class="text-xs text-[#637381]">
                    {{ t('erp.invoices.referenceOrder') }}:
                    <RouterLink :to="`/erp/orders/${invoice.order.id}`"
                      class="font-semibold text-primary-500 hover:underline ml-1">
                      {{ invoice.order.orderNumber }}
                    </RouterLink>
                  </p>
                  <p v-if="invoice.taxRate" class="text-xs text-[#637381]">
                    {{ t('erp.invoices.taxRate') }}: <span class="font-semibold text-[#1C2434] ml-1">{{ invoice.taxRate }}%</span>
                  </p>
                </div>
              </div>
            </div>

            <!-- Line Items -->
            <div class="bg-white rounded-2xl border border-[#E2E8F0] shadow-card overflow-hidden">
              <div class="px-6 py-4 border-b border-[#E2E8F0] flex items-center gap-3">
                <div class="w-8 h-8 rounded-xl bg-blue-50 flex items-center justify-center flex-shrink-0">
                  <ClipboardDocumentListIcon class="w-4 h-4 text-blue-600" />
                </div>
                <div>
                  <h2 class="text-sm font-semibold text-[#1C2434]">{{ t('erp.common.items') }}</h2>
                  <p class="text-[11px] text-[#9BA7B0]">
                    {{ invoice.items?.length || 0 }} item{{ invoice.items?.length !== 1 ? 's' : '' }}
                  </p>
                </div>
              </div>
              <table class="w-full text-sm">
                <thead class="bg-[#F7F9FC] border-b border-[#E2E8F0]">
                  <tr>
                    <th class="px-5 py-3 text-left text-[11px] font-semibold text-[#637381] uppercase tracking-wider">{{ t('erp.invoices.colItem') }}</th>
                    <th class="px-5 py-3 text-left text-[11px] font-semibold text-[#637381] uppercase tracking-wider">{{ t('erp.invoices.colDescription') }}</th>
                    <th class="px-5 py-3 text-right text-[11px] font-semibold text-[#637381] uppercase tracking-wider">{{ t('erp.common.qty') }}</th>
                    <th class="px-5 py-3 text-right text-[11px] font-semibold text-[#637381] uppercase tracking-wider">{{ t('erp.invoices.colUnitPrice') }}</th>
                    <th class="px-5 py-3 text-right text-[11px] font-semibold text-[#637381] uppercase tracking-wider">{{ t('erp.invoices.total') }}</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-[#E2E8F0]">
                  <tr v-for="item in invoice.items" :key="item.id" class="hover:bg-[#F7F9FC] transition-colors">
                    <td class="px-5 py-3.5 font-medium text-[#1C2434]">{{ item.productName }}</td>
                    <td class="px-5 py-3.5 text-[#637381] text-xs">{{ item.description || '—' }}</td>
                    <td class="px-5 py-3.5 text-right text-[#637381] tabular-nums">{{ item.quantity }}</td>
                    <td class="px-5 py-3.5 text-right text-[#637381] tabular-nums">{{ fmtMoney(item.unitPrice) }}</td>
                    <td class="px-5 py-3.5 text-right font-semibold text-[#1C2434] tabular-nums">
                      {{ fmtMoney(item.total) }}
                    </td>
                  </tr>
                </tbody>
              </table>
              <div class="border-t border-[#E2E8F0] px-5 py-4 space-y-2 bg-[#F7F9FC]">
                <div class="flex items-center justify-between text-sm text-[#637381]">
                  <span>{{ t('erp.invoices.subtotal') }}</span>
                  <span class="font-medium text-[#1C2434] tabular-nums">{{ fmtMoney(invoice.subtotal) }}</span>
                </div>
                <div class="flex items-center justify-between text-sm text-[#637381]">
                  <span>{{ t('erp.invoices.tax') }}</span>
                  <span class="font-medium text-[#1C2434] tabular-nums">{{ fmtMoney(invoice.tax) }}</span>
                </div>
                <div class="flex items-center justify-between text-base font-bold text-[#1C2434]
                            pt-2.5 border-t border-[#E2E8F0]">
                  <span>{{ t('erp.invoices.total') }}</span>
                  <span class="text-primary-500 tabular-nums">{{ fmtMoney(invoice.total) }}</span>
                </div>
              </div>
            </div>

            <!-- Notes -->
            <div v-if="invoice.notes" class="bg-white rounded-2xl border border-[#E2E8F0] shadow-card p-5">
              <p class="text-[11px] font-semibold text-[#637381] uppercase tracking-wider mb-2">{{ t('erp.common.notes') }}</p>
              <p class="text-sm text-[#374151] whitespace-pre-line">{{ invoice.notes }}</p>
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
                  :class="statusBadge(invoice.status)">
                  <span class="w-1.5 h-1.5 rounded-full" :class="statusDot(invoice.status)"></span>
                  {{ invoice.status }}
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

              <!-- Overdue alert (inside workflow card) -->
              <div v-if="isOverdue"
                class="mx-5 mb-4 flex items-center gap-2 px-3 py-2.5 bg-red-50 border border-red-200 rounded-xl">
                <ExclamationTriangleIcon class="w-4 h-4 text-red-500 flex-shrink-0" />
                <p class="text-xs font-semibold text-red-700">{{ t('erp.invoices.overdue') }}</p>
              </div>

              <!-- Actions -->
              <div v-can="'erp.invoices.edit'" v-if="availableTransitions.length"
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
                <button v-for="s in cancelTransitions" :key="s"
                  @click="changeStatus(s)" :disabled="updatingStatus"
                  class="w-full py-2 text-sm font-medium border border-red-200 text-red-600
                         hover:bg-red-50 rounded-xl transition-colors disabled:opacity-50">
                  {{ t('erp.invoices.cancelInvoice') }}
                </button>
                <p v-if="statusError" class="text-xs text-red-600">{{ statusError }}</p>
              </div>
            </div>

            <!-- Conversion: Invoice → Receipt (when sent or paid) -->
            <div v-if="['sent', 'paid'].includes(invoice.status)" v-can="'erp.receipts.edit'"
              class="bg-white rounded-2xl border border-[#E2E8F0] shadow-card p-4 space-y-2">
              <p class="text-[11px] font-semibold text-[#637381] uppercase tracking-wider">{{ t('erp.common.actions') }}</p>
              <button @click="convertToReceipt" :disabled="converting || !!invoice.linkedReceipt"
                :title="invoice.linkedReceipt ? `Already linked to ${invoice.linkedReceipt.receiptNumber}` : ''"
                class="w-full py-2.5 text-sm font-medium bg-primary-50 text-primary-600 border border-primary-200
                       rounded-xl hover:bg-primary-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2">
                <BanknotesIcon class="w-4 h-4" />
                {{ converting ? t('erp.common.saving') : t('erp.invoices.recordPayment') }}
              </button>
              <RouterLink v-if="invoice.linkedReceipt" :to="`/erp/receipts/${invoice.linkedReceipt.id}`"
                class="block text-center text-xs text-blue-700 hover:text-blue-900 hover:underline font-medium">
                → {{ invoice.linkedReceipt.receiptNumber }}
              </RouterLink>
              <p v-if="convertError" class="text-xs text-red-600">{{ convertError }}</p>
            </div>

            <!-- Delete (draft only) -->
            <div v-if="invoice.status === 'draft'" v-can="'erp.invoices.delete'"
              class="bg-white rounded-2xl border border-[#E2E8F0] shadow-card p-4">
              <button @click="confirmDelete"
                class="w-full py-2 text-sm font-medium text-red-500 border border-red-200
                       rounded-xl hover:bg-red-50 transition-colors flex items-center justify-center gap-2">
                <TrashIcon class="w-4 h-4" />
                {{ t('erp.invoices.deleteInvoice') }}
              </button>
            </div>

          </div>
        </div>
        <AttachmentsPanel v-if="invoice" ref-type="Invoice" :ref-id="invoice.id" />
        <ActivityTimeline v-if="invoice" ref-type="Invoice" :ref-id="invoice.id" />
      </template>
    </div>
  </AppLayout>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import {
  ArrowLeftIcon, ChevronRightIcon, UserIcon, DocumentTextIcon,
  ClipboardDocumentListIcon, CheckIcon, XMarkIcon, TrashIcon,
  BoltIcon, ArrowPathIcon, ExclamationCircleIcon, PencilIcon,
  ExclamationTriangleIcon, BanknotesIcon, ShoppingCartIcon, TruckIcon,
} from '@heroicons/vue/24/outline'
import AppLayout from '@/layouts/AppLayout.vue'
import AttachmentsPanel from '@/components/AttachmentsPanel.vue'
import ActivityTimeline from '@/components/ActivityTimeline.vue'
import api from '@/api'
import { fmtMoney } from '@/utils/fmt'

const { t } = useI18n()
const route          = useRoute()
const router         = useRouter()
const invoice        = ref(null)
const loading        = ref(true)
const notFound       = ref(false)
const updatingStatus = ref(false)
const statusError    = ref('')
const converting     = ref(false)
const convertError   = ref('')

async function convertToReceipt() {
  convertError.value = ''
  converting.value = true
  try {
    const { data } = await api.post(`/erp/invoices/${invoice.value.id}/create-receipt`)
    router.push(`/erp/receipts/${data.data.id}`)
  } catch (err) {
    convertError.value = err.response?.data?.message || 'Failed to create receipt'
  } finally { converting.value = false }
}

// ── Workflow ──────────────────────────────────────────────
const FLOW_STEPS = computed(() => [
  { key: 'draft', label: t('erp.common.draft') },
  { key: 'sent',  label: t('erp.invoices.statusSent') },
  { key: 'paid',  label: t('erp.invoices.statusPaid') },
])

const COMPLETED_BEFORE = {
  draft:     [],
  sent:      ['draft'],
  paid:      ['draft', 'sent'],
  cancelled: [],
}

const TRANSITIONS = {
  draft:     ['sent', 'cancelled'],
  sent:      ['paid', 'cancelled'],
  paid:      [],
  cancelled: [],
}

const availableTransitions = computed(() => TRANSITIONS[invoice.value?.status] || [])
const forwardTransitions   = computed(() => availableTransitions.value.filter(s => s !== 'cancelled'))
const cancelTransitions    = computed(() => availableTransitions.value.filter(s => s === 'cancelled'))
const isCancelled          = computed(() => invoice.value?.status === 'cancelled')

const isOverdue = computed(() =>
  invoice.value?.status === 'sent' &&
  invoice.value?.dueDate &&
  new Date(invoice.value.dueDate) < new Date()
)

function stepState(key) {
  const cur = invoice.value?.status
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
  sent: 'bg-blue-600 text-white hover:bg-blue-700',
  paid: 'bg-green-600 text-white hover:bg-green-700',
}
function forwardBtnClass(s) { return FORWARD_BTN[s] || 'bg-primary-500 text-white hover:bg-primary-600' }

function transitionLabel(s) {
  const labels = {
    sent: t('erp.invoices.markSent'),
    paid: t('erp.invoices.markPaid'),
  }
  return labels[s] || s
}

// ── Status badge ──────────────────────────────────────────
const STATUS_BADGE = {
  draft:     'bg-[#F1F5F9] text-[#637381]',
  sent:      'bg-blue-50 text-blue-700',
  paid:      'bg-green-50 text-green-700',
  cancelled: 'bg-red-50 text-red-600',
}
const STATUS_DOT = {
  draft:     'bg-slate-400',
  sent:      'bg-blue-500',
  paid:      'bg-green-500',
  cancelled: 'bg-red-500',
}
function statusBadge(s) { return STATUS_BADGE[s] || STATUS_BADGE.draft }
function statusDot(s)   { return STATUS_DOT[s]   || STATUS_DOT.draft }

// ── Data ──────────────────────────────────────────────────
onMounted(fetchInvoice)

async function fetchInvoice() {
  loading.value = true
  try {
    const { data } = await api.get(`/erp/invoices/${route.params.id}`)
    invoice.value = data.data.invoice
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
    const { data } = await api.patch(`/erp/invoices/${invoice.value.id}/status`, { status })
    invoice.value = data.data.invoice
  } catch (err) {
    statusError.value = err.response?.data?.message || 'Failed to update status'
  } finally {
    updatingStatus.value = false
  }
}

async function confirmDelete() {
  if (!confirm(`Delete invoice ${invoice.value.invoiceNumber}? This cannot be undone.`)) return
  try {
    await api.delete(`/erp/invoices/${invoice.value.id}`)
    router.push('/erp/invoices')
  } catch (err) {
    statusError.value = err.response?.data?.message || 'Delete failed'
  }
}
</script>
