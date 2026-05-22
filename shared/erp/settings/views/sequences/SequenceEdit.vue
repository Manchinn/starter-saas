<template>
  <AppLayout>
    <div class="space-y-6">
      <div class="flex items-center gap-3">
        <RouterLink to="/erp/settings/sequence" class="text-[#9BA7B0] hover:text-[#637381] transition">
          <ArrowLeftIcon class="w-5 h-5" />
        </RouterLink>
        <h1 class="text-2xl font-bold text-[#1C2434]">{{ isCreate ? t('erp.settings.newSeq') : t('erp.settings.seqTitle') }}</h1>
        <span v-if="!isCreate && seq" class="font-mono text-sm bg-[#F1F5F9] text-[#374151] px-2.5 py-0.5 rounded">{{ seq.code }}</span>
      </div>

      <div v-if="loading" class="text-[#9BA7B0] py-12 text-center">Loading…</div>

      <template v-else>
        <div class="grid grid-cols-2 gap-6">
          <!-- Left: form fields -->
          <div class="space-y-5 bg-white rounded-2xl border border-[#E2E8F0] p-6">

            <div v-if="isCreate" class="grid grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium text-[#374151] mb-1">{{ t('erp.settings.seqCode') }} <span class="text-red-500">*</span></label>
                <input v-model="form.code" type="text" placeholder="e.g. PO"
                  class="w-full px-3 py-2 border rounded-lg text-sm font-mono uppercase focus:outline-none focus:ring-2 focus:ring-primary-500" />
                <p class="text-xs text-[#9BA7B0] mt-1">Unique short identifier, used by the system</p>
              </div>
              <div>
                <label class="block text-sm font-medium text-[#374151] mb-1">{{ t('erp.settings.seqName') }} <span class="text-red-500">*</span></label>
                <input v-model="form.name" type="text" placeholder="e.g. Purchase Order"
                  class="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
              </div>
            </div>

            <div v-else>
              <label class="block text-sm font-medium text-[#374151] mb-1">{{ t('erp.settings.seqName') }} <span class="text-red-500">*</span></label>
              <input v-model="form.name" type="text"
                class="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
            </div>

            <div>
              <label class="block text-sm font-medium text-[#374151] mb-1">{{ t('erp.settings.displayFormat') }} <span class="text-red-500">*</span></label>
              <input v-model="form.format" type="text" placeholder="e.g. GR-{YYYY}{MM}-{####}"
                class="w-full px-3 py-2 border rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary-500" />
              <div class="flex flex-wrap gap-x-4 gap-y-1 text-xs text-[#9BA7B0] mt-2">
                <span><code>{####}</code> = padded number</span>
                <span><code>{YYYY}</code> = 4-digit year</span>
                <span><code>{YY}</code> = 2-digit year</span>
                <span><code>{MM}</code> = month</span>
                <span><code>{DD}</code> = day</span>
              </div>
            </div>

            <div class="grid grid-cols-3 gap-4">
              <div>
                <label class="block text-sm font-medium text-[#374151] mb-1">{{ t('erp.settings.initialValue') }}</label>
                <input v-model.number="form.initialValue" type="number" min="1"
                  class="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
                <p class="text-xs text-[#9BA7B0] mt-1">Value after reset</p>
              </div>
              <div>
                <label class="block text-sm font-medium text-[#374151] mb-1">{{ t('erp.settings.runningValue') }}</label>
                <input v-model.number="form.runningValue" type="number" min="1"
                  class="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
                <p class="text-xs text-[#9BA7B0] mt-1">Next number to issue</p>
              </div>
              <div>
                <label class="block text-sm font-medium text-[#374151] mb-1">{{ t('erp.settings.maximumValue') }}</label>
                <input v-model.number="form.maxValue" type="number" min="1"
                  class="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
                <p class="text-xs text-[#9BA7B0] mt-1">Error if exceeded</p>
              </div>
            </div>

            <div>
              <label class="block text-sm font-medium text-[#374151] mb-2">{{ t('erp.settings.reseedPeriod') }}</label>
              <div class="flex gap-2">
                <button v-for="opt in reseedOptions" :key="opt.value"
                  type="button" @click="form.reseedPeriod = opt.value"
                  :class="form.reseedPeriod === opt.value ? 'bg-primary-500 text-white border-primary-500' : 'bg-white text-[#637381] border-[#CBD5E1] hover:bg-[#F7F9FC]'"
                  class="px-4 py-2 border rounded-lg text-sm font-medium transition">
                  {{ opt.label }}
                </button>
              </div>
              <p class="text-xs text-[#9BA7B0] mt-2">{{ reseedDescription }}</p>
            </div>

            <div v-if="error" class="bg-red-50 text-red-700 text-sm px-4 py-2 rounded-lg">{{ error }}</div>

            <div class="flex justify-between items-center pt-2">
              <button v-if="!isCreate" @click="resetNow"
                class="px-4 py-2 text-sm border border-orange-300 text-orange-600 rounded-lg hover:bg-orange-50 transition">
                {{ t('erp.settings.resetToInitial') }}
              </button>
              <div class="flex gap-3 ml-auto">
                <RouterLink to="/erp/settings/sequence"
                  class="px-4 py-2 text-sm border rounded-lg hover:bg-[#F7F9FC] transition">{{ t('common.cancel') }}</RouterLink>
                <button @click="save" :disabled="saving"
                  class="px-5 py-2 text-sm bg-primary-500 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 transition">
                  {{ saving ? t('erp.common.saving') : t('common.save') }}
                </button>
              </div>
            </div>
          </div>

          <!-- Right: preview -->
          <div class="space-y-4">
            <div class="bg-white rounded-2xl border border-[#E2E8F0] p-5">
              <h3 class="text-sm font-semibold text-[#374151] mb-3">{{ t('erp.settings.preview') }}</h3>
              <div class="bg-[#F7F9FC] rounded-lg px-4 py-6 text-center">
                <p class="font-mono text-2xl font-bold text-primary-500 tracking-wide">{{ livePreview }}</p>
                <p class="text-xs text-[#9BA7B0] mt-2">Next ref no (running value = {{ form.runningValue }})</p>
              </div>
            </div>

            <div class="bg-white rounded-2xl border border-[#E2E8F0] p-5">
              <h3 class="text-sm font-semibold text-[#374151] mb-3">{{ t('erp.settings.seqInfo') }}</h3>
              <dl class="space-y-2 text-sm">
                <div class="flex justify-between">
                  <dt class="text-[#637381]">{{ t('erp.settings.initialValue') }}</dt>
                  <dd class="font-medium text-[#1C2434]">{{ form.initialValue }}</dd>
                </div>
                <div class="flex justify-between">
                  <dt class="text-[#637381]">{{ t('erp.settings.runningValue') }}</dt>
                  <dd class="font-medium text-primary-500">{{ form.runningValue }}</dd>
                </div>
                <div class="flex justify-between">
                  <dt class="text-[#637381]">{{ t('erp.settings.maximumValue') }}</dt>
                  <dd class="font-medium text-[#1C2434]">{{ form.maxValue }}</dd>
                </div>
                <div class="flex justify-between">
                  <dt class="text-[#637381]">{{ t('erp.settings.remaining') }}</dt>
                  <dd :class="remaining < 100 ? 'text-red-600 font-bold' : 'text-[#1C2434] font-medium'">
                    {{ remaining.toLocaleString() }}
                  </dd>
                </div>
                <div v-if="seq?.lastResetDate" class="flex justify-between">
                  <dt class="text-[#637381]">{{ t('erp.settings.lastReset') }}</dt>
                  <dd class="text-[#1C2434]">{{ seq.lastResetDate }}</dd>
                </div>
              </dl>
            </div>
          </div>
        </div>
      </template>
    </div>
  </AppLayout>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { ArrowLeftIcon } from '@heroicons/vue/24/outline'
import AppLayout from '@/layouts/AppLayout.vue'
import { useFieldErrors } from '@/composables/useFieldErrors'
import api from '@/api'

const { t } = useI18n()
const route   = useRoute()
const router  = useRouter()
const isCreate = route.name === 'erp-settings-sequence-create'

const seq     = ref(null)
const loading = ref(!isCreate)
const saving  = ref(false)
const error   = ref('')
const { setFromError, reset: resetErrors } = useFieldErrors()

const form = ref({
  code:         '',
  name:         '',
  format:       '{####}',
  initialValue: 1,
  runningValue: 1,
  reseedPeriod: 'F',
  maxValue:     99999,
})

const reseedOptions = computed(() => [
  { value: 'F', label: t('erp.settings.fixed') },
  { value: 'D', label: t('erp.settings.daily') },
  { value: 'M', label: t('erp.settings.monthly') },
  { value: 'Y', label: t('erp.settings.yearly') },
])
const reseedDescription = computed(() => {
  const key = { F: 'erp.settings.reseedFixed', D: 'erp.settings.reseedDaily', M: 'erp.settings.reseedMonthly', Y: 'erp.settings.reseedYearly' }[form.value.reseedPeriod]
  return key ? t(key) : ''
})

const remaining = computed(() => Math.max(0, form.value.maxValue - form.value.runningValue + 1))

// Live preview using client-side format engine
const livePreview = computed(() => {
  const fmt     = form.value.format || '{####}'
  const running = form.value.runningValue || 1
  const now     = new Date()
  const YYYY    = now.getFullYear().toString()
  const YY      = YYYY.slice(2)
  const MM      = String(now.getMonth() + 1).padStart(2, '0')
  const DD      = String(now.getDate()).padStart(2, '0')
  return fmt
    .replace(/\{(#+)\}/g, (_, hashes) => String(running).padStart(hashes.length, '0'))
    .replace(/\{YYYY\}/g, YYYY).replace(/\{YY\}/g, YY)
    .replace(/\{MM\}/g, MM).replace(/\{DD\}/g, DD)
})

onMounted(async () => {
  if (isCreate) return
  try {
    const { data } = await api.get(`/erp/sequences/${route.params.id}`)
    seq.value = data.data.sequence
    Object.assign(form.value, seq.value)
  } catch {
    seq.value = null
  } finally {
    loading.value = false
  }
})

async function save() {
  error.value = ''
  resetErrors()
  saving.value = true
  try {
    if (isCreate) {
      const { data } = await api.post('/erp/sequences', form.value)
      router.push(`/erp/settings/sequence/${data.data.sequence.id}/edit`)
    } else {
      const { data } = await api.put(`/erp/sequences/${route.params.id}`, form.value)
      seq.value = data.data.sequence
      Object.assign(form.value, seq.value)
    }
  } catch (err) {
    const had = setFromError(err)
    if (!had) error.value = err.response?.data?.message || 'Save failed'
  } finally {
    saving.value = false
  }
}

async function resetNow() {
  if (!confirm(`Reset '${seq.value?.code}' running value back to ${form.value.initialValue}?`)) return
  try {
    const { data } = await api.post(`/erp/sequences/${route.params.id}/reset`)
    seq.value = data.data.sequence
    Object.assign(form.value, seq.value)
  } catch (err) {
    error.value = err.response?.data?.message || 'Reset failed'
  }
}
</script>
