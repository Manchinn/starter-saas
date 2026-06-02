<template>
  <AppLayout>
    <div class="space-y-6">

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

          <!-- Model + test (searchable dropdown) -->
          <div>
            <label class="label">{{ t('aiAgent.settings.model') }}</label>
            <div class="flex gap-2">
              <div class="relative flex-1" ref="modelMenuRef">
                <input v-model="form.model" type="text" class="input w-full pr-9"
                  :placeholder="t('aiAgent.settings.selectModel')" autocomplete="off"
                  @focus="openModels" @input="onModelInput" @keydown.esc="modelOpen = false" />
                <button type="button" @click="toggleModels" tabindex="-1"
                  class="absolute right-2 top-1/2 -translate-y-1/2 text-[#9BA7B0] hover:text-[#637381]">
                  <span v-if="loadingModels" class="block w-3.5 h-3.5 border-2 border-[#C0C8D2] border-t-primary-500 rounded-full animate-spin"></span>
                  <ChevronUpDownIcon v-else class="w-4 h-4" />
                </button>

                <div v-if="modelOpen"
                  class="absolute z-20 mt-1 w-full bg-white border border-[#E2E8F0] shadow-card-lg max-h-60 overflow-y-auto scrollbar-thin">
                  <button v-for="m in filteredModels" :key="m" type="button" @click="selectModel(m)"
                    :class="['w-full flex items-center gap-2 px-3 py-2 text-[13px] text-left hover:bg-[#F7F9FC]',
                             m === form.model ? 'text-primary-600 font-medium' : 'text-[#1C2434]']">
                    <CheckIcon v-if="m === form.model" class="w-3.5 h-3.5 flex-shrink-0" />
                    <span :class="{ 'pl-[1.375rem]': m !== form.model }" class="truncate">{{ m }}</span>
                  </button>
                  <p v-if="!filteredModels.length" class="px-3 py-2.5 text-[13px] text-[#9BA7B0]">
                    {{ models.length ? t('aiAgent.settings.noMatch') : t('aiAgent.settings.noModels') }}
                  </p>
                </div>
              </div>
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

          <!-- Max tokens -->
          <div>
            <label class="label">{{ t('aiAgent.settings.maxTokens') }}</label>
            <div class="flex items-center gap-3">
              <input v-model.number="form.maxTokens" type="number" min="1" step="1"
                :disabled="unlimitedTokens" :placeholder="t('aiAgent.settings.unlimited')"
                class="input w-40 disabled:bg-[#F7F9FC] disabled:text-[#9BA7B0] disabled:cursor-not-allowed" />
              <label class="flex items-center gap-2 text-sm text-[#374151] cursor-pointer">
                <input type="checkbox" v-model="unlimitedTokens" class="w-4 h-4 accent-primary-500" />
                {{ t('aiAgent.settings.unlimited') }}
              </label>
            </div>
            <p class="text-xs text-[#9BA7B0] mt-1">{{ t('aiAgent.settings.maxTokensHint') }}</p>
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

          <!-- Auto action -->
          <label class="flex items-center justify-between gap-3 cursor-pointer">
            <span>
              <span class="block text-sm font-medium text-[#1C2434]">{{ t('aiAgent.settings.autoAction') }}</span>
              <span class="block text-xs text-[#9BA7B0]">{{ t('aiAgent.settings.autoActionHint') }}</span>
            </span>
            <input v-model="form.autoAction" type="checkbox" class="w-5 h-5 accent-primary-500" />
          </label>

          <!-- Thinking model -->
          <label class="flex items-center justify-between gap-3 cursor-pointer">
            <span>
              <span class="block text-sm font-medium text-[#1C2434]">{{ t('aiAgent.settings.thinkingModel') }}</span>
              <span class="block text-xs text-[#9BA7B0]">{{ t('aiAgent.settings.thinkingModelHint') }}</span>
            </span>
            <input v-model="form.thinkingModel" type="checkbox" class="w-5 h-5 accent-primary-500" />
          </label>

          <!-- Prompt compression -->
          <label class="flex items-center justify-between gap-3 cursor-pointer">
            <span>
              <span class="block text-sm font-medium text-[#1C2434]">{{ t('aiAgent.settings.promptCompression') }}</span>
              <span class="block text-xs text-[#9BA7B0]">{{ t('aiAgent.settings.promptCompressionHint') }}</span>
            </span>
            <input v-model="form.promptCompression" type="checkbox" class="w-5 h-5 accent-primary-500" />
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
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { CheckCircleIcon, ExclamationCircleIcon, ChevronUpDownIcon, CheckIcon } from '@heroicons/vue/24/outline'
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

// Max-tokens "Unlimited" toggle ⇄ form.maxTokens (null = unlimited).
const unlimitedTokens = computed({
  get: () => !form.value || form.value.maxTokens == null,
  set: (v) => { if (form.value) form.value.maxTokens = v ? null : 2048 },
})
const testing = ref(false)
const testResult = ref(null)
const saving = ref(false)
const saved = ref(false)
const error = ref('')

// ── Searchable model dropdown ─────────────────────────────────────────────────
const modelMenuRef = ref(null)
const modelOpen = ref(false)
const modelDirty = ref(false)      // true once the user types → switch to filtering
const loadingModels = ref(false)

const filteredModels = computed(() => {
  const q = (form.value?.model || '').toLowerCase().trim()
  if (!modelDirty.value || !q) return models.value
  return models.value.filter((m) => m.toLowerCase().includes(q))
})

function openModels() { modelOpen.value = true; modelDirty.value = false }
function toggleModels() { modelOpen.value ? (modelOpen.value = false) : openModels() }
function onModelInput() { modelDirty.value = true; modelOpen.value = true }
function selectModel(m) { form.value.model = m; modelDirty.value = false; modelOpen.value = false }

function onClickOutside(e) {
  if (modelMenuRef.value && !modelMenuRef.value.contains(e.target)) modelOpen.value = false
}

// Best-effort populate the dropdown without requiring a manual "Test connection".
async function loadModels({ silent = true } = {}) {
  loadingModels.value = true
  try {
    models.value = await store.testConnection({
      provider: form.value.provider,
      baseUrl: form.value.baseUrl,
      apiKey: form.value.apiKey || undefined,
    })
    return models.value
  } catch (e) {
    if (!silent) throw e
    return []
  } finally {
    loadingModels.value = false
  }
}

onMounted(async () => {
  try {
    settings.value = await store.loadSettings()
    form.value = { ...settings.value, apiKey: '' }
    loadModels()   // fire-and-forget; failures stay silent on first load
  } catch (e) {
    error.value = t('aiAgent.errors.loadFailed')
  }
  document.addEventListener('mousedown', onClickOutside)
})
onUnmounted(() => document.removeEventListener('mousedown', onClickOutside))

function setProvider(p) {
  form.value.provider = p
  // Switch to that provider's default endpoint/model so the form isn't stale.
  form.value.baseUrl = PRESETS[p].baseUrl
  form.value.model = PRESETS[p].model
  models.value = []
  testResult.value = null
  loadModels()   // refresh the dropdown for the new provider
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
      autoAction: form.value.autoAction,
      maxTokens: unlimitedTokens.value ? null : form.value.maxTokens,
      thinkingModel: form.value.thinkingModel,
      promptCompression: form.value.promptCompression,
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
