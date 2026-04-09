import { defineStore } from 'pinia'
import { ref } from 'vue'
import api from '@/api'

const CURRENCY_DEFAULTS = {
  symbol:      '฿',
  position:    'suffix',
  thousandSep: ',',
  decimalSep:  '.',
  precision:   2,
}

export const useSettingsStore = defineStore('settings', () => {
  const currency = ref({ ...CURRENCY_DEFAULTS })

  async function load() {
    try {
      const { data } = await api.get('/erp/settings/general')
      if (data?.data?.currency) {
        currency.value = { ...CURRENCY_DEFAULTS, ...data.data.currency }
      }
    } catch {
      // fall back to defaults
    }
  }

  async function saveCurrency(config) {
    const { data } = await api.put('/erp/settings/general', { currency: config })
    currency.value = { ...CURRENCY_DEFAULTS, ...data.data.currency }
  }

  return { currency, load, saveCurrency }
})
