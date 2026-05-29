<template>
  <AppLayout>
    <div class="space-y-6">

      <div class="flex items-center gap-3">
        <RouterLink to="/erp/product-categories" class="text-[#9BA7B0] hover:text-[#637381] transition">
          <ArrowLeftIcon class="w-5 h-5" />
        </RouterLink>
        <h1 class="text-xl font-semibold text-[#1C2434]">{{ t('erp.productCategories.edit') }}</h1>
      </div>

      <div v-if="loading" class="text-center py-12 text-[#9BA7B0]">
        <div class="inline-block w-5 h-5 border-2 border-primary-500 border-t-transparent animate-spin" />
      </div>

      <template v-else>

        <div class="bg-white border border-[#E2E8F0] shadow-sm overflow-hidden">
          <div class="px-6 py-4 border-b border-[#E2E8F0]">
            <h2 class="text-sm font-semibold text-[#374151]">{{ t('erp.productCategories.edit') }}</h2>
          </div>
          <div class="px-6 py-5">
            <div class="grid grid-cols-2 gap-4">
              <FormField v-model="form.code" name="code" :label="t('erp.productCategories.code')" placeholder="e.g. ELEC" input-class="font-mono" :errors="fieldErrors" />
              <FormField v-model="form.name" name="name" :label="t('erp.productCategories.name')" placeholder="e.g. Electronics" required :errors="fieldErrors" />
              <SearchSelectWithLabel v-model="form.parentId" :label="t('erp.productCategories.parentCategory')" :options="editableParents" placeholder="— None (top-level) —" wrapper-class="col-span-2" />
              <FormField v-model="form.description" name="description" textarea :rows="3" :label="t('erp.productCategories.description')" placeholder="Optional description…" :errors="fieldErrors" wrapper-class="col-span-2" />
              <div class="grid grid-cols-2 gap-4">
                <DateInputWithLabel v-model="form.activeFrom" :label="t('erp.common.activeFrom')" />
                <DateInputWithLabel v-model="form.activeTo" :label="t('erp.common.activeTo')" />
              </div>
              <SearchSelectWithLabel v-model="form.status" :label="t('erp.productCategories.status')" :options="statusOptions" :allow-empty="false" />
            </div>
          </div>
        </div>

        <div v-if="error"
          class="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3">
          <ExclamationCircleIcon class="w-4 h-4 flex-shrink-0" />
          {{ error }}
        </div>

        <div class="flex justify-end gap-3">
          <AppButton to="/erp/product-categories" variant="secondary">{{ t('common.cancel') }}</AppButton>
          <AppButton @click="save" :loading="saving">
            {{ saving ? t('erp.common.saving') : t('common.saveChanges') }}
          </AppButton>
        </div>

      </template>
    </div>
  </AppLayout>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { ArrowLeftIcon, ExclamationCircleIcon } from '@heroicons/vue/24/outline'
import AppLayout from '@/layouts/AppLayout.vue'
import AppButton from '@/components/AppButton.vue'
import FormField from '@/components/form/FormField.vue'
import SearchSelectWithLabel from '@/components/SearchSelectWithLabel.vue'
import DateInputWithLabel from '@/components/DateInputWithLabel.vue'
import { useFieldErrors } from '@/composables/useFieldErrors'
import api from '@/api'
import { parseApiError } from '@/utils/apiError'

const { t }  = useI18n()

const statusOptions = computed(() => [
  { id: 'active',   name: t('common.active')   },
  { id: 'inactive', name: t('common.inactive') },
])
const route  = useRoute()
const router = useRouter()

const allCategories = ref([])
const loading = ref(true)
const saving  = ref(false)
const error   = ref('')
const { fieldErrors, setFromError, setField, reset: resetErrors } = useFieldErrors()

const form = ref({ code: '', name: '', description: '', parentId: '', status: 'active', activeFrom: '', activeTo: '' })

const editableParents = computed(() =>
  allCategories.value.filter(c => !c.parentId && String(c.id) !== route.params.id)
)

onMounted(async () => {
  try {
    const { data } = await api.get('/erp/product-categories/all')
    allCategories.value = data.data.categories
    const c = allCategories.value.find(c => String(c.id) === route.params.id)
    if (!c) { router.push('/erp/product-categories'); return }
    form.value = { code: c.code || '', name: c.name, description: c.description || '', parentId: c.parentId || '', status: c.status, activeFrom: c.activeFrom || '', activeTo: c.activeTo || '' }
  } catch {
    router.push('/erp/product-categories')
  } finally {
    loading.value = false
  }
})

async function save() {
  error.value = ''
  resetErrors()
  if (!form.value.name.trim()) { setField('name', t('common.errors.required', { field: t('erp.productCategories.name') })); return }
  saving.value = true
  try {
    await api.put(`/erp/product-categories/${route.params.id}`, { ...form.value, parentId: form.value.parentId || null })
    router.push('/erp/product-categories')
  } catch (err) {
    const had = setFromError(err)
    if (!had) error.value = parseApiError(err, 'Failed to save')
  } finally {
    saving.value = false
  }
}
</script>
