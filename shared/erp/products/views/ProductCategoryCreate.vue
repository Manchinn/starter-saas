<template>
  <AppLayout>
    <div class="max-w-2xl space-y-6">

      <div class="flex items-center gap-3">
        <RouterLink to="/erp/product-categories" class="text-gray-400 hover:text-gray-600 transition">
          <ArrowLeftIcon class="w-5 h-5" />
        </RouterLink>
        <h1 class="text-2xl font-bold text-gray-900">New Category</h1>
      </div>

      <div class="bg-white rounded-xl border border-gray-200 p-6 space-y-5">

        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Code</label>
            <input v-if="!autoCode.enabled.value" v-model="form.code" type="text" placeholder="e.g. ELEC"
              class="w-full px-3 py-2 border rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary-500" />
            <input v-else :value="autoCode.preview.value" type="text" readonly
              class="w-full px-3 py-2 border rounded-lg text-sm bg-gray-50 text-gray-500 font-mono cursor-not-allowed" />
            <label class="mt-1 flex items-center gap-2 text-xs text-gray-500 cursor-pointer select-none">
              <input type="checkbox" :checked="autoCode.enabled.value" @change="autoCode.toggle" class="rounded" />
              Auto-generate
            </label>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Name <span class="text-red-500">*</span></label>
            <input v-model="form.name" type="text" placeholder="e.g. Electronics"
              class="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
          </div>
          <div class="col-span-2">
            <label class="block text-sm font-medium text-gray-700 mb-1">Parent Category</label>
            <select v-model="form.parentId" class="w-full px-3 py-2 border rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary-500">
              <option value="">— None (top-level) —</option>
              <option v-for="cat in topLevelCategories" :key="cat.id" :value="cat.id">{{ cat.name }}</option>
            </select>
          </div>
          <div class="col-span-2">
            <label class="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea v-model="form.description" rows="3" placeholder="Optional description…"
              class="w-full px-3 py-2 border rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary-500" />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select v-model="form.status" class="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500">
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
        </div>

        <div v-if="error" class="bg-red-50 text-red-700 text-sm px-4 py-2 rounded-lg">{{ error }}</div>

        <div class="flex justify-end gap-3 pt-2">
          <RouterLink to="/erp/product-categories" class="px-4 py-2 text-sm border rounded-lg hover:bg-gray-50 transition">Cancel</RouterLink>
          <button @click="save" :disabled="saving"
            class="px-5 py-2 text-sm bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 transition">
            {{ saving ? 'Creating…' : 'Create Category' }}
          </button>
        </div>

      </div>
    </div>
  </AppLayout>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ArrowLeftIcon } from '@heroicons/vue/24/outline'
import AppLayout from '@/layouts/AppLayout.vue'
import api from '@/api'
import { useAutoCode } from '@/composables/useAutoCode'

const router   = useRouter()
const form     = ref({ code: '', name: '', description: '', parentId: '', status: 'active' })
const autoCode = useAutoCode('CAT')
const allCategories = ref([])
const error = ref('')
const saving = ref(false)

// Only top-level categories (no parent) can be parents
const topLevelCategories = computed(() => allCategories.value.filter(c => !c.parentId))

onMounted(async () => {
  try {
    const { data } = await api.get('/erp/product-categories/all')
    allCategories.value = data.data.categories
  } catch (err) {
    console.error('Failed to load categories:', err.message)
  }
})

async function save() {
  error.value = ''
  if (!form.value.name.trim()) { error.value = 'Name is required'; return }
  saving.value = true
  try {
    const payload = { ...form.value, parentId: form.value.parentId || null }
    if (autoCode.enabled.value) { payload.autoCode = true; payload.code = null }
    await api.post('/erp/product-categories', payload)
    router.push('/erp/product-categories')
  } catch (err) {
    const d = err.response?.data
    error.value = d?.errors?.map(e => e.message).join(', ') || d?.message || 'Failed to create category'
  } finally {
    saving.value = false
  }
}
</script>
