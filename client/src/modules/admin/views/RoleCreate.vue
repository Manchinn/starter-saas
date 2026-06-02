<template>
  <AppLayout>
    <div class="space-y-6">

      <PageHeader :title="t('roles.newTitle')" :subtitle="t('roles.newDesc')" back-to="/admin/roles" />

      <FormCard :title="t('roles.roleDetails')">
        <div class="grid grid-cols-2 gap-5">

          <FormField
            v-model="form.name"
            name="name"
            :label="t('common.name')"
            required
            :errors="fieldErrors"
          />

          <FormField
            v-model="form.slug"
            name="slug"
            :label="t('common.slug')"
            :placeholder="t('roles.slugPh')"
            required
            :errors="fieldErrors"
            input-class="font-mono"
          >
            <template #label>
              {{ t('common.slug') }}
              <span class="text-[#9BA7B0] font-normal normal-case ml-1">{{ t('roles.slugHint') }}</span>
            </template>
          </FormField>

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
        :save-label="t('roles.create')"
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
import ColorField from '@/components/form/ColorField.vue'
import ErrorBanner from '@/components/form/ErrorBanner.vue'
import FormFooter from '@/components/form/FormFooter.vue'
import { useFieldErrors } from '@/composables/useFieldErrors'
import { useRolesStore } from '@/stores/roles'

const router = useRouter()
const { t } = useI18n()
const rolesStore = useRolesStore()

const error  = ref('')
const saving = ref(false)
const { fieldErrors, setFromError, reset: resetErrors } = useFieldErrors()

const form = reactive({
  name:        '',
  slug:        '',
  description: '',
  color:       '#6366f1',
})

async function save() {
  error.value = ''
  resetErrors()
  saving.value = true
  try {
    await rolesStore.create(form)
    router.push('/admin/roles')
  } catch (err) {
    const had = setFromError(err)
    if (!had) error.value = err.response?.data?.message || t('roles.saveFailed')
  } finally {
    saving.value = false
  }
}
</script>
