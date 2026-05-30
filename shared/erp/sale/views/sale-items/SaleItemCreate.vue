<template>
  <AppLayout>
    <div class="space-y-6">

      <PageHeader :title="t('erp.saleItems.new')" back-to="/erp/sale-items"
        :breadcrumb="[
          { label: t('erp.saleItems.title'), to: '/erp/sale-items' },
          { label: t('common.create') },
        ]">
        <template #actions>
          <HeaderSaveActions
            cancel-to="/erp/sale-items"
            :cancel-label="t('common.cancel')"
            :saving="saving"
            :saving-label="t('erp.common.creating')"
            :save-label="t('erp.saleItems.create')"
            @save="save"
          />
        </template>
      </PageHeader>

      <FormCard :title="t('erp.saleItems.new')" :icon="TagIcon" icon-color="primary">
        <div class="grid grid-cols-2 gap-4">

          <!-- Code -->
          <FormField name="code" :label="t('erp.saleItems.code')" :errors="fieldErrors">
            <template #default="{ id }">
              <input v-if="!autoCode.enabled.value" :id="id" v-model="form.code" type="text"
                placeholder="e.g. SI-001" class="input font-mono" />
              <input v-else :id="id" :value="autoCode.preview.value" type="text" readonly
                class="input bg-[#F7F9FC] text-[#637381] font-mono cursor-not-allowed" />
              <label class="mt-1 flex items-center gap-2 text-xs text-[#637381] cursor-pointer select-none">
                <input type="checkbox" :checked="autoCode.enabled.value" @change="autoCode.toggle" />
                {{ t('erp.common.autoGenerate') }}
              </label>
            </template>
          </FormField>

          <!-- Status -->
          <div>
            <FieldLabel :text="t('erp.saleItems.status')" />
            <SearchSelect v-model="form.status" :options="statusOptions" :allow-empty="false" />
          </div>

          <!-- Name -->
          <FormField name="name" :label="t('erp.saleItems.name')" :errors="fieldErrors"
            v-model="form.name" placeholder="e.g. Standard Widget" required
            wrapper-class="col-span-2" />

          <!-- Product Master -->
          <div class="col-span-2">
            <FieldLabel :text="t('erp.saleItems.productMaster')" />
            <SearchSelect v-model="form.productId" :options="productOptions" placeholder="— None —" />
          </div>

        </div>
      </FormCard>

      <ErrorBanner :message="error" />

    </div>
  </AppLayout>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { TagIcon } from '@heroicons/vue/24/outline'
import AppLayout from '@/layouts/AppLayout.vue'
import SearchSelect from '@/components/SearchSelect.vue'
import PageHeader from '@/components/form/PageHeader.vue'
import FormCard from '@/components/form/FormCard.vue'
import FormField from '@/components/form/FormField.vue'
import FieldLabel from '@/components/form/FieldLabel.vue'
import ErrorBanner from '@/components/form/ErrorBanner.vue'
import HeaderSaveActions from '@/components/form/HeaderSaveActions.vue'
import { useFieldErrors } from '@/composables/useFieldErrors'
import api from '@/api'
import { useAutoCode } from '@/composables/useAutoCode'
import { useMasterDataStore } from '@/stores/masterData'
import { parseApiError } from '@/utils/apiError'

const { t } = useI18n()
const router   = useRouter()
const form     = ref({ code: '', name: '', productId: '', status: 'active' })
const autoCode = useAutoCode('SI')
const masterDataStore  = useMasterDataStore()
const saleItemStatuses = ref([])
const products = ref([])
const error    = ref('')
const saving   = ref(false)
const { fieldErrors, setFromError, setField, reset: resetErrors } = useFieldErrors()

const statusOptions  = computed(() =>
  saleItemStatuses.value.length
    ? saleItemStatuses.value.map(s => ({ id: s.code || s.name, name: s.name }))
    : [{ id: 'active', name: t('common.active') }, { id: 'inactive', name: t('common.inactive') }]
)
const productOptions = computed(() => products.value.map(p => ({ id: p.id, name: p.sku ? `${p.name} (${p.sku})` : p.name })))

onMounted(async () => {
  try {
    const { data } = await api.get('/erp/item-master', { params: { limit: 500, status: 'active' } })
    products.value = data.data.products
  } catch {
    products.value = []
  }
  try { saleItemStatuses.value = await masterDataStore.getValues('sale-item-statuses') } catch {}
})

async function save() {
  error.value = ''
  resetErrors()
  if (!form.value.name.trim()) { setField('name', t('common.errors.required', { field: t('erp.saleItems.name') })); return }
  saving.value = true
  try {
    const payload = {
      ...form.value,
      productId: form.value.productId || null,
      code:      form.value.code || null,
    }
    if (autoCode.enabled.value) { payload.autoCode = true; payload.code = null }
    await api.post('/erp/sale-items', payload)
    router.push('/erp/sale-items')
  } catch (err) {
    const had = setFromError(err)
    if (!had) error.value = parseApiError(err, 'Failed to create sale item')
  } finally {
    saving.value = false
  }
}
</script>
