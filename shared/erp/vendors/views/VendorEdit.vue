<template>
  <AppLayout>
    <div class="space-y-6">

      <div class="flex items-center gap-3">
        <RouterLink to="/erp/vendors" class="text-[#9BA7B0] hover:text-[#637381] transition">
          <ArrowLeftIcon class="w-5 h-5" />
        </RouterLink>
        <h1 class="text-2xl font-bold text-[#1C2434]">{{ t('erp.vendors.edit') }}</h1>
      </div>

      <div v-if="loading" class="text-[#9BA7B0] py-12 text-center">Loading…</div>
      <div v-else-if="notFound" class="bg-red-50 text-red-700 text-sm px-4 py-3 rounded-lg">
        {{ t('erp.vendors.notFound') }} <RouterLink to="/erp/vendors" class="underline ml-1">{{ t('erp.common.backToList') }}</RouterLink>
      </div>

      <div v-else class="bg-white rounded-2xl border border-[#E2E8F0] p-6 space-y-5">
        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium text-[#374151] mb-1">{{ t('erp.vendors.code') }}</label>
            <input v-model="form.code" type="text"
              class="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
          </div>
          <div class="col-span-2">
            <label class="block text-sm font-medium text-[#374151] mb-1">{{ t('erp.vendors.name') }} <span class="text-red-500">*</span></label>
            <input v-model="form.name" type="text"
              class="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
          </div>
          <div>
            <label class="block text-sm font-medium text-[#374151] mb-1">{{ t('erp.vendors.contactPerson') }}</label>
            <input v-model="form.contactPerson" type="text"
              class="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
          </div>
          <div>
            <label class="block text-sm font-medium text-[#374151] mb-1">{{ t('erp.vendors.email') }}</label>
            <input v-model="form.email" type="email"
              class="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
          </div>
          <div>
            <label class="block text-sm font-medium text-[#374151] mb-1">{{ t('erp.vendors.phone') }}</label>
            <input v-model="form.phone" type="text"
              class="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
          </div>
          <div class="col-span-2">
            <label class="block text-sm font-medium text-[#374151] mb-1">{{ t('erp.vendors.address') }}</label>
            <textarea v-model="form.address" rows="2"
              class="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none" />
          </div>
          <div class="col-span-2">
            <label class="block text-sm font-medium text-[#374151] mb-1">{{ t('erp.vendors.notes') }}</label>
            <textarea v-model="form.notes" rows="2"
              class="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none" />
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
            <label class="block text-sm font-medium text-[#374151] mb-1">{{ t('erp.vendors.status') }}</label>
            <SearchSelect v-model="form.status" :options="statusOptions" :allow-empty="false" />
          </div>
          <div>
            <label class="block text-sm font-medium text-[#374151] mb-2">{{ t('erp.vendors.vendorType') }}</label>
            <div class="flex flex-col gap-2">
              <label v-for="vt in vendorTypeOptions" :key="vt.id"
                class="flex items-center gap-2 text-sm text-[#374151] cursor-pointer select-none">
                <input type="checkbox" :value="vt.name" v-model="form.vendorTypes"
                  class="rounded text-primary-500 focus:ring-primary-500" />
                {{ vt.name }}
              </label>
            </div>
          </div>
        </div>

        <div v-if="error" class="bg-red-50 text-red-700 text-sm px-4 py-2 rounded-lg">{{ error }}</div>

        <div class="flex justify-between items-center pt-2">
          <button @click="confirmDelete"
            class="px-4 py-2 text-sm text-red-500 border border-red-200 rounded-lg hover:bg-red-50 transition">
            {{ t('erp.vendors.deleteVendor') }}
          </button>
          <div class="flex gap-3">
            <RouterLink to="/erp/vendors" class="px-4 py-2 text-sm border rounded-lg hover:bg-[#F7F9FC] transition">Cancel</RouterLink>
            <button @click="save" :disabled="saving"
              class="px-5 py-2 text-sm bg-primary-500 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 transition">
              {{ saving ? t('erp.common.saving') : t('common.saveChanges') }}
            </button>
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
import SearchSelect from '@/components/SearchSelect.vue'
import FieldError from '@/components/form/FieldError.vue'
import { useFieldErrors } from '@/composables/useFieldErrors'
import api from '@/api'
import { parseApiError } from '@/utils/apiError'

const { t } = useI18n()

const statusOptions = computed(() => [
  { id: 'active',   name: t('common.active')   },
  { id: 'inactive', name: t('common.inactive') },
])
const route             = useRoute()
const router            = useRouter()
const vendorTypeOptions = ref([])
const form     = ref({ name: '', code: '', contactPerson: '', email: '', phone: '', address: '', notes: '', vendorTypes: [], status: 'active', activeFrom: '', activeTo: '' })
const loading  = ref(true)
const notFound = ref(false)
const error    = ref('')
const saving   = ref(false)
const { fieldErrors, setFromError, setField, reset: resetErrors, errorOf } = useFieldErrors()

onMounted(async () => {
  const { data: mdData } = await api.get('/erp/master-data/by-name/Vendor Types')
  vendorTypeOptions.value = mdData.data.values
  try {
    const { data } = await api.get(`/erp/vendors/${route.params.id}`)
    const v = data.data.vendor
    form.value = {
      name:          v.name,
      code:          v.code          || '',
      contactPerson: v.contactPerson || '',
      email:         v.email         || '',
      phone:         v.phone         || '',
      address:       v.address       || '',
      notes:         v.notes         || '',
      vendorTypes:   v.vendorTypes   || [],
      status:        v.status,
      activeFrom:    v.activeFrom    || '',
      activeTo:      v.activeTo      || '',
    }
  } catch {
    notFound.value = true
  } finally {
    loading.value = false
  }
})

async function save() {
  error.value = ''
  resetErrors()
  if (!form.value.name.trim()) { setField('name', t('common.errors.required', { field: t('erp.vendors.name') })); return }
  saving.value = true
  try {
    await api.put(`/erp/vendors/${route.params.id}`, form.value)
    router.push('/erp/vendors')
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
    await api.delete(`/erp/vendors/${route.params.id}`)
    router.push('/erp/vendors')
  } catch (err) {
    error.value = err.response?.data?.message || 'Delete failed'
  }
}
</script>
