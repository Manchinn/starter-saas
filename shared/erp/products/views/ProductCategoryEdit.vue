<template>
  <AppLayout>
    <div class="space-y-6">

      <div class="flex items-center gap-3">
        <RouterLink to="/erp/product-categories" class="text-[#9BA7B0] hover:text-[#637381] transition">
          <ArrowLeftIcon class="w-5 h-5" />
        </RouterLink>
        <h1 class="text-xl font-semibold text-[#1C2434]">{{ t('erp.productCategories.edit') }}</h1>
      </div>

      <div v-if="loading" class="text-center py-12 text-[#9BA7B0]">
        <div class="inline-block w-5 h-5 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
      </div>

      <template v-else>

        <div class="bg-white rounded-2xl border border-[#E2E8F0] shadow-sm overflow-hidden">
          <div class="px-6 py-4 border-b border-[#E2E8F0]">
            <h2 class="text-sm font-semibold text-[#374151]">{{ t('erp.productCategories.edit') }}</h2>
          </div>
          <div class="px-6 py-5">
            <div class="grid grid-cols-2 gap-4">

              <div>
                <label class="block text-xs font-semibold text-[#637381] uppercase tracking-wide mb-1.5">
                  {{ t('erp.productCategories.code') }}
                </label>
                <input v-model="form.code" type="text" placeholder="e.g. ELEC"
                  class="w-full px-3 py-2 border border-[#E2E8F0] rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent" />
              </div>

              <div>
                <label class="block text-xs font-semibold text-[#637381] uppercase tracking-wide mb-1.5">
                  {{ t('erp.productCategories.name') }} <span class="text-red-500">*</span>
                </label>
                <input v-model="form.name" type="text" placeholder="e.g. Electronics"
                  class="w-full px-3 py-2 border border-[#E2E8F0] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent" />
              </div>

              <div class="col-span-2">
                <label class="block text-xs font-semibold text-[#637381] uppercase tracking-wide mb-1.5">
                  {{ t('erp.productCategories.parentCategory') }}
                </label>
                <select v-model="form.parentId"
                  class="w-full px-3 py-2 border border-[#E2E8F0] rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent">
                  <option value="">— None (top-level) —</option>
                  <option v-for="cat in editableParents" :key="cat.id" :value="cat.id">{{ cat.name }}</option>
                </select>
              </div>

              <div class="col-span-2">
                <label class="block text-xs font-semibold text-[#637381] uppercase tracking-wide mb-1.5">
                  {{ t('erp.productCategories.description') }}
                </label>
                <textarea v-model="form.description" rows="3" placeholder="Optional description…"
                  class="w-full px-3 py-2 border border-[#E2E8F0] rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent" />
              </div>

              <div>
                <label class="block text-xs font-semibold text-[#637381] uppercase tracking-wide mb-1.5">
                  {{ t('erp.productCategories.status') }}
                </label>
                <select v-model="form.status"
                  class="w-full px-3 py-2 border border-[#E2E8F0] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent">
                  <option value="active">{{ t('common.active') }}</option>
                  <option value="inactive">{{ t('common.inactive') }}</option>
                </select>
              </div>

            </div>
          </div>
        </div>

        <div v-if="error"
          class="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg">
          <ExclamationCircleIcon class="w-4 h-4 flex-shrink-0" />
          {{ error }}
        </div>

        <div class="flex justify-end gap-3">
          <RouterLink to="/erp/product-categories"
            class="px-4 py-2.5 text-sm border border-[#E2E8F0] rounded-xl hover:bg-[#F7F9FC] transition text-[#637381]">
            {{ t('common.cancel') }}
          </RouterLink>
          <button @click="save" :disabled="saving"
            class="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold bg-primary-500 text-white rounded-xl hover:bg-primary-700 disabled:opacity-50 transition shadow-sm">
            {{ saving ? t('erp.common.saving') : t('common.saveChanges') }}
          </button>
        </div>

      </template>
    </div>
  </AppLayout>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { ArrowLeftIcon, ExclamationCircleIcon } from '@heroicons/vue/24/outline'
import AppLayout from '@/layouts/AppLayout.vue'
import api from '@/api'

const { t }  = useI18n()
const route  = useRoute()
const router = useRouter()

const allCategories = ref([])
const loading = ref(true)
const saving  = ref(false)
const error   = ref('')

const form = ref({ code: '', name: '', description: '', parentId: '', status: 'active' })

const editableParents = computed(() =>
  allCategories.value.filter(c => !c.parentId && String(c.id) !== route.params.id)
)

onMounted(async () => {
  try {
    const { data } = await api.get('/erp/product-categories/all')
    allCategories.value = data.data.categories
    const c = allCategories.value.find(c => String(c.id) === route.params.id)
    if (!c) { router.push('/erp/product-categories'); return }
    form.value = { code: c.code || '', name: c.name, description: c.description || '', parentId: c.parentId || '', status: c.status }
  } catch {
    router.push('/erp/product-categories')
  } finally {
    loading.value = false
  }
})

async function save() {
  error.value = ''
  if (!form.value.name.trim()) { error.value = 'Name is required'; return }
  saving.value = true
  try {
    await api.put(`/erp/product-categories/${route.params.id}`, { ...form.value, parentId: form.value.parentId || null })
    router.push('/erp/product-categories')
  } catch (err) {
    error.value = err.response?.data?.message || 'Failed to save'
  } finally {
    saving.value = false
  }
}
</script>
