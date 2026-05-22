<template>
  <AppLayout>
    <div class="space-y-6">

      <div class="flex items-center gap-3">
        <RouterLink to="/admin/shared-modules" class="text-[#9BA7B0] hover:text-[#637381] transition">
          <ArrowLeftIcon class="w-5 h-5" />
        </RouterLink>
        <div>
          <h1 class="text-xl font-semibold text-[#1C2434]">{{ t('mods.editShared') }}</h1>
          <p class="text-sm text-[#637381] mt-0.5">{{ t('mods.editSharedDesc') }}</p>
        </div>
      </div>

      <div v-if="loading" class="text-center py-12 text-[#9BA7B0]">
        <div class="inline-block w-5 h-5 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
      </div>

      <template v-else>

        <div class="bg-white rounded-2xl border border-[#E2E8F0] shadow-sm overflow-hidden">
          <div class="px-6 py-4 border-b border-[#E2E8F0] flex items-center justify-between">
            <h2 class="text-sm font-semibold text-[#374151]">{{ t('mods.moduleDetails') }}</h2>
            <span class="text-xs font-mono text-[#9BA7B0]">{{ form.slug }}</span>
          </div>
          <div class="px-6 py-5 space-y-5">
            <div class="grid grid-cols-2 gap-5">

              <FormField
                v-model="form.name"
                name="name"
                :label="t('common.name')"
                required
                :errors="fieldErrors"
                wrapper-class="col-span-2"
              />

              <div class="col-span-2">
                <label class="label">{{ t('common.description') }}</label>
                <textarea v-model="form.description" rows="3" class="input resize-none" />
              </div>

              <FormField
                v-model="form.icon"
                name="icon"
                :label="t('common.icon')"
                :errors="fieldErrors"
              />

              <FormField
                v-model.number="form.order"
                name="order"
                type="number"
                :label="t('common.order')"
                :errors="fieldErrors"
              />

            </div>
          </div>
        </div>

        <div v-if="error"
          class="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3">
          <ExclamationCircleIcon class="w-4 h-4 flex-shrink-0" />
          {{ error }}
        </div>

        <div class="flex justify-end gap-3">
          <RouterLink to="/admin/shared-modules"
            class="px-4 py-2.5 text-sm border border-[#E2E8F0] rounded-xl hover:bg-[#F7F9FC] transition text-[#637381]">
            {{ t('common.cancel') }}
          </RouterLink>
          <button @click="save" :disabled="saving"
            class="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold bg-primary-500 text-white hover:bg-primary-700 disabled:opacity-50 transition shadow-sm">
            {{ saving ? t('common.saving') : t('common.saveChanges') }}
          </button>
        </div>

      </template>
    </div>
  </AppLayout>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { ArrowLeftIcon, ExclamationCircleIcon } from '@heroicons/vue/24/outline'
import AppLayout from '@/layouts/AppLayout.vue'
import FormField from '@/components/form/FormField.vue'
import { useFieldErrors } from '@/composables/useFieldErrors'
import { useModulesStore } from '@/stores/modules'

const route  = useRoute()
const router = useRouter()
const { t }  = useI18n()
const modulesStore = useModulesStore()

const loading = ref(true)
const saving  = ref(false)
const error   = ref('')
const { fieldErrors, setFromError, reset: resetErrors } = useFieldErrors()

const form = reactive({ id: null, name: '', slug: '', description: '', icon: '', order: 0 })

onMounted(async () => {
  await modulesStore.fetchAll()
  const mod = modulesStore.modules.find(m => String(m.id) === route.params.id)
  if (!mod) { router.push('/admin/shared-modules'); return }
  Object.assign(form, {
    id:          mod.id,
    name:        mod.name        ?? '',
    slug:        mod.slug        ?? '',
    description: mod.description ?? '',
    icon:        mod.icon        ?? '',
    order:       mod.order       ?? 0,
  })
  loading.value = false
})

async function save() {
  error.value  = ''
  resetErrors()
  saving.value = true
  try {
    await modulesStore.update(form.id, { name: form.name, description: form.description, icon: form.icon, order: form.order })
    router.push('/admin/shared-modules')
  } catch (err) {
    const had = setFromError(err)
    if (!had) error.value = err.response?.data?.message || t('mods.saveFailed')
  } finally {
    saving.value = false
  }
}
</script>
