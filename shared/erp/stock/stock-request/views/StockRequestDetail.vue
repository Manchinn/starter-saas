<template>
  <AppLayout>
    <div class="space-y-6">
      <div class="flex items-center gap-3">
        <RouterLink to="/erp/stock-request" class="text-[#9BA7B0] hover:text-[#637381] transition">
          <ArrowLeftIcon class="w-5 h-5" />
        </RouterLink>
        <h1 class="text-2xl font-bold text-[#1C2434]">{{ t('erp.stockTransfer.title') }}</h1>
        <span v-if="req" :class="req.status === 'confirmed' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'"
          class="px-2.5 py-0.5 rounded-full text-xs font-medium capitalize">{{ req?.status }}</span>
      </div>

      <div v-if="loading" class="text-[#9BA7B0] py-12 text-center">Loading…</div>
      <div v-else-if="!req" class="bg-red-50 text-red-700 text-sm px-4 py-3 rounded-lg">
        {{ t('erp.stockTransfer.notFound') }} <RouterLink to="/erp/stock-request" class="underline ml-1">{{ t('erp.common.backToList') }}</RouterLink>
      </div>

      <template v-else>
        <!-- Header info -->
        <div class="bg-white rounded-2xl border border-[#E2E8F0] p-6">
          <div class="grid grid-cols-5 gap-6 text-sm">
            <div><p class="text-[#637381] mb-1">{{ t('erp.common.refNo') }}</p><p class="font-mono font-semibold text-[#1C2434]">{{ req.refNo }}</p></div>
            <div><p class="text-[#637381] mb-1">{{ t('erp.common.date') }}</p><p class="font-medium text-[#1C2434]">{{ fmtDate(req.date) }}</p></div>
            <div>
              <p class="text-[#637381] mb-1">{{ t('erp.stockTransfer.fromStore') }}</p>
              <p class="font-medium text-[#1C2434]">{{ req.fromStore?.name || '—' }}</p>
            </div>
            <div>
              <p class="text-[#637381] mb-1">{{ t('erp.stockTransfer.toStore') }}</p>
              <p class="font-medium text-[#1C2434]">{{ req.toStore?.name || '—' }}</p>
            </div>
            <div><p class="text-[#637381] mb-1">{{ t('erp.common.notes') }}</p><p class="text-[#374151]">{{ req.notes || '—' }}</p></div>
          </div>
        </div>

        <!-- Transfer arrow banner -->
        <div class="flex items-center justify-center gap-4 py-2">
          <span class="px-4 py-2 bg-blue-50 border border-blue-200 rounded-lg text-sm font-semibold text-blue-800">
            {{ req.fromStore?.name }}
          </span>
          <span class="text-2xl text-[#9BA7B0]">→</span>
          <span class="px-4 py-2 bg-green-50 border border-green-200 rounded-lg text-sm font-semibold text-green-800">
            {{ req.toStore?.name }}
          </span>
        </div>

        <!-- Items -->
        <div class="bg-white rounded-2xl border border-[#E2E8F0] overflow-hidden">
          <div class="px-5 py-3 border-b border-[#E2E8F0]">
            <h2 class="text-sm font-semibold text-[#374151]">{{ t('erp.stockTransfer.itemsToTransfer') }}</h2>
          </div>
          <table class="w-full text-sm">
            <thead class="bg-[#F7F9FC] border-b border-[#E2E8F0] text-left">
              <tr>
                <th class="px-5 py-3 font-medium text-[#637381]">{{ t('erp.stockTransfer.colProduct') }}</th>
                <th class="px-5 py-3 font-medium text-[#637381]">{{ t('erp.stockTransfer.colSku') }}</th>
                <th class="px-5 py-3 font-medium text-[#637381] text-right">{{ t('erp.stockTransfer.colQty') }}</th>
                <th class="px-5 py-3 font-medium text-[#637381]">{{ t('erp.stockTransfer.colNotes') }}</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-[#E2E8F0]">
              <tr v-for="item in req.items" :key="item.id" class="hover:bg-[#F7F9FC]">
                <td class="px-5 py-3 font-medium text-[#1C2434]">{{ item.product?.name }}</td>
                <td class="px-5 py-3 font-mono text-[#637381] text-xs">{{ item.product?.sku || '—' }}</td>
                <td class="px-5 py-3 text-right font-semibold text-[#1C2434]">{{ item.qty }}</td>
                <td class="px-5 py-3 text-[#637381]">{{ item.notes || '—' }}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div v-if="error" class="bg-red-50 text-red-700 text-sm px-4 py-2 rounded-lg">{{ error }}</div>

        <!-- Actions -->
        <div class="flex justify-between items-center">
          <button v-if="req.status === 'draft'" @click="deleteReq"
            class="px-4 py-2 text-sm text-red-500 border border-red-200 rounded-lg hover:bg-red-50 transition">
            {{ t('erp.common.deleteDraft') }}
          </button>
          <div class="flex gap-3 ml-auto">
            <RouterLink to="/erp/stock-request" class="px-4 py-2 text-sm border rounded-lg hover:bg-[#F7F9FC] transition">{{ t('erp.common.back') }}</RouterLink>
            <button v-if="req.status === 'draft'" @click="confirmReq" :disabled="confirming"
              class="px-5 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition">
              {{ confirming ? t('erp.stockTransfer.transferring') : t('erp.stockTransfer.approveTransfer') }}
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
import { fmtDate } from '@/utils/fmt'

const { t } = useI18n()
const route = useRoute()
const router = useRouter()
const req = ref(null)
const loading = ref(true)
const confirming = ref(false)
const error = ref('')

async function load() {
  try {
    const { data } = await api.get(`/erp/stock-request/${route.params.id}`)
    req.value = data.data.request
  } catch {
    req.value = null
  } finally {
    loading.value = false
  }
}

onMounted(load)

async function confirmReq() {
  if (!confirm('Approve this request? Stock will be transferred between stores and this cannot be undone.')) return
  confirming.value = true
  error.value = ''
  try {
    const { data } = await api.post(`/erp/stock-request/${route.params.id}/confirm`)
    req.value = data.data.request
  } catch (err) {
    error.value = err.response?.data?.message || 'Failed to confirm'
  } finally {
    confirming.value = false
  }
}

async function deleteReq() {
  if (!confirm('Delete this draft? This cannot be undone.')) return
  try {
    await api.delete(`/erp/stock-request/${route.params.id}`)
    router.push('/erp/stock-request')
  } catch (err) {
    error.value = err.response?.data?.message || 'Delete failed'
  }
}
</script>
