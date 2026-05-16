<template>
  <AppLayout>
    <div class="space-y-6">
      <div class="flex items-center gap-3">
        <RouterLink to="/erp/stock-return" class="text-[#9BA7B0] hover:text-[#637381] transition">
          <ArrowLeftIcon class="w-5 h-5" />
        </RouterLink>
        <h1 class="text-2xl font-bold text-[#1C2434]">{{ t('erp.stockReturn.new') }}</h1>
      </div>

      <!-- Header -->
      <div class="bg-white rounded-2xl border border-[#E2E8F0] p-6 space-y-4">
        <h2 class="text-sm font-semibold text-[#374151]">{{ t('erp.common.header') }}</h2>

        <!-- Row 1: Type toggle + Date + Store + Notes -->
        <div class="flex items-start gap-6">
          <!-- Type selector -->
          <div class="shrink-0">
            <label class="block text-sm font-medium text-[#374151] mb-2">{{ t('erp.stockReturn.returnType') }} <span class="text-red-500">*</span></label>
            <div class="flex items-center gap-1 p-1 bg-[#F1F5F9] rounded-lg">
              <button type="button" @click="form.type = 'customer_return'"
                :class="form.type === 'customer_return' ? 'bg-white shadow text-[#1C2434]' : 'text-[#637381] hover:text-[#374151]'"
                class="px-4 py-1.5 rounded-md text-sm font-medium transition whitespace-nowrap">
                {{ t('erp.stockReturn.customerReturn') }}
              </button>
              <button type="button" @click="form.type = 'vendor_return'"
                :class="form.type === 'vendor_return' ? 'bg-white shadow text-[#1C2434]' : 'text-[#637381] hover:text-[#374151]'"
                class="px-4 py-1.5 rounded-md text-sm font-medium transition whitespace-nowrap">
                {{ t('erp.stockReturn.returnToVendor') }}
              </button>
            </div>
          </div>

          <!-- Date -->
          <div class="w-40">
            <label class="block text-sm font-medium text-[#374151] mb-1">{{ t('erp.common.date') }} <span class="text-red-500">*</span></label>
            <DateInput v-model="form.date" class="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
          </div>

          <!-- Store -->
          <div class="w-52">
            <label class="block text-sm font-medium text-[#374151] mb-1">{{ t('erp.common.store') }} <span class="text-red-500">*</span></label>
            <SearchSelect v-model="form.storeId" :options="stores" :placeholder="t('erp.common.selectStore')">
              <template #option="{ option }">{{ option.name }}<span v-if="option.code" class="text-[#9BA7B0]"> ({{ option.code }})</span></template>
              <template #singleLabel="{ option }">{{ option.name }}<span v-if="option.code" class="text-[#9BA7B0]"> ({{ option.code }})</span></template>
            </SearchSelect>
          </div>

          <!-- Customer (customer_return) -->
          <div v-if="form.type === 'customer_return'" class="w-52">
            <label class="block text-sm font-medium text-[#374151] mb-1">{{ t('erp.stockReturn.customer') }}</label>
            <SearchSelect v-model="form.customerId" :options="customers" placeholder="— Select customer —">
              <template #option="{ option }">{{ option.name }}<span v-if="option.company" class="text-[#9BA7B0]"> ({{ option.company }})</span></template>
              <template #singleLabel="{ option }">{{ option.name }}<span v-if="option.company" class="text-[#9BA7B0]"> ({{ option.company }})</span></template>
            </SearchSelect>
          </div>

          <!-- Vendor (vendor_return) -->
          <div v-if="form.type === 'vendor_return'" class="w-52">
            <label class="block text-sm font-medium text-[#374151] mb-1">{{ t('erp.stockReturn.vendor') }}</label>
            <SearchSelect v-model="form.vendorId" :options="vendors" placeholder="— Select vendor —">
              <template #option="{ option }">{{ option.name }}<span v-if="option.code" class="text-[#9BA7B0]"> ({{ option.code }})</span></template>
              <template #singleLabel="{ option }">{{ option.name }}<span v-if="option.code" class="text-[#9BA7B0]"> ({{ option.code }})</span></template>
            </SearchSelect>
          </div>

          <!-- Notes -->
          <div class="flex-1">
            <label class="block text-sm font-medium text-[#374151] mb-1">{{ t('erp.common.notes') }}</label>
            <input v-model="form.notes" type="text" placeholder="Optional notes"
              class="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
          </div>
        </div>

        <!-- Type description -->
        <div class="text-xs pt-1 pb-0" :class="form.type === 'customer_return' ? 'text-blue-600' : 'text-orange-600'">
          <span v-if="form.type === 'customer_return'">
            {{ t('erp.stockReturn.descCustomer') }}
          </span>
          <span v-else>
            {{ t('erp.stockReturn.descVendor') }}
          </span>
        </div>
      </div>

      <!-- Items -->
      <div class="bg-white rounded-2xl border border-[#E2E8F0] overflow-hidden">
        <div class="flex items-center justify-between px-5 py-3 border-b border-[#E2E8F0]">
          <h2 class="text-sm font-semibold text-[#374151]">{{ t('erp.common.items') }}</h2>
          <button @click="addRow" :disabled="products.length > 0 && allUsedIds.length >= products.length"
            class="text-sm px-3 py-1.5 bg-primary-500 text-white rounded-lg hover:bg-primary-700 disabled:opacity-40 disabled:cursor-not-allowed transition">{{ t('erp.common.addItem') }}</button>
        </div>

        <table class="w-full text-sm">
          <thead class="bg-[#F7F9FC] border-b border-[#E2E8F0] text-left">
            <tr>
              <th class="px-3 py-2 font-medium text-[#637381]">{{ t('erp.stockReturn.colProduct') }} <span class="text-red-500">*</span></th>
              <th class="px-3 py-2 font-medium text-[#637381] w-24 text-right">{{ t('erp.stockReturn.colQty') }} <span class="text-red-500">*</span></th>
              <th class="px-3 py-2 font-medium text-[#637381] w-28 text-right">{{ t('erp.stockReturn.costPerUnit') }}</th>
              <th class="px-3 py-2 font-medium text-[#637381] w-28">{{ t('erp.common.batchId') }}</th>
              <th class="px-3 py-2 font-medium text-[#637381] w-36">{{ t('erp.common.expiryDate') }}</th>
              <th class="px-3 py-2 font-medium text-[#637381]">{{ t('erp.common.reason') }}</th>
              <th class="px-3 py-2 w-10"></th>
            </tr>
          </thead>
          <tbody class="divide-y divide-[#E2E8F0]">
            <tr v-if="!items.length">
              <td colspan="7" class="px-3 py-8 text-center text-[#9BA7B0]">{{ t('erp.common.noItems') }}</td>
            </tr>
            <tr v-for="(item, i) in items" :key="i" class="hover:bg-[#F7F9FC]">
              <td class="px-3 py-2">
                <SearchSelect v-model="item.productId" :options="availableProducts(i)" :placeholder="t('erp.common.selectProduct')">
                  <template #option="{ option }">{{ option.name }}<span v-if="option.sku" class="text-[#9BA7B0]"> [{{ option.sku }}]</span> <span class="text-[#9BA7B0]">(stock: {{ option.stock }})</span></template>
                  <template #singleLabel="{ option }">{{ option.name }}<span v-if="option.sku" class="text-[#9BA7B0]"> [{{ option.sku }}]</span></template>
                </SearchSelect>
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
                <input v-model="item.batchId" type="text" :placeholder="t('erp.common.batchPh')"
                  class="w-full px-2 py-1.5 border rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-primary-500" />
              </td>
              <td class="px-3 py-2">
                <input v-model="item.expiryDate" type="date"
                  class="w-full px-2 py-1.5 border rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-primary-500" />
              </td>
              <td class="px-3 py-2">
                <select v-if="returnReasons.length" v-model="item.reason"
                  class="w-full px-2 py-1.5 border rounded-lg text-sm bg-white focus:outline-none focus:ring-1 focus:ring-primary-500">
                  <option value="">—</option>
                  <option v-for="r in returnReasons" :key="r.id" :value="r.name">{{ r.name }}</option>
                </select>
                <input v-else v-model="item.reason" type="text" placeholder="Optional"
                  class="w-full px-2 py-1.5 border rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-primary-500" />
              </td>
              <td class="px-3 py-2 text-center">
                <button @click="removeRow(i)" class="text-[#9BA7B0] hover:text-red-500 transition text-lg leading-none">&times;</button>
              </td>
            </tr>
          </tbody>
          <tfoot v-if="items.length" class="border-t-2 border-[#E2E8F0] bg-[#F7F9FC]">
            <tr>
              <td colspan="6" class="px-3 py-2 text-xs font-medium text-[#637381]">{{ items.length }} item(s)</td>
              <td></td>
            </tr>
          </tfoot>
        </table>
      </div>

      <div v-if="error" class="bg-red-50 text-red-700 text-sm px-4 py-2 rounded-lg">{{ error }}</div>

      <div class="flex justify-end gap-3">
        <RouterLink to="/erp/stock-return" class="px-4 py-2 text-sm border rounded-lg hover:bg-[#F7F9FC] transition">{{ t('common.cancel') }}</RouterLink>
        <button @click="save" :disabled="saving"
          class="px-5 py-2 text-sm bg-primary-500 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 transition">
          {{ saving ? t('erp.common.saving') : t('erp.common.saveDraft') }}
        </button>
      </div>
    </div>
  </AppLayout>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { ArrowLeftIcon } from '@heroicons/vue/24/outline'
import AppLayout from '@/layouts/AppLayout.vue'
import SearchSelect from '@/components/SearchSelect.vue'
import api from '@/api'
import { useMasterDataStore } from '@/stores/masterData'

const { t } = useI18n()
const router          = useRouter()
const masterDataStore = useMasterDataStore()
const products        = ref([])
const stores          = ref([])
const customers       = ref([])
const vendors         = ref([])
const returnReasons   = ref([])
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
  returnReasons.value = await masterDataStore.getValues('return-reasons')
})

const allUsedIds = computed(() => items.value.map(it => it.productId).filter(Boolean))

function availableProducts(rowIndex) {
  const otherIds = items.value
    .filter((_, i) => i !== rowIndex)
    .map(it => it.productId)
    .filter(Boolean)
  return products.value.filter(p => !otherIds.includes(p.id))
}

function addRow() {
  if (items.value.length >= products.value.length && products.value.length > 0) return
  items.value.push({ productId: '', qty: 1, cost: 0, batchId: '', expiryDate: '', reason: '' })
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
