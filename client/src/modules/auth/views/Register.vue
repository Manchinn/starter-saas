<template>
  <AuthLayout :subtitle="registered ? t('auth.accountReady') : t('auth.registerSubtitle')">

    <!-- ── Success: roles & permissions granted ────────────────────────────── -->
    <div v-if="registered" class="space-y-6">
      <div class="space-y-1.5">
        <p class="text-[14px] text-[#1C2434]">{{ t('auth.accountReadyDesc') }}</p>
        <p class="text-[13px] text-[#637381]">
          {{ t('auth.welcome') }}
          <span class="font-semibold text-[#1C2434]">{{ auth.user?.name }}</span>
        </p>
      </div>

      <div class="bg-[#F8FAFC] border border-[#E2E8F0] px-5 py-5">
        <RoleSummaryCard />
      </div>

      <button
        type="button"
        @click="goToApp"
        class="btn-primary w-full py-3 text-[15px]"
      >
        {{ t('auth.continueToApp') }}
      </button>
    </div>

    <!-- ── Register form ───────────────────────────────────────────────────── -->
    <form v-else @submit.prevent="handleRegister" class="space-y-4">

      <FormField
        v-model="form.name"
        name="name"
        :label="t('auth.fullName')"
        autocomplete="name"
        required
        :placeholder="t('auth.fullNamePh')"
        :errors="fieldErrors"
        input-class="input-lg"
      />

      <FormField
        v-model="form.email"
        name="email"
        type="email"
        :label="t('auth.email')"
        autocomplete="email"
        required
        :placeholder="t('auth.emailPh')"
        :errors="fieldErrors"
        input-class="input-lg"
      />

      <FormField
        v-model="form.password"
        name="password"
        type="password"
        :label="t('auth.password')"
        autocomplete="new-password"
        required
        minlength="8"
        :placeholder="t('auth.passwordMinPh')"
        :errors="fieldErrors"
        input-class="input-lg"
      />

      <div v-if="formError"
           class="px-4 py-3 bg-[#FEE2E2] border border-[#FECACA] text-[#B91C1C] text-sm">
        {{ formError }}
      </div>

      <button
        type="submit"
        :disabled="loading"
        class="btn-primary w-full py-3 text-[15px] mt-2"
      >
        {{ loading ? t('auth.creatingAccount') : t('auth.createAccount') }}
      </button>

      <p class="text-center text-[13px] text-[#637381]">
        {{ t('auth.alreadyAccount') }}
        <RouterLink to="/login" class="font-semibold text-primary-500 hover:text-primary-600">{{ t('auth.signInLink') }}</RouterLink>
      </p>

    </form>
  </AuthLayout>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import AuthLayout from '@/layouts/AuthLayout.vue'
import RoleSummaryCard from '@/components/RoleSummaryCard.vue'
import { useAuthStore } from '@/stores/auth'
import { useFieldErrors } from '@/composables/useFieldErrors'
import FormField from '@/components/form/FormField.vue'

const auth   = useAuthStore()
const router = useRouter()
const { t }  = useI18n()

const form      = ref({ name: '', email: '', password: '' })
const loading   = ref(false)
const formError = ref('')
const registered = ref(false)
const { fieldErrors, setFromError, reset: resetErrors } = useFieldErrors()

async function handleRegister() {
  formError.value = ''
  resetErrors()
  loading.value = true
  try {
    await auth.register(form.value.name, form.value.email, form.value.password)
    registered.value = true
  } catch (err) {
    const had = setFromError(err)
    if (!had) formError.value = err.response?.data?.message || t('auth.registrationFailed')
  } finally {
    loading.value = false
  }
}

// Correct post-register destination (honors the user's default page).
function goToApp() {
  router.push(auth.homeRoute())
}
</script>
