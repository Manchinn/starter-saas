// billing-note has a transaction-wrapped create() that's brittle to mock. We
// focus on the read paths and status-transition guards which carry real
// business rules.

jest.mock('../../../../server/models', () => ({
  BillingNote:        { findAndCountAll: jest.fn(), findByPk: jest.fn(), create: jest.fn() },
  BillingNoteInvoice: { findAll: jest.fn(), create: jest.fn() },
  Invoice:            { findByPk: jest.fn(), findAll: jest.fn() },
  Customer:           {},
}))

jest.mock('../../../../server/config/database', () => ({ transaction: jest.fn() }))

jest.mock('../../settings/services/sequence.service', () => ({ getNext: jest.fn(() => 'BN-1') }), { virtual: true })

const { Op } = require('sequelize')
const { BillingNote, BillingNoteInvoice, Invoice } = require('../../../../server/models')
const service = require('../services/billing-note.service')

describe('billing-note.getById', () => {
  test('throws 404 when missing', async () => {
    BillingNote.findByPk.mockResolvedValue(null)
    await expect(service.getById('missing')).rejects.toEqual({ status: 404, message: 'Billing Note not found' })
  })
})

describe('billing-note.availableInvoices', () => {
  test('excludes invoices already on an active billing note for the same org', async () => {
    BillingNoteInvoice.findAll.mockResolvedValue([{ invoiceId: 'inv-1' }, { invoiceId: 'inv-2' }])
    Invoice.findAll.mockResolvedValue([])
    await service.availableInvoices({ customerId: 'c1', organizationId: 'o' })
    const where = Invoice.findAll.mock.calls[0][0].where
    expect(where.customerId).toBe('c1')
    expect(where.status[Op.in]).toEqual(['draft', 'sent'])
    expect(where.id[Op.notIn]).toEqual(['inv-1', 'inv-2'])
  })

  test('omits the id-notIn filter when no invoices are linked', async () => {
    BillingNoteInvoice.findAll.mockResolvedValue([])
    Invoice.findAll.mockResolvedValue([])
    await service.availableInvoices({ customerId: 'c1', organizationId: 'o' })
    expect(Invoice.findAll.mock.calls[0][0].where).not.toHaveProperty('id')
  })
})

describe('billing-note.send', () => {
  test('refuses anything other than draft', async () => {
    BillingNote.findByPk.mockResolvedValue({ id: 'bn', status: 'sent' })
    await expect(service.send('bn', 'u')).rejects.toEqual({ status: 400, message: 'Only draft billing notes can be sent' })
  })

  test('happy path: draft → sent', async () => {
    const bn = { id: 'bn', status: 'draft', update: jest.fn().mockResolvedValue() }
    BillingNote.findByPk
      .mockResolvedValueOnce(bn)
      .mockResolvedValueOnce({ id: 'bn', status: 'sent' })
    const out = await service.send('bn', 'u')
    expect(bn.update).toHaveBeenCalledWith({ status: 'sent', modifiedBy: 'u' })
    expect(out.status).toBe('sent')
  })
})

describe('billing-note.markPaid', () => {
  test('flips every linked invoice from sent → paid when the BN is marked paid', async () => {
    const bn = {
      id: 'bn', status: 'sent',
      lines: [{ invoiceId: 'inv-1' }, { invoiceId: 'inv-2' }],
      update: jest.fn().mockResolvedValue(),
    }
    // Transaction passthrough — the service calls bn.update + per-line updates
    // INSIDE sequelize.transaction(); here we just simulate the transaction by
    // running the callback inline.
    require('../../../../server/config/database').transaction.mockImplementation(async (cb) => cb('tx'))
    const tx = require('../../../../server/config/database').transaction
    // markPaid uses an explicit t = await sequelize.transaction(); reproduce that shape.
    tx.mockImplementation(async () => ({ commit: jest.fn().mockResolvedValue(), rollback: jest.fn().mockResolvedValue() }))

    const inv1 = { id: 'inv-1', status: 'sent', update: jest.fn().mockResolvedValue() }
    const inv2 = { id: 'inv-2', status: 'paid', update: jest.fn().mockResolvedValue() }
    Invoice.findByPk
      .mockResolvedValueOnce(inv1)
      .mockResolvedValueOnce(inv2)
    BillingNote.findByPk
      .mockResolvedValueOnce(bn)
      .mockResolvedValueOnce({ id: 'bn', status: 'paid' })

    const out = await service.markPaid('bn', 'u')
    expect(bn.update).toHaveBeenCalled()
    expect(inv1.update).toHaveBeenCalledWith({ status: 'paid' }, expect.any(Object))
    expect(inv2.update).not.toHaveBeenCalled() // already paid — no-op
    expect(out.status).toBe('paid')
  })

  test('refuses to mark anything other than sent as paid', async () => {
    BillingNote.findByPk.mockResolvedValue({ id: 'bn', status: 'draft' })
    await expect(service.markPaid('bn', 'u'))
      .rejects.toEqual({ status: 400, message: 'Only sent billing notes can be marked as paid' })
  })
})

describe('billing-note.cancel / remove', () => {
  test('cancel refuses paid or already-cancelled rows', async () => {
    BillingNote.findByPk.mockResolvedValue({ id: 'bn', status: 'paid' })
    await expect(service.cancel('bn', 'u'))
      .rejects.toEqual({ status: 400, message: 'Cannot cancel a paid or already cancelled billing note' })
  })

  test('remove refuses anything other than draft', async () => {
    BillingNote.findByPk.mockResolvedValue({ id: 'bn', status: 'sent' })
    await expect(service.remove('bn'))
      .rejects.toEqual({ status: 400, message: 'Only draft billing notes can be deleted' })
  })
})
