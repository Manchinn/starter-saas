<template>
  <AppLayout>
    <div class="space-y-6">

      <div class="flex items-center gap-3">
        <RouterLink to="/erp/customers" class="text-[#9BA7B0] hover:text-[#637381] transition">
          <ArrowLeftIcon class="w-5 h-5" />
        </RouterLink>
        <h1 class="text-2xl font-bold text-[#1C2434]">{{ t('erp.customers.edit') }}</h1>
      </div>

      <div v-if="loading" class="text-[#9BA7B0] py-12 text-center">Loading…</div>
      <div v-else-if="notFound" class="bg-red-50 text-red-700 text-sm px-4 py-3 rounded-lg">
        {{ t('erp.customers.notFound') }} <RouterLink to="/erp/customers" class="underline ml-1">{{ t('erp.common.backToList') }}</RouterLink>
      </div>

      <div v-else class="bg-white rounded-2xl border border-[#E2E8F0] p-6 space-y-5">

        <div class="grid grid-cols-2 gap-4">
          <div class="col-span-2 sm:col-span-1">
            <label class="block text-sm font-medium text-[#374151] mb-1">{{ t('erp.customers.name') }} <span class="text-red-500">*</span></label>
            <input v-model="form.name" type="text" class="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
          </div>
          <div class="col-span-2 sm:col-span-1">
            <label class="block text-sm font-medium text-[#374151] mb-1">{{ t('erp.customers.company') }}</label>
            <input v-model="form.company" type="text" class="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
          </div>
          <div class="col-span-2 sm:col-span-1">
            <label class="block text-sm font-medium text-[#374151] mb-1">{{ t('erp.customers.email') }}</label>
            <input v-model="form.email" type="email" class="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
          </div>
          <div class="col-span-2 sm:col-span-1">
            <label class="block text-sm font-medium text-[#374151] mb-1">{{ t('erp.customers.phone') }}</label>
            <input v-model="form.phone" type="text" class="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
          </div>
          <div class="col-span-2">
            <label class="block text-sm font-medium text-[#374151] mb-1">{{ t('erp.customers.address') }}</label>
            <textarea v-model="form.address" rows="2" class="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none" />
          </div>
          <div class="col-span-2">
            <label class="block text-sm font-medium text-[#374151] mb-1">{{ t('erp.customers.notes') }}</label>
            <textarea v-model="form.notes" rows="3" class="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none" />
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

        <div class="flex justify-between items-center pt-2">
          <button v-can="'erp.customers.delete'" @click="confirmDelete" class="px-4 py-2 text-sm text-red-500 border border-red-200 rounded-lg hover:bg-red-50 transition">{{ t('erp.customers.deleteCustomer') }}</button>
          <div class="flex gap-3">
            <RouterLink to="/erp/customers" class="px-4 py-2 text-sm border rounded-lg hover:bg-[#F7F9FC] transition">Cancel</RouterLink>
            <button @click="save" :disabled="saving" class="px-5 py-2 text-sm bg-primary-500 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 transition">
              {{ saving ? t('erp.common.saving') : t('common.saveChanges') }}
            </button>
          </div>
        </div>

      </div>
    </div>
  </AppLayout>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { ArrowLeftIcon } from '@heroicons/vue/24/outline'
import AppLayout from '@/layouts/AppLayout.vue'
import api from '@/api'

const { t } = useI18n()
const route    = useRoute()
const router   = useRouter()
const form     = ref({ name: '', company: '', email: '', phone: '', address: '', notes: '', status: 'active', activeFrom: '', activeTo: '', customerGroupId: '' })
const groups   = ref([])
const loading  = ref(true)
const notFound = ref(false)
const error    = ref('')
const saving   = ref(false)

onMounted(async () => {
  const [groupsRes] = await Promise.allSettled([
    api.get('/erp/customer-groups/all'),
  ])
  if (groupsRes.status === 'fulfilled') groups.value = groupsRes.value.data.data.groups

  try {
    const { data } = await api.get(`/erp/customers/${route.params.id}`)
    const c = data.data.customer
    form.value = {
      name: c.name, company: c.company || '', email: c.email || '',
      phone: c.phone || '', address: c.address || '', notes: c.notes || '',
      status: c.status, activeFrom: c.activeFrom || '', activeTo: c.activeTo || '', customerGroupId: c.customerGroupId || '',
    }
  } catch {
    notFound.value = true
  } finally {
    loading.value = false
  }
})

async function save() {
  error.value = ''
  if (!form.value.name.trim()) { error.value = 'Name is required'; return }
  saving.value = true
  try {
    await api.put(`/erp/customers/${route.params.id}`, { ...form.value, customerGroupId: form.value.customerGroupId || null })
    router.push('/erp/customers')
  } catch (err) {
    const d = err.response?.data
    error.value = d?.errors?.map(e => e.message).join(', ') || d?.message || 'Failed to save'
  } finally {
    saving.value = false
  }
}

async function confirmDelete() {
  if (!confirm(`Delete "${form.value.name}"? This cannot be undone.`)) return
  try {
    await api.delete(`/erp/customers/${route.params.id}`)
    router.push('/erp/customers')
  } catch (err) {
    error.value = err.response?.data?.message || 'Delete failed'
  }
}
</script>
