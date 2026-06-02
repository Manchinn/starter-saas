<template>
  <AppLayout>
    <div class="space-y-6">

      <!-- Header -->
      <div class="flex items-center justify-between gap-3">
        <div class="flex items-center gap-3">
          <RouterLink to="/erp/item-master" class="text-[#9BA7B0] hover:text-[#637381] transition">
            <ArrowLeftIcon class="w-5 h-5" />
          </RouterLink>
          <div>
            <h1 class="text-xl font-semibold text-[#1C2434]">{{ t('erp.products.new') }}</h1>
            <p class="text-sm text-[#637381] mt-0.5">{{ t('erp.products.newDesc') }}</p>
          </div>
        </div>

        <!-- Keyboard shortcuts popover -->
        <div class="relative" ref="shortcutsRef">
          <button @click="showShortcuts = !showShortcuts"
            class="h-8 px-2 flex items-center gap-1 border border-[#E2E8F0] text-[#9BA7B0] hover:text-[#374151] hover:bg-[#F7F9FC] transition-colors text-sm font-semibold"
            title="Keyboard shortcuts">
            <span>?</span>
            <span class="text-xs font-medium">Shortcuts</span>
          </button>
          <Transition
            enter-active-class="transition-all duration-150 ease-out"
            enter-from-class="opacity-0 translate-y-1"
            enter-to-class="opacity-100 translate-y-0"
            leave-active-class="transition-all duration-100 ease-in"
            leave-from-class="opacity-100 translate-y-0"
            leave-to-class="opacity-0 translate-y-1">
            <div v-if="showShortcuts"
              class="absolute right-0 top-10 z-50 w-56 bg-white border border-[#E2E8F0] shadow-lg p-4 space-y-2">
              <p class="text-xs font-semibold text-[#374151] uppercase tracking-wide mb-3">Keyboard Shortcuts</p>
              <div v-for="s in SHORTCUTS" :key="s.key" class="flex items-center justify-between gap-3">
                <span class="text-xs text-[#637381]">{{ s.label }}</span>
                <kbd class="inline-flex items-center px-1.5 py-0.5 border border-[#E2E8F0] bg-[#F7F9FC] text-[10px] font-mono text-[#374151] whitespace-nowrap">{{ s.key }}</kbd>
              </div>
            </div>
          </Transition>
        </div>
      </div>

      <!-- Basic Information -->
      <div class="bg-white border border-[#E2E8F0] shadow-sm overflow-hidden">
        <div class="px-6 py-4 border-b border-[#E2E8F0]">
          <h2 class="text-sm font-semibold text-[#374151]">{{ t('erp.products.basicInfo') }}</h2>
        </div>
        <div class="px-6 py-5">
          <div class="grid grid-cols-2 gap-5">

            <!-- SKU / Auto-code -->
            <div>
              <FormField name="sku" :label="t('erp.products.codeSku')" :errors="fieldErrors">
                <template #default="{ id }">
                  <input v-if="!autoCode.enabled.value" :id="id" ref="skuInputRef" v-model="form.sku" type="text" placeholder="SKU-001" class="input" />
                  <input v-else :id="id" :value="autoCode.preview.value" type="text" readonly class="input bg-[#F7F9FC] text-[#637381] font-mono cursor-not-allowed" />
                </template>
              </FormField>
              <label class="mt-1.5 flex items-center gap-2 text-xs text-[#637381] cursor-pointer select-none">
                <input type="checkbox" :checked="autoCode.enabled.value" @change="autoCode.toggle" />
                {{ t('erp.common.autoGenerate') }}
              </label>
            </div>

            <FormField v-model="form.name" name="name" :label="t('erp.products.name')" placeholder="Product name" required :errors="fieldErrors" />

            <SearchSelectWithLabel v-model="form.category" :label="t('erp.products.category')" :options="categoryOptions" track-by="name" label-key="name" placeholder="— None —" />

            <FormField v-model="form.cost" name="cost" type="number" :label="t('erp.products.costPrice')" placeholder="0.00" :errors="fieldErrors" min="0" step="0.01" />

            <FormField v-model="form.reorderPoint" name="reorderPoint" type="number" :label="t('erp.products.reorderPoint')" :placeholder="t('erp.products.reorderPointPh')" :hint="t('erp.products.reorderPointHint')" :errors="fieldErrors" min="0" step="1" />

            <FormField v-model="form.reorderQty" name="reorderQty" type="number" :label="t('erp.products.reorderQty')" :placeholder="t('erp.products.reorderQtyPh')" :hint="t('erp.products.reorderQtyHint')" :errors="fieldErrors" min="0" step="1" />

            <FormField v-model="form.description" name="description" textarea :rows="3" :label="t('erp.products.description')" placeholder="Optional description…" :errors="fieldErrors" wrapper-class="col-span-2" />

            <SearchSelectWithLabel v-model="form.sellingUomId" :label="t('erp.products.sellingUom')" :options="uomOptions" placeholder="— None —" />

            <SearchSelectWithLabel v-model="form.purchasingUomId" :label="t('erp.products.purchasingUom')" :options="uomOptions" placeholder="— None —" />

            <div class="grid grid-cols-2 gap-4">
              <DateInputWithLabel v-model="form.activeFrom" :label="t('erp.common.activeFrom')" />
              <DateInputWithLabel v-model="form.activeTo" :label="t('erp.common.activeTo')" />
            </div>

            <SearchSelectWithLabel v-model="form.status" :label="t('erp.products.status')" :options="statusOptions" :allow-empty="false" />

          </div>
        </div>
      </div>

      <!-- Linked Stores & Vendors -->
      <div class="grid grid-cols-2 gap-6">

        <!-- Linked Stores -->
        <div class="bg-white border border-[#E2E8F0] shadow-sm overflow-hidden">
          <div class="px-6 py-4 border-b border-[#E2E8F0]">
            <h2 class="text-sm font-semibold text-[#374151]">{{ t('erp.products.linkedStores') }}</h2>
            <p class="text-xs text-[#9BA7B0] mt-0.5">{{ t('erp.products.linkedStoresDesc') }}</p>
          </div>
          <div class="px-6 py-5 space-y-4">
            <div class="flex gap-2">
              <div class="flex-1"><SearchSelect v-model="selectedStoreId" :options="availableStoreOptions" :placeholder="t('erp.common.selectStore')" /></div>
              <AppButton @click="addStore" :disabled="!selectedStoreId" variant="primary">{{ t('erp.common.add') }}</AppButton>
            </div>
            <div class="space-y-2 min-h-[40px]">
              <div v-if="!linkedStores.length" class="text-sm text-[#9BA7B0] text-center py-4">{{ t('erp.products.noLinkedStores') }}</div>
              <div v-for="s in linkedStores" :key="s.id"
                class="flex items-center justify-between gap-2 px-3 py-2.5 bg-[#F7F9FC] border border-[#E2E8F0]">
                <div class="min-w-0">
                  <p class="text-sm font-medium text-[#1C2434] truncate">{{ s.name }}</p>
                  <p v-if="s.code" class="text-xs text-[#9BA7B0] font-mono">{{ s.code }}</p>
                </div>
                <button @click="removeStore(s.id)" class="text-[#9BA7B0] hover:text-red-500 transition flex-shrink-0 p-1">
                  <XMarkIcon class="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- Linked Vendors -->
        <div class="bg-white border border-[#E2E8F0] shadow-sm overflow-hidden">
          <div class="px-6 py-4 border-b border-[#E2E8F0]">
            <h2 class="text-sm font-semibold text-[#374151]">{{ t('erp.products.linkedVendors') }}</h2>
            <p class="text-xs text-[#9BA7B0] mt-0.5">{{ t('erp.products.linkedVendorsDesc') }}</p>
          </div>
          <div class="px-6 py-5 space-y-4">
            <div class="flex gap-2">
              <div class="flex-1"><SearchSelect v-model="selectedVendorId" :options="availableVendorOptions" :placeholder="`— ${t('erp.common.selectVendor')} —`" /></div>
              <AppButton @click="addVendor" :disabled="!selectedVendorId" variant="primary">{{ t('erp.common.add') }}</AppButton>
            </div>
            <div class="space-y-2 min-h-[40px]">
              <div v-if="!linkedVendors.length" class="text-sm text-[#9BA7B0] text-center py-4">{{ t('erp.products.noLinkedVendors') }}</div>
              <div v-for="v in linkedVendors" :key="v.id"
                class="flex items-center justify-between gap-2 px-3 py-2.5 bg-[#F7F9FC] border border-[#E2E8F0]">
                <div class="min-w-0">
                  <p class="text-sm font-medium text-[#1C2434] truncate">{{ v.name }}</p>
                  <p v-if="v.code" class="text-xs text-[#9BA7B0] font-mono">{{ v.code }}</p>
                </div>
                <button @click="removeVendor(v.id)" class="text-[#9BA7B0] hover:text-red-500 transition flex-shrink-0 p-1">
                  <XMarkIcon class="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>

      </div>

      <!-- Error -->
      <div v-if="error" class="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3">
        <ExclamationCircleIcon class="w-4 h-4 flex-shrink-0" />
        {{ error }}
      </div>

      <!-- Actions -->
      <div class="flex justify-end gap-3">
        <AppButton to="/erp/item-master" variant="secondary">{{ t('common.cancel') }}</AppButton>
        <AppButton @click="save" :loading="saving">
          {{ saving ? t('erp.common.creating') : t('erp.products.create') }}
        </AppButton>
      </div>

    </div>
  </AppLayout>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { RouterLink, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { ArrowLeftIcon, XMarkIcon, ExclamationCircleIcon } from '@heroicons/vue/24/outline'
import AppLayout from '@/layouts/AppLayout.vue'
import AppButton from '@/components/AppButton.vue'
import FormField from '@/components/form/FormField.vue'
import SearchSelect from '@/components/SearchSelect.vue'
import SearchSelectWithLabel from '@/components/SearchSelectWithLabel.vue'
import DateInputWithLabel from '@/components/DateInputWithLabel.vue'
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
const { fieldErrors, setFromError, setField, reset: resetErrors } = useFieldErrors()

const showShortcuts = ref(false)
const shortcutsRef  = ref(null)
const skuInputRef   = ref(null)

const SHORTCUTS = [
  { key: 'Ctrl+S', label: 'Save' },
  { key: 'Escape', label: 'Cancel / back' },
]

const availableStores  = computed(() => stores.value.filter(s => !linkedStores.value.some(l => l.id === s.id)))
const availableVendors = computed(() => vendors.value.filter(v => !linkedVendors.value.some(l => l.id === v.id)))
const categoryOptions  = computed(() => categories.value.map(cat => ({
  id: cat.name,
  name: cat.parentId ? `  ↳ ${cat.name}` : cat.name,
})))
const uomOptions             = computed(() => uoms.value.map(u => ({ id: u.id, name: `${u.name}${u.abbreviation ? ` (${u.abbreviation})` : ''}` })))
const availableStoreOptions  = computed(() => availableStores.value.map(s => ({ id: s.id, name: `${s.name}${s.code ? ` (${s.code})` : ''}` })))
const availableVendorOptions = computed(() => availableVendors.value.map(v => ({ id: v.id, name: `${v.name}${v.code ? ` (${v.code})` : ''}` })))

function onClickOutsideShortcuts(e) {
  if (shortcutsRef.value && !shortcutsRef.value.contains(e.target)) {
    showShortcuts.value = false
  }
}

function onKeydown(e) {
  if (e.key === 'Escape') {
    router.push('/erp/item-master')
  } else if (e.ctrlKey && e.key === 's') {
    e.preventDefault()
    save()
  }
}

onMounted(async () => {
  window.addEventListener('keydown', onKeydown)
  document.addEventListener('mousedown', onClickOutsideShortcuts)
  if (!autoCode.enabled.value) skuInputRef.value?.focus()
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
onUnmounted(() => {
  window.removeEventListener('keydown', onKeydown)
  document.removeEventListener('mousedown', onClickOutsideShortcuts)
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
