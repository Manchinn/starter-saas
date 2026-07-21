jest.mock('../../../../server/models', () => ({
  ReceivePayment:        { findAndCountAll: jest.fn(), findByPk: jest.fn(), create: jest.fn() },
  ReceivePaymentInvoice: { create: jest.fn() },
  Invoice:               { findAll: jest.fn(), findByPk: jest.fn() },
  Customer:              { findByPk: jest.fn() },
}))

jest.mock('../../../../server/config/database', () => ({ transaction: jest.fn() }))

jest.mock('../services/tax-period.service', () => ({ assertOpen: jest.fn() }))
jest.mock('../services/auto-journal.service', () => ({
  postReceivePayment: jest.fn(),
  reverseReceivePayment: jest.fn(),
}))
jest.mock('../../settings/services/currency.service', () => ({ getRateOn: jest.fn(() => 1) }), { virtual: true })
jest.mock('../../settings/services/sequence.service', () => ({ getNext: jest.fn(() => 'RCP-1') }), { virtual: true })
jest.mock('../../notifications/customer-notify', () => ({ notifyCustomer: jest.fn() }))

const { ReceivePayment, Invoice, Customer } = require('../../../../server/models')
const taxPeriod = require('../services/tax-period.service')
const autoJournal = require('../services/auto-journal.service')
const { notifyCustomer } = require('../../notifications/customer-notify')
const service = require('../services/receive-payment.service')

describe('receive-payment.create', () => {
  test('rejects missing required fields', async () => {
    await expect(service.create({ date: '2025-01-01', paymentMethod: 'cash' }))
      .rejects.toEqual({ status: 400, message: 'Customer is required' })
    await expect(service.create({ customerId: 'c', paymentMethod: 'cash' }))
      .rejects.toEqual({ status: 400, message: 'Date is required' })
    await expect(service.create({ customerId: 'c', date: '2025-01-01' }))
      .rejects.toEqual({ status: 400, message: 'Payment method is required' })
  })

  test('rejects when neither allocations nor invoiceIds are supplied', async () => {
    await expect(service.create({ customerId: 'c', date: '2025-01-01', paymentMethod: 'cash' }))
      .rejects.toEqual({ status: 400, message: 'Select at least one invoice' })
  })

  test('rejects when allocation exceeds invoice outstanding balance', async () => {
    Customer.findByPk.mockResolvedValue({ id: 'c' })
    Invoice.findAll.mockResolvedValue([{ id: 'inv1', invoiceNumber: 'INV-1', balanceDue: 100 }])
    await expect(service.create({
      customerId: 'c', date: '2025-01-01', paymentMethod: 'cash',
      allocations: [{ invoiceId: 'inv1', amount: 200 }],
    })).rejects.toMatchObject({
      status: 400,
      message: expect.stringContaining('exceeds outstanding balance (100)'),
    })
  })

  test('rejects non-positive allocation amount', async () => {
    Customer.findByPk.mockResolvedValue({ id: 'c' })
    Invoice.findAll.mockResolvedValue([{ id: 'inv1', invoiceNumber: 'INV-1', balanceDue: 100 }])
    await expect(service.create({
      customerId: 'c', date: '2025-01-01', paymentMethod: 'cash',
      allocations: [{ invoiceId: 'inv1', amount: 0 }],
    })).rejects.toMatchObject({
      status: 400,
      message: expect.stringContaining('must be greater than 0'),
    })
  })

  test('rejects when an allocated invoice does not belong to the customer/org', async () => {
    Customer.findByPk.mockResolvedValue({ id: 'c' })
    Invoice.findAll.mockResolvedValue([]) // none match
    await expect(service.create({
      customerId: 'c', date: '2025-01-01', paymentMethod: 'cash',
      allocations: [{ invoiceId: 'inv-rogue', amount: 10 }],
    })).rejects.toEqual({ status: 400, message: 'One or more invoices not found or do not belong to this customer' })
  })
})

describe('receive-payment.confirm', () => {
  test('refuses anything other than draft', async () => {
    ReceivePayment.findByPk.mockResolvedValue({ id: 'rp', status: 'confirmed', lines: [] })
    await expect(service.confirm('rp', 'u'))
      .rejects.toEqual({ status: 400, message: 'Only draft payments can be confirmed' })
  })

  test('refuses when the period is closed', async () => {
    ReceivePayment.findByPk.mockResolvedValue({ id: 'rp', status: 'draft', date: '2025-01-01', organizationId: 'o', lines: [] })
    taxPeriod.assertOpen.mockRejectedValue({ status: 400, message: 'closed' })
    await expect(service.confirm('rp', 'u')).rejects.toEqual({ status: 400, message: 'closed' })
  })

  test('rolls back when auto-journal fails', async () => {
    const rp = {
      id: 'rp', status: 'draft', date: '2025-01-01', organizationId: 'o',
      lines: [{ invoiceId: 'inv1', amount: 50 }],
      update: jest.fn().mockResolvedValue(),
    }
    ReceivePayment.findByPk.mockResolvedValue(rp)
    taxPeriod.assertOpen.mockResolvedValue()
    Invoice.findByPk.mockResolvedValue({ id: 'inv1', total: 100, amountPaid: 0, status: 'sent', update: jest.fn().mockResolvedValue() })
    autoJournal.postReceivePayment.mockRejectedValue(new Error('boom'))

    await expect(service.confirm('rp', 'u')).rejects.toThrow('boom')
    // First flipped to confirmed, then rolled back to draft.
    expect(rp.update).toHaveBeenNthCalledWith(1, { status: 'confirmed', modifiedBy: 'u' })
    expect(rp.update).toHaveBeenNthCalledWith(2, { status: 'draft' })
  })

  test('happy path: applies allocations and marks invoice as paid when fully settled', async () => {
    const rp = {
      id: 'rp', status: 'draft', date: '2025-01-01', organizationId: 'o',
      lines: [{ invoiceId: 'inv1', amount: 100 }],
      update: jest.fn().mockResolvedValue(),
    }
    const inv = { id: 'inv1', total: 100, amountPaid: 0, status: 'sent', update: jest.fn().mockResolvedValue() }
    ReceivePayment.findByPk
      .mockResolvedValueOnce(rp)
      .mockResolvedValueOnce({ id: 'rp', status: 'confirmed', organizationId: 'o', customerId: 'c', refNo: 'RCP-1' })
      .mockResolvedValueOnce({ id: 'rp', status: 'confirmed', organizationId: 'o', customerId: 'c', refNo: 'RCP-1' })
    taxPeriod.assertOpen.mockResolvedValue()
    Invoice.findByPk.mockResolvedValue(inv)
    autoJournal.postReceivePayment.mockResolvedValue()

    await service.confirm('rp', 'u')
    const patch = inv.update.mock.calls[0][0]
    expect(patch.amountPaid).toBe(100)
    expect(patch.status).toBe('paid')
    expect(autoJournal.postReceivePayment).toHaveBeenCalled()
    expect(notifyCustomer).toHaveBeenCalledWith({
      organizationId: 'o',
      customerId: 'c',
      text: 'Payment RCP-1 has been received.',
    })
  })

  test('Customer notify failure does not reject confirm', async () => {
    const rp = {
      id: 'rp', status: 'draft', date: '2025-01-01', organizationId: 'o',
      lines: [{ invoiceId: 'inv1', amount: 100 }],
      update: jest.fn().mockResolvedValue(),
    }
    const inv = { id: 'inv1', total: 100, amountPaid: 0, status: 'sent', update: jest.fn().mockResolvedValue() }
    ReceivePayment.findByPk
      .mockResolvedValueOnce(rp)
      .mockResolvedValueOnce({ id: 'rp', status: 'confirmed', organizationId: 'o', customerId: 'c', refNo: 'RCP-1' })
      .mockResolvedValueOnce({ id: 'rp', status: 'confirmed', organizationId: 'o', customerId: 'c', refNo: 'RCP-1' })
    taxPeriod.assertOpen.mockResolvedValue()
    Invoice.findByPk.mockResolvedValue(inv)
    autoJournal.postReceivePayment.mockResolvedValue()
    notifyCustomer.mockRejectedValue(new Error('channel down'))

    await expect(service.confirm('rp', 'u')).resolves.toBeTruthy()
  })
})

describe('receive-payment.cancel', () => {
  test('refuses already-cancelled', async () => {
    ReceivePayment.findByPk.mockResolvedValue({ id: 'rp', status: 'cancelled', lines: [] })
    await expect(service.cancel('rp', 'u'))
      .rejects.toEqual({ status: 400, message: 'Receive Payment is already cancelled' })
  })

  test('cancelling a confirmed payment undoes allocations and reverses the journal', async () => {
    const rp = {
      id: 'rp', status: 'confirmed', date: '2025-01-01', organizationId: 'o',
      lines: [{ invoiceId: 'inv1', amount: 40 }],
      update: jest.fn().mockResolvedValue(),
    }
    const inv = { id: 'inv1', total: 100, amountPaid: 100, status: 'paid', update: jest.fn().mockResolvedValue() }
    ReceivePayment.findByPk
      .mockResolvedValueOnce(rp)
      .mockResolvedValueOnce({ id: 'rp', status: 'cancelled' })
    taxPeriod.assertOpen.mockResolvedValue()
    Invoice.findByPk.mockResolvedValue(inv)
    autoJournal.reverseReceivePayment.mockResolvedValue()

    await service.cancel('rp', 'u')
    const patch = inv.update.mock.calls[0][0]
    expect(patch.amountPaid).toBe(60) // 100 − 40
    expect(patch.status).toBe('sent')  // unsettled now (direction < 0)
    expect(autoJournal.reverseReceivePayment).toHaveBeenCalled()
  })
})
