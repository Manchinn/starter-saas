<template>
  <AppLayout>
    <div class="space-y-5">

      <!-- Top action bar (hidden on print) -->
      <div class="flex items-start gap-3 print:hidden">
        <RouterLink to="/erp/orders"
          class="mt-0.5 p-2 text-[#9BA7B0] hover:text-[#1C2434] hover:bg-white
                 border border-transparent hover:border-[#E2E8F0] transition-all flex-shrink-0">
          <ArrowLeftIcon class="w-[18px] h-[18px]" />
        </RouterLink>
        <div class="flex-1 min-w-0">
          <div class="flex items-center gap-2.5 flex-wrap">
            <h1 class="text-xl font-bold text-[#1C2434]">
              {{ loading ? '…' : (order?.orderNumber || t('erp.orders.detail')) }}
            </h1>
            <span v-if="order && !loading"
              class="inline-flex items-center gap-1.5 px-2.5 py-0.5 text-[11px] font-semibold capitalize"
              :class="statusBadge(order.status)">
              <span class="w-1.5 h-1.5" :class="statusDot(order.status)"></span>
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
          <KeyboardShortcuts :shortcuts="shortcuts" width="w-56" />
          <button @click="onPrint" type="button"
            :title="`${t('erp.orders.printDocument')} (P)`"
            class="inline-flex items-center gap-1.5 px-3 py-2 text-[12px] font-semibold
                   text-[#637381] bg-white border border-[#E2E8F0] hover:bg-[#F7F9FC] hover:text-[#1C2434] transition-colors">
            <PrinterIcon class="w-4 h-4" />
            {{ t('common.print') }}
          </button>
          <RouterLink v-if="order.status === 'draft'" v-can="'erp.orders.edit'" :to="`/erp/orders/${order.id}/edit`"
            :title="`${t('common.edit')} (E)`"
            class="inline-flex items-center gap-1.5 px-3 py-2 text-[12px] font-semibold
                   text-primary-600 bg-primary-50 hover:bg-primary-100 border border-primary-200 transition-colors">
            <PencilSquareIcon class="w-4 h-4" />
            {{ t('common.edit') }}
          </RouterLink>
          <button v-if="order.status === 'draft'" v-can="'erp.orders.delete'" @click="confirmDelete" type="button"
            :title="`Delete (Del)`"
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
        <span>{{ t('erp.common.notFound') }}
          <RouterLink to="/erp/orders" class="underline ml-1">{{ t('erp.common.backToList') }}</RouterLink>
        </span>
      </div>

      <template v-else>
        <!-- Compact workflow strip (hidden on print) -->
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
              <span class="text-[12px] font-semibold">Cancelled</span>
            </span>
          </div>
        </div>

        <!-- Document — sales order (ใบสั่งขาย) -->
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
                    <p v-if="companyPhone">{{ t('erp.orders.docPhoneAbbr') }} {{ companyPhone }}</p>
                    <p v-if="companyTaxId" class="tabular-nums">
                      {{ t('erp.orders.docTaxId') }} {{ companyTaxId }}
                    </p>
                  </div>
                </div>
              </div>
              <div class="text-right flex-shrink-0">
                <h2 class="text-[18px] font-bold text-[#1C2434] leading-tight">{{ t('erp.orders.documentTitle') }}</h2>
                <p class="text-[11px] text-[#9BA7B0] mt-1">({{ t('erp.orders.docOriginal') }})</p>
              </div>
            </header>

            <!-- Customer + meta boxes -->
            <div class="mt-5 grid grid-cols-1 sm:grid-cols-2 border border-[#1C2434]">
              <div class="p-3 border-b sm:border-b-0 sm:border-r border-[#1C2434] text-[12px] space-y-1.5">
                <div class="grid grid-cols-[78px_1fr] gap-x-2">
                  <span class="text-[#637381]">{{ t('erp.orders.docCustomerCode') }}</span>
                  <span class="font-medium text-[#1C2434]">{{ order.customer?.code || '—' }}</span>
                </div>
                <div class="grid grid-cols-[78px_1fr] gap-x-2">
                  <span class="text-[#637381]">{{ t('erp.orders.docCustomerName') }}</span>
                  <span class="font-semibold text-[#1C2434]">{{ order.customer?.company || order.customer?.name || '—' }}</span>
                </div>
                <div class="grid grid-cols-[78px_1fr] gap-x-2">
                  <span class="text-[#637381]">{{ t('erp.orders.docAddress') }}</span>
                  <span class="text-[#1C2434] whitespace-pre-line leading-snug">{{ billingAddressDisplay || '—' }}</span>
                </div>
              </div>
              <div class="p-3 text-[12px] space-y-1.5">
                <div class="grid grid-cols-[124px_1fr] gap-x-2">
                  <span class="text-[#637381]">{{ t('erp.orders.docTaxId') }}</span>
                  <span class="font-medium text-[#1C2434] tabular-nums">{{ customerTaxId || '—' }}</span>
                </div>
                <div class="grid grid-cols-[124px_1fr] gap-x-2">
                  <span class="text-[#637381]">{{ t('erp.orders.docOrderNo') }}</span>
                  <span class="font-bold text-[#1C2434] tabular-nums">{{ order.orderNumber }}</span>
                </div>
                <div class="grid grid-cols-[124px_1fr] gap-x-2">
                  <span class="text-[#637381]">{{ t('erp.orders.docDate') }}</span>
                  <span class="font-medium text-[#1C2434] tabular-nums">{{ fmtDate(order.orderDate) || '—' }}</span>
                </div>
                <div class="grid grid-cols-[124px_1fr] gap-x-2">
                  <span class="text-[#637381]">{{ t('erp.orders.docExpectedDelivery') }}</span>
                  <span class="font-medium text-[#1C2434] tabular-nums">{{ fmtDate(order.expectedDeliveryDate) || '—' }}</span>
                </div>
                <div v-if="order.referenceNumber" class="grid grid-cols-[124px_1fr] gap-x-2">
                  <span class="text-[#637381]">{{ t('erp.orders.docPO') }}</span>
                  <span class="font-medium text-[#1C2434]">{{ order.referenceNumber }}</span>
                </div>
              </div>
            </div>

            <!-- Line items -->
            <table class="w-full mt-4 border-collapse text-[12px] table-fixed">
              <thead>
                <tr class="bg-[#FAFBFD] text-[10px] font-bold text-[#1C2434] uppercase tracking-wide">
                  <th class="border border-[#1C2434] px-2 py-2 text-left w-[80px]">{{ t('erp.orders.colCode') }}</th>
                  <th class="border border-[#1C2434] px-2 py-2 text-left w-[271px]">{{ t('erp.orders.colItem') }}</th>
                  <th class="border border-[#1C2434] px-2 py-2 text-right w-[59px]">{{ t('erp.orders.colQty') }}</th>
                  <th class="border border-[#1C2434] px-2 py-2 text-right w-[89px]">{{ t('erp.orders.colUnitPrice') }}</th>
                  <th class="border border-[#1C2434] px-2 py-2 text-right w-[64px]">{{ t('erp.orders.tax') }} %</th>
                  <th class="border border-[#1C2434] px-2 py-2 text-right w-[88px]">{{ t('erp.orders.colTotal') }}</th>
                </tr>
              </thead>
              <tbody>
                <template v-for="(item, idx) in topLevelItems" :key="item.id || idx">
                  <tr class="align-top">
                    <td class="border-x border-b border-x-[#1C2434] border-b-[#E2E8F0] px-2 py-1.5 font-mono text-[11px] text-[#637381]">{{ itemCode(item) || '—' }}</td>
                    <td class="border-x border-b border-x-[#1C2434] border-b-[#E2E8F0] px-2 py-1.5">
                      <span class="text-[#1C2434]">{{ itemName(item) }}</span>
                    </td>
                    <td class="border-x border-b border-x-[#1C2434] border-b-[#E2E8F0] px-2 py-1.5 text-right tabular-nums text-[#374151]">{{ fmtQty(item.quantity) }}</td>
                    <td class="border-x border-b border-x-[#1C2434] border-b-[#E2E8F0] px-2 py-1.5 text-right tabular-nums text-[#374151]">{{ fmtMoney(item.unitPrice) }}</td>
                    <td class="border-x border-b border-x-[#1C2434] border-b-[#E2E8F0] px-2 py-1.5 text-right tabular-nums text-[#374151]">{{ Number(item.taxRate || 0) }}%</td>
                    <td class="border-x border-b border-x-[#1C2434] border-b-[#E2E8F0] px-2 py-1.5 text-right tabular-nums font-medium text-[#1C2434]">{{ fmtMoney(lineAmount(item)) }}</td>
                  </tr>
                  <!-- Package children: indented sub-items -->
                  <tr v-for="child in childrenOf(item.id)" :key="child.id" class="align-top text-[11px]">
                    <td class="border-x border-b border-x-[#1C2434] border-b-[#E2E8F0] px-2 py-1 font-mono text-[10px] text-[#9BA7B0]">{{ itemCode(child) || '—' }}</td>
                    <td colspan="5" class="border-x border-b border-x-[#1C2434] border-b-[#E2E8F0] px-2 py-1 pl-6 text-[#637381]">
                      <span class="text-[#CBD5E1] mr-1.5">↳</span>{{ child.productName }}
                      <span class="text-[10px] font-semibold text-[#9BA7B0] tabular-nums ml-2">× {{ child.quantity }}</span>
                    </td>
                  </tr>
                </template>
                <!-- filler rows keep the goods area tall like a printed form -->
                <tr v-for="n in fillerRows" :key="'filler-' + n" class="h-[26px]">
                  <td class="border-x border-[#1C2434]"></td>
                  <td class="border-x border-[#1C2434]"></td>
                  <td class="border-x border-[#1C2434]"></td>
                  <td class="border-x border-[#1C2434]"></td>
                  <td class="border-x border-[#1C2434]"></td>
                  <td class="border-x border-[#1C2434]"></td>
                </tr>
              </tbody>
            </table>

            <!-- Terms / amount-in-words + totals -->
            <div class="flex items-stretch border-x border-t border-b border-[#1C2434]">
              <div class="flex-1 min-w-0 flex flex-col">
                <div v-if="totalInWords"
                  class="border-b border-[#1C2434] px-3 py-2 text-center">
                  <p class="text-[12px] font-semibold text-[#1C2434] italic">({{ totalInWords }})</p>
                </div>
                <div class="p-3 text-[11px] text-[#374151] space-y-1">
                  <div v-if="paymentTermLabel(order.paymentTerms) !== '—'" class="grid grid-cols-[96px_1fr] gap-x-2">
                    <span class="text-[#9BA7B0]">{{ t('erp.orders.paymentTerms') }}</span>
                    <span>{{ paymentTermLabel(order.paymentTerms) }}</span>
                  </div>
                  <div v-if="order.salesperson?.name" class="grid grid-cols-[96px_1fr] gap-x-2">
                    <span class="text-[#9BA7B0]">{{ t('erp.orders.salesperson') }}</span>
                    <span>{{ order.salesperson.name }}</span>
                  </div>
                  <p v-for="(term, i) in docTerms" :key="'t' + i" class="leading-snug">- {{ term }}</p>
                  <p v-if="order.notes" class="leading-snug whitespace-pre-line">- {{ order.notes }}</p>
                </div>
              </div>
              <div class="w-[241px] flex-shrink-0 border-l border-[#1C2434] text-[12px]">
                <div class="flex items-center justify-between px-3 pt-[7px] pb-[9px] border-b border-[#1C2434]">
                  <span class="text-[#637381]">{{ t('erp.orders.subtotal') }}</span>
                  <span class="tabular-nums text-[#1C2434]">{{ fmtMoney(order.subtotal) }}</span>
                </div>
                <div v-if="Number(order.discountAmount) > 0" class="flex items-center justify-between px-3 py-1.5 border-b border-[#1C2434]">
                  <span class="text-[#637381]">{{ t('erp.orders.discount') }}</span>
                  <span class="tabular-nums text-[#1C2434]">−{{ fmtMoney(order.discountAmount) }}</span>
                </div>
                <div class="flex items-center justify-between px-3 py-1.5 border-b border-[#1C2434]">
                  <span class="text-[#637381]">{{ t('erp.orders.docVat') }} {{ vatRate }}%</span>
                  <span class="tabular-nums text-[#1C2434]">{{ fmtMoney(order.tax) }}</span>
                </div>
                <div class="flex items-center justify-between px-3 py-2 bg-[#FAFBFD]">
                  <span class="font-bold text-[#1C2434]">{{ t('erp.orders.docNetTotal') }}</span>
                  <span class="font-extrabold text-[#1C2434] tabular-nums">{{ fmtMoney(order.total) }}</span>
                </div>
              </div>
            </div>

            <!-- Signatures -->
            <div class="grid grid-cols-3 gap-8 mt-12 px-2">
              <div v-for="(sig, i) in signatures" :key="'sig' + i" class="text-center">
                <div class="border-b border-dotted border-[#1C2434] h-8"></div>
                <p class="text-[11px] text-[#637381] mt-1.5">{{ sig }}</p>
                <p class="text-[10px] text-[#9BA7B0] mt-2">{{ t('erp.orders.docDate') }} ......./......./.......</p>
              </div>
            </div>
          </div>
        </article>

        <!-- ── Action panels (outside the document) ─────────────── -->

        <!-- Status transitions -->
        <div v-can="'erp.orders.edit'" v-if="forwardTransitions.length || cancelTransitions.length"
          class="bg-white border border-[#E2E8F0] shadow-card px-5 py-4 print:hidden
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
              class="px-4 py-2.5 text-sm font-semibold transition-colors disabled:opacity-50
                     flex items-center gap-2"
              :class="forwardBtnClass(s)">
              <ArrowPathIcon v-if="updatingStatus" class="w-4 h-4 animate-spin" />
              <template v-else>{{ transitionLabel(s) }}</template>
            </button>
            <button v-for="s in cancelTransitions" :key="s"
              @click="changeStatus(s)" :disabled="updatingStatus"
              class="px-4 py-2 text-sm font-medium border border-red-200 text-red-600
                     hover:bg-red-50 transition-colors disabled:opacity-50">
              {{ t('erp.orders.cancelOrder') }}
            </button>
          </div>
        </div>
        <p v-if="statusError" class="text-xs text-red-600 print:hidden">{{ statusError }}</p>

        <!-- Conversion actions (confirmed / shipped / delivered) -->
        <div v-if="['confirmed', 'shipped', 'delivered'].includes(order.status)"
          class="bg-white border border-[#E2E8F0] shadow-card px-5 py-4 print:hidden
                 flex items-center flex-wrap gap-3">
          <p class="text-[11px] font-semibold text-[#9BA7B0] uppercase tracking-wider mr-2">
            {{ t('erp.orders.convertActions') }}
          </p>
          <button v-can="'erp.orders.edit'" @click="convertToDeliveryOrder"
            :disabled="converting || !!order.linkedDeliveryOrder"
            :title="order.linkedDeliveryOrder ? `Already linked to ${order.linkedDeliveryOrder.refNo}` : ''"
            class="flex items-center gap-1.5 px-4 py-2 text-sm font-medium bg-primary-50 text-primary-600 border border-primary-200
                   hover:bg-primary-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
            <TruckIcon class="w-4 h-4" />
            {{ converting === 'do' ? t('erp.common.saving') : t('erp.orders.createDeliveryOrder') }}
          </button>
          <RouterLink v-if="order.linkedDeliveryOrder" :to="`/erp/delivery-orders/${order.linkedDeliveryOrder.id}`"
            class="inline-flex items-center px-2 py-0.5 text-xs font-medium bg-blue-50 text-blue-700 hover:bg-blue-100">
            → {{ order.linkedDeliveryOrder.refNo }}
          </RouterLink>

          <button v-can="'erp.invoices.edit'" @click="convertToInvoice"
            :disabled="converting || !!order.linkedInvoice"
            :title="order.linkedInvoice ? `Already linked to ${order.linkedInvoice.invoiceNumber}` : ''"
            class="flex items-center gap-1.5 px-4 py-2 text-sm font-medium bg-primary-50 text-primary-600 border border-primary-200
                   hover:bg-primary-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
            <DocumentTextIcon class="w-4 h-4" />
            {{ converting === 'inv' ? t('erp.common.saving') : t('erp.orders.createInvoice') }}
          </button>
          <RouterLink v-if="order.linkedInvoice" :to="`/erp/invoices/${order.linkedInvoice.id}`"
            class="inline-flex items-center px-2 py-0.5 text-xs font-medium bg-blue-50 text-blue-700 hover:bg-blue-100">
            → {{ order.linkedInvoice.invoiceNumber }}
          </RouterLink>

          <span v-if="convertError" class="self-center text-xs text-red-600">{{ convertError }}</span>
        </div>

        <ActivityTimeline v-if="order" ref-type="Order" :ref-id="order.id" class="print:hidden" />
      </template>
    </div>

    <!-- Confirm dialog -->
    <Teleport to="body">
      <div v-if="confirmOpen" class="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 px-4">
        <div class="w-full max-w-sm bg-white shadow-2xl overflow-hidden">
          <div class="px-5 py-4 flex items-start gap-3">
            <div class="w-9 h-9 bg-amber-100 flex items-center justify-center flex-shrink-0">
              <ExclamationCircleIcon class="w-5 h-5 text-amber-600" />
            </div>
            <div class="flex-1 min-w-0">
              <p class="text-sm font-semibold text-[#1C2434]">{{ confirmTitle }}</p>
              <p v-if="confirmMessage" class="mt-1 text-[12px] text-[#637381] leading-snug">{{ confirmMessage }}</p>
            </div>
          </div>
          <div class="px-5 py-3 bg-[#F7F9FC] flex items-center justify-end gap-2">
            <button type="button" @click="confirmAnswer(false)"
              class="px-4 py-2 text-sm font-medium text-[#637381] hover:text-[#1C2434] inline-flex items-center gap-1.5">
              {{ t('common.cancel') }}
              <kbd class="px-1 py-0.5 border border-[#E2E8F0] bg-white font-mono text-[10px] text-[#9BA7B0]">Esc</kbd>
            </button>
            <button type="button" @click="confirmAnswer(true)"
              class="px-4 py-2 text-sm font-semibold bg-red-500 text-white hover:bg-red-600 shadow-sm inline-flex items-center gap-1.5">
              {{ confirmOkLabel }}
              <kbd class="px-1 py-0.5 border border-red-400 bg-red-600 font-mono text-[10px] text-red-100">Enter</kbd>
            </button>
          </div>
        </div>
      </div>
    </Teleport>

  </AppLayout>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { RouterLink, useRoute, useRouter } from 'vue-router'
import ActivityTimeline from '@/components/ActivityTimeline.vue'
import DocCurrencyBadge from '@/components/DocCurrencyBadge.vue'
import {
  ArrowLeftIcon, ChevronRightIcon, DocumentTextIcon,
  CheckIcon, XMarkIcon, TrashIcon, PencilSquareIcon,
  ArrowPathIcon, ExclamationCircleIcon, TruckIcon, PrinterIcon,
} from '@heroicons/vue/24/outline'
import AppLayout from '@/layouts/AppLayout.vue'
import KeyboardShortcuts from '@/components/KeyboardShortcuts.vue'
import { useDetailShortcuts } from '@/composables/useShortcuts'
import api from '@/api'
import { fmtMoney, fmtDate, numToWords } from '@/utils/fmt'
import { useAuthStore } from '@/stores/auth'

const { t, locale } = useI18n()
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

const { shortcuts } = useDetailShortcuts({
  enabled:   () => !loading.value && !notFound.value && !confirmOpen.value,
  canEdit:   () => order.value?.status === 'draft',
  edit:      () => router.push(`/erp/orders/${order.value.id}/edit`),
  print:     onPrint,
  remove:    confirmDelete,
  canRemove: () => order.value?.status === 'draft',
  back:      () => router.push('/erp/orders'),
})

// ── Custom confirm modal ────────────────────────────────────────────────
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

// Company profile comes from /auth/me's `user.organization` — the top-level
// org account that owns the current session. Admins keep these fields up to
// date on /admin/organizations/:id/edit.
const org = computed(() => auth.user?.organization || {})
const companyName    = computed(() => org.value.companyName || org.value.name || 'Your Company')
const companyAddress = computed(() => org.value.address  || '')
const companyPhone   = computed(() => org.value.phone    || '')
const companyEmail   = computed(() => org.value.email    || '')
const companyTaxId   = computed(() => org.value.taxId    || '')
const companyWebsite = computed(() => org.value.website  || '')

// Logo paths are relative (e.g. /uploads/logos/abc.png). Vite proxies /uploads
// to the API server in dev; same-origin in prod. External URLs pass through.
const companyLogoSrc = computed(() => {
  const p = org.value.logoPath
  if (!p) return ''
  if (/^https?:\/\//i.test(p)) return p
  return p
})

// Bill-to address: prefer the order's billingAddress; fall back to customer's address.
const billingAddressDisplay = computed(() => order.value?.billingAddress || order.value?.customer?.address || '')

const totalInWords = computed(() => {
  if (!order.value) return ''
  return numToWords(order.value.total, locale.value, order.value.currency)
})

// Top-level items only (parent rows + standalone); package children are
// rendered indented under their parent via childrenOf().
const topLevelItems = computed(() => (order.value?.items || []).filter(it => !it.parentItemId))
function childrenOf(parentId) {
  return (order.value?.items || []).filter(it => it.parentItemId === parentId)
}

// ── Document helpers (mirror Receipt tax-invoice layout) ──
const fillerRows    = computed(() => Math.max(0, 8 - (order.value?.items?.length || 0)))
const customerTaxId = computed(() => order.value?.customer?.taxId || '')
const vatRate       = computed(() => {
  const base = (Number(order.value?.subtotal) || 0) - (Number(order.value?.discountAmount) || 0)
  const tax  = Number(order.value?.tax) || 0
  if (base > 0 && tax > 0) return Math.round((tax / base) * 100)
  return 7
})
const docTerms   = computed(() => [t('erp.orders.docTerm1'), t('erp.orders.docTerm2')])
const signatures = computed(() => [
  t('erp.orders.docPreparedBy'),
  t('erp.orders.docApprovedBy'),
  t('erp.orders.docCustomerSignature'),
])

function lineAmount(item) {
  return (Number(item.quantity) || 0) * (Number(item.unitPrice) || 0)
}
function fmtQty(q) {
  return (Number(q) || 0).toLocaleString(undefined, { maximumFractionDigits: 3 })
}
// Code for the dedicated CODE column. Order lines reference a SaleItem
// (which carries the customer-facing code) or a SalePackage; the linked
// Product is only populated for ad-hoc product lines, so its SKU is the
// last-resort fallback.
function itemCode(item) {
  if (item.salePackageId) return item.salePackage?.code || ''
  return item.saleItem?.code || item.product?.sku || ''
}

// Older package rows persisted productName as "Name (CODE)" — strip the
// trailing "(code)" so the ITEM column shows the bare name now that the
// code lives in its own column.
function itemName(item) {
  if (item.salePackageId) {
    const code = item.salePackage?.code
    const name = item.productName || ''
    if (code && name.endsWith(` (${code})`)) return name.slice(0, -(` (${code})`).length)
    return name
  }
  return item.productName || ''
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
  const ok = await confirmAsync({
    title:   `Delete ${order.value.orderNumber}?`,
    message: 'This cannot be undone.',
    okLabel: 'Delete',
  })
  if (!ok) return
  try {
    await api.delete(`/erp/orders/${order.value.id}`)
    router.push('/erp/orders')
  } catch (err) {
    statusError.value = err.response?.data?.message || 'Delete failed'
  }
}

// Confirm-modal keys are handled separately so they take over while the dialog is
// open (page-level shortcuts are suppressed via the `enabled` guard above).
function onConfirmKeydown(e) {
  if (!confirmOpen.value) return
  if (e.key === 'Enter')  { e.preventDefault(); confirmAnswer(true) }
  if (e.key === 'Escape') { e.preventDefault(); confirmAnswer(false) }
}
onMounted(() => window.addEventListener('keydown', onConfirmKeydown))
onUnmounted(() => window.removeEventListener('keydown', onConfirmKeydown))

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
@page {
  size: A4;
  margin: 12mm;
}
@media print {
  /* Hide app chrome (sidebar / topbar) — they're usually inside an aside or
     header that the AppLayout sets up. Tailwind's `print:hidden` handles the
     in-component bits; this catches anything we don't own. */
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
