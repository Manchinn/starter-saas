// Navigation-only AI targets for accounting documents that don't (yet) expose
// server tools: fiscal years and the billing-document registers (billing /
// credit / debit notes, receive payments) plus vendor bills. This lets the
// `navigate` tool open these pages on request without adding data tools.

const navTargets = {
  fiscal_years:       { path: '/erp/accounting/fiscal-years',        label: 'Fiscal Years' },
  fiscal_year_create: { path: '/erp/accounting/fiscal-years/create', label: 'New Fiscal Year' },
  vendor_bills:       { path: '/erp/purchasing/bills',               label: 'Vendor Bills' },
  billing_notes:      { path: '/erp/billing/billing-notes',          label: 'Billing Notes' },
  credit_notes:       { path: '/erp/billing/credit-notes',           label: 'Credit Notes' },
  debit_notes:        { path: '/erp/billing/debit-notes',            label: 'Debit Notes' },
  receive_payments:   { path: '/erp/billing/receive-payments',       label: 'Receive Payments' },
}

const tools = []

module.exports = { tools, navTargets }
