<template>
  <AppLayout>
    <div class="space-y-6">

      <!-- Page Header -->
      <div class="flex items-start gap-4">
        <RouterLink to="/erp/settings/master-data"
          class="mt-0.5 p-2 rounded-xl text-[#9BA7B0] hover:text-[#1C2434] hover:bg-white border border-transparent
                 hover:border-[#E2E8F0] transition-all flex-shrink-0">
          <ArrowLeftIcon class="w-[18px] h-[18px]" />
        </RouterLink>
        <div class="flex-1 min-w-0">
          <h1 class="text-xl font-bold text-[#1C2434]">{{ t('erp.masterData.newTitle') }}</h1>
          <nav class="flex items-center gap-1.5 mt-1">
            <RouterLink to="/erp/settings/master-data" class="text-[12px] text-[#9BA7B0] hover:text-[#637381] transition-colors">
              {{ t('erp.masterData.title') }}
            </RouterLink>
            <ChevronRightIcon class="w-3 h-3 text-[#CBD5E1]" />
            <span class="text-[12px] text-[#637381]">{{ t('erp.masterData.new') }}</span>
          </nav>
        </div>
        <div class="flex items-center gap-2.5 flex-shrink-0">
          <RouterLink to="/erp/settings/master-data" class="btn-secondary">{{ t('common.cancel') }}</RouterLink>
          <button @click="save" :disabled="saving" class="btn-primary gap-2">
            <ArrowPathIcon v-if="saving" class="w-4 h-4 animate-spin" />
            <CheckIcon v-else class="w-4 h-4" />
            {{ saving ? t('common.saving') : t('common.create') }}
          </button>
        </div>
      </div>

      <!-- Category Details card -->
      <div class="bg-white rounded-2xl border border-[#E2E8F0] shadow-card overflow-hidden">
        <div class="px-6 py-4 border-b border-[#E2E8F0] flex items-center gap-3">
          <div class="w-8 h-8 rounded-xl bg-primary-50 flex items-center justify-center flex-shrink-0">
            <CircleStackIcon class="w-4 h-4 text-primary-500" />
          </div>
          <h2 class="text-sm font-semibold text-[#1C2434]">{{ t('erp.masterData.categoryDetails') }}</h2>
        </div>
        <div class="px-6 py-5 space-y-5">

          <div class="grid grid-cols-2 gap-x-6 gap-y-5">

            <!-- Code (slug) -->
            <div>
              <label class="block text-[11px] font-semibold text-[#637381] uppercase tracking-wider mb-1.5">
                {{ t('common.code') }} <span class="text-red-500 normal-case font-normal">*</span>
                <span class="ml-1 normal-case font-normal text-[#9BA7B0]">{{ t('erp.masterData.slugHint') }}</span>
              </label>
              <input v-model="form.slug" type="text" :placeholder="t('erp.masterData.slugPh')"
                class="w-full px-3.5 py-2.5 border border-[#E2E8F0] text-sm font-mono text-[#1C2434]
                       focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400 transition-colors" />
            </div>

            <!-- Name -->
            <div>
              <label class="block text-[11px] font-semibold text-[#637381] uppercase tracking-wider mb-1.5">
                {{ t('common.name') }} <span class="text-red-500 normal-case font-normal">*</span>
              </label>
              <input v-model="form.name" type="text" :placeholder="t('erp.masterData.namePh')"
                class="w-full px-3.5 py-2.5 border border-[#E2E8F0] text-sm text-[#1C2434]
                       focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400 transition-colors" />
            </div>

            <!-- Description -->
            <div class="col-span-2">
              <label class="block text-[11px] font-semibold text-[#637381] uppercase tracking-wider mb-1.5">
                {{ t('common.description') }}
              </label>
              <input v-model="form.description" type="text" :placeholder="t('erp.masterData.descPh')"
                class="w-full px-3.5 py-2.5 border border-[#E2E8F0] text-sm text-[#1C2434]
                       focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400 transition-colors" />
            </div>

            <!-- Is System Data -->
            <div class="col-span-2">
              <label class="flex items-start gap-3 cursor-pointer select-none group">
                <div class="mt-0.5 flex-shrink-0">
                  <input type="checkbox" v-model="form.isSystem"
                    class="w-4 h-4 rounded border-[#CBD5E1] text-primary-500 accent-primary-500 cursor-pointer" />
                </div>
                <div>
                  <span class="block text-[11px] font-semibold text-[#637381] uppercase tracking-wider group-hover:text-[#1C2434] transition-colors">
                    {{ t('erp.masterData.isSystem') }}
                  </span>
                  <span class="block text-xs text-[#9BA7B0] mt-0.5">{{ t('erp.masterData.isSystemHint') }}</span>
                </div>
              </label>
            </div>

          </div>

          <!-- Error -->
          <div v-if="error"
            class="flex items-start gap-3 bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-xl">
            <ExclamationCircleIcon class="w-4 h-4 flex-shrink-0 mt-0.5" />
            {{ error }}
          </div>

        </div>
      </div>

    </div>
  </AppLayout>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import {
  ArrowLeftIcon, ChevronRightIcon, CircleStackIcon,
  CheckIcon, ArrowPathIcon, ExclamationCircleIcon,
} from '@heroicons/vue/24/outline'
import AppLayout from '@/layouts/AppLayout.vue'
import { useMasterDataStore } from '@/stores/masterData'

const router = useRouter()
const store  = useMasterDataStore()
const { t }  = useI18n()

const form   = ref({ slug: '', name: '', description: '', isSystem: false })
const saving = ref(false)
const error  = ref('')

async function save() {
  error.value = ''
  if (!form.value.slug.trim()) { error.value = t('erp.masterData.slugRequired'); return }
  if (!form.value.name.trim()) { error.value = t('erp.masterData.nameRequired'); return }
  saving.value = true
  try {
    const cat = await store.createCategory(form.value)
    router.push(`/erp/settings/master-data/${cat.id}`)
  } catch (err) {
    error.value = err.response?.data?.message || t('erp.masterData.saveFailed')
  } finally {
    saving.value = false
  }
}
</script>
