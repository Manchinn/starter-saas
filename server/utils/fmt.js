/**
 * Server-side financial rounding using accounting-js.
 * Only toFixed is needed server-side (no display formatting).
 */
const accounting = require('accounting-js')

/**
 * Round to fixed decimal places (avoids native toFixed float bugs).
 * Returns a number.
 */
function toFixed(value, precision = 2) {
  return parseFloat(accounting.toFixed(value, precision))
}

module.exports = { toFixed }
