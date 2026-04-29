<template>
  <AppLayout>
    <div class="space-y-6">
      <div class="flex items-center gap-3">
        <RouterLink to="/erp/stock-return" class="text-[#9BA7B0] hover:text-[#637381] transition">
          <ArrowLeftIcon class="w-5 h-5" />
        </RouterLink>
        <h1 class="text-2xl font-bold text-[#1C2434]">{{ t('erp.stockReturn.title') }}</h1>
        <span v-if="sr" :class="typeClass(sr.type)" class="px-2.5 py-0.5 rounded-full text-xs font-medium">
          {{ sr.type === 'customer_return' ? t('erp.stockReturn.customerReturn') : t('erp.stockReturn.returnToVendor') }}
        </span>
        <span v-if="sr" :class="sr.status === 'confirmed' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'"
          class="px-2.5 py-0.5 rounded-full text-xs font-medium capitalize">{{ sr?.status }}</span>
      </div>

      <div v-if="loading" class="text-[#9BA7B0] py-12 text-center">Loading…</div>
      <div v-else-if="!sr" class="bg-red-50 text-red-700 text-sm px-4 py-3 rounded-lg">
        {{ t('erp.stockReturn.notFound') }} <RouterLink to="/erp/stock-return" class="underline ml-1">{{ t('erp.common.backToList') }}</RouterLink>
      </div>

      <template v-else>
        <!-- Header info -->
        <div class="bg-white rounded-2xl border border-[#E2E8F0] p-6 space-y-4">
          <div class="grid grid-cols-5 gap-6 text-sm">
            <div><p class="text-[#637381] mb-1">{{ t('erp.common.refNo') }}</p><p class="font-mono font-semibold text-[#1C2434]">{{ sr.refNo }}</p></div>
            <div><p class="text-[#637381] mb-1">{{ t('erp.common.date') }}</p><p class="font-medium text-[#1C2434]">{{ sr.date }}</p></div>
            <div><p class="text-[#637381] mb-1">{{ t('erp.common.store') }}</p><p class="font-medium text-[#1C2434]">{{ sr.store?.name || '—' }}</p></div>
            <div v-if="sr.type === 'customer_return'">
              <p class="text-[#637381] mb-1">{{ t('erp.stockReturn.customer') }}</p>
              <p class="font-medium text-[#1C2434]">{{ sr.customer?.name || '—' }}</p>
              <p v-if="sr.customer?.company" class="text-xs text-[#9BA7B0]">{{ sr.customer.company }}</p>
            </div>
            <div v-else>
              <p class="text-[#637381] mb-1">{{ t('erp.stockReturn.vendor') }}</p>
              <p class="font-medium text-[#1C2434]">{{ sr.vendor?.name || '—' }}</p>
              <p v-if="sr.vendor?.code" class="text-xs text-[#9BA7B0] font-mono">{{ sr.vendor.code }}</p>
            </div>
            <div><p class="text-[#637381] mb-1">{{ t('erp.common.notes') }}</p><p class="text-[#374151]">{{ sr.notes || '—' }}</p></div>
          </div>

          <div class="pt-3 border-t border-[#E2E8F0] text-xs"
            :class="sr.type === 'customer_return' ? 'text-blue-600' : 'text-orange-600'">
            <span v-if="sr.type === 'customer_return'">
              {{ t('erp.stockReturn.descCustomer') }}
            </span>
            <span v-else>
              {{ t('erp.stockReturn.descVendor') }}
            </span>
          </div>
        </div>

        <!-- Items -->
        <div class="bg-white rounded-2xl border border-[#E2E8F0] overflow-hidden">
          <div class="px-5 py-3 border-b border-[#E2E8F0]">
            <h2 class="text-sm font-semibold text-[#374151]">{{ t('erp.common.items') }}</h2>
          </div>
          <table class="w-full text-sm">
            <thead class="bg-[#F7F9FC] border-b border-[#E2E8F0] text-left">
              <tr>
                <th class="px-5 py-3 font-medium text-[#637381]">{{ t('erp.stockReturn.colProduct') }}</th>
                <th class="px-5 py-3 font-medium text-[#637381]">{{ t('erp.stockReturn.colSku') }}</th>
                <th class="px-5 py-3 font-medium text-[#637381] text-right">{{ t('erp.stockReturn.colQty') }}</th>
                <th class="px-5 py-3 font-medium text-[#637381] text-right">{{ t('erp.stockReturn.colCost') }}</th>
                <th class="px-5 py-3 font-medium text-[#637381]">{{ t('erp.stockReturn.colReason') }}</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-[#E2E8F0]">
              <tr v-for="item in sr.items" :key="item.id" class="hover:bg-[#F7F9FC]">
                <td class="px-5 py-3 font-medium text-[#1C2434]">{{ item.product?.name }}</td>
                <td class="px-5 py-3 font-mono text-xs text-[#9BA7B0]">{{ item.product?.sku || '—' }}</td>
                <td class="px-5 py-3 text-right font-semibold"
                  :class="sr.type === 'customer_return' ? 'text-green-700' : 'text-red-600'">
                  {{ sr.type === 'customer_return' ? '+' : '−' }}{{ Number(item.qty) }}
                </td>
                <td class="px-5 py-3 text-right text-[#637381]">{{ fmtMoney(item.cost) }}</td>
                <td class="px-5 py-3 text-[#637381] text-xs">{{ item.reason || '—' }}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div v-if="error" class="bg-red-50 text-red-700 text-sm px-4 py-2 rounded-lg">{{ error }}</div>

        <!-- Actions -->
        <div class="flex justify-between items-center">
          <button v-if="sr.status === 'draft'" @click="deleteSR"
            class="px-4 py-2 text-sm text-red-500 border border-red-200 rounded-lg hover:bg-red-50 transition">
            {{ t('erp.common.deleteDraft') }}
          </button>
          <div class="flex gap-3 ml-auto">
            <RouterLink to="/erp/stock-return" class="px-4 py-2 text-sm border rounded-lg hover:bg-[#F7F9FC] transition">{{ t('erp.common.back') }}</RouterLink>
            <button v-if="sr.status === 'draft'" @click="confirmSR" :disabled="confirming"
              class="px-5 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition">
              {{ confirming ? t('erp.common.confirming') : t('erp.stockReturn.confirmReturn') }}
            </button>
          </div>
        </div>
      </template>
    </div>
  </AppLayout>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { ArrowLeftIcon } from '@heroicons/vue/24/outline'
import AppLayout from '@/layouts/AppLayout.vue'
import api from '@/api'
import { fmtMoney } from '@/utils/fmt'

const { t } = useI18n()
const route     = useRoute()
const router    = useRouter()
const sr        = ref(null)
const loading   = ref(true)
const confirming = ref(false)
const error     = ref('')

async function load() {
  try {
    const { data } = await api.get(`/erp/stock-return/${route.params.id}`)
    sr.value = data.data.stockReturn
  } catch {
    sr.value = null
  } finally {
    loading.value = false
  }
}

onMounted(load)

function typeClass(type) {
  return type === 'customer_return' ? 'bg-blue-100 text-blue-700' : 'bg-orange-100 text-orange-700'
}

async function confirmSR() {
  if (!confirm('Confirm this Stock Return? Stock will be updated and this cannot be undone.')) return
  confirming.value = true
  error.value = ''
  try {
    const { data } = await api.post(`/erp/stock-return/${route.params.id}/confirm`)
    sr.value = data.data.stockReturn
  } catch (err) {
    error.value = err.response?.data?.message || 'Failed to confirm'
  } finally {
    confirming.value = false
  }
}

async function deleteSR() {
  if (!confirm('Delete this draft? This cannot be undone.')) return
  try {
    await api.delete(`/erp/stock-return/${route.params.id}`)
    router.push('/erp/stock-return')
  } catch (err) {
    error.value = err.response?.data?.message || 'Delete failed'
  }
}
</script>
