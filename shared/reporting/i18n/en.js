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

      filter: {
        period: 'Period',
        apply:  'Apply',
        last7:  '7D',
        last30: '30D',
        last90: '90D',
      },

      kpis: {
        salesInPeriod:      'Sales (period)',
        salesInPeriodDesc:  'invoiced in range',
        grossProfit:        'Gross Profit',
        grossMargin:        'margin',
        netProfit:          'Net Profit',
        netProfitDesc:      'after all expenses',
        invoicesInPeriod:   'Invoices (period)',
        invoicesInPeriodDesc: 'issued in range',
        outstandingAR:  'Outstanding AR',
        arDesc:         'sent / unpaid · current',
        outstandingAP:  'Outstanding AP',
        apDesc:         'approved bills · current',
        activeProducts: 'Active Products',
        activeProductsDesc: 'currently sellable',
        stockOnHand:    'Stock on Hand',
        stockOnHandDesc: 'across all stores',
      },

      charts: {
        salesTrend:        'Sales Trend',
        salesTrendDesc:    'Invoiced revenue in selected period',
        invoiceStatus:     'Invoice Status',
        invoiceStatusDesc: 'Invoices issued in period',
        pipeline:          'Sales Pipeline',
        pipelineDesc:      'Open documents · current',
        arAging:           'AR Aging',
        arAgingDesc:       'Receivables issued in period, by age',
        arVsAp:            'AR vs AP',
        arVsApDesc:        'Outstanding now',
        stockByStore:      'Stock by Store',
        stockByStoreDesc:  'On-hand now',
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
