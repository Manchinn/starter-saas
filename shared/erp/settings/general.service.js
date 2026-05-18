const { Setting } = require('../../../server/models')

const KEY = 'erp.general'

const DEFAULTS = {
  currency: {
    symbol:      '฿',
    position:    'suffix',   // 'prefix' | 'suffix'
    thousandSep: ',',
    decimalSep:  '.',
    precision:   2,
  },
  tax: {
    rate:      0,
    inclusive: false,  // false = tax before total (exclusive), true = tax after total (inclusive)
  },
  calendar: {
    system:     'CE',           // 'CE' = Christian/Gregorian | 'BE' = Buddhist Era (CE + 543)
    dateFormat: 'dd/mm/yyyy',   // display format tokens: dd, mm, yyyy
  },
}

const get = async (userId) => {
  const row = await Setting.findOne({ where: { key: KEY, userId: userId || null } })
  if (!row) return structuredClone(DEFAULTS)
  try {
    const parsed = JSON.parse(row.value)
    return {
      ...DEFAULTS,
      ...parsed,
      currency: { ...DEFAULTS.currency, ...parsed.currency },
      tax:      { ...DEFAULTS.tax,      ...parsed.tax },
      calendar: { ...DEFAULTS.calendar, ...parsed.calendar },
    }
  } catch {
    return structuredClone(DEFAULTS)
  }
}

const save = async (userId, { currency, tax, calendar } = {}) => {
  const current = await get(userId)
  const merged = {
    ...current,
    ...(currency && { currency: { ...current.currency, ...currency } }),
    ...(tax      && { tax:      { ...current.tax,      ...tax      } }),
    ...(calendar && { calendar: { ...current.calendar, ...calendar } }),
  }
  await Setting.upsert({ key: KEY, userId: userId || null, value: JSON.stringify(merged) })
  return merged
}

module.exports = { get, save, DEFAULTS }
