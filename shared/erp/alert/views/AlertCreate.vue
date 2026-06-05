<template>
  <AppLayout>
    <div class="space-y-6">

      <div class="flex items-center justify-between gap-3">
        <div class="flex items-center gap-3">
          <RouterLink to="/erp/alerts" class="text-[#9BA7B0] hover:text-[#637381] transition">
            <ArrowLeftIcon class="w-5 h-5" />
          </RouterLink>
          <h1 class="text-2xl font-bold text-[#1C2434]">{{ t('erp.alerts.new') }}</h1>
        </div>
        <KeyboardShortcuts :shortcuts="shortcuts" width="w-56" />
      </div>

      <div class="bg-white border border-[#E2E8F0] p-6 space-y-5">
        <AlertForm ref="alertFormRef" v-model="form" :options="options" :errors="fieldErrors" />

        <div v-if="error" class="bg-red-50 text-red-700 text-sm px-4 py-2">{{ error }}</div>

        <div class="flex justify-end gap-3 pt-2">
          <AppButton to="/erp/alerts" variant="secondary">{{ t('common.cancel') }}</AppButton>
          <AppButton @click="save" :loading="saving">
            {{ saving ? t('common.creating') : t('erp.alerts.create') }}
          </AppButton>
        </div>
      </div>
    </div>
  </AppLayout>
</template>

<script setup>
import { ref, onMounted, nextTick } from 'vue'
import { useRouter } from 'vue-router'
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
const router = useRouter()

const alertFormRef = ref(null)
const form = ref({ title: '', body: '', severity: 'info', scope: 'global', moduleSlug: '', departmentId: '', link: '', expiresAt: '' })
const options = ref({ modules: [], departments: [] })
const error = ref('')
const saving = ref(false)
const { fieldErrors, setFromError, setField, reset: resetErrors } = useFieldErrors()
const { shortcuts } = useFormShortcuts({ save: () => save(), cancel: () => router.push('/erp/alerts') })

onMounted(async () => {
  const { data } = await api.get('/erp/alerts/options')
  options.value = data.data
  await nextTick()
  alertFormRef.value?.focus()
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
    await api.post('/erp/alerts', buildPayload())
    router.push('/erp/alerts')
  } catch (err) {
    const had = setFromError(err)
    if (!had) error.value = parseApiError(err, 'Failed to create alert')
  } finally {
    saving.value = false
  }
}
</script>
