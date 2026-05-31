jest.mock('../../../../server/models', () => ({
  JournalLine:    { findAll: jest.fn() },
  Journal:        {},
  ChartOfAccount: {},
}))

const { JournalLine } = require('../../../../server/models')
const service = require('../services/trial-balance.service')

// A journal line as returned by the service's eager-loaded query.
function line({ accountId = 'a1', code = '1110', name = 'Cash', accountType = 'asset', normalBalance = 'debit', statementCategory = 'cash_and_equivalents', debit = 0, credit = 0 }) {
  return { debit, credit, account: { id: accountId, code, name, accountType, normalBalance, statementCategory } }
}

describe('trial-balance.getReport', () => {
  test('aggregates per account and ties out (total debit === total credit)', async () => {
    JournalLine.findAll.mockResolvedValue([
      // Cash (debit-normal): net debit 100
      line({ accountId: 'cash', code: '1110', name: 'Cash', normalBalance: 'debit', debit: 150, credit: 50 }),
      // Sales (credit-normal): net credit 100
      line({ accountId: 'sales', code: '4110', name: 'Sales', accountType: 'revenue', normalBalance: 'credit', statementCategory: 'revenue', debit: 0, credit: 100 }),
    ])
    const out = await service.getReport({ asOfDate: '2026-05-31', organizationId: 'o' })

    const cash = out.rows.find(r => r.code === '1110')
    const sales = out.rows.find(r => r.code === '4110')
    expect(cash.debit).toBe(100)
    expect(cash.credit).toBe(0)
    expect(sales.credit).toBe(100)
    expect(sales.debit).toBe(0)
    expect(out.totals.debit).toBe(100)
    expect(out.totals.credit).toBe(100)
  })

  test('places a debit-normal account with a net credit balance in the credit column', async () => {
    JournalLine.findAll.mockResolvedValue([
      line({ accountId: 'cash', code: '1110', normalBalance: 'debit', debit: 30, credit: 80 }), // net -50
    ])
    const out = await service.getReport({})
    const cash = out.rows.find(r => r.code === '1110')
    expect(cash.debit).toBe(0)
    expect(cash.credit).toBe(50)
  })

  test('drops zero-balance accounts unless includeZero is set', async () => {
    const zero = [line({ accountId: 'cash', code: '1110', normalBalance: 'debit', debit: 40, credit: 40 })]
    JournalLine.findAll.mockResolvedValueOnce(zero)
    const hidden = await service.getReport({})
    expect(hidden.rows).toHaveLength(0)

    JournalLine.findAll.mockResolvedValueOnce(zero)
    const shown = await service.getReport({ includeZero: true })
    expect(shown.rows).toHaveLength(1)
    expect(shown.rows[0].debit).toBe(0)
    expect(shown.rows[0].credit).toBe(0)
  })

  test('only considers posted journals on or before asOfDate, scoped by org', async () => {
    JournalLine.findAll.mockResolvedValue([])
    await service.getReport({ asOfDate: '2026-03-31', organizationId: 'org-9' })
    const args = JournalLine.findAll.mock.calls[0][0]
    expect(args.where.organizationId).toBe('org-9')
    const journalInclude = args.include.find(i => i.as === 'journal')
    expect(journalInclude.where.status).toBe('posted')
    expect(journalInclude.required).toBe(true)
    // date cut-off uses Op.lte on the journal date
    const { Op } = require('sequelize')
    expect(journalInclude.where.date[Op.lte]).toBe('2026-03-31')
  })

  test('rows are sorted by account code', async () => {
    JournalLine.findAll.mockResolvedValue([
      line({ accountId: 'b', code: '5110', name: 'COGS', accountType: 'expense', normalBalance: 'debit', statementCategory: 'cost_of_sales', debit: 10 }),
      line({ accountId: 'a', code: '1110', name: 'Cash', normalBalance: 'debit', debit: 10 }),
    ])
    const out = await service.getReport({})
    expect(out.rows.map(r => r.code)).toEqual(['1110', '5110'])
  })
})
