<template>
  <AppLayout>
    <div class="space-y-6">
      <div class="flex items-center gap-3">
        <RouterLink to="/erp/stock-count" class="text-gray-400 hover:text-gray-600 transition">
          <ArrowLeftIcon class="w-5 h-5" />
        </RouterLink>
        <h1 class="text-2xl font-bold text-gray-900">Stock Count</h1>
        <span v-if="sc" :class="sc.status === 'confirmed' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'"
          class="px-2.5 py-0.5 rounded-full text-xs font-medium capitalize">{{ sc?.status }}</span>
        <span v-if="sc?.movementLocked" class="bg-red-100 text-red-700 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider">Locked</span>
      </div>

      <div v-if="loading" class="text-gray-400 py-12 text-center">Loading…</div>
      <div v-else-if="!sc" class="bg-red-50 text-red-700 text-sm px-4 py-3 rounded-lg">
        Record not found. <RouterLink to="/erp/stock-count" class="underline ml-1">Back to list</RouterLink>
      </div>

      <template v-else>
        <!-- Header info -->
        <div class="bg-white rounded-xl border border-gray-200 p-6">
          <div class="grid grid-cols-4 gap-6 text-sm">
            <div><p class="text-gray-500 mb-1">Ref No</p><p class="font-mono font-semibold text-gray-900">{{ sc.refNo }}</p></div>
            <div><p class="text-gray-500 mb-1">Date</p><p class="font-medium text-gray-900">{{ sc.date }}</p></div>
            <div><p class="text-gray-500 mb-1">Store</p><p class="font-medium text-gray-900">{{ sc.store?.name || '—' }}</p></div>
            <div><p class="text-gray-500 mb-1">Notes</p><p class="text-gray-700">{{ sc.notes || '—' }}</p></div>
            <div v-if="sc.status === 'draft'"><p class="text-gray-500 mb-1">Stock Movement</p>
              <label class="flex items-center gap-2 cursor-pointer select-none mt-1">
                <input type="checkbox" v-model="sc.movementLocked" @change="toggleLock" class="w-4 h-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500">
                <span :class="sc.movementLocked ? 'text-red-600 font-bold' : 'text-gray-400'" class="text-xs uppercase">Lock Movements</span>
              </label>
            </div>
            <div v-else><p class="text-gray-500 mb-1">Movement Locked</p><p class="font-medium text-gray-900">{{ sc.movementLocked ? 'Yes' : 'No' }}</p></div>
          </div>
        </div>

        <!-- Summary -->
        <div class="grid grid-cols-3 gap-4">
          <div class="bg-white rounded-xl border border-gray-200 p-4 text-center">
            <p class="text-xs text-gray-500 mb-1">Total Products</p>
            <p class="text-2xl font-bold text-gray-900">{{ sc.items.length }}</p>
          </div>
          <div class="bg-white rounded-xl border border-gray-200 p-4 text-center">
            <p class="text-xs text-gray-500 mb-1">Variances Found</p>
            <p class="text-2xl font-bold" :class="varianceCount > 0 ? 'text-yellow-600' : 'text-green-600'">
              {{ varianceCount }}
            </p>
          </div>
          <div class="bg-white rounded-xl border border-gray-200 p-4 text-center">
            <p class="text-xs text-gray-500 mb-1">Net Variance</p>
            <p class="text-2xl font-bold" :class="netVariance > 0 ? 'text-green-700' : netVariance < 0 ? 'text-red-600' : 'text-gray-400'">
              {{ netVariance > 0 ? '+' : '' }}{{ netVariance }}
            </p>
          </div>
        </div>

        <!-- Items table -->
        <div class="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div class="px-5 py-3 border-b border-gray-100">
            <h2 class="text-sm font-semibold text-gray-700">Count Details</h2>
          </div>
          <table class="w-full text-sm">
            <thead class="bg-gray-50 border-b border-gray-200 text-left">
              <tr>
                <th class="px-5 py-3 font-medium text-gray-600">Product</th>
                <th class="px-5 py-3 font-medium text-gray-600">SKU</th>
                <th class="px-5 py-3 font-medium text-gray-600 text-right">System Qty</th>
                <th class="px-5 py-3 font-medium text-gray-600 text-right">Counted Qty</th>
                <th class="px-5 py-3 font-medium text-gray-600 text-right">Variance</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-100">
              <tr v-for="item in sc.items" :key="item.id"
                class="hover:bg-gray-50"
                :class="variance(item) !== 0 ? '' : ''">
                <td class="px-5 py-3 font-medium text-gray-900">{{ item.product?.name }}</td>
                <td class="px-5 py-3 font-mono text-xs text-gray-400">{{ item.product?.sku || '—' }}</td>
                <td class="px-5 py-3 text-right text-gray-600">{{ item.systemQty }}</td>
                <td class="px-5 py-3 text-right font-semibold text-gray-900">{{ item.countedQty }}</td>
                <td class="px-5 py-3 text-right font-semibold"
                  :class="variance(item) > 0 ? 'text-green-700' : variance(item) < 0 ? 'text-red-600' : 'text-gray-400'">
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
            Delete Draft
          </button>
          <div class="flex gap-3 ml-auto">
            <RouterLink to="/erp/stock-count" class="px-4 py-2 text-sm border rounded-lg hover:bg-gray-50 transition">Back</RouterLink>
            <button v-if="sc.status === 'draft'" @click="confirmSc" :disabled="confirming"
              class="px-5 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition">
              {{ confirming ? 'Confirming…' : 'Confirm & Apply Count' }}
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
import { ArrowLeftIcon } from '@heroicons/vue/24/outline'
import AppLayout from '@/layouts/AppLayout.vue'
import api from '@/api'

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
