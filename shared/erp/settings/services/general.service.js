const { Setting } = require('../../../../server/models')

const KEY = 'erp.general'

const DEFAULTS = {
  general: {
    sortOrder: 'DESC',  // 'DESC' = newest first | 'ASC' = oldest first
  },
  currency: {
    symbol:      '฿',
    position:    'suffix',   // 'prefix' | 'suffix'
    thousandSep: ',',
    decimalSep:  '.',
    precision:   2,
  },
  tax: {
    rate:        0,
    inclusive:   false,  // false = tax before total (exclusive), true = tax after total (inclusive)
    withholding: true,   // when true, invoices expose the WHT (หัก ณ ที่จ่าย) field
  },
  calendar: {
    system:     'CE',           // 'CE' = Christian/Gregorian | 'BE' = Buddhist Era (CE + 543)
    dateFormat: 'dd/mm/yyyy',   // display format tokens: dd, mm, yyyy
  },
  audit: {
    debug: false,   // when true, the ERP audit middleware also stores the request payload on each log row
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
      general:  { ...DEFAULTS.general,  ...parsed.general },
      currency: { ...DEFAULTS.currency, ...parsed.currency },
      tax:      { ...DEFAULTS.tax,      ...parsed.tax },
      calendar: { ...DEFAULTS.calendar, ...parsed.calendar },
      audit:    { ...DEFAULTS.audit,    ...parsed.audit },
    }
  } catch {
    return structuredClone(DEFAULTS)
  }
}

const save = async (userId, { general, currency, tax, calendar, audit } = {}) => {
  const current = await get(userId)
  const merged = {
    ...current,
    ...(general  && { general:  { ...current.general,  ...general  } }),
    ...(currency && { currency: { ...current.currency, ...currency } }),
    ...(tax      && { tax:      { ...current.tax,      ...tax      } }),
    ...(calendar && { calendar: { ...current.calendar, ...calendar } }),
    ...(audit    && { audit:    { ...current.audit,    ...audit    } }),
  }
  await Setting.upsert({ key: KEY, userId: userId || null, value: JSON.stringify(merged) })
  auditDebugCache.delete(userId || null) // a saved change takes effect immediately
  return merged
}

// ── Audit-debug fast path ─────────────────────────────────────────────────────
// The ERP audit middleware checks this on every mutation, so reading the Setting
// row each time would add a query per write. Cache the boolean per org for a
// short TTL; save() above invalidates it so a toggle takes effect at once.
const auditDebugCache = new Map() // orgId|null -> { value, expires }
const AUDIT_DEBUG_TTL_MS = 30 * 1000

const isAuditDebug = async (orgId) => {
  const key = orgId || null
  const hit = auditDebugCache.get(key)
  if (hit && hit.expires > Date.now()) return hit.value
  let value = false
  try {
    const row = await Setting.findOne({ where: { key: KEY, userId: key } })
    if (row) value = JSON.parse(row.value)?.audit?.debug === true
  } catch { value = false }
  auditDebugCache.set(key, { value, expires: Date.now() + AUDIT_DEBUG_TTL_MS })
  return value
}

module.exports = { get, save, isAuditDebug, DEFAULTS }
