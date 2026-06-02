<template>
  <div class="space-y-6">
    <FormCard :title="t('billing.planDetails')">
      <div class="grid grid-cols-2 gap-5">
        <FormField v-model="form.name" name="name" :label="t('common.name')" required />
        <FormField v-model="form.slug" name="slug" :label="t('common.slug')" required
          :disabled="lockSlug" placeholder="pro" input-class="font-mono" />
        <FormField v-model="form.description" name="description" textarea :rows="2"
          :label="t('common.description')" wrapper-class="col-span-2" />
        <FormField v-model.number="form.price" name="price" type="number" min="0" step="0.01"
          :label="t('billing.price')" />
        <FormField v-model="form.currency" name="currency" :label="t('billing.currency')" placeholder="USD" />
        <div>
          <label class="label">{{ t('billing.intervalLabel') }}</label>
          <select v-model="form.interval" class="input">
            <option value="month">{{ t('billing.interval.month') }}</option>
            <option value="year">{{ t('billing.interval.year') }}</option>
          </select>
        </div>
        <FormField v-model.number="form.trialDays" name="trialDays" type="number" min="0"
          :label="t('billing.trialDays')" />
        <label class="flex items-center gap-2 text-sm text-slate-600">
          <input type="checkbox" v-model="form.isActive" /> {{ t('billing.active') }}
        </label>
        <label class="flex items-center gap-2 text-sm text-slate-600">
          <input type="checkbox" v-model="form.isPublic" /> {{ t('billing.public') }}
        </label>
      </div>
    </FormCard>

    <FormCard :title="t('billing.limitsAndFeatures')" :subtitle="t('billing.jsonHint')">
      <div class="grid grid-cols-2 gap-5">
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
    </FormCard>

    <ErrorBanner :message="error" />

    <FormFooter
      cancel-to="/admin/billing/plans"
      :cancel-label="t('common.cancel')"
      :save-label="submitLabel"
      :saving-label="t('common.saving')"
      :saving="saving"
      @save="submit"
    />
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { useI18n } from 'vue-i18n'
import FormCard from '@/components/form/FormCard.vue'
import FormField from '@/components/form/FormField.vue'
import ErrorBanner from '@/components/form/ErrorBanner.vue'
import FormFooter from '@/components/form/FormFooter.vue'

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
