<template>
  <div class="space-y-6">

    <FormCard :title="t('settings.email.title')">
      <p class="text-[13px] text-[#637381] mb-5">{{ t('settings.email.desc') }}</p>

      <!-- Status pill -->
      <div class="mb-5">
        <span v-if="meta.configured" class="badge badge-green">
          <span class="w-1.5 h-1.5 bg-emerald-500"></span>
          {{ t('settings.email.statusConfigured') }}
        </span>
        <span v-else class="badge bg-amber-50 text-amber-700">
          <span class="w-1.5 h-1.5 bg-amber-500"></span>
          {{ t('settings.email.statusStub') }}
        </span>
      </div>

      <div v-if="loading" class="py-6">
        <LoadingSpinner />
      </div>

      <template v-else>
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <FormField
            v-model="form.host"
            name="host"
            :label="t('settings.email.host')"
            :placeholder="t('settings.email.hostPh')"
            :hint="t('settings.email.hostHint')"
            :errors="fieldErrors"
          />
          <FormField
            v-model.number="form.port"
            name="port"
            type="number"
            :label="t('settings.email.port')"
            :errors="fieldErrors"
          />
          <FormField
            v-model="form.user"
            name="user"
            :label="t('settings.email.user')"
            :placeholder="t('settings.email.userPh')"
            autocomplete="off"
            :errors="fieldErrors"
          />
          <FormField
            v-model="form.pass"
            name="pass"
            type="password"
            :label="t('settings.email.pass')"
            :placeholder="meta.hasPassword ? t('settings.email.passKeepPh') : ''"
            :hint="meta.hasPassword ? t('settings.email.passKeepHint') : ''"
            autocomplete="new-password"
            :errors="fieldErrors"
          />
          <FormField
            v-model="form.from"
            name="from"
            :label="t('settings.email.from')"
            :placeholder="t('settings.email.fromPh')"
            required
            :errors="fieldErrors"
          />

          <!-- Secure (TLS) toggle -->
          <div class="flex flex-col">
            <span class="label">{{ t('settings.email.secure') }}</span>
            <label class="mt-2 inline-flex items-center gap-2.5 cursor-pointer select-none">
              <input
                v-model="form.secure"
                type="checkbox"
                class="w-4 h-4 accent-primary-600 cursor-pointer"
              />
              <span class="text-[13px] text-[#637381]">{{ t('settings.email.secureHint') }}</span>
            </label>
          </div>
        </div>

        <ErrorBanner v-if="error" :message="error" class="mt-5" />
        <SuccessBanner v-if="savedMsg" :message="savedMsg" class="mt-5" />

        <div class="mt-6 pt-5 border-t border-[#E2E8F0] flex items-center justify-end gap-2">
          <button type="button" class="btn-secondary" :disabled="testing" @click="testConnection">
            <ArrowPathIcon class="w-4 h-4" :class="testing && 'animate-spin'" />
            {{ t('settings.email.testConnection') }}
          </button>
          <button type="button" class="btn-primary" :disabled="saving" @click="save">
            {{ saving ? t('common.saving') : t('settings.email.save') }}
          </button>
        </div>
      </template>
    </FormCard>

    <!-- Send a test email -->
    <FormCard :title="t('settings.email.testSection')">
      <p class="text-[13px] text-[#637381] mb-5">{{ t('settings.email.testDesc') }}</p>
      <div class="flex flex-col sm:flex-row sm:items-end gap-3">
        <FormField
          v-model="testTo"
          name="to"
          :label="t('settings.email.testTo')"
          :placeholder="t('settings.email.testToPh')"
          wrapper-class="flex-1"
        />
        <button type="button" class="btn-secondary sm:mb-0.5" :disabled="sending || !testTo" @click="sendTest">
          <PaperAirplaneIcon class="w-4 h-4" :class="sending && 'animate-pulse'" />
          {{ sending ? t('common.saving') : t('settings.email.sendTest') }}
        </button>
      </div>
      <SuccessBanner v-if="testMsg" :message="testMsg" class="mt-4" />
      <ErrorBanner v-if="testError" :message="testError" class="mt-4" />
    </FormCard>

  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { ArrowPathIcon, PaperAirplaneIcon } from '@heroicons/vue/24/outline'
import api from '@/api'
import FormCard from '@/components/form/FormCard.vue'
import FormField from '@/components/form/FormField.vue'
import ErrorBanner from '@/components/form/ErrorBanner.vue'
import SuccessBanner from '@/components/form/SuccessBanner.vue'
import LoadingSpinner from '@/components/form/LoadingSpinner.vue'
import { useFieldErrors } from '@/composables/useFieldErrors'

const { t } = useI18n()
const { fieldErrors, setFromError, reset: resetErrors } = useFieldErrors()

const loading = ref(true)
const saving  = ref(false)
const testing = ref(false)
const sending = ref(false)
const error     = ref('')
const savedMsg  = ref('')
const testMsg   = ref('')
const testError = ref('')
const testTo    = ref('')

const form = reactive({ host: '', port: 587, secure: false, user: '', pass: '', from: '' })
const meta = reactive({ configured: false, hasPassword: false })

function applyData(d) {
  form.host   = d.host || ''
  form.port   = d.port || 587
  form.secure = !!d.secure
  form.user   = d.user || ''
  form.from   = d.from || ''
  form.pass   = '' // never populated from the server
  meta.configured  = !!d.configured
  meta.hasPassword = !!d.hasPassword
}

async function load() {
  loading.value = true
  try {
    const { data } = await api.get('/settings/email')
    applyData(data.data)
  } catch (err) {
    error.value = err.response?.data?.message || t('settings.email.loadFailed')
  } finally {
    loading.value = false
  }
}

async function save() {
  error.value = ''
  savedMsg.value = ''
  resetErrors()
  saving.value = true
  try {
    const { data } = await api.put('/settings/email', { ...form })
    applyData(data.data)
    savedMsg.value = t('settings.email.saved')
  } catch (err) {
    const had = setFromError(err)
    if (!had) error.value = err.response?.data?.message || t('settings.email.saveFailed')
  } finally {
    saving.value = false
  }
}

async function testConnection() {
  error.value = ''
  savedMsg.value = ''
  testing.value = true
  try {
    const { data } = await api.post('/settings/email/test-connection')
    savedMsg.value = data.data.message || t('settings.email.testConnectionOk')
  } catch (err) {
    error.value = err.response?.data?.message || t('settings.email.testConnectionFailed')
  } finally {
    testing.value = false
  }
}

async function sendTest() {
  testMsg.value = ''
  testError.value = ''
  sending.value = true
  try {
    const { data } = await api.post('/settings/email/test', { to: testTo.value })
    testMsg.value = data.data.message || t('settings.email.testSent')
  } catch (err) {
    testError.value = err.response?.data?.message || t('settings.email.testFailed')
  } finally {
    sending.value = false
  }
}

onMounted(load)
</script>
