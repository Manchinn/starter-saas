<template>
  <AppLayout>
    <div class="max-w-2xl space-y-6">

      <!-- Heading -->
      <div>
        <h1 class="text-xl font-semibold text-gray-900">Demo Data</h1>
        <p class="text-sm text-gray-500 mt-0.5">
          Populate the system with sample data for testing, or wipe all ERP records to start fresh.
        </p>
      </div>

      <!-- Seed Demo Data -->
      <div class="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div class="px-6 py-4 border-b border-gray-100">
          <div class="flex items-center gap-2">
            <SparklesIcon class="w-4 h-4 text-primary-500" />
            <h2 class="text-sm font-semibold text-gray-700">Seed Demo Data</h2>
          </div>
          <p class="text-xs text-gray-400 mt-0.5">
            Creates sample UOMs, product categories, products, customers, vendors, and stores.
          </p>
        </div>

        <div class="px-6 py-5">
          <ul class="text-sm text-gray-600 space-y-1 mb-5 list-disc list-inside">
            <li>4 Units of Measure (Unit, Kilogram, Liter, Box)</li>
            <li>3 Product Categories (Electronics, Food &amp; Beverage, Office Supplies)</li>
            <li>7 Sample Products with prices and stock</li>
            <li>2 Customer Groups + 5 Customers</li>
            <li>3 Vendors</li>
            <li>2 Stores / Warehouses</li>
          </ul>

          <button @click="seed" :disabled="seeding || resetting"
            class="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold
                   bg-primary-600 text-white rounded-xl hover:bg-primary-700
                   disabled:opacity-50 transition-colors shadow-sm">
            <SparklesIcon v-if="!seeding" class="w-4 h-4" />
            <ArrowPathIcon v-else class="w-4 h-4 animate-spin" />
            {{ seeding ? 'Seeding…' : 'Seed Demo Data' }}
          </button>
        </div>
      </div>

      <!-- Reset All Data -->
      <div class="bg-white rounded-xl border border-red-200 shadow-sm overflow-hidden">
        <div class="px-6 py-4 border-b border-red-100">
          <div class="flex items-center gap-2">
            <TrashIcon class="w-4 h-4 text-red-500" />
            <h2 class="text-sm font-semibold text-red-700">Reset All ERP Data</h2>
          </div>
          <p class="text-xs text-red-400 mt-0.5">
            Permanently deletes all ERP records. This cannot be undone.
          </p>
        </div>

        <div class="px-6 py-5">
          <p class="text-sm text-gray-600 mb-5">
            This will erase all products, customers, vendors, stores, orders, stock records, and more.
            System users and permissions are <span class="font-semibold">not</span> affected.
          </p>

          <button v-if="!confirmReset" @click="confirmReset = true" :disabled="seeding || resetting"
            class="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold
                   bg-white border border-red-300 text-red-600 rounded-xl hover:bg-red-50
                   disabled:opacity-50 transition-colors shadow-sm">
            <TrashIcon class="w-4 h-4" />
            Reset All Data
          </button>

          <div v-else class="flex items-center gap-3">
            <span class="text-sm text-red-600 font-medium">Are you sure?</span>
            <button @click="reset" :disabled="resetting"
              class="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold
                     bg-red-600 text-white rounded-xl hover:bg-red-700
                     disabled:opacity-50 transition-colors shadow-sm">
              <ArrowPathIcon v-if="resetting" class="w-4 h-4 animate-spin" />
              <TrashIcon v-else class="w-4 h-4" />
              {{ resetting ? 'Resetting…' : 'Yes, Reset Everything' }}
            </button>
            <button @click="confirmReset = false" :disabled="resetting"
              class="px-4 py-2.5 text-sm text-gray-600 hover:text-gray-900 disabled:opacity-50">
              Cancel
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
import {
  SparklesIcon,
  TrashIcon,
  ArrowPathIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
} from '@heroicons/vue/24/outline'
import AppLayout from '@/layouts/AppLayout.vue'
import api from '@/api'

const seeding      = ref(false)
const resetting    = ref(false)
const confirmReset = ref(false)
const successMsg   = ref('')
const errorMsg     = ref('')

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
