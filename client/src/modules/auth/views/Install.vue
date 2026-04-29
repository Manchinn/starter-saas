<template>
  <AuthLayout :subtitle="t('auth.installSubtitle')">
    <form @submit.prevent="handleInstall" class="space-y-4">

      <div class="mb-2 px-4 py-3.5 bg-primary-50 border border-primary-100 rounded-xl">
        <p class="text-[13px] font-semibold text-primary-700">{{ t('auth.setupTitle') }}</p>
        <p class="text-[12px] text-primary-600 mt-0.5">{{ t('auth.setupDesc') }}</p>
      </div>

      <div>
        <label class="label">{{ t('auth.fullName') }}</label>
        <input
          v-model="form.name"
          type="text"
          required
          autocomplete="name"
          class="input-lg"
          :placeholder="t('auth.yourNamePh')"
        />
      </div>

      <div>
        <label class="label">{{ t('auth.email') }}</label>
        <input
          v-model="form.email"
          type="email"
          required
          autocomplete="email"
          class="input-lg"
          :placeholder="t('auth.adminEmailPh')"
        />
      </div>

      <div>
        <label class="label">{{ t('auth.password') }}</label>
        <input
          v-model="form.password"
          type="password"
          required
          autocomplete="new-password"
          class="input-lg"
          :placeholder="t('auth.passwordMinPh')"
        />
      </div>

      <div>
        <label class="label">{{ t('auth.confirmPassword') }}</label>
        <input
          v-model="form.confirmPassword"
          type="password"
          required
          autocomplete="new-password"
          class="input-lg"
          :placeholder="t('auth.repeatPh')"
        />
      </div>

      <div v-if="errors.length"
           class="px-4 py-3 bg-[#FEE2E2] border border-[#FECACA] text-[#B91C1C] text-sm rounded-xl space-y-1">
        <p v-for="e in errors" :key="e">{{ e }}</p>
      </div>

      <button
        type="submit"
        :disabled="loading"
        class="btn-primary w-full py-3 text-[15px] mt-2"
      >
        {{ loading ? t('auth.installing') : t('auth.createAdmin') }}
      </button>

    </form>
  </AuthLayout>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import AuthLayout from '@/layouts/AuthLayout.vue'
import { useAuthStore } from '@/stores/auth'
import { resetInstallCache } from '@/router'

const auth   = useAuthStore()
const router = useRouter()
const { t }  = useI18n()

const form    = ref({ name: '', email: '', password: '', confirmPassword: '' })
const loading = ref(false)
const errors  = ref([])

async function handleInstall() {
  errors.value  = []
  if (form.value.password !== form.value.confirmPassword) {
    errors.value = [t('auth.passwordsNoMatch')]
    return
  }
  loading.value = true
  try {
    await auth.install(form.value.name, form.value.email, form.value.password)
    resetInstallCache()
    router.push('/dashboard')
  } catch (err) {
    const data = err.response?.data
    if (data?.errors?.length) {
      errors.value = data.errors.map((e) => e.message)
    } else {
      errors.value = [data?.message || t('auth.installationFailed')]
    }
  } finally {
    loading.value = false
  }
}
</script>
