<template>
  <AppLayout>
    <div class="space-y-6">

      <!-- Header -->
      <div class="flex items-center gap-3">
        <RouterLink to="/erp/item-master" class="text-[#9BA7B0] hover:text-[#637381] transition">
          <ArrowLeftIcon class="w-5 h-5" />
        </RouterLink>
        <div>
          <h1 class="text-xl font-semibold text-[#1C2434]">{{ t('erp.products.new') }}</h1>
          <p class="text-sm text-[#637381] mt-0.5">{{ t('erp.products.newDesc') }}</p>
        </div>
      </div>

      <!-- Basic Information -->
      <div class="bg-white rounded-2xl border border-[#E2E8F0] shadow-sm overflow-hidden">
        <div class="px-6 py-4 border-b border-[#E2E8F0]">
          <h2 class="text-sm font-semibold text-[#374151]">{{ t('erp.products.basicInfo') }}</h2>
        </div>
        <div class="px-6 py-5">
          <div class="grid grid-cols-2 gap-5">

            <!-- SKU / Auto-code -->
            <div>
              <label class="block text-xs font-semibold text-[#637381] uppercase tracking-wide mb-1.5">{{ t('erp.products.codeSku') }}</label>
              <input v-if="!autoCode.enabled.value" v-model="form.sku" type="text" placeholder="SKU-001"
                class="w-full px-3 py-2 border border-[#E2E8F0] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent" />
              <input v-else :value="autoCode.preview.value" type="text" readonly
                class="w-full px-3 py-2 border border-[#E2E8F0] rounded-lg text-sm bg-[#F7F9FC] text-[#637381] font-mono cursor-not-allowed" />
              <label class="mt-1.5 flex items-center gap-2 text-xs text-[#637381] cursor-pointer select-none">
                <input type="checkbox" :checked="autoCode.enabled.value" @change="autoCode.toggle" class="rounded" />
                {{ t('erp.common.autoGenerate') }}
              </label>
            </div>

            <!-- Name -->
            <div>
              <label class="block text-xs font-semibold text-[#637381] uppercase tracking-wide mb-1.5">
                {{ t('erp.products.name') }} <span class="text-red-500">*</span>
              </label>
              <input v-model="form.name" type="text" placeholder="Product name"
                :class="['w-full px-3 py-2 border border-[#E2E8F0] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent', errorOf('name') && 'input-error']" />
              <FieldError name="name" :errors="fieldErrors" />
            </div>

            <!-- Category -->
            <div>
              <label class="block text-xs font-semibold text-[#637381] uppercase tracking-wide mb-1.5">{{ t('erp.products.category') }}</label>
              <SearchSelect v-model="form.category" :options="categoryOptions" track-by="name" label-key="name" placeholder="— None —" />
            </div>

            <!-- Cost -->
            <div>
              <label class="block text-xs font-semibold text-[#637381] uppercase tracking-wide mb-1.5">{{ t('erp.products.costPrice') }}</label>
              <input v-model="form.cost" type="number" min="0" step="0.01" placeholder="0.00"
                class="w-full px-3 py-2 border border-[#E2E8F0] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent" />
            </div>

            <!-- Reorder point + qty -->
            <div>
              <label class="block text-xs font-semibold text-[#637381] uppercase tracking-wide mb-1.5">{{ t('erp.products.reorderPoint') }}</label>
              <input v-model.number="form.reorderPoint" type="number" min="0" step="1" :placeholder="t('erp.products.reorderPointPh')"
                class="w-full px-3 py-2 border border-[#E2E8F0] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent" />
              <p class="text-[11px] text-[#9BA7B0] mt-1">{{ t('erp.products.reorderPointHint') }}</p>
            </div>
            <div>
              <label class="block text-xs font-semibold text-[#637381] uppercase tracking-wide mb-1.5">{{ t('erp.products.reorderQty') }}</label>
              <input v-model.number="form.reorderQty" type="number" min="0" step="1" :placeholder="t('erp.products.reorderQtyPh')"
                class="w-full px-3 py-2 border border-[#E2E8F0] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent" />
              <p class="text-[11px] text-[#9BA7B0] mt-1">{{ t('erp.products.reorderQtyHint') }}</p>
            </div>

            <!-- Description -->
            <div class="col-span-2">
              <label class="block text-xs font-semibold text-[#637381] uppercase tracking-wide mb-1.5">{{ t('erp.products.description') }}</label>
              <textarea v-model="form.description" rows="3" placeholder="Optional description…"
                class="w-full px-3 py-2 border border-[#E2E8F0] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none" />
            </div>

            <!-- Selling UOM -->
            <div>
              <label class="block text-xs font-semibold text-[#637381] uppercase tracking-wide mb-1.5">{{ t('erp.products.sellingUom') }}</label>
              <SearchSelect v-model="form.sellingUomId" :options="uomOptions" placeholder="— None —" />
            </div>

            <!-- Purchasing UOM -->
            <div>
              <label class="block text-xs font-semibold text-[#637381] uppercase tracking-wide mb-1.5">{{ t('erp.products.purchasingUom') }}</label>
              <SearchSelect v-model="form.purchasingUomId" :options="uomOptions" placeholder="— None —" />
            </div>

            <!-- Active Period -->
            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="block text-xs font-semibold text-[#637381] uppercase tracking-wide mb-1.5">{{ t('erp.common.activeFrom') }}</label>
                <DateInput v-model="form.activeFrom" class="w-full px-3 py-2 border border-[#E2E8F0] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent" />
              </div>
              <div>
                <label class="block text-xs font-semibold text-[#637381] uppercase tracking-wide mb-1.5">{{ t('erp.common.activeTo') }}</label>
                <DateInput v-model="form.activeTo" class="w-full px-3 py-2 border border-[#E2E8F0] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent" />
              </div>
            </div>
            <!-- Status -->
            <div>
              <label class="block text-xs font-semibold text-[#637381] uppercase tracking-wide mb-1.5">{{ t('erp.products.status') }}</label>
              <SearchSelect v-model="form.status" :options="statusOptions" :allow-empty="false" />
            </div>

          </div>
        </div>
      </div>

      <!-- Linked Stores & Vendors -->
      <div class="grid grid-cols-2 gap-6">

        <!-- Linked Stores -->
        <div class="bg-white rounded-2xl border border-[#E2E8F0] shadow-sm overflow-hidden">
          <div class="px-6 py-4 border-b border-[#E2E8F0]">
            <h2 class="text-sm font-semibold text-[#374151]">{{ t('erp.products.linkedStores') }}</h2>
            <p class="text-xs text-[#9BA7B0] mt-0.5">{{ t('erp.products.linkedStoresDesc') }}</p>
          </div>
          <div class="px-6 py-5 space-y-4">
            <div class="flex gap-2">
              <div class="flex-1"><SearchSelect v-model="selectedStoreId" :options="availableStoreOptions" :placeholder="t('erp.common.selectStore')" /></div>
              <button @click="addStore" :disabled="!selectedStoreId"
                class="px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-700 disabled:opacity-40 transition text-sm font-medium">
                {{ t('erp.common.add') }}
              </button>
            </div>
            <div class="space-y-2 min-h-[40px]">
              <div v-if="!linkedStores.length" class="text-sm text-[#9BA7B0] text-center py-4">{{ t('erp.products.noLinkedStores') }}</div>
              <div v-for="s in linkedStores" :key="s.id"
                class="flex items-center justify-between gap-2 px-3 py-2.5 bg-[#F7F9FC] rounded-lg border border-[#E2E8F0]">
                <div class="min-w-0">
                  <p class="text-sm font-medium text-[#1C2434] truncate">{{ s.name }}</p>
                  <p v-if="s.code" class="text-xs text-[#9BA7B0] font-mono">{{ s.code }}</p>
                </div>
                <button @click="removeStore(s.id)" class="text-[#9BA7B0] hover:text-red-500 transition flex-shrink-0 p-1 rounded">
                  <XMarkIcon class="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- Linked Vendors -->
        <div class="bg-white rounded-2xl border border-[#E2E8F0] shadow-sm overflow-hidden">
          <div class="px-6 py-4 border-b border-[#E2E8F0]">
            <h2 class="text-sm font-semibold text-[#374151]">{{ t('erp.products.linkedVendors') }}</h2>
            <p class="text-xs text-[#9BA7B0] mt-0.5">{{ t('erp.products.linkedVendorsDesc') }}</p>
          </div>
          <div class="px-6 py-5 space-y-4">
            <div class="flex gap-2">
              <div class="flex-1"><SearchSelect v-model="selectedVendorId" :options="availableVendorOptions" :placeholder="`— ${t('erp.common.selectVendor')} —`" /></div>
              <button @click="addVendor" :disabled="!selectedVendorId"
                class="px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-700 disabled:opacity-40 transition text-sm font-medium">
                {{ t('erp.common.add') }}
              </button>
            </div>
            <div class="space-y-2 min-h-[40px]">
              <div v-if="!linkedVendors.length" class="text-sm text-[#9BA7B0] text-center py-4">{{ t('erp.products.noLinkedVendors') }}</div>
              <div v-for="v in linkedVendors" :key="v.id"
                class="flex items-center justify-between gap-2 px-3 py-2.5 bg-[#F7F9FC] rounded-lg border border-[#E2E8F0]">
                <div class="min-w-0">
                  <p class="text-sm font-medium text-[#1C2434] truncate">{{ v.name }}</p>
                  <p v-if="v.code" class="text-xs text-[#9BA7B0] font-mono">{{ v.code }}</p>
                </div>
                <button @click="removeVendor(v.id)" class="text-[#9BA7B0] hover:text-red-500 transition flex-shrink-0 p-1 rounded">
                  <XMarkIcon class="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>

      </div>

      <!-- Error -->
      <div v-if="error" class="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg">
        <ExclamationCircleIcon class="w-4 h-4 flex-shrink-0" />
        {{ error }}
      </div>

      <!-- Actions -->
      <div class="flex justify-end gap-3">
        <RouterLink to="/erp/item-master"
          class="px-4 py-2.5 text-sm border border-[#E2E8F0] rounded-xl hover:bg-[#F7F9FC] transition text-[#637381]">
          {{ t('common.cancel') }}
        </RouterLink>
        <button @click="save" :disabled="saving"
          class="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold
                 bg-primary-500 text-white rounded-xl hover:bg-primary-700
                 disabled:opacity-50 transition shadow-sm">
          {{ saving ? t('erp.common.creating') : t('erp.products.create') }}
        </button>
      </div>

    </div>
  </AppLayout>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { ArrowLeftIcon, XMarkIcon, ExclamationCircleIcon } from '@heroicons/vue/24/outline'
import AppLayout from '@/layouts/AppLayout.vue'
import SearchSelect from '@/components/SearchSelect.vue'
import FieldError from '@/components/form/FieldError.vue'
import { useFieldErrors } from '@/composables/useFieldErrors'
import api from '@/api'
import { useAutoCode } from '@/composables/useAutoCode'
import { parseApiError } from '@/utils/apiError'

const { t } = useI18n()

const statusOptions = computed(() => [
  { id: 'active',   name: t('common.active')   },
  { id: 'inactive', name: t('common.inactive') },
])
const router   = useRouter()
const form     = ref({ name: '', sku: '', category: '', cost: '', description: '', status: 'active', activeFrom: '', activeTo: '', sellingUomId: '', purchasingUomId: '', reorderPoint: '', reorderQty: '' })
const autoCode = useAutoCode('PRD')
const stores     = ref([])
const vendors    = ref([])
const uoms       = ref([])
const categories = ref([])
const linkedStores  = ref([])
const linkedVendors = ref([])
const selectedStoreId  = ref('')
const selectedVendorId = ref('')
const error  = ref('')
const saving = ref(false)
const { fieldErrors, setFromError, setField, reset: resetErrors, errorOf } = useFieldErrors()

const availableStores  = computed(() => stores.value.filter(s => !linkedStores.value.some(l => l.id === s.id)))
const availableVendors = computed(() => vendors.value.filter(v => !linkedVendors.value.some(l => l.id === v.id)))
const categoryOptions  = computed(() => categories.value.map(cat => ({
  id: cat.name,
  name: cat.parentId ? `  ↳ ${cat.name}` : cat.name,
})))
const uomOptions             = computed(() => uoms.value.map(u => ({ id: u.id, name: `${u.name}${u.abbreviation ? ` (${u.abbreviation})` : ''}` })))
const availableStoreOptions  = computed(() => availableStores.value.map(s => ({ id: s.id, name: `${s.name}${s.code ? ` (${s.code})` : ''}` })))
const availableVendorOptions = computed(() => availableVendors.value.map(v => ({ id: v.id, name: `${v.name}${v.code ? ` (${v.code})` : ''}` })))

onMounted(async () => {
  try {
    const [storesRes, uomRes, catRes, vendorRes] = await Promise.all([
      api.get('/erp/item-master/stores-lookup'),
      api.get('/erp/uom', { params: { limit: 200 } }),
      api.get('/erp/product-categories/all'),
      api.get('/erp/vendors/all'),
    ])
    stores.value     = storesRes.data.data.stores
    uoms.value       = uomRes.data.data.uoms.filter(u => u.status === 'active')
    categories.value = catRes.data.data.categories
    vendors.value    = vendorRes.data.data.vendors
  } catch (err) {
    console.error('Failed to load lookups:', err.response?.data || err.message)
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
    const payload = {
      ...form.value,
      sellingUomId:    form.value.sellingUomId    || null,
      purchasingUomId: form.value.purchasingUomId || null,
      storeIds:  linkedStores.value.map(s => s.id),
      vendorIds: linkedVendors.value.map(v => v.id),
    }
    if (autoCode.enabled.value) { payload.autoCode = true; payload.sku = null }
    await api.post('/erp/item-master', payload)
    router.push('/erp/item-master')
  } catch (err) {
    const had = setFromError(err)
    if (!had) error.value = parseApiError(err, 'Failed to create Product Master')
  } finally {
    saving.value = false
  }
}
</script>
