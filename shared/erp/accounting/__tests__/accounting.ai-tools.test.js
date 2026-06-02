// Unit tests for the Accounting AI tool handlers. Handlers lazily `require`
// their services, so we mock those module paths and drive each handler with a
// fake user ctx. Accounting tools are read-only — they return report data and a
// navigate action, and never mutate the ledger.
jest.mock('../services/chart-of-account.service', () => ({ list: jest.fn() }))
jest.mock('../services/journal.service', () => ({ list: jest.fn(), getById: jest.fn() }))
jest.mock('../services/trial-balance.service', () => ({ getReport: jest.fn() }))
jest.mock('../services/general-ledger.service', () => ({ getReport: jest.fn() }))
jest.mock('../services/financial-statements.service', () => ({ balanceSheet: jest.fn(), incomeStatement: jest.fn() }))
jest.mock('../services/ar-aging.service', () => ({ getReport: jest.fn() }))
jest.mock('../services/tax-period.service', () => ({ list: jest.fn(), getVatReport: jest.fn() }))

const coaSvc = require('../services/chart-of-account.service')
const journalSvc = require('../services/journal.service')
const trialBalanceSvc = require('../services/trial-balance.service')
const generalLedgerSvc = require('../services/general-ledger.service')
const fsSvc = require('../services/financial-statements.service')
const arAgingSvc = require('../services/ar-aging.service')
const taxPeriodSvc = require('../services/tax-period.service')

const { tools, navTargets } = require('../ai-tools')

const USER = { id: 'u1', organizationId: 'o1' }
const ctx = { user: USER }
const byName = Object.fromEntries(tools.map((t) => [t.name, t]))

beforeEach(() => jest.clearAllMocks())

describe('accounting ai-tools — registry', () => {
  test('exposes the read-only toolset', () => {
    expect(Object.keys(byName).sort()).toEqual([
      'ar_aging_report', 'balance_sheet', 'general_ledger_report', 'get_journal',
      'income_statement', 'list_accounts', 'list_journals', 'list_tax_periods',
      'trial_balance_report', 'vat_report',
    ])
  })

  test('every tool is a server tool with a handler', () => {
    for (const t of tools) {
      expect(t.kind).toBe('server')
      expect(typeof t.handler).toBe('function')
      expect(t.parameters.type).toBe('object')
    }
  })

  test('registers nav targets for accounting pages', () => {
    for (const key of ['chart_of_accounts', 'journals', 'trial_balance', 'general_ledger',
      'balance_sheet', 'income_statement', 'ar_aging', 'tax_periods', 'fiscal_years', 'vendor_bills']) {
      expect(navTargets).toHaveProperty(key)
    }
  })
})

describe('list_accounts', () => {
  test('scopes by org and slims rows', async () => {
    coaSvc.list.mockResolvedValue({ total: 1, accounts: [{ id: 'a1', code: '1010', name: 'Cash', accountType: 'asset', normalBalance: 'debit', status: 'active' }] })
    const { result, action } = await byName.list_accounts.handler({ search: 'cash' }, ctx)
    expect(coaSvc.list).toHaveBeenCalledWith(expect.objectContaining({ search: 'cash', organizationId: 'o1' }))
    expect(result.accounts[0]).toEqual({ code: '1010', name: 'Cash', accountType: 'asset', statementCategory: undefined, normalBalance: 'debit', status: 'active' })
    expect(action.target).toBe('chart_of_accounts')
  })
})

describe('get_journal', () => {
  test('resolves a ref number then loads full lines', async () => {
    journalSvc.list.mockResolvedValue({ journals: [{ id: 'j1', refNo: 'JE-1' }] })
    journalSvc.getById.mockResolvedValue({ id: 'j1', refNo: 'JE-1', date: '2026-01-01', status: 'posted', totalDebit: 100, lines: [{ lineNo: 1, account: { code: '1010', name: 'Cash' }, debit: 100, credit: 0 }] })
    const { result } = await byName.get_journal.handler({ search: 'JE-1' }, ctx)
    expect(journalSvc.getById).toHaveBeenCalledWith('j1')
    expect(result.lines).toHaveLength(1)
    expect(result.lines[0].account).toBe('1010 Cash')
  })

  test('returns a helpful message when no match', async () => {
    journalSvc.list.mockResolvedValue({ journals: [] })
    const { result } = await byName.get_journal.handler({ search: 'nope' }, ctx)
    expect(result).toMatch(/No journal entry matches/)
    expect(journalSvc.getById).not.toHaveBeenCalled()
  })
})

describe('trial_balance_report', () => {
  test('delegates with org scope and returns the report', async () => {
    const report = { asOfDate: '2026-01-31', rows: [], totals: { debit: 0, credit: 0 } }
    trialBalanceSvc.getReport.mockResolvedValue(report)
    const { result, action } = await byName.trial_balance_report.handler({ asOfDate: '2026-01-31' }, ctx)
    expect(trialBalanceSvc.getReport).toHaveBeenCalledWith({ asOfDate: '2026-01-31', includeZero: false, organizationId: 'o1' })
    expect(result).toBe(report)
    expect(action.target).toBe('trial_balance')
  })
})

describe('general_ledger_report', () => {
  test('resolves the account then runs the ledger', async () => {
    coaSvc.list.mockResolvedValue({ accounts: [{ id: 'a1', code: '1010', name: 'Cash' }] })
    const report = { account: { code: '1010' }, entries: [], opening: 0, closing: 0 }
    generalLedgerSvc.getReport.mockResolvedValue(report)
    const { result } = await byName.general_ledger_report.handler({ account: '1010', fromDate: '2026-01-01' }, ctx)
    expect(generalLedgerSvc.getReport).toHaveBeenCalledWith(expect.objectContaining({ accountId: 'a1', fromDate: '2026-01-01', organizationId: 'o1' }))
    expect(result).toBe(report)
  })

  test('surfaces an ambiguous-account error without running the report', async () => {
    coaSvc.list.mockResolvedValue({ accounts: [{ id: 'a1', code: '1010', name: 'Cash on hand' }, { id: 'a2', code: '1011', name: 'Cash at bank' }] })
    const { result } = await byName.general_ledger_report.handler({ account: 'cash' }, ctx)
    expect(result).toMatch(/Multiple accounts match/)
    expect(generalLedgerSvc.getReport).not.toHaveBeenCalled()
  })
})

describe('income_statement', () => {
  test('requires both dates', async () => {
    const { result } = await byName.income_statement.handler({ fromDate: '2026-01-01' }, ctx)
    expect(result).toMatch(/start.*and.*end/i)
    expect(fsSvc.incomeStatement).not.toHaveBeenCalled()
  })

  test('runs the statement for the period', async () => {
    fsSvc.incomeStatement.mockResolvedValue({ netProfit: 500 })
    const { result, action } = await byName.income_statement.handler({ fromDate: '2026-01-01', toDate: '2026-01-31' }, ctx)
    expect(fsSvc.incomeStatement).toHaveBeenCalledWith({ fromDate: '2026-01-01', toDate: '2026-01-31', organizationId: 'o1' })
    expect(result.netProfit).toBe(500)
    expect(action.target).toBe('income_statement')
  })
})

describe('ar_aging_report', () => {
  test('trims per-invoice detail to per-customer summaries', async () => {
    arAgingSvc.getReport.mockResolvedValue({
      asOfDate: '2026-01-31',
      summary: { total: 100 },
      customers: [{ customer: { name: 'Acme', company: 'Acme Co' }, invoices: [{ id: 'i1' }], summary: { total: 100 } }],
    })
    const { result } = await byName.ar_aging_report.handler({}, ctx)
    expect(result.customers[0]).toEqual({ customer: 'Acme', company: 'Acme Co', summary: { total: 100 } })
    expect(result.customers[0].invoices).toBeUndefined()
  })
})

describe('vat_report', () => {
  test('resolves the period by name then reports net payable', async () => {
    taxPeriodSvc.list.mockResolvedValue([{ id: 'p1', name: 'Jan 2026', startDate: '2026-01-01', endDate: '2026-01-31', status: 'open' }])
    taxPeriodSvc.getVatReport.mockResolvedValue({
      period: { id: 'p1', name: 'Jan 2026', startDate: '2026-01-01', endDate: '2026-01-31', status: 'open' },
      outputTax: { total: 70 }, inputTax: { total: 20 }, netPayable: 50,
    })
    const { result } = await byName.vat_report.handler({ period: 'Jan' }, ctx)
    expect(taxPeriodSvc.getVatReport).toHaveBeenCalledWith('p1', 'o1')
    expect(result.netPayable).toBe(50)
    expect(result.outputTax).toBe(70)
  })
})
