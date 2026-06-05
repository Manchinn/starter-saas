<template>
  <AppLayout>
    <div class="space-y-5">

      <!-- Top action bar (hidden on print) -->
      <div class="flex items-start gap-3 print:hidden">
        <RouterLink to="/erp/accounting/journals"
          class="mt-0.5 p-2 text-[#9BA7B0] hover:text-[#1C2434] hover:bg-white
                 border border-transparent hover:border-[#E2E8F0] transition-all flex-shrink-0">
          <ArrowLeftIcon class="w-[18px] h-[18px]" />
        </RouterLink>
        <div class="flex-1 min-w-0">
          <div class="flex items-center gap-2.5 flex-wrap">
            <h1 class="text-xl font-bold text-[#1C2434]">
              {{ loading ? '…' : (journal?.refNo || t('erp.journals.title')) }}
            </h1>
            <span v-if="journal && !loading"
              class="inline-flex items-center gap-1.5 px-2.5 py-0.5 text-[11px] font-semibold capitalize"
              :class="statusBadge(journal.status)">
              <span class="w-1.5 h-1.5" :class="statusDot(journal.status)"></span>
              {{ journal.status }}
            </span>
          </div>
          <nav class="flex items-center gap-1.5 mt-1">
            <RouterLink to="/erp/accounting/journals" class="text-[12px] text-[#9BA7B0] hover:text-[#637381] transition-colors">
              {{ t('erp.journals.title') }}
            </RouterLink>
            <ChevronRightIcon class="w-3 h-3 text-[#CBD5E1]" />
            <span class="text-[12px] text-[#637381]">{{ journal?.refNo || '…' }}</span>
          </nav>
          <!-- Source-doc badge (auto-journals from invoices/receipts/etc.) -->
          <div v-if="journal && !loading && journal.sourceType" class="flex items-center gap-1.5 mt-2 flex-wrap">
            <span class="text-[11px] text-[#9BA7B0] font-medium">{{ t('erp.common.source') }}:</span>
            <span class="inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-medium bg-indigo-50 text-indigo-700">
              <DocumentTextIcon class="w-3 h-3" /> {{ journal.sourceType }}
            </span>
          </div>
        </div>
        <div v-if="journal && !loading" class="flex items-center gap-2 flex-shrink-0">
          <KeyboardShortcuts :shortcuts="shortcuts" width="w-56" />
          <button @click="onPrint" type="button"
            title="Print this document"
            class="inline-flex items-center gap-1.5 px-3 py-2 text-[12px] font-semibold
                   text-[#637381] bg-white border border-[#E2E8F0] hover:bg-[#F7F9FC] hover:text-[#1C2434] transition-colors">
            <PrinterIcon class="w-4 h-4" />
            {{ t('common.print') }}
          </button>
          <RouterLink v-if="journal.status === 'draft'" v-can="'erp.accounting.edit'"
            :to="`/erp/accounting/journals/${journal.id}/edit`"
            class="inline-flex items-center gap-1.5 px-3 py-2 text-[12px] font-semibold
                   text-primary-600 bg-primary-50 hover:bg-primary-100 border border-primary-200 transition-colors">
            <PencilSquareIcon class="w-4 h-4" />
            {{ t('common.edit') }}
          </RouterLink>
          <button v-if="journal.status === 'draft'" v-can="'erp.accounting.delete'" @click="confirmDelete" type="button"
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
        <span>{{ t('erp.journals.notFound') }}
          <RouterLink to="/erp/accounting/journals" class="underline ml-1">{{ t('erp.common.backToList') }}</RouterLink>
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
            <span v-if="isVoided" class="ml-2 inline-flex items-center gap-1.5 px-2.5 py-1 bg-red-50 text-red-600">
              <XMarkIcon class="w-3.5 h-3.5" />
              <span class="text-[12px] font-semibold">{{ t('erp.journals.statusVoided') }}</span>
            </span>
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

        <!-- Status transitions -->
        <div v-can="'erp.accounting.edit'" v-if="journal.status !== 'voided'"
          class="bg-white border border-[#E2E8F0] shadow-card px-5 py-4 print:hidden
                 flex items-center justify-between flex-wrap gap-3">
          <div>
            <p class="text-[11px] font-semibold text-[#9BA7B0] uppercase tracking-wider">Next Action</p>
            <p class="text-[13px] text-[#637381] mt-0.5">Post this entry to the ledger, or void it to reverse.</p>
          </div>
          <div class="flex items-center gap-2.5">
            <button v-if="journal.status === 'draft'" @click="doPost" :disabled="acting"
              class="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold
                     bg-green-600 text-white hover:bg-green-700 transition-colors disabled:opacity-50">
              <ArrowPathIcon v-if="acting" class="w-4 h-4 animate-spin" />
              <CheckCircleIcon v-else class="w-4 h-4" />
              {{ t('erp.journals.postEntry') }}
            </button>
            <button @click="doVoid" :disabled="acting"
              class="px-4 py-2 text-sm font-medium border border-red-200 text-red-600
                     hover:bg-red-50 transition-colors disabled:opacity-50">
              {{ t('erp.journals.voidEntry') }}
            </button>
          </div>
        </div>
        <p v-if="actionError" class="text-xs text-red-600 print:hidden">{{ actionError }}</p>

        <ActivityTimeline v-if="journal" ref-type="Journal" :ref-id="journal.id" class="print:hidden" />
      </template>
    </div>
  </AppLayout>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import {
  ArrowLeftIcon, ChevronRightIcon, DocumentTextIcon,
  CheckIcon, XMarkIcon, TrashIcon, PencilSquareIcon,
  ArrowPathIcon, ExclamationCircleIcon, CheckCircleIcon, PrinterIcon,
} from '@heroicons/vue/24/outline'
import AppLayout from '@/layouts/AppLayout.vue'
import ActivityTimeline from '@/components/ActivityTimeline.vue'
import KeyboardShortcuts from '@/components/KeyboardShortcuts.vue'
import { useDetailShortcuts } from '@/composables/useShortcuts'
import api from '@/api'
import { fmtDate, fmtMoney } from '@/utils/fmt'
import { useAuthStore } from '@/stores/auth'

const { t } = useI18n()
const route       = useRoute()
const router      = useRouter()
const auth        = useAuthStore()
const journal     = ref(null)
const loading     = ref(true)
const notFound    = ref(false)
const acting      = ref(false)
const actionError = ref('')

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

// ── Document helpers (mirror Invoice/Receipt tax-invoice layout) ──
const fillerRows = computed(() => Math.max(0, 8 - (journal.value?.lines?.length || 0)))
const signatures = ['Prepared By', 'Approved By']

const { shortcuts } = useDetailShortcuts({
  enabled: () => !loading.value && !!journal.value,
  canEdit: () => journal.value?.status === 'draft' && auth.hasPermission('erp.accounting.edit'),
  edit:  () => router.push(`/erp/accounting/journals/${journal.value.id}/edit`),
  print: onPrint,
  back:  () => router.push('/erp/accounting/journals'),
  remove: () => confirmDelete(),
  canRemove: () => journal.value?.status === 'draft' && auth.hasPermission('erp.accounting.delete'),
})

// ── Workflow ──────────────────────────────────────────────
const FLOW_STEPS = computed(() => [
  { key: 'draft',  label: t('erp.common.draft') },
  { key: 'posted', label: t('erp.journals.statusPosted') },
])
const COMPLETED_BEFORE = {
  draft:  [],
  posted: ['draft'],
  voided: ['draft', 'posted'],
}
const isVoided = computed(() => journal.value?.status === 'voided')

function stepState(key) {
  const cur = journal.value?.status
  if (!cur || cur === key) return cur === key ? 'current' : 'upcoming'
  return (COMPLETED_BEFORE[cur] || []).includes(key) ? 'completed' : 'upcoming'
}
function stepChipClass(key) {
  const s = stepState(key)
  if (s === 'completed') return 'bg-green-50 text-green-700'
  if (s === 'current')   return 'bg-primary-50 text-primary-700 ring-1 ring-primary-200'
  return 'bg-[#F7F9FC] text-[#9BA7B0]'
}

// ── Status badges ──────────────────────────────────────────
const STATUS_BADGE = {
  draft:  'bg-[#F1F5F9] text-[#637381]',
  posted: 'bg-green-50 text-green-700',
  voided: 'bg-red-50 text-red-600',
}
const STATUS_DOT = {
  draft:  'bg-slate-400',
  posted: 'bg-green-500',
  voided: 'bg-red-500',
}
function statusBadge(s) { return STATUS_BADGE[s] || STATUS_BADGE.draft }
function statusDot(s)   { return STATUS_DOT[s]   || STATUS_DOT.draft }

const stampLabel = computed(() => {
  const s = journal.value?.status
  if (s === 'draft')  return 'Draft'
  if (s === 'posted') return 'Posted'
  if (s === 'voided') return 'Voided'
  return ''
})
const stampClass = computed(() => {
  const s = journal.value?.status
  if (s === 'voided') return 'text-red-600 border-red-600'
  if (s === 'posted') return 'text-green-600 border-green-600'
  return 'text-[#1C2434] border-[#1C2434]'
})

onMounted(fetchJournal)

async function fetchJournal() {
  loading.value = true
  try {
    const { data } = await api.get(`/erp/accounting/journals/${route.params.id}`)
    journal.value = data.data.journal
  } catch {
    notFound.value = true
  } finally {
    loading.value = false
  }
}

async function doPost() {
  actionError.value = ''
  acting.value = true
  try {
    const { data } = await api.post(`/erp/accounting/journals/${journal.value.id}/post`)
    journal.value = data.data.journal
  } catch (err) {
    actionError.value = err.response?.data?.message || 'Failed to post entry'
  } finally {
    acting.value = false
  }
}

async function doVoid() {
  if (!confirm(`Void journal ${journal.value.refNo}? This cannot be undone.`)) return
  actionError.value = ''
  acting.value = true
  try {
    const { data } = await api.post(`/erp/accounting/journals/${journal.value.id}/void`)
    journal.value = data.data.journal
  } catch (err) {
    actionError.value = err.response?.data?.message || 'Failed to void entry'
  } finally {
    acting.value = false
  }
}

async function confirmDelete() {
  if (!confirm(`Delete journal ${journal.value.refNo}? This cannot be undone.`)) return
  try {
    await api.delete(`/erp/accounting/journals/${journal.value.id}`)
    router.push('/erp/accounting/journals')
  } catch (err) {
    actionError.value = err.response?.data?.message || 'Delete failed'
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
