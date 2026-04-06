<template>
  <AuthLayout subtitle="Set up your administrator account">
    <form @submit.prevent="handleInstall" class="space-y-5">
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1">Name</label>
        <input
          v-model="form.name"
          type="text"
          required
          class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          placeholder="Your name"
        />
      </div>
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1">Email</label>
        <input
          v-model="form.email"
          type="email"
          required
          class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          placeholder="admin@example.com"
        />
      </div>
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1">Password</label>
        <input
          v-model="form.password"
          type="password"
          required
          class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          placeholder="••••••••"
        />
      </div>
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1">Confirm Password</label>
        <input
          v-model="form.confirmPassword"
          type="password"
          required
          class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          placeholder="••••••••"
        />
      </div>

      <div v-if="errors.length" class="bg-red-50 text-red-700 text-sm px-4 py-2 rounded-lg space-y-1">
        <p v-for="e in errors" :key="e">{{ e }}</p>
      </div>

      <button
        type="submit"
        :disabled="loading"
        class="w-full py-2 px-4 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50"
      >
        {{ loading ? 'Installing...' : 'Create Admin Account' }}
      </button>
    </form>
  </AuthLayout>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import AuthLayout from '@/layouts/AuthLayout.vue'
import { useAuthStore } from '@/stores/auth'
import { resetInstallCache } from '@/router'

const auth = useAuthStore()
const router = useRouter()

const form = ref({ name: '', email: '', password: '', confirmPassword: '' })
const loading = ref(false)
const errors = ref([])

async function handleInstall() {
  errors.value = []
  if (form.value.password !== form.value.confirmPassword) {
    errors.value = ['Passwords do not match']
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
      errors.value = [data?.message || 'Installation failed']
    }
  } finally {
    loading.value = false
  }
}
</script>
