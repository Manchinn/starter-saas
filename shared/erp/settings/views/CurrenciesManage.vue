<template>
  <AppLayout>
    <div class="space-y-6">
      <div class="flex items-center justify-between gap-4">
        <div>
          <h1 class="text-xl font-semibold text-[#1C2434]">{{ t('erp.currencies.title') }}</h1>
          <p class="text-sm text-[#637381] mt-0.5">{{ t('erp.currencies.subtitle') }}</p>
        </div>
      </div>

      <!-- Currencies -->
      <div class="bg-white rounded-2xl border border-[#E2E8F0] shadow-sm overflow-hidden">
        <div class="px-5 py-3 border-b border-[#E2E8F0] flex items-center justify-between">
          <h2 class="text-sm font-semibold text-[#1C2434]">{{ t('erp.currencies.currencies') }}</h2>
          <button @click="addCurrencyDraft" class="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium bg-primary-500 text-white rounded-lg hover:bg-primary-700 transition">
            <PlusIcon class="w-4 h-4" /> {{ t('erp.currencies.addCurrency') }}
          </button>
        </div>
        <table class="w-full text-sm">
          <thead class="bg-[#F7F9FC] text-left">
            <tr>
              <th class="px-4 py-2.5 font-medium text-[#637381] w-24">{{ t('erp.currencies.colCode') }}</th>
              <th class="px-4 py-2.5 font-medium text-[#637381]">{{ t('erp.currencies.colName') }}</th>
              <th class="px-4 py-2.5 font-medium text-[#637381] w-20 text-center">{{ t('erp.currencies.colSymbol') }}</th>
              <th class="px-4 py-2.5 font-medium text-[#637381] w-24 text-right">{{ t('erp.currencies.colDecimals') }}</th>
              <th class="px-4 py-2.5 font-medium text-[#637381] w-24 text-center">{{ t('erp.currencies.colBase') }}</th>
              <th class="px-4 py-2.5 font-medium text-[#637381] w-24 text-center">{{ t('erp.currencies.colActive') }}</th>
              <th class="px-4 py-2.5 w-32"></th>
            </tr>
          </thead>
          <tbody class="divide-y divide-[#E2E8F0]">
            <tr v-if="loading"><td colspan="7" class="py-8 text-center text-[#9BA7B0]">{{ t('common.loading') }}</td></tr>
            <tr v-else-if="!currencies.length && !currencyDrafts.length"><td colspan="7" class="py-8 text-center text-[#9BA7B0]">{{ t('erp.currencies.noCurrencies') }}</td></tr>
            <tr v-for="(c, i) in [...currencies, ...currencyDrafts]" :key="c.id || `draft-${i}`" class="hover:bg-[#F7F9FC]">
              <td class="px-4 py-2"><input v-model="c.code" :disabled="!isDraft(c)" type="text" maxlength="3" class="w-full px-2 py-1.5 border rounded-lg text-sm font-mono uppercase disabled:bg-[#F7F9FC]" /></td>
              <td class="px-4 py-2"><input v-model="c.name" type="text" class="w-full px-2 py-1.5 border rounded-lg text-sm" /></td>
              <td class="px-4 py-2"><input v-model="c.symbol" type="text" maxlength="4" class="w-full px-2 py-1.5 border rounded-lg text-sm text-center" /></td>
              <td class="px-4 py-2"><input v-model.number="c.decimals" type="number" min="0" max="6" class="w-full px-2 py-1.5 border rounded-lg text-sm text-right" /></td>
              <td class="px-4 py-2 text-center"><input v-model="c.isBase" type="checkbox" /></td>
              <td class="px-4 py-2 text-center"><input v-model="c.isActive" type="checkbox" /></td>
              <td class="px-4 py-2 text-right">
                <div class="flex items-center justify-end gap-1">
                  <button @click="saveCurrency(c)" :disabled="c._saving" class="px-2.5 py-1 text-xs font-semibold bg-primary-500 text-white rounded-md hover:bg-primary-700 disabled:opacity-50">{{ c._saving ? '…' : (isDraft(c) ? t('common.create') : t('common.save')) }}</button>
                  <button @click="deleteCurrency(c)" class="p-1 text-[#9BA7B0] hover:text-red-500 rounded"><TrashIcon class="w-4 h-4" /></button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Exchange Rates -->
      <div class="bg-white rounded-2xl border border-[#E2E8F0] shadow-sm overflow-hidden">
        <div class="px-5 py-3 border-b border-[#E2E8F0] flex items-center justify-between">
          <div>
            <h2 class="text-sm font-semibold text-[#1C2434]">{{ t('erp.currencies.exchangeRates') }}</h2>
            <p class="text-xs text-[#9BA7B0] mt-0.5">{{ t('erp.currencies.ratesHint', { base: baseCode || '—' }) }}</p>
          </div>
          <button @click="addRateDraft" class="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium bg-primary-500 text-white rounded-lg hover:bg-primary-700 transition">
            <PlusIcon class="w-4 h-4" /> {{ t('erp.currencies.addRate') }}
          </button>
        </div>
        <table class="w-full text-sm">
          <thead class="bg-[#F7F9FC] text-left">
            <tr>
              <th class="px-4 py-2.5 font-medium text-[#637381] w-40">{{ t('erp.currencies.colCurrency') }}</th>
              <th class="px-4 py-2.5 font-medium text-[#637381] w-44">{{ t('erp.currencies.colAsOf') }}</th>
              <th class="px-4 py-2.5 font-medium text-[#637381] w-44 text-right">{{ t('erp.currencies.colRate') }}</th>
              <th class="px-4 py-2.5 font-medium text-[#637381]">{{ t('erp.currencies.colNotes') }}</th>
              <th class="px-4 py-2.5 w-32"></th>
            </tr>
          </thead>
          <tbody class="divide-y divide-[#E2E8F0]">
            <tr v-for="(r, i) in [...rateDrafts, ...rates]" :key="r.id || `rate-draft-${i}`" class="hover:bg-[#F7F9FC]">
              <td class="px-4 py-2">
                <select v-if="isDraft(r)" v-model="r.currencyCode" class="w-full px-2 py-1.5 border rounded-lg text-sm bg-white">
                  <option value="">—</option>
                  <option v-for="c in foreignCurrencies" :key="c.code" :value="c.code">{{ c.code }} — {{ c.name }}</option>
                </select>
                <span v-else class="font-mono font-semibold text-[#1C2434]">{{ r.currencyCode }}</span>
              </td>
              <td class="px-4 py-2"><input v-model="r.asOfDate" type="date" class="w-full px-2 py-1.5 border rounded-lg text-sm" /></td>
              <td class="px-4 py-2"><input v-model.number="r.rate" type="number" min="0" step="0.0001" class="w-full px-2 py-1.5 border rounded-lg text-sm text-right tabular-nums" /></td>
              <td class="px-4 py-2"><input v-model="r.notes" type="text" :placeholder="t('erp.currencies.notesPh')" class="w-full px-2 py-1.5 border rounded-lg text-sm" /></td>
              <td class="px-4 py-2 text-right">
                <div class="flex items-center justify-end gap-1">
                  <button v-if="isDraft(r)" @click="saveRate(r)" :disabled="r._saving" class="px-2.5 py-1 text-xs font-semibold bg-primary-500 text-white rounded-md hover:bg-primary-700 disabled:opacity-50">{{ r._saving ? '…' : t('common.create') }}</button>
                  <button @click="deleteRate(r)" class="p-1 text-[#9BA7B0] hover:text-red-500 rounded"><TrashIcon class="w-4 h-4" /></button>
                </div>
              </td>
            </tr>
            <tr v-if="!rates.length && !rateDrafts.length"><td colspan="5" class="py-8 text-center text-[#9BA7B0]">{{ t('erp.currencies.noRates') }}</td></tr>
          </tbody>
        </table>
      </div>

      <div v-if="error" class="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-2 rounded-lg">{{ error }}</div>
    </div>
  </AppLayout>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { PlusIcon, TrashIcon } from '@heroicons/vue/24/outline'
import AppLayout from '@/layouts/AppLayout.vue'
import api from '@/api'

const { t } = useI18n()
const currencies      = ref([])
const currencyDrafts  = ref([])
const rates           = ref([])
const rateDrafts      = ref([])
const loading         = ref(false)
const error           = ref('')

const isDraft = (r) => !r.id
const baseCode = computed(() => currencies.value.find(c => c.isBase)?.code || '')
const foreignCurrencies = computed(() => currencies.value.filter(c => !c.isBase))

async function load() {
  loading.value = true
  try {
    const [cRes, rRes] = await Promise.all([
      api.get('/erp/settings/currencies'),
      api.get('/erp/settings/currencies/rates/all'),
    ])
    currencies.value = cRes.data.data.currencies
    rates.value      = rRes.data.data.rates
  } finally { loading.value = false }
}
onMounted(load)

function addCurrencyDraft() { currencyDrafts.value.push({ code: '', name: '', symbol: '', decimals: 2, isBase: false, isActive: true }) }
function addRateDraft()     { rateDrafts.value.push({ currencyCode: '', rate: 1, asOfDate: new Date().toISOString().slice(0, 10), notes: '' }) }

async function saveCurrency(c) {
  error.value = ''
  c._saving = true
  try {
    if (isDraft(c)) {
      await api.post('/erp/settings/currencies', { code: c.code, name: c.name, symbol: c.symbol, decimals: c.decimals, isBase: c.isBase })
    } else {
      await api.put(`/erp/settings/currencies/${c.id}`, { name: c.name, symbol: c.symbol, decimals: c.decimals, isBase: c.isBase, isActive: c.isActive })
    }
    currencyDrafts.value = []
    await load()
  } catch (err) { error.value = err.response?.data?.message || 'Save failed' }
  finally { c._saving = false }
}

async function deleteCurrency(c) {
  if (isDraft(c)) { currencyDrafts.value = currencyDrafts.value.filter(d => d !== c); return }
  if (!confirm(`Delete currency ${c.code}?`)) return
  try { await api.delete(`/erp/settings/currencies/${c.id}`); await load() }
  catch (err) { error.value = err.response?.data?.message || 'Delete failed' }
}

async function saveRate(r) {
  error.value = ''
  r._saving = true
  try {
    await api.post('/erp/settings/currencies/rates', { currencyCode: r.currencyCode, rate: r.rate, asOfDate: r.asOfDate, notes: r.notes || null })
    rateDrafts.value = []
    await load()
  } catch (err) { error.value = err.response?.data?.message || 'Save failed' }
  finally { r._saving = false }
}

async function deleteRate(r) {
  if (isDraft(r)) { rateDrafts.value = rateDrafts.value.filter(d => d !== r); return }
  if (!confirm(`Delete this rate?`)) return
  try { await api.delete(`/erp/settings/currencies/rates/${r.id}`); await load() }
  catch (err) { error.value = err.response?.data?.message || 'Delete failed' }
}
</script>
