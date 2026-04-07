<template>
  <AppLayout>
    <div class="space-y-6">
      <div class="flex items-center gap-3">
        <RouterLink to="/erp/good-receive" class="text-gray-400 hover:text-gray-600 transition">
          <ArrowLeftIcon class="w-5 h-5" />
        </RouterLink>
        <h1 class="text-2xl font-bold text-gray-900">New Good Receive</h1>
      </div>

      <!-- Header -->
      <div class="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
        <h2 class="text-sm font-semibold text-gray-700">Header</h2>

        <!-- Row 1: Date, Store, Supplier, Notes -->
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
            <label class="block text-sm font-medium text-gray-700 mb-1">Supplier</label>
            <input v-model="form.supplier" type="text" placeholder="Supplier name"
              class="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Notes</label>
            <input v-model="form.notes" type="text" placeholder="Optional notes"
              class="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
          </div>
        </div>

        <!-- Row 2: Document type toggle + conditional fields -->
        <div class="flex items-start gap-6 pt-2 border-t border-gray-100">
          <!-- Type selector -->
          <div class="shrink-0">
            <label class="block text-sm font-medium text-gray-700 mb-2">Document Type <span class="text-red-500">*</span></label>
            <div class="flex items-center gap-1 p-1 bg-gray-100 rounded-lg w-fit">
              <button type="button" @click="form.docType = 'invoice'"
                :class="form.docType === 'invoice' ? 'bg-white shadow text-gray-900' : 'text-gray-500 hover:text-gray-700'"
                class="px-4 py-1.5 rounded-md text-sm font-medium transition">
                Invoice
              </button>
              <button type="button" @click="form.docType = 'delivery'"
                :class="form.docType === 'delivery' ? 'bg-white shadow text-gray-900' : 'text-gray-500 hover:text-gray-700'"
                class="px-4 py-1.5 rounded-md text-sm font-medium transition">
                Delivery
              </button>
            </div>
          </div>

          <!-- Invoice fields -->
          <template v-if="form.docType === 'invoice'">
            <div class="w-48">
              <label class="block text-sm font-medium text-gray-700 mb-1">Invoice Number <span class="text-red-500">*</span></label>
              <input v-model="form.invoiceNo" type="text" placeholder="e.g. INV-00123"
                class="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
            </div>
            <div class="w-40">
              <label class="block text-sm font-medium text-gray-700 mb-1">Invoice Date</label>
              <input v-model="form.invoiceDate" type="date"
                class="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
            </div>
            <div class="w-36">
              <label class="block text-sm font-medium text-gray-700 mb-1">Invoice Discount</label>
              <input v-model.number="form.invoiceDiscount" type="number" min="0" step="0.01" placeholder="0.00"
                class="w-full px-3 py-2 border rounded-lg text-sm text-right focus:outline-none focus:ring-2 focus:ring-primary-500" />
            </div>
            <div class="w-36">
              <label class="block text-sm font-medium text-gray-700 mb-1">Net Amount</label>
              <div class="px-3 py-2 border border-gray-100 bg-green-50 rounded-lg text-sm text-right font-bold text-green-800">
                {{ fmtMoney(invoiceNetAmount) }}
              </div>
            </div>
          </template>

          <!-- Delivery fields -->
          <template v-if="form.docType === 'delivery'">
            <div class="w-52">
              <label class="block text-sm font-medium text-gray-700 mb-1">Delivery Number <span class="text-red-500">*</span></label>
              <input v-model="form.deliveryNo" type="text" placeholder="e.g. DN-00456"
                class="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
            </div>
          </template>
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
              <th class="px-3 py-2 font-medium text-gray-600 w-24">Qty <span class="text-red-500">*</span></th>
              <th class="px-3 py-2 font-medium text-gray-600 w-28">UOM</th>
              <th class="px-3 py-2 font-medium text-gray-600 w-32 text-right">Stock Qty</th>
              <th class="px-3 py-2 font-medium text-gray-600 w-28">Cost / Unit</th>
              <th class="px-3 py-2 font-medium text-gray-600 w-28 text-right">Net Amount</th>
              <th class="px-3 py-2 w-16 text-center text-gray-400 text-xs font-medium">More</th>
              <th class="px-3 py-2 w-8"></th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="!items.length">
              <td colspan="8" class="px-3 py-10 text-center text-gray-400">No items yet. Click "+ Add Item" to start.</td>
            </tr>

            <template v-for="(item, i) in items" :key="i">
              <!-- Primary row -->
              <tr class="border-t border-gray-100 hover:bg-gray-50 transition">
                <td class="px-3 py-2">
                  <select v-model="item.productId"
                    class="w-full px-2 py-1.5 border rounded-lg text-sm bg-white focus:outline-none focus:ring-1 focus:ring-primary-500">
                    <option value="">— Select product —</option>
                    <option v-for="p in products" :key="p.id" :value="p.id">{{ p.name }}{{ p.sku ? ` [${p.sku}]` : '' }}</option>
                  </select>
                </td>
                <td class="px-3 py-2">
                  <input v-model.number="item.qty" @input="recalc(item)" type="number" min="0" step="0.01" placeholder="0"
                    class="w-full px-2 py-1.5 border rounded-lg text-sm text-right focus:outline-none focus:ring-1 focus:ring-primary-500" />
                </td>
                <td class="px-3 py-2">
                  <select v-model="item.qtyUomId"
                    class="w-full px-2 py-1.5 border rounded-lg text-sm bg-white focus:outline-none focus:ring-1 focus:ring-primary-500">
                    <option value="">—</option>
                    <option v-for="u in uoms" :key="u.id" :value="u.id">{{ u.abbreviation || u.name }}</option>
                  </select>
                </td>
                <td class="px-3 py-2 text-right">
                  <div class="flex flex-col items-end">
                    <span class="font-semibold text-sm" :class="convMap[item.qtyUomId] ? 'text-indigo-700' : 'text-gray-500'">
                      {{ fmtQty(getStockQty(item)) }}
                    </span>
                    <span v-if="convMap[item.qtyUomId]" class="text-xs text-indigo-400">
                      {{ convMap[item.qtyUomId].toUomAbbr }}
                    </span>
                    <span v-else class="text-xs text-gray-400">no conv.</span>
                  </div>
                </td>
                <td class="px-3 py-2">
                  <input v-model.number="item.cost" @input="recalc(item)" type="number" min="0" step="0.0001" placeholder="0.0000"
                    class="w-full px-2 py-1.5 border rounded-lg text-sm text-right focus:outline-none focus:ring-1 focus:ring-primary-500" />
                </td>
                <td class="px-3 py-2 text-right font-semibold text-gray-800">
                  {{ fmtMoney(item.netAmount) }}
                </td>
                <td class="px-3 py-2 text-center">
                  <button type="button" @click="toggleExpand(i)"
                    :class="expanded.has(i) ? 'bg-primary-100 text-primary-700' : 'text-gray-400 hover:text-gray-600'"
                    class="px-2 py-1 rounded text-xs font-medium transition">
                    {{ expanded.has(i) ? '▲' : '▼' }}
                  </button>
                </td>
                <td class="px-3 py-2 text-center">
                  <button @click="removeRow(i)" class="text-gray-300 hover:text-red-500 transition text-lg leading-none">&times;</button>
                </td>
              </tr>

              <!-- Expanded detail row -->
              <tr v-if="expanded.has(i)" class="bg-gray-50 border-t border-gray-100">
                <td colspan="8" class="px-4 py-4">
                  <div class="grid grid-cols-6 gap-3">
                    <!-- Free Qty -->
                    <div>
                      <label class="block text-xs font-medium text-gray-500 mb-1">Free Qty</label>
                      <input v-model.number="item.freeQty" @input="recalc(item)" type="number" min="0" step="0.01" placeholder="0"
                        class="w-full px-2 py-1.5 border rounded-lg text-sm text-right bg-white focus:outline-none focus:ring-1 focus:ring-primary-500" />
                    </div>
                    <!-- Free UOM -->
                    <div>
                      <label class="block text-xs font-medium text-gray-500 mb-1">Free UOM</label>
                      <select v-model="item.freeQtyUomId"
                        class="w-full px-2 py-1.5 border rounded-lg text-sm bg-white focus:outline-none focus:ring-1 focus:ring-primary-500">
                        <option value="">—</option>
                        <option v-for="u in uoms" :key="u.id" :value="u.id">{{ u.abbreviation || u.name }}</option>
                      </select>
                    </div>
                    <!-- Batch ID -->
                    <div>
                      <label class="block text-xs font-medium text-gray-500 mb-1">Batch ID</label>
                      <input v-model="item.batchId" type="text" placeholder="Optional"
                        class="w-full px-2 py-1.5 border rounded-lg text-sm bg-white focus:outline-none focus:ring-1 focus:ring-primary-500" />
                    </div>
                    <!-- Expiry Date -->
                    <div>
                      <label class="block text-xs font-medium text-gray-500 mb-1">Expiry Date</label>
                      <input v-model="item.expiryDate" type="date"
                        class="w-full px-2 py-1.5 border rounded-lg text-sm bg-white focus:outline-none focus:ring-1 focus:ring-primary-500" />
                    </div>
                    <!-- Disc % -->
                    <div>
                      <label class="block text-xs font-medium text-gray-500 mb-1">Disc %</label>
                      <input v-model.number="item.discountPct" @input="recalc(item)" type="number" min="0" max="100" step="0.01" placeholder="0"
                        class="w-full px-2 py-1.5 border rounded-lg text-sm text-right bg-white focus:outline-none focus:ring-1 focus:ring-primary-500" />
                    </div>
                    <!-- Discount -->
                    <div>
                      <label class="block text-xs font-medium text-gray-500 mb-1">Discount</label>
                      <input v-model.number="item.discount" @input="recalc(item)" type="number" min="0" step="0.01" placeholder="0.00"
                        class="w-full px-2 py-1.5 border rounded-lg text-sm text-right bg-white focus:outline-none focus:ring-1 focus:ring-primary-500" />
                    </div>
                    <!-- WAC (read-only) -->
                    <div>
                      <label class="block text-xs font-medium text-gray-500 mb-1">WAC</label>
                      <input :value="fmtRate(item.wac)" readonly type="text"
                        class="w-full px-2 py-1.5 border border-gray-100 bg-blue-50 rounded-lg text-sm text-right text-blue-700 font-mono cursor-default" />
                    </div>
                    <!-- Comments -->
                    <div class="col-span-5">
                      <label class="block text-xs font-medium text-gray-500 mb-1">Comments</label>
                      <input v-model="item.comments" type="text" placeholder="Optional"
                        class="w-full px-2 py-1.5 border rounded-lg text-sm bg-white focus:outline-none focus:ring-1 focus:ring-primary-500" />
                    </div>
                  </div>
                </td>
              </tr>
            </template>
          </tbody>

          <!-- Totals footer -->
          <tfoot v-if="items.length" class="border-t-2 border-gray-200 bg-gray-50">
            <tr>
              <td colspan="4" class="px-3 py-2 text-xs font-medium text-gray-500">Totals</td>
              <td class="px-3 py-2 text-right text-xs text-gray-600">Gross: <span class="font-semibold">{{ fmtMoney(totalGross) }}</span></td>
              <td class="px-3 py-2 text-right text-sm font-bold text-gray-900">{{ fmtMoney(totalNet) }}</td>
              <td colspan="2"></td>
            </tr>
          </tfoot>
        </table>
      </div>

      <div v-if="error" class="bg-red-50 text-red-700 text-sm px-4 py-2 rounded-lg">{{ error }}</div>

      <div class="flex justify-end gap-3">
        <RouterLink to="/erp/good-receive" class="px-4 py-2 text-sm border rounded-lg hover:bg-gray-50 transition">Cancel</RouterLink>
        <button @click="save" :disabled="saving"
          class="px-5 py-2 text-sm bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 transition">
          {{ saving ? 'Saving…' : 'Save as Draft' }}
        </button>
      </div>
    </div>
  </AppLayout>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ArrowLeftIcon } from '@heroicons/vue/24/outline'
import AppLayout from '@/layouts/AppLayout.vue'
import api from '@/api'
import { fmtMoney, fmtRate, toFixed } from '@/utils/fmt'

const router   = useRouter()
const products = ref([])
const stores   = ref([])
const uoms     = ref([])
const convMap  = ref({}) // { fromUomId: { factor, toUomAbbr } }
const form     = ref({ date: new Date().toISOString().slice(0, 10), storeId: '', supplier: '', notes: '', docType: 'invoice', invoiceNo: '', invoiceDate: '', deliveryNo: '', invoiceDiscount: 0 })
const items    = ref([])
const expanded = reactive(new Set())
const error    = ref('')
const saving   = ref(false)

onMounted(async () => {
  try {
    const [prodRes, storeRes, uomRes, convRes] = await Promise.all([
      api.get('/erp/item-master', { params: { limit: 200 } }),
      api.get('/erp/good-receive/stores-lookup'),
      api.get('/erp/uom'),
      api.get('/erp/uom-conversion'),
    ])
    products.value = prodRes.data.data.products
    stores.value   = storeRes.data.data.stores
    uoms.value     = uomRes.data.data.uoms

    // Build lookup: fromUomId → { factor, toUomAbbr }
    const map = {}
    for (const c of convRes.data.data.conversions) {
      map[c.fromUomId] = {
        factor:     parseFloat(c.factor),
        toUomAbbr:  c.toUom?.abbreviation || c.toUom?.name || '',
      }
    }
    convMap.value = map
  } catch (err) {
    console.error('Failed to load lookups:', err.message)
  }
})

function newRow() {
  return {
    productId: '', qtyUomId: '', freeQtyUomId: '',
    qty: 1, freeQty: 0,
    batchId: '', expiryDate: '',
    cost: 0, discountPct: 0, discount: 0,
    netAmount: 0, wac: 0,
    comments: '',
  }
}

function recalc(item) {
  const qty         = parseFloat(item.qty)        || 0
  const cost        = parseFloat(item.cost)       || 0
  const freeQty     = parseFloat(item.freeQty)    || 0
  const discPct     = parseFloat(item.discountPct) || 0
  const discAmt     = parseFloat(item.discount)   || 0

  const gross       = qty * cost
  item.netAmount    = toFixed(gross * (1 - discPct / 100) - discAmt, 2)
  const totalQty    = qty + freeQty
  item.wac          = totalQty ? toFixed((qty * cost) / totalQty, 4) : 0
}

/**
 * Returns the total stock qty that will be posted for this item,
 * after applying UOM conversion for both qty and freeQty.
 */
function getStockQty(item) {
  const qty     = parseFloat(item.qty)    || 0
  const freeQty = parseFloat(item.freeQty) || 0
  const qtyFactor     = item.qtyUomId     && convMap.value[item.qtyUomId]     ? convMap.value[item.qtyUomId].factor     : 1
  const freeQtyFactor = item.freeQtyUomId && convMap.value[item.freeQtyUomId] ? convMap.value[item.freeQtyUomId].factor : 1
  return toFixed(qty * qtyFactor + freeQty * freeQtyFactor, 4)
}

function fmtQty(val) {
  const n = parseFloat(val) || 0
  return n % 1 === 0 ? String(n) : n.toFixed(4).replace(/\.?0+$/, '')
}

function toggleExpand(i) {
  expanded.has(i) ? expanded.delete(i) : expanded.add(i)
}

function addRow() {
  items.value.push(newRow())
}

function removeRow(i) {
  expanded.delete(i)
  items.value.splice(i, 1)
}

const totalGross = computed(() =>
  items.value.reduce((s, i) => s + (parseFloat(i.qty) || 0) * (parseFloat(i.cost) || 0), 0)
)
const totalNet = computed(() =>
  items.value.reduce((s, i) => s + (parseFloat(i.netAmount) || 0), 0)
)
const invoiceNetAmount = computed(() =>
  Math.max(0, totalNet.value - (parseFloat(form.value.invoiceDiscount) || 0))
)

async function save() {
  error.value = ''
  if (!form.value.date)    { error.value = 'Date is required'; return }
  if (!form.value.storeId) { error.value = 'Store is required'; return }
  if (form.value.docType === 'invoice' && !form.value.invoiceNo.trim())  { error.value = 'Invoice Number is required'; return }
  if (form.value.docType === 'delivery' && !form.value.deliveryNo.trim()) { error.value = 'Delivery Number is required'; return }
  if (!items.value.length) { error.value = 'Add at least one item'; return }
  if (items.value.find(i => !i.productId || !i.qty || i.qty <= 0)) {
    error.value = 'All items must have a product and quantity > 0'; return
  }
  saving.value = true
  try {
    const payload = {
      date:        form.value.date,
      storeId:     form.value.storeId,
      supplier:    form.value.supplier,
      notes:       form.value.notes,
      docType:     form.value.docType,
      invoiceNo:        form.value.docType === 'invoice'  ? form.value.invoiceNo        : null,
      invoiceDate:      form.value.docType === 'invoice'  ? form.value.invoiceDate      : null,
      invoiceDiscount:  form.value.docType === 'invoice'  ? (form.value.invoiceDiscount || 0) : 0,
      invoiceNetAmount: form.value.docType === 'invoice'  ? invoiceNetAmount.value       : 0,
      deliveryNo:       form.value.docType === 'delivery' ? form.value.deliveryNo        : null,
      items: items.value.map((i) => ({
        productId:    i.productId,
        qty:          i.qty,
        qtyUomId:     i.qtyUomId     || null,
        freeQty:      i.freeQty      || 0,
        freeQtyUomId: i.freeQtyUomId || null,
        batchId:      i.batchId      || null,
        expiryDate:   i.expiryDate   || null,
        cost:         i.cost         || 0,
        discountPct:  i.discountPct  || 0,
        discount:     i.discount     || 0,
        comments:     i.comments     || null,
      })),
    }
    const { data } = await api.post('/erp/good-receive', payload)
    router.push(`/erp/good-receive/${data.data.goodReceive.id}`)
  } catch (err) {
    error.value = err.response?.data?.message || 'Failed to save'
  } finally {
    saving.value = false
  }
}
</script>
