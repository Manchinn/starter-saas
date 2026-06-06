<template>
  <!-- ── Journal document (double-entry ledger layout) ──────────────── -->
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
          <h2 class="text-[18px] font-bold text-[#1C2434] leading-tight uppercase">{{ t('erp.journals.title') }}</h2>
        </div>
      </header>

      <!-- Description + meta boxes -->
      <div class="mt-5 grid grid-cols-1 sm:grid-cols-2 border border-[#1C2434]">
        <div class="p-3 border-b sm:border-b-0 sm:border-r border-[#1C2434] text-[12px] space-y-1.5">
          <div class="grid grid-cols-[78px_1fr] gap-x-2">
            <span class="text-[#637381]">{{ t('erp.journals.colDescription') }}</span>
            <span class="text-[#1C2434] whitespace-pre-line leading-snug">{{ journal.description || '—' }}</span>
          </div>
          <div class="grid grid-cols-[78px_1fr] gap-x-2">
            <span class="text-[#637381]">{{ t('erp.common.source') }}</span>
            <span class="font-medium text-[#1C2434]">{{ journal.sourceType || 'Manual' }}</span>
          </div>
        </div>
        <div class="p-3 text-[12px] space-y-1.5">
          <div class="grid grid-cols-[110px_1fr] gap-x-2">
            <span class="text-[#637381]">{{ t('erp.journals.colRefNo') }}</span>
            <span class="font-bold text-[#1C2434] tabular-nums">{{ journal.refNo }}</span>
          </div>
          <div class="grid grid-cols-[110px_1fr] gap-x-2">
            <span class="text-[#637381]">{{ t('erp.common.date') }}</span>
            <span class="font-medium text-[#1C2434] tabular-nums">{{ fmtDate(journal.date) || '—' }}</span>
          </div>
          <div class="grid grid-cols-[110px_1fr] gap-x-2">
            <span class="text-[#637381]">{{ t('erp.journals.lines') }}</span>
            <span class="font-medium text-[#1C2434] tabular-nums">{{ journal.lines?.length || 0 }}</span>
          </div>
        </div>
      </div>

      <!-- Lines -->
      <table class="w-full mt-4 border-collapse text-[12px] table-fixed">
        <thead>
          <tr class="bg-[#FAFBFD] text-[10px] font-bold text-[#1C2434] uppercase tracking-wide">
            <th class="border border-[#1C2434] px-2 py-2 text-right w-[32px]">#</th>
            <th class="border border-[#1C2434] px-2 py-2 text-left w-[190px]">{{ t('erp.journals.colAccount') }}</th>
            <th class="border border-[#1C2434] px-2 py-2 text-left">{{ t('erp.journals.colDescription') }}</th>
            <th class="border border-[#1C2434] px-2 py-2 text-right w-[108px]">{{ t('erp.journals.colDebit') }}</th>
            <th class="border border-[#1C2434] px-2 py-2 text-right w-[108px]">{{ t('erp.journals.colCredit') }}</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(line, idx) in (journal.lines || [])" :key="line.id" class="align-top">
            <td class="border-x border-b border-x-[#1C2434] border-b-[#E2E8F0] px-2 py-1.5 text-right tabular-nums text-[#9BA7B0]">{{ line.lineNo || idx + 1 }}</td>
            <td class="border-x border-b border-x-[#1C2434] border-b-[#E2E8F0] px-2 py-1.5">
              <span class="text-[#1C2434]">{{ line.account?.name || '—' }}</span>
              <span class="block text-[10px] font-mono text-[#9BA7B0]">{{ line.account?.code }}</span>
            </td>
            <td class="border-x border-b border-x-[#1C2434] border-b-[#E2E8F0] px-2 py-1.5 text-[#637381] whitespace-pre-line leading-snug">{{ line.description || '—' }}</td>
            <td class="border-x border-b border-x-[#1C2434] border-b-[#E2E8F0] px-2 py-1.5 text-right tabular-nums font-medium text-[#1C2434]">{{ Number(line.debit) > 0 ? fmtMoney(line.debit) : '' }}</td>
            <td class="border-x border-b border-x-[#1C2434] border-b-[#E2E8F0] px-2 py-1.5 text-right tabular-nums font-medium text-[#1C2434]">{{ Number(line.credit) > 0 ? fmtMoney(line.credit) : '' }}</td>
          </tr>
          <!-- filler rows keep the goods area tall like a printed form -->
          <tr v-for="n in fillerRows" :key="'filler-' + n" class="h-[26px]">
            <td class="border-x border-[#1C2434]"></td>
            <td class="border-x border-[#1C2434]"></td>
            <td class="border-x border-[#1C2434]"></td>
            <td class="border-x border-[#1C2434]"></td>
            <td class="border-x border-[#1C2434]"></td>
          </tr>
          <!-- Totals row (double-entry must balance) -->
          <tr class="bg-[#FAFBFD] font-bold text-[#1C2434]">
            <td colspan="3" class="border border-[#1C2434] px-2 py-2 text-right text-[11px] uppercase tracking-wider">{{ t('erp.journals.totals') }}</td>
            <td class="border border-[#1C2434] px-2 py-2 text-right tabular-nums">{{ fmtMoney(journal.totalDebit) }}</td>
            <td class="border border-[#1C2434] px-2 py-2 text-right tabular-nums">{{ fmtMoney(journal.totalDebit) }}</td>
          </tr>
        </tbody>
      </table>

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
import { fmtDate, fmtMoney } from '@/utils/fmt'
import { useAuthStore } from '@/stores/auth'

const props = defineProps({
  journal: { type: Object, required: true },
})

const { t } = useI18n()
const auth  = useAuthStore()

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
  return p.startsWith('/') ? p : `/${p}`
})

const fillerRows = computed(() => Math.max(0, 8 - (props.journal?.lines?.length || 0)))
const signatures = ['Prepared By', 'Approved By']

const stampLabel = computed(() => {
  const s = props.journal?.status
  if (s === 'draft')  return 'Draft'
  if (s === 'posted') return 'Posted'
  if (s === 'voided') return 'Voided'
  return ''
})
const stampClass = computed(() => {
  const s = props.journal?.status
  if (s === 'voided') return 'text-red-600 border-red-600'
  if (s === 'posted') return 'text-green-600 border-green-600'
  return 'text-[#1C2434] border-[#1C2434]'
})
</script>
