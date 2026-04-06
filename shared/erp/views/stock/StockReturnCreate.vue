<template>
  <AppLayout>
    <div class="space-y-6">
      <div class="flex items-center gap-3">
        <RouterLink to="/erp/stock-return" class="text-gray-400 hover:text-gray-600 transition">
          <ArrowLeftIcon class="w-5 h-5" />
        </RouterLink>
        <h1 class="text-2xl font-bold text-gray-900">New Stock Return</h1>
      </div>

      <!-- Header -->
      <div class="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
        <h2 class="text-sm font-semibold text-gray-700">Header</h2>

        <!-- Row 1: Type toggle + Date + Store + Notes -->
        <div class="flex items-start gap-6">
          <!-- Type selector -->
          <div class="shrink-0">
            <label class="block text-sm font-medium text-gray-700 mb-2">Return Type <span class="text-red-500">*</span></label>
            <div class="flex items-center gap-1 p-1 bg-gray-100 rounded-lg">
              <button type="button" @click="form.type = 'customer_return'"
                :class="form.type === 'customer_return' ? 'bg-white shadow text-gray-900' : 'text-gray-500 hover:text-gray-700'"
                class="px-4 py-1.5 rounded-md text-sm font-medium transition whitespace-nowrap">
                Customer Return
              </button>
              <button type="button" @click="form.type = 'vendor_return'"
                :class="form.type === 'vendor_return' ? 'bg-white shadow text-gray-900' : 'text-gray-500 hover:text-gray-700'"
                class="px-4 py-1.5 rounded-md text-sm font-medium transition whitespace-nowrap">
                Return to Vendor
              </button>
            </div>
          </div>

          <!-- Date -->
          <div class="w-40">
            <label class="block text-sm font-medium text-gray-700 mb-1">Date <span class="text-red-500">*</span></label>
            <input v-model="form.date" type="date"
              class="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
          </div>

          <!-- Store -->
          <div class="w-52">
            <label class="block text-sm font-medium text-gray-700 mb-1">Store <span class="text-red-500">*</span></label>
            <select v-model="form.storeId" class="w-full px-3 py-2 border rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary-500">
              <option value="">— Select store —</option>
              <option v-for="s in stores" :key="s.id" :value="s.id">{{ s.name }}{{ s.code ? ` (${s.code})` : '' }}</option>
            </select>
          </div>

          <!-- Customer (customer_return) -->
          <div v-if="form.type === 'customer_return'" class="w-52">
            <label class="block text-sm font-medium text-gray-700 mb-1">Customer</label>
            <select v-model="form.customerId" class="w-full px-3 py-2 border rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary-500">
              <option value="">— Select customer —</option>
              <option v-for="c in customers" :key="c.id" :value="c.id">{{ c.name }}{{ c.company ? ` (${c.company})` : '' }}</option>
            </select>
          </div>

          <!-- Vendor (vendor_return) -->
          <div v-if="form.type === 'vendor_return'" class="w-52">
            <label class="block text-sm font-medium text-gray-700 mb-1">Vendor</label>
            <select v-model="form.vendorId" class="w-full px-3 py-2 border rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary-500">
              <option value="">— Select vendor —</option>
              <option v-for="v in vendors" :key="v.id" :value="v.id">{{ v.name }}{{ v.code ? ` (${v.code})` : '' }}</option>
            </select>
          </div>

          <!-- Notes -->
          <div class="flex-1">
            <label class="block text-sm font-medium text-gray-700 mb-1">Notes</label>
            <input v-model="form.notes" type="text" placeholder="Optional notes"
              class="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
          </div>
        </div>

        <!-- Type description -->
        <div class="text-xs pt-1 pb-0" :class="form.type === 'customer_return' ? 'text-blue-600' : 'text-orange-600'">
          <span v-if="form.type === 'customer_return'">
            Customer Return — items received back from a customer. Stock will <strong>increase</strong> when confirmed.
          </span>
          <span v-else>
            Return to Vendor — items sent back to supplier. Stock will <strong>decrease</strong> when confirmed.
          </span>
        </div>
      </div>

      <!-- Items -->
      <div class="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div class="flex items-center justify-between px-5 py-3 border-b border-gray-100">
          <h2 class="text-sm font-semibold text-gray-700">Items</h2>
          <button @click="addRow" class="text-sm px-3 py-1.5 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition">+ Add Item</button>
        </div>

        <table class="w-full text-sm">
          <thead class="bg-gray-50 border-b border-gray-200 text-left">
            <tr>
              <th class="px-3 py-2 font-medium text-gray-600">Product <span class="text-red-500">*</span></th>
              <th class="px-3 py-2 font-medium text-gray-600 w-28 text-right">Qty <span class="text-red-500">*</span></th>
              <th class="px-3 py-2 font-medium text-gray-600 w-32 text-right">Cost / Unit</th>
              <th class="px-3 py-2 font-medium text-gray-600">Reason</th>
              <th class="px-3 py-2 w-10"></th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-100">
            <tr v-if="!items.length">
              <td colspan="5" class="px-3 py-8 text-center text-gray-400">No items yet. Click "+ Add Item" to start.</td>
            </tr>
            <tr v-for="(item, i) in items" :key="i" class="hover:bg-gray-50">
              <td class="px-3 py-2">
                <select v-model="item.productId" class="w-full px-2 py-1.5 border rounded-lg text-sm bg-white focus:outline-none focus:ring-1 focus:ring-primary-500">
                  <option value="">— Select product —</option>
                  <option v-for="p in products" :key="p.id" :value="p.id">
                    {{ p.name }}{{ p.sku ? ` [${p.sku}]` : '' }} (stock: {{ p.stock }})
                  </option>
                </select>
              </td>
              <td class="px-3 py-2">
                <input v-model.number="item.qty" type="number" min="0.01" step="0.01" placeholder="0"
                  class="w-full px-2 py-1.5 border rounded-lg text-sm text-right focus:outline-none focus:ring-1 focus:ring-primary-500" />
              </td>
              <td class="px-3 py-2">
                <input v-model.number="item.cost" type="number" min="0" step="0.0001" placeholder="0.00"
                  class="w-full px-2 py-1.5 border rounded-lg text-sm text-right focus:outline-none focus:ring-1 focus:ring-primary-500" />
              </td>
              <td class="px-3 py-2">
                <input v-model="item.reason" type="text" placeholder="Optional"
                  class="w-full px-2 py-1.5 border rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-primary-500" />
              </td>
              <td class="px-3 py-2 text-center">
                <button @click="removeRow(i)" class="text-gray-400 hover:text-red-500 transition text-lg leading-none">&times;</button>
              </td>
            </tr>
          </tbody>
          <tfoot v-if="items.length" class="border-t-2 border-gray-200 bg-gray-50">
            <tr>
              <td colspan="4" class="px-3 py-2 text-xs font-medium text-gray-500">{{ items.length }} item(s)</td>
              <td></td>
            </tr>
          </tfoot>
        </table>
      </div>

      <div v-if="error" class="bg-red-50 text-red-700 text-sm px-4 py-2 rounded-lg">{{ error }}</div>

      <div class="flex justify-end gap-3">
        <RouterLink to="/erp/stock-return" class="px-4 py-2 text-sm border rounded-lg hover:bg-gray-50 transition">Cancel</RouterLink>
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

const router    = useRouter()
const products  = ref([])
const stores    = ref([])
const customers = ref([])
const vendors   = ref([])
const form  = ref({ date: new Date().toISOString().slice(0, 10), type: 'customer_return', storeId: '', customerId: '', vendorId: '', notes: '' })
const items = ref([])
const error  = ref('')
const saving = ref(false)

onMounted(async () => {
  try {
    const [prodRes, storeRes, custRes, vendorRes] = await Promise.all([
      api.get('/erp/item-master', { params: { limit: 200 } }),
      api.get('/erp/stock-return/stores-lookup'),
      api.get('/erp/customers', { params: { limit: 200 } }),
      api.get('/erp/vendors/all'),
    ])
    products.value  = prodRes.data.data.products
    stores.value    = storeRes.data.data.stores
    customers.value = custRes.data.data.customers
    vendors.value   = vendorRes.data.data.vendors
  } catch (err) {
    console.error('Failed to load lookups:', err.message)
  }
})

function addRow() {
  items.value.push({ productId: '', qty: 1, cost: 0, reason: '' })
}

function removeRow(i) {
  items.value.splice(i, 1)
}

async function save() {
  error.value = ''
  if (!form.value.date)    { error.value = 'Date is required'; return }
  if (!form.value.storeId) { error.value = 'Store is required'; return }
  if (!items.value.length) { error.value = 'Add at least one item'; return }
  if (items.value.find(i => !i.productId || !i.qty || i.qty <= 0)) {
    error.value = 'All items must have a product and quantity > 0'; return
  }
  saving.value = true
  try {
    const payload = {
      date:       form.value.date,
      type:       form.value.type,
      storeId:    form.value.storeId,
      notes:      form.value.notes,
      customerId: form.value.type === 'customer_return' ? (form.value.customerId || null) : null,
      vendorId:   form.value.type === 'vendor_return'   ? (form.value.vendorId   || null) : null,
      items: items.value.map(i => ({
        productId: i.productId,
        qty:       i.qty,
        cost:      i.cost || 0,
        reason:    i.reason || null,
      })),
    }
    const { data } = await api.post('/erp/stock-return', payload)
    router.push(`/erp/stock-return/${data.data.stockReturn.id}`)
  } catch (err) {
    error.value = err.response?.data?.message || 'Failed to save'
  } finally {
    saving.value = false
  }
}
</script>
