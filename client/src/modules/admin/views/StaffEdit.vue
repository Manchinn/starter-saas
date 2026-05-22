<template>
  <AppLayout>
    <div class="max-w-xl mx-auto space-y-5">

      <!-- Header -->
      <div class="flex items-center gap-3">
        <button @click="router.back()" class="btn-secondary px-2.5 py-2">
          <ArrowLeftIcon class="w-4 h-4" />
        </button>
        <div>
          <h1 class="page-title">{{ t('staff.editTitle') }}</h1>
          <p v-if="loading" class="page-subtitle animate-pulse">{{ t('common.loading') }}</p>
          <p v-else class="page-subtitle">{{ t('staff.updateDesc', { name: form.name }) }}</p>
        </div>
      </div>

      <div v-if="loading" class="card p-12 text-center text-[#9BA7B0] text-sm animate-pulse">
        {{ t('staff.loadingInfo') }}
      </div>

      <div v-else class="card overflow-hidden">
        <div class="px-5 py-3.5 border-b border-[#E2E8F0] flex items-center gap-2">
          <div class="p-1.5 bg-primary-50">
            <UserIcon class="w-4 h-4 text-primary-500" />
          </div>
          <h3 class="text-[13px] font-semibold text-[#374151]">{{ t('staff.accountInfo') }}</h3>
        </div>

        <div class="p-6 space-y-4">
          <FormField
            v-model="form.name"
            name="name"
            :label="t('staff.fullName')"
            :placeholder="t('staff.fullNamePh')"
            required
            :errors="fieldErrors"
          />

          <div>
            <label class="label">
              {{ t('staff.emailUser') }}
              <span class="ml-1 text-xs text-[#9BA7B0] font-normal">{{ t('common.readOnly') }}</span>
            </label>
            <input
              :value="form.email"
              type="email"
              disabled
              class="input bg-[#F7F9FC] text-[#9BA7B0] cursor-not-allowed"
            />
          </div>

          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="label">{{ t('staff.roleLabel') }}</label>
              <SearchSelect v-model="form.role" :options="ROLE_OPTIONS" :allow-empty="false" :invalid="!!errorOf('role')" />
              <FieldError name="role" :errors="fieldErrors" />
            </div>
            <div>
              <label class="label">{{ t('staff.statusLabel') }}</label>
              <SearchSelect v-model="form.isActive" :options="STATUS_OPTIONS" :allow-empty="false" />
            </div>
          </div>

          <div v-if="error"
               class="px-4 py-3 bg-red-50 border border-red-100 text-red-700 text-sm">
            {{ error }}
          </div>

          <div class="flex justify-end gap-3 pt-2 border-t border-[#E2E8F0]">
            <button @click="router.back()" class="btn-secondary">{{ t('common.cancel') }}</button>
            <button @click="save" :disabled="saving" class="btn-primary">
              {{ saving ? t('common.saving') : t('common.saveChanges') }}
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
import AppLayout from '@/layouts/AppLayout.vue'
import SearchSelect from '@/components/SearchSelect.vue'
import FormField from '@/components/form/FormField.vue'
import FieldError from '@/components/form/FieldError.vue'
import { useFieldErrors } from '@/composables/useFieldErrors'
import { ArrowLeftIcon, UserIcon } from '@heroicons/vue/24/outline'
import api from '@/api'

const route  = useRoute()
const router = useRouter()
const { t }  = useI18n()
const id     = route.params.id

const ROLE_OPTIONS = computed(() => [
  { id: 'user',  name: t('org.roleUser') },
  { id: 'admin', name: 'Admin' },
])
const STATUS_OPTIONS = computed(() => [
  { id: true,  name: t('common.active') },
  { id: false, name: t('common.inactive') },
])

const loading = ref(true)
const error   = ref('')
const saving  = ref(false)
const { fieldErrors, setFromError, reset: resetErrors, errorOf } = useFieldErrors()

const form = ref({ id: '', name: '', email: '', role: 'user', isActive: true })

onMounted(async () => {
  try {
    const { data } = await api.get(`/organizations/${id}`)
    const u = data.data.organization
    form.value = { id: u.id, name: u.name, email: u.email, role: u.role, isActive: u.isActive }
  } catch {
    error.value = t('staff.loadFailed')
  } finally {
    loading.value = false
  }
})

async function save() {
  error.value = ''
  resetErrors()
  saving.value = true
  try {
    await api.put(`/organizations/${id}`, form.value)
    router.back()
  } catch (err) {
    const had = setFromError(err)
    if (!had) error.value = err.response?.data?.message || t('staff.updateFailed')
  } finally {
    saving.value = false
  }
}
</script>
