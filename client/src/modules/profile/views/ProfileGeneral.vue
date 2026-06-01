<template>
  <AppLayout>
    <div class="w-full space-y-5">
      <div>
        <h1 class="page-title">{{ t('profile.title') }}</h1>
        <p class="page-subtitle">{{ t('profile.subtitle') }}</p>
      </div>

      <ProfileTabs>
        <div class="space-y-1 mb-5">
          <h2 class="text-[15px] font-semibold text-[#1C2434]">{{ t('profile.generalTitle') }}</h2>
          <p class="text-[13px] text-[#637381]">{{ t('profile.generalDesc') }}</p>
        </div>

        <div v-if="loading" class="text-sm text-[#9BA7B0] py-6 text-center animate-pulse">
          {{ t('common.loading') }}
        </div>

        <form v-else @submit.prevent="save" class="space-y-4">
          <FormField
            v-model="form.name"
            name="name"
            :label="t('profile.fullName')"
            autocomplete="name"
            :errors="fieldErrors"
          />

          <FormField
            v-model="form.email"
            name="email"
            type="email"
            autocomplete="email"
            :errors="fieldErrors"
          >
            <template #label>
              <span class="inline-flex items-center gap-2">
                <span>{{ t('profile.email') }}</span>
                <span v-if="user?.emailVerifiedAt" class="badge-green">{{ t('profile.emailVerified') }}</span>
                <span v-else class="badge-amber">{{ t('profile.emailUnverified') }}</span>
              </span>
            </template>
          </FormField>
          <p v-if="emailChanged" class="text-[12px] text-[#B45309] -mt-2">
            {{ t('profile.emailChangeNote') }}
          </p>

          <div v-if="error" class="px-4 py-3 bg-red-50 border border-red-100 text-red-700 text-sm">
            {{ error }}
          </div>
          <div v-if="success" class="px-4 py-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm">
            {{ success }}
          </div>

          <div class="flex justify-end pt-2 border-t border-[#E2E8F0]">
            <button type="submit" :disabled="saving || !dirty" class="btn-primary">
              {{ saving ? t('profile.saving') : t('profile.saveChanges') }}
            </button>
          </div>
        </form>

        <!-- Roles & permissions (read-only) -->
        <div v-if="!loading" class="mt-8 pt-6 border-t border-[#E2E8F0] space-y-5">
          <div class="space-y-1">
            <h2 class="text-[15px] font-semibold text-[#1C2434]">{{ t('profile.accessTitle') }}</h2>
            <p class="text-[13px] text-[#637381]">{{ t('profile.accessDesc') }}</p>
          </div>

          <div class="space-y-2">
            <p class="text-[13px] font-medium text-[#1C2434]">{{ t('profile.rolesLabel') }}</p>
            <div class="flex flex-wrap gap-1.5">
              <span
                v-if="isAdmin"
                class="px-2.5 py-1 text-[12px] font-medium text-white whitespace-nowrap"
                style="background-color: #6366f1"
              >{{ t('profile.systemAdmin') }}</span>
              <span
                v-for="r in roles" :key="r.id"
                class="px-2.5 py-1 text-[12px] font-medium text-white whitespace-nowrap"
                :style="{ backgroundColor: r.color || '#6366f1' }"
              >{{ r.name }}</span>
              <span v-if="!isAdmin && !roles.length" class="text-[13px] text-[#9BA7B0]">
                {{ t('profile.noRoles') }}
              </span>
            </div>
          </div>

          <div class="space-y-2">
            <p class="text-[13px] font-medium text-[#1C2434]">{{ t('profile.permissionsLabel') }}</p>
            <p v-if="allAccess" class="text-[13px] text-[#637381]">{{ t('profile.allPermissions') }}</p>
            <div v-else-if="permissions.length" class="flex flex-wrap gap-1.5">
              <span
                v-for="p in permissions" :key="p"
                class="px-2 py-0.5 text-[11px] font-mono bg-[#F1F5F9] text-[#475569] border border-[#E2E8F0]"
              >{{ p }}</span>
            </div>
            <span v-else class="text-[13px] text-[#9BA7B0]">{{ t('profile.noPermissions') }}</span>
          </div>
        </div>
      </ProfileTabs>
    </div>
  </AppLayout>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { storeToRefs } from 'pinia'
import { useI18n } from 'vue-i18n'
import AppLayout from '@/layouts/AppLayout.vue'
import ProfileTabs from './ProfileTabs.vue'
import FormField from '@/components/form/FormField.vue'
import { useFieldErrors } from '@/composables/useFieldErrors'
import api from '@/api'
import { useAuthStore } from '@/stores/auth'

const { t } = useI18n()
const auth   = useAuthStore()
const { roles, permissions, isAdmin } = storeToRefs(auth)
const allAccess = computed(() => permissions.value.includes('*'))

const loading = ref(true)
const saving  = ref(false)
const error   = ref('')
const success = ref('')
const { fieldErrors, setFromError, reset: resetErrors } = useFieldErrors()

const user = ref(null)
const form = ref({ name: '', email: '' })
const initial = ref({ name: '', email: '' })

const dirty = computed(() =>
  form.value.name !== initial.value.name ||
  form.value.email.trim().toLowerCase() !== initial.value.email.trim().toLowerCase()
)
const emailChanged = computed(() =>
  form.value.email.trim().toLowerCase() !== initial.value.email.trim().toLowerCase()
)

onMounted(async () => {
  try {
    const { data } = await api.get('/profile')
    user.value = data.data.user
    form.value = { name: user.value.name || '', email: user.value.email || '' }
    initial.value = { ...form.value }
  } catch (err) {
    error.value = err.response?.data?.message || t('profile.updateFailed')
  } finally {
    loading.value = false
  }
})

async function save() {
  error.value = ''
  success.value = ''
  resetErrors()
  saving.value = true
  try {
    const payload = {}
    if (form.value.name !== initial.value.name) payload.name = form.value.name.trim()
    if (emailChanged.value) payload.email = form.value.email.trim()
    const { data } = await api.put('/profile', payload)
    user.value = data.data.user
    initial.value = { name: user.value.name || '', email: user.value.email || '' }
    form.value = { ...initial.value }
    success.value = data.message || t('profile.saved')
    await auth.fetchMe()
  } catch (err) {
    const had = setFromError(err)
    if (!had) error.value = err.response?.data?.message || t('profile.updateFailed')
  } finally {
    saving.value = false
  }
}
</script>
