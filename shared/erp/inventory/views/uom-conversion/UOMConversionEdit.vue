<template>
  <AppLayout>
    <div class="space-y-6">

      <PageHeader :title="t('erp.uomConversion.editTitle')" back-to="/erp/uom-conversion"
        :breadcrumb="[{ label: t('erp.uomConversion.editDesc') }]">
        <template #actions>
          <KeyboardShortcuts :shortcuts="shortcuts" width="w-56" />
        </template>
      </PageHeader>

      <LoadingSpinner v-if="loading" />

      <template v-else>

        <FormCard :title="t('erp.uomConversion.conversionDetails')">
          <div class="space-y-5">

            <div class="grid grid-cols-2 gap-5">
              <div>
                <FieldLabel :text="t('erp.uomConversion.fromUom')" required />
                <SearchSelect v-model="form.fromUomId" :options="uomOptions" :invalid="!!errorOf('fromUomId')" :placeholder="`— ${t('erp.uomConversion.selectUom')} —`" />
                <FieldError name="fromUomId" :errors="fieldErrors" />
              </div>
              <div>
                <FieldLabel :text="t('erp.uomConversion.toUom')" required />
                <SearchSelect v-model="form.toUomId" :options="uomOptions" :invalid="!!errorOf('toUomId')" :placeholder="`— ${t('erp.uomConversion.selectUom')} —`" />
                <FieldError name="toUomId" :errors="fieldErrors" />
              </div>
            </div>

            <div class="max-w-xs">
              <FieldLabel :text="t('erp.uomConversion.factor')" required />
              <input v-model.number="form.factor" type="number" min="0.000001" step="any" placeholder="e.g. 12"
                :class="['w-full px-3 py-2 border border-[#E2E8F0] text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent', errorOf('factor') && 'input-error']" />
              <FieldError name="factor" :errors="fieldErrors" />
              <p class="mt-1.5 text-xs text-[#9BA7B0]">
                1 <span class="font-semibold text-[#374151]">{{ fromUomLabel }}</span>
                =
                <span class="font-semibold text-primary-500">{{ form.factor || '?' }}</span>
                <span class="font-semibold text-[#374151]">{{ toUomLabel }}</span>
              </p>
            </div>

            <div>
              <FieldLabel :text="t('erp.uomConversion.notes')" />
              <input v-model="form.notes" type="text" :placeholder="t('erp.uomConversion.notesPlaceholder')"
                class="w-full px-3 py-2 border border-[#E2E8F0] text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent" />
            </div>

          </div>
        </FormCard>

        <ErrorBanner :message="error" />

        <div class="flex justify-end gap-3">
          <HeaderSaveActions cancel-to="/erp/uom-conversion" :cancel-label="t('common.cancel')"
            :save-label="t('common.saveChanges')" :saving-label="t('erp.common.saving')"
            :saving="saving" @save="save" />
        </div>

      </template>
    </div>
  </AppLayout>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import AppLayout from '@/layouts/AppLayout.vue'
import SearchSelect from '@/components/SearchSelect.vue'
import KeyboardShortcuts from '@/components/KeyboardShortcuts.vue'
import PageHeader from '@/components/form/PageHeader.vue'
import FormCard from '@/components/form/FormCard.vue'
import FieldLabel from '@/components/form/FieldLabel.vue'
import FieldError from '@/components/form/FieldError.vue'
import ErrorBanner from '@/components/form/ErrorBanner.vue'
import HeaderSaveActions from '@/components/form/HeaderSaveActions.vue'
import LoadingSpinner from '@/components/form/LoadingSpinner.vue'
import { useFieldErrors } from '@/composables/useFieldErrors'
import { useFormShortcuts } from '@/composables/useShortcuts'
import api from '@/api'
import { parseApiError } from '@/utils/apiError'

const { t }  = useI18n()
const route  = useRoute()
const router = useRouter()

const uoms    = ref([])
const loading = ref(true)
const saving  = ref(false)
const error   = ref('')
const { fieldErrors, setFromError, setField, reset: resetErrors, errorOf } = useFieldErrors()

const form = ref({ fromUomId: '', toUomId: '', factor: '', notes: '' })

const { shortcuts } = useFormShortcuts({
  save: () => save(),
  cancel: () => router.push('/erp/uom-conversion'),
})

const uomOptions   = computed(() => uoms.value.map(u => ({ id: u.id, name: `${u.name} (${u.abbreviation})` })))
const fromUomLabel = computed(() => uoms.value.find(u => u.id === form.value.fromUomId)?.abbreviation || '…')
const toUomLabel   = computed(() => uoms.value.find(u => u.id === form.value.toUomId)?.abbreviation   || '…')

onMounted(async () => {
  try {
    const [convRes, uomRes] = await Promise.all([
      api.get('/erp/uom-conversion'),
      api.get('/erp/uom', { params: { limit: 200 } }),
    ])
    uoms.value = uomRes.data.data.uoms.filter(u => u.status === 'active')
    const c = convRes.data.data.conversions.find(c => String(c.id) === route.params.id)
    if (!c) { router.push('/erp/uom-conversion'); return }
    form.value = { fromUomId: c.fromUomId, toUomId: c.toUomId, factor: Number(c.factor), notes: c.notes || '' }
  } catch {
    router.push('/erp/uom-conversion')
  } finally {
    loading.value = false
  }
})

async function save() {
  error.value = ''
  resetErrors()
  if (!form.value.fromUomId)                        { setField('fromUomId', t('common.errors.required', { field: t('erp.uomConversion.fromUom') })); return }
  if (!form.value.toUomId)                          { setField('toUomId',   t('common.errors.required', { field: t('erp.uomConversion.toUom') })); return }
  if (!form.value.factor || form.value.factor <= 0) { setField('factor',    t('common.errors.mustBeGreaterThan', { field: t('erp.uomConversion.factor'), min: 0 })); return }
  saving.value = true
  try {
    await api.put(`/erp/uom-conversion/${route.params.id}`, form.value)
    router.push('/erp/uom-conversion')
  } catch (err) {
    const had = setFromError(err)
    if (!had) error.value = parseApiError(err, 'Failed to save')
  } finally {
    saving.value = false
  }
}
</script>
