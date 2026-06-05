<template>
  <!-- ── Stock-adjust document (receipt tax-invoice layout) ─────────── -->
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
          <h2 class="text-[18px] font-bold text-[#1C2434] leading-tight">{{ t('erp.stockAdjust.documentTitle') }}</h2>
        </div>
      </header>

      <!-- Store / Reason + meta boxes -->
      <div class="mt-5 grid grid-cols-1 sm:grid-cols-2 border border-[#1C2434]">
        <div class="p-3 border-b sm:border-b-0 sm:border-r border-[#1C2434] text-[12px] space-y-1.5">
          <div class="grid grid-cols-[78px_1fr] gap-x-2">
            <span class="text-[#637381]">{{ t('erp.common.store') }}</span>
            <span class="font-semibold text-[#1C2434]">
              {{ adj.store?.name || '—' }}
              <span v-if="adj.store?.code" class="font-mono text-[11px] text-[#9BA7B0]">({{ adj.store.code }})</span>
            </span>
          </div>
          <div class="grid grid-cols-[78px_1fr] gap-x-2">
            <span class="text-[#637381]">{{ t('erp.stockAdjust.reason') }}</span>
            <span class="font-medium text-[#1C2434]">{{ adj.reason || '—' }}</span>
          </div>
        </div>
        <div class="p-3 text-[12px] space-y-1.5">
          <div class="grid grid-cols-[124px_1fr] gap-x-2">
            <span class="text-[#637381]">{{ t('erp.stockAdjust.colRefNo') }}</span>
            <span class="font-bold text-[#1C2434] tabular-nums">{{ adj.refNo }}</span>
          </div>
          <div class="grid grid-cols-[124px_1fr] gap-x-2">
            <span class="text-[#637381]">{{ t('erp.common.date') }}</span>
            <span class="font-medium text-[#1C2434] tabular-nums">{{ fmtDate(adj.date) || '—' }}</span>
          </div>
        </div>
      </div>

      <!-- Line items -->
      <table class="w-full mt-4 border-collapse text-[12px] table-fixed">
        <thead>
          <tr class="bg-[#FAFBFD] text-[10px] font-bold text-[#1C2434] uppercase tracking-wide">
            <th class="border border-[#1C2434] px-2 py-2 text-right w-[36px]">#</th>
            <th class="border border-[#1C2434] px-2 py-2 text-left w-[108px]">{{ t('erp.stockAdjust.colSku') }}</th>
            <th class="border border-[#1C2434] px-2 py-2 text-left w-[270px]">{{ t('erp.common.product') }}</th>
            <th class="border border-[#1C2434] px-2 py-2 text-right w-[70px]">{{ t('erp.stockAdjust.storeBalance') }}</th>
            <th class="border border-[#1C2434] px-2 py-2 text-right w-[70px]">{{ t('erp.stockAdjust.adjQty') }}</th>
            <th class="border border-[#1C2434] px-2 py-2 text-left w-[101px]">{{ t('erp.common.notes') }}</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(item, idx) in (adj.items || [])" :key="item.id" class="align-top">
            <td class="border-x border-b border-x-[#1C2434] border-b-[#E2E8F0] px-2 py-1.5 text-right tabular-nums text-[#9BA7B0]">{{ idx + 1 }}</td>
            <td class="border-x border-b border-x-[#1C2434] border-b-[#E2E8F0] px-2 py-1.5 font-mono text-[11px] text-[#637381]">{{ item.product?.sku || '—' }}</td>
            <td class="border-x border-b border-x-[#1C2434] border-b-[#E2E8F0] px-2 py-1.5">
              <span class="text-[#1C2434]">{{ item.product?.name || '—' }}</span>
            </td>
            <td class="border-x border-b border-x-[#1C2434] border-b-[#E2E8F0] px-2 py-1.5 text-right font-mono tabular-nums text-[#374151]">{{ storeBalance(item.productId) }}</td>
            <td class="border-x border-b border-x-[#1C2434] border-b-[#E2E8F0] px-2 py-1.5 text-right tabular-nums font-bold"
              :class="item.qty > 0 ? 'text-green-700' : 'text-red-600'">
              {{ item.qty > 0 ? '+' : '' }}{{ item.qty }}
            </td>
            <td class="border-x border-b border-x-[#1C2434] border-b-[#E2E8F0] px-2 py-1.5 text-[#637381]">{{ item.notes || '—' }}</td>
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

      <!-- Notes + adjustment totals -->
      <div class="flex items-stretch border-x border-t border-b border-[#1C2434]">
        <div class="flex-1 min-w-0 flex flex-col">
          <div class="p-3 text-[11px] text-[#374151] space-y-1">
            <div v-if="adj.notes" class="grid grid-cols-[64px_1fr] gap-x-2">
              <span class="text-[#9BA7B0]">{{ t('erp.common.notes') }}</span>
              <span class="whitespace-pre-line leading-snug">{{ adj.notes }}</span>
            </div>
            <p v-else class="text-[#9BA7B0] italic">—</p>
          </div>
        </div>
        <div class="w-[241px] flex-shrink-0 border-l border-[#1C2434] text-[12px]">
          <div class="flex items-center justify-between px-3 pt-[7px] pb-[9px] border-b border-[#1C2434]">
            <span class="text-[#637381]">Stock In <span class="text-green-600">(+)</span></span>
            <span class="font-medium text-green-700 tabular-nums">+{{ totalIn }}</span>
          </div>
          <div class="flex items-center justify-between px-3 py-1.5 border-b border-[#1C2434]">
            <span class="text-[#637381]">Stock Out <span class="text-red-500">(−)</span></span>
            <span class="font-medium text-red-600 tabular-nums">{{ totalOut }}</span>
          </div>
          <div class="flex items-center justify-between px-3 py-2 bg-[#FAFBFD]">
            <span class="font-bold text-[#1C2434]">Net Change</span>
            <span class="font-extrabold tabular-nums"
              :class="netQty > 0 ? 'text-green-700' : netQty < 0 ? 'text-red-600' : 'text-[#1C2434]'">
              {{ netQty > 0 ? '+' : '' }}{{ netQty }}
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
</template>

<script setup>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { fmtDate } from '@/utils/fmt'
import { useAuthStore } from '@/stores/auth'

const props = defineProps({
  // The stock-adjustment record (with store, items, notes, status, …).
  adj: { type: Object, required: true },
  // Store stock snapshot used to show each product's current balance.
  storeProducts: { type: Array, default: () => [] },
})

const { t } = useI18n()
const auth  = useAuthStore()

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

function storeBalance(productId) {
  if (!productId) return 0
  return props.storeProducts.find(p => p.id === productId)?.stock ?? 0
}

const totalIn  = computed(() => (props.adj?.items || []).reduce((s, i) => s + (i.qty > 0 ? Number(i.qty) : 0), 0))
const totalOut = computed(() => (props.adj?.items || []).reduce((s, i) => s + (i.qty < 0 ? Number(i.qty) : 0), 0))
const netQty   = computed(() => (props.adj?.items || []).reduce((s, i) => s + (Number(i.qty) || 0), 0))

// ── Document helpers (mirror Invoice/Receipt tax-invoice layout) ──
const fillerRows = computed(() => Math.max(0, 8 - (props.adj?.items?.length || 0)))
const signatures = computed(() => [
  t('erp.stockAdjust.docPreparedBy'),
  t('erp.stockAdjust.docApprovedBy'),
])
const stampLabel = computed(() => {
  const s = props.adj?.status
  if (s === 'draft')     return 'Draft'
  if (s === 'confirmed') return 'Confirmed'
  return ''
})
const stampClass = computed(() =>
  props.adj?.status === 'confirmed'
    ? 'text-green-600 border-green-600'
    : 'text-amber-500 border-amber-400'
)
</script>
