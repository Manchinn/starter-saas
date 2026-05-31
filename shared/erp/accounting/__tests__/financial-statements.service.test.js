jest.mock('../../../../server/models', () => ({
  JournalLine:    { findAll: jest.fn() },
  Journal:        {},
  ChartOfAccount: {},
  FiscalYear:     { findOne: jest.fn() },
}))

const { JournalLine, FiscalYear } = require('../../../../server/models')
const service = require('../services/financial-statements.service')

// A posted journal line as returned by the eager-loaded query.
function ln({ code, name = code, type, cat, nb, debit = 0, credit = 0 }) {
  return { debit, credit, account: { id: code, code, name, accountType: type, statementCategory: cat, normalBalance: nb } }
}

describe('financial-statements.balanceSheetSnapshot', () => {
  test('assets = liabilities + equity, with current-year profit folded into equity', async () => {
    FiscalYear.findOne.mockResolvedValue(null) // no fiscal year ⇒ all net income is profit-for-year
    JournalLine.findAll.mockResolvedValue([
      ln({ code: '1110', name: 'Cash', type: 'asset', cat: 'cash_and_equivalents', nb: 'debit', debit: 1500, credit: 200 }), // 1300
      ln({ code: '3110', name: 'Capital', type: 'equity', cat: 'owners_capital', nb: 'credit', credit: 1000 }),               // 1000
      ln({ code: '4110', name: 'Sales', type: 'revenue', cat: 'revenue', nb: 'credit', credit: 500 }),                        // 500
      ln({ code: '5110', name: 'COGS', type: 'expense', cat: 'cost_of_sales', nb: 'debit', debit: 200 }),                     // 200
    ])

    const bs = await service.balanceSheetSnapshot({ asOfDate: '2026-12-31', organizationId: 'o' })
    expect(bs.assets.total).toBe(1300)
    expect(bs.liabilities.total).toBe(0)
    expect(bs.equity.ownersCapital).toBe(1000)
    expect(bs.equity.retainedEarnings).toBe(0)
    expect(bs.equity.profitForYear).toBe(300) // 500 revenue - 200 cogs
    expect(bs.equity.total).toBe(1300)
    expect(bs.liabilitiesAndEquity).toBe(1300)
    expect(bs.balanced).toBe(true)
    expect(bs.assets.current.subtotal).toBe(1300)
  })

  test('contra accounts reduce their section (accumulated depreciation, owner drawings)', async () => {
    FiscalYear.findOne.mockResolvedValue(null)
    JournalLine.findAll.mockResolvedValue([
      ln({ code: '1210', name: 'Equipment', type: 'asset', cat: 'property_plant_equipment', nb: 'debit', debit: 1000 }),
      ln({ code: '1220', name: 'Accum. Deprec.', type: 'asset', cat: 'property_plant_equipment', nb: 'credit', credit: 300 }), // contra ⇒ -300
      ln({ code: '3110', name: 'Capital', type: 'equity', cat: 'owners_capital', nb: 'credit', credit: 1000 }),
      ln({ code: '3140', name: 'Drawings', type: 'equity', cat: 'owners_capital', nb: 'debit', debit: 250 }),                  // contra ⇒ -250
    ])
    const bs = await service.balanceSheetSnapshot({ asOfDate: '2026-12-31', organizationId: 'o' })
    expect(bs.assets.nonCurrent.subtotal).toBe(700)  // 1000 - 300
    expect(bs.assets.total).toBe(700)
    expect(bs.equity.ownersCapital).toBe(750)        // 1000 - 250
  })

  test('splits profit-for-year from prior retained earnings using the fiscal year', async () => {
    FiscalYear.findOne.mockResolvedValue({ startDate: '2026-01-01', endDate: '2026-12-31' })
    // 1st call: all-time. 2nd call: current fiscal-year revenue/expense only.
    JournalLine.findAll
      .mockResolvedValueOnce([
        ln({ code: '1110', type: 'asset', cat: 'cash_and_equivalents', nb: 'debit', debit: 1000 }),
        ln({ code: '3120', type: 'equity', cat: 'retained_earnings', nb: 'credit', credit: 400 }),
        ln({ code: '4110', type: 'revenue', cat: 'revenue', nb: 'credit', credit: 600 }), // all-time net income 600
      ])
      .mockResolvedValueOnce([
        ln({ code: '4110', type: 'revenue', cat: 'revenue', nb: 'credit', credit: 250 }), // current FY profit 250
      ])
    const bs = await service.balanceSheetSnapshot({ asOfDate: '2026-06-30', organizationId: 'o' })
    expect(bs.equity.profitForYear).toBe(250)
    expect(bs.equity.retainedEarnings).toBe(750) // posted 400 + prior accumulated (600 - 250)
    expect(bs.equity.total).toBe(1000)
  })
})

describe('financial-statements.incomeStatementForPeriod', () => {
  test('computes the by-function waterfall down to net profit', async () => {
    JournalLine.findAll.mockResolvedValue([
      ln({ code: '4110', type: 'revenue', cat: 'revenue', nb: 'credit', credit: 1000 }),
      ln({ code: '5110', type: 'expense', cat: 'cost_of_sales', nb: 'debit', debit: 400 }),
      ln({ code: '4210', type: 'revenue', cat: 'other_income', nb: 'credit', credit: 50 }),
      ln({ code: '5210', type: 'expense', cat: 'selling_admin_expenses', nb: 'debit', debit: 200 }),
      ln({ code: '5900', type: 'expense', cat: 'other_expenses', nb: 'debit', debit: 30 }),
      ln({ code: '5310', type: 'expense', cat: 'finance_costs', nb: 'debit', debit: 20 }),
      ln({ code: '5400', type: 'expense', cat: 'income_tax_expense', nb: 'debit', debit: 25 }),
    ])
    const is = await service.incomeStatementForPeriod({ fromDate: '2026-01-01', toDate: '2026-12-31', organizationId: 'o' })
    expect(is.revenue).toBe(1000)
    expect(is.grossProfit).toBe(600)                 // 1000 - 400
    expect(is.profitBeforeFinanceTax).toBe(420)      // 600 + 50 - 200 - 30
    expect(is.profitBeforeTax).toBe(400)             // 420 - 20
    expect(is.netProfit).toBe(375)                   // 400 - 25
  })
})

describe('financial-statements.changesInEquityForPeriod', () => {
  test('closing = opening + contributions - drawings + profit', async () => {
    // opening (empty) → closing (full) → period (full)
    const closingLines = [
      ln({ code: '3110', type: 'equity', cat: 'owners_capital', nb: 'credit', credit: 1000 }),
      ln({ code: '3140', type: 'equity', cat: 'owners_capital', nb: 'debit', debit: 100 }),
      ln({ code: '4110', type: 'revenue', cat: 'revenue', nb: 'credit', credit: 500 }),
      ln({ code: '5110', type: 'expense', cat: 'cost_of_sales', nb: 'debit', debit: 200 }),
    ]
    JournalLine.findAll
      .mockResolvedValueOnce([])           // opening (day before fromDate)
      .mockResolvedValueOnce(closingLines) // closing (toDate)
      .mockResolvedValueOnce(closingLines) // period movements
    const ce = await service.changesInEquityForPeriod({ fromDate: '2026-01-01', toDate: '2026-12-31', organizationId: 'o' })
    expect(ce.total.opening).toBe(0)
    expect(ce.contributions).toBe(1000)
    expect(ce.drawings).toBe(100)
    expect(ce.profitForPeriod).toBe(300) // 500 - 200
    expect(ce.total.closing).toBe(1200)  // 1000 - 100 + 300
    expect(ce.total.closing).toBe(ce.total.opening + ce.contributions - ce.drawings + ce.profitForPeriod)
  })
})

describe('financial-statements.categoryTotals', () => {
  test('only posted journals, scoped by org, within the date range', async () => {
    JournalLine.findAll.mockResolvedValue([])
    await service.categoryTotals({ organizationId: 'org-7', from: '2026-01-01', to: '2026-03-31' })
    const args = JournalLine.findAll.mock.calls[0][0]
    expect(args.where.organizationId).toBe('org-7')
    const journalInclude = args.include.find((i) => i.as === 'journal')
    expect(journalInclude.where.status).toBe('posted')
    expect(journalInclude.required).toBe(true)
    const { Op } = require('sequelize')
    expect(journalInclude.where.date[Op.gte]).toBe('2026-01-01')
    expect(journalInclude.where.date[Op.lte]).toBe('2026-03-31')
  })
})
