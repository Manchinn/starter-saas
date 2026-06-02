<template>
  <div class="space-y-6">
    <div class="card overflow-hidden">
      <div class="px-6 py-4 border-b border-[#E2E8F0]">
        <h2 class="text-sm font-semibold text-[#374151]">{{ t('billing.planDetails') }}</h2>
      </div>
      <div class="px-6 py-5 grid grid-cols-2 gap-5">
        <div>
          <label class="label">{{ t('common.name') }}<span class="text-red-500">*</span></label>
          <input v-model="form.name" class="input" />
        </div>
        <div>
          <label class="label">{{ t('common.slug') }}<span class="text-red-500">*</span></label>
          <input v-model="form.slug" class="input font-mono" :disabled="lockSlug" placeholder="pro" />
        </div>
        <div class="col-span-2">
          <label class="label">{{ t('common.description') }}</label>
          <textarea v-model="form.description" rows="2" class="input resize-none" />
        </div>
        <div>
          <label class="label">{{ t('billing.price') }}</label>
          <input v-model.number="form.price" type="number" min="0" step="0.01" class="input" />
        </div>
        <div>
          <label class="label">{{ t('billing.currency') }}</label>
          <input v-model="form.currency" class="input" placeholder="USD" />
        </div>
        <div>
          <label class="label">{{ t('billing.intervalLabel') }}</label>
          <select v-model="form.interval" class="input">
            <option value="month">{{ t('billing.interval.month') }}</option>
            <option value="year">{{ t('billing.interval.year') }}</option>
          </select>
        </div>
        <div>
          <label class="label">{{ t('billing.trialDays') }}</label>
          <input v-model.number="form.trialDays" type="number" min="0" class="input" />
        </div>
        <label class="flex items-center gap-2 text-sm text-slate-600">
          <input type="checkbox" v-model="form.isActive" /> {{ t('billing.active') }}
        </label>
        <label class="flex items-center gap-2 text-sm text-slate-600">
          <input type="checkbox" v-model="form.isPublic" /> {{ t('billing.public') }}
        </label>
      </div>
    </div>

    <div class="card overflow-hidden">
      <div class="px-6 py-4 border-b border-[#E2E8F0]">
        <h2 class="text-sm font-semibold text-[#374151]">{{ t('billing.limitsAndFeatures') }}</h2>
        <p class="text-xs text-slate-400 mt-1">{{ t('billing.jsonHint') }}</p>
      </div>
      <div class="px-6 py-5 grid grid-cols-2 gap-5">
        <div>
          <label class="label">{{ t('billing.limits') }}</label>
          <textarea v-model="limitsText" rows="6" class="input font-mono text-xs resize-none"
            placeholder='{ "seats": 5, "erp.invoices.monthly": 100 }'></textarea>
        </div>
        <div>
          <label class="label">{{ t('billing.features') }}</label>
          <textarea v-model="featuresText" rows="6" class="input font-mono text-xs resize-none"
            placeholder='{ "ai-agent": true }'></textarea>
        </div>
      </div>
    </div>

    <div v-if="error" class="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded">
      <ExclamationCircleIcon class="w-4 h-4 flex-shrink-0" />
      {{ error }}
    </div>

    <div class="flex justify-end gap-3">
      <RouterLink to="/admin/billing/plans"
        class="px-4 py-2.5 text-sm border border-[#E2E8F0] hover:bg-[#F7F9FC] transition text-[#637381]">
        {{ t('common.cancel') }}
      </RouterLink>
      <button @click="submit" :disabled="saving" class="btn-primary">
        {{ saving ? t('common.saving') : submitLabel }}
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { useI18n } from 'vue-i18n'
import { ExclamationCircleIcon } from '@heroicons/vue/24/outline'

const props = defineProps({
  initial:     { type: Object, default: () => ({}) },
  submitLabel: { type: String, required: true },
  saving:      { type: Boolean, default: false },
  lockSlug:    { type: Boolean, default: false },
})
const emit = defineEmits(['submit'])
const { t } = useI18n()

const form = reactive({
  name: '', slug: '', description: '', price: 0, currency: 'USD',
  interval: 'month', trialDays: 0, isActive: true, isPublic: true,
  ...props.initial,
})

const limitsText   = ref(JSON.stringify(props.initial.limits || {}, null, 2))
const featuresText = ref(JSON.stringify(props.initial.features || {}, null, 2))
const error = ref('')

function submit() {
  error.value = ''
  let limits, features
  try { limits = JSON.parse(limitsText.value || '{}') }
  catch { error.value = t('billing.invalidLimits'); return }
  try { features = JSON.parse(featuresText.value || '{}') }
  catch { error.value = t('billing.invalidFeatures'); return }
  if (!form.name || !form.slug) { error.value = t('billing.nameSlugRequired'); return }
  emit('submit', { ...form, limits, features })
}

defineExpose({ setError: (m) => { error.value = m } })
</script>
