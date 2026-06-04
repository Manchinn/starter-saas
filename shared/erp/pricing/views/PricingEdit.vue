<template>
  <AppLayout>
    <div class="space-y-6">

      <PageHeader :title="t('erp.pricing.edit')" back-to="/erp/pricing"
        :breadcrumb="[
          { label: t('erp.pricing.title'), to: '/erp/pricing' },
          { label: t('erp.pricing.edit') },
        ]">
        <template #actions>
          <KeyboardShortcuts :shortcuts="shortcuts" width="w-48" />
          <HeaderSaveActions
            cancel-to="/erp/pricing"
            :cancel-label="t('common.cancel')"
            :saving="saving"
            :saving-label="t('erp.common.saving')"
            :save-label="t('common.saveChanges')"
            @save="save"
          />
        </template>
      </PageHeader>

      <div v-if="loading" class="text-[#9BA7B0] py-12 text-center">{{ t('common.loading') }}</div>

      <FormCard v-else :title="t('erp.pricing.edit')" :icon="TagIcon" icon-color="primary">
        <div class="grid grid-cols-2 gap-4">

          <FormField name="code" :label="t('erp.pricing.code')" :errors="fieldErrors">
            <template #default="{ id, errorClass }">
              <input :id="id" ref="codeInputRef" v-model="form.code" type="text"
                placeholder="e.g. PL-001" :class="['input font-mono', errorClass]" />
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
import { useRouter, useRoute } from 'vue-router'
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
import { parseApiError } from '@/utils/apiError'

const { t } = useI18n()
const router = useRouter()
const route  = useRoute()
const id     = route.params.id

const { shortcuts } = useFormShortcuts({
  save: () => save(),
  cancel: () => router.push('/erp/pricing'),
  cancelLabel: 'Back to list',
})

const form      = ref({ code: '', name: '', description: '', unitPrice: 0, status: 'active', activeFrom: '', activeTo: '', saleItemId: '', customerGroupId: '' })
const codeInputRef = ref(null)
const groups    = ref([])
const saleItems = ref([])
const loading   = ref(true)
const saving    = ref(false)
const error     = ref('')
const { fieldErrors, setFromError, setField, reset: resetErrors } = useFieldErrors()

const statusOptions   = computed(() => [
  { id: 'active',   name: t('common.active')   },
  { id: 'inactive', name: t('common.inactive') },
])
const saleItemOptions = computed(() => saleItems.value.map(si => ({ id: si.id, name: si.code ? `${si.name} (${si.code})` : si.name })))

onMounted(async () => {
  try {
    const [pricingRes, groupsRes, saleItemsRes] = await Promise.all([
      api.get(`/erp/pricing/${id}`),
      api.get('/erp/customer-groups/all'),
      api.get('/erp/sale-items', { params: { limit: 500, status: 'active' } }),
    ])
    const p = pricingRes.data.data.pricing
    groups.value    = groupsRes.data.data.groups
    saleItems.value = saleItemsRes.data.data.items
    form.value = {
      code:            p.code            || '',
      name:            p.name,
      description:     p.description     || '',
      unitPrice:       Number(p.unitPrice),
      status:          p.status,
      activeFrom:      p.activeFrom      || '',
      activeTo:        p.activeTo        || '',
      saleItemId:      p.saleItemId      || '',
      customerGroupId: p.customerGroupId || '',
    }
  } catch (err) {
    error.value = err.response?.data?.message || 'Failed to load price list'
  } finally {
    loading.value = false
    await nextTick()
    codeInputRef.value?.focus()
  }
})


async function save() {
  error.value = ''
  resetErrors()
  if (!form.value.name.trim()) { setField('name', t('common.errors.required', { field: t('erp.pricing.name') })); return }
  saving.value = true
  try {
    await api.put(`/erp/pricing/${id}`, {
      ...form.value,
      saleItemId:      form.value.saleItemId      || null,
      customerGroupId: form.value.customerGroupId || null,
    })
    router.push('/erp/pricing')
  } catch (err) {
    const had = setFromError(err)
    if (!had) error.value = parseApiError(err, 'Failed to save')
  } finally {
    saving.value = false
  }
}
</script>
