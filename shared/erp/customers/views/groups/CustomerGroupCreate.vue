<template>
  <AppLayout>
    <div class="space-y-6">

      <div class="flex items-center gap-3">
        <RouterLink to="/erp/customer-groups" class="text-[#9BA7B0] hover:text-[#637381] transition">
          <ArrowLeftIcon class="w-5 h-5" />
        </RouterLink>
        <h1 class="text-2xl font-bold text-[#1C2434]">{{ t('erp.customerGroups.new') }}</h1>
      </div>

      <div class="bg-white border border-[#E2E8F0] p-6 space-y-5">

        <div class="grid grid-cols-2 gap-4">
          <div class="col-span-2">
            <FormField name="code" :label="t('erp.customerGroups.code')" :errors="fieldErrors">
              <template #default="{ id }">
                <input v-if="!autoCode.enabled.value" :id="id" v-model="form.code" type="text" placeholder="e.g. GRP-001" class="input font-mono" />
                <input v-else :id="id" :value="autoCode.preview.value" type="text" readonly class="input bg-[#F7F9FC] text-[#637381] font-mono cursor-not-allowed" />
              </template>
            </FormField>
            <label class="mt-1 flex items-center gap-2 text-xs text-[#637381] cursor-pointer select-none">
              <input type="checkbox" :checked="autoCode.enabled.value" @change="autoCode.toggle" />
              {{ t('erp.common.autoGenerate') }}
            </label>
          </div>
          <FormField v-model="form.name" name="name" :label="t('erp.customerGroups.name')" :placeholder="t('erp.customerGroups.name')" required :errors="fieldErrors" wrapper-class="col-span-2" />
          <FormField v-model="form.description" name="description" textarea :rows="3" :label="t('erp.customerGroups.description')" :placeholder="t('erp.customerGroups.description')" :errors="fieldErrors" wrapper-class="col-span-2" />
          <div class="grid grid-cols-2 gap-4">
            <DateInputWithLabel v-model="form.activeFrom" :label="t('erp.common.activeFrom')" />
            <DateInputWithLabel v-model="form.activeTo" :label="t('erp.common.activeTo')" />
          </div>
          <SearchSelectWithLabel v-model="form.status" :label="t('erp.customerGroups.status')" :options="STATUS_OPTIONS" :allow-empty="false" />
        </div>

        <div v-if="error" class="bg-red-50 text-red-700 text-sm px-4 py-2">{{ error }}</div>

        <div class="flex justify-end gap-3 pt-2">
          <AppButton to="/erp/customer-groups" variant="secondary">{{ t('common.cancel') }}</AppButton>
          <AppButton @click="save" :loading="saving">
            {{ saving ? t('erp.common.creating') : t('erp.customerGroups.create') }}
          </AppButton>
        </div>

      </div>
    </div>
  </AppLayout>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { ArrowLeftIcon } from '@heroicons/vue/24/outline'
import AppLayout from '@/layouts/AppLayout.vue'
import AppButton from '@/components/AppButton.vue'
import DateInputWithLabel from '@/components/DateInputWithLabel.vue'
import SearchSelectWithLabel from '@/components/SearchSelectWithLabel.vue'
import FormField from '@/components/form/FormField.vue'
import { useFieldErrors } from '@/composables/useFieldErrors'
import api from '@/api'
import { useAutoCode } from '@/composables/useAutoCode'
import { parseApiError } from '@/utils/apiError'

const { t } = useI18n()
const STATUS_OPTIONS = computed(() => [
  { id: 'active',   name: t('common.active') },
  { id: 'inactive', name: t('common.inactive') },
])
const router   = useRouter()
const autoCode = useAutoCode('CGP')
const form     = ref({ code: '', name: '', description: '', status: 'active', activeFrom: '', activeTo: '' })
const error    = ref('')
const saving   = ref(false)
const { fieldErrors, setFromError, setField, reset: resetErrors } = useFieldErrors()

async function save() {
  error.value = ''
  resetErrors()
  if (!form.value.name.trim()) { setField('name', t('common.errors.required', { field: t('erp.customerGroups.name') })); return }
  saving.value = true
  try {
    const payload = { ...form.value }
    if (autoCode.enabled.value) { payload.autoCode = true; payload.code = null }
    await api.post('/erp/customer-groups', payload)
    router.push('/erp/customer-groups')
  } catch (err) {
    const had = setFromError(err)
    if (!had) error.value = parseApiError(err, 'Failed to create group')
  } finally {
    saving.value = false
  }
}
</script>
