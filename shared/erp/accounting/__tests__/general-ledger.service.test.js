jest.mock('../../../../server/models', () => ({
  JournalLine:    { findAll: jest.fn() },
  Journal:        {},
  ChartOfAccount: {},
}))
jest.mock('../../../../server/core/tenant', () => ({
  findByPkScoped: jest.fn(),
}))

const { JournalLine } = require('../../../../server/models')
const { findByPkScoped } = require('../../../../server/core/tenant')
const service = require('../services/general-ledger.service')

const cashAccount = { id: 'cash', code: '1110', name: 'Cash', accountType: 'asset', statementCategory: 'cash_and_equivalents', normalBalance: 'debit' }

function periodLine({ refNo, date, debit = 0, credit = 0, description = null }) {
  return { debit, credit, description, journal: { id: `j-${refNo}`, refNo, date, description: null } }
}

describe('general-ledger.getReport', () => {
  test('requires an accountId', async () => {
    await expect(service.getReport({})).rejects.toEqual({ status: 400, message: 'accountId is required' })
  })

  test('throws 404 when the account is missing', async () => {
    findByPkScoped.mockResolvedValue(null)
    await expect(service.getReport({ accountId: 'nope' })).rejects.toEqual({ status: 404, message: 'Account not found' })
  })

  test('brings forward an opening balance and runs the balance through period entries', async () => {
    findByPkScoped.mockResolvedValue(cashAccount)
    // opening (before fromDate): net +100
    JournalLine.findAll.mockResolvedValueOnce([periodLine({ refNo: 'JE-0', date: '2026-01-10', debit: 100 })])
    // period entries
    JournalLine.findAll.mockResolvedValueOnce([
      periodLine({ refNo: 'JE-1', date: '2026-02-05', debit: 50 }),
      periodLine({ refNo: 'JE-2', date: '2026-02-20', credit: 30 }),
    ])

    const out = await service.getReport({ accountId: 'cash', fromDate: '2026-02-01', toDate: '2026-02-28', organizationId: 'o' })

    expect(out.opening).toBe(100)
    expect(out.entries.map(e => e.balance)).toEqual([150, 120])
    expect(out.closing).toBe(120)
    expect(out.totals).toEqual({ debit: 50, credit: 30 })
    // closing === opening + (debit - credit)
    expect(out.closing).toBe(out.opening + out.totals.debit - out.totals.credit)
  })

  test('opening is zero when no fromDate is given (single query)', async () => {
    findByPkScoped.mockResolvedValue(cashAccount)
    JournalLine.findAll.mockResolvedValueOnce([periodLine({ refNo: 'JE-1', date: '2026-02-05', debit: 75 })])

    const out = await service.getReport({ accountId: 'cash' })
    expect(out.opening).toBe(0)
    expect(out.closing).toBe(75)
    expect(JournalLine.findAll).toHaveBeenCalledTimes(1) // no opening query without a fromDate
  })

  test('entries are ordered by journal date then refNo', async () => {
    findByPkScoped.mockResolvedValue(cashAccount)
    JournalLine.findAll.mockResolvedValueOnce([
      periodLine({ refNo: 'JE-9', date: '2026-02-20', debit: 5 }),
      periodLine({ refNo: 'JE-1', date: '2026-02-05', debit: 5 }),
      periodLine({ refNo: 'JE-5', date: '2026-02-05', debit: 5 }),
    ])
    const out = await service.getReport({ accountId: 'cash' })
    expect(out.entries.map(e => e.refNo)).toEqual(['JE-1', 'JE-5', 'JE-9'])
  })
})
