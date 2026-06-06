import {
  CalendarDaysIcon,
  ListBulletIcon,
  PencilSquareIcon,
  LockClosedIcon,
  BanknotesIcon,
  DocumentTextIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  ChartBarIcon,
} from '@heroicons/vue/24/outline'

export const routes = [
  // Fiscal Years
  {
    path: '/erp/accounting/fiscal-years',
    name: 'erp-accounting-fiscal-years',
    component: () => import('./views/fiscal-year/FiscalYearList.vue'),
    meta: { requiresAuth: true, title: 'Fiscal Years' },
  },
  {
    path: '/erp/accounting/fiscal-years/create',
    name: 'erp-accounting-fiscal-years-create',
    component: () => import('./views/fiscal-year/FiscalYearCreate.vue'),
    meta: { requiresAuth: true, title: 'New Fiscal Year' },
  },
  {
    path: '/erp/accounting/fiscal-years/:id',
    name: 'erp-accounting-fiscal-years-detail',
    component: () => import('./views/fiscal-year/FiscalYearDetail.vue'),
    meta: { requiresAuth: true, title: 'Fiscal Year Detail' },
  },
  // Chart of Accounts
  {
    path: '/erp/accounting/chart-of-accounts',
    name: 'erp-accounting-chart-of-accounts',
    component: () => import('./views/chart-of-accounts/ChartOfAccountsList.vue'),
    meta: { requiresAuth: true, title: 'Chart of Accounts' },
  },
  {
    path: '/erp/accounting/chart-of-accounts/create',
    name: 'erp-accounting-chart-of-accounts-create',
    component: () => import('./views/chart-of-accounts/ChartOfAccountCreate.vue'),
    meta: { requiresAuth: true, title: 'New Account' },
  },
  {
    path: '/erp/accounting/chart-of-accounts/:id/edit',
    name: 'erp-accounting-chart-of-accounts-edit',
    component: () => import('./views/chart-of-accounts/ChartOfAccountEdit.vue'),
    meta: { requiresAuth: true, title: 'Edit Account' },
  },
  // Journals
  {
    path: '/erp/accounting/journals',
    name: 'erp-accounting-journals',
    component: () => import('./views/journal/JournalList.vue'),
    meta: { requiresAuth: true, title: 'Journal Entries' },
  },
  {
    path: '/erp/accounting/journals/create',
    name: 'erp-accounting-journals-create',
    component: () => import('./views/journal/JournalCreate.vue'),
    meta: { requiresAuth: true, title: 'New Journal Entry' },
  },
  {
    path: '/erp/accounting/journals/:id',
    name: 'erp-accounting-journals-detail',
    component: () => import('./views/journal/JournalDetail.vue'),
    meta: { requiresAuth: true, title: 'Journal Entry Detail' },
  },
  {
    path: '/erp/accounting/journals/:id/edit',
    name: 'erp-accounting-journals-edit',
    component: () => import('./views/journal/JournalEdit.vue'),
    meta: { requiresAuth: true, title: 'Edit Journal Entry' },
  },
  // AR Aging
  {
    path: '/erp/accounting/ar-aging',
    name: 'erp-accounting-ar-aging',
    component: () => import('./views/ar-aging/ARAgingReport.vue'),
    meta: { requiresAuth: true, title: 'AR Aging Report' },
  },
  {
    path: '/erp/accounting/ap-aging',
    name: 'erp-accounting-ap-aging',
    component: () => import('./views/ap-aging/APAgingReport.vue'),
    meta: { requiresAuth: true, title: 'AP Aging Report' },
  },
  // Financial Reports — Trial Balance & General Ledger
  {
    path: '/erp/accounting/reports/trial-balance',
    name: 'erp-accounting-trial-balance',
    component: () => import('./views/reports/TrialBalanceReport.vue'),
    meta: { requiresAuth: true, title: 'Trial Balance' },
  },
  {
    path: '/erp/accounting/reports/general-ledger',
    name: 'erp-accounting-general-ledger',
    component: () => import('./views/reports/GeneralLedgerReport.vue'),
    meta: { requiresAuth: true, title: 'General Ledger' },
  },
  // Financial Statements — TFRS for NPAEs
  {
    path: '/erp/accounting/financial-statements/balance-sheet',
    name: 'erp-accounting-balance-sheet',
    component: () => import('./views/financial-statements/BalanceSheetReport.vue'),
    meta: { requiresAuth: true, title: 'Statement of Financial Position' },
  },
  {
    path: '/erp/accounting/financial-statements/income-statement',
    name: 'erp-accounting-income-statement',
    component: () => import('./views/financial-statements/IncomeStatementReport.vue'),
    meta: { requiresAuth: true, title: 'Income Statement' },
  },
  {
    path: '/erp/accounting/financial-statements/changes-in-equity',
    name: 'erp-accounting-changes-in-equity',
    component: () => import('./views/financial-statements/ChangesInEquityReport.vue'),
    meta: { requiresAuth: true, title: 'Statement of Changes in Equity' },
  },
  {
    path: '/erp/accounting/financial-statements/cash-flow',
    name: 'erp-accounting-cash-flow',
    component: () => import('./views/cash-flow/CashFlowReport.vue'),
    meta: { requiresAuth: true, title: 'Cash Flow Statement' },
  },
  {
    path: '/erp/accounting/financial-statements/notes',
    name: 'erp-accounting-notes',
    component: () => import('./views/financial-statements/NotesReport.vue'),
    meta: { requiresAuth: true, title: 'Notes to Financial Statements' },
  },
  // Tax Periods
  {
    path: '/erp/accounting/tax-periods',
    name: 'erp-accounting-tax-periods',
    component: () => import('./views/tax-periods/TaxPeriodsManage.vue'),
    meta: { requiresAuth: true, title: 'Tax Periods' },
  },
  {
    path: '/erp/accounting/tax-periods/:id/vat-report',
    name: 'erp-accounting-vat-report',
    component: () => import('./views/vat-report/VatReport.vue'),
    meta: { requiresAuth: true, title: 'VAT Report' },
  },
  // Receive Payments
  {
    path: '/erp/billing/receive-payments',
    name: 'erp-billing-receive-payments',
    component: () => import('./views/receive-payment/ReceivePaymentList.vue'),
    meta: { requiresAuth: true, title: 'Receive Payments' },
  },
  {
    path: '/erp/billing/receive-payments/create',
    name: 'erp-billing-receive-payments-create',
    component: () => import('./views/receive-payment/ReceivePaymentCreate.vue'),
    meta: { requiresAuth: true, title: 'New Receive Payment' },
  },
  {
    path: '/erp/billing/receive-payments/:id',
    name: 'erp-billing-receive-payments-detail',
    component: () => import('./views/receive-payment/ReceivePaymentDetail.vue'),
    meta: { requiresAuth: true, title: 'Receive Payment Detail' },
  },
  // Debit Notes
  {
    path: '/erp/billing/debit-notes',
    name: 'erp-billing-debit-notes',
    component: () => import('./views/debit-note/DebitNoteList.vue'),
    meta: { requiresAuth: true, title: 'Debit Notes' },
  },
  {
    path: '/erp/billing/debit-notes/create',
    name: 'erp-billing-debit-notes-create',
    component: () => import('./views/debit-note/DebitNoteCreate.vue'),
    meta: { requiresAuth: true, title: 'New Debit Note' },
  },
  {
    path: '/erp/billing/debit-notes/:id',
    name: 'erp-billing-debit-notes-detail',
    component: () => import('./views/debit-note/DebitNoteDetail.vue'),
    meta: { requiresAuth: true, title: 'Debit Note Detail' },
  },
  // Credit Notes
  {
    path: '/erp/billing/credit-notes',
    name: 'erp-billing-credit-notes',
    component: () => import('./views/credit-note/CreditNoteList.vue'),
    meta: { requiresAuth: true, title: 'Credit Notes' },
  },
  {
    path: '/erp/billing/credit-notes/create',
    name: 'erp-billing-credit-notes-create',
    component: () => import('./views/credit-note/CreditNoteCreate.vue'),
    meta: { requiresAuth: true, title: 'New Credit Note' },
  },
  {
    path: '/erp/billing/credit-notes/:id',
    name: 'erp-billing-credit-notes-detail',
    component: () => import('./views/credit-note/CreditNoteDetail.vue'),
    meta: { requiresAuth: true, title: 'Credit Note Detail' },
  },
  // Billing Notes
  {
    path: '/erp/billing/billing-notes',
    name: 'erp-billing-notes',
    component: () => import('./views/billing-note/BillingNoteList.vue'),
    meta: { requiresAuth: true, title: 'Billing Notes' },
  },
  {
    path: '/erp/billing/billing-notes/create',
    name: 'erp-billing-notes-create',
    component: () => import('./views/billing-note/BillingNoteCreate.vue'),
    meta: { requiresAuth: true, title: 'New Billing Note' },
  },
  {
    path: '/erp/billing/billing-notes/:id',
    name: 'erp-billing-notes-detail',
    component: () => import('./views/billing-note/BillingNoteDetail.vue'),
    meta: { requiresAuth: true, title: 'Billing Note Detail' },
  },
  // Vendor Bills
  {
    path: '/erp/purchasing/bills',
    name: 'erp-purchasing-bills',
    component: () => import('./views/vendor-bill/VendorBillsList.vue'),
    meta: { requiresAuth: true, title: 'Vendor Bills' },
  },
  {
    path: '/erp/purchasing/bills/create',
    name: 'erp-purchasing-bills-create',
    component: () => import('./views/vendor-bill/VendorBillCreate.vue'),
    meta: { requiresAuth: true, title: 'New Vendor Bill' },
  },
  {
    path: '/erp/purchasing/bills/:id',
    name: 'erp-purchasing-bills-detail',
    component: () => import('./views/vendor-bill/VendorBillDetail.vue'),
    meta: { requiresAuth: true, title: 'Vendor Bill Detail' },
  },
  {
    path: '/erp/purchasing/bills/:id/edit',
    name: 'erp-purchasing-bills-edit',
    component: () => import('./views/vendor-bill/VendorBillEdit.vue'),
    meta: { requiresAuth: true, title: 'Edit Vendor Bill' },
  },
]

// First item in the Billing nav group (before invoices/receipts)
export const receivePaymentsNavItem = {
  label: 'nav.receivePayments',
  to: '/erp/billing/receive-payments',
  icon: BanknotesIcon,
  permission: 'erp.accounting.list',
}

// Remaining billing nav items (after invoices and receipts)
export const billingDocNavChildren = [
  { label: 'nav.billingNotes', to: '/erp/billing/billing-notes', icon: DocumentTextIcon,      permission: 'erp.accounting.list' },
  { label: 'nav.debitNotes',   to: '/erp/billing/debit-notes',   icon: ArrowTrendingUpIcon,   permission: 'erp.accounting.list' },
  { label: 'nav.creditNotes',  to: '/erp/billing/credit-notes',  icon: ArrowTrendingDownIcon, permission: 'erp.accounting.list' },
]

// Nav items that belong to the Accounting nav group
export const navChildren = [
  { label: 'nav.fiscalYears',     to: '/erp/accounting/fiscal-years',      icon: CalendarDaysIcon, permission: 'erp.accounting.list' },
  { label: 'nav.chartOfAccounts', to: '/erp/accounting/chart-of-accounts', icon: ListBulletIcon,   permission: 'erp.accounting.list' },
  { label: 'nav.journals',        to: '/erp/accounting/journals',          icon: PencilSquareIcon, permission: 'erp.accounting.list' },
  { label: 'nav.cashFlow',        to: '/erp/accounting/financial-statements/cash-flow', icon: ChartBarIcon, permission: 'erp.accounting.list' },
  { label: 'nav.taxPeriods',      to: '/erp/accounting/tax-periods',       icon: LockClosedIcon,   permission: 'erp.tax-periods.list' },
]

// Nav item that belongs to the Purchasing nav group
export const vendorBillsNavItem = {
  label: 'nav.vendorBills',
  to: '/erp/purchasing/bills',
  icon: BanknotesIcon,
  permission: 'erp.bills.list',
}

// AP Aging report — Purchasing nav group
export const apAgingNavItem = {
  label: 'nav.apAging',
  to: '/erp/accounting/ap-aging',
  icon: ChartBarIcon,
  permission: 'erp.accounting.list',
}
