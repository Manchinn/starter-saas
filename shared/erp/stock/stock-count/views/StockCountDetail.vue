<template>
  <AppLayout>
    <div class="space-y-6">
      <div class="flex items-center gap-3">
        <RouterLink to="/erp/stock-count" class="text-[#9BA7B0] hover:text-[#637381] transition">
          <ArrowLeftIcon class="w-5 h-5" />
        </RouterLink>
        <h1 class="text-2xl font-bold text-[#1C2434]">{{ t('erp.stockCount.title') }}</h1>
        <span v-if="sc" :class="sc.status === 'confirmed' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'"
          class="px-2.5 py-0.5 rounded-full text-xs font-medium capitalize">{{ sc?.status }}</span>
        <span v-if="sc?.movementLocked" class="bg-red-100 text-red-700 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider">{{ t('erp.stockCount.locked') }}</span>
      </div>

      <div v-if="loading" class="text-[#9BA7B0] py-12 text-center">Loading…</div>
      <div v-else-if="!sc" class="bg-red-50 text-red-700 text-sm px-4 py-3 rounded-lg">
        {{ t('erp.stockCount.notFound') }} <RouterLink to="/erp/stock-count" class="underline ml-1">{{ t('erp.common.backToList') }}</RouterLink>
      </div>

      <template v-else>
        <!-- Header info -->
        <div class="bg-white rounded-2xl border border-[#E2E8F0] p-6">
          <div class="grid grid-cols-4 gap-6 text-sm">
            <div><p class="text-[#637381] mb-1">{{ t('erp.common.refNo') }}</p><p class="font-mono font-semibold text-[#1C2434]">{{ sc.refNo }}</p></div>
            <div><p class="text-[#637381] mb-1">{{ t('erp.common.date') }}</p><p class="font-medium text-[#1C2434]">{{ sc.date }}</p></div>
            <div><p class="text-[#637381] mb-1">{{ t('erp.common.store') }}</p><p class="font-medium text-[#1C2434]">{{ sc.store?.name || '—' }}</p></div>
            <div><p class="text-[#637381] mb-1">{{ t('erp.common.notes') }}</p><p class="text-[#374151]">{{ sc.notes || '—' }}</p></div>
            <div v-if="sc.status === 'draft'"><p class="text-[#637381] mb-1">{{ t('erp.stockCount.stockMovement') }}</p>
              <label class="flex items-center gap-2 cursor-pointer select-none mt-1">
                <input type="checkbox" v-model="sc.movementLocked" @change="toggleLock" class="w-4 h-4 rounded border-[#CBD5E1] text-primary-500 focus:ring-primary-500">
                <span :class="sc.movementLocked ? 'text-red-600 font-bold' : 'text-[#9BA7B0]'" class="text-xs uppercase">{{ t('erp.stockCount.lockMovements') }}</span>
              </label>
            </div>
            <div v-else><p class="text-[#637381] mb-1">{{ t('erp.stockCount.movementLocked') }}</p><p class="font-medium text-[#1C2434]">{{ sc.movementLocked ? 'Yes' : 'No' }}</p></div>
          </div>
        </div>

        <!-- Summary -->
        <div class="grid grid-cols-3 gap-4">
          <div class="bg-white rounded-2xl border border-[#E2E8F0] p-4 text-center">
            <p class="text-xs text-[#637381] mb-1">{{ t('erp.stockCount.totalProducts') }}</p>
            <p class="text-2xl font-bold text-[#1C2434]">{{ sc.items.length }}</p>
          </div>
          <div class="bg-white rounded-2xl border border-[#E2E8F0] p-4 text-center">
            <p class="text-xs text-[#637381] mb-1">{{ t('erp.stockCount.variancesFound') }}</p>
            <p class="text-2xl font-bold" :class="varianceCount > 0 ? 'text-yellow-600' : 'text-green-600'">
              {{ varianceCount }}
            </p>
          </div>
          <div class="bg-white rounded-2xl border border-[#E2E8F0] p-4 text-center">
            <p class="text-xs text-[#637381] mb-1">{{ t('erp.stockCount.netVariance') }}</p>
            <p class="text-2xl font-bold" :class="netVariance > 0 ? 'text-green-700' : netVariance < 0 ? 'text-red-600' : 'text-[#9BA7B0]'">
              {{ netVariance > 0 ? '+' : '' }}{{ netVariance }}
            </p>
          </div>
        </div>

        <!-- Items table -->
        <div class="bg-white rounded-2xl border border-[#E2E8F0] overflow-hidden">
          <div class="px-5 py-3 border-b border-[#E2E8F0]">
            <h2 class="text-sm font-semibold text-[#374151]">{{ t('erp.stockCount.countDetails') }}</h2>
          </div>
          <table class="w-full text-sm">
            <thead class="bg-[#F7F9FC] border-b border-[#E2E8F0] text-left">
              <tr>
                <th class="px-5 py-3 font-medium text-[#637381]">{{ t('erp.stockCount.colProduct') }}</th>
                <th class="px-5 py-3 font-medium text-[#637381]">{{ t('erp.stockCount.colSku') }}</th>
                <th class="px-5 py-3 font-medium text-[#637381] text-right">{{ t('erp.stockCount.colSystemQty') }}</th>
                <th class="px-5 py-3 font-medium text-[#637381] text-right">{{ t('erp.stockCount.colCountedQty') }}</th>
                <th class="px-5 py-3 font-medium text-[#637381] text-right">{{ t('erp.stockCount.colVariance') }}</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-[#E2E8F0]">
              <tr v-for="item in sc.items" :key="item.id"
                class="hover:bg-[#F7F9FC]"
                :class="variance(item) !== 0 ? '' : ''">
                <td class="px-5 py-3 font-medium text-[#1C2434]">{{ item.product?.name }}</td>
                <td class="px-5 py-3 font-mono text-xs text-[#9BA7B0]">{{ item.product?.sku || '—' }}</td>
                <td class="px-5 py-3 text-right text-[#637381]">{{ item.systemQty }}</td>
                <td class="px-5 py-3 text-right font-semibold text-[#1C2434]">{{ item.countedQty }}</td>
                <td class="px-5 py-3 text-right font-semibold"
                  :class="variance(item) > 0 ? 'text-green-700' : variance(item) < 0 ? 'text-red-600' : 'text-[#9BA7B0]'">
                  {{ variance(item) > 0 ? '+' : '' }}{{ variance(item) }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div v-if="error" class="bg-red-50 text-red-700 text-sm px-4 py-2 rounded-lg">{{ error }}</div>

        <!-- Actions -->
        <div class="flex justify-between items-center">
          <button v-if="sc.status === 'draft'" @click="deleteSc"
            class="px-4 py-2 text-sm text-red-500 border border-red-200 rounded-lg hover:bg-red-50 transition">
            {{ t('erp.common.deleteDraft') }}
          </button>
          <div class="flex gap-3 ml-auto">
            <RouterLink to="/erp/stock-count" class="px-4 py-2 text-sm border rounded-lg hover:bg-[#F7F9FC] transition">{{ t('erp.common.back') }}</RouterLink>
            <button v-if="sc.status === 'draft'" @click="confirmSc" :disabled="confirming"
              class="px-5 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition">
              {{ confirming ? t('erp.common.confirming') : t('erp.stockCount.confirmCount') }}
            </button>
          </div>
        </div>
      </template>
    </div>
  </AppLayout>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { ArrowLeftIcon } from '@heroicons/vue/24/outline'
import AppLayout from '@/layouts/AppLayout.vue'
import api from '@/api'

const { t } = useI18n()
const route = useRoute()
const router = useRouter()
const sc = ref(null)
const loading = ref(true)
const confirming = ref(false)
const error = ref('')

async function load() {
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

function variance(item) {
  return parseFloat(item.countedQty) - parseFloat(item.systemQty)
}

const varianceCount = computed(() => (sc.value?.items || []).filter((i) => variance(i) !== 0).length)
const netVariance   = computed(() => (sc.value?.items || []).reduce((sum, i) => sum + variance(i), 0))

async function confirmSc() {
  if (!confirm('Confirm this stock count? Store stock will be set to the counted quantities. This cannot be undone.')) return
  confirming.value = true
  error.value = ''
  try {
    const { data } = await api.post(`/erp/stock-count/${route.params.id}/confirm`)
    sc.value = data.data.stockCount
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
  if (!confirm('Delete this draft? This cannot be undone.')) return
  try {
    await api.delete(`/erp/stock-count/${route.params.id}`)
    router.push('/erp/stock-count')
  } catch (err) {
    error.value = err.response?.data?.message || 'Delete failed'
  }
}
</script>
