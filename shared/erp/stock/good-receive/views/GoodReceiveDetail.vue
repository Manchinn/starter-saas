<template>
  <AppLayout>
    <div class="space-y-6">

      <!-- Page Header -->
      <div class="flex items-start gap-4">
        <RouterLink to="/erp/good-receive"
          class="mt-0.5 p-2 rounded-xl text-[#9BA7B0] hover:text-[#1C2434] hover:bg-white border border-transparent
                 hover:border-[#E2E8F0] transition-all flex-shrink-0">
          <ArrowLeftIcon class="w-[18px] h-[18px]" />
        </RouterLink>
        <div class="flex-1 min-w-0">
          <div class="flex items-center gap-2.5">
            <h1 class="text-xl font-bold text-[#1C2434]">{{ t('erp.goodReceive.title') }}</h1>
            <template v-if="gr">
              <span v-if="gr.status === 'draft'"
                class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold
                       bg-amber-50 text-amber-600 border border-amber-200">
                <span class="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
                {{ t('erp.common.draft') }}
              </span>
              <span v-else
                class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold
                       bg-green-50 text-green-700 border border-green-200">
                <span class="w-1.5 h-1.5 rounded-full bg-green-500"></span>
                {{ t('erp.common.confirmed') }}
              </span>
            </template>
          </div>
          <nav v-if="gr" class="flex items-center gap-1.5 mt-1">
            <RouterLink to="/erp/good-receive" class="text-[12px] text-[#9BA7B0] hover:text-[#637381] transition-colors">
              {{ t('erp.goodReceive.title') }}
            </RouterLink>
            <ChevronRightIcon class="w-3 h-3 text-[#CBD5E1]" />
            <span class="text-[12px] text-[#637381] font-mono">{{ gr.refNo }}</span>
          </nav>
        </div>
        <div v-if="gr?.status === 'draft'" class="flex items-center gap-2.5 flex-shrink-0">
          <button @click="deleteGR"
            class="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium
                   text-red-500 border border-red-200 rounded-xl hover:bg-red-50 transition-colors">
            <TrashIcon class="w-4 h-4" />
            {{ t('erp.common.deleteDraft') }}
          </button>
          <button @click="confirmGR" :disabled="confirming"
            class="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-bold
                   bg-green-600 text-white rounded-xl hover:bg-green-700 shadow-sm
                   disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
            <ArrowPathIcon v-if="confirming" class="w-4 h-4 animate-spin" />
            <CheckIcon v-else class="w-4 h-4" />
            {{ confirming ? t('erp.common.confirming') : t('erp.goodReceive.confirmStock') }}
          </button>
        </div>
      </div>

      <!-- Loading -->
      <div v-if="loading" class="bg-white rounded-2xl border border-[#E2E8F0] p-12 text-center text-[#9BA7B0] text-sm animate-pulse">
        {{ t('common.loading') }}
      </div>

      <!-- Not found -->
      <div v-else-if="!gr"
        class="flex items-center gap-3 bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3.5 rounded-xl">
        <ExclamationCircleIcon class="w-5 h-5 flex-shrink-0" />
        <span>{{ t('erp.goodReceive.notFound') }}</span>
        <RouterLink to="/erp/good-receive" class="underline ml-1 font-medium">{{ t('erp.common.backToList') }}</RouterLink>
      </div>

      <template v-else>
        <div class="space-y-5">

          <!-- Section 1: GR Info -->
          <div class="bg-white rounded-2xl border border-[#E2E8F0] shadow-card overflow-hidden">
            <div class="px-6 py-4 border-b border-[#E2E8F0] flex items-center gap-3">
              <div class="w-8 h-8 rounded-xl bg-primary-50 flex items-center justify-center flex-shrink-0">
                <TruckIcon class="w-4 h-4 text-primary-500" />
              </div>
              <h2 class="text-sm font-semibold text-[#1C2434]">{{ t('erp.common.header') }}</h2>
            </div>
            <div class="px-6 py-5 space-y-5">

              <!-- Core fields -->
              <div class="grid grid-cols-3 gap-x-8 gap-y-5">
                <div>
                  <p class="text-[11px] font-semibold text-[#637381] uppercase tracking-wider mb-1">{{ t('erp.common.refNo') }}</p>
                  <p class="font-mono font-semibold text-[#1C2434] text-sm">{{ gr.refNo }}</p>
                </div>
                <div>
                  <p class="text-[11px] font-semibold text-[#637381] uppercase tracking-wider mb-1">{{ t('erp.common.date') }}</p>
                  <p class="text-sm text-[#1C2434]">{{ gr.date }}</p>
                </div>
                <div>
                  <p class="text-[11px] font-semibold text-[#637381] uppercase tracking-wider mb-1">{{ t('erp.common.store') }}</p>
                  <p class="text-sm font-medium text-[#1C2434]">{{ gr.store?.name || '—' }}</p>
                </div>
                <div>
                  <p class="text-[11px] font-semibold text-[#637381] uppercase tracking-wider mb-1">{{ t('erp.goodReceive.supplier') }}</p>
                  <p class="text-sm text-[#1C2434]">{{ gr.supplier || '—' }}</p>
                </div>
                <div class="col-span-2">
                  <p class="text-[11px] font-semibold text-[#637381] uppercase tracking-wider mb-1">{{ t('erp.common.notes') }}</p>
                  <p class="text-sm text-[#637381]">{{ gr.notes || '—' }}</p>
                </div>
              </div>

              <!-- Document type -->
              <div class="pt-4 border-t border-[#E2E8F0]">
                <p class="text-[11px] font-semibold text-[#637381] uppercase tracking-wider mb-3">{{ t('erp.goodReceive.docType') }}</p>
                <div class="flex items-start gap-6 flex-wrap">
                  <span
                    :class="gr.docType === 'delivery'
                      ? 'bg-purple-50 text-purple-700 border-purple-200'
                      : 'bg-blue-50 text-blue-700 border-blue-200'"
                    class="inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-semibold border capitalize">
                    {{ gr.docType === 'delivery' ? t('erp.goodReceive.delivery') : t('erp.goodReceive.invoice') }}
                  </span>

                  <template v-if="gr.docType !== 'delivery'">
                    <div>
                      <p class="text-[11px] font-semibold text-[#637381] uppercase tracking-wider mb-1">{{ t('erp.goodReceive.invoiceNo') }}</p>
                      <p class="font-mono text-sm text-[#1C2434]">{{ gr.invoiceNo || '—' }}</p>
                    </div>
                    <div>
                      <p class="text-[11px] font-semibold text-[#637381] uppercase tracking-wider mb-1">{{ t('erp.goodReceive.invoiceDate') }}</p>
                      <p class="text-sm text-[#1C2434]">{{ gr.invoiceDate || '—' }}</p>
                    </div>
                    <div>
                      <p class="text-[11px] font-semibold text-[#637381] uppercase tracking-wider mb-1">{{ t('erp.goodReceive.invoiceDiscount') }}</p>
                      <p class="text-sm text-[#1C2434] tabular-nums">{{ fmtMoney(gr.invoiceDiscount) }}</p>
                    </div>
                    <div class="px-4 py-2.5 bg-green-50 rounded-xl border border-green-100">
                      <p class="text-[11px] font-semibold text-[#637381] uppercase tracking-wider mb-1">{{ t('erp.goodReceive.netAmount') }}</p>
                      <p class="font-bold text-green-700 text-lg tabular-nums leading-none">{{ fmtMoney(gr.invoiceNetAmount) }}</p>
                    </div>
                  </template>

                  <template v-else>
                    <div>
                      <p class="text-[11px] font-semibold text-[#637381] uppercase tracking-wider mb-1">{{ t('erp.goodReceive.deliveryNo') }}</p>
                      <p class="font-mono text-sm text-[#1C2434]">{{ gr.deliveryNo || '—' }}</p>
                    </div>
                  </template>
                </div>
              </div>

            </div>
          </div>

          <!-- Section 2: Items -->
          <div class="bg-white rounded-2xl border border-[#E2E8F0] shadow-card overflow-hidden">
            <div class="px-6 py-4 border-b border-[#E2E8F0] flex items-center justify-between">
              <div class="flex items-center gap-3">
                <div class="w-8 h-8 rounded-xl bg-green-50 flex items-center justify-center flex-shrink-0">
                  <ClipboardDocumentListIcon class="w-4 h-4 text-green-600" />
                </div>
                <div>
                  <h2 class="text-sm font-semibold text-[#1C2434]">{{ t('erp.common.items') }}</h2>
                  <p class="text-[11px] text-[#9BA7B0]">
                    {{ gr.items?.length || 0 }} item{{ (gr.items?.length || 0) !== 1 ? 's' : '' }}
                  </p>
                </div>
              </div>
              <div class="flex items-center gap-5 text-xs text-[#637381]">
                <span>Gross: <span class="font-semibold text-[#1C2434] tabular-nums">{{ fmtMoney(totalGross) }}</span></span>
                <span class="font-semibold text-[#374151]">Net: <span class="font-bold text-[#1C2434] tabular-nums">{{ fmtMoney(totalNet) }}</span></span>
              </div>
            </div>

            <div class="overflow-x-auto">
              <table class="w-full text-sm" style="min-width: 1200px">
                <thead>
                  <tr class="bg-[#F7F9FC] border-b border-[#E2E8F0]">
                    <th class="px-4 py-3 text-left text-[11px] font-semibold text-[#9BA7B0] uppercase tracking-wider">{{ t('erp.common.product') }}</th>
                    <th class="px-4 py-3 text-left text-[11px] font-semibold text-[#9BA7B0] uppercase tracking-wider">SKU</th>
                    <th class="px-4 py-3 text-right text-[11px] font-semibold text-[#9BA7B0] uppercase tracking-wider">{{ t('erp.common.qty') }}</th>
                    <th class="px-4 py-3 text-left text-[11px] font-semibold text-[#9BA7B0] uppercase tracking-wider">UOM</th>
                    <th class="px-4 py-3 text-right text-[11px] font-semibold text-[#9BA7B0] uppercase tracking-wider">{{ t('erp.goodReceive.freeQty') }}</th>
                    <th class="px-4 py-3 text-left text-[11px] font-semibold text-[#9BA7B0] uppercase tracking-wider">{{ t('erp.goodReceive.freeUom') }}</th>
                    <th class="px-4 py-3 text-right text-[11px] font-semibold text-indigo-400 uppercase tracking-wider">Stock Qty</th>
                    <th class="px-4 py-3 text-left text-[11px] font-semibold text-[#9BA7B0] uppercase tracking-wider">{{ t('erp.goodReceive.batchId') }}</th>
                    <th class="px-4 py-3 text-left text-[11px] font-semibold text-[#9BA7B0] uppercase tracking-wider">{{ t('erp.goodReceive.expiryDate') }}</th>
                    <th class="px-4 py-3 text-right text-[11px] font-semibold text-[#9BA7B0] uppercase tracking-wider">Cost/Unit</th>
                    <th class="px-4 py-3 text-right text-[11px] font-semibold text-[#9BA7B0] uppercase tracking-wider">{{ t('erp.goodReceive.discPct') }}</th>
                    <th class="px-4 py-3 text-right text-[11px] font-semibold text-[#9BA7B0] uppercase tracking-wider">{{ t('erp.goodReceive.discount') }}</th>
                    <th class="px-4 py-3 text-right text-[11px] font-semibold text-[#9BA7B0] uppercase tracking-wider">{{ t('erp.goodReceive.netAmount') }}</th>
                    <th class="px-4 py-3 text-right text-[11px] font-semibold text-[#9BA7B0] uppercase tracking-wider">{{ t('erp.goodReceive.wac') }}</th>
                    <th class="px-4 py-3 text-left text-[11px] font-semibold text-[#9BA7B0] uppercase tracking-wider">{{ t('erp.goodReceive.comments') }}</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-[#F1F5F9]">
                  <tr v-for="item in gr.items" :key="item.id" class="hover:bg-[#F7F9FC] transition-colors">
                    <td class="px-4 py-3 font-medium text-[#1C2434]">{{ item.product?.name }}</td>
                    <td class="px-4 py-3 font-mono text-xs text-[#9BA7B0]">{{ item.product?.sku || '—' }}</td>
                    <td class="px-4 py-3 text-right font-semibold text-[#1C2434] tabular-nums">{{ Number(item.qty) }}</td>
                    <td class="px-4 py-3 text-xs text-[#637381]">{{ item.qtyUom?.abbreviation || item.qtyUom?.name || '—' }}</td>
                    <td class="px-4 py-3 text-right text-[#637381] tabular-nums">{{ Number(item.freeQty) || '—' }}</td>
                    <td class="px-4 py-3 text-xs text-[#637381]">{{ item.freeQtyUom?.abbreviation || item.freeQtyUom?.name || '—' }}</td>
                    <td class="px-4 py-3 text-right font-semibold text-indigo-600 tabular-nums">{{ Number(item.stockQty) || Number(item.qty) }}</td>
                    <td class="px-4 py-3 font-mono text-xs text-[#637381]">{{ item.batchId || '—' }}</td>
                    <td class="px-4 py-3 text-xs text-[#637381]">{{ item.expiryDate || '—' }}</td>
                    <td class="px-4 py-3 text-right text-[#374151] tabular-nums">{{ fmtMoney(item.cost) }}</td>
                    <td class="px-4 py-3 text-right text-[#637381] tabular-nums">{{ Number(item.discountPct) ? `${Number(item.discountPct)}%` : '—' }}</td>
                    <td class="px-4 py-3 text-right text-[#637381] tabular-nums">{{ fmtMoney(item.discount) !== '0.00' ? fmtMoney(item.discount) : '—' }}</td>
                    <td class="px-4 py-3 text-right font-semibold text-[#1C2434] tabular-nums">{{ fmtMoney(item.netAmount) }}</td>
                    <td class="px-4 py-3 text-right font-mono text-xs text-blue-600 tabular-nums">{{ fmtRate(item.wac) }}</td>
                    <td class="px-4 py-3 text-xs text-[#637381]">{{ item.comments || '—' }}</td>
                  </tr>
                </tbody>
                <tfoot>
                  <tr class="border-t-2 border-[#E2E8F0] bg-[#F7F9FC]">
                    <td colspan="9" class="px-4 py-3 text-[11px] font-semibold text-[#9BA7B0] uppercase tracking-wider">
                      {{ t('erp.goodReceive.totals') }}
                    </td>
                    <td class="px-4 py-3 text-right text-xs font-semibold text-[#374151] tabular-nums">{{ fmtMoney(totalGross) }}</td>
                    <td colspan="2"></td>
                    <td class="px-4 py-3 text-right text-sm font-bold text-[#1C2434] tabular-nums">{{ fmtMoney(totalNet) }}</td>
                    <td colspan="2"></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          <!-- Error -->
          <div v-if="error"
            class="flex items-start gap-3 bg-red-50 border border-red-200 text-red-700
                   text-sm px-4 py-3.5 rounded-xl">
            <ExclamationCircleIcon class="w-5 h-5 flex-shrink-0 mt-0.5" />
            <span>{{ error }}</span>
          </div>

          <!-- Summary card -->
          <div class="bg-white rounded-2xl border border-[#E2E8F0] shadow-card overflow-hidden">
            <div class="px-6 py-4 border-b border-[#E2E8F0] flex items-center gap-2.5">
              <CalculatorIcon class="w-4 h-4 text-[#9BA7B0]" />
              <h2 class="text-sm font-semibold text-[#1C2434]">{{ t('erp.common.summary') }}</h2>
            </div>

            <div class="px-6 py-4 grid grid-cols-4 gap-6">
              <div class="flex flex-col gap-0.5">
                <span class="text-[11px] font-semibold text-[#9BA7B0] uppercase tracking-wider">{{ t('erp.common.items') }}</span>
                <span class="text-sm font-semibold text-[#1C2434]">{{ gr.items?.length || 0 }}</span>
              </div>
              <div class="flex flex-col gap-0.5">
                <span class="text-[11px] font-semibold text-[#9BA7B0] uppercase tracking-wider">Gross Amount</span>
                <span class="text-sm font-semibold text-[#1C2434] tabular-nums">{{ fmtMoney(totalGross) }}</span>
              </div>
              <div class="flex flex-col gap-0.5">
                <span class="text-[11px] font-semibold text-[#9BA7B0] uppercase tracking-wider">Net Amount</span>
                <span class="text-sm font-semibold text-[#1C2434] tabular-nums">{{ fmtMoney(totalNet) }}</span>
              </div>
              <div v-if="gr.docType !== 'delivery'" class="flex flex-col gap-0.5">
                <span class="text-[11px] font-semibold text-[#9BA7B0] uppercase tracking-wider">{{ t('erp.goodReceive.netAmount') }}</span>
                <span class="text-sm font-semibold text-green-700 tabular-nums">{{ fmtMoney(gr.invoiceNetAmount) }}</span>
              </div>
            </div>

            <div class="px-6 py-5 bg-[#F7F9FC] border-t border-[#E2E8F0] flex items-center justify-between">
              <div>
                <p class="text-[11px] font-semibold text-[#9BA7B0] uppercase tracking-wider mb-0.5">Total Net Amount</p>
                <p class="text-3xl font-extrabold text-primary-500 tabular-nums leading-none">{{ fmtMoney(totalNet) }}</p>
              </div>
              <div class="flex items-center gap-3">
                <RouterLink to="/erp/good-receive"
                  class="px-5 py-2.5 text-sm font-medium text-[#637381] hover:text-[#1C2434] transition-colors">
                  {{ t('erp.common.back') }}
                </RouterLink>
                <template v-if="gr.status === 'draft'">
                  <button @click="deleteGR"
                    class="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-medium
                           text-red-500 border border-red-200 rounded-xl hover:bg-red-50 transition-colors">
                    <TrashIcon class="w-4 h-4" />
                    {{ t('erp.common.deleteDraft') }}
                  </button>
                  <button @click="confirmGR" :disabled="confirming"
                    class="inline-flex items-center gap-2 px-6 py-2.5 text-sm font-bold
                           bg-green-600 text-white rounded-xl hover:bg-green-700 shadow-sm
                           disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
                    <ArrowPathIcon v-if="confirming" class="w-4 h-4 animate-spin" />
                    <CheckIcon v-else class="w-4 h-4" />
                    {{ confirming ? t('erp.common.confirming') : t('erp.goodReceive.confirmStock') }}
                  </button>
                </template>
              </div>
            </div>
          </div>

        </div>
      </template>
    </div>
  </AppLayout>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute, useRouter } from 'vue-router'
import {
  ArrowLeftIcon, ChevronRightIcon, TruckIcon, ClipboardDocumentListIcon,
  CalculatorIcon, CheckIcon, TrashIcon, ExclamationCircleIcon, ArrowPathIcon,
} from '@heroicons/vue/24/outline'
import AppLayout from '@/layouts/AppLayout.vue'
import api from '@/api'
import { fmtMoney, fmtRate } from '@/utils/fmt'

const { t } = useI18n()
const route = useRoute()
const router = useRouter()

const gr         = ref(null)
const loading    = ref(true)
const confirming = ref(false)
const error      = ref('')

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

const totalGross = computed(() =>
  (gr.value?.items || []).reduce((s, i) => s + Number(i.qty) * Number(i.cost), 0)
)
const totalNet = computed(() =>
  (gr.value?.items || []).reduce((s, i) => s + Number(i.netAmount || 0), 0)
)

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
</script>
