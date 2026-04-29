<template>
  <AuthLayout :subtitle="t('auth.registerSubtitle')">
    <form @submit.prevent="handleRegister" class="space-y-4">

      <div>
        <label class="label">{{ t('auth.fullName') }}</label>
        <input
          v-model="form.name"
          type="text"
          required
          autocomplete="name"
          class="input-lg"
          :placeholder="t('auth.fullNamePh')"
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
          :placeholder="t('auth.emailPh')"
        />
      </div>

      <div>
        <label class="label">{{ t('auth.password') }}</label>
        <input
          v-model="form.password"
          type="password"
          required
          minlength="8"
          autocomplete="new-password"
          class="input-lg"
          :placeholder="t('auth.passwordMinPh')"
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
import { useAuthStore } from '@/stores/auth'

const auth   = useAuthStore()
const router = useRouter()
const { t }  = useI18n()

const form    = ref({ name: '', email: '', password: '' })
const loading = ref(false)
const errors  = ref([])

async function handleRegister() {
  errors.value  = []
  loading.value = true
  try {
    await auth.register(form.value.name, form.value.email, form.value.password)
    router.push('/dashboard')
  } catch (err) {
    const data = err.response?.data
    if (data?.errors) {
      errors.value = data.errors.map((e) => e.message)
    } else {
      errors.value = [data?.message || t('auth.registrationFailed')]
    }
  } finally {
    loading.value = false
  }
}
</script>
