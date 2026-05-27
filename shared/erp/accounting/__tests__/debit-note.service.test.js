jest.mock('../../../../server/models', () => ({
  DebitNote: { findAndCountAll: jest.fn(), findByPk: jest.fn(), create: jest.fn() },
  Invoice:   { findAll: jest.fn() },
  Customer:  {},
}))

jest.mock('../services/tax-period.service', () => ({ assertOpen: jest.fn() }))
jest.mock('../services/auto-journal.service', () => ({
  postDebitNote: jest.fn(),
  reverseDebitNote: jest.fn(),
}))
jest.mock('../../settings/services/sequence.service', () => ({ getNext: jest.fn(() => 'DN-1') }), { virtual: true })

const { DebitNote } = require('../../../../server/models')
const taxPeriod = require('../services/tax-period.service')
const autoJournal = require('../services/auto-journal.service')
const service = require('../services/debit-note.service')

describe('debit-note.create', () => {
  test('rejects missing customer / date / reason / amount<=0', async () => {
    await expect(service.create({ date: '2025-01-01', reason: 'r', amount: 1 }))
      .rejects.toEqual({ status: 400, message: 'Customer is required' })
    await expect(service.create({ customerId: 'c', reason: 'r', amount: 1 }))
      .rejects.toEqual({ status: 400, message: 'Date is required' })
    await expect(service.create({ customerId: 'c', date: '2025-01-01', amount: 1 }))
      .rejects.toEqual({ status: 400, message: 'Reason is required' })
    await expect(service.create({ customerId: 'c', date: '2025-01-01', reason: 'r', amount: 0 }))
      .rejects.toEqual({ status: 400, message: 'Amount must be greater than 0' })
  })

  test('trims reason and persists amount as a Number', async () => {
    DebitNote.create.mockResolvedValue({ id: 'dn1' })
    DebitNote.findByPk.mockResolvedValue({ id: 'dn1' })
    await service.create({ customerId: 'c', date: '2025-01-01', reason: '  late fee  ', amount: '125.50' })
    const payload = DebitNote.create.mock.calls[0][0]
    expect(payload.reason).toBe('late fee')
    expect(payload.amount).toBe(125.5)
    expect(payload.status).toBeUndefined() // status comes from the model default
  })
})

describe('debit-note.issue', () => {
  test('refuses anything other than draft', async () => {
    DebitNote.findByPk.mockResolvedValue({ id: 'dn', status: 'issued' })
    await expect(service.issue('dn', 'u'))
      .rejects.toEqual({ status: 400, message: 'Only draft debit notes can be issued' })
  })

  test('refuses when the period is closed', async () => {
    DebitNote.findByPk.mockResolvedValue({ id: 'dn', status: 'draft', date: '2025-01-01', organizationId: 'o' })
    taxPeriod.assertOpen.mockRejectedValue({ status: 400, message: 'closed' })
    await expect(service.issue('dn', 'u')).rejects.toEqual({ status: 400, message: 'closed' })
  })

  test('rolls back status to draft if auto-journal fails', async () => {
    const dn = { id: 'dn', status: 'draft', date: '2025-01-01', organizationId: 'o', update: jest.fn().mockResolvedValue() }
    DebitNote.findByPk.mockResolvedValue(dn)
    taxPeriod.assertOpen.mockResolvedValue()
    autoJournal.postDebitNote.mockRejectedValue(new Error('boom'))

    await expect(service.issue('dn', 'u')).rejects.toThrow('boom')
    // first update flipped to issued; second one rolled back
    expect(dn.update).toHaveBeenNthCalledWith(1, { status: 'issued', modifiedBy: 'u' })
    expect(dn.update).toHaveBeenNthCalledWith(2, { status: 'draft' })
  })

  test('happy path: flips to issued and posts the GL journal', async () => {
    const dn = { id: 'dn', status: 'draft', date: '2025-01-01', organizationId: 'o', update: jest.fn().mockResolvedValue() }
    DebitNote.findByPk
      .mockResolvedValueOnce(dn)
      .mockResolvedValueOnce({ id: 'dn', status: 'issued' }) // getById call inside issue (passed to autoJournal)
      .mockResolvedValueOnce({ id: 'dn', status: 'issued' }) // final getById return
    taxPeriod.assertOpen.mockResolvedValue()
    autoJournal.postDebitNote.mockResolvedValue()
    const out = await service.issue('dn', 'u')
    expect(autoJournal.postDebitNote).toHaveBeenCalled()
    expect(out.status).toBe('issued')
  })
})

describe('debit-note.cancel', () => {
  test('refuses an already-cancelled row', async () => {
    DebitNote.findByPk.mockResolvedValue({ id: 'dn', status: 'cancelled' })
    await expect(service.cancel('dn', 'u'))
      .rejects.toEqual({ status: 400, message: 'Cannot cancel an already cancelled debit note' })
  })

  test('cancelling a draft is a pure status flip — no journal reversal', async () => {
    const dn = { id: 'dn', status: 'draft', date: '2025-01-01', organizationId: 'o', update: jest.fn().mockResolvedValue() }
    DebitNote.findByPk
      .mockResolvedValueOnce(dn)
      .mockResolvedValueOnce({ id: 'dn', status: 'cancelled' })
    await service.cancel('dn', 'u')
    expect(autoJournal.reverseDebitNote).not.toHaveBeenCalled()
  })

  test('cancelling an issued row triggers a reversal journal', async () => {
    const dn = { id: 'dn', status: 'issued', date: '2025-01-01', organizationId: 'o', update: jest.fn().mockResolvedValue() }
    DebitNote.findByPk
      .mockResolvedValueOnce(dn)
      .mockResolvedValueOnce({ id: 'dn', status: 'cancelled' })
    taxPeriod.assertOpen.mockResolvedValue()
    autoJournal.reverseDebitNote.mockResolvedValue()
    await service.cancel('dn', 'u')
    expect(autoJournal.reverseDebitNote).toHaveBeenCalled()
  })
})
