<template>
  <AppLayout>
    <div class="max-w-7xl space-y-6">

      <!-- ── Page Header ─────────────────────────────────────────────────────── -->
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-3">
          <RouterLink to="/erp/orders"
            class="p-2 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors">
            <ArrowLeftIcon class="w-5 h-5" />
          </RouterLink>
          <div>
            <div class="flex items-center gap-2.5">
              <h1 class="text-xl font-bold text-gray-900">New Sales Order</h1>
              <span class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold
                           bg-amber-50 text-amber-700 border border-amber-200">
                <span class="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
                Draft
              </span>
            </div>
            <p class="text-sm text-gray-500 mt-0.5">
              <span class="text-gray-400">Orders</span>
              <span class="mx-1.5 text-gray-300">/</span>
              Create
            </p>
          </div>
        </div>
        <!-- Header actions -->
        <div class="flex items-center gap-2.5">
          <RouterLink to="/erp/orders"
            class="px-4 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-200
                   rounded-lg hover:bg-gray-50 transition-colors">
            Cancel
          </RouterLink>
          <button @click="save" :disabled="saving"
            class="inline-flex items-center gap-2 px-5 py-2 text-sm font-semibold text-white
                   bg-primary-600 rounded-lg hover:bg-primary-700 shadow-sm
                   disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
            <ArrowPathIcon v-if="saving" class="w-4 h-4 animate-spin" />
            <CheckIcon v-else class="w-4 h-4" />
            {{ saving ? 'Creating…' : 'Create Order' }}
          </button>
        </div>
      </div>

      <!-- ── Main Grid ───────────────────────────────────────────────────────── -->
      <div class="flex gap-6 items-start">

        <!-- ── Left column ──────────────────────────────────────────────────── -->
        <div class="flex-1 min-w-0 space-y-5">

          <!-- Section 1: Customer & Order Info ──────────────────────────────── -->
          <div class="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            <div class="px-6 py-4 border-b border-gray-100 flex items-center gap-3">
              <div class="w-7 h-7 rounded-lg bg-primary-50 flex items-center justify-center flex-shrink-0">
                <UserIcon class="w-4 h-4 text-primary-600" />
              </div>
              <h2 class="text-sm font-semibold text-gray-800">Customer & Order Info</h2>
            </div>

            <div class="px-6 py-5">
              <div class="grid grid-cols-2 gap-x-6 gap-y-5">

                <!-- Customer -->
                <div class="col-span-2 lg:col-span-1">
                  <label class="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                    Customer <span class="text-red-500 normal-case font-normal">*</span>
                  </label>
                  <select v-model="form.customerId"
                    :class="['w-full px-3 py-2.5 border rounded-lg text-sm bg-white transition-colors',
                             'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent',
                             errors.customerId ? 'border-red-300 bg-red-50' : 'border-gray-200 text-gray-800']">
                    <option value="">— Select customer —</option>
                    <option v-for="c in customers" :key="c.id" :value="c.id">
                      {{ c.name }}{{ c.company ? ` · ${c.company}` : '' }}
                    </option>
                  </select>
                  <p v-if="errors.customerId" class="mt-1 text-xs text-red-500">{{ errors.customerId }}</p>

                  <!-- Customer detail chip (shown after selection) -->
                  <div v-if="selectedCustomer"
                    class="mt-2.5 flex items-center gap-2.5 px-3 py-2 bg-primary-50 rounded-lg border border-primary-100">
                    <div class="w-7 h-7 rounded-full bg-primary-600 flex items-center justify-center flex-shrink-0">
                      <span class="text-xs font-bold text-white uppercase">
                        {{ selectedCustomer.name?.charAt(0) }}
                      </span>
                    </div>
                    <div class="min-w-0">
                      <p class="text-sm font-semibold text-primary-800 truncate">{{ selectedCustomer.name }}</p>
                      <p v-if="selectedCustomer.company" class="text-xs text-primary-500 truncate">{{ selectedCustomer.company }}</p>
                    </div>
                    <span v-if="selectedCustomer.group"
                      class="ml-auto flex-shrink-0 text-xs font-medium px-2 py-0.5 rounded-full
                             bg-white border border-primary-200 text-primary-600">
                      {{ selectedCustomer.group.name }}
                    </span>
                  </div>
                </div>

                <!-- Order Date -->
                <div>
                  <label class="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                    Order Date <span class="text-red-500 normal-case font-normal">*</span>
                  </label>
                  <input v-model="form.orderDate" type="date"
                    :class="['w-full px-3 py-2.5 border rounded-lg text-sm transition-colors',
                             'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent',
                             errors.orderDate ? 'border-red-300 bg-red-50' : 'border-gray-200 text-gray-800']" />
                  <p v-if="errors.orderDate" class="mt-1 text-xs text-red-500">{{ errors.orderDate }}</p>
                </div>

                <!-- Tax Rate -->
                <div>
                  <label class="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Tax Rate (%)</label>
                  <div class="relative">
                    <input v-model.number="form.taxRate" type="number" min="0" max="100" step="0.01" placeholder="0"
                      class="w-full pl-3 pr-10 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-800
                             focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors" />
                    <span class="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-400 font-medium">%</span>
                  </div>
                </div>

                <!-- Notes -->
                <div class="col-span-2">
                  <label class="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Notes</label>
                  <textarea v-model="form.notes" rows="2" placeholder="Optional order notes or instructions…"
                    class="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-800
                           focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent
                           transition-colors resize-none placeholder-gray-400" />
                </div>

              </div>
            </div>
          </div>

          <!-- Section 2: Line Items ──────────────────────────────────────────── -->
          <div class="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            <div class="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <div class="flex items-center gap-3">
                <div class="w-7 h-7 rounded-lg bg-green-50 flex items-center justify-center flex-shrink-0">
                  <ClipboardDocumentListIcon class="w-4 h-4 text-green-600" />
                </div>
                <div>
                  <h2 class="text-sm font-semibold text-gray-800">Line Items</h2>
                  <p v-if="form.items.length" class="text-xs text-gray-400">{{ form.items.length }} item{{ form.items.length !== 1 ? 's' : '' }}</p>
                </div>
              </div>
              <button @click="addLine" type="button"
                class="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-primary-700
                       bg-primary-50 hover:bg-primary-100 border border-primary-200 rounded-lg transition-colors">
                <PlusIcon class="w-3.5 h-3.5" />
                Add Item
              </button>
            </div>

            <!-- Empty state -->
            <div v-if="!form.items.length" class="flex flex-col items-center justify-center py-16 text-center">
              <div class="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mb-4">
                <ShoppingCartIcon class="w-8 h-8 text-gray-300" />
              </div>
              <p class="text-sm font-semibold text-gray-500">No items yet</p>
              <p class="text-xs text-gray-400 mt-1 mb-4">Add products or services to this order</p>
              <button @click="addLine" type="button"
                class="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-primary-700
                       bg-primary-50 hover:bg-primary-100 border border-primary-200 rounded-lg transition-colors">
                <PlusIcon class="w-4 h-4" />
                Add First Item
              </button>
              <p v-if="errors.items" class="mt-3 text-xs text-red-500">{{ errors.items }}</p>
            </div>

            <!-- Items table -->
            <div v-else>
              <!-- Column headers -->
              <div class="grid items-center gap-3 px-5 py-2.5 bg-gray-50 border-b border-gray-100
                          text-xs font-semibold text-gray-400 uppercase tracking-wide"
                style="grid-template-columns: 1.8rem 2.5fr 1.4fr 2fr 5rem 7rem 5.5rem 2rem">
                <div class="text-center">#</div>
                <div>Sale Item</div>
                <div>Store</div>
                <div>Description</div>
                <div class="text-right">Qty</div>
                <div class="text-right">Unit Price</div>
                <div class="text-right">Amount</div>
                <div></div>
              </div>

              <!-- Rows -->
              <div class="divide-y divide-gray-100">
                <div v-for="(line, idx) in form.items" :key="idx"
                  :class="['grid items-center gap-3 px-5 py-3 transition-colors',
                           idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/40',
                           'hover:bg-primary-50/30']"
                  style="grid-template-columns: 1.8rem 2.5fr 1.4fr 2fr 5rem 7rem 5.5rem 2rem">

                  <!-- Row number -->
                  <div class="text-xs font-semibold text-gray-300 text-center">{{ idx + 1 }}</div>

                  <!-- Sale Item -->
                  <select v-model="line.saleItemId" @change="onSaleItemChange(line)"
                    class="w-full px-2.5 py-2 border border-gray-200 rounded-lg text-sm bg-white
                           focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent
                           text-gray-800 transition-colors">
                    <option value="">— Select item —</option>
                    <option v-for="si in saleItems" :key="si.id" :value="si.id">{{ si.name }}</option>
                  </select>

                  <!-- Store -->
                  <div>
                    <select v-if="line.hasProduct" v-model="line.storeId"
                      :class="['w-full px-2.5 py-2 border rounded-lg text-sm bg-white transition-colors',
                               'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent',
                               line.hasProduct && !line.storeId ? 'border-amber-300' : 'border-gray-200 text-gray-800']">
                      <option value="">— Store —</option>
                      <option v-for="st in stores" :key="st.id" :value="st.id">{{ st.name }}</option>
                    </select>
                    <div v-else class="flex items-center justify-center h-9">
                      <span class="text-xs text-gray-300">—</span>
                    </div>
                  </div>

                  <!-- Description -->
                  <input v-model="line.productName" type="text" placeholder="Description…"
                    class="w-full px-2.5 py-2 border border-gray-200 rounded-lg text-sm text-gray-800
                           focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent
                           transition-colors placeholder-gray-300" />

                  <!-- Qty -->
                  <input v-model.number="line.quantity" type="number" min="1"
                    class="w-full px-2 py-2 border border-gray-200 rounded-lg text-sm text-right
                           text-gray-800 tabular-nums
                           focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent
                           transition-colors" />

                  <!-- Unit Price -->
                  <input v-model.number="line.unitPrice" type="number" min="0" step="0.01" placeholder="0.00"
                    class="w-full px-2.5 py-2 border border-gray-200 rounded-lg text-sm text-right
                           text-gray-800 tabular-nums
                           focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent
                           transition-colors placeholder-gray-300" />

                  <!-- Amount -->
                  <div class="text-sm font-semibold text-gray-700 tabular-nums text-right">
                    {{ fmtMoney((line.quantity || 0) * (line.unitPrice || 0)) }}
                  </div>

                  <!-- Remove -->
                  <button @click="removeLine(idx)" type="button"
                    class="w-7 h-7 rounded-md flex items-center justify-center
                           text-gray-300 hover:text-red-500 hover:bg-red-50 transition-colors flex-shrink-0">
                    <TrashIcon class="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <!-- Table footer: subtotal row -->
              <div class="grid items-center gap-3 px-5 py-3.5 bg-gray-50 border-t border-gray-200"
                style="grid-template-columns: 1.8rem 2.5fr 1.4fr 2fr 5rem 7rem 5.5rem 2rem">
                <div class="col-span-6 text-xs font-semibold text-gray-400 uppercase tracking-wide text-right">
                  Subtotal
                </div>
                <div class="text-sm font-bold text-gray-800 tabular-nums text-right">
                  {{ fmtMoney(subtotal) }}
                </div>
                <div></div>
              </div>

              <p v-if="errors.items" class="px-5 py-2 text-xs text-red-500 bg-red-50 border-t border-red-100">
                {{ errors.items }}
              </p>
            </div>
          </div>

          <!-- Global error -->
          <div v-if="globalError"
            class="flex items-start gap-3 bg-red-50 border border-red-200 text-red-700
                   text-sm px-4 py-3.5 rounded-xl">
            <ExclamationCircleIcon class="w-5 h-5 flex-shrink-0 mt-0.5" />
            <span>{{ globalError }}</span>
          </div>

        </div>

        <!-- ── Right sidebar ─────────────────────────────────────────────────── -->
        <div class="w-72 flex-shrink-0 sticky top-6 space-y-4">

          <!-- Order Summary card -->
          <div class="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            <div class="px-5 py-4 border-b border-gray-100 flex items-center gap-2.5">
              <CalculatorIcon class="w-4 h-4 text-gray-400" />
              <h2 class="text-sm font-semibold text-gray-800">Order Summary</h2>
            </div>
            <div class="px-5 py-4 space-y-3">
              <div class="flex items-center justify-between text-sm">
                <span class="text-gray-500">Items</span>
                <span class="font-semibold text-gray-800">{{ form.items.length }}</span>
              </div>
              <div class="flex items-center justify-between text-sm">
                <span class="text-gray-500">Subtotal</span>
                <span class="font-semibold text-gray-800 tabular-nums">{{ fmtMoney(subtotal) }}</span>
              </div>
              <div class="flex items-center justify-between text-sm">
                <span class="text-gray-500">
                  Tax
                  <span class="text-gray-400">({{ form.taxRate || 0 }}%)</span>
                </span>
                <span class="font-semibold text-gray-800 tabular-nums">{{ fmtMoney(taxAmount) }}</span>
              </div>
              <div class="pt-3 border-t border-gray-100 flex items-center justify-between">
                <span class="text-base font-bold text-gray-900">Total</span>
                <span class="text-xl font-extrabold text-primary-700 tabular-nums">{{ fmtMoney(grandTotal) }}</span>
              </div>
            </div>
          </div>

          <!-- Action buttons -->
          <div class="space-y-2.5">
            <button @click="save" :disabled="saving"
              class="w-full flex items-center justify-center gap-2 px-5 py-3 mb-2.5 text-sm font-bold
                     bg-primary-600 text-white rounded-xl hover:bg-primary-700 shadow-sm
                     disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
              <ArrowPathIcon v-if="saving" class="w-4 h-4 animate-spin" />
              <CheckIcon v-else class="w-4 h-4" />
              {{ saving ? 'Creating…' : 'Create Order' }}
            </button>
            <RouterLink to="/erp/orders"
              class="w-full flex items-center justify-center px-5 py-2.5 text-sm font-medium
                     text-gray-600 bg-white border border-gray-200 rounded-xl hover:bg-gray-50
                     transition-colors">
              Discard
            </RouterLink>
          </div>

          <!-- Tips -->
          <div class="rounded-2xl border border-blue-100 bg-blue-50 px-4 py-4">
            <div class="flex items-center gap-2 mb-2">
              <LightBulbIcon class="w-4 h-4 text-blue-500 flex-shrink-0" />
              <p class="text-xs font-bold text-blue-700">Tips</p>
            </div>
            <ul class="space-y-1.5 text-xs text-blue-600">
              <li class="flex items-start gap-1.5">
                <span class="mt-0.5 w-1 h-1 rounded-full bg-blue-400 flex-shrink-0"></span>
                Selecting a customer auto-applies their group pricing
              </li>
              <li class="flex items-start gap-1.5">
                <span class="mt-0.5 w-1 h-1 rounded-full bg-blue-400 flex-shrink-0"></span>
                Product-linked items require a store to be selected
              </li>
            </ul>
          </div>

        </div>
      </div>
    </div>
  </AppLayout>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import {
  ArrowLeftIcon, PlusIcon, TrashIcon,
  CheckIcon, ExclamationCircleIcon, ShoppingCartIcon,
  ArrowPathIcon, UserIcon, ClipboardDocumentListIcon,
  CalculatorIcon, LightBulbIcon,
} from '@heroicons/vue/24/outline'
import AppLayout from '@/layouts/AppLayout.vue'
import api from '@/api'
import { fmtMoney, toFixed } from '@/utils/fmt'

const router    = useRouter()
const customers = ref([])
const saleItems = ref([])
const stores    = ref([])
const globalError = ref('')
const saving    = ref(false)
const errors    = ref({})

const today = new Date().toISOString().slice(0, 10)
const form  = ref({ customerId: '', orderDate: today, taxRate: 0, notes: '', items: [] })

const selectedCustomer = computed(() =>
  form.value.customerId ? customers.value.find(c => c.id === form.value.customerId) : null
)

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
  errors.value.customerId = ''
  for (const line of form.value.items) applyPricing(line)
})

const subtotal   = computed(() => form.value.items.reduce((s, i) => s + (i.quantity || 0) * (i.unitPrice || 0), 0))
const taxAmount  = computed(() => toFixed(subtotal.value * ((form.value.taxRate || 0) / 100), 2))
const grandTotal = computed(() => subtotal.value + taxAmount.value)

function validate() {
  const e = {}
  if (!form.value.customerId) e.customerId = 'Customer is required'
  if (!form.value.orderDate)  e.orderDate  = 'Order date is required'
  if (!form.value.items.length) e.items = 'Add at least one item'
  for (const item of form.value.items) {
    if (!item.productName?.trim())        { e.items = 'All items need a description'; break }
    if (item.hasProduct && !item.storeId) { e.items = 'Select a store for product items'; break }
    if (!item.quantity || item.quantity < 1) { e.items = 'All items need a valid quantity'; break }
  }
  errors.value = e
  return Object.keys(e).length === 0
}

async function save() {
  globalError.value = ''
  if (!validate()) return
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
    globalError.value = d?.errors?.map(e => e.message).join(', ') || d?.message || 'Failed to create order'
  } finally {
    saving.value = false
  }
}
</script>
