<template>
  <AppLayout>
    <div class="max-w-2xl space-y-6">

      <!-- Heading -->
      <div>
        <h1 class="text-xl font-semibold text-gray-900">General Settings</h1>
        <p class="text-sm text-gray-500 mt-0.5">Configure display preferences for your ERP</p>
      </div>

      <!-- Currency Format -->
      <div class="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div class="px-6 py-4 border-b border-gray-100">
          <h2 class="text-sm font-semibold text-gray-700">Currency Format</h2>
          <p class="text-xs text-gray-400 mt-0.5">Controls how monetary values are displayed across the ERP</p>
        </div>

        <div class="px-6 py-5 space-y-5">

          <!-- Live Preview -->
          <div class="rounded-lg bg-gray-50 border border-gray-200 px-5 py-4 flex items-center justify-between">
            <span class="text-xs font-semibold text-gray-400 uppercase tracking-wide">Preview</span>
            <div class="text-right space-y-0.5">
              <div class="text-2xl font-bold text-gray-900 tabular-nums font-mono">{{ previewLarge }}</div>
              <div class="text-sm text-gray-500 tabular-nums font-mono">{{ previewSmall }}</div>
            </div>
          </div>

          <div class="grid grid-cols-2 gap-5">

            <!-- Symbol -->
            <div>
              <label class="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                Currency Symbol
              </label>
              <input v-model="form.symbol" type="text" maxlength="5" placeholder="e.g. ฿ or $"
                class="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm
                       focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent" />
            </div>

            <!-- Position -->
            <div>
              <label class="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                Symbol Position
              </label>
              <div class="flex rounded-lg border border-gray-200 overflow-hidden text-sm">
                <button type="button" @click="form.position = 'prefix'"
                  :class="form.position === 'prefix'
                    ? 'flex-1 py-2 bg-primary-600 text-white font-medium'
                    : 'flex-1 py-2 bg-white text-gray-600 hover:bg-gray-50'">
                  Prefix &nbsp;<span class="font-mono opacity-70">$1,234</span>
                </button>
                <button type="button" @click="form.position = 'suffix'"
                  :class="form.position === 'suffix'
                    ? 'flex-1 py-2 bg-primary-600 text-white font-medium'
                    : 'flex-1 py-2 bg-white text-gray-600 hover:bg-gray-50'">
                  Suffix &nbsp;<span class="font-mono opacity-70">1,234 ฿</span>
                </button>
              </div>
            </div>

            <!-- Thousand Separator -->
            <div>
              <label class="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                Thousand Separator
              </label>
              <select v-model="form.thousandSep"
                class="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white
                       focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent">
                <option value=",">, (comma) — 1,000</option>
                <option value=".">. (period) — 1.000</option>
                <option value=" ">  (space) — 1 000</option>
                <option value="">None — 1000</option>
              </select>
            </div>

            <!-- Decimal Separator -->
            <div>
              <label class="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                Decimal Separator
              </label>
              <select v-model="form.decimalSep"
                class="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white
                       focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent">
                <option value=".">. (period) — 1,234.56</option>
                <option value=",">, (comma) — 1.234,56</option>
              </select>
            </div>

            <!-- Decimal Places -->
            <div>
              <label class="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                Decimal Places
              </label>
              <select v-model.number="form.precision"
                class="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white
                       focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent">
                <option :value="0">0 — 1,235</option>
                <option :value="1">1 — 1,234.5</option>
                <option :value="2">2 — 1,234.56</option>
                <option :value="3">3 — 1,234.567</option>
              </select>
            </div>

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
        Settings saved successfully
      </div>

      <!-- Save -->
      <div class="flex justify-end">
        <button @click="save" :disabled="saving"
          class="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold
                 bg-primary-600 text-white rounded-xl hover:bg-primary-700
                 disabled:opacity-50 transition-colors shadow-sm">
          <CheckIcon v-if="!saving" class="w-4 h-4" />
          {{ saving ? 'Saving…' : 'Save Settings' }}
        </button>
      </div>

    </div>
  </AppLayout>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { CheckIcon, ExclamationCircleIcon, CheckCircleIcon } from '@heroicons/vue/24/outline'
import AppLayout from '@/layouts/AppLayout.vue'
import { useSettingsStore } from '@/stores/settings'
import * as accounting from 'accounting-js'

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

onMounted(async () => {
  await store.load()
  Object.assign(form, store.currency)
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
    await store.saveCurrency({ ...form })
    saved.value = true
    setTimeout(() => { saved.value = false }, 3000)
  } catch (err) {
    error.value = err.response?.data?.message || 'Failed to save settings'
  } finally {
    saving.value = false
  }
}
</script>
