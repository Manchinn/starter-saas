<template>
  <AppLayout>
    <div class="space-y-6">

      <div class="flex items-center gap-3">
        <RouterLink to="/erp/customers" class="text-[#9BA7B0] hover:text-[#637381] transition">
          <ArrowLeftIcon class="w-5 h-5" />
        </RouterLink>
        <h1 class="text-2xl font-bold text-[#1C2434]">{{ t('erp.customers.new') }}</h1>
      </div>

      <div class="bg-white rounded-2xl border border-[#E2E8F0] p-6 space-y-5">

        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium text-[#374151] mb-1">{{ t('erp.customers.customerCode') }}</label>
            <input v-if="!autoCode.enabled.value" v-model="form.code" type="text" placeholder="e.g. CUS-001"
              class="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
            <input v-else :value="autoCode.preview.value" type="text" readonly
              class="w-full px-3 py-2 border rounded-lg text-sm bg-[#F7F9FC] text-[#637381] font-mono cursor-not-allowed" />
            <label class="mt-1 flex items-center gap-2 text-xs text-[#637381] cursor-pointer select-none">
              <input type="checkbox" :checked="autoCode.enabled.value" @change="autoCode.toggle" class="rounded" />
              {{ t('erp.common.autoGenerate') }}
            </label>
          </div>
          <div class="col-span-2 sm:col-span-1">
            <label class="block text-sm font-medium text-[#374151] mb-1">{{ t('erp.customers.name') }} <span class="text-red-500">*</span></label>
            <input v-model="form.name" type="text" :placeholder="t('erp.customers.name')" class="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
          </div>
          <div class="col-span-2 sm:col-span-1">
            <label class="block text-sm font-medium text-[#374151] mb-1">{{ t('erp.customers.company') }}</label>
            <input v-model="form.company" type="text" :placeholder="t('erp.customers.company')" class="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
          </div>
          <div class="col-span-2 sm:col-span-1">
            <label class="block text-sm font-medium text-[#374151] mb-1">{{ t('erp.customers.email') }}</label>
            <input v-model="form.email" type="email" :placeholder="t('erp.customers.email')" class="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
          </div>
          <div class="col-span-2 sm:col-span-1">
            <label class="block text-sm font-medium text-[#374151] mb-1">{{ t('erp.customers.phone') }}</label>
            <input v-model="form.phone" type="text" :placeholder="t('erp.customers.phone')" class="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
          </div>
          <div class="col-span-2">
            <label class="block text-sm font-medium text-[#374151] mb-1">{{ t('erp.customers.address') }}</label>
            <textarea v-model="form.address" rows="2" :placeholder="t('erp.customers.address')" class="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none" />
          </div>
          <div class="col-span-2">
            <label class="block text-sm font-medium text-[#374151] mb-1">{{ t('erp.customers.notes') }}</label>
            <textarea v-model="form.notes" rows="3" :placeholder="t('erp.customers.notes')" class="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none" />
          </div>
          <div>
            <label class="block text-sm font-medium text-[#374151] mb-1">{{ t('erp.customers.status') }}</label>
            <select v-model="form.status" class="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500">
              <option value="active">{{ t('common.active') }}</option>
              <option value="inactive">{{ t('common.inactive') }}</option>
            </select>
          </div>
          <div>
            <label class="block text-sm font-medium text-[#374151] mb-1">{{ t('erp.customers.group') }}</label>
            <select v-model="form.customerGroupId" class="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white">
              <option value="">— None —</option>
              <option v-for="g in groups" :key="g.id" :value="g.id">{{ g.name }}</option>
            </select>
          </div>
        </div>

        <div v-if="error" class="bg-red-50 text-red-700 text-sm px-4 py-2 rounded-lg">{{ error }}</div>

        <div class="flex justify-end gap-3 pt-2">
          <RouterLink to="/erp/customers" class="px-4 py-2 text-sm border rounded-lg hover:bg-[#F7F9FC] transition">Cancel</RouterLink>
          <button @click="save" :disabled="saving" class="px-5 py-2 text-sm bg-primary-500 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 transition">
            {{ saving ? t('erp.common.creating') : t('erp.customers.create') }}
          </button>
        </div>

      </div>
    </div>
  </AppLayout>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { ArrowLeftIcon } from '@heroicons/vue/24/outline'
import AppLayout from '@/layouts/AppLayout.vue'
import api from '@/api'
import { useAutoCode } from '@/composables/useAutoCode'

const { t } = useI18n()
const router   = useRouter()
const form     = ref({ code: '', name: '', company: '', email: '', phone: '', address: '', notes: '', status: 'active', customerGroupId: '' })
const groups   = ref([])
const error    = ref('')
const saving   = ref(false)
const autoCode = useAutoCode('CUS')

onMounted(async () => {
  const { data } = await api.get('/erp/customer-groups/all')
  groups.value = data.data.groups
})

async function save() {
  error.value = ''
  if (!form.value.name.trim()) { error.value = 'Name is required'; return }
  saving.value = true
  try {
    const payload = { ...form.value, customerGroupId: form.value.customerGroupId || null }
    if (autoCode.enabled.value) { payload.autoCode = true; payload.code = null }
    await api.post('/erp/customers', payload)
    router.push('/erp/customers')
  } catch (err) {
    const d = err.response?.data
    error.value = d?.errors?.map(e => e.message).join(', ') || d?.message || 'Failed to create customer'
  } finally {
    saving.value = false
  }
}
</script>
