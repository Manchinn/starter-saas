// Unit tests for utils/fmt.toFixed.
//
// toFixed wraps accounting-js specifically to dodge the native Number.toFixed
// float bug (e.g. (2.675).toFixed(2) === '2.67'). We pin both the rounding
// contract and the fact that it returns a Number, not a string.

const { toFixed } = require('../fmt')

describe('fmt.toFixed', () => {
  test('rounds to 2 decimals by default', () => {
    expect(toFixed(3.14159)).toBe(3.14)
  })

  test('honours an explicit precision', () => {
    expect(toFixed(3.14159, 3)).toBe(3.142)
    expect(toFixed(3.14159, 0)).toBe(3)
  })

  test('returns a Number, not a string', () => {
    expect(typeof toFixed(10)).toBe('number')
    expect(toFixed(10)).toBe(10)
  })

  test('avoids the native Number.toFixed rounding bug', () => {
    // (2.675).toFixed(2) === '2.67' in plain JS; accounting-js gives 2.68
    expect(toFixed(2.675, 2)).toBe(2.68)
  })

  test('handles floating-point accumulation cleanly', () => {
    expect(toFixed(0.1 + 0.2, 2)).toBe(0.3)
  })
})

// Integrity edge cases. toFixed feeds financial calculations, so its behaviour
// on hostile / malformed input is a data-integrity contract: garbage must
// surface as NaN (so callers can detect and reject it) rather than silently
// becoming a plausible-looking number that corrupts a total. These tests pin
// that contract so a future refactor can't quietly change it.
describe('fmt.toFixed — integrity on malformed input', () => {
  test('non-numeric / undefined input becomes NaN, never a silent number', () => {
    expect(toFixed(undefined)).toBeNaN()
    expect(toFixed(NaN)).toBeNaN()
    expect(toFixed('abc')).toBeNaN()
    expect(toFixed('12.5px')).toBeNaN()
  })

  test('does not throw on adversarial input (callers get NaN to guard on)', () => {
    expect(() => toFixed({})).not.toThrow()
    expect(() => toFixed([1, 2, 3])).not.toThrow()
    expect(toFixed({})).toBeNaN()
  })

  test('a very large finite number stays finite (no exponent-string leakage)', () => {
    expect(Number.isFinite(toFixed(1e21, 2))).toBe(true)
  })
})
