jest.mock('../../../../server/models', () => ({
  TaxPeriod:  { findAll: jest.fn(), findByPk: jest.fn(), findOne: jest.fn(), create: jest.fn() },
  FiscalYear: { findOne: jest.fn() },
  Journal:        {},
  JournalLine:    { findAll: jest.fn() },
  ChartOfAccount: {},
}))

jest.mock('../services/account-mapping.service', () => ({
  getByCode: jest.fn(),
}))

const { Op } = require('sequelize')
const { TaxPeriod, FiscalYear, JournalLine } = require('../../../../server/models')
const accountsSvc = require('../services/account-mapping.service')
const service = require('../services/tax-period.service')

describe('tax-period.create', () => {
  test('rejects missing name / dates / inverted range', async () => {
    await expect(service.create({ startDate: '2025-01-01', endDate: '2025-01-31' }))
      .rejects.toEqual({ status: 400, message: 'Name is required' })
    await expect(service.create({ name: 'Jan', startDate: '2025-01-01' }))
      .rejects.toEqual({ status: 400, message: 'Start and end dates are required' })
    await expect(service.create({ name: 'Jan', startDate: '2025-02-01', endDate: '2025-01-01' }))
      .rejects.toEqual({ status: 400, message: 'End date must be after start date' })
  })

  test('handles Date objects as well as ISO strings for the range check', async () => {
    TaxPeriod.create.mockResolvedValue({ id: 'p1' })
    await service.create({ name: 'Jan', startDate: new Date('2025-01-01'), endDate: new Date('2025-01-31') })
    expect(TaxPeriod.create).toHaveBeenCalled()
  })
})

describe('tax-period.close / reopen', () => {
  test('close is idempotent (already-closed period returns the same row)', async () => {
    const closed = { id: 'p', status: 'closed', update: jest.fn() }
    TaxPeriod.findByPk.mockResolvedValue(closed)
    const out = await service.close('p', 'u')
    expect(out).toBe(closed)
    expect(closed.update).not.toHaveBeenCalled()
  })

  test('close records closedBy + closedAt on a still-open period', async () => {
    const open = { id: 'p', status: 'open', update: jest.fn().mockResolvedValue() }
    TaxPeriod.findByPk.mockResolvedValue(open)
    await service.close('p', 'u')
    const patch = open.update.mock.calls[0][0]
    expect(patch.status).toBe('closed')
    expect(patch.closedBy).toBe('u')
    expect(patch.closedAt).toBeInstanceOf(Date)
  })

  test('reopen wipes closedBy / closedAt', async () => {
    const closed = { id: 'p', status: 'closed', update: jest.fn().mockResolvedValue() }
    TaxPeriod.findByPk.mockResolvedValue(closed)
    await service.reopen('p', 'u')
    const patch = closed.update.mock.calls[0][0]
    expect(patch.status).toBe('open')
    expect(patch.closedBy).toBeNull()
    expect(patch.closedAt).toBeNull()
  })
})

describe('tax-period.assertOpen', () => {
  test('no-op when no date supplied', async () => {
    await service.assertOpen(null, 'org')
    expect(TaxPeriod.findOne).not.toHaveBeenCalled()
  })

  test('throws when date falls inside a closed tax period', async () => {
    TaxPeriod.findOne.mockResolvedValue({ name: 'Jan 2025' })
    await expect(service.assertOpen('2025-01-15', 'org'))
      .rejects.toMatchObject({ status: 400, message: expect.stringContaining('Jan 2025') })
    const args = TaxPeriod.findOne.mock.calls[0][0].where
    expect(args.status).toBe('closed')
    expect(args.startDate[Op.lte]).toBe('2025-01-15')
    expect(args.endDate[Op.gte]).toBe('2025-01-15')
  })

  test('falls through to fiscal year check when tax period is open', async () => {
    TaxPeriod.findOne.mockResolvedValue(null)
    FiscalYear.findOne.mockResolvedValue({ name: 'FY25' })
    await expect(service.assertOpen('2025-01-15', 'org'))
      .rejects.toMatchObject({ status: 400, message: expect.stringContaining('FY25') })
  })

  test('returns silently when both checks pass', async () => {
    TaxPeriod.findOne.mockResolvedValue(null)
    FiscalYear.findOne.mockResolvedValue(null)
    await expect(service.assertOpen('2025-01-15', 'org')).resolves.toBeUndefined()
  })
})

describe('tax-period.getVatReport', () => {
  test('returns zeros with a hint when the VAT accounts are not seeded', async () => {
    TaxPeriod.findByPk.mockResolvedValue({ id: 'p', startDate: '2025-01-01', endDate: '2025-01-31' })
    accountsSvc.getByCode.mockResolvedValue(null)
    const out = await service.getVatReport('p', 'org')
    expect(out.outputTax.total).toBe(0)
    expect(out.inputTax.total).toBe(0)
    expect(out.netPayable).toBe(0)
    expect(out.message).toMatch(/2140\/1160/)
  })

  test('aggregates posted journal lines into output (credit-debit) and input (debit-credit) buckets', async () => {
    TaxPeriod.findByPk.mockResolvedValue({ id: 'p', startDate: '2025-01-01', endDate: '2025-01-31' })
    accountsSvc.getByCode
      .mockResolvedValueOnce({ id: 'out', code: '2140' })
      .mockResolvedValueOnce({ id: 'inp', code: '1160' })
    JournalLine.findAll.mockResolvedValue([
      // Output VAT line: 100 credit → +100 toward output total
      { id: 'l1', accountId: 'out', debit: '0', credit: '100', journalId: 'j1', journal: { refNo: 'JE1', date: '2025-01-05', status: 'posted' } },
      // Output VAT reversal: 20 debit → −20 from output
      { id: 'l2', accountId: 'out', debit: '20', credit: '0',  journalId: 'j2', journal: { refNo: 'JE2', date: '2025-01-06', status: 'posted' } },
      // Input VAT line: 50 debit → +50 toward input total
      { id: 'l3', accountId: 'inp', debit: '50', credit: '0',  journalId: 'j3', journal: { refNo: 'JE3', date: '2025-01-07', status: 'posted' } },
    ])
    const out = await service.getVatReport('p', 'org')
    expect(out.outputTax.total).toBe(80)  // 100 − 20
    expect(out.inputTax.total).toBe(50)
    expect(out.netPayable).toBe(30)
    expect(out.outputTax.lines).toHaveLength(2)
    expect(out.inputTax.lines).toHaveLength(1)
  })
})
