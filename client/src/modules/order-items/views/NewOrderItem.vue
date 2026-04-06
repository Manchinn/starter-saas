<template>
  <AppLayout>
    <div class="max-w-2xl space-y-6">

      <div class="flex items-center gap-3">
        <RouterLink to="/erp/order-items" class="text-gray-400 hover:text-gray-600 transition">
          <ArrowLeftIcon class="w-5 h-5" />
        </RouterLink>
        <h1 class="text-2xl font-bold text-gray-900">New Order Item</h1>
      </div>

      <div class="bg-white rounded-xl border border-gray-200 p-6 space-y-5">

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
              <span class="ml-1 text-gray-400 font-normal">(optional — cuts stock on save)</span>
            </label>
            <select v-model="form.itemId" @change="onItemSelect"
              class="w-full px-3 py-2 border rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary-500">
              <option value="">— None —</option>
              <option v-for="item in masterItems" :key="item.id" :value="item.id">
                {{ item.title }} (stock: {{ item.stock }})
              </option>
            </select>
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Quantity <span class="text-red-500">*</span></label>
            <input v-model.number="form.quantity" type="number" min="1" placeholder="1"
              class="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Unit Price <span class="text-red-500">*</span></label>
            <input v-model.number="form.unitPrice" type="number" min="0" step="0.01" placeholder="0.00"
              class="w-full px-3 py-2 border rounded-lg text-sm text-right focus:outline-none focus:ring-2 focus:ring-primary-500" />
          </div>
        </div>

        <div v-if="error" class="bg-red-50 text-red-700 text-sm px-4 py-2 rounded-lg">{{ error }}</div>

        <div class="flex justify-end gap-3 pt-2">
          <RouterLink to="/erp/order-items" class="px-4 py-2 text-sm border rounded-lg hover:bg-gray-50 transition">Cancel</RouterLink>
          <button @click="save" :disabled="saving"
            class="px-5 py-2 text-sm bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 transition">
            {{ saving ? 'Creating…' : 'Create Order Item' }}
          </button>
        </div>

      </div>
    </div>
  </AppLayout>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ArrowLeftIcon } from '@heroicons/vue/24/outline'
import AppLayout from '@/layouts/AppLayout.vue'
import api from '@/api'

const router = useRouter()
const masterItems = ref([])
const form = ref({ productName: '', itemCode: '', itemId: '', quantity: 1, unitPrice: 0 })
const error = ref('')
const saving = ref(false)

onMounted(async () => {
  const { data } = await api.get('/order-items/items-lookup')
  masterItems.value = data.data.items
})

function onItemSelect() {
  if (!form.value.itemId) return
  const selected = masterItems.value.find((m) => m.id === form.value.itemId)
  if (selected) form.value.productName = selected.title
}

async function save() {
  error.value = ''
  if (!form.value.productName.trim()) { error.value = 'Order name is required'; return }
  if (!form.value.quantity || form.value.quantity < 1) { error.value = 'Quantity must be at least 1'; return }
  saving.value = true
  try {
    await api.post('/order-items', {
      productName: form.value.productName,
      itemCode: form.value.itemCode || null,
      itemId: form.value.itemId || null,
      quantity: form.value.quantity,
      unitPrice: form.value.unitPrice,
    })
    router.push('/erp/order-items')
  } catch (err) {
    const d = err.response?.data
    error.value = d?.errors?.map(e => e.message).join(', ') || d?.message || 'Failed to create order item'
  } finally {
    saving.value = false
  }
}
</script>
