jest.mock('../../../../server/models', () => ({
  Currency:     { findAll: jest.fn(), findByPk: jest.fn(), findOne: jest.fn(), create: jest.fn(), update: jest.fn() },
  ExchangeRate: { findAll: jest.fn(), findByPk: jest.fn(), findOne: jest.fn(), create: jest.fn() },
}))

const { Op } = require('sequelize')
const { Currency, ExchangeRate } = require('../../../../server/models')
const service = require('../services/currency.service')

describe('currency.listCurrencies', () => {
  test('orders by isBase DESC then code DESC, excludes soft-deleted', async () => {
    Currency.findAll.mockResolvedValue([])
    await service.listCurrencies({ organizationId: 'o' })
    const args = Currency.findAll.mock.calls[0][0]
    expect(args.where.organizationId).toBe('o')
    expect(args.where.dataFlag[Op.ne]).toBe(2)
    expect(args.order).toEqual([['isBase', 'DESC'], ['code', 'DESC']])
  })
})

describe('currency.createCurrency', () => {
  test('rejects missing code / name', async () => {
    await expect(service.createCurrency({ name: 'X' })).rejects.toEqual({ status: 400, message: 'Currency code is required' })
    await expect(service.createCurrency({ code: 'X' })).rejects.toEqual({ status: 400, message: 'Currency name is required' })
  })

  test('uppercases + trims the code, defaults decimals=2 and isBase=false', async () => {
    Currency.create.mockResolvedValue({ id: 'c1' })
    await service.createCurrency({ code: ' usd ', name: 'US Dollar', organizationId: 'o' })
    const payload = Currency.create.mock.calls[0][0]
    expect(payload.code).toBe('USD')
    expect(payload.decimals).toBe(2)
    expect(payload.isBase).toBe(false)
    expect(Currency.update).not.toHaveBeenCalled() // not flipping base → no demote
  })

  test('isBase: true demotes the existing base before creating', async () => {
    Currency.create.mockResolvedValue({ id: 'c1' })
    await service.createCurrency({ code: 'EUR', name: 'Euro', isBase: true, organizationId: 'o' })
    expect(Currency.update).toHaveBeenCalledWith(
      { isBase: false },
      { where: { organizationId: 'o', isBase: true } },
    )
  })
})

describe('currency.updateCurrency', () => {
  test('throws 404 when missing', async () => {
    Currency.findByPk.mockResolvedValue(null)
    await expect(service.updateCurrency('missing', { name: 'x' }, 'u'))
      .rejects.toEqual({ status: 404, message: 'Currency not found' })
  })

  test('promoting to base demotes the existing base in the same org first', async () => {
    const c = { id: 'c1', organizationId: 'o', isBase: false, update: jest.fn().mockResolvedValue() }
    Currency.findByPk.mockResolvedValue(c)
    await service.updateCurrency('c1', { isBase: true }, 'u')
    expect(Currency.update).toHaveBeenCalledWith(
      { isBase: false },
      { where: { organizationId: 'o', isBase: true } },
    )
    expect(c.update).toHaveBeenCalledWith(expect.objectContaining({ isBase: true }))
  })

  test('keeping isBase as-is does not trigger the demotion', async () => {
    const c = { id: 'c1', organizationId: 'o', isBase: true, update: jest.fn().mockResolvedValue() }
    Currency.findByPk.mockResolvedValue(c)
    await service.updateCurrency('c1', { isBase: true }, 'u') // already base
    expect(Currency.update).not.toHaveBeenCalled()
  })

  test('symbol empty string → null', async () => {
    const c = { id: 'c1', organizationId: 'o', isBase: false, update: jest.fn().mockResolvedValue() }
    Currency.findByPk.mockResolvedValue(c)
    await service.updateCurrency('c1', { symbol: '' }, 'u')
    expect(c.update.mock.calls[0][0].symbol).toBeNull()
  })
})

describe('currency.removeCurrency', () => {
  test('refuses to delete the base', async () => {
    Currency.findByPk.mockResolvedValue({ id: 'c1', isBase: true, destroy: jest.fn() })
    await expect(service.removeCurrency('c1'))
      .rejects.toEqual({ status: 400, message: 'Cannot delete the base currency' })
  })
})

describe('currency.createRate', () => {
  test('rejects missing currency / non-positive rate / missing date', async () => {
    await expect(service.createRate({ rate: 1, asOfDate: '2025-01-01' }))
      .rejects.toEqual({ status: 400, message: 'Currency code is required' })
    await expect(service.createRate({ currencyCode: 'USD', rate: 0, asOfDate: '2025-01-01' }))
      .rejects.toEqual({ status: 400, message: 'Rate must be greater than 0' })
    await expect(service.createRate({ currencyCode: 'USD', rate: 35 }))
      .rejects.toEqual({ status: 400, message: 'As-of date is required' })
  })

  test('uppercases currency code and defaults source to manual', async () => {
    ExchangeRate.create.mockResolvedValue({ id: 'r1' })
    await service.createRate({ currencyCode: ' usd ', rate: 35, asOfDate: '2025-01-01' })
    const payload = ExchangeRate.create.mock.calls[0][0]
    expect(payload.currencyCode).toBe('USD')
    expect(payload.source).toBe('manual')
  })
})

describe('currency.getRateOn', () => {
  test('returns 1 when no currency given', async () => {
    expect(await service.getRateOn(null, '2025-01-01', 'o')).toBe(1)
  })

  test('returns 1 when no base currency is configured', async () => {
    Currency.findOne.mockResolvedValue(null)
    expect(await service.getRateOn('USD', '2025-01-01', 'o')).toBe(1)
  })

  test('returns 1 when currency code matches the base', async () => {
    Currency.findOne.mockResolvedValue({ code: 'USD' })
    expect(await service.getRateOn('usd', '2025-01-01', 'o')).toBe(1)
  })

  test('returns the most recent rate <= asOfDate', async () => {
    Currency.findOne.mockResolvedValue({ code: 'THB' })
    ExchangeRate.findOne.mockResolvedValue({ rate: '35.25' })
    const out = await service.getRateOn('USD', '2025-01-15', 'o')
    expect(out).toBe(35.25) // parsed as Number
    const args = ExchangeRate.findOne.mock.calls[0][0]
    expect(args.where.currencyCode).toBe('USD')
    expect(args.where.asOfDate[Op.lte]).toBeInstanceOf(Date)
    expect(args.order).toEqual([['asOfDate', 'DESC']])
  })

  test('falls back to 1 when no exchange rate row exists for the date', async () => {
    Currency.findOne.mockResolvedValue({ code: 'THB' })
    ExchangeRate.findOne.mockResolvedValue(null)
    expect(await service.getRateOn('USD', '2025-01-15', 'o')).toBe(1)
  })
})
