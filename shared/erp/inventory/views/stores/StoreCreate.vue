<template>
  <AppLayout>
    <div class="space-y-6">

      <PageHeader :title="t('erp.stores.new')" back-to="/erp/stores">
        <template #actions>
          <KeyboardShortcuts :shortcuts="shortcuts" width="w-56" />
        </template>
      </PageHeader>

      <div class="bg-white border border-[#E2E8F0] p-6 space-y-5">
        <div class="grid grid-cols-2 gap-4">
          <div class="col-span-2 sm:col-span-1">
            <FormField name="code" :label="t('erp.stores.code')" :errors="fieldErrors">
              <template #default="{ id }">
                <input v-if="!autoCode.enabled.value" :id="id" ref="codeInputRef" v-model="form.code" type="text" placeholder="e.g. WH-001" class="input font-mono" />
                <input v-else :id="id" :value="autoCode.preview.value" type="text" readonly class="input bg-[#F7F9FC] text-[#637381] font-mono cursor-not-allowed" />
              </template>
            </FormField>
            <label class="mt-1 flex items-center gap-2 text-xs text-[#637381] cursor-pointer select-none">
              <input type="checkbox" :checked="autoCode.enabled.value" @change="autoCode.toggle" />
              {{ t('erp.common.autoGenerate') }}
            </label>
          </div>
          <FormField v-model="form.name" name="name" :label="t('erp.stores.name')" placeholder="e.g. Main Warehouse" required :errors="fieldErrors" wrapper-class="col-span-2 sm:col-span-1" />
          <FormField v-model="form.phone" name="phone" :label="t('erp.stores.phone')" placeholder="+1 555 000 0000" :errors="fieldErrors" wrapper-class="col-span-2 sm:col-span-1" />
          <FormField v-model="form.email" name="email" type="email" :label="t('erp.stores.email')" placeholder="store@example.com" :errors="fieldErrors" wrapper-class="col-span-2 sm:col-span-1" />
          <FormField v-model="form.address" name="address" textarea :rows="2" :label="t('erp.stores.address')" placeholder="Street, City, Country" :errors="fieldErrors" wrapper-class="col-span-2" />
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
            <FieldLabel :text="t('erp.stores.status')" />
            <SearchSelect v-model="form.status" :options="statusOptions" :allow-empty="false" />
          </div>
        </div>

        <ErrorBanner :message="error" />

        <div class="flex justify-end gap-3 pt-2">
          <AppButton to="/erp/stores" variant="secondary">{{ t('common.cancel') }}</AppButton>
          <AppButton @click="save" :loading="saving">
            {{ saving ? t('erp.common.creating') : t('erp.stores.create') }}
          </AppButton>
        </div>
      </div>

    </div>
  </AppLayout>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import AppLayout from '@/layouts/AppLayout.vue'
import AppButton from '@/components/AppButton.vue'
import KeyboardShortcuts from '@/components/KeyboardShortcuts.vue'
import SearchSelect from '@/components/SearchSelect.vue'
import PageHeader from '@/components/form/PageHeader.vue'
import FieldLabel from '@/components/form/FieldLabel.vue'
import FormField from '@/components/form/FormField.vue'
import ErrorBanner from '@/components/form/ErrorBanner.vue'
import { useFieldErrors } from '@/composables/useFieldErrors'
import api from '@/api'
import { useAutoCode } from '@/composables/useAutoCode'
import { useFormShortcuts } from '@/composables/useShortcuts'
import { parseApiError } from '@/utils/apiError'

const { t } = useI18n()

const statusOptions = computed(() => [
  { id: 'active',   name: t('common.active')   },
  { id: 'inactive', name: t('common.inactive') },
])
const router   = useRouter()
const form     = ref({ name: '', code: '', phone: '', email: '', address: '', status: 'active', activeFrom: '', activeTo: '' })
const error    = ref('')
const saving   = ref(false)
const autoCode = useAutoCode('WHS')
const { fieldErrors, setFromError, setField, reset: resetErrors } = useFieldErrors()

const codeInputRef = ref(null)

const { shortcuts } = useFormShortcuts({
  save: () => save(),
  cancel: () => router.push('/erp/stores'),
})

onMounted(() => {
  if (!autoCode.enabled.value) codeInputRef.value?.focus()
})

async function save() {
  error.value = ''
  resetErrors()
  if (!form.value.name.trim()) { setField('name', t('common.errors.required', { field: t('erp.stores.name') })); return }
  saving.value = true
  try {
    const payload = { ...form.value }
    if (autoCode.enabled.value) { payload.autoCode = true; payload.code = null }
    await api.post('/erp/stores', payload)
    router.push('/erp/stores')
  } catch (err) {
    const had = setFromError(err)
    if (!had) error.value = parseApiError(err, 'Failed to create store')
  } finally {
    saving.value = false
  }
}
</script>
