jest.mock('../../../../server/models', () => ({
  ApprovalThreshold: { findAll: jest.fn(), findByPk: jest.fn(), create: jest.fn() },
}))

jest.mock('../../../../server/middleware/permission', () => ({
  resolvePermissions: jest.fn(),
}))

const { Op } = require('sequelize')
const { ApprovalThreshold } = require('../../../../server/models')
const { resolvePermissions } = require('../../../../server/middleware/permission')
const service = require('../services/approval-threshold.service')

describe('approval-threshold.list', () => {
  test('scopes by org + soft-delete, orders by docType then amount', async () => {
    ApprovalThreshold.findAll.mockResolvedValue([])
    await service.list({ organizationId: 'o' })
    const args = ApprovalThreshold.findAll.mock.calls[0][0]
    expect(args.where.organizationId).toBe('o')
    expect(args.where.dataFlag[Op.ne]).toBe(2)
    expect(args.order).toEqual([['docType', 'ASC'], ['amount', 'ASC']])
  })

  test('docType filter applied when provided', async () => {
    ApprovalThreshold.findAll.mockResolvedValue([])
    await service.list({ docType: 'vendor_bill', organizationId: 'o' })
    expect(ApprovalThreshold.findAll.mock.calls[0][0].where.docType).toBe('vendor_bill')
  })
})

describe('approval-threshold.create', () => {
  test('rejects missing docType / amount / requiredPermission', async () => {
    await expect(service.create({ amount: 1, requiredPermission: 'p' }))
      .rejects.toEqual({ status: 400, message: 'Document type is required' })
    await expect(service.create({ docType: 'vendor_bill', requiredPermission: 'p' }))
      .rejects.toEqual({ status: 400, message: 'Amount is required' })
    await expect(service.create({ docType: 'vendor_bill', amount: 1 }))
      .rejects.toEqual({ status: 400, message: 'Required permission is required' })
  })

  test('amount=0 is accepted (only null/undefined rejected)', async () => {
    ApprovalThreshold.create.mockResolvedValue({ id: 't1' })
    await service.create({ docType: 'vendor_bill', amount: 0, requiredPermission: 'finance.approve' })
    expect(ApprovalThreshold.create).toHaveBeenCalled()
  })
})

describe('approval-threshold.enforce', () => {
  test('requires an authenticated user', async () => {
    await expect(service.enforce({ docType: 'vendor_bill', amount: 100 }))
      .rejects.toEqual({ status: 401, message: 'Authenticated user is required' })
  })

  test('no rule applies → silent pass', async () => {
    ApprovalThreshold.findAll.mockResolvedValue([])
    await expect(service.enforce({
      user: { id: 'u' }, docType: 'vendor_bill', amount: 100, organizationId: 'o',
    })).resolves.toBeUndefined()
  })

  test('picks the HIGHEST applicable threshold (amount <= docAmount, ordered DESC)', async () => {
    ApprovalThreshold.findAll.mockResolvedValue([
      { amount: 10000, requiredPermission: 'finance.cfo' },
      { amount: 1000,  requiredPermission: 'finance.manager' },
      { amount: 100,   requiredPermission: 'finance.approve' },
    ])
    resolvePermissions.mockResolvedValue(new Set(['finance.manager']))
    // doc amount 20000 → biggest applicable is the 10000-tier, needs cfo perm
    await expect(service.enforce({
      user: { id: 'u' }, docType: 'vendor_bill', amount: 20000, organizationId: 'o',
    })).rejects.toMatchObject({
      status: 403,
      message: expect.stringContaining('approval threshold (10000)'),
    })
    // Verify the query was scoped by amount <= docAmount + ordered DESC
    const args = ApprovalThreshold.findAll.mock.calls[0][0]
    expect(args.where.amount[Op.lte]).toBe(20000)
    expect(args.order).toEqual([['amount', 'DESC']])
  })

  test('user with the required permission passes silently', async () => {
    ApprovalThreshold.findAll.mockResolvedValue([
      { amount: 1000, requiredPermission: 'finance.manager' },
    ])
    resolvePermissions.mockResolvedValue(new Set(['finance.manager']))
    await expect(service.enforce({
      user: { id: 'u' }, docType: 'vendor_bill', amount: 5000, organizationId: 'o',
    })).resolves.toBeUndefined()
  })

  test('wildcard "*" permission bypasses every threshold', async () => {
    ApprovalThreshold.findAll.mockResolvedValue([
      { amount: 10000, requiredPermission: 'finance.cfo' },
    ])
    resolvePermissions.mockResolvedValue(new Set(['*']))
    await expect(service.enforce({
      user: { id: 'u' }, docType: 'vendor_bill', amount: 999999, organizationId: 'o',
    })).resolves.toBeUndefined()
  })

  test('amount coerced to 0 when falsy / non-numeric', async () => {
    ApprovalThreshold.findAll.mockResolvedValue([])
    await service.enforce({ user: { id: 'u' }, docType: 'x', amount: 'NaN', organizationId: 'o' })
    expect(ApprovalThreshold.findAll.mock.calls[0][0].where.amount[Op.lte]).toBe(0)
  })
})
