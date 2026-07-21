<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import liff from '@line/liff'
import axios from 'axios'

const route = useRoute()
const loading = ref(true)
const error = ref('')
const products = ref([])
const cart = ref([])
const orders = ref([])
const activeTab = ref('catalog')
const idToken = ref('')
const submitting = ref(false)
const organizationId = route.params.organizationId
const total = computed(() => cart.value.reduce((sum, item) => sum + Number(item.price) * item.quantity, 0))
const lineApi = () => axios.create({ headers: { 'x-line-id-token': idToken.value } })

function add(product) {
  const existing = cart.value.find((item) => item.id === product.id)
  if (existing) existing.quantity += 1
  else cart.value.push({ ...product, quantity: 1 })
}
function decrement(item) { item.quantity === 1 ? cart.value.splice(cart.value.indexOf(item), 1) : item.quantity -= 1 }
async function loadOrders() {
  const { data } = await lineApi().get(`/api/line/liff/${organizationId}/orders`)
  orders.value = data.data.orders
}
async function checkout() {
  if (!cart.value.length || submitting.value) return
  submitting.value = true
  try {
    const { data } = await lineApi().post(`/api/line/liff/${organizationId}/orders`, {
      items: cart.value.map((item) => ({ productId: item.id, productName: item.name, quantity: item.quantity, unitPrice: item.price })),
    })
    cart.value = []
    orders.value.unshift(data.data.order)
    activeTab.value = 'orders'
  } catch (requestError) { error.value = requestError.response?.data?.message || requestError.message }
  finally { submitting.value = false }
}

onMounted(async () => {
  try {
    const { data: config } = await axios.get(`/api/line/liff/${organizationId}/config`)
    await liff.init({ liffId: config.data.liffId })
    idToken.value = liff.getIDToken()
    if (!idToken.value) throw new Error('Open this page from LINE')
    const { data } = await lineApi().get(`/api/line/liff/${organizationId}/catalog`)
    products.value = data.data.products
    await loadOrders()
  } catch (initError) { error.value = initError.response?.data?.message || initError.message } finally { loading.value = false }
})
</script>

<template>
  <main class="mx-auto min-h-screen max-w-xl bg-slate-50 p-4 text-slate-900">
    <div v-if="loading" class="py-12 text-center text-sm text-slate-600">Loading...</div>
    <div v-else-if="error" class="py-12 text-center text-sm text-rose-700">{{ error }}</div>
    <template v-else>
      <header class="mb-4 flex gap-2 border-b border-slate-200 pb-3">
        <button class="rounded px-3 py-2 text-sm" :class="activeTab === 'catalog' ? 'bg-emerald-700 text-white' : 'bg-white'" @click="activeTab = 'catalog'">Catalog</button>
        <button class="rounded px-3 py-2 text-sm" :class="activeTab === 'orders' ? 'bg-emerald-700 text-white' : 'bg-white'" @click="activeTab = 'orders'">Orders</button>
      </header>
      <section v-if="activeTab === 'catalog'" class="space-y-3">
        <article v-for="product in products" :key="product.id" class="flex items-center justify-between rounded border border-slate-200 bg-white p-4">
          <div><h2 class="font-medium">{{ product.name }}</h2><p class="text-sm text-slate-600">{{ product.price }} THB</p></div>
          <button class="rounded bg-slate-900 px-3 py-2 text-sm text-white" @click="add(product)">Add</button>
        </article>
        <section v-if="cart.length" class="sticky bottom-0 border-t border-slate-200 bg-white p-4 shadow">
          <div v-for="item in cart" :key="item.id" class="flex justify-between py-1 text-sm"><span>{{ item.name }} x {{ item.quantity }}</span><span><button class="mr-2" @click="decrement(item)">-</button>{{ item.price * item.quantity }}</span></div>
          <div class="mt-3 flex items-center justify-between font-semibold"><span>Total</span><span>{{ total }} THB</span></div>
          <button :disabled="submitting" class="mt-3 w-full rounded bg-emerald-700 py-3 text-sm font-medium text-white disabled:opacity-50" @click="checkout">{{ submitting ? 'Placing order...' : 'Place order' }}</button>
        </section>
      </section>
      <section v-else class="space-y-3">
        <article v-for="order in orders" :key="order.id" class="rounded border border-slate-200 bg-white p-4"><div class="font-medium">{{ order.orderNumber }}</div><div class="mt-1 text-sm text-slate-600">{{ order.status }} · {{ order.total }} THB</div></article>
        <p v-if="!orders.length" class="py-12 text-center text-sm text-slate-600">No orders yet</p>
      </section>
    </template>
  </main>
</template>
