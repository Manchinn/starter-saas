jest.mock('../../../../server/models', () => ({
  CreditNote: { findAndCountAll: jest.fn(), findByPk: jest.fn(), create: jest.fn() },
  Invoice:    { findByPk: jest.fn(), findAll: jest.fn() },
  Customer:   {},
}))

jest.mock('../services/tax-period.service', () => ({ assertOpen: jest.fn() }))
jest.mock('../services/auto-journal.service', () => ({
  postCreditNote: jest.fn(),
  reverseCreditNote: jest.fn(),
}))
jest.mock('../../settings/services/sequence.service', () => ({ getNext: jest.fn(() => 'CN-1') }), { virtual: true })

const { CreditNote, Invoice } = require('../../../../server/models')
const taxPeriod = require('../services/tax-period.service')
const autoJournal = require('../services/auto-journal.service')
const service = require('../services/credit-note.service')

describe('credit-note.create', () => {
  test('validation: customer / date / reason / positive amount', async () => {
    await expect(service.create({ date: '2025-01-01', reason: 'r', amount: 1 }))
      .rejects.toEqual({ status: 400, message: 'Customer is required' })
    await expect(service.create({ customerId: 'c', date: '2025-01-01', reason: 'r', amount: -10 }))
      .rejects.toEqual({ status: 400, message: 'Amount must be greater than 0' })
  })
})

describe('credit-note.issue', () => {
  test('refuses when the CN amount exceeds the invoice outstanding balance', async () => {
    const cn = { id: 'cn', status: 'draft', date: '2025-01-01', organizationId: 'o', invoiceId: 'inv', amount: 100, update: jest.fn().mockResolvedValue() }
    CreditNote.findByPk.mockResolvedValue(cn)
    taxPeriod.assertOpen.mockResolvedValue()
    // Invoice has 30 outstanding (100 total − 70 paid). CN of 100 must reject.
    Invoice.findByPk.mockResolvedValue({ id: 'inv', total: 100, amountPaid: 70, update: jest.fn() })

    await expect(service.issue('cn', 'u')).rejects.toMatchObject({
      status: 400,
      message: expect.stringContaining('exceeds invoice outstanding balance'),
    })
    // status was first flipped to issued then rolled back to draft
    expect(cn.update).toHaveBeenNthCalledWith(1, { status: 'issued', modifiedBy: 'u' })
    expect(cn.update).toHaveBeenNthCalledWith(2, { status: 'draft' })
    expect(autoJournal.postCreditNote).not.toHaveBeenCalled()
  })

  test('happy path: bumps amountPaid and flips invoice → paid when fully settled', async () => {
    const cn = { id: 'cn', status: 'draft', date: '2025-01-01', organizationId: 'o', invoiceId: 'inv', amount: 30, update: jest.fn().mockResolvedValue() }
    const inv = { id: 'inv', total: 100, amountPaid: 70, status: 'sent', update: jest.fn().mockResolvedValue() }
    CreditNote.findByPk
      .mockResolvedValueOnce(cn)
      .mockResolvedValueOnce({ id: 'cn', status: 'issued' })
      .mockResolvedValueOnce({ id: 'cn', status: 'issued' })
    taxPeriod.assertOpen.mockResolvedValue()
    Invoice.findByPk.mockResolvedValue(inv)
    autoJournal.postCreditNote.mockResolvedValue()

    await service.issue('cn', 'u')
    const patch = inv.update.mock.calls[0][0]
    expect(patch.amountPaid).toBe(100)
    expect(patch.status).toBe('paid')  // 70 + 30 ≥ 100 → fully settled
    expect(autoJournal.postCreditNote).toHaveBeenCalled()
  })

  test('partial settlement keeps the invoice as sent', async () => {
    const cn = { id: 'cn', status: 'draft', date: '2025-01-01', organizationId: 'o', invoiceId: 'inv', amount: 20, update: jest.fn().mockResolvedValue() }
    const inv = { id: 'inv', total: 100, amountPaid: 70, status: 'sent', update: jest.fn().mockResolvedValue() }
    CreditNote.findByPk
      .mockResolvedValueOnce(cn)
      .mockResolvedValueOnce({ id: 'cn' })
      .mockResolvedValueOnce({ id: 'cn' })
    taxPeriod.assertOpen.mockResolvedValue()
    Invoice.findByPk.mockResolvedValue(inv)
    autoJournal.postCreditNote.mockResolvedValue()

    await service.issue('cn', 'u')
    const patch = inv.update.mock.calls[0][0]
    expect(patch.amountPaid).toBe(90)
    expect(patch.status).toBe('sent') // 90 < 100 → still outstanding
  })

  test('CN without a linked invoice still posts the GL journal (AR contra only)', async () => {
    const cn = { id: 'cn', status: 'draft', date: '2025-01-01', organizationId: 'o', invoiceId: null, amount: 50, update: jest.fn().mockResolvedValue() }
    CreditNote.findByPk
      .mockResolvedValueOnce(cn)
      .mockResolvedValueOnce({ id: 'cn' })
      .mockResolvedValueOnce({ id: 'cn' })
    taxPeriod.assertOpen.mockResolvedValue()
    autoJournal.postCreditNote.mockResolvedValue()
    await service.issue('cn', 'u')
    expect(Invoice.findByPk).not.toHaveBeenCalled()
    expect(autoJournal.postCreditNote).toHaveBeenCalled()
  })
})

describe('credit-note.cancel', () => {
  test('cancelling an issued CN reverts amountPaid on the linked invoice', async () => {
    const cn = { id: 'cn', status: 'issued', date: '2025-01-01', organizationId: 'o', invoiceId: 'inv', amount: 30, update: jest.fn().mockResolvedValue() }
    const inv = { id: 'inv', total: 100, amountPaid: 100, status: 'paid', update: jest.fn().mockResolvedValue() }
    CreditNote.findByPk
      .mockResolvedValueOnce(cn)
      .mockResolvedValueOnce({ id: 'cn', status: 'cancelled' })
    taxPeriod.assertOpen.mockResolvedValue()
    Invoice.findByPk.mockResolvedValue(inv)
    autoJournal.reverseCreditNote.mockResolvedValue()

    await service.cancel('cn', 'u')
    // 100 − 30 = 70 paid; status reverts to sent (direction < 0)
    const patch = inv.update.mock.calls[0][0]
    expect(patch.amountPaid).toBe(70)
    expect(patch.status).toBe('sent')
    expect(autoJournal.reverseCreditNote).toHaveBeenCalled()
  })
})
