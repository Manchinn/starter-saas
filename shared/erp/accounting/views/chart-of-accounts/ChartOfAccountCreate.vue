<template>
  <AppLayout>
    <div class="space-y-6">

      <div class="flex items-center gap-3">
        <RouterLink to="/erp/accounting/chart-of-accounts" class="text-[#9BA7B0] hover:text-[#637381] transition">
          <ArrowLeftIcon class="w-5 h-5" />
        </RouterLink>
        <h1 class="text-2xl font-bold text-[#1C2434]">{{ t('erp.accounting.new') }}</h1>
      </div>

      <div class="bg-white rounded-2xl border border-[#E2E8F0] p-6 space-y-5">

        <div class="grid grid-cols-2 gap-4">

          <div>
            <label class="block text-sm font-medium text-[#374151] mb-1">
              {{ t('erp.accounting.code') }} <span class="text-red-500">*</span>
            </label>
            <input v-model="form.code" type="text" placeholder="e.g. 1110"
              class="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 font-mono" />
          </div>

          <div>
            <label class="block text-sm font-medium text-[#374151] mb-1">
              {{ t('erp.accounting.name') }} <span class="text-red-500">*</span>
            </label>
            <input v-model="form.name" type="text" :placeholder="t('erp.accounting.namePh')"
              class="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
          </div>

          <div>
            <label class="block text-sm font-medium text-[#374151] mb-1">
              {{ t('erp.accounting.accountType') }} <span class="text-red-500">*</span>
            </label>
            <select v-if="accountTypeOptions.length" v-model="form.accountType" @change="onTypeChange"
              class="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white">
              <option value="">— {{ t('erp.accounting.selectType') }} —</option>
              <option v-for="at in accountTypeOptions" :key="at.code" :value="at.code">{{ at.name }}</option>
            </select>
            <p v-else class="text-xs text-amber-600 mt-1 px-3 py-2 bg-amber-50 rounded-lg border border-amber-200">
              {{ t('erp.accounting.noAccountTypes') }}
              <RouterLink to="/erp/settings/master-data" class="underline font-medium">{{ t('erp.accounting.setupMasterData') }}</RouterLink>
            </p>
          </div>

          <div>
            <label class="block text-sm font-medium text-[#374151] mb-1">{{ t('erp.accounting.normalBalance') }}</label>
            <select v-model="form.normalBalance"
              class="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white">
              <option value="debit">{{ t('erp.accounting.debit') }}</option>
              <option value="credit">{{ t('erp.accounting.credit') }}</option>
            </select>
          </div>

          <div class="col-span-2">
            <label class="block text-sm font-medium text-[#374151] mb-1">{{ t('erp.accounting.parentAccount') }}</label>
            <select v-model="form.parentId"
              class="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white">
              <option value="">— {{ t('erp.accounting.noParent') }} —</option>
              <option v-for="a in parentOptions" :key="a.id" :value="a.id">
                {{ a.code }} — {{ a.name }}
              </option>
            </select>
          </div>

          <div class="col-span-2">
            <label class="block text-sm font-medium text-[#374151] mb-1">{{ t('erp.accounting.description') }}</label>
            <textarea v-model="form.description" rows="3" :placeholder="t('erp.accounting.descriptionPh')"
              class="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none" />
          </div>

          <div>
            <label class="block text-sm font-medium text-[#374151] mb-1">{{ t('erp.accounting.status') }}</label>
            <select v-model="form.status"
              class="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500">
              <option value="active">{{ t('common.active') }}</option>
              <option value="inactive">{{ t('common.inactive') }}</option>
            </select>
          </div>

        </div>

        <div v-if="error" class="bg-red-50 text-red-700 text-sm px-4 py-2 rounded-lg">{{ error }}</div>

        <div class="flex justify-end gap-3 pt-2">
          <RouterLink to="/erp/accounting/chart-of-accounts" class="px-4 py-2 text-sm border rounded-lg hover:bg-[#F7F9FC] transition">
            {{ t('common.cancel') }}
          </RouterLink>
          <button @click="save" :disabled="saving"
            class="px-5 py-2 text-sm bg-primary-500 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 transition">
            {{ saving ? t('erp.common.creating') : t('erp.accounting.create') }}
          </button>
        </div>

      </div>
    </div>
  </AppLayout>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { ArrowLeftIcon } from '@heroicons/vue/24/outline'
import AppLayout from '@/layouts/AppLayout.vue'
import api from '@/api'
import { parseApiError } from '@/utils/apiError'
const { t } = useI18n()
const router  = useRouter()

const normalBalanceFor = { asset: 'debit', expense: 'debit', liability: 'credit', equity: 'credit', revenue: 'credit' }

const form = ref({ code: '', name: '', accountType: '', normalBalance: 'debit', description: '', parentId: '', status: 'active' })
const parentOptions      = ref([])
const accountTypeOptions = ref([])
const error  = ref('')
const saving = ref(false)

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
  if (!form.value.code.trim())    { error.value = t('erp.accounting.codeRequired'); return }
  if (!form.value.name.trim())    { error.value = t('erp.accounting.nameRequired'); return }
  if (!form.value.accountType)    { error.value = t('erp.accounting.typeRequired'); return }
  saving.value = true
  try {
    const payload = { ...form.value, parentId: form.value.parentId || null }
    await api.post('/erp/accounting/chart-of-accounts', payload)
    router.push('/erp/accounting/chart-of-accounts')
  } catch (err) {
    error.value = parseApiError(err, 'Failed to create account')
  } finally {
    saving.value = false
  }
}
</script>
