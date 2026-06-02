<template>
  <AppLayout>
    <div class="space-y-6">

      <PageHeader :title="t('perms.newTitle')" :subtitle="t('perms.newDesc')" back-to="/admin/permissions" />

      <FormCard :title="t('perms.permDetails')">
        <div class="grid grid-cols-2 gap-5">

          <FormField
            v-model="form.name"
            name="name"
            :label="t('perms.colName')"
            required
            :errors="fieldErrors"
          />

          <FormField
            v-model="form.slug"
            name="slug"
            :label="t('common.slug')"
            :placeholder="t('perms.slugPh')"
            required
            :errors="fieldErrors"
            input-class="font-mono"
          >
            <template #label>
              {{ t('common.slug') }}
              <span class="text-[#9BA7B0] font-normal normal-case ml-1">{{ t('perms.slugHint') }}</span>
            </template>
          </FormField>

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
          />

        </div>
      </FormCard>

      <ErrorBanner :message="error" />

      <FormFooter
        cancel-to="/admin/permissions"
        :cancel-label="t('common.cancel')"
        :save-label="t('perms.create')"
        :saving-label="t('common.saving')"
        :saving="saving"
        @save="save"
      />

    </div>
  </AppLayout>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import AppLayout from '@/layouts/AppLayout.vue'
import PageHeader from '@/components/form/PageHeader.vue'
import FormCard from '@/components/form/FormCard.vue'
import FormField from '@/components/form/FormField.vue'
import ErrorBanner from '@/components/form/ErrorBanner.vue'
import FormFooter from '@/components/form/FormFooter.vue'
import { useFieldErrors } from '@/composables/useFieldErrors'
import { usePermissionsStore } from '@/stores/permissions'

const router = useRouter()
const { t } = useI18n()
const permissionsStore = usePermissionsStore()

const error  = ref('')
const saving = ref(false)
const { fieldErrors, setFromError, reset: resetErrors } = useFieldErrors()

const form = reactive({
  name:        '',
  slug:        '',
  group:       'general',
  description: '',
})

async function save() {
  error.value = ''
  resetErrors()
  saving.value = true
  try {
    await permissionsStore.create(form)
    router.push('/admin/permissions')
  } catch (err) {
    const had = setFromError(err)
    if (!had) error.value = err.response?.data?.message || t('perms.saveFailed')
  } finally {
    saving.value = false
  }
}
</script>
