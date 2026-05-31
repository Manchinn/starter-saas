export default {
  nav: {
    reporting:  'รายงาน',
    erpSummary: 'สรุป ERP',
  },
  reporting: {
    erpSummary: {
      title:    'สรุป ERP',
      subtitle: 'ภาพรวมผลการดำเนินงาน',
      refresh:  'รีเฟรช',
      updated:  'อัปเดตเมื่อ',
      noData:   'ยังไม่มีข้อมูลให้แสดง',

      filter: {
        period: 'ช่วงเวลา',
        apply:  'ใช้งาน',
        last7:  '7 วัน',
        last30: '30 วัน',
        last90: '90 วัน',
      },

      kpis: {
        salesInPeriod:      'ยอดขาย (ช่วงเวลา)',
        salesInPeriodDesc:  'ออกใบแจ้งหนี้ในช่วงนี้',
        grossProfit:        'กำไรขั้นต้น',
        grossMargin:        'อัตรากำไร',
        netProfit:          'กำไรสุทธิ',
        netProfitDesc:      'หลังหักค่าใช้จ่ายทั้งหมด',
        invoicesInPeriod:   'ใบแจ้งหนี้ (ช่วงเวลา)',
        invoicesInPeriodDesc: 'ออกในช่วงนี้',
        outstandingAR:  'ลูกหนี้คงค้าง',
        arDesc:         'ส่งแล้ว / ยังไม่ชำระ · ปัจจุบัน',
        outstandingAP:  'เจ้าหนี้คงค้าง',
        apDesc:         'บิลที่อนุมัติแล้ว · ปัจจุบัน',
        activeProducts: 'สินค้าที่ใช้งาน',
        activeProductsDesc: 'พร้อมขาย',
        stockOnHand:    'สต๊อกคงเหลือ',
        stockOnHandDesc: 'รวมทุกคลัง',
      },

      charts: {
        salesTrend:        'แนวโน้มยอดขาย',
        salesTrendDesc:    'รายได้จากใบแจ้งหนี้ในช่วงที่เลือก',
        invoiceStatus:     'สถานะใบแจ้งหนี้',
        invoiceStatusDesc: 'ใบแจ้งหนี้ที่ออกในช่วงนี้',
        pipeline:          'ไปป์ไลน์การขาย',
        pipelineDesc:      'เอกสารที่เปิดอยู่ · ปัจจุบัน',
        arAging:           'อายุลูกหนี้',
        arAgingDesc:       'ลูกหนี้ที่ออกในช่วงนี้ ตามอายุ',
        arVsAp:            'ลูกหนี้ เทียบ เจ้าหนี้',
        arVsApDesc:        'คงค้าง ณ ปัจจุบัน',
        stockByStore:      'สต๊อกตามคลัง',
        stockByStoreDesc:  'คงเหลือ ณ ปัจจุบัน',
      },

      status: {
        draft:     'ร่าง',
        sent:      'ส่งแล้ว',
        paid:      'ชำระแล้ว',
        cancelled: 'ยกเลิก',
      },
      pipeline: {
        quotations: 'ใบเสนอราคา',
        orders:     'คำสั่งขาย',
        deliveries: 'ใบส่งของ',
        invoices:   'ใบแจ้งหนี้',
      },
      aging: {
        current: 'ยังไม่ครบกำหนด',
        d1_30:   '1–30 วัน',
        d31_60:  '31–60 วัน',
        d60plus: '60+ วัน',
      },
      legend: {
        receivable: 'ลูกหนี้',
        payable:    'เจ้าหนี้',
        revenue:    'รายได้',
      },
      unassigned: 'ไม่ระบุคลัง',
    },
  },
}
