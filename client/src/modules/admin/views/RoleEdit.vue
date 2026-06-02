<template>
  <AppLayout>
    <div class="space-y-6">

      <PageHeader :title="t('roles.editTitle')" :subtitle="t('roles.editDesc')" back-to="/admin/roles" />

      <LoadingSpinner v-if="loading" padding="md" />

      <template v-else>

        <FormCard :title="t('roles.roleDetails')">
          <template #header>
            <span v-if="form.isSystem" class="badge badge-amber ml-1">{{ t('roles.systemBadge') }}</span>
          </template>
          <template #actions>
            <span class="text-xs font-mono text-[#9BA7B0]">{{ form.slug }}</span>
          </template>

          <div class="grid grid-cols-2 gap-5">

            <FormField
              v-model="form.name"
              name="name"
              :label="t('common.name')"
              required
              :errors="fieldErrors"
              wrapper-class="col-span-2"
            />

            <FormField
              v-model="form.description"
              name="description"
              textarea
              :label="t('common.description')"
              :errors="fieldErrors"
              wrapper-class="col-span-2"
            />

            <ColorField v-model="form.color" :label="t('common.color')" />

          </div>
        </FormCard>

        <ErrorBanner :message="error" />

        <FormFooter
          cancel-to="/admin/roles"
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
import ColorField from '@/components/form/ColorField.vue'
import ErrorBanner from '@/components/form/ErrorBanner.vue'
import FormFooter from '@/components/form/FormFooter.vue'
import LoadingSpinner from '@/components/form/LoadingSpinner.vue'
import { useFieldErrors } from '@/composables/useFieldErrors'
import { useRolesStore } from '@/stores/roles'

const route = useRoute()
const router = useRouter()
const { t } = useI18n()
const rolesStore = useRolesStore()

const loading = ref(true)
const saving  = ref(false)
const error   = ref('')
const { fieldErrors, setFromError, reset: resetErrors } = useFieldErrors()

const form = reactive({
  id:          null,
  name:        '',
  slug:        '',
  description: '',
  color:       '#6366f1',
  isSystem:    false,
})

onMounted(async () => {
  await rolesStore.fetchAll()
  const role = rolesStore.roles.find((r) => String(r.id) === route.params.id)
  if (!role) { router.push('/admin/roles'); return }
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
    await rolesStore.update(form.id, {
      name:        form.name,
      description: form.description,
      color:       form.color,
    })
    router.push('/admin/roles')
  } catch (err) {
    const had = setFromError(err)
    if (!had) error.value = err.response?.data?.message || t('roles.saveFailed')
  } finally {
    saving.value = false
  }
}
</script>
