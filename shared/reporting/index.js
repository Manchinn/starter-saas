import {
  ChartPieIcon, PresentationChartLineIcon, Squares2X2Icon,
  BookOpenIcon, TableCellsIcon, ScaleIcon, DocumentChartBarIcon,
  ClipboardDocumentListIcon, ChartBarIcon, ArchiveBoxIcon, ArrowsRightLeftIcon,
} from '@heroicons/vue/24/outline'

export const routes = [
  {
    path: '/reporting/erp-summary',
    name: 'reporting-erp-summary',
    component: () => import('./summary/views/ERPSummary.vue'),
    meta: { requiresAuth: true, title: 'nav.reportingOverview' },
  },
]

export default {
  slug: 'reporting',
  isCore: false,
  order: 40,
  routes,
  navItem: {
    label: 'nav.reporting',
    icon: ChartPieIcon,
    children: [
      {
        label: 'nav.reportingDashboard',
        icon: Squares2X2Icon,
        children: [
          { label: 'nav.reportingOverview', to: '/reporting/erp-summary', icon: PresentationChartLineIcon, permission: 'erp.products.list' },
        ],
      },
      {
        label: 'nav.accounting',
        icon: BookOpenIcon,
        children: [
          { label: 'nav.trialBalance',    to: '/erp/accounting/reports/trial-balance',                    icon: TableCellsIcon,            permission: 'erp.accounting.list' },
          { label: 'nav.generalLedger',   to: '/erp/accounting/reports/general-ledger',                   icon: BookOpenIcon,              permission: 'erp.accounting.list' },
          { label: 'nav.balanceSheet',    to: '/erp/accounting/financial-statements/balance-sheet',        icon: ScaleIcon,                 permission: 'erp.accounting.list' },
          { label: 'nav.incomeStatement', to: '/erp/accounting/financial-statements/income-statement',     icon: PresentationChartLineIcon, permission: 'erp.accounting.list' },
          { label: 'nav.changesInEquity', to: '/erp/accounting/financial-statements/changes-in-equity',    icon: DocumentChartBarIcon,      permission: 'erp.accounting.list' },
          { label: 'nav.notes',           to: '/erp/accounting/financial-statements/notes',                icon: ClipboardDocumentListIcon, permission: 'erp.accounting.list' },
          { label: 'nav.arAging',         to: '/erp/accounting/ar-aging',                                 icon: ChartBarIcon,              permission: 'erp.accounting.list' },
        ],
      },
      {
        label: 'nav.inventory',
        icon: ArchiveBoxIcon,
        children: [
          { label: 'nav.stockBalance',  to: '/erp/stock-balance',   icon: ChartBarIcon,        permission: 'erp.stock.list' },
          { label: 'nav.stockMovement', to: '/erp/stock-movements', icon: ArrowsRightLeftIcon, permission: 'erp.stock.list' },
        ],
      },
    ],
  },
}
