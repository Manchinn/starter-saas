<template>
  <AppLayout>
    <div class="space-y-6">

      <div class="flex items-center gap-3">
        <RouterLink to="/erp/pricing" class="text-[#9BA7B0] hover:text-[#637381] transition">
          <ArrowLeftIcon class="w-5 h-5" />
        </RouterLink>
        <h1 class="text-2xl font-bold text-[#1C2434]">{{ t('erp.pricing.edit') }}</h1>
      </div>

      <div v-if="loading" class="bg-white rounded-2xl border border-[#E2E8F0] p-6 text-center text-[#9BA7B0]">
        {{ t('common.loading') }}
      </div>

      <div v-else class="bg-white rounded-2xl border border-[#E2E8F0] p-6 space-y-5">

        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium text-[#374151] mb-1">{{ t('erp.pricing.code') }}</label>
            <input v-model="form.code" type="text" class="w-full px-3 py-2 border rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary-500" placeholder="e.g. PL-001" />
          </div>
          <div class="col-span-2">
            <label class="block text-sm font-medium text-[#374151] mb-1">{{ t('erp.pricing.name') }} <span class="text-red-500">*</span></label>
            <input v-model="form.name" type="text" class="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" placeholder="e.g. Standard Rate" />
          </div>

          <div class="col-span-2">
            <label class="block text-sm font-medium text-[#374151] mb-1">{{ t('erp.pricing.description') }}</label>
            <textarea v-model="form.description" rows="2" class="w-full px-3 py-2 border rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary-500" placeholder="Optional notes…" />
          </div>

          <div>
            <label class="block text-sm font-medium text-[#374151] mb-1">{{ t('erp.pricing.unitPrice') }} <span class="text-red-500">*</span></label>
            <input v-model.number="form.unitPrice" type="number" min="0" step="0.01"
              class="w-full px-3 py-2 border rounded-lg text-sm text-right focus:outline-none focus:ring-2 focus:ring-primary-500" />
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
            <label class="block text-sm font-medium text-[#374151] mb-1">{{ t('erp.pricing.status') }}</label>
            <select v-model="form.status" class="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500">
              <option value="active">{{ t('common.active') }}</option>
              <option value="inactive">{{ t('common.inactive') }}</option>
            </select>
          </div>

          <div>
            <label class="block text-sm font-medium text-[#374151] mb-1">{{ t('erp.pricing.customerGroup') }}</label>
            <select v-model="form.customerGroupId" class="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white">
              <option value="">— None —</option>
              <option v-for="g in groups" :key="g.id" :value="g.id">{{ g.name }}</option>
            </select>
          </div>
          <div>
            <label class="block text-sm font-medium text-[#374151] mb-1">{{ t('erp.pricing.saleItem') }}</label>
            <select v-model="form.saleItemId" class="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white">
              <option value="">— None —</option>
              <option v-for="si in saleItems" :key="si.id" :value="si.id">
                {{ si.name }}<span v-if="si.code" class="text-[#9BA7B0]"> ({{ si.code }})</span>
              </option>
            </select>
          </div>

        </div>

        <div v-if="error" class="bg-red-50 text-red-700 text-sm px-4 py-2 rounded-lg">{{ error }}</div>

        <div class="flex justify-end gap-3 pt-2">
          <RouterLink to="/erp/pricing" class="px-4 py-2 text-sm border rounded-lg hover:bg-[#F7F9FC] transition">{{ t('common.cancel') }}</RouterLink>
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

const { t } = useI18n()
const router = useRouter()
const route  = useRoute()
const id     = route.params.id

const form      = ref({ code: '', name: '', description: '', unitPrice: 0, status: 'active', activeFrom: '', activeTo: '', saleItemId: '', customerGroupId: '' })
const groups    = ref([])
const saleItems = ref([])
const loading   = ref(true)
const saving    = ref(false)
const error     = ref('')

onMounted(async () => {
  try {
    const [pricingRes, groupsRes, saleItemsRes] = await Promise.all([
      api.get(`/erp/pricing/${id}`),
      api.get('/erp/customer-groups/all'),
      api.get('/erp/sale-items', { params: { limit: 500, status: 'active' } }),
    ])
    const p = pricingRes.data.data.pricing
    groups.value    = groupsRes.data.data.groups
    saleItems.value = saleItemsRes.data.data.items
    form.value = {
      code:            p.code            || '',
      name:            p.name,
      description:     p.description     || '',
      unitPrice:       Number(p.unitPrice),
      status:          p.status,
      activeFrom:      p.activeFrom      || '',
      activeTo:        p.activeTo        || '',
      saleItemId:      p.saleItemId      || '',
      customerGroupId: p.customerGroupId || '',
    }
  } catch (err) {
    error.value = err.response?.data?.message || 'Failed to load price list'
  } finally {
    loading.value = false
  }
})

async function save() {
  error.value = ''
  if (!form.value.name.trim()) { error.value = 'Name is required'; return }
  saving.value = true
  try {
    await api.put(`/erp/pricing/${id}`, {
      ...form.value,
      saleItemId:      form.value.saleItemId      || null,
      customerGroupId: form.value.customerGroupId || null,
    })
    router.push('/erp/pricing')
  } catch (err) {
    const d = err.response?.data
    error.value = d?.errors?.map(e => e.message).join(', ') || d?.message || 'Failed to save'
  } finally {
    saving.value = false
  }
}
</script>
