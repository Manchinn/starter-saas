jest.mock('../../../../server/models', () => ({
  VendorPayment:     { findAndCountAll: jest.fn(), findByPk: jest.fn(), create: jest.fn() },
  VendorPaymentBill: { create: jest.fn() },
  VendorBill:        { findAll: jest.fn(), findByPk: jest.fn() },
  Vendor:            { findByPk: jest.fn() },
}))

jest.mock('../../../../server/config/database', () => ({ transaction: jest.fn() }))

jest.mock('../services/tax-period.service', () => ({ assertOpen: jest.fn() }))
jest.mock('../services/auto-journal.service', () => ({
  postVendorPayment: jest.fn(),
  reverseVendorPayment: jest.fn(),
}))
jest.mock('../../settings/services/currency.service', () => ({ getRateOn: jest.fn(() => 1) }), { virtual: true })
jest.mock('../../settings/services/sequence.service', () => ({ getNext: jest.fn(() => 'PMT-1') }), { virtual: true })

const { VendorPayment, VendorBill, Vendor } = require('../../../../server/models')
const taxPeriod = require('../services/tax-period.service')
const autoJournal = require('../services/auto-journal.service')
const service = require('../services/vendor-payment.service')

describe('vendor-payment.create', () => {
  test('rejects missing required fields', async () => {
    await expect(service.create({ date: '2025-01-01', paymentMethod: 'cash' }))
      .rejects.toEqual({ status: 400, message: 'Vendor is required' })
    await expect(service.create({ vendorId: 'v', paymentMethod: 'cash' }))
      .rejects.toEqual({ status: 400, message: 'Date is required' })
    await expect(service.create({ vendorId: 'v', date: '2025-01-01' }))
      .rejects.toEqual({ status: 400, message: 'Payment method is required' })
  })

  test('rejects when neither allocations nor billIds are supplied', async () => {
    await expect(service.create({ vendorId: 'v', date: '2025-01-01', paymentMethod: 'cash' }))
      .rejects.toEqual({ status: 400, message: 'Select at least one bill' })
  })

  test('rejects when allocation exceeds bill outstanding balance', async () => {
    Vendor.findByPk.mockResolvedValue({ id: 'v' })
    VendorBill.findAll.mockResolvedValue([{ id: 'b1', billNumber: 'BILL-1', balanceDue: 100 }])
    await expect(service.create({
      vendorId: 'v', date: '2025-01-01', paymentMethod: 'cash',
      allocations: [{ vendorBillId: 'b1', amount: 200 }],
    })).rejects.toMatchObject({ status: 400, message: expect.stringContaining('exceeds outstanding balance (100)') })
  })

  test('rejects when a bill does not belong to the vendor/org', async () => {
    Vendor.findByPk.mockResolvedValue({ id: 'v' })
    VendorBill.findAll.mockResolvedValue([])
    await expect(service.create({
      vendorId: 'v', date: '2025-01-01', paymentMethod: 'cash',
      allocations: [{ vendorBillId: 'rogue', amount: 10 }],
    })).rejects.toEqual({ status: 400, message: 'One or more bills not found or do not belong to this vendor' })
  })
})

describe('vendor-payment.confirm', () => {
  test('refuses anything other than draft', async () => {
    VendorPayment.findByPk.mockResolvedValue({ id: 'vp', status: 'confirmed', lines: [] })
    await expect(service.confirm('vp', 'u'))
      .rejects.toEqual({ status: 400, message: 'Only draft payments can be confirmed' })
  })

  test('rolls back when auto-journal fails', async () => {
    const vp = {
      id: 'vp', status: 'draft', date: '2025-01-01', organizationId: 'o',
      lines: [{ vendorBillId: 'b1', amount: 50 }],
      update: jest.fn().mockResolvedValue(),
    }
    VendorPayment.findByPk.mockResolvedValue(vp)
    taxPeriod.assertOpen.mockResolvedValue()
    VendorBill.findByPk.mockResolvedValue({ id: 'b1', total: 100, amountPaid: 0, status: 'approved', update: jest.fn().mockResolvedValue() })
    autoJournal.postVendorPayment.mockRejectedValue(new Error('boom'))

    await expect(service.confirm('vp', 'u')).rejects.toThrow('boom')
    expect(vp.update).toHaveBeenNthCalledWith(1, { status: 'confirmed', modifiedBy: 'u' })
    expect(vp.update).toHaveBeenNthCalledWith(2, { status: 'draft' })
  })

  test('happy path: applies allocations and marks bill paid when fully settled', async () => {
    const vp = {
      id: 'vp', status: 'draft', date: '2025-01-01', organizationId: 'o',
      lines: [{ vendorBillId: 'b1', amount: 100 }],
      update: jest.fn().mockResolvedValue(),
    }
    const bill = { id: 'b1', total: 100, amountPaid: 0, status: 'approved', update: jest.fn().mockResolvedValue() }
    VendorPayment.findByPk
      .mockResolvedValueOnce(vp)
      .mockResolvedValueOnce({ id: 'vp', status: 'confirmed' })
      .mockResolvedValueOnce({ id: 'vp', status: 'confirmed' })
    taxPeriod.assertOpen.mockResolvedValue()
    VendorBill.findByPk.mockResolvedValue(bill)
    autoJournal.postVendorPayment.mockResolvedValue()

    await service.confirm('vp', 'u')
    const patch = bill.update.mock.calls[0][0]
    expect(patch.amountPaid).toBe(100)
    expect(patch.status).toBe('paid')
    expect(autoJournal.postVendorPayment).toHaveBeenCalled()
  })
})

describe('vendor-payment.cancel', () => {
  test('cancelling a confirmed payment undoes allocations and reverses the journal', async () => {
    const vp = {
      id: 'vp', status: 'confirmed', date: '2025-01-01', organizationId: 'o',
      lines: [{ vendorBillId: 'b1', amount: 40 }],
      update: jest.fn().mockResolvedValue(),
    }
    const bill = { id: 'b1', total: 100, amountPaid: 100, status: 'paid', update: jest.fn().mockResolvedValue() }
    VendorPayment.findByPk
      .mockResolvedValueOnce(vp)
      .mockResolvedValueOnce({ id: 'vp', status: 'cancelled' })
    taxPeriod.assertOpen.mockResolvedValue()
    VendorBill.findByPk.mockResolvedValue(bill)
    autoJournal.reverseVendorPayment.mockResolvedValue()

    await service.cancel('vp', 'u')
    const patch = bill.update.mock.calls[0][0]
    expect(patch.amountPaid).toBe(60)       // 100 − 40
    expect(patch.status).toBe('approved')   // unsettled again
    expect(autoJournal.reverseVendorPayment).toHaveBeenCalled()
  })
})
