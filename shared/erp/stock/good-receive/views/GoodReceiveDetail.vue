<template>
  <AppLayout>
    <div class="space-y-5">

      <!-- Top action bar (hidden on print) -->
      <div class="flex items-start gap-3 print:hidden">
        <RouterLink to="/erp/good-receive"
          class="mt-0.5 p-2 rounded-xl text-[#9BA7B0] hover:text-[#1C2434] hover:bg-white
                 border border-transparent hover:border-[#E2E8F0] transition-all flex-shrink-0">
          <ArrowLeftIcon class="w-[18px] h-[18px]" />
        </RouterLink>
        <div class="flex-1 min-w-0">
          <div class="flex items-center gap-2.5 flex-wrap">
            <h1 class="text-xl font-bold text-[#1C2434]">
              {{ loading ? '…' : (gr?.refNo || t('erp.goodReceive.title')) }}
            </h1>
            <span v-if="gr && !loading"
              class="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold capitalize"
              :class="statusBadge(gr.status)">
              <span class="w-1.5 h-1.5 rounded-full" :class="statusDot(gr.status)"></span>
              {{ gr.status }}
            </span>
          </div>
          <nav class="flex items-center gap-1.5 mt-1">
            <RouterLink to="/erp/good-receive" class="text-[12px] text-[#9BA7B0] hover:text-[#637381] transition-colors">
              {{ t('erp.goodReceive.title') }}
            </RouterLink>
            <ChevronRightIcon class="w-3 h-3 text-[#CBD5E1]" />
            <span class="text-[12px] text-[#637381]">{{ gr?.refNo || '…' }}</span>
          </nav>
          <!-- Source-doc badges (PO upstream / VendorBill downstream) -->
          <div v-if="gr && !loading && (gr.purchaseOrder || gr.linkedBill)" class="flex items-center gap-1.5 mt-2 flex-wrap">
            <span class="text-[11px] text-[#9BA7B0] font-medium">{{ t('erp.common.source') }}:</span>
            <RouterLink v-if="gr.purchaseOrder" :to="`/erp/purchasing/purchase-orders/${gr.purchaseOrder.id}`"
              class="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium bg-indigo-50 text-indigo-700 hover:bg-indigo-100">
              <ShoppingCartIcon class="w-3 h-3" /> {{ gr.purchaseOrder.refNo }}
            </RouterLink>
            <RouterLink v-if="gr.linkedBill" :to="`/erp/purchasing/bills/${gr.linkedBill.id}`"
              class="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium bg-blue-50 text-blue-700 hover:bg-blue-100">
              <DocumentTextIcon class="w-3 h-3" /> {{ gr.linkedBill.billNumber }}
            </RouterLink>
          </div>
        </div>
        <div v-if="gr && !loading" class="flex items-center gap-2 flex-shrink-0">
          <button @click="onPrint" type="button"
            title="Print this document"
            class="inline-flex items-center gap-1.5 px-3 py-2 text-[12px] font-semibold rounded-xl
                   text-[#637381] bg-white border border-[#E2E8F0] hover:bg-[#F7F9FC] hover:text-[#1C2434] transition-colors">
            <PrinterIcon class="w-4 h-4" />
            {{ t('common.print') }}
          </button>
          <RouterLink v-if="gr.status === 'draft'" v-can="'erp.stock.edit'" :to="`/erp/good-receive/${gr.id}/edit`"
            class="inline-flex items-center gap-1.5 px-3 py-2 text-[12px] font-semibold rounded-xl
                   text-primary-600 bg-primary-50 hover:bg-primary-100 border border-primary-200 transition-colors">
            <PencilSquareIcon class="w-4 h-4" />
            {{ t('common.edit') }}
          </RouterLink>
          <button v-if="gr.status === 'draft'" v-can="'erp.stock.delete'" @click="deleteGR" type="button"
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
      <div v-else-if="!gr"
        class="flex items-start gap-3 bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3.5 rounded-xl print:hidden">
        <ExclamationCircleIcon class="w-5 h-5 flex-shrink-0 mt-0.5" />
        <span>{{ t('erp.goodReceive.notFound') }}
          <RouterLink to="/erp/good-receive" class="underline ml-1">{{ t('erp.common.backToList') }}</RouterLink>
        </span>
      </div>

      <template v-else>
        <!-- Workflow strip -->
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
          </div>
        </div>

        <!-- Document -->
        <article class="relative mx-auto bg-white border border-[#E2E8F0] shadow-card max-w-[960px] w-full
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
                  <p v-if="companyPhone">Tel: {{ companyPhone }}</p>
                  <p v-if="companyEmail">{{ companyEmail }}</p>
                  <p v-if="companyWebsite">{{ companyWebsite }}</p>
                  <p v-if="companyTaxId" class="tabular-nums">
                    <span class="text-[#9BA7B0]">Tax ID:</span> {{ companyTaxId }}
                  </p>
                </div>
              </div>
            </div>
            <div class="text-right flex-shrink-0">
              <h2 class="text-[26px] font-extrabold tracking-[0.18em] text-[#1C2434] uppercase">
                {{ t('erp.goodReceive.title') }}
              </h2>
              <dl class="mt-3 text-[12px] grid grid-cols-[auto_auto] gap-x-3 gap-y-1 justify-end">
                <dt class="text-[#9BA7B0] uppercase tracking-wider text-[10px] font-semibold pt-0.5 text-right">#</dt>
                <dd class="font-bold text-[#1C2434] tabular-nums text-right">{{ gr.refNo }}</dd>

                <dt class="text-[#9BA7B0] uppercase tracking-wider text-[10px] font-semibold pt-0.5 text-right">
                  {{ t('erp.common.date') }}
                </dt>
                <dd class="font-semibold text-[#1C2434] tabular-nums text-right">{{ fmtDate(gr.date) || '—' }}</dd>

                <template v-if="gr.docType === 'invoice' && gr.invoiceNo">
                  <dt class="text-[#9BA7B0] uppercase tracking-wider text-[10px] font-semibold pt-0.5 text-right">
                    {{ t('erp.goodReceive.invoiceNo') }}
                  </dt>
                  <dd class="font-semibold text-[#1C2434] text-right font-mono">{{ gr.invoiceNo }}</dd>
                </template>

                <template v-if="gr.docType === 'delivery' && gr.deliveryNo">
                  <dt class="text-[#9BA7B0] uppercase tracking-wider text-[10px] font-semibold pt-0.5 text-right">
                    {{ t('erp.goodReceive.deliveryNo') }}
                  </dt>
                  <dd class="font-semibold text-[#1C2434] text-right font-mono">{{ gr.deliveryNo }}</dd>
                </template>
              </dl>
            </div>
          </header>

          <!-- Received From / Store -->
          <section class="px-10 py-6 grid grid-cols-1 sm:grid-cols-2 gap-x-10 gap-y-6 border-b border-dashed border-[#E2E8F0]">
            <div>
              <p class="text-[10px] font-bold text-[#9BA7B0] uppercase tracking-[0.15em] mb-2">
                {{ t('erp.goodReceive.supplier') }}
              </p>
              <p class="text-[14px] font-bold text-[#1C2434]">{{ gr.supplier || '—' }}</p>
            </div>
            <div>
              <p class="text-[10px] font-bold text-[#9BA7B0] uppercase tracking-[0.15em] mb-2">
                {{ t('erp.common.store') }}
              </p>
              <p class="text-[14px] font-bold text-[#1C2434]">{{ gr.store?.name || '—' }}</p>
              <p v-if="gr.store?.code" class="text-[11px] font-mono text-[#9BA7B0] mt-0.5">{{ gr.store.code }}</p>
            </div>
          </section>

          <!-- Metadata strip -->
          <section class="px-10 py-4 grid grid-cols-2 sm:grid-cols-4 gap-x-6 gap-y-3 border-b border-dashed border-[#E2E8F0] bg-[#FAFBFD]">
            <div>
              <p class="text-[9px] font-bold text-[#9BA7B0] uppercase tracking-[0.15em]">{{ t('erp.common.date') }}</p>
              <p class="text-[12px] font-semibold text-[#1C2434] tabular-nums mt-0.5">{{ fmtDate(gr.date) || '—' }}</p>
            </div>
            <div>
              <p class="text-[9px] font-bold text-[#9BA7B0] uppercase tracking-[0.15em]">{{ t('erp.goodReceive.docType') }}</p>
              <p class="mt-0.5">
                <span class="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold capitalize"
                  :class="gr.docType === 'delivery' ? 'bg-purple-50 text-purple-700' : 'bg-blue-50 text-blue-700'">
                  {{ gr.docType === 'delivery' ? t('erp.goodReceive.delivery') : t('erp.goodReceive.invoice') }}
                </span>
              </p>
            </div>
            <div v-if="gr.docType === 'invoice'">
              <p class="text-[9px] font-bold text-[#9BA7B0] uppercase tracking-[0.15em]">{{ t('erp.goodReceive.invoiceDate') }}</p>
              <p class="text-[12px] font-semibold text-[#1C2434] tabular-nums mt-0.5">{{ fmtDate(gr.invoiceDate) || '—' }}</p>
            </div>
            <div v-else>
              <p class="text-[9px] font-bold text-[#9BA7B0] uppercase tracking-[0.15em]">{{ t('erp.goodReceive.deliveryNo') }}</p>
              <p class="text-[12px] font-semibold text-[#1C2434] font-mono mt-0.5">{{ gr.deliveryNo || '—' }}</p>
            </div>
            <div>
              <p class="text-[9px] font-bold text-[#9BA7B0] uppercase tracking-[0.15em]">{{ t('erp.common.status') }}</p>
              <p class="mt-0.5">
                <span class="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold capitalize"
                  :class="statusBadge(gr.status)">
                  {{ gr.status }}
                </span>
              </p>
            </div>
          </section>

          <!-- Line items -->
          <section class="px-10 pt-6 pb-2">
            <table class="w-full text-[12px]">
              <thead>
                <tr class="border-b-2 border-[#1C2434] text-[10px] font-bold text-[#1C2434] uppercase tracking-wider">
                  <th class="py-2.5 text-left w-8">#</th>
                  <th class="py-2.5 text-left w-24">{{ t('erp.common.sku') }}</th>
                  <th class="py-2.5 text-left">{{ t('erp.common.product') }}</th>
                  <th class="py-2.5 text-right w-16">{{ t('erp.common.qty') }}</th>
                  <th class="py-2.5 text-left w-16">UOM</th>
                  <th class="py-2.5 text-right w-20">{{ t('erp.goodReceive.freeQty') }}</th>
                  <th class="py-2.5 text-right w-24">Cost/Unit</th>
                  <th class="py-2.5 text-right w-16">{{ t('erp.goodReceive.discPct') }}</th>
                  <th class="py-2.5 text-right w-28">{{ t('erp.goodReceive.netAmount') }}</th>
                </tr>
              </thead>
              <tbody>
                <template v-for="(item, idx) in (gr.items || [])" :key="item.id">
                  <tr class="border-b border-[#F1F5F9]">
                    <td class="py-2.5 align-top text-[#9BA7B0] tabular-nums">{{ idx + 1 }}</td>
                    <td class="py-2.5 align-top text-[#637381] font-mono text-[11px]">{{ item.product?.sku || '—' }}</td>
                    <td class="py-2.5 align-top">
                      <span class="font-semibold text-[#1C2434]">{{ item.product?.name || '—' }}</span>
                      <p v-if="item.batchId || item.expiryDate" class="text-[10px] text-[#9BA7B0] mt-0.5">
                        <span v-if="item.batchId">Batch: <span class="font-mono">{{ item.batchId }}</span></span>
                        <span v-if="item.batchId && item.expiryDate"> · </span>
                        <span v-if="item.expiryDate">Exp: {{ fmtDate(item.expiryDate) }}</span>
                      </p>
                      <p v-if="item.comments" class="text-[11px] text-[#9BA7B0] mt-0.5 italic">{{ item.comments }}</p>
                    </td>
                    <td class="py-2.5 align-top text-right text-[#374151] tabular-nums">{{ fmtQty(item.qty) }}</td>
                    <td class="py-2.5 align-top text-[10px] text-[#637381]">{{ item.qtyUom?.abbreviation || item.qtyUom?.name || '—' }}</td>
                    <td class="py-2.5 align-top text-right text-[#637381] tabular-nums">
                      {{ Number(item.freeQty) > 0 ? fmtQty(item.freeQty) : '—' }}
                    </td>
                    <td class="py-2.5 align-top text-right text-[#374151] tabular-nums">{{ fmtMoney(item.cost) }}</td>
                    <td class="py-2.5 align-top text-right text-[#637381] tabular-nums">
                      {{ Number(item.discountPct) ? `${Number(item.discountPct)}%` : '—' }}
                    </td>
                    <td class="py-2.5 align-top text-right font-semibold text-[#1C2434] tabular-nums">
                      {{ fmtMoney(item.netAmount) }}
                    </td>
                  </tr>
                </template>
                <tr v-if="!gr.items?.length">
                  <td colspan="9" class="py-6 text-center text-[12px] text-[#9BA7B0] italic">
                    {{ t('erp.common.noItems') }}
                  </td>
                </tr>
              </tbody>
            </table>
          </section>

          <!-- Totals -->
          <section class="px-10 pb-6 flex justify-end">
            <dl class="w-full sm:w-80 text-[12px] space-y-1.5">
              <div class="flex items-center justify-between">
                <dt class="text-[#637381]">Gross</dt>
                <dd class="font-semibold text-[#1C2434] tabular-nums">{{ fmtMoney(totalGross) }}</dd>
              </div>
              <div class="flex items-center justify-between">
                <dt class="text-[#637381]">Net</dt>
                <dd class="font-semibold text-[#1C2434] tabular-nums">{{ fmtMoney(totalNet) }}</dd>
              </div>
              <div v-if="gr.docType === 'invoice' && Number(gr.invoiceDiscount) > 0" class="flex items-center justify-between">
                <dt class="text-[#637381]">{{ t('erp.goodReceive.invoiceDiscount') }}</dt>
                <dd class="font-semibold text-red-600 tabular-nums">−{{ fmtMoney(gr.invoiceDiscount) }}</dd>
              </div>
              <div class="flex items-center justify-between pt-2 mt-1 border-t-2 border-[#1C2434]">
                <dt class="text-[11px] font-bold text-[#1C2434] uppercase tracking-wider">{{ t('erp.goodReceive.netAmount') }}</dt>
                <dd class="text-[16px] font-extrabold text-[#1C2434] tabular-nums">
                  {{ fmtMoney(gr.docType === 'invoice' ? gr.invoiceNetAmount : totalNet) }}
                </dd>
              </div>
            </dl>
          </section>

          <!-- Notes -->
          <section v-if="gr.notes" class="px-10 pt-2 pb-6 border-t border-dashed border-[#E2E8F0]">
            <p class="text-[10px] font-bold text-[#9BA7B0] uppercase tracking-[0.15em] mb-1.5">
              {{ t('erp.common.notes') }}
            </p>
            <p class="text-[12px] text-[#374151] whitespace-pre-line leading-relaxed">{{ gr.notes }}</p>
          </section>

          <footer class="px-10 pt-6 pb-8 border-t border-dashed border-[#E2E8F0]">
            <div class="grid grid-cols-2 gap-10">
              <div>
                <div class="h-10 border-b border-[#1C2434]"></div>
                <p class="text-[10px] text-[#637381] mt-1.5 text-center uppercase tracking-wider">
                  Received By
                </p>
              </div>
              <div>
                <div class="h-10 border-b border-[#1C2434]"></div>
                <p class="text-[10px] text-[#637381] mt-1.5 text-center uppercase tracking-wider">
                  Approved By
                </p>
              </div>
            </div>
          </footer>
        </article>

        <!-- Status transitions -->
        <div v-can="'erp.stock.edit'" v-if="gr.status === 'draft'"
          class="bg-white rounded-2xl border border-[#E2E8F0] shadow-card px-5 py-4 print:hidden
                 flex items-center justify-between flex-wrap gap-3">
          <div>
            <p class="text-[11px] font-semibold text-[#9BA7B0] uppercase tracking-wider">Next Action</p>
            <p class="text-[13px] text-[#637381] mt-0.5">Confirm to post stock movements and lock this receive.</p>
          </div>
          <div class="flex items-center gap-2.5">
            <button @click="confirmGR" :disabled="confirming"
              class="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold rounded-xl
                     bg-green-600 text-white hover:bg-green-700 transition-colors disabled:opacity-50">
              <ArrowPathIcon v-if="confirming" class="w-4 h-4 animate-spin" />
              <CheckIcon v-else class="w-4 h-4" />
              {{ confirming ? t('erp.common.confirming') : t('erp.goodReceive.confirmStock') }}
            </button>
          </div>
        </div>

        <!-- Convert to vendor bill (confirmed only) -->
        <div v-if="gr.status === 'confirmed'"
          class="bg-white rounded-2xl border border-[#E2E8F0] shadow-card px-5 py-4 print:hidden
                 flex items-center flex-wrap gap-3">
          <p class="text-[11px] font-semibold text-[#9BA7B0] uppercase tracking-wider mr-2">Convert</p>
          <button v-can="'erp.bills.edit'" @click="convertToBill"
            :disabled="converting || !!gr.linkedBill"
            :title="gr.linkedBill ? `Already linked to ${gr.linkedBill.billNumber}` : ''"
            class="flex items-center gap-1.5 px-4 py-2 text-sm font-medium bg-primary-50 text-primary-600 border border-primary-200
                   rounded-xl hover:bg-primary-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
            <DocumentTextIcon class="w-4 h-4" />
            {{ converting ? t('common.loading') : t('erp.goodReceive.createBill') }}
          </button>
          <RouterLink v-if="gr.linkedBill" :to="`/erp/purchasing/bills/${gr.linkedBill.id}`"
            class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700 hover:bg-blue-100">
            → {{ gr.linkedBill.billNumber }}
          </RouterLink>
        </div>

        <p v-if="error" class="text-xs text-red-600 print:hidden">{{ error }}</p>

        <AttachmentsPanel v-if="gr" ref-type="GoodReceive" :ref-id="gr.id" class="print:hidden" />
        <ActivityTimeline v-if="gr" ref-type="GoodReceive" :ref-id="gr.id" class="print:hidden" />
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
  CheckIcon, TrashIcon, PencilSquareIcon,
  ArrowPathIcon, ExclamationCircleIcon, PrinterIcon,
  DocumentTextIcon, ShoppingCartIcon,
} from '@heroicons/vue/24/outline'
import AppLayout from '@/layouts/AppLayout.vue'
import AttachmentsPanel from '@/components/AttachmentsPanel.vue'
import ActivityTimeline from '@/components/ActivityTimeline.vue'
import api from '@/api'
import { fmtDate, fmtMoney } from '@/utils/fmt'
import { useAuthStore } from '@/stores/auth'

const { t } = useI18n()
const route   = useRoute()
const router  = useRouter()
const auth    = useAuthStore()

const gr         = ref(null)
const loading    = ref(true)
const confirming = ref(false)
const converting = ref(false)
const error      = ref('')

// Company profile from auth.user.organization, mirrors SO/Invoice detail.
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

function onPrint() { window.print() }

// ── Workflow ──────────────────────────────────────────────
const FLOW_STEPS = computed(() => [
  { key: 'draft',     label: t('erp.common.draft') },
  { key: 'confirmed', label: t('erp.common.confirmed') },
])
const COMPLETED_BEFORE = {
  draft:     [],
  confirmed: ['draft'],
}
function stepState(key) {
  const cur = gr.value?.status
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
  draft:     'bg-amber-50 text-amber-700',
  confirmed: 'bg-green-50 text-green-700',
}
const STATUS_DOT = {
  draft:     'bg-amber-400',
  confirmed: 'bg-green-500',
}
function statusBadge(s) { return STATUS_BADGE[s] || STATUS_BADGE.draft }
function statusDot(s)   { return STATUS_DOT[s]   || STATUS_DOT.draft }

const stampLabel = computed(() => {
  const s = gr.value?.status
  if (s === 'draft')     return 'Draft'
  if (s === 'confirmed') return 'Received'
  return ''
})
const stampClass = computed(() => {
  if (gr.value?.status === 'confirmed') return 'text-green-600 border-green-600'
  return 'text-[#1C2434] border-[#1C2434]'
})

function fmtQty(val) {
  const n = parseFloat(val) || 0
  return n % 1 === 0 ? String(n) : n.toFixed(4).replace(/\.?0+$/, '')
}

async function load() {
  try {
    const { data } = await api.get(`/erp/good-receive/${route.params.id}`)
    gr.value = data.data.goodReceive
  } catch {
    gr.value = null
  } finally {
    loading.value = false
  }
}

onMounted(load)

const totalGross = computed(() =>
  (gr.value?.items || []).reduce((s, i) => s + Number(i.qty) * Number(i.cost), 0)
)
const totalNet = computed(() =>
  (gr.value?.items || []).reduce((s, i) => s + Number(i.netAmount || 0), 0)
)

async function confirmGR() {
  if (!confirm('Confirm this Good Receive? Stock will be updated and this cannot be undone.')) return
  confirming.value = true
  error.value = ''
  try {
    const { data } = await api.post(`/erp/good-receive/${route.params.id}/confirm`)
    gr.value = data.data.goodReceive
  } catch (err) {
    error.value = err.response?.data?.message || 'Failed to confirm'
  } finally {
    confirming.value = false
  }
}

async function deleteGR() {
  if (!confirm('Delete this draft? This cannot be undone.')) return
  try {
    await api.delete(`/erp/good-receive/${route.params.id}`)
    router.push('/erp/good-receive')
  } catch (err) {
    error.value = err.response?.data?.message || 'Delete failed'
  }
}

async function convertToBill() {
  converting.value = true
  error.value = ''
  try {
    const { data } = await api.post(`/erp/good-receive/${route.params.id}/create-bill`)
    router.push(`/erp/purchasing/bills/${data.data.id}`)
  } catch (err) {
    error.value = err.response?.data?.message || 'Failed to create vendor bill'
  } finally { converting.value = false }
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
