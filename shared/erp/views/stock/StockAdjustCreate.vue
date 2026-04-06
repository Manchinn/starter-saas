<template>
  <AppLayout>
    <div class="space-y-6">
      <div class="flex items-center gap-3">
        <RouterLink to="/erp/stock-adjust" class="text-gray-400 hover:text-gray-600 transition">
          <ArrowLeftIcon class="w-5 h-5" />
        </RouterLink>
        <h1 class="text-2xl font-bold text-gray-900">New Stock Adjustment</h1>
      </div>

      <!-- Header -->
      <div class="bg-white rounded-xl border border-gray-200 p-6">
        <h2 class="text-sm font-semibold text-gray-700 mb-4">Header</h2>
        <div class="grid grid-cols-4 gap-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Date <span class="text-red-500">*</span></label>
            <input v-model="form.date" type="date"
              class="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Store <span class="text-red-500">*</span></label>
            <select v-model="form.storeId" class="w-full px-3 py-2 border rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary-500">
              <option value="">— Select store —</option>
              <option v-for="s in stores" :key="s.id" :value="s.id">{{ s.name }}{{ s.code ? ` (${s.code})` : '' }}</option>
            </select>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Reason</label>
            <input v-model="form.reason" type="text" placeholder="e.g. Damaged goods, Stocktake"
              class="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Notes</label>
            <input v-model="form.notes" type="text" placeholder="Optional notes"
              class="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
          </div>
        </div>
      </div>

      <!-- Items -->
      <div class="bg-white rounded-xl border border-gray-200 p-6">
        <div class="flex items-center justify-between mb-4">
          <h2 class="text-sm font-semibold text-gray-700">Items</h2>
          <button @click="addRow" class="text-sm px-3 py-1.5 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition">+ Add Item</button>
        </div>
        <p class="text-xs text-gray-400 mb-4">Use positive qty to add stock, negative qty to remove stock.</p>

        <table class="w-full text-sm">
          <thead class="bg-gray-50 border-b border-gray-200 text-left">
            <tr>
              <th class="px-3 py-2 font-medium text-gray-600">Product</th>
              <th class="px-3 py-2 font-medium text-gray-600 w-36">Qty <span class="text-gray-400 font-normal">(+/−)</span></th>
              <th class="px-3 py-2 font-medium text-gray-600">Notes</th>
              <th class="px-3 py-2 w-10"></th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-100">
            <tr v-if="!items.length">
              <td colspan="4" class="px-3 py-8 text-center text-gray-400">No items yet. Click "+ Add Item" to start.</td>
            </tr>
            <tr v-for="(item, i) in items" :key="i">
              <td class="px-3 py-2">
                <select v-model="item.productId" class="w-full px-2 py-1.5 border rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary-500">
                  <option value="">— Select product —</option>
                  <option v-for="p in products" :key="p.id" :value="p.id">
                    {{ p.name }}{{ p.sku ? ` [${p.sku}]` : '' }} (stock: {{ p.stock }})
                  </option>
                </select>
              </td>
              <td class="px-3 py-2">
                <input v-model.number="item.qty" type="number" placeholder="0"
                  class="w-full px-2 py-1.5 border rounded-lg text-sm text-right focus:outline-none focus:ring-2 focus:ring-primary-500"
                  :class="item.qty > 0 ? 'text-green-700' : item.qty < 0 ? 'text-red-600' : ''" />
              </td>
              <td class="px-3 py-2">
                <input v-model="item.notes" type="text" placeholder="Optional"
                  class="w-full px-2 py-1.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
              </td>
              <td class="px-3 py-2 text-center">
                <button @click="removeRow(i)" class="text-gray-400 hover:text-red-500 transition text-lg leading-none">&times;</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div v-if="error" class="bg-red-50 text-red-700 text-sm px-4 py-2 rounded-lg">{{ error }}</div>

      <div class="flex justify-end gap-3">
        <RouterLink to="/erp/stock-adjust" class="px-4 py-2 text-sm border rounded-lg hover:bg-gray-50 transition">Cancel</RouterLink>
        <button @click="save" :disabled="saving"
          class="px-5 py-2 text-sm bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 transition">
          {{ saving ? 'Saving…' : 'Save as Draft' }}
        </button>
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
const products = ref([])
const stores   = ref([])
const form = ref({ date: new Date().toISOString().slice(0, 10), storeId: '', reason: '', notes: '' })
const items = ref([])
const error = ref('')
const saving = ref(false)

onMounted(async () => {
  try {
    const [prodRes, storeRes] = await Promise.all([
      api.get('/erp/item-master', { params: { limit: 200 } }),
      api.get('/erp/stock-adjust/stores-lookup'),
    ])
    products.value = prodRes.data.data.products
    stores.value   = storeRes.data.data.stores
  } catch (err) {
    console.error('Failed to load lookups:', err.message)
  }
})

function addRow() {
  items.value.push({ productId: '', qty: 0, notes: '' })
}

function removeRow(i) {
  items.value.splice(i, 1)
}

async function save() {
  error.value = ''
  if (!form.value.date)    { error.value = 'Date is required'; return }
  if (!form.value.storeId) { error.value = 'Store is required'; return }
  if (!items.value.length) { error.value = 'Add at least one item'; return }
  if (items.value.find(i => !i.productId || i.qty === 0)) {
    error.value = 'All items must have a product and non-zero quantity'; return
  }
  saving.value = true
  try {
    const { data } = await api.post('/erp/stock-adjust', { ...form.value, items: items.value })
    router.push(`/erp/stock-adjust/${data.data.adjustment.id}`)
  } catch (err) {
    error.value = err.response?.data?.message || 'Failed to save'
  } finally {
    saving.value = false
  }
}
</script>
