<template>
  <AppLayout>
    <div class="space-y-6">

      <div class="flex items-center justify-between gap-3">
        <div class="flex items-center gap-3">
          <RouterLink to="/erp/alerts" class="text-[#9BA7B0] hover:text-[#637381] transition">
            <ArrowLeftIcon class="w-5 h-5" />
          </RouterLink>
          <h1 class="text-2xl font-bold text-[#1C2434]">{{ t('erp.alerts.edit') }}</h1>
        </div>
        <KeyboardShortcuts :shortcuts="shortcuts" width="w-56" />
      </div>

      <div v-if="loadError" class="bg-red-50 text-red-700 text-sm px-4 py-3 max-w-2xl">{{ t('erp.alerts.notFound') }}</div>

      <div v-else class="bg-white border border-[#E2E8F0] p-6 space-y-5">
        <AlertForm v-model="form" :options="options" :errors="fieldErrors" />

        <div v-if="error" class="bg-red-50 text-red-700 text-sm px-4 py-2">{{ error }}</div>

        <div class="flex justify-end gap-3 pt-2">
          <AppButton to="/erp/alerts" variant="secondary">{{ t('common.cancel') }}</AppButton>
          <AppButton @click="save" :loading="saving">
            {{ saving ? t('common.saving') : t('common.saveChanges') }}
          </AppButton>
        </div>
      </div>
    </div>
  </AppLayout>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { ArrowLeftIcon } from '@heroicons/vue/24/outline'
import AppLayout from '@/layouts/AppLayout.vue'
import AppButton from '@/components/AppButton.vue'
import KeyboardShortcuts from '@/components/KeyboardShortcuts.vue'
import AlertForm from './AlertForm.vue'
import { useFieldErrors } from '@/composables/useFieldErrors'
import { useFormShortcuts } from '@/composables/useShortcuts'
import { parseApiError } from '@/utils/apiError'
import api from '@/api'

const { t } = useI18n()
const route = useRoute()
const router = useRouter()
const id = route.params.id

const form = ref({ title: '', body: '', severity: 'info', scope: 'global', moduleSlug: '', departmentId: '', link: '', expiresAt: '' })
const options = ref({ modules: [], departments: [] })
const error = ref('')
const loadError = ref(false)
const saving = ref(false)
const { fieldErrors, setFromError, setField, reset: resetErrors } = useFieldErrors()
const { shortcuts } = useFormShortcuts({ save: () => save(), cancel: () => router.push('/erp/alerts') })

onMounted(async () => {
  try {
    const [{ data: opt }, { data: res }] = await Promise.all([
      api.get('/erp/alerts/options'),
      api.get(`/erp/alerts/${id}`),
    ])
    options.value = opt.data
    const a = res.data.alert
    form.value = {
      title: a.title || '',
      body: a.body || '',
      severity: a.severity || 'info',
      scope: a.scope || 'global',
      moduleSlug: a.moduleSlug || '',
      departmentId: a.departmentId || '',
      link: a.link || '',
      expiresAt: a.expiresAt ? String(a.expiresAt).slice(0, 10) : '',
    }
  } catch {
    loadError.value = true
  }
})

function buildPayload() {
  const f = form.value
  return {
    title: f.title,
    body: f.body || null,
    severity: f.severity,
    scope: f.scope,
    moduleSlug: f.scope === 'module' ? f.moduleSlug : null,
    departmentId: f.scope === 'department' ? f.departmentId : null,
    link: f.link || null,
    expiresAt: f.expiresAt || null,
  }
}

async function save() {
  error.value = ''
  resetErrors()
  if (!form.value.title.trim()) { setField('title', t('common.errors.required', { field: t('erp.alerts.titleField') })); return }
  saving.value = true
  try {
    await api.put(`/erp/alerts/${id}`, buildPayload())
    router.push('/erp/alerts')
  } catch (err) {
    const had = setFromError(err)
    if (!had) error.value = parseApiError(err, 'Failed to update alert')
  } finally {
    saving.value = false
  }
}
</script>
