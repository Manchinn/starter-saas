/**
 * Centralised number / financial formatting using accounting-js.
 *
 * Usage:
 *   import { fmtMoney, fmtNumber, fmtQty, fmtRate } from '@/utils/fmt'
 *
 *   fmtMoney(1234.5)       → "1,234.50"
 *   fmtMoney(1234.5, '$')  → "$1,234.50"
 *   fmtNumber(9876.543, 3) → "9,876.543"
 *   fmtQty(42)             → "42"
 *   fmtRate(1.23456789)    → "1.2346"
 */
import * as accounting from 'accounting-js'

// Global defaults
accounting.settings.number = { precision: 2, thousand: ',', decimal: '.' }
accounting.settings.currency = { symbol: '', format: '%s%v', thousand: ',', decimal: '.', precision: 2 }

/**
 * Format a financial/monetary value.
 * @param {number|string} value
 * @param {string}  symbol    Currency symbol (default: none)
 * @param {number}  precision Decimal places (default: 2)
 */
export function fmtMoney(value, symbol = '', precision = 2) {
  return accounting.formatMoney(value, symbol, precision, ',', '.')
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
