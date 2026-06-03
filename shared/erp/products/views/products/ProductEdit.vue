<template>
  <AppLayout>
    <div class="space-y-6">

      <div class="flex items-center justify-between gap-3">
        <div class="flex items-center gap-3">
          <RouterLink to="/erp/item-master" class="text-[#9BA7B0] hover:text-[#637381] transition">
            <ArrowLeftIcon class="w-5 h-5" />
          </RouterLink>
          <h1 class="text-2xl font-bold text-[#1C2434]">{{ t('erp.products.edit') }}</h1>
        </div>

        <KeyboardShortcuts :shortcuts="shortcuts" width="w-56" />
      </div>

      <div v-if="loading" class="text-[#9BA7B0] py-12 text-center">{{ t('common.loading') }}</div>
      <div v-else-if="notFound" class="bg-red-50 text-red-700 text-sm px-4 py-3">
        {{ t('erp.products.notFound') }} <RouterLink to="/erp/item-master" class="underline ml-1">{{ t('erp.common.backToList') }}</RouterLink>
      </div>

      <!-- Two-column layout -->
      <div v-else class="flex gap-6 items-start">

        <!-- Left: product fields -->
        <div class="flex-1 bg-white border border-[#E2E8F0] p-6 space-y-5">
          <div class="grid grid-cols-2 gap-4">
            <FormField name="sku" :label="t('erp.products.codeSku')" :errors="fieldErrors">
              <template #default="{ id, errorClass }">
                <input :id="id" ref="skuInputRef" v-model="form.sku" type="text" :class="['input', errorClass]" />
              </template>
            </FormField>
            <FormField v-model="form.name" name="name" :label="t('erp.products.name')" required :errors="fieldErrors" />
            <SearchSelectWithLabel v-model="form.category" :label="t('erp.products.category')" :options="categoryOptions" track-by="name" label-key="name" placeholder="— None —" />
            <FormField v-model="form.cost" name="cost" type="number" :label="t('erp.products.costPrice')" :errors="fieldErrors" min="0" step="0.01" />
            <FormField v-model="form.reorderPoint" name="reorderPoint" type="number" :label="t('erp.products.reorderPoint')" :placeholder="t('erp.products.reorderPointPh')" :hint="t('erp.products.reorderPointHint')" :errors="fieldErrors" min="0" step="1" />
            <FormField v-model="form.reorderQty" name="reorderQty" type="number" :label="t('erp.products.reorderQty')" :placeholder="t('erp.products.reorderQtyPh')" :hint="t('erp.products.reorderQtyHint')" :errors="fieldErrors" min="0" step="1" />
            <div class="col-span-2">
              <div class="flex items-center justify-between mb-2">
                <label class="label">
                  {{ t('erp.products.currentStock') }}
                  <span class="ml-2 text-[#9BA7B0] font-normal text-xs">(total: {{ currentStock }})</span>
                </label>
                <RouterLink :to="`/erp/stock-movements?productId=${route.params.id}`"
                  class="text-xs px-3 py-1 border hover:bg-[#F7F9FC] text-primary-500 transition">
                  {{ t('erp.products.viewMovements') }}
                </RouterLink>
              </div>
              <div v-if="storeStocks.length" class="border border-[#E2E8F0] overflow-hidden">
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
            <FormField v-model="form.description" name="description" textarea :rows="3" :label="t('erp.products.description')" :errors="fieldErrors" wrapper-class="col-span-2" />
            <SearchSelectWithLabel v-model="form.sellingUomId" :label="t('erp.products.sellingUom')" :options="uomOptions" placeholder="— None —" />
            <SearchSelectWithLabel v-model="form.purchasingUomId" :label="t('erp.products.purchasingUom')" :options="uomOptions" placeholder="— None —" />
            <div class="grid grid-cols-2 gap-4">
              <DateInputWithLabel v-model="form.activeFrom" :label="t('erp.common.activeFrom')" />
              <DateInputWithLabel v-model="form.activeTo" :label="t('erp.common.activeTo')" />
            </div>
            <SearchSelectWithLabel v-model="form.status" :label="t('erp.products.status')" :options="statusOptions" :allow-empty="false" />
          </div>

          <div v-if="error" class="bg-red-50 text-red-700 text-sm px-4 py-2">{{ error }}</div>

          <div class="flex justify-between items-center pt-2">
            <AppButton v-can="'erp.products.delete'" variant="danger" @click="confirmDelete">{{ t('erp.products.deleteProduct') }}</AppButton>
            <div class="flex gap-3">
              <AppButton to="/erp/item-master" variant="secondary">{{ t('common.cancel') }}</AppButton>
              <AppButton @click="save" :loading="saving">
                {{ saving ? t('erp.common.saving') : t('common.saveChanges') }}
              </AppButton>
            </div>
          </div>
        </div>

        <!-- Right panels -->
        <div class="w-72 space-y-4 flex-shrink-0">

          <!-- Stores panel -->
          <div class="bg-white border border-[#E2E8F0] p-5 space-y-4">
            <h2 class="text-sm font-semibold text-[#374151]">{{ t('erp.products.linkedStores') }}</h2>
            <div class="flex gap-2">
              <div class="flex-1"><SearchSelect v-model="selectedStoreId" :options="availableStoreOptions" :placeholder="t('erp.common.selectStore')" /></div>
              <AppButton @click="addStore" :disabled="!selectedStoreId" variant="primary">+</AppButton>
            </div>
            <div class="space-y-2 min-h-[40px]">
              <div v-if="!linkedStores.length" class="text-sm text-[#9BA7B0] text-center py-3">No stores linked.</div>
              <div v-for="s in linkedStores" :key="s.id"
                class="flex items-center justify-between gap-2 px-3 py-2 bg-[#F7F9FC] border border-[#E2E8F0]">
                <div class="min-w-0">
                  <p class="text-sm font-medium text-[#1C2434] truncate">{{ s.name }}</p>
                  <p v-if="s.code" class="text-xs text-[#9BA7B0] font-mono">{{ s.code }}</p>
                </div>
                <button @click="removeStore(s.id)" class="text-[#9BA7B0] hover:text-red-500 transition flex-shrink-0 text-lg leading-none">&times;</button>
              </div>
            </div>
          </div>

          <!-- Vendors panel -->
          <div class="bg-white border border-[#E2E8F0] p-5 space-y-4">
            <h2 class="text-sm font-semibold text-[#374151]">{{ t('erp.products.linkedVendors') }}</h2>
            <div class="flex gap-2">
              <div class="flex-1"><SearchSelect v-model="selectedVendorId" :options="availableVendorOptions" placeholder="— Select vendor —" /></div>
              <AppButton @click="addVendor" :disabled="!selectedVendorId" variant="primary">+</AppButton>
            </div>
            <div class="space-y-2 min-h-[40px]">
              <div v-if="!linkedVendors.length" class="text-sm text-[#9BA7B0] text-center py-3">No vendors linked.</div>
              <div v-for="v in linkedVendors" :key="v.id"
                class="flex items-center justify-between gap-2 px-3 py-2 bg-[#F7F9FC] border border-[#E2E8F0]">
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
import { ref, computed, nextTick, onMounted } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { ArrowLeftIcon } from '@heroicons/vue/24/outline'
import AppLayout from '@/layouts/AppLayout.vue'
import AppButton from '@/components/AppButton.vue'
import KeyboardShortcuts from '@/components/KeyboardShortcuts.vue'
import FormField from '@/components/form/FormField.vue'
import SearchSelect from '@/components/SearchSelect.vue'
import SearchSelectWithLabel from '@/components/SearchSelectWithLabel.vue'
import DateInputWithLabel from '@/components/DateInputWithLabel.vue'
import { useFieldErrors } from '@/composables/useFieldErrors'
import api from '@/api'
import { useFormShortcuts } from '@/composables/useShortcuts'
import { parseApiError } from '@/utils/apiError'

const { t } = useI18n()

const statusOptions = computed(() => [
  { id: 'active',   name: t('common.active')   },
  { id: 'inactive', name: t('common.inactive') },
])
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
const { fieldErrors, setFromError, setField, reset: resetErrors } = useFieldErrors()

const skuInputRef = ref(null)

const { shortcuts } = useFormShortcuts({
  save: () => save(),
  cancel: () => router.push('/erp/item-master'),
})

const availableStores   = computed(() => stores.value.filter(s => !linkedStores.value.some(l => l.id === s.id)))
const availableVendors  = computed(() => vendors.value.filter(v => !linkedVendors.value.some(l => l.id === v.id)))
const categoryOptions   = computed(() => categories.value.map(cat => ({
  id: cat.name,
  name: cat.parentId ? `  ↳ ${cat.name}` : cat.name,
})))
const uomOptions             = computed(() => uoms.value.map(u => ({ id: u.id, name: `${u.name}${u.abbreviation ? ` (${u.abbreviation})` : ''}` })))
const availableStoreOptions  = computed(() => availableStores.value.map(s => ({ id: s.id, name: `${s.name}${s.code ? ` (${s.code})` : ''}` })))
const availableVendorOptions = computed(() => availableVendors.value.map(v => ({ id: v.id, name: `${v.name}${v.code ? ` (${v.code})` : ''}` })))

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
    await nextTick()
    skuInputRef.value?.focus()
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
  resetErrors()
  if (!form.value.name.trim()) { setField('name', t('common.errors.required', { field: t('erp.products.name') })); return }
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
    const had = setFromError(err)
    if (!had) error.value = parseApiError(err, 'Failed to save')
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
