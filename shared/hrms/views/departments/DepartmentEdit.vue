<template>
  <AppLayout>
    <div class="space-y-6">

      <PageHeader :title="t('erp.departments.edit')" back-to="/hrms/departments"
        :breadcrumb="[
          { label: t('erp.departments.title'), to: '/hrms/departments' },
          { label: t('erp.departments.edit') },
        ]">
        <template #actions>
          <HeaderSaveActions
            cancel-to="/hrms/departments"
            :cancel-label="t('common.cancel')"
            :saving="saving"
            :saving-label="t('erp.common.saving')"
            :save-label="t('common.saveChanges')"
            @save="save"
          />
        </template>
      </PageHeader>

      <div v-if="loading" class="text-[#9BA7B0] py-12 text-center">{{ t('common.loading') }}</div>

      <FormCard v-else :title="t('erp.departments.edit')" :icon="BuildingOfficeIcon" icon-color="primary">
        <div class="space-y-4">

          <FormField name="code" :errors="fieldErrors" v-model="form.code"
            hint="Short unique identifier for this department">
            <template #label>
              <span class="flex items-center justify-between">
                {{ t('erp.departments.code') }}
                <button type="button" @click="forceGenerate"
                  class="text-xs text-primary-500 hover:underline font-normal">
                  ↻ {{ t('erp.departments.generate') }}
                </button>
              </span>
            </template>
            <template #default="{ id, hasError }">
              <input :id="id" ref="codeInputRef" v-model="form.code" type="text" placeholder="e.g. ENG" maxlength="10"
                @input="form.code = form.code.toUpperCase()"
                :class="['input font-mono uppercase', hasError && 'input-error']" />
            </template>
          </FormField>

          <FormField name="name" :label="t('erp.departments.name')" :errors="fieldErrors"
            v-model="form.name" placeholder="e.g. Engineering" required />

          <FormField name="description" :label="t('erp.departments.description')" :errors="fieldErrors"
            v-model="form.description" textarea :rows="3"
            placeholder="Describe the functions of this department…" />

          <div class="grid grid-cols-2 gap-4">
            <FormField name="activeFrom" :label="t('erp.common.activeFrom')" :errors="fieldErrors">
              <template #default>
                <DateInput v-model="form.activeFrom" class="input" />
              </template>
            </FormField>
            <FormField name="activeTo" :label="t('erp.common.activeTo')" :errors="fieldErrors">
              <template #default>
                <DateInput v-model="form.activeTo" class="input" />
              </template>
            </FormField>
          </div>

          <div>
            <FieldLabel :text="t('erp.departments.status')" />
            <SearchSelect v-model="form.isActive" :options="STATUS_OPTIONS" :allow-empty="false" placeholder="— Select —" />
          </div>

        </div>
      </FormCard>

      <ErrorBanner :message="error" />

    </div>
  </AppLayout>
</template>

<script setup>
import { ref, computed, onMounted, nextTick } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter, useRoute } from 'vue-router'
import { BuildingOfficeIcon } from '@heroicons/vue/24/outline'
import AppLayout from '@/layouts/AppLayout.vue'
import DateInput from '@/components/DateInput.vue'
import SearchSelect from '@/components/SearchSelect.vue'
import PageHeader from '@/components/form/PageHeader.vue'
import FormCard from '@/components/form/FormCard.vue'
import FormField from '@/components/form/FormField.vue'
import FieldLabel from '@/components/form/FieldLabel.vue'
import ErrorBanner from '@/components/form/ErrorBanner.vue'
import HeaderSaveActions from '@/components/form/HeaderSaveActions.vue'
import { useFieldErrors } from '@/composables/useFieldErrors'
import api from '@/api'
import { parseApiError } from '@/utils/apiError'

const { t } = useI18n()
const router       = useRouter()
const route        = useRoute()
const id           = route.params.id
const codeInputRef = ref(null)
const loading      = ref(true)
const saving  = ref(false)
const error   = ref('')
const { fieldErrors, setFromError, setField, reset: resetErrors } = useFieldErrors()

const STATUS_OPTIONS = computed(() => [
  { id: true,  name: t('common.active') },
  { id: false, name: t('common.inactive') },
])

const form = ref({
  name: '',
  code: '',
  description: '',
  isActive: true,
  activeFrom: '',
  activeTo: '',
})

onMounted(async () => {
  try {
    const { data } = await api.get(`/hrms/departments/${id}`)
    const d = data.data
    form.value = {
      name: d.name,
      code: d.code || '',
      description: d.description || '',
      isActive: d.isActive,
      activeFrom: d.activeFrom || '',
      activeTo: d.activeTo || '',
    }
  } catch (err) {
    error.value = 'Failed to load department'
  } finally {
    loading.value = false
    await nextTick()
    codeInputRef.value?.focus()
  }
})

async function forceGenerate() {
  try {
    const { data } = await api.get('/erp/sequences/preview/DEP')
    form.value.code = data.data.preview
  } catch {
    // leave existing code unchanged if preview fetch fails
  }
}

async function save() {
  error.value = ''
  resetErrors()
  if (!form.value.name.trim()) { setField('name', t('common.errors.required', { field: t('erp.departments.name') })); return }

  saving.value = true
  try {
    await api.put(`/hrms/departments/${id}`, form.value)
    router.push('/hrms/departments')
  } catch (err) {
    const had = setFromError(err)
    if (!had) error.value = parseApiError(err, 'Failed to save changes')
  } finally {
    saving.value = false
  }
}
</script>
