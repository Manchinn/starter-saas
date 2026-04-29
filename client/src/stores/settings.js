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

const TAX_DEFAULTS = {
  rate:      0,
  inclusive: false,
}

export const useSettingsStore = defineStore('settings', () => {
  const currency = ref({ ...CURRENCY_DEFAULTS })
  const tax      = ref({ ...TAX_DEFAULTS })

  async function load() {
    try {
      const { data } = await api.get('/erp/settings/general')
      if (data?.data?.currency) {
        currency.value = { ...CURRENCY_DEFAULTS, ...data.data.currency }
      }
      if (data?.data?.tax) {
        tax.value = { ...TAX_DEFAULTS, ...data.data.tax }
      }
    } catch {
      // fall back to defaults
    }
  }

  async function saveCurrency(config) {
    const { data } = await api.put('/erp/settings/general', { currency: config })
    currency.value = { ...CURRENCY_DEFAULTS, ...data.data.currency }
  }

  async function saveAll({ currency: currencyData, tax: taxData }) {
    const { data } = await api.put('/erp/settings/general', { currency: currencyData, tax: taxData })
    if (data?.data?.currency) currency.value = { ...CURRENCY_DEFAULTS, ...data.data.currency }
    if (data?.data?.tax)      tax.value      = { ...TAX_DEFAULTS,      ...data.data.tax }
  }

  return { currency, tax, load, saveCurrency, saveAll }
})
