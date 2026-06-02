<template>
  <AppLayout>
    <div class="space-y-6">

      <PageHeader :title="t('perms.editTitle')" :subtitle="t('perms.editDesc')" back-to="/admin/permissions" />

      <LoadingSpinner v-if="loading" padding="md" />

      <template v-else>

        <FormCard :title="t('perms.permDetails')">
          <template #actions>
            <span class="text-xs font-mono text-[#9BA7B0]">{{ form.slug }}</span>
          </template>

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
        </FormCard>

        <ErrorBanner :message="error" />

        <FormFooter
          cancel-to="/admin/permissions"
          :cancel-label="t('common.cancel')"
          :save-label="t('common.saveChanges')"
          :saving-label="t('common.saving')"
          :saving="saving"
          @save="save"
        />

      </template>
    </div>
  </AppLayout>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import AppLayout from '@/layouts/AppLayout.vue'
import PageHeader from '@/components/form/PageHeader.vue'
import FormCard from '@/components/form/FormCard.vue'
import FormField from '@/components/form/FormField.vue'
import ErrorBanner from '@/components/form/ErrorBanner.vue'
import FormFooter from '@/components/form/FormFooter.vue'
import LoadingSpinner from '@/components/form/LoadingSpinner.vue'
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
