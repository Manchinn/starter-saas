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

/**
 * Format a CE date string for display using the configured calendar system and date format.
 * @param {string} ceStr  ISO date string e.g. "2025-05-18"
 * @returns {string}  formatted e.g. "18/05/2568" (BE) or "18/05/2025" (CE)
 */
export function fmtDate(ceStr) {
  if (!ceStr) return ''
  const parts = ceStr.split('-')
  if (parts.length < 3 || isNaN(Number(parts[0]))) return ceStr
  const cal = getCalendar()
  let year = Number(parts[0])
  if (cal.system === 'BE') year += BE_OFFSET
  const fmt = cal.dateFormat || 'dd/mm/yyyy'
  return fmt
    .replace('dd',   parts[2].padStart(2, '0'))
    .replace('mm',   parts[1].padStart(2, '0'))
    .replace('yyyy', String(year))
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
