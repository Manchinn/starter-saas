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
      <div v-else-if="notFound" class="bg-red-50 text-red-700 text-sm px-4 py-3">
        {{ t('erp.vendors.notFound') }} <RouterLink to="/erp/vendors" class="underline ml-1">{{ t('erp.common.backToList') }}</RouterLink>
      </div>

      <div v-else class="bg-white border border-[#E2E8F0] p-6 space-y-5">
        <div class="grid grid-cols-2 gap-4">
          <FormField v-model="form.code" name="code" :label="t('erp.vendors.code')" :errors="fieldErrors" />
          <FormField v-model="form.name" name="name" :label="t('erp.vendors.name')" required :errors="fieldErrors" wrapper-class="col-span-2" />
          <FormField v-model="form.contactPerson" name="contactPerson" :label="t('erp.vendors.contactPerson')" :errors="fieldErrors" />
          <FormField v-model="form.email" name="email" type="email" :label="t('erp.vendors.email')" :errors="fieldErrors" />
          <FormField v-model="form.phone" name="phone" :label="t('erp.vendors.phone')" :errors="fieldErrors" />
          <FormField v-model="form.address" name="address" textarea :rows="2" :label="t('erp.vendors.address')" :errors="fieldErrors" wrapper-class="col-span-2" />
          <FormField v-model="form.notes" name="notes" textarea :rows="2" :label="t('erp.vendors.notes')" :errors="fieldErrors" wrapper-class="col-span-2" />
          <div class="grid grid-cols-2 gap-4">
            <DateInputWithLabel v-model="form.activeFrom" :label="t('erp.common.activeFrom')" />
            <DateInputWithLabel v-model="form.activeTo" :label="t('erp.common.activeTo')" />
          </div>
          <SearchSelectWithLabel v-model="form.status" :label="t('erp.vendors.status')" :options="statusOptions" :allow-empty="false" />
          <div>
            <label class="label">{{ t('erp.vendors.vendorType') }}</label>
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

        <div class="flex justify-between items-center pt-2">
          <AppButton variant="danger" @click="confirmDelete">{{ t('erp.vendors.deleteVendor') }}</AppButton>
          <div class="flex gap-3">
            <AppButton to="/erp/vendors" variant="secondary">{{ t('common.cancel') }}</AppButton>
            <AppButton @click="save" :loading="saving">
              {{ saving ? t('erp.common.saving') : t('common.saveChanges') }}
            </AppButton>
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
import AppButton from '@/components/AppButton.vue'
import FormField from '@/components/form/FormField.vue'
import DateInputWithLabel from '@/components/DateInputWithLabel.vue'
import SearchSelectWithLabel from '@/components/SearchSelectWithLabel.vue'
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
const { fieldErrors, setFromError, setField, reset: resetErrors } = useFieldErrors()

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
