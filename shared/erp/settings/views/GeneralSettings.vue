<template>
  <AppLayout>
    <div class="space-y-6">

      <!-- Heading -->
      <div>
        <h1 class="text-xl font-semibold text-[#1C2434]">{{ t('erp.settings.generalTitle') }}</h1>
        <p class="text-sm text-[#637381] mt-0.5">{{ t('erp.settings.generalDesc') }}</p>
      </div>

      <!-- Currency Format -->
      <div class="bg-white rounded-2xl border border-[#E2E8F0] shadow-sm overflow-hidden">
        <div class="px-6 py-4 border-b border-[#E2E8F0]">
          <h2 class="text-sm font-semibold text-[#374151]">{{ t('erp.settings.currency') }}</h2>
          <p class="text-xs text-[#9BA7B0] mt-0.5">Controls how monetary values are displayed across the ERP</p>
        </div>

        <div class="px-6 py-5 space-y-5">

          <!-- Live Preview -->
          <div class="rounded-lg bg-[#F7F9FC] border border-[#E2E8F0] px-5 py-4 flex items-center justify-between">
            <span class="text-xs font-semibold text-[#9BA7B0] uppercase tracking-wide">Preview</span>
            <div class="text-right space-y-0.5">
              <div class="text-2xl font-bold text-[#1C2434] tabular-nums font-mono">{{ previewLarge }}</div>
              <div class="text-sm text-[#637381] tabular-nums font-mono">{{ previewSmall }}</div>
            </div>
          </div>

          <div class="grid grid-cols-2 gap-5">

            <!-- Symbol -->
            <div>
              <label class="block text-xs font-semibold text-[#637381] uppercase tracking-wide mb-1.5">
                {{ t('erp.settings.symbol') }}
              </label>
              <input v-model="form.symbol" type="text" maxlength="5" placeholder="e.g. ฿ or $"
                class="w-full px-3 py-2 border border-[#E2E8F0] rounded-lg text-sm
                       focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent" />
            </div>

            <!-- Position -->
            <div>
              <label class="block text-xs font-semibold text-[#637381] uppercase tracking-wide mb-1.5">
                {{ t('erp.settings.symbolPosition') }}
              </label>
              <div class="flex rounded-lg border border-[#E2E8F0] overflow-hidden text-sm">
                <button type="button" @click="form.position = 'prefix'"
                  :class="form.position === 'prefix'
                    ? 'flex-1 py-2 bg-primary-500 text-white font-medium'
                    : 'flex-1 py-2 bg-white text-[#637381] hover:bg-[#F7F9FC]'">
                  {{ t('erp.settings.prefix') }} &nbsp;<span class="font-mono opacity-70">$1,234</span>
                </button>
                <button type="button" @click="form.position = 'suffix'"
                  :class="form.position === 'suffix'
                    ? 'flex-1 py-2 bg-primary-500 text-white font-medium'
                    : 'flex-1 py-2 bg-white text-[#637381] hover:bg-[#F7F9FC]'">
                  {{ t('erp.settings.suffix') }} &nbsp;<span class="font-mono opacity-70">1,234 ฿</span>
                </button>
              </div>
            </div>

            <!-- Thousand Separator -->
            <div>
              <label class="block text-xs font-semibold text-[#637381] uppercase tracking-wide mb-1.5">
                {{ t('erp.settings.thousandSep') }}
              </label>
              <SearchSelect v-model="form.thousandSep" :options="thousandSepOptions" :allow-empty="false" />
            </div>

            <!-- Decimal Separator -->
            <div>
              <label class="block text-xs font-semibold text-[#637381] uppercase tracking-wide mb-1.5">
                {{ t('erp.settings.decimalSep') }}
              </label>
              <SearchSelect v-model="form.decimalSep" :options="decimalSepOptions" :allow-empty="false" />
            </div>

            <!-- Decimal Places -->
            <div>
              <label class="block text-xs font-semibold text-[#637381] uppercase tracking-wide mb-1.5">
                {{ t('erp.settings.decimalPlaces') }}
              </label>
              <SearchSelect v-model="form.precision" :options="precisionOptions" :allow-empty="false" />
            </div>

          </div>
        </div>
      </div>

      <!-- Tax Settings -->
      <div class="bg-white rounded-2xl border border-[#E2E8F0] shadow-sm overflow-hidden">
        <div class="px-6 py-4 border-b border-[#E2E8F0]">
          <h2 class="text-sm font-semibold text-[#374151]">{{ t('erp.settings.tax') }}</h2>
          <p class="text-xs text-[#9BA7B0] mt-0.5">{{ t('erp.settings.taxDesc') }}</p>
        </div>

        <div class="px-6 py-5 space-y-5">

          <!-- Tax Rate -->
          <div class="max-w-xs">
            <label class="block text-xs font-semibold text-[#637381] uppercase tracking-wide mb-1.5">
              {{ t('erp.settings.taxRate') }}
            </label>
            <div class="relative">
              <input v-model.number="taxForm.rate" type="number" min="0" max="100" step="0.01"
                class="w-full px-3 py-2 border border-[#E2E8F0] rounded-lg text-sm
                       focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent pr-8" />
              <span class="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-[#9BA7B0] pointer-events-none">%</span>
            </div>
          </div>

          <!-- Tax Method -->
          <div>
            <label class="block text-xs font-semibold text-[#637381] uppercase tracking-wide mb-1.5">
              {{ t('erp.settings.taxMethod') }}
            </label>
            <div class="flex rounded-lg border border-[#E2E8F0] overflow-hidden text-sm">
              <button type="button" @click="taxForm.inclusive = false"
                :class="!taxForm.inclusive
                  ? 'flex-1 py-2.5 bg-primary-500 text-white font-medium'
                  : 'flex-1 py-2.5 bg-white text-[#637381] hover:bg-[#F7F9FC]'">
                {{ t('erp.settings.taxExclusive') }}
              </button>
              <button type="button" @click="taxForm.inclusive = true"
                :class="taxForm.inclusive
                  ? 'flex-1 py-2.5 bg-primary-500 text-white font-medium'
                  : 'flex-1 py-2.5 bg-white text-[#637381] hover:bg-[#F7F9FC]'">
                {{ t('erp.settings.taxInclusive') }}
              </button>
            </div>
            <p class="mt-1.5 text-xs text-[#9BA7B0]">
              {{ taxForm.inclusive ? t('erp.settings.taxInclusiveDesc') : t('erp.settings.taxExclusiveDesc') }}
            </p>
          </div>

        </div>
      </div>

      <!-- Error -->
      <div v-if="error" class="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg">
        <ExclamationCircleIcon class="w-4 h-4 flex-shrink-0" />
        {{ error }}
      </div>

      <!-- Success -->
      <div v-if="saved" class="flex items-center gap-2 bg-green-50 border border-green-200 text-green-700 text-sm px-4 py-3 rounded-lg">
        <CheckCircleIcon class="w-4 h-4 flex-shrink-0" />
        {{ t('erp.settings.savedOk') }}
      </div>

      <!-- Save -->
      <div class="flex justify-end">
        <button @click="save" :disabled="saving"
          class="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold
                 bg-primary-500 text-white rounded-xl hover:bg-primary-700
                 disabled:opacity-50 transition-colors shadow-sm">
          <CheckIcon v-if="!saving" class="w-4 h-4" />
          {{ saving ? t('erp.common.saving') : t('erp.settings.saveSettings') }}
        </button>
      </div>

    </div>
  </AppLayout>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { CheckIcon, ExclamationCircleIcon, CheckCircleIcon } from '@heroicons/vue/24/outline'
import AppLayout from '@/layouts/AppLayout.vue'
import SearchSelect from '@/components/SearchSelect.vue'
import { useSettingsStore } from '@/stores/settings'
import * as accounting from 'accounting-js'

const { t } = useI18n()

const thousandSepOptions = [
  { id: ',', name: ', (comma) — 1,000'  },
  { id: '.', name: '. (period) — 1.000' },
  { id: ' ', name: '  (space) — 1 000'  },
  { id: '',  name: 'None — 1000'        },
]
const decimalSepOptions = [
  { id: '.', name: '. (period) — 1,234.56' },
  { id: ',', name: ', (comma) — 1.234,56'  },
]
const precisionOptions = [
  { id: 0, name: '0 — 1,235'      },
  { id: 1, name: '1 — 1,234.5'    },
  { id: 2, name: '2 — 1,234.56'   },
  { id: 3, name: '3 — 1,234.567'  },
]
const store  = useSettingsStore()
const saving = ref(false)
const saved  = ref(false)
const error  = ref('')

const form = reactive({
  symbol:      store.currency.symbol,
  position:    store.currency.position,
  thousandSep: store.currency.thousandSep,
  decimalSep:  store.currency.decimalSep,
  precision:   store.currency.precision,
})

const taxForm = reactive({
  rate:      store.tax.rate,
  inclusive: store.tax.inclusive,
})

onMounted(async () => {
  await store.load()
  Object.assign(form, store.currency)
  Object.assign(taxForm, store.tax)
})

function formatPreview(value) {
  const symbol  = form.symbol || ''
  const fmt     = form.position === 'prefix' ? '%s%v' : (symbol ? '%v\u00a0%s' : '%v')
  return accounting.formatMoney(value, {
    symbol, format: fmt,
    thousand:  form.thousandSep,
    decimal:   form.decimalSep,
    precision: form.precision,
  })
}

const previewLarge = computed(() => formatPreview(1234567.89))
const previewSmall = computed(() => formatPreview(0.5))

async function save() {
  error.value = ''
  saved.value = false
  saving.value = true
  try {
    await store.saveAll({ currency: { ...form }, tax: { ...taxForm } })
    saved.value = true
    setTimeout(() => { saved.value = false }, 3000)
  } catch (err) {
    error.value = err.response?.data?.message || 'Failed to save settings'
  } finally {
    saving.value = false
  }
}
</script>
