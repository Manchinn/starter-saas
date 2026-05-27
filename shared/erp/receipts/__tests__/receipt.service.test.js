// Unit tests for receipt.service.
//
// The interesting bits:
//   - amount > 0 validation on both create and update
//   - tax-period assertOpen called against receiptDate
//   - TRANSITIONS map (draft → confirmed/cancelled, confirmed → cancelled
//     only; cancelled terminal)
//   - confirm posts the GL journal AND bumps invoice.amountPaid
//   - cancel-from-confirmed reverses both effects, downgrading invoice to
//     'sent' when it's no longer fully settled
//   - rollback to previous status when auto-journal fails

jest.mock('../../../../server/models', () => ({
  Receipt:  { findAndCountAll: jest.fn(), findByPk: jest.fn(), count: jest.fn(), create: jest.fn() },
  Customer: {},
  Invoice:  { findByPk: jest.fn() },
}))

jest.mock('../../accounting/services/tax-period.service', () => ({ assertOpen: jest.fn() }))
jest.mock('../../accounting/services/auto-journal.service', () => ({
  postReceipt:    jest.fn(),
  reverseReceipt: jest.fn(),
}))
jest.mock('../../audit/audit.service', () => ({ log: jest.fn() }))
jest.mock('../../settings/services/currency.service', () => ({ getRateOn: jest.fn(() => 1) }), { virtual: true })

const { Op } = require('sequelize')
const { Receipt, Invoice } = require('../../../../server/models')
const taxPeriod = require('../../accounting/services/tax-period.service')
const autoJournal = require('../../accounting/services/auto-journal.service')
const service = require('../receipt.service')

describe('receipt.list', () => {
  beforeEach(() => {
    Receipt.findAndCountAll.mockResolvedValue({ count: 0, rows: [] })
  })

  test('paginates, scopes by org, excludes soft-deleted', async () => {
    Receipt.findAndCountAll.mockResolvedValueOnce({ count: 4, rows: [{ id: 'r1' }] })
    const out = await service.list({ page: 2, limit: 2, organizationId: 'o' })
    expect(out).toEqual({ total: 4, page: 2, limit: 2, receipts: [{ id: 'r1' }] })
    const args = Receipt.findAndCountAll.mock.calls[0][0]
    expect(args.offset).toBe(2)
    expect(args.where.organizationId).toBe('o')
    expect(args.where.dataFlag[Op.ne]).toBe(2)
  })

  test('search applies LIKE on receiptNumber', async () => {
    await service.list({ search: 'REC-1', organizationId: 'o' })
    expect(Receipt.findAndCountAll.mock.calls[0][0].where.receiptNumber[Op.like]).toBe('%REC-1%')
  })
})

describe('receipt.getById', () => {
  test('throws 404 when missing', async () => {
    Receipt.findByPk.mockResolvedValue(null)
    await expect(service.getById('missing')).rejects.toEqual({ status: 404, message: 'Receipt not found' })
  })

  test('eager-loads customer and invoice', async () => {
    Receipt.findByPk.mockResolvedValue({ id: 'r1' })
    await service.getById('r1')
    const args = Receipt.findByPk.mock.calls[0][1]
    expect(args.include.map(i => i.as).sort()).toEqual(['customer', 'invoice'])
  })
})

describe('receipt.create', () => {
  test('rejects non-positive amount', async () => {
    await expect(service.create({ amount: 0 }))
      .rejects.toEqual({ status: 400, message: 'Amount must be greater than zero' })
    await expect(service.create({ amount: -5 }))
      .rejects.toEqual({ status: 400, message: 'Amount must be greater than zero' })
    expect(Receipt.create).not.toHaveBeenCalled()
  })

  test('rejects when the tax period is closed', async () => {
    taxPeriod.assertOpen.mockRejectedValue({ status: 400, message: 'period closed' })
    await expect(service.create({ amount: 100, receiptDate: '2025-01-05', organizationId: 'o' }))
      .rejects.toEqual({ status: 400, message: 'period closed' })
    expect(Receipt.create).not.toHaveBeenCalled()
  })

  test('defaults paymentMethod to cash and persists nullable optionals', async () => {
    Receipt.count.mockResolvedValue(5) // → REC-00006
    Receipt.create.mockResolvedValue({ id: 'r1' })
    Receipt.findByPk.mockResolvedValue({ id: 'r1' })

    await service.create({ amount: 50, customerId: 'c', userId: 'u', organizationId: 'org' })
    const payload = Receipt.create.mock.calls[0][0]
    expect(payload.receiptNumber).toBe('REC-00006')
    expect(payload.paymentMethod).toBe('cash')
    expect(payload.amount).toBe(50)
    expect(payload.customerId).toBe('c')
    expect(payload.reference).toBeNull()
    expect(payload.notes).toBeNull()
    expect(payload.organizationId).toBe('org')
    expect(payload.createdBy).toBe('u')
  })
})

describe('receipt.update', () => {
  test('throws 404 when missing', async () => {
    Receipt.findByPk.mockResolvedValue(null)
    await expect(service.update('missing', { amount: 1 }, 'u'))
      .rejects.toEqual({ status: 404, message: 'Receipt not found' })
  })

  test('refuses anything other than draft', async () => {
    Receipt.findByPk.mockResolvedValue({ id: 'r1', status: 'confirmed' })
    await expect(service.update('r1', { amount: 1 }, 'u'))
      .rejects.toEqual({ status: 400, message: 'Only draft receipts can be edited' })
  })

  test('rejects amount = 0 (only when explicitly supplied)', async () => {
    Receipt.findByPk.mockResolvedValue({ id: 'r1', status: 'draft' })
    await expect(service.update('r1', { amount: 0 }, 'u'))
      .rejects.toEqual({ status: 400, message: 'Amount must be greater than zero' })
  })

  test('keeps existing fields when caller omits them (!== undefined merge)', async () => {
    const receipt = {
      id: 'r1', status: 'draft', organizationId: 'o',
      receiptDate: '2025-01-05',
      customerId: 'cust-old', invoiceId: 'inv-old',
      paymentMethod: 'cash', amount: 100,
      reference: 'old-ref', notes: 'old-notes',
      update: jest.fn().mockResolvedValue(),
    }
    Receipt.findByPk
      .mockResolvedValueOnce(receipt)
      .mockResolvedValueOnce({ id: 'r1' }) // trailing getById
    taxPeriod.assertOpen.mockResolvedValue()
    await service.update('r1', { reference: 'new-ref' }, 'u')

    const patch = receipt.update.mock.calls[0][0]
    expect(patch.reference).toBe('new-ref')
    expect(patch.notes).toBe('old-notes')        // unsupplied → kept
    expect(patch.customerId).toBe('cust-old')    // unsupplied → kept
    expect(patch.invoiceId).toBe('inv-old')      // unsupplied → kept
    expect(patch.amount).toBe(100)               // unsupplied → kept
    expect(patch.modifiedBy).toBe('u')
  })

  test('explicit empty string for reference / notes → null', async () => {
    const receipt = {
      id: 'r1', status: 'draft', organizationId: 'o',
      receiptDate: '2025-01-05',
      reference: 'old-ref', notes: 'old',
      update: jest.fn().mockResolvedValue(),
    }
    Receipt.findByPk
      .mockResolvedValueOnce(receipt)
      .mockResolvedValueOnce({ id: 'r1' })
    taxPeriod.assertOpen.mockResolvedValue()
    await service.update('r1', { reference: '', notes: '' }, 'u')
    const patch = receipt.update.mock.calls[0][0]
    expect(patch.reference).toBeNull()
    expect(patch.notes).toBeNull()
  })
})

describe('receipt.updateStatus — transition matrix', () => {
  test('no-op when target == current', async () => {
    Receipt.findByPk.mockResolvedValue({ id: 'r1', status: 'confirmed' })
    await service.updateStatus('r1', 'confirmed', 'u')
    expect(autoJournal.postReceipt).not.toHaveBeenCalled()
  })

  test('rejects illegal transitions (draft → ... → draft)', async () => {
    Receipt.findByPk.mockResolvedValue({ id: 'r1', status: 'confirmed' })
    await expect(service.updateStatus('r1', 'draft', 'u'))
      .rejects.toMatchObject({ status: 400, message: expect.stringContaining('Cannot transition from "confirmed" to "draft"') })
  })

  test('cancelled is terminal', async () => {
    Receipt.findByPk.mockResolvedValue({ id: 'r1', status: 'cancelled' })
    await expect(service.updateStatus('r1', 'draft', 'u'))
      .rejects.toMatchObject({ status: 400, message: expect.stringContaining('from "cancelled"') })
  })

  test('throws 404 when missing', async () => {
    Receipt.findByPk.mockResolvedValue(null)
    await expect(service.updateStatus('missing', 'confirmed', 'u'))
      .rejects.toEqual({ status: 404, message: 'Receipt not found' })
  })
})

describe('receipt.updateStatus — confirm', () => {
  test('posts auto-journal and bumps linked invoice amountPaid', async () => {
    const receipt = {
      id: 'r1', status: 'draft', receiptNumber: 'REC-1',
      invoiceId: 'inv-1', amount: 30,
      update: jest.fn().mockResolvedValue(),
    }
    Receipt.findByPk
      .mockResolvedValueOnce(receipt)
      .mockResolvedValueOnce({ id: 'r1', status: 'confirmed' }) // getById passed to autoJournal
      .mockResolvedValueOnce({ id: 'r1', status: 'confirmed' }) // final getById
    autoJournal.postReceipt.mockResolvedValue()
    const inv = { id: 'inv-1', total: 100, amountPaid: 70, status: 'sent', update: jest.fn().mockResolvedValue() }
    Invoice.findByPk.mockResolvedValue(inv)

    await service.updateStatus('r1', 'confirmed', 'u')
    expect(autoJournal.postReceipt).toHaveBeenCalled()
    // 70 + 30 = 100 → fully settled → paid
    expect(inv.update).toHaveBeenCalledWith({ amountPaid: 100, status: 'paid' })
  })

  test('partial settlement keeps the invoice at sent', async () => {
    const receipt = {
      id: 'r1', status: 'draft', receiptNumber: 'REC-1',
      invoiceId: 'inv-1', amount: 20,
      update: jest.fn().mockResolvedValue(),
    }
    Receipt.findByPk
      .mockResolvedValueOnce(receipt)
      .mockResolvedValueOnce({ id: 'r1' })
      .mockResolvedValueOnce({ id: 'r1' })
    autoJournal.postReceipt.mockResolvedValue()
    const inv = { id: 'inv-1', total: 100, amountPaid: 70, status: 'sent', update: jest.fn().mockResolvedValue() }
    Invoice.findByPk.mockResolvedValue(inv)

    await service.updateStatus('r1', 'confirmed', 'u')
    // 70 + 20 = 90 → still outstanding → keeps 'sent'
    expect(inv.update).toHaveBeenCalledWith({ amountPaid: 90, status: 'sent' })
  })

  test('receipt with no linked invoice still posts the journal', async () => {
    const receipt = {
      id: 'r1', status: 'draft', receiptNumber: 'REC-1',
      invoiceId: null, amount: 50,
      update: jest.fn().mockResolvedValue(),
    }
    Receipt.findByPk
      .mockResolvedValueOnce(receipt)
      .mockResolvedValueOnce({ id: 'r1' })
      .mockResolvedValueOnce({ id: 'r1' })
    autoJournal.postReceipt.mockResolvedValue()
    await service.updateStatus('r1', 'confirmed', 'u')
    expect(autoJournal.postReceipt).toHaveBeenCalled()
    expect(Invoice.findByPk).not.toHaveBeenCalled()
  })

  test('rollback to draft when auto-journal fails', async () => {
    const receipt = {
      id: 'r1', status: 'draft', receiptNumber: 'REC-1',
      invoiceId: null, amount: 50,
      update: jest.fn().mockResolvedValue(),
    }
    Receipt.findByPk.mockResolvedValue(receipt)
    autoJournal.postReceipt.mockRejectedValue(new Error('GL down'))
    await expect(service.updateStatus('r1', 'confirmed', 'u')).rejects.toThrow('GL down')
    expect(receipt.update).toHaveBeenNthCalledWith(1, { status: 'confirmed' })
    expect(receipt.update).toHaveBeenNthCalledWith(2, { status: 'draft' })
  })
})

describe('receipt.updateStatus — cancel-from-confirmed', () => {
  test('reverses the journal AND subtracts amount, downgrades invoice to sent when no longer settled', async () => {
    const receipt = {
      id: 'r1', status: 'confirmed', receiptNumber: 'REC-1',
      invoiceId: 'inv-1', amount: 30,
      update: jest.fn().mockResolvedValue(),
    }
    Receipt.findByPk
      .mockResolvedValueOnce(receipt)
      .mockResolvedValueOnce({ id: 'r1', status: 'cancelled' })
    autoJournal.reverseReceipt.mockResolvedValue()
    const inv = { id: 'inv-1', total: 100, amountPaid: 100, status: 'paid', update: jest.fn().mockResolvedValue() }
    Invoice.findByPk.mockResolvedValue(inv)

    await service.updateStatus('r1', 'cancelled', 'u')
    expect(autoJournal.reverseReceipt).toHaveBeenCalled()
    // 100 − 30 = 70 → no longer settled → 'sent'
    expect(inv.update).toHaveBeenCalledWith({ amountPaid: 70, status: 'sent' })
  })

  test('cancel-from-draft does NOT call reverseReceipt or touch invoice', async () => {
    const receipt = { id: 'r1', status: 'draft', receiptNumber: 'REC-1', amount: 30, invoiceId: 'inv-1', update: jest.fn().mockResolvedValue() }
    Receipt.findByPk
      .mockResolvedValueOnce(receipt)
      .mockResolvedValueOnce({ id: 'r1', status: 'cancelled' })
    await service.updateStatus('r1', 'cancelled', 'u')
    expect(autoJournal.reverseReceipt).not.toHaveBeenCalled()
    expect(Invoice.findByPk).not.toHaveBeenCalled()
  })

  test('rollback when reverseReceipt fails', async () => {
    const receipt = { id: 'r1', status: 'confirmed', receiptNumber: 'REC-1', amount: 30, invoiceId: null, update: jest.fn().mockResolvedValue() }
    Receipt.findByPk.mockResolvedValue(receipt)
    autoJournal.reverseReceipt.mockRejectedValue(new Error('reverse boom'))
    await expect(service.updateStatus('r1', 'cancelled', 'u')).rejects.toThrow('reverse boom')
    expect(receipt.update).toHaveBeenNthCalledWith(1, { status: 'cancelled' })
    expect(receipt.update).toHaveBeenNthCalledWith(2, { status: 'confirmed' })
  })
})

describe('receipt.remove', () => {
  test('refuses anything other than draft', async () => {
    Receipt.findByPk.mockResolvedValue({ id: 'r1', status: 'confirmed' })
    await expect(service.remove('r1'))
      .rejects.toEqual({ status: 400, message: 'Only draft receipts can be deleted' })
  })

  test('throws 404 when missing', async () => {
    Receipt.findByPk.mockResolvedValue(null)
    await expect(service.remove('missing')).rejects.toEqual({ status: 404, message: 'Receipt not found' })
  })

  test('destroys a draft', async () => {
    const receipt = { id: 'r1', status: 'draft', destroy: jest.fn().mockResolvedValue() }
    Receipt.findByPk.mockResolvedValue(receipt)
    await service.remove('r1')
    expect(receipt.destroy).toHaveBeenCalled()
  })
})
