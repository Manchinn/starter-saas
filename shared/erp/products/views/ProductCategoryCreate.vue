<template>
  <AppLayout>
    <div class="space-y-6">

      <div class="flex items-center gap-3">
        <RouterLink to="/erp/product-categories" class="text-[#9BA7B0] hover:text-[#637381] transition">
          <ArrowLeftIcon class="w-5 h-5" />
        </RouterLink>
        <h1 class="text-2xl font-bold text-[#1C2434]">{{ t('erp.productCategories.new') }}</h1>
      </div>

      <div class="bg-white rounded-2xl border border-[#E2E8F0] p-6 space-y-5">

        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium text-[#374151] mb-1">{{ t('erp.productCategories.code') }}</label>
            <input v-if="!autoCode.enabled.value" v-model="form.code" type="text" placeholder="e.g. ELEC"
              class="w-full px-3 py-2 border rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary-500" />
            <input v-else :value="autoCode.preview.value" type="text" readonly
              class="w-full px-3 py-2 border rounded-lg text-sm bg-[#F7F9FC] text-[#637381] font-mono cursor-not-allowed" />
            <label class="mt-1 flex items-center gap-2 text-xs text-[#637381] cursor-pointer select-none">
              <input type="checkbox" :checked="autoCode.enabled.value" @change="autoCode.toggle" class="rounded" />
              {{ t('erp.common.autoGenerate') }}
            </label>
          </div>
          <div>
            <label class="block text-sm font-medium text-[#374151] mb-1">{{ t('erp.productCategories.name') }} <span class="text-red-500">*</span></label>
            <input v-model="form.name" type="text" placeholder="e.g. Electronics"
              class="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
          </div>
          <div class="col-span-2">
            <label class="block text-sm font-medium text-[#374151] mb-1">{{ t('erp.productCategories.parentCategory') }}</label>
            <SearchSelect v-model="form.parentId" :options="topLevelCategories" placeholder="— None (top-level) —" />
          </div>
          <div class="col-span-2">
            <label class="block text-sm font-medium text-[#374151] mb-1">{{ t('erp.productCategories.description') }}</label>
            <textarea v-model="form.description" rows="3" placeholder="Optional description…"
              class="w-full px-3 py-2 border rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary-500" />
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
            <label class="block text-sm font-medium text-[#374151] mb-1">{{ t('erp.productCategories.status') }}</label>
            <SearchSelect v-model="form.status" :options="statusOptions" :allow-empty="false" />
          </div>
        </div>

        <div v-if="error" class="bg-red-50 text-red-700 text-sm px-4 py-2 rounded-lg">{{ error }}</div>

        <div class="flex justify-end gap-3 pt-2">
          <RouterLink to="/erp/product-categories" class="px-4 py-2 text-sm border rounded-lg hover:bg-[#F7F9FC] transition">{{ t('common.cancel') }}</RouterLink>
          <button @click="save" :disabled="saving"
            class="px-5 py-2 text-sm bg-primary-500 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 transition">
            {{ saving ? t('erp.common.creating') : t('erp.productCategories.create') }}
          </button>
        </div>

      </div>
    </div>
  </AppLayout>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { ArrowLeftIcon } from '@heroicons/vue/24/outline'
import AppLayout from '@/layouts/AppLayout.vue'
import SearchSelect from '@/components/SearchSelect.vue'
import api from '@/api'
import { useAutoCode } from '@/composables/useAutoCode'
import { parseApiError } from '@/utils/apiError'

const { t } = useI18n()

const statusOptions = computed(() => [
  { id: 'active',   name: t('common.active')   },
  { id: 'inactive', name: t('common.inactive') },
])
const router   = useRouter()
const form     = ref({ code: '', name: '', description: '', parentId: '', status: 'active', activeFrom: '', activeTo: '' })
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
    error.value = parseApiError(err, 'Failed to create category')
  } finally {
    saving.value = false
  }
}
</script>
