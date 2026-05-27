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

// ── Number → text (Thai baht / English) ─────────────────────────────────
const TH_DIGITS    = ['ศูนย์', 'หนึ่ง', 'สอง', 'สาม', 'สี่', 'ห้า', 'หก', 'เจ็ด', 'แปด', 'เก้า']
const TH_POSITIONS = ['', 'สิบ', 'ร้อย', 'พัน', 'หมื่น', 'แสน']

function readThai(n, hasHigher = false) {
  if (n === 0) return ''
  if (n >= 1_000_000) {
    const millions = Math.floor(n / 1_000_000)
    const rest = n % 1_000_000
    return readThai(millions) + 'ล้าน' + (rest > 0 ? readThai(rest, true) : '')
  }
  const str = String(n)
  const len = str.length
  let out = ''
  for (let i = 0; i < len; i++) {
    const d = +str[i]
    const pos = len - 1 - i  // 0 = ones, 1 = tens, ...
    if (d === 0) continue
    if (pos === 1 && d === 1)                            out += 'สิบ'
    else if (pos === 1 && d === 2)                       out += 'ยี่สิบ'
    else if (pos === 0 && d === 1 && (len > 1 || hasHigher)) out += 'เอ็ด'
    else                                                 out += TH_DIGITS[d] + TH_POSITIONS[pos]
  }
  return out
}

function thaiBahtText(amount) {
  const v = Math.abs(parseFloat(amount) || 0)
  const baht = Math.floor(v)
  const satang = Math.round((v - baht) * 100)
  if (baht === 0 && satang === 0) return 'ศูนย์บาทถ้วน'
  const bahtPart = baht > 0 ? readThai(baht) + 'บาท' : ''
  const satangPart = satang > 0 ? readThai(satang) + 'สตางค์' : 'ถ้วน'
  return bahtPart + satangPart
}

const EN_ONES = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine',
                 'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen',
                 'Seventeen', 'Eighteen', 'Nineteen']
const EN_TENS = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety']
const EN_SCALES = ['', 'Thousand', 'Million', 'Billion', 'Trillion']

function readEnglishBelow1000(n) {
  let r = ''
  if (n >= 100) {
    r += EN_ONES[Math.floor(n / 100)] + ' Hundred'
    n %= 100
    if (n > 0) r += ' '
  }
  if (n >= 20) {
    r += EN_TENS[Math.floor(n / 10)]
    if (n % 10 > 0) r += '-' + EN_ONES[n % 10]
  } else if (n > 0) {
    r += EN_ONES[n]
  }
  return r
}

function readEnglish(n) {
  if (n === 0) return 'Zero'
  let r = ''
  let scale = 0
  while (n > 0) {
    const chunk = n % 1000
    if (chunk > 0) {
      const part = readEnglishBelow1000(chunk) + (scale > 0 ? ' ' + EN_SCALES[scale] : '')
      r = part + (r ? ' ' + r : '')
    }
    n = Math.floor(n / 1000)
    scale++
  }
  return r
}

// `invariant: true` → the noun is not pluralized in English financial usage.
const CURRENCY_NAMES = {
  THB: { major: 'Baht',   minor: 'Satang', invariant: true  },
  USD: { major: 'Dollar', minor: 'Cent',   invariant: false },
  EUR: { major: 'Euro',   minor: 'Cent',   invariant: false },
  GBP: { major: 'Pound',  minor: 'Pence',  invariant: false, minorInvariant: true },
  JPY: { major: 'Yen',    minor: 'Sen',    invariant: true  },
  CNY: { major: 'Yuan',   minor: 'Fen',    invariant: true  },
  AUD: { major: 'Dollar', minor: 'Cent',   invariant: false },
  SGD: { major: 'Dollar', minor: 'Cent',   invariant: false },
}

function pluralize(word, n, invariant) {
  if (invariant || n === 1) return word
  if (word.endsWith('s')) return word
  return word + 's'
}

function englishAmountText(amount, currencyCode) {
  const v = Math.abs(parseFloat(amount) || 0)
  const whole = Math.floor(v)
  const frac = Math.round((v - whole) * 100)
  const code = (currencyCode || 'THB').toUpperCase()
  const cur = CURRENCY_NAMES[code] || { major: code, minor: '', invariant: true }
  let s = readEnglish(whole)
  if (cur.major) s += ' ' + pluralize(cur.major, whole, cur.invariant)
  if (frac > 0) {
    if (cur.minor) {
      const minorInv = cur.minorInvariant ?? cur.invariant
      s += ' and ' + readEnglish(frac) + ' ' + pluralize(cur.minor, frac, minorInv)
    } else {
      s += ' and ' + String(frac).padStart(2, '0') + '/100'
    }
  } else {
    s += ' Only'
  }
  return s
}

/**
 * Convert an amount to its textual representation in the given locale.
 * Used on document views (quotations, invoices, etc.) to print the total
 * in words for legal/clarity purposes.
 *
 * @param {number|string} amount
 * @param {string} locale       'th' or 'en'
 * @param {string} [currency]   ISO currency code; defaults to THB
 * @returns {string}
 */
export function numToWords(amount, locale = 'en', currency = 'THB') {
  if (locale === 'th') return thaiBahtText(amount)
  return englishAmountText(amount, currency)
}
