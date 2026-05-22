<template>
  <AppLayout>
    <div class="space-y-5">

      <!-- Top action bar (hidden on print) -->
      <div class="flex items-start gap-3 print:hidden">
        <RouterLink to="/erp/accounting/journals"
          class="mt-0.5 p-2 rounded-xl text-[#9BA7B0] hover:text-[#1C2434] hover:bg-white
                 border border-transparent hover:border-[#E2E8F0] transition-all flex-shrink-0">
          <ArrowLeftIcon class="w-[18px] h-[18px]" />
        </RouterLink>
        <div class="flex-1 min-w-0">
          <div class="flex items-center gap-2.5 flex-wrap">
            <h1 class="text-xl font-bold text-[#1C2434]">
              {{ loading ? '…' : (journal?.refNo || t('erp.journals.title')) }}
            </h1>
            <span v-if="journal && !loading"
              class="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold capitalize"
              :class="statusBadge(journal.status)">
              <span class="w-1.5 h-1.5 rounded-full" :class="statusDot(journal.status)"></span>
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
            <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium bg-indigo-50 text-indigo-700">
              <DocumentTextIcon class="w-3 h-3" /> {{ journal.sourceType }}
            </span>
          </div>
        </div>
        <div v-if="journal && !loading" class="flex items-center gap-2 flex-shrink-0">
          <button @click="onPrint" type="button"
            title="Print this document"
            class="inline-flex items-center gap-1.5 px-3 py-2 text-[12px] font-semibold rounded-xl
                   text-[#637381] bg-white border border-[#E2E8F0] hover:bg-[#F7F9FC] hover:text-[#1C2434] transition-colors">
            <PrinterIcon class="w-4 h-4" />
            {{ t('common.print') }}
          </button>
          <RouterLink v-if="journal.status === 'draft'" v-can="'erp.accounting.edit'"
            :to="`/erp/accounting/journals/${journal.id}/edit`"
            class="inline-flex items-center gap-1.5 px-3 py-2 text-[12px] font-semibold rounded-xl
                   text-primary-600 bg-primary-50 hover:bg-primary-100 border border-primary-200 transition-colors">
            <PencilSquareIcon class="w-4 h-4" />
            {{ t('common.edit') }}
          </RouterLink>
          <button v-if="journal.status === 'draft'" v-can="'erp.accounting.delete'" @click="confirmDelete" type="button"
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
      <div v-else-if="notFound"
        class="flex items-start gap-3 bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3.5 rounded-xl print:hidden">
        <ExclamationCircleIcon class="w-5 h-5 flex-shrink-0 mt-0.5" />
        <span>{{ t('erp.journals.notFound') }}
          <RouterLink to="/erp/accounting/journals" class="underline ml-1">{{ t('erp.common.backToList') }}</RouterLink>
        </span>
      </div>

      <template v-else>
        <!-- Workflow strip -->
        <div class="bg-white rounded-2xl border border-[#E2E8F0] shadow-card px-5 py-3 print:hidden">
          <div class="flex items-center gap-1 flex-wrap">
            <template v-for="(step, i) in FLOW_STEPS" :key="step.key">
              <div class="flex items-center gap-2 px-2.5 py-1"
                :class="stepChipClass(step.key)">
                <CheckIcon v-if="stepState(step.key) === 'completed'" class="w-3.5 h-3.5" />
                <span v-else-if="stepState(step.key) === 'current'" class="w-2 h-2 rounded-full bg-current"></span>
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

        <!-- Document -->
        <article class="relative mx-auto bg-white border border-[#E2E8F0] shadow-card max-w-[860px] w-full
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
                {{ t('erp.journals.title') }}
              </h2>
              <dl class="mt-3 text-[12px] grid grid-cols-[auto_auto] gap-x-3 gap-y-1 justify-end">
                <dt class="text-[#9BA7B0] uppercase tracking-wider text-[10px] font-semibold pt-0.5 text-right">#</dt>
                <dd class="font-bold text-[#1C2434] tabular-nums text-right">{{ journal.refNo }}</dd>

                <dt class="text-[#9BA7B0] uppercase tracking-wider text-[10px] font-semibold pt-0.5 text-right">
                  {{ t('erp.common.date') }}
                </dt>
                <dd class="font-semibold text-[#1C2434] tabular-nums text-right">{{ fmtDate(journal.date) || '—' }}</dd>
              </dl>
            </div>
          </header>

          <!-- Description / Total -->
          <section class="px-10 py-6 grid grid-cols-1 sm:grid-cols-2 gap-x-10 gap-y-6 border-b border-dashed border-[#E2E8F0]">
            <div>
              <p class="text-[10px] font-bold text-[#9BA7B0] uppercase tracking-[0.15em] mb-2">
                {{ t('erp.journals.colDescription') }}
              </p>
              <p v-if="journal.description" class="text-[13px] text-[#374151] whitespace-pre-line leading-snug">
                {{ journal.description }}
              </p>
              <p v-else class="text-[12px] text-[#9BA7B0] italic">—</p>
            </div>
            <div>
              <p class="text-[10px] font-bold text-[#9BA7B0] uppercase tracking-[0.15em] mb-2">
                {{ t('erp.journals.totalDebitCredit') }}
              </p>
              <p class="text-[24px] font-extrabold text-[#1C2434] tabular-nums leading-tight">
                {{ fmtMoney(journal.totalDebit) }}
              </p>
              <p class="text-[11px] text-[#9BA7B0] mt-1">
                {{ journal.lines?.length || 0 }} {{ t('erp.journals.lines') }}
              </p>
            </div>
          </section>

          <!-- Metadata strip -->
          <section class="px-10 py-4 grid grid-cols-2 sm:grid-cols-3 gap-x-6 gap-y-3 border-b border-dashed border-[#E2E8F0] bg-[#FAFBFD]">
            <div>
              <p class="text-[9px] font-bold text-[#9BA7B0] uppercase tracking-[0.15em]">{{ t('erp.common.date') }}</p>
              <p class="text-[12px] font-semibold text-[#1C2434] tabular-nums mt-0.5">{{ fmtDate(journal.date) || '—' }}</p>
            </div>
            <div>
              <p class="text-[9px] font-bold text-[#9BA7B0] uppercase tracking-[0.15em]">{{ t('erp.common.status') }}</p>
              <p class="mt-0.5">
                <span class="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold capitalize"
                  :class="statusBadge(journal.status)">
                  {{ journal.status }}
                </span>
              </p>
            </div>
            <div>
              <p class="text-[9px] font-bold text-[#9BA7B0] uppercase tracking-[0.15em]">{{ t('erp.common.source') }}</p>
              <p class="text-[12px] font-semibold text-[#1C2434] mt-0.5">{{ journal.sourceType || 'Manual' }}</p>
            </div>
          </section>

          <!-- Lines -->
          <section class="px-10 pt-6 pb-2">
            <table class="w-full text-[12px]">
              <thead>
                <tr class="border-b-2 border-[#1C2434] text-[10px] font-bold text-[#1C2434] uppercase tracking-wider">
                  <th class="py-2.5 text-left w-8">#</th>
                  <th class="py-2.5 text-left">{{ t('erp.journals.colAccount') }}</th>
                  <th class="py-2.5 text-left">{{ t('erp.journals.colDescription') }}</th>
                  <th class="py-2.5 text-right w-28">{{ t('erp.journals.colDebit') }}</th>
                  <th class="py-2.5 text-right w-28">{{ t('erp.journals.colCredit') }}</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(line, idx) in (journal.lines || [])" :key="line.id"
                  class="border-b border-[#F1F5F9]">
                  <td class="py-2.5 align-top text-[#9BA7B0] tabular-nums">{{ line.lineNo || idx + 1 }}</td>
                  <td class="py-2.5 align-top">
                    <p class="font-semibold text-[#1C2434]">{{ line.account?.name || '—' }}</p>
                    <p class="text-[10px] font-mono text-[#9BA7B0]">{{ line.account?.code }}</p>
                  </td>
                  <td class="py-2.5 align-top text-[#637381] whitespace-pre-line leading-snug">{{ line.description || '—' }}</td>
                  <td class="py-2.5 align-top text-right font-semibold text-[#1C2434] tabular-nums">
                    {{ Number(line.debit) > 0 ? fmtMoney(line.debit) : '' }}
                  </td>
                  <td class="py-2.5 align-top text-right font-semibold text-[#1C2434] tabular-nums">
                    {{ Number(line.credit) > 0 ? fmtMoney(line.credit) : '' }}
                  </td>
                </tr>
                <tr v-if="!journal.lines?.length">
                  <td colspan="5" class="py-6 text-center text-[12px] text-[#9BA7B0] italic">
                    {{ t('erp.common.noItems') }}
                  </td>
                </tr>
              </tbody>
            </table>
          </section>

          <!-- Totals -->
          <section class="px-10 pb-6 flex justify-end">
            <dl class="w-full sm:w-80 text-[12px] space-y-1.5">
              <div class="flex items-center justify-between pt-2 mt-1 border-t-2 border-[#1C2434]">
                <dt class="text-[11px] font-bold text-[#1C2434] uppercase tracking-wider">{{ t('erp.journals.totals') }}</dt>
                <div class="flex gap-6">
                  <dd class="text-[14px] font-extrabold text-[#1C2434] tabular-nums">{{ fmtMoney(journal.totalDebit) }}</dd>
                  <dd class="text-[14px] font-extrabold text-[#1C2434] tabular-nums">{{ fmtMoney(journal.totalDebit) }}</dd>
                </div>
              </div>
            </dl>
          </section>

          <footer class="px-10 pt-6 pb-8 border-t border-dashed border-[#E2E8F0]">
            <div class="grid grid-cols-2 gap-10">
              <div>
                <div class="h-10 border-b border-[#1C2434]"></div>
                <p class="text-[10px] text-[#637381] mt-1.5 text-center uppercase tracking-wider">
                  Prepared By
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
        <div v-can="'erp.accounting.edit'" v-if="journal.status !== 'voided'"
          class="bg-white rounded-2xl border border-[#E2E8F0] shadow-card px-5 py-4 print:hidden
                 flex items-center justify-between flex-wrap gap-3">
          <div>
            <p class="text-[11px] font-semibold text-[#9BA7B0] uppercase tracking-wider">Next Action</p>
            <p class="text-[13px] text-[#637381] mt-0.5">Post this entry to the ledger, or void it to reverse.</p>
          </div>
          <div class="flex items-center gap-2.5">
            <button v-if="journal.status === 'draft'" @click="doPost" :disabled="acting"
              class="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold rounded-xl
                     bg-green-600 text-white hover:bg-green-700 transition-colors disabled:opacity-50">
              <ArrowPathIcon v-if="acting" class="w-4 h-4 animate-spin" />
              <CheckCircleIcon v-else class="w-4 h-4" />
              {{ t('erp.journals.postEntry') }}
            </button>
            <button @click="doVoid" :disabled="acting"
              class="px-4 py-2 text-sm font-medium border border-red-200 text-red-600
                     hover:bg-red-50 rounded-xl transition-colors disabled:opacity-50">
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
@media print {
  aside, header, nav.print\:hidden { display: none !important; }
  body { background: white !important; }
  .shadow-card { box-shadow: none !important; }
  article { max-width: none !important; margin: 0 !important; }
}
</style>
