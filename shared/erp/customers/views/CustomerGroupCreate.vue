<template>
  <AppLayout>
    <div class="space-y-6">

      <div class="flex items-center gap-3">
        <RouterLink to="/erp/customer-groups" class="text-[#9BA7B0] hover:text-[#637381] transition">
          <ArrowLeftIcon class="w-5 h-5" />
        </RouterLink>
        <h1 class="text-2xl font-bold text-[#1C2434]">{{ t('erp.customerGroups.new') }}</h1>
      </div>

      <div class="bg-white rounded-2xl border border-[#E2E8F0] p-6 space-y-5">

        <div class="grid grid-cols-2 gap-4">
          <div class="col-span-2">
            <label class="block text-sm font-medium text-[#374151] mb-1">{{ t('erp.customerGroups.name') }} <span class="text-red-500">*</span></label>
            <input v-model="form.name" type="text" :placeholder="t('erp.customerGroups.name')"
              class="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
          </div>
          <div class="col-span-2">
            <label class="block text-sm font-medium text-[#374151] mb-1">{{ t('erp.customerGroups.description') }}</label>
            <textarea v-model="form.description" rows="3" :placeholder="t('erp.customerGroups.description')"
              class="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none" />
          </div>
          <div>
            <label class="block text-sm font-medium text-[#374151] mb-1">{{ t('erp.customerGroups.status') }}</label>
            <select v-model="form.status" class="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500">
              <option value="active">{{ t('common.active') }}</option>
              <option value="inactive">{{ t('common.inactive') }}</option>
            </select>
          </div>
        </div>

        <div v-if="error" class="bg-red-50 text-red-700 text-sm px-4 py-2 rounded-lg">{{ error }}</div>

        <div class="flex justify-end gap-3 pt-2">
          <RouterLink to="/erp/customer-groups" class="px-4 py-2 text-sm border rounded-lg hover:bg-[#F7F9FC] transition">Cancel</RouterLink>
          <button @click="save" :disabled="saving"
            class="px-5 py-2 text-sm bg-primary-500 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 transition">
            {{ saving ? t('erp.common.creating') : t('erp.customerGroups.create') }}
          </button>
        </div>

      </div>
    </div>
  </AppLayout>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { ArrowLeftIcon } from '@heroicons/vue/24/outline'
import AppLayout from '@/layouts/AppLayout.vue'
import api from '@/api'

const { t } = useI18n()
const router = useRouter()
const form   = ref({ name: '', description: '', status: 'active' })
const error  = ref('')
const saving = ref(false)

async function save() {
  error.value = ''
  if (!form.value.name.trim()) { error.value = 'Name is required'; return }
  saving.value = true
  try {
    await api.post('/erp/customer-groups', form.value)
    router.push('/erp/customer-groups')
  } catch (err) {
    const d = err.response?.data
    error.value = d?.errors?.map(e => e.message).join(', ') || d?.message || 'Failed to create group'
  } finally {
    saving.value = false
  }
}
</script>
