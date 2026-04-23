<template>
  <AppLayout>
    <div class="max-w-2xl space-y-6">

      <div class="flex items-center gap-3">
        <RouterLink to="/erp/hrms/departments" class="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors">
          <ArrowLeftIcon class="w-5 h-5" />
        </RouterLink>
        <div>
          <h1 class="text-xl font-semibold text-gray-900">New Department</h1>
          <p class="text-sm text-gray-500 mt-0.5">Create a new organizational business unit</p>
        </div>
      </div>

      <div class="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div class="px-6 py-5 space-y-4">

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Department Code</label>
            <input v-if="!autoCode.enabled.value" v-model="form.code" type="text" placeholder="e.g. DEP0001"
              class="w-full px-3 py-2 border rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary-500" />
            <input v-else :value="autoCode.preview.value" type="text" readonly
              class="w-full px-3 py-2 border rounded-lg text-sm bg-gray-50 text-gray-500 font-mono cursor-not-allowed" />
            <label class="mt-1 flex items-center gap-2 text-xs text-gray-500 cursor-pointer select-none">
              <input type="checkbox" :checked="autoCode.enabled.value" @change="autoCode.toggle" class="rounded" />
              Auto-generate
            </label>
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
          {{ saving ? 'Creating…' : 'Create Department' }}
        </button>
      </div>

    </div>
  </AppLayout>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { ArrowLeftIcon, CheckIcon, ExclamationCircleIcon } from '@heroicons/vue/24/outline'
import AppLayout from '@/layouts/AppLayout.vue'
import api from '@/api'
import { useAutoCode } from '@/composables/useAutoCode'

const router   = useRouter()
const autoCode = useAutoCode('DEP')
const saving   = ref(false)
const error    = ref('')

const form = ref({
  name:        '',
  code:        '',
  description: '',
  isActive:    true,
})

async function save() {
  error.value = ''
  if (!form.value.name.trim()) { error.value = 'Department name is required'; return }

  saving.value = true
  try {
    const payload = { ...form.value }
    if (autoCode.enabled.value) { payload.autoCode = true; payload.code = null }
    await api.post('/erp/hrms/departments', payload)
    router.push('/erp/hrms/departments')
  } catch (err) {
    error.value = err.response?.data?.message || 'Failed to create department'
  } finally {
    saving.value = false
  }
}
</script>
