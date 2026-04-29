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
                Creates a complete starter dataset across all ERP modules — ready to explore immediately.
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

        <!-- Data preview grid -->
        <div class="grid grid-cols-2 lg:grid-cols-3 divide-y lg:divide-y-0 divide-x-0 lg:divide-x divide-[#E2E8F0] border-b border-[#E2E8F0]">

          <!-- UOM -->
          <div class="px-6 py-5 border-b lg:border-b-0 border-[#E2E8F0]">
            <div class="flex items-center gap-2 mb-3">
              <ScaleIcon class="w-4 h-4 text-[#9BA7B0]" />
              <span class="text-xs font-semibold text-[#637381] uppercase tracking-wide">Units of Measure</span>
              <span class="ml-auto text-xs font-semibold text-primary-500 bg-primary-50 px-2 py-0.5 rounded-full">4</span>
            </div>
            <ul class="space-y-1">
              <li class="flex items-center gap-2 text-sm text-[#374151]">
                <span class="w-1.5 h-1.5 rounded-full bg-[#CBD5E1] flex-shrink-0" />
                Unit <span class="text-xs font-mono text-[#9BA7B0] ml-1">unit</span>
              </li>
              <li class="flex items-center gap-2 text-sm text-[#374151]">
                <span class="w-1.5 h-1.5 rounded-full bg-[#CBD5E1] flex-shrink-0" />
                Kilogram <span class="text-xs font-mono text-[#9BA7B0] ml-1">kg</span>
              </li>
              <li class="flex items-center gap-2 text-sm text-[#374151]">
                <span class="w-1.5 h-1.5 rounded-full bg-[#CBD5E1] flex-shrink-0" />
                Liter <span class="text-xs font-mono text-[#9BA7B0] ml-1">L</span>
              </li>
              <li class="flex items-center gap-2 text-sm text-[#374151]">
                <span class="w-1.5 h-1.5 rounded-full bg-[#CBD5E1] flex-shrink-0" />
                Box <span class="text-xs font-mono text-[#9BA7B0] ml-1">box</span>
              </li>
            </ul>
          </div>

          <!-- Product Categories -->
          <div class="px-6 py-5 border-b lg:border-b-0 border-[#E2E8F0]">
            <div class="flex items-center gap-2 mb-3">
              <TagIcon class="w-4 h-4 text-[#9BA7B0]" />
              <span class="text-xs font-semibold text-[#637381] uppercase tracking-wide">Product Categories</span>
              <span class="ml-auto text-xs font-semibold text-primary-500 bg-primary-50 px-2 py-0.5 rounded-full">3</span>
            </div>
            <ul class="space-y-1">
              <li class="flex items-center gap-2 text-sm text-[#374151]">
                <span class="w-1.5 h-1.5 rounded-full bg-[#CBD5E1] flex-shrink-0" />
                Electronics <span class="text-xs font-mono text-[#9BA7B0] ml-1">CAT-ELEC</span>
              </li>
              <li class="flex items-center gap-2 text-sm text-[#374151]">
                <span class="w-1.5 h-1.5 rounded-full bg-[#CBD5E1] flex-shrink-0" />
                Food &amp; Beverage <span class="text-xs font-mono text-[#9BA7B0] ml-1">CAT-FOOD</span>
              </li>
              <li class="flex items-center gap-2 text-sm text-[#374151]">
                <span class="w-1.5 h-1.5 rounded-full bg-[#CBD5E1] flex-shrink-0" />
                Office Supplies <span class="text-xs font-mono text-[#9BA7B0] ml-1">CAT-OFFC</span>
              </li>
            </ul>
          </div>

          <!-- Products -->
          <div class="px-6 py-5 border-b lg:border-b-0 border-[#E2E8F0]">
            <div class="flex items-center gap-2 mb-3">
              <CubeIcon class="w-4 h-4 text-[#9BA7B0]" />
              <span class="text-xs font-semibold text-[#637381] uppercase tracking-wide">Products</span>
              <span class="ml-auto text-xs font-semibold text-primary-500 bg-primary-50 px-2 py-0.5 rounded-full">7</span>
            </div>
            <ul class="space-y-1">
              <li v-for="p in SEED_PRODUCTS" :key="p.sku" class="flex items-center gap-2 text-sm text-[#374151]">
                <span class="w-1.5 h-1.5 rounded-full bg-[#CBD5E1] flex-shrink-0" />
                {{ p.name }} <span class="text-xs font-mono text-[#9BA7B0] ml-1">{{ p.sku }}</span>
              </li>
            </ul>
          </div>

          <!-- Customers -->
          <div class="px-6 py-5 border-t border-[#E2E8F0] lg:border-t-0">
            <div class="flex items-center gap-2 mb-3">
              <UsersIcon class="w-4 h-4 text-[#9BA7B0]" />
              <span class="text-xs font-semibold text-[#637381] uppercase tracking-wide">Customers</span>
              <span class="ml-auto text-xs font-semibold text-primary-500 bg-primary-50 px-2 py-0.5 rounded-full">5 + 2 groups</span>
            </div>
            <p class="text-xs text-[#9BA7B0] mb-2">Groups: Retail · Wholesale</p>
            <ul class="space-y-1">
              <li v-for="c in SEED_CUSTOMERS" :key="c.code" class="flex items-center gap-2 text-sm text-[#374151]">
                <span class="w-1.5 h-1.5 rounded-full bg-[#CBD5E1] flex-shrink-0" />
                {{ c.name }} <span class="text-xs font-mono text-[#9BA7B0] ml-1">{{ c.code }}</span>
              </li>
            </ul>
          </div>

          <!-- Vendors -->
          <div class="px-6 py-5 border-t border-[#E2E8F0] lg:border-t-0">
            <div class="flex items-center gap-2 mb-3">
              <BuildingLibraryIcon class="w-4 h-4 text-[#9BA7B0]" />
              <span class="text-xs font-semibold text-[#637381] uppercase tracking-wide">Vendors</span>
              <span class="ml-auto text-xs font-semibold text-primary-500 bg-primary-50 px-2 py-0.5 rounded-full">6</span>
            </div>
            <ul class="space-y-1">
              <li v-for="v in SEED_VENDORS" :key="v.code" class="flex items-center gap-2 text-sm text-[#374151]">
                <span class="w-1.5 h-1.5 rounded-full flex-shrink-0"
                  :class="v.type === 'supplier' ? 'bg-blue-300' : v.type === 'service' ? 'bg-violet-300' : 'bg-amber-300'" />
                {{ v.name }} <span class="text-xs font-mono text-[#9BA7B0] ml-1">{{ v.code }}</span>
              </li>
            </ul>
            <div class="flex items-center gap-3 mt-2.5 text-[10px] text-[#9BA7B0]">
              <span class="flex items-center gap-1"><span class="w-2 h-2 rounded-full bg-blue-300 inline-block" /> Supplier</span>
              <span class="flex items-center gap-1"><span class="w-2 h-2 rounded-full bg-violet-300 inline-block" /> Service</span>
              <span class="flex items-center gap-1"><span class="w-2 h-2 rounded-full bg-amber-300 inline-block" /> Both</span>
            </div>
          </div>

          <!-- Stores -->
          <div class="px-6 py-5 border-t border-[#E2E8F0] lg:border-t-0">
            <div class="flex items-center gap-2 mb-3">
              <BuildingStorefrontIcon class="w-4 h-4 text-[#9BA7B0]" />
              <span class="text-xs font-semibold text-[#637381] uppercase tracking-wide">Stores / Warehouses</span>
              <span class="ml-auto text-xs font-semibold text-primary-500 bg-primary-50 px-2 py-0.5 rounded-full">2</span>
            </div>
            <ul class="space-y-1">
              <li class="flex items-center gap-2 text-sm text-[#374151]">
                <span class="w-1.5 h-1.5 rounded-full bg-[#CBD5E1] flex-shrink-0" />
                Main Warehouse <span class="text-xs font-mono text-[#9BA7B0] ml-1">WHS-0001</span>
              </li>
              <li class="flex items-center gap-2 text-sm text-[#374151]">
                <span class="w-1.5 h-1.5 rounded-full bg-[#CBD5E1] flex-shrink-0" />
                North Branch <span class="text-xs font-mono text-[#9BA7B0] ml-1">WHS-0002</span>
              </li>
            </ul>
          </div>

        </div>

        <div class="px-6 py-3 bg-[#F7F9FC]">
          <p class="text-xs text-[#9BA7B0]">
            Note: HRMS records (employees, departments), stock transactions, sales orders, invoices, and receipts are <span class="font-medium">not</span> included in seed data — create those manually to test the full workflow.
          </p>
        </div>
      </div>

      <!-- Reset All Data -->
      <div class="bg-white rounded-2xl border border-red-200 shadow-sm overflow-hidden">
        <div class="px-6 py-4 border-b border-red-100 flex items-start gap-2">
          <TrashIcon class="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
          <div>
            <h2 class="text-sm font-semibold text-red-700">{{ t('erp.settings.resetAll') }}</h2>
            <p class="text-xs text-red-400 mt-0.5">Permanently deletes all ERP records. This cannot be undone.</p>
          </div>
        </div>

        <div class="px-6 py-5">
          <p class="text-sm text-[#637381] mb-4">
            Erases all data across every ERP module. System users, roles, and permissions are <span class="font-semibold">not</span> affected.
          </p>

          <!-- What gets wiped -->
          <div class="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
            <div v-for="group in RESET_GROUPS" :key="group.label"
              class="rounded-xl border border-red-100 bg-red-50/50 px-4 py-3">
              <p class="text-xs font-semibold text-red-700 mb-1.5">{{ group.label }}</p>
              <ul class="space-y-0.5">
                <li v-for="item in group.items" :key="item"
                  class="flex items-center gap-1.5 text-xs text-red-500">
                  <span class="w-1 h-1 rounded-full bg-red-300 flex-shrink-0" />
                  {{ item }}
                </li>
              </ul>
            </div>
          </div>

          <div v-if="!confirmReset">
            <button @click="confirmReset = true" :disabled="seeding || resetting"
              class="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold
                     bg-white border border-red-300 text-red-600 rounded-xl hover:bg-red-50
                     disabled:opacity-50 transition-colors shadow-sm">
              <TrashIcon class="w-4 h-4" />
              {{ t('erp.settings.resetAll') }}
            </button>
          </div>

          <div v-else class="flex items-center gap-3">
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
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import {
  SparklesIcon,
  TrashIcon,
  ArrowPathIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
  ScaleIcon,
  TagIcon,
  CubeIcon,
  UsersIcon,
  BuildingLibraryIcon,
  BuildingStorefrontIcon,
} from '@heroicons/vue/24/outline'
import AppLayout from '@/layouts/AppLayout.vue'
import api from '@/api'

const { t } = useI18n()

const seeding      = ref(false)
const resetting    = ref(false)
const confirmReset = ref(false)
const successMsg   = ref('')
const errorMsg     = ref('')

const SEED_PRODUCTS = [
  { name: 'Wireless Mouse',      sku: 'PRD-0001' },
  { name: 'USB-C Hub',           sku: 'PRD-0002' },
  { name: 'Mechanical Keyboard', sku: 'PRD-0003' },
  { name: 'Mineral Water 1L',    sku: 'PRD-0004' },
  { name: 'Arabica Coffee',      sku: 'PRD-0005' },
  { name: 'A4 Paper Ream',       sku: 'PRD-0006' },
  { name: 'Ballpoint Pen',       sku: 'PRD-0007' },
]

const SEED_CUSTOMERS = [
  { code: 'CUS-0001', name: 'Alice Johnson' },
  { code: 'CUS-0002', name: 'Bob Smith' },
  { code: 'CUS-0003', name: 'Carol Davis' },
  { code: 'CUS-0004', name: 'David Lee' },
  { code: 'CUS-0005', name: 'Eva Martinez' },
]

const SEED_VENDORS = [
  { code: 'VND-0001', name: 'TechSource Global',   type: 'supplier' },
  { code: 'VND-0002', name: 'FoodLink Supplies',   type: 'supplier' },
  { code: 'VND-0003', name: 'OfficeWorld Dist.',   type: 'supplier' },
  { code: 'VND-0004', name: 'CleanPro Services',   type: 'service' },
  { code: 'VND-0005', name: 'SwiftLogistics Co.',  type: 'service' },
  { code: 'VND-0006', name: 'UniTrade Partners',   type: 'both' },
]

const RESET_GROUPS = [
  {
    label: 'Sales',
    items: ['Quotations', 'Sale Items', 'Sales Orders', 'Invoices', 'Receipts', 'Price Lists'],
  },
  {
    label: 'Stock Transactions',
    items: ['Goods Receive', 'Stock Adjustments', 'Stock Counts', 'Stock Transfers', 'Stock Returns', 'Stock Issues', 'Stock Movements'],
  },
  {
    label: 'Inventory Master',
    items: ['Products', 'Product Categories', 'UOM Conversions', 'Units of Measure', 'Stores', 'Store Stock'],
  },
  {
    label: 'Parties & HRMS',
    items: ['Customers', 'Customer Groups', 'Vendors', 'Employees', 'Departments'],
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
