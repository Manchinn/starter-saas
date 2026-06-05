<template>
  <AppLayout>
    <div class="space-y-5">

      <!-- Top action bar (hidden on print) -->
      <div class="flex items-start gap-3 print:hidden">
        <RouterLink to="/erp/delivery-orders"
          class="mt-0.5 p-2 text-[#9BA7B0] hover:text-[#1C2434] hover:bg-white
                 border border-transparent hover:border-[#E2E8F0] transition-all flex-shrink-0">
          <ArrowLeftIcon class="w-[18px] h-[18px]" />
        </RouterLink>
        <div class="flex-1 min-w-0">
          <div class="flex items-center gap-2.5 flex-wrap">
            <h1 class="text-xl font-bold text-[#1C2434]">{{ loading ? '…' : (doc?.refNo || t('erp.deliveryOrders.title')) }}</h1>
            <span v-if="doc && !loading"
              class="inline-flex items-center gap-1.5 px-2.5 py-0.5 text-[11px] font-semibold capitalize"
              :class="statusBadge(doc.status)">
              <span class="w-1.5 h-1.5" :class="statusDot(doc.status)"></span>
              {{ doc.status }}
            </span>
          </div>
          <nav class="flex items-center gap-1.5 mt-1">
            <RouterLink to="/erp/delivery-orders" class="text-[12px] text-[#9BA7B0] hover:text-[#637381] transition-colors">
              {{ t('erp.deliveryOrders.title') }}
            </RouterLink>
            <ChevronRightIcon class="w-3 h-3 text-[#CBD5E1]" />
            <span class="text-[12px] text-[#637381]">{{ doc?.refNo || '…' }}</span>
          </nav>
        </div>
        <div v-if="doc && !loading" class="flex items-center gap-2 flex-shrink-0">
          <KeyboardShortcuts :shortcuts="shortcuts" width="w-56" />
          <button @click="onPrint" type="button"
            :title="t('erp.deliveryOrders.printDocument')"
            class="inline-flex items-center gap-1.5 px-3 py-2 text-[12px] font-semibold
                   text-[#637381] bg-white border border-[#E2E8F0] hover:bg-[#F7F9FC] hover:text-[#1C2434] transition-colors">
            <PrinterIcon class="w-4 h-4" />
            {{ t('common.print') }}
          </button>
          <RouterLink v-if="doc.status === 'draft'" v-can="'erp.orders.edit'" :to="`/erp/delivery-orders/${doc.id}/edit`"
            class="inline-flex items-center gap-1.5 px-3 py-2 text-[12px] font-semibold
                   text-primary-600 bg-primary-50 hover:bg-primary-100 border border-primary-200 transition-colors">
            <PencilSquareIcon class="w-4 h-4" />
            {{ t('common.edit') }}
          </RouterLink>
          <button v-if="doc.status === 'draft'" v-can="'erp.orders.delete'" @click="confirmDelete" type="button"
            class="inline-flex items-center gap-1.5 px-3 py-2 text-[12px] font-semibold
                   text-red-600 bg-white border border-red-200 hover:bg-red-50 transition-colors">
            <TrashIcon class="w-4 h-4" />
          </button>
        </div>
      </div>

      <div v-if="loading" class="flex items-center justify-center py-20 print:hidden">
        <div class="w-7 h-7 border-2 border-primary-500 border-t-transparent animate-spin"></div>
      </div>

      <div v-else-if="notFound"
        class="flex items-start gap-3 bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3.5 print:hidden">
        <ExclamationCircleIcon class="w-5 h-5 flex-shrink-0 mt-0.5" />
        <span>{{ t('erp.deliveryOrders.notFound') }}
          <RouterLink to="/erp/delivery-orders" class="underline ml-1">{{ t('erp.common.backToList') }}</RouterLink>
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
            <span v-if="isCancelled" class="ml-2 inline-flex items-center gap-1.5 px-2.5 py-1 bg-red-50 text-red-600">
              <XMarkIcon class="w-3.5 h-3.5" />
              <span class="text-[12px] font-semibold">{{ t('erp.common.cancelled') }}</span>
            </span>
          </div>
        </div>

        <!-- Document — delivery order (ใบส่งสินค้า) -->
        <article class="relative mx-auto bg-white border border-[#E2E8F0] shadow-card max-w-[186mm] w-full
                        print:border-0 print:shadow-none print:max-w-none print:mx-0
                        overflow-hidden">

          <!-- DRAFT / CANCELLED diagonal stamp -->
          <div v-if="stampLabel"
            class="pointer-events-none absolute inset-0 flex items-center justify-center z-10"
            aria-hidden="true">
            <span class="select-none font-black tracking-[0.2em] uppercase border-[6px] px-6 py-2
                         text-[64px] sm:text-[88px] -rotate-[18deg] opacity-[0.12]"
              :class="stampClass">
              {{ stampLabel }}
            </span>
          </div>

          <div class="p-6">
            <!-- Header -->
            <header class="flex items-start justify-between gap-6">
              <div class="flex items-start gap-4 min-w-0">
                <img v-if="companyLogoSrc" :src="companyLogoSrc" :alt="companyName"
                  class="max-h-16 max-w-[140px] object-contain flex-shrink-0" />
                <div class="min-w-0">
                  <p class="text-[18px] font-bold text-[#1C2434] leading-tight">{{ companyName }}</p>
                  <p v-if="companyAddress" class="text-[11px] text-[#637381] mt-1 whitespace-pre-line leading-snug">
                    {{ companyAddress }}
                  </p>
                  <div class="text-[11px] text-[#637381] mt-1 space-y-0.5">
                    <p v-if="companyPhone">{{ t('erp.deliveryOrders.docPhoneAbbr') }} {{ companyPhone }}</p>
                    <p v-if="companyTaxId" class="tabular-nums">
                      {{ t('erp.deliveryOrders.docTaxId') }} {{ companyTaxId }}
                    </p>
                  </div>
                </div>
              </div>
              <div class="text-right flex-shrink-0">
                <h2 class="text-[18px] font-bold text-[#1C2434] leading-tight">{{ t('erp.deliveryOrders.documentTitle') }}</h2>
                <p class="text-[11px] text-[#9BA7B0] mt-1">({{ t('erp.deliveryOrders.docOriginal') }})</p>
              </div>
            </header>

            <!-- Customer + meta boxes -->
            <div class="mt-5 grid grid-cols-1 sm:grid-cols-2 border border-[#1C2434]">
              <div class="p-3 border-b sm:border-b-0 sm:border-r border-[#1C2434] text-[12px] space-y-1.5">
                <div class="grid grid-cols-[78px_1fr] gap-x-2">
                  <span class="text-[#637381]">{{ t('erp.deliveryOrders.docCustomerCode') }}</span>
                  <span class="font-medium text-[#1C2434]">{{ doc.customer?.code || '—' }}</span>
                </div>
                <div class="grid grid-cols-[78px_1fr] gap-x-2">
                  <span class="text-[#637381]">{{ t('erp.deliveryOrders.docCustomerName') }}</span>
                  <span class="font-semibold text-[#1C2434]">{{ doc.customer?.company || doc.customer?.name || '—' }}</span>
                </div>
                <div class="grid grid-cols-[78px_1fr] gap-x-2">
                  <span class="text-[#637381]">{{ t('erp.deliveryOrders.docAddress') }}</span>
                  <span class="text-[#1C2434] whitespace-pre-line leading-snug">{{ billingAddressDisplay || '—' }}</span>
                </div>
                <div v-if="shippingAddressDisplay" class="grid grid-cols-[78px_1fr] gap-x-2">
                  <span class="text-[#637381]">{{ t('erp.deliveryOrders.docShipTo') }}</span>
                  <span class="text-[#1C2434] whitespace-pre-line leading-snug">{{ shippingAddressDisplay }}</span>
                </div>
              </div>
              <div class="p-3 text-[12px] space-y-1.5">
                <div class="grid grid-cols-[124px_1fr] gap-x-2">
                  <span class="text-[#637381]">{{ t('erp.deliveryOrders.docTaxId') }}</span>
                  <span class="font-medium text-[#1C2434] tabular-nums">{{ customerTaxId || '—' }}</span>
                </div>
                <div class="grid grid-cols-[124px_1fr] gap-x-2">
                  <span class="text-[#637381]">{{ t('erp.deliveryOrders.docRefNo') }}</span>
                  <span class="font-bold text-[#1C2434] tabular-nums">{{ doc.refNo }}</span>
                </div>
                <div class="grid grid-cols-[124px_1fr] gap-x-2">
                  <span class="text-[#637381]">{{ t('erp.deliveryOrders.docDate') }}</span>
                  <span class="font-medium text-[#1C2434] tabular-nums">{{ fmtDate(doc.date) || '—' }}</span>
                </div>
                <div class="grid grid-cols-[124px_1fr] gap-x-2">
                  <span class="text-[#637381]">{{ t('erp.deliveryOrders.docDeliveryDate') }}</span>
                  <span class="font-medium text-[#1C2434] tabular-nums">{{ fmtDate(doc.deliveryDate) || '—' }}</span>
                </div>
                <div v-if="doc.referenceNumber" class="grid grid-cols-[124px_1fr] gap-x-2">
                  <span class="text-[#637381]">{{ t('erp.deliveryOrders.docPO') }}</span>
                  <span class="font-medium text-[#1C2434]">{{ doc.referenceNumber }}</span>
                </div>
                <div v-if="doc.salesOrder" class="grid grid-cols-[124px_1fr] gap-x-2">
                  <span class="text-[#637381]">{{ t('erp.deliveryOrders.refSO') }}</span>
                  <RouterLink :to="`/erp/orders/${doc.salesOrder.id}`"
                    class="font-medium text-primary-500 hover:underline">
                    {{ doc.salesOrder.orderNumber }}
                  </RouterLink>
                </div>
              </div>
            </div>

            <!-- Line items -->
            <table class="w-full mt-4 border-collapse text-[12px] table-fixed">
              <thead>
                <tr class="bg-[#FAFBFD] text-[10px] font-bold text-[#1C2434] uppercase tracking-wide">
                  <th class="border border-[#1C2434] px-2 py-2 text-left w-[90px]">{{ t('erp.deliveryOrders.colCode') }}</th>
                  <th class="border border-[#1C2434] px-2 py-2 text-left">{{ t('erp.deliveryOrders.colProduct') }}</th>
                  <th class="border border-[#1C2434] px-2 py-2 text-left w-[140px]">{{ t('erp.deliveryOrders.store') }}</th>
                  <th class="border border-[#1C2434] px-2 py-2 text-right w-[70px]">{{ t('erp.deliveryOrders.colQty') }}</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(item, idx) in doc.items" :key="item.id || idx" class="align-top">
                  <td class="border-x border-b border-x-[#1C2434] border-b-[#E2E8F0] px-2 py-1.5 font-mono text-[11px] text-[#637381]">{{ itemCode(item) || '—' }}</td>
                  <td class="border-x border-b border-x-[#1C2434] border-b-[#E2E8F0] px-2 py-1.5">
                    <span class="text-[#1C2434]">{{ item.productName }}</span>
                    <span v-if="item.notes" class="block text-[11px] text-[#9BA7B0]">{{ item.notes }}</span>
                  </td>
                  <td class="border-x border-b border-x-[#1C2434] border-b-[#E2E8F0] px-2 py-1.5 text-[11px] text-[#637381]">{{ item.store?.name || '—' }}</td>
                  <td class="border-x border-b border-x-[#1C2434] border-b-[#E2E8F0] px-2 py-1.5 text-right tabular-nums font-medium text-[#1C2434]">{{ fmtQty(item.qty) }}</td>
                </tr>
                <!-- filler rows keep the goods area tall like a printed form -->
                <tr v-for="n in fillerRows" :key="'filler-' + n" class="h-[26px]">
                  <td class="border-x border-[#1C2434]"></td>
                  <td class="border-x border-[#1C2434]"></td>
                  <td class="border-x border-[#1C2434]"></td>
                  <td class="border-x border-[#1C2434]"></td>
                </tr>
              </tbody>
            </table>

            <!-- Terms + summary -->
            <div class="flex items-stretch border-x border-t border-b border-[#1C2434]">
              <div class="flex-1 min-w-0 flex flex-col">
                <div class="p-3 text-[11px] text-[#374151] space-y-1">
                  <div v-if="paymentTermLabel(doc.paymentTerms) !== '—'" class="grid grid-cols-[96px_1fr] gap-x-2">
                    <span class="text-[#9BA7B0]">{{ t('erp.deliveryOrders.paymentTerms') }}</span>
                    <span>{{ paymentTermLabel(doc.paymentTerms) }}</span>
                  </div>
                  <div v-if="doc.salesperson?.name" class="grid grid-cols-[96px_1fr] gap-x-2">
                    <span class="text-[#9BA7B0]">{{ t('erp.deliveryOrders.salesperson') }}</span>
                    <span>{{ doc.salesperson.name }}</span>
                  </div>
                  <p v-for="(term, i) in docTerms" :key="'t' + i" class="leading-snug">- {{ term }}</p>
                  <p v-if="doc.notes" class="leading-snug whitespace-pre-line">- {{ doc.notes }}</p>
                </div>
              </div>
              <div class="w-[241px] flex-shrink-0 border-l border-[#1C2434] text-[12px]">
                <div class="flex items-center justify-between px-3 pt-[7px] pb-[9px] border-b border-[#1C2434]">
                  <span class="text-[#637381]">{{ t('erp.deliveryOrders.totalItems') }}</span>
                  <span class="tabular-nums text-[#1C2434]">{{ doc.items?.length || 0 }}</span>
                </div>
                <div class="flex items-center justify-between px-3 py-2 bg-[#FAFBFD]">
                  <span class="font-bold text-[#1C2434]">{{ t('erp.deliveryOrders.colQty') }}</span>
                  <span class="font-extrabold text-[#1C2434] tabular-nums">{{ fmtQty(totalQty) }}</span>
                </div>
              </div>
            </div>

            <!-- Signatures -->
            <div class="grid grid-cols-3 gap-8 mt-12 px-2">
              <div v-for="(sig, i) in signatures" :key="'sig' + i" class="text-center">
                <div class="border-b border-dotted border-[#1C2434] h-8"></div>
                <p class="text-[11px] text-[#637381] mt-1.5">{{ sig }}</p>
                <p class="text-[10px] text-[#9BA7B0] mt-2">{{ t('erp.deliveryOrders.docDate') }} ......./......./.......</p>
              </div>
            </div>
          </div>
        </article>

        <!-- Status transitions -->
        <div v-can="'erp.orders.edit'" v-if="availableTransitions.length"
          class="bg-white border border-[#E2E8F0] shadow-card px-5 py-4 print:hidden
                 flex items-center justify-between flex-wrap gap-3">
          <div>
            <p class="text-[11px] font-semibold text-[#9BA7B0] uppercase tracking-wider">
              {{ t('erp.deliveryOrders.nextAction') }}
            </p>
            <p class="text-[13px] text-[#637381] mt-0.5">
              {{ t('erp.deliveryOrders.nextActionHint') }}
            </p>
          </div>
          <div class="flex items-center gap-2.5">
            <button v-for="s in forwardTransitions" :key="s"
              @click="changeStatus(s)" :disabled="updatingStatus"
              class="px-4 py-2.5 text-sm font-semibold transition-colors disabled:opacity-50
                     flex items-center gap-2"
              :class="forwardBtnClass(s)">
              <ArrowPathIcon v-if="updatingStatus" class="w-4 h-4 animate-spin" />
              <template v-else>{{ transitionLabel(s) }}</template>
            </button>
            <button v-if="cancelTransitions.length"
              @click="changeStatus('cancel')" :disabled="updatingStatus"
              class="px-4 py-2 text-sm font-medium border border-red-200 text-red-600
                     hover:bg-red-50 transition-colors disabled:opacity-50">
              {{ t('erp.deliveryOrders.cancelOrder') }}
            </button>
          </div>
        </div>
        <p v-if="statusError" class="text-xs text-red-600 print:hidden">{{ statusError }}</p>

        <!-- Convert to Invoice -->
        <div v-if="['shipped', 'delivered'].includes(doc.status)"
          class="bg-white border border-[#E2E8F0] shadow-card px-5 py-4 print:hidden
                 flex items-center flex-wrap gap-3">
          <p class="text-[11px] font-semibold text-[#9BA7B0] uppercase tracking-wider mr-2">
            {{ t('erp.deliveryOrders.convertActions') }}
          </p>
          <button v-can="'erp.invoices.edit'" @click="convertToInvoice"
            :disabled="converting || !!doc.linkedInvoice"
            :title="doc.linkedInvoice ? `Already linked to ${doc.linkedInvoice.invoiceNumber}` : ''"
            class="flex items-center gap-1.5 px-4 py-2 text-sm font-medium bg-primary-50 text-primary-600 border border-primary-200
                   hover:bg-primary-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
            <DocumentTextIcon class="w-4 h-4" />
            {{ converting ? t('erp.common.saving') : t('erp.deliveryOrders.createInvoice') }}
          </button>
          <RouterLink v-if="doc.linkedInvoice" :to="`/erp/invoices/${doc.linkedInvoice.id}`"
            class="inline-flex items-center px-2 py-0.5 text-xs font-medium bg-blue-50 text-blue-700 hover:bg-blue-100">
            → {{ doc.linkedInvoice.invoiceNumber }}
          </RouterLink>
          <span v-if="convertError" class="self-center text-xs text-red-600">{{ convertError }}</span>
        </div>

        <ActivityTimeline v-if="doc" ref-type="DeliveryOrder" :ref-id="doc.id" class="print:hidden" />
      </template>
    </div>
  </AppLayout>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import ActivityTimeline from '@/components/ActivityTimeline.vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import {
  ArrowLeftIcon, ChevronRightIcon, DocumentTextIcon,
  CheckIcon, XMarkIcon, TrashIcon, PencilSquareIcon,
  ArrowPathIcon, ExclamationCircleIcon, PrinterIcon,
} from '@heroicons/vue/24/outline'
import AppLayout from '@/layouts/AppLayout.vue'
import KeyboardShortcuts from '@/components/KeyboardShortcuts.vue'
import { useDetailShortcuts } from '@/composables/useShortcuts'
import api from '@/api'
import { fmtDate } from '@/utils/fmt'
import { useAuthStore } from '@/stores/auth'

const { t } = useI18n()
const route          = useRoute()
const router         = useRouter()
const auth           = useAuthStore()
const doc            = ref(null)
const loading        = ref(true)
const notFound       = ref(false)
const updatingStatus = ref(false)
const statusError    = ref('')
const converting     = ref(false)
const convertError   = ref('')

const { shortcuts } = useDetailShortcuts({
  enabled: () => !loading.value && !!doc.value,
  canEdit: () => doc.value?.status === 'draft',
  edit:  () => router.push(`/erp/delivery-orders/${doc.value.id}/edit`),
  print: onPrint,
  back:  () => router.push('/erp/delivery-orders'),
})

const org = computed(() => auth.user?.organization || {})
const companyName    = computed(() => org.value.companyName || org.value.name || 'Your Company')
const companyAddress = computed(() => org.value.address  || '')
const companyPhone   = computed(() => org.value.phone    || '')
const companyEmail   = computed(() => org.value.email    || '')
const companyTaxId   = computed(() => org.value.taxId    || '')
const companyWebsite = computed(() => org.value.website  || '')
const companyLogoSrc = computed(() => {
  const p = org.value.logoPath
  if (!p) return ''
  if (/^https?:\/\//i.test(p)) return p
  return p
})

// Address fallback: prefer shippingAddress, then legacy `address`, then customer.
const shippingAddressDisplay = computed(() =>
  doc.value?.shippingAddress || doc.value?.address || ''
)
const billingAddressDisplay  = computed(() =>
  doc.value?.billingAddress || doc.value?.customer?.address || ''
)

function itemCode(item) {
  if (item.salePackage) return item.salePackage.code || ''
  return item.saleItem?.code || item.product?.sku || ''
}

// ── Document helpers (mirror Receipt tax-invoice layout) ──
const fillerRows    = computed(() => Math.max(0, 8 - (doc.value?.items?.length || 0)))
const customerTaxId = computed(() => doc.value?.customer?.taxId || '')
const totalQty      = computed(() =>
  (doc.value?.items || []).reduce((sum, it) => sum + (Number(it.qty) || 0), 0)
)
const docTerms   = computed(() => [t('erp.deliveryOrders.docTerm1'), t('erp.deliveryOrders.docTerm2')])
const signatures = computed(() => [
  t('erp.deliveryOrders.docPreparedBy'),
  t('erp.deliveryOrders.docApprovedBy'),
  t('erp.deliveryOrders.docReceiverSignature'),
])

function fmtQty(q) {
  return (Number(q) || 0).toLocaleString(undefined, { maximumFractionDigits: 3 })
}

function onPrint() { window.print() }

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
  if (!cur || cur === key) return cur === key ? 'current' : 'upcoming'
  return (COMPLETED_BEFORE[cur] || []).includes(key) ? 'completed' : 'upcoming'
}
function stepChipClass(key) {
  const s = stepState(key)
  if (s === 'completed') return 'bg-green-50 text-green-700'
  if (s === 'current')   return 'bg-primary-50 text-primary-700 ring-1 ring-primary-200'
  return 'bg-[#F7F9FC] text-[#9BA7B0]'
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

const stampLabel = computed(() => {
  const s = doc.value?.status
  if (s === 'draft')     return 'Draft'
  if (s === 'cancelled') return 'Cancelled'
  return ''
})
const stampClass = computed(() => {
  if (doc.value?.status === 'cancelled') return 'text-red-600 border-red-600'
  return 'text-[#1C2434] border-[#1C2434]'
})

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

const paymentTerms = ref([])
onMounted(async () => {
  try {
    const { data } = await api.get('/erp/master-data/payment-terms')
    paymentTerms.value = data.data.values || []
  } catch { /* lookup failed — labels fall back to raw stored value */ }
})
function paymentTermLabel(v) {
  if (!v) return '—'
  const hit = paymentTerms.value.find(opt => opt.code === v || opt.name === v)
  return hit?.name || v
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
