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

const CALENDAR_DEFAULTS = {
  system: 'CE',
}

export const useSettingsStore = defineStore('settings', () => {
  const currency = ref({ ...CURRENCY_DEFAULTS })
  const tax      = ref({ ...TAX_DEFAULTS })
  const calendar = ref({ ...CALENDAR_DEFAULTS })

  async function load() {
    try {
      const { data } = await api.get('/erp/settings/general')
      if (data?.data?.currency) {
        currency.value = { ...CURRENCY_DEFAULTS, ...data.data.currency }
      }
      if (data?.data?.tax) {
        tax.value = { ...TAX_DEFAULTS, ...data.data.tax }
      }
      if (data?.data?.calendar) {
        calendar.value = { ...CALENDAR_DEFAULTS, ...data.data.calendar }
      }
    } catch {
      // fall back to defaults
    }
  }

  async function saveCurrency(config) {
    const { data } = await api.put('/erp/settings/general', { currency: config })
    currency.value = { ...CURRENCY_DEFAULTS, ...data.data.currency }
  }

  async function saveTax(config) {
    const { data } = await api.put('/erp/settings/general', { tax: config })
    tax.value = { ...TAX_DEFAULTS, ...data.data.tax }
  }

  async function saveCalendar(config) {
    const { data } = await api.put('/erp/settings/general', { calendar: config })
    calendar.value = { ...CALENDAR_DEFAULTS, ...data.data.calendar }
  }

  async function saveAll({ currency: currencyData, tax: taxData }) {
    const { data } = await api.put('/erp/settings/general', { currency: currencyData, tax: taxData })
    if (data?.data?.currency) currency.value = { ...CURRENCY_DEFAULTS, ...data.data.currency }
    if (data?.data?.tax)      tax.value      = { ...TAX_DEFAULTS,      ...data.data.tax }
  }

  return { currency, tax, calendar, load, saveCurrency, saveTax, saveCalendar, saveAll }
})
