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
}

const get = async (userId) => {
  const row = await Setting.findOne({ where: { key: KEY, userId: userId || null } })
  if (!row) return structuredClone(DEFAULTS)
  try {
    const parsed = JSON.parse(row.value)
    return { ...DEFAULTS, ...parsed, currency: { ...DEFAULTS.currency, ...parsed.currency } }
  } catch {
    return structuredClone(DEFAULTS)
  }
}

const save = async (userId, { currency }) => {
  const current = await get(userId)
  const merged = {
    ...current,
    currency: { ...current.currency, ...currency },
  }
  await Setting.upsert({ key: KEY, userId: userId || null, value: JSON.stringify(merged) })
  return merged
}

module.exports = { get, save, DEFAULTS }
