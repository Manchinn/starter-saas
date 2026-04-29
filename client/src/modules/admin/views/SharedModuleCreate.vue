<template>
  <AppLayout>
    <div class="space-y-6">

      <div class="flex items-center gap-3">
        <RouterLink to="/admin/shared-modules" class="text-[#9BA7B0] hover:text-[#637381] transition">
          <ArrowLeftIcon class="w-5 h-5" />
        </RouterLink>
        <div>
          <h1 class="text-xl font-semibold text-[#1C2434]">{{ t('mods.newShared') }}</h1>
          <p class="text-sm text-[#637381] mt-0.5">{{ t('mods.createSharedDesc') }}</p>
        </div>
      </div>

      <div class="bg-white rounded-2xl border border-[#E2E8F0] shadow-sm overflow-hidden">
        <div class="px-6 py-4 border-b border-[#E2E8F0]">
          <h2 class="text-sm font-semibold text-[#374151]">{{ t('mods.moduleDetails') }}</h2>
        </div>
        <div class="px-6 py-5 space-y-5">
          <div class="grid grid-cols-2 gap-5">

            <div class="col-span-2">
              <label class="block text-xs font-semibold text-[#637381] uppercase tracking-wide mb-1.5">
                {{ t('common.name') }} <span class="text-red-500">*</span>
              </label>
              <input v-model="form.name" type="text" placeholder="My Module"
                class="w-full px-3 py-2 border border-[#E2E8F0] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent" />
            </div>

            <div class="col-span-2">
              <label class="block text-xs font-semibold text-[#637381] uppercase tracking-wide mb-1.5">
                {{ t('common.slug') }} <span class="text-red-500">*</span>
                <span class="text-[#9BA7B0] font-normal ml-1 normal-case">{{ t('roles.slugHint') }}</span>
              </label>
              <input v-model="form.slug" type="text" :placeholder="t('roles.slugPh')"
                class="w-full px-3 py-2 border border-[#E2E8F0] rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent" />
            </div>

            <div class="col-span-2">
              <label class="block text-xs font-semibold text-[#637381] uppercase tracking-wide mb-1.5">
                {{ t('common.description') }}
              </label>
              <textarea v-model="form.description" rows="3"
                class="w-full px-3 py-2 border border-[#E2E8F0] rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent" />
            </div>

            <div>
              <label class="block text-xs font-semibold text-[#637381] uppercase tracking-wide mb-1.5">
                {{ t('common.icon') }}
              </label>
              <input v-model="form.icon" type="text" placeholder="cube"
                class="w-full px-3 py-2 border border-[#E2E8F0] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent" />
            </div>

            <div>
              <label class="block text-xs font-semibold text-[#637381] uppercase tracking-wide mb-1.5">
                {{ t('common.order') }}
              </label>
              <input v-model.number="form.order" type="number"
                class="w-full px-3 py-2 border border-[#E2E8F0] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent" />
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
        <RouterLink to="/admin/shared-modules"
          class="px-4 py-2.5 text-sm border border-[#E2E8F0] rounded-xl hover:bg-[#F7F9FC] transition text-[#637381]">
          {{ t('common.cancel') }}
        </RouterLink>
        <button @click="save" :disabled="saving"
          class="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold bg-primary-500 text-white rounded-xl hover:bg-primary-700 disabled:opacity-50 transition shadow-sm">
          {{ saving ? t('common.saving') : t('common.create') }}
        </button>
      </div>

    </div>
  </AppLayout>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { ArrowLeftIcon, ExclamationCircleIcon } from '@heroicons/vue/24/outline'
import AppLayout from '@/layouts/AppLayout.vue'
import { useModulesStore } from '@/stores/modules'

const router = useRouter()
const { t }  = useI18n()
const modulesStore = useModulesStore()

const saving = ref(false)
const error  = ref('')

const form = reactive({ name: '', slug: '', description: '', icon: 'cube', order: 100 })

async function save() {
  error.value  = ''
  saving.value = true
  try {
    await modulesStore.create(form)
    router.push('/admin/shared-modules')
  } catch (err) {
    error.value = err.response?.data?.message || t('mods.saveFailed')
  } finally {
    saving.value = false
  }
}
</script>
