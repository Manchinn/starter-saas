<template>
  <AppLayout>
    <div class="space-y-6">

      <div class="flex items-center justify-between gap-3">
        <div class="flex items-center gap-3">
          <RouterLink to="/erp/product-categories" class="text-[#9BA7B0] hover:text-[#637381] transition">
            <ArrowLeftIcon class="w-5 h-5" />
          </RouterLink>
          <h1 class="text-2xl font-bold text-[#1C2434]">{{ t('erp.productCategories.new') }}</h1>
        </div>

        <KeyboardShortcuts :shortcuts="shortcuts" width="w-56" />
      </div>

      <div class="bg-white border border-[#E2E8F0] p-6 space-y-5">

        <div class="grid grid-cols-2 gap-4">
          <div>
            <FormField name="code" :label="t('erp.productCategories.code')" :errors="fieldErrors">
              <template #default="{ id }">
                <input v-if="!autoCode.enabled.value" :id="id" ref="codeInputRef" v-model="form.code" type="text" placeholder="e.g. ELEC" class="input font-mono" />
                <input v-else :id="id" :value="autoCode.preview.value" type="text" readonly class="input bg-[#F7F9FC] text-[#637381] font-mono cursor-not-allowed" />
              </template>
            </FormField>
            <label class="mt-1 flex items-center gap-2 text-xs text-[#637381] cursor-pointer select-none">
              <input type="checkbox" :checked="autoCode.enabled.value" @change="autoCode.toggle" />
              {{ t('erp.common.autoGenerate') }}
            </label>
          </div>
          <FormField v-model="form.name" name="name" :label="t('erp.productCategories.name')" placeholder="e.g. Electronics" required :errors="fieldErrors" />
          <SearchSelectWithLabel v-model="form.parentId" :label="t('erp.productCategories.parentCategory')" :options="topLevelCategories" placeholder="— None (top-level) —" wrapper-class="col-span-2" />
          <FormField v-model="form.description" name="description" textarea :rows="3" :label="t('erp.productCategories.description')" placeholder="Optional description…" :errors="fieldErrors" wrapper-class="col-span-2" />
          <div class="grid grid-cols-2 gap-4">
            <DateInputWithLabel v-model="form.activeFrom" :label="t('erp.common.activeFrom')" />
            <DateInputWithLabel v-model="form.activeTo" :label="t('erp.common.activeTo')" />
          </div>
          <SearchSelectWithLabel v-model="form.status" :label="t('erp.productCategories.status')" :options="statusOptions" :allow-empty="false" />
        </div>

        <div v-if="error" class="bg-red-50 text-red-700 text-sm px-4 py-2">{{ error }}</div>

        <div class="flex justify-end gap-3 pt-2">
          <AppButton to="/erp/product-categories" variant="secondary">{{ t('common.cancel') }}</AppButton>
          <AppButton @click="save" :loading="saving">
            {{ saving ? t('erp.common.creating') : t('erp.productCategories.create') }}
          </AppButton>
        </div>

      </div>
    </div>
  </AppLayout>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { RouterLink, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { ArrowLeftIcon } from '@heroicons/vue/24/outline'
import AppLayout from '@/layouts/AppLayout.vue'
import AppButton from '@/components/AppButton.vue'
import KeyboardShortcuts from '@/components/KeyboardShortcuts.vue'
import FormField from '@/components/form/FormField.vue'
import SearchSelectWithLabel from '@/components/SearchSelectWithLabel.vue'
import DateInputWithLabel from '@/components/DateInputWithLabel.vue'
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
const router        = useRouter()
const form          = ref({ code: '', name: '', description: '', parentId: '', status: 'active', activeFrom: '', activeTo: '' })
const autoCode      = useAutoCode('CAT')
const allCategories = ref([])
const error         = ref('')
const saving        = ref(false)
const { fieldErrors, setFromError, setField, reset: resetErrors } = useFieldErrors()

const codeInputRef = ref(null)

const topLevelCategories = computed(() => allCategories.value.filter(c => !c.parentId))

const { shortcuts } = useFormShortcuts({
  save: () => save(),
  cancel: () => router.push('/erp/product-categories'),
})

onMounted(async () => {
  if (!autoCode.enabled.value) codeInputRef.value?.focus()
  try {
    const { data } = await api.get('/erp/product-categories/all')
    allCategories.value = data.data.categories
  } catch (err) {
    console.error('Failed to load categories:', err.message)
  }
})

async function save() {
  error.value = ''
  resetErrors()
  if (!form.value.name.trim()) { setField('name', t('common.errors.required', { field: t('erp.productCategories.name') })); return }
  saving.value = true
  try {
    const payload = { ...form.value, parentId: form.value.parentId || null }
    if (autoCode.enabled.value) { payload.autoCode = true; payload.code = null }
    await api.post('/erp/product-categories', payload)
    router.push('/erp/product-categories')
  } catch (err) {
    const had = setFromError(err)
    if (!had) error.value = parseApiError(err, 'Failed to create category')
  } finally {
    saving.value = false
  }
}
</script>
