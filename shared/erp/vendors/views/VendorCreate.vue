<template>
  <AppLayout>
    <div class="space-y-6">

      <div class="flex items-center gap-3">
        <RouterLink to="/erp/vendors" class="text-[#9BA7B0] hover:text-[#637381] transition">
          <ArrowLeftIcon class="w-5 h-5" />
        </RouterLink>
        <h1 class="text-2xl font-bold text-[#1C2434]">{{ t('erp.vendors.new') }}</h1>
      </div>

      <div class="bg-white border border-[#E2E8F0] p-6 space-y-5">
        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium text-[#374151] mb-1">{{ t('erp.vendors.code') }}</label>
            <input v-if="!autoCode.enabled.value" v-model="form.code" type="text" :placeholder="t('erp.vendors.code')"
              class="w-full px-3 py-2 border text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
            <input v-else :value="autoCode.preview.value" type="text" readonly
              class="w-full px-3 py-2 border text-sm bg-[#F7F9FC] text-[#637381] font-mono cursor-not-allowed" />
            <label class="mt-1 flex items-center gap-2 text-xs text-[#637381] cursor-pointer select-none">
              <input type="checkbox" :checked="autoCode.enabled.value" @change="autoCode.toggle" class="" />
              {{ t('erp.common.autoGenerate') }}
            </label>
          </div>
          <div class="col-span-2">
            <label class="block text-sm font-medium text-[#374151] mb-1">{{ t('erp.vendors.name') }} <span class="text-red-500">*</span></label>
            <input v-model="form.name" type="text" :placeholder="t('erp.vendors.name')"
              class="w-full px-3 py-2 border text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
          </div>
          <div>
            <label class="block text-sm font-medium text-[#374151] mb-1">{{ t('erp.vendors.contactPerson') }}</label>
            <input v-model="form.contactPerson" type="text" :placeholder="t('erp.vendors.contactPerson')"
              class="w-full px-3 py-2 border text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
          </div>
          <div>
            <label class="block text-sm font-medium text-[#374151] mb-1">{{ t('erp.vendors.email') }}</label>
            <input v-model="form.email" type="email" :placeholder="t('erp.vendors.email')"
              class="w-full px-3 py-2 border text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
          </div>
          <div>
            <label class="block text-sm font-medium text-[#374151] mb-1">{{ t('erp.vendors.phone') }}</label>
            <input v-model="form.phone" type="text" :placeholder="t('erp.vendors.phone')"
              class="w-full px-3 py-2 border text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
          </div>
          <div class="col-span-2">
            <label class="block text-sm font-medium text-[#374151] mb-1">{{ t('erp.vendors.address') }}</label>
            <textarea v-model="form.address" rows="2" :placeholder="t('erp.vendors.address')"
              class="w-full px-3 py-2 border text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none" />
          </div>
          <div class="col-span-2">
            <label class="block text-sm font-medium text-[#374151] mb-1">{{ t('erp.vendors.notes') }}</label>
            <textarea v-model="form.notes" rows="2" :placeholder="t('erp.vendors.notes')"
              class="w-full px-3 py-2 border text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none" />
          </div>
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-[#374151] mb-1">{{ t('erp.common.activeFrom') }}</label>
              <DateInput v-model="form.activeFrom" class="w-full px-3 py-2 border text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
            </div>
            <div>
              <label class="block text-sm font-medium text-[#374151] mb-1">{{ t('erp.common.activeTo') }}</label>
              <DateInput v-model="form.activeTo" class="w-full px-3 py-2 border text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
            </div>
          </div>
          <div>
            <label class="block text-sm font-medium text-[#374151] mb-1">{{ t('erp.vendors.status') }}</label>
            <SearchSelect v-model="form.status" :options="statusOptions" :allow-empty="false" />
          </div>
          <div>
            <label class="block text-sm font-medium text-[#374151] mb-2">{{ t('erp.vendors.vendorType') }}</label>
            <div class="flex flex-col gap-2">
              <label v-for="vt in vendorTypeOptions" :key="vt.id"
                class="flex items-center gap-2 text-sm text-[#374151] cursor-pointer select-none">
                <input type="checkbox" :value="vt.name" v-model="form.vendorTypes"
                  class="text-primary-500 focus:ring-primary-500" />
                {{ vt.name }}
              </label>
            </div>
          </div>
        </div>

        <div v-if="error" class="bg-red-50 text-red-700 text-sm px-4 py-2">{{ error }}</div>

        <div class="flex justify-end gap-3 pt-2">
          <RouterLink to="/erp/vendors" class="px-4 py-2 text-sm border hover:bg-[#F7F9FC] transition">Cancel</RouterLink>
          <button @click="save" :disabled="saving"
            class="px-5 py-2 text-sm bg-primary-500 text-white hover:bg-primary-700 disabled:opacity-50 transition">
            {{ saving ? t('erp.common.saving') : t('erp.vendors.create') }}
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

const statusOptions = computed(() => [
  { id: 'active',   name: t('common.active')   },
  { id: 'inactive', name: t('common.inactive') },
])
const router          = useRouter()
const vendorTypeOptions = ref([])
const form    = ref({ name: '', code: '', contactPerson: '', email: '', phone: '', address: '', notes: '', vendorTypes: [], status: 'active', activeFrom: '', activeTo: '' })
const error   = ref('')
const saving  = ref(false)
const autoCode = useAutoCode('VND')
const { fieldErrors, setFromError, setField, reset: resetErrors, errorOf } = useFieldErrors()

onMounted(async () => {
  const { data } = await api.get('/erp/master-data/by-name/Vendor Types')
  vendorTypeOptions.value = data.data.values
})

async function save() {
  error.value = ''
  resetErrors()
  if (!form.value.name.trim()) { setField('name', t('common.errors.required', { field: t('erp.vendors.name') })); return }
  saving.value = true
  try {
    const payload = { ...form.value }
    if (autoCode.enabled.value) { payload.autoCode = true; payload.code = null }
    await api.post('/erp/vendors', payload)
    router.push('/erp/vendors')
  } catch (err) {
    const had = setFromError(err)
    if (!had) error.value = parseApiError(err, 'Failed to create vendor')
  } finally {
    saving.value = false
  }
}
</script>
