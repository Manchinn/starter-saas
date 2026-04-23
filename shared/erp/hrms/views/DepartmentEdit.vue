<template>
  <AppLayout>
    <div class="max-w-2xl space-y-6">

      <div class="flex items-center gap-3">
        <RouterLink to="/erp/hrms/departments" class="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors">
          <ArrowLeftIcon class="w-5 h-5" />
        </RouterLink>
        <div>
          <h1 class="text-xl font-semibold text-gray-900">Edit Department</h1>
          <p class="text-sm text-gray-500 mt-0.5">{{ form.name }}</p>
        </div>
      </div>

      <div v-if="loading" class="bg-white rounded-xl border border-gray-200 p-6 text-center text-gray-400 font-medium">Loading…</div>

      <template v-else>
        <div class="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div class="px-6 py-5 space-y-4">

            <div>
              <div class="flex items-center justify-between mb-1">
                <label class="block text-sm font-medium text-gray-700">Code</label>
                <button type="button" @click="forceGenerate"
                  class="text-xs text-primary-600 hover:text-primary-700 hover:underline">
                  ↻ Generate
                </button>
              </div>
              <input v-model="form.code" @input="form.code = form.code.toUpperCase()" type="text"
                placeholder="e.g. ENG" maxlength="10"
                class="w-full px-3 py-2 border rounded-lg text-sm font-mono uppercase
                       focus:outline-none focus:ring-2 focus:ring-primary-500" />
              <p class="mt-1 text-xs text-gray-400">Short unique identifier for this department</p>
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Department Name <span class="text-red-500">*</span></label>
              <input v-model="form.name" type="text" placeholder="e.g. Engineering"
                class="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea v-model="form.description" rows="3" placeholder="Describe the functions of this department…"
                class="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all"></textarea>
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select v-model="form.isActive" class="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500">
                <option :value="true">Active</option>
                <option :value="false">Inactive</option>
              </select>
            </div>

          </div>
        </div>

        <div v-if="error" class="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg">
          <ExclamationCircleIcon class="w-4 h-4 flex-shrink-0" />
          {{ error }}
        </div>

        <div class="flex justify-end gap-3">
          <RouterLink to="/erp/hrms/departments" class="px-4 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
            Cancel
          </RouterLink>
          <button @click="save" :disabled="saving"
            class="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold bg-primary-600 text-white
                   rounded-xl hover:bg-primary-700 disabled:opacity-50 transition-colors shadow-sm">
            <CheckIcon v-if="!saving" class="w-4 h-4" />
            {{ saving ? 'Saving…' : 'Save Changes' }}
          </button>
        </div>
      </template>

    </div>
  </AppLayout>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ArrowLeftIcon, CheckIcon, ExclamationCircleIcon } from '@heroicons/vue/24/outline'
import AppLayout from '@/layouts/AppLayout.vue'
import api from '@/api'

const router  = useRouter()
const route   = useRoute()
const id      = route.params.id
const loading = ref(true)
const saving  = ref(false)
const error   = ref('')

const form = ref({
  name: '',
  code: '',
  description: '',
  isActive: true,
})

onMounted(async () => {
  try {
    const { data } = await api.get(`/erp/hrms/departments/${id}`)
    const d = data.data
    form.value = {
      name: d.name,
      code: d.code || '',
      description: d.description || '',
      isActive: d.isActive,
    }
  } catch (err) {
    error.value = 'Failed to load department'
  } finally {
    loading.value = false
  }
})

async function forceGenerate() {
  try {
    const { data } = await api.get('/erp/sequences/preview/DEP')
    form.value.code = data.data.preview
  } catch {
    // leave existing code unchanged if preview fetch fails
  }
}

async function save() {
  error.value = ''
  if (!form.value.name.trim()) { error.value = 'Department name is required'; return }

  saving.value = true
  try {
    await api.put(`/erp/hrms/departments/${id}`, form.value)
    router.push('/erp/hrms/departments')
  } catch (err) {
    error.value = err.response?.data?.message || 'Failed to save changes'
  } finally {
    saving.value = false
  }
}
</script>
