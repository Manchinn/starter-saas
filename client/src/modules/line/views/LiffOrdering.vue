<template>
  <div class="min-h-screen bg-gray-50">
    <!-- Loading -->
    <div v-if="loading" class="flex items-center justify-center min-h-screen">
      <div class="text-center">
        <div class="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
        <p class="text-sm text-slate-500">กำลังโหลด...</p>
      </div>
    </div>

    <!-- Error -->
    <div v-else-if="error" class="flex items-center justify-center min-h-screen px-4">
      <div class="text-center max-w-md">
        <ExclamationCircleIcon class="w-12 h-12 text-red-400 mx-auto mb-4" />
        <p class="text-red-600 font-medium mb-2">เกิดข้อผิดพลาด</p>
        <p class="text-sm text-slate-500">{{ error }}</p>
        <button @click="retry" class="btn-primary mt-4">ลองใหม่</button>
      </div>
    </div>

    <!-- Main content -->
    <div v-else class="max-w-lg mx-auto px-4 py-6">
      <!-- Header -->
      <div class="text-center mb-6">
        <h1 class="text-xl font-bold text-slate-800">{{ storeName }}</h1>
        <p v-if="profile" class="text-sm text-slate-500 mt-1">
          สวัสดี {{ profile.displayName }}
        </p>
      </div>

      <!-- Tabs -->
      <div class="flex border-b border-slate-200 mb-4">
        <button
          @click="tab = 'catalog'"
          :class="tab === 'catalog' ? 'border-primary-500 text-primary-600' : 'border-transparent text-slate-500'"
          class="flex-1 pb-2 text-sm font-medium border-b-2 transition-colors"
        >
          สินค้า
        </button>
        <button
          @click="tab = 'orders'"
          :class="tab === 'orders' ? 'border-primary-500 text-primary-600' : 'border-transparent text-slate-500'"
          class="flex-1 pb-2 text-sm font-medium border-b-2 transition-colors"
        >
          คำสั่งซื้อของฉัน
        </button>
      </div>

      <!-- Catalog -->
      <div v-if="tab === 'catalog'" class="space-y-3">
        <div v-if="!catalog.length" class="text-center py-10 text-slate-400 text-sm">
          ยังไม่มีสินค้า
        </div>
        <div
          v-for="item in catalog"
          :key="item.id"
          class="bg-white rounded-lg shadow-sm border border-slate-200 p-4"
        >
          <div class="flex justify-between items-start">
            <div class="flex-1">
              <h3 class="font-medium text-slate-800">{{ item.name }}</h3>
              <p v-if="item.description" class="text-sm text-slate-500 mt-1">{{ item.description }}</p>
              <p class="text-sm font-semibold text-primary-600 mt-2">
                {{ formatPrice(item.price) }}
              </p>
            </div>
            <div class="flex items-center gap-2 ml-3">
              <button
                @click="decrementQty(item)"
                class="w-7 h-7 rounded-full border border-slate-300 flex items-center justify-center text-slate-500 hover:bg-slate-50"
                :disabled="!cart[item.id]"
              >−</button>
              <span class="text-sm tabular-nums w-5 text-center">{{ cart[item.id] || 0 }}</span>
              <button
                @click="incrementQty(item)"
                class="w-7 h-7 rounded-full border border-slate-300 flex items-center justify-center text-slate-500 hover:bg-slate-50"
              >+</button>
            </div>
          </div>
        </div>

        <!-- Order button -->
        <div v-if="hasCartItems" class="pt-3">
          <div class="bg-white rounded-lg shadow-sm border border-slate-200 p-4 mb-3">
            <label class="block text-sm font-medium text-slate-700 mb-1">หมายเหตุ</label>
            <textarea
              v-model="notes"
              rows="2"
              class="w-full border border-slate-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary-500"
              placeholder="ใส่หมายเหตุ (ถ้ามี)"
            ></textarea>
          </div>
          <button
            @click="placeOrder"
            :disabled="ordering"
            class="btn-primary w-full justify-center"
          >
            {{ ordering ? 'กำลังสั่ง...' : 'สั่งซื้อ' }}
          </button>
        </div>
      </div>

      <!-- Orders -->
      <div v-if="tab === 'orders'" class="space-y-3">
        <div v-if="!orders.length" class="text-center py-10 text-slate-400 text-sm">
          ยังไม่มีคำสั่งซื้อ
        </div>
        <div
          v-for="order in orders"
          :key="order.id"
          class="bg-white rounded-lg shadow-sm border border-slate-200 p-4"
        >
          <div class="flex justify-between items-start mb-2">
            <span class="text-xs text-slate-400">{{ formatDate(order.createdAt) }}</span>
            <span :class="statusBadge(order.status)">{{ order.status }}</span>
          </div>
          <ul class="text-sm text-slate-700 space-y-1">
            <li v-for="item in order.items" :key="item.id">
              {{ item.name }} × {{ item.quantity }}
            </li>
          </ul>
          <p v-if="order.notes" class="text-xs text-slate-400 mt-2">หมายเหตุ: {{ order.notes }}</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import liff from '@line/liff'
import api from '@/api'
import { ExclamationCircleIcon } from '@heroicons/vue/24/outline'

const ORG_ID = import.meta.env.VITE_LIFF_ORG_ID

const loading = ref(true)
const error = ref('')
const profile = ref(null)
const storeName = ref('')
const catalog = ref([])
const orders = ref([])
const cart = ref({})
const notes = ref('')
const ordering = ref(false)
const tab = ref('catalog')

const hasCartItems = computed(() => Object.values(cart.value).some((qty) => qty > 0))

function idTokenHeader() {
  try {
    const token = liff.getIDToken()
    return { 'x-line-id-token': token }
  } catch {
    return {}
  }
}

async function init() {
  loading.value = true
  error.value = ''

  try {
    // Fetch LIFF config to get liffId
    const { data: config } = await api.get(`/line/liff/${ORG_ID}/config`)
    storeName.value = config.storeName || ''

    // Init LIFF
    await liff.init({ liffId: config.liffId })

    // Check login
    if (!liff.isLoggedIn()) {
      liff.login()
      return // redirect to LINE login
    }

    // Get profile
    try {
      profile.value = await liff.getProfile()
    } catch {
      // profile scope might not be granted
    }

    // Fetch catalog and orders in parallel
    await Promise.all([fetchCatalog(), fetchOrders()])
  } catch (err) {
    error.value = err.response?.data?.message || 'ไม่สามารถโหลดข้อมูลได้ กรุณาลองใหม่'
  } finally {
    loading.value = false
  }
}

async function fetchCatalog() {
  const { data } = await api.get(`/line/liff/${ORG_ID}/catalog`, {
    headers: idTokenHeader(),
  })
  catalog.value = data.data || data || []
}

async function fetchOrders() {
  const { data } = await api.get(`/line/liff/${ORG_ID}/orders`, {
    headers: idTokenHeader(),
  })
  orders.value = data.data || data || []
}

function incrementQty(item) {
  cart.value = { ...cart.value, [item.id]: (cart.value[item.id] || 0) + 1 }
}

function decrementQty(item) {
  const qty = cart.value[item.id] || 0
  if (qty <= 1) {
    const next = { ...cart.value }
    delete next[item.id]
    cart.value = next
  } else {
    cart.value = { ...cart.value, [item.id]: qty - 1 }
  }
}

async function placeOrder() {
  ordering.value = true
  try {
    const items = Object.entries(cart.value)
      .filter(([, qty]) => qty > 0)
      .map(([id, quantity]) => ({ id, quantity }))

    await api.post(`/line/liff/${ORG_ID}/orders`, { items, notes: notes.value || undefined }, {
      headers: idTokenHeader(),
    })

    // Reset cart
    cart.value = {}
    notes.value = ''
    tab.value = 'orders'
    await fetchOrders()
  } catch (err) {
    error.value = err.response?.data?.message || 'สั่งซื้อไม่สำเร็จ กรุณาลองใหม่'
  } finally {
    ordering.value = false
  }
}

async function retry() {
  await init()
}

function formatPrice(price) {
  if (price == null) return '—'
  const n = Number(price)
  if (n === 0) return 'ฟรี'
  return `฿${n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

function formatDate(d) {
  return d ? new Date(d).toLocaleDateString('th-TH', { year: 'numeric', month: 'short', day: 'numeric' }) : '—'
}

function statusBadge(status) {
  const map = {
    pending: 'text-xs px-2 py-0.5 rounded-full bg-amber-100 text-amber-700',
    confirmed: 'text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-700',
    completed: 'text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-700',
    cancelled: 'text-xs px-2 py-0.5 rounded-full bg-red-100 text-red-700',
  }
  return map[status] || 'text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-600'
}

onMounted(init)
</script>