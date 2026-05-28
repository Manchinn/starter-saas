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
