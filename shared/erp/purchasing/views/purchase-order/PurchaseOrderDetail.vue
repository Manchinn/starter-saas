<template>
  <AppLayout>
    <div class="space-y-5">

      <!-- Top action bar (hidden on print) -->
      <div class="flex items-start gap-3 print:hidden">
        <RouterLink to="/erp/purchasing/orders"
          class="mt-0.5 p-2 text-[#9BA7B0] hover:text-[#1C2434] hover:bg-white
                 border border-transparent hover:border-[#E2E8F0] transition-all flex-shrink-0">
          <ArrowLeftIcon class="w-[18px] h-[18px]" />
        </RouterLink>
        <div class="flex-1 min-w-0">
          <div class="flex items-center gap-2.5 flex-wrap">
            <h1 class="text-xl font-bold text-[#1C2434]">
              {{ loading ? '…' : (po?.refNo || t('erp.po.title')) }}
            </h1>
            <span v-if="po && !loading"
              class="inline-flex items-center gap-1.5 px-2.5 py-0.5 text-[11px] font-semibold capitalize"
              :class="statusBadge(po.status)">
              <span class="w-1.5 h-1.5" :class="statusDot(po.status)"></span>
              {{ t(`erp.po.status${capitalize(po.status)}`) }}
            </span>
            <DocCurrencyBadge v-if="po" :currency="po.currency" :exchange-rate="po.exchangeRate" :total="grandTotal" />
          </div>
          <nav class="flex items-center gap-1.5 mt-1">
            <RouterLink to="/erp/purchasing/orders" class="text-[12px] text-[#9BA7B0] hover:text-[#637381] transition-colors">
              {{ t('erp.po.title') }}
            </RouterLink>
            <ChevronRightIcon class="w-3 h-3 text-[#CBD5E1]" />
            <span class="text-[12px] text-[#637381]">{{ po?.refNo || '…' }}</span>
          </nav>
        </div>
        <div v-if="po && !loading" class="flex items-center gap-2 flex-shrink-0">
          <button @click="onPrint" type="button"
            :title="t('erp.po.printDocument')"
            class="inline-flex items-center gap-1.5 px-3 py-2 text-[12px] font-semibold
                   text-[#637381] bg-white border border-[#E2E8F0] hover:bg-[#F7F9FC] hover:text-[#1C2434] transition-colors">
            <PrinterIcon class="w-4 h-4" />
            {{ t('common.print') }}
          </button>
          <RouterLink v-if="po.status === 'draft'" v-can="'erp.purchasing.edit'" :to="`/erp/purchasing/orders/${po.id}/edit`"
            class="inline-flex items-center gap-1.5 px-3 py-2 text-[12px] font-semibold
                   text-primary-600 bg-primary-50 hover:bg-primary-100 border border-primary-200 transition-colors">
            <PencilSquareIcon class="w-4 h-4" />
            {{ t('common.edit') }}
          </RouterLink>
          <button v-if="po.status === 'draft'" v-can="'erp.purchasing.delete'" @click="confirmDelete" type="button"
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
        <span>{{ t('erp.po.notFound') }}
          <RouterLink to="/erp/purchasing/orders" class="underline ml-1">{{ t('erp.common.backToList') }}</RouterLink>
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
              <span class="text-[12px] font-semibold">{{ t('erp.po.statusCancelled') }}</span>
            </span>
          </div>
        </div>

        <!-- Document -->
        <article class="relative mx-auto bg-white border border-[#E2E8F0] shadow-card max-w-[960px] w-full
                        print:border-0 print:shadow-none print:max-w-none print:mx-0 print:
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
                {{ t('erp.po.title') }}
              </h2>
              <dl class="mt-3 text-[12px] grid grid-cols-[auto_auto] gap-x-3 gap-y-1 justify-end">
                <dt class="text-[#9BA7B0] uppercase tracking-wider text-[10px] font-semibold pt-0.5 text-right">#</dt>
                <dd class="font-bold text-[#1C2434] tabular-nums text-right">{{ po.refNo }}</dd>

                <dt class="text-[#9BA7B0] uppercase tracking-wider text-[10px] font-semibold pt-0.5 text-right">
                  {{ t('erp.po.date') }}
                </dt>
                <dd class="font-semibold text-[#1C2434] tabular-nums text-right">{{ fmtDate(po.date) || '—' }}</dd>

                <template v-if="po.requisition">
                  <dt class="text-[#9BA7B0] uppercase tracking-wider text-[10px] font-semibold pt-0.5 text-right">
                    PR
                  </dt>
                  <dd class="font-semibold text-[#1C2434] text-right">
                    <RouterLink :to="`/erp/purchasing/requisitions/${po.requisition.id}`"
                      class="text-primary-600 hover:underline">{{ po.requisition.refNo }}</RouterLink>
                  </dd>
                </template>
              </dl>
            </div>
          </header>

          <!-- Vendor / Delivery -->
          <section class="px-10 py-6 grid grid-cols-1 sm:grid-cols-2 gap-x-10 gap-y-6 border-b border-dashed border-[#E2E8F0]">
            <div>
              <p class="text-[10px] font-bold text-[#9BA7B0] uppercase tracking-[0.15em] mb-2">
                {{ t('erp.po.vendor') }}
              </p>
              <p class="text-[14px] font-bold text-[#1C2434]">{{ po.vendor?.name || '—' }}</p>
              <p v-if="po.vendor?.code" class="text-[11px] font-mono text-[#9BA7B0] mt-0.5">{{ po.vendor.code }}</p>
            </div>
            <div>
              <p class="text-[10px] font-bold text-[#9BA7B0] uppercase tracking-[0.15em] mb-2">
                {{ t('erp.po.deliveryDate') }}
              </p>
              <p class="text-[14px] font-bold text-[#1C2434] tabular-nums">{{ fmtDate(po.deliveryDate) || '—' }}</p>
            </div>
          </section>

          <!-- Metadata strip -->
          <section class="px-10 py-4 grid grid-cols-2 sm:grid-cols-4 gap-x-6 gap-y-3 border-b border-dashed border-[#E2E8F0] bg-[#FAFBFD]">
            <div>
              <p class="text-[9px] font-bold text-[#9BA7B0] uppercase tracking-[0.15em]">{{ t('erp.po.date') }}</p>
              <p class="text-[12px] font-semibold text-[#1C2434] tabular-nums mt-0.5">{{ fmtDate(po.date) || '—' }}</p>
            </div>
            <div>
              <p class="text-[9px] font-bold text-[#9BA7B0] uppercase tracking-[0.15em]">{{ t('erp.po.deliveryDate') }}</p>
              <p class="text-[12px] font-semibold text-[#1C2434] tabular-nums mt-0.5">{{ fmtDate(po.deliveryDate) || '—' }}</p>
            </div>
            <div>
              <p class="text-[9px] font-bold text-[#9BA7B0] uppercase tracking-[0.15em]">{{ t('erp.common.status') }}</p>
              <p class="mt-0.5">
                <span class="inline-flex items-center px-2 py-0.5 text-[11px] font-semibold capitalize"
                  :class="statusBadge(po.status)">
                  {{ t(`erp.po.status${capitalize(po.status)}`) }}
                </span>
              </p>
            </div>
            <div>
              <p class="text-[9px] font-bold text-[#9BA7B0] uppercase tracking-[0.15em]">{{ t('erp.common.currency') }}</p>
              <p class="text-[12px] font-semibold text-[#1C2434] tabular-nums mt-0.5">{{ po.currency || '—' }}</p>
            </div>
          </section>

          <!-- Line items -->
          <section class="px-10 pt-6 pb-2">
            <table class="w-full text-[12px]">
              <thead>
                <tr class="border-b-2 border-[#1C2434] text-[10px] font-bold text-[#1C2434] uppercase tracking-wider">
                  <th class="py-2.5 text-left w-8">#</th>
                  <th class="py-2.5 text-left w-24">{{ t('erp.po.colCode') }}</th>
                  <th class="py-2.5 text-left">{{ t('erp.po.colItem') }}</th>
                  <th class="py-2.5 text-left">{{ t('erp.po.colDescription') }}</th>
                  <th class="py-2.5 text-right w-16">{{ t('erp.po.colQty') }}</th>
                  <th class="py-2.5 text-right w-24">{{ t('erp.po.colUnitPrice') }}</th>
                  <th class="py-2.5 text-right w-28">{{ t('erp.po.colSubtotal') }}</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(item, idx) in (po.items || [])" :key="item.id" class="border-b border-[#F1F5F9]">
                  <td class="py-2.5 align-top text-[#9BA7B0] tabular-nums">{{ idx + 1 }}</td>
                  <td class="py-2.5 align-top text-[#637381] font-mono text-[11px]">{{ item.product?.sku || '—' }}</td>
                  <td class="py-2.5 align-top">
                    <span class="font-semibold text-[#1C2434]">{{ item.product?.name || item.description || '—' }}</span>
                  </td>
                  <td class="py-2.5 align-top text-[#637381] whitespace-pre-line leading-snug">{{ item.description || '—' }}</td>
                  <td class="py-2.5 align-top text-right text-[#374151] tabular-nums">{{ Number(item.qty) }}</td>
                  <td class="py-2.5 align-top text-right text-[#374151] tabular-nums">{{ fmtMoney(item.unitPrice) }}</td>
                  <td class="py-2.5 align-top text-right font-semibold text-[#1C2434] tabular-nums">
                    {{ fmtMoney(Number(item.qty) * Number(item.unitPrice)) }}
                  </td>
                </tr>
                <tr v-if="!po.items?.length">
                  <td colspan="7" class="py-6 text-center text-[12px] text-[#9BA7B0] italic">
                    {{ t('erp.common.noItems') }}
                  </td>
                </tr>
              </tbody>
            </table>
          </section>

          <!-- Totals -->
          <section class="px-10 pb-6 flex justify-end">
            <dl class="w-full sm:w-72 text-[12px] space-y-1.5">
              <div class="flex items-center justify-between">
                <dt class="text-[#637381]">{{ t('erp.po.totalItems') }}</dt>
                <dd class="font-semibold text-[#1C2434] tabular-nums">{{ totalQty }}</dd>
              </div>
              <div class="flex items-center justify-between pt-2 mt-1 border-t-2 border-[#1C2434]">
                <dt class="text-[11px] font-bold text-[#1C2434] uppercase tracking-wider">{{ t('erp.po.grandTotal') }}</dt>
                <dd class="text-[16px] font-extrabold text-[#1C2434] tabular-nums">{{ grandTotalFmt }}</dd>
              </div>
            </dl>
          </section>

          <!-- Notes -->
          <section v-if="po.notes" class="px-10 pt-2 pb-6 border-t border-dashed border-[#E2E8F0]">
            <p class="text-[10px] font-bold text-[#9BA7B0] uppercase tracking-[0.15em] mb-1.5">
              {{ t('erp.po.notes') }}
            </p>
            <p class="text-[12px] text-[#374151] whitespace-pre-line leading-relaxed">{{ po.notes }}</p>
          </section>

          <footer class="px-10 pt-6 pb-8 border-t border-dashed border-[#E2E8F0]">
            <div class="grid grid-cols-2 gap-10">
              <div>
                <div class="h-10 border-b border-[#1C2434]"></div>
                <p class="text-[10px] text-[#637381] mt-1.5 text-center uppercase tracking-wider">
                  Authorised Signature
                </p>
              </div>
              <div>
                <div class="h-10 border-b border-[#1C2434]"></div>
                <p class="text-[10px] text-[#637381] mt-1.5 text-center uppercase tracking-wider">
                  Vendor Acceptance
                </p>
              </div>
            </div>
          </footer>
        </article>

        <!-- Status transitions -->
        <div v-can="'erp.purchasing.edit'" v-if="forwardTransitions.length || cancelTransitions.length"
          class="bg-white border border-[#E2E8F0] shadow-card px-5 py-4 print:hidden
                 flex items-center justify-between flex-wrap gap-3">
          <div>
            <p class="text-[11px] font-semibold text-[#9BA7B0] uppercase tracking-wider">{{ t('erp.po.nextAction') }}</p>
            <p class="text-[13px] text-[#637381] mt-0.5">{{ t('erp.po.nextActionHint') }}</p>
          </div>
          <div class="flex items-center gap-2.5">
            <button v-for="s in forwardTransitions" :key="s"
              @click="changeStatus(s)" :disabled="acting"
              class="px-4 py-2.5 text-sm font-semibold transition-colors disabled:opacity-50
                     flex items-center gap-2"
              :class="forwardBtnClass(s)">
              <ArrowPathIcon v-if="acting" class="w-4 h-4 animate-spin" />
              <template v-else>{{ transitionLabel(s) }}</template>
            </button>
            <button v-for="s in cancelTransitions" :key="s"
              @click="changeStatus(s)" :disabled="acting"
              class="px-4 py-2 text-sm font-medium border border-red-200 text-red-600
                     hover:bg-red-50 transition-colors disabled:opacity-50">
              {{ t('erp.po.cancel') }}
            </button>
          </div>
        </div>
        <p v-if="actionError" class="text-xs text-red-600 print:hidden">{{ actionError }}</p>

        <!-- Conversion actions (confirmed / received) -->
        <div v-if="['confirmed', 'received'].includes(po.status)"
          class="bg-white border border-[#E2E8F0] shadow-card px-5 py-4 print:hidden
                 flex items-center flex-wrap gap-3">
          <p class="text-[11px] font-semibold text-[#9BA7B0] uppercase tracking-wider mr-2">
            {{ t('erp.po.convertActions') }}
          </p>
          <button v-can="'erp.stock.edit'" @click="convertToGoodReceive"
            :disabled="converting || !!po.linkedGoodReceive"
            :title="po.linkedGoodReceive ? `Already linked to ${po.linkedGoodReceive.refNo}` : ''"
            class="flex items-center gap-1.5 px-4 py-2 text-sm font-medium bg-primary-50 text-primary-600 border border-primary-200
                   hover:bg-primary-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
            <InboxArrowDownIcon class="w-4 h-4" />
            {{ converting ? t('common.loading') : t('erp.po.createGoodReceive') }}
          </button>
          <RouterLink v-if="po.linkedGoodReceive" :to="`/erp/good-receive/${po.linkedGoodReceive.id}`"
            class="inline-flex items-center px-2 py-0.5 text-xs font-medium bg-blue-50 text-blue-700 hover:bg-blue-100">
            → {{ po.linkedGoodReceive.refNo }}
          </RouterLink>
          <span v-if="convertError" class="self-center text-xs text-red-600">{{ convertError }}</span>
        </div>

        <AttachmentsPanel v-if="po" ref-type="PurchaseOrder" :ref-id="po.id" class="print:hidden" />
        <ActivityTimeline v-if="po" ref-type="PurchaseOrder" :ref-id="po.id" class="print:hidden" />
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
  ArrowPathIcon, ExclamationCircleIcon, PrinterIcon, InboxArrowDownIcon,
} from '@heroicons/vue/24/outline'
import AppLayout from '@/layouts/AppLayout.vue'
import AttachmentsPanel from '@/components/AttachmentsPanel.vue'
import ActivityTimeline from '@/components/ActivityTimeline.vue'
import DocCurrencyBadge from '@/components/DocCurrencyBadge.vue'
import api from '@/api'
import { fmtDate, fmtMoney } from '@/utils/fmt'
import { useAuthStore } from '@/stores/auth'

const { t }   = useI18n()
const route   = useRoute()
const router  = useRouter()
const auth    = useAuthStore()

const po          = ref(null)
const loading     = ref(true)
const notFound    = ref(false)
const acting      = ref(false)
const actionError = ref('')
const converting  = ref(false)
const convertError = ref('')

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

const capitalize = s => (s || '').charAt(0).toUpperCase() + (s || '').slice(1)

// ── Workflow ──────────────────────────────────────────────
const FLOW_STEPS = computed(() => [
  { key: 'draft',     label: t('erp.po.statusDraft') },
  { key: 'confirmed', label: t('erp.po.statusConfirmed') },
  { key: 'received',  label: t('erp.po.statusReceived') },
])

const COMPLETED_BEFORE = {
  draft:     [],
  confirmed: ['draft'],
  received:  ['draft', 'confirmed'],
  cancelled: [],
}

const TRANSITIONS = {
  draft:     ['confirmed', 'cancelled'],
  confirmed: ['received',  'cancelled'],
  received:  [],
  cancelled: [],
}

const availableTransitions = computed(() => TRANSITIONS[po.value?.status] || [])
const forwardTransitions   = computed(() => availableTransitions.value.filter(s => s !== 'cancelled'))
const cancelTransitions    = computed(() => availableTransitions.value.filter(s => s === 'cancelled'))
const isCancelled          = computed(() => po.value?.status === 'cancelled')

function stepState(key) {
  const cur = po.value?.status
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
  received:  'bg-green-600 text-white hover:bg-green-700',
}
function forwardBtnClass(s) { return FORWARD_BTN[s] || 'bg-primary-500 text-white hover:bg-primary-600' }

function transitionLabel(s) {
  if (s === 'confirmed') return t('erp.po.confirm')
  if (s === 'received')  return t('erp.po.markReceived')
  return s
}

// ── Status badge / stamp ──────────────────────────────────
const STATUS_BADGE = {
  draft:     'bg-[#F1F5F9] text-[#637381]',
  confirmed: 'bg-blue-50 text-blue-700',
  received:  'bg-green-50 text-green-700',
  cancelled: 'bg-red-50 text-red-600',
}
const STATUS_DOT = {
  draft:     'bg-slate-400',
  confirmed: 'bg-blue-500',
  received:  'bg-green-500',
  cancelled: 'bg-red-500',
}
function statusBadge(s) { return STATUS_BADGE[s] || STATUS_BADGE.draft }
function statusDot(s)   { return STATUS_DOT[s]   || STATUS_DOT.draft }

const stampLabel = computed(() => {
  const s = po.value?.status
  if (s === 'draft')     return 'Draft'
  if (s === 'cancelled') return 'Cancelled'
  return ''
})
const stampClass = computed(() => {
  if (po.value?.status === 'cancelled') return 'text-red-600 border-red-600'
  return 'text-[#1C2434] border-[#1C2434]'
})

// ── Data ──────────────────────────────────────────────────
onMounted(fetchPO)

async function fetchPO() {
  loading.value = true
  try {
    const { data } = await api.get(`/erp/purchasing/orders/${route.params.id}`)
    po.value = data.data.order
  } catch {
    notFound.value = true
  } finally {
    loading.value = false
  }
}

const totalQty = computed(() =>
  (po.value?.items || []).reduce((s, i) => s + Number(i.qty), 0).toLocaleString()
)
const grandTotal = computed(() =>
  (po.value?.items || []).reduce((s, i) => s + Number(i.qty) * Number(i.unitPrice), 0)
)
const grandTotalFmt = computed(() => fmtMoney(grandTotal.value))

async function changeStatus(status) {
  actionError.value = ''
  acting.value = true
  try {
    const endpoint = status === 'confirmed' ? 'confirm'
                   : status === 'received'  ? 'receive'
                   : status === 'cancelled' ? 'cancel'
                   : null
    if (!endpoint) return
    const { data } = await api.post(`/erp/purchasing/orders/${route.params.id}/${endpoint}`)
    po.value = data.data.order
  } catch (err) {
    actionError.value = err.response?.data?.message || 'Action failed'
  } finally {
    acting.value = false
  }
}

async function convertToGoodReceive() {
  convertError.value = ''
  converting.value = true
  try {
    const { data } = await api.post(`/erp/purchasing/orders/${route.params.id}/create-good-receive`)
    router.push(`/erp/good-receive/${data.data.id}`)
  } catch (err) {
    convertError.value = err.response?.data?.message || 'Failed to create Good Receive'
  } finally {
    converting.value = false
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
    title:   t('erp.po.delete'),
    message: `Delete "${po.value?.refNo}"? This cannot be undone.`,
    okLabel: t('common.delete') || 'Delete',
  })
  if (!ok) return
  try {
    await api.delete(`/erp/purchasing/orders/${route.params.id}`)
    router.push('/erp/purchasing/orders')
  } catch (err) {
    actionError.value = err.response?.data?.message || 'Delete failed'
  }
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
