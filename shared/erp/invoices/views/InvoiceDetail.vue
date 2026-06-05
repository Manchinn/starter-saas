<template>
  <AppLayout>
    <div class="space-y-5">

      <!-- Top action bar (hidden on print) -->
      <div class="flex items-start gap-3 print:hidden">
        <RouterLink to="/erp/invoices"
          class="mt-0.5 p-2 text-[#9BA7B0] hover:text-[#1C2434] hover:bg-white
                 border border-transparent hover:border-[#E2E8F0] transition-all flex-shrink-0">
          <ArrowLeftIcon class="w-[18px] h-[18px]" />
        </RouterLink>
        <div class="flex-1 min-w-0">
          <div class="flex items-center gap-2.5 flex-wrap">
            <h1 class="text-xl font-bold text-[#1C2434]">
              {{ loading ? '…' : (invoice?.invoiceNumber || t('erp.invoices.title')) }}
            </h1>
            <span v-if="invoice && !loading"
              class="inline-flex items-center gap-1.5 px-2.5 py-0.5 text-[11px] font-semibold capitalize"
              :class="statusBadge(invoice.status)">
              <span class="w-1.5 h-1.5" :class="statusDot(invoice.status)"></span>
              {{ invoice.status }}
            </span>
            <span v-if="isOverdue"
              class="inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-semibold
                     bg-red-100 text-red-600 border border-red-200">
              <ExclamationTriangleIcon class="w-3 h-3" />
              {{ t('erp.invoices.overdue') }}
            </span>
            <DocCurrencyBadge v-if="invoice" :currency="invoice.currency" :exchange-rate="invoice.exchangeRate" :total="invoice.total" />
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
              class="inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-medium bg-indigo-50 text-indigo-700 hover:bg-indigo-100">
              <ShoppingCartIcon class="w-3 h-3" /> {{ invoice.order.orderNumber }}
            </RouterLink>
            <RouterLink v-if="invoice.deliveryOrder" :to="`/erp/delivery-orders/${invoice.deliveryOrder.id}`"
              class="inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-medium bg-purple-50 text-purple-700 hover:bg-purple-100">
              <TruckIcon class="w-3 h-3" /> {{ invoice.deliveryOrder.refNo }}
            </RouterLink>
          </div>
        </div>
        <div v-if="invoice && !loading" class="flex items-center gap-2 flex-shrink-0">
          <KeyboardShortcuts :shortcuts="shortcuts" width="w-56" />
          <button @click="onPrint" type="button"
            :title="t('erp.invoices.printDocument')"
            class="inline-flex items-center gap-1.5 px-3 py-2 text-[12px] font-semibold
                   text-[#637381] bg-white border border-[#E2E8F0] hover:bg-[#F7F9FC] hover:text-[#1C2434] transition-colors">
            <PrinterIcon class="w-4 h-4" />
            {{ t('common.print') }}
          </button>
          <RouterLink v-if="invoice.status === 'draft'" v-can="'erp.invoices.edit'" :to="`/erp/invoices/${invoice.id}/edit`"
            class="inline-flex items-center gap-1.5 px-3 py-2 text-[12px] font-semibold
                   text-primary-600 bg-primary-50 hover:bg-primary-100 border border-primary-200 transition-colors">
            <PencilSquareIcon class="w-4 h-4" />
            {{ t('common.edit') }}
          </RouterLink>
          <button v-if="invoice.status === 'draft'" v-can="'erp.invoices.delete'" @click="confirmDelete" type="button"
            class="inline-flex items-center gap-1.5 px-3 py-2 text-[12px] font-semibold
                   text-red-600 bg-white border border-red-200 hover:bg-red-50 transition-colors">
            <TrashIcon class="w-4 h-4" />
          </button>
        </div>
      </div>

      <!-- Loading -->
      <LoadingSpinner v-if="loading" class="print:hidden" />

      <!-- Not found -->
      <div v-else-if="notFound"
        class="flex items-start gap-3 bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3.5 print:hidden">
        <ExclamationCircleIcon class="w-5 h-5 flex-shrink-0 mt-0.5" />
        <span>{{ t('erp.invoices.notFound') }}
          <RouterLink to="/erp/invoices" class="underline ml-1">{{ t('erp.common.backToList') }}</RouterLink>
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

        <!-- Document — invoice (ใบแจ้งหนี้) -->
        <article class="relative mx-auto bg-white border border-[#E2E8F0] shadow-card max-w-[186mm] w-full
                        print:border-0 print:shadow-none print:max-w-none print:mx-0
                        overflow-hidden">

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
                    <p v-if="companyPhone">{{ t('erp.invoices.docPhoneAbbr') }} {{ companyPhone }}</p>
                    <p v-if="companyTaxId" class="tabular-nums">
                      {{ t('erp.invoices.docTaxId') }} {{ companyTaxId }}
                    </p>
                  </div>
                </div>
              </div>
              <div class="text-right flex-shrink-0">
                <h2 class="text-[18px] font-bold text-[#1C2434] leading-tight">{{ t('erp.invoices.documentTitle') }}</h2>
                <p class="text-[11px] text-[#9BA7B0] mt-1">({{ t('erp.invoices.docOriginal') }})</p>
              </div>
            </header>

            <!-- Customer + meta boxes -->
            <div class="mt-5 grid grid-cols-1 sm:grid-cols-2 border border-[#1C2434]">
              <div class="p-3 border-b sm:border-b-0 sm:border-r border-[#1C2434] text-[12px] space-y-1.5">
                <div class="grid grid-cols-[78px_1fr] gap-x-2">
                  <span class="text-[#637381]">{{ t('erp.invoices.docCustomerCode') }}</span>
                  <span class="font-medium text-[#1C2434]">{{ invoice.customer?.code || '—' }}</span>
                </div>
                <div class="grid grid-cols-[78px_1fr] gap-x-2">
                  <span class="text-[#637381]">{{ t('erp.invoices.docCustomerName') }}</span>
                  <span class="font-semibold text-[#1C2434]">{{ invoice.customer?.company || invoice.customer?.name || '—' }}</span>
                </div>
                <div class="grid grid-cols-[78px_1fr] gap-x-2">
                  <span class="text-[#637381]">{{ t('erp.invoices.docAddress') }}</span>
                  <span class="text-[#1C2434] whitespace-pre-line leading-snug">{{ billingAddressDisplay || '—' }}</span>
                </div>
              </div>
              <div class="p-3 text-[12px] space-y-1.5">
                <div class="grid grid-cols-[124px_1fr] gap-x-2">
                  <span class="text-[#637381]">{{ t('erp.invoices.docTaxId') }}</span>
                  <span class="font-medium text-[#1C2434] tabular-nums">{{ customerTaxId || '—' }}</span>
                </div>
                <div class="grid grid-cols-[124px_1fr] gap-x-2">
                  <span class="text-[#637381]">{{ t('erp.invoices.docInvoiceNo') }}</span>
                  <span class="font-bold text-[#1C2434] tabular-nums">{{ invoice.invoiceNumber }}</span>
                </div>
                <div class="grid grid-cols-[124px_1fr] gap-x-2">
                  <span class="text-[#637381]">{{ t('erp.invoices.docDate') }}</span>
                  <span class="font-medium text-[#1C2434] tabular-nums">{{ fmtDate(invoice.invoiceDate) || '—' }}</span>
                </div>
                <div class="grid grid-cols-[124px_1fr] gap-x-2">
                  <span class="text-[#637381]">{{ t('erp.invoices.docDueDate') }}</span>
                  <span class="font-medium tabular-nums" :class="isOverdue ? 'text-red-600' : 'text-[#1C2434]'">{{ fmtDate(invoice.dueDate) || '—' }}</span>
                </div>
                <div v-if="invoice.referenceNumber" class="grid grid-cols-[124px_1fr] gap-x-2">
                  <span class="text-[#637381]">{{ t('erp.invoices.docPO') }}</span>
                  <span class="font-medium text-[#1C2434]">{{ invoice.referenceNumber }}</span>
                </div>
              </div>
            </div>

            <!-- Line items -->
            <table class="w-full mt-4 border-collapse text-[12px] table-fixed">
              <thead>
                <tr class="bg-[#FAFBFD] text-[10px] font-bold text-[#1C2434] uppercase tracking-wide">
                  <th class="border border-[#1C2434] px-2 py-2 text-left w-[80px]">{{ t('erp.invoices.colCode') }}</th>
                  <th class="border border-[#1C2434] px-2 py-2 text-left w-[266px]">{{ t('erp.invoices.colItem') }}</th>
                  <th class="border border-[#1C2434] px-2 py-2 text-right w-[64px]">{{ t('erp.common.qty') }}</th>
                  <th class="border border-[#1C2434] px-2 py-2 text-right w-[89px]">{{ t('erp.invoices.colUnitPrice') }}</th>
                  <th class="border border-[#1C2434] px-2 py-2 text-right w-[64px]">{{ t('erp.invoices.tax') }} %</th>
                  <th class="border border-[#1C2434] px-2 py-2 text-right w-[88px]">{{ t('erp.invoices.total') }}</th>
                </tr>
              </thead>
              <tbody>
                <template v-for="(item, idx) in topLevelItems" :key="item.id || idx">
                  <tr class="align-top">
                    <td class="border-x border-b border-x-[#1C2434] border-b-[#E2E8F0] px-2 py-1.5 font-mono text-[11px] text-[#637381]">{{ itemCode(item) || '—' }}</td>
                    <td class="border-x border-b border-x-[#1C2434] border-b-[#E2E8F0] px-2 py-1.5">
                      <span class="text-[10px] text-[#1C2434]">{{ itemName(item) }}</span>
                      <span v-if="item.description" class="block text-[11px] text-[#9BA7B0]">{{ item.description }}</span>
                    </td>
                    <td class="border-x border-b border-x-[#1C2434] border-b-[#E2E8F0] px-2 py-1.5 text-right tabular-nums text-[#374151]">{{ fmtQty(item.quantity) }}</td>
                    <td class="border-x border-b border-x-[#1C2434] border-b-[#E2E8F0] px-2 py-1.5 text-right tabular-nums text-[#374151]">{{ fmtMoney(item.unitPrice) }}</td>
                    <td class="border-x border-b border-x-[#1C2434] border-b-[#E2E8F0] px-2 py-1.5 text-right tabular-nums text-[#374151]">{{ Number(item.taxRate || 0) }}%</td>
                    <td class="border-x border-b border-x-[#1C2434] border-b-[#E2E8F0] px-2 py-1.5 text-right tabular-nums font-medium text-[#1C2434]">{{ fmtMoney(lineAmount(item)) }}</td>
                  </tr>
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
                  <div v-if="paymentTermLabel(invoice.paymentTerms) !== '—'" class="grid grid-cols-[96px_1fr] gap-x-2">
                    <span class="text-[#9BA7B0]">{{ t('erp.invoices.paymentTerms') }}</span>
                    <span>{{ paymentTermLabel(invoice.paymentTerms) }}</span>
                  </div>
                  <div v-if="invoice.salesperson?.name" class="grid grid-cols-[96px_1fr] gap-x-2">
                    <span class="text-[#9BA7B0]">{{ t('erp.invoices.salesperson') }}</span>
                    <span>{{ invoice.salesperson.name }}</span>
                  </div>
                  <p v-for="(term, i) in docTerms" :key="'t' + i" class="leading-snug">- {{ term }}</p>
                  <p v-if="invoice.notes" class="leading-snug whitespace-pre-line">- {{ invoice.notes }}</p>
                </div>
              </div>
              <div class="w-[241px] flex-shrink-0 border-l border-[#1C2434] text-[12px]">
                <div class="flex items-center justify-between px-3 pt-[7px] pb-[9px] border-b border-[#1C2434]">
                  <span class="text-[#637381]">{{ t('erp.invoices.subtotal') }}</span>
                  <span class="tabular-nums text-[#1C2434]">{{ fmtMoney(invoice.subtotal) }}</span>
                </div>
                <div v-if="Number(invoice.discountAmount) > 0" class="flex items-center justify-between px-3 py-1.5 border-b border-[#1C2434]">
                  <span class="text-[#637381]">{{ t('erp.invoices.discount') }}</span>
                  <span class="tabular-nums text-[#1C2434]">−{{ fmtMoney(invoice.discountAmount) }}</span>
                </div>
                <div class="flex items-center justify-between px-3 py-1.5 border-b border-[#1C2434]">
                  <span class="text-[#637381]">{{ t('erp.invoices.docVat') }} {{ vatRate }}%</span>
                  <span class="tabular-nums text-[#1C2434]">{{ fmtMoney(invoice.tax) }}</span>
                </div>
                <div class="flex items-center justify-between px-3 py-2 bg-[#FAFBFD]">
                  <span class="font-bold text-[#1C2434]">{{ t('erp.invoices.docNetTotal') }}</span>
                  <span class="font-extrabold text-[#1C2434] tabular-nums">{{ fmtMoney(invoice.total) }}</span>
                </div>
              </div>
            </div>

            <!-- Signatures -->
            <div class="grid grid-cols-3 gap-8 mt-12 px-2">
              <div v-for="(sig, i) in signatures" :key="'sig' + i" class="text-center">
                <div class="border-b border-dotted border-[#1C2434] h-8"></div>
                <p class="text-[11px] text-[#637381] mt-1.5">{{ sig }}</p>
                <p class="text-[10px] text-[#9BA7B0] mt-2">{{ t('erp.invoices.docDate') }} ......./......./.......</p>
              </div>
            </div>
          </div>
        </article>

        <!-- Status transitions -->
        <div v-can="'erp.invoices.edit'" v-if="forwardTransitions.length || cancelTransitions.length"
          class="bg-white border border-[#E2E8F0] shadow-card px-5 py-4 print:hidden
                 flex items-center justify-between flex-wrap gap-3">
          <div>
            <p class="text-[11px] font-semibold text-[#9BA7B0] uppercase tracking-wider">
              {{ t('erp.invoices.nextAction') }}
            </p>
            <p class="text-[13px] text-[#637381] mt-0.5">
              {{ t('erp.invoices.nextActionHint') }}
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
              {{ t('erp.invoices.cancelInvoice') }}
            </button>
          </div>
        </div>
        <p v-if="statusError" class="text-xs text-red-600 print:hidden">{{ statusError }}</p>

        <!-- Convert to Receipt -->
        <div v-if="['sent', 'paid'].includes(invoice.status)"
          class="bg-white border border-[#E2E8F0] shadow-card px-5 py-4 print:hidden
                 flex items-center flex-wrap gap-3">
          <p class="text-[11px] font-semibold text-[#9BA7B0] uppercase tracking-wider mr-2">
            {{ t('erp.invoices.convertActions') }}
          </p>
          <button v-can="'erp.receipts.edit'" @click="convertToReceipt"
            :disabled="converting || !!invoice.linkedReceipt"
            :title="invoice.linkedReceipt ? `Already linked to ${invoice.linkedReceipt.receiptNumber}` : ''"
            class="flex items-center gap-1.5 px-4 py-2 text-sm font-medium bg-primary-50 text-primary-600 border border-primary-200
                   hover:bg-primary-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
            <BanknotesIcon class="w-4 h-4" />
            {{ converting ? t('erp.common.saving') : t('erp.invoices.recordPayment') }}
          </button>
          <RouterLink v-if="invoice.linkedReceipt" :to="`/erp/receipts/${invoice.linkedReceipt.id}`"
            class="inline-flex items-center px-2 py-0.5 text-xs font-medium bg-blue-50 text-blue-700 hover:bg-blue-100">
            → {{ invoice.linkedReceipt.receiptNumber }}
          </RouterLink>
          <span v-if="convertError" class="self-center text-xs text-red-600">{{ convertError }}</span>
        </div>

        <AttachmentsPanel v-if="invoice" ref-type="Invoice" :ref-id="invoice.id" class="print:hidden" />
        <ActivityTimeline v-if="invoice" ref-type="Invoice" :ref-id="invoice.id" class="print:hidden" />
      </template>
    </div>
  </AppLayout>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import {
  ArrowLeftIcon, ChevronRightIcon,
  CheckIcon, XMarkIcon, TrashIcon, PencilSquareIcon,
  ArrowPathIcon, ExclamationCircleIcon, ExclamationTriangleIcon,
  PrinterIcon, BanknotesIcon, ShoppingCartIcon, TruckIcon,
} from '@heroicons/vue/24/outline'
import AppLayout from '@/layouts/AppLayout.vue'
import KeyboardShortcuts from '@/components/KeyboardShortcuts.vue'
import { useDetailShortcuts } from '@/composables/useShortcuts'
import LoadingSpinner from '@/components/form/LoadingSpinner.vue'
import AttachmentsPanel from '@/components/AttachmentsPanel.vue'
import ActivityTimeline from '@/components/ActivityTimeline.vue'
import DocCurrencyBadge from '@/components/DocCurrencyBadge.vue'
import api from '@/api'
import { fmtMoney, fmtDate, numToWords } from '@/utils/fmt'
import { useAuthStore } from '@/stores/auth'

const { t, locale } = useI18n()
const route          = useRoute()
const router         = useRouter()
const auth           = useAuthStore()
const invoice        = ref(null)
const totalInWords   = computed(() => invoice.value ? numToWords(invoice.value.total, locale.value, invoice.value.currency) : '')
const loading        = ref(true)
const notFound       = ref(false)
const updatingStatus = ref(false)
const statusError    = ref('')
const converting     = ref(false)
const convertError   = ref('')

const { shortcuts } = useDetailShortcuts({
  enabled: () => !loading.value && !!invoice.value,
  canEdit: () => invoice.value?.status === 'draft',
  edit:  () => router.push(`/erp/invoices/${invoice.value.id}/edit`),
  print: onPrint,
  back:  () => router.push('/erp/invoices'),
})

// Company profile from auth.user.organization, mirrors SO/DO detail.
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

const billingAddressDisplay = computed(() =>
  invoice.value?.billingAddress || invoice.value?.customer?.address || ''
)

const topLevelItems = computed(() => (invoice.value?.items || []).filter(it => !it.parentItemId))
function childrenOf(parentId) {
  return (invoice.value?.items || []).filter(it => it.parentItemId === parentId)
}

// ── Document helpers (mirror Receipt tax-invoice layout) ──
const fillerRows    = computed(() => Math.max(0, 8 - (invoice.value?.items?.length || 0)))
const customerTaxId = computed(() => invoice.value?.customer?.taxId || '')
const vatRate       = computed(() => {
  const base = (Number(invoice.value?.subtotal) || 0) - (Number(invoice.value?.discountAmount) || 0)
  const tax  = Number(invoice.value?.tax) || 0
  if (base > 0 && tax > 0) return Math.round((tax / base) * 100)
  return 7
})
const docTerms   = computed(() => [t('erp.invoices.docTerm1'), t('erp.invoices.docTerm2')])
const signatures = computed(() => [
  t('erp.invoices.docPreparedBy'),
  t('erp.invoices.docApprovedBy'),
  t('erp.invoices.docCustomerSignature'),
])

function lineAmount(item) {
  return (Number(item.quantity) || 0) * (Number(item.unitPrice) || 0)
}
function fmtQty(q) {
  return (Number(q) || 0).toLocaleString(undefined, { maximumFractionDigits: 3 })
}
function itemCode(item) {
  // Prefer the snapshot stored on the row (set at create time), then fall back
  // to the live associations for older items that pre-date the snapshot column.
  if (item.itemCode) return item.itemCode
  if (item.salePackageId) return item.salePackage?.code || ''
  return item.saleItem?.code || item.product?.sku || ''
}
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

const stampLabel = computed(() => {
  const s = invoice.value?.status
  if (s === 'draft')     return 'Draft'
  if (s === 'paid')      return 'Paid'
  if (s === 'cancelled') return 'Cancelled'
  return ''
})
const stampClass = computed(() => {
  const s = invoice.value?.status
  if (s === 'cancelled') return 'text-red-600 border-red-600'
  if (s === 'paid')      return 'text-green-600 border-green-600'
  return 'text-[#1C2434] border-[#1C2434]'
})

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
