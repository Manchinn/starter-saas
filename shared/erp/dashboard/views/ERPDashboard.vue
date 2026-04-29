<template>
  <AppLayout>
    <div class="space-y-6">

      <!-- ── Header ──────────────────────────────────────────────────────────── -->
      <div class="flex items-start justify-between">
        <div>
          <h1 class="text-2xl font-bold text-[#1C2434]">{{ t('erp.dashboard.title') }}</h1>
          <p class="text-sm text-[#637381] mt-0.5">
            {{ greeting }}, <span class="font-medium text-[#374151]">{{ auth.user?.name }}</span>
          </p>
        </div>
        <div class="flex items-center gap-3">
          <span class="hidden sm:block text-xs text-[#9BA7B0] text-right leading-5">
            {{ todayLabel }}<br />
            <span v-if="lastUpdated" class="text-[#CBD5E1]">Updated {{ lastUpdated }}</span>
          </span>
          <button @click="loadStats" :disabled="loading"
            class="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-[#637381]
                   bg-white border border-[#E2E8F0] rounded-lg hover:bg-[#F7F9FC] transition-colors
                   disabled:opacity-50">
            <ArrowPathIcon class="w-3.5 h-3.5" :class="loading ? 'animate-spin' : ''" />
            {{ t('erp.dashboard.refresh') }}
          </button>
        </div>
      </div>

      <!-- ── Alert Banner ────────────────────────────────────────────────────── -->
      <div v-if="!loading && (criticalAlerts.length > 0)"
        class="flex items-start gap-3 bg-red-50 border border-red-200 rounded-xl px-5 py-4">
        <ExclamationTriangleIcon class="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
        <div class="flex-1 min-w-0">
          <p class="text-sm font-semibold text-red-800">{{ t('erp.dashboard.actionRequired') }}</p>
          <div class="mt-1 flex flex-wrap gap-x-4 gap-y-1">
            <span v-for="alert in criticalAlerts" :key="alert" class="text-xs text-red-600">· {{ alert }}</span>
          </div>
        </div>
      </div>

      <!-- ── KPI Cards ───────────────────────────────────────────────────────── -->
      <div class="grid grid-cols-2 xl:grid-cols-4 gap-4">

        <!-- Active Products -->
        <div class="bg-white rounded-2xl border border-[#E2E8F0] shadow-sm p-5 flex items-start gap-4">
          <div class="w-11 h-11 rounded-xl bg-blue-50 flex items-center justify-center flex-shrink-0">
            <CubeIcon class="w-5 h-5 text-blue-600" />
          </div>
          <div class="min-w-0">
            <p class="text-xs font-medium text-[#637381]">{{ t('erp.dashboard.activeProducts') }}</p>
            <div v-if="loading" class="mt-1 h-7 w-16 bg-[#F1F5F9] rounded animate-pulse" />
            <p v-else class="text-2xl font-extrabold text-[#1C2434] leading-none mt-1">
              {{ stats.products?.active ?? '—' }}
            </p>
            <p v-if="!loading && stats.products" class="text-xs text-[#9BA7B0] mt-1">
              of {{ stats.products.total }} total
            </p>
          </div>
        </div>

        <!-- Total Stock -->
        <div class="bg-white rounded-2xl border border-[#E2E8F0] shadow-sm p-5 flex items-start gap-4">
          <div class="w-11 h-11 rounded-xl bg-emerald-50 flex items-center justify-center flex-shrink-0">
            <ArchiveBoxIcon class="w-5 h-5 text-emerald-600" />
          </div>
          <div class="min-w-0">
            <p class="text-xs font-medium text-[#637381]">{{ t('erp.dashboard.stockOnHand') }}</p>
            <div v-if="loading" class="mt-1 h-7 w-20 bg-[#F1F5F9] rounded animate-pulse" />
            <p v-else class="text-2xl font-extrabold text-[#1C2434] leading-none mt-1">
              {{ fmtNumber(stats.products?.totalStock) }}
            </p>
            <p class="text-xs text-[#9BA7B0] mt-1">{{ t('erp.dashboard.acrossAllStores') }}</p>
          </div>
        </div>

        <!-- Out of Stock -->
        <div class="bg-white rounded-2xl border border-[#E2E8F0] shadow-sm p-5 flex items-start gap-4"
          :class="(stats.products?.zeroStock ?? 0) > 0 ? 'border-red-200 bg-red-50/30' : ''">
          <div class="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
            :class="(stats.products?.zeroStock ?? 0) > 0 ? 'bg-red-100' : 'bg-[#F1F5F9]'">
            <ExclamationTriangleIcon class="w-5 h-5"
              :class="(stats.products?.zeroStock ?? 0) > 0 ? 'text-red-600' : 'text-[#9BA7B0]'" />
          </div>
          <div class="min-w-0">
            <p class="text-xs font-medium text-[#637381]">{{ t('erp.dashboard.outOfStock') }}</p>
            <div v-if="loading" class="mt-1 h-7 w-10 bg-[#F1F5F9] rounded animate-pulse" />
            <p v-else class="text-2xl font-extrabold leading-none mt-1"
              :class="(stats.products?.zeroStock ?? 0) > 0 ? 'text-red-600' : 'text-[#9BA7B0]'">
              {{ stats.products?.zeroStock ?? '—' }}
            </p>
            <p class="text-xs mt-1" :class="(stats.products?.zeroStock ?? 0) > 0 ? 'text-red-400' : 'text-[#9BA7B0]'">
              {{ (stats.products?.zeroStock ?? 0) > 0 ? t('erp.dashboard.needsRestocking') : t('erp.dashboard.allStocked') }}
            </p>
          </div>
        </div>

        <!-- Today Receives -->
        <div class="bg-white rounded-2xl border border-[#E2E8F0] shadow-sm p-5 flex items-start gap-4">
          <div class="w-11 h-11 rounded-xl bg-amber-50 flex items-center justify-center flex-shrink-0">
            <TruckIcon class="w-5 h-5 text-amber-600" />
          </div>
          <div class="min-w-0">
            <p class="text-xs font-medium text-[#637381]">{{ t('erp.dashboard.todayReceives') }}</p>
            <div v-if="loading" class="mt-1 h-7 w-10 bg-[#F1F5F9] rounded animate-pulse" />
            <p v-else class="text-2xl font-extrabold text-[#1C2434] leading-none mt-1">
              {{ stats.todayGoodReceives ?? '—' }}
            </p>
            <p class="text-xs text-[#9BA7B0] mt-1">{{ t('erp.dashboard.goodsReceivedToday') }}</p>
          </div>
        </div>

      </div>

      <!-- ── Middle Row ──────────────────────────────────────────────────────── -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-5">

        <!-- Pending Approvals ──────────────────────────────────────────────── -->
        <div class="bg-white rounded-2xl border border-[#E2E8F0] shadow-sm overflow-hidden">
          <div class="px-5 py-4 border-b border-[#E2E8F0] flex items-center justify-between">
            <div class="flex items-center gap-2.5">
              <div class="w-7 h-7 rounded-lg bg-amber-50 flex items-center justify-center">
                <ClockIcon class="w-4 h-4 text-amber-600" />
              </div>
              <h2 class="text-sm font-semibold text-[#1C2434]">{{ t('erp.dashboard.pendingApprovals') }}</h2>
            </div>
            <span v-if="!loading && totalPending > 0"
              class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold
                     bg-amber-100 text-amber-700">
              {{ totalPending }}
            </span>
          </div>
          <div class="divide-y divide-[#E2E8F0]">

            <!-- Good Receives -->
            <RouterLink to="/erp/good-receive"
              class="flex items-center gap-3 px-5 py-3.5 hover:bg-[#F7F9FC] transition-colors group">
              <div class="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center flex-shrink-0">
                <TruckIcon class="w-4.5 h-4.5 text-blue-500" />
              </div>
              <div class="flex-1 min-w-0">
                <p class="text-sm font-medium text-[#1C2434]">{{ t('erp.dashboard.goodsReceive') }}</p>
                <p class="text-xs text-[#9BA7B0]">{{ t('erp.dashboard.pendingConfirm') }}</p>
              </div>
              <div class="flex items-center gap-2 flex-shrink-0">
                <span class="px-2.5 py-0.5 rounded-full text-xs font-bold"
                  :class="(stats.pending?.goodReceives ?? 0) > 0
                    ? 'bg-amber-100 text-amber-700'
                    : 'bg-[#F1F5F9] text-[#9BA7B0]'">
                  {{ loading ? '…' : (stats.pending?.goodReceives ?? 0) }}
                </span>
                <ChevronRightIcon class="w-4 h-4 text-[#CBD5E1] group-hover:text-[#637381] transition-colors" />
              </div>
            </RouterLink>

            <!-- Stock Adjustments -->
            <RouterLink to="/erp/stock-adjust"
              class="flex items-center gap-3 px-5 py-3.5 hover:bg-[#F7F9FC] transition-colors group">
              <div class="w-9 h-9 rounded-xl bg-purple-50 flex items-center justify-center flex-shrink-0">
                <AdjustmentsHorizontalIcon class="w-4.5 h-4.5 text-purple-500" />
              </div>
              <div class="flex-1 min-w-0">
                <p class="text-sm font-medium text-[#1C2434]">{{ t('erp.dashboard.stockAdjustments') }}</p>
                <p class="text-xs text-[#9BA7B0]">{{ t('erp.dashboard.awaitingApproval') }}</p>
              </div>
              <div class="flex items-center gap-2 flex-shrink-0">
                <span class="px-2.5 py-0.5 rounded-full text-xs font-bold"
                  :class="(stats.pending?.adjustments ?? 0) > 0
                    ? 'bg-amber-100 text-amber-700'
                    : 'bg-[#F1F5F9] text-[#9BA7B0]'">
                  {{ loading ? '…' : (stats.pending?.adjustments ?? 0) }}
                </span>
                <ChevronRightIcon class="w-4 h-4 text-[#CBD5E1] group-hover:text-[#637381] transition-colors" />
              </div>
            </RouterLink>

            <!-- Stock Transfers -->
            <RouterLink to="/erp/stock-request"
              class="flex items-center gap-3 px-5 py-3.5 hover:bg-[#F7F9FC] transition-colors group">
              <div class="w-9 h-9 rounded-xl bg-teal-50 flex items-center justify-center flex-shrink-0">
                <ArrowsRightLeftIcon class="w-4.5 h-4.5 text-teal-500" />
              </div>
              <div class="flex-1 min-w-0">
                <p class="text-sm font-medium text-[#1C2434]">{{ t('erp.dashboard.stockTransfers') }}</p>
                <p class="text-xs text-[#9BA7B0]">{{ t('erp.dashboard.inTransit') }}</p>
              </div>
              <div class="flex items-center gap-2 flex-shrink-0">
                <span class="px-2.5 py-0.5 rounded-full text-xs font-bold"
                  :class="(stats.pending?.stockRequests ?? 0) > 0
                    ? 'bg-amber-100 text-amber-700'
                    : 'bg-[#F1F5F9] text-[#9BA7B0]'">
                  {{ loading ? '…' : (stats.pending?.stockRequests ?? 0) }}
                </span>
                <ChevronRightIcon class="w-4 h-4 text-[#CBD5E1] group-hover:text-[#637381] transition-colors" />
              </div>
            </RouterLink>

          </div>
        </div>

        <!-- Stock by Store ──────────────────────────────────────────────────── -->
        <div class="bg-white rounded-2xl border border-[#E2E8F0] shadow-sm overflow-hidden">
          <div class="px-5 py-4 border-b border-[#E2E8F0] flex items-center gap-2.5">
            <div class="w-7 h-7 rounded-lg bg-emerald-50 flex items-center justify-center">
              <BuildingStorefrontIcon class="w-4 h-4 text-emerald-600" />
            </div>
            <h2 class="text-sm font-semibold text-[#1C2434]">{{ t('erp.dashboard.stockByStore') }}</h2>
          </div>
          <div class="px-5 py-4">
            <!-- Skeleton -->
            <div v-if="loading" class="space-y-4">
              <div v-for="i in 4" :key="i" class="space-y-1.5">
                <div class="h-3 bg-[#F1F5F9] rounded animate-pulse w-1/2" />
                <div class="h-2 bg-[#F1F5F9] rounded-full animate-pulse" />
              </div>
            </div>
            <!-- Empty -->
            <div v-else-if="!stats.storeStockSummary?.length"
              class="flex flex-col items-center justify-center py-8 text-center">
              <BuildingStorefrontIcon class="w-8 h-8 text-slate-200 mb-2" />
              <p class="text-sm text-[#9BA7B0]">{{ t('erp.dashboard.noStoreStock') }}</p>
            </div>
            <!-- Data -->
            <div v-else class="space-y-4">
              <div v-for="s in stats.storeStockSummary" :key="s.store?.id">
                <div class="flex items-center justify-between mb-1.5">
                  <span class="text-sm font-medium text-[#374151] truncate">{{ s.store?.name }}</span>
                  <span class="text-sm font-bold text-[#1C2434] tabular-nums ml-2 flex-shrink-0">
                    {{ fmtNumber(s.totalStock) }}
                  </span>
                </div>
                <div class="h-2 bg-[#F1F5F9] rounded-full overflow-hidden">
                  <div class="h-full bg-emerald-400 rounded-full transition-all duration-500"
                    :style="{ width: storeBarWidth(s.totalStock) }" />
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Low Stock Alert ─────────────────────────────────────────────────── -->
        <div class="bg-white rounded-2xl border border-[#E2E8F0] shadow-sm overflow-hidden">
          <div class="px-5 py-4 border-b border-[#E2E8F0] flex items-center justify-between">
            <div class="flex items-center gap-2.5">
              <div class="w-7 h-7 rounded-lg bg-red-50 flex items-center justify-center">
                <ExclamationTriangleIcon class="w-4 h-4 text-red-500" />
              </div>
              <div>
                <h2 class="text-sm font-semibold text-[#1C2434]">{{ t('erp.dashboard.lowStock') }}</h2>
                <p class="text-xs text-[#9BA7B0]">{{ t('erp.dashboard.lowStockDesc') }}</p>
              </div>
            </div>
            <RouterLink to="/erp/item-master"
              class="text-xs font-medium text-primary-500 hover:text-primary-500 hover:underline">
              {{ t('erp.dashboard.viewAll') }}
            </RouterLink>
          </div>
          <div class="divide-y divide-[#E2E8F0]">
            <!-- Skeleton -->
            <template v-if="loading">
              <div v-for="i in 5" :key="i" class="px-5 py-3 flex items-center gap-3">
                <div class="w-2 h-2 rounded-full bg-[#F1F5F9] animate-pulse flex-shrink-0" />
                <div class="flex-1 space-y-1">
                  <div class="h-3 bg-[#F1F5F9] rounded animate-pulse w-3/4" />
                  <div class="h-2.5 bg-[#F1F5F9] rounded animate-pulse w-1/3" />
                </div>
                <div class="w-6 h-5 bg-[#F1F5F9] rounded animate-pulse" />
              </div>
            </template>
            <!-- Empty -->
            <div v-else-if="!stats.lowStockProducts?.length"
              class="flex flex-col items-center justify-center py-10 text-center">
              <CheckCircleIcon class="w-9 h-9 text-emerald-300 mb-2" />
              <p class="text-sm font-medium text-[#637381]">{{ t('erp.dashboard.allProductsStocked') }}</p>
              <p class="text-xs text-[#9BA7B0] mt-0.5">{{ t('erp.dashboard.noItemsBelow5') }}</p>
            </div>
            <!-- Items -->
            <RouterLink v-else v-for="p in stats.lowStockProducts" :key="p.id"
              :to="`/erp/item-master/${p.id}/edit`"
              class="flex items-center gap-3 px-5 py-3 hover:bg-[#F7F9FC] transition-colors group">
              <span class="w-2 h-2 rounded-full flex-shrink-0"
                :class="p.stock <= 0 ? 'bg-red-500' : p.stock <= 2 ? 'bg-orange-400' : 'bg-yellow-400'" />
              <div class="flex-1 min-w-0">
                <p class="text-sm font-medium text-[#1C2434] truncate group-hover:text-primary-500 transition-colors">
                  {{ p.name }}
                </p>
                <p v-if="p.sku" class="text-xs font-mono text-[#9BA7B0]">{{ p.sku }}</p>
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
      <div class="bg-white rounded-2xl border border-[#E2E8F0] shadow-sm overflow-hidden">
        <div class="px-6 py-4 border-b border-[#E2E8F0] flex items-center justify-between">
          <div class="flex items-center gap-2.5">
            <div class="w-7 h-7 rounded-lg bg-indigo-50 flex items-center justify-center">
              <ArrowsRightLeftIcon class="w-4 h-4 text-indigo-600" />
            </div>
            <h2 class="text-sm font-semibold text-[#1C2434]">{{ t('erp.dashboard.recentMovements') }}</h2>
          </div>
          <RouterLink to="/erp/stock-movements"
            class="text-xs font-medium text-primary-500 hover:text-primary-500 hover:underline">
            {{ t('erp.dashboard.viewAll') }}
          </RouterLink>
        </div>

        <!-- Skeleton -->
        <div v-if="loading" class="divide-y divide-[#E2E8F0]">
          <div v-for="i in 5" :key="i" class="px-6 py-3.5 flex items-center gap-4">
            <div class="w-8 h-8 rounded-lg bg-[#F1F5F9] animate-pulse flex-shrink-0" />
            <div class="flex-1 space-y-1.5">
              <div class="h-3 bg-[#F1F5F9] rounded animate-pulse w-40" />
              <div class="h-2.5 bg-[#F1F5F9] rounded animate-pulse w-24" />
            </div>
            <div class="h-3 bg-[#F1F5F9] rounded animate-pulse w-16 hidden sm:block" />
            <div class="h-5 bg-[#F1F5F9] rounded-full animate-pulse w-20 hidden md:block" />
            <div class="h-4 bg-[#F1F5F9] rounded animate-pulse w-10" />
          </div>
        </div>

        <!-- Empty -->
        <div v-else-if="!stats.recentMovements?.length"
          class="flex flex-col items-center justify-center py-14 text-center">
          <ArrowsRightLeftIcon class="w-10 h-10 text-slate-200 mb-3" />
          <p class="text-sm font-medium text-[#637381]">{{ t('erp.dashboard.noMovements') }}</p>
          <p class="text-xs text-[#9BA7B0] mt-0.5">{{ t('erp.dashboard.movementsAppear') }}</p>
        </div>

        <!-- Table -->
        <div v-else class="overflow-x-auto">
          <table class="w-full text-sm min-w-[640px]">
            <thead>
              <tr class="bg-[#F7F9FC] border-b border-[#E2E8F0]">
                <th class="px-6 py-3 text-left text-xs font-semibold text-[#9BA7B0] uppercase tracking-wide">{{ t('erp.dashboard.colType') }}</th>
                <th class="px-6 py-3 text-left text-xs font-semibold text-[#9BA7B0] uppercase tracking-wide">{{ t('erp.dashboard.colProduct') }}</th>
                <th class="px-6 py-3 text-left text-xs font-semibold text-[#9BA7B0] uppercase tracking-wide">{{ t('erp.dashboard.colStore') }}</th>
                <th class="px-6 py-3 text-left text-xs font-semibold text-[#9BA7B0] uppercase tracking-wide">{{ t('erp.dashboard.colRef') }}</th>
                <th class="px-6 py-3 text-right text-xs font-semibold text-[#9BA7B0] uppercase tracking-wide">{{ t('erp.dashboard.colQty') }}</th>
                <th class="px-6 py-3 text-right text-xs font-semibold text-[#9BA7B0] uppercase tracking-wide">{{ t('erp.dashboard.colStockAfter') }}</th>
                <th class="px-6 py-3 text-right text-xs font-semibold text-[#9BA7B0] uppercase tracking-wide">{{ t('erp.dashboard.colDate') }}</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-[#E2E8F0]">
              <tr v-for="m in stats.recentMovements" :key="m.id"
                class="hover:bg-[#F7F9FC]/60 transition-colors">

                <!-- Type with icon -->
                <td class="px-6 py-3.5">
                  <div class="flex items-center gap-2.5">
                    <div class="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                      :class="movementIconBg(m.type)">
                      <component :is="movementIcon(m.type)" class="w-4 h-4" />
                    </div>
                    <span class="text-xs font-semibold capitalize px-2 py-0.5 rounded-md"
                      :class="movementBadge(m.type)">
                      {{ t('erp.movementTypes.' + m.type, m.type.replace(/_/g, ' ')) }}
                    </span>
                  </div>
                </td>

                <!-- Product -->
                <td class="px-6 py-3.5">
                  <p class="font-semibold text-[#1C2434]">{{ m.product?.name ?? '—' }}</p>
                  <p v-if="m.product?.sku" class="text-xs font-mono text-[#9BA7B0] mt-0.5">{{ m.product.sku }}</p>
                </td>

                <!-- Store -->
                <td class="px-6 py-3.5 text-sm text-[#637381]">{{ m.store?.name ?? '—' }}</td>

                <!-- Reference -->
                <td class="px-6 py-3.5">
                  <span class="font-mono text-xs text-[#637381] bg-[#F1F5F9] px-2 py-0.5 rounded">
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
                  <span class="text-sm font-semibold tabular-nums text-[#637381]">
                    {{ m.stockAfter ?? '—' }}
                  </span>
                </td>

                <!-- Date -->
                <td class="px-6 py-3.5 text-right text-xs text-[#9BA7B0] whitespace-nowrap">
                  {{ fmtDate(m.createdAt) }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- ── Quick Actions ───────────────────────────────────────────────────── -->
      <div class="bg-white rounded-2xl border border-[#E2E8F0] shadow-sm p-5">
        <p class="text-xs font-semibold text-[#9BA7B0] uppercase tracking-wide mb-4">{{ t('erp.dashboard.quickActions') }}</p>
        <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">

          <RouterLink to="/erp/good-receive/create"
            class="flex flex-col items-center gap-2.5 p-4 rounded-2xl border border-[#E2E8F0]
                   hover:border-blue-300 hover:bg-blue-50 transition-all group text-center">
            <div class="w-10 h-10 rounded-xl bg-blue-100 group-hover:bg-blue-200 flex items-center justify-center transition-colors">
              <TruckIcon class="w-5 h-5 text-blue-600" />
            </div>
            <span class="text-xs font-semibold text-[#374151] group-hover:text-blue-700 transition-colors">
              {{ t('erp.dashboard.newGR') }}
            </span>
          </RouterLink>

          <RouterLink to="/erp/orders/create"
            class="flex flex-col items-center gap-2.5 p-4 rounded-2xl border border-[#E2E8F0]
                   hover:border-emerald-300 hover:bg-emerald-50 transition-all group text-center">
            <div class="w-10 h-10 rounded-xl bg-emerald-100 group-hover:bg-emerald-200 flex items-center justify-center transition-colors">
              <ShoppingCartIcon class="w-5 h-5 text-emerald-600" />
            </div>
            <span class="text-xs font-semibold text-[#374151] group-hover:text-emerald-700 transition-colors">
              {{ t('erp.dashboard.newOrder') }}
            </span>
          </RouterLink>

          <RouterLink to="/erp/stock-count/create"
            class="flex flex-col items-center gap-2.5 p-4 rounded-2xl border border-[#E2E8F0]
                   hover:border-purple-300 hover:bg-purple-50 transition-all group text-center">
            <div class="w-10 h-10 rounded-xl bg-purple-100 group-hover:bg-purple-200 flex items-center justify-center transition-colors">
              <ClipboardDocumentCheckIcon class="w-5 h-5 text-purple-600" />
            </div>
            <span class="text-xs font-semibold text-[#374151] group-hover:text-purple-700 transition-colors">
              {{ t('erp.dashboard.stockCount') }}
            </span>
          </RouterLink>

          <RouterLink to="/erp/stock-adjust/create"
            class="flex flex-col items-center gap-2.5 p-4 rounded-2xl border border-[#E2E8F0]
                   hover:border-amber-300 hover:bg-amber-50 transition-all group text-center">
            <div class="w-10 h-10 rounded-xl bg-amber-100 group-hover:bg-amber-200 flex items-center justify-center transition-colors">
              <AdjustmentsHorizontalIcon class="w-5 h-5 text-amber-600" />
            </div>
            <span class="text-xs font-semibold text-[#374151] group-hover:text-amber-700 transition-colors">
              {{ t('erp.dashboard.adjustment') }}
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
import { useI18n } from 'vue-i18n'
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

const { t } = useI18n()
const auth    = useAuthStore()
const stats   = ref({})
const loading = ref(true)
const lastUpdated = ref('')

// ── Greeting ──────────────────────────────────────────────────────────────────
const greeting = computed(() => {
  const h = new Date().getHours()
  if (h < 12) return t('erp.dashboard.greetMorning')
  if (h < 17) return t('erp.dashboard.greetAfternoon')
  return t('erp.dashboard.greetEvening')
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
  return 'bg-[#F1F5F9] text-[#637381]'
}

function movementBadge(type) {
  if (type === 'receive')       return 'bg-blue-50 text-blue-700'
  if (type === 'adjust')        return 'bg-purple-50 text-purple-700'
  if (type === 'transfer_in')   return 'bg-emerald-50 text-emerald-700'
  if (type === 'transfer_out')  return 'bg-orange-50 text-orange-700'
  if (type === 'sale')          return 'bg-red-50 text-red-700'
  if (type === 'return')        return 'bg-teal-50 text-teal-700'
  return 'bg-[#F1F5F9] text-[#637381]'
}
</script>
