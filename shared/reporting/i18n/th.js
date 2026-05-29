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

      kpis: {
        salesMtd:       'ยอดขายเดือนนี้',
        salesMtdDesc:   'ออกใบแจ้งหนี้เดือนนี้',
        outstandingAR:  'ลูกหนี้คงค้าง',
        arDesc:         'ส่งแล้ว / ยังไม่ชำระ',
        outstandingAP:  'เจ้าหนี้คงค้าง',
        apDesc:         'บิลที่อนุมัติแล้ว',
        activeProducts: 'สินค้าที่ใช้งาน',
        activeProductsDesc: 'พร้อมขาย',
        stockOnHand:    'สต๊อกคงเหลือ',
        stockOnHandDesc: 'รวมทุกคลัง',
        sentInvoices:   'ใบแจ้งหนี้ที่ส่ง',
        sentInvoicesDesc: 'รอการชำระ',
      },

      charts: {
        salesTrend:        'แนวโน้มยอดขาย',
        salesTrendDesc:    'รายได้จากใบแจ้งหนี้ 12 เดือนล่าสุด',
        invoiceStatus:     'สถานะใบแจ้งหนี้',
        invoiceStatusDesc: 'จำนวนตามสถานะ',
        pipeline:          'ไปป์ไลน์การขาย',
        pipelineDesc:      'เอกสารที่เปิดอยู่ตามขั้นตอน',
        arAging:           'อายุลูกหนี้',
        arAgingDesc:       'ลูกหนี้คงค้างตามอายุ',
        arVsAp:            'ลูกหนี้ เทียบ เจ้าหนี้',
        arVsApDesc:        'ลูกหนี้เทียบกับเจ้าหนี้',
        stockByStore:      'สต๊อกตามคลัง',
        stockByStoreDesc:  'การกระจายสินค้าคงคลัง',
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
