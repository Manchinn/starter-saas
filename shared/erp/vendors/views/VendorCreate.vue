<template>
  <AppLayout>
    <div class="max-w-2xl space-y-6">

      <div class="flex items-center gap-3">
        <RouterLink to="/erp/vendors" class="text-gray-400 hover:text-gray-600 transition">
          <ArrowLeftIcon class="w-5 h-5" />
        </RouterLink>
        <h1 class="text-2xl font-bold text-gray-900">New Vendor</h1>
      </div>

      <div class="bg-white rounded-xl border border-gray-200 p-6 space-y-5">
        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Code</label>
            <input v-if="!autoCode.enabled.value" v-model="form.code" type="text" placeholder="e.g. VND-001"
              class="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
            <input v-else :value="autoCode.preview.value" type="text" readonly
              class="w-full px-3 py-2 border rounded-lg text-sm bg-gray-50 text-gray-500 font-mono cursor-not-allowed" />
            <label class="mt-1 flex items-center gap-2 text-xs text-gray-500 cursor-pointer select-none">
              <input type="checkbox" :checked="autoCode.enabled.value" @change="autoCode.toggle" class="rounded" />
              Auto-generate
            </label>
          </div>
          <div class="col-span-2">
            <label class="block text-sm font-medium text-gray-700 mb-1">Name <span class="text-red-500">*</span></label>
            <input v-model="form.name" type="text" placeholder="Vendor name"
              class="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Contact Person</label>
            <input v-model="form.contactPerson" type="text" placeholder="Contact name"
              class="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input v-model="form.email" type="email" placeholder="vendor@example.com"
              class="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Phone</label>
            <input v-model="form.phone" type="text" placeholder="+1 555-0100"
              class="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
          </div>
          <div class="col-span-2">
            <label class="block text-sm font-medium text-gray-700 mb-1">Address</label>
            <textarea v-model="form.address" rows="2" placeholder="Street, City, Country"
              class="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none" />
          </div>
          <div class="col-span-2">
            <label class="block text-sm font-medium text-gray-700 mb-1">Notes</label>
            <textarea v-model="form.notes" rows="2" placeholder="Optional notes"
              class="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none" />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select v-model="form.status" class="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500">
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Vendor Type</label>
            <div class="flex flex-col gap-2">
              <label class="flex items-center gap-2 text-sm text-gray-700 cursor-pointer select-none">
                <input type="checkbox" value="supplier" v-model="form.vendorTypes"
                  class="rounded text-primary-600 focus:ring-primary-500" />
                Supplier
              </label>
              <label class="flex items-center gap-2 text-sm text-gray-700 cursor-pointer select-none">
                <input type="checkbox" value="service_provider" v-model="form.vendorTypes"
                  class="rounded text-primary-600 focus:ring-primary-500" />
                Service Provider
              </label>
            </div>
          </div>
        </div>

        <div v-if="error" class="bg-red-50 text-red-700 text-sm px-4 py-2 rounded-lg">{{ error }}</div>

        <div class="flex justify-end gap-3 pt-2">
          <RouterLink to="/erp/vendors" class="px-4 py-2 text-sm border rounded-lg hover:bg-gray-50 transition">Cancel</RouterLink>
          <button @click="save" :disabled="saving"
            class="px-5 py-2 text-sm bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 transition">
            {{ saving ? 'Saving…' : 'Create Vendor' }}
          </button>
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
import { useAutoCode } from '@/composables/useAutoCode'

const router  = useRouter()
const form    = ref({ name: '', code: '', contactPerson: '', email: '', phone: '', address: '', notes: '', vendorTypes: [], status: 'active' })
const error   = ref('')
const saving  = ref(false)
const autoCode = useAutoCode('VND')

async function save() {
  error.value = ''
  if (!form.value.name.trim()) { error.value = 'Name is required'; return }
  saving.value = true
  try {
    const payload = { ...form.value }
    if (autoCode.enabled.value) { payload.autoCode = true; payload.code = null }
    await api.post('/erp/vendors', payload)
    router.push('/erp/vendors')
  } catch (err) {
    error.value = err.response?.data?.message || 'Failed to create vendor'
  } finally {
    saving.value = false
  }
}
</script>
