<template>
  <AppLayout>
    <div class="space-y-6">

      <div class="flex items-center gap-3">
        <RouterLink to="/erp/hrms/departments" class="p-1.5 rounded-lg text-[#9BA7B0] hover:text-[#374151] hover:bg-[#F1F5F9] transition-colors">
          <ArrowLeftIcon class="w-5 h-5" />
        </RouterLink>
        <div>
          <h1 class="text-xl font-semibold text-[#1C2434]">{{ t('erp.departments.edit') }}</h1>
          <p class="text-sm text-[#637381] mt-0.5">{{ form.name }}</p>
        </div>
      </div>

      <div v-if="loading" class="bg-white rounded-2xl border border-[#E2E8F0] p-6 text-center text-[#9BA7B0] font-medium">Loading…</div>

      <template v-else>
        <div class="bg-white rounded-2xl border border-[#E2E8F0] shadow-sm overflow-hidden">
          <div class="px-6 py-5 space-y-4">

            <div>
              <div class="flex items-center justify-between mb-1">
                <label class="block text-sm font-medium text-[#374151]">{{ t('erp.departments.code') }}</label>
                <button type="button" @click="forceGenerate"
                  class="text-xs text-primary-500 hover:text-primary-500 hover:underline">
                  ↻ {{ t('erp.departments.generate') }}
                </button>
              </div>
              <input v-model="form.code" @input="form.code = form.code.toUpperCase()" type="text"
                placeholder="e.g. ENG" maxlength="10"
                class="w-full px-3 py-2 border rounded-lg text-sm font-mono uppercase
                       focus:outline-none focus:ring-2 focus:ring-primary-500" />
              <p class="mt-1 text-xs text-[#9BA7B0]">Short unique identifier for this department</p>
            </div>

            <div>
              <label class="block text-sm font-medium text-[#374151] mb-1">{{ t('erp.departments.name') }} <span class="text-red-500">*</span></label>
              <input v-model="form.name" type="text" placeholder="e.g. Engineering"
                class="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
            </div>

            <div>
              <label class="block text-sm font-medium text-[#374151] mb-1">{{ t('erp.departments.description') }}</label>
              <textarea v-model="form.description" rows="3" placeholder="Describe the functions of this department…"
                class="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all"></textarea>
            </div>

            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium text-[#374151] mb-1">{{ t('erp.common.activeFrom') }}</label>
                <DateInput v-model="form.activeFrom" class="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
              </div>
              <div>
                <label class="block text-sm font-medium text-[#374151] mb-1">{{ t('erp.common.activeTo') }}</label>
                <DateInput v-model="form.activeTo" class="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
              </div>
            </div>
            <div>
              <label class="block text-sm font-medium text-[#374151] mb-1">{{ t('erp.departments.status') }}</label>
              <select v-model="form.isActive" class="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500">
                <option :value="true">{{ t('common.active') }}</option>
                <option :value="false">{{ t('common.inactive') }}</option>
              </select>
            </div>

          </div>
        </div>

        <div v-if="error" class="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg">
          <ExclamationCircleIcon class="w-4 h-4 flex-shrink-0" />
          {{ error }}
        </div>

        <div class="flex justify-end gap-3">
          <RouterLink to="/erp/hrms/departments" class="px-4 py-2 text-sm border border-[#E2E8F0] rounded-lg hover:bg-[#F7F9FC] transition-colors">
            {{ t('common.cancel') }}
          </RouterLink>
          <button @click="save" :disabled="saving"
            class="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold bg-primary-500 text-white
                   rounded-xl hover:bg-primary-700 disabled:opacity-50 transition-colors shadow-sm">
            <CheckIcon v-if="!saving" class="w-4 h-4" />
            {{ saving ? t('erp.common.saving') : t('common.saveChanges') }}
          </button>
        </div>
      </template>

    </div>
  </AppLayout>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter, useRoute } from 'vue-router'
import { ArrowLeftIcon, CheckIcon, ExclamationCircleIcon } from '@heroicons/vue/24/outline'
import AppLayout from '@/layouts/AppLayout.vue'
import api from '@/api'

const { t } = useI18n()
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
  activeFrom: '',
  activeTo: '',
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
      activeFrom: d.activeFrom || '',
      activeTo: d.activeTo || '',
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
