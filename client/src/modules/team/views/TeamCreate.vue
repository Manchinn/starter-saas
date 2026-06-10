<template>
  <AppLayout>
    <div class="w-full space-y-5">

      <!-- Header -->
      <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div class="flex items-center gap-3">
          <button @click="router.back()" class="btn-secondary px-2.5 py-2" :title="t('common.back')">
            <ArrowLeftIcon class="w-4 h-4" />
          </button>
          <div>
            <h1 class="page-title">{{ t('team.createTitle') }}</h1>
            <p class="page-subtitle">{{ t('team.createDesc') }}</p>
          </div>
        </div>
        <div class="flex items-center gap-2">
          <button @click="router.back()" class="btn-secondary">{{ t('common.cancel') }}</button>
          <button @click="save" :disabled="saving" class="btn-primary">
            {{ saving ? t('team.creating') : t('team.create') }}
          </button>
        </div>
      </div>

      <!-- Form card -->
      <div class="card overflow-hidden">
        <div class="px-5 py-3.5 border-b border-[#E2E8F0] flex items-center gap-2">
          <div class="p-1.5 bg-primary-50">
            <UserPlusIcon class="w-4 h-4 text-primary-500" />
          </div>
          <h3 class="text-[13px] font-semibold text-[#374151]">{{ t('team.accountInfo') }}</h3>
        </div>

        <div class="p-6">
          <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <!-- Identity -->
            <section class="space-y-4">
              <p class="text-[11px] font-semibold text-[#637381] uppercase tracking-wider">{{ t('team.sectionIdentity') }}</p>
              <FormField v-model="form.name" name="name" :label="t('team.fullName')" :placeholder="t('team.fullNamePh')" required :errors="fieldErrors" />
              <FormField v-model="form.email" name="email" type="email" :label="t('team.email')" :placeholder="t('team.emailPh')" required :errors="fieldErrors" />
              <FormField v-model="form.password" name="password" type="password" :label="t('team.password')" :placeholder="t('team.passwordPh')" required :hint="t('team.passwordHint')" :errors="fieldErrors" />
            </section>

            <!-- Access -->
            <section class="space-y-4">
              <p class="text-[11px] font-semibold text-[#637381] uppercase tracking-wider">{{ t('team.sectionAccess') }}</p>

              <div>
                <label class="label">{{ t('team.statusLabel') }}</label>
                <SearchSelect v-model="form.isActive" :options="STATUS_OPTIONS" :allow-empty="false" />
              </div>

              <div>
                <label class="label">{{ t('team.rolesLabel') }}</label>
                <p class="text-[11px] text-[#9BA7B0] mb-2">{{ t('team.rolesHint') }}</p>
                <RoleChecklist v-model="form.roleIds" :roles="roles" />
              </div>
            </section>
          </div>

          <ErrorBanner :message="error" class="mt-6" />
        </div>
      </div>

    </div>
  </AppLayout>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import AppLayout from '@/layouts/AppLayout.vue'
import SearchSelect from '@/components/SearchSelect.vue'
import FormField from '@/components/form/FormField.vue'
import ErrorBanner from '@/components/form/ErrorBanner.vue'
import RoleChecklist from './RoleChecklist.vue'
import { useFieldErrors } from '@/composables/useFieldErrors'
import { ArrowLeftIcon, UserPlusIcon } from '@heroicons/vue/24/outline'
import api from '@/api'

const router = useRouter()
const { t }  = useI18n()

const STATUS_OPTIONS = computed(() => [
  { id: true,  name: t('common.active') },
  { id: false, name: t('common.inactive') },
])

const roles  = ref([])
const error  = ref('')
const saving = ref(false)
const { fieldErrors, setFromError, reset: resetErrors } = useFieldErrors()

const form = ref({ name: '', email: '', password: '', isActive: true, roleIds: [] })

onMounted(async () => {
  try {
    const { data } = await api.get('/team/roles')
    roles.value = data.data.roles
  } catch { /* roles optional */ }
})

async function save() {
  error.value = ''
  resetErrors()
  saving.value = true
  try {
    await api.post('/team', form.value)
    router.push('/team')
  } catch (err) {
    const had = setFromError(err)
    if (!had) error.value = err.response?.data?.message || t('team.createFailed')
  } finally {
    saving.value = false
  }
}
</script>
