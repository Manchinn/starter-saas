<template>
  <AppLayout>
    <div class="space-y-5">

      <!-- Top action bar (hidden on print) -->
      <div class="flex items-start gap-3 print:hidden">
        <RouterLink to="/erp/quotations"
          class="mt-0.5 p-2 text-[#9BA7B0] hover:text-[#1C2434] hover:bg-white
                 border border-transparent hover:border-[#E2E8F0] transition-all flex-shrink-0">
          <ArrowLeftIcon class="w-[18px] h-[18px]" />
        </RouterLink>
        <div class="flex-1 min-w-0">
          <div class="flex items-center gap-2.5 flex-wrap">
            <h1 class="text-xl font-bold text-[#1C2434]">
              {{ loading ? '…' : (quotation?.refNo || t('erp.quotations.detail')) }}
            </h1>
            <span v-if="quotation && !loading"
              class="inline-flex items-center gap-1.5 px-2.5 py-0.5 text-[11px] font-semibold capitalize"
              :class="statusBadge(quotation.status)">
              <span class="w-1.5 h-1.5" :class="statusDot(quotation.status)"></span>
              {{ t('erp.quotations.' + quotation.status) }}
            </span>
            <DocCurrencyBadge v-if="quotation" :currency="quotation.currency" :exchange-rate="quotation.exchangeRate" :total="quotation.total" />
          </div>
          <nav class="flex items-center gap-1.5 mt-1">
            <RouterLink to="/erp/quotations" class="text-[12px] text-[#9BA7B0] hover:text-[#637381] transition-colors">
              {{ t('erp.quotations.title') }}
            </RouterLink>
            <ChevronRightIcon class="w-3 h-3 text-[#CBD5E1]" />
            <span class="text-[12px] text-[#637381]">{{ quotation?.refNo || '…' }}</span>
          </nav>
        </div>
        <!-- Quick actions -->
        <div v-if="quotation && !loading" class="flex items-center gap-2 flex-shrink-0">
          <KeyboardShortcuts :shortcuts="pageShortcuts" width="w-56" />
          <button @click="onPrint" type="button"
            :title="t('erp.quotations.printDocument')"
            class="inline-flex items-center gap-1.5 px-3 py-2 text-[12px] font-semibold
                   text-[#637381] bg-white border border-[#E2E8F0] hover:bg-[#F7F9FC] hover:text-[#1C2434] transition-colors">
            <PrinterIcon class="w-4 h-4" />
            {{ t('common.print') }}
          </button>
          <RouterLink v-if="quotation.status === 'draft'" v-can="'erp.quotations.edit'" :to="`/erp/quotations/${quotation.id}/edit`"
            class="inline-flex items-center gap-1.5 px-3 py-2 text-[12px] font-semibold
                   text-primary-600 bg-primary-50 hover:bg-primary-100 border border-primary-200 transition-colors">
            <PencilSquareIcon class="w-4 h-4" />
            {{ t('common.edit') }}
          </RouterLink>
          <button v-if="quotation.status === 'draft'" v-can="'erp.quotations.delete'" @click="confirmDelete" type="button"
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
        <span>{{ t('erp.quotations.notFound') }}
          <RouterLink to="/erp/quotations" class="underline ml-1">{{ t('erp.common.backToList') }}</RouterLink>
        </span>
      </div>

      <template v-else>
        <!-- Compact workflow strip -->
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
              <span class="text-[12px] font-semibold">{{ t('erp.quotations.rejected') }}</span>
            </span>
          </div>
        </div>

        <!-- ── Document ─────────────────────────────────────────── -->
        <article class="relative mx-auto bg-white border border-[#E2E8F0] shadow-card max-w-[860px] w-full
                        print:border-0 print:shadow-none print:max-w-none print:mx-0 print:
                        overflow-hidden">

          <!-- DRAFT / REJECTED / CONVERTED stamp -->
          <div v-if="stampLabel"
            class="pointer-events-none absolute inset-0 flex items-center justify-center z-10"
            aria-hidden="true">
            <span class="select-none font-black tracking-[0.2em] uppercase border-[6px] px-6 py-2
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
                  <p v-if="companyPhone">{{ t('erp.quotations.docPhoneAbbr') }} {{ companyPhone }}</p>
                  <p v-if="companyEmail">{{ companyEmail }}</p>
                  <p v-if="companyWebsite">{{ companyWebsite }}</p>
                  <p v-if="companyTaxId" class="tabular-nums">
                    <span class="text-[#9BA7B0]">{{ t('erp.quotations.docTaxId') }}</span> {{ companyTaxId }}
                  </p>
                </div>
              </div>
            </div>
            <div class="text-right flex-shrink-0">
              <h2 class="text-[26px] font-extrabold tracking-[0.18em] text-[#1C2434] uppercase">
                {{ t('erp.quotations.documentTitle') }}
              </h2>
              <dl class="mt-3 text-[12px] grid grid-cols-[auto_auto] gap-x-3 gap-y-1 justify-end">
                <dt class="text-[#9BA7B0] uppercase tracking-wider text-[10px] font-semibold pt-0.5 text-right">#</dt>
                <dd class="font-bold text-[#1C2434] tabular-nums text-right">{{ quotation.refNo }}</dd>

                <dt class="text-[#9BA7B0] uppercase tracking-wider text-[10px] font-semibold pt-0.5 text-right">
                  {{ t('erp.quotations.docDate') }}
                </dt>
                <dd class="font-semibold text-[#1C2434] tabular-nums text-right">{{ fmtDate(quotation.quotationDate) || '—' }}</dd>

                <template v-if="quotation.validUntil">
                  <dt class="text-[#9BA7B0] uppercase tracking-wider text-[10px] font-semibold pt-0.5 text-right">
                    {{ t('erp.quotations.docValidUntil') }}
                  </dt>
                  <dd class="font-semibold text-[#1C2434] tabular-nums text-right">{{ fmtDate(quotation.validUntil) }}</dd>
                </template>

                <template v-if="quotation.referenceNumber">
                  <dt class="text-[#9BA7B0] uppercase tracking-wider text-[10px] font-semibold pt-0.5 text-right">
                    {{ t('erp.quotations.docPO') }}
                  </dt>
                  <dd class="font-semibold text-[#1C2434] text-right">{{ quotation.referenceNumber }}</dd>
                </template>
              </dl>
            </div>
          </header>

          <!-- Bill-to / Ship-to -->
          <section class="px-10 py-6 grid grid-cols-1 sm:grid-cols-2 gap-x-10 gap-y-6 border-b border-dashed border-[#E2E8F0]">
            <div>
              <p class="text-[10px] font-bold text-[#9BA7B0] uppercase tracking-[0.15em] mb-2">
                {{ t('erp.quotations.docBillTo') }}
              </p>
              <p class="text-[14px] font-bold text-[#1C2434]">{{ quotation.customer?.name || '—' }}</p>
              <p v-if="quotation.customer?.company" class="text-[12px] text-[#374151]">{{ quotation.customer.company }}</p>
              <p v-if="billingAddressDisplay" class="text-[12px] text-[#374151] mt-1 whitespace-pre-line leading-snug">
                {{ billingAddressDisplay }}
              </p>
              <p v-if="quotation.customer?.email" class="text-[11px] text-[#637381] mt-1.5">{{ quotation.customer.email }}</p>
              <p v-if="quotation.customer?.phone" class="text-[11px] text-[#637381]">{{ quotation.customer.phone }}</p>
            </div>
            <div>
              <p class="text-[10px] font-bold text-[#9BA7B0] uppercase tracking-[0.15em] mb-2">
                {{ t('erp.quotations.docShipTo') }}
              </p>
              <p v-if="quotation.shippingAddress" class="text-[12px] text-[#374151] whitespace-pre-line leading-snug">
                {{ quotation.shippingAddress }}
              </p>
              <p v-else class="text-[12px] text-[#9BA7B0] italic">{{ t('erp.quotations.docSameAsBilling') }}</p>
            </div>
          </section>

          <!-- Metadata strip -->
          <section class="px-10 py-4 grid grid-cols-2 sm:grid-cols-4 gap-x-6 gap-y-3 border-b border-dashed border-[#E2E8F0] bg-[#FAFBFD]">
            <div>
              <p class="text-[9px] font-bold text-[#9BA7B0] uppercase tracking-[0.15em]">{{ t('erp.quotations.validUntil') }}</p>
              <p class="text-[12px] font-semibold text-[#1C2434] tabular-nums mt-0.5">{{ fmtDate(quotation.validUntil) || '—' }}</p>
            </div>
            <div>
              <p class="text-[9px] font-bold text-[#9BA7B0] uppercase tracking-[0.15em]">{{ t('erp.quotations.paymentTerms') }}</p>
              <p class="text-[12px] font-semibold text-[#1C2434] mt-0.5">{{ paymentTermLabel(quotation.paymentTerms) }}</p>
            </div>
            <div>
              <p class="text-[9px] font-bold text-[#9BA7B0] uppercase tracking-[0.15em]">{{ t('erp.quotations.salesperson') }}</p>
              <p class="text-[12px] font-semibold text-[#1C2434] mt-0.5">{{ quotation.salesperson?.name || '—' }}</p>
            </div>
            <div>
              <p class="text-[9px] font-bold text-[#9BA7B0] uppercase tracking-[0.15em]">{{ t('erp.common.currency') }}</p>
              <p class="text-[12px] font-semibold text-[#1C2434] tabular-nums mt-0.5">{{ quotation.currency || '—' }}</p>
            </div>
          </section>

          <!-- Line items -->
          <section class="px-10 pt-6 pb-2">
            <table class="w-full text-[12px]">
              <thead>
                <tr class="border-b-2 border-[#1C2434] text-[10px] font-bold text-[#1C2434] uppercase tracking-wider">
                  <th class="py-2.5 text-left w-8">#</th>
                  <th class="py-2.5 text-left w-28">{{ t('erp.quotations.colCode') }}</th>
                  <th class="py-2.5 text-left">{{ t('erp.quotations.colItem') }}</th>
                  <th class="py-2.5 text-right w-16">{{ t('erp.quotations.colQty') }}</th>
                  <th class="py-2.5 text-right w-24">{{ t('erp.quotations.colUnitPrice') }}</th>
                  <th class="py-2.5 text-right w-14">{{ t('erp.quotations.tax') }} %</th>
                  <th class="py-2.5 text-right w-28">{{ t('erp.quotations.colTotal') }}</th>
                </tr>
              </thead>
              <tbody>
                <template v-for="(item, idx) in topLevelItems" :key="item.id">
                  <tr class="border-b border-[#F1F5F9]">
                    <td class="py-2.5 align-top text-[#9BA7B0] tabular-nums">{{ idx + 1 }}</td>
                    <td class="py-2.5 align-top text-[#637381] font-mono text-[11px]">{{ itemCode(item) || '—' }}</td>
                    <td class="py-2.5 align-top">
                      <span class="font-semibold text-[#1C2434]">{{ itemName(item) }}</span>
                    </td>
                    <td class="py-2.5 align-top text-right text-[#374151] tabular-nums">{{ item.quantity }}</td>
                    <td class="py-2.5 align-top text-right text-[#374151] tabular-nums">{{ fmtMoney(item.unitPrice) }}</td>
                    <td class="py-2.5 align-top text-right text-[#374151] tabular-nums">{{ Number(item.taxRate || 0) }}%</td>
                    <td class="py-2.5 align-top text-right font-semibold text-[#1C2434] tabular-nums">
                      {{ fmtMoney((Number(item.quantity) || 0) * (Number(item.unitPrice) || 0)) }}
                    </td>
                  </tr>
                  <tr v-for="child in childrenOf(item.id)" :key="child.id"
                    class="border-b border-[#F1F5F9] text-[11px]">
                    <td></td>
                    <td class="py-1.5 text-[#9BA7B0] font-mono text-[10px]">{{ itemCode(child) || '—' }}</td>
                    <td colspan="5" class="py-1.5 pl-6 text-[#637381]">
                      <span class="text-[#CBD5E1] mr-1.5">↳</span>
                      {{ child.productName }}
                      <span class="text-[10px] font-semibold text-[#9BA7B0] tabular-nums ml-2">× {{ child.quantity }}</span>
                    </td>
                  </tr>
                </template>
                <tr v-if="!topLevelItems.length">
                  <td colspan="7" class="py-6 text-center text-[12px] text-[#9BA7B0] italic">
                    {{ t('erp.common.noItems') }}
                  </td>
                </tr>
              </tbody>
            </table>
          </section>

          <!-- Totals -->
          <section class="px-10 pb-6 flex items-start justify-between gap-6">
            <p v-if="totalInWords" class="text-[13px] font-semibold text-[#1C2434] italic flex-1 min-w-0 text-center">
              {{ totalInWords }}
            </p>
            <dl class="w-full sm:w-72 flex-shrink-0 text-[12px] space-y-1.5">
              <div class="flex items-center justify-between">
                <dt class="text-[#637381]">{{ t('erp.quotations.subtotal') }}</dt>
                <dd class="font-semibold text-[#1C2434] tabular-nums">{{ fmtMoney(quotation.subtotal) }}</dd>
              </div>
              <div class="flex items-center justify-between">
                <dt class="text-[#637381]">{{ t('erp.quotations.tax') }}</dt>
                <dd class="font-semibold text-[#1C2434] tabular-nums">{{ fmtMoney(quotation.tax) }}</dd>
              </div>
              <div v-if="Number(quotation.discountAmount) > 0" class="flex items-center justify-between">
                <dt class="text-[#637381]">{{ t('erp.quotations.discount') }}</dt>
                <dd class="font-semibold text-red-600 tabular-nums">−{{ fmtMoney(quotation.discountAmount) }}</dd>
              </div>
              <div class="flex items-center justify-between pt-2 mt-1 border-t-2 border-[#1C2434]">
                <dt class="text-[11px] font-bold text-[#1C2434] uppercase tracking-wider">{{ t('erp.quotations.total') }}</dt>
                <dd class="text-[16px] font-extrabold text-[#1C2434] tabular-nums">{{ fmtMoney(quotation.total) }}</dd>
              </div>
            </dl>
          </section>

          <!-- Notes -->
          <section v-if="quotation.notes" class="px-10 pt-2 pb-6 border-t border-dashed border-[#E2E8F0]">
            <p class="text-[10px] font-bold text-[#9BA7B0] uppercase tracking-[0.15em] mb-1.5">
              {{ t('erp.quotations.notes') }}
            </p>
            <p class="text-[12px] text-[#374151] whitespace-pre-line leading-relaxed">{{ quotation.notes }}</p>
          </section>

          <!-- Footer with signatures -->
          <footer class="px-10 pt-6 pb-8 border-t border-dashed border-[#E2E8F0]">
            <div class="grid grid-cols-2 gap-10">
              <div>
                <div class="h-10 border-b border-[#1C2434]"></div>
                <p class="text-[10px] text-[#637381] mt-1.5 text-center uppercase tracking-wider">
                  {{ t('erp.quotations.docAuthorisedSignature') }}
                </p>
              </div>
              <div>
                <div class="h-10 border-b border-[#1C2434]"></div>
                <p class="text-[10px] text-[#637381] mt-1.5 text-center uppercase tracking-wider">
                  {{ t('erp.quotations.docCustomerSignature') }}
                </p>
              </div>
            </div>
            <p class="text-center text-[10px] text-[#9BA7B0] mt-6">
              {{ t('erp.quotations.docFooterThanks') }}
            </p>
          </footer>
        </article>

        <!-- Status transitions -->
        <div v-can="'erp.quotations.edit'" v-if="forwardTransitions.length || cancelTransitions.length"
          class="bg-white border border-[#E2E8F0] shadow-card px-5 py-4 print:hidden
                 flex items-center justify-between flex-wrap gap-3">
          <div>
            <p class="text-[11px] font-semibold text-[#9BA7B0] uppercase tracking-wider">
              {{ t('erp.quotations.nextAction') }}
            </p>
            <p class="text-[13px] text-[#637381] mt-0.5">
              {{ t('erp.quotations.nextActionHint') }}
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
              {{ t('erp.quotations.markRejected') }}
            </button>
          </div>
        </div>
        <p v-if="statusError" class="text-xs text-red-600 print:hidden">{{ statusError }}</p>

        <!-- Convert to Sales Order (accepted only) / linked-order indicator -->
        <div v-if="quotation.status === 'accepted' || quotation.convertedToOrderId"
          class="bg-white border border-[#E2E8F0] shadow-card px-5 py-4 print:hidden
                 flex items-center flex-wrap gap-3">
          <p class="text-[11px] font-semibold text-[#9BA7B0] uppercase tracking-wider mr-2">
            {{ t('erp.quotations.convertActions') }}
          </p>
          <button v-can="'erp.orders.edit'" v-if="quotation.status === 'accepted' && !quotation.convertedToOrderId"
            @click="convertToOrder"
            :disabled="converting"
            class="flex items-center gap-1.5 px-4 py-2 text-sm font-medium bg-primary-50 text-primary-600 border border-primary-200
                   hover:bg-primary-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
            <ArrowRightIcon class="w-4 h-4" />
            {{ converting ? t('erp.common.saving') : t('erp.quotations.convertToOrder') }}
          </button>
          <RouterLink v-if="quotation.convertedToOrderId" :to="`/erp/orders/${quotation.convertedToOrderId}`"
            class="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-blue-50 text-blue-700 hover:bg-blue-100">
            <ArrowRightIcon class="w-3.5 h-3.5" />
            {{ t('erp.quotations.viewOrder') }}
          </RouterLink>
          <span v-if="convertError" class="self-center text-xs text-red-600">{{ convertError }}</span>
        </div>

        <ActivityTimeline v-if="quotation" ref-type="Quotation" :ref-id="quotation.id" class="print:hidden" />
      </template>
    </div>
  </AppLayout>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { RouterLink, useRoute, useRouter } from 'vue-router'
import ActivityTimeline from '@/components/ActivityTimeline.vue'
import DocCurrencyBadge from '@/components/DocCurrencyBadge.vue'
import KeyboardShortcuts from '@/components/KeyboardShortcuts.vue'
import {
  ArrowLeftIcon, ChevronRightIcon, ArrowRightIcon,
  CheckIcon, XMarkIcon, TrashIcon, PencilSquareIcon,
  ArrowPathIcon, ExclamationCircleIcon, PrinterIcon,
} from '@heroicons/vue/24/outline'
import AppLayout from '@/layouts/AppLayout.vue'
import api from '@/api'
import { fmtMoney, fmtDate, numToWords } from '@/utils/fmt'
import { useAuthStore } from '@/stores/auth'

const { t, locale } = useI18n()
const route    = useRoute()
const router   = useRouter()
const auth     = useAuthStore()

const quotation      = ref(null)
const loading        = ref(true)
const notFound       = ref(false)
const updatingStatus = ref(false)
const statusError    = ref('')
const converting     = ref(false)
const convertError   = ref('')

const pageShortcuts = computed(() => [
  ...(quotation.value?.status === 'draft' ? [{ key: 'E', label: 'Edit' }] : []),
  { key: 'Ctrl+P', label: 'Print' },
  { key: 'Escape', label: 'Back to list' },
  { key: 'Backspace', label: 'Back to list' },
])

// Company profile from auth.user.organization, mirrors Order detail.
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

const billingAddressDisplay = computed(() => quotation.value?.billingAddress || quotation.value?.customer?.address || '')

const totalInWords = computed(() => {
  if (!quotation.value) return ''
  return numToWords(quotation.value.total, locale.value, quotation.value.currency)
})

const topLevelItems = computed(() => (quotation.value?.items || []).filter(it => !it.parentItemId))
function childrenOf(parentId) {
  return (quotation.value?.items || []).filter(it => it.parentItemId === parentId)
}

function itemCode(item) {
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

// ── Workflow ──────────────────────────────────────────────
const FLOW_STEPS = [
  { key: 'draft',     label: 'Draft' },
  { key: 'sent',      label: 'Sent' },
  { key: 'accepted',  label: 'Accepted' },
  { key: 'converted', label: 'Converted' },
]
const COMPLETED_BEFORE = {
  draft:     [],
  sent:      ['draft'],
  accepted:  ['draft', 'sent'],
  converted: ['draft', 'sent', 'accepted'],
  rejected:  ['draft', 'sent'],
}
const TRANSITIONS = {
  draft:     ['sent'],
  sent:      ['accepted', 'rejected'],
  accepted:  [],
  converted: [],
  rejected:  ['draft'],
}

const availableTransitions = computed(() => TRANSITIONS[quotation.value?.status] || [])
const forwardTransitions   = computed(() => availableTransitions.value.filter(s => s !== 'rejected'))
const cancelTransitions    = computed(() => availableTransitions.value.filter(s => s === 'rejected'))
const isRejected           = computed(() => quotation.value?.status === 'rejected')

function stepState(key) {
  const cur = quotation.value?.status
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
  sent:      'bg-blue-600 text-white hover:bg-blue-700',
  accepted:  'bg-green-600 text-white hover:bg-green-700',
}
function forwardBtnClass(s) { return FORWARD_BTN[s] || 'bg-primary-500 text-white hover:bg-primary-600' }

const TRANSITION_LABELS = {
  sent:      'Mark as Sent',
  accepted:  'Mark as Accepted',
  rejected:  'Mark as Rejected',
  draft:     'Back to Draft',
}
function transitionLabel(s) { return TRANSITION_LABELS[s] || s }

const STATUS_BADGE = {
  draft:     'bg-[#F1F5F9] text-[#637381]',
  sent:      'bg-blue-50 text-blue-700',
  accepted:  'bg-green-50 text-green-700',
  rejected:  'bg-red-50 text-red-600',
  converted: 'bg-purple-50 text-purple-700',
}
const STATUS_DOT = {
  draft:     'bg-slate-400',
  sent:      'bg-blue-500',
  accepted:  'bg-green-500',
  rejected:  'bg-red-500',
  converted: 'bg-purple-500',
}
function statusBadge(s) { return STATUS_BADGE[s] || STATUS_BADGE.draft }
function statusDot(s)   { return STATUS_DOT[s]   || STATUS_DOT.draft }

const stampLabel = computed(() => {
  const s = quotation.value?.status
  if (s === 'draft')     return 'Draft'
  if (s === 'rejected')  return 'Rejected'
  if (s === 'converted') return 'Converted'
  return ''
})
const stampClass = computed(() => {
  const s = quotation.value?.status
  if (s === 'rejected')  return 'text-red-600 border-red-600'
  if (s === 'converted') return 'text-purple-600 border-purple-600'
  return 'text-[#1C2434] border-[#1C2434]'
})

// ── Data ──────────────────────────────────────────────────
function isTyping() {
  const el = document.activeElement
  return el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.isContentEditable)
}

function onKeydown(e) {
  if (isTyping() || loading.value || !quotation.value) return
  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'p') {
    e.preventDefault(); onPrint()
  } else if (!e.ctrlKey && !e.metaKey && !e.altKey && e.key === 'e') {
    if (quotation.value.status === 'draft') router.push(`/erp/quotations/${quotation.value.id}/edit`)
  } else if ((e.key === 'Escape' || e.key === 'Backspace') && !e.ctrlKey && !e.metaKey) {
    router.push('/erp/quotations')
  }
}

onMounted(() => { fetchQuotation(); document.addEventListener('keydown', onKeydown) })
onUnmounted(() => document.removeEventListener('keydown', onKeydown))

async function fetchQuotation() {
  loading.value = true
  try {
    const { data } = await api.get(`/erp/quotations/${route.params.id}`)
    quotation.value = data.data.quotation
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
    const { data } = await api.patch(`/erp/quotations/${quotation.value.id}/status`, { status })
    quotation.value = data.data.quotation
  } catch (err) {
    statusError.value = err.response?.data?.message || 'Failed to update status'
  } finally {
    updatingStatus.value = false
  }
}

async function convertToOrder() {
  convertError.value = ''
  converting.value   = true
  try {
    const { data } = await api.post(`/erp/quotations/${quotation.value.id}/convert`)
    if (data.data?.orderId) {
      router.push(`/erp/orders/${data.data.orderId}`)
    } else {
      await fetchQuotation()
    }
  } catch (err) {
    convertError.value = err.response?.data?.message || 'Failed to convert'
  } finally {
    converting.value = false
  }
}

async function confirmDelete() {
  if (!confirm(`Delete quotation ${quotation.value.refNo}? This cannot be undone.`)) return
  try {
    await api.delete(`/erp/quotations/${quotation.value.id}`)
    router.push('/erp/quotations')
  } catch (err) {
    statusError.value = err.response?.data?.message || 'Delete failed'
  }
}

// Payment-terms labels come from master-data.
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
