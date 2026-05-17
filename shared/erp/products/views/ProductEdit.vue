<template>
  <AppLayout>
    <div class="space-y-6">

      <div class="flex items-center gap-3">
        <RouterLink to="/erp/item-master" class="text-[#9BA7B0] hover:text-[#637381] transition">
          <ArrowLeftIcon class="w-5 h-5" />
        </RouterLink>
        <h1 class="text-2xl font-bold text-[#1C2434]">{{ t('erp.products.edit') }}</h1>
      </div>

      <div v-if="loading" class="text-[#9BA7B0] py-12 text-center">{{ t('common.loading') }}</div>
      <div v-else-if="notFound" class="bg-red-50 text-red-700 text-sm px-4 py-3 rounded-lg">
        {{ t('erp.products.notFound') }} <RouterLink to="/erp/item-master" class="underline ml-1">{{ t('erp.common.backToList') }}</RouterLink>
      </div>

      <!-- Two-column layout -->
      <div v-else class="flex gap-6 items-start">

        <!-- Left: product fields -->
        <div class="flex-1 bg-white rounded-2xl border border-[#E2E8F0] p-6 space-y-5">
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-[#374151] mb-1">{{ t('erp.products.codeSku') }}</label>
              <input v-model="form.sku" type="text"
                class="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
            </div>
            <div>
              <label class="block text-sm font-medium text-[#374151] mb-1">{{ t('erp.products.name') }} <span class="text-red-500">*</span></label>
              <input v-model="form.name" type="text"
                class="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
            </div>
            <div>
              <label class="block text-sm font-medium text-[#374151] mb-1">{{ t('erp.products.category') }}</label>
              <select v-model="form.category" class="w-full px-3 py-2 border rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary-500">
                <option value="">— None —</option>
                <template v-for="cat in categories" :key="cat.id">
                  <option v-if="!cat.parentId" :value="cat.name" class="font-medium">{{ cat.name }}</option>
                  <option v-else :value="cat.name">&nbsp;&nbsp;↳ {{ cat.name }}</option>
                </template>
              </select>
            </div>
            <div>
              <label class="block text-sm font-medium text-[#374151] mb-1">{{ t('erp.products.costPrice') }}</label>
              <input v-model="form.cost" type="number" min="0" step="0.01"
                class="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
            </div>
            <div>
              <label class="block text-sm font-medium text-[#374151] mb-1">{{ t('erp.products.reorderPoint') }}</label>
              <input v-model.number="form.reorderPoint" type="number" min="0" step="1" :placeholder="t('erp.products.reorderPointPh')"
                class="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
              <p class="text-[11px] text-[#9BA7B0] mt-1">{{ t('erp.products.reorderPointHint') }}</p>
            </div>
            <div>
              <label class="block text-sm font-medium text-[#374151] mb-1">{{ t('erp.products.reorderQty') }}</label>
              <input v-model.number="form.reorderQty" type="number" min="0" step="1" :placeholder="t('erp.products.reorderQtyPh')"
                class="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
              <p class="text-[11px] text-[#9BA7B0] mt-1">{{ t('erp.products.reorderQtyHint') }}</p>
            </div>
            <div class="col-span-2">
              <div class="flex items-center justify-between mb-2">
                <label class="block text-sm font-medium text-[#374151]">
                  {{ t('erp.products.currentStock') }}
                  <span class="ml-2 text-[#9BA7B0] font-normal text-xs">(total: {{ currentStock }})</span>
                </label>
                <RouterLink :to="`/erp/stock-movements?productId=${route.params.id}`"
                  class="text-xs px-3 py-1 border rounded-lg hover:bg-[#F7F9FC] text-primary-500 transition">
                  {{ t('erp.products.viewMovements') }}
                </RouterLink>
              </div>
              <div v-if="storeStocks.length" class="border border-[#E2E8F0] rounded-lg overflow-hidden">
                <table class="w-full text-sm">
                  <thead class="bg-[#F7F9FC] border-b border-[#E2E8F0]">
                    <tr>
                      <th class="px-4 py-2 text-left text-xs font-medium text-[#637381]">{{ t('erp.common.store') }}</th>
                      <th class="px-4 py-2 text-right text-xs font-medium text-[#637381]">{{ t('erp.products.currentStock') }}</th>
                    </tr>
                  </thead>
                  <tbody class="divide-y divide-[#E2E8F0]">
                    <tr v-for="ss in storeStocks" :key="ss.id">
                      <td class="px-4 py-2 text-[#374151]">{{ ss.store?.name }}</td>
                      <td class="px-4 py-2 text-right font-medium" :class="ss.stock <= 0 ? 'text-red-600' : 'text-[#1C2434]'">{{ ss.stock }}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <p v-else class="text-sm text-[#9BA7B0] px-1">{{ t('erp.products.noStoreStock') }}</p>
              <p class="text-xs text-[#9BA7B0] mt-1">{{ t('erp.products.managedVia') }}</p>
            </div>
            <div class="col-span-2">
              <label class="block text-sm font-medium text-[#374151] mb-1">{{ t('erp.products.description') }}</label>
              <textarea v-model="form.description" rows="3"
                class="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none" />
            </div>
            <div>
              <label class="block text-sm font-medium text-[#374151] mb-1">{{ t('erp.products.sellingUom') }}</label>
              <select v-model="form.sellingUomId" class="w-full px-3 py-2 border rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary-500">
                <option value="">— None —</option>
                <option v-for="u in uoms" :key="u.id" :value="u.id">{{ u.name }}{{ u.abbreviation ? ` (${u.abbreviation})` : '' }}</option>
              </select>
            </div>
            <div>
              <label class="block text-sm font-medium text-[#374151] mb-1">{{ t('erp.products.purchasingUom') }}</label>
              <select v-model="form.purchasingUomId" class="w-full px-3 py-2 border rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary-500">
                <option value="">— None —</option>
                <option v-for="u in uoms" :key="u.id" :value="u.id">{{ u.name }}{{ u.abbreviation ? ` (${u.abbreviation})` : '' }}</option>
              </select>
            </div>
            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium text-[#374151] mb-1">{{ t('erp.common.activeFrom') }}</label>
                <DateInput v-model="form.activeFrom" class="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
              </div>
              <div>
                <label class="block text-sm font-medium text-[#374151] mb-1">{{ t('erp.common.activeTo') }}</label>
                <DateInput v-model="form.activeTo" class="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
              </div>
            </div>
            <div>
              <label class="block text-sm font-medium text-[#374151] mb-1">{{ t('erp.products.status') }}</label>
              <select v-model="form.status" class="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500">
                <option value="active">{{ t('common.active') }}</option>
                <option value="inactive">{{ t('common.inactive') }}</option>
              </select>
            </div>
          </div>

          <div v-if="error" class="bg-red-50 text-red-700 text-sm px-4 py-2 rounded-lg">{{ error }}</div>

          <div class="flex justify-between items-center pt-2">
            <button v-can="'erp.products.delete'" @click="confirmDelete"
              class="px-4 py-2 text-sm text-red-500 border border-red-200 rounded-lg hover:bg-red-50 transition">
              {{ t('erp.products.deleteProduct') }}
            </button>
            <div class="flex gap-3">
              <RouterLink to="/erp/item-master" class="px-4 py-2 text-sm border rounded-lg hover:bg-[#F7F9FC] transition">{{ t('common.cancel') }}</RouterLink>
              <button @click="save" :disabled="saving"
                class="px-5 py-2 text-sm bg-primary-500 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 transition">
                {{ saving ? t('erp.common.saving') : t('common.saveChanges') }}
              </button>
            </div>
          </div>
        </div>

        <!-- Right panels -->
        <div class="w-72 space-y-4 flex-shrink-0">

          <!-- Stores panel -->
          <div class="bg-white rounded-2xl border border-[#E2E8F0] p-5 space-y-4">
            <h2 class="text-sm font-semibold text-[#374151]">{{ t('erp.products.linkedStores') }}</h2>
            <div class="flex gap-2">
              <select v-model="selectedStoreId"
                class="flex-1 px-3 py-2 border rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary-500">
                <option value="">{{ t('erp.common.selectStore') }}</option>
                <option v-for="s in availableStores" :key="s.id" :value="s.id">{{ s.name }}{{ s.code ? ` (${s.code})` : '' }}</option>
              </select>
              <button @click="addStore" :disabled="!selectedStoreId"
                class="px-3 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-700 disabled:opacity-40 transition text-lg leading-none">
                +
              </button>
            </div>
            <div class="space-y-2 min-h-[40px]">
              <div v-if="!linkedStores.length" class="text-sm text-[#9BA7B0] text-center py-3">No stores linked.</div>
              <div v-for="s in linkedStores" :key="s.id"
                class="flex items-center justify-between gap-2 px-3 py-2 bg-[#F7F9FC] rounded-lg border border-[#E2E8F0]">
                <div class="min-w-0">
                  <p class="text-sm font-medium text-[#1C2434] truncate">{{ s.name }}</p>
                  <p v-if="s.code" class="text-xs text-[#9BA7B0] font-mono">{{ s.code }}</p>
                </div>
                <button @click="removeStore(s.id)" class="text-[#9BA7B0] hover:text-red-500 transition flex-shrink-0 text-lg leading-none">&times;</button>
              </div>
            </div>
          </div>

          <!-- Vendors panel -->
          <div class="bg-white rounded-2xl border border-[#E2E8F0] p-5 space-y-4">
            <h2 class="text-sm font-semibold text-[#374151]">{{ t('erp.products.linkedVendors') }}</h2>
            <div class="flex gap-2">
              <select v-model="selectedVendorId"
                class="flex-1 px-3 py-2 border rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary-500">
                <option value="">— Select vendor —</option>
                <option v-for="v in availableVendors" :key="v.id" :value="v.id">{{ v.name }}{{ v.code ? ` (${v.code})` : '' }}</option>
              </select>
              <button @click="addVendor" :disabled="!selectedVendorId"
                class="px-3 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-700 disabled:opacity-40 transition text-lg leading-none">
                +
              </button>
            </div>
            <div class="space-y-2 min-h-[40px]">
              <div v-if="!linkedVendors.length" class="text-sm text-[#9BA7B0] text-center py-3">No vendors linked.</div>
              <div v-for="v in linkedVendors" :key="v.id"
                class="flex items-center justify-between gap-2 px-3 py-2 bg-[#F7F9FC] rounded-lg border border-[#E2E8F0]">
                <div class="min-w-0">
                  <p class="text-sm font-medium text-[#1C2434] truncate">{{ v.name }}</p>
                  <p v-if="v.code" class="text-xs text-[#9BA7B0] font-mono">{{ v.code }}</p>
                </div>
                <button @click="removeVendor(v.id)" class="text-[#9BA7B0] hover:text-red-500 transition flex-shrink-0 text-lg leading-none">&times;</button>
              </div>
            </div>
          </div>

        </div>

      </div>
    </div>
  </AppLayout>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { ArrowLeftIcon } from '@heroicons/vue/24/outline'
import AppLayout from '@/layouts/AppLayout.vue'
import api from '@/api'
import { parseApiError } from '@/utils/apiError'

const { t } = useI18n()
const route    = useRoute()
const router   = useRouter()
const form         = ref({ name: '', sku: '', category: '', cost: '', description: '', status: 'active', activeFrom: '', activeTo: '', sellingUomId: '', purchasingUomId: '', reorderPoint: '', reorderQty: '' })
const currentStock = ref(0)
const storeStocks  = ref([])
const stores     = ref([])
const uoms       = ref([])
const categories = ref([])
const vendors    = ref([])
const linkedStores   = ref([])
const linkedVendors  = ref([])
const selectedStoreId  = ref('')
const selectedVendorId = ref('')
const loading  = ref(true)
const notFound = ref(false)
const error    = ref('')
const saving   = ref(false)

const availableStores   = computed(() => stores.value.filter(s => !linkedStores.value.some(l => l.id === s.id)))
const availableVendors  = computed(() => vendors.value.filter(v => !linkedVendors.value.some(l => l.id === v.id)))

onMounted(async () => {
  try {
    const [productRes, storesRes, uomRes, catRes, stockRes, vendorRes] = await Promise.all([
      api.get(`/erp/item-master/${route.params.id}`),
      api.get('/erp/item-master/stores-lookup'),
      api.get('/erp/uom', { params: { limit: 200 } }),
      api.get('/erp/product-categories/all'),
      api.get(`/erp/item-master/${route.params.id}/store-stocks`),
      api.get('/erp/vendors/all'),
    ])
    const p = productRes.data.data.product
    form.value = {
      name: p.name, sku: p.sku || '', category: p.category || '',
      cost: p.cost || '', description: p.description || '',
      status: p.status,
      activeFrom:   p.activeFrom   || '',
      activeTo:     p.activeTo     || '',
      sellingUomId:    p.sellingUomId    || '',
      purchasingUomId: p.purchasingUomId || '',
      reorderPoint:    p.reorderPoint != null ? p.reorderPoint : '',
      reorderQty:      p.reorderQty   != null ? p.reorderQty   : '',
    }
    currentStock.value = p.stock
    storeStocks.value  = stockRes.data.data.storeStocks
    stores.value     = storesRes.data.data.stores
    uoms.value       = uomRes.data.data.uoms.filter(u => u.status === 'active')
    categories.value = catRes.data.data.categories
    vendors.value    = vendorRes.data.data.vendors
    linkedStores.value  = p.stores  || []
    linkedVendors.value = p.vendors || []
  } catch {
    notFound.value = true
  } finally {
    loading.value = false
  }
})

function addStore() {
  if (!selectedStoreId.value) return
  const store = stores.value.find(s => s.id === selectedStoreId.value)
  if (store) linkedStores.value.push(store)
  selectedStoreId.value = ''
}

function removeStore(id) {
  linkedStores.value = linkedStores.value.filter(s => s.id !== id)
}

function addVendor() {
  if (!selectedVendorId.value) return
  const vendor = vendors.value.find(v => v.id === selectedVendorId.value)
  if (vendor) linkedVendors.value.push(vendor)
  selectedVendorId.value = ''
}

function removeVendor(id) {
  linkedVendors.value = linkedVendors.value.filter(v => v.id !== id)
}

async function save() {
  error.value = ''
  if (!form.value.name.trim()) { error.value = 'Name is required'; return }
  saving.value = true
  try {
    await api.put(`/erp/item-master/${route.params.id}`, {
      ...form.value,
      sellingUomId:    form.value.sellingUomId    || null,
      purchasingUomId: form.value.purchasingUomId || null,
      storeIds:  linkedStores.value.map(s => s.id),
      vendorIds: linkedVendors.value.map(v => v.id),
    })
    router.push('/erp/item-master')
  } catch (err) {
    error.value = parseApiError(err, 'Failed to save')
  } finally {
    saving.value = false
  }
}

async function confirmDelete() {
  if (!confirm(`Delete "${form.value.name}"? This cannot be undone.`)) return
  try {
    await api.delete(`/erp/item-master/${route.params.id}`)
    router.push('/erp/item-master')
  } catch (err) {
    error.value = err.response?.data?.message || 'Delete failed'
  }
}
</script>
