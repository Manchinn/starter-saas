<template>
  <AppLayout>
    <div class="space-y-6">

      <div class="flex items-center gap-3">
        <RouterLink to="/erp/sale-items" class="text-[#9BA7B0] hover:text-[#637381] transition">
          <ArrowLeftIcon class="w-5 h-5" />
        </RouterLink>
        <h1 class="text-2xl font-bold text-[#1C2434]">{{ t('erp.saleItems.edit') }}</h1>
      </div>

      <div v-if="loading" class="bg-white rounded-2xl border border-[#E2E8F0] p-6 text-center text-[#9BA7B0]">{{ t('common.loading') }}</div>

      <div v-else class="bg-white rounded-2xl border border-[#E2E8F0] p-6 space-y-5">

        <div class="grid grid-cols-2 gap-4">

          <!-- Code -->
          <div>
            <label class="block text-sm font-medium text-[#374151] mb-1">{{ t('erp.saleItems.code') }}</label>
            <input v-model="form.code" type="text" placeholder="e.g. SI-001"
              class="w-full px-3 py-2 border rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary-500" />
          </div>

          <!-- Status -->
          <div>
            <label class="block text-sm font-medium text-[#374151] mb-1">{{ t('erp.saleItems.status') }}</label>
            <select v-model="form.status" class="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500">
              <template v-if="saleItemStatuses.length">
                <option v-for="s in saleItemStatuses" :key="s.id" :value="s.code || s.name">{{ s.name }}</option>
              </template>
              <template v-else>
                <option value="active">{{ t('common.active') }}</option>
                <option value="inactive">{{ t('common.inactive') }}</option>
              </template>
            </select>
          </div>

          <!-- Name -->
          <div class="col-span-2">
            <label class="block text-sm font-medium text-[#374151] mb-1">{{ t('erp.saleItems.name') }} <span class="text-red-500">*</span></label>
            <input v-model="form.name" type="text"
              class="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
          </div>

          <!-- Product Master -->
          <div class="col-span-2">
            <label class="block text-sm font-medium text-[#374151] mb-1">{{ t('erp.saleItems.productMaster') }}</label>
            <select v-model="form.productId" class="w-full px-3 py-2 border rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary-500">
              <option value="">— None —</option>
              <option v-for="p in products" :key="p.id" :value="p.id">
                {{ p.name }}<span v-if="p.sku"> ({{ p.sku }})</span>
              </option>
            </select>
          </div>

        </div>

        <div v-if="error" class="bg-red-50 text-red-700 text-sm px-4 py-2 rounded-lg">{{ error }}</div>

        <div class="flex justify-end gap-3 pt-2">
          <RouterLink to="/erp/sale-items" class="px-4 py-2 text-sm border rounded-lg hover:bg-[#F7F9FC] transition">{{ t('common.cancel') }}</RouterLink>
          <button @click="save" :disabled="saving"
            class="px-5 py-2 text-sm bg-primary-500 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 transition">
            {{ saving ? t('erp.common.saving') : t('common.saveChanges') }}
          </button>
        </div>

      </div>
    </div>
  </AppLayout>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { ArrowLeftIcon } from '@heroicons/vue/24/outline'
import AppLayout from '@/layouts/AppLayout.vue'
import api from '@/api'
import { useMasterDataStore } from '@/stores/masterData'

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
  if (!form.value.name.trim()) { error.value = 'Name is required'; return }
  saving.value = true
  try {
    await api.put(`/erp/sale-items/${id}`, {
      ...form.value,
      productId: form.value.productId || null,
      code:      form.value.code      || null,
    })
    router.push('/erp/sale-items')
  } catch (err) {
    const d = err.response?.data
    error.value = d?.errors?.map(e => e.message).join(', ') || d?.message || 'Failed to save'
  } finally {
    saving.value = false
  }
}
</script>
