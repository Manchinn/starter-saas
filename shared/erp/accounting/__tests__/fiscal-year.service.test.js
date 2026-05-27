jest.mock('../../../../server/models', () => ({
  FiscalYear: {
    findAndCountAll: jest.fn(),
    findByPk:        jest.fn(),
    create:          jest.fn(),
  },
}))

const { FiscalYear } = require('../../../../server/models')
const service = require('../services/fiscal-year.service')

describe('fiscal-year.create', () => {
  test('rejects missing name / dates / inverted range', async () => {
    await expect(service.create({ startDate: '2025-01-01', endDate: '2025-12-31' }))
      .rejects.toEqual({ status: 400, message: 'Name is required' })
    await expect(service.create({ name: 'FY25', endDate: '2025-12-31' }))
      .rejects.toEqual({ status: 400, message: 'Start date is required' })
    await expect(service.create({ name: 'FY25', startDate: '2025-01-01' }))
      .rejects.toEqual({ status: 400, message: 'End date is required' })
    await expect(service.create({ name: 'FY25', startDate: '2025-12-31', endDate: '2025-01-01' }))
      .rejects.toEqual({ status: 400, message: 'End date must be after start date' })
  })

  test('defaults status to open and re-reads via getById', async () => {
    FiscalYear.create.mockResolvedValue({ id: 'fy1' })
    FiscalYear.findByPk.mockResolvedValue({ id: 'fy1', name: 'FY25', status: 'open' })
    const out = await service.create({ name: '  FY25  ', startDate: '2025-01-01', endDate: '2025-12-31', userId: 'u' })
    const payload = FiscalYear.create.mock.calls[0][0]
    expect(payload.name).toBe('FY25')
    expect(payload.status).toBe('open')
    expect(out).toEqual({ id: 'fy1', name: 'FY25', status: 'open' })
  })
})

describe('fiscal-year.update', () => {
  test('throws 404 when missing', async () => {
    FiscalYear.findByPk.mockResolvedValue(null)
    await expect(service.update('missing', { name: 'x' })).rejects.toEqual({ status: 404, message: 'Fiscal Year not found' })
  })

  test('refuses to edit a closed fiscal year', async () => {
    FiscalYear.findByPk.mockResolvedValue({ id: 'fy', status: 'closed' })
    await expect(service.update('fy', { name: 'x' })).rejects.toEqual({ status: 400, message: 'Closed fiscal years cannot be edited' })
  })

  test('rejects inverted range when only one date is supplied', async () => {
    const fy = { id: 'fy', status: 'open', startDate: '2025-01-01', endDate: '2025-12-31', update: jest.fn() }
    FiscalYear.findByPk.mockResolvedValue(fy)
    // new endDate < existing startDate
    await expect(service.update('fy', { endDate: '2024-01-01' }))
      .rejects.toEqual({ status: 400, message: 'End date must be after start date' })
  })
})

describe('fiscal-year.close', () => {
  test('flips status to closed', async () => {
    const fy = { id: 'fy', status: 'open', update: jest.fn().mockResolvedValue() }
    FiscalYear.findByPk
      .mockResolvedValueOnce(fy)
      .mockResolvedValueOnce({ id: 'fy', status: 'closed' })
    const out = await service.close('fy', 'u')
    expect(fy.update).toHaveBeenCalledWith({ status: 'closed', modifiedBy: 'u' })
    expect(out.status).toBe('closed')
  })

  test('refuses to close an already-closed year', async () => {
    FiscalYear.findByPk.mockResolvedValue({ id: 'fy', status: 'closed' })
    await expect(service.close('fy', 'u')).rejects.toEqual({ status: 400, message: 'Fiscal Year is already closed' })
  })
})

describe('fiscal-year.remove', () => {
  test('refuses to delete a closed year', async () => {
    FiscalYear.findByPk.mockResolvedValue({ id: 'fy', status: 'closed' })
    await expect(service.remove('fy')).rejects.toEqual({ status: 400, message: 'Closed fiscal years cannot be deleted' })
  })
})
