<template>
  <AppLayout>
    <div class="space-y-6">

      <div class="flex items-center gap-3">
        <RouterLink to="/hrms/roles" class="text-[#9BA7B0] hover:text-[#637381] transition">
          <ArrowLeftIcon class="w-5 h-5" />
        </RouterLink>
        <div>
          <h1 class="text-xl font-semibold text-[#1C2434]">{{ t('hrms.roles.editTitle') }}</h1>
          <p class="text-sm text-[#637381] mt-0.5">{{ t('hrms.roles.editDesc') }}</p>
        </div>
      </div>

      <div v-if="loading" class="text-center py-12 text-[#9BA7B0]">
        <div class="inline-block w-5 h-5 border-2 border-primary-500 border-t-transparent animate-spin" />
      </div>

      <template v-else>
        <div class="bg-white border border-[#E2E8F0] shadow-sm overflow-hidden">
          <div class="px-6 py-4 border-b border-[#E2E8F0] flex items-center gap-2">
            <h2 class="text-sm font-semibold text-[#374151]">{{ t('hrms.roles.roleDetails') }}</h2>
            <span v-if="form.isSystem" class="badge badge-amber ml-1">{{ t('hrms.roles.systemBadge') }}</span>
            <span class="text-xs font-mono text-[#9BA7B0] ml-auto">{{ form.slug }}</span>
          </div>
          <div class="px-6 py-5 space-y-5">
            <div class="grid grid-cols-2 gap-5">

              <FormField v-model="form.name" name="name" :label="t('common.name')" required :errors="fieldErrors" wrapper-class="col-span-2" />

              <div class="col-span-2">
                <label class="label">{{ t('common.description') }}</label>
                <textarea v-model="form.description" rows="3" class="input resize-none" />
              </div>

              <div>
                <label class="label">{{ t('common.color') }}</label>
                <div class="flex items-center gap-3">
                  <input type="color" v-model="form.color" class="h-9 w-16 border border-[#E2E8F0] cursor-pointer p-0.5" />
                  <span class="text-sm font-mono text-[#637381]">{{ form.color }}</span>
                </div>
              </div>

            </div>
          </div>
        </div>

        <div v-if="error" class="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3">
          <ExclamationCircleIcon class="w-4 h-4 flex-shrink-0" />
          {{ error }}
        </div>

        <div class="flex justify-end gap-3">
          <RouterLink to="/hrms/roles" class="btn-secondary">{{ t('common.cancel') }}</RouterLink>
          <button @click="save" :disabled="saving" class="btn-primary">
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
import { useHrmsRolesStore } from '@/stores/hrmsRoles'

const route = useRoute()
const router = useRouter()
const { t } = useI18n()
const store = useHrmsRolesStore()

const loading = ref(true)
const saving  = ref(false)
const error   = ref('')
const { fieldErrors, setFromError, reset: resetErrors } = useFieldErrors()

const form = reactive({ id: null, name: '', slug: '', description: '', color: '#6366f1', isSystem: false })

onMounted(async () => {
  if (!store.roles.length) await store.fetchAll()
  const role = store.roles.find((r) => String(r.id) === route.params.id)
  if (!role) { router.push('/hrms/roles'); return }
  Object.assign(form, {
    id:          role.id,
    name:        role.name        ?? '',
    slug:        role.slug        ?? '',
    description: role.description ?? '',
    color:       role.color       ?? '#6366f1',
    isSystem:    role.isSystem    ?? false,
  })
  loading.value = false
})

async function save() {
  error.value = ''
  resetErrors()
  saving.value = true
  try {
    await store.update(form.id, { name: form.name, description: form.description, color: form.color })
    router.push('/hrms/roles')
  } catch (err) {
    const had = setFromError(err)
    if (!had) error.value = err.response?.data?.message || t('hrms.roles.saveFailed')
  } finally {
    saving.value = false
  }
}
</script>
