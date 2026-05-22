<template>
  <AppLayout>
    <div class="space-y-6">
      <div class="flex items-center gap-3">
        <RouterLink to="/erp/stock-balance" class="text-[#9BA7B0] hover:text-[#637381] transition">
          <ArrowLeftIcon class="w-5 h-5" />
        </RouterLink>
        <h1 class="text-2xl font-bold text-[#1C2434]">{{ t('erp.stockBalance.stockOverview') }}</h1>
      </div>

      <div v-if="loading" class="text-[#9BA7B0] py-12 text-center">Loading…</div>
      <div v-else-if="!summary" class="bg-red-50 text-red-700 text-sm px-4 py-3">
        {{ t('erp.stockBalance.productNotFound') }} <RouterLink to="/erp/stock-balance" class="underline ml-1">{{ t('erp.common.back') }}</RouterLink>
      </div>

      <template v-else>
        <!-- Product info -->
        <div class="bg-white rounded-2xl border border-[#E2E8F0] p-6">
          <div class="flex items-start justify-between gap-6">
            <div>
              <h2 class="text-xl font-bold text-[#1C2434]">{{ summary.product.name }}</h2>
              <p v-if="summary.product.sku" class="font-mono text-sm text-[#9BA7B0] mt-0.5">{{ summary.product.sku }}</p>
            </div>
            <div class="flex gap-6 text-right">
              <div>
                <p class="text-xs text-[#637381] mb-0.5">{{ t('erp.stockBalance.totalStock') }}</p>
                <p class="text-2xl font-bold text-[#1C2434]">
                  {{ fmtQty(summary.totalStock) }}
                  <span class="text-sm font-normal text-[#9BA7B0] ml-1">{{ summary.product.sellingUom?.abbreviation || '' }}</span>
                </p>
              </div>
              <div>
                <p class="text-xs text-[#637381] mb-0.5">{{ t('erp.stockBalance.colWac') }}</p>
                <p class="text-2xl font-bold text-[#1C2434]">{{ fmtMoney(summary.product.cost) }}</p>
              </div>
              <div>
                <p class="text-xs text-[#637381] mb-0.5">{{ t('erp.stockBalance.totalValue') }}</p>
                <p class="text-2xl font-bold text-[#1C2434]">{{ fmtMoney(summary.totalValue) }}</p>
              </div>
            </div>
          </div>
          <div class="mt-4 pt-4 border-t border-[#E2E8F0] grid grid-cols-3 gap-4 text-sm">
            <div>
              <span class="text-[#637381]">{{ t('erp.stockBalance.sellingUom') }}</span>
              <span class="ml-2 text-[#1C2434]">{{ summary.product.sellingUom?.name || '—' }}</span>
            </div>
            <div>
              <span class="text-[#637381]">{{ t('erp.stockBalance.purchasingUom') }}</span>
              <span class="ml-2 text-[#1C2434]">{{ summary.product.purchasingUom?.name || '—' }}</span>
            </div>
            <div>
              <span class="text-[#637381]">{{ t('erp.stockBalance.costWac') }}</span>
              <span class="ml-2 text-[#1C2434]">{{ fmtMoney(summary.product.cost) }}</span>
            </div>
          </div>
        </div>

        <!-- Stock by Store -->
        <div class="bg-white rounded-2xl border border-[#E2E8F0] overflow-hidden">
          <div class="px-5 py-3 border-b border-[#E2E8F0]">
            <h2 class="text-sm font-semibold text-[#374151]">{{ t('erp.stockBalance.stockByStore') }}</h2>
          </div>
          <table class="w-full text-sm">
            <thead class="bg-[#F7F9FC] border-b border-[#E2E8F0] text-left">
              <tr>
                <th class="px-5 py-3 font-medium text-[#637381]">{{ t('erp.stockBalance.colStore') }}</th>
                <th class="px-5 py-3 font-medium text-[#637381]">{{ t('erp.stockBalance.colCode') }}</th>
                <th class="px-5 py-3 font-medium text-[#637381] text-right">{{ t('erp.stockBalance.colQty') }}</th>
                <th class="px-5 py-3 font-medium text-[#637381] text-right">{{ t('erp.stockBalance.colValue') }}</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-[#E2E8F0]">
              <tr v-if="!summary.storeStocks.length">
                <td colspan="4" class="px-5 py-8 text-center text-[#9BA7B0]">{{ t('erp.stockBalance.noStoreStock') }}</td>
              </tr>
              <tr v-for="ss in summary.storeStocks" :key="ss.id" class="hover:bg-[#F7F9FC]">
                <td class="px-5 py-3 font-medium text-[#1C2434]">{{ ss.store?.name || '—' }}</td>
                <td class="px-5 py-3 font-mono text-xs text-[#9BA7B0]">{{ ss.store?.code || '—' }}</td>
                <td class="px-5 py-3 text-right font-semibold"
                  :class="Number(ss.stock) > 0 ? 'text-[#1C2434]' : 'text-red-400'">
                  {{ fmtQty(ss.stock) }}
                </td>
                <td class="px-5 py-3 text-right text-[#374151]">
                  {{ fmtMoney(Number(ss.stock) * Number(summary.product.cost || 0)) }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Recent Movements -->
        <div class="bg-white rounded-2xl border border-[#E2E8F0] overflow-hidden">
          <div class="px-5 py-3 border-b border-[#E2E8F0]">
            <h2 class="text-sm font-semibold text-[#374151]">{{ t('erp.stockBalance.recentMovements') }} <span class="text-[#9BA7B0] font-normal">{{ t('erp.stockBalance.last20') }}</span></h2>
          </div>
          <table class="w-full text-sm">
            <thead class="bg-[#F7F9FC] border-b border-[#E2E8F0] text-left">
              <tr>
                <th class="px-5 py-3 font-medium text-[#637381]">{{ t('erp.stockBalance.colDate') }}</th>
                <th class="px-5 py-3 font-medium text-[#637381]">{{ t('erp.stockBalance.colType') }}</th>
                <th class="px-5 py-3 font-medium text-[#637381]">{{ t('erp.stockBalance.colStore') }}</th>
                <th class="px-5 py-3 font-medium text-[#637381]">{{ t('erp.stockBalance.colRef') }}</th>
                <th class="px-5 py-3 font-medium text-[#637381] text-right">{{ t('erp.stockBalance.colQty') }}</th>
                <th class="px-5 py-3 font-medium text-[#637381] text-right">{{ t('erp.stockBalance.colAfter') }}</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-[#E2E8F0]">
              <tr v-if="!summary.movements.length">
                <td colspan="6" class="px-5 py-8 text-center text-[#9BA7B0]">{{ t('erp.stockBalance.noMovements') }}</td>
              </tr>
              <tr v-for="mv in summary.movements" :key="mv.id" class="hover:bg-[#F7F9FC]">
                <td class="px-5 py-3 text-[#637381] text-xs">{{ mv.createdAt?.slice(0, 10) }}</td>
                <td class="px-5 py-3">
                  <span :class="movementClass(mv.type)"
                    class="px-2 py-0.5 rounded-full text-xs font-medium capitalize">
                    {{ movementLabel(mv.type) }}
                  </span>
                </td>
                <td class="px-5 py-3 text-[#637381]">{{ mv.store?.name || '—' }}</td>
                <td class="px-5 py-3 font-mono text-xs text-[#9BA7B0]">{{ mv.refNo || '—' }}</td>
                <td class="px-5 py-3 text-right font-semibold"
                  :class="Number(mv.qty) >= 0 ? 'text-green-700' : 'text-red-600'">
                  {{ Number(mv.qty) >= 0 ? '+' : '' }}{{ fmtQty(mv.qty) }}
                </td>
                <td class="px-5 py-3 text-right text-[#637381]">{{ fmtQty(mv.stockAfter) }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </template>
    </div>
  </AppLayout>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute } from 'vue-router'
import { ArrowLeftIcon } from '@heroicons/vue/24/outline'
import AppLayout from '@/layouts/AppLayout.vue'
import api from '@/api'
import { fmtMoney, fmtQty } from '@/utils/fmt'

const { t } = useI18n()
const route   = useRoute()
const summary = ref(null)
const loading = ref(true)

onMounted(async () => {
  try {
    const { data } = await api.get(`/erp/stock-balance/product/${route.params.productId}`)
    summary.value = data.data
  } catch {
    summary.value = null
  } finally {
    loading.value = false
  }
})

const movementClassMap = {
  receive:         'bg-green-100 text-green-700',
  adjust:          'bg-yellow-100 text-yellow-700',
  count:           'bg-blue-100 text-blue-700',
  request:         'bg-purple-100 text-purple-700',
  customer_return: 'bg-blue-100 text-blue-700',
  vendor_return:   'bg-orange-100 text-orange-700',
}

function movementLabel(type) {
  return t('erp.movementTypes.' + type) || type
}
function movementClass(type) {
  return movementClassMap[type] || 'bg-[#F1F5F9] text-[#637381]'
}
</script>
