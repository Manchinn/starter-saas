<template>
  <AppLayout>
    <div class="space-y-5">

      <!-- Top action bar (hidden on print) -->
      <div class="flex items-start gap-3 print:hidden">
        <RouterLink to="/erp/purchasing/requisitions"
          class="mt-0.5 p-2 text-[#9BA7B0] hover:text-[#1C2434] hover:bg-white
                 border border-transparent hover:border-[#E2E8F0] transition-all flex-shrink-0">
          <ArrowLeftIcon class="w-[18px] h-[18px]" />
        </RouterLink>
        <div class="flex-1 min-w-0">
          <div class="flex items-center gap-2.5 flex-wrap">
            <h1 class="text-xl font-bold text-[#1C2434]">
              {{ loading ? '…' : (req?.refNo || t('erp.purchasing.title')) }}
            </h1>
            <span v-if="req && !loading"
              class="inline-flex items-center gap-1.5 px-2.5 py-0.5 text-[11px] font-semibold capitalize"
              :class="statusBadge(req.status)">
              <span class="w-1.5 h-1.5" :class="statusDot(req.status)"></span>
              {{ req.status }}
            </span>
            <DocCurrencyBadge v-if="req" :currency="req.currency" :exchange-rate="req.exchangeRate" :total="estimatedTotalRaw" />
          </div>
          <nav class="flex items-center gap-1.5 mt-1">
            <RouterLink to="/erp/purchasing/requisitions" class="text-[12px] text-[#9BA7B0] hover:text-[#637381] transition-colors">
              {{ t('erp.purchasing.title') }}
            </RouterLink>
            <ChevronRightIcon class="w-3 h-3 text-[#CBD5E1]" />
            <span class="text-[12px] text-[#637381]">{{ req?.refNo || '…' }}</span>
          </nav>
          <!-- Linked POs as source/target badges -->
          <div v-if="req && !loading && linkedOrders.length" class="flex items-center gap-1.5 mt-2 flex-wrap">
            <span class="text-[11px] text-[#9BA7B0] font-medium">PO:</span>
            <RouterLink v-for="po in linkedOrders" :key="po.id" :to="`/erp/purchasing/orders/${po.id}`"
              class="inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-medium bg-blue-50 text-blue-700 hover:bg-blue-100">
              <ShoppingCartIcon class="w-3 h-3" /> {{ po.refNo }}
            </RouterLink>
          </div>
        </div>
        <div v-if="req && !loading" class="flex items-center gap-2 flex-shrink-0">
          <KeyboardShortcuts :shortcuts="shortcuts" width="w-56" />
          <button @click="onPrint" type="button"
            title="Print this document"
            class="inline-flex items-center gap-1.5 px-3 py-2 text-[12px] font-semibold
                   text-[#637381] bg-white border border-[#E2E8F0] hover:bg-[#F7F9FC] hover:text-[#1C2434] transition-colors">
            <PrinterIcon class="w-4 h-4" />
            {{ t('common.print') }}
          </button>
          <RouterLink v-if="req.status === 'draft'" v-can="'erp.purchasing.edit'" :to="`/erp/purchasing/requisitions/${req.id}/edit`"
            class="inline-flex items-center gap-1.5 px-3 py-2 text-[12px] font-semibold
                   text-primary-600 bg-primary-50 hover:bg-primary-100 border border-primary-200 transition-colors">
            <PencilSquareIcon class="w-4 h-4" />
            {{ t('common.edit') }}
          </RouterLink>
          <button v-if="req.status === 'draft'" v-can="'erp.purchasing.delete'" @click="confirmDelete" type="button"
            class="inline-flex items-center gap-1.5 px-3 py-2 text-[12px] font-semibold
                   text-red-600 bg-white border border-red-200 hover:bg-red-50 transition-colors">
            <TrashIcon class="w-4 h-4" />
          </button>
        </div>
      </div>

      <!-- Loading -->
      <div v-if="loading" class="flex items-center justify-center py-20 print:hidden">
        <div class="w-7 h-7 border-2 border-primary-500 border-t-transparent animate-spin"></div>
      </div>

      <!-- Not found -->
      <div v-else-if="notFound"
        class="flex items-start gap-3 bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3.5 print:hidden">
        <ExclamationCircleIcon class="w-5 h-5 flex-shrink-0 mt-0.5" />
        <span>{{ t('erp.purchasing.notFound') }}
          <RouterLink to="/erp/purchasing/requisitions" class="underline ml-1">{{ t('erp.common.backToList') }}</RouterLink>
        </span>
      </div>

      <template v-else>
        <!-- Workflow strip -->
        <div class="bg-white border border-[#E2E8F0] shadow-card px-5 py-3 print:hidden">
          <div class="flex items-center gap-1 flex-wrap">
            <template v-for="(step, i) in FLOW_STEPS" :key="step.key">
              <div class="flex items-center gap-2 px-2.5 py-1"
                :class="stepChipClass(step.key)">
                <CheckIcon v-if="stepState(step.key) === 'completed'" class="w-3.5 h-3.5" />
                <span v-else-if="stepState(step.key) === 'current'" class="w-2 h-2 bg-current"></span>
                <span v-else class="text-[10px] font-bold opacity-50">{{ i + 1 }}</span>
                <span class="text-[12px] font-semibold">{{ step.label }}</span>
              </div>
              <ChevronRightIcon v-if="i < FLOW_STEPS.length - 1" class="w-3 h-3 text-[#CBD5E1] flex-shrink-0" />
            </template>
            <span v-if="isRejected" class="ml-2 inline-flex items-center gap-1.5 px-2.5 py-1 bg-red-50 text-red-600">
              <XMarkIcon class="w-3.5 h-3.5" />
              <span class="text-[12px] font-semibold">{{ t('erp.purchasing.statusRejected') }}</span>
            </span>
          </div>
        </div>

        <!-- Printable document (extracted report view) -->
        <PurchaseRequisitionReport :req="req" />

        <!-- Status transitions -->
        <div v-can="'erp.purchasing.edit'" v-if="req.status === 'draft'"
          class="bg-white border border-[#E2E8F0] shadow-card px-5 py-4 print:hidden
                 flex items-center justify-between flex-wrap gap-3">
          <div>
            <p class="text-[11px] font-semibold text-[#9BA7B0] uppercase tracking-wider">Next Action</p>
            <p class="text-[13px] text-[#637381] mt-0.5">Approve to unlock conversion into a purchase order, or reject to close.</p>
          </div>
          <div class="flex items-center gap-2.5">
            <button @click="doApprove" :disabled="acting"
              class="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold
                     bg-green-600 text-white hover:bg-green-700 transition-colors disabled:opacity-50">
              <ArrowPathIcon v-if="acting" class="w-4 h-4 animate-spin" />
              <CheckCircleIcon v-else class="w-4 h-4" />
              {{ t('erp.purchasing.approve') }}
            </button>
            <button @click="doReject" :disabled="acting"
              class="px-4 py-2 text-sm font-medium border border-red-200 text-red-600
                     hover:bg-red-50 transition-colors disabled:opacity-50">
              {{ t('erp.purchasing.reject') }}
            </button>
          </div>
        </div>

        <!-- Convert to PO -->
        <div v-if="req.status === 'approved'"
          class="bg-white border border-[#E2E8F0] shadow-card px-5 py-4 print:hidden
                 flex items-center flex-wrap gap-3">
          <p class="text-[11px] font-semibold text-[#9BA7B0] uppercase tracking-wider mr-2">Convert</p>
          <button v-can="'erp.purchasing.edit'" @click="convertToOrder"
            :disabled="converting || linkedOrders.length > 0"
            :title="linkedOrders.length ? `Already linked to ${linkedOrders[0].refNo}` : ''"
            class="flex items-center gap-1.5 px-4 py-2 text-sm font-medium bg-primary-50 text-primary-600 border border-primary-200
                   hover:bg-primary-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
            <ShoppingCartIcon class="w-4 h-4" />
            {{ converting ? t('common.loading') : t('erp.purchasing.createOrder') }}
          </button>
          <RouterLink v-for="po in linkedOrders" :key="po.id" :to="`/erp/purchasing/orders/${po.id}`"
            class="inline-flex items-center px-2 py-0.5 text-xs font-medium bg-blue-50 text-blue-700 hover:bg-blue-100">
            → {{ po.refNo }}
          </RouterLink>
        </div>

        <p v-if="actionError" class="text-xs text-red-600 print:hidden">{{ actionError }}</p>

        <ActivityTimeline v-if="req" ref-type="PurchaseRequisition" :ref-id="req.id" class="print:hidden" />
      </template>
    </div>

    <!-- Confirm dialog (replaces window.confirm) -->
    <Teleport to="body">
      <div v-if="confirmOpen" class="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 px-4 print:hidden">
        <div class="w-full max-w-sm bg-white shadow-2xl overflow-hidden">
          <div class="px-5 py-4 flex items-start gap-3">
            <div class="w-9 h-9 bg-red-100 flex items-center justify-center flex-shrink-0">
              <ExclamationCircleIcon class="w-5 h-5 text-red-600" />
            </div>
            <div class="flex-1 min-w-0">
              <p class="text-sm font-semibold text-[#1C2434]">{{ confirmTitle }}</p>
              <p v-if="confirmMessage" class="mt-1 text-[12px] text-[#637381] leading-snug">{{ confirmMessage }}</p>
            </div>
          </div>
          <div class="px-5 py-3 bg-[#F7F9FC] flex items-center justify-end gap-2">
            <button type="button" @click="confirmAnswer(false)"
              class="px-4 py-2 text-sm font-medium text-[#637381] hover:text-[#1C2434]">{{ t('common.cancel') }}</button>
            <button type="button" @click="confirmAnswer(true)"
              class="px-4 py-2 text-sm font-semibold bg-red-500 text-white hover:bg-red-600 shadow-sm">
              {{ confirmOkLabel }}
            </button>
          </div>
        </div>
      </div>
    </Teleport>
  </AppLayout>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter, RouterLink } from 'vue-router'
import { useI18n } from 'vue-i18n'
import {
  ArrowLeftIcon, ChevronRightIcon,
  CheckIcon, XMarkIcon, TrashIcon, PencilSquareIcon,
  ArrowPathIcon, ExclamationCircleIcon, CheckCircleIcon, PrinterIcon,
  ShoppingCartIcon,
} from '@heroicons/vue/24/outline'
import AppLayout from '@/layouts/AppLayout.vue'
import ActivityTimeline from '@/components/ActivityTimeline.vue'
import DocCurrencyBadge from '@/components/DocCurrencyBadge.vue'
import KeyboardShortcuts from '@/components/KeyboardShortcuts.vue'
import { useDetailShortcuts } from '@/composables/useShortcuts'
import api from '@/api'
import { useAuthStore } from '@/stores/auth'
import PurchaseRequisitionReport from '@shared/reporting/templates/erp/purchase-requisition/PurchaseRequisitionReport.vue'

const { t }    = useI18n()
const route    = useRoute()
const router   = useRouter()
const auth     = useAuthStore()

const req          = ref(null)
const linkedOrders = ref([])
const loading      = ref(true)
const notFound     = ref(false)
const acting       = ref(false)
const actionError  = ref('')
const converting   = ref(false)

function onPrint() { window.print() }

const { shortcuts } = useDetailShortcuts({
  enabled: () => !loading.value && !!req.value,
  canEdit: () => req.value?.status === 'draft' && auth.hasPermission('erp.purchasing.edit'),
  edit:  () => router.push(`/erp/purchasing/requisitions/${req.value.id}/edit`),
  print: onPrint,
  back:  () => router.push('/erp/purchasing/requisitions'),
})

// ── Workflow ──────────────────────────────────────────────
const FLOW_STEPS = computed(() => [
  { key: 'draft',    label: t('erp.purchasing.statusDraft') },
  { key: 'approved', label: t('erp.purchasing.statusApproved') },
])
const COMPLETED_BEFORE = {
  draft:    [],
  approved: ['draft'],
  rejected: [],
}
const isRejected = computed(() => req.value?.status === 'rejected')

function stepState(key) {
  const cur = req.value?.status
  if (!cur || cur === key) return cur === key ? 'current' : 'upcoming'
  return (COMPLETED_BEFORE[cur] || []).includes(key) ? 'completed' : 'upcoming'
}
function stepChipClass(key) {
  const s = stepState(key)
  if (s === 'completed') return 'bg-green-50 text-green-700'
  if (s === 'current')   return 'bg-primary-50 text-primary-700 ring-1 ring-primary-200'
  return 'bg-[#F7F9FC] text-[#9BA7B0]'
}

const STATUS_BADGE = {
  draft:    'bg-[#F1F5F9] text-[#637381]',
  approved: 'bg-green-50 text-green-700',
  rejected: 'bg-red-50 text-red-600',
}
const STATUS_DOT = {
  draft:    'bg-slate-400',
  approved: 'bg-green-500',
  rejected: 'bg-red-500',
}
function statusBadge(s) { return STATUS_BADGE[s] || STATUS_BADGE.draft }
function statusDot(s)   { return STATUS_DOT[s]   || STATUS_DOT.draft }

onMounted(async () => {
  try {
    const [reqRes, ordersRes] = await Promise.allSettled([
      api.get(`/erp/purchasing/requisitions/${route.params.id}`),
      api.get(`/erp/purchasing/requisitions/${route.params.id}/orders`),
    ])
    if (reqRes.status === 'fulfilled') req.value = reqRes.value.data.data.requisition
    else notFound.value = true
    if (ordersRes.status === 'fulfilled') linkedOrders.value = ordersRes.value.data.data.orders
  } finally {
    loading.value = false
  }
})

const estimatedTotalRaw = computed(() =>
  (req.value?.items || []).reduce((s, i) => s + Number(i.qty) * (Number(i.unitPrice) || 0), 0)
)

async function convertToOrder() {
  actionError.value = ''
  converting.value = true
  try {
    const { data } = await api.post(`/erp/purchasing/requisitions/${route.params.id}/create-order`)
    router.push(`/erp/purchasing/orders/${data.data.id}`)
  } catch (err) {
    actionError.value = err.response?.data?.message || 'Failed to create purchase order'
  } finally { converting.value = false }
}

async function doApprove() {
  actionError.value = ''
  acting.value = true
  try {
    const { data } = await api.post(`/erp/purchasing/requisitions/${route.params.id}/approve`)
    req.value = data.data.requisition
  } catch (err) {
    actionError.value = err.response?.data?.message || 'Action failed'
  } finally {
    acting.value = false
  }
}

async function doReject() {
  actionError.value = ''
  acting.value = true
  try {
    const { data } = await api.post(`/erp/purchasing/requisitions/${route.params.id}/reject`)
    req.value = data.data.requisition
  } catch (err) {
    actionError.value = err.response?.data?.message || 'Action failed'
  } finally {
    acting.value = false
  }
}

// ── Custom confirm modal (replaces window.confirm) ──────────────────────
const confirmOpen    = ref(false)
const confirmTitle   = ref('')
const confirmMessage = ref('')
const confirmOkLabel = ref('OK')
let confirmResolver  = null
function confirmAsync({ title, message, okLabel } = {}) {
  confirmTitle.value   = title   || ''
  confirmMessage.value = message || ''
  confirmOkLabel.value = okLabel || 'OK'
  confirmOpen.value    = true
  return new Promise(resolve => { confirmResolver = resolve })
}
function confirmAnswer(ok) {
  confirmOpen.value = false
  if (confirmResolver) { confirmResolver(ok); confirmResolver = null }
}

async function confirmDelete() {
  const ok = await confirmAsync({
    title:   t('erp.purchasing.delete'),
    message: `Delete "${req.value?.refNo}"? This cannot be undone.`,
    okLabel: t('common.delete') || 'Delete',
  })
  if (!ok) return
  try {
    await api.delete(`/erp/purchasing/requisitions/${route.params.id}`)
    router.push('/erp/purchasing/requisitions')
  } catch (err) {
    actionError.value = err.response?.data?.message || 'Delete failed'
  }
}
</script>

<style>
@page {
  size: A4;
  margin: 12mm;
}
@media print {
  aside, header, nav.print\:hidden { display: none !important; }
  body { background: white !important; }
  .shadow-card { box-shadow: none !important; }
  /* Pin the document to the A4 printable width (210mm − 2×12mm margins)
     so the table never overflows the page. */
  article {
    width: 186mm !important;
    max-width: 186mm !important;
    margin: 0 auto !important;
    overflow: visible !important;
  }
  article table { table-layout: fixed; width: 100% !important; }
}
</style>
