// journal.service does its own work inside sequelize.transaction(); rather
// than mock that wholesale, we focus on the parts that can be exercised in
// isolation: list/getById queries, status-transition guards on post / void /
// remove, and the implicit balance-check that runs ahead of every mutation.

jest.mock('../../../../server/models', () => ({
  Journal:        { findAndCountAll: jest.fn(), findByPk: jest.fn(), create: jest.fn() },
  JournalLine:    { destroy: jest.fn(), create: jest.fn() },
  ChartOfAccount: {},
}))

jest.mock('../../../../server/config/database', () => ({
  transaction: jest.fn(),
}))

jest.mock('../services/tax-period.service', () => ({
  assertOpen: jest.fn(),
}))

jest.mock('../../settings/services/sequence.service', () => ({
  getNext: jest.fn(() => 'JE-1'),
}), { virtual: true })

const { Op } = require('sequelize')
const { Journal } = require('../../../../server/models')
const taxPeriod = require('../services/tax-period.service')
const service = require('../services/journal.service')

describe('journal.list', () => {
  test('paginates, scopes by org, excludes soft-deleted', async () => {
    Journal.findAndCountAll.mockResolvedValue({ count: 4, rows: [{ id: 'j1' }] })
    const out = await service.list({ page: 2, limit: 2, organizationId: 'o' })
    expect(out).toEqual({ total: 4, page: 2, limit: 2, journals: [{ id: 'j1' }] })

    const args = Journal.findAndCountAll.mock.calls[0][0]
    expect(args.offset).toBe(2)
    expect(args.where.organizationId).toBe('o')
    expect(args.where.dataFlag[Op.ne]).toBe(2)
    expect(args.distinct).toBe(true)
  })
})

describe('journal.getById', () => {
  test('throws 404 when missing', async () => {
    Journal.findByPk.mockResolvedValue(null)
    await expect(service.getById('missing')).rejects.toEqual({ status: 404, message: 'Journal not found' })
  })
})

describe('journal.post', () => {
  test('throws 404 when missing', async () => {
    Journal.findByPk.mockResolvedValue(null)
    await expect(service.post('missing', 'u')).rejects.toEqual({ status: 404, message: 'Journal not found' })
  })

  test('refuses to post anything other than a draft', async () => {
    Journal.findByPk.mockResolvedValue({ id: 'j', status: 'posted', lines: [] })
    await expect(service.post('j', 'u')).rejects.toEqual({ status: 400, message: 'Only draft journals can be posted' })
  })

  test('refuses to post into a closed period (assertOpen rejects)', async () => {
    Journal.findByPk.mockResolvedValue({
      id: 'j', status: 'draft', date: '2025-01-05',
      lines: [{ debit: 100, credit: 0 }, { debit: 0, credit: 100 }],
    })
    taxPeriod.assertOpen.mockRejectedValue({ status: 400, message: 'Period closed' })
    await expect(service.post('j', 'u')).rejects.toEqual({ status: 400, message: 'Period closed' })
  })

  test('refuses to post when the entry is unbalanced', async () => {
    const j = {
      id: 'j', status: 'draft', date: '2025-01-05',
      lines: [{ debit: 100, credit: 0 }, { debit: 0, credit: 50 }],
      update: jest.fn(),
    }
    Journal.findByPk.mockResolvedValue(j)
    taxPeriod.assertOpen.mockResolvedValue()
    await expect(service.post('j', 'u'))
      .rejects.toMatchObject({ status: 400, message: expect.stringContaining('not balanced') })
    expect(j.update).not.toHaveBeenCalled()
  })

  test('refuses to post a zero-amount entry', async () => {
    const j = {
      id: 'j', status: 'draft', date: '2025-01-05',
      lines: [{ debit: 0, credit: 0 }, { debit: 0, credit: 0 }],
      update: jest.fn(),
    }
    Journal.findByPk.mockResolvedValue(j)
    taxPeriod.assertOpen.mockResolvedValue()
    await expect(service.post('j', 'u'))
      .rejects.toEqual({ status: 400, message: 'Journal must have non-zero amounts' })
  })

  test('refuses to post with fewer than 2 lines', async () => {
    const j = {
      id: 'j', status: 'draft', date: '2025-01-05',
      lines: [{ debit: 100, credit: 0 }],
      update: jest.fn(),
    }
    Journal.findByPk.mockResolvedValue(j)
    taxPeriod.assertOpen.mockResolvedValue()
    await expect(service.post('j', 'u'))
      .rejects.toEqual({ status: 400, message: 'A journal entry requires at least 2 lines' })
  })

  test('happy path: balanced + open period → flips status to posted', async () => {
    const j = {
      id: 'j', status: 'draft', date: '2025-01-05',
      lines: [{ debit: 100, credit: 0 }, { debit: 0, credit: 100 }],
      update: jest.fn().mockResolvedValue(),
    }
    Journal.findByPk
      .mockResolvedValueOnce(j)
      // getById call at the end
      .mockResolvedValueOnce({ id: 'j', status: 'posted' })
    taxPeriod.assertOpen.mockResolvedValue()
    const out = await service.post('j', 'u')
    expect(j.update).toHaveBeenCalledWith({ status: 'posted', modifiedBy: 'u' })
    expect(out.status).toBe('posted')
  })
})

describe('journal.voidJournal / remove', () => {
  test('void refuses if already voided', async () => {
    Journal.findByPk.mockResolvedValue({ id: 'j', status: 'voided' })
    await expect(service.voidJournal('j', 'u')).rejects.toEqual({ status: 400, message: 'Journal is already voided' })
  })

  test('remove refuses anything other than a draft', async () => {
    Journal.findByPk.mockResolvedValue({ id: 'j', status: 'posted' })
    await expect(service.remove('j')).rejects.toEqual({ status: 400, message: 'Only draft journals can be deleted' })
  })

  test('remove destroys a draft', async () => {
    const j = { id: 'j', status: 'draft', destroy: jest.fn().mockResolvedValue() }
    Journal.findByPk.mockResolvedValue(j)
    await service.remove('j')
    expect(j.destroy).toHaveBeenCalled()
  })
})
