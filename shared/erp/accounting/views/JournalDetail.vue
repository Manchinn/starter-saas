<template>
  <AppLayout>
    <div class="max-w-7xl space-y-6">

      <!-- Header -->
      <div class="flex items-start gap-4">
        <RouterLink to="/erp/accounting/journals"
          class="mt-0.5 p-2 rounded-xl text-[#9BA7B0] hover:text-[#1C2434] hover:bg-white
                 border border-transparent hover:border-[#E2E8F0] transition-all flex-shrink-0">
          <ArrowLeftIcon class="w-[18px] h-[18px]" />
        </RouterLink>
        <div class="flex-1 min-w-0">
          <div class="flex items-center gap-2.5 flex-wrap">
            <h1 class="text-xl font-bold text-[#1C2434]">{{ loading ? '…' : (journal?.refNo || t('erp.journals.titleSingular')) }}</h1>
            <span v-if="journal && !loading"
              class="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold capitalize"
              :class="statusBadge(journal.status)">
              <span class="w-1.5 h-1.5 rounded-full" :class="statusDot(journal.status)"></span>
              {{ journal.status }}
            </span>
          </div>
          <nav class="flex items-center gap-1.5 mt-1">
            <RouterLink to="/erp/accounting/journals"
              class="text-[12px] text-[#9BA7B0] hover:text-[#637381] transition-colors">
              {{ t('erp.journals.title') }}
            </RouterLink>
            <ChevronRightIcon class="w-3 h-3 text-[#CBD5E1]" />
            <span class="text-[12px] text-[#637381]">{{ journal?.refNo || '…' }}</span>
          </nav>
        </div>

        <!-- Edit button (draft only) -->
        <RouterLink v-if="journal?.status === 'draft'" v-can="'erp.accounting.edit'"
          :to="`/erp/accounting/journals/${journal.id}/edit`"
          class="flex items-center gap-1.5 px-3 py-1.5 text-sm border border-[#E2E8F0] rounded-xl
                 hover:bg-[#F7F9FC] transition text-[#374151]">
          <PencilSquareIcon class="w-4 h-4" />
          {{ t('common.edit') }}
        </RouterLink>
      </div>

      <!-- Loading -->
      <div v-if="loading" class="flex items-center justify-center py-20">
        <div class="w-7 h-7 border-2 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
      </div>

      <!-- Not found -->
      <div v-else-if="notFound"
        class="flex items-start gap-3 bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3.5 rounded-xl">
        <ExclamationCircleIcon class="w-5 h-5 flex-shrink-0 mt-0.5" />
        <span>{{ t('erp.journals.notFound') }}
          <RouterLink to="/erp/accounting/journals" class="underline ml-1">{{ t('erp.common.backToList') }}</RouterLink>
        </span>
      </div>

      <template v-else>
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">

          <!-- LEFT: Details + Lines -->
          <div class="lg:col-span-2 space-y-5">

            <!-- Summary card -->
            <div class="bg-white rounded-2xl border border-[#E2E8F0] shadow-card p-5 grid grid-cols-2 gap-4">
              <div>
                <p class="text-[11px] font-semibold text-[#637381] uppercase tracking-wider mb-1">{{ t('erp.common.date') }}</p>
                <p class="text-sm font-semibold text-[#1C2434]">{{ journal.date }}</p>
              </div>
              <div>
                <p class="text-[11px] font-semibold text-[#637381] uppercase tracking-wider mb-1">{{ t('erp.journals.totalDebitCredit') }}</p>
                <p class="text-sm font-semibold text-[#1C2434] tabular-nums">{{ fmtMoney(journal.totalDebit) }}</p>
              </div>
              <div class="col-span-2" v-if="journal.description">
                <p class="text-[11px] font-semibold text-[#637381] uppercase tracking-wider mb-1">{{ t('erp.journals.colDescription') }}</p>
                <p class="text-sm text-[#374151] whitespace-pre-line">{{ journal.description }}</p>
              </div>
            </div>

            <!-- Lines table -->
            <div class="bg-white rounded-2xl border border-[#E2E8F0] shadow-card overflow-hidden">
              <div class="px-6 py-4 border-b border-[#E2E8F0] flex items-center gap-3">
                <div class="w-8 h-8 rounded-xl bg-indigo-50 flex items-center justify-center flex-shrink-0">
                  <TableCellsIcon class="w-4 h-4 text-indigo-600" />
                </div>
                <div>
                  <h2 class="text-sm font-semibold text-[#1C2434]">{{ t('erp.journals.lines') }}</h2>
                  <p class="text-[11px] text-[#9BA7B0]">{{ journal.lines?.length || 0 }} {{ t('erp.journals.linesCount') }}</p>
                </div>
              </div>
              <table class="w-full text-sm">
                <thead class="bg-[#F7F9FC] border-b border-[#E2E8F0]">
                  <tr>
                    <th class="px-5 py-3 text-left text-[11px] font-semibold text-[#637381] uppercase tracking-wider">#</th>
                    <th class="px-5 py-3 text-left text-[11px] font-semibold text-[#637381] uppercase tracking-wider">{{ t('erp.journals.colAccount') }}</th>
                    <th class="px-5 py-3 text-left text-[11px] font-semibold text-[#637381] uppercase tracking-wider">{{ t('erp.journals.colDescription') }}</th>
                    <th class="px-5 py-3 text-right text-[11px] font-semibold text-[#637381] uppercase tracking-wider">{{ t('erp.journals.colDebit') }}</th>
                    <th class="px-5 py-3 text-right text-[11px] font-semibold text-[#637381] uppercase tracking-wider">{{ t('erp.journals.colCredit') }}</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-[#E2E8F0]">
                  <tr v-for="line in journal.lines" :key="line.id" class="hover:bg-[#F7F9FC] transition-colors">
                    <td class="px-5 py-3.5 text-xs text-[#9BA7B0]">{{ line.lineNo }}</td>
                    <td class="px-5 py-3.5">
                      <p class="text-sm font-medium text-[#1C2434]">{{ line.account?.name || '—' }}</p>
                      <p class="text-[11px] font-mono text-[#9BA7B0]">{{ line.account?.code }}</p>
                    </td>
                    <td class="px-5 py-3.5 text-sm text-[#637381]">{{ line.description || '—' }}</td>
                    <td class="px-5 py-3.5 text-right font-semibold tabular-nums text-[#1C2434]">
                      {{ Number(line.debit) > 0 ? fmtMoney(line.debit) : '' }}
                    </td>
                    <td class="px-5 py-3.5 text-right font-semibold tabular-nums text-[#1C2434]">
                      {{ Number(line.credit) > 0 ? fmtMoney(line.credit) : '' }}
                    </td>
                  </tr>
                </tbody>
                <tfoot class="border-t border-[#E2E8F0] bg-[#F7F9FC]">
                  <tr>
                    <td colspan="3" class="px-5 py-3.5 text-sm font-semibold text-[#637381] text-right">{{ t('erp.journals.total') }}</td>
                    <td class="px-5 py-3.5 text-right font-bold text-[#1C2434] tabular-nums">{{ fmtMoney(journal.totalDebit) }}</td>
                    <td class="px-5 py-3.5 text-right font-bold text-[#1C2434] tabular-nums">{{ fmtMoney(journal.totalDebit) }}</td>
                  </tr>
                </tfoot>
              </table>
            </div>

          </div>

          <!-- RIGHT: Workflow -->
          <div class="space-y-4">

            <div class="bg-white rounded-2xl border border-[#E2E8F0] shadow-card overflow-hidden">
              <div class="px-5 py-4 border-b border-[#E2E8F0] flex items-center gap-2.5">
                <BoltIcon class="w-4 h-4 text-[#9BA7B0]" />
                <h3 class="text-sm font-semibold text-[#1C2434]">{{ t('erp.common.workflow') }}</h3>
                <span class="ml-auto inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold capitalize"
                  :class="statusBadge(journal.status)">
                  <span class="w-1.5 h-1.5 rounded-full" :class="statusDot(journal.status)"></span>
                  {{ journal.status }}
                </span>
              </div>

              <!-- Stepper -->
              <div class="px-5 py-5">
                <template v-for="(step, i) in FLOW_STEPS" :key="step.key">
                  <div class="flex items-center gap-3">
                    <div class="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ring-2 flex-shrink-0 transition-all"
                      :class="stepNodeClass(step.key)">
                      <CheckIcon v-if="stepState(step.key) === 'completed'" class="w-3.5 h-3.5" />
                      <span v-else-if="stepState(step.key) === 'current'" class="w-2 h-2 rounded-full bg-white"></span>
                      <span v-else class="text-[10px]">{{ i + 1 }}</span>
                    </div>
                    <div class="flex-1 py-1">
                      <p class="text-xs font-semibold" :class="stepLabelClass(step.key)">{{ step.label }}</p>
                      <p v-if="stepState(step.key) === 'current' && !isVoided"
                        class="text-[10px] text-primary-400 mt-0.5">{{ t('erp.common.currentStatus') }}</p>
                    </div>
                  </div>
                  <div v-if="i < FLOW_STEPS.length - 1" class="flex gap-3">
                    <div class="w-7 flex justify-center flex-shrink-0">
                      <div class="w-0.5 h-5 rounded-full" :class="connectorClass(step.key)"></div>
                    </div>
                  </div>
                </template>

                <!-- Voided terminal -->
                <template v-if="isVoided">
                  <div class="flex gap-3">
                    <div class="w-7 flex justify-center flex-shrink-0">
                      <div class="w-0.5 h-4 rounded-full bg-red-200"></div>
                    </div>
                  </div>
                  <div class="flex items-center gap-3">
                    <div class="w-7 h-7 rounded-full bg-red-100 ring-2 ring-red-200 flex items-center justify-center flex-shrink-0">
                      <XMarkIcon class="w-3.5 h-3.5 text-red-500" />
                    </div>
                    <div class="py-1">
                      <p class="text-xs font-semibold text-red-600">{{ t('erp.journals.statusVoided') }}</p>
                      <p class="text-[10px] text-red-400 mt-0.5">{{ t('erp.common.terminalState') }}</p>
                    </div>
                  </div>
                </template>
              </div>

              <!-- Actions -->
              <div v-can="'erp.accounting.edit'" v-if="journal.status !== 'voided'"
                class="border-t border-[#E2E8F0] px-5 pb-5 pt-4 space-y-2.5">
                <p class="text-[11px] font-semibold text-[#637381] uppercase tracking-wider mb-3">{{ t('erp.common.actions') }}</p>

                <button v-if="journal.status === 'draft'" @click="doPost" :disabled="acting"
                  class="w-full py-2.5 text-sm font-semibold rounded-xl bg-green-600 text-white
                         hover:bg-green-700 transition-colors disabled:opacity-50
                         flex items-center justify-center gap-2">
                  <ArrowPathIcon v-if="acting" class="w-4 h-4 animate-spin" />
                  <template v-else>
                    <CheckCircleIcon class="w-4 h-4" />
                    {{ t('erp.journals.postEntry') }}
                  </template>
                </button>

                <button @click="doVoid" :disabled="acting"
                  class="w-full py-2 text-sm font-medium border border-red-200 text-red-600
                         hover:bg-red-50 rounded-xl transition-colors disabled:opacity-50">
                  {{ t('erp.journals.voidEntry') }}
                </button>

                <p v-if="actionError" class="text-xs text-red-600">{{ actionError }}</p>
              </div>
            </div>

            <!-- Delete (draft only) -->
            <div v-if="journal.status === 'draft'" v-can="'erp.accounting.delete'"
              class="bg-white rounded-2xl border border-[#E2E8F0] shadow-card p-4">
              <button @click="confirmDelete"
                class="w-full py-2 text-sm font-medium text-red-500 border border-red-200
                       rounded-xl hover:bg-red-50 transition-colors flex items-center justify-center gap-2">
                <TrashIcon class="w-4 h-4" />
                {{ t('erp.journals.deleteEntry') }}
              </button>
            </div>

          </div>
        </div>
      </template>
    </div>
  </AppLayout>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import {
  ArrowLeftIcon, ChevronRightIcon, CheckIcon, XMarkIcon, TrashIcon,
  BoltIcon, ArrowPathIcon, ExclamationCircleIcon, CheckCircleIcon,
  PencilSquareIcon, TableCellsIcon,
} from '@heroicons/vue/24/outline'
import AppLayout from '@/layouts/AppLayout.vue'
import api from '@/api'
import { fmtMoney } from '@/utils/fmt'

const { t } = useI18n()
const route       = useRoute()
const router      = useRouter()
const journal     = ref(null)
const loading     = ref(true)
const notFound    = ref(false)
const acting      = ref(false)
const actionError = ref('')

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
  if (!cur) return 'upcoming'
  if (cur === key) return 'current'
  return (COMPLETED_BEFORE[cur] || []).includes(key) ? 'completed' : 'upcoming'
}
function stepNodeClass(key) {
  const s = stepState(key)
  if (s === 'completed') return 'bg-green-500 text-white ring-green-200'
  if (s === 'current')   return 'bg-primary-500 text-white ring-primary-200'
  return 'bg-white text-[#CBD5E1] ring-[#E2E8F0]'
}
function stepLabelClass(key) {
  const s = stepState(key)
  if (s === 'completed') return 'text-green-700'
  if (s === 'current')   return 'text-primary-600 font-bold'
  return 'text-[#9BA7B0]'
}
function connectorClass(key) {
  const s = stepState(key)
  if (s === 'completed') return 'bg-green-300'
  if (s === 'current')   return 'bg-primary-200'
  return 'bg-[#E2E8F0]'
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

// ── Data ──────────────────────────────────────────────────
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
    actionError.value = err.response?.data?.message || t('erp.journals.errPost')
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
    actionError.value = err.response?.data?.message || t('erp.journals.errVoid')
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
    actionError.value = err.response?.data?.message || t('erp.journals.errDelete')
  }
}
</script>
