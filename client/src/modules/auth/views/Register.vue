<template>
  <AuthLayout subtitle="Create your account">
    <form @submit.prevent="handleRegister" class="space-y-5">
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
        <input
          v-model="form.name"
          type="text"
          required
          class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
          placeholder="John Doe"
        />
      </div>
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1">Email</label>
        <input
          v-model="form.email"
          type="email"
          required
          class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
          placeholder="you@example.com"
        />
      </div>
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1">Password</label>
        <input
          v-model="form.password"
          type="password"
          required
          minlength="8"
          class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
          placeholder="Min. 8 characters"
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
        {{ loading ? 'Creating account...' : 'Create account' }}
      </button>

      <p class="text-center text-sm text-gray-500">
        Already have an account?
        <RouterLink to="/login" class="text-primary-600 hover:underline">Sign in</RouterLink>
      </p>
    </form>
  </AuthLayout>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import AuthLayout from '@/layouts/AuthLayout.vue'
import { useAuthStore } from '@/stores/auth'

const auth = useAuthStore()
const router = useRouter()

const form = ref({ name: '', email: '', password: '' })
const loading = ref(false)
const errors = ref([])

async function handleRegister() {
  errors.value = []
  loading.value = true
  try {
    await auth.register(form.value.name, form.value.email, form.value.password)
    router.push('/dashboard')
  } catch (err) {
    const data = err.response?.data
    if (data?.errors) {
      errors.value = data.errors.map((e) => e.message)
    } else {
      errors.value = [data?.message || 'Registration failed']
    }
  } finally {
    loading.value = false
  }
}
</script>
