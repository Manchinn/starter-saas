// vendor-bill: focus on the transition matrix in updateStatus, the
// approval-threshold integration, and the rollback when auto-journal fails.

jest.mock('../../../../server/models', () => ({
  VendorBill:     { findAndCountAll: jest.fn(), findByPk: jest.fn(), create: jest.fn() },
  VendorBillItem: { destroy: jest.fn(), create: jest.fn() },
  Vendor:         {},
  PurchaseOrder:  {},
  GoodReceive:    {},
}))

jest.mock('../../../../server/config/database', () => ({ transaction: jest.fn() }))
jest.mock('../../../../server/utils/fmt', () => ({ toFixed: (v) => Math.round(Number(v) * 100) / 100 }))

jest.mock('../services/tax-period.service', () => ({ assertOpen: jest.fn() }))
jest.mock('../services/auto-journal.service', () => ({
  postVendorBill:    jest.fn(),
  postBillPayment:   jest.fn(),
  reverseVendorBill: jest.fn(),
  reverseBillPayment: jest.fn(),
}))
jest.mock('../../audit/audit.service', () => ({ log: jest.fn() }), { virtual: true })
jest.mock('../../settings/services/approval-threshold.service', () => ({ enforce: jest.fn() }), { virtual: true })
jest.mock('../../settings/services/currency.service', () => ({ getRateOn: jest.fn(() => 1) }), { virtual: true })
jest.mock('../../settings/services/sequence.service', () => ({ getNext: jest.fn(() => 'BILL-1') }), { virtual: true })

const { VendorBill } = require('../../../../server/models')
const autoJournal = require('../services/auto-journal.service')
const thresholds = require('../../settings/services/approval-threshold.service')
const service = require('../services/vendor-bill.service')

describe('vendor-bill.updateStatus transitions', () => {
  test('no-op when already in target status', async () => {
    VendorBill.findByPk.mockResolvedValue({ id: 'b', status: 'draft' })
    await service.updateStatus('b', 'draft', 'u', { id: 'u' })
    expect(autoJournal.postVendorBill).not.toHaveBeenCalled()
  })

  test('rejects illegal transition (draft → paid)', async () => {
    VendorBill.findByPk.mockResolvedValue({ id: 'b', status: 'draft' })
    await expect(service.updateStatus('b', 'paid', 'u', { id: 'u' }))
      .rejects.toMatchObject({ status: 400, message: expect.stringContaining('Cannot transition from "draft" to "paid"') })
  })

  test('approval calls approval-threshold enforcement', async () => {
    const bill = { id: 'b', status: 'draft', total: 5000, update: jest.fn().mockResolvedValue() }
    // The service hits findByPk three times: initial fetch, getById(fresh)
    // inside the try block, then the trailing getById return at the end.
    VendorBill.findByPk
      .mockResolvedValueOnce(bill)
      .mockResolvedValueOnce({ id: 'b', status: 'approved', total: 5000 })
      .mockResolvedValueOnce({ id: 'b', status: 'approved', total: 5000 })
    autoJournal.postVendorBill.mockResolvedValue()

    await service.updateStatus('b', 'approved', 'u', { id: 'u', role: 'admin' })
    expect(thresholds.enforce).toHaveBeenCalledWith(expect.objectContaining({
      docType: 'vendor_bill',
      amount: 5000,
    }))
    expect(autoJournal.postVendorBill).toHaveBeenCalled()
  })

  test('rolls back status when auto-journal fails on approval', async () => {
    const bill = { id: 'b', status: 'draft', total: 100, update: jest.fn().mockResolvedValue() }
    VendorBill.findByPk.mockResolvedValue(bill)
    autoJournal.postVendorBill.mockRejectedValue(new Error('boom'))

    await expect(service.updateStatus('b', 'approved', 'u', { id: 'u' })).rejects.toThrow('boom')
    // First update set status: approved; second reverted to draft.
    expect(bill.update).toHaveBeenNthCalledWith(1, { status: 'approved' })
    expect(bill.update).toHaveBeenNthCalledWith(2, { status: 'draft' })
  })

  test('cancelling an approved bill reverses the bill journal (no payment reversal)', async () => {
    // Per the TRANSITIONS table, paid → cancelled is NOT permitted directly;
    // the cancellable transitions are draft → cancelled and approved → cancelled.
    // The approved-cancel path is the meaningful one here because it exercises
    // the reversal-on-cancel branch.
    const bill = { id: 'b', status: 'approved', total: 100, update: jest.fn().mockResolvedValue() }
    VendorBill.findByPk
      .mockResolvedValueOnce(bill)
      .mockResolvedValueOnce({ id: 'b', status: 'cancelled' })
    autoJournal.reverseVendorBill.mockResolvedValue()
    await service.updateStatus('b', 'cancelled', 'u', { id: 'u' })
    expect(autoJournal.reverseBillPayment).not.toHaveBeenCalled()
    expect(autoJournal.reverseVendorBill).toHaveBeenCalled()
  })
})

describe('vendor-bill.remove', () => {
  test('refuses anything other than draft', async () => {
    VendorBill.findByPk.mockResolvedValue({ id: 'b', status: 'approved' })
    await expect(service.remove('b')).rejects.toEqual({ status: 400, message: 'Only draft bills can be deleted' })
  })

  test('destroys a draft', async () => {
    const bill = { id: 'b', status: 'draft', destroy: jest.fn().mockResolvedValue() }
    VendorBill.findByPk.mockResolvedValue(bill)
    await service.remove('b')
    expect(bill.destroy).toHaveBeenCalled()
  })
})
