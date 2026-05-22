<template>
  <AppLayout>
    <div class="space-y-6">

      <div class="flex items-center gap-3">
        <RouterLink to="/erp/sale-items" class="text-[#9BA7B0] hover:text-[#637381] transition">
          <ArrowLeftIcon class="w-5 h-5" />
        </RouterLink>
        <h1 class="text-2xl font-bold text-[#1C2434]">{{ t('erp.saleItems.edit') }}</h1>
      </div>

      <div v-if="loading" class="bg-white border border-[#E2E8F0] p-6 text-center text-[#9BA7B0]">{{ t('common.loading') }}</div>

      <div v-else class="bg-white border border-[#E2E8F0] p-6 space-y-5">

        <div class="grid grid-cols-2 gap-4">

          <!-- Code -->
          <div>
            <label class="block text-sm font-medium text-[#374151] mb-1">{{ t('erp.saleItems.code') }}</label>
            <input v-model="form.code" type="text" placeholder="e.g. SI-001"
              class="w-full px-3 py-2 border text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary-500" />
          </div>

          <!-- Status -->
          <div>
            <label class="block text-sm font-medium text-[#374151] mb-1">{{ t('erp.saleItems.status') }}</label>
            <SearchSelect v-model="form.status" :options="statusOptions" :allow-empty="false" />
          </div>

          <!-- Name -->
          <div class="col-span-2">
            <label class="block text-sm font-medium text-[#374151] mb-1">{{ t('erp.saleItems.name') }} <span class="text-red-500">*</span></label>
            <input v-model="form.name" type="text"
              :class="['w-full px-3 py-2 border text-sm focus:outline-none focus:ring-2 focus:ring-primary-500', errorOf('name') && 'input-error']" />
            <FieldError name="name" :errors="fieldErrors" />
          </div>

          <!-- Product Master -->
          <div class="col-span-2">
            <label class="block text-sm font-medium text-[#374151] mb-1">{{ t('erp.saleItems.productMaster') }}</label>
            <SearchSelect v-model="form.productId" :options="productOptions" placeholder="— None —" />
          </div>

        </div>

        <div v-if="error" class="bg-red-50 text-red-700 text-sm px-4 py-2">{{ error }}</div>

        <div class="flex justify-end gap-3 pt-2">
          <RouterLink to="/erp/sale-items" class="px-4 py-2 text-sm border hover:bg-[#F7F9FC] transition">{{ t('common.cancel') }}</RouterLink>
          <button @click="save" :disabled="saving"
            class="px-5 py-2 text-sm bg-primary-500 text-white hover:bg-primary-700 disabled:opacity-50 transition">
            {{ saving ? t('erp.common.saving') : t('common.saveChanges') }}
          </button>
        </div>

      </div>
    </div>
  </AppLayout>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { ArrowLeftIcon } from '@heroicons/vue/24/outline'
import AppLayout from '@/layouts/AppLayout.vue'
import SearchSelect from '@/components/SearchSelect.vue'
import FieldError from '@/components/form/FieldError.vue'
import { useFieldErrors } from '@/composables/useFieldErrors'
import api from '@/api'
import { useMasterDataStore } from '@/stores/masterData'
import { parseApiError } from '@/utils/apiError'

const { t } = useI18n()
const router  = useRouter()
const route   = useRoute()
const id      = route.params.id

const form     = ref({ code: '', name: '', productId: '', status: 'active' })
const masterDataStore  = useMasterDataStore()
const saleItemStatuses = ref([])
const products = ref([])
const loading  = ref(true)
const saving   = ref(false)
const error    = ref('')
const { fieldErrors, setFromError, setField, reset: resetErrors, errorOf } = useFieldErrors()

const statusOptions  = computed(() =>
  saleItemStatuses.value.length
    ? saleItemStatuses.value.map(s => ({ id: s.code || s.name, name: s.name }))
    : [{ id: 'active', name: t('common.active') }, { id: 'inactive', name: t('common.inactive') }]
)
const productOptions = computed(() => products.value.map(p => ({ id: p.id, name: p.sku ? `${p.name} (${p.sku})` : p.name })))

onMounted(async () => {
  try {
    const [itemRes, prodRes] = await Promise.all([
      api.get(`/erp/sale-items/${id}`),
      api.get('/erp/item-master', { params: { limit: 500, status: 'active' } }),
    ])
    const s = itemRes.data.data.item
    products.value = prodRes.data.data.products
    form.value = {
      code:      s.code      || '',
      name:      s.name,
      productId: s.productId || '',
      status:    s.status,
    }
  } catch (err) {
    error.value = err.response?.data?.message || 'Failed to load sale item'
  } finally {
    loading.value = false
  }
  try { saleItemStatuses.value = await masterDataStore.getValues('sale-item-statuses') } catch {}
})

async function save() {
  error.value = ''
  resetErrors()
  if (!form.value.name.trim()) { setField('name', t('common.errors.required', { field: t('erp.saleItems.name') })); return }
  saving.value = true
  try {
    await api.put(`/erp/sale-items/${id}`, {
      ...form.value,
      productId: form.value.productId || null,
      code:      form.value.code      || null,
    })
    router.push('/erp/sale-items')
  } catch (err) {
    const had = setFromError(err)
    if (!had) error.value = parseApiError(err, 'Failed to save')
  } finally {
    saving.value = false
  }
}
</script>
