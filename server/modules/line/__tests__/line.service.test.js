/**
 * Server line.service re-exports shared implementation — smoke that require path works.
 * Full behaviour coverage lives under shared/erp/line-integration/__tests__.
 */
const { handleWebhook, createLiffOrder } = require('../line.service')

describe('server line.service re-export', () => {
  test('exports handleWebhook and createLiffOrder', () => {
    expect(typeof handleWebhook).toBe('function')
    expect(typeof createLiffOrder).toBe('function')
  })
})
