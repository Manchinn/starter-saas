<template>
  <AppLayout>
    <div class="max-w-2xl space-y-6">

      <div class="flex items-center gap-3">
        <RouterLink to="/erp/order-items" class="text-gray-400 hover:text-gray-600 transition">
          <ArrowLeftIcon class="w-5 h-5" />
        </RouterLink>
        <h1 class="text-2xl font-bold text-gray-900">Edit Order Item</h1>
      </div>

      <div v-if="loading" class="bg-white rounded-xl border border-gray-200 p-6 text-center text-gray-400">
        Loading…
      </div>

      <div v-else class="bg-white rounded-xl border border-gray-200 p-6 space-y-5">

        <div class="grid grid-cols-2 gap-4">
          <div class="col-span-2">
            <label class="block text-sm font-medium text-gray-700 mb-1">Order Name <span class="text-red-500">*</span></label>
            <input v-model="form.productName" type="text" placeholder="e.g. Widget A"
              class="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
          </div>

          <div class="col-span-2">
            <label class="block text-sm font-medium text-gray-700 mb-1">Item Code</label>
            <input v-model="form.itemCode" type="text" placeholder="e.g. ITM-001"
              class="w-full px-3 py-2 border rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary-500" />
          </div>

          <div class="col-span-2">
            <label class="block text-sm font-medium text-gray-700 mb-1">
              Product Master
              <span class="ml-1 text-gray-400 font-normal">(optional)</span>
            </label>
            <select v-model="form.productId" @change="onProductSelect"
              class="w-full px-3 py-2 border rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary-500">
              <option value="">— None —</option>
              <option v-for="item in masterItems" :key="item.id" :value="item.id">
                {{ item.title }}{{ item.sku ? ` (${item.sku})` : '' }} — stock: {{ item.stock }}
              </option>
            </select>
          </div>
        </div>

        <div v-if="error" class="bg-red-50 text-red-700 text-sm px-4 py-2 rounded-lg">{{ error }}</div>

        <div class="flex justify-end gap-3 pt-2">
          <RouterLink to="/erp/order-items" class="px-4 py-2 text-sm border rounded-lg hover:bg-gray-50 transition">Cancel</RouterLink>
          <button @click="save" :disabled="saving"
            class="px-5 py-2 text-sm bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 transition">
            {{ saving ? 'Saving…' : 'Save Changes' }}
          </button>
        </div>

      </div>
    </div>
  </AppLayout>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ArrowLeftIcon } from '@heroicons/vue/24/outline'
import AppLayout from '@/layouts/AppLayout.vue'
import api from '@/api'

const router = useRouter()
const route  = useRoute()
const id     = route.params.id

const form       = ref({ productName: '', itemCode: '', productId: '' })
const masterItems = ref([])
const loading    = ref(true)
const saving     = ref(false)
const error      = ref('')

onMounted(async () => {
  try {
    const [itemRes, lookupRes] = await Promise.all([
      api.get(`/order-items/${id}`),
      api.get('/order-items/items-lookup'),
    ])
    const item = itemRes.data.data.orderItem
    masterItems.value = lookupRes.data.data.items
    form.value = {
      productName: item.productName || '',
      itemCode:    item.itemCode    || '',
      productId:   item.productId   || '',
    }
  } catch (err) {
    error.value = err.response?.data?.message || 'Failed to load order item'
  } finally {
    loading.value = false
  }
})

function onProductSelect() {
  if (!form.value.productId) return
  const selected = masterItems.value.find(m => m.id === form.value.productId)
  if (selected) form.value.productName = selected.title
}

async function save() {
  error.value = ''
  if (!form.value.productName.trim()) { error.value = 'Order name is required'; return }
  saving.value = true
  try {
    await api.put(`/order-items/${id}`, {
      productName: form.value.productName,
      itemCode:    form.value.itemCode || null,
      productId:   form.value.productId || null,
    })
    router.push('/erp/order-items')
  } catch (err) {
    const d = err.response?.data
    error.value = d?.errors?.map(e => e.message).join(', ') || d?.message || 'Failed to save'
  } finally {
    saving.value = false
  }
}
</script>
