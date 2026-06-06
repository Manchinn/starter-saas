<template>
  <AppLayout>
    <div class="space-y-5">

      <!-- Top action bar (hidden on print) -->
      <div class="flex items-start gap-3 print:hidden">
        <RouterLink to="/erp/good-receive"
          class="mt-0.5 p-2 text-[#9BA7B0] hover:text-[#1C2434] hover:bg-white
                 border border-transparent hover:border-[#E2E8F0] transition-all flex-shrink-0">
          <ArrowLeftIcon class="w-[18px] h-[18px]" />
        </RouterLink>
        <div class="flex-1 min-w-0">
          <div class="flex items-center gap-2.5 flex-wrap">
            <h1 class="text-xl font-bold text-[#1C2434]">
              {{ loading ? '…' : (gr?.refNo || t('erp.goodReceive.title')) }}
            </h1>
            <span v-if="gr && !loading"
              class="inline-flex items-center gap-1.5 px-2.5 py-0.5 text-[11px] font-semibold capitalize"
              :class="statusBadge(gr.status)">
              <span class="w-1.5 h-1.5" :class="statusDot(gr.status)"></span>
              {{ gr.status }}
            </span>
          </div>
          <nav class="flex items-center gap-1.5 mt-1">
            <RouterLink to="/erp/good-receive" class="text-[12px] text-[#9BA7B0] hover:text-[#637381] transition-colors">
              {{ t('erp.goodReceive.title') }}
            </RouterLink>
            <ChevronRightIcon class="w-3 h-3 text-[#CBD5E1]" />
            <span class="text-[12px] text-[#637381]">{{ gr?.refNo || '…' }}</span>
          </nav>
          <!-- Source-doc badges (PO upstream / VendorBill downstream) -->
          <div v-if="gr && !loading && (gr.purchaseOrder || gr.linkedBill)" class="flex items-center gap-1.5 mt-2 flex-wrap">
            <span class="text-[11px] text-[#9BA7B0] font-medium">{{ t('erp.common.source') }}:</span>
            <RouterLink v-if="gr.purchaseOrder" :to="`/erp/purchasing/purchase-orders/${gr.purchaseOrder.id}`"
              class="inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-medium bg-indigo-50 text-indigo-700 hover:bg-indigo-100">
              <ShoppingCartIcon class="w-3 h-3" /> {{ gr.purchaseOrder.refNo }}
            </RouterLink>
            <RouterLink v-if="gr.linkedBill" :to="`/erp/purchasing/bills/${gr.linkedBill.id}`"
              class="inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-medium bg-blue-50 text-blue-700 hover:bg-blue-100">
              <DocumentTextIcon class="w-3 h-3" /> {{ gr.linkedBill.billNumber }}
            </RouterLink>
          </div>
        </div>
        <div v-if="gr && !loading" class="flex items-center gap-2 flex-shrink-0">
          <KeyboardShortcuts :shortcuts="shortcuts" width="w-56" />
          <button @click="onPrint" type="button"
            title="Print this document"
            class="inline-flex items-center gap-1.5 px-3 py-2 text-[12px] font-semibold
                   text-[#637381] bg-white border border-[#E2E8F0] hover:bg-[#F7F9FC] hover:text-[#1C2434] transition-colors">
            <PrinterIcon class="w-4 h-4" />
            {{ t('common.print') }}
          </button>
          <RouterLink v-if="gr.status === 'draft'" v-can="'erp.stock.edit'" :to="`/erp/good-receive/${gr.id}/edit`"
            class="inline-flex items-center gap-1.5 px-3 py-2 text-[12px] font-semibold
                   text-primary-600 bg-primary-50 hover:bg-primary-100 border border-primary-200 transition-colors">
            <PencilSquareIcon class="w-4 h-4" />
            {{ t('common.edit') }}
          </RouterLink>
          <button v-if="gr.status === 'draft'" v-can="'erp.stock.delete'" @click="deleteGR" type="button"
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
      <div v-else-if="!gr"
        class="flex items-start gap-3 bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3.5 print:hidden">
        <ExclamationCircleIcon class="w-5 h-5 flex-shrink-0 mt-0.5" />
        <span>{{ t('erp.goodReceive.notFound') }}
          <RouterLink to="/erp/good-receive" class="underline ml-1">{{ t('erp.common.backToList') }}</RouterLink>
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
          </div>
        </div>

        <!-- Printable document (extracted report view) -->
        <GoodReceiveReport :gr="gr" />

        <!-- Status transitions -->
        <div v-can="'erp.stock.edit'" v-if="gr.status === 'draft'"
          class="bg-white border border-[#E2E8F0] shadow-card px-5 py-4 print:hidden
                 flex items-center justify-between flex-wrap gap-3">
          <div>
            <p class="text-[11px] font-semibold text-[#9BA7B0] uppercase tracking-wider">Next Action</p>
            <p class="text-[13px] text-[#637381] mt-0.5">Confirm to post stock movements and lock this receive.</p>
          </div>
          <div class="flex items-center gap-2.5">
            <button @click="confirmGR" :disabled="confirming"
              class="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold
                     bg-green-600 text-white hover:bg-green-700 transition-colors disabled:opacity-50">
              <ArrowPathIcon v-if="confirming" class="w-4 h-4 animate-spin" />
              <CheckIcon v-else class="w-4 h-4" />
              {{ confirming ? t('erp.common.confirming') : t('erp.goodReceive.confirmStock') }}
            </button>
          </div>
        </div>

        <!-- Convert to vendor bill (confirmed only) -->
        <div v-if="gr.status === 'confirmed'"
          class="bg-white border border-[#E2E8F0] shadow-card px-5 py-4 print:hidden
                 flex items-center flex-wrap gap-3">
          <p class="text-[11px] font-semibold text-[#9BA7B0] uppercase tracking-wider mr-2">Convert</p>
          <button v-can="'erp.bills.edit'" @click="convertToBill"
            :disabled="converting || !!gr.linkedBill"
            :title="gr.linkedBill ? `Already linked to ${gr.linkedBill.billNumber}` : ''"
            class="flex items-center gap-1.5 px-4 py-2 text-sm font-medium bg-primary-50 text-primary-600 border border-primary-200
                   hover:bg-primary-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
            <DocumentTextIcon class="w-4 h-4" />
            {{ converting ? t('common.loading') : t('erp.goodReceive.createBill') }}
          </button>
          <RouterLink v-if="gr.linkedBill" :to="`/erp/purchasing/bills/${gr.linkedBill.id}`"
            class="inline-flex items-center px-2 py-0.5 text-xs font-medium bg-blue-50 text-blue-700 hover:bg-blue-100">
            → {{ gr.linkedBill.billNumber }}
          </RouterLink>
        </div>

        <p v-if="error" class="text-xs text-red-600 print:hidden">{{ error }}</p>

        <AttachmentsPanel v-if="gr" ref-type="GoodReceive" :ref-id="gr.id" class="print:hidden" />
        <ActivityTimeline v-if="gr" ref-type="GoodReceive" :ref-id="gr.id" class="print:hidden" />
      </template>
    </div>
  </AppLayout>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import {
  ArrowLeftIcon, ChevronRightIcon,
  CheckIcon, TrashIcon, PencilSquareIcon,
  ArrowPathIcon, ExclamationCircleIcon, PrinterIcon,
  DocumentTextIcon, ShoppingCartIcon,
} from '@heroicons/vue/24/outline'
import AppLayout from '@/layouts/AppLayout.vue'
import AttachmentsPanel from '@/components/AttachmentsPanel.vue'
import ActivityTimeline from '@/components/ActivityTimeline.vue'
import KeyboardShortcuts from '@/components/KeyboardShortcuts.vue'
import { useDetailShortcuts } from '@/composables/useShortcuts'
import GoodReceiveReport from '@shared/reporting/templates/erp/good-receive/GoodReceiveReport.vue'
import api from '@/api'

const { t } = useI18n()
const route   = useRoute()
const router  = useRouter()

const gr         = ref(null)
const loading    = ref(true)
const confirming = ref(false)
const converting = ref(false)
const error      = ref('')

function onPrint() { window.print() }

const { shortcuts } = useDetailShortcuts({
  enabled:   () => !loading.value && !!gr.value,
  canEdit:   () => gr.value?.status === 'draft',
  canRemove: () => gr.value?.status === 'draft',
  edit:   () => router.push(`/erp/good-receive/${gr.value.id}/edit`),
  remove: () => deleteGR(),
  print:  onPrint,
  back:   () => router.push('/erp/good-receive'),
})

// ── Workflow ──────────────────────────────────────────────
const FLOW_STEPS = computed(() => [
  { key: 'draft',     label: t('erp.common.draft') },
  { key: 'confirmed', label: t('erp.common.confirmed') },
])
const COMPLETED_BEFORE = {
  draft:     [],
  confirmed: ['draft'],
}
function stepState(key) {
  const cur = gr.value?.status
  if (!cur || cur === key) return cur === key ? 'current' : 'upcoming'
  return (COMPLETED_BEFORE[cur] || []).includes(key) ? 'completed' : 'upcoming'
}
function stepChipClass(key) {
  const s = stepState(key)
  if (s === 'completed') return 'bg-green-50 text-green-700'
  if (s === 'current')   return 'bg-primary-50 text-primary-700 ring-1 ring-primary-200'
  return 'bg-[#F7F9FC] text-[#9BA7B0]'
}

const STATUS_BADGE = {
  draft:     'bg-amber-50 text-amber-700',
  confirmed: 'bg-green-50 text-green-700',
}
const STATUS_DOT = {
  draft:     'bg-amber-400',
  confirmed: 'bg-green-500',
}
function statusBadge(s) { return STATUS_BADGE[s] || STATUS_BADGE.draft }
function statusDot(s)   { return STATUS_DOT[s]   || STATUS_DOT.draft }

async function load() {
  try {
    const { data } = await api.get(`/erp/good-receive/${route.params.id}`)
    gr.value = data.data.goodReceive
  } catch {
    gr.value = null
  } finally {
    loading.value = false
  }
}

onMounted(load)

async function confirmGR() {
  if (!confirm('Confirm this Good Receive? Stock will be updated and this cannot be undone.')) return
  confirming.value = true
  error.value = ''
  try {
    const { data } = await api.post(`/erp/good-receive/${route.params.id}/confirm`)
    gr.value = data.data.goodReceive
  } catch (err) {
    error.value = err.response?.data?.message || 'Failed to confirm'
  } finally {
    confirming.value = false
  }
}

async function deleteGR() {
  if (!confirm('Delete this draft? This cannot be undone.')) return
  try {
    await api.delete(`/erp/good-receive/${route.params.id}`)
    router.push('/erp/good-receive')
  } catch (err) {
    error.value = err.response?.data?.message || 'Delete failed'
  }
}

async function convertToBill() {
  converting.value = true
  error.value = ''
  try {
    const { data } = await api.post(`/erp/good-receive/${route.params.id}/create-bill`)
    router.push(`/erp/purchasing/bills/${data.data.id}`)
  } catch (err) {
    error.value = err.response?.data?.message || 'Failed to create vendor bill'
  } finally { converting.value = false }
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
