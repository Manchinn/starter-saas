<template>
  <AppLayout>
    <div class="space-y-6">

      <PageHeader :title="t('erp.uom.edit')" back-to="/erp/uom">
        <template #actions>
          <KeyboardShortcuts :shortcuts="shortcuts" width="w-56" />
        </template>
      </PageHeader>

      <LoadingSpinner v-if="loading" />
      <div v-else-if="notFound" class="bg-red-50 text-red-700 text-sm px-4 py-3">
        {{ t('erp.uom.notFound') }} <RouterLink to="/erp/uom" class="underline ml-1">{{ t('erp.common.backToList') }}</RouterLink>
      </div>

      <div v-else class="bg-white border border-[#E2E8F0] p-6 space-y-5">
        <div class="grid grid-cols-2 gap-4">
          <FormField name="abbreviation" :label="t('erp.uom.code')" required :errors="fieldErrors"
            wrapper-class="col-span-2 sm:col-span-1">
            <template #default="{ id, errorClass }">
              <input :id="id" ref="codeInputRef" v-model="form.abbreviation" type="text"
                :class="['input font-mono', errorClass]" />
            </template>
          </FormField>
          <FormField v-model="form.name" name="name" :label="t('erp.uom.name')"
            required :errors="fieldErrors" wrapper-class="col-span-2 sm:col-span-1" />
          <FormField v-model="form.description" name="description" :label="t('erp.uom.description')"
            textarea :rows="2" :errors="fieldErrors" wrapper-class="col-span-2" />
          <div class="grid grid-cols-2 gap-4">
            <div>
              <FieldLabel :text="t('erp.common.activeFrom')" />
              <DateInput v-model="form.activeFrom" class="input text-sm" />
            </div>
            <div>
              <FieldLabel :text="t('erp.common.activeTo')" />
              <DateInput v-model="form.activeTo" class="input text-sm" />
            </div>
          </div>
          <div>
            <FieldLabel :text="t('erp.uom.status')" />
            <SearchSelect v-model="form.status" :options="statusOptions" :allow-empty="false" />
          </div>
        </div>

        <ErrorBanner :message="error" />

        <div class="flex justify-between items-center pt-2">
          <button @click="confirmDelete" class="px-4 py-2 text-sm text-red-500 border border-red-200 hover:bg-red-50 transition">{{ t('erp.uom.deleteUom') }}</button>
          <div class="flex gap-3">
            <HeaderSaveActions cancel-to="/erp/uom" :cancel-label="t('common.cancel')"
              :save-label="t('common.saveChanges')" :saving-label="t('erp.common.saving')"
              :saving="saving" @save="save" />
          </div>
        </div>
      </div>

    </div>
  </AppLayout>
</template>

<script setup>
import { ref, computed, nextTick, onMounted } from 'vue'
import { useRoute, useRouter, RouterLink } from 'vue-router'
import { useI18n } from 'vue-i18n'
import AppLayout from '@/layouts/AppLayout.vue'
import SearchSelect from '@/components/SearchSelect.vue'
import KeyboardShortcuts from '@/components/KeyboardShortcuts.vue'
import PageHeader from '@/components/form/PageHeader.vue'
import FieldLabel from '@/components/form/FieldLabel.vue'
import FormField from '@/components/form/FormField.vue'
import ErrorBanner from '@/components/form/ErrorBanner.vue'
import HeaderSaveActions from '@/components/form/HeaderSaveActions.vue'
import LoadingSpinner from '@/components/form/LoadingSpinner.vue'
import { useFieldErrors } from '@/composables/useFieldErrors'
import { useFormShortcuts } from '@/composables/useShortcuts'
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
const { fieldErrors, setFromError, setField, reset: resetErrors } = useFieldErrors()

const codeInputRef = ref(null)

const { shortcuts } = useFormShortcuts({
  save: () => save(),
  cancel: () => router.push('/erp/uom'),
})

onMounted(async () => {
  try {
    const { data } = await api.get(`/erp/uom/${route.params.id}`)
    const u = data.data.uom
    form.value = { name: u.name, abbreviation: u.abbreviation, description: u.description || '', status: u.status, activeFrom: u.activeFrom || '', activeTo: u.activeTo || '' }
  } catch {
    notFound.value = true
  } finally {
    loading.value = false
    await nextTick()
    codeInputRef.value?.focus()
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
