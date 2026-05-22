<template>
  <AppLayout>
    <div class="space-y-6">

      <div class="flex items-center gap-3">
        <RouterLink to="/erp/uom" class="text-[#9BA7B0] hover:text-[#637381] transition">
          <ArrowLeftIcon class="w-5 h-5" />
        </RouterLink>
        <h1 class="text-2xl font-bold text-[#1C2434]">{{ t('erp.uom.edit') }}</h1>
      </div>

      <div v-if="loading" class="text-[#9BA7B0] py-12 text-center">{{ t('common.loading') }}</div>
      <div v-else-if="notFound" class="bg-red-50 text-red-700 text-sm px-4 py-3">
        {{ t('erp.uom.notFound') }} <RouterLink to="/erp/uom" class="underline ml-1">{{ t('erp.common.backToList') }}</RouterLink>
      </div>

      <div v-else class="bg-white border border-[#E2E8F0] p-6 space-y-5">
        <div class="grid grid-cols-2 gap-4">
          <div class="col-span-2 sm:col-span-1">
            <label class="block text-sm font-medium text-[#374151] mb-1">{{ t('erp.uom.code') }} <span class="text-red-500">*</span></label>
            <input v-model="form.abbreviation" type="text"
              :class="['w-full px-3 py-2 border text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary-500', errorOf('abbreviation') && 'input-error']" />
            <FieldError name="abbreviation" :errors="fieldErrors" />
          </div>
          <div class="col-span-2 sm:col-span-1">
            <label class="block text-sm font-medium text-[#374151] mb-1">{{ t('erp.uom.name') }} <span class="text-red-500">*</span></label>
            <input v-model="form.name" type="text"
              :class="['w-full px-3 py-2 border text-sm focus:outline-none focus:ring-2 focus:ring-primary-500', errorOf('name') && 'input-error']" />
            <FieldError name="name" :errors="fieldErrors" />
          </div>
          <div class="col-span-2">
            <label class="block text-sm font-medium text-[#374151] mb-1">{{ t('erp.uom.description') }}</label>
            <textarea v-model="form.description" rows="2"
              class="w-full px-3 py-2 border text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary-500" />
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
            <label class="block text-sm font-medium text-[#374151] mb-1">{{ t('erp.uom.status') }}</label>
            <SearchSelect v-model="form.status" :options="statusOptions" :allow-empty="false" />
          </div>
        </div>

        <div v-if="error" class="bg-red-50 text-red-700 text-sm px-4 py-2">{{ error }}</div>

        <div class="flex justify-between items-center pt-2">
          <button @click="confirmDelete" class="px-4 py-2 text-sm text-red-500 border border-red-200 hover:bg-red-50 transition">{{ t('erp.uom.deleteUom') }}</button>
          <div class="flex gap-3">
            <RouterLink to="/erp/uom" class="px-4 py-2 text-sm border hover:bg-[#F7F9FC] transition">{{ t('common.cancel') }}</RouterLink>
            <button @click="save" :disabled="saving"
              class="px-5 py-2 text-sm bg-primary-500 text-white hover:bg-primary-700 disabled:opacity-50 transition">
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
import { useRoute, useRouter } from 'vue-router'
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
const route    = useRoute()
const router   = useRouter()
const form     = ref({ name: '', abbreviation: '', description: '', status: 'active', activeFrom: '', activeTo: '' })
const loading  = ref(true)
const notFound = ref(false)
const error    = ref('')
const saving   = ref(false)
const { fieldErrors, setFromError, setField, reset: resetErrors, errorOf } = useFieldErrors()

onMounted(async () => {
  try {
    const { data } = await api.get(`/erp/uom/${route.params.id}`)
    const u = data.data.uom
    form.value = { name: u.name, abbreviation: u.abbreviation, description: u.description || '', status: u.status, activeFrom: u.activeFrom || '', activeTo: u.activeTo || '' }
  } catch {
    notFound.value = true
  } finally {
    loading.value = false
  }
})

async function save() {
  error.value = ''
  resetErrors()
  if (!form.value.name.trim()) { setField('name', t('common.errors.required', { field: t('erp.uom.name') })); return }
  if (!form.value.abbreviation.trim()) { setField('abbreviation', t('common.errors.required', { field: t('erp.uom.code') })); return }
  saving.value = true
  try {
    await api.put(`/erp/uom/${route.params.id}`, form.value)
    router.push('/erp/uom')
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
    await api.delete(`/erp/uom/${route.params.id}`)
    router.push('/erp/uom')
  } catch (err) {
    error.value = err.response?.data?.message || 'Delete failed'
  }
}
</script>
