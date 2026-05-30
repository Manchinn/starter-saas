<template>
  <AppLayout>
    <div class="space-y-6">

      <PageHeader :title="t('erp.accounting.edit')" :back-to="`/erp/accounting/chart-of-accounts`"
        :breadcrumb="[
          { label: t('erp.accounting.title'), to: '/erp/accounting/chart-of-accounts' },
          { label: t('erp.accounting.edit') },
        ]">
        <template #actions>
          <div class="flex items-center gap-2">
            <button v-can="'erp.accounting.delete'" @click="confirmDelete"
              class="px-3.5 py-2 text-sm font-medium text-red-500 border border-red-200 hover:bg-red-50 transition">
              {{ t('erp.accounting.deleteAccount') }}
            </button>
            <HeaderSaveActions
              cancel-to="/erp/accounting/chart-of-accounts"
              :cancel-label="t('common.cancel')"
              :saving="saving"
              :saving-label="t('erp.common.saving')"
              :save-label="t('common.saveChanges')"
              @save="save"
            />
          </div>
        </template>
      </PageHeader>

      <div v-if="loading" class="text-[#9BA7B0] py-12 text-center">{{ t('common.loading') }}</div>
      <div v-else-if="notFound" class="bg-red-50 text-red-700 text-sm px-4 py-3">
        {{ t('erp.accounting.notFound') }}
        <RouterLink to="/erp/accounting/chart-of-accounts" class="underline ml-1">{{ t('erp.common.backToList') }}</RouterLink>
      </div>

      <FormCard v-else :title="t('erp.accounting.edit')" :icon="BuildingLibraryIcon" icon-color="primary">
        <div class="grid grid-cols-2 gap-4">

          <FormField name="code" :label="t('erp.accounting.code')" :errors="fieldErrors"
            v-model="form.code" input-class="font-mono" required />

          <FormField name="name" :label="t('erp.accounting.name')" :errors="fieldErrors"
            v-model="form.name" required />

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
import { useRoute, useRouter } from 'vue-router'
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
const route   = useRoute()
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
const loading  = ref(true)
const notFound = ref(false)
const error    = ref('')
const saving   = ref(false)
const { fieldErrors, setFromError, reset: resetErrors } = useFieldErrors()

onMounted(async () => {
  const [typesRes, allAccountsRes] = await Promise.all([
    api.get('/erp/master-data/by-name/Account Types'),
    api.get('/erp/accounting/chart-of-accounts/all'),
  ])
  accountTypeOptions.value = typesRes.data.data.values || []
  parentOptions.value = (allAccountsRes.data.data.accounts || []).filter(a => a.id !== route.params.id)

  try {
    const { data } = await api.get(`/erp/accounting/chart-of-accounts/${route.params.id}`)
    const a = data.data.account
    form.value = {
      code:          a.code,
      name:          a.name,
      accountType:   a.accountType,
      normalBalance: a.normalBalance,
      description:   a.description || '',
      parentId:      a.parentId || '',
      status:        a.status,
    }
  } catch {
    notFound.value = true
  } finally {
    loading.value = false
  }
})

function onTypeChange() {
  const nb = normalBalanceFor[form.value.accountType]
  if (nb) form.value.normalBalance = nb
}

async function save() {
  error.value = ''
  resetErrors()
  if (!form.value.code.trim()) { error.value = t('erp.accounting.codeRequired'); return }
  if (!form.value.name.trim()) { error.value = t('erp.accounting.nameRequired'); return }
  saving.value = true
  try {
    await api.put(`/erp/accounting/chart-of-accounts/${route.params.id}`, {
      ...form.value,
      parentId: form.value.parentId || null,
    })
    router.push('/erp/accounting/chart-of-accounts')
  } catch (err) {
    const had = setFromError(err)
    if (!had) error.value = parseApiError(err, 'Failed to save')
  } finally {
    saving.value = false
  }
}

async function confirmDelete() {
  if (!confirm(`Delete "${form.value.code} — ${form.value.name}"? This cannot be undone.`)) return
  try {
    await api.delete(`/erp/accounting/chart-of-accounts/${route.params.id}`)
    router.push('/erp/accounting/chart-of-accounts')
  } catch (err) {
    error.value = err.response?.data?.message || 'Delete failed'
  }
}
</script>
