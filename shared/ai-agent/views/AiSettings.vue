<template>
  <AppLayout>
    <div class="max-w-2xl mx-auto space-y-6">

      <!-- Heading -->
      <div>
        <h1 class="text-xl font-semibold text-[#1C2434]">{{ t('aiAgent.settings.title') }}</h1>
        <p class="text-sm text-[#637381] mt-0.5">{{ t('aiAgent.settings.subtitle') }}</p>
      </div>

      <div v-if="form" class="bg-white border border-[#E2E8F0] shadow-sm">
        <div class="px-6 py-5 space-y-5">

          <!-- Provider -->
          <div>
            <label class="label">{{ t('aiAgent.settings.provider') }}</label>
            <div class="flex border border-[#E2E8F0] overflow-hidden text-sm">
              <button type="button" @click="setProvider('ollama')"
                :class="form.provider === 'ollama'
                  ? 'flex-1 py-2.5 bg-primary-500 text-white font-medium'
                  : 'flex-1 py-2.5 bg-white text-[#637381] hover:bg-[#F7F9FC]'">
                {{ t('aiAgent.settings.ollama') }}
              </button>
              <button type="button" @click="setProvider('lmstudio')"
                :class="form.provider === 'lmstudio'
                  ? 'flex-1 py-2.5 bg-primary-500 text-white font-medium'
                  : 'flex-1 py-2.5 bg-white text-[#637381] hover:bg-[#F7F9FC]'">
                {{ t('aiAgent.settings.lmstudio') }}
              </button>
            </div>
          </div>

          <!-- Base URL -->
          <div>
            <label class="label">{{ t('aiAgent.settings.baseUrl') }}</label>
            <input v-model="form.baseUrl" type="text" class="input w-full" placeholder="http://localhost:11434" />
            <p class="text-xs text-[#9BA7B0] mt-1">{{ t('aiAgent.settings.baseUrlHint') }}</p>
          </div>

          <!-- Model + test -->
          <div>
            <label class="label">{{ t('aiAgent.settings.model') }}</label>
            <div class="flex gap-2">
              <input v-if="!models.length" v-model="form.model" type="text" class="input flex-1" placeholder="llama3.1" />
              <select v-else v-model="form.model" class="input flex-1">
                <option value="" disabled>{{ t('aiAgent.settings.selectModel') }}</option>
                <option v-for="m in models" :key="m" :value="m">{{ m }}</option>
              </select>
              <button type="button" @click="testConnection" :disabled="testing"
                class="btn-secondary whitespace-nowrap">
                {{ testing ? t('aiAgent.settings.testing') : t('aiAgent.settings.test') }}
              </button>
            </div>
            <p class="text-xs text-[#9BA7B0] mt-1">{{ t('aiAgent.settings.modelHint') }}</p>
          </div>

          <!-- API key (LM Studio) -->
          <div v-if="form.provider === 'lmstudio'">
            <label class="label">{{ t('aiAgent.settings.apiKey') }}</label>
            <input v-model="form.apiKey" type="password" class="input w-full"
              :placeholder="settings?.hasApiKey ? '••••••••' : ''" />
            <p class="text-xs text-[#9BA7B0] mt-1">
              {{ settings?.hasApiKey ? t('aiAgent.settings.apiKeySet') : t('aiAgent.settings.apiKeyHint') }}
            </p>
          </div>

          <!-- Temperature -->
          <div>
            <label class="label">{{ t('aiAgent.settings.temperature') }} · <span class="font-mono">{{ Number(form.temperature).toFixed(2) }}</span></label>
            <input v-model.number="form.temperature" type="range" min="0" max="1" step="0.05" class="w-full accent-primary-500" />
          </div>

          <!-- System prompt -->
          <div>
            <label class="label">{{ t('aiAgent.settings.systemPrompt') }}</label>
            <textarea v-model="form.systemPrompt" rows="5" class="input w-full font-mono text-xs"></textarea>
          </div>

          <!-- Enabled -->
          <label class="flex items-center justify-between gap-3 cursor-pointer">
            <span>
              <span class="block text-sm font-medium text-[#1C2434]">{{ t('aiAgent.settings.enabled') }}</span>
              <span class="block text-xs text-[#9BA7B0]">{{ t('aiAgent.settings.enabledHint') }}</span>
            </span>
            <input v-model="form.enabled" type="checkbox" class="w-5 h-5 accent-primary-500" />
          </label>
        </div>

        <!-- Feedback + save -->
        <div class="px-6 pb-5 space-y-3">
          <div v-if="testResult"
            :class="['flex items-center gap-2 text-sm px-4 py-3 border',
              testResult.ok ? 'bg-green-50 border-green-200 text-green-700' : 'bg-red-50 border-red-200 text-red-700']">
            <component :is="testResult.ok ? CheckCircleIcon : ExclamationCircleIcon" class="w-4 h-4 flex-shrink-0" />
            {{ testResult.text }}
          </div>
          <div v-if="error" class="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3">
            <ExclamationCircleIcon class="w-4 h-4 flex-shrink-0" /> {{ error }}
          </div>
          <div v-if="saved" class="flex items-center gap-2 bg-green-50 border border-green-200 text-green-700 text-sm px-4 py-3">
            <CheckCircleIcon class="w-4 h-4 flex-shrink-0" /> {{ t('aiAgent.settings.saved') }}
          </div>
          <div class="flex justify-end">
            <button @click="save" :disabled="saving" class="btn-primary">
              {{ saving ? '…' : t('aiAgent.settings.save') }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </AppLayout>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { CheckCircleIcon, ExclamationCircleIcon } from '@heroicons/vue/24/outline'
import AppLayout from '@/layouts/AppLayout.vue'
import { useAiAgentStore } from '@/stores/aiAgent'

const { t } = useI18n()
const store = useAiAgentStore()

const PRESETS = {
  ollama:   { baseUrl: 'http://localhost:11434',   model: 'llama3.1' },
  lmstudio: { baseUrl: 'http://localhost:1234/v1', model: 'local-model' },
}

const settings = ref(null)
const form = ref(null)
const models = ref([])
const testing = ref(false)
const testResult = ref(null)
const saving = ref(false)
const saved = ref(false)
const error = ref('')

onMounted(async () => {
  try {
    settings.value = await store.loadSettings()
    form.value = { ...settings.value, apiKey: '' }
  } catch (e) {
    error.value = t('aiAgent.errors.loadFailed')
  }
})

function setProvider(p) {
  form.value.provider = p
  // Switch to that provider's default endpoint/model so the form isn't stale.
  form.value.baseUrl = PRESETS[p].baseUrl
  form.value.model = PRESETS[p].model
  models.value = []
  testResult.value = null
}

async function testConnection() {
  testing.value = true
  testResult.value = null
  try {
    const list = await store.testConnection({
      provider: form.value.provider,
      baseUrl: form.value.baseUrl,
      apiKey: form.value.apiKey || undefined,
    })
    models.value = list
    if (list.length && !list.includes(form.value.model)) form.value.model = list[0]
    testResult.value = { ok: true, text: t('aiAgent.settings.testOk', { count: list.length }) }
  } catch (e) {
    testResult.value = { ok: false, text: e.response?.data?.message || t('aiAgent.settings.testFail') }
  } finally {
    testing.value = false
  }
}

async function save() {
  saving.value = true
  saved.value = false
  error.value = ''
  try {
    const patch = {
      provider: form.value.provider,
      baseUrl: form.value.baseUrl,
      model: form.value.model,
      temperature: form.value.temperature,
      systemPrompt: form.value.systemPrompt,
      enabled: form.value.enabled,
    }
    // Only send apiKey when the user typed one (blank keeps the saved key).
    if (form.value.apiKey) patch.apiKey = form.value.apiKey
    settings.value = await store.saveSettings(patch)
    form.value.apiKey = ''
    saved.value = true
    setTimeout(() => { saved.value = false }, 2500)
  } catch (e) {
    error.value = e.response?.data?.message || t('aiAgent.errors.saveFailed')
  } finally {
    saving.value = false
  }
}
</script>
