<template>
  <AppLayout>
    <div class="space-y-6">

      <PageHeader :title="t('mods.newShared')" :subtitle="t('mods.createSharedDesc')" back-to="/admin/shared-modules" />

      <FormCard :title="t('mods.moduleDetails')">
        <div class="grid grid-cols-2 gap-5">

          <FormField
            v-model="form.name"
            name="name"
            :label="t('common.name')"
            placeholder="My Module"
            required
            :errors="fieldErrors"
            wrapper-class="col-span-2"
          />

          <FormField
            v-model="form.slug"
            name="slug"
            :label="t('common.slug')"
            :placeholder="t('roles.slugPh')"
            required
            :errors="fieldErrors"
            input-class="font-mono"
            wrapper-class="col-span-2"
          >
            <template #label>
              {{ t('common.slug') }}
              <span class="text-[#9BA7B0] font-normal ml-1 normal-case">{{ t('roles.slugHint') }}</span>
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

          <FormField
            v-model="form.icon"
            name="icon"
            :label="t('common.icon')"
            placeholder="cube"
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
      </FormCard>

      <ErrorBanner :message="error" />

      <FormFooter
        cancel-to="/admin/shared-modules"
        :cancel-label="t('common.cancel')"
        :save-label="t('common.create')"
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
import { useModulesStore } from '@/stores/modules'

const router = useRouter()
const { t }  = useI18n()
const modulesStore = useModulesStore()

const saving = ref(false)
const error  = ref('')
const { fieldErrors, setFromError, reset: resetErrors } = useFieldErrors()

const form = reactive({ name: '', slug: '', description: '', icon: 'cube', order: 100 })

async function save() {
  error.value  = ''
  resetErrors()
  saving.value = true
  try {
    await modulesStore.create(form)
    router.push('/admin/shared-modules')
  } catch (err) {
    const had = setFromError(err)
    if (!had) error.value = err.response?.data?.message || t('mods.saveFailed')
  } finally {
    saving.value = false
  }
}
</script>
