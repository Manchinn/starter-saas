<template>
  <AppLayout>
    <div class="space-y-6">

      <PageHeader
        :title="isCreate ? t('erp.settings.newSeq') : (seq ? `${t('erp.settings.seqTitle')} · ${seq.code}` : t('erp.settings.seqTitle'))"
        back-to="/erp/settings/sequence"
        :breadcrumb="[
          { label: t('erp.settings.sequencesTitle'), to: '/erp/settings/sequence' },
          { label: isCreate ? t('erp.settings.newSeq') : t('erp.settings.seqTitle') },
        ]">
        <template #actions>
          <div class="flex items-center gap-2">
            <button v-if="!isCreate" @click="resetNow"
              class="px-3.5 py-2 text-sm font-medium text-orange-600 border border-orange-200 hover:bg-orange-50 transition">
              {{ t('erp.settings.resetToInitial') }}
            </button>
            <HeaderSaveActions
              cancel-to="/erp/settings/sequence"
              :cancel-label="t('common.cancel')"
              :saving="saving"
              :saving-label="t('erp.common.saving')"
              :save-label="t('common.save')"
              @save="save"
            />
          </div>
        </template>
      </PageHeader>

      <div v-if="loading" class="text-[#9BA7B0] py-12 text-center">Loading…</div>

      <div v-else class="grid grid-cols-2 gap-6">

        <!-- Left: form fields -->
        <FormCard :title="t('erp.settings.seqTitle')" :icon="HashtagIcon" icon-color="primary">
          <div class="space-y-5">

            <div v-if="isCreate" class="grid grid-cols-2 gap-4">
              <FormField name="code" :label="t('erp.settings.seqCode')" :errors="{}" required
                v-model="form.code" placeholder="e.g. PO" input-class="font-mono uppercase"
                hint="Unique short identifier, used by the system" />
              <FormField name="name" :label="t('erp.settings.seqName')" :errors="{}" required
                v-model="form.name" placeholder="e.g. Purchase Order" />
            </div>

            <FormField v-else name="name" :label="t('erp.settings.seqName')" :errors="{}" required
              v-model="form.name" />

            <div>
              <FormField name="format" :label="t('erp.settings.displayFormat')" :errors="{}" required
                v-model="form.format" placeholder="e.g. GR-{YYYY}{MM}-{####}" input-class="font-mono" />
              <div class="flex flex-wrap gap-x-4 gap-y-1 text-xs text-[#9BA7B0] mt-2">
                <span><code>{####}</code> = padded number</span>
                <span><code>{YYYY}</code> = 4-digit year</span>
                <span><code>{YY}</code> = 2-digit year</span>
                <span><code>{MM}</code> = month</span>
                <span><code>{DD}</code> = day</span>
              </div>
            </div>

            <div class="grid grid-cols-3 gap-4">
              <FormField name="initialValue" :label="t('erp.settings.initialValue')" :errors="{}"
                v-model="form.initialValue" type="number" min="1" hint="Value after reset" />
              <FormField name="runningValue" :label="t('erp.settings.runningValue')" :errors="{}"
                v-model="form.runningValue" type="number" min="1" hint="Next number to issue" />
              <FormField name="maxValue" :label="t('erp.settings.maximumValue')" :errors="{}"
                v-model="form.maxValue" type="number" min="1" hint="Error if exceeded" />
            </div>

            <div>
              <label class="label">{{ t('erp.settings.reseedPeriod') }}</label>
              <div class="flex gap-2 mt-1.5">
                <button v-for="opt in reseedOptions" :key="opt.value"
                  type="button" @click="form.reseedPeriod = opt.value"
                  :class="form.reseedPeriod === opt.value ? 'bg-primary-500 text-white border-primary-500' : 'bg-white text-[#637381] border-[#CBD5E1] hover:bg-[#F7F9FC]'"
                  class="px-4 py-2 border text-sm font-medium transition">
                  {{ opt.label }}
                </button>
              </div>
              <p class="text-xs text-[#9BA7B0] mt-2">{{ reseedDescription }}</p>
            </div>

            <ErrorBanner :message="error" />

          </div>
        </FormCard>

        <!-- Right: preview + stats -->
        <div class="space-y-4">
          <div class="bg-white border border-[#E2E8F0] p-5">
            <h3 class="text-sm font-semibold text-[#374151] mb-3">{{ t('erp.settings.preview') }}</h3>
            <div class="bg-[#F7F9FC] px-4 py-6 text-center">
              <p class="font-mono text-2xl font-bold text-primary-500 tracking-wide">{{ livePreview }}</p>
              <p class="text-xs text-[#9BA7B0] mt-2">Next ref no (running value = {{ form.runningValue }})</p>
            </div>
          </div>

          <div class="bg-white border border-[#E2E8F0] p-5">
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
    </div>
  </AppLayout>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { HashtagIcon } from '@heroicons/vue/24/outline'
import AppLayout from '@/layouts/AppLayout.vue'
import PageHeader from '@/components/form/PageHeader.vue'
import FormCard from '@/components/form/FormCard.vue'
import FormField from '@/components/form/FormField.vue'
import ErrorBanner from '@/components/form/ErrorBanner.vue'
import HeaderSaveActions from '@/components/form/HeaderSaveActions.vue'
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
