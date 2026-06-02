<template>
  <AppLayout>
    <div class="space-y-6">

      <PageHeader :title="t('mods.editTitle')" :subtitle="t('mods.editDesc')" back-to="/admin/modules" />

      <LoadingSpinner v-if="loading" padding="md" />

      <template v-else>

        <FormCard :title="t('mods.moduleDetails')">
          <template #header>
            <span class="badge badge-amber ml-1">Core</span>
          </template>
          <template #actions>
            <span class="text-xs font-mono text-[#9BA7B0]">{{ form.slug }}</span>
          </template>

          <div class="grid grid-cols-2 gap-5">

            <FormField
              v-model="form.name"
              name="name"
              :label="t('common.name')"
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
        </FormCard>

        <ErrorBanner :message="error" />

        <FormFooter
          cancel-to="/admin/modules"
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
import { useModulesStore } from '@/stores/modules'

const route = useRoute()
const router = useRouter()
const { t } = useI18n()
const modulesStore = useModulesStore()

const loading = ref(true)
const saving  = ref(false)
const error   = ref('')
const { fieldErrors, setFromError, reset: resetErrors } = useFieldErrors()

const form = reactive({
  name:        '',
  slug:        '',
  description: '',
  icon:        '',
  order:       0,
})

onMounted(async () => {
  if (!modulesStore.modules.length) await modulesStore.fetchAll()
  const mod = modulesStore.modules.find((m) => m.id === Number(route.params.id))
  if (!mod) { router.push('/admin/modules'); return }
  Object.assign(form, mod)
  loading.value = false
})

async function save() {
  error.value = ''
  resetErrors()
  saving.value = true
  try {
    await modulesStore.update(form.id, form)
    router.push('/admin/modules')
  } catch (err) {
    const had = setFromError(err)
    if (!had) error.value = err.response?.data?.message || t('mods.saveFailed')
  } finally {
    saving.value = false
  }
}
</script>
