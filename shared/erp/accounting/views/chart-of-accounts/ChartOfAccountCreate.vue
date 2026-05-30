<template>
  <AppLayout>
    <div class="space-y-6">

      <PageHeader :title="t('erp.accounting.new')" back-to="/erp/accounting/chart-of-accounts"
        :breadcrumb="[
          { label: t('erp.accounting.title'), to: '/erp/accounting/chart-of-accounts' },
          { label: t('common.create') },
        ]">
        <template #actions>
          <HeaderSaveActions
            cancel-to="/erp/accounting/chart-of-accounts"
            :cancel-label="t('common.cancel')"
            :saving="saving"
            :saving-label="t('erp.common.creating')"
            :save-label="t('erp.accounting.create')"
            @save="save"
          />
        </template>
      </PageHeader>

      <FormCard :title="t('erp.accounting.new')" :icon="BuildingLibraryIcon" icon-color="primary">
        <div class="grid grid-cols-2 gap-4">

          <FormField name="code" :label="t('erp.accounting.code')" :errors="fieldErrors"
            v-model="form.code" placeholder="e.g. 1110" input-class="font-mono" required />

          <FormField name="name" :label="t('erp.accounting.name')" :errors="fieldErrors"
            v-model="form.name" :placeholder="t('erp.accounting.namePh')" required />

          <div>
            <FieldLabel :text="t('erp.accounting.accountType')" required />
            <template v-if="accountTypeOptions.length">
              <SearchSelect v-model="form.accountType"
                :options="accountTypeOptions" track-by="code" :placeholder="`— ${t('erp.accounting.selectType')} —`"
                :allow-empty="false" :invalid="!!fieldErrors.accountType" @change="onTypeChange" />
              <FieldError name="accountType" :errors="fieldErrors" />
            </template>
            <p v-else class="text-xs text-amber-600 mt-1 px-3 py-2 bg-amber-50 border border-amber-200">
              {{ t('erp.accounting.noAccountTypes') }}
              <RouterLink to="/erp/settings/master-data" class="underline font-medium">{{ t('erp.accounting.setupMasterData') }}</RouterLink>
            </p>
          </div>

          <div>
            <FieldLabel :text="t('erp.accounting.normalBalance')" />
            <SearchSelect v-model="form.normalBalance" :options="NORMAL_BALANCE_OPTIONS" :allow-empty="false" />
          </div>

          <div class="col-span-2">
            <FieldLabel :text="t('erp.accounting.parentAccount')" />
            <SearchSelect v-model="form.parentId" :options="parentOptions" :placeholder="`— ${t('erp.accounting.noParent')} —`">
              <template #option="{ option }">{{ option.code }} — {{ option.name }}</template>
              <template #singleLabel="{ option }">{{ option.code }} — {{ option.name }}</template>
            </SearchSelect>
          </div>

          <FormField name="description" :label="t('erp.accounting.description')" :errors="fieldErrors"
            v-model="form.description" textarea :rows="3" :placeholder="t('erp.accounting.descriptionPh')"
            wrapper-class="col-span-2" />

          <div>
            <FieldLabel :text="t('erp.accounting.status')" />
            <SearchSelect v-model="form.status" :options="STATUS_OPTIONS" :allow-empty="false" />
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
import { BuildingLibraryIcon } from '@heroicons/vue/24/outline'
import AppLayout from '@/layouts/AppLayout.vue'
import SearchSelect from '@/components/SearchSelect.vue'
import PageHeader from '@/components/form/PageHeader.vue'
import FormCard from '@/components/form/FormCard.vue'
import FormField from '@/components/form/FormField.vue'
import FieldLabel from '@/components/form/FieldLabel.vue'
import FieldError from '@/components/form/FieldError.vue'
import ErrorBanner from '@/components/form/ErrorBanner.vue'
import HeaderSaveActions from '@/components/form/HeaderSaveActions.vue'
import { useFieldErrors } from '@/composables/useFieldErrors'
import api from '@/api'
import { parseApiError } from '@/utils/apiError'
const { t } = useI18n()
const router  = useRouter()

const NORMAL_BALANCE_OPTIONS = computed(() => [
  { id: 'debit',  name: t('erp.accounting.debit') },
  { id: 'credit', name: t('erp.accounting.credit') },
])
const STATUS_OPTIONS = computed(() => [
  { id: 'active',   name: t('common.active') },
  { id: 'inactive', name: t('common.inactive') },
])

const normalBalanceFor = { asset: 'debit', expense: 'debit', liability: 'credit', equity: 'credit', revenue: 'credit' }

const form = ref({ code: '', name: '', accountType: '', normalBalance: 'debit', description: '', parentId: '', status: 'active' })
const parentOptions      = ref([])
const accountTypeOptions = ref([])
const error  = ref('')
const saving = ref(false)
const { fieldErrors, setFromError, reset: resetErrors } = useFieldErrors()

onMounted(async () => {
  const [typesRes, accountsRes] = await Promise.all([
    api.get('/erp/master-data/by-name/Account Types'),
    api.get('/erp/accounting/chart-of-accounts/all'),
  ])
  accountTypeOptions.value = typesRes.data.data.values || []
  parentOptions.value      = accountsRes.data.data.accounts || []
})

function onTypeChange() {
  const nb = normalBalanceFor[form.value.accountType]
  if (nb) form.value.normalBalance = nb
}

async function save() {
  error.value = ''
  resetErrors()
  if (!form.value.code.trim())    { error.value = t('erp.accounting.codeRequired'); return }
  if (!form.value.name.trim())    { error.value = t('erp.accounting.nameRequired'); return }
  if (!form.value.accountType)    { error.value = t('erp.accounting.typeRequired'); return }
  saving.value = true
  try {
    const payload = { ...form.value, parentId: form.value.parentId || null }
    await api.post('/erp/accounting/chart-of-accounts', payload)
    router.push('/erp/accounting/chart-of-accounts')
  } catch (err) {
    const had = setFromError(err)
    if (!had) error.value = parseApiError(err, 'Failed to create account')
  } finally {
    saving.value = false
  }
}
</script>
