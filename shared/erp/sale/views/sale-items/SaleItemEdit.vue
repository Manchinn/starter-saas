<template>
  <AppLayout>
    <div class="space-y-6">

      <PageHeader :title="t('erp.saleItems.edit')" back-to="/erp/sale-items"
        :breadcrumb="[
          { label: t('erp.saleItems.title'), to: '/erp/sale-items' },
          { label: t('erp.saleItems.edit') },
        ]">
        <template #actions>
          <KeyboardShortcuts :shortcuts="shortcuts" width="w-48" />
          <HeaderSaveActions
            cancel-to="/erp/sale-items"
            :cancel-label="t('common.cancel')"
            :saving="saving"
            :saving-label="t('erp.common.saving')"
            :save-label="t('common.saveChanges')"
            @save="save"
          />
        </template>
      </PageHeader>

      <div v-if="loading" class="text-[#9BA7B0] py-12 text-center">{{ t('common.loading') }}</div>

      <FormCard v-else :title="t('erp.saleItems.edit')" :icon="TagIcon" icon-color="primary">
        <div class="grid grid-cols-2 gap-4">

          <FormField name="code" :label="t('erp.saleItems.code')" :errors="fieldErrors"
            v-model="form.code" placeholder="e.g. SI-001" input-class="font-mono" />

          <div>
            <FieldLabel :text="t('erp.saleItems.status')" />
            <SearchSelect v-model="form.status" :options="statusOptions" :allow-empty="false" />
          </div>

          <FormField name="name" :label="t('erp.saleItems.name')" :errors="fieldErrors"
            v-model="form.name" required wrapper-class="col-span-2" />

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
import { useRouter, useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { TagIcon } from '@heroicons/vue/24/outline'
import AppLayout from '@/layouts/AppLayout.vue'
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
import { useMasterDataStore } from '@/stores/masterData'
import { parseApiError } from '@/utils/apiError'

const { t } = useI18n()
const router  = useRouter()
const route   = useRoute()
const id      = route.params.id

const { shortcuts } = useFormShortcuts({
  save: () => save(),
  cancel: () => router.push('/erp/sale-items'),
  cancelLabel: 'Back to list',
})

const form     = ref({ code: '', name: '', productId: '', status: 'active' })
const masterDataStore  = useMasterDataStore()
const saleItemStatuses = ref([])
const products = ref([])
const loading  = ref(true)
const saving   = ref(false)
const error    = ref('')
const { fieldErrors, setFromError, setField, reset: resetErrors } = useFieldErrors()

const statusOptions  = computed(() =>
  saleItemStatuses.value.length
    ? saleItemStatuses.value.map(s => ({ id: s.code || s.name, name: s.name }))
    : [{ id: 'active', name: t('common.active') }, { id: 'inactive', name: t('common.inactive') }]
)
const productOptions = computed(() => products.value.map(p => ({ id: p.id, name: p.sku ? `${p.name} (${p.sku})` : p.name })))

onMounted(async () => {
  try {
    const [itemRes, prodRes] = await Promise.all([
      api.get(`/erp/sale-items/${id}`),
      api.get('/erp/item-master', { params: { limit: 500, status: 'active' } }),
    ])
    const s = itemRes.data.data.item
    products.value = prodRes.data.data.products
    form.value = {
      code:      s.code      || '',
      name:      s.name,
      productId: s.productId || '',
      status:    s.status,
    }
  } catch (err) {
    error.value = err.response?.data?.message || 'Failed to load sale item'
  } finally {
    loading.value = false
  }
  try { saleItemStatuses.value = await masterDataStore.getValues('sale-item-statuses') } catch {}
})


async function save() {
  error.value = ''
  resetErrors()
  if (!form.value.name.trim()) { setField('name', t('common.errors.required', { field: t('erp.saleItems.name') })); return }
  saving.value = true
  try {
    await api.put(`/erp/sale-items/${id}`, {
      ...form.value,
      productId: form.value.productId || null,
      code:      form.value.code      || null,
    })
    router.push('/erp/sale-items')
  } catch (err) {
    const had = setFromError(err)
    if (!had) error.value = parseApiError(err, 'Failed to save')
  } finally {
    saving.value = false
  }
}
</script>
