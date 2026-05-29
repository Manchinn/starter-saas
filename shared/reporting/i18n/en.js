export default {
  nav: {
    reporting:  'Reporting',
    erpSummary: 'ERP Summary',
  },
  reporting: {
    erpSummary: {
      title:    'ERP Summary',
      subtitle: 'Performance at a glance',
      refresh:  'Refresh',
      updated:  'Updated',
      noData:   'No data to display yet',

      kpis: {
        salesMtd:       'Sales MTD',
        salesMtdDesc:   'invoiced this month',
        outstandingAR:  'Outstanding AR',
        arDesc:         'sent / unpaid',
        outstandingAP:  'Outstanding AP',
        apDesc:         'approved bills',
        activeProducts: 'Active Products',
        activeProductsDesc: 'currently sellable',
        stockOnHand:    'Stock on Hand',
        stockOnHandDesc: 'across all stores',
        sentInvoices:   'Sent Invoices',
        sentInvoicesDesc: 'awaiting payment',
      },

      charts: {
        salesTrend:        'Sales Trend',
        salesTrendDesc:    'Invoiced revenue, last 12 months',
        invoiceStatus:     'Invoice Status',
        invoiceStatusDesc: 'Count by lifecycle stage',
        pipeline:          'Sales Pipeline',
        pipelineDesc:      'Open documents by stage',
        arAging:           'AR Aging',
        arAgingDesc:       'Outstanding receivables by age',
        arVsAp:            'AR vs AP',
        arVsApDesc:        'Receivable against payable',
        stockByStore:      'Stock by Store',
        stockByStoreDesc:  'On-hand distribution',
      },

      status: {
        draft:     'Draft',
        sent:      'Sent',
        paid:      'Paid',
        cancelled: 'Cancelled',
      },
      pipeline: {
        quotations: 'Quotations',
        orders:     'Orders',
        deliveries: 'Deliveries',
        invoices:   'Invoices',
      },
      aging: {
        current: 'Current',
        d1_30:   '1–30 days',
        d31_60:  '31–60 days',
        d60plus: '60+ days',
      },
      legend: {
        receivable: 'Receivable',
        payable:    'Payable',
        revenue:    'Revenue',
      },
      unassigned: 'Unassigned',
    },
  },
}
