<template>
  <AppLayout>
    <div class="space-y-5">

      <!-- Top action bar (hidden on print) -->
      <div class="flex items-start gap-3 print:hidden">
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
          <button @click="onPrint" type="button"
            :title="t('erp.deliveryOrders.printDocument')"
            class="inline-flex items-center gap-1.5 px-3 py-2 text-[12px] font-semibold rounded-xl
                   text-[#637381] bg-white border border-[#E2E8F0] hover:bg-[#F7F9FC] hover:text-[#1C2434] transition-colors">
            <PrinterIcon class="w-4 h-4" />
            {{ t('common.print') }}
          </button>
          <RouterLink v-if="doc.status === 'draft'" v-can="'erp.orders.edit'" :to="`/erp/delivery-orders/${doc.id}/edit`"
            class="inline-flex items-center gap-1.5 px-3 py-2 text-[12px] font-semibold rounded-xl
                   text-primary-600 bg-primary-50 hover:bg-primary-100 border border-primary-200 transition-colors">
            <PencilSquareIcon class="w-4 h-4" />
            {{ t('common.edit') }}
          </RouterLink>
          <button v-if="doc.status === 'draft'" v-can="'erp.orders.delete'" @click="confirmDelete" type="button"
            class="inline-flex items-center gap-1.5 px-3 py-2 text-[12px] font-semibold rounded-xl
                   text-red-600 bg-white border border-red-200 hover:bg-red-50 transition-colors">
            <TrashIcon class="w-4 h-4" />
          </button>
        </div>
      </div>

      <div v-if="loading" class="flex items-center justify-center py-20 print:hidden">
        <div class="w-7 h-7 border-2 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
      </div>

      <div v-else-if="notFound"
        class="flex items-start gap-3 bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3.5 rounded-xl print:hidden">
        <ExclamationCircleIcon class="w-5 h-5 flex-shrink-0 mt-0.5" />
        <span>{{ t('erp.deliveryOrders.notFound') }}
          <RouterLink to="/erp/delivery-orders" class="underline ml-1">{{ t('erp.common.backToList') }}</RouterLink>
        </span>
      </div>

      <template v-else>
        <!-- Workflow strip -->
        <div class="bg-white rounded-2xl border border-[#E2E8F0] shadow-card px-5 py-3 print:hidden">
          <div class="flex items-center gap-1 flex-wrap">
            <template v-for="(step, i) in FLOW_STEPS" :key="step.key">
              <div class="flex items-center gap-2 px-2.5 py-1"
                :class="stepChipClass(step.key)">
                <CheckIcon v-if="stepState(step.key) === 'completed'" class="w-3.5 h-3.5" />
                <span v-else-if="stepState(step.key) === 'current'" class="w-2 h-2 rounded-full bg-current"></span>
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

        <!-- Document -->
        <article class="relative mx-auto bg-white border border-[#E2E8F0] shadow-card max-w-[860px] w-full
                        print:border-0 print:shadow-none print:max-w-none print:mx-0 print:rounded-none rounded-2xl
                        overflow-hidden">

          <div v-if="stampLabel"
            class="pointer-events-none absolute inset-0 flex items-center justify-center z-10"
            aria-hidden="true">
            <span class="select-none font-black tracking-[0.2em] uppercase border-[6px] rounded-md px-6 py-2
                         text-[64px] sm:text-[88px] -rotate-[18deg] opacity-[0.12]"
              :class="stampClass">
              {{ stampLabel }}
            </span>
          </div>

          <header class="px-10 pt-10 pb-6 flex items-start justify-between gap-8 border-b border-dashed border-[#E2E8F0]">
            <div class="flex-1 min-w-0 flex items-start gap-4">
              <img v-if="companyLogoSrc" :src="companyLogoSrc" :alt="companyName"
                class="max-h-16 max-w-[160px] object-contain flex-shrink-0" />
              <div class="min-w-0">
                <p class="text-[20px] font-bold text-[#1C2434] tracking-tight">{{ companyName }}</p>
                <p v-if="companyAddress" class="text-[11px] text-[#637381] mt-1 whitespace-pre-line leading-snug">
                  {{ companyAddress }}
                </p>
                <div class="text-[11px] text-[#637381] mt-1 space-y-0.5">
                  <p v-if="companyPhone">{{ t('erp.deliveryOrders.docPhoneAbbr') }} {{ companyPhone }}</p>
                  <p v-if="companyEmail">{{ companyEmail }}</p>
                  <p v-if="companyWebsite">{{ companyWebsite }}</p>
                  <p v-if="companyTaxId" class="tabular-nums">
                    <span class="text-[#9BA7B0]">{{ t('erp.deliveryOrders.docTaxId') }}</span> {{ companyTaxId }}
                  </p>
                </div>
              </div>
            </div>
            <div class="text-right flex-shrink-0">
              <h2 class="text-[26px] font-extrabold tracking-[0.18em] text-[#1C2434] uppercase">
                {{ t('erp.deliveryOrders.documentTitle') }}
              </h2>
              <dl class="mt-3 text-[12px] grid grid-cols-[auto_auto] gap-x-3 gap-y-1 justify-end">
                <dt class="text-[#9BA7B0] uppercase tracking-wider text-[10px] font-semibold pt-0.5 text-right">#</dt>
                <dd class="font-bold text-[#1C2434] tabular-nums text-right">{{ doc.refNo }}</dd>

                <dt class="text-[#9BA7B0] uppercase tracking-wider text-[10px] font-semibold pt-0.5 text-right">
                  {{ t('erp.deliveryOrders.docDate') }}
                </dt>
                <dd class="font-semibold text-[#1C2434] tabular-nums text-right">{{ fmtDate(doc.date) || '—' }}</dd>

                <template v-if="doc.referenceNumber">
                  <dt class="text-[#9BA7B0] uppercase tracking-wider text-[10px] font-semibold pt-0.5 text-right">
                    {{ t('erp.deliveryOrders.docPO') }}
                  </dt>
                  <dd class="font-semibold text-[#1C2434] text-right">{{ doc.referenceNumber }}</dd>
                </template>

                <template v-if="doc.salesOrder">
                  <dt class="text-[#9BA7B0] uppercase tracking-wider text-[10px] font-semibold pt-0.5 text-right">
                    {{ t('erp.deliveryOrders.refSO') }}
                  </dt>
                  <dd class="text-right">
                    <RouterLink :to="`/erp/orders/${doc.salesOrder.id}`"
                      class="font-semibold text-primary-500 hover:underline">
                      {{ doc.salesOrder.orderNumber }}
                    </RouterLink>
                  </dd>
                </template>
              </dl>
            </div>
          </header>

          <!-- Bill-to / Ship-to -->
          <section class="px-10 py-6 grid grid-cols-1 sm:grid-cols-2 gap-x-10 gap-y-6 border-b border-dashed border-[#E2E8F0]">
            <div>
              <p class="text-[10px] font-bold text-[#9BA7B0] uppercase tracking-[0.15em] mb-2">
                {{ t('erp.deliveryOrders.docBillTo') }}
              </p>
              <p class="text-[14px] font-bold text-[#1C2434]">{{ doc.customer?.name || '—' }}</p>
              <p v-if="doc.customer?.company" class="text-[12px] text-[#374151]">{{ doc.customer.company }}</p>
              <p v-if="billingAddressDisplay" class="text-[12px] text-[#374151] mt-1 whitespace-pre-line leading-snug">
                {{ billingAddressDisplay }}
              </p>
              <p v-if="doc.customer?.email" class="text-[11px] text-[#637381] mt-1.5">{{ doc.customer.email }}</p>
              <p v-if="doc.customer?.phone" class="text-[11px] text-[#637381]">{{ doc.customer.phone }}</p>
            </div>
            <div>
              <p class="text-[10px] font-bold text-[#9BA7B0] uppercase tracking-[0.15em] mb-2">
                {{ t('erp.deliveryOrders.docShipTo') }}
              </p>
              <p v-if="shippingAddressDisplay" class="text-[12px] text-[#374151] whitespace-pre-line leading-snug">
                {{ shippingAddressDisplay }}
              </p>
              <p v-else class="text-[12px] text-[#9BA7B0] italic">{{ t('erp.deliveryOrders.docSameAsBilling') }}</p>
            </div>
          </section>

          <!-- Metadata strip -->
          <section class="px-10 py-4 grid grid-cols-2 sm:grid-cols-4 gap-x-6 gap-y-3 border-b border-dashed border-[#E2E8F0] bg-[#FAFBFD]">
            <div>
              <p class="text-[9px] font-bold text-[#9BA7B0] uppercase tracking-[0.15em]">{{ t('erp.deliveryOrders.deliveryDate') }}</p>
              <p class="text-[12px] font-semibold text-[#1C2434] tabular-nums mt-0.5">{{ fmtDate(doc.deliveryDate) || '—' }}</p>
            </div>
            <div>
              <p class="text-[9px] font-bold text-[#9BA7B0] uppercase tracking-[0.15em]">{{ t('erp.deliveryOrders.paymentTerms') }}</p>
              <p class="text-[12px] font-semibold text-[#1C2434] mt-0.5">{{ paymentTermLabel(doc.paymentTerms) }}</p>
            </div>
            <div>
              <p class="text-[9px] font-bold text-[#9BA7B0] uppercase tracking-[0.15em]">{{ t('erp.deliveryOrders.salesperson') }}</p>
              <p class="text-[12px] font-semibold text-[#1C2434] mt-0.5">{{ doc.salesperson?.name || '—' }}</p>
            </div>
            <div>
              <p class="text-[9px] font-bold text-[#9BA7B0] uppercase tracking-[0.15em]">{{ t('erp.deliveryOrders.totalItems') }}</p>
              <p class="text-[12px] font-semibold text-[#1C2434] tabular-nums mt-0.5">{{ doc.items?.length || 0 }}</p>
            </div>
          </section>

          <!-- Items -->
          <section class="px-10 pt-6 pb-2">
            <table class="w-full text-[12px]">
              <thead>
                <tr class="border-b-2 border-[#1C2434] text-[10px] font-bold text-[#1C2434] uppercase tracking-wider">
                  <th class="py-2.5 text-left w-8">#</th>
                  <th class="py-2.5 text-left w-28">{{ t('erp.deliveryOrders.colCode') }}</th>
                  <th class="py-2.5 text-left">{{ t('erp.deliveryOrders.colProduct') }}</th>
                  <th class="py-2.5 text-left w-32">{{ t('erp.deliveryOrders.store') }}</th>
                  <th class="py-2.5 text-right w-16">{{ t('erp.deliveryOrders.colQty') }}</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(item, idx) in doc.items" :key="item.id" class="border-b border-[#F1F5F9]">
                  <td class="py-2.5 align-top text-[#9BA7B0] tabular-nums">{{ idx + 1 }}</td>
                  <td class="py-2.5 align-top text-[#637381] font-mono text-[11px]">{{ itemCode(item) || '—' }}</td>
                  <td class="py-2.5 align-top">
                    <span class="font-semibold text-[#1C2434]">{{ item.productName }}</span>
                    <p v-if="item.notes" class="text-[11px] text-[#9BA7B0] mt-0.5">{{ item.notes }}</p>
                  </td>
                  <td class="py-2.5 align-top text-[#637381] text-[11px]">{{ item.store?.name || '—' }}</td>
                  <td class="py-2.5 align-top text-right font-semibold text-[#1C2434] tabular-nums">
                    {{ Number(item.qty).toLocaleString() }}
                  </td>
                </tr>
                <tr v-if="!doc.items?.length">
                  <td colspan="5" class="py-6 text-center text-[12px] text-[#9BA7B0] italic">
                    {{ t('erp.common.noItems') }}
                  </td>
                </tr>
              </tbody>
            </table>
          </section>

          <!-- Total items -->
          <section class="px-10 pb-6 flex justify-end">
            <dl class="w-full sm:w-72 text-[12px] space-y-1.5">
              <div class="flex items-center justify-between pt-2 mt-1 border-t-2 border-[#1C2434]">
                <dt class="text-[11px] font-bold text-[#1C2434] uppercase tracking-wider">{{ t('erp.deliveryOrders.totalItems') }}</dt>
                <dd class="text-[16px] font-extrabold text-[#1C2434] tabular-nums">{{ doc.items?.length || 0 }}</dd>
              </div>
            </dl>
          </section>

          <section v-if="doc.notes" class="px-10 pt-2 pb-6 border-t border-dashed border-[#E2E8F0]">
            <p class="text-[10px] font-bold text-[#9BA7B0] uppercase tracking-[0.15em] mb-1.5">
              {{ t('erp.common.notes') }}
            </p>
            <p class="text-[12px] text-[#374151] whitespace-pre-line leading-relaxed">{{ doc.notes }}</p>
          </section>

          <footer class="px-10 pt-6 pb-8 border-t border-dashed border-[#E2E8F0]">
            <div class="grid grid-cols-2 gap-10">
              <div>
                <div class="h-10 border-b border-[#1C2434]"></div>
                <p class="text-[10px] text-[#637381] mt-1.5 text-center uppercase tracking-wider">
                  {{ t('erp.deliveryOrders.docAuthorisedSignature') }}
                </p>
              </div>
              <div>
                <div class="h-10 border-b border-[#1C2434]"></div>
                <p class="text-[10px] text-[#637381] mt-1.5 text-center uppercase tracking-wider">
                  {{ t('erp.deliveryOrders.docReceiverSignature') }}
                </p>
              </div>
            </div>
            <p class="text-center text-[10px] text-[#9BA7B0] mt-6">
              {{ t('erp.deliveryOrders.docFooterThanks') }}
            </p>
          </footer>
        </article>

        <!-- Status transitions -->
        <div v-can="'erp.orders.edit'" v-if="availableTransitions.length"
          class="bg-white rounded-2xl border border-[#E2E8F0] shadow-card px-5 py-4 print:hidden
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
              class="px-4 py-2.5 text-sm font-semibold rounded-xl transition-colors disabled:opacity-50
                     flex items-center gap-2"
              :class="forwardBtnClass(s)">
              <ArrowPathIcon v-if="updatingStatus" class="w-4 h-4 animate-spin" />
              <template v-else>{{ transitionLabel(s) }}</template>
            </button>
            <button v-if="cancelTransitions.length"
              @click="changeStatus('cancel')" :disabled="updatingStatus"
              class="px-4 py-2 text-sm font-medium border border-red-200 text-red-600
                     hover:bg-red-50 rounded-xl transition-colors disabled:opacity-50">
              {{ t('erp.deliveryOrders.cancelOrder') }}
            </button>
          </div>
        </div>
        <p v-if="statusError" class="text-xs text-red-600 print:hidden">{{ statusError }}</p>

        <!-- Convert to Invoice -->
        <div v-if="['shipped', 'delivered'].includes(doc.status)"
          class="bg-white rounded-2xl border border-[#E2E8F0] shadow-card px-5 py-4 print:hidden
                 flex items-center flex-wrap gap-3">
          <p class="text-[11px] font-semibold text-[#9BA7B0] uppercase tracking-wider mr-2">
            {{ t('erp.deliveryOrders.convertActions') }}
          </p>
          <button v-can="'erp.invoices.edit'" @click="convertToInvoice"
            :disabled="converting || !!doc.linkedInvoice"
            :title="doc.linkedInvoice ? `Already linked to ${doc.linkedInvoice.invoiceNumber}` : ''"
            class="flex items-center gap-1.5 px-4 py-2 text-sm font-medium bg-primary-50 text-primary-600 border border-primary-200
                   rounded-xl hover:bg-primary-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
            <DocumentTextIcon class="w-4 h-4" />
            {{ converting ? t('erp.common.saving') : t('erp.deliveryOrders.createInvoice') }}
          </button>
          <RouterLink v-if="doc.linkedInvoice" :to="`/erp/invoices/${doc.linkedInvoice.id}`"
            class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700 hover:bg-blue-100">
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
@media print {
  aside, header, nav.print\:hidden { display: none !important; }
  body { background: white !important; }
  .shadow-card { box-shadow: none !important; }
  article { max-width: none !important; margin: 0 !important; }
}
</style>
