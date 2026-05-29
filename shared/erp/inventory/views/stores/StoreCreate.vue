<template>
  <AppLayout>
    <div class="space-y-6">

      <div class="flex items-center gap-3">
        <RouterLink to="/erp/stores" class="text-[#9BA7B0] hover:text-[#637381] transition">
          <ArrowLeftIcon class="w-5 h-5" />
        </RouterLink>
        <h1 class="text-2xl font-bold text-[#1C2434]">{{ t('erp.stores.new') }}</h1>
      </div>

      <div class="bg-white border border-[#E2E8F0] p-6 space-y-5">
        <div class="grid grid-cols-2 gap-4">
          <div class="col-span-2 sm:col-span-1">
            <FormField name="code" :label="t('erp.stores.code')" :errors="fieldErrors">
              <template #default="{ id }">
                <input v-if="!autoCode.enabled.value" :id="id" v-model="form.code" type="text" placeholder="e.g. WH-001" class="input font-mono" />
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
            <DateInputWithLabel v-model="form.activeFrom" :label="t('erp.common.activeFrom')" />
            <DateInputWithLabel v-model="form.activeTo" :label="t('erp.common.activeTo')" />
          </div>
          <SearchSelectWithLabel v-model="form.status" :label="t('erp.stores.status')" :options="statusOptions" :allow-empty="false" />
        </div>

        <div v-if="error" class="bg-red-50 text-red-700 text-sm px-4 py-2">{{ error }}</div>

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
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { ArrowLeftIcon } from '@heroicons/vue/24/outline'
import AppLayout from '@/layouts/AppLayout.vue'
import AppButton from '@/components/AppButton.vue'
import FormField from '@/components/form/FormField.vue'
import DateInputWithLabel from '@/components/DateInputWithLabel.vue'
import SearchSelectWithLabel from '@/components/SearchSelectWithLabel.vue'
import { useFieldErrors } from '@/composables/useFieldErrors'
import api from '@/api'
import { useAutoCode } from '@/composables/useAutoCode'
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
