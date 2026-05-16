import { ref } from 'vue'
import api from '@/api'

// Cache shared across all consumers in the app
const currencies = ref([])
const loaded     = ref(false)
let   inflight   = null

export function useCurrencies() {
  async function load(force = false) {
    if (loaded.value && !force) return currencies.value
    if (inflight) return inflight
    inflight = (async () => {
      try {
        const { data } = await api.get('/erp/settings/currencies')
        currencies.value = data.data.currencies
        loaded.value = true
        return currencies.value
      } finally { inflight = null }
    })()
    return inflight
  }

  const baseCurrency = () => currencies.value.find(c => c.isBase) || null
  const activeCurrencies = () => currencies.value.filter(c => c.isActive)

  async function getRateOn(currencyCode, asOfDate) {
    if (!currencyCode) return 1
    const base = baseCurrency()
    if (!base || String(currencyCode).toUpperCase() === base.code) return 1
    try {
      const { data } = await api.get('/erp/settings/currencies/rates/all', {
        params: { currencyCode: String(currencyCode).toUpperCase() },
      })
      const rates = data.data.rates
        .filter(r => !asOfDate || new Date(r.asOfDate) <= new Date(asOfDate))
        .sort((a, b) => new Date(b.asOfDate) - new Date(a.asOfDate))
      return rates[0] ? Number(rates[0].rate) : 1
    } catch { return 1 }
  }

  return { currencies, loaded, load, baseCurrency, activeCurrencies, getRateOn }
}
