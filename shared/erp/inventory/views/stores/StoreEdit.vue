<template>
  <AppLayout>
    <div class="space-y-6">

      <div class="flex items-center gap-3">
        <RouterLink to="/erp/stores" class="text-[#9BA7B0] hover:text-[#637381] transition">
          <ArrowLeftIcon class="w-5 h-5" />
        </RouterLink>
        <h1 class="text-2xl font-bold text-[#1C2434]">{{ t('erp.stores.edit') }}</h1>
      </div>

      <div v-if="loading" class="text-[#9BA7B0] py-12 text-center">{{ t('common.loading') }}</div>
      <div v-else-if="notFound" class="bg-red-50 text-red-700 text-sm px-4 py-3">
        {{ t('erp.stores.notFound') }} <RouterLink to="/erp/stores" class="underline ml-1">{{ t('erp.common.backToList') }}</RouterLink>
      </div>

      <div v-else class="bg-white border border-[#E2E8F0] p-6 space-y-5">
        <div class="grid grid-cols-2 gap-4">
          <FormField v-model="form.code" name="code" :label="t('erp.stores.code')" input-class="font-mono" :errors="fieldErrors" wrapper-class="col-span-2 sm:col-span-1" />
          <FormField v-model="form.name" name="name" :label="t('erp.stores.name')" required :errors="fieldErrors" wrapper-class="col-span-2 sm:col-span-1" />
          <FormField v-model="form.phone" name="phone" :label="t('erp.stores.phone')" :errors="fieldErrors" wrapper-class="col-span-2 sm:col-span-1" />
          <FormField v-model="form.email" name="email" type="email" :label="t('erp.stores.email')" :errors="fieldErrors" wrapper-class="col-span-2 sm:col-span-1" />
          <FormField v-model="form.address" name="address" textarea :rows="2" :label="t('erp.stores.address')" :errors="fieldErrors" wrapper-class="col-span-2" />
          <div class="grid grid-cols-2 gap-4">
            <DateInputWithLabel v-model="form.activeFrom" :label="t('erp.common.activeFrom')" />
            <DateInputWithLabel v-model="form.activeTo" :label="t('erp.common.activeTo')" />
          </div>
          <SearchSelectWithLabel v-model="form.status" :label="t('erp.stores.status')" :options="statusOptions" :allow-empty="false" />
        </div>

        <div v-if="error" class="bg-red-50 text-red-700 text-sm px-4 py-2">{{ error }}</div>

        <div class="flex justify-between items-center pt-2">
          <AppButton variant="danger" @click="confirmDelete">{{ t('erp.stores.deleteStore') }}</AppButton>
          <div class="flex gap-3">
            <AppButton to="/erp/stores" variant="secondary">{{ t('common.cancel') }}</AppButton>
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
import { useRoute, useRouter } from 'vue-router'
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
const route    = useRoute()
const router   = useRouter()
const form     = ref({ name: '', code: '', phone: '', email: '', address: '', status: 'active', activeFrom: '', activeTo: '' })
const loading  = ref(true)
const notFound = ref(false)
const error    = ref('')
const saving   = ref(false)
const { fieldErrors, setFromError, setField, reset: resetErrors } = useFieldErrors()

onMounted(async () => {
  try {
    const { data } = await api.get(`/erp/stores/${route.params.id}`)
    const s = data.data.store
    form.value = { name: s.name, code: s.code || '', phone: s.phone || '', email: s.email || '', address: s.address || '', status: s.status, activeFrom: s.activeFrom || '', activeTo: s.activeTo || '' }
  } catch {
    notFound.value = true
  } finally {
    loading.value = false
  }
})

async function save() {
  error.value = ''
  resetErrors()
  if (!form.value.name.trim()) { setField('name', t('common.errors.required', { field: t('erp.stores.name') })); return }
  saving.value = true
  try {
    await api.put(`/erp/stores/${route.params.id}`, form.value)
    router.push('/erp/stores')
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
    await api.delete(`/erp/stores/${route.params.id}`)
    router.push('/erp/stores')
  } catch (err) {
    error.value = err.response?.data?.message || 'Delete failed'
  }
}
</script>
