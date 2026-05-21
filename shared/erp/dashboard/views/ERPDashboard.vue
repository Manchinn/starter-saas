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
      <div v-if="!loading && criticalAlerts.length > 0"
        class="flex items-start gap-3 bg-red-50 border border-red-200 rounded-xl px-5 py-4">
        <ExclamationTriangleIcon class="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
        <div class="flex-1 min-w-0">
          <p class="text-sm font-semibold text-red-800">{{ t('erp.dashboard.actionRequired') }}</p>
          <div class="mt-1 flex flex-wrap gap-x-4 gap-y-1">
            <span v-for="alert in criticalAlerts" :key="alert" class="text-xs text-red-600">· {{ alert }}</span>
          </div>
        </div>
      </div>

      <!-- ── Finance Row: GL-backed metrics in base currency ─────────────────── -->
      <div class="grid grid-cols-2 xl:grid-cols-4 gap-4">

        <!-- Sales MTD -->
        <RouterLink to="/erp/invoices"
          class="bg-white rounded-2xl border border-[#E2E8F0] shadow-sm p-5 flex items-start gap-4 hover:border-emerald-200 hover:shadow-md transition-all group">
          <div class="w-11 h-11 rounded-xl bg-emerald-50 flex items-center justify-center flex-shrink-0 group-hover:bg-emerald-100 transition-colors">
            <ArrowTrendingUpIcon class="w-5 h-5 text-emerald-600" />
          </div>
          <div class="min-w-0">
            <p class="text-xs font-medium text-[#637381]">{{ t('erp.dashboard.salesMtd') }}</p>
            <div v-if="loading" class="mt-1 h-7 w-24 bg-[#F1F5F9] rounded animate-pulse" />
            <p v-else class="text-2xl font-extrabold text-[#1C2434] leading-none mt-1 tabular-nums">{{ fmtCurrency(stats.finance?.salesMtd) }}</p>
            <p class="text-xs text-[#9BA7B0] mt-1">{{ t('erp.dashboard.salesMtdDesc') }}</p>
          </div>
        </RouterLink>

        <!-- Outstanding AR -->
        <RouterLink to="/erp/invoices?status=sent"
          class="bg-white rounded-2xl border border-[#E2E8F0] shadow-sm p-5 flex items-start gap-4 hover:border-blue-200 hover:shadow-md transition-all group"
          :class="(stats.finance?.arOverdueCount ?? 0) > 0 ? 'border-red-200 bg-red-50/30' : ''">
          <div class="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:opacity-90 transition-colors"
            :class="(stats.finance?.arOverdueCount ?? 0) > 0 ? 'bg-red-100' : 'bg-blue-50'">
            <CurrencyDollarIcon class="w-5 h-5" :class="(stats.finance?.arOverdueCount ?? 0) > 0 ? 'text-red-600' : 'text-blue-600'" />
          </div>
          <div class="min-w-0">
            <p class="text-xs font-medium text-[#637381]">{{ t('erp.dashboard.outstandingAR') }}</p>
            <div v-if="loading" class="mt-1 h-7 w-24 bg-[#F1F5F9] rounded animate-pulse" />
            <p v-else class="text-2xl font-extrabold text-[#1C2434] leading-none mt-1 tabular-nums">{{ fmtCurrency(stats.finance?.arOutstanding) }}</p>
            <p class="text-xs text-[#9BA7B0] mt-1 flex items-center gap-1">
              <span>{{ t('erp.dashboard.arDesc') }}</span>
              <span v-if="(stats.finance?.arOverdueCount ?? 0) > 0"
                class="inline-flex items-center px-1.5 py-0.5 rounded-md bg-red-100 text-red-700 text-[10px] font-bold">
                {{ stats.finance.arOverdueCount }} {{ t('erp.dashboard.overdue') }}
              </span>
            </p>
          </div>
        </RouterLink>

        <!-- Outstanding AP -->
        <RouterLink to="/erp/purchasing/bills"
          class="bg-white rounded-2xl border border-[#E2E8F0] shadow-sm p-5 flex items-start gap-4 hover:border-amber-200 hover:shadow-md transition-all group">
          <div class="w-11 h-11 rounded-xl bg-amber-50 flex items-center justify-center flex-shrink-0 group-hover:bg-amber-100 transition-colors">
            <BanknotesIcon class="w-5 h-5 text-amber-600" />
          </div>
          <div class="min-w-0">
            <p class="text-xs font-medium text-[#637381]">{{ t('erp.dashboard.outstandingAP') }}</p>
            <div v-if="loading" class="mt-1 h-7 w-24 bg-[#F1F5F9] rounded animate-pulse" />
            <p v-else class="text-2xl font-extrabold text-[#1C2434] leading-none mt-1 tabular-nums">{{ fmtCurrency(stats.finance?.apOutstanding) }}</p>
            <p class="text-xs text-[#9BA7B0] mt-1">{{ t('erp.dashboard.apDesc') }}</p>
          </div>
        </RouterLink>

        <!-- This Period VAT -->
        <RouterLink :to="stats.finance?.vatPeriod ? `/erp/accounting/tax-periods/${stats.finance.vatPeriod.id}/vat-report` : '/erp/accounting/tax-periods'"
          class="bg-white rounded-2xl border border-[#E2E8F0] shadow-sm p-5 flex items-start gap-4 hover:border-slate-300 hover:shadow-md transition-all group">
          <div class="w-11 h-11 rounded-xl bg-slate-50 flex items-center justify-center flex-shrink-0 group-hover:bg-slate-100 transition-colors">
            <DocumentChartBarIcon class="w-5 h-5 text-slate-700" />
          </div>
          <div class="min-w-0">
            <p class="text-xs font-medium text-[#637381]">
              {{ t('erp.dashboard.periodVat') }}
              <span v-if="stats.finance?.vatPeriod" class="text-[#9BA7B0]">· {{ stats.finance.vatPeriod.name }}</span>
            </p>
            <div v-if="loading" class="mt-1 h-7 w-20 bg-[#F1F5F9] rounded animate-pulse" />
            <template v-else-if="stats.finance?.vatPeriod">
              <p class="text-2xl font-extrabold leading-none mt-1 tabular-nums"
                :class="stats.finance.vatPeriod.netPayable >= 0 ? 'text-[#1C2434]' : 'text-emerald-700'">
                {{ fmtCurrency(Math.abs(stats.finance.vatPeriod.netPayable)) }}
              </p>
              <p class="text-xs text-[#9BA7B0] mt-1">
                {{ stats.finance.vatPeriod.netPayable >= 0 ? t('erp.dashboard.vatPayable') : t('erp.dashboard.vatRefundable') }}
              </p>
            </template>
            <template v-else>
              <p class="text-sm font-medium text-[#9BA7B0] mt-1">{{ t('erp.dashboard.noOpenPeriod') }}</p>
            </template>
          </div>
        </RouterLink>

      </div>

      <!-- ── KPI Row 1: Sales Pipeline ───────────────────────────────────────── -->
      <div class="grid grid-cols-2 xl:grid-cols-4 gap-4">

        <!-- Open Quotations -->
        <RouterLink to="/erp/quotations"
          class="bg-white rounded-2xl border border-[#E2E8F0] shadow-sm p-5 flex items-start gap-4 hover:border-violet-200 hover:shadow-md transition-all group">
          <div class="w-11 h-11 rounded-xl bg-violet-50 flex items-center justify-center flex-shrink-0 group-hover:bg-violet-100 transition-colors">
            <DocumentTextIcon class="w-5 h-5 text-violet-600" />
          </div>
          <div class="min-w-0">
            <p class="text-xs font-medium text-[#637381]">{{ t('erp.dashboard.openQuotations') }}</p>
            <div v-if="loading" class="mt-1 h-7 w-12 bg-[#F1F5F9] rounded animate-pulse" />
            <p v-else class="text-2xl font-extrabold text-[#1C2434] leading-none mt-1">
              {{ stats.sales?.openQuotations ?? '—' }}
            </p>
            <p class="text-xs text-[#9BA7B0] mt-1">{{ t('erp.dashboard.openQuotationsDesc') }}</p>
          </div>
        </RouterLink>

        <!-- Active Sales Orders -->
        <RouterLink to="/erp/orders"
          class="bg-white rounded-2xl border border-[#E2E8F0] shadow-sm p-5 flex items-start gap-4 hover:border-emerald-200 hover:shadow-md transition-all group">
          <div class="w-11 h-11 rounded-xl bg-emerald-50 flex items-center justify-center flex-shrink-0 group-hover:bg-emerald-100 transition-colors">
            <ShoppingCartIcon class="w-5 h-5 text-emerald-600" />
          </div>
          <div class="min-w-0">
            <p class="text-xs font-medium text-[#637381]">{{ t('erp.dashboard.activeSalesOrders') }}</p>
            <div v-if="loading" class="mt-1 h-7 w-12 bg-[#F1F5F9] rounded animate-pulse" />
            <p v-else class="text-2xl font-extrabold text-[#1C2434] leading-none mt-1">
              {{ stats.sales?.activeSalesOrders ?? '—' }}
            </p>
            <p class="text-xs text-[#9BA7B0] mt-1">{{ t('erp.dashboard.activeOrdersDesc') }}</p>
          </div>
        </RouterLink>

        <!-- Pending Deliveries -->
        <RouterLink to="/erp/delivery-orders"
          class="bg-white rounded-2xl border border-[#E2E8F0] shadow-sm p-5 flex items-start gap-4 hover:border-amber-200 hover:shadow-md transition-all group">
          <div class="w-11 h-11 rounded-xl bg-amber-50 flex items-center justify-center flex-shrink-0 group-hover:bg-amber-100 transition-colors">
            <TruckIcon class="w-5 h-5 text-amber-600" />
          </div>
          <div class="min-w-0">
            <p class="text-xs font-medium text-[#637381]">{{ t('erp.dashboard.pendingDeliveries') }}</p>
            <div v-if="loading" class="mt-1 h-7 w-12 bg-[#F1F5F9] rounded animate-pulse" />
            <p v-else class="text-2xl font-extrabold text-[#1C2434] leading-none mt-1">
              {{ stats.sales?.pendingDeliveries ?? '—' }}
            </p>
            <p class="text-xs text-[#9BA7B0] mt-1">{{ t('erp.dashboard.pendingDeliveriesDesc') }}</p>
          </div>
        </RouterLink>

        <!-- Sent invoice count (replaces legacy AR tile; the financial AR moved to the Finance row above) -->
        <RouterLink to="/erp/invoices?status=sent"
          class="bg-white rounded-2xl border border-[#E2E8F0] shadow-sm p-5 flex items-start gap-4 hover:border-blue-200 hover:shadow-md transition-all group">
          <div class="w-11 h-11 rounded-xl bg-blue-50 flex items-center justify-center flex-shrink-0 group-hover:bg-blue-100 transition-colors">
            <DocumentTextIcon class="w-5 h-5 text-blue-600" />
          </div>
          <div class="min-w-0">
            <p class="text-xs font-medium text-[#637381]">{{ t('erp.dashboard.sentInvoices') }}</p>
            <div v-if="loading" class="mt-1 h-7 w-12 bg-[#F1F5F9] rounded animate-pulse" />
            <p v-else class="text-2xl font-extrabold text-[#1C2434] leading-none mt-1">{{ stats.invoices?.sentCount ?? '—' }}</p>
            <p class="text-xs text-[#9BA7B0] mt-1">{{ t('erp.dashboard.sentInvoicesDesc') }}</p>
          </div>
        </RouterLink>

      </div>

      <!-- ── KPI Row 2: Inventory & Accounting ──────────────────────────────── -->
      <div class="grid grid-cols-2 xl:grid-cols-4 gap-4">

        <!-- Active Products -->
        <RouterLink to="/erp/item-master"
          class="bg-white rounded-2xl border border-[#E2E8F0] shadow-sm p-5 flex items-start gap-4 hover:border-indigo-200 hover:shadow-md transition-all group">
          <div class="w-11 h-11 rounded-xl bg-indigo-50 flex items-center justify-center flex-shrink-0 group-hover:bg-indigo-100 transition-colors">
            <CubeIcon class="w-5 h-5 text-indigo-600" />
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
        </RouterLink>

        <!-- Stock on Hand -->
        <RouterLink to="/erp/stock-balance"
          class="bg-white rounded-2xl border border-[#E2E8F0] shadow-sm p-5 flex items-start gap-4 hover:border-teal-200 hover:shadow-md transition-all group">
          <div class="w-11 h-11 rounded-xl bg-teal-50 flex items-center justify-center flex-shrink-0 group-hover:bg-teal-100 transition-colors">
            <ArchiveBoxIcon class="w-5 h-5 text-teal-600" />
          </div>
          <div class="min-w-0">
            <p class="text-xs font-medium text-[#637381]">{{ t('erp.dashboard.stockOnHand') }}</p>
            <div v-if="loading" class="mt-1 h-7 w-20 bg-[#F1F5F9] rounded animate-pulse" />
            <p v-else class="text-2xl font-extrabold text-[#1C2434] leading-none mt-1">
              {{ fmtNumber(stats.products?.totalStock) }}
            </p>
            <p class="text-xs text-[#9BA7B0] mt-1">{{ t('erp.dashboard.acrossAllStores') }}</p>
          </div>
        </RouterLink>

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

        <!-- Draft Journals -->
        <RouterLink to="/erp/accounting/journals"
          class="bg-white rounded-2xl border border-[#E2E8F0] shadow-sm p-5 flex items-start gap-4 hover:border-orange-200 hover:shadow-md transition-all group"
          :class="(stats.draftJournals ?? 0) > 0 ? 'border-orange-100 bg-orange-50/20' : ''">
          <div class="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:opacity-90 transition-colors"
            :class="(stats.draftJournals ?? 0) > 0 ? 'bg-orange-100' : 'bg-orange-50'">
            <PencilSquareIcon class="w-5 h-5 text-orange-600" />
          </div>
          <div class="min-w-0">
            <p class="text-xs font-medium text-[#637381]">{{ t('erp.dashboard.draftJournals') }}</p>
            <div v-if="loading" class="mt-1 h-7 w-10 bg-[#F1F5F9] rounded animate-pulse" />
            <p v-else class="text-2xl font-extrabold leading-none mt-1"
              :class="(stats.draftJournals ?? 0) > 0 ? 'text-orange-600' : 'text-[#9BA7B0]'">
              {{ stats.draftJournals ?? '—' }}
            </p>
            <p class="text-xs text-[#9BA7B0] mt-1">{{ t('erp.dashboard.draftJournalsDesc') }}</p>
          </div>
        </RouterLink>

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
              class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-700">
              {{ totalPending }}
            </span>
          </div>
          <div class="divide-y divide-[#E2E8F0]">

            <RouterLink to="/erp/good-receive"
              class="flex items-center gap-3 px-5 py-3.5 hover:bg-[#F7F9FC] transition-colors group">
              <div class="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center flex-shrink-0">
                <TruckIcon class="w-4 h-4 text-blue-500" />
              </div>
              <div class="flex-1 min-w-0">
                <p class="text-sm font-medium text-[#1C2434]">{{ t('erp.dashboard.goodsReceive') }}</p>
                <p class="text-xs text-[#9BA7B0]">{{ t('erp.dashboard.pendingConfirm') }}</p>
              </div>
              <div class="flex items-center gap-2 flex-shrink-0">
                <span class="px-2.5 py-0.5 rounded-full text-xs font-bold"
                  :class="(stats.pending?.goodReceives ?? 0) > 0 ? 'bg-amber-100 text-amber-700' : 'bg-[#F1F5F9] text-[#9BA7B0]'">
                  {{ loading ? '…' : (stats.pending?.goodReceives ?? 0) }}
                </span>
                <ChevronRightIcon class="w-4 h-4 text-[#CBD5E1] group-hover:text-[#637381] transition-colors" />
              </div>
            </RouterLink>

            <RouterLink to="/erp/purchasing/requisitions"
              class="flex items-center gap-3 px-5 py-3.5 hover:bg-[#F7F9FC] transition-colors group">
              <div class="w-9 h-9 rounded-xl bg-violet-50 flex items-center justify-center flex-shrink-0">
                <ClipboardDocumentListIcon class="w-4 h-4 text-violet-500" />
              </div>
              <div class="flex-1 min-w-0">
                <p class="text-sm font-medium text-[#1C2434]">{{ t('erp.dashboard.purchaseRequisitions') }}</p>
                <p class="text-xs text-[#9BA7B0]">{{ t('erp.dashboard.pendingApprovalPR') }}</p>
              </div>
              <div class="flex items-center gap-2 flex-shrink-0">
                <span class="px-2.5 py-0.5 rounded-full text-xs font-bold"
                  :class="(stats.pending?.purchaseRequisitions ?? 0) > 0 ? 'bg-amber-100 text-amber-700' : 'bg-[#F1F5F9] text-[#9BA7B0]'">
                  {{ loading ? '…' : (stats.pending?.purchaseRequisitions ?? 0) }}
                </span>
                <ChevronRightIcon class="w-4 h-4 text-[#CBD5E1] group-hover:text-[#637381] transition-colors" />
              </div>
            </RouterLink>

            <RouterLink to="/erp/purchasing/orders"
              class="flex items-center gap-3 px-5 py-3.5 hover:bg-[#F7F9FC] transition-colors group">
              <div class="w-9 h-9 rounded-xl bg-emerald-50 flex items-center justify-center flex-shrink-0">
                <ShoppingBagIcon class="w-4 h-4 text-emerald-500" />
              </div>
              <div class="flex-1 min-w-0">
                <p class="text-sm font-medium text-[#1C2434]">{{ t('erp.dashboard.purchaseOrders') }}</p>
                <p class="text-xs text-[#9BA7B0]">{{ t('erp.dashboard.pendingReceipt') }}</p>
              </div>
              <div class="flex items-center gap-2 flex-shrink-0">
                <span class="px-2.5 py-0.5 rounded-full text-xs font-bold"
                  :class="(stats.pending?.purchaseOrders ?? 0) > 0 ? 'bg-amber-100 text-amber-700' : 'bg-[#F1F5F9] text-[#9BA7B0]'">
                  {{ loading ? '…' : (stats.pending?.purchaseOrders ?? 0) }}
                </span>
                <ChevronRightIcon class="w-4 h-4 text-[#CBD5E1] group-hover:text-[#637381] transition-colors" />
              </div>
            </RouterLink>

            <RouterLink to="/erp/stock-adjust"
              class="flex items-center gap-3 px-5 py-3.5 hover:bg-[#F7F9FC] transition-colors group">
              <div class="w-9 h-9 rounded-xl bg-purple-50 flex items-center justify-center flex-shrink-0">
                <AdjustmentsHorizontalIcon class="w-4 h-4 text-purple-500" />
              </div>
              <div class="flex-1 min-w-0">
                <p class="text-sm font-medium text-[#1C2434]">{{ t('erp.dashboard.stockAdjustments') }}</p>
                <p class="text-xs text-[#9BA7B0]">{{ t('erp.dashboard.awaitingApproval') }}</p>
              </div>
              <div class="flex items-center gap-2 flex-shrink-0">
                <span class="px-2.5 py-0.5 rounded-full text-xs font-bold"
                  :class="(stats.pending?.adjustments ?? 0) > 0 ? 'bg-amber-100 text-amber-700' : 'bg-[#F1F5F9] text-[#9BA7B0]'">
                  {{ loading ? '…' : (stats.pending?.adjustments ?? 0) }}
                </span>
                <ChevronRightIcon class="w-4 h-4 text-[#CBD5E1] group-hover:text-[#637381] transition-colors" />
              </div>
            </RouterLink>

            <RouterLink to="/erp/stock-request"
              class="flex items-center gap-3 px-5 py-3.5 hover:bg-[#F7F9FC] transition-colors group">
              <div class="w-9 h-9 rounded-xl bg-teal-50 flex items-center justify-center flex-shrink-0">
                <ArrowsRightLeftIcon class="w-4 h-4 text-teal-500" />
              </div>
              <div class="flex-1 min-w-0">
                <p class="text-sm font-medium text-[#1C2434]">{{ t('erp.dashboard.stockTransfers') }}</p>
                <p class="text-xs text-[#9BA7B0]">{{ t('erp.dashboard.inTransit') }}</p>
              </div>
              <div class="flex items-center gap-2 flex-shrink-0">
                <span class="px-2.5 py-0.5 rounded-full text-xs font-bold"
                  :class="(stats.pending?.stockRequests ?? 0) > 0 ? 'bg-amber-100 text-amber-700' : 'bg-[#F1F5F9] text-[#9BA7B0]'">
                  {{ loading ? '…' : (stats.pending?.stockRequests ?? 0) }}
                </span>
                <ChevronRightIcon class="w-4 h-4 text-[#CBD5E1] group-hover:text-[#637381] transition-colors" />
              </div>
            </RouterLink>

          </div>
        </div>

        <!-- Recent Invoices ─────────────────────────────────────────────────── -->
        <div class="bg-white rounded-2xl border border-[#E2E8F0] shadow-sm overflow-hidden">
          <div class="px-5 py-4 border-b border-[#E2E8F0] flex items-center justify-between">
            <div class="flex items-center gap-2.5">
              <div class="w-7 h-7 rounded-lg bg-blue-50 flex items-center justify-center">
                <DocumentTextIcon class="w-4 h-4 text-blue-600" />
              </div>
              <h2 class="text-sm font-semibold text-[#1C2434]">{{ t('erp.dashboard.recentInvoices') }}</h2>
            </div>
            <RouterLink to="/erp/invoices"
              class="text-xs font-medium text-primary-500 hover:underline">
              {{ t('erp.dashboard.viewAll') }}
            </RouterLink>
          </div>
          <div class="divide-y divide-[#E2E8F0]">
            <template v-if="loading">
              <div v-for="i in 5" :key="i" class="px-5 py-3.5 flex items-center gap-3">
                <div class="flex-1 space-y-1.5">
                  <div class="h-3 bg-[#F1F5F9] rounded animate-pulse w-2/3" />
                  <div class="h-2.5 bg-[#F1F5F9] rounded animate-pulse w-1/3" />
                </div>
                <div class="h-5 bg-[#F1F5F9] rounded-full animate-pulse w-14" />
                <div class="h-4 bg-[#F1F5F9] rounded animate-pulse w-16" />
              </div>
            </template>
            <div v-else-if="!stats.recentInvoices?.length"
              class="flex flex-col items-center justify-center py-12 text-center">
              <DocumentTextIcon class="w-9 h-9 text-slate-200 mb-2" />
              <p class="text-sm font-medium text-[#637381]">{{ t('erp.dashboard.noRecentInvoices') }}</p>
              <p class="text-xs text-[#9BA7B0] mt-0.5">{{ t('erp.dashboard.invoicesAppear') }}</p>
            </div>
            <RouterLink v-else v-for="inv in stats.recentInvoices" :key="inv.id"
              :to="`/erp/invoices/${inv.id}`"
              class="flex items-center gap-3 px-5 py-3 hover:bg-[#F7F9FC] transition-colors group">
              <div class="flex-1 min-w-0">
                <p class="text-sm font-medium text-[#1C2434] font-mono group-hover:text-primary-500 transition-colors">
                  {{ inv.invoiceNumber }}
                </p>
                <p class="text-xs text-[#9BA7B0] truncate">{{ inv.customer?.name ?? '—' }}</p>
              </div>
              <span class="flex-shrink-0 text-xs font-semibold px-2 py-0.5 rounded-full capitalize"
                :class="invoiceStatusClass(inv.status)">
                {{ inv.status }}
              </span>
              <span class="flex-shrink-0 text-sm font-bold tabular-nums text-[#1C2434]">
                {{ fmtCurrency(inv.total) }}
              </span>
            </RouterLink>
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
            <div class="flex items-center gap-2">
              <button v-if="stats.lowStockProducts?.length" v-can="'erp.purchasing.edit'"
                @click="generateReorder" :disabled="generatingReorder"
                :title="t('erp.dashboard.generateReorderHint')"
                class="text-xs font-medium px-2.5 py-1 rounded-md bg-primary-50 text-primary-600 border border-primary-200 hover:bg-primary-100 disabled:opacity-50 transition-colors">
                {{ generatingReorder ? t('common.loading') : t('erp.dashboard.generateReorder') }}
              </button>
              <RouterLink to="/erp/item-master"
                class="text-xs font-medium text-primary-500 hover:underline">
                {{ t('erp.dashboard.viewAll') }}
              </RouterLink>
            </div>
          </div>
          <div v-if="reorderResult" class="px-5 py-2.5 bg-emerald-50 border-y border-emerald-200 text-xs text-emerald-800">
            {{ reorderResult.message }}
            <span v-if="reorderResult.created?.length" class="ml-1">
              <RouterLink v-for="r in reorderResult.created" :key="r.id"
                :to="`/erp/purchasing/requisitions/${r.id}`"
                class="ml-1 font-mono font-semibold underline hover:text-emerald-900">
                {{ r.refNo }}
              </RouterLink>
            </span>
          </div>
          <div v-if="reorderError" class="px-5 py-2.5 bg-red-50 border-y border-red-200 text-xs text-red-700">{{ reorderError }}</div>
          <div class="divide-y divide-[#E2E8F0]">
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
            <div v-else-if="!stats.lowStockProducts?.length"
              class="flex flex-col items-center justify-center py-10 text-center">
              <CheckCircleIcon class="w-9 h-9 text-emerald-300 mb-2" />
              <p class="text-sm font-medium text-[#637381]">{{ t('erp.dashboard.allProductsStocked') }}</p>
              <p class="text-xs text-[#9BA7B0] mt-0.5">{{ t('erp.dashboard.noItemsBelow5') }}</p>
            </div>
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
                :class="p.stock <= 0 ? 'bg-red-100 text-red-700' : p.stock <= 2 ? 'bg-orange-100 text-orange-700' : 'bg-yellow-100 text-yellow-700'">
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
            class="text-xs font-medium text-primary-500 hover:underline">
            {{ t('erp.dashboard.viewAll') }}
          </RouterLink>
        </div>

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

        <div v-else-if="!stats.recentMovements?.length"
          class="flex flex-col items-center justify-center py-14 text-center">
          <ArrowsRightLeftIcon class="w-10 h-10 text-slate-200 mb-3" />
          <p class="text-sm font-medium text-[#637381]">{{ t('erp.dashboard.noMovements') }}</p>
          <p class="text-xs text-[#9BA7B0] mt-0.5">{{ t('erp.dashboard.movementsAppear') }}</p>
        </div>

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
              <tr v-for="m in stats.recentMovements" :key="m.id" class="hover:bg-[#F7F9FC]/60 transition-colors">
                <td class="px-6 py-3.5">
                  <div class="flex items-center gap-2.5">
                    <div class="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" :class="movementIconBg(m.type)">
                      <component :is="movementIcon(m.type)" class="w-4 h-4" />
                    </div>
                    <span class="text-xs font-semibold capitalize px-2 py-0.5 rounded-md" :class="movementBadge(m.type)">
                      {{ t('erp.movementTypes.' + m.type, m.type.replace(/_/g, ' ')) }}
                    </span>
                  </div>
                </td>
                <td class="px-6 py-3.5">
                  <p class="font-semibold text-[#1C2434]">{{ m.product?.name ?? '—' }}</p>
                  <p v-if="m.product?.sku" class="text-xs font-mono text-[#9BA7B0] mt-0.5">{{ m.product.sku }}</p>
                </td>
                <td class="px-6 py-3.5 text-sm text-[#637381]">{{ m.store?.name ?? '—' }}</td>
                <td class="px-6 py-3.5">
                  <span class="font-mono text-xs text-[#637381] bg-[#F1F5F9] px-2 py-0.5 rounded">{{ m.refNo ?? '—' }}</span>
                </td>
                <td class="px-6 py-3.5 text-right">
                  <span class="text-sm font-bold tabular-nums" :class="m.qty > 0 ? 'text-emerald-600' : 'text-red-500'">
                    {{ m.qty > 0 ? '+' : '' }}{{ m.qty }}
                  </span>
                </td>
                <td class="px-6 py-3.5 text-right">
                  <span class="text-sm font-semibold tabular-nums text-[#637381]">{{ m.stockAfter ?? '—' }}</span>
                </td>
                <td class="px-6 py-3.5 text-right text-xs text-[#9BA7B0] whitespace-nowrap">
                  {{ fmtDateTime(m.createdAt) }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- ── Quick Actions ───────────────────────────────────────────────────── -->
      <div class="bg-white rounded-2xl border border-[#E2E8F0] shadow-sm p-5">
        <p class="text-xs font-semibold text-[#9BA7B0] uppercase tracking-wide mb-4">{{ t('erp.dashboard.quickActions') }}</p>
        <div class="grid grid-cols-3 sm:grid-cols-6 gap-3">

          <RouterLink to="/erp/invoices/create"
            class="flex flex-col items-center gap-2.5 p-4 rounded-2xl border border-[#E2E8F0]
                   hover:border-blue-300 hover:bg-blue-50 transition-all group text-center">
            <div class="w-10 h-10 rounded-xl bg-blue-100 group-hover:bg-blue-200 flex items-center justify-center transition-colors">
              <DocumentTextIcon class="w-5 h-5 text-blue-600" />
            </div>
            <span class="text-xs font-semibold text-[#374151] group-hover:text-blue-700 transition-colors">
              {{ t('erp.dashboard.newInvoice') }}
            </span>
          </RouterLink>

          <RouterLink to="/erp/quotations/create"
            class="flex flex-col items-center gap-2.5 p-4 rounded-2xl border border-[#E2E8F0]
                   hover:border-violet-300 hover:bg-violet-50 transition-all group text-center">
            <div class="w-10 h-10 rounded-xl bg-violet-100 group-hover:bg-violet-200 flex items-center justify-center transition-colors">
              <ClipboardDocumentListIcon class="w-5 h-5 text-violet-600" />
            </div>
            <span class="text-xs font-semibold text-[#374151] group-hover:text-violet-700 transition-colors">
              {{ t('erp.dashboard.newQuotation') }}
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

          <RouterLink to="/erp/good-receive/create"
            class="flex flex-col items-center gap-2.5 p-4 rounded-2xl border border-[#E2E8F0]
                   hover:border-amber-300 hover:bg-amber-50 transition-all group text-center">
            <div class="w-10 h-10 rounded-xl bg-amber-100 group-hover:bg-amber-200 flex items-center justify-center transition-colors">
              <TruckIcon class="w-5 h-5 text-amber-600" />
            </div>
            <span class="text-xs font-semibold text-[#374151] group-hover:text-amber-700 transition-colors">
              {{ t('erp.dashboard.newGR') }}
            </span>
          </RouterLink>

          <RouterLink to="/erp/accounting/journals/create"
            class="flex flex-col items-center gap-2.5 p-4 rounded-2xl border border-[#E2E8F0]
                   hover:border-orange-300 hover:bg-orange-50 transition-all group text-center">
            <div class="w-10 h-10 rounded-xl bg-orange-100 group-hover:bg-orange-200 flex items-center justify-center transition-colors">
              <PencilSquareIcon class="w-5 h-5 text-orange-600" />
            </div>
            <span class="text-xs font-semibold text-[#374151] group-hover:text-orange-700 transition-colors">
              {{ t('erp.dashboard.newJournal') }}
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
  ArrowsRightLeftIcon, ClockIcon, ChevronRightIcon,
  CheckCircleIcon, ShoppingCartIcon, ClipboardDocumentCheckIcon,
  ArrowDownTrayIcon, ArrowUpTrayIcon, ArrowUturnLeftIcon, TagIcon,
  DocumentTextIcon, CurrencyDollarIcon, ClipboardDocumentListIcon,
  ShoppingBagIcon, PencilSquareIcon,
  ArrowTrendingUpIcon, BanknotesIcon, DocumentChartBarIcon,
} from '@heroicons/vue/24/outline'
import api from '@/api'
import { fmtDate, fmtDateTime } from '@/utils/fmt'

const { t } = useI18n()
const auth    = useAuthStore()
const stats   = ref({})
const loading = ref(true)
const lastUpdated = ref('')
const generatingReorder = ref(false)
const reorderResult     = ref(null)
const reorderError      = ref('')

async function generateReorder() {
  reorderError.value = ''
  reorderResult.value = null
  generatingReorder.value = true
  try {
    const { data } = await api.post('/erp/purchasing/requisitions/generate-reorder')
    reorderResult.value = data.data
  } catch (err) {
    reorderError.value = err.response?.data?.message || 'Failed to generate reorder PRs'
  } finally { generatingReorder.value = false }
}

const greeting = computed(() => {
  const h = new Date().getHours()
  if (h < 12) return t('erp.dashboard.greetMorning')
  if (h < 17) return t('erp.dashboard.greetAfternoon')
  return t('erp.dashboard.greetEvening')
})

const todayLabel = fmtDate(new Date())

const totalPending = computed(() =>
  (stats.value.pending?.goodReceives         ?? 0)
  + (stats.value.pending?.stockRequests      ?? 0)
  + (stats.value.pending?.adjustments        ?? 0)
  + (stats.value.pending?.purchaseRequisitions ?? 0)
  + (stats.value.pending?.purchaseOrders     ?? 0)
)

const criticalAlerts = computed(() => {
  const alerts = []
  const zero = stats.value.products?.zeroStock ?? 0
  if (zero > 0) alerts.push(`${zero} product${zero > 1 ? 's' : ''} out of stock`)
  const ar = stats.value.invoices?.sentCount ?? 0
  if (ar > 0) alerts.push(`${ar} unpaid invoice${ar > 1 ? 's' : ''} (AR)`)
  const prs = stats.value.pending?.purchaseRequisitions ?? 0
  if (prs > 0) alerts.push(`${prs} purchase requisition${prs > 1 ? 's' : ''} awaiting approval`)
  return alerts
})

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

function fmtNumber(n) {
  if (n == null) return '—'
  return Number(n).toLocaleString()
}

function fmtCurrency(n) {
  if (n == null) return '—'
  return Number(n).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

// `fmtDate` is imported from @/utils/fmt — the recent-invoice row uses time
// info too, so call sites that previously used fmtDate(...) should switch to
// fmtDateTime where the time matters.
function invoiceStatusClass(status) {
  if (status === 'paid')      return 'bg-green-50 text-green-700'
  if (status === 'sent')      return 'bg-blue-50 text-blue-700'
  if (status === 'cancelled') return 'bg-[#F1F5F9] text-[#9BA7B0]'
  return 'bg-amber-50 text-amber-700' // draft
}

function movementIcon(type) {
  if (type === 'receive')      return TruckIcon
  if (type === 'adjust')       return AdjustmentsHorizontalIcon
  if (type === 'transfer_in')  return ArrowDownTrayIcon
  if (type === 'transfer_out') return ArrowUpTrayIcon
  if (type === 'sale')         return TagIcon
  if (type === 'return')       return ArrowUturnLeftIcon
  return ArrowsRightLeftIcon
}

function movementIconBg(type) {
  if (type === 'receive')      return 'bg-blue-100 text-blue-600'
  if (type === 'adjust')       return 'bg-purple-100 text-purple-600'
  if (type === 'transfer_in')  return 'bg-emerald-100 text-emerald-600'
  if (type === 'transfer_out') return 'bg-orange-100 text-orange-600'
  if (type === 'sale')         return 'bg-red-100 text-red-600'
  if (type === 'return')       return 'bg-teal-100 text-teal-600'
  return 'bg-[#F1F5F9] text-[#637381]'
}

function movementBadge(type) {
  if (type === 'receive')      return 'bg-blue-50 text-blue-700'
  if (type === 'adjust')       return 'bg-purple-50 text-purple-700'
  if (type === 'transfer_in')  return 'bg-emerald-50 text-emerald-700'
  if (type === 'transfer_out') return 'bg-orange-50 text-orange-700'
  if (type === 'sale')         return 'bg-red-50 text-red-700'
  if (type === 'return')       return 'bg-teal-50 text-teal-700'
  return 'bg-[#F1F5F9] text-[#637381]'
}
</script>
