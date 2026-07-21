<template>
  <AppLayout>
    <div class="space-y-6">

      <div>
        <h1 class="text-xl font-semibold text-[#1C2434]">{{ t('erp.lineIntegration.title') }}</h1>
        <p class="text-sm text-[#637381] mt-0.5">{{ t('erp.lineIntegration.subtitle') }}</p>
      </div>

      <FormCard
        :title="t('erp.lineIntegration.connectionSection')"
        :subtitle="t('erp.lineIntegration.connectionDesc')"
        :icon="ChatBubbleLeftRightIcon"
        icon-color="primary"
      >
        <div class="mb-5 flex flex-wrap items-center gap-2">
          <span v-if="configured" class="badge badge-green">
            <span class="w-1.5 h-1.5 bg-emerald-500"></span>
            {{ t('erp.lineIntegration.statusConfigured') }}
          </span>
          <span v-else class="badge bg-amber-50 text-amber-700">
            <span class="w-1.5 h-1.5 bg-amber-500"></span>
            {{ t('erp.lineIntegration.statusMissing') }}
          </span>
          <span v-if="meta.hasChannelSecret" class="badge bg-slate-50 text-slate-600">
            {{ t('erp.lineIntegration.hasSecret') }}
          </span>
          <span v-if="meta.hasChannelAccessToken" class="badge bg-slate-50 text-slate-600">
            {{ t('erp.lineIntegration.hasToken') }}
          </span>
        </div>

        <div v-if="loading" class="py-6">
          <LoadingSpinner />
        </div>

        <template v-else>
          <div class="mb-5 rounded border border-[#E2E8F0] bg-[#F7F9FC] px-4 py-3">
            <p class="text-xs font-semibold uppercase tracking-wide text-[#637381]">
              {{ t('erp.lineIntegration.webhookLabel') }}
            </p>
            <code class="mt-1 block break-all text-[13px] text-[#1C2434]">{{ webhookUrl }}</code>
            <p class="mt-1.5 text-[11.5px] text-[#9BA7B0]">{{ t('erp.lineIntegration.webhookHint') }}</p>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <FormField
              v-model="form.messagingChannelId"
              name="messagingChannelId"
              :label="t('erp.lineIntegration.messagingChannelId')"
              required
              :errors="fieldErrors"
            />
            <FormField
              v-model="form.botUserId"
              name="botUserId"
              :label="t('erp.lineIntegration.botUserId')"
              required
              :errors="fieldErrors"
            />
            <FormField
              v-model="form.liffId"
              name="liffId"
              :label="t('erp.lineIntegration.liffId')"
              required
              :errors="fieldErrors"
            />
            <FormField
              v-model="form.liffChannelId"
              name="liffChannelId"
              :label="t('erp.lineIntegration.liffChannelId')"
              required
              :errors="fieldErrors"
            />
            <FormField
              v-model="form.defaultStoreId"
              name="defaultStoreId"
              :label="t('erp.lineIntegration.defaultStoreId')"
              :hint="t('erp.lineIntegration.defaultStoreHint')"
              required
              :errors="fieldErrors"
            />
            <FormField
              v-model="form.channelSecret"
              name="channelSecret"
              type="password"
              :label="t('erp.lineIntegration.channelSecret')"
              :placeholder="meta.hasChannelSecret ? '••••••••' : ''"
              :hint="t('erp.lineIntegration.channelSecretHint')"
              :required="!meta.hasChannelSecret"
              autocomplete="new-password"
              :errors="fieldErrors"
            />
            <FormField
              v-model="form.channelAccessToken"
              name="channelAccessToken"
              type="password"
              :label="t('erp.lineIntegration.channelAccessToken')"
              :placeholder="meta.hasChannelAccessToken ? '••••••••' : ''"
              :hint="t('erp.lineIntegration.channelAccessTokenHint')"
              :required="!meta.hasChannelAccessToken"
              autocomplete="new-password"
              :errors="fieldErrors"
            />

            <div class="flex flex-col">
              <span class="label">{{ t('erp.lineIntegration.enableLiff') }}</span>
              <label class="mt-2 inline-flex items-center gap-2.5 cursor-pointer select-none">
                <input
                  v-model="form.isActive"
                  type="checkbox"
                  class="w-4 h-4 accent-primary-600 cursor-pointer"
                />
                <span class="text-[13px] text-[#637381]">{{ t('erp.lineIntegration.enableLiffHint') }}</span>
              </label>
            </div>
          </div>

          <ErrorBanner v-if="error" :message="error" class="mt-5" />
          <SuccessBanner v-if="savedMsg" :message="savedMsg" class="mt-5" />

          <div class="mt-6 pt-5 border-t border-[#E2E8F0] flex items-center justify-end gap-2">
            <button type="button" class="btn-primary" :disabled="saving" @click="save">
              {{ saving ? t('common.saving') : t('erp.lineIntegration.save') }}
            </button>
          </div>
        </template>
      </FormCard>

    </div>
  </AppLayout>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { ChatBubbleLeftRightIcon } from '@heroicons/vue/24/outline'
import api from '@/api'
import AppLayout from '@/layouts/AppLayout.vue'
import FormCard from '@/components/form/FormCard.vue'
import FormField from '@/components/form/FormField.vue'
import ErrorBanner from '@/components/form/ErrorBanner.vue'
import SuccessBanner from '@/components/form/SuccessBanner.vue'
import LoadingSpinner from '@/components/form/LoadingSpinner.vue'
import { useFieldErrors } from '@/composables/useFieldErrors'

const { t } = useI18n()
const { fieldErrors, setFromError, reset: resetErrors } = useFieldErrors()

const loading = ref(true)
const saving = ref(false)
const error = ref('')
const savedMsg = ref('')
const form = reactive({
  messagingChannelId: '',
  botUserId: '',
  liffId: '',
  liffChannelId: '',
  defaultStoreId: '',
  channelSecret: '',
  channelAccessToken: '',
  isActive: true,
})
const meta = reactive({
  hasChannelSecret: false,
  hasChannelAccessToken: false,
})

const configured = computed(() => Boolean(
  form.messagingChannelId
  && form.botUserId
  && form.liffId
  && form.liffChannelId
  && form.defaultStoreId
  && meta.hasChannelSecret
  && meta.hasChannelAccessToken,
))

const webhookUrl = computed(() => {
  if (typeof window === 'undefined') return '/api/line/webhook'
  return `${window.location.origin.replace(/:5173$/, ':3000')}/api/line/webhook`
})

function applyConnection(connection) {
  if (!connection) {
    meta.hasChannelSecret = false
    meta.hasChannelAccessToken = false
    return
  }
  form.messagingChannelId = connection.messagingChannelId || ''
  form.botUserId = connection.botUserId || ''
  form.liffId = connection.liffId || ''
  form.liffChannelId = connection.liffChannelId || ''
  form.defaultStoreId = connection.defaultStoreId || ''
  form.isActive = connection.isActive !== false
  form.channelSecret = ''
  form.channelAccessToken = ''
  meta.hasChannelSecret = !!connection.hasChannelSecret
  meta.hasChannelAccessToken = !!connection.hasChannelAccessToken
}

async function load() {
  loading.value = true
  error.value = ''
  try {
    const { data } = await api.get('/line/admin/connection')
    applyConnection(data.data.connection)
  } catch (err) {
    error.value = err.response?.data?.message || t('erp.lineIntegration.loadFailed')
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
    const { data } = await api.put('/line/admin/connection', { ...form })
    applyConnection(data.data.connection)
    savedMsg.value = t('erp.lineIntegration.saved')
  } catch (err) {
    const had = setFromError(err)
    if (!had) error.value = err.response?.data?.message || t('erp.lineIntegration.saveFailed')
  } finally {
    saving.value = false
  }
}

onMounted(load)
</script>
