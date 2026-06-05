<template>
  <AppLayout>
    <div class="space-y-6">

      <PageHeader :title="t('erp.pricing.new')" back-to="/erp/pricing"
        :breadcrumb="[
          { label: t('erp.pricing.title'), to: '/erp/pricing' },
          { label: t('common.create') },
        ]">
        <template #actions>
          <KeyboardShortcuts :shortcuts="shortcuts" width="w-48" />
          <HeaderSaveActions
            cancel-to="/erp/pricing"
            :cancel-label="t('common.cancel')"
            :saving="saving"
            :saving-label="t('erp.common.creating')"
            :save-label="t('erp.pricing.create')"
            @save="save"
          />
        </template>
      </PageHeader>

      <FormCard :title="t('erp.pricing.new')" :icon="TagIcon" icon-color="primary">
        <div class="grid grid-cols-2 gap-4">

          <FormField name="code" :label="t('erp.pricing.code')" :errors="fieldErrors">
            <template #default="{ id }">
              <input v-if="!autoCode.enabled.value" :id="id" ref="codeInputRef" v-model="form.code" type="text"
                placeholder="e.g. PL-001" class="input font-mono" />
              <input v-else :id="id" :value="autoCode.preview.value" type="text" readonly
                class="input bg-[#F7F9FC] text-[#637381] font-mono cursor-not-allowed" />
              <label class="mt-1 flex items-center gap-2 text-xs text-[#637381] cursor-pointer select-none">
                <input type="checkbox" :checked="autoCode.enabled.value" @change="autoCode.toggle" />
                {{ t('erp.common.autoGenerate') }}
              </label>
            </template>
          </FormField>

          <FormField name="name" :label="t('erp.pricing.name')" :errors="fieldErrors"
            v-model="form.name" placeholder="e.g. Standard Rate" required
            wrapper-class="col-span-2" />

          <FormField name="description" :label="t('erp.pricing.description')" :errors="fieldErrors"
            v-model="form.description" textarea :rows="2" placeholder="Optional notes…"
            wrapper-class="col-span-2" />

          <FormField name="unitPrice" :label="t('erp.pricing.unitPrice')" :errors="fieldErrors"
            v-model="form.unitPrice" type="number" min="0" step="0.01" required
            input-class="text-right" />

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
            <FieldLabel :text="t('erp.pricing.status')" />
            <SearchSelect v-model="form.status" :options="statusOptions" :allow-empty="false" />
          </div>

          <div>
            <FieldLabel :text="t('erp.pricing.customerGroup')" />
            <SearchSelect v-model="form.customerGroupId" :options="groups" placeholder="— None —" />
          </div>

          <div>
            <FieldLabel :text="t('erp.pricing.saleItem')" />
            <SearchSelect v-model="form.saleItemId" :options="saleItemOptions" placeholder="— None —" />
          </div>

        </div>
      </FormCard>

      <ErrorBanner :message="error" />

    </div>
  </AppLayout>
</template>

<script setup>
import { ref, computed, onMounted, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { TagIcon } from '@heroicons/vue/24/outline'
import AppLayout from '@/layouts/AppLayout.vue'
import DateInput from '@/components/DateInput.vue'
import SearchSelect from '@/components/SearchSelect.vue'
import KeyboardShortcuts from '@/components/KeyboardShortcuts.vue'
import { useFormShortcuts } from '@/composables/useShortcuts'
import PageHeader from '@/components/form/PageHeader.vue'
import FormCard from '@/components/form/FormCard.vue'
import FormField from '@/components/form/FormField.vue'
import FieldLabel from '@/components/form/FieldLabel.vue'
import ErrorBanner from '@/components/form/ErrorBanner.vue'
import HeaderSaveActions from '@/components/form/HeaderSaveActions.vue'
import { useFieldErrors } from '@/composables/useFieldErrors'
import api from '@/api'
import { useAutoCode } from '@/composables/useAutoCode'
import { parseApiError } from '@/utils/apiError'

const { t } = useI18n()
const router   = useRouter()

const { shortcuts } = useFormShortcuts({
  save: () => save(),
  cancel: () => router.push('/erp/pricing'),
  cancelLabel: 'Back to list',
})
const form      = ref({ code: '', name: '', description: '', unitPrice: 0, status: 'active', activeFrom: '', activeTo: '', saleItemId: '', customerGroupId: '' })
const autoCode  = useAutoCode('PRC')
const codeInputRef = ref(null)
const groups    = ref([])
const saleItems = ref([])
const error     = ref('')
const saving    = ref(false)
const { fieldErrors, setFromError, setField, reset: resetErrors } = useFieldErrors()

const statusOptions   = computed(() => [
  { id: 'active',   name: t('common.active')   },
  { id: 'inactive', name: t('common.inactive') },
])
const saleItemOptions = computed(() => saleItems.value.map(si => ({ id: si.id, name: si.code ? `${si.name} (${si.code})` : si.name })))

onMounted(async () => {
  const [groupsRes, saleItemsRes] = await Promise.allSettled([
    api.get('/erp/customer-groups/all'),
    api.get('/erp/sale-items', { params: { limit: 500, status: 'active' } }),
  ])
  if (groupsRes.status === 'fulfilled')    groups.value    = groupsRes.value.data.data.groups
  if (saleItemsRes.status === 'fulfilled') saleItems.value = saleItemsRes.value.data.data.items
  await nextTick()
  codeInputRef.value?.focus()
})


async function save() {
  error.value = ''
  resetErrors()
  if (!form.value.name.trim()) { setField('name', t('common.errors.required', { field: t('erp.pricing.name') })); return }
  saving.value = true
  try {
    const payload = { ...form.value, saleItemId: form.value.saleItemId || null, customerGroupId: form.value.customerGroupId || null }
    if (autoCode.enabled.value) { payload.autoCode = true; payload.code = null }
    await api.post('/erp/pricing', payload)
    router.push('/erp/pricing')
  } catch (err) {
    const had = setFromError(err)
    if (!had) error.value = parseApiError(err, 'Failed to create price list')
  } finally {
    saving.value = false
  }
}
</script>
