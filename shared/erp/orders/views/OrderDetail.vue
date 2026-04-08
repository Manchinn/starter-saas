<template>
  <AppLayout>
    <div class="max-w-3xl space-y-6">

      <div class="flex items-center gap-3">
        <RouterLink to="/erp/orders" class="text-gray-400 hover:text-gray-600 transition">
          <ArrowLeftIcon class="w-5 h-5" />
        </RouterLink>
        <h1 class="text-2xl font-bold text-gray-900">Sales Order {{ order?.orderNumber }}</h1>
        <span v-if="order" :class="statusClass(order.status)" class="ml-2 px-3 py-0.5 rounded-full text-xs font-medium capitalize">{{ order.status }}</span>
      </div>

      <div v-if="loading" class="text-gray-400 py-12 text-center">Loading…</div>
      <div v-else-if="notFound" class="bg-red-50 text-red-700 text-sm px-4 py-3 rounded-lg">
        Sales order not found. <RouterLink to="/erp/orders" class="underline ml-1">Back to list</RouterLink>
      </div>

      <template v-else>

        <!-- Info Cards -->
        <div class="grid grid-cols-2 gap-4">
          <div class="bg-white rounded-xl border border-gray-200 p-4 space-y-2">
            <p class="text-xs font-semibold text-gray-500 uppercase tracking-wide">Customer</p>
            <p v-if="order.customer" class="text-sm font-medium text-gray-900">{{ order.customer.name }}</p>
            <p v-if="order.customer?.company" class="text-xs text-gray-500">{{ order.customer.company }}</p>
            <p v-if="!order.customer" class="text-sm text-gray-400">No customer</p>
          </div>
          <div class="bg-white rounded-xl border border-gray-200 p-4 space-y-2">
            <p class="text-xs font-semibold text-gray-500 uppercase tracking-wide">Sales Order Info</p>
            <p class="text-sm text-gray-700">Date: <span class="font-medium">{{ order.orderDate }}</span></p>
            <p class="text-sm text-gray-700">Created: <span class="font-medium">{{ fmtDate(order.createdAt) }}</span></p>
          </div>
        </div>

        <!-- Line Items -->
        <div class="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table class="w-full text-sm">
            <thead class="bg-gray-50 border-b border-gray-200 text-left">
              <tr>
                <th class="px-5 py-3 font-medium text-gray-600">Item</th>
                <th class="px-5 py-3 font-medium text-gray-600 text-right">Qty</th>
                <th class="px-5 py-3 font-medium text-gray-600 text-right">Unit Price</th>
                <th class="px-5 py-3 font-medium text-gray-600 text-right">Total</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-100">
              <tr v-for="item in order.items" :key="item.id">
                <td class="px-5 py-3 text-gray-900">
                  {{ item.productName }}
                  <span v-if="item.product?.sku" class="text-xs text-gray-400 ml-1">({{ item.product.sku }})</span>
                </td>
                <td class="px-5 py-3 text-right text-gray-700">{{ item.quantity }}</td>
                <td class="px-5 py-3 text-right text-gray-700">{{ fmtMoney(item.unitPrice) }}</td>
                <td class="px-5 py-3 text-right font-medium text-gray-900">{{ fmtMoney(item.total) }}</td>
              </tr>
            </tbody>
          </table>

          <!-- Totals -->
          <div class="border-t border-gray-100 px-5 py-4 space-y-1 text-sm text-right">
            <div class="text-gray-500">Subtotal: <span class="font-medium text-gray-800 ml-4">{{ fmtMoney(order.subtotal) }}</span></div>
            <div class="text-gray-500">Tax: <span class="font-medium text-gray-800 ml-4">{{ fmtMoney(order.tax) }}</span></div>
            <div class="text-base font-bold text-gray-900">Total: <span class="ml-4">{{ fmtMoney(order.total) }}</span></div>
          </div>
        </div>

        <!-- Notes -->
        <div v-if="order.notes" class="bg-white rounded-xl border border-gray-200 p-4">
          <p class="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Notes</p>
          <p class="text-sm text-gray-700">{{ order.notes }}</p>
        </div>

        <!-- Actions -->
        <div v-can="'erp.orders.edit'" class="bg-white rounded-xl border border-gray-200 p-4">
          <p class="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Update Order Status</p>
          <div class="flex flex-wrap gap-2">
            <button
              v-for="s in availableTransitions"
              :key="s"
              @click="changeStatus(s)"
              :disabled="updatingStatus"
              class="px-4 py-1.5 text-xs font-medium rounded-lg border transition disabled:opacity-50"
              :class="transitionBtnClass(s)"
            >{{ s }}</button>
          </div>
          <div v-if="statusError" class="mt-2 text-red-600 text-xs">{{ statusError }}</div>
        </div>

        <!-- Delete (draft only) -->
        <div v-if="order.status === 'draft'" v-can="'erp.orders.delete'" class="flex justify-end">
          <button @click="confirmDelete" class="px-4 py-2 text-sm text-red-500 border border-red-200 rounded-lg hover:bg-red-50 transition">Delete Order</button>
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
import { fmtMoney } from '@/utils/fmt'

const route         = useRoute()
const router        = useRouter()
const order         = ref(null)
const loading       = ref(true)
const notFound      = ref(false)
const updatingStatus = ref(false)
const statusError   = ref('')

const TRANSITIONS = {
  draft:     ['confirmed', 'cancelled'],
  confirmed: ['shipped', 'cancelled'],
  shipped:   ['delivered', 'cancelled'],
  delivered: [],
  cancelled: [],
}

const availableTransitions = computed(() => TRANSITIONS[order.value?.status] || [])

onMounted(fetchOrder)

async function fetchOrder() {
  loading.value = true
  try {
    const { data } = await api.get(`/erp/orders/${route.params.id}`)
    order.value = data.data.order
  } catch {
    notFound.value = true
  } finally {
    loading.value = false
  }
}

async function changeStatus(status) {
  statusError.value = ''
  updatingStatus.value = true
  try {
    const { data } = await api.patch(`/erp/orders/${order.value.id}/status`, { status })
    order.value = data.data.order
  } catch (err) {
    statusError.value = err.response?.data?.message || 'Failed to update status'
  } finally {
    updatingStatus.value = false
  }
}

async function confirmDelete() {
  if (!confirm(`Delete order ${order.value.orderNumber}? This cannot be undone.`)) return
  try {
    await api.delete(`/erp/orders/${order.value.id}`)
    router.push('/erp/orders')
  } catch (err) {
    statusError.value = err.response?.data?.message || 'Delete failed'
  }
}


function fmtDate(d) { return new Date(d).toLocaleDateString() }

const STATUS_CLASSES = {
  draft:     'bg-gray-100 text-gray-600',
  confirmed: 'bg-blue-100 text-blue-700',
  shipped:   'bg-yellow-100 text-yellow-700',
  delivered: 'bg-green-100 text-green-700',
  cancelled: 'bg-red-100 text-red-600',
}
function statusClass(s) { return STATUS_CLASSES[s] || 'bg-gray-100 text-gray-600' }

const TRANSITION_BTN = {
  confirmed: 'border-blue-300 text-blue-700 hover:bg-blue-50',
  shipped:   'border-yellow-300 text-yellow-700 hover:bg-yellow-50',
  delivered: 'border-green-300 text-green-700 hover:bg-green-50',
  cancelled: 'border-red-200 text-red-600 hover:bg-red-50',
}
function transitionBtnClass(s) { return TRANSITION_BTN[s] || 'border-gray-200 text-gray-600 hover:bg-gray-50' }
</script>
