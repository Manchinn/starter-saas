<template>
  <AppLayout>
    <div class="space-y-6">

      <div class="flex items-center gap-3">
        <RouterLink to="/erp/pricing" class="text-[#9BA7B0] hover:text-[#637381] transition">
          <ArrowLeftIcon class="w-5 h-5" />
        </RouterLink>
        <h1 class="text-2xl font-bold text-[#1C2434]">{{ t('erp.pricing.new') }}</h1>
      </div>

      <div class="bg-white rounded-2xl border border-[#E2E8F0] p-6 space-y-5">

        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium text-[#374151] mb-1">{{ t('erp.pricing.code') }}</label>
            <input v-if="!autoCode.enabled.value" v-model="form.code" type="text" placeholder="e.g. PL-001"
              class="w-full px-3 py-2 border rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary-500" />
            <input v-else :value="autoCode.preview.value" type="text" readonly
              class="w-full px-3 py-2 border rounded-lg text-sm bg-[#F7F9FC] text-[#637381] font-mono cursor-not-allowed" />
            <label class="mt-1 flex items-center gap-2 text-xs text-[#637381] cursor-pointer select-none">
              <input type="checkbox" :checked="autoCode.enabled.value" @change="autoCode.toggle" class="rounded" />
              {{ t('erp.common.autoGenerate') }}
            </label>
          </div>
          <div class="col-span-2">
            <label class="block text-sm font-medium text-[#374151] mb-1">{{ t('erp.pricing.name') }} <span class="text-red-500">*</span></label>
            <input v-model="form.name" type="text" placeholder="e.g. Standard Rate"
              :class="['w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500', errorOf('name') && 'input-error']" />
            <FieldError name="name" :errors="fieldErrors" />
          </div>

          <div class="col-span-2">
            <label class="block text-sm font-medium text-[#374151] mb-1">{{ t('erp.pricing.description') }}</label>
            <textarea v-model="form.description" rows="2" placeholder="Optional notes…"
              class="w-full px-3 py-2 border rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary-500" />
          </div>

          <div>
            <label class="block text-sm font-medium text-[#374151] mb-1">{{ t('erp.pricing.unitPrice') }} <span class="text-red-500">*</span></label>
            <input v-model.number="form.unitPrice" type="number" min="0" step="0.01"
              :class="['w-full px-3 py-2 border rounded-lg text-sm text-right focus:outline-none focus:ring-2 focus:ring-primary-500', errorOf('unitPrice') && 'input-error']" />
            <FieldError name="unitPrice" :errors="fieldErrors" />
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
            <SearchSelect v-model="form.status" :options="statusOptions" :allow-empty="false" />
          </div>

          <div>
            <label class="block text-sm font-medium text-[#374151] mb-1">{{ t('erp.pricing.customerGroup') }}</label>
            <SearchSelect v-model="form.customerGroupId" :options="groups" placeholder="— None —" />
          </div>
          <div>
            <label class="block text-sm font-medium text-[#374151] mb-1">{{ t('erp.pricing.saleItem') }}</label>
            <SearchSelect v-model="form.saleItemId" :options="saleItemOptions" placeholder="— None —" />
          </div>
        </div>

        <div v-if="error" class="bg-red-50 text-red-700 text-sm px-4 py-2 rounded-lg">{{ error }}</div>

        <div class="flex justify-end gap-3 pt-2">
          <RouterLink to="/erp/pricing" class="px-4 py-2 text-sm border rounded-lg hover:bg-[#F7F9FC] transition">{{ t('common.cancel') }}</RouterLink>
          <button @click="save" :disabled="saving"
            class="px-5 py-2 text-sm bg-primary-500 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 transition">
            {{ saving ? t('erp.common.creating') : t('erp.pricing.create') }}
          </button>
        </div>

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
import FieldError from '@/components/form/FieldError.vue'
import { useFieldErrors } from '@/composables/useFieldErrors'
import api from '@/api'
import { useAutoCode } from '@/composables/useAutoCode'
import { parseApiError } from '@/utils/apiError'

const { t } = useI18n()
const router   = useRouter()
const form      = ref({ code: '', name: '', description: '', unitPrice: 0, status: 'active', activeFrom: '', activeTo: '', saleItemId: '', customerGroupId: '' })
const autoCode  = useAutoCode('PRC')
const groups    = ref([])
const saleItems = ref([])
const error     = ref('')
const saving    = ref(false)
const { fieldErrors, setFromError, reset: resetErrors, errorOf } = useFieldErrors()

const statusOptions   = computed(() => [
  { id: 'active',   name: t('common.active')   },
  { id: 'inactive', name: t('common.inactive') },
])
const saleItemOptions = computed(() => saleItems.value.map(si => ({ id: si.id, name: si.code ? `${si.name} (${si.code})` : si.name })))

onMounted(async () => {
  const [groupsRes, saleItemsRes] = await Promise.allSettled([
    api.get('/erp/customer-groups/all'),
    api.get('/erp/sale-items', { params: { limit: 500, status: 'active' } }),
  ])
  if (groupsRes.status === 'fulfilled')    groups.value    = groupsRes.value.data.data.groups
  if (saleItemsRes.status === 'fulfilled') saleItems.value = saleItemsRes.value.data.data.items
})

async function save() {
  error.value = ''
  resetErrors()
  if (!form.value.name.trim()) { error.value = 'Name is required'; return }
  saving.value = true
  try {
    const payload = { ...form.value, saleItemId: form.value.saleItemId || null, customerGroupId: form.value.customerGroupId || null }
    if (autoCode.enabled.value) { payload.autoCode = true; payload.code = null }
    await api.post('/erp/pricing', payload)
    router.push('/erp/pricing')
  } catch (err) {
    const had = setFromError(err)
    if (!had) error.value = parseApiError(err, 'Failed to create price list')
  } finally {
    saving.value = false
  }
}
</script>
