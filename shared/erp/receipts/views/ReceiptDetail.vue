<template>
  <AppLayout>
    <div class="max-w-7xl space-y-6">

      <!-- Header -->
      <div class="flex items-start gap-4">
        <RouterLink to="/erp/receipts"
          class="mt-0.5 p-2 rounded-xl text-[#9BA7B0] hover:text-[#1C2434] hover:bg-white
                 border border-transparent hover:border-[#E2E8F0] transition-all flex-shrink-0">
          <ArrowLeftIcon class="w-[18px] h-[18px]" />
        </RouterLink>
        <div class="flex-1 min-w-0">
          <div class="flex items-center gap-2.5 flex-wrap">
            <h1 class="text-xl font-bold text-[#1C2434]">{{ loading ? '…' : (receipt?.receiptNumber || t('erp.receipts.title')) }}</h1>
            <span v-if="receipt && !loading"
              class="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold capitalize"
              :class="statusBadge(receipt.status)">
              <span class="w-1.5 h-1.5 rounded-full" :class="statusDot(receipt.status)"></span>
              {{ receipt.status }}
            </span>
          </div>
          <nav class="flex items-center gap-1.5 mt-1">
            <RouterLink to="/erp/receipts" class="text-[12px] text-[#9BA7B0] hover:text-[#637381] transition-colors">
              {{ t('erp.receipts.title') }}
            </RouterLink>
            <ChevronRightIcon class="w-3 h-3 text-[#CBD5E1]" />
            <span class="text-[12px] text-[#637381]">{{ receipt?.receiptNumber || '…' }}</span>
          </nav>
          <div v-if="receipt && !loading && receipt.invoice" class="flex items-center gap-1.5 mt-2 flex-wrap">
            <span class="text-[11px] text-[#9BA7B0] font-medium">{{ t('erp.common.source') }}:</span>
            <RouterLink :to="`/erp/invoices/${receipt.invoice.id}`"
              class="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium bg-indigo-50 text-indigo-700 hover:bg-indigo-100">
              <DocumentTextIcon class="w-3 h-3" /> {{ receipt.invoice.invoiceNumber }}
            </RouterLink>
          </div>
        </div>
        <RouterLink
          v-if="receipt?.status === 'draft'"
          v-can="'erp.receipts.edit'"
          :to="`/erp/receipts/${receipt.id}/edit`"
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
        <span>{{ t('erp.receipts.notFound') }}
          <RouterLink to="/erp/receipts" class="underline ml-1">{{ t('erp.common.backToList') }}</RouterLink>
        </span>
      </div>

      <template v-else>
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">

          <!-- LEFT: Document content (2 cols) -->
          <div class="lg:col-span-2 space-y-5">

            <!-- Customer + Receipt details -->
            <div class="grid grid-cols-2 gap-4">
              <div class="bg-white rounded-2xl border border-[#E2E8F0] shadow-card p-5">
                <div class="flex items-center gap-2 mb-3">
                  <div class="w-7 h-7 rounded-lg bg-primary-50 flex items-center justify-center flex-shrink-0">
                    <UserIcon class="w-3.5 h-3.5 text-primary-500" />
                  </div>
                  <p class="text-[11px] font-semibold text-[#637381] uppercase tracking-wider">{{ t('erp.common.customer') }}</p>
                </div>
                <template v-if="receipt.customer">
                  <p class="text-sm font-semibold text-[#1C2434]">{{ receipt.customer.name }}</p>
                  <p v-if="receipt.customer.company" class="text-xs text-[#637381] mt-0.5">
                    {{ receipt.customer.company }}
                  </p>
                </template>
                <p v-else class="text-sm text-[#9BA7B0]">—</p>
              </div>

              <div class="bg-white rounded-2xl border border-[#E2E8F0] shadow-card p-5">
                <div class="flex items-center gap-2 mb-3">
                  <div class="w-7 h-7 rounded-lg bg-green-50 flex items-center justify-center flex-shrink-0">
                    <BanknotesIcon class="w-3.5 h-3.5 text-green-600" />
                  </div>
                  <p class="text-[11px] font-semibold text-[#637381] uppercase tracking-wider">{{ t('erp.receipts.paymentDetails') }}</p>
                </div>
                <div class="space-y-1.5">
                  <p class="text-xs text-[#637381]">
                    {{ t('erp.common.date') }}: <span class="font-semibold text-[#1C2434] ml-1">{{ receipt.receiptDate }}</span>
                  </p>
                  <p class="text-xs text-[#637381]">
                    {{ t('erp.receipts.colMethod') }}:
                    <span class="inline-flex items-center ml-1 px-2 py-0.5 rounded-md bg-[#F1F5F9] text-xs font-semibold text-[#374151]">
                      {{ methodLabel(receipt.paymentMethod) }}
                    </span>
                  </p>
                  <p v-if="receipt.reference" class="text-xs text-[#637381]">
                    Ref: <span class="font-semibold font-mono text-[#1C2434] ml-1">{{ receipt.reference }}</span>
                  </p>
                  <p v-if="receipt.invoice" class="text-xs text-[#637381]">
                    {{ t('erp.receipts.referenceInvoice') }}:
                    <RouterLink :to="`/erp/invoices/${receipt.invoice.id}`"
                      class="font-semibold text-primary-500 hover:underline ml-1">
                      {{ receipt.invoice.invoiceNumber }}
                    </RouterLink>
                  </p>
                </div>
              </div>
            </div>

            <!-- Amount card -->
            <div class="bg-white rounded-2xl border border-[#E2E8F0] shadow-card p-6">
              <div class="flex items-center justify-between">
                <div class="flex items-center gap-4">
                  <div class="w-12 h-12 rounded-2xl bg-green-50 border border-green-100 flex items-center justify-center flex-shrink-0">
                    <BanknotesIcon class="w-6 h-6 text-green-600" />
                  </div>
                  <div>
                    <p class="text-[11px] font-semibold text-[#637381] uppercase tracking-wider mb-0.5">
                      {{ t('erp.receipts.amountReceived') }}
                    </p>
                    <p class="text-3xl font-extrabold text-[#1C2434] tabular-nums">{{ fmtMoney(receipt.amount) }}</p>
                  </div>
                </div>
                <span :class="statusBadge(receipt.status)"
                  class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-semibold capitalize">
                  <span class="w-2 h-2 rounded-full" :class="statusDot(receipt.status)"></span>
                  {{ receipt.status }}
                </span>
              </div>
            </div>

            <!-- Notes -->
            <div v-if="receipt.notes" class="bg-white rounded-2xl border border-[#E2E8F0] shadow-card p-5">
              <p class="text-[11px] font-semibold text-[#637381] uppercase tracking-wider mb-2">{{ t('erp.common.notes') }}</p>
              <p class="text-sm text-[#374151] whitespace-pre-line">{{ receipt.notes }}</p>
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
                  :class="statusBadge(receipt.status)">
                  <span class="w-1.5 h-1.5 rounded-full" :class="statusDot(receipt.status)"></span>
                  {{ receipt.status }}
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
              <div v-can="'erp.receipts.edit'" v-if="availableTransitions.length"
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
                  {{ t('erp.receipts.cancelReceipt') }}
                </button>
                <p v-if="statusError" class="text-xs text-red-600">{{ statusError }}</p>
              </div>
            </div>

            <!-- Delete (draft only) -->
            <div v-if="receipt.status === 'draft'" v-can="'erp.receipts.delete'"
              class="bg-white rounded-2xl border border-[#E2E8F0] shadow-card p-4">
              <button @click="confirmDelete"
                class="w-full py-2 text-sm font-medium text-red-500 border border-red-200
                       rounded-xl hover:bg-red-50 transition-colors flex items-center justify-center gap-2">
                <TrashIcon class="w-4 h-4" />
                {{ t('erp.receipts.deleteReceipt') }}
              </button>
            </div>

          </div>
        </div>
      </template>
    </div>
  </AppLayout>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import {
  ArrowLeftIcon, ChevronRightIcon, UserIcon, BanknotesIcon,
  CheckIcon, XMarkIcon, TrashIcon, BoltIcon, ArrowPathIcon,
  ExclamationCircleIcon, PencilIcon, DocumentTextIcon,
} from '@heroicons/vue/24/outline'
import AppLayout from '@/layouts/AppLayout.vue'
import api from '@/api'
import { fmtMoney } from '@/utils/fmt'

const { t } = useI18n()
const route          = useRoute()
const router         = useRouter()
const receipt        = ref(null)
const loading        = ref(true)
const notFound       = ref(false)
const updatingStatus = ref(false)
const statusError    = ref('')

// ── Workflow ──────────────────────────────────────────────
const FLOW_STEPS = computed(() => [
  { key: 'draft',     label: t('erp.common.draft') },
  { key: 'confirmed', label: t('erp.common.confirmed') },
])

const COMPLETED_BEFORE = {
  draft:     [],
  confirmed: ['draft'],
  cancelled: [],
}

const TRANSITIONS = {
  draft:     ['confirmed', 'cancelled'],
  confirmed: ['cancelled'],
  cancelled: [],
}

const availableTransitions = computed(() => TRANSITIONS[receipt.value?.status] || [])
const forwardTransitions   = computed(() => availableTransitions.value.filter(s => s !== 'cancelled'))
const cancelTransitions    = computed(() => availableTransitions.value.filter(s => s === 'cancelled'))
const isCancelled          = computed(() => receipt.value?.status === 'cancelled')

function stepState(key) {
  const cur = receipt.value?.status
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
  confirmed: 'bg-green-600 text-white hover:bg-green-700',
}
function forwardBtnClass(s) { return FORWARD_BTN[s] || 'bg-primary-500 text-white hover:bg-primary-600' }

function transitionLabel(s) {
  const labels = { confirmed: t('erp.receipts.confirmReceipt') }
  return labels[s] || s
}

// ── Status badge ──────────────────────────────────────────
const STATUS_BADGE = {
  draft:     'bg-[#F1F5F9] text-[#637381]',
  confirmed: 'bg-green-50 text-green-700',
  cancelled: 'bg-red-50 text-red-600',
}
const STATUS_DOT = {
  draft:     'bg-slate-400',
  confirmed: 'bg-green-500',
  cancelled: 'bg-red-500',
}
function statusBadge(s) { return STATUS_BADGE[s] || STATUS_BADGE.draft }
function statusDot(s)   { return STATUS_DOT[s]   || STATUS_DOT.draft }

const METHOD_LABELS = {
  cash: 'Cash', bank_transfer: 'Bank Transfer',
  cheque: 'Cheque', credit_card: 'Credit Card', other: 'Other',
}
function methodLabel(m) { return METHOD_LABELS[m] || m }

// ── Data ──────────────────────────────────────────────────
onMounted(fetchReceipt)

async function fetchReceipt() {
  loading.value = true
  try {
    const { data } = await api.get(`/erp/receipts/${route.params.id}`)
    receipt.value = data.data.receipt
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
    const { data } = await api.patch(`/erp/receipts/${receipt.value.id}/status`, { status })
    receipt.value = data.data.receipt
  } catch (err) {
    statusError.value = err.response?.data?.message || 'Failed to update status'
  } finally {
    updatingStatus.value = false
  }
}

async function confirmDelete() {
  if (!confirm(`Delete receipt ${receipt.value.receiptNumber}? This cannot be undone.`)) return
  try {
    await api.delete(`/erp/receipts/${receipt.value.id}`)
    router.push('/erp/receipts')
  } catch (err) {
    statusError.value = err.response?.data?.message || 'Delete failed'
  }
}
</script>
