// Localized content for the ERP demo-data seeder.
//
// The seeder (demo-data.service.js) owns all structure, relationships, codes,
// dates, amounts and system enums. This module owns only the human-readable
// display strings, in each supported language. `getContent(lang)` returns the
// full dictionary for the language (defaulting to English for anything we don't
// translate). The English values intentionally mirror the strings the seeder
// used before localization, so the `en` path is behaviour-preserving.

const en = {
  message: 'Demo data seeded successfully',

  uom: { unit: 'Unit', kg: 'Kilogram', liter: 'Liter', box: 'Box' },

  currency: { THB: 'Thai Baht', USD: 'US Dollar', EUR: 'Euro' },
  fxNotes: { opening: 'Opening rate FY2026', may: 'May 2026 mid-market' },

  categories: { electronics: 'Electronics', food: 'Food & Beverage', office: 'Office Supplies' },

  products: {
    mouse:    'Wireless Mouse',
    hub:      'USB-C Hub',
    keyboard: 'Mechanical Keyboard',
    water:    'Mineral Water 1L',
    coffee:   'Arabica Coffee',
    paper:    'A4 Paper Ream',
    pen:      'Ballpoint Pen',
  },

  customerGroups: {
    retail:     { name: 'Retail',     desc: 'Walk-in and direct sales customers at standard pricing' },
    wholesale:  { name: 'Wholesale',  desc: 'Bulk-buy distributors and resellers with volume discounts' },
    vip:        { name: 'VIP',        desc: 'High-value accounts with premium pricing and dedicated support' },
    government: { name: 'Government', desc: 'Government agencies and public-sector institutions' },
  },

  customers: {
    alice: { name: 'Alice Johnson', company: 'Alice Co.' },
    bob:   { name: 'Bob Smith',     company: 'Smith Ltd.' },
    carol: { name: 'Carol Davis',   company: 'Davis Corp.' },
    david: { name: 'David Lee',     company: 'Lee Group' },
    eva:   { name: 'Eva Martinez',  company: 'Martinez Inc.' },
  },

  vendors: {
    tech:   { name: 'TechSource Global', contact: 'Tom Wu' },
    food:   { name: 'FoodLink Supplies', contact: 'Sara Kim' },
    office: { name: 'OfficeWorld Dist.', contact: 'James Park' },
    clean:  { name: 'CleanPro Services', contact: 'Linda Ho' },
    swift:  { name: 'SwiftLogistics Co.', contact: 'Mark Tan' },
    uni:    { name: 'UniTrade Partners', contact: 'Nora Lim' },
  },
  vendorTypes: { supplier: 'Supplier', service: 'Service Provider' },

  stores: {
    main:  { name: 'Main Warehouse', address: '100 Industrial Rd, City' },
    north: { name: 'North Branch',   address: '45 North Ave, City' },
  },

  // keyed by Pricing code
  pricing: {
    'PRC-R001': 'Wireless Mouse — Retail',
    'PRC-R002': 'USB-C Hub — Retail',
    'PRC-R003': 'Mechanical Keyboard — Retail',
    'PRC-R004': 'A4 Paper — Retail',
    'PRC-R005': 'Ballpoint Pen — Retail',
    'PRC-W001': 'Wireless Mouse — Wholesale',
    'PRC-W002': 'USB-C Hub — Wholesale',
    'PRC-W003': 'Mechanical Keyboard — Wholesale',
    'PRC-W004': 'A4 Paper — Wholesale',
    'PRC-W005': 'Ballpoint Pen — Wholesale',
  },

  masterData: {
    paymentTerms: {
      name: 'Payment Terms', desc: 'Customer & vendor payment term options',
      values: { 'PT-001': 'Cash on Delivery', 'PT-002': 'Net 15 Days', 'PT-003': 'Net 30 Days', 'PT-004': 'Net 60 Days', 'PT-005': 'Advance Payment' },
    },
    paymentMethods: {
      name: 'Payment Methods', desc: 'Accepted payment methods',
      values: { 'PM-001': 'Cash', 'PM-002': 'Bank Transfer', 'PM-003': 'Credit Card', 'PM-004': 'Cheque', 'PM-005': 'Online Payment' },
    },
    shippingMethods: {
      name: 'Shipping Methods', desc: 'Delivery & shipping options',
      values: { 'SH-001': 'Standard Delivery', 'SH-002': 'Express Delivery', 'SH-003': 'Self Pickup', 'SH-004': 'Courier' },
    },
    businessTypes: {
      name: 'Business Types', desc: 'Customer & vendor business classification',
      values: { 'BT-001': 'Retail', 'BT-002': 'Wholesale', 'BT-003': 'Manufacturer', 'BT-004': 'Service Provider', 'BT-005': 'Distributor' },
    },
    taxTypes: {
      name: 'Tax Types', desc: 'Tax rate classifications',
      values: { 'TX-001': 'VAT 7%', 'TX-002': 'VAT 0%', 'TX-003': 'Tax Exempt', 'TX-004': 'Withholding Tax 3%' },
    },
    titlePrefix: {
      name: 'Title / Name Prefix', desc: 'Personal titles and name prefixes',
      values: { 'TL-001': 'Mr.', 'TL-002': 'Mrs.', 'TL-003': 'Ms.', 'TL-004': 'Dr.', 'TL-005': 'Prof.' },
    },
    gender: {
      name: 'Gender', desc: 'Gender options for employee records',
      values: { 'GD-001': 'Male', 'GD-002': 'Female', 'GD-003': 'Not Specified' },
    },
    leaveTypes: {
      name: 'Leave Types', desc: 'Employee leave type classifications',
      values: { 'LV-001': 'Annual Leave', 'LV-002': 'Sick Leave', 'LV-003': 'Maternity Leave', 'LV-004': 'Personal Leave', 'LV-005': 'Unpaid Leave' },
    },
    accountTypes: {
      name: 'Account Types', desc: 'Chart of accounts classification types',
      values: { asset: 'Asset', liability: 'Liability', equity: 'Equity', revenue: 'Revenue', expense: 'Expense' },
    },
    vendorTypes: {
      name: 'Vendor Types', desc: 'Vendor classification types',
      values: { 'VT-001': 'Supplier', 'VT-002': 'Service Provider' },
    },
    whtType: {
      name: 'WHT Type', desc: 'Withholding tax types; dataValue holds the rate (%)',
      values: {
        'WHT-001': 'ค่าบริการบุคคลธรรมดา (ภงด.3)',
        'WHT-002': 'ค่าบริการนิติบุคคล (ภงด.53)',
        'WHT-003': 'ค่าเช่า (ภงด.53)',
        'WHT-004': 'ค่าโฆษณา (ภงด.53)',
      },
    },
  },

  departments: {
    it:      { name: 'IT',         desc: 'Information Technology' },
    sales:   { name: 'Sales',      desc: 'Sales & Business Dev' },
    hr:      { name: 'HR',         desc: 'Human Resources' },
    finance: { name: 'Finance',    desc: 'Finance & Accounting' },
    ops:     { name: 'Operations', desc: 'Operations & Logistics' },
  },

  employees: {
    e1: { firstName: 'John',  lastName: 'Smith',    position: 'Software Engineer' },
    e2: { firstName: 'Jane',  lastName: 'Doe',      position: 'Sales Manager' },
    e3: { firstName: 'Mike',  lastName: 'Johnson',  position: 'HR Officer' },
    e4: { firstName: 'Sarah', lastName: 'Williams', position: 'Accountant' },
    e5: { firstName: 'Tom',   lastName: 'Brown',    position: 'Operations Lead' },
  },

  // keyed by Chart-of-Account code
  coa: {
    '1000': 'Assets', '1100': 'Current Assets', '1110': 'Cash', '1120': 'Bank Account',
    '1130': 'Accounts Receivable', '1140': 'Inventory', '1150': 'Prepaid Expenses', '1160': 'Input Tax (VAT)',
    '1170': 'Withholding Tax (WHT)',
    '1200': 'Fixed Assets', '1210': 'Property & Equipment', '1220': 'Accumulated Depreciation',
    '2000': 'Liabilities', '2100': 'Current Liabilities', '2110': 'Accounts Payable', '2120': 'Accrued Expenses',
    '2130': 'Short-term Loans', '2140': 'Output Tax (VAT)', '2150': 'Withholding Tax Payable', '2200': 'Long-term Liabilities', '2210': 'Long-term Loans',
    '3000': 'Equity', '3100': "Owner's Equity", '3110': 'Share Capital', '3120': 'Retained Earnings', '3130': 'Current Year Profit/Loss', '3140': "Owner's Drawings",
    '4000': 'Revenue', '4100': 'Sales Revenue', '4110': 'Product Sales', '4120': 'Service Revenue',
    '4200': 'Other Revenue', '4210': 'Interest Income', '4220': 'Other Income',
    '5000': 'Expenses', '5100': 'Cost of Sales', '5110': 'Cost of Goods Sold', '5130': 'Inventory Adjustment', '5200': 'Operating Expenses',
    '5210': 'Salary Expense', '5220': 'Rent Expense', '5230': 'Utilities Expense', '5240': 'Marketing & Advertising',
    '5250': 'Depreciation Expense', '5300': 'Financial Expenses', '5310': 'Interest Expense', '5320': 'Bank Charges',
    '5400': 'Income Tax Expense',
  },

  fiscalYear: { fy2025Notes: 'Closed at year end' },

  taxPeriod: {
    filed: 'VAT return filed',
    months: { '2026-01': 'Jan 2026', '2026-02': 'Feb 2026', '2026-03': 'Mar 2026', '2026-04': 'Apr 2026', '2026-05': 'May 2026', '2026-06': 'Jun 2026' },
  },

  // line-item descriptions that aren't a bare product name
  lineDesc: { hubBulk: 'USB-C Hub (bulk)', penBox: 'Ballpoint Pen Box', stapler: 'Stapler' },

  rpMethod: { bankTransfer: 'Bank Transfer', cash: 'Cash' },

  notes: {
    qt1: 'Bulk order for office IT equipment',
    qt2: 'Monthly office supplies',
    qt3: 'Quick supply run',
    so1: 'Converted from QT-2026-0001',
    so3: 'Pending review',
    do1addr: '88 Commerce Park, Bangkok 10120',
    do1notes: 'Fragile — handle with care',
    do2addr: '21 Smith Avenue, Bangkok 10110',
    do3notes: 'Pending address confirmation',
    rct1: 'Full payment for INV-2026-0003',
    rct2: 'Cash payment received',
    rct3: 'Advance deposit',
    bn1: 'Combined billing for April purchases',
    rp1: 'Full payment received for INV-2026-0003',
    rp2: 'Cash payment received for INV-2026-0002 — pending confirmation',
    dn1: 'Price correction — additional delivery charges not included',
    cn1: 'Returned goods — one Mechanical Keyboard faulty unit',
    pr1: 'Restock electronics — stock running low',
    pr2: 'Office supplies for new hires',
    po1: 'Follow-up from PR-2026-0001',
    po2: 'Office supplies restock',
    gr1: 'Q1 electronics restock',
    gr2: 'Food & beverage restock Feb',
    gr3: 'Office supplies pending invoice',
    sa1reason: 'Cycle count correction',
    sa1notes: 'Physical count variance — 5 extra mice found in back store',
    sa2reason: 'Physical count variance',
    sa2notes: 'Keyboard count mismatch — needs review',
    sc1: 'Q1 full physical inventory count',
    sc2: 'North Branch spot check',
    sr1: 'North Branch restocking — mice and pens',
    sr2: 'Supplementary transfer for keyboards',
    ret1: 'Customer returned defective unit — Carol Davis',
    si1reason: 'Internal Use',
    si1notes: 'Office supplies issued to HR for new hire onboarding',
  },

  journals: {
    je1:  { desc: 'Opening balance — initial share capital injection', l1: 'Bank deposit — share capital', l2: 'Share capital' },
    je2:  { desc: 'Inventory purchase — GR-2026-0001 TechSource Global', l1: 'Inventory received', l2: 'Payable — TechSource' },
    je3:  { desc: 'February 2026 — office rent payment', l1: 'Office rent Feb', l2: 'Bank payment' },
    je4:  { desc: 'Revenue recognition — INV-2026-0003 (Carol Davis)', l1: 'AR — Carol Davis', l2: 'Product sales' },
    je5:  { desc: 'Revenue recognition — INV-2026-0001 (Alice Johnson)', l1: 'AR — Alice Johnson', l2: 'Product sales' },
    je6:  { desc: 'Payment received — RCP-2026-0001 (Carol Davis)', l1: 'Bank receipt', l2: 'AR — Carol Davis' },
    je7:  { desc: 'Cost of goods sold — April sales', l1: 'COGS — April', l2: 'Inventory credit' },
    je8:  { desc: 'May 2026 — utilities payment (electricity, internet)', l1: 'Utilities May', l2: 'Bank payment' },
    je9:  { desc: 'May 2026 payroll — salary expense accrual', l1: 'May salary expense', l2: 'Bank payment for salaries' },
    je10: { desc: 'June 2026 — office rent accrual', l1: 'Office rent June', l2: 'Bank payment' },
  },
}

const th = {
  message: 'เพิ่มข้อมูลตัวอย่างเรียบร้อยแล้ว',

  uom: { unit: 'หน่วย', kg: 'กิโลกรัม', liter: 'ลิตร', box: 'กล่อง' },

  currency: { THB: 'บาทไทย', USD: 'ดอลลาร์สหรัฐ', EUR: 'ยูโร' },
  fxNotes: { opening: 'อัตราตั้งต้นปีงบประมาณ 2026', may: 'อัตรากลางตลาด พ.ค. 2026' },

  categories: { electronics: 'อิเล็กทรอนิกส์', food: 'อาหารและเครื่องดื่ม', office: 'เครื่องใช้สำนักงาน' },

  products: {
    mouse:    'เมาส์ไร้สาย',
    hub:      'ฮับ USB-C',
    keyboard: 'คีย์บอร์ดเมคานิคอล',
    water:    'น้ำแร่ 1 ลิตร',
    coffee:   'กาแฟอาราบิก้า',
    paper:    'กระดาษ A4 (รีม)',
    pen:      'ปากกาลูกลื่น',
  },

  customerGroups: {
    retail:     { name: 'ขายปลีก',    desc: 'ลูกค้าหน้าร้านและลูกค้าตรงในราคามาตรฐาน' },
    wholesale:  { name: 'ขายส่ง',     desc: 'ตัวแทนจำหน่ายและผู้ซื้อจำนวนมากที่มีส่วนลดพิเศษ' },
    vip:        { name: 'VIP',        desc: 'ลูกค้ามูลค่าสูงที่มีราคาพิเศษและบริการดูแลเฉพาะ' },
    government: { name: 'หน่วยงานรัฐ', desc: 'หน่วยงานราชการและองค์กรภาครัฐ' },
  },

  customers: {
    alice: { name: 'สมหญิง จันทร์เพ็ญ', company: 'บริษัท สมหญิง จำกัด' },
    bob:   { name: 'สมชาย ใจดี',        company: 'ห้างหุ้นส่วนจำกัด สมชาย' },
    carol: { name: 'กมล ทองสุข',        company: 'บริษัท กมล คอร์ปอเรชั่น จำกัด' },
    david: { name: 'ดนัย ลีนะกุล',       company: 'กลุ่มบริษัท ลีนะ' },
    eva:   { name: 'เอวา มาร์ติเนซ',     company: 'บริษัท มาร์ติเนซ จำกัด' },
  },

  vendors: {
    tech:   { name: 'เทคซอร์ส โกลบอล',        contact: 'ธนา วงศ์' },
    food:   { name: 'ฟู้ดลิงค์ ซัพพลาย',        contact: 'สรา คิม' },
    office: { name: 'ออฟฟิศเวิลด์ ดิสทริบิวชั่น', contact: 'เจมส์ ปาร์ค' },
    clean:  { name: 'คลีนโปร เซอร์วิส',         contact: 'ลินดา โฮ' },
    swift:  { name: 'สวิฟต์โลจิสติกส์',          contact: 'มาร์ค ตัน' },
    uni:    { name: 'ยูนิเทรด พาร์ทเนอร์ส',       contact: 'นอรา ลิม' },
  },
  vendorTypes: { supplier: 'ผู้จัดจำหน่าย', service: 'ผู้ให้บริการ' },

  stores: {
    main:  { name: 'คลังสินค้าหลัก', address: '100 ถนนอุตสาหกรรม เมือง' },
    north: { name: 'สาขาเหนือ',      address: '45 ถนนนอร์ท เมือง' },
  },

  pricing: {
    'PRC-R001': 'เมาส์ไร้สาย — ขายปลีก',
    'PRC-R002': 'ฮับ USB-C — ขายปลีก',
    'PRC-R003': 'คีย์บอร์ดเมคานิคอล — ขายปลีก',
    'PRC-R004': 'กระดาษ A4 — ขายปลีก',
    'PRC-R005': 'ปากกาลูกลื่น — ขายปลีก',
    'PRC-W001': 'เมาส์ไร้สาย — ขายส่ง',
    'PRC-W002': 'ฮับ USB-C — ขายส่ง',
    'PRC-W003': 'คีย์บอร์ดเมคานิคอล — ขายส่ง',
    'PRC-W004': 'กระดาษ A4 — ขายส่ง',
    'PRC-W005': 'ปากกาลูกลื่น — ขายส่ง',
  },

  masterData: {
    paymentTerms: {
      name: 'เงื่อนไขการชำระเงิน', desc: 'ตัวเลือกเงื่อนไขการชำระเงินของลูกค้าและผู้ขาย',
      values: { 'PT-001': 'เก็บเงินปลายทาง', 'PT-002': 'เครดิต 15 วัน', 'PT-003': 'เครดิต 30 วัน', 'PT-004': 'เครดิต 60 วัน', 'PT-005': 'ชำระล่วงหน้า' },
    },
    paymentMethods: {
      name: 'วิธีการชำระเงิน', desc: 'วิธีการชำระเงินที่รับ',
      values: { 'PM-001': 'เงินสด', 'PM-002': 'โอนเงินผ่านธนาคาร', 'PM-003': 'บัตรเครดิต', 'PM-004': 'เช็ค', 'PM-005': 'ชำระเงินออนไลน์' },
    },
    shippingMethods: {
      name: 'วิธีการจัดส่ง', desc: 'ตัวเลือกการจัดส่งและขนส่ง',
      values: { 'SH-001': 'จัดส่งมาตรฐาน', 'SH-002': 'จัดส่งด่วน', 'SH-003': 'รับสินค้าเอง', 'SH-004': 'ขนส่งพัสดุ' },
    },
    businessTypes: {
      name: 'ประเภทธุรกิจ', desc: 'การจัดประเภทธุรกิจของลูกค้าและผู้ขาย',
      values: { 'BT-001': 'ขายปลีก', 'BT-002': 'ขายส่ง', 'BT-003': 'ผู้ผลิต', 'BT-004': 'ผู้ให้บริการ', 'BT-005': 'ตัวแทนจำหน่าย' },
    },
    taxTypes: {
      name: 'ประเภทภาษี', desc: 'การจัดประเภทอัตราภาษี',
      values: { 'TX-001': 'ภาษีมูลค่าเพิ่ม 7%', 'TX-002': 'ภาษีมูลค่าเพิ่ม 0%', 'TX-003': 'ยกเว้นภาษี', 'TX-004': 'ภาษีหัก ณ ที่จ่าย 3%' },
    },
    titlePrefix: {
      name: 'คำนำหน้าชื่อ', desc: 'คำนำหน้าชื่อบุคคล',
      values: { 'TL-001': 'นาย', 'TL-002': 'นาง', 'TL-003': 'นางสาว', 'TL-004': 'ดร.', 'TL-005': 'ศ.' },
    },
    gender: {
      name: 'เพศ', desc: 'ตัวเลือกเพศสำหรับข้อมูลพนักงาน',
      values: { 'GD-001': 'ชาย', 'GD-002': 'หญิง', 'GD-003': 'ไม่ระบุ' },
    },
    leaveTypes: {
      name: 'ประเภทการลา', desc: 'การจัดประเภทการลาของพนักงาน',
      values: { 'LV-001': 'ลาพักร้อน', 'LV-002': 'ลาป่วย', 'LV-003': 'ลาคลอด', 'LV-004': 'ลากิจ', 'LV-005': 'ลาไม่รับค่าจ้าง' },
    },
    accountTypes: {
      name: 'ประเภทบัญชี', desc: 'ประเภทการจัดหมวดผังบัญชี',
      values: { asset: 'สินทรัพย์', liability: 'หนี้สิน', equity: 'ส่วนของเจ้าของ', revenue: 'รายได้', expense: 'ค่าใช้จ่าย' },
    },
    vendorTypes: {
      name: 'ประเภทผู้ขาย', desc: 'การจัดประเภทผู้ขาย',
      values: { 'VT-001': 'ผู้จัดจำหน่าย', 'VT-002': 'ผู้ให้บริการ' },
    },
    whtType: {
      name: 'ประเภทภาษีหัก ณ ที่จ่าย', desc: 'ประเภทภาษีหัก ณ ที่จ่าย โดย dataValue คืออัตรา (%)',
      values: {
        'WHT-001': 'ค่าบริการบุคคลธรรมดา (ภงด.3)',
        'WHT-002': 'ค่าบริการนิติบุคคล (ภงด.53)',
        'WHT-003': 'ค่าเช่า (ภงด.53)',
        'WHT-004': 'ค่าโฆษณา (ภงด.53)',
      },
    },
  },

  departments: {
    it:      { name: 'ไอที',          desc: 'เทคโนโลยีสารสนเทศ' },
    sales:   { name: 'ฝ่ายขาย',       desc: 'ฝ่ายขายและพัฒนาธุรกิจ' },
    hr:      { name: 'ฝ่ายบุคคล',      desc: 'ทรัพยากรบุคคล' },
    finance: { name: 'ฝ่ายการเงิน',    desc: 'การเงินและบัญชี' },
    ops:     { name: 'ฝ่ายปฏิบัติการ', desc: 'ปฏิบัติการและโลจิสติกส์' },
  },

  employees: {
    e1: { firstName: 'ก้อง',  lastName: 'ทองดี',   position: 'วิศวกรซอฟต์แวร์' },
    e2: { firstName: 'จันทรา', lastName: 'ดีงาม',   position: 'ผู้จัดการฝ่ายขาย' },
    e3: { firstName: 'มานะ',  lastName: 'ใจเย็น',   position: 'เจ้าหน้าที่ฝ่ายบุคคล' },
    e4: { firstName: 'สุดา',  lastName: 'รักงาน',   position: 'นักบัญชี' },
    e5: { firstName: 'ธวัช',  lastName: 'แสงทอง',  position: 'หัวหน้าฝ่ายปฏิบัติการ' },
  },

  coa: {
    '1000': 'สินทรัพย์', '1100': 'สินทรัพย์หมุนเวียน', '1110': 'เงินสด', '1120': 'เงินฝากธนาคาร',
    '1130': 'ลูกหนี้การค้า', '1140': 'สินค้าคงเหลือ', '1150': 'ค่าใช้จ่ายจ่ายล่วงหน้า', '1160': 'ภาษีซื้อ (VAT)',
    '1170': 'ภาษีเงินได้หัก ณ ที่จ่าย',
    '1200': 'สินทรัพย์ถาวร', '1210': 'ที่ดิน อาคารและอุปกรณ์', '1220': 'ค่าเสื่อมราคาสะสม',
    '2000': 'หนี้สิน', '2100': 'หนี้สินหมุนเวียน', '2110': 'เจ้าหนี้การค้า', '2120': 'ค่าใช้จ่ายค้างจ่าย',
    '2130': 'เงินกู้ระยะสั้น', '2140': 'ภาษีขาย (VAT)', '2150': 'ภาษีเงินได้หัก ณ ที่จ่ายค้างจ่าย', '2200': 'หนี้สินระยะยาว', '2210': 'เงินกู้ระยะยาว',
    '3000': 'ส่วนของเจ้าของ', '3100': 'ส่วนของเจ้าของ (ทุน)', '3110': 'ทุนเรือนหุ้น', '3120': 'กำไรสะสม', '3130': 'กำไร/ขาดทุนปีปัจจุบัน', '3140': 'เงินถอนใช้ส่วนตัว',
    '4000': 'รายได้', '4100': 'รายได้จากการขาย', '4110': 'ขายสินค้า', '4120': 'รายได้ค่าบริการ',
    '4200': 'รายได้อื่น', '4210': 'ดอกเบี้ยรับ', '4220': 'รายได้เบ็ดเตล็ด',
    '5000': 'ค่าใช้จ่าย', '5100': 'ต้นทุนขาย', '5110': 'ต้นทุนสินค้าที่ขาย', '5130': 'ผลต่างปรับปรุงสินค้าคงเหลือ', '5200': 'ค่าใช้จ่ายในการดำเนินงาน',
    '5210': 'ค่าใช้จ่ายเงินเดือน', '5220': 'ค่าเช่า', '5230': 'ค่าสาธารณูปโภค', '5240': 'การตลาดและโฆษณา',
    '5250': 'ค่าเสื่อมราคา', '5300': 'ค่าใช้จ่ายทางการเงิน', '5310': 'ดอกเบี้ยจ่าย', '5320': 'ค่าธรรมเนียมธนาคาร',
    '5400': 'ค่าใช้จ่ายภาษีเงินได้',
  },

  fiscalYear: { fy2025Notes: 'ปิดงวด ณ สิ้นปี' },

  taxPeriod: {
    filed: 'ยื่นแบบ ภ.พ.30 แล้ว',
    months: { '2026-01': 'ม.ค. 2026', '2026-02': 'ก.พ. 2026', '2026-03': 'มี.ค. 2026', '2026-04': 'เม.ย. 2026', '2026-05': 'พ.ค. 2026', '2026-06': 'มิ.ย. 2026' },
  },

  lineDesc: { hubBulk: 'ฮับ USB-C (ยกลัง)', penBox: 'ปากกาลูกลื่น (กล่อง)', stapler: 'เครื่องเย็บกระดาษ' },

  rpMethod: { bankTransfer: 'โอนเงินผ่านธนาคาร', cash: 'เงินสด' },

  notes: {
    qt1: 'สั่งซื้ออุปกรณ์ไอทีสำนักงานจำนวนมาก',
    qt2: 'เครื่องใช้สำนักงานประจำเดือน',
    qt3: 'สั่งซื้อด่วน',
    so1: 'แปลงจากใบเสนอราคา QT-2026-0001',
    so3: 'รอตรวจสอบ',
    do1addr: '88 คอมเมิร์ซพาร์ค กรุงเทพฯ 10120',
    do1notes: 'สินค้าแตกหักง่าย — โปรดระมัดระวัง',
    do2addr: '21 ถนนสมิธ กรุงเทพฯ 10110',
    do3notes: 'รอยืนยันที่อยู่',
    rct1: 'ชำระเต็มจำนวนสำหรับ INV-2026-0003',
    rct2: 'รับชำระเงินสด',
    rct3: 'เงินมัดจำล่วงหน้า',
    bn1: 'ใบวางบิลรวมการซื้อเดือนเมษายน',
    rp1: 'รับชำระเต็มจำนวนสำหรับ INV-2026-0003',
    rp2: 'รับชำระเงินสดสำหรับ INV-2026-0002 — รอยืนยัน',
    dn1: 'ปรับราคา — ยังไม่รวมค่าจัดส่งเพิ่มเติม',
    cn1: 'รับคืนสินค้า — คีย์บอร์ดเมคานิคอลชำรุด 1 ชิ้น',
    pr1: 'เติมสต็อกสินค้าอิเล็กทรอนิกส์ — สต็อกใกล้หมด',
    pr2: 'เครื่องใช้สำนักงานสำหรับพนักงานใหม่',
    po1: 'ต่อเนื่องจาก PR-2026-0001',
    po2: 'เติมสต็อกเครื่องใช้สำนักงาน',
    gr1: 'เติมสต็อกอิเล็กทรอนิกส์ไตรมาส 1',
    gr2: 'เติมสต็อกอาหารและเครื่องดื่มเดือนกุมภาพันธ์',
    gr3: 'เครื่องใช้สำนักงาน รอใบแจ้งหนี้',
    sa1reason: 'ปรับปรุงจากการนับสต็อกรอบ',
    sa1notes: 'ผลต่างจากการนับจริง — พบเมาส์เกิน 5 ชิ้นในสต็อกหลัง',
    sa2reason: 'ผลต่างจากการนับจริง',
    sa2notes: 'จำนวนคีย์บอร์ดไม่ตรง — ต้องตรวจสอบ',
    sc1: 'การนับสต็อกจริงเต็มรูปแบบไตรมาส 1',
    sc2: 'สุ่มตรวจสาขาเหนือ',
    sr1: 'เติมสต็อกสาขาเหนือ — เมาส์และปากกา',
    sr2: 'โอนเพิ่มเติมสำหรับคีย์บอร์ด',
    ret1: 'ลูกค้าคืนสินค้าชำรุด — กมล ทองสุข',
    si1reason: 'ใช้ภายใน',
    si1notes: 'เบิกเครื่องใช้สำนักงานให้ฝ่ายบุคคลสำหรับการรับพนักงานใหม่',
  },

  journals: {
    je1:  { desc: 'ยอดยกมา — เงินลงทุนเริ่มต้นจากผู้ถือหุ้น', l1: 'เงินฝากธนาคาร — ทุนเรือนหุ้น', l2: 'ทุนเรือนหุ้น' },
    je2:  { desc: 'ซื้อสินค้าเข้าคลัง — GR-2026-0001 เทคซอร์ส โกลบอล', l1: 'รับสินค้าเข้าคลัง', l2: 'เจ้าหนี้ — เทคซอร์ส' },
    je3:  { desc: 'กุมภาพันธ์ 2026 — จ่ายค่าเช่าสำนักงาน', l1: 'ค่าเช่าสำนักงาน ก.พ.', l2: 'จ่ายผ่านธนาคาร' },
    je4:  { desc: 'รับรู้รายได้ — INV-2026-0003 (กมล ทองสุข)', l1: 'ลูกหนี้ — กมล ทองสุข', l2: 'ขายสินค้า' },
    je5:  { desc: 'รับรู้รายได้ — INV-2026-0001 (สมหญิง จันทร์เพ็ญ)', l1: 'ลูกหนี้ — สมหญิง จันทร์เพ็ญ', l2: 'ขายสินค้า' },
    je6:  { desc: 'รับชำระเงิน — RCP-2026-0001 (กมล ทองสุข)', l1: 'รับเงินผ่านธนาคาร', l2: 'ลูกหนี้ — กมล ทองสุข' },
    je7:  { desc: 'ต้นทุนสินค้าที่ขาย — ยอดขายเดือนเมษายน', l1: 'ต้นทุนขาย — เมษายน', l2: 'ลดสินค้าคงเหลือ' },
    je8:  { desc: 'พฤษภาคม 2026 — จ่ายค่าสาธารณูปโภค (ค่าไฟ อินเทอร์เน็ต)', l1: 'ค่าสาธารณูปโภค พ.ค.', l2: 'จ่ายผ่านธนาคาร' },
    je9:  { desc: 'เงินเดือน พฤษภาคม 2026 — ตั้งค้างจ่ายค่าใช้จ่ายเงินเดือน', l1: 'ค่าใช้จ่ายเงินเดือน พ.ค.', l2: 'จ่ายเงินเดือนผ่านธนาคาร' },
    je10: { desc: 'มิถุนายน 2026 — ตั้งค้างจ่ายค่าเช่าสำนักงาน', l1: 'ค่าเช่าสำนักงาน มิ.ย.', l2: 'จ่ายผ่านธนาคาร' },
  },
}

const BY_LANG = { en, th }

function getContent(lang) {
  return BY_LANG[lang] || en
}

module.exports = { getContent }
