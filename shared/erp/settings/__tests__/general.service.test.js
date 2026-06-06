jest.mock('../../../../server/models', () => ({
  Setting: { findOne: jest.fn(), upsert: jest.fn() },
}))

const { Setting } = require('../../../../server/models')
const service = require('../services/general.service')

describe('general.get', () => {
  test('returns a fresh DEFAULTS clone when no row exists', async () => {
    Setting.findOne.mockResolvedValue(null)
    const out = await service.get('u')
    expect(out).toEqual(service.DEFAULTS)
    // Fresh clone — mutating the result must not corrupt DEFAULTS
    out.currency.symbol = 'CHANGED'
    expect(service.DEFAULTS.currency.symbol).toBe('฿')
  })

  test('deep-merges saved partial overrides on top of DEFAULTS', async () => {
    Setting.findOne.mockResolvedValue({
      value: JSON.stringify({
        currency: { symbol: '$', position: 'prefix' },
        tax: { rate: 7 },
      }),
    })
    const out = await service.get('u')
    // currency.symbol/position overridden, the rest preserved
    expect(out.currency).toEqual({
      symbol: '$',
      position: 'prefix',
      thousandSep: ',',
      decimalSep:  '.',
      precision:   2,
    })
    // tax.rate overridden, tax.inclusive preserved from DEFAULTS
    expect(out.tax).toEqual({ rate: 7, inclusive: false })
    // calendar untouched
    expect(out.calendar).toEqual(service.DEFAULTS.calendar)
  })

  test('falls back to DEFAULTS when the stored JSON is malformed', async () => {
    Setting.findOne.mockResolvedValue({ value: 'not-json' })
    const out = await service.get('u')
    expect(out).toEqual(service.DEFAULTS)
  })

  test('null userId looks up the global row (userId: null)', async () => {
    Setting.findOne.mockResolvedValue(null)
    await service.get(null)
    expect(Setting.findOne).toHaveBeenCalledWith({ where: { key: 'erp.general', userId: null } })
  })
})

describe('general.save', () => {
  test('deep-merges incoming partial onto current and upserts as JSON', async () => {
    Setting.findOne.mockResolvedValue({
      value: JSON.stringify({ currency: { symbol: '$' } }),
    })
    const out = await service.save('u', { calendar: { system: 'BE' } })
    expect(out.calendar.system).toBe('BE')
    expect(out.calendar.dateFormat).toBe('dd/mm/yyyy')   // preserved
    expect(out.currency.symbol).toBe('$')                // preserved

    const upsertArgs = Setting.upsert.mock.calls[0][0]
    expect(upsertArgs.key).toBe('erp.general')
    expect(upsertArgs.userId).toBe('u')
    const stored = JSON.parse(upsertArgs.value)
    expect(stored.calendar.system).toBe('BE')
  })

  test('omitted sections do NOT replace existing values', async () => {
    Setting.findOne.mockResolvedValue({
      value: JSON.stringify({
        currency: { symbol: '€' },
        tax: { rate: 19 },
      }),
    })
    const out = await service.save('u', {}) // empty save
    expect(out.currency.symbol).toBe('€')
    expect(out.tax.rate).toBe(19)
  })

  test('persists the audit.debug toggle', async () => {
    Setting.findOne.mockResolvedValue(null)
    const out = await service.save('u', { audit: { debug: true } })
    expect(out.audit.debug).toBe(true)
    expect(JSON.parse(Setting.upsert.mock.calls[0][0].value).audit.debug).toBe(true)
  })
})

describe('general.isAuditDebug', () => {
  beforeEach(() => jest.clearAllMocks())

  test('true only when audit.debug is set in the stored row', async () => {
    Setting.findOne.mockResolvedValue({ value: JSON.stringify({ audit: { debug: true } }) })
    expect(await service.isAuditDebug('org-debug-on')).toBe(true)
  })

  test('false when no row / no flag', async () => {
    Setting.findOne.mockResolvedValue(null)
    expect(await service.isAuditDebug('org-debug-off')).toBe(false)
  })

  test('caches the result (no second query within the TTL)', async () => {
    Setting.findOne.mockResolvedValue({ value: JSON.stringify({ audit: { debug: true } }) })
    await service.isAuditDebug('org-cache')
    await service.isAuditDebug('org-cache')
    expect(Setting.findOne).toHaveBeenCalledTimes(1)
  })

  test('save() invalidates the cache so a toggle takes effect at once', async () => {
    Setting.findOne.mockResolvedValue({ value: JSON.stringify({ audit: { debug: true } }) })
    expect(await service.isAuditDebug('org-inv')).toBe(true)
    Setting.findOne.mockResolvedValue({ value: JSON.stringify({ audit: { debug: false } }) })
    await service.save('org-inv', { audit: { debug: false } })
    expect(await service.isAuditDebug('org-inv')).toBe(false)
  })
})
