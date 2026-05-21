/**
 * Centralised number / financial formatting using accounting-js.
 *
 * Usage:
 *   import { fmtMoney, fmtNumber, fmtQty, fmtRate } from '@/utils/fmt'
 *
 *   fmtMoney(1234.5)        → "1,234.50 ฿"  (uses currency settings)
 *   fmtMoney(1234.5, '$')   → "$1,234.50"    (explicit symbol override, prefix)
 *   fmtNumber(9876.543, 3)  → "9,876.543"
 *   fmtQty(42)              → "42"
 *   fmtRate(1.23456789)     → "1.2346"
 */
import * as accounting from 'accounting-js'
import { useSettingsStore } from '@/stores/settings'

function getCurrency() {
  try {
    return useSettingsStore().currency
  } catch {
    return { symbol: '฿', position: 'suffix', thousandSep: ',', decimalSep: '.', precision: 2 }
  }
}

function getCalendar() {
  try { return useSettingsStore().calendar ?? {} } catch { return {} }
}

const BE_OFFSET = 543

// Split an input that may be:
//   - a "yyyy-mm-dd" date string
//   - a full ISO datetime "yyyy-mm-ddTHH:MM:SS(.SSS)Z"
//   - a Date object
// into { y, m, d } numbers in the local timezone. Returns null when the input
// can't be parsed.
function partsOf(value) {
  if (value == null || value === '') return null
  if (value instanceof Date) {
    if (isNaN(value.getTime())) return null
    return { y: value.getFullYear(), m: value.getMonth() + 1, d: value.getDate() }
  }
  const str = String(value)
  // Plain date — keep it timezone-independent so a "2025-05-18" doesn't drift
  // to the previous day for UTC- locales.
  const dateMatch = /^(\d{4})-(\d{2})-(\d{2})$/.exec(str)
  if (dateMatch) {
    return { y: +dateMatch[1], m: +dateMatch[2], d: +dateMatch[3] }
  }
  // Anything more elaborate — let Date parse it, then read local parts.
  const dt = new Date(str)
  if (isNaN(dt.getTime())) return null
  return { y: dt.getFullYear(), m: dt.getMonth() + 1, d: dt.getDate() }
}

function applyFormat(parts, fmt) {
  return fmt
    .replace('dd',   String(parts.d).padStart(2, '0'))
    .replace('mm',   String(parts.m).padStart(2, '0'))
    .replace('yyyy', String(parts.y))
}

/**
 * Format a date for display using the configured calendar system and date
 * format. Accepts a date-only string, a full ISO datetime, or a Date object.
 *
 * @param {string|Date} value
 * @returns {string} formatted e.g. "18/05/2568" (BE) or "18/05/2025" (CE);
 *                   empty string for falsy/unparseable input.
 */
export function fmtDate(value) {
  const parts = partsOf(value)
  if (!parts) return ''
  const cal = getCalendar()
  if (cal.system === 'BE') parts.y += BE_OFFSET
  return applyFormat(parts, cal.dateFormat || 'dd/mm/yyyy')
}

/**
 * Like fmtDate but appends the local time as HH:MM (24-hour). Use for
 * "createdAt" / activity timestamps where the time-of-day matters.
 *
 * @param {string|Date} value
 * @param {object} [opts]
 * @param {boolean} [opts.seconds=false] include :SS in the time part
 */
export function fmtDateTime(value, { seconds = false } = {}) {
  const parts = partsOf(value)
  if (!parts) return ''
  const cal = getCalendar()
  const year = cal.system === 'BE' ? parts.y + BE_OFFSET : parts.y
  const datePart = applyFormat({ ...parts, y: year }, cal.dateFormat || 'dd/mm/yyyy')

  let dt
  if (value instanceof Date) dt = value
  else                       dt = new Date(value)
  if (!dt || isNaN(dt.getTime())) return datePart

  const hh = String(dt.getHours()).padStart(2, '0')
  const mm = String(dt.getMinutes()).padStart(2, '0')
  const ss = String(dt.getSeconds()).padStart(2, '0')
  return seconds ? `${datePart} ${hh}:${mm}:${ss}` : `${datePart} ${hh}:${mm}`
}

/**
 * Format a financial/monetary value using the configured currency settings.
 * @param {number|string} value
 * @param {string}  symbolOverride  If provided, overrides the currency symbol (forces prefix position)
 * @param {number}  precisionOverride  If provided, overrides the configured decimal places
 */
export function fmtMoney(value, symbolOverride = undefined, precisionOverride = undefined) {
  const c = getCurrency()
  const symbol    = symbolOverride !== undefined ? symbolOverride : (c.symbol || '')
  const precision = precisionOverride !== undefined ? precisionOverride : (c.precision ?? 2)
  const format    = symbolOverride !== undefined
    ? '%s%v'
    : (c.position === 'prefix' ? '%s%v' : (symbol ? '%v\u00a0%s' : '%v'))
  return accounting.formatMoney(value, {
    symbol,
    format,
    thousand: c.thousandSep ?? ',',
    decimal:  c.decimalSep  ?? '.',
    precision,
  })
}

/**
 * Format a plain number with thousand separators.
 * @param {number|string} value
 * @param {number} precision Decimal places (default: 2)
 */
export function fmtNumber(value, precision = 2) {
  return accounting.formatNumber(value, precision, ',', '.')
}

/**
 * Format an integer-like quantity (no decimals by default).
 * @param {number|string} value
 * @param {number} precision Decimal places (default: 0)
 */
export function fmtQty(value, precision = 0) {
  return accounting.formatNumber(value, precision, ',', '.')
}

/**
 * Format a rate / WAC with higher precision.
 * @param {number|string} value
 * @param {number} precision Decimal places (default: 4)
 */
export function fmtRate(value, precision = 4) {
  return accounting.formatNumber(value, precision, ',', '.')
}

/**
 * Round to fixed decimal places using accounting-js (avoids native toFixed float bugs).
 * Returns a number, not a string.
 * @param {number|string} value
 * @param {number} precision
 */
export function toFixed(value, precision = 2) {
  return parseFloat(accounting.toFixed(value, precision))
}
