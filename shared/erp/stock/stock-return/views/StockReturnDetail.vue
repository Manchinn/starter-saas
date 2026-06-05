<template>
  <AppLayout>
    <div class="space-y-5">

      <!-- Top action bar (hidden on print) -->
      <div class="flex items-start gap-3 print:hidden">
        <RouterLink to="/erp/stock-return"
          class="mt-0.5 p-2 text-[#9BA7B0] hover:text-[#1C2434] hover:bg-white
                 border border-transparent hover:border-[#E2E8F0] transition-all flex-shrink-0">
          <ArrowLeftIcon class="w-[18px] h-[18px]" />
        </RouterLink>
        <div class="flex-1 min-w-0">
          <div class="flex items-center gap-2.5 flex-wrap">
            <h1 class="text-xl font-bold text-[#1C2434]">
              {{ loading ? '…' : (sr?.refNo || t('erp.stockReturn.detail')) }}
            </h1>
            <span v-if="sr && !loading"
              class="inline-flex items-center gap-1.5 px-2.5 py-0.5 text-[11px] font-semibold capitalize"
              :class="statusBadge(sr.status)">
              <span class="w-1.5 h-1.5" :class="statusDot(sr.status)"></span>
              {{ sr.status }}
            </span>
            <span v-if="sr && !loading"
              class="inline-flex items-center gap-1.5 px-2.5 py-0.5 text-[11px] font-semibold"
              :class="typeBadge(sr.type)">
              <component :is="sr.type === 'customer_return' ? ArrowDownTrayIcon : ArrowUpTrayIcon" class="w-3 h-3" />
              {{ sr.type === 'customer_return' ? t('erp.stockReturn.customerReturn') : t('erp.stockReturn.returnToVendor') }}
            </span>
          </div>
          <nav class="flex items-center gap-1.5 mt-1">
            <RouterLink to="/erp/stock-return" class="text-[12px] text-[#9BA7B0] hover:text-[#637381] transition-colors">
              {{ t('erp.stockReturn.title') }}
            </RouterLink>
            <ChevronRightIcon class="w-3 h-3 text-[#CBD5E1]" />
            <span class="text-[12px] text-[#637381]">{{ sr?.refNo || '…' }}</span>
          </nav>
        </div>
        <div v-if="sr && !loading" class="flex items-center gap-2 flex-shrink-0">
          <KeyboardShortcuts :shortcuts="shortcuts" width="w-56" />
          <button @click="onPrint" type="button"
            class="inline-flex items-center gap-1.5 px-3 py-2 text-[12px] font-semibold
                   text-[#637381] bg-white border border-[#E2E8F0] hover:bg-[#F7F9FC] hover:text-[#1C2434] transition-colors">
            <PrinterIcon class="w-4 h-4" />
            {{ t('common.print') }}
          </button>
          <RouterLink v-if="sr.status === 'draft'" v-can="'erp.stock.edit'" :to="`/erp/stock-return/${sr.id}/edit`"
            class="inline-flex items-center gap-1.5 px-3 py-2 text-[12px] font-semibold
                   text-primary-600 bg-primary-50 hover:bg-primary-100 border border-primary-200 transition-colors">
            <PencilSquareIcon class="w-4 h-4" />
            {{ t('common.edit') }}
          </RouterLink>
          <button v-if="sr.status === 'draft'" v-can="'erp.stock.delete'" @click="deleteSR" type="button"
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
      <div v-else-if="!sr"
        class="flex items-start gap-3 bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3.5 print:hidden">
        <ExclamationCircleIcon class="w-5 h-5 flex-shrink-0 mt-0.5" />
        <span>{{ t('erp.stockReturn.notFound') }}
          <RouterLink to="/erp/stock-return" class="underline ml-1">{{ t('erp.common.backToList') }}</RouterLink>
        </span>
      </div>

      <template v-else>
        <!-- Workflow strip (hidden on print) -->
        <div class="bg-white border border-[#E2E8F0] shadow-card px-5 py-3 print:hidden">
          <div class="flex items-center gap-1 flex-wrap">
            <template v-for="(step, i) in FLOW_STEPS" :key="step.key">
              <div class="flex items-center gap-2 px-2.5 py-1" :class="stepChipClass(step.key)">
                <CheckIcon v-if="stepState(step.key) === 'completed'" class="w-3.5 h-3.5" />
                <span v-else-if="stepState(step.key) === 'current'" class="w-2 h-2 bg-current"></span>
                <span v-else class="text-[10px] font-bold opacity-50">{{ i + 1 }}</span>
                <span class="text-[12px] font-semibold">{{ step.label }}</span>
              </div>
              <ChevronRightIcon v-if="i < FLOW_STEPS.length - 1" class="w-3 h-3 text-[#CBD5E1] flex-shrink-0" />
            </template>
          </div>
        </div>

        <!-- ── Document (receipt tax-invoice layout) ─────────────── -->
        <article class="relative mx-auto bg-white border border-[#E2E8F0] shadow-card max-w-[186mm] w-full
                        print:border-0 print:shadow-none print:max-w-none print:mx-0
                        overflow-hidden">

          <!-- Diagonal status stamp -->
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
                    <p v-if="companyEmail">{{ companyEmail }}</p>
                    <p v-if="companyTaxId" class="tabular-nums">
                      {{ t('erp.orders.docTaxId') }} {{ companyTaxId }}
                    </p>
                  </div>
                </div>
              </div>
              <div class="text-right flex-shrink-0">
                <h2 class="text-[18px] font-bold text-[#1C2434] leading-tight">{{ t('erp.stockReturn.documentTitle') }}</h2>
                <p class="mt-1 text-[10px] font-bold tracking-wider uppercase"
                  :class="sr.type === 'customer_return' ? 'text-blue-600' : 'text-orange-600'">
                  {{ sr.type === 'customer_return' ? t('erp.stockReturn.customerReturn') : t('erp.stockReturn.returnToVendor') }}
                </p>
              </div>
            </header>

            <!-- Counterparty + meta boxes -->
            <div class="mt-5 grid grid-cols-1 sm:grid-cols-2 border border-[#1C2434]">
              <div class="p-3 border-b sm:border-b-0 sm:border-r border-[#1C2434] text-[12px] space-y-1.5">
                <div class="grid grid-cols-[78px_1fr] gap-x-2">
                  <span class="text-[#637381]">
                    {{ sr.type === 'customer_return' ? t('erp.stockReturn.customer') : t('erp.stockReturn.vendor') }}
                  </span>
                  <span class="font-semibold text-[#1C2434]">
                    {{ sr.type === 'customer_return' ? (sr.customer?.name || '—') : (sr.vendor?.name || '—') }}
                    <span v-if="sr.type === 'vendor_return' && sr.vendor?.code" class="font-mono text-[11px] text-[#9BA7B0]">({{ sr.vendor.code }})</span>
                    <span v-if="sr.type === 'customer_return' && sr.customer?.company" class="block font-normal text-[11px] text-[#637381]">{{ sr.customer.company }}</span>
                  </span>
                </div>
                <div class="grid grid-cols-[78px_1fr] gap-x-2">
                  <span class="text-[#637381]">{{ t('erp.common.store') }}</span>
                  <span class="font-semibold text-[#1C2434]">
                    {{ sr.store?.name || '—' }}
                    <span v-if="sr.store?.code" class="font-mono text-[11px] text-[#9BA7B0]">({{ sr.store.code }})</span>
                  </span>
                </div>
              </div>
              <div class="p-3 text-[12px] space-y-1.5">
                <div class="grid grid-cols-[124px_1fr] gap-x-2">
                  <span class="text-[#637381]">{{ t('erp.stockReturn.colRefNo') }}</span>
                  <span class="font-bold text-[#1C2434] tabular-nums">{{ sr.refNo }}</span>
                </div>
                <div class="grid grid-cols-[124px_1fr] gap-x-2">
                  <span class="text-[#637381]">{{ t('erp.common.date') }}</span>
                  <span class="font-medium text-[#1C2434] tabular-nums">{{ fmtDate(sr.date) || '—' }}</span>
                </div>
              </div>
            </div>

            <!-- Line items -->
            <table class="w-full mt-4 border-collapse text-[12px] table-fixed">
              <thead>
                <tr class="bg-[#FAFBFD] text-[10px] font-bold text-[#1C2434] uppercase tracking-wide">
                  <th class="border border-[#1C2434] px-2 py-2 text-right w-[36px]">#</th>
                  <th class="border border-[#1C2434] px-2 py-2 text-left w-[104px]">{{ t('erp.stockReturn.colSku') }}</th>
                  <th class="border border-[#1C2434] px-2 py-2 text-left">{{ t('erp.common.product') }}</th>
                  <th class="border border-[#1C2434] px-2 py-2 text-right w-[68px]">{{ t('erp.stockReturn.colQty') }}</th>
                  <th class="border border-[#1C2434] px-2 py-2 text-right w-[84px]">{{ t('erp.stockReturn.colCost') }}</th>
                  <th class="border border-[#1C2434] px-2 py-2 text-right w-[96px]">{{ t('erp.stockReturn.totalValue') }}</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(item, idx) in (sr.items || [])" :key="item.id" class="align-top">
                  <td class="border-x border-b border-x-[#1C2434] border-b-[#E2E8F0] px-2 py-1.5 text-right tabular-nums text-[#9BA7B0]">{{ idx + 1 }}</td>
                  <td class="border-x border-b border-x-[#1C2434] border-b-[#E2E8F0] px-2 py-1.5 font-mono text-[11px] text-[#637381]">{{ item.product?.sku || '—' }}</td>
                  <td class="border-x border-b border-x-[#1C2434] border-b-[#E2E8F0] px-2 py-1.5">
                    <span class="text-[#1C2434]">{{ item.product?.name || '—' }}</span>
                    <span v-if="item.batchId" class="block text-[10px] text-[#9BA7B0] font-mono mt-0.5">
                      {{ t('erp.common.batchId') }}: {{ item.batchId }}
                    </span>
                    <span v-if="item.reason" class="block text-[10px] text-[#9BA7B0] mt-0.5">{{ item.reason }}</span>
                  </td>
                  <td class="border-x border-b border-x-[#1C2434] border-b-[#E2E8F0] px-2 py-1.5 text-right tabular-nums font-bold"
                    :class="sr.type === 'customer_return' ? 'text-green-700' : 'text-red-600'">
                    {{ sr.type === 'customer_return' ? '+' : '−' }}{{ Number(item.qty) }}
                  </td>
                  <td class="border-x border-b border-x-[#1C2434] border-b-[#E2E8F0] px-2 py-1.5 text-right tabular-nums text-[#374151]">{{ fmtMoney(item.cost) }}</td>
                  <td class="border-x border-b border-x-[#1C2434] border-b-[#E2E8F0] px-2 py-1.5 text-right tabular-nums font-medium text-[#1C2434]">{{ fmtMoney(Number(item.qty) * Number(item.cost)) }}</td>
                </tr>
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

            <!-- Notes + return totals -->
            <div class="flex items-stretch border-x border-t border-b border-[#1C2434]">
              <div class="flex-1 min-w-0 flex flex-col">
                <div class="p-3 text-[11px] text-[#374151] space-y-1">
                  <div v-if="sr.notes" class="grid grid-cols-[64px_1fr] gap-x-2">
                    <span class="text-[#9BA7B0]">{{ t('erp.common.notes') }}</span>
                    <span class="whitespace-pre-line leading-snug">{{ sr.notes }}</span>
                  </div>
                  <p v-else class="text-[#9BA7B0] italic">—</p>
                </div>
              </div>
              <div class="w-[241px] flex-shrink-0 border-l border-[#1C2434] text-[12px]">
                <div class="flex items-center justify-between px-3 pt-[7px] pb-[9px] border-b border-[#1C2434]">
                  <span class="text-[#637381]">{{ t('erp.common.items') }}</span>
                  <span class="tabular-nums text-[#1C2434]">{{ (sr.items || []).length }}</span>
                </div>
                <div class="flex items-center justify-between px-3 py-1.5 border-b border-[#1C2434]">
                  <span class="text-[#637381]">{{ t('erp.stockReturn.totalReturnQty') }}</span>
                  <span class="tabular-nums font-medium"
                    :class="sr.type === 'customer_return' ? 'text-green-700' : 'text-red-600'">
                    {{ sr.type === 'customer_return' ? '+' : '−' }}{{ totalQty }}
                  </span>
                </div>
                <div class="flex items-center justify-between px-3 py-2 bg-[#FAFBFD]">
                  <span class="font-bold text-[#1C2434]">{{ t('erp.stockReturn.totalValue') }}</span>
                  <span class="font-extrabold text-[#1C2434] tabular-nums">{{ fmtMoney(totalValue) }}</span>
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

        <!-- Status action (hidden on print) -->
        <div v-if="sr.status === 'draft'" v-can="'erp.stock.edit'"
          class="bg-white border border-[#E2E8F0] shadow-card px-5 py-4 print:hidden
                 flex items-center justify-between flex-wrap gap-3">
          <div>
            <p class="text-[11px] font-semibold text-[#9BA7B0] uppercase tracking-wider">
              {{ t('erp.orders.nextAction') }}
            </p>
            <p class="text-[13px] text-[#637381] mt-0.5">
              {{ t('erp.stockReturn.confirmHint') }}
            </p>
          </div>
          <button @click="confirmSR" :disabled="confirming"
            class="px-4 py-2.5 text-sm font-semibold
                   bg-green-600 text-white hover:bg-green-700 disabled:opacity-50
                   flex items-center gap-2 transition-colors">
            <ArrowPathIcon v-if="confirming" class="w-4 h-4 animate-spin" />
            <CheckIcon v-else class="w-4 h-4" />
            {{ confirming ? t('erp.common.confirming') : t('erp.stockReturn.confirmReturn') }}
          </button>
        </div>
        <p v-if="error" class="text-xs text-red-600 print:hidden">{{ error }}</p>

        <ActivityTimeline ref-type="StockReturn" :ref-id="sr.id" class="print:hidden" />
      </template>
    </div>
  </AppLayout>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute, useRouter } from 'vue-router'
import {
  ArrowLeftIcon, ChevronRightIcon, CheckIcon, ArrowPathIcon,
  TrashIcon, PencilSquareIcon, PrinterIcon, ExclamationCircleIcon,
  ArrowDownTrayIcon, ArrowUpTrayIcon,
} from '@heroicons/vue/24/outline'
import AppLayout from '@/layouts/AppLayout.vue'
import KeyboardShortcuts from '@/components/KeyboardShortcuts.vue'
import { useDetailShortcuts } from '@/composables/useShortcuts'
import ActivityTimeline from '@/components/ActivityTimeline.vue'
import api from '@/api'
import { fmtDate, fmtMoney } from '@/utils/fmt'
import { useAuthStore } from '@/stores/auth'

const { t }    = useI18n()
const route    = useRoute()
const router   = useRouter()
const auth     = useAuthStore()

const sr           = ref(null)
const loading      = ref(true)
const confirming   = ref(false)
const error        = ref('')

const { shortcuts } = useDetailShortcuts({
  enabled: () => !loading.value && !!sr.value,
  canEdit: () => sr.value?.status === 'draft',
  edit:  () => router.push(`/erp/stock-return/${sr.value.id}/edit`),
  print: onPrint,
  back:  () => router.push('/erp/stock-return'),
})

const FLOW_STEPS = [
  { key: 'draft',     label: 'Draft' },
  { key: 'confirmed', label: 'Confirmed' },
]

const stepState = (key) => {
  if (!sr.value) return 'pending'
  const status = sr.value.status
  if (key === status) return 'current'
  if (key === 'draft' && status === 'confirmed') return 'completed'
  return 'pending'
}

const stepChipClass = (key) => {
  const state = stepState(key)
  if (state === 'completed') return 'bg-green-50 text-green-700'
  if (state === 'current')   return 'bg-primary-50 text-primary-600'
  return 'bg-[#F1F5F9] text-[#9BA7B0]'
}

const statusBadge = (s) => (s === 'confirmed' ? 'bg-green-50 text-green-700' : 'bg-amber-50 text-amber-700')
const statusDot   = (s) => (s === 'confirmed' ? 'bg-green-500' : 'bg-amber-500')

const typeBadge = (t) => (t === 'customer_return' ? 'bg-blue-50 text-blue-700' : 'bg-orange-50 text-orange-700')

// Company profile from current organization (same pattern as OrderDetail)
const org = computed(() => auth.user?.organization || {})
const companyName    = computed(() => org.value.companyName || org.value.name || 'Your Company')
const companyAddress = computed(() => org.value.address || '')
const companyPhone   = computed(() => org.value.phone   || '')
const companyEmail   = computed(() => org.value.email   || '')
const companyTaxId   = computed(() => org.value.taxId   || '')
const companyLogoSrc = computed(() => {
  const p = org.value.logoPath
  if (!p) return ''
  if (/^https?:\/\//i.test(p)) return p
  return p.startsWith('/') ? p : `/${p}`
})

const totalQty   = computed(() => (sr.value?.items || []).reduce((s, i) => s + (Number(i.qty) || 0), 0))
const totalValue = computed(() => (sr.value?.items || []).reduce((s, i) => s + ((Number(i.qty) || 0) * (Number(i.cost) || 0)), 0))

// ── Document helpers (mirror Invoice/Receipt tax-invoice layout) ──
const fillerRows = computed(() => Math.max(0, 8 - (sr.value?.items?.length || 0)))
const signatures = computed(() => [
  t('erp.stockReturn.docPreparedBy'),
  t('erp.stockReturn.docApprovedBy'),
])
const stampLabel = computed(() => {
  const s = sr.value?.status
  if (s === 'draft')     return 'Draft'
  if (s === 'confirmed') return 'Confirmed'
  return ''
})
const stampClass = computed(() =>
  sr.value?.status === 'confirmed'
    ? 'text-green-600 border-green-600'
    : 'text-amber-500 border-amber-400'
)

async function load() {
  loading.value = true
  try {
    const { data } = await api.get(`/erp/stock-return/${route.params.id}`)
    sr.value = data.data.stockReturn
  } catch {
    sr.value = null
  } finally {
    loading.value = false
  }
}
onMounted(load)

function onPrint() {
  window.print()
}

async function confirmSR() {
  if (!confirm(`Confirm ${sr.value.refNo}? Stock will be updated and this cannot be undone.`)) return
  confirming.value = true
  error.value = ''
  try {
    await api.post(`/erp/stock-return/${route.params.id}/confirm`)
    await load()
  } catch (err) {
    error.value = err.response?.data?.message || 'Failed to confirm'
  } finally {
    confirming.value = false
  }
}

async function deleteSR() {
  if (!confirm(`Delete ${sr.value.refNo}? This cannot be undone.`)) return
  try {
    await api.delete(`/erp/stock-return/${route.params.id}`)
    router.push('/erp/stock-return')
  } catch (err) {
    error.value = err.response?.data?.message || 'Delete failed'
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
