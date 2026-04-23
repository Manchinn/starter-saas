<template>
  <AppLayout>
    <div class="space-y-6">

      <!-- ── Header ──────────────────────────────────────────────────────────── -->
      <div class="flex items-start justify-between">
        <div>
          <h1 class="text-2xl font-bold text-gray-900">ERP Dashboard</h1>
          <p class="text-sm text-gray-500 mt-0.5">
            Good {{ greeting }}, <span class="font-medium text-gray-700">{{ auth.user?.name }}</span>
          </p>
        </div>
        <div class="flex items-center gap-3">
          <span class="hidden sm:block text-xs text-gray-400 text-right leading-5">
            {{ todayLabel }}<br />
            <span v-if="lastUpdated" class="text-gray-300">Updated {{ lastUpdated }}</span>
          </span>
          <button @click="loadStats" :disabled="loading"
            class="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-gray-600
                   bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors
                   disabled:opacity-50">
            <ArrowPathIcon class="w-3.5 h-3.5" :class="loading ? 'animate-spin' : ''" />
            Refresh
          </button>
        </div>
      </div>

      <!-- ── Alert Banner ────────────────────────────────────────────────────── -->
      <div v-if="!loading && (criticalAlerts.length > 0)"
        class="flex items-start gap-3 bg-red-50 border border-red-200 rounded-xl px-5 py-4">
        <ExclamationTriangleIcon class="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
        <div class="flex-1 min-w-0">
          <p class="text-sm font-semibold text-red-800">Action Required</p>
          <div class="mt-1 flex flex-wrap gap-x-4 gap-y-1">
            <span v-for="alert in criticalAlerts" :key="alert" class="text-xs text-red-600">· {{ alert }}</span>
          </div>
        </div>
      </div>

      <!-- ── KPI Cards ───────────────────────────────────────────────────────── -->
      <div class="grid grid-cols-2 xl:grid-cols-4 gap-4">

        <!-- Active Products -->
        <div class="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 flex items-start gap-4">
          <div class="w-11 h-11 rounded-xl bg-blue-50 flex items-center justify-center flex-shrink-0">
            <CubeIcon class="w-5 h-5 text-blue-600" />
          </div>
          <div class="min-w-0">
            <p class="text-xs font-medium text-gray-500">Active Products</p>
            <div v-if="loading" class="mt-1 h-7 w-16 bg-gray-100 rounded animate-pulse" />
            <p v-else class="text-2xl font-extrabold text-gray-900 leading-none mt-1">
              {{ stats.products?.active ?? '—' }}
            </p>
            <p v-if="!loading && stats.products" class="text-xs text-gray-400 mt-1">
              of {{ stats.products.total }} total
            </p>
          </div>
        </div>

        <!-- Total Stock -->
        <div class="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 flex items-start gap-4">
          <div class="w-11 h-11 rounded-xl bg-emerald-50 flex items-center justify-center flex-shrink-0">
            <ArchiveBoxIcon class="w-5 h-5 text-emerald-600" />
          </div>
          <div class="min-w-0">
            <p class="text-xs font-medium text-gray-500">Stock on Hand</p>
            <div v-if="loading" class="mt-1 h-7 w-20 bg-gray-100 rounded animate-pulse" />
            <p v-else class="text-2xl font-extrabold text-gray-900 leading-none mt-1">
              {{ fmtNumber(stats.products?.totalStock) }}
            </p>
            <p class="text-xs text-gray-400 mt-1">across all stores</p>
          </div>
        </div>

        <!-- Out of Stock -->
        <div class="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 flex items-start gap-4"
          :class="(stats.products?.zeroStock ?? 0) > 0 ? 'border-red-200 bg-red-50/30' : ''">
          <div class="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
            :class="(stats.products?.zeroStock ?? 0) > 0 ? 'bg-red-100' : 'bg-gray-100'">
            <ExclamationTriangleIcon class="w-5 h-5"
              :class="(stats.products?.zeroStock ?? 0) > 0 ? 'text-red-600' : 'text-gray-400'" />
          </div>
          <div class="min-w-0">
            <p class="text-xs font-medium text-gray-500">Out of Stock</p>
            <div v-if="loading" class="mt-1 h-7 w-10 bg-gray-100 rounded animate-pulse" />
            <p v-else class="text-2xl font-extrabold leading-none mt-1"
              :class="(stats.products?.zeroStock ?? 0) > 0 ? 'text-red-600' : 'text-gray-400'">
              {{ stats.products?.zeroStock ?? '—' }}
            </p>
            <p class="text-xs mt-1" :class="(stats.products?.zeroStock ?? 0) > 0 ? 'text-red-400' : 'text-gray-400'">
              {{ (stats.products?.zeroStock ?? 0) > 0 ? 'needs restocking' : 'all stocked' }}
            </p>
          </div>
        </div>

        <!-- Today Receives -->
        <div class="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 flex items-start gap-4">
          <div class="w-11 h-11 rounded-xl bg-amber-50 flex items-center justify-center flex-shrink-0">
            <TruckIcon class="w-5 h-5 text-amber-600" />
          </div>
          <div class="min-w-0">
            <p class="text-xs font-medium text-gray-500">Today's Receives</p>
            <div v-if="loading" class="mt-1 h-7 w-10 bg-gray-100 rounded animate-pulse" />
            <p v-else class="text-2xl font-extrabold text-gray-900 leading-none mt-1">
              {{ stats.todayGoodReceives ?? '—' }}
            </p>
            <p class="text-xs text-gray-400 mt-1">goods received today</p>
          </div>
        </div>

      </div>

      <!-- ── Middle Row ──────────────────────────────────────────────────────── -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-5">

        <!-- Pending Approvals ──────────────────────────────────────────────── -->
        <div class="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <div class="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
            <div class="flex items-center gap-2.5">
              <div class="w-7 h-7 rounded-lg bg-amber-50 flex items-center justify-center">
                <ClockIcon class="w-4 h-4 text-amber-600" />
              </div>
              <h2 class="text-sm font-semibold text-gray-800">Pending Approvals</h2>
            </div>
            <span v-if="!loading && totalPending > 0"
              class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold
                     bg-amber-100 text-amber-700">
              {{ totalPending }}
            </span>
          </div>
          <div class="divide-y divide-gray-100">

            <!-- Good Receives -->
            <RouterLink to="/erp/good-receive"
              class="flex items-center gap-3 px-5 py-3.5 hover:bg-gray-50 transition-colors group">
              <div class="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center flex-shrink-0">
                <TruckIcon class="w-4.5 h-4.5 text-blue-500" />
              </div>
              <div class="flex-1 min-w-0">
                <p class="text-sm font-medium text-gray-800">Goods Receive</p>
                <p class="text-xs text-gray-400">Pending confirmation</p>
              </div>
              <div class="flex items-center gap-2 flex-shrink-0">
                <span class="px-2.5 py-0.5 rounded-full text-xs font-bold"
                  :class="(stats.pending?.goodReceives ?? 0) > 0
                    ? 'bg-amber-100 text-amber-700'
                    : 'bg-gray-100 text-gray-400'">
                  {{ loading ? '…' : (stats.pending?.goodReceives ?? 0) }}
                </span>
                <ChevronRightIcon class="w-4 h-4 text-gray-300 group-hover:text-gray-500 transition-colors" />
              </div>
            </RouterLink>

            <!-- Stock Adjustments -->
            <RouterLink to="/erp/stock-adjust"
              class="flex items-center gap-3 px-5 py-3.5 hover:bg-gray-50 transition-colors group">
              <div class="w-9 h-9 rounded-xl bg-purple-50 flex items-center justify-center flex-shrink-0">
                <AdjustmentsHorizontalIcon class="w-4.5 h-4.5 text-purple-500" />
              </div>
              <div class="flex-1 min-w-0">
                <p class="text-sm font-medium text-gray-800">Stock Adjustments</p>
                <p class="text-xs text-gray-400">Awaiting approval</p>
              </div>
              <div class="flex items-center gap-2 flex-shrink-0">
                <span class="px-2.5 py-0.5 rounded-full text-xs font-bold"
                  :class="(stats.pending?.adjustments ?? 0) > 0
                    ? 'bg-amber-100 text-amber-700'
                    : 'bg-gray-100 text-gray-400'">
                  {{ loading ? '…' : (stats.pending?.adjustments ?? 0) }}
                </span>
                <ChevronRightIcon class="w-4 h-4 text-gray-300 group-hover:text-gray-500 transition-colors" />
              </div>
            </RouterLink>

            <!-- Stock Transfers -->
            <RouterLink to="/erp/stock-request"
              class="flex items-center gap-3 px-5 py-3.5 hover:bg-gray-50 transition-colors group">
              <div class="w-9 h-9 rounded-xl bg-teal-50 flex items-center justify-center flex-shrink-0">
                <ArrowsRightLeftIcon class="w-4.5 h-4.5 text-teal-500" />
              </div>
              <div class="flex-1 min-w-0">
                <p class="text-sm font-medium text-gray-800">Stock Transfers</p>
                <p class="text-xs text-gray-400">In transit / pending</p>
              </div>
              <div class="flex items-center gap-2 flex-shrink-0">
                <span class="px-2.5 py-0.5 rounded-full text-xs font-bold"
                  :class="(stats.pending?.stockRequests ?? 0) > 0
                    ? 'bg-amber-100 text-amber-700'
                    : 'bg-gray-100 text-gray-400'">
                  {{ loading ? '…' : (stats.pending?.stockRequests ?? 0) }}
                </span>
                <ChevronRightIcon class="w-4 h-4 text-gray-300 group-hover:text-gray-500 transition-colors" />
              </div>
            </RouterLink>

          </div>
        </div>

        <!-- Stock by Store ──────────────────────────────────────────────────── -->
        <div class="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <div class="px-5 py-4 border-b border-gray-100 flex items-center gap-2.5">
            <div class="w-7 h-7 rounded-lg bg-emerald-50 flex items-center justify-center">
              <BuildingStorefrontIcon class="w-4 h-4 text-emerald-600" />
            </div>
            <h2 class="text-sm font-semibold text-gray-800">Stock by Store</h2>
          </div>
          <div class="px-5 py-4">
            <!-- Skeleton -->
            <div v-if="loading" class="space-y-4">
              <div v-for="i in 4" :key="i" class="space-y-1.5">
                <div class="h-3 bg-gray-100 rounded animate-pulse w-1/2" />
                <div class="h-2 bg-gray-100 rounded-full animate-pulse" />
              </div>
            </div>
            <!-- Empty -->
            <div v-else-if="!stats.storeStockSummary?.length"
              class="flex flex-col items-center justify-center py-8 text-center">
              <BuildingStorefrontIcon class="w-8 h-8 text-gray-200 mb-2" />
              <p class="text-sm text-gray-400">No store stock data</p>
            </div>
            <!-- Data -->
            <div v-else class="space-y-4">
              <div v-for="s in stats.storeStockSummary" :key="s.store?.id">
                <div class="flex items-center justify-between mb-1.5">
                  <span class="text-sm font-medium text-gray-700 truncate">{{ s.store?.name }}</span>
                  <span class="text-sm font-bold text-gray-800 tabular-nums ml-2 flex-shrink-0">
                    {{ fmtNumber(s.totalStock) }}
                  </span>
                </div>
                <div class="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div class="h-full bg-emerald-400 rounded-full transition-all duration-500"
                    :style="{ width: storeBarWidth(s.totalStock) }" />
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Low Stock Alert ─────────────────────────────────────────────────── -->
        <div class="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <div class="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
            <div class="flex items-center gap-2.5">
              <div class="w-7 h-7 rounded-lg bg-red-50 flex items-center justify-center">
                <ExclamationTriangleIcon class="w-4 h-4 text-red-500" />
              </div>
              <div>
                <h2 class="text-sm font-semibold text-gray-800">Low Stock</h2>
                <p class="text-xs text-gray-400">≤ 5 units remaining</p>
              </div>
            </div>
            <RouterLink to="/erp/item-master"
              class="text-xs font-medium text-primary-600 hover:text-primary-700 hover:underline">
              View all
            </RouterLink>
          </div>
          <div class="divide-y divide-gray-100">
            <!-- Skeleton -->
            <template v-if="loading">
              <div v-for="i in 5" :key="i" class="px-5 py-3 flex items-center gap-3">
                <div class="w-2 h-2 rounded-full bg-gray-100 animate-pulse flex-shrink-0" />
                <div class="flex-1 space-y-1">
                  <div class="h-3 bg-gray-100 rounded animate-pulse w-3/4" />
                  <div class="h-2.5 bg-gray-100 rounded animate-pulse w-1/3" />
                </div>
                <div class="w-6 h-5 bg-gray-100 rounded animate-pulse" />
              </div>
            </template>
            <!-- Empty -->
            <div v-else-if="!stats.lowStockProducts?.length"
              class="flex flex-col items-center justify-center py-10 text-center">
              <CheckCircleIcon class="w-9 h-9 text-emerald-300 mb-2" />
              <p class="text-sm font-medium text-gray-500">All products stocked</p>
              <p class="text-xs text-gray-400 mt-0.5">No items below 5 units</p>
            </div>
            <!-- Items -->
            <RouterLink v-else v-for="p in stats.lowStockProducts" :key="p.id"
              :to="`/erp/item-master/${p.id}/edit`"
              class="flex items-center gap-3 px-5 py-3 hover:bg-gray-50 transition-colors group">
              <span class="w-2 h-2 rounded-full flex-shrink-0"
                :class="p.stock <= 0 ? 'bg-red-500' : p.stock <= 2 ? 'bg-orange-400' : 'bg-yellow-400'" />
              <div class="flex-1 min-w-0">
                <p class="text-sm font-medium text-gray-800 truncate group-hover:text-primary-600 transition-colors">
                  {{ p.name }}
                </p>
                <p v-if="p.sku" class="text-xs font-mono text-gray-400">{{ p.sku }}</p>
              </div>
              <span class="flex-shrink-0 text-xs font-bold px-2 py-0.5 rounded-md"
                :class="p.stock <= 0
                  ? 'bg-red-100 text-red-700'
                  : p.stock <= 2
                    ? 'bg-orange-100 text-orange-700'
                    : 'bg-yellow-100 text-yellow-700'">
                {{ p.stock <= 0 ? 'Out' : p.stock }}
              </span>
            </RouterLink>
          </div>
        </div>

      </div>

      <!-- ── Recent Stock Movements ──────────────────────────────────────────── -->
      <div class="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div class="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <div class="flex items-center gap-2.5">
            <div class="w-7 h-7 rounded-lg bg-indigo-50 flex items-center justify-center">
              <ArrowsRightLeftIcon class="w-4 h-4 text-indigo-600" />
            </div>
            <h2 class="text-sm font-semibold text-gray-800">Recent Stock Movements</h2>
          </div>
          <RouterLink to="/erp/stock-movements"
            class="text-xs font-medium text-primary-600 hover:text-primary-700 hover:underline">
            View all
          </RouterLink>
        </div>

        <!-- Skeleton -->
        <div v-if="loading" class="divide-y divide-gray-100">
          <div v-for="i in 5" :key="i" class="px-6 py-3.5 flex items-center gap-4">
            <div class="w-8 h-8 rounded-lg bg-gray-100 animate-pulse flex-shrink-0" />
            <div class="flex-1 space-y-1.5">
              <div class="h-3 bg-gray-100 rounded animate-pulse w-40" />
              <div class="h-2.5 bg-gray-100 rounded animate-pulse w-24" />
            </div>
            <div class="h-3 bg-gray-100 rounded animate-pulse w-16 hidden sm:block" />
            <div class="h-5 bg-gray-100 rounded-full animate-pulse w-20 hidden md:block" />
            <div class="h-4 bg-gray-100 rounded animate-pulse w-10" />
          </div>
        </div>

        <!-- Empty -->
        <div v-else-if="!stats.recentMovements?.length"
          class="flex flex-col items-center justify-center py-14 text-center">
          <ArrowsRightLeftIcon class="w-10 h-10 text-gray-200 mb-3" />
          <p class="text-sm font-medium text-gray-500">No movements yet</p>
          <p class="text-xs text-gray-400 mt-0.5">Stock movements will appear here</p>
        </div>

        <!-- Table -->
        <div v-else class="overflow-x-auto">
          <table class="w-full text-sm min-w-[640px]">
            <thead>
              <tr class="bg-gray-50 border-b border-gray-100">
                <th class="px-6 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wide">Type</th>
                <th class="px-6 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wide">Product</th>
                <th class="px-6 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wide">Store</th>
                <th class="px-6 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wide">Reference</th>
                <th class="px-6 py-3 text-right text-xs font-semibold text-gray-400 uppercase tracking-wide">Qty</th>
                <th class="px-6 py-3 text-right text-xs font-semibold text-gray-400 uppercase tracking-wide">Stock After</th>
                <th class="px-6 py-3 text-right text-xs font-semibold text-gray-400 uppercase tracking-wide">Date</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-100">
              <tr v-for="m in stats.recentMovements" :key="m.id"
                class="hover:bg-gray-50/60 transition-colors">

                <!-- Type with icon -->
                <td class="px-6 py-3.5">
                  <div class="flex items-center gap-2.5">
                    <div class="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                      :class="movementIconBg(m.type)">
                      <component :is="movementIcon(m.type)" class="w-4 h-4" />
                    </div>
                    <span class="text-xs font-semibold capitalize px-2 py-0.5 rounded-md"
                      :class="movementBadge(m.type)">
                      {{ m.type.replace(/_/g, ' ') }}
                    </span>
                  </div>
                </td>

                <!-- Product -->
                <td class="px-6 py-3.5">
                  <p class="font-semibold text-gray-800">{{ m.product?.name ?? '—' }}</p>
                  <p v-if="m.product?.sku" class="text-xs font-mono text-gray-400 mt-0.5">{{ m.product.sku }}</p>
                </td>

                <!-- Store -->
                <td class="px-6 py-3.5 text-sm text-gray-500">{{ m.store?.name ?? '—' }}</td>

                <!-- Reference -->
                <td class="px-6 py-3.5">
                  <span class="font-mono text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
                    {{ m.refNo ?? '—' }}
                  </span>
                </td>

                <!-- Qty -->
                <td class="px-6 py-3.5 text-right">
                  <span class="text-sm font-bold tabular-nums"
                    :class="m.qty > 0 ? 'text-emerald-600' : 'text-red-500'">
                    {{ m.qty > 0 ? '+' : '' }}{{ m.qty }}
                  </span>
                </td>

                <!-- Stock After -->
                <td class="px-6 py-3.5 text-right">
                  <span class="text-sm font-semibold tabular-nums text-gray-600">
                    {{ m.stockAfter ?? '—' }}
                  </span>
                </td>

                <!-- Date -->
                <td class="px-6 py-3.5 text-right text-xs text-gray-400 whitespace-nowrap">
                  {{ fmtDate(m.createdAt) }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- ── Quick Actions ───────────────────────────────────────────────────── -->
      <div class="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
        <p class="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-4">Quick Actions</p>
        <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">

          <RouterLink to="/erp/good-receive/create"
            class="flex flex-col items-center gap-2.5 p-4 rounded-xl border border-gray-200
                   hover:border-blue-300 hover:bg-blue-50 transition-all group text-center">
            <div class="w-10 h-10 rounded-xl bg-blue-100 group-hover:bg-blue-200 flex items-center justify-center transition-colors">
              <TruckIcon class="w-5 h-5 text-blue-600" />
            </div>
            <span class="text-xs font-semibold text-gray-700 group-hover:text-blue-700 transition-colors">
              New GR
            </span>
          </RouterLink>

          <RouterLink to="/erp/orders/create"
            class="flex flex-col items-center gap-2.5 p-4 rounded-xl border border-gray-200
                   hover:border-emerald-300 hover:bg-emerald-50 transition-all group text-center">
            <div class="w-10 h-10 rounded-xl bg-emerald-100 group-hover:bg-emerald-200 flex items-center justify-center transition-colors">
              <ShoppingCartIcon class="w-5 h-5 text-emerald-600" />
            </div>
            <span class="text-xs font-semibold text-gray-700 group-hover:text-emerald-700 transition-colors">
              New Order
            </span>
          </RouterLink>

          <RouterLink to="/erp/stock-count/create"
            class="flex flex-col items-center gap-2.5 p-4 rounded-xl border border-gray-200
                   hover:border-purple-300 hover:bg-purple-50 transition-all group text-center">
            <div class="w-10 h-10 rounded-xl bg-purple-100 group-hover:bg-purple-200 flex items-center justify-center transition-colors">
              <ClipboardDocumentCheckIcon class="w-5 h-5 text-purple-600" />
            </div>
            <span class="text-xs font-semibold text-gray-700 group-hover:text-purple-700 transition-colors">
              Stock Count
            </span>
          </RouterLink>

          <RouterLink to="/erp/stock-adjust/create"
            class="flex flex-col items-center gap-2.5 p-4 rounded-xl border border-gray-200
                   hover:border-amber-300 hover:bg-amber-50 transition-all group text-center">
            <div class="w-10 h-10 rounded-xl bg-amber-100 group-hover:bg-amber-200 flex items-center justify-center transition-colors">
              <AdjustmentsHorizontalIcon class="w-5 h-5 text-amber-600" />
            </div>
            <span class="text-xs font-semibold text-gray-700 group-hover:text-amber-700 transition-colors">
              Adjustment
            </span>
          </RouterLink>

        </div>
      </div>

    </div>
  </AppLayout>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { RouterLink } from 'vue-router'
import AppLayout from '@/layouts/AppLayout.vue'
import { useAuthStore } from '@/stores/auth'
import {
  CubeIcon, ArchiveBoxIcon, ExclamationTriangleIcon,
  TruckIcon, AdjustmentsHorizontalIcon, ArrowPathIcon,
  ArrowsRightLeftIcon, BuildingStorefrontIcon, ClockIcon,
  ChevronRightIcon, CheckCircleIcon, ShoppingCartIcon,
  ClipboardDocumentCheckIcon,
  ArrowDownTrayIcon, ArrowUpTrayIcon, ArrowUturnLeftIcon,
  TagIcon,
} from '@heroicons/vue/24/outline'
import api from '@/api'

const auth    = useAuthStore()
const stats   = ref({})
const loading = ref(true)
const lastUpdated = ref('')

// ── Greeting ──────────────────────────────────────────────────────────────────
const greeting = computed(() => {
  const h = new Date().getHours()
  if (h < 12) return 'morning'
  if (h < 17) return 'afternoon'
  return 'evening'
})

const todayLabel = new Date().toLocaleDateString(undefined, {
  weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
})

// ── Derived ───────────────────────────────────────────────────────────────────
const totalPending = computed(() =>
  (stats.value.pending?.goodReceives ?? 0)
  + (stats.value.pending?.stockRequests ?? 0)
  + (stats.value.pending?.adjustments ?? 0)
)

const criticalAlerts = computed(() => {
  const alerts = []
  const zero = stats.value.products?.zeroStock ?? 0
  if (zero > 0) alerts.push(`${zero} product${zero > 1 ? 's' : ''} out of stock`)
  const pending = totalPending.value
  if (pending > 0) alerts.push(`${pending} pending approval${pending > 1 ? 's' : ''}`)
  return alerts
})

const maxStoreStock = computed(() => {
  const list = stats.value.storeStockSummary ?? []
  return list.reduce((m, s) => Math.max(m, s.totalStock ?? 0), 1)
})

function storeBarWidth(stock) {
  const pct = Math.round(((stock ?? 0) / maxStoreStock.value) * 100)
  return `${Math.max(pct, 2)}%`
}

// ── Data ──────────────────────────────────────────────────────────────────────
async function loadStats() {
  loading.value = true
  try {
    const { data } = await api.get('/erp/dashboard/stats')
    stats.value = data.data
    lastUpdated.value = new Date().toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })
  } catch (err) {
    console.error('Failed to load ERP stats:', err.message)
  } finally {
    loading.value = false
  }
}

onMounted(loadStats)

// ── Formatters ────────────────────────────────────────────────────────────────
function fmtNumber(n) {
  if (n == null) return '—'
  return Number(n).toLocaleString()
}

function fmtDate(d) {
  return new Date(d).toLocaleString(undefined, {
    month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
  })
}

// ── Movement type helpers ─────────────────────────────────────────────────────
function movementIcon(type) {
  if (type === 'receive')       return TruckIcon
  if (type === 'adjust')        return AdjustmentsHorizontalIcon
  if (type === 'transfer_in')   return ArrowDownTrayIcon
  if (type === 'transfer_out')  return ArrowUpTrayIcon
  if (type === 'sale')          return TagIcon
  if (type === 'return')        return ArrowUturnLeftIcon
  return ArrowsRightLeftIcon
}

function movementIconBg(type) {
  if (type === 'receive')       return 'bg-blue-100 text-blue-600'
  if (type === 'adjust')        return 'bg-purple-100 text-purple-600'
  if (type === 'transfer_in')   return 'bg-emerald-100 text-emerald-600'
  if (type === 'transfer_out')  return 'bg-orange-100 text-orange-600'
  if (type === 'sale')          return 'bg-red-100 text-red-600'
  if (type === 'return')        return 'bg-teal-100 text-teal-600'
  return 'bg-gray-100 text-gray-500'
}

function movementBadge(type) {
  if (type === 'receive')       return 'bg-blue-50 text-blue-700'
  if (type === 'adjust')        return 'bg-purple-50 text-purple-700'
  if (type === 'transfer_in')   return 'bg-emerald-50 text-emerald-700'
  if (type === 'transfer_out')  return 'bg-orange-50 text-orange-700'
  if (type === 'sale')          return 'bg-red-50 text-red-700'
  if (type === 'return')        return 'bg-teal-50 text-teal-700'
  return 'bg-gray-100 text-gray-600'
}
</script>
