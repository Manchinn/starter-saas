<template>
  <AppLayout>
    <div class="space-y-6">

      <div class="flex items-center gap-3">
        <RouterLink to="/erp/accounting/chart-of-accounts" class="text-[#9BA7B0] hover:text-[#637381] transition">
          <ArrowLeftIcon class="w-5 h-5" />
        </RouterLink>
        <h1 class="text-2xl font-bold text-[#1C2434]">{{ t('erp.accounting.edit') }}</h1>
      </div>

      <div v-if="loading" class="text-[#9BA7B0] py-12 text-center">{{ t('common.loading') }}</div>
      <div v-else-if="notFound" class="bg-red-50 text-red-700 text-sm px-4 py-3">
        {{ t('erp.accounting.notFound') }}
        <RouterLink to="/erp/accounting/chart-of-accounts" class="underline ml-1">{{ t('erp.common.backToList') }}</RouterLink>
      </div>

      <div v-else class="bg-white border border-[#E2E8F0] p-6 space-y-5">

        <div class="grid grid-cols-2 gap-4">

          <div>
            <label class="block text-sm font-medium text-[#374151] mb-1">
              {{ t('erp.accounting.code') }} <span class="text-red-500">*</span>
            </label>
            <input v-model="form.code" type="text"
              :class="['w-full px-3 py-2 border text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 font-mono', errorOf('code') && 'input-error']" />
            <FieldError name="code" :errors="fieldErrors" />
          </div>

          <div>
            <label class="block text-sm font-medium text-[#374151] mb-1">
              {{ t('erp.accounting.name') }} <span class="text-red-500">*</span>
            </label>
            <input v-model="form.name" type="text"
              :class="['w-full px-3 py-2 border text-sm focus:outline-none focus:ring-2 focus:ring-primary-500', errorOf('name') && 'input-error']" />
            <FieldError name="name" :errors="fieldErrors" />
          </div>

          <div>
            <label class="block text-sm font-medium text-[#374151] mb-1">
              {{ t('erp.accounting.accountType') }} <span class="text-red-500">*</span>
            </label>
            <template v-if="accountTypeOptions.length">
              <SearchSelect v-model="form.accountType"
                :options="accountTypeOptions" track-by="code" :placeholder="`— ${t('erp.accounting.selectType')} —`"
                :allow-empty="false" :invalid="!!errorOf('accountType')" @change="onTypeChange" />
              <FieldError name="accountType" :errors="fieldErrors" />
            </template>
            <p v-else class="text-xs text-amber-600 mt-1 px-3 py-2 bg-amber-50 border border-amber-200">
              {{ t('erp.accounting.noAccountTypes') }}
              <RouterLink to="/erp/settings/master-data" class="underline font-medium">{{ t('erp.accounting.setupMasterData') }}</RouterLink>
            </p>
          </div>

          <div>
            <label class="block text-sm font-medium text-[#374151] mb-1">{{ t('erp.accounting.normalBalance') }}</label>
            <SearchSelect v-model="form.normalBalance" :options="NORMAL_BALANCE_OPTIONS" :allow-empty="false" />
          </div>

          <div class="col-span-2">
            <label class="block text-sm font-medium text-[#374151] mb-1">{{ t('erp.accounting.parentAccount') }}</label>
            <SearchSelect v-model="form.parentId" :options="parentOptions" :placeholder="`— ${t('erp.accounting.noParent')} —`">
              <template #option="{ option }">{{ option.code }} — {{ option.name }}</template>
              <template #singleLabel="{ option }">{{ option.code }} — {{ option.name }}</template>
            </SearchSelect>
          </div>

          <div class="col-span-2">
            <label class="block text-sm font-medium text-[#374151] mb-1">{{ t('erp.accounting.description') }}</label>
            <textarea v-model="form.description" rows="3"
              class="w-full px-3 py-2 border text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none" />
          </div>

          <div>
            <label class="block text-sm font-medium text-[#374151] mb-1">{{ t('erp.accounting.status') }}</label>
            <SearchSelect v-model="form.status" :options="STATUS_OPTIONS" :allow-empty="false" />
          </div>

        </div>

        <div v-if="error" class="bg-red-50 text-red-700 text-sm px-4 py-2">{{ error }}</div>

        <div class="flex justify-between items-center pt-2">
          <button v-can="'erp.accounting.delete'" @click="confirmDelete"
            class="px-4 py-2 text-sm text-red-500 border border-red-200 hover:bg-red-50 transition">
            {{ t('erp.accounting.deleteAccount') }}
          </button>
          <div class="flex gap-3">
            <RouterLink to="/erp/accounting/chart-of-accounts" class="px-4 py-2 text-sm border hover:bg-[#F7F9FC] transition">
              {{ t('common.cancel') }}
            </RouterLink>
            <button @click="save" :disabled="saving"
              class="px-5 py-2 text-sm bg-primary-500 text-white hover:bg-primary-700 disabled:opacity-50 transition">
              {{ saving ? t('erp.common.saving') : t('common.saveChanges') }}
            </button>
          </div>
        </div>

      </div>
    </div>
  </AppLayout>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { ArrowLeftIcon } from '@heroicons/vue/24/outline'
import AppLayout from '@/layouts/AppLayout.vue'
import SearchSelect from '@/components/SearchSelect.vue'
import FieldError from '@/components/form/FieldError.vue'
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
const { fieldErrors, setFromError, reset: resetErrors, errorOf } = useFieldErrors()

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
