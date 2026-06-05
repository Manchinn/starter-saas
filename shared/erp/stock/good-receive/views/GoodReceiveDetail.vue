<template>
  <AppLayout>
    <div class="space-y-5">

      <!-- Top action bar (hidden on print) -->
      <div class="flex items-start gap-3 print:hidden">
        <RouterLink to="/erp/good-receive"
          class="mt-0.5 p-2 text-[#9BA7B0] hover:text-[#1C2434] hover:bg-white
                 border border-transparent hover:border-[#E2E8F0] transition-all flex-shrink-0">
          <ArrowLeftIcon class="w-[18px] h-[18px]" />
        </RouterLink>
        <div class="flex-1 min-w-0">
          <div class="flex items-center gap-2.5 flex-wrap">
            <h1 class="text-xl font-bold text-[#1C2434]">
              {{ loading ? '…' : (gr?.refNo || t('erp.goodReceive.title')) }}
            </h1>
            <span v-if="gr && !loading"
              class="inline-flex items-center gap-1.5 px-2.5 py-0.5 text-[11px] font-semibold capitalize"
              :class="statusBadge(gr.status)">
              <span class="w-1.5 h-1.5" :class="statusDot(gr.status)"></span>
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
              class="inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-medium bg-indigo-50 text-indigo-700 hover:bg-indigo-100">
              <ShoppingCartIcon class="w-3 h-3" /> {{ gr.purchaseOrder.refNo }}
            </RouterLink>
            <RouterLink v-if="gr.linkedBill" :to="`/erp/purchasing/bills/${gr.linkedBill.id}`"
              class="inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-medium bg-blue-50 text-blue-700 hover:bg-blue-100">
              <DocumentTextIcon class="w-3 h-3" /> {{ gr.linkedBill.billNumber }}
            </RouterLink>
          </div>
        </div>
        <div v-if="gr && !loading" class="flex items-center gap-2 flex-shrink-0">
          <KeyboardShortcuts :shortcuts="shortcuts" width="w-56" />
          <button @click="onPrint" type="button"
            title="Print this document"
            class="inline-flex items-center gap-1.5 px-3 py-2 text-[12px] font-semibold
                   text-[#637381] bg-white border border-[#E2E8F0] hover:bg-[#F7F9FC] hover:text-[#1C2434] transition-colors">
            <PrinterIcon class="w-4 h-4" />
            {{ t('common.print') }}
          </button>
          <RouterLink v-if="gr.status === 'draft'" v-can="'erp.stock.edit'" :to="`/erp/good-receive/${gr.id}/edit`"
            class="inline-flex items-center gap-1.5 px-3 py-2 text-[12px] font-semibold
                   text-primary-600 bg-primary-50 hover:bg-primary-100 border border-primary-200 transition-colors">
            <PencilSquareIcon class="w-4 h-4" />
            {{ t('common.edit') }}
          </RouterLink>
          <button v-if="gr.status === 'draft'" v-can="'erp.stock.delete'" @click="deleteGR" type="button"
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
      <div v-else-if="!gr"
        class="flex items-start gap-3 bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3.5 print:hidden">
        <ExclamationCircleIcon class="w-5 h-5 flex-shrink-0 mt-0.5" />
        <span>{{ t('erp.goodReceive.notFound') }}
          <RouterLink to="/erp/good-receive" class="underline ml-1">{{ t('erp.common.backToList') }}</RouterLink>
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
          </div>
        </div>

        <!-- Document (receipt tax-invoice layout) -->
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
                <h2 class="text-[18px] font-bold text-[#1C2434] leading-tight uppercase">{{ t('erp.goodReceive.title') }}</h2>
              </div>
            </header>

            <!-- Supplier/Store + meta boxes -->
            <div class="mt-5 grid grid-cols-1 sm:grid-cols-2 border border-[#1C2434]">
              <div class="p-3 border-b sm:border-b-0 sm:border-r border-[#1C2434] text-[12px] space-y-1.5">
                <div class="grid grid-cols-[78px_1fr] gap-x-2">
                  <span class="text-[#637381]">{{ t('erp.goodReceive.supplier') }}</span>
                  <span class="font-semibold text-[#1C2434]">{{ gr.supplier || '—' }}</span>
                </div>
                <div class="grid grid-cols-[78px_1fr] gap-x-2">
                  <span class="text-[#637381]">{{ t('erp.common.store') }}</span>
                  <span class="font-semibold text-[#1C2434]">
                    {{ gr.store?.name || '—' }}
                    <span v-if="gr.store?.code" class="font-mono text-[11px] text-[#9BA7B0]">({{ gr.store.code }})</span>
                  </span>
                </div>
              </div>
              <div class="p-3 text-[12px] space-y-1.5">
                <div class="grid grid-cols-[124px_1fr] gap-x-2">
                  <span class="text-[#637381]">{{ t('erp.goodReceive.colRefNo') }}</span>
                  <span class="font-bold text-[#1C2434] tabular-nums">{{ gr.refNo }}</span>
                </div>
                <div class="grid grid-cols-[124px_1fr] gap-x-2">
                  <span class="text-[#637381]">{{ t('erp.common.date') }}</span>
                  <span class="font-medium text-[#1C2434] tabular-nums">{{ fmtDate(gr.date) || '—' }}</span>
                </div>
                <div class="grid grid-cols-[124px_1fr] gap-x-2">
                  <span class="text-[#637381]">{{ t('erp.goodReceive.docType') }}</span>
                  <span class="font-medium text-[#1C2434] capitalize">
                    {{ gr.docType === 'delivery' ? t('erp.goodReceive.delivery') : t('erp.goodReceive.invoice') }}
                  </span>
                </div>
                <div v-if="gr.docType === 'invoice' && gr.invoiceNo" class="grid grid-cols-[124px_1fr] gap-x-2">
                  <span class="text-[#637381]">{{ t('erp.goodReceive.invoiceNo') }}</span>
                  <span class="font-medium text-[#1C2434] font-mono">{{ gr.invoiceNo }}</span>
                </div>
                <div v-if="gr.docType === 'invoice' && gr.invoiceDate" class="grid grid-cols-[124px_1fr] gap-x-2">
                  <span class="text-[#637381]">{{ t('erp.goodReceive.invoiceDate') }}</span>
                  <span class="font-medium text-[#1C2434] tabular-nums">{{ fmtDate(gr.invoiceDate) || '—' }}</span>
                </div>
                <div v-if="gr.docType === 'delivery' && gr.deliveryNo" class="grid grid-cols-[124px_1fr] gap-x-2">
                  <span class="text-[#637381]">{{ t('erp.goodReceive.deliveryNo') }}</span>
                  <span class="font-medium text-[#1C2434] font-mono">{{ gr.deliveryNo }}</span>
                </div>
              </div>
            </div>

            <!-- Line items -->
            <table class="w-full mt-4 border-collapse text-[12px] table-fixed">
              <thead>
                <tr class="bg-[#FAFBFD] text-[10px] font-bold text-[#1C2434] uppercase tracking-wide">
                  <th class="border border-[#1C2434] px-1.5 py-2 text-right w-[28px]">#</th>
                  <th class="border border-[#1C2434] px-1.5 py-2 text-left w-[75px]">{{ t('erp.common.sku') }}</th>
                  <th class="border border-[#1C2434] px-1.5 py-2 text-left w-[216px]">{{ t('erp.common.product') }}</th>
                  <th class="border border-[#1C2434] px-1.5 py-2 text-right w-[46px]">{{ t('erp.common.qty') }}</th>
                  <th class="border border-[#1C2434] px-1.5 py-2 text-left w-[44px]">UOM</th>
                  <th class="border border-[#1C2434] px-1.5 py-2 text-right w-[44px]">{{ t('erp.goodReceive.freeQty') }}</th>
                  <th class="border border-[#1C2434] px-1.5 py-2 text-right w-[72px]">Cost/Unit</th>
                  <th class="border border-[#1C2434] px-1.5 py-2 text-right w-[41px]">{{ t('erp.goodReceive.discPct') }}</th>
                  <th class="border border-[#1C2434] px-1.5 py-2 text-right w-[84px]">{{ t('erp.goodReceive.netAmount') }}</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(item, idx) in (gr.items || [])" :key="item.id" class="align-top">
                  <td class="border-x border-b border-x-[#1C2434] border-b-[#E2E8F0] px-1.5 py-1.5 text-right tabular-nums text-[#9BA7B0]">{{ idx + 1 }}</td>
                  <td class="border-x border-b border-x-[#1C2434] border-b-[#E2E8F0] px-1.5 py-1.5 font-mono text-[11px] text-[#637381]">{{ item.product?.sku || '—' }}</td>
                  <td class="border-x border-b border-x-[#1C2434] border-b-[#E2E8F0] px-1.5 py-1.5">
                    <span class="text-[#1C2434]">{{ item.product?.name || '—' }}</span>
                    <p v-if="item.batchId || item.expiryDate" class="text-[10px] text-[#9BA7B0] mt-0.5">
                      <span v-if="item.batchId">Batch: <span class="font-mono">{{ item.batchId }}</span></span>
                      <span v-if="item.batchId && item.expiryDate"> · </span>
                      <span v-if="item.expiryDate">Exp: {{ fmtDate(item.expiryDate) }}</span>
                    </p>
                    <p v-if="item.comments" class="text-[11px] text-[#9BA7B0] mt-0.5 italic">{{ item.comments }}</p>
                  </td>
                  <td class="border-x border-b border-x-[#1C2434] border-b-[#E2E8F0] px-1.5 py-1.5 text-right tabular-nums text-[#374151]">{{ fmtQty(item.qty) }}</td>
                  <td class="border-x border-b border-x-[#1C2434] border-b-[#E2E8F0] px-1.5 py-1.5 text-[10px] text-[#637381]">{{ item.qtyUom?.abbreviation || item.qtyUom?.name || '—' }}</td>
                  <td class="border-x border-b border-x-[#1C2434] border-b-[#E2E8F0] px-1.5 py-1.5 text-right tabular-nums text-[#637381]">{{ Number(item.freeQty) > 0 ? fmtQty(item.freeQty) : '—' }}</td>
                  <td class="border-x border-b border-x-[#1C2434] border-b-[#E2E8F0] px-1.5 py-1.5 text-right tabular-nums text-[#374151]">{{ fmtMoney(item.cost) }}</td>
                  <td class="border-x border-b border-x-[#1C2434] border-b-[#E2E8F0] px-1.5 py-1.5 text-right tabular-nums text-[#637381]">{{ Number(item.discountPct) ? `${Number(item.discountPct)}%` : '—' }}</td>
                  <td class="border-x border-b border-x-[#1C2434] border-b-[#E2E8F0] px-1.5 py-1.5 text-right tabular-nums font-medium text-[#1C2434]">{{ fmtMoney(item.netAmount) }}</td>
                </tr>
                <!-- filler rows keep the goods area tall like a printed form -->
                <tr v-for="n in fillerRows" :key="'filler-' + n" class="h-[26px]">
                  <td class="border-x border-[#1C2434]"></td>
                  <td class="border-x border-[#1C2434]"></td>
                  <td class="border-x border-[#1C2434]"></td>
                  <td class="border-x border-[#1C2434]"></td>
                  <td class="border-x border-[#1C2434]"></td>
                  <td class="border-x border-[#1C2434]"></td>
                  <td class="border-x border-[#1C2434]"></td>
                  <td class="border-x border-[#1C2434]"></td>
                  <td class="border-x border-[#1C2434]"></td>
                </tr>
              </tbody>
            </table>

            <!-- Notes + totals -->
            <div class="flex items-stretch border-x border-t border-b border-[#1C2434]">
              <div class="flex-1 min-w-0 flex flex-col">
                <div class="p-3 text-[11px] text-[#374151] space-y-1">
                  <div v-if="gr.notes" class="grid grid-cols-[64px_1fr] gap-x-2">
                    <span class="text-[#9BA7B0]">{{ t('erp.common.notes') }}</span>
                    <span class="whitespace-pre-line leading-snug">{{ gr.notes }}</span>
                  </div>
                  <p v-else class="text-[#9BA7B0] italic">—</p>
                </div>
              </div>
              <div class="w-[241px] flex-shrink-0 border-l border-[#1C2434] text-[12px]">
                <div class="flex items-center justify-between px-3 pt-[7px] pb-[9px] border-b border-[#1C2434]">
                  <span class="text-[#637381]">Gross</span>
                  <span class="tabular-nums text-[#1C2434]">{{ fmtMoney(totalGross) }}</span>
                </div>
                <div class="flex items-center justify-between px-3 py-1.5 border-b border-[#1C2434]">
                  <span class="text-[#637381]">Net</span>
                  <span class="tabular-nums text-[#1C2434]">{{ fmtMoney(totalNet) }}</span>
                </div>
                <div v-if="gr.docType === 'invoice' && Number(gr.invoiceDiscount) > 0"
                  class="flex items-center justify-between px-3 py-1.5 border-b border-[#1C2434]">
                  <span class="text-[#637381]">{{ t('erp.goodReceive.invoiceDiscount') }}</span>
                  <span class="tabular-nums text-red-600">−{{ fmtMoney(gr.invoiceDiscount) }}</span>
                </div>
                <div class="flex items-center justify-between px-3 py-2 bg-[#FAFBFD]">
                  <span class="font-bold text-[#1C2434]">{{ t('erp.goodReceive.netAmount') }}</span>
                  <span class="font-extrabold text-[#1C2434] tabular-nums">
                    {{ fmtMoney(gr.docType === 'invoice' ? gr.invoiceNetAmount : totalNet) }}
                  </span>
                </div>
              </div>
            </div>

            <!-- Signatures -->
            <div class="grid grid-cols-2 gap-8 mt-12 px-2">
              <div v-for="(sig, i) in signatures" :key="'sig' + i" class="text-center">
                <div class="border-b border-dotted border-[#1C2434] h-8"></div>
                <p class="text-[11px] text-[#637381] mt-1.5">{{ sig }}</p>
                <p class="text-[10px] text-[#9BA7B0] mt-2">{{ t('erp.common.date') }} ......./......./.......</p>
              </div>
            </div>
          </div>
        </article>

        <!-- Status transitions -->
        <div v-can="'erp.stock.edit'" v-if="gr.status === 'draft'"
          class="bg-white border border-[#E2E8F0] shadow-card px-5 py-4 print:hidden
                 flex items-center justify-between flex-wrap gap-3">
          <div>
            <p class="text-[11px] font-semibold text-[#9BA7B0] uppercase tracking-wider">Next Action</p>
            <p class="text-[13px] text-[#637381] mt-0.5">Confirm to post stock movements and lock this receive.</p>
          </div>
          <div class="flex items-center gap-2.5">
            <button @click="confirmGR" :disabled="confirming"
              class="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold
                     bg-green-600 text-white hover:bg-green-700 transition-colors disabled:opacity-50">
              <ArrowPathIcon v-if="confirming" class="w-4 h-4 animate-spin" />
              <CheckIcon v-else class="w-4 h-4" />
              {{ confirming ? t('erp.common.confirming') : t('erp.goodReceive.confirmStock') }}
            </button>
          </div>
        </div>

        <!-- Convert to vendor bill (confirmed only) -->
        <div v-if="gr.status === 'confirmed'"
          class="bg-white border border-[#E2E8F0] shadow-card px-5 py-4 print:hidden
                 flex items-center flex-wrap gap-3">
          <p class="text-[11px] font-semibold text-[#9BA7B0] uppercase tracking-wider mr-2">Convert</p>
          <button v-can="'erp.bills.edit'" @click="convertToBill"
            :disabled="converting || !!gr.linkedBill"
            :title="gr.linkedBill ? `Already linked to ${gr.linkedBill.billNumber}` : ''"
            class="flex items-center gap-1.5 px-4 py-2 text-sm font-medium bg-primary-50 text-primary-600 border border-primary-200
                   hover:bg-primary-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
            <DocumentTextIcon class="w-4 h-4" />
            {{ converting ? t('common.loading') : t('erp.goodReceive.createBill') }}
          </button>
          <RouterLink v-if="gr.linkedBill" :to="`/erp/purchasing/bills/${gr.linkedBill.id}`"
            class="inline-flex items-center px-2 py-0.5 text-xs font-medium bg-blue-50 text-blue-700 hover:bg-blue-100">
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
import KeyboardShortcuts from '@/components/KeyboardShortcuts.vue'
import { useDetailShortcuts } from '@/composables/useShortcuts'
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

const { shortcuts } = useDetailShortcuts({
  enabled:   () => !loading.value && !!gr.value,
  canEdit:   () => gr.value?.status === 'draft',
  canRemove: () => gr.value?.status === 'draft',
  edit:   () => router.push(`/erp/good-receive/${gr.value.id}/edit`),
  remove: () => deleteGR(),
  print:  onPrint,
  back:   () => router.push('/erp/good-receive'),
})

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

// ── Document helpers (mirror Invoice/Receipt tax-invoice layout) ──
const fillerRows = computed(() => Math.max(0, 8 - (gr.value?.items?.length || 0)))
const signatures = ['Received By', 'Approved By']

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
