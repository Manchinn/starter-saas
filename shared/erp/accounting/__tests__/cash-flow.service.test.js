// Unit tests for cash-flow.service — direct-method classification.

jest.mock('../../../../server/models', () => ({
  JournalLine:    { findAll: jest.fn() },
  Journal:        {},
  ChartOfAccount: { findAll: jest.fn() },
}))

const { JournalLine, ChartOfAccount } = require('../../../../server/models')
const service = require('../services/cash-flow.service')

// Cash account
const CASH = { id: 'cash', code: '1110', name: 'Cash', accountType: 'asset', statementCategory: 'cash_and_equivalents' }

const line = (accountId, debit, credit, account, journal) => ({
  accountId, debit, credit, account, journal,
})

beforeEach(() => {
  jest.clearAllMocks()
  ChartOfAccount.findAll.mockResolvedValue([{ id: 'cash', code: '1110', name: 'Cash' }])
})

describe('sectionFor classification', () => {
  test('revenue/expense → operating', () => {
    expect(service.sectionFor({ accountType: 'revenue' })).toBe('operating')
    expect(service.sectionFor({ accountType: 'expense' })).toBe('operating')
  })
  test('fixed-asset → investing, other asset → operating', () => {
    expect(service.sectionFor({ accountType: 'asset', statementCategory: 'property_plant_equipment' })).toBe('investing')
    expect(service.sectionFor({ accountType: 'asset', statementCategory: 'trade_receivables' })).toBe('operating')
  })
  test('borrowings → financing, trade payable → operating; equity → financing', () => {
    expect(service.sectionFor({ accountType: 'liability', statementCategory: 'long_term_borrowings' })).toBe('financing')
    expect(service.sectionFor({ accountType: 'liability', statementCategory: 'trade_payables' })).toBe('operating')
    expect(service.sectionFor({ accountType: 'equity' })).toBe('financing')
  })
})

describe('getStatement', () => {
  test('classifies cash movements by the largest contra line and reconciles ending', async () => {
    const rev  = { code: '4110', name: 'Sales',     accountType: 'revenue',  statementCategory: 'revenue' }
    const ppe  = { code: '1210', name: 'Equipment', accountType: 'asset',    statementCategory: 'property_plant_equipment' }
    const loan = { code: '2210', name: 'Loan',      accountType: 'liability', statementCategory: 'long_term_borrowings' }
    // J1: cash receipt from sales (operating, +1000)
    const j1 = { id: 'j1', date: '2026-06-05', description: 'Sale', sourceType: 'Invoice' }
    // J2: bought equipment (investing, -500)
    const j2 = { id: 'j2', date: '2026-06-10', description: 'Buy PPE', sourceType: 'Journal' }
    // J3: took a loan (financing, +2000)
    const j3 = { id: 'j3', date: '2026-06-15', description: 'Loan', sourceType: 'Journal' }
    JournalLine.findAll.mockResolvedValue([
      line('cash', 1000, 0, CASH, j1), line('rev', 0, 1000, rev, j1),
      line('cash', 0, 500, CASH, j2), line('ppe', 500, 0, ppe, j2),
      line('cash', 2000, 0, CASH, j3), line('loan', 0, 2000, loan, j3),
    ])
    const r = await service.getStatement({ fromDate: '2026-06-01', toDate: '2026-06-30', organizationId: 'o' })
    expect(r.operating.amount).toBe(1000)
    expect(r.investing.amount).toBe(-500)
    expect(r.financing.amount).toBe(2000)
    expect(r.netChange).toBe(2500)
    expect(r.beginning).toBe(0)   // no prior lines mocked (fromDate query returns same mock → but filtered)
    // ending = beginning + netChange
    expect(r.ending).toBe(r.beginning + 2500)
  })

  test('ignores journals that do not touch cash', async () => {
    const ar  = { code: '1130', name: 'AR',    accountType: 'asset',   statementCategory: 'trade_receivables' }
    const rev = { code: '4110', name: 'Sales', accountType: 'revenue', statementCategory: 'revenue' }
    const j = { id: 'jx', date: '2026-06-05', description: 'Credit sale', sourceType: 'Invoice' }
    JournalLine.findAll.mockResolvedValue([
      line('ar', 1000, 0, ar, j), line('rev', 0, 1000, rev, j),
    ])
    const r = await service.getStatement({ fromDate: '2026-06-01', toDate: '2026-06-30', organizationId: 'o' })
    expect(r.netChange).toBe(0)
  })
})
