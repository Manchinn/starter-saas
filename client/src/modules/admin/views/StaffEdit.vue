<template>
  <AppLayout>
    <div class="max-w-2xl mx-auto space-y-6">
      <div class="flex items-center gap-4">
        <button @click="router.back()" class="p-2 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors">
          <ArrowLeftIcon class="w-5 h-5 text-gray-500" />
        </button>
        <div>
          <h1 class="text-2xl font-bold text-gray-900">Edit Staff Member</h1>
          <p v-if="loading" class="text-sm text-gray-400 mt-0.5 animate-pulse">Loading identity…</p>
          <p v-else class="text-sm text-gray-500 mt-0.5">Update login credentials and access for {{ form.name }}.</p>
        </div>
      </div>

      <div v-if="loading" class="bg-white rounded-2xl border border-gray-200 shadow-sm p-12 text-center text-gray-400">
        Loading staff information…
      </div>

      <div v-else class="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 space-y-6">
        <div class="space-y-4">
          <div>
            <label class="block text-sm font-semibold text-gray-700 mb-1">Full Name *</label>
            <input
              v-model="form.name"
              type="text"
              class="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all"
              placeholder="Staff full name"
            />
          </div>
          <div>
            <label class="block text-sm font-semibold text-gray-700 mb-1">Email / Username <span class="text-xs font-normal text-gray-400">(ReadOnly)</span></label>
            <input
              :value="form.email"
              type="email"
              disabled
              class="w-full px-4 py-2 border border-gray-100 bg-gray-50 rounded-xl text-gray-400 cursor-not-allowed"
            />
          </div>
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-semibold text-gray-700 mb-1">Role</label>
              <select
                v-model="form.role"
                class="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 appearance-none bg-white font-medium"
              >
                <option value="user">User</option>
                <option value="admin">Admin</option>
              </select>
            </div>
            <div>
              <label class="block text-sm font-semibold text-gray-700 mb-1">Status</label>
              <select
                v-model="form.isActive"
                class="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 appearance-none bg-white font-medium"
                :class="form.isActive ? 'text-green-600' : 'text-red-600'"
              >
                <option :value="true">Active</option>
                <option :value="false">Inactive</option>
              </select>
            </div>
          </div>
        </div>

        <div v-if="error" class="p-3 bg-red-50 border border-red-100 text-red-600 text-sm rounded-xl">
          {{ error }}
        </div>

        <div class="flex justify-end gap-3 pt-6 border-t border-gray-100">
          <button
            @click="router.back()"
            class="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 rounded-xl transition-colors"
          >
            Cancel
          </button>
          <button
            @click="save"
            :disabled="saving"
            class="px-6 py-2 bg-primary-600 text-white text-sm font-bold rounded-xl hover:bg-primary-700 transition shadow-lg shadow-primary-200 disabled:opacity-50"
          >
            {{ saving ? 'Saving…' : 'Save Changes' }}
          </button>
        </div>
      </div>
    </div>
  </AppLayout>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import AppLayout from '@/layouts/AppLayout.vue'
import { ArrowLeftIcon } from '@heroicons/vue/24/outline'
import api from '@/api'

const route   = useRoute()
const router  = useRouter()
const id      = route.params.id

const loading = ref(true)
const error   = ref('')
const saving  = ref(false)

const form = ref({
  id: '',
  name: '',
  email: '',
  role: 'user',
  isActive: true,
})

onMounted(async () => {
  try {
    const { data } = await api.get(`/organizations/${id}`)
    const u = data.data.organization
    form.value = {
      id: u.id,
      name: u.name,
      email: u.email,
      role: u.role,
      isActive: u.isActive,
    }
  } catch (err) {
    error.value = 'Failed to load staff information'
  } finally {
    loading.value = false
  }
})

async function save() {
  error.value = ''
  if (!form.value.name.trim()) { error.value = 'Name is required'; return }

  saving.value = true
  try {
    await api.put(`/organizations/${id}`, form.value)
    router.back()
  } catch (err) {
    error.value = err.response?.data?.message || 'Update failed'
  } finally {
    saving.value = false
  }
}
</script>
