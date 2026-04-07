<template>
  <AppLayout>
    <div class="max-w-3xl space-y-6">

      <div class="flex items-center gap-3">
        <RouterLink to="/erp/orders" class="text-gray-400 hover:text-gray-600 transition">
          <ArrowLeftIcon class="w-5 h-5" />
        </RouterLink>
        <h1 class="text-2xl font-bold text-gray-900">New Sale</h1>
      </div>

      <div class="bg-white rounded-xl border border-gray-200 p-6 space-y-6">

        <!-- Customer + Date -->
        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Customer</label>
            <select v-model="form.customerId" class="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500">
              <option value="">— No customer —</option>
              <option v-for="c in customers" :key="c.id" :value="c.id">{{ c.name }}{{ c.company ? ` (${c.company})` : '' }}</option>
            </select>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Sale Date</label>
            <input v-model="form.orderDate" type="date" class="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Tax Rate (%)</label>
            <input v-model="form.taxRate" type="number" min="0" max="100" step="0.01" placeholder="0" class="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Notes</label>
            <input v-model="form.notes" type="text" placeholder="Optional notes…" class="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
          </div>
        </div>

        <!-- Line Items -->
        <div>
          <div class="flex items-center justify-between mb-3">
            <h2 class="text-sm font-semibold text-gray-700">Items to Sell</h2>
            <button @click="addLine" type="button" class="text-sm text-primary-600 hover:underline">+ Add Item</button>
          </div>

          <!-- Column headers -->
          <div v-if="form.items.length" class="grid grid-cols-12 gap-2 mb-1 px-1">
            <div class="col-span-4 text-xs font-medium text-gray-500">Item</div>
            <div class="col-span-3 text-xs font-medium text-gray-500">Description</div>
            <div class="col-span-1 text-xs font-medium text-gray-500 text-right">Qty</div>
            <div class="col-span-2 text-xs font-medium text-gray-500 text-right">Unit Price</div>
            <div class="col-span-1 text-xs font-medium text-gray-500 text-right">Stock</div>
            <div class="col-span-1"></div>
          </div>

          <div class="space-y-2">
            <div v-for="(line, idx) in form.items" :key="idx" class="grid grid-cols-12 gap-2 items-center">
              <!-- Item selector from Item Master -->
              <div class="col-span-4">
                <select v-model="line.itemId" @change="onItemSelected(line)" class="w-full px-2 py-1.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500">
                  <option value="">— Custom —</option>
                  <option v-for="item in masterItems" :key="item.id" :value="item.id">
                    {{ item.title }}
                  </option>
                </select>
              </div>
              <!-- Description (auto-filled, editable) -->
              <div class="col-span-3">
                <input v-model="line.productName" type="text" placeholder="Description" class="w-full px-2 py-1.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
              </div>
              <!-- Qty -->
              <div class="col-span-1">
                <input v-model.number="line.quantity" type="number" min="1" class="w-full px-2 py-1.5 border rounded-lg text-sm text-right focus:outline-none focus:ring-2 focus:ring-primary-500" />
              </div>
              <!-- Unit Price -->
              <div class="col-span-2">
                <input v-model.number="line.unitPrice" type="number" min="0" step="0.01" placeholder="0.00" class="w-full px-2 py-1.5 border rounded-lg text-sm text-right focus:outline-none focus:ring-2 focus:ring-primary-500" />
              </div>
              <!-- Stock badge -->
              <div class="col-span-1 text-center">
                <span v-if="line.itemId" class="text-xs px-1.5 py-0.5 rounded" :class="stockClass(line)">
                  {{ stockFor(line) }}
                </span>
              </div>
              <!-- Remove -->
              <div class="col-span-1 text-right">
                <button @click="removeLine(idx)" type="button" class="text-red-400 hover:text-red-600 text-xs">✕</button>
              </div>
            </div>

            <div v-if="!form.items.length" class="text-sm text-gray-400 py-4 text-center border border-dashed border-gray-200 rounded-lg">
              No items yet. Click "Add Item" to start.
            </div>
          </div>
        </div>

        <!-- Totals -->
        <div class="border-t border-gray-100 pt-4 space-y-1 text-sm text-right">
          <div class="text-gray-500">Subtotal: <span class="font-medium text-gray-800">{{ fmtMoney(subtotal) }}</span></div>
          <div class="text-gray-500">Tax ({{ form.taxRate || 0 }}%): <span class="font-medium text-gray-800">{{ fmtMoney(taxAmount) }}</span></div>
          <div class="text-base font-bold text-gray-900">Total: {{ fmtMoney(grandTotal) }}</div>
        </div>

        <div v-if="error" class="bg-red-50 text-red-700 text-sm px-4 py-2 rounded-lg">{{ error }}</div>

        <div class="flex justify-end gap-3">
          <RouterLink to="/erp/orders" class="px-4 py-2 text-sm border rounded-lg hover:bg-gray-50 transition">Cancel</RouterLink>
          <button @click="save" :disabled="saving" class="px-5 py-2 text-sm bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 transition">
            {{ saving ? 'Creating…' : 'Create Sale' }}
          </button>
        </div>

      </div>
    </div>
  </AppLayout>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ArrowLeftIcon } from '@heroicons/vue/24/outline'
import AppLayout from '@/layouts/AppLayout.vue'
import api from '@/api'
import { fmtMoney, toFixed } from '@/utils/fmt'

const router      = useRouter()
const customers   = ref([])
const masterItems = ref([])
const error       = ref('')
const saving      = ref(false)

const today = new Date().toISOString().slice(0, 10)
const form  = ref({ customerId: '', orderDate: today, taxRate: 0, notes: '', items: [] })

onMounted(async () => {
  const [cRes, iRes] = await Promise.all([
    api.get('/api/erp/customers', { params: { limit: 200 } }),
    api.get('/api/items', { params: { limit: 500, status: 'active' } }),
  ])
  customers.value   = cRes.data.data.customers
  masterItems.value = iRes.data.data.items
})

function addLine() {
  form.value.items.push({ itemId: '', productName: '', quantity: 1, unitPrice: 0 })
}

function removeLine(idx) {
  form.value.items.splice(idx, 1)
}

function onItemSelected(line) {
  const item = masterItems.value.find(i => i.id === line.itemId)
  if (item) {
    line.productName = item.title
  } else {
    line.productName = ''
  }
}

function stockFor(line) {
  const item = masterItems.value.find(i => i.id === line.itemId)
  return item ? item.stock : null
}

function stockClass(line) {
  const stock = stockFor(line)
  if (stock === null) return ''
  if (stock === 0) return 'bg-red-100 text-red-600'
  if (stock < line.quantity) return 'bg-yellow-100 text-yellow-700'
  return 'bg-green-100 text-green-700'
}

const subtotal   = computed(() => form.value.items.reduce((s, i) => s + (i.quantity || 0) * (i.unitPrice || 0), 0))
const taxAmount  = computed(() => toFixed(subtotal.value * ((form.value.taxRate || 0) / 100), 2))
const grandTotal = computed(() => subtotal.value + taxAmount.value)


async function save() {
  error.value = ''
  if (!form.value.items.length) { error.value = 'Add at least one item'; return }
  for (const item of form.value.items) {
    if (!item.productName?.trim()) { error.value = 'All items need a description'; return }
    if (!item.quantity || item.quantity < 1) { error.value = 'All items need a valid quantity'; return }
  }
  saving.value = true
  try {
    const { data } = await api.post('/api/erp/orders', form.value)
    router.push(`/erp/orders/${data.data.order.id}`)
  } catch (err) {
    const d = err.response?.data
    error.value = d?.errors?.map(e => e.message).join(', ') || d?.message || 'Failed to create sale'
  } finally {
    saving.value = false
  }
}
</script>
