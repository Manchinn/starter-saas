<template>
  <AppLayout>
    <div class="space-y-6">

      <!-- Header -->
      <div>
        <h1 class="text-xl font-semibold text-[#1C2434]">{{ t('erp.settings.demoTitle') }}</h1>
        <p class="text-sm text-[#637381] mt-0.5">
          Populate the system with realistic sample data, or wipe all ERP records to start fresh.
        </p>
      </div>

      <!-- Seed Demo Data -->
      <div class="bg-white rounded-2xl border border-[#E2E8F0] shadow-sm overflow-hidden">
        <div class="px-6 py-4 border-b border-[#E2E8F0] flex items-center justify-between">
          <div class="flex items-start gap-2">
            <SparklesIcon class="w-4 h-4 text-primary-500 mt-0.5 flex-shrink-0" />
            <div>
              <h2 class="text-sm font-semibold text-[#374151]">{{ t('erp.settings.seedDemo') }}</h2>
              <p class="text-xs text-[#9BA7B0] mt-0.5">
                Creates a complete dataset across all ERP modules — ready to explore immediately.
              </p>
            </div>
          </div>
          <button @click="seed" :disabled="seeding || resetting"
            class="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold flex-shrink-0
                   bg-primary-500 text-white rounded-xl hover:bg-primary-700
                   disabled:opacity-50 transition-colors shadow-sm">
            <SparklesIcon v-if="!seeding" class="w-4 h-4" />
            <ArrowPathIcon v-else class="w-4 h-4 animate-spin" />
            {{ seeding ? t('erp.settings.seeding') : t('erp.settings.seedDemo') }}
          </button>
        </div>

        <!-- Domain sections -->
        <div class="divide-y divide-[#E2E8F0]">

          <!-- Foundation -->
          <div class="px-6 py-5">
            <div class="flex items-center gap-2 mb-4">
              <CubeIcon class="w-4 h-4 text-indigo-500" />
              <span class="text-xs font-bold text-indigo-600 uppercase tracking-widest">Foundation</span>
            </div>
            <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              <div v-for="item in SECTION_FOUNDATION" :key="item.label" class="rounded-xl border border-[#E2E8F0] bg-[#F7F9FC] px-4 py-3">
                <div class="flex items-center justify-between mb-2">
                  <span class="text-[10px] font-semibold text-[#637381] uppercase tracking-wide leading-tight">{{ item.label }}</span>
                  <span class="text-xs font-bold text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded-full">{{ item.count }}</span>
                </div>
                <ul class="space-y-0.5">
                  <li v-for="row in item.rows" :key="row" class="flex items-center gap-1.5 text-xs text-[#374151]">
                    <span class="w-1 h-1 rounded-full bg-indigo-300 flex-shrink-0" />
                    {{ row }}
                  </li>
                </ul>
              </div>
            </div>
          </div>

          <!-- Parties -->
          <div class="px-6 py-5">
            <div class="flex items-center gap-2 mb-4">
              <UsersIcon class="w-4 h-4 text-sky-500" />
              <span class="text-xs font-bold text-sky-600 uppercase tracking-widest">Parties</span>
            </div>
            <div class="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <div v-for="item in SECTION_PARTIES" :key="item.label" class="rounded-xl border border-[#E2E8F0] bg-[#F7F9FC] px-4 py-3">
                <div class="flex items-center justify-between mb-2">
                  <span class="text-[10px] font-semibold text-[#637381] uppercase tracking-wide leading-tight">{{ item.label }}</span>
                  <span class="text-xs font-bold text-sky-600 bg-sky-50 px-1.5 py-0.5 rounded-full">{{ item.count }}</span>
                </div>
                <ul class="space-y-0.5">
                  <li v-for="row in item.rows" :key="row" class="flex items-center gap-1.5 text-xs text-[#374151]">
                    <span class="w-1 h-1 rounded-full bg-sky-300 flex-shrink-0" />
                    {{ row }}
                  </li>
                </ul>
              </div>
            </div>
          </div>

          <!-- HRMS -->
          <div class="px-6 py-5">
            <div class="flex items-center gap-2 mb-4">
              <IdentificationIcon class="w-4 h-4 text-violet-500" />
              <span class="text-xs font-bold text-violet-600 uppercase tracking-widest">HRMS</span>
            </div>
            <div class="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <div v-for="item in SECTION_HRMS" :key="item.label" class="rounded-xl border border-[#E2E8F0] bg-[#F7F9FC] px-4 py-3">
                <div class="flex items-center justify-between mb-2">
                  <span class="text-[10px] font-semibold text-[#637381] uppercase tracking-wide leading-tight">{{ item.label }}</span>
                  <span class="text-xs font-bold text-violet-600 bg-violet-50 px-1.5 py-0.5 rounded-full">{{ item.count }}</span>
                </div>
                <ul class="space-y-0.5">
                  <li v-for="row in item.rows" :key="row" class="flex items-center gap-1.5 text-xs text-[#374151]">
                    <span class="w-1 h-1 rounded-full bg-violet-300 flex-shrink-0" />
                    {{ row }}
                  </li>
                </ul>
              </div>
            </div>
          </div>

          <!-- Sales Cycle -->
          <div class="px-6 py-5">
            <div class="flex items-center gap-2 mb-4">
              <ShoppingCartIcon class="w-4 h-4 text-emerald-500" />
              <span class="text-xs font-bold text-emerald-600 uppercase tracking-widest">Sales Cycle</span>
            </div>
            <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
              <div v-for="item in SECTION_SALES" :key="item.label" class="rounded-xl border border-[#E2E8F0] bg-[#F7F9FC] px-4 py-3">
                <div class="flex items-center justify-between mb-2">
                  <span class="text-[10px] font-semibold text-[#637381] uppercase tracking-wide leading-tight">{{ item.label }}</span>
                  <span class="text-xs font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded-full">{{ item.count }}</span>
                </div>
                <ul class="space-y-0.5">
                  <li v-for="row in item.rows" :key="row" class="flex items-center gap-1.5 text-xs text-[#374151]">
                    <span class="w-1 h-1 rounded-full bg-emerald-300 flex-shrink-0" />
                    {{ row }}
                  </li>
                </ul>
              </div>
            </div>
          </div>

          <!-- Purchasing -->
          <div class="px-6 py-5">
            <div class="flex items-center gap-2 mb-4">
              <ShoppingBagIcon class="w-4 h-4 text-amber-500" />
              <span class="text-xs font-bold text-amber-600 uppercase tracking-widest">Purchasing</span>
            </div>
            <div class="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <div v-for="item in SECTION_PURCHASING" :key="item.label" class="rounded-xl border border-[#E2E8F0] bg-[#F7F9FC] px-4 py-3">
                <div class="flex items-center justify-between mb-2">
                  <span class="text-[10px] font-semibold text-[#637381] uppercase tracking-wide leading-tight">{{ item.label }}</span>
                  <span class="text-xs font-bold text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded-full">{{ item.count }}</span>
                </div>
                <ul class="space-y-0.5">
                  <li v-for="row in item.rows" :key="row" class="flex items-center gap-1.5 text-xs text-[#374151]">
                    <span class="w-1 h-1 rounded-full bg-amber-300 flex-shrink-0" />
                    {{ row }}
                  </li>
                </ul>
              </div>
            </div>
          </div>

          <!-- Inventory Transactions -->
          <div class="px-6 py-5">
            <div class="flex items-center gap-2 mb-4">
              <ArrowsRightLeftIcon class="w-4 h-4 text-teal-500" />
              <span class="text-xs font-bold text-teal-600 uppercase tracking-widest">Inventory Transactions</span>
            </div>
            <div class="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
              <div v-for="item in SECTION_INVENTORY" :key="item.label" class="rounded-xl border border-[#E2E8F0] bg-[#F7F9FC] px-4 py-3">
                <div class="flex items-center justify-between mb-2">
                  <span class="text-[10px] font-semibold text-[#637381] uppercase tracking-wide leading-tight">{{ item.label }}</span>
                  <span class="text-xs font-bold text-teal-600 bg-teal-50 px-1.5 py-0.5 rounded-full">{{ item.count }}</span>
                </div>
                <ul class="space-y-0.5">
                  <li v-for="row in item.rows" :key="row" class="flex items-center gap-1.5 text-xs text-[#374151]">
                    <span class="w-1 h-1 rounded-full bg-teal-300 flex-shrink-0" />
                    {{ row }}
                  </li>
                </ul>
              </div>
            </div>
          </div>

          <!-- Accounting -->
          <div class="px-6 py-5">
            <div class="flex items-center gap-2 mb-4">
              <CalculatorIcon class="w-4 h-4 text-rose-500" />
              <span class="text-xs font-bold text-rose-600 uppercase tracking-widest">Accounting</span>
            </div>
            <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 gap-3">
              <div v-for="item in SECTION_ACCOUNTING" :key="item.label" class="rounded-xl border border-[#E2E8F0] bg-[#F7F9FC] px-4 py-3">
                <div class="flex items-center justify-between mb-2">
                  <span class="text-[10px] font-semibold text-[#637381] uppercase tracking-wide leading-tight">{{ item.label }}</span>
                  <span class="text-xs font-bold text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded-full">{{ item.count }}</span>
                </div>
                <ul class="space-y-0.5">
                  <li v-for="row in item.rows" :key="row" class="flex items-center gap-1.5 text-xs text-[#374151]">
                    <span class="w-1 h-1 rounded-full bg-rose-300 flex-shrink-0" />
                    {{ row }}
                  </li>
                </ul>
              </div>
            </div>
          </div>

        </div>

        <!-- Total summary footer -->
        <div class="px-6 py-3 bg-[#F7F9FC] border-t border-[#E2E8F0] flex items-center gap-2">
          <SparklesIcon class="w-3.5 h-3.5 text-primary-400" />
          <p class="text-xs text-[#637381]">
            Seeds <span class="font-semibold text-[#374151]">{{ TOTAL_RECORDS }}+</span> records across
            <span class="font-semibold text-[#374151]">7 domains</span> — covering the full ERP workflow from procurement to payment.
          </p>
        </div>
      </div>

      <!-- Reset All Data -->
      <div class="bg-white rounded-2xl border border-red-200 shadow-sm overflow-hidden">
        <div class="px-6 py-4 border-b border-red-100 flex items-center justify-between">
          <div class="flex items-start gap-2">
            <TrashIcon class="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
            <div>
              <h2 class="text-sm font-semibold text-red-700">{{ t('erp.settings.resetAll') }}</h2>
              <p class="text-xs text-red-400 mt-0.5">
                Permanently deletes <span class="font-semibold">all</span> ERP records across every module. This cannot be undone.
              </p>
            </div>
          </div>
          <div v-if="!confirmReset">
            <button @click="confirmReset = true" :disabled="seeding || resetting"
              class="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold flex-shrink-0
                     bg-white border border-red-300 text-red-600 rounded-xl hover:bg-red-50
                     disabled:opacity-50 transition-colors shadow-sm">
              <TrashIcon class="w-4 h-4" />
              {{ t('erp.settings.resetAll') }}
            </button>
          </div>
          <div v-else class="flex items-center gap-3 flex-shrink-0">
            <span class="text-sm text-red-600 font-medium">{{ t('erp.settings.confirmReset') }}</span>
            <button @click="reset" :disabled="resetting"
              class="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold
                     bg-red-600 text-white rounded-xl hover:bg-red-700
                     disabled:opacity-50 transition-colors shadow-sm">
              <ArrowPathIcon v-if="resetting" class="w-4 h-4 animate-spin" />
              <TrashIcon v-else class="w-4 h-4" />
              {{ resetting ? t('erp.settings.resetting') : t('erp.settings.yesReset') }}
            </button>
            <button @click="confirmReset = false" :disabled="resetting"
              class="px-4 py-2.5 text-sm text-[#637381] hover:text-[#1C2434] disabled:opacity-50">
              {{ t('common.cancel') }}
            </button>
          </div>
        </div>

        <!-- What gets wiped — mirrors seed domains -->
        <div class="divide-y divide-red-50">
          <div v-for="group in RESET_GROUPS" :key="group.label" class="px-6 py-4">
            <div class="flex items-center gap-2 mb-3">
              <component :is="group.icon" class="w-3.5 h-3.5 text-red-400" />
              <span class="text-[10px] font-bold text-red-500 uppercase tracking-widest">{{ group.label }}</span>
            </div>
            <div class="flex flex-wrap gap-2">
              <span v-for="item in group.items" :key="item"
                class="inline-flex items-center gap-1 text-xs text-red-600 bg-red-50 border border-red-100 px-2.5 py-1 rounded-lg">
                <span class="w-1 h-1 rounded-full bg-red-300 flex-shrink-0" />
                {{ item }}
              </span>
            </div>
          </div>
        </div>

        <div class="px-6 py-3 bg-red-50/60 border-t border-red-100 flex items-center gap-2">
          <ExclamationTriangleIcon class="w-3.5 h-3.5 text-red-400 flex-shrink-0" />
          <p class="text-xs text-red-500">
            System users, roles, and permissions are <span class="font-semibold">not</span> affected. Only ERP business data is removed.
          </p>
        </div>
      </div>

      <!-- Feedback -->
      <div v-if="successMsg"
        class="flex items-center gap-2 bg-green-50 border border-green-200 text-green-700 text-sm px-4 py-3 rounded-lg">
        <CheckCircleIcon class="w-4 h-4 flex-shrink-0" />
        {{ successMsg }}
      </div>

      <div v-if="errorMsg"
        class="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg">
        <ExclamationCircleIcon class="w-4 h-4 flex-shrink-0" />
        {{ errorMsg }}
      </div>

    </div>
  </AppLayout>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import {
  SparklesIcon,
  TrashIcon,
  ArrowPathIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
  ExclamationTriangleIcon,
  CubeIcon,
  UsersIcon,
  ShoppingCartIcon,
  ShoppingBagIcon,
  ArrowsRightLeftIcon,
  IdentificationIcon,
  CalculatorIcon,
} from '@heroicons/vue/24/outline'
import AppLayout from '@/layouts/AppLayout.vue'
import api from '@/api'

const { t } = useI18n()

const seeding      = ref(false)
const resetting    = ref(false)
const confirmReset = ref(false)
const successMsg   = ref('')
const errorMsg     = ref('')

const SECTION_FOUNDATION = [
  { label: 'UOM',              count: 4,  rows: ['Unit', 'Kilogram', 'Liter', 'Box'] },
  { label: 'Categories',       count: 3,  rows: ['Electronics', 'Food & Beverage', 'Office Supplies'] },
  { label: 'Products',         count: 7,  rows: ['Wireless Mouse', 'USB-C Hub', 'Keyboard', 'Water 1L', 'Coffee', 'A4 Paper', 'Pen'] },
  { label: 'Stores',           count: 2,  rows: ['Main Warehouse', 'North Branch'] },
  { label: 'Sale Items',       count: 7,  rows: ['SI-0001 → SI-0007', 'One per product'] },
  { label: 'Price Lists',      count: 10, rows: ['5 Retail prices', '5 Wholesale prices'] },
]

const SECTION_PARTIES = [
  { label: 'Customer Groups',  count: 2,  rows: ['Retail', 'Wholesale'] },
  { label: 'Customers',        count: 5,  rows: ['Alice Johnson', 'Bob Smith', 'Carol Davis', 'David Lee', 'Eva Martinez'] },
  { label: 'Vendors',          count: 6,  rows: ['TechSource Global', 'FoodLink Supplies', 'OfficeWorld Dist.', 'CleanPro Services', 'SwiftLogistics Co.', 'UniTrade Partners'] },
]

const SECTION_HRMS = [
  { label: 'Departments',      count: 5,  rows: ['Sales', 'Operations', 'Finance', 'HR', 'IT'] },
  { label: 'Employees',        count: 5,  rows: ['John Smith (Sales)', 'Jane Doe (Ops)', 'Mike Johnson (Fin)', 'Sara Lee (HR)', 'Tom Brown (IT)'] },
]

const SECTION_SALES = [
  { label: 'Quotations',       count: 3,  rows: ['QT-2026-0001 sent', 'QT-2026-0002 draft', 'QT-2026-0003 confirmed'] },
  { label: 'Sales Orders',     count: 3,  rows: ['SO-2026-0001 confirmed', 'SO-2026-0002 shipped', 'SO-2026-0003 draft'] },
  { label: 'Deliveries',       count: 3,  rows: ['DO-2026-0001 confirmed', 'DO-2026-0002 shipped', 'DO-2026-0003 draft'] },
  { label: 'Invoices',         count: 5,  rows: ['INV-0001 paid', 'INV-0002 sent', 'INV-0003 sent', 'INV-0004 draft', 'INV-0005 sent'] },
  { label: 'Receipts',         count: 3,  rows: ['RCT-0001 confirmed', 'RCT-0002 confirmed', 'RCT-0003 draft'] },
  { label: 'Billing Notes',    count: 1,  rows: ['BN-2026-0001'] },
  { label: 'Recv. Payments',   count: 2,  rows: ['RP-2026-0001', 'RP-2026-0002'] },
  { label: 'Debit / Credit',   count: 2,  rows: ['DN-2026-0001', 'CN-2026-0001'] },
]

const SECTION_PURCHASING = [
  { label: 'Purchase Reqs.',   count: 2,  rows: ['PR-2026-0001 confirmed', 'PR-2026-0002 draft'] },
  { label: 'Purchase Orders',  count: 2,  rows: ['PO-2026-0001 confirmed', 'PO-2026-0002 draft'] },
]

const SECTION_INVENTORY = [
  { label: 'Good Receives',    count: 3,  rows: ['GR-0001 confirmed', 'GR-0002 confirmed', 'GR-0003 draft'] },
  { label: 'Adjustments',      count: 2,  rows: ['SA-0001 confirmed', 'SA-0002 draft'] },
  { label: 'Stock Counts',     count: 2,  rows: ['SC-0001 confirmed', 'SC-0002 draft'] },
  { label: 'Transfers',        count: 2,  rows: ['SR-0001 confirmed', 'SR-0002 draft'] },
  { label: 'Returns',          count: 1,  rows: ['RT-0001 confirmed'] },
  { label: 'Issues',           count: 1,  rows: ['SI-0001 confirmed'] },
  { label: 'Movements',        count: 16, rows: ['GR / SA / SR', 'DO / RT / Issue'] },
  { label: 'Store Stock',      count: 12, rows: ['Main Whs: 7 SKUs', 'North Branch: 5 SKUs'] },
]

const SECTION_ACCOUNTING = [
  { label: 'Chart of Accounts', count: 40, rows: ['Assets', 'Liabilities', 'Equity', 'Revenue', 'Expenses'] },
  { label: 'Fiscal Years',      count: 2,  rows: ['FY 2025 (closed)', 'FY 2026 (active)'] },
  { label: 'Journal Entries',   count: 10, rows: ['JE-0001 posted', 'JE-0002 posted', 'JE-0003 posted', 'JE-0004–0006 posted', 'JE-0007 posted', 'JE-0008–0010 draft'] },
]

const TOTAL_RECORDS = computed(() => {
  const counts = [
    ...SECTION_FOUNDATION, ...SECTION_PARTIES, ...SECTION_HRMS,
    ...SECTION_SALES, ...SECTION_PURCHASING, ...SECTION_INVENTORY,
    ...SECTION_ACCOUNTING,
  ].reduce((sum, item) => sum + item.count, 0)
  return counts
})

const RESET_GROUPS = [
  {
    label: 'Foundation',
    icon: CubeIcon,
    items: ['Products', 'Product Categories', 'Units of Measure', 'UOM Conversions', 'Stores', 'Store Stock', 'Sale Items', 'Price Lists'],
  },
  {
    label: 'Parties',
    icon: UsersIcon,
    items: ['Customer Groups', 'Customers', 'Vendors'],
  },
  {
    label: 'HRMS',
    icon: IdentificationIcon,
    items: ['Departments', 'Employees'],
  },
  {
    label: 'Sales Cycle',
    icon: ShoppingCartIcon,
    items: ['Quotations', 'Sales Orders', 'Delivery Orders', 'Invoices', 'Receipts', 'Billing Notes', 'Receive Payments', 'Debit Notes', 'Credit Notes'],
  },
  {
    label: 'Purchasing',
    icon: ShoppingBagIcon,
    items: ['Purchase Requisitions', 'Purchase Orders'],
  },
  {
    label: 'Inventory Transactions',
    icon: ArrowsRightLeftIcon,
    items: ['Goods Receives', 'Stock Adjustments', 'Stock Counts', 'Stock Transfers', 'Stock Returns', 'Stock Issues', 'Stock Movements'],
  },
  {
    label: 'Accounting',
    icon: CalculatorIcon,
    items: ['Chart of Accounts', 'Fiscal Years', 'Journal Entries', 'Journal Lines'],
  },
]

function clearMessages() {
  successMsg.value = ''
  errorMsg.value   = ''
}

async function seed() {
  clearMessages()
  seeding.value = true
  try {
    const { data } = await api.post('/erp/settings/demo-data/seed')
    successMsg.value = data.message || 'Demo data seeded successfully.'
    setTimeout(() => { successMsg.value = '' }, 5000)
  } catch (err) {
    errorMsg.value = err.response?.data?.message || 'Failed to seed demo data.'
  } finally {
    seeding.value = false
  }
}

async function reset() {
  clearMessages()
  resetting.value = true
  try {
    const { data } = await api.post('/erp/settings/demo-data/reset')
    successMsg.value = data.message || 'All ERP data has been reset.'
    confirmReset.value = false
    setTimeout(() => { successMsg.value = '' }, 5000)
  } catch (err) {
    errorMsg.value = err.response?.data?.message || 'Failed to reset data.'
  } finally {
    resetting.value = false
  }
}
</script>
