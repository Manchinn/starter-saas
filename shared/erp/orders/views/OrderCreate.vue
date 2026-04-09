<template>
  <AppLayout>
    <div class="flex gap-6 items-start max-w-6xl">

      <!-- ── Left: Form ──────────────────────────────────────────────────────── -->
      <div class="flex-1 min-w-0 space-y-5">

        <!-- Page heading -->
        <div class="flex items-center gap-3">
          <RouterLink to="/erp/orders"
            class="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors">
            <ArrowLeftIcon class="w-5 h-5" />
          </RouterLink>
          <div>
            <h1 class="text-xl font-semibold text-gray-900">New Sales Order</h1>
            <p class="text-sm text-gray-500 mt-0.5">Fill in the details below to create a new order</p>
          </div>
        </div>

        <!-- Order Details card -->
        <div class="bg-white rounded-xl border border-gray-200 shadow-sm">
          <div class="px-6 py-4 border-b border-gray-100">
            <h2 class="text-sm font-semibold text-gray-700">Order Details</h2>
          </div>
          <div class="px-6 py-5 grid grid-cols-2 gap-5">
            <!-- Customer -->
            <div class="col-span-2 sm:col-span-1">
              <label class="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                Customer <span class="text-red-500 normal-case">*</span>
              </label>
              <select v-model="form.customerId"
                class="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm bg-white
                       focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent
                       text-gray-800 transition-colors">
                <option value="">— Select customer —</option>
                <option v-for="c in customers" :key="c.id" :value="c.id">
                  {{ c.name }}{{ c.company ? ` · ${c.company}` : '' }}
                </option>
              </select>
            </div>
            <!-- Order Date -->
            <div>
              <label class="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                Order Date <span class="text-red-500 normal-case">*</span>
              </label>
              <input v-model="form.orderDate" type="date"
                class="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm
                       focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent
                       text-gray-800 transition-colors" />
            </div>
            <!-- Tax Rate -->
            <div>
              <label class="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Tax Rate (%)</label>
              <input v-model.number="form.taxRate" type="number" min="0" max="100" step="0.01" placeholder="0"
                class="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm
                       focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent
                       text-gray-800 transition-colors" />
            </div>
            <!-- Notes -->
            <div>
              <label class="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Notes</label>
              <input v-model="form.notes" type="text" placeholder="Optional notes…"
                class="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm
                       focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent
                       text-gray-800 transition-colors" />
            </div>
          </div>
        </div>

        <!-- Line Items card -->
        <div class="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div class="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
            <h2 class="text-sm font-semibold text-gray-700">Line Items</h2>
            <button @click="addLine" type="button"
              class="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-primary-700
                     bg-primary-50 hover:bg-primary-100 rounded-lg transition-colors">
              <PlusIcon class="w-3.5 h-3.5" />
              Add Item
            </button>
          </div>

          <!-- Empty state -->
          <div v-if="!form.items.length"
            class="flex flex-col items-center justify-center py-14 text-center">
            <div class="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center mb-3">
              <ShoppingCartIcon class="w-6 h-6 text-gray-400" />
            </div>
            <p class="text-sm font-medium text-gray-500">No items added</p>
            <p class="text-xs text-gray-400 mt-1">Click "Add Item" to add products to this order</p>
          </div>

          <!-- Items table -->
          <div v-else>
            <!-- Column headers -->
            <div class="grid gap-2 px-5 py-2 bg-gray-50 border-b border-gray-100 text-xs font-semibold text-gray-500 uppercase tracking-wide"
              style="grid-template-columns: 2.5fr 1.5fr 2fr 4rem 6rem 5rem 2rem">
              <div>Sale Item</div>
              <div>Store</div>
              <div>Description</div>
              <div class="text-right">Qty</div>
              <div class="text-right">Unit Price</div>
              <div class="text-right">Amount</div>
              <div></div>
            </div>

            <!-- Item rows -->
            <div class="divide-y divide-gray-100">
              <div v-for="(line, idx) in form.items" :key="idx"
                class="grid gap-2 px-5 py-2.5 items-center hover:bg-gray-50/60 transition-colors"
                style="grid-template-columns: 2.5fr 1.5fr 2fr 4rem 6rem 5rem 2rem">

                <!-- Sale Item -->
                <select v-model="line.saleItemId" @change="onSaleItemChange(line)"
                  class="w-full px-2.5 py-1.5 border border-gray-200 rounded-lg text-sm bg-white
                         focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent
                         transition-colors">
                  <option value="">— None —</option>
                  <option v-for="si in saleItems" :key="si.id" :value="si.id">{{ si.name }}</option>
                </select>

                <!-- Store -->
                <div>
                  <select v-if="line.hasProduct" v-model="line.storeId"
                    class="w-full px-2.5 py-1.5 border border-gray-200 rounded-lg text-sm bg-white
                           focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent
                           transition-colors">
                    <option value="">— Store —</option>
                    <option v-for="st in stores" :key="st.id" :value="st.id">{{ st.name }}</option>
                  </select>
                  <span v-else class="text-xs text-gray-300">—</span>
                </div>

                <!-- Description -->
                <input v-model="line.productName" type="text" placeholder="Description…"
                  class="w-full px-2.5 py-1.5 border border-gray-200 rounded-lg text-sm
                         focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent
                         transition-colors" />

                <!-- Qty -->
                <input v-model.number="line.quantity" type="number" min="1"
                  class="w-full px-2 py-1.5 border border-gray-200 rounded-lg text-sm text-right
                         focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent
                         transition-colors" />

                <!-- Unit Price -->
                <input v-model.number="line.unitPrice" type="number" min="0" step="0.01" placeholder="0.00"
                  class="w-full px-2.5 py-1.5 border border-gray-200 rounded-lg text-sm text-right
                         focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent
                         transition-colors" />

                <!-- Amount -->
                <div class="text-sm font-medium text-gray-700 tabular-nums text-right pr-1">
                  {{ fmtMoney((line.quantity || 0) * (line.unitPrice || 0)) }}
                </div>

                <!-- Remove -->
                <button @click="removeLine(idx)" type="button"
                  class="p-1 rounded-md text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors flex-shrink-0">
                  <XMarkIcon class="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- Error -->
        <div v-if="error"
          class="flex items-center gap-2.5 bg-red-50 border border-red-200 text-red-700 text-sm
                 px-4 py-3 rounded-lg">
          <ExclamationCircleIcon class="w-4 h-4 flex-shrink-0" />
          {{ error }}
        </div>

      </div>

      <!-- ── Right: Sticky Summary ────────────────────────────────────────────── -->
      <div class="w-72 flex-shrink-0 sticky top-6 space-y-4">

        <!-- Summary card -->
        <div class="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div class="px-5 py-4 border-b border-gray-100">
            <h2 class="text-sm font-semibold text-gray-700">Order Summary</h2>
          </div>
          <div class="px-5 py-4 space-y-3">
            <div class="flex items-center justify-between text-sm">
              <span class="text-gray-500">Items</span>
              <span class="font-medium text-gray-800">{{ form.items.length }}</span>
            </div>
            <div class="flex items-center justify-between text-sm">
              <span class="text-gray-500">Subtotal</span>
              <span class="font-medium text-gray-800 tabular-nums">{{ fmtMoney(subtotal) }}</span>
            </div>
            <div class="flex items-center justify-between text-sm">
              <span class="text-gray-500">Tax ({{ form.taxRate || 0 }}%)</span>
              <span class="font-medium text-gray-800 tabular-nums">{{ fmtMoney(taxAmount) }}</span>
            </div>
            <div class="pt-3 border-t border-gray-100 flex items-center justify-between">
              <span class="text-base font-semibold text-gray-900">Total</span>
              <span class="text-lg font-bold text-primary-700 tabular-nums">{{ fmtMoney(grandTotal) }}</span>
            </div>
          </div>
        </div>

        <!-- Action buttons -->
        <div class="space-y-2.5">
          <button @click="save" :disabled="saving"
            class="w-full flex items-center justify-center gap-2 px-5 py-2.5 text-sm font-semibold
                   bg-primary-600 text-white rounded-xl hover:bg-primary-700 shadow-sm
                   disabled:opacity-50 transition-colors">
            <CheckIcon v-if="!saving" class="w-4 h-4" />
            <span>{{ saving ? 'Creating…' : 'Create Order' }}</span>
          </button>
          <RouterLink to="/erp/orders"
            class="w-full flex items-center justify-center px-5 py-2.5 text-sm font-medium
                   text-gray-600 bg-white border border-gray-200 rounded-xl hover:bg-gray-50
                   shadow-sm transition-colors">
            Cancel
          </RouterLink>
        </div>

        <!-- Quick tips -->
        <div class="bg-blue-50 border border-blue-100 rounded-xl px-4 py-3 space-y-1.5">
          <p class="text-xs font-semibold text-blue-700">Quick Tips</p>
          <ul class="text-xs text-blue-600 space-y-1 list-disc list-inside">
            <li>Select a customer to auto-apply group pricing</li>
            <li>Items with a product require a store</li>
          </ul>
        </div>

      </div>
    </div>
  </AppLayout>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import {
  ArrowLeftIcon, PlusIcon, XMarkIcon,
  CheckIcon, ExclamationCircleIcon, ShoppingCartIcon,
} from '@heroicons/vue/24/outline'
import AppLayout from '@/layouts/AppLayout.vue'
import api from '@/api'
import { fmtMoney, toFixed } from '@/utils/fmt'

const router    = useRouter()
const customers = ref([])
const saleItems = ref([])
const stores    = ref([])
const error     = ref('')
const saving    = ref(false)

const today = new Date().toISOString().slice(0, 10)
const form  = ref({ customerId: '', orderDate: today, taxRate: 0, notes: '', items: [] })

onMounted(async () => {
  const [customersRes, saleItemsRes, storesRes] = await Promise.allSettled([
    api.get('/erp/customers', { params: { limit: 200 } }),
    api.get('/erp/sale-items', { params: { limit: 500, status: 'active' } }),
    api.get('/erp/stores', { params: { limit: 200 } }),
  ])
  if (customersRes.status === 'fulfilled') customers.value = customersRes.value.data.data.customers
  if (saleItemsRes.status === 'fulfilled') saleItems.value = saleItemsRes.value.data.data.items
  if (storesRes.status === 'fulfilled')    stores.value    = storesRes.value.data.data.stores
})

function addLine() {
  form.value.items.push({ saleItemId: '', storeId: '', hasProduct: false, productName: '', quantity: 1, unitPrice: 0 })
}

function removeLine(idx) {
  form.value.items.splice(idx, 1)
}

function getBestPricing(si, customerGroupId) {
  const pricings = si.pricings || []
  if (!pricings.length) return null
  if (customerGroupId) {
    const match = pricings.find(p => p.customerGroupId === customerGroupId)
    if (match) return match
  }
  return pricings.find(p => !p.customerGroupId) || pricings[0]
}

function applyPricing(line) {
  if (!line.saleItemId) return
  const si = saleItems.value.find(s => s.id === line.saleItemId)
  if (!si) return
  const customer = customers.value.find(c => c.id === form.value.customerId)
  const pricing = getBestPricing(si, customer?.customerGroupId)
  if (pricing) line.unitPrice = Number(pricing.unitPrice)
}

function onSaleItemChange(line) {
  const si = saleItems.value.find(s => s.id === line.saleItemId)
  if (!si) { line.productName = ''; line.unitPrice = 0; line.hasProduct = false; line.storeId = ''; return }
  line.productName = si.name
  line.hasProduct  = !!si.productId
  if (!line.hasProduct) line.storeId = ''
  applyPricing(line)
}

watch(() => form.value.customerId, () => {
  for (const line of form.value.items) applyPricing(line)
})

const subtotal   = computed(() => form.value.items.reduce((s, i) => s + (i.quantity || 0) * (i.unitPrice || 0), 0))
const taxAmount  = computed(() => toFixed(subtotal.value * ((form.value.taxRate || 0) / 100), 2))
const grandTotal = computed(() => subtotal.value + taxAmount.value)

async function save() {
  error.value = ''
  if (!form.value.customerId) { error.value = 'Customer is required'; return }
  if (!form.value.orderDate)  { error.value = 'Order date is required'; return }
  if (!form.value.items.length) { error.value = 'Add at least one item'; return }
  for (const item of form.value.items) {
    if (!item.productName?.trim())       { error.value = 'All items need a description'; return }
    if (item.hasProduct && !item.storeId) { error.value = 'Store is required for product items'; return }
    if (!item.quantity || item.quantity < 1) { error.value = 'All items need a valid quantity'; return }
  }
  saving.value = true
  try {
    const payload = {
      ...form.value,
      items: form.value.items.map(({ saleItemId, storeId, productName, quantity, unitPrice }) => ({
        saleItemId: saleItemId || null,
        storeId:    storeId    || null,
        productName, quantity, unitPrice,
      })),
    }
    const { data } = await api.post('/erp/orders', payload)
    router.push(`/erp/orders/${data.data.order.id}`)
  } catch (err) {
    const d = err.response?.data
    error.value = d?.errors?.map(e => e.message).join(', ') || d?.message || 'Failed to create order'
  } finally {
    saving.value = false
  }
}
</script>
