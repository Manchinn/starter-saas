<template>
  <AppLayout>
    <div class="max-w-2xl mx-auto space-y-5">

      <!-- Header -->
      <div class="flex items-center gap-3">
        <button @click="router.back()" class="btn-secondary px-2.5 py-2">
          <ArrowLeftIcon class="w-4 h-4" />
        </button>
        <div>
          <h1 class="page-title">{{ t('team.editTitle') }}</h1>
          <p v-if="loading" class="page-subtitle animate-pulse">{{ t('common.loading') }}</p>
          <p v-else class="page-subtitle">{{ t('team.updateDesc', { name: form.name }) }}</p>
        </div>
      </div>

      <div v-if="loading" class="card p-12 text-center text-[#9BA7B0] text-sm animate-pulse">
        {{ t('common.loading') }}
      </div>

      <template v-else>
        <!-- Account info -->
        <div class="card overflow-hidden">
          <div class="px-5 py-3.5 border-b border-[#E2E8F0] flex items-center gap-2">
            <div class="p-1.5 bg-primary-50"><UserIcon class="w-4 h-4 text-primary-500" /></div>
            <h3 class="text-[13px] font-semibold text-[#374151]">{{ t('team.accountInfo') }}</h3>
          </div>

          <div class="p-6 space-y-4">
            <FormField v-model="form.name" name="name" :label="t('team.fullName')" :placeholder="t('team.fullNamePh')" required :errors="fieldErrors" />
            <FormField v-model="form.email" name="email" type="email" :label="t('team.email')" :placeholder="t('team.emailPh')" required :errors="fieldErrors" />

            <div>
              <label class="label">{{ t('team.statusLabel') }}</label>
              <SearchSelect v-model="form.isActive" :options="STATUS_OPTIONS" :allow-empty="false" />
            </div>

            <div>
              <label class="label">{{ t('team.rolesLabel') }}</label>
              <p class="text-[11px] text-[#9BA7B0] mb-2">{{ t('team.rolesHint') }}</p>
              <RoleChecklist v-model="form.roleIds" :roles="roles" />
            </div>

            <ErrorBanner :message="error" />

            <div class="flex justify-end gap-3 pt-2 border-t border-[#E2E8F0]">
              <button @click="router.back()" class="btn-secondary">{{ t('common.cancel') }}</button>
              <button @click="save" :disabled="saving" class="btn-primary">
                {{ saving ? t('common.saving') : t('common.saveChanges') }}
              </button>
            </div>
          </div>
        </div>

        <!-- Reset password -->
        <div class="card overflow-hidden">
          <div class="px-5 py-3.5 border-b border-[#E2E8F0] flex items-center gap-2">
            <div class="p-1.5 bg-amber-50"><KeyIcon class="w-4 h-4 text-amber-500" /></div>
            <h3 class="text-[13px] font-semibold text-[#374151]">{{ t('team.resetTitle') }}</h3>
          </div>
          <div class="p-6 space-y-4">
            <p class="text-[13px] text-[#637381]">{{ t('team.resetDesc') }}</p>
            <FormField v-model="pw.newPassword" name="newPassword" type="password" :label="t('team.newPassword')" :placeholder="t('team.passwordPh')" :errors="pwErrors" />
            <ErrorBanner :message="pwError" />
            <div class="flex justify-end">
              <button @click="resetPassword" :disabled="settingPw || !pw.newPassword" class="btn-secondary">
                <KeyIcon class="w-4 h-4" />
                {{ settingPw ? t('team.settingPassword') : t('team.setPassword') }}
              </button>
            </div>
          </div>
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
import FormField from '@/components/form/FormField.vue'
import ErrorBanner from '@/components/form/ErrorBanner.vue'
import RoleChecklist from './RoleChecklist.vue'
import { useFieldErrors } from '@/composables/useFieldErrors'
import { ArrowLeftIcon, UserIcon, KeyIcon } from '@heroicons/vue/24/outline'
import api from '@/api'

const route  = useRoute()
const router = useRouter()
const { t }  = useI18n()
const id     = route.params.id

const STATUS_OPTIONS = computed(() => [
  { id: true,  name: t('common.active') },
  { id: false, name: t('common.inactive') },
])

const loading = ref(true)
const error   = ref('')
const saving  = ref(false)
const roles   = ref([])
const { fieldErrors, setFromError, reset: resetErrors } = useFieldErrors()

const form = ref({ name: '', email: '', isActive: true, roleIds: [] })

// Password reset block
const pw        = ref({ newPassword: '' })
const pwError   = ref('')
const settingPw = ref(false)
const { fieldErrors: pwErrors, setFromError: setPwError, reset: resetPwErrors } = useFieldErrors()

onMounted(async () => {
  try {
    const [{ data: staffRes }, { data: rolesRes }] = await Promise.all([
      api.get(`/team/${id}`),
      api.get('/team/roles'),
    ])
    const u = staffRes.data.staff
    form.value = {
      name: u.name,
      email: u.email,
      isActive: u.isActive,
      roleIds: (u.roles || []).map((r) => r.id),
    }
    roles.value = rolesRes.data.roles
  } catch {
    error.value = t('team.loadFailed')
  } finally {
    loading.value = false
  }
})

async function save() {
  error.value = ''
  resetErrors()
  saving.value = true
  try {
    await api.put(`/team/${id}`, { name: form.value.name, email: form.value.email, isActive: form.value.isActive })
    await api.put(`/team/${id}/roles`, { roleIds: form.value.roleIds })
    router.push('/team')
  } catch (err) {
    const had = setFromError(err)
    if (!had) error.value = err.response?.data?.message || t('team.updateFailed')
  } finally {
    saving.value = false
  }
}

async function resetPassword() {
  pwError.value = ''
  resetPwErrors()
  settingPw.value = true
  try {
    await api.post(`/team/${id}/password`, { newPassword: pw.value.newPassword })
    pw.value.newPassword = ''
    alert(t('team.passwordReset'))
  } catch (err) {
    const had = setPwError(err)
    if (!had) pwError.value = err.response?.data?.message || t('team.updateFailed')
  } finally {
    settingPw.value = false
  }
}
</script>
