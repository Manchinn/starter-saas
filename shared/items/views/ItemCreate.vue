<template>
  <AppLayout>
    <div class="max-w-2xl space-y-6">

      <!-- Header -->
      <div class="flex items-center gap-3">
        <RouterLink to="/items" class="text-gray-400 hover:text-gray-600 transition">
          <ArrowLeftIcon class="w-5 h-5" />
        </RouterLink>
        <h1 class="text-2xl font-bold text-gray-900">Create Item</h1>
      </div>

      <!-- Form -->
      <div class="bg-white rounded-xl border border-gray-200 p-6 space-y-5">

        <!-- Title -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Title <span class="text-red-500">*</span></label>
          <input
            v-model="form.title"
            type="text"
            placeholder="Enter item title"
            class="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>

        <!-- Description -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Description</label>
          <textarea
            v-model="form.description"
            rows="4"
            placeholder="Optional description…"
            class="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
          />
        </div>

        <!-- Status -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Status</label>
          <select
            v-model="form.status"
            class="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>

        <!-- Error -->
        <div v-if="error" class="bg-red-50 text-red-700 text-sm px-4 py-2 rounded-lg">{{ error }}</div>

        <!-- Actions -->
        <div class="flex justify-end gap-3 pt-2">
          <RouterLink
            to="/items"
            class="px-4 py-2 text-sm border rounded-lg hover:bg-gray-50 transition"
          >Cancel</RouterLink>
          <button
            @click="save"
            :disabled="saving"
            class="px-5 py-2 text-sm bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 transition"
          >{{ saving ? 'Creating…' : 'Create Item' }}</button>
        </div>

      </div>
    </div>
  </AppLayout>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { ArrowLeftIcon } from '@heroicons/vue/24/outline'
import AppLayout from '@/layouts/AppLayout.vue'
import api from '@/api'

const router = useRouter()

const form = ref({ title: '', description: '', status: 'active' })
const error = ref('')
const saving = ref(false)

async function save() {
  error.value = ''
  if (!form.value.title.trim()) { error.value = 'Title is required'; return }
  saving.value = true
  try {
    await api.post('/items', form.value)
    router.push('/items')
  } catch (err) {
    const d = err.response?.data
    if (d?.errors?.length) {
      error.value = d.errors.map((e) => e.message).join(', ')
    } else {
      error.value = d?.message || 'Failed to create item'
    }
  } finally {
    saving.value = false
  }
}
</script>
