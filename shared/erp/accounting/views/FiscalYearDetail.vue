<template>
  <AppLayout>
    <div class="space-y-6">

      <!-- Header -->
      <div class="flex items-start gap-4">
        <RouterLink to="/erp/accounting/fiscal-years"
          class="mt-0.5 p-2 rounded-xl text-[#9BA7B0] hover:text-[#1C2434] hover:bg-white
                 border border-transparent hover:border-[#E2E8F0] transition-all flex-shrink-0">
          <ArrowLeftIcon class="w-[18px] h-[18px]" />
        </RouterLink>
        <div class="flex-1 min-w-0">
          <div class="flex items-center gap-2.5 flex-wrap">
            <h1 class="text-xl font-bold text-[#1C2434]">{{ loading ? '…' : (fy?.name || t('erp.fiscalYears.title')) }}</h1>
            <span v-if="fy && !loading"
              class="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold capitalize"
              :class="statusBadge(fy.status)">
              <LockClosedIcon v-if="fy.status === 'closed'" class="w-3 h-3" />
              <span v-else class="w-1.5 h-1.5 rounded-full bg-green-500"></span>
              {{ fy.status }}
            </span>
          </div>
          <nav class="flex items-center gap-1.5 mt-1">
            <RouterLink to="/erp/accounting/fiscal-years" class="text-[12px] text-[#9BA7B0] hover:text-[#637381] transition-colors">
              {{ t('erp.fiscalYears.title') }}
            </RouterLink>
            <ChevronRightIcon class="w-3 h-3 text-[#CBD5E1]" />
            <span class="text-[12px] text-[#637381]">{{ fy?.name || '…' }}</span>
          </nav>
        </div>
      </div>

      <!-- Loading -->
      <div v-if="loading" class="flex items-center justify-center py-20">
        <div class="w-7 h-7 border-2 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
      </div>

      <!-- Not found -->
      <div v-else-if="notFound"
        class="flex items-start gap-3 bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3.5 rounded-xl">
        <ExclamationCircleIcon class="w-5 h-5 flex-shrink-0 mt-0.5" />
        <span>{{ t('erp.fiscalYears.notFound') }}
          <RouterLink to="/erp/accounting/fiscal-years" class="underline ml-1">{{ t('erp.common.backToList') }}</RouterLink>
        </span>
      </div>

      <template v-else>
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">

          <!-- LEFT -->
          <div class="lg:col-span-2 space-y-5">

            <!-- Info card -->
            <div class="bg-white rounded-2xl border border-[#E2E8F0] shadow-card overflow-hidden">
              <div class="px-6 py-4 border-b border-[#E2E8F0] flex items-center gap-3">
                <div class="w-8 h-8 rounded-xl bg-indigo-50 flex items-center justify-center flex-shrink-0">
                  <CalendarDaysIcon class="w-4 h-4 text-indigo-600" />
                </div>
                <h2 class="text-sm font-semibold text-[#1C2434]">{{ t('erp.fiscalYears.details') }}</h2>
              </div>
              <div class="px-6 py-5">
                <dl class="grid grid-cols-2 gap-x-8 gap-y-4">
                  <div>
                    <dt class="text-[11px] font-semibold text-[#9BA7B0] uppercase tracking-wider mb-0.5">{{ t('erp.fiscalYears.colName') }}</dt>
                    <dd class="text-sm font-semibold text-[#1C2434]">{{ fy.name }}</dd>
                  </div>
                  <div>
                    <dt class="text-[11px] font-semibold text-[#9BA7B0] uppercase tracking-wider mb-0.5">{{ t('common.status') }}</dt>
                    <dd>
                      <span class="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold capitalize"
                        :class="statusBadge(fy.status)">
                        <LockClosedIcon v-if="fy.status === 'closed'" class="w-3 h-3" />
                        <span v-else class="w-1.5 h-1.5 rounded-full bg-green-500"></span>
                        {{ fy.status }}
                      </span>
                    </dd>
                  </div>
                  <div>
                    <dt class="text-[11px] font-semibold text-[#9BA7B0] uppercase tracking-wider mb-0.5">{{ t('erp.fiscalYears.colStartDate') }}</dt>
                    <dd class="text-sm text-[#1C2434]">{{ fy.startDate }}</dd>
                  </div>
                  <div>
                    <dt class="text-[11px] font-semibold text-[#9BA7B0] uppercase tracking-wider mb-0.5">{{ t('erp.fiscalYears.colEndDate') }}</dt>
                    <dd class="text-sm text-[#1C2434]">{{ fy.endDate }}</dd>
                  </div>
                  <div class="col-span-2">
                    <dt class="text-[11px] font-semibold text-[#9BA7B0] uppercase tracking-wider mb-0.5">{{ t('erp.fiscalYears.colDuration') }}</dt>
                    <dd class="text-sm text-[#637381]">{{ duration }}</dd>
                  </div>
                </dl>
              </div>
            </div>

            <!-- Edit form (open only) -->
            <div v-if="fy.status === 'open'" v-can="'erp.accounting.edit'"
              class="bg-white rounded-2xl border border-[#E2E8F0] shadow-card overflow-hidden">
              <div class="px-6 py-4 border-b border-[#E2E8F0] flex items-center gap-3">
                <div class="w-8 h-8 rounded-xl bg-primary-50 flex items-center justify-center flex-shrink-0">
                  <PencilSquareIcon class="w-4 h-4 text-primary-500" />
                </div>
                <h2 class="text-sm font-semibold text-[#1C2434]">{{ t('erp.fiscalYears.editDetails') }}</h2>
              </div>
              <div class="px-6 py-5 space-y-5">
                <div>
                  <label class="block text-[11px] font-semibold text-[#637381] uppercase tracking-wider mb-1.5">{{ t('erp.fiscalYears.colName') }}</label>
                  <input v-model="editForm.name" type="text"
                    class="w-full px-3.5 py-2.5 border border-[#E2E8F0] text-sm text-[#1C2434]
                           focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400 transition-colors" />
                </div>
                <div class="grid grid-cols-2 gap-5">
                  <div>
                    <label class="block text-[11px] font-semibold text-[#637381] uppercase tracking-wider mb-1.5">{{ t('erp.fiscalYears.colStartDate') }}</label>
                    <input v-model="editForm.startDate" type="date"
                      class="w-full px-3.5 py-2.5 border border-[#E2E8F0] text-sm text-[#1C2434]
                             focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400 transition-colors" />
                  </div>
                  <div>
                    <label class="block text-[11px] font-semibold text-[#637381] uppercase tracking-wider mb-1.5">{{ t('erp.fiscalYears.colEndDate') }}</label>
                    <input v-model="editForm.endDate" type="date"
                      class="w-full px-3.5 py-2.5 border border-[#E2E8F0] text-sm text-[#1C2434]
                             focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400 transition-colors" />
                  </div>
                </div>
                <div>
                  <label class="block text-[11px] font-semibold text-[#637381] uppercase tracking-wider mb-1.5">{{ t('erp.common.notes') }}</label>
                  <textarea v-model="editForm.notes" rows="2"
                    class="w-full px-3.5 py-2.5 border border-[#E2E8F0] text-sm text-[#1C2434]
                           focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400
                           transition-colors resize-none" />
                </div>
                <div class="flex items-center justify-between pt-1">
                  <p v-if="editError" class="text-xs text-red-600">{{ editError }}</p>
                  <div v-else></div>
                  <button @click="saveEdit" :disabled="saving"
                    class="inline-flex items-center gap-2 px-5 py-2 text-sm font-semibold
                           bg-primary-500 text-white rounded-xl hover:bg-primary-600 disabled:opacity-50 transition-colors">
                    <ArrowPathIcon v-if="saving" class="w-4 h-4 animate-spin" />
                    <CheckIcon v-else class="w-4 h-4" />
                    {{ saving ? t('erp.fiscalYears.saving') : t('erp.fiscalYears.saveChanges') }}
                  </button>
                </div>
              </div>
            </div>

            <!-- Notes (closed) -->
            <div v-if="fy.notes && fy.status === 'closed'"
              class="bg-white rounded-2xl border border-[#E2E8F0] shadow-card p-5">
              <p class="text-[11px] font-semibold text-[#637381] uppercase tracking-wider mb-2">{{ t('erp.common.notes') }}</p>
              <p class="text-sm text-[#374151] whitespace-pre-line">{{ fy.notes }}</p>
            </div>

          </div>

          <!-- RIGHT: Workflow -->
          <div class="space-y-4">

            <div class="bg-white rounded-2xl border border-[#E2E8F0] shadow-card overflow-hidden">
              <div class="px-5 py-4 border-b border-[#E2E8F0] flex items-center gap-2.5">
                <BoltIcon class="w-4 h-4 text-[#9BA7B0]" />
                <h3 class="text-sm font-semibold text-[#1C2434]">{{ t('erp.common.workflow') }}</h3>
              </div>

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
                      <p v-if="stepState(step.key) === 'current'"
                        class="text-[10px] text-primary-400 mt-0.5">{{ t('erp.common.currentStatus') }}</p>
                    </div>
                  </div>
                  <div v-if="i < FLOW_STEPS.length - 1" class="flex gap-3">
                    <div class="w-7 flex justify-center flex-shrink-0">
                      <div class="w-0.5 h-5 rounded-full" :class="connectorClass(step.key)"></div>
                    </div>
                  </div>
                </template>
              </div>

              <!-- Close action -->
              <div v-if="fy.status === 'open'" v-can="'erp.accounting.edit'"
                class="border-t border-[#E2E8F0] px-5 pb-5 pt-4 space-y-2.5">
                <p class="text-[11px] font-semibold text-[#637381] uppercase tracking-wider mb-3">{{ t('erp.common.actions') }}</p>
                <button @click="confirmClose" :disabled="updatingStatus"
                  class="w-full py-2.5 text-sm font-semibold rounded-xl bg-slate-700 text-white
                         hover:bg-slate-800 transition-colors disabled:opacity-50
                         flex items-center justify-center gap-2">
                  <ArrowPathIcon v-if="updatingStatus" class="w-4 h-4 animate-spin" />
                  <LockClosedIcon v-else class="w-4 h-4" />
                  {{ t('erp.fiscalYears.closeFiscalYear') }}
                </button>
                <p class="text-[10px] text-[#9BA7B0] text-center">{{ t('erp.fiscalYears.closeWarning') }}</p>
                <p v-if="statusError" class="text-xs text-red-600">{{ statusError }}</p>
              </div>
            </div>

            <!-- Delete (open only) -->
            <div v-if="fy.status === 'open'" v-can="'erp.accounting.delete'"
              class="bg-white rounded-2xl border border-[#E2E8F0] shadow-card p-4">
              <button @click="confirmDelete"
                class="w-full py-2 text-sm font-medium text-red-500 border border-red-200
                       rounded-xl hover:bg-red-50 transition-colors flex items-center justify-center gap-2">
                <TrashIcon class="w-4 h-4" />
                {{ t('erp.fiscalYears.deleteFiscalYear') }}
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
  ArrowLeftIcon, ChevronRightIcon, CalendarDaysIcon, LockClosedIcon,
  CheckIcon, TrashIcon, BoltIcon, ArrowPathIcon, ExclamationCircleIcon,
  PencilSquareIcon,
} from '@heroicons/vue/24/outline'
import AppLayout from '@/layouts/AppLayout.vue'
import api from '@/api'

const { t } = useI18n()
const route          = useRoute()
const router         = useRouter()
const fy             = ref(null)
const loading        = ref(true)
const notFound       = ref(false)
const updatingStatus = ref(false)
const statusError    = ref('')
const saving         = ref(false)
const editError      = ref('')

const editForm = ref({ name: '', startDate: '', endDate: '', notes: '' })

// ── Workflow ──────────────────────────────────────────────
const FLOW_STEPS = computed(() => [
  { key: 'open',   label: t('erp.fiscalYears.statusOpen') },
  { key: 'closed', label: t('erp.fiscalYears.statusClosed') },
])

function stepState(key) {
  const cur = fy.value?.status
  if (!cur) return 'upcoming'
  if (cur === key) return 'current'
  if (key === 'open' && cur === 'closed') return 'completed'
  return 'upcoming'
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

// ── Status badge ──────────────────────────────────────────
const STATUS_BADGE = {
  open:   'bg-green-50 text-green-700',
  closed: 'bg-[#F1F5F9] text-[#637381]',
}
function statusBadge(s) { return STATUS_BADGE[s] || STATUS_BADGE.open }

// ── Duration ──────────────────────────────────────────────
const duration = computed(() => {
  if (!fy.value) return ''
  const ms   = new Date(fy.value.endDate) - new Date(fy.value.startDate)
  const days = Math.round(ms / 86_400_000) + 1
  return `${fy.value.startDate} → ${fy.value.endDate} (${days} days)`
})

// ── Data ──────────────────────────────────────────────────
onMounted(fetchFiscalYear)

async function fetchFiscalYear() {
  loading.value = true
  try {
    const { data } = await api.get(`/erp/accounting/fiscal-years/${route.params.id}`)
    fy.value = data.data.fiscalYear
    editForm.value = {
      name:      fy.value.name,
      startDate: fy.value.startDate,
      endDate:   fy.value.endDate,
      notes:     fy.value.notes || '',
    }
  } catch {
    notFound.value = true
  } finally {
    loading.value = false
  }
}

async function saveEdit() {
  editError.value = ''
  if (!editForm.value.name?.trim()) { editError.value = t('erp.fiscalYears.errName'); return }
  if (editForm.value.startDate >= editForm.value.endDate) { editError.value = t('erp.fiscalYears.errEndAfterStart'); return }
  saving.value = true
  try {
    const { data } = await api.put(`/erp/accounting/fiscal-years/${fy.value.id}`, editForm.value)
    fy.value = data.data.fiscalYear
  } catch (err) {
    editError.value = err.response?.data?.message || t('erp.fiscalYears.errSave')
  } finally {
    saving.value = false
  }
}

async function confirmClose() {
  if (!confirm(`Close fiscal year "${fy.value.name}"? This cannot be undone.`)) return
  statusError.value    = ''
  updatingStatus.value = true
  try {
    const { data } = await api.post(`/erp/accounting/fiscal-years/${fy.value.id}/close`)
    fy.value = data.data.fiscalYear
  } catch (err) {
    statusError.value = err.response?.data?.message || t('erp.fiscalYears.errClose')
  } finally {
    updatingStatus.value = false
  }
}

async function confirmDelete() {
  if (!confirm(`Delete fiscal year "${fy.value.name}"? This cannot be undone.`)) return
  try {
    await api.delete(`/erp/accounting/fiscal-years/${fy.value.id}`)
    router.push('/erp/accounting/fiscal-years')
  } catch (err) {
    statusError.value = err.response?.data?.message || t('erp.fiscalYears.errDelete')
  }
}
</script>
