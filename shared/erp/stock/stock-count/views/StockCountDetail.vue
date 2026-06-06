<template>
  <AppLayout>
    <div class="space-y-5">

      <!-- Top action bar (hidden on print) -->
      <div class="flex items-start gap-3 print:hidden">
        <RouterLink to="/erp/stock-count"
          class="mt-0.5 p-2 text-[#9BA7B0] hover:text-[#1C2434] hover:bg-white
                 border border-transparent hover:border-[#E2E8F0] transition-all flex-shrink-0">
          <ArrowLeftIcon class="w-[18px] h-[18px]" />
        </RouterLink>
        <div class="flex-1 min-w-0">
          <div class="flex items-center gap-2.5 flex-wrap">
            <h1 class="text-xl font-bold text-[#1C2434]">
              {{ loading ? '…' : (sc?.refNo || t('erp.stockCount.detail')) }}
            </h1>
            <span v-if="sc && !loading"
              class="inline-flex items-center gap-1.5 px-2.5 py-0.5 text-[11px] font-semibold capitalize"
              :class="statusBadge(sc.status)">
              <span class="w-1.5 h-1.5" :class="statusDot(sc.status)"></span>
              {{ sc.status }}
            </span>
            <span v-if="sc?.movementLocked"
              class="inline-flex items-center gap-1 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider
                     bg-red-50 text-red-600">
              <LockClosedIcon class="w-3 h-3" />
              {{ t('erp.stockCount.locked') }}
            </span>
          </div>
          <nav class="flex items-center gap-1.5 mt-1">
            <RouterLink to="/erp/stock-count" class="text-[12px] text-[#9BA7B0] hover:text-[#637381] transition-colors">
              {{ t('erp.stockCount.title') }}
            </RouterLink>
            <ChevronRightIcon class="w-3 h-3 text-[#CBD5E1]" />
            <span class="text-[12px] text-[#637381]">{{ sc?.refNo || '…' }}</span>
          </nav>
        </div>
        <div v-if="sc && !loading" class="flex items-center gap-2 flex-shrink-0">
          <KeyboardShortcuts :shortcuts="shortcuts" width="w-56" />
          <button @click="onPrint" type="button"
            class="inline-flex items-center gap-1.5 px-3 py-2 text-[12px] font-semibold
                   text-[#637381] bg-white border border-[#E2E8F0] hover:bg-[#F7F9FC] hover:text-[#1C2434] transition-colors">
            <PrinterIcon class="w-4 h-4" />
            {{ t('common.print') }}
          </button>
          <RouterLink v-if="sc.status === 'draft'" v-can="'erp.stock.edit'" :to="`/erp/stock-count/${sc.id}/edit`"
            class="inline-flex items-center gap-1.5 px-3 py-2 text-[12px] font-semibold
                   text-primary-600 bg-primary-50 hover:bg-primary-100 border border-primary-200 transition-colors">
            <PencilSquareIcon class="w-4 h-4" />
            {{ t('common.edit') }}
          </RouterLink>
          <button v-if="sc.status === 'draft'" v-can="'erp.stock.delete'" @click="deleteSc" type="button"
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
      <div v-else-if="!sc"
        class="flex items-start gap-3 bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3.5 print:hidden">
        <ExclamationCircleIcon class="w-5 h-5 flex-shrink-0 mt-0.5" />
        <span>{{ t('erp.stockCount.notFound') }}
          <RouterLink to="/erp/stock-count" class="underline ml-1">{{ t('erp.common.backToList') }}</RouterLink>
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

        <!-- Movement lock toggle (draft only, hidden on print) — keeps the
             one editable knob on this page outside the document so the
             printed sheet stays clean. -->
        <div v-if="sc.status === 'draft'" v-can="'erp.stock.edit'"
          class="bg-white border border-[#E2E8F0] shadow-card px-5 py-4 print:hidden
                 flex items-center justify-between flex-wrap gap-3">
          <div class="flex items-start gap-3">
            <div class="w-8 h-8 bg-amber-50 flex items-center justify-center flex-shrink-0">
              <LockClosedIcon class="w-4 h-4 text-amber-600" />
            </div>
            <div>
              <p class="text-sm font-semibold text-[#1C2434]">{{ t('erp.stockCount.stockMovement') }}</p>
              <p class="text-[12px] text-[#637381] mt-0.5">{{ t('erp.stockCount.lockMovement') }}</p>
            </div>
          </div>
          <label class="inline-flex items-center gap-2 cursor-pointer select-none">
            <input type="checkbox" v-model="sc.movementLocked" @change="toggleLock"
              class="w-4 h-4 border-[#CBD5E1] text-primary-500 focus:ring-primary-500/40" />
            <span :class="sc.movementLocked ? 'text-red-600 font-bold' : 'text-[#9BA7B0]'"
              class="text-[11px] uppercase tracking-wider">
              {{ t('erp.stockCount.lockMovements') }}
            </span>
          </label>
        </div>

        <!-- Printable document (extracted report view) -->
        <StockCountReport :sc="sc" />

        <!-- Status action (hidden on print) -->
        <div v-if="sc.status === 'draft'" v-can="'erp.stock.edit'"
          class="bg-white border border-[#E2E8F0] shadow-card px-5 py-4 print:hidden
                 flex items-center justify-between flex-wrap gap-3">
          <div>
            <p class="text-[11px] font-semibold text-[#9BA7B0] uppercase tracking-wider">
              {{ t('erp.orders.nextAction') }}
            </p>
            <p class="text-[13px] text-[#637381] mt-0.5">
              {{ t('erp.stockCount.confirmHint') }}
            </p>
          </div>
          <button @click="confirmSc" :disabled="confirming"
            class="px-4 py-2.5 text-sm font-semibold
                   bg-green-600 text-white hover:bg-green-700 disabled:opacity-50
                   flex items-center gap-2 transition-colors">
            <ArrowPathIcon v-if="confirming" class="w-4 h-4 animate-spin" />
            <CheckIcon v-else class="w-4 h-4" />
            {{ confirming ? t('erp.common.confirming') : t('erp.stockCount.confirmCount') }}
          </button>
        </div>
        <p v-if="error" class="text-xs text-red-600 print:hidden">{{ error }}</p>

        <ActivityTimeline ref-type="StockCount" :ref-id="sc.id" class="print:hidden" />
      </template>
    </div>
  </AppLayout>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import {
  ArrowLeftIcon, ChevronRightIcon, CheckIcon, ArrowPathIcon,
  TrashIcon, PencilSquareIcon, PrinterIcon, ExclamationCircleIcon,
  LockClosedIcon,
} from '@heroicons/vue/24/outline'
import AppLayout from '@/layouts/AppLayout.vue'
import KeyboardShortcuts from '@/components/KeyboardShortcuts.vue'
import { useDetailShortcuts } from '@/composables/useShortcuts'
import ActivityTimeline from '@/components/ActivityTimeline.vue'
import StockCountReport from '@shared/reporting/templates/erp/stock-count/StockCountReport.vue'
import api from '@/api'

const { t }   = useI18n()
const route   = useRoute()
const router  = useRouter()

const sc          = ref(null)
const loading     = ref(true)
const confirming  = ref(false)
const error       = ref('')

const { shortcuts } = useDetailShortcuts({
  enabled: () => !loading.value && !!sc.value,
  canEdit: () => sc.value?.status === 'draft',
  edit:  () => router.push(`/erp/stock-count/${sc.value.id}/edit`),
  print: onPrint,
  back:  () => router.push('/erp/stock-count'),
})

const FLOW_STEPS = [
  { key: 'draft',     label: 'Draft' },
  { key: 'confirmed', label: 'Confirmed' },
]

const stepState = (key) => {
  if (!sc.value) return 'pending'
  const status = sc.value.status
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

async function load() {
  loading.value = true
  try {
    const { data } = await api.get(`/erp/stock-count/${route.params.id}`)
    sc.value = data.data.stockCount
  } catch {
    sc.value = null
  } finally {
    loading.value = false
  }
}
onMounted(load)

function onPrint() {
  window.print()
}

async function confirmSc() {
  if (!confirm(`Confirm ${sc.value.refNo}? Store stock will be set to the counted quantities. This cannot be undone.`)) return
  confirming.value = true
  error.value = ''
  try {
    await api.post(`/erp/stock-count/${route.params.id}/confirm`)
    await load()
  } catch (err) {
    error.value = err.response?.data?.message || 'Failed to confirm'
  } finally {
    confirming.value = false
  }
}

async function toggleLock() {
  try {
    await api.put(`/erp/stock-count/${route.params.id}`, { movementLocked: sc.value.movementLocked })
  } catch (err) {
    sc.value.movementLocked = !sc.value.movementLocked
    error.value = err.response?.data?.message || 'Failed to update lock'
  }
}

async function deleteSc() {
  if (!confirm(`Delete ${sc.value.refNo}? This cannot be undone.`)) return
  try {
    await api.delete(`/erp/stock-count/${route.params.id}`)
    router.push('/erp/stock-count')
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
