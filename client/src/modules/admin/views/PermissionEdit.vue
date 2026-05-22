<template>
  <AppLayout>
    <div class="space-y-6">

      <div class="flex items-center gap-3">
        <RouterLink to="/admin/permissions" class="text-[#9BA7B0] hover:text-[#637381] transition">
          <ArrowLeftIcon class="w-5 h-5" />
        </RouterLink>
        <div>
          <h1 class="text-xl font-semibold text-[#1C2434]">{{ t('perms.editTitle') }}</h1>
          <p class="text-sm text-[#637381] mt-0.5">{{ t('perms.editDesc') }}</p>
        </div>
      </div>

      <div v-if="loading" class="text-center py-12 text-[#9BA7B0]">
        <div class="inline-block w-5 h-5 border-2 border-primary-500 border-t-transparent animate-spin" />
      </div>

      <template v-else>

        <div class="bg-white border border-[#E2E8F0] shadow-sm overflow-hidden">
          <div class="px-6 py-4 border-b border-[#E2E8F0] flex items-center gap-2">
            <h2 class="text-sm font-semibold text-[#374151]">{{ t('perms.permDetails') }}</h2>
            <span class="text-xs font-mono text-[#9BA7B0] ml-auto">{{ form.slug }}</span>
          </div>
          <div class="px-6 py-5 space-y-5">
            <div class="grid grid-cols-2 gap-5">
              <FormField
                v-model="form.name"
                name="name"
                :label="t('perms.colName')"
                required
                :errors="fieldErrors"
              />
              <FormField
                v-model="form.group"
                name="group"
                :label="t('perms.groupLabel')"
                :placeholder="t('perms.groupPh')"
                :errors="fieldErrors"
              />
              <FormField
                v-model="form.description"
                name="description"
                :label="t('common.description')"
                :errors="fieldErrors"
                wrapper-class="col-span-2"
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
          <RouterLink to="/admin/permissions"
            class="px-4 py-2.5 text-sm border border-[#E2E8F0] hover:bg-[#F7F9FC] transition text-[#637381]">
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
import { usePermissionsStore } from '@/stores/permissions'

const route  = useRoute()
const router = useRouter()
const { t }  = useI18n()
const permissionsStore = usePermissionsStore()

const loading = ref(true)
const saving  = ref(false)
const error   = ref('')
const { fieldErrors, setFromError, reset: resetErrors } = useFieldErrors()

const form = reactive({ id: null, name: '', slug: '', group: '', description: '' })

onMounted(async () => {
  await permissionsStore.fetchAll()
  const perm = permissionsStore.permissions.find(p => String(p.id) === route.params.id)
  if (!perm) { router.push('/admin/permissions'); return }
  Object.assign(form, {
    id:          perm.id,
    name:        perm.name        ?? '',
    slug:        perm.slug        ?? '',
    group:       perm.group       ?? '',
    description: perm.description ?? '',
  })
  loading.value = false
})

async function save() {
  error.value  = ''
  resetErrors()
  saving.value = true
  try {
    await permissionsStore.update(form.id, { name: form.name, group: form.group, description: form.description })
    router.push('/admin/permissions')
  } catch (err) {
    const had = setFromError(err)
    if (!had) error.value = err.response?.data?.message || t('perms.saveFailed')
  } finally {
    saving.value = false
  }
}
</script>
