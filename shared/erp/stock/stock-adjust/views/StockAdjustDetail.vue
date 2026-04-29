<template>
  <AppLayout>
    <div class="space-y-6">
      <div class="flex items-center gap-3">
        <RouterLink to="/erp/stock-adjust" class="text-[#9BA7B0] hover:text-[#637381] transition">
          <ArrowLeftIcon class="w-5 h-5" />
        </RouterLink>
        <h1 class="text-2xl font-bold text-[#1C2434]">Stock Adjustment</h1>
        <span v-if="adj" :class="adj.status === 'confirmed' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'"
          class="px-2.5 py-0.5 rounded-full text-xs font-medium capitalize">{{ adj?.status }}</span>
      </div>

      <div v-if="loading" class="text-[#9BA7B0] py-12 text-center">Loading…</div>
      <div v-else-if="!adj" class="bg-red-50 text-red-700 text-sm px-4 py-3 rounded-lg">
        {{ t('erp.stockAdjust.notFound') }} <RouterLink to="/erp/stock-adjust" class="underline ml-1">{{ t('erp.common.backToList') }}</RouterLink>
      </div>

      <template v-else>
        <!-- Header info -->
        <div class="bg-white rounded-2xl border border-[#E2E8F0] p-6">
          <div class="grid grid-cols-5 gap-6 text-sm">
            <div><p class="text-[#637381] mb-1">{{ t('erp.common.refNo') }}</p><p class="font-mono font-semibold text-[#1C2434]">{{ adj.refNo }}</p></div>
            <div><p class="text-[#637381] mb-1">{{ t('erp.common.date') }}</p><p class="font-medium text-[#1C2434]">{{ adj.date }}</p></div>
            <div><p class="text-[#637381] mb-1">{{ t('erp.common.store') }}</p><p class="font-medium text-[#1C2434]">{{ adj.store?.name || '—' }}</p></div>
            <div><p class="text-[#637381] mb-1">{{ t('erp.stockAdjust.reason') }}</p><p class="font-medium text-[#1C2434]">{{ adj.reason || '—' }}</p></div>
            <div><p class="text-[#637381] mb-1">{{ t('erp.common.notes') }}</p><p class="text-[#374151]">{{ adj.notes || '—' }}</p></div>
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
                <th class="px-5 py-3 font-medium text-[#637381]">{{ t('erp.stockAdjust.colProduct') }}</th>
                <th class="px-5 py-3 font-medium text-[#637381]">{{ t('erp.stockAdjust.colSku') }}</th>
                <th class="px-5 py-3 font-medium text-[#637381] text-right">{{ t('erp.stockAdjust.colQtyAdj') }}</th>
                <th class="px-5 py-3 font-medium text-[#637381]">{{ t('erp.stockAdjust.colNotes') }}</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-[#E2E8F0]">
              <tr v-for="item in adj.items" :key="item.id" class="hover:bg-[#F7F9FC]">
                <td class="px-5 py-3 font-medium text-[#1C2434]">{{ item.product?.name }}</td>
                <td class="px-5 py-3 font-mono text-[#637381] text-xs">{{ item.product?.sku || '—' }}</td>
                <td class="px-5 py-3 text-right font-semibold"
                  :class="item.qty > 0 ? 'text-green-700' : 'text-red-600'">
                  {{ item.qty > 0 ? '+' : '' }}{{ item.qty }}
                </td>
                <td class="px-5 py-3 text-[#637381]">{{ item.notes || '—' }}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div v-if="error" class="bg-red-50 text-red-700 text-sm px-4 py-2 rounded-lg">{{ error }}</div>

        <!-- Actions -->
        <div class="flex justify-between items-center">
          <button v-if="adj.status === 'draft'" @click="deleteAdj"
            class="px-4 py-2 text-sm text-red-500 border border-red-200 rounded-lg hover:bg-red-50 transition">
            {{ t('erp.common.deleteDraft') }}
          </button>
          <div class="flex gap-3 ml-auto">
            <RouterLink to="/erp/stock-adjust" class="px-4 py-2 text-sm border rounded-lg hover:bg-[#F7F9FC] transition">{{ t('erp.common.back') }}</RouterLink>
            <button v-if="adj.status === 'draft'" @click="confirmAdj" :disabled="confirming"
              class="px-5 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition">
              {{ confirming ? t('erp.common.confirming') : t('erp.stockAdjust.confirmApply') }}
            </button>
          </div>
        </div>
      </template>
    </div>
  </AppLayout>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute, useRouter } from 'vue-router'
import { ArrowLeftIcon } from '@heroicons/vue/24/outline'
import AppLayout from '@/layouts/AppLayout.vue'
import api from '@/api'

const { t } = useI18n()
const route = useRoute()
const router = useRouter()
const adj = ref(null)
const loading = ref(true)
const confirming = ref(false)
const error = ref('')

async function load() {
  try {
    const { data } = await api.get(`/erp/stock-adjust/${route.params.id}`)
    adj.value = data.data.adjustment
  } catch {
    adj.value = null
  } finally {
    loading.value = false
  }
}

onMounted(load)

async function confirmAdj() {
  if (!confirm('Confirm this adjustment? Stock will be updated and this cannot be undone.')) return
  confirming.value = true
  error.value = ''
  try {
    const { data } = await api.post(`/erp/stock-adjust/${route.params.id}/confirm`)
    adj.value = data.data.adjustment
  } catch (err) {
    error.value = err.response?.data?.message || 'Failed to confirm'
  } finally {
    confirming.value = false
  }
}

async function deleteAdj() {
  if (!confirm('Delete this draft? This cannot be undone.')) return
  try {
    await api.delete(`/erp/stock-adjust/${route.params.id}`)
    router.push('/erp/stock-adjust')
  } catch (err) {
    error.value = err.response?.data?.message || 'Delete failed'
  }
}
</script>
