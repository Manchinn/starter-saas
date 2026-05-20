<template>
  <AppLayout>
    <div class="space-y-5">

      <!-- Top action bar (hidden on print) -->
      <div class="flex items-start gap-3 print:hidden">
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
        <!-- Quick actions -->
        <div v-if="order && !loading" class="flex items-center gap-2 flex-shrink-0">
          <button @click="onPrint" type="button"
            :title="t('erp.orders.printDocument')"
            class="inline-flex items-center gap-1.5 px-3 py-2 text-[12px] font-semibold rounded-xl
                   text-[#637381] bg-white border border-[#E2E8F0] hover:bg-[#F7F9FC] hover:text-[#1C2434] transition-colors">
            <PrinterIcon class="w-4 h-4" />
            {{ t('common.print') }}
          </button>
          <RouterLink v-if="order.status === 'draft'" v-can="'erp.orders.edit'" :to="`/erp/orders/${order.id}/edit`"
            class="inline-flex items-center gap-1.5 px-3 py-2 text-[12px] font-semibold rounded-xl
                   text-primary-600 bg-primary-50 hover:bg-primary-100 border border-primary-200 transition-colors">
            <PencilSquareIcon class="w-4 h-4" />
            {{ t('common.edit') }}
          </RouterLink>
          <button v-if="order.status === 'draft'" v-can="'erp.orders.delete'" @click="confirmDelete" type="button"
            class="inline-flex items-center gap-1.5 px-3 py-2 text-[12px] font-semibold rounded-xl
                   text-red-600 bg-white border border-red-200 hover:bg-red-50 transition-colors">
            <TrashIcon class="w-4 h-4" />
          </button>
        </div>
      </div>

      <!-- Loading -->
      <div v-if="loading" class="flex items-center justify-center py-20 print:hidden">
        <div class="w-7 h-7 border-2 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
      </div>

      <!-- Not found -->
      <div v-else-if="notFound"
        class="flex items-start gap-3 bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3.5 rounded-xl print:hidden">
        <ExclamationCircleIcon class="w-5 h-5 flex-shrink-0 mt-0.5" />
        <span>{{ t('erp.common.notFound') }}
          <RouterLink to="/erp/orders" class="underline ml-1">{{ t('erp.common.backToList') }}</RouterLink>
        </span>
      </div>

      <template v-else>
        <!-- Compact workflow strip (hidden on print) -->
        <div class="bg-white rounded-2xl border border-[#E2E8F0] shadow-card px-5 py-3 print:hidden">
          <div class="flex items-center gap-1 flex-wrap">
            <template v-for="(step, i) in FLOW_STEPS" :key="step.key">
              <div class="flex items-center gap-2 px-2.5 py-1 rounded-lg"
                :class="stepChipClass(step.key)">
                <CheckIcon v-if="stepState(step.key) === 'completed'" class="w-3.5 h-3.5" />
                <span v-else-if="stepState(step.key) === 'current'" class="w-2 h-2 rounded-full bg-current"></span>
                <span v-else class="text-[10px] font-bold opacity-50">{{ i + 1 }}</span>
                <span class="text-[12px] font-semibold">{{ step.label }}</span>
              </div>
              <ChevronRightIcon v-if="i < FLOW_STEPS.length - 1" class="w-3 h-3 text-[#CBD5E1] flex-shrink-0" />
            </template>
            <span v-if="isCancelled" class="ml-2 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-red-50 text-red-600">
              <XMarkIcon class="w-3.5 h-3.5" />
              <span class="text-[12px] font-semibold">Cancelled</span>
            </span>
          </div>
        </div>

        <!-- ── Document ─────────────────────────────────────────── -->
        <article class="relative mx-auto bg-white border border-[#E2E8F0] shadow-card max-w-[860px] w-full
                        print:border-0 print:shadow-none print:max-w-none print:mx-0 print:rounded-none rounded-2xl
                        overflow-hidden">

          <!-- DRAFT / CANCELLED diagonal stamp -->
          <div v-if="stampLabel"
            class="pointer-events-none absolute inset-0 flex items-center justify-center z-10"
            aria-hidden="true">
            <span class="select-none font-black tracking-[0.2em] uppercase border-[6px] rounded-md px-6 py-2
                         text-[64px] sm:text-[88px] -rotate-[18deg] opacity-[0.12]"
              :class="stampClass">
              {{ stampLabel }}
            </span>
          </div>

          <!-- Document header: company + title block -->
          <header class="px-10 pt-10 pb-6 flex items-start justify-between gap-8 border-b border-dashed border-[#E2E8F0]">
            <div class="flex-1 min-w-0">
              <p class="text-[20px] font-bold text-[#1C2434] tracking-tight">{{ companyName }}</p>
              <p v-if="companyTagline" class="text-[12px] text-[#637381] mt-0.5">{{ companyTagline }}</p>
            </div>
            <div class="text-right flex-shrink-0">
              <h2 class="text-[26px] font-extrabold tracking-[0.18em] text-[#1C2434] uppercase">
                {{ t('erp.orders.documentTitle') }}
              </h2>
              <dl class="mt-3 text-[12px] grid grid-cols-[auto_auto] gap-x-3 gap-y-1 justify-end">
                <dt class="text-[#9BA7B0] uppercase tracking-wider text-[10px] font-semibold pt-0.5 text-right">#</dt>
                <dd class="font-bold text-[#1C2434] tabular-nums text-right">{{ order.orderNumber }}</dd>

                <dt class="text-[#9BA7B0] uppercase tracking-wider text-[10px] font-semibold pt-0.5 text-right">
                  {{ t('erp.orders.docDate') }}
                </dt>
                <dd class="font-semibold text-[#1C2434] tabular-nums text-right">{{ fmtDate(order.orderDate) || '—' }}</dd>

                <template v-if="order.referenceNumber">
                  <dt class="text-[#9BA7B0] uppercase tracking-wider text-[10px] font-semibold pt-0.5 text-right">
                    {{ t('erp.orders.docPO') }}
                  </dt>
                  <dd class="font-semibold text-[#1C2434] text-right">{{ order.referenceNumber }}</dd>
                </template>
              </dl>
            </div>
          </header>

          <!-- Bill-to / Ship-to / Meta -->
          <section class="px-10 py-6 grid grid-cols-1 sm:grid-cols-2 gap-x-10 gap-y-6 border-b border-dashed border-[#E2E8F0]">
            <!-- Bill To -->
            <div>
              <p class="text-[10px] font-bold text-[#9BA7B0] uppercase tracking-[0.15em] mb-2">
                {{ t('erp.orders.docBillTo') }}
              </p>
              <p class="text-[14px] font-bold text-[#1C2434]">{{ order.customer?.name || '—' }}</p>
              <p v-if="order.customer?.company" class="text-[12px] text-[#374151]">{{ order.customer.company }}</p>
              <p v-if="billingAddressDisplay" class="text-[12px] text-[#374151] mt-1 whitespace-pre-line leading-snug">
                {{ billingAddressDisplay }}
              </p>
              <p v-if="order.customer?.email" class="text-[11px] text-[#637381] mt-1.5">{{ order.customer.email }}</p>
              <p v-if="order.customer?.phone" class="text-[11px] text-[#637381]">{{ order.customer.phone }}</p>
            </div>
            <!-- Ship To -->
            <div>
              <p class="text-[10px] font-bold text-[#9BA7B0] uppercase tracking-[0.15em] mb-2">
                {{ t('erp.orders.docShipTo') }}
              </p>
              <p v-if="order.shippingAddress" class="text-[12px] text-[#374151] whitespace-pre-line leading-snug">
                {{ order.shippingAddress }}
              </p>
              <p v-else class="text-[12px] text-[#9BA7B0] italic">{{ t('erp.orders.docSameAsBilling') }}</p>
            </div>
          </section>

          <!-- Metadata strip -->
          <section class="px-10 py-4 grid grid-cols-2 sm:grid-cols-4 gap-x-6 gap-y-3 border-b border-dashed border-[#E2E8F0] bg-[#FAFBFD]">
            <div>
              <p class="text-[9px] font-bold text-[#9BA7B0] uppercase tracking-[0.15em]">{{ t('erp.orders.expectedDelivery') }}</p>
              <p class="text-[12px] font-semibold text-[#1C2434] tabular-nums mt-0.5">{{ fmtDate(order.expectedDeliveryDate) || '—' }}</p>
            </div>
            <div>
              <p class="text-[9px] font-bold text-[#9BA7B0] uppercase tracking-[0.15em]">{{ t('erp.orders.paymentTerms') }}</p>
              <p class="text-[12px] font-semibold text-[#1C2434] mt-0.5">{{ paymentTermLabel(order.paymentTerms) }}</p>
            </div>
            <div>
              <p class="text-[9px] font-bold text-[#9BA7B0] uppercase tracking-[0.15em]">{{ t('erp.orders.salesperson') }}</p>
              <p class="text-[12px] font-semibold text-[#1C2434] mt-0.5">{{ order.salesperson?.name || '—' }}</p>
            </div>
            <div>
              <p class="text-[9px] font-bold text-[#9BA7B0] uppercase tracking-[0.15em]">{{ t('erp.common.currency') }}</p>
              <p class="text-[12px] font-semibold text-[#1C2434] tabular-nums mt-0.5">{{ order.currency || '—' }}</p>
            </div>
          </section>

          <!-- Line items table -->
          <section class="px-10 pt-6 pb-2">
            <table class="w-full text-[12px]">
              <thead>
                <tr class="border-b-2 border-[#1C2434] text-[10px] font-bold text-[#1C2434] uppercase tracking-wider">
                  <th class="py-2.5 text-left w-8">#</th>
                  <th class="py-2.5 text-left">{{ t('erp.orders.colItem') }}</th>
                  <th class="py-2.5 text-right w-16">{{ t('erp.orders.colQty') }}</th>
                  <th class="py-2.5 text-right w-24">{{ t('erp.orders.colUnitPrice') }}</th>
                  <th class="py-2.5 text-right w-14">{{ t('erp.orders.tax') }} %</th>
                  <th class="py-2.5 text-right w-28">{{ t('erp.orders.colTotal') }}</th>
                </tr>
              </thead>
              <tbody>
                <template v-for="(item, idx) in topLevelItems" :key="item.id">
                  <!-- Package parent: priced row + its children below -->
                  <tr v-if="item.salePackageId" class="border-b border-[#F1F5F9]">
                    <td class="py-2.5 align-top text-[#9BA7B0] tabular-nums">{{ idx + 1 }}</td>
                    <td class="py-2.5 align-top">
                      <span class="inline-flex items-center gap-1.5 font-bold text-primary-700">
                        <CubeIcon class="w-3.5 h-3.5" />
                        {{ item.productName }}
                      </span>
                      <span class="ml-1.5 text-[10px] font-normal text-[#9BA7B0]">· {{ t('erp.orders.salePackage') }}</span>
                    </td>
                    <td class="py-2.5 align-top text-right text-[#374151] tabular-nums">{{ item.quantity }}</td>
                    <td class="py-2.5 align-top text-right text-[#374151] tabular-nums">{{ fmtMoney(item.unitPrice) }}</td>
                    <td class="py-2.5 align-top text-right text-[#374151] tabular-nums">{{ Number(item.taxRate || 0) }}%</td>
                    <td class="py-2.5 align-top text-right font-bold text-[#1C2434] tabular-nums">
                      {{ fmtMoney((Number(item.quantity) || 0) * (Number(item.unitPrice) || 0)) }}
                    </td>
                  </tr>
                  <tr v-else class="border-b border-[#F1F5F9]">
                    <td class="py-2.5 align-top text-[#9BA7B0] tabular-nums">{{ idx + 1 }}</td>
                    <td class="py-2.5 align-top">
                      <span class="font-semibold text-[#1C2434]">{{ item.productName }}</span>
                      <span v-if="item.product?.sku" class="ml-1.5 text-[10px] text-[#9BA7B0]">({{ item.product.sku }})</span>
                    </td>
                    <td class="py-2.5 align-top text-right text-[#374151] tabular-nums">{{ item.quantity }}</td>
                    <td class="py-2.5 align-top text-right text-[#374151] tabular-nums">{{ fmtMoney(item.unitPrice) }}</td>
                    <td class="py-2.5 align-top text-right text-[#374151] tabular-nums">{{ Number(item.taxRate || 0) }}%</td>
                    <td class="py-2.5 align-top text-right font-semibold text-[#1C2434] tabular-nums">
                      {{ fmtMoney((Number(item.quantity) || 0) * (Number(item.unitPrice) || 0)) }}
                    </td>
                  </tr>
                  <!-- Package children: indented sub-items -->
                  <tr v-for="child in childrenOf(item.id)" :key="child.id"
                    class="border-b border-[#F1F5F9] text-[11px]">
                    <td></td>
                    <td colspan="5" class="py-1.5 pl-6 text-[#637381]">
                      <span class="text-[#CBD5E1] mr-1.5">↳</span>
                      {{ child.productName }}
                      <span class="text-[10px] font-semibold text-[#9BA7B0] tabular-nums ml-2">× {{ child.quantity }}</span>
                      <span v-if="child.product?.sku" class="text-[10px] text-[#9BA7B0] ml-1.5">({{ child.product.sku }})</span>
                    </td>
                  </tr>
                </template>
                <!-- Empty state -->
                <tr v-if="!topLevelItems.length">
                  <td colspan="6" class="py-6 text-center text-[12px] text-[#9BA7B0] italic">
                    {{ t('erp.common.noItems') }}
                  </td>
                </tr>
              </tbody>
            </table>
          </section>

          <!-- Totals block — right-aligned, like a real invoice -->
          <section class="px-10 pb-6 flex justify-end">
            <dl class="w-full sm:w-72 text-[12px] space-y-1.5">
              <div class="flex items-center justify-between">
                <dt class="text-[#637381]">{{ t('erp.orders.subtotal') }}</dt>
                <dd class="font-semibold text-[#1C2434] tabular-nums">{{ fmtMoney(order.subtotal) }}</dd>
              </div>
              <div class="flex items-center justify-between">
                <dt class="text-[#637381]">{{ t('erp.orders.tax') }}</dt>
                <dd class="font-semibold text-[#1C2434] tabular-nums">{{ fmtMoney(order.tax) }}</dd>
              </div>
              <div v-if="Number(order.discountAmount) > 0" class="flex items-center justify-between">
                <dt class="text-[#637381]">{{ t('erp.orders.discount') }}</dt>
                <dd class="font-semibold text-red-600 tabular-nums">−{{ fmtMoney(order.discountAmount) }}</dd>
              </div>
              <div class="flex items-center justify-between pt-2 mt-1 border-t-2 border-[#1C2434]">
                <dt class="text-[11px] font-bold text-[#1C2434] uppercase tracking-wider">{{ t('erp.orders.total') }}</dt>
                <dd class="text-[16px] font-extrabold text-[#1C2434] tabular-nums">{{ fmtMoney(order.total) }}</dd>
              </div>
            </dl>
          </section>

          <!-- Notes -->
          <section v-if="order.notes" class="px-10 pt-2 pb-6 border-t border-dashed border-[#E2E8F0]">
            <p class="text-[10px] font-bold text-[#9BA7B0] uppercase tracking-[0.15em] mb-1.5">
              {{ t('erp.orders.notes') }}
            </p>
            <p class="text-[12px] text-[#374151] whitespace-pre-line leading-relaxed">{{ order.notes }}</p>
          </section>

          <!-- Footer with signatures + meta -->
          <footer class="px-10 pt-6 pb-8 border-t border-dashed border-[#E2E8F0]">
            <div class="grid grid-cols-2 gap-10">
              <div>
                <div class="h-10 border-b border-[#1C2434]"></div>
                <p class="text-[10px] text-[#637381] mt-1.5 text-center uppercase tracking-wider">
                  {{ t('erp.orders.docAuthorisedSignature') }}
                </p>
              </div>
              <div>
                <div class="h-10 border-b border-[#1C2434]"></div>
                <p class="text-[10px] text-[#637381] mt-1.5 text-center uppercase tracking-wider">
                  {{ t('erp.orders.docCustomerSignature') }}
                </p>
              </div>
            </div>
            <p class="text-center text-[10px] text-[#9BA7B0] mt-6">
              {{ t('erp.orders.docFooterThanks') }}
            </p>
          </footer>
        </article>

        <!-- ── Action panels (outside the document) ─────────────── -->

        <!-- Status transitions -->
        <div v-can="'erp.orders.edit'" v-if="forwardTransitions.length || cancelTransitions.length"
          class="bg-white rounded-2xl border border-[#E2E8F0] shadow-card px-5 py-4 print:hidden
                 flex items-center justify-between flex-wrap gap-3">
          <div>
            <p class="text-[11px] font-semibold text-[#9BA7B0] uppercase tracking-wider">
              {{ t('erp.orders.nextAction') }}
            </p>
            <p class="text-[13px] text-[#637381] mt-0.5">
              {{ t('erp.orders.nextActionHint') }}
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
            <button v-for="s in cancelTransitions" :key="s"
              @click="changeStatus(s)" :disabled="updatingStatus"
              class="px-4 py-2 text-sm font-medium border border-red-200 text-red-600
                     hover:bg-red-50 rounded-xl transition-colors disabled:opacity-50">
              {{ t('erp.orders.cancelOrder') }}
            </button>
          </div>
        </div>
        <p v-if="statusError" class="text-xs text-red-600 print:hidden">{{ statusError }}</p>

        <!-- Conversion actions (confirmed / shipped / delivered) -->
        <div v-if="['confirmed', 'shipped', 'delivered'].includes(order.status)"
          class="bg-white rounded-2xl border border-[#E2E8F0] shadow-card px-5 py-4 print:hidden
                 flex items-center flex-wrap gap-3">
          <p class="text-[11px] font-semibold text-[#9BA7B0] uppercase tracking-wider mr-2">
            {{ t('erp.orders.convertActions') }}
          </p>
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

        <ActivityTimeline v-if="order" ref-type="Order" :ref-id="order.id" class="print:hidden" />
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
  ArrowLeftIcon, ChevronRightIcon, DocumentTextIcon,
  CheckIcon, XMarkIcon, TrashIcon, PencilSquareIcon,
  ArrowPathIcon, ExclamationCircleIcon, TruckIcon, PrinterIcon,
  CubeIcon,
} from '@heroicons/vue/24/outline'
import AppLayout from '@/layouts/AppLayout.vue'
import api from '@/api'
import { fmtMoney } from '@/utils/fmt'
import { useAuthStore } from '@/stores/auth'

const { t }    = useI18n()
const route    = useRoute()
const router   = useRouter()
const auth     = useAuthStore()

const order          = ref(null)
const loading        = ref(true)
const notFound       = ref(false)
const updatingStatus = ref(false)
const statusError    = ref('')
const converting     = ref('')
const convertError   = ref('')

// Use the org name from the session if available — otherwise fall back to a
// neutral placeholder. Wire this to an organization-profile API later when one
// exists; for now we just keep the document header looking complete.
const companyName    = computed(() => auth.user?.organizationName || auth.user?.organization?.name || 'Your Company')
const companyTagline = computed(() => auth.user?.organization?.tagline || '')

// Bill-to address: prefer the order's billingAddress; fall back to customer's address.
const billingAddressDisplay = computed(() => order.value?.billingAddress || order.value?.customer?.address || '')

// Top-level items only (parent rows + standalone); package children are
// rendered indented under their parent via childrenOf().
const topLevelItems = computed(() => (order.value?.items || []).filter(it => !it.parentItemId))
function childrenOf(parentId) {
  return (order.value?.items || []).filter(it => it.parentItemId === parentId)
}

function onPrint() { window.print() }

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
function stepChipClass(key) {
  const s = stepState(key)
  if (s === 'completed') return 'bg-green-50 text-green-700'
  if (s === 'current')   return 'bg-primary-50 text-primary-700 ring-1 ring-primary-200'
  return 'bg-[#F7F9FC] text-[#9BA7B0]'
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

// ── Status badge / stamp ──────────────────────────────────
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

// Diagonal stamp shown on draft / cancelled documents. Other statuses are
// "live" and don't need a watermark — the small status pill in the top bar
// already communicates state.
const stampLabel = computed(() => {
  const s = order.value?.status
  if (s === 'draft')     return 'Draft'
  if (s === 'cancelled') return 'Cancelled'
  return ''
})
const stampClass = computed(() => {
  if (order.value?.status === 'cancelled') return 'text-red-600 border-red-600'
  return 'text-[#1C2434] border-[#1C2434]'
})

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

function fmtDate(d) { return d ? new Date(d).toLocaleDateString() : '' }

// Payment-terms labels come from master-data so admins can rename them.
// Fall back to the stored raw value if the lookup is empty or missing.
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
/* Print-only adjustments. Selectors are global (no `scoped`) so they catch
   elements wrapped by AppLayout — we hide the app chrome and let the
   <article> document fill the page. */
@media print {
  /* Hide app chrome (sidebar / topbar) — they're usually inside an aside or
     header that the AppLayout sets up. Tailwind's `print:hidden` handles the
     in-component bits; this catches anything we don't own. */
  aside, header, nav.print\:hidden { display: none !important; }
  body { background: white !important; }
  .shadow-card { box-shadow: none !important; }
  /* Make sure the article isn't constrained inside any flex/grid wrapper. */
  article { max-width: none !important; margin: 0 !important; }
}
</style>
