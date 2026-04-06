<template>
  <AppLayout>
    <div class="space-y-6">

      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-2xl font-bold text-gray-900">ERP Dashboard</h1>
          <p class="text-sm text-gray-500 mt-0.5">Welcome back, {{ auth.user?.name }}</p>
        </div>
        <span class="text-xs text-gray-400">{{ today }}</span>
      </div>

      <!-- KPI Cards -->
      <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div class="bg-white rounded-xl border border-gray-200 p-5 flex items-center gap-4">
          <div class="p-3 rounded-lg bg-blue-500"><CubeIcon class="w-5 h-5 text-white" /></div>
          <div>
            <p class="text-xs text-gray-500">Active Products</p>
            <p class="text-2xl font-bold text-gray-900">{{ stats.products?.active ?? '—' }}</p>
          </div>
        </div>
        <div class="bg-white rounded-xl border border-gray-200 p-5 flex items-center gap-4">
          <div class="p-3 rounded-lg bg-green-500"><ArchiveBoxIcon class="w-5 h-5 text-white" /></div>
          <div>
            <p class="text-xs text-gray-500">Total Stock on Hand</p>
            <p class="text-2xl font-bold text-gray-900">{{ stats.products?.totalStock ?? '—' }}</p>
          </div>
        </div>
        <div class="bg-white rounded-xl border border-gray-200 p-5 flex items-center gap-4">
          <div class="p-3 rounded-lg" :class="(stats.products?.zeroStock ?? 0) > 0 ? 'bg-red-500' : 'bg-gray-400'">
            <ExclamationTriangleIcon class="w-5 h-5 text-white" />
          </div>
          <div>
            <p class="text-xs text-gray-500">Out of Stock</p>
            <p class="text-2xl font-bold" :class="(stats.products?.zeroStock ?? 0) > 0 ? 'text-red-600' : 'text-gray-900'">
              {{ stats.products?.zeroStock ?? '—' }}
            </p>
          </div>
        </div>
        <div class="bg-white rounded-xl border border-gray-200 p-5 flex items-center gap-4">
          <div class="p-3 rounded-lg bg-yellow-500"><TruckIcon class="w-5 h-5 text-white" /></div>
          <div>
            <p class="text-xs text-gray-500">Today's Receives</p>
            <p class="text-2xl font-bold text-gray-900">{{ stats.todayGoodReceives ?? '—' }}</p>
          </div>
        </div>
      </div>

      <!-- Pending Actions + Store Stock -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6">

        <!-- Pending Actions -->
        <div class="bg-white rounded-xl border border-gray-200 p-5 space-y-3">
          <h2 class="text-sm font-semibold text-gray-700">Pending Approvals</h2>
          <RouterLink to="/erp/good-receive" class="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition">
            <div class="flex items-center gap-2">
              <TruckIcon class="w-4 h-4 text-gray-400" />
              <span class="text-sm text-gray-700">Good Receives</span>
            </div>
            <span class="px-2 py-0.5 rounded-full text-xs font-semibold"
              :class="(stats.pending?.goodReceives ?? 0) > 0 ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-100 text-gray-500'">
              {{ stats.pending?.goodReceives ?? 0 }}
            </span>
          </RouterLink>
          <RouterLink to="/erp/stock-adjust" class="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition">
            <div class="flex items-center gap-2">
              <AdjustmentsHorizontalIcon class="w-4 h-4 text-gray-400" />
              <span class="text-sm text-gray-700">Stock Adjustments</span>
            </div>
            <span class="px-2 py-0.5 rounded-full text-xs font-semibold"
              :class="(stats.pending?.adjustments ?? 0) > 0 ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-100 text-gray-500'">
              {{ stats.pending?.adjustments ?? 0 }}
            </span>
          </RouterLink>
          <RouterLink to="/erp/stock-request" class="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition">
            <div class="flex items-center gap-2">
              <ArrowPathIcon class="w-4 h-4 text-gray-400" />
              <span class="text-sm text-gray-700">Stock Requests</span>
            </div>
            <span class="px-2 py-0.5 rounded-full text-xs font-semibold"
              :class="(stats.pending?.stockRequests ?? 0) > 0 ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-100 text-gray-500'">
              {{ stats.pending?.stockRequests ?? 0 }}
            </span>
          </RouterLink>
        </div>

        <!-- Stock by Store -->
        <div class="bg-white rounded-xl border border-gray-200 p-5">
          <h2 class="text-sm font-semibold text-gray-700 mb-3">Stock by Store</h2>
          <div v-if="!stats.storeStockSummary?.length" class="text-sm text-gray-400 py-4 text-center">No store stock yet.</div>
          <div v-else class="space-y-2">
            <div v-for="s in stats.storeStockSummary" :key="s.store?.id"
              class="flex items-center justify-between text-sm">
              <span class="text-gray-700 font-medium truncate">{{ s.store?.name }}</span>
              <span class="font-semibold text-gray-900 ml-2">{{ s.totalStock }}</span>
            </div>
          </div>
        </div>

        <!-- Low Stock Alert -->
        <div class="bg-white rounded-xl border border-gray-200 p-5">
          <h2 class="text-sm font-semibold text-gray-700 mb-3">
            Low Stock
            <span class="ml-1 text-gray-400 font-normal text-xs">(≤ 5 units)</span>
          </h2>
          <div v-if="!stats.lowStockProducts?.length" class="text-sm text-gray-400 py-4 text-center">All products have sufficient stock.</div>
          <div v-else class="space-y-2">
            <RouterLink v-for="p in stats.lowStockProducts" :key="p.id"
              :to="`/erp/item-master/${p.id}/edit`"
              class="flex items-center justify-between text-sm p-2 rounded-lg hover:bg-gray-50 transition">
              <div class="min-w-0">
                <p class="font-medium text-gray-800 truncate">{{ p.name }}</p>
                <p v-if="p.sku" class="text-xs font-mono text-gray-400">{{ p.sku }}</p>
              </div>
              <span class="ml-2 font-semibold shrink-0" :class="p.stock <= 0 ? 'text-red-600' : 'text-yellow-600'">
                {{ p.stock }}
              </span>
            </RouterLink>
          </div>
        </div>
      </div>

      <!-- Recent Stock Movements -->
      <div class="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div class="flex items-center justify-between px-5 py-3 border-b border-gray-100">
          <h2 class="text-sm font-semibold text-gray-700">Recent Stock Movements</h2>
          <RouterLink to="/erp/stock-movements" class="text-xs text-primary-600 hover:underline">View all</RouterLink>
        </div>
        <table class="w-full text-sm">
          <thead class="bg-gray-50 border-b border-gray-100 text-left">
            <tr>
              <th class="px-5 py-2.5 font-medium text-gray-500 text-xs">Date</th>
              <th class="px-5 py-2.5 font-medium text-gray-500 text-xs">Product</th>
              <th class="px-5 py-2.5 font-medium text-gray-500 text-xs">Store</th>
              <th class="px-5 py-2.5 font-medium text-gray-500 text-xs">Type</th>
              <th class="px-5 py-2.5 font-medium text-gray-500 text-xs text-right">Qty</th>
              <th class="px-5 py-2.5 font-medium text-gray-500 text-xs">Ref</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-100">
            <tr v-if="loading"><td colspan="6" class="text-center py-8 text-gray-400">Loading…</td></tr>
            <tr v-else-if="!stats.recentMovements?.length">
              <td colspan="6" class="text-center py-8 text-gray-400">No movements yet.</td>
            </tr>
            <tr v-else v-for="m in stats.recentMovements" :key="m.id" class="hover:bg-gray-50 transition">
              <td class="px-5 py-2.5 text-gray-400 text-xs">{{ fmtDate(m.createdAt) }}</td>
              <td class="px-5 py-2.5 font-medium text-gray-900">{{ m.product?.name }}</td>
              <td class="px-5 py-2.5 text-gray-500">{{ m.store?.name || '—' }}</td>
              <td class="px-5 py-2.5">
                <span :class="typeBadge(m.type)" class="px-2 py-0.5 rounded-full text-xs font-medium capitalize">
                  {{ m.type.replace('_', ' ') }}
                </span>
              </td>
              <td class="px-5 py-2.5 text-right font-semibold" :class="m.qty > 0 ? 'text-green-700' : 'text-red-600'">
                {{ m.qty > 0 ? '+' : '' }}{{ m.qty }}
              </td>
              <td class="px-5 py-2.5 font-mono text-xs text-gray-400">{{ m.refNo || '—' }}</td>
            </tr>
          </tbody>
        </table>
      </div>

    </div>
  </AppLayout>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { RouterLink } from 'vue-router'
import AppLayout from '@/layouts/AppLayout.vue'
import { useAuthStore } from '@/stores/auth'
import {
  CubeIcon, ArchiveBoxIcon, ExclamationTriangleIcon,
  TruckIcon, AdjustmentsHorizontalIcon, ArrowPathIcon,
} from '@heroicons/vue/24/outline'
import api from '@/api'

const auth = useAuthStore()
const stats = ref({})
const loading = ref(true)

const today = new Date().toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })

onMounted(async () => {
  try {
    const { data } = await api.get('/erp/dashboard/stats')
    stats.value = data.data
  } catch (err) {
    console.error('Failed to load ERP stats:', err.message)
  } finally {
    loading.value = false
  }
})

function fmtDate(d) {
  return new Date(d).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
}

function typeBadge(type) {
  if (type === 'receive')      return 'bg-blue-100 text-blue-700'
  if (type === 'adjust')       return 'bg-purple-100 text-purple-700'
  if (type === 'transfer_in')  return 'bg-green-100 text-green-700'
  if (type === 'transfer_out') return 'bg-orange-100 text-orange-700'
  if (type === 'sale')         return 'bg-red-100 text-red-700'
  return 'bg-gray-100 text-gray-600'
}
</script>
