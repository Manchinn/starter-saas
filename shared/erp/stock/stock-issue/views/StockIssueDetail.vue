<template>
  <AppLayout>
    <div class="space-y-5">

      <!-- Top action bar (hidden on print) -->
      <div class="flex items-start gap-3 print:hidden">
        <RouterLink to="/erp/stock-issue"
          class="mt-0.5 p-2 rounded-xl text-[#9BA7B0] hover:text-[#1C2434] hover:bg-white
                 border border-transparent hover:border-[#E2E8F0] transition-all flex-shrink-0">
          <ArrowLeftIcon class="w-[18px] h-[18px]" />
        </RouterLink>
        <div class="flex-1 min-w-0">
          <div class="flex items-center gap-2.5 flex-wrap">
            <h1 class="text-xl font-bold text-[#1C2434]">
              {{ loading ? '…' : (issue?.refNo || t('erp.stockIssue.detail')) }}
            </h1>
            <span v-if="issue && !loading"
              class="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold capitalize"
              :class="statusBadge(issue.status)">
              <span class="w-1.5 h-1.5 rounded-full" :class="statusDot(issue.status)"></span>
              {{ issue.status }}
            </span>
          </div>
          <nav class="flex items-center gap-1.5 mt-1">
            <RouterLink to="/erp/stock-issue" class="text-[12px] text-[#9BA7B0] hover:text-[#637381] transition-colors">
              {{ t('erp.stockIssue.title') }}
            </RouterLink>
            <ChevronRightIcon class="w-3 h-3 text-[#CBD5E1]" />
            <span class="text-[12px] text-[#637381]">{{ issue?.refNo || '…' }}</span>
          </nav>
        </div>
        <div v-if="issue && !loading" class="flex items-center gap-2 flex-shrink-0">
          <button @click="onPrint" type="button"
            class="inline-flex items-center gap-1.5 px-3 py-2 text-[12px] font-semibold rounded-xl
                   text-[#637381] bg-white border border-[#E2E8F0] hover:bg-[#F7F9FC] hover:text-[#1C2434] transition-colors">
            <PrinterIcon class="w-4 h-4" />
            {{ t('common.print') }}
          </button>
          <RouterLink v-if="issue.status === 'draft'" v-can="'erp.stock.edit'" :to="`/erp/stock-issue/${issue.id}/edit`"
            class="inline-flex items-center gap-1.5 px-3 py-2 text-[12px] font-semibold rounded-xl
                   text-primary-600 bg-primary-50 hover:bg-primary-100 border border-primary-200 transition-colors">
            <PencilSquareIcon class="w-4 h-4" />
            {{ t('common.edit') }}
          </RouterLink>
          <button v-if="issue.status === 'draft'" v-can="'erp.stock.delete'" @click="deleteIssue" type="button"
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
      <div v-else-if="!issue"
        class="flex items-start gap-3 bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3.5 rounded-xl print:hidden">
        <ExclamationCircleIcon class="w-5 h-5 flex-shrink-0 mt-0.5" />
        <span>{{ t('erp.stockIssue.notFound') }}
          <RouterLink to="/erp/stock-issue" class="underline ml-1">{{ t('erp.common.backToList') }}</RouterLink>
        </span>
      </div>

      <template v-else>
        <!-- Workflow strip (hidden on print) -->
        <div class="bg-white rounded-2xl border border-[#E2E8F0] shadow-card px-5 py-3 print:hidden">
          <div class="flex items-center gap-1 flex-wrap">
            <template v-for="(step, i) in FLOW_STEPS" :key="step.key">
              <div class="flex items-center gap-2 px-2.5 py-1 rounded-lg" :class="stepChipClass(step.key)">
                <CheckIcon v-if="stepState(step.key) === 'completed'" class="w-3.5 h-3.5" />
                <span v-else-if="stepState(step.key) === 'current'" class="w-2 h-2 rounded-full bg-current"></span>
                <span v-else class="text-[10px] font-bold opacity-50">{{ i + 1 }}</span>
                <span class="text-[12px] font-semibold">{{ step.label }}</span>
              </div>
              <ChevronRightIcon v-if="i < FLOW_STEPS.length - 1" class="w-3 h-3 text-[#CBD5E1] flex-shrink-0" />
            </template>
          </div>
        </div>

        <!-- ── Document ─────────────────────────────────────────── -->
        <article class="relative mx-auto bg-white border border-[#E2E8F0] shadow-card max-w-[860px] w-full
                        print:border-0 print:shadow-none print:max-w-none print:mx-0 print:rounded-none rounded-2xl
                        overflow-hidden">

          <!-- DRAFT diagonal stamp -->
          <div v-if="issue.status === 'draft'"
            class="pointer-events-none absolute inset-0 flex items-center justify-center z-10"
            aria-hidden="true">
            <span class="select-none font-black tracking-[0.2em] uppercase border-[6px] border-amber-400 text-amber-500
                         rounded-md px-6 py-2 text-[64px] sm:text-[88px] -rotate-[18deg] opacity-[0.12]">
              Draft
            </span>
          </div>

          <!-- Document header: company + title block -->
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
                  <p v-if="companyPhone">{{ t('erp.orders.docPhoneAbbr') }} {{ companyPhone }}</p>
                  <p v-if="companyEmail">{{ companyEmail }}</p>
                  <p v-if="companyTaxId" class="tabular-nums">
                    <span class="text-[#9BA7B0]">{{ t('erp.orders.docTaxId') }}</span> {{ companyTaxId }}
                  </p>
                </div>
              </div>
            </div>
            <div class="text-right flex-shrink-0">
              <h2 class="text-[22px] font-extrabold tracking-[0.18em] text-[#1C2434] uppercase">
                {{ t('erp.stockIssue.documentTitle') }}
              </h2>
              <dl class="mt-3 text-[12px] grid grid-cols-[auto_auto] gap-x-3 gap-y-1 justify-end">
                <dt class="text-[#9BA7B0] uppercase tracking-wider text-[10px] font-semibold pt-0.5 text-right">#</dt>
                <dd class="font-bold text-[#1C2434] tabular-nums text-right">{{ issue.refNo }}</dd>

                <dt class="text-[#9BA7B0] uppercase tracking-wider text-[10px] font-semibold pt-0.5 text-right">
                  {{ t('erp.common.date') }}
                </dt>
                <dd class="font-semibold text-[#1C2434] tabular-nums text-right">{{ fmtDate(issue.date) || '—' }}</dd>
              </dl>
            </div>
          </header>

          <!-- Store / Reason meta -->
          <section class="px-10 py-6 grid grid-cols-1 sm:grid-cols-2 gap-x-10 gap-y-4 border-b border-dashed border-[#E2E8F0]">
            <div>
              <p class="text-[10px] font-bold text-[#9BA7B0] uppercase tracking-[0.15em] mb-1.5">
                {{ t('erp.common.store') }}
              </p>
              <p class="text-[14px] font-bold text-[#1C2434]">{{ issue.store?.name || '—' }}</p>
              <p v-if="issue.store?.code" class="text-[11px] text-[#637381] font-mono mt-0.5">{{ issue.store.code }}</p>
            </div>
            <div>
              <p class="text-[10px] font-bold text-[#9BA7B0] uppercase tracking-[0.15em] mb-1.5">
                {{ t('erp.stockIssue.reason') }}
              </p>
              <p class="text-[14px] font-semibold text-[#1C2434]">{{ issue.reason || '—' }}</p>
            </div>
          </section>

          <!-- Line items table -->
          <section class="px-10 pt-6 pb-2">
            <table class="w-full text-[12px]">
              <thead>
                <tr class="border-b-2 border-[#1C2434] text-[10px] font-bold text-[#1C2434] uppercase tracking-wider">
                  <th class="py-2.5 text-left w-8">#</th>
                  <th class="py-2.5 text-left w-28">{{ t('erp.stockIssue.colSku') }}</th>
                  <th class="py-2.5 text-left">{{ t('erp.common.product') }}</th>
                  <th class="py-2.5 text-right w-20">{{ t('erp.stockIssue.colQtyIssued') }}</th>
                  <th class="py-2.5 text-left w-24 pl-3">{{ t('erp.common.batchId') }}</th>
                  <th class="py-2.5 text-left w-24 pl-3">{{ t('erp.common.expiryDate') }}</th>
                  <th class="py-2.5 text-left w-32 pl-3">{{ t('erp.common.notes') }}</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(item, idx) in (issue.items || [])" :key="item.id" class="border-b border-[#F1F5F9]">
                  <td class="py-2.5 align-top text-[#9BA7B0] tabular-nums">{{ idx + 1 }}</td>
                  <td class="py-2.5 align-top text-[#637381] font-mono text-[11px]">{{ item.product?.sku || '—' }}</td>
                  <td class="py-2.5 align-top">
                    <span class="font-semibold text-[#1C2434]">{{ item.product?.name || '—' }}</span>
                  </td>
                  <td class="py-2.5 align-top text-right font-semibold text-red-600 tabular-nums">
                    −{{ Number(item.qty) }}
                  </td>
                  <td class="py-2.5 align-top text-[#637381] font-mono text-[11px] pl-3">{{ item.batchId || '—' }}</td>
                  <td class="py-2.5 align-top text-[#637381] text-[11px] pl-3">{{ item.expiryDate || '—' }}</td>
                  <td class="py-2.5 align-top text-[#637381] pl-3">{{ item.notes || '—' }}</td>
                </tr>
                <tr v-if="!(issue.items || []).length">
                  <td colspan="7" class="py-6 text-center text-[12px] text-[#9BA7B0] italic">
                    {{ t('erp.common.noItems') }}
                  </td>
                </tr>
              </tbody>
            </table>
          </section>

          <!-- Totals block — right-aligned -->
          <section class="px-10 pb-6 flex justify-end">
            <dl class="w-full sm:w-72 text-[12px] space-y-1.5">
              <div class="flex items-center justify-between">
                <dt class="text-[#637381]">{{ t('erp.common.items') }}</dt>
                <dd class="font-semibold text-[#1C2434] tabular-nums">{{ (issue.items || []).length }}</dd>
              </div>
              <div class="flex items-center justify-between pt-2 mt-1 border-t-2 border-[#1C2434]">
                <dt class="text-[11px] font-bold text-[#1C2434] uppercase tracking-wider">{{ t('erp.stockIssue.totalIssueQty') }}</dt>
                <dd class="text-[16px] font-extrabold tabular-nums text-red-600">−{{ totalQty }}</dd>
              </div>
            </dl>
          </section>

          <!-- Notes -->
          <section v-if="issue.notes" class="px-10 pt-2 pb-6 border-t border-dashed border-[#E2E8F0]">
            <p class="text-[10px] font-bold text-[#9BA7B0] uppercase tracking-[0.15em] mb-1.5">
              {{ t('erp.common.notes') }}
            </p>
            <p class="text-[12px] text-[#374151] whitespace-pre-line leading-relaxed">{{ issue.notes }}</p>
          </section>

          <!-- Signatures -->
          <footer class="px-10 pt-6 pb-8 border-t border-dashed border-[#E2E8F0]">
            <div class="grid grid-cols-2 gap-10">
              <div>
                <div class="h-10 border-b border-[#1C2434]"></div>
                <p class="text-[10px] text-[#637381] mt-1.5 text-center uppercase tracking-wider">
                  {{ t('erp.stockIssue.docPreparedBy') }}
                </p>
              </div>
              <div>
                <div class="h-10 border-b border-[#1C2434]"></div>
                <p class="text-[10px] text-[#637381] mt-1.5 text-center uppercase tracking-wider">
                  {{ t('erp.stockIssue.docApprovedBy') }}
                </p>
              </div>
            </div>
          </footer>
        </article>

        <!-- Status action (hidden on print) -->
        <div v-if="issue.status === 'draft'" v-can="'erp.stock.edit'"
          class="bg-white rounded-2xl border border-[#E2E8F0] shadow-card px-5 py-4 print:hidden
                 flex items-center justify-between flex-wrap gap-3">
          <div>
            <p class="text-[11px] font-semibold text-[#9BA7B0] uppercase tracking-wider">
              {{ t('erp.orders.nextAction') }}
            </p>
            <p class="text-[13px] text-[#637381] mt-0.5">
              {{ t('erp.stockIssue.confirmHint') }}
            </p>
          </div>
          <button @click="confirmIssue" :disabled="confirming"
            class="px-4 py-2.5 text-sm font-semibold rounded-xl
                   bg-green-600 text-white hover:bg-green-700 disabled:opacity-50
                   flex items-center gap-2 transition-colors">
            <ArrowPathIcon v-if="confirming" class="w-4 h-4 animate-spin" />
            <CheckIcon v-else class="w-4 h-4" />
            {{ confirming ? t('erp.common.confirming') : t('erp.stockIssue.confirmIssue') }}
          </button>
        </div>
        <p v-if="error" class="text-xs text-red-600 print:hidden">{{ error }}</p>

        <ActivityTimeline ref-type="StockIssue" :ref-id="issue.id" class="print:hidden" />
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
} from '@heroicons/vue/24/outline'
import AppLayout from '@/layouts/AppLayout.vue'
import ActivityTimeline from '@/components/ActivityTimeline.vue'
import api from '@/api'
import { fmtDate } from '@/utils/fmt'
import { useAuthStore } from '@/stores/auth'

const { t }    = useI18n()
const route    = useRoute()
const router   = useRouter()
const auth     = useAuthStore()

const issue       = ref(null)
const loading     = ref(true)
const confirming  = ref(false)
const error       = ref('')

const FLOW_STEPS = [
  { key: 'draft',     label: 'Draft' },
  { key: 'confirmed', label: 'Confirmed' },
]

const stepState = (key) => {
  if (!issue.value) return 'pending'
  const status = issue.value.status
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

const totalQty = computed(() => (issue.value?.items || []).reduce((s, i) => s + (Number(i.qty) || 0), 0))

async function load() {
  loading.value = true
  try {
    const { data } = await api.get(`/erp/stock-issue/${route.params.id}`)
    issue.value = data.data.issue
  } catch {
    issue.value = null
  } finally {
    loading.value = false
  }
}
onMounted(load)

function onPrint() {
  window.print()
}

async function confirmIssue() {
  if (!confirm(`Confirm ${issue.value.refNo}? Stock will be deducted and this cannot be undone.`)) return
  confirming.value = true
  error.value = ''
  try {
    await api.post(`/erp/stock-issue/${route.params.id}/confirm`)
    await load()
  } catch (err) {
    error.value = err.response?.data?.message || 'Failed to confirm'
  } finally {
    confirming.value = false
  }
}

async function deleteIssue() {
  if (!confirm(`Delete ${issue.value.refNo}? This cannot be undone.`)) return
  try {
    await api.delete(`/erp/stock-issue/${route.params.id}`)
    router.push('/erp/stock-issue')
  } catch (err) {
    error.value = err.response?.data?.message || 'Delete failed'
  }
}
</script>
