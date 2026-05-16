const {
  UOM, ProductCategory, Product,
  CustomerGroup, Customer,
  Vendor, Store, StoreStock,
  Department, Employee,
  MasterDataCategory, MasterDataValue,
  ChartOfAccount,
  Quotation, QuotationItem,
  Order, SalesOrderItem,
  Invoice, InvoiceItem,
  Receipt,
  FiscalYear,
  BillingNote, BillingNoteInvoice,
  DebitNote, CreditNote,
  ReceivePayment, ReceivePaymentInvoice,
  Journal, JournalLine,
  DeliveryOrder, DeliveryOrderItem,
  GoodReceive, GoodReceiveItem,
  StockAdjust, StockAdjustItem,
  StockCount, StockCountItem,
  StockRequest, StockRequestItem,
  StockReturn, StockReturnItem,
  StockIssue, StockIssueItem,
  StockMovement,
  SaleItem,
  Pricing,
  PurchaseRequisition, PurchaseRequisitionItem,
  PurchaseOrder, PurchaseOrderItem,
  Currency, ExchangeRate,
} = require('../../../server/models')
const sequelize = require('../../../server/config/database')

// ── Seed ─────────────────────────────────────────────────────────────────────

async function seedDemo(userId, orgId) {
  const t = await sequelize.transaction()
  try {

    // ── UOMs ────────────────────────────────────────────────────────────────
    const [unit, kg, liter, box] = await Promise.all([
      UOM.create({ name: 'Unit',     abbreviation: 'unit', createdBy: userId, organizationId: orgId }, { transaction: t }),
      UOM.create({ name: 'Kilogram', abbreviation: 'kg',   createdBy: userId, organizationId: orgId }, { transaction: t }),
      UOM.create({ name: 'Liter',    abbreviation: 'L',    createdBy: userId, organizationId: orgId }, { transaction: t }),
      UOM.create({ name: 'Box',      abbreviation: 'box',  createdBy: userId, organizationId: orgId }, { transaction: t }),
    ])

    // ── Currencies & Exchange Rates ────────────────────────────────────────
    await Promise.all([
      Currency.create({ code: 'THB', name: 'Thai Baht', symbol: '฿', decimals: 2, isBase: true,  isActive: true, organizationId: orgId, createdBy: userId }, { transaction: t }),
      Currency.create({ code: 'USD', name: 'US Dollar', symbol: '$', decimals: 2, isBase: false, isActive: true, organizationId: orgId, createdBy: userId }, { transaction: t }),
      Currency.create({ code: 'EUR', name: 'Euro',      symbol: '€', decimals: 2, isBase: false, isActive: true, organizationId: orgId, createdBy: userId }, { transaction: t }),
    ])
    await Promise.all([
      ExchangeRate.create({ currencyCode: 'USD', rate: 35.50, asOfDate: '2026-01-01', source: 'manual', notes: 'Opening rate FY2026', organizationId: orgId, createdBy: userId }, { transaction: t }),
      ExchangeRate.create({ currencyCode: 'USD', rate: 36.20, asOfDate: '2026-05-01', source: 'manual', notes: 'May 2026 mid-market', organizationId: orgId, createdBy: userId }, { transaction: t }),
      ExchangeRate.create({ currencyCode: 'EUR', rate: 38.40, asOfDate: '2026-01-01', source: 'manual', notes: 'Opening rate FY2026', organizationId: orgId, createdBy: userId }, { transaction: t }),
      ExchangeRate.create({ currencyCode: 'EUR', rate: 39.10, asOfDate: '2026-05-01', source: 'manual', notes: 'May 2026 mid-market', organizationId: orgId, createdBy: userId }, { transaction: t }),
    ])

    // ── Product Categories ───────────────────────────────────────────────────
    const [electronics, food, office] = await Promise.all([
      ProductCategory.create({ code: 'CAT-ELEC', name: 'Electronics',     createdBy: userId, organizationId: orgId }, { transaction: t }),
      ProductCategory.create({ code: 'CAT-FOOD', name: 'Food & Beverage', createdBy: userId, organizationId: orgId }, { transaction: t }),
      ProductCategory.create({ code: 'CAT-OFFC', name: 'Office Supplies', createdBy: userId, organizationId: orgId }, { transaction: t }),
    ])

    // ── Products ─────────────────────────────────────────────────────────────
    const [pMouse, pHub, pKeyboard, pWater, pCoffee, pPaper, pPen] = await Promise.all([
      Product.create({ name: 'Wireless Mouse',      sku: 'PRD-0001', price: 29.99, cost: 12.00, stock: 150,  sellingUomId: unit.id,  purchasingUomId: box.id, category: electronics.name, createdBy: userId, organizationId: orgId }, { transaction: t }),
      Product.create({ name: 'USB-C Hub',           sku: 'PRD-0002', price: 49.99, cost: 20.00, stock: 80,   sellingUomId: unit.id,  purchasingUomId: box.id, category: electronics.name, createdBy: userId, organizationId: orgId }, { transaction: t }),
      Product.create({ name: 'Mechanical Keyboard', sku: 'PRD-0003', price: 89.99, cost: 40.00, stock: 60,   sellingUomId: unit.id,  purchasingUomId: box.id, category: electronics.name, createdBy: userId, organizationId: orgId }, { transaction: t }),
      Product.create({ name: 'Mineral Water 1L',    sku: 'PRD-0004', price: 0.99,  cost: 0.40,  stock: 500,  sellingUomId: liter.id, purchasingUomId: box.id, category: food.name,        createdBy: userId, organizationId: orgId }, { transaction: t }),
      Product.create({ name: 'Arabica Coffee',      sku: 'PRD-0005', price: 14.99, cost: 7.00,  stock: 200,  sellingUomId: kg.id,    purchasingUomId: kg.id,  category: food.name,        createdBy: userId, organizationId: orgId }, { transaction: t }),
      Product.create({ name: 'A4 Paper Ream',       sku: 'PRD-0006', price: 5.99,  cost: 3.00,  stock: 300,  sellingUomId: box.id,   purchasingUomId: box.id, category: office.name,      createdBy: userId, organizationId: orgId }, { transaction: t }),
      Product.create({ name: 'Ballpoint Pen',       sku: 'PRD-0007', price: 1.50,  cost: 0.50,  stock: 1000, sellingUomId: unit.id,  purchasingUomId: box.id, category: office.name,      createdBy: userId, organizationId: orgId }, { transaction: t }),
    ])

    // ── Customer Groups ───────────────────────────────────────────────────────
    const [retail, wholesale] = await Promise.all([
      CustomerGroup.create({ name: 'Retail',    description: 'Walk-in & direct customers',  organizationId: orgId }, { transaction: t }),
      CustomerGroup.create({ name: 'Wholesale', description: 'Bulk-buy distributors',       organizationId: orgId }, { transaction: t }),
    ])

    // ── Customers ─────────────────────────────────────────────────────────────
    const [cAlice, cBob, cCarol, cDavid, cEva] = await Promise.all([
      Customer.create({ code: 'CUS-0001', name: 'Alice Johnson', email: 'alice@example.com', phone: '555-0101', company: 'Alice Co.',     customerGroupId: retail.id,     organizationId: orgId }, { transaction: t }),
      Customer.create({ code: 'CUS-0002', name: 'Bob Smith',     email: 'bob@example.com',   phone: '555-0102', company: 'Smith Ltd.',    customerGroupId: retail.id,     organizationId: orgId }, { transaction: t }),
      Customer.create({ code: 'CUS-0003', name: 'Carol Davis',   email: 'carol@example.com', phone: '555-0103', company: 'Davis Corp.',   customerGroupId: wholesale.id,  organizationId: orgId }, { transaction: t }),
      Customer.create({ code: 'CUS-0004', name: 'David Lee',     email: 'david@example.com', phone: '555-0104', company: 'Lee Group',     customerGroupId: wholesale.id,  organizationId: orgId }, { transaction: t }),
      Customer.create({ code: 'CUS-0005', name: 'Eva Martinez',  email: 'eva@example.com',   phone: '555-0105', company: 'Martinez Inc.', customerGroupId: retail.id,     organizationId: orgId }, { transaction: t }),
    ])

    // ── Vendors ───────────────────────────────────────────────────────────────
    const [vTech, vFood, vOffice] = await Promise.all([
      Vendor.create({ code: 'VND-0001', name: 'TechSource Global',  contactPerson: 'Tom Wu',      email: 'tom@techsource.com',      phone: '555-0201', vendorTypes: ['Supplier'],                     createdBy: userId, organizationId: orgId }, { transaction: t }),
      Vendor.create({ code: 'VND-0002', name: 'FoodLink Supplies',  contactPerson: 'Sara Kim',    email: 'sara@foodlink.com',        phone: '555-0202', vendorTypes: ['Supplier'],                     createdBy: userId, organizationId: orgId }, { transaction: t }),
      Vendor.create({ code: 'VND-0003', name: 'OfficeWorld Dist.',  contactPerson: 'James Park',  email: 'james@officeworld.com',    phone: '555-0203', vendorTypes: ['Supplier'],                     createdBy: userId, organizationId: orgId }, { transaction: t }),
      Vendor.create({ code: 'VND-0004', name: 'CleanPro Services',  contactPerson: 'Linda Ho',    email: 'linda@cleanpro.com',       phone: '555-0204', vendorTypes: ['Service Provider'],             createdBy: userId, organizationId: orgId }, { transaction: t }),
      Vendor.create({ code: 'VND-0005', name: 'SwiftLogistics Co.', contactPerson: 'Mark Tan',    email: 'mark@swiftlogistics.com',  phone: '555-0205', vendorTypes: ['Service Provider'],             createdBy: userId, organizationId: orgId }, { transaction: t }),
      Vendor.create({ code: 'VND-0006', name: 'UniTrade Partners',  contactPerson: 'Nora Lim',    email: 'nora@unitrade.com',        phone: '555-0206', vendorTypes: ['Supplier', 'Service Provider'], createdBy: userId, organizationId: orgId }, { transaction: t }),
    ])

    // ── Stores ────────────────────────────────────────────────────────────────
    const [mainWhs, northBranch] = await Promise.all([
      Store.create({ code: 'WHS-0001', name: 'Main Warehouse', address: '100 Industrial Rd, City', createdBy: userId, organizationId: orgId }, { transaction: t }),
      Store.create({ code: 'WHS-0002', name: 'North Branch',   address: '45 North Ave, City',      createdBy: userId, organizationId: orgId }, { transaction: t }),
    ])

    // ── Store Stock ───────────────────────────────────────────────────────────
    await Promise.all([
      // Main Warehouse
      StoreStock.create({ productId: pMouse.id,    storeId: mainWhs.id, stock: 130 }, { transaction: t }),
      StoreStock.create({ productId: pHub.id,      storeId: mainWhs.id, stock: 75  }, { transaction: t }),
      StoreStock.create({ productId: pKeyboard.id, storeId: mainWhs.id, stock: 55  }, { transaction: t }),
      StoreStock.create({ productId: pWater.id,    storeId: mainWhs.id, stock: 500 }, { transaction: t }),
      StoreStock.create({ productId: pCoffee.id,   storeId: mainWhs.id, stock: 200 }, { transaction: t }),
      StoreStock.create({ productId: pPaper.id,    storeId: mainWhs.id, stock: 280 }, { transaction: t }),
      StoreStock.create({ productId: pPen.id,      storeId: mainWhs.id, stock: 950 }, { transaction: t }),
      // North Branch
      StoreStock.create({ productId: pMouse.id,    storeId: northBranch.id, stock: 20  }, { transaction: t }),
      StoreStock.create({ productId: pHub.id,      storeId: northBranch.id, stock: 5   }, { transaction: t }),
      StoreStock.create({ productId: pKeyboard.id, storeId: northBranch.id, stock: 5   }, { transaction: t }),
      StoreStock.create({ productId: pPaper.id,    storeId: northBranch.id, stock: 20  }, { transaction: t }),
      StoreStock.create({ productId: pPen.id,      storeId: northBranch.id, stock: 50  }, { transaction: t }),
    ])

    // ── Sale Items ────────────────────────────────────────────────────────────
    const [siMouse, siHub, siKeyboard, siWater, siCoffee, siPaper, siPen] = await Promise.all([
      SaleItem.create({ code: 'SI-0001', name: 'Wireless Mouse',      productId: pMouse.id,    status: 'active', createdBy: userId, organizationId: orgId }, { transaction: t }),
      SaleItem.create({ code: 'SI-0002', name: 'USB-C Hub',           productId: pHub.id,      status: 'active', createdBy: userId, organizationId: orgId }, { transaction: t }),
      SaleItem.create({ code: 'SI-0003', name: 'Mechanical Keyboard', productId: pKeyboard.id, status: 'active', createdBy: userId, organizationId: orgId }, { transaction: t }),
      SaleItem.create({ code: 'SI-0004', name: 'Mineral Water 1L',    productId: pWater.id,    status: 'active', createdBy: userId, organizationId: orgId }, { transaction: t }),
      SaleItem.create({ code: 'SI-0005', name: 'Arabica Coffee',      productId: pCoffee.id,   status: 'active', createdBy: userId, organizationId: orgId }, { transaction: t }),
      SaleItem.create({ code: 'SI-0006', name: 'A4 Paper Ream',       productId: pPaper.id,    status: 'active', createdBy: userId, organizationId: orgId }, { transaction: t }),
      SaleItem.create({ code: 'SI-0007', name: 'Ballpoint Pen',       productId: pPen.id,      status: 'active', createdBy: userId, organizationId: orgId }, { transaction: t }),
    ])

    // ── Price Lists ───────────────────────────────────────────────────────────
    await Promise.all([
      // Retail (standard) prices
      Pricing.create({ code: 'PRC-R001', name: 'Wireless Mouse — Retail',      saleItemId: siMouse.id,    customerGroupId: retail.id,     unitPrice: 29.99, currency: 'USD', activeFrom: '2026-01-01', status: 'active', createdBy: userId, organizationId: orgId }, { transaction: t }),
      Pricing.create({ code: 'PRC-R002', name: 'USB-C Hub — Retail',           saleItemId: siHub.id,      customerGroupId: retail.id,     unitPrice: 49.99, currency: 'USD', activeFrom: '2026-01-01', status: 'active', createdBy: userId, organizationId: orgId }, { transaction: t }),
      Pricing.create({ code: 'PRC-R003', name: 'Mechanical Keyboard — Retail', saleItemId: siKeyboard.id, customerGroupId: retail.id,     unitPrice: 89.99, currency: 'USD', activeFrom: '2026-01-01', status: 'active', createdBy: userId, organizationId: orgId }, { transaction: t }),
      Pricing.create({ code: 'PRC-R004', name: 'A4 Paper — Retail',            saleItemId: siPaper.id,    customerGroupId: retail.id,     unitPrice: 5.99,  currency: 'USD', activeFrom: '2026-01-01', status: 'active', createdBy: userId, organizationId: orgId }, { transaction: t }),
      Pricing.create({ code: 'PRC-R005', name: 'Ballpoint Pen — Retail',       saleItemId: siPen.id,      customerGroupId: retail.id,     unitPrice: 1.50,  currency: 'USD', activeFrom: '2026-01-01', status: 'active', createdBy: userId, organizationId: orgId }, { transaction: t }),
      // Wholesale prices
      Pricing.create({ code: 'PRC-W001', name: 'Wireless Mouse — Wholesale',      saleItemId: siMouse.id,    customerGroupId: wholesale.id, unitPrice: 24.99, currency: 'USD', activeFrom: '2026-01-01', status: 'active', createdBy: userId, organizationId: orgId }, { transaction: t }),
      Pricing.create({ code: 'PRC-W002', name: 'USB-C Hub — Wholesale',           saleItemId: siHub.id,      customerGroupId: wholesale.id, unitPrice: 42.99, currency: 'USD', activeFrom: '2026-01-01', status: 'active', createdBy: userId, organizationId: orgId }, { transaction: t }),
      Pricing.create({ code: 'PRC-W003', name: 'Mechanical Keyboard — Wholesale', saleItemId: siKeyboard.id, customerGroupId: wholesale.id, unitPrice: 74.99, currency: 'USD', activeFrom: '2026-01-01', status: 'active', createdBy: userId, organizationId: orgId }, { transaction: t }),
      Pricing.create({ code: 'PRC-W004', name: 'A4 Paper — Wholesale',            saleItemId: siPaper.id,    customerGroupId: wholesale.id, unitPrice: 4.50,  currency: 'USD', activeFrom: '2026-01-01', status: 'active', createdBy: userId, organizationId: orgId }, { transaction: t }),
      Pricing.create({ code: 'PRC-W005', name: 'Ballpoint Pen — Wholesale',       saleItemId: siPen.id,      customerGroupId: wholesale.id, unitPrice: 1.10,  currency: 'USD', activeFrom: '2026-01-01', status: 'active', createdBy: userId, organizationId: orgId }, { transaction: t }),
    ])

    // ── Master Data ───────────────────────────────────────────────────────────
    const mdDefs = [
      {
        slug: `payment-terms-${orgId}`, name: 'Payment Terms', description: 'Customer & vendor payment term options',
        values: [
          { code: 'PT-001', name: 'Cash on Delivery', sortOrder: 1 },
          { code: 'PT-002', name: 'Net 15 Days',       sortOrder: 2 },
          { code: 'PT-003', name: 'Net 30 Days',       sortOrder: 3 },
          { code: 'PT-004', name: 'Net 60 Days',       sortOrder: 4 },
          { code: 'PT-005', name: 'Advance Payment',   sortOrder: 5 },
        ],
      },
      {
        slug: `payment-methods-${orgId}`, name: 'Payment Methods', description: 'Accepted payment methods',
        values: [
          { code: 'PM-001', name: 'Cash',           sortOrder: 1 },
          { code: 'PM-002', name: 'Bank Transfer',  sortOrder: 2 },
          { code: 'PM-003', name: 'Credit Card',    sortOrder: 3 },
          { code: 'PM-004', name: 'Cheque',         sortOrder: 4 },
          { code: 'PM-005', name: 'Online Payment', sortOrder: 5 },
        ],
      },
      {
        slug: `shipping-methods-${orgId}`, name: 'Shipping Methods', description: 'Delivery & shipping options',
        values: [
          { code: 'SH-001', name: 'Standard Delivery', sortOrder: 1 },
          { code: 'SH-002', name: 'Express Delivery',  sortOrder: 2 },
          { code: 'SH-003', name: 'Self Pickup',       sortOrder: 3 },
          { code: 'SH-004', name: 'Courier',           sortOrder: 4 },
        ],
      },
      {
        slug: `business-types-${orgId}`, name: 'Business Types', description: 'Customer & vendor business classification',
        values: [
          { code: 'BT-001', name: 'Retail',           sortOrder: 1 },
          { code: 'BT-002', name: 'Wholesale',        sortOrder: 2 },
          { code: 'BT-003', name: 'Manufacturer',     sortOrder: 3 },
          { code: 'BT-004', name: 'Service Provider', sortOrder: 4 },
          { code: 'BT-005', name: 'Distributor',      sortOrder: 5 },
        ],
      },
      {
        slug: `tax-types-${orgId}`, name: 'Tax Types', description: 'Tax rate classifications',
        values: [
          { code: 'TX-001', name: 'VAT 7%',             sortOrder: 1 },
          { code: 'TX-002', name: 'VAT 0%',             sortOrder: 2 },
          { code: 'TX-003', name: 'Tax Exempt',         sortOrder: 3 },
          { code: 'TX-004', name: 'Withholding Tax 3%', sortOrder: 4 },
        ],
      },
      {
        slug: `title-prefix-${orgId}`, name: 'Title / Name Prefix', description: 'Personal titles and name prefixes',
        values: [
          { code: 'TL-001', name: 'Mr.',   sortOrder: 1 },
          { code: 'TL-002', name: 'Mrs.',  sortOrder: 2 },
          { code: 'TL-003', name: 'Ms.',   sortOrder: 3 },
          { code: 'TL-004', name: 'Dr.',   sortOrder: 4 },
          { code: 'TL-005', name: 'Prof.', sortOrder: 5 },
        ],
      },
      {
        slug: `gender-${orgId}`, name: 'Gender', description: 'Gender options for employee records',
        values: [
          { code: 'GD-001', name: 'Male',          sortOrder: 1 },
          { code: 'GD-002', name: 'Female',        sortOrder: 2 },
          { code: 'GD-003', name: 'Not Specified', sortOrder: 3 },
        ],
      },
      {
        slug: `leave-types-${orgId}`, name: 'Leave Types', description: 'Employee leave type classifications',
        values: [
          { code: 'LV-001', name: 'Annual Leave',    sortOrder: 1 },
          { code: 'LV-002', name: 'Sick Leave',      sortOrder: 2 },
          { code: 'LV-003', name: 'Maternity Leave', sortOrder: 3 },
          { code: 'LV-004', name: 'Personal Leave',  sortOrder: 4 },
          { code: 'LV-005', name: 'Unpaid Leave',    sortOrder: 5 },
        ],
      },
      {
        slug: `account-types-${orgId}`, name: 'Account Types', description: 'Chart of accounts classification types',
        values: [
          { code: 'asset',     name: 'Asset',     sortOrder: 1 },
          { code: 'liability', name: 'Liability', sortOrder: 2 },
          { code: 'equity',    name: 'Equity',    sortOrder: 3 },
          { code: 'revenue',   name: 'Revenue',   sortOrder: 4 },
          { code: 'expense',   name: 'Expense',   sortOrder: 5 },
        ],
      },
      {
        slug: `vendor-types-${orgId}`, name: 'Vendor Types', description: 'Vendor classification types',
        values: [
          { code: 'VT-001', name: 'Supplier',         sortOrder: 1 },
          { code: 'VT-002', name: 'Service Provider',  sortOrder: 2 },
        ],
      },
    ]
    for (const def of mdDefs) {
      const cat = await MasterDataCategory.create(
        { slug: def.slug, name: def.name, description: def.description, organizationId: orgId, createdBy: userId },
        { transaction: t },
      )
      await Promise.all(def.values.map(v =>
        MasterDataValue.create({ ...v, categoryId: cat.id, organizationId: orgId, createdBy: userId }, { transaction: t }),
      ))
    }

    // ── Departments ───────────────────────────────────────────────────────────
    const [deptIT, deptSales, deptHR, deptFinance, deptOps] = await Promise.all([
      Department.create({ code: 'DEPT-001', name: 'IT',         description: 'Information Technology',  organizationId: orgId, createdBy: userId }, { transaction: t }),
      Department.create({ code: 'DEPT-002', name: 'Sales',      description: 'Sales & Business Dev',    organizationId: orgId, createdBy: userId }, { transaction: t }),
      Department.create({ code: 'DEPT-003', name: 'HR',         description: 'Human Resources',         organizationId: orgId, createdBy: userId }, { transaction: t }),
      Department.create({ code: 'DEPT-004', name: 'Finance',    description: 'Finance & Accounting',    organizationId: orgId, createdBy: userId }, { transaction: t }),
      Department.create({ code: 'DEPT-005', name: 'Operations', description: 'Operations & Logistics',  organizationId: orgId, createdBy: userId }, { transaction: t }),
    ])

    // ── Employees ─────────────────────────────────────────────────────────────
    const empData = [
      { employeeCode: 'EMP-001', firstName: 'John',  lastName: 'Smith',    position: 'Software Engineer', startDate: '2022-01-10', dept: deptIT },
      { employeeCode: 'EMP-002', firstName: 'Jane',  lastName: 'Doe',      position: 'Sales Manager',     startDate: '2021-03-15', dept: deptSales },
      { employeeCode: 'EMP-003', firstName: 'Mike',  lastName: 'Johnson',  position: 'HR Officer',        startDate: '2022-06-01', dept: deptHR },
      { employeeCode: 'EMP-004', firstName: 'Sarah', lastName: 'Williams', position: 'Accountant',        startDate: '2020-09-20', dept: deptFinance },
      { employeeCode: 'EMP-005', firstName: 'Tom',   lastName: 'Brown',    position: 'Operations Lead',   startDate: '2021-11-05', dept: deptOps },
    ]
    for (const e of empData) {
      const emp = await Employee.create(
        { employeeCode: e.employeeCode, firstName: e.firstName, lastName: e.lastName,
          position: e.position, startDate: e.startDate, status: 'active',
          organizationId: orgId, createdBy: userId },
        { transaction: t },
      )
      await emp.setDepartments([e.dept.id], { transaction: t })
    }

    // ── Chart of Accounts ─────────────────────────────────────────────────────
    const coaDefs = [
      { code: '1000', name: 'Assets',                  accountType: 'asset',     normalBalance: 'debit',  parentCode: null },
      { code: '1100', name: 'Current Assets',           accountType: 'asset',     normalBalance: 'debit',  parentCode: '1000' },
      { code: '1110', name: 'Cash',                     accountType: 'asset',     normalBalance: 'debit',  parentCode: '1100' },
      { code: '1120', name: 'Bank Account',             accountType: 'asset',     normalBalance: 'debit',  parentCode: '1100' },
      { code: '1130', name: 'Accounts Receivable',      accountType: 'asset',     normalBalance: 'debit',  parentCode: '1100' },
      { code: '1140', name: 'Inventory',                accountType: 'asset',     normalBalance: 'debit',  parentCode: '1100' },
      { code: '1150', name: 'Prepaid Expenses',         accountType: 'asset',     normalBalance: 'debit',  parentCode: '1100' },
      { code: '1160', name: 'Input Tax (VAT)',          accountType: 'asset',     normalBalance: 'debit',  parentCode: '1100' },
      { code: '1200', name: 'Fixed Assets',             accountType: 'asset',     normalBalance: 'debit',  parentCode: '1000' },
      { code: '1210', name: 'Property & Equipment',     accountType: 'asset',     normalBalance: 'debit',  parentCode: '1200' },
      { code: '1220', name: 'Accumulated Depreciation', accountType: 'asset',     normalBalance: 'credit', parentCode: '1200' },
      { code: '2000', name: 'Liabilities',              accountType: 'liability', normalBalance: 'credit', parentCode: null },
      { code: '2100', name: 'Current Liabilities',      accountType: 'liability', normalBalance: 'credit', parentCode: '2000' },
      { code: '2110', name: 'Accounts Payable',         accountType: 'liability', normalBalance: 'credit', parentCode: '2100' },
      { code: '2120', name: 'Accrued Expenses',         accountType: 'liability', normalBalance: 'credit', parentCode: '2100' },
      { code: '2130', name: 'Short-term Loans',         accountType: 'liability', normalBalance: 'credit', parentCode: '2100' },
      { code: '2140', name: 'Output Tax (VAT)',         accountType: 'liability', normalBalance: 'credit', parentCode: '2100' },
      { code: '2200', name: 'Long-term Liabilities',    accountType: 'liability', normalBalance: 'credit', parentCode: '2000' },
      { code: '2210', name: 'Long-term Loans',          accountType: 'liability', normalBalance: 'credit', parentCode: '2200' },
      { code: '3000', name: 'Equity',                   accountType: 'equity',    normalBalance: 'credit', parentCode: null },
      { code: '3100', name: "Owner's Equity",           accountType: 'equity',    normalBalance: 'credit', parentCode: '3000' },
      { code: '3110', name: 'Share Capital',            accountType: 'equity',    normalBalance: 'credit', parentCode: '3100' },
      { code: '3120', name: 'Retained Earnings',        accountType: 'equity',    normalBalance: 'credit', parentCode: '3100' },
      { code: '3130', name: 'Current Year Profit/Loss', accountType: 'equity',    normalBalance: 'credit', parentCode: '3100' },
      { code: '4000', name: 'Revenue',                  accountType: 'revenue',   normalBalance: 'credit', parentCode: null },
      { code: '4100', name: 'Sales Revenue',            accountType: 'revenue',   normalBalance: 'credit', parentCode: '4000' },
      { code: '4110', name: 'Product Sales',            accountType: 'revenue',   normalBalance: 'credit', parentCode: '4100' },
      { code: '4120', name: 'Service Revenue',          accountType: 'revenue',   normalBalance: 'credit', parentCode: '4100' },
      { code: '4200', name: 'Other Revenue',            accountType: 'revenue',   normalBalance: 'credit', parentCode: '4000' },
      { code: '4210', name: 'Interest Income',          accountType: 'revenue',   normalBalance: 'credit', parentCode: '4200' },
      { code: '4220', name: 'Other Income',             accountType: 'revenue',   normalBalance: 'credit', parentCode: '4200' },
      { code: '5000', name: 'Expenses',                 accountType: 'expense',   normalBalance: 'debit',  parentCode: null },
      { code: '5100', name: 'Cost of Sales',            accountType: 'expense',   normalBalance: 'debit',  parentCode: '5000' },
      { code: '5110', name: 'Cost of Goods Sold',       accountType: 'expense',   normalBalance: 'debit',  parentCode: '5100' },
      { code: '5200', name: 'Operating Expenses',       accountType: 'expense',   normalBalance: 'debit',  parentCode: '5000' },
      { code: '5210', name: 'Salary Expense',           accountType: 'expense',   normalBalance: 'debit',  parentCode: '5200' },
      { code: '5220', name: 'Rent Expense',             accountType: 'expense',   normalBalance: 'debit',  parentCode: '5200' },
      { code: '5230', name: 'Utilities Expense',        accountType: 'expense',   normalBalance: 'debit',  parentCode: '5200' },
      { code: '5240', name: 'Marketing & Advertising',  accountType: 'expense',   normalBalance: 'debit',  parentCode: '5200' },
      { code: '5250', name: 'Depreciation Expense',     accountType: 'expense',   normalBalance: 'debit',  parentCode: '5200' },
      { code: '5300', name: 'Financial Expenses',       accountType: 'expense',   normalBalance: 'debit',  parentCode: '5000' },
      { code: '5310', name: 'Interest Expense',         accountType: 'expense',   normalBalance: 'debit',  parentCode: '5300' },
      { code: '5320', name: 'Bank Charges',             accountType: 'expense',   normalBalance: 'debit',  parentCode: '5300' },
    ]
    const coaMap = {}
    for (const def of coaDefs) {
      const parentId = def.parentCode ? coaMap[def.parentCode]?.id || null : null
      const level    = parentId ? (coaMap[def.parentCode]?.level || 1) + 1 : 1
      const acc = await ChartOfAccount.create(
        { code: def.code, name: def.name, accountType: def.accountType, normalBalance: def.normalBalance,
          parentId, level, status: 'active', organizationId: orgId, createdBy: userId },
        { transaction: t },
      )
      coaMap[def.code] = acc
    }

    // ── Fiscal Years ──────────────────────────────────────────────────────────
    await Promise.all([
      FiscalYear.create(
        { name: 'FY2025', startDate: '2025-01-01', endDate: '2025-12-31',
          status: 'closed', notes: 'Closed at year end', organizationId: orgId, createdBy: userId },
        { transaction: t },
      ),
      FiscalYear.create(
        { name: 'FY2026', startDate: '2026-01-01', endDate: '2026-12-31',
          status: 'open', organizationId: orgId, createdBy: userId },
        { transaction: t },
      ),
    ])

    // ── Quotations ────────────────────────────────────────────────────────────
    const qt1 = await Quotation.create(
      { refNo: 'QT-2026-0001', customerId: cCarol.id,
        quotationDate: '2026-04-10', validUntil: '2026-04-25',
        subtotal: 279.96, taxRate: 7, tax: 19.60, total: 299.56,
        notes: 'Bulk order for office IT equipment', status: 'accepted',
        organizationId: orgId, createdBy: userId },
      { transaction: t },
    )
    await Promise.all([
      QuotationItem.create({ quotationId: qt1.id, productId: pKeyboard.id, productName: 'Mechanical Keyboard', qty: 2, unitPrice: 89.99, discount: 0, total: 179.98, organizationId: orgId }, { transaction: t }),
      QuotationItem.create({ quotationId: qt1.id, productId: pHub.id,      productName: 'USB-C Hub',           qty: 2, unitPrice: 49.99, discount: 0, total: 99.98,  organizationId: orgId }, { transaction: t }),
    ])

    const qt2 = await Quotation.create(
      { refNo: 'QT-2026-0002', customerId: cDavid.id,
        quotationDate: '2026-04-22', validUntil: '2026-05-06',
        subtotal: 179.82, taxRate: 7, tax: 12.59, total: 192.41,
        notes: 'Monthly office supplies', status: 'sent',
        organizationId: orgId, createdBy: userId },
      { transaction: t },
    )
    await Promise.all([
      QuotationItem.create({ quotationId: qt2.id, productId: pMouse.id, productName: 'Wireless Mouse', qty: 3, unitPrice: 29.99, discount: 0, total: 89.97, organizationId: orgId }, { transaction: t }),
      QuotationItem.create({ quotationId: qt2.id, productId: pPaper.id, productName: 'A4 Paper Ream',  qty: 15, unitPrice: 5.99, discount: 0, total: 89.85, organizationId: orgId }, { transaction: t }),
    ])

    const qt3 = await Quotation.create(
      { refNo: 'QT-2026-0003', customerId: cEva.id,
        quotationDate: '2026-05-02', validUntil: '2026-05-16',
        subtotal: 74.99, taxRate: 7, tax: 5.25, total: 80.24,
        notes: 'Quick supply run', status: 'draft',
        organizationId: orgId, createdBy: userId },
      { transaction: t },
    )
    await Promise.all([
      QuotationItem.create({ quotationId: qt3.id, productId: pMouse.id, productName: 'Wireless Mouse', qty: 1, unitPrice: 29.99, discount: 0, total: 29.99, organizationId: orgId }, { transaction: t }),
      QuotationItem.create({ quotationId: qt3.id, productId: pPen.id,   productName: 'Ballpoint Pen',  qty: 30, unitPrice: 1.50, discount: 0, total: 45.00, organizationId: orgId }, { transaction: t }),
    ])

    // ── Sales Orders ──────────────────────────────────────────────────────────
    const so1 = await Order.create(
      { orderNumber: 'SO-2026-0001', customerId: cCarol.id,
        orderDate: '2026-04-12', status: 'delivered',
        subtotal: 279.96, tax: 19.60, total: 299.56,
        notes: 'Converted from QT-2026-0001', organizationId: orgId, createdBy: userId },
      { transaction: t },
    )
    await Promise.all([
      SalesOrderItem.create({ orderId: so1.id, productId: pKeyboard.id, productName: 'Mechanical Keyboard', quantity: 2, unitPrice: 89.99, total: 179.98, organizationId: orgId }, { transaction: t }),
      SalesOrderItem.create({ orderId: so1.id, productId: pHub.id,      productName: 'USB-C Hub',           quantity: 2, unitPrice: 49.99, total: 99.98,  organizationId: orgId }, { transaction: t }),
    ])

    const so2 = await Order.create(
      { orderNumber: 'SO-2026-0002', customerId: cBob.id,
        orderDate: '2026-04-28', status: 'confirmed',
        subtotal: 179.96, tax: 12.60, total: 192.56,
        notes: '', organizationId: orgId, createdBy: userId },
      { transaction: t },
    )
    await Promise.all([
      SalesOrderItem.create({ orderId: so2.id, productId: pMouse.id,    productName: 'Wireless Mouse',      quantity: 3, unitPrice: 29.99, total: 89.97, organizationId: orgId }, { transaction: t }),
      SalesOrderItem.create({ orderId: so2.id, productId: pKeyboard.id, productName: 'Mechanical Keyboard', quantity: 1, unitPrice: 89.99, total: 89.99, organizationId: orgId }, { transaction: t }),
    ])

    const so3 = await Order.create(
      { orderNumber: 'SO-2026-0003', customerId: cAlice.id,
        orderDate: '2026-05-05', status: 'draft',
        subtotal: 99.98, tax: 7.00, total: 106.98,
        notes: 'Pending review', organizationId: orgId, createdBy: userId },
      { transaction: t },
    )
    await SalesOrderItem.create(
      { orderId: so3.id, productId: pHub.id, productName: 'USB-C Hub', quantity: 2, unitPrice: 49.99, total: 99.98, organizationId: orgId },
      { transaction: t },
    )

    // ── Delivery Orders ───────────────────────────────────────────────────────
    const do1 = await DeliveryOrder.create(
      { refNo: 'DO-2026-0001', date: '2026-04-14', deliveryDate: '2026-04-17',
        orderId: so1.id, customerId: cCarol.id,
        address: '88 Commerce Park, Bangkok 10120',
        notes: 'Fragile — handle with care', status: 'delivered',
        organizationId: orgId, createdBy: userId },
      { transaction: t },
    )
    await Promise.all([
      DeliveryOrderItem.create({ deliveryOrderId: do1.id, productId: pKeyboard.id, productName: 'Mechanical Keyboard', qty: 2, organizationId: orgId }, { transaction: t }),
      DeliveryOrderItem.create({ deliveryOrderId: do1.id, productId: pHub.id,      productName: 'USB-C Hub',           qty: 2, organizationId: orgId }, { transaction: t }),
    ])

    const do2 = await DeliveryOrder.create(
      { refNo: 'DO-2026-0002', date: '2026-05-05', deliveryDate: null,
        orderId: so2.id, customerId: cBob.id,
        address: '21 Smith Avenue, Bangkok 10110',
        notes: '', status: 'confirmed',
        organizationId: orgId, createdBy: userId },
      { transaction: t },
    )
    await Promise.all([
      DeliveryOrderItem.create({ deliveryOrderId: do2.id, productId: pMouse.id,    productName: 'Wireless Mouse',      qty: 3, organizationId: orgId }, { transaction: t }),
      DeliveryOrderItem.create({ deliveryOrderId: do2.id, productId: pKeyboard.id, productName: 'Mechanical Keyboard', qty: 1, organizationId: orgId }, { transaction: t }),
    ])

    const do3 = await DeliveryOrder.create(
      { refNo: 'DO-2026-0003', date: '2026-05-08', deliveryDate: null,
        customerId: cAlice.id,
        address: null, notes: 'Pending address confirmation', status: 'draft',
        organizationId: orgId, createdBy: userId },
      { transaction: t },
    )
    await DeliveryOrderItem.create(
      { deliveryOrderId: do3.id, productId: pHub.id, productName: 'USB-C Hub', qty: 2, organizationId: orgId },
      { transaction: t },
    )

    // ── Invoices ──────────────────────────────────────────────────────────────
    const inv1 = await Invoice.create(
      { invoiceNumber: 'INV-2026-0001', customerId: cAlice.id,
        invoiceDate: '2026-04-15', dueDate: '2026-05-15',
        subtotal: 299.90, tax: 20.99, total: 320.89,
        status: 'sent', organizationId: orgId, createdBy: userId },
      { transaction: t },
    )
    await Promise.all([
      InvoiceItem.create({ invoiceId: inv1.id, productName: 'Wireless Mouse',      quantity: 3, unitPrice: 29.99, total: 89.97,  organizationId: orgId }, { transaction: t }),
      InvoiceItem.create({ invoiceId: inv1.id, productName: 'Mechanical Keyboard', quantity: 2, unitPrice: 89.99, total: 179.98, organizationId: orgId }, { transaction: t }),
      InvoiceItem.create({ invoiceId: inv1.id, productName: 'A4 Paper Ream',       quantity: 5, unitPrice: 5.99,  total: 29.95,  organizationId: orgId }, { transaction: t }),
    ])

    const inv2 = await Invoice.create(
      { invoiceNumber: 'INV-2026-0002', customerId: cAlice.id,
        invoiceDate: '2026-04-28', dueDate: '2026-05-28',
        subtotal: 49.99, tax: 3.50, total: 53.49,
        status: 'sent', organizationId: orgId, createdBy: userId },
      { transaction: t },
    )
    await InvoiceItem.create(
      { invoiceId: inv2.id, productName: 'USB-C Hub', quantity: 1, unitPrice: 49.99, total: 49.99, organizationId: orgId },
      { transaction: t },
    )

    const inv3 = await Invoice.create(
      { invoiceNumber: 'INV-2026-0003', customerId: cCarol.id,
        invoiceDate: '2026-04-14', dueDate: '2026-04-29',
        subtotal: 279.96, tax: 19.60, total: 299.56,
        status: 'paid', organizationId: orgId, createdBy: userId },
      { transaction: t },
    )
    await Promise.all([
      InvoiceItem.create({ invoiceId: inv3.id, productName: 'Mechanical Keyboard', quantity: 2, unitPrice: 89.99, total: 179.98, organizationId: orgId }, { transaction: t }),
      InvoiceItem.create({ invoiceId: inv3.id, productName: 'USB-C Hub',           quantity: 2, unitPrice: 49.99, total: 99.98,  organizationId: orgId }, { transaction: t }),
    ])

    const inv4 = await Invoice.create(
      { invoiceNumber: 'INV-2026-0004', customerId: cBob.id,
        invoiceDate: '2026-05-06', dueDate: '2026-05-21',
        subtotal: 179.96, tax: 12.60, total: 192.56,
        status: 'draft', organizationId: orgId, createdBy: userId },
      { transaction: t },
    )
    await Promise.all([
      InvoiceItem.create({ invoiceId: inv4.id, productName: 'Wireless Mouse',      quantity: 3, unitPrice: 29.99, total: 89.97, organizationId: orgId }, { transaction: t }),
      InvoiceItem.create({ invoiceId: inv4.id, productName: 'Mechanical Keyboard', quantity: 1, unitPrice: 89.99, total: 89.99, organizationId: orgId }, { transaction: t }),
    ])

    const inv5 = await Invoice.create(
      { invoiceNumber: 'INV-2026-0005', customerId: cDavid.id,
        invoiceDate: '2026-05-02', dueDate: '2026-06-01',
        subtotal: 179.82, tax: 12.59, total: 192.41,
        status: 'sent', organizationId: orgId, createdBy: userId },
      { transaction: t },
    )
    await Promise.all([
      InvoiceItem.create({ invoiceId: inv5.id, productName: 'Wireless Mouse', quantity: 3, unitPrice: 29.99, total: 89.97, organizationId: orgId }, { transaction: t }),
      InvoiceItem.create({ invoiceId: inv5.id, productName: 'A4 Paper Ream',  quantity: 15, unitPrice: 5.99, total: 89.85, organizationId: orgId }, { transaction: t }),
    ])

    // ── Receipts ──────────────────────────────────────────────────────────────
    await Receipt.create(
      { receiptNumber: 'RCT-2026-0001', customerId: cCarol.id, invoiceId: inv3.id,
        receiptDate: '2026-04-25', paymentMethod: 'bank_transfer',
        amount: Number(inv3.total), reference: 'TXN-20260425-001',
        status: 'confirmed', notes: 'Full payment for INV-2026-0003',
        organizationId: orgId, createdBy: userId },
      { transaction: t },
    )
    await Receipt.create(
      { receiptNumber: 'RCT-2026-0002', customerId: cAlice.id, invoiceId: inv2.id,
        receiptDate: '2026-05-10', paymentMethod: 'cash',
        amount: Number(inv2.total), reference: null,
        status: 'confirmed', notes: 'Cash payment received',
        organizationId: orgId, createdBy: userId },
      { transaction: t },
    )
    await Receipt.create(
      { receiptNumber: 'RCT-2026-0003', customerId: cBob.id, invoiceId: null,
        receiptDate: '2026-05-08', paymentMethod: 'credit_card',
        amount: 50.00, reference: 'CC-2026-0508',
        status: 'draft', notes: 'Advance deposit',
        organizationId: orgId, createdBy: userId },
      { transaction: t },
    )

    // ── Billing Note ──────────────────────────────────────────────────────────
    const bn1 = await BillingNote.create(
      { refNo: 'BN-2026-0001', date: '2026-05-01', dueDate: '2026-05-31',
        customerId: cAlice.id,
        notes: 'Combined billing for April purchases',
        total: Number(inv1.total) + Number(inv2.total),
        status: 'draft', organizationId: orgId, createdBy: userId },
      { transaction: t },
    )
    await Promise.all([
      BillingNoteInvoice.create({ billingNoteId: bn1.id, invoiceId: inv1.id, amount: Number(inv1.total), organizationId: orgId }, { transaction: t }),
      BillingNoteInvoice.create({ billingNoteId: bn1.id, invoiceId: inv2.id, amount: Number(inv2.total), organizationId: orgId }, { transaction: t }),
    ])

    // ── Receive Payments ──────────────────────────────────────────────────────
    const rcp1 = await ReceivePayment.create(
      { refNo: 'RCP-2026-0001', date: '2026-04-25',
        customerId: cCarol.id,
        paymentMethod: 'Bank Transfer', reference: 'TXN-20260425-001',
        amount: Number(inv3.total),
        notes: 'Full payment received for INV-2026-0003',
        status: 'confirmed', organizationId: orgId, createdBy: userId },
      { transaction: t },
    )
    await ReceivePaymentInvoice.create(
      { receivePaymentId: rcp1.id, invoiceId: inv3.id, amount: Number(inv3.total), organizationId: orgId },
      { transaction: t },
    )
    const rcp2 = await ReceivePayment.create(
      { refNo: 'RCP-2026-0002', date: '2026-05-08',
        customerId: cAlice.id,
        paymentMethod: 'Cash', reference: null,
        amount: Number(inv2.total),
        notes: 'Cash payment received for INV-2026-0002 — pending confirmation',
        status: 'draft', organizationId: orgId, createdBy: userId },
      { transaction: t },
    )
    await ReceivePaymentInvoice.create(
      { receivePaymentId: rcp2.id, invoiceId: inv2.id, amount: Number(inv2.total), organizationId: orgId },
      { transaction: t },
    )

    // ── Debit Note + Credit Note ──────────────────────────────────────────────
    await DebitNote.create(
      { refNo: 'DN-2026-0001', date: '2026-05-03',
        customerId: cAlice.id, invoiceId: inv1.id,
        reason: 'Price correction — additional delivery charges not included',
        amount: 50.00, status: 'issued', organizationId: orgId, createdBy: userId },
      { transaction: t },
    )
    await CreditNote.create(
      { refNo: 'CN-2026-0001', date: '2026-05-07',
        customerId: cCarol.id, invoiceId: inv3.id,
        reason: 'Returned goods — one Mechanical Keyboard faulty unit',
        amount: 89.99, status: 'draft', organizationId: orgId, createdBy: userId },
      { transaction: t },
    )

    // ── Purchase Requisitions ─────────────────────────────────────────────────
    const pr1 = await PurchaseRequisition.create(
      { refNo: 'PR-2026-0001', date: '2026-04-28', requestedBy: 'Tom Brown', department: 'Operations',
        vendorId: vTech.id, notes: 'Restock electronics — stock running low', status: 'approved',
        organizationId: orgId, createdBy: userId },
      { transaction: t },
    )
    await Promise.all([
      PurchaseRequisitionItem.create({ requisitionId: pr1.id, productId: pMouse.id,    description: 'Wireless Mouse',   qty: 20, unitPrice: 12.00, organizationId: orgId }, { transaction: t }),
      PurchaseRequisitionItem.create({ requisitionId: pr1.id, productId: pHub.id,      description: 'USB-C Hub (bulk)', qty: 10, unitPrice: 20.00, organizationId: orgId }, { transaction: t }),
    ])
    const pr2 = await PurchaseRequisition.create(
      { refNo: 'PR-2026-0002', date: '2026-05-02', requestedBy: 'Mike Johnson', department: 'HR',
        vendorId: null, notes: 'Office supplies for new hires', status: 'draft',
        organizationId: orgId, createdBy: userId },
      { transaction: t },
    )
    await Promise.all([
      PurchaseRequisitionItem.create({ requisitionId: pr2.id, productId: pPaper.id, description: 'A4 Paper Ream',     qty: 20, unitPrice: 3.00,  organizationId: orgId }, { transaction: t }),
      PurchaseRequisitionItem.create({ requisitionId: pr2.id, productId: pPen.id,   description: 'Ballpoint Pen Box', qty: 10, unitPrice: 5.00,  organizationId: orgId }, { transaction: t }),
      PurchaseRequisitionItem.create({ requisitionId: pr2.id, productId: null,       description: 'Stapler',           qty: 5,  unitPrice: 12.00, organizationId: orgId }, { transaction: t }),
    ])

    // ── Purchase Orders ───────────────────────────────────────────────────────
    const po1 = await PurchaseOrder.create(
      { refNo: 'PO-2026-0001', date: '2026-04-30', deliveryDate: '2026-05-10',
        vendorId: vTech.id, requisitionId: pr1.id,
        notes: 'Follow-up from PR-2026-0001', status: 'confirmed',
        organizationId: orgId, createdBy: userId },
      { transaction: t },
    )
    await Promise.all([
      PurchaseOrderItem.create({ purchaseOrderId: po1.id, productId: pMouse.id, description: 'Wireless Mouse',   qty: 20, unitPrice: 12.00, organizationId: orgId }, { transaction: t }),
      PurchaseOrderItem.create({ purchaseOrderId: po1.id, productId: pHub.id,   description: 'USB-C Hub (bulk)', qty: 10, unitPrice: 20.00, organizationId: orgId }, { transaction: t }),
    ])
    const po2 = await PurchaseOrder.create(
      { refNo: 'PO-2026-0002', date: '2026-05-05', deliveryDate: null,
        vendorId: vOffice.id, notes: 'Office supplies restock', status: 'draft',
        organizationId: orgId, createdBy: userId },
      { transaction: t },
    )
    await Promise.all([
      PurchaseOrderItem.create({ purchaseOrderId: po2.id, productId: pPaper.id, description: 'A4 Paper Ream',  qty: 50, unitPrice: 3.00, organizationId: orgId }, { transaction: t }),
      PurchaseOrderItem.create({ purchaseOrderId: po2.id, productId: pPen.id,   description: 'Ballpoint Pen',  qty: 200, unitPrice: 0.50, organizationId: orgId }, { transaction: t }),
    ])

    // ── Goods Receive ─────────────────────────────────────────────────────────
    const gr1 = await GoodReceive.create(
      { refNo: 'GR-2026-0001', date: '2026-01-15', supplier: 'TechSource Global',
        storeId: mainWhs.id, docType: 'invoice', invoiceNo: 'INV-TS-20260115',
        invoiceDate: '2026-01-15', invoiceNetAmount: 640.00,
        notes: 'Q1 electronics restock', status: 'confirmed',
        organizationId: orgId, createdBy: userId },
      { transaction: t },
    )
    await Promise.all([
      GoodReceiveItem.create({ goodReceiveId: gr1.id, productId: pMouse.id,    qty: 20, cost: 12.00, wac: 12.00, netAmount: 240.00, organizationId: orgId }, { transaction: t }),
      GoodReceiveItem.create({ goodReceiveId: gr1.id, productId: pHub.id,      qty: 10, cost: 20.00, wac: 20.00, netAmount: 200.00, organizationId: orgId }, { transaction: t }),
      GoodReceiveItem.create({ goodReceiveId: gr1.id, productId: pKeyboard.id, qty: 5,  cost: 40.00, wac: 40.00, netAmount: 200.00, organizationId: orgId }, { transaction: t }),
    ])

    const gr2 = await GoodReceive.create(
      { refNo: 'GR-2026-0002', date: '2026-02-10', supplier: 'FoodLink Supplies',
        storeId: mainWhs.id, docType: 'invoice', invoiceNo: 'INV-FL-20260210',
        invoiceDate: '2026-02-10', invoiceNetAmount: 290.00,
        notes: 'Food & beverage restock Feb', status: 'confirmed',
        organizationId: orgId, createdBy: userId },
      { transaction: t },
    )
    await Promise.all([
      GoodReceiveItem.create({ goodReceiveId: gr2.id, productId: pWater.id,  qty: 200, cost: 0.40, wac: 0.40, netAmount: 80.00,  organizationId: orgId }, { transaction: t }),
      GoodReceiveItem.create({ goodReceiveId: gr2.id, productId: pCoffee.id, qty: 30,  cost: 7.00, wac: 7.00, netAmount: 210.00, organizationId: orgId }, { transaction: t }),
    ])

    const gr3 = await GoodReceive.create(
      { refNo: 'GR-2026-0003', date: '2026-05-08', supplier: 'OfficeWorld Dist.',
        storeId: mainWhs.id, docType: 'invoice', invoiceNo: null,
        notes: 'Office supplies pending invoice', status: 'draft',
        organizationId: orgId, createdBy: userId },
      { transaction: t },
    )
    await Promise.all([
      GoodReceiveItem.create({ goodReceiveId: gr3.id, productId: pPaper.id, qty: 50, cost: 3.00, netAmount: 150.00, organizationId: orgId }, { transaction: t }),
      GoodReceiveItem.create({ goodReceiveId: gr3.id, productId: pPen.id,   qty: 200, cost: 0.50, netAmount: 100.00, organizationId: orgId }, { transaction: t }),
    ])

    // ── Stock Adjustments ─────────────────────────────────────────────────────
    const sa1 = await StockAdjust.create(
      { refNo: 'SA-2026-0001', date: '2026-02-20',
        storeId: mainWhs.id, reason: 'Cycle count correction',
        notes: 'Physical count variance — 5 extra mice found in back store',
        status: 'confirmed', organizationId: orgId, createdBy: userId },
      { transaction: t },
    )
    await StockAdjustItem.create(
      { stockAdjustId: sa1.id, productId: pMouse.id, qty: 5, organizationId: orgId },
      { transaction: t },
    )

    const sa2 = await StockAdjust.create(
      { refNo: 'SA-2026-0002', date: '2026-04-30',
        storeId: northBranch.id, reason: 'Physical count variance',
        notes: 'Keyboard count mismatch — needs review',
        status: 'draft', organizationId: orgId, createdBy: userId },
      { transaction: t },
    )
    await StockAdjustItem.create(
      { stockAdjustId: sa2.id, productId: pKeyboard.id, qty: -2, organizationId: orgId },
      { transaction: t },
    )

    // ── Stock Counts ──────────────────────────────────────────────────────────
    const sc1 = await StockCount.create(
      { refNo: 'SC-2026-0001', date: '2026-03-15',
        storeId: mainWhs.id, notes: 'Q1 full physical inventory count',
        status: 'confirmed', organizationId: orgId, createdBy: userId },
      { transaction: t },
    )
    await Promise.all([
      StockCountItem.create({ stockCountId: sc1.id, productId: pMouse.id,    systemQty: 145, countedQty: 145, organizationId: orgId }, { transaction: t }),
      StockCountItem.create({ stockCountId: sc1.id, productId: pHub.id,      systemQty: 80,  countedQty: 80,  organizationId: orgId }, { transaction: t }),
      StockCountItem.create({ stockCountId: sc1.id, productId: pKeyboard.id, systemQty: 60,  countedQty: 62,  organizationId: orgId }, { transaction: t }),
      StockCountItem.create({ stockCountId: sc1.id, productId: pWater.id,    systemQty: 500, countedQty: 498, organizationId: orgId }, { transaction: t }),
      StockCountItem.create({ stockCountId: sc1.id, productId: pPaper.id,    systemQty: 300, countedQty: 300, organizationId: orgId }, { transaction: t }),
    ])

    const sc2 = await StockCount.create(
      { refNo: 'SC-2026-0002', date: '2026-05-01',
        storeId: northBranch.id, notes: 'North Branch spot check',
        status: 'draft', organizationId: orgId, createdBy: userId },
      { transaction: t },
    )
    await Promise.all([
      StockCountItem.create({ stockCountId: sc2.id, productId: pMouse.id,    systemQty: 20, countedQty: 20, organizationId: orgId }, { transaction: t }),
      StockCountItem.create({ stockCountId: sc2.id, productId: pKeyboard.id, systemQty: 5,  countedQty: 5,  organizationId: orgId }, { transaction: t }),
    ])

    // ── Stock Transfers ───────────────────────────────────────────────────────
    const sr1 = await StockRequest.create(
      { refNo: 'SR-2026-0001', date: '2026-03-20',
        fromStoreId: mainWhs.id, toStoreId: northBranch.id,
        notes: 'North Branch restocking — mice and pens',
        status: 'confirmed', organizationId: orgId, createdBy: userId },
      { transaction: t },
    )
    await Promise.all([
      StockRequestItem.create({ stockRequestId: sr1.id, productId: pMouse.id, qty: 20, organizationId: orgId }, { transaction: t }),
      StockRequestItem.create({ stockRequestId: sr1.id, productId: pPen.id,   qty: 50, organizationId: orgId }, { transaction: t }),
    ])

    const sr2 = await StockRequest.create(
      { refNo: 'SR-2026-0002', date: '2026-05-06',
        fromStoreId: mainWhs.id, toStoreId: northBranch.id,
        notes: 'Supplementary transfer for keyboards',
        status: 'draft', organizationId: orgId, createdBy: userId },
      { transaction: t },
    )
    await StockRequestItem.create(
      { stockRequestId: sr2.id, productId: pKeyboard.id, qty: 5, organizationId: orgId },
      { transaction: t },
    )

    // ── Stock Returns ─────────────────────────────────────────────────────────
    const ret1 = await StockReturn.create(
      { refNo: 'RT-2026-0001', date: '2026-03-10', type: 'customer_return',
        storeId: mainWhs.id, notes: 'Customer returned defective unit — Carol Davis',
        status: 'confirmed', organizationId: orgId, createdBy: userId },
      { transaction: t },
    )
    await StockReturnItem.create(
      { stockReturnId: ret1.id, productId: pKeyboard.id, qty: 1, cost: 40.00, organizationId: orgId },
      { transaction: t },
    )

    // ── Stock Issues ──────────────────────────────────────────────────────────
    const si1 = await StockIssue.create(
      { refNo: 'SI-2026-0001', date: '2026-04-05',
        storeId: mainWhs.id, reason: 'Internal Use',
        notes: 'Office supplies issued to HR for new hire onboarding',
        status: 'confirmed', organizationId: orgId, createdBy: userId },
      { transaction: t },
    )
    await Promise.all([
      StockIssueItem.create({ stockIssueId: si1.id, productId: pPaper.id, qty: 5,  organizationId: orgId }, { transaction: t }),
      StockIssueItem.create({ stockIssueId: si1.id, productId: pPen.id,   qty: 20, organizationId: orgId }, { transaction: t }),
    ])

    // ── Stock Movements ───────────────────────────────────────────────────────
    await Promise.all([
      // GR-2026-0001 (Jan 15) — electronics received at Main
      StockMovement.create({ productId: pMouse.id,    type: 'receive', qty: 20, stockBefore: 130, stockAfter: 150, storeId: mainWhs.id, refType: 'GoodReceive', refId: gr1.id, refNo: 'GR-2026-0001', organizationId: orgId }, { transaction: t }),
      StockMovement.create({ productId: pHub.id,      type: 'receive', qty: 10, stockBefore: 70,  stockAfter: 80,  storeId: mainWhs.id, refType: 'GoodReceive', refId: gr1.id, refNo: 'GR-2026-0001', organizationId: orgId }, { transaction: t }),
      StockMovement.create({ productId: pKeyboard.id, type: 'receive', qty: 5,  stockBefore: 55,  stockAfter: 60,  storeId: mainWhs.id, refType: 'GoodReceive', refId: gr1.id, refNo: 'GR-2026-0001', organizationId: orgId }, { transaction: t }),
      // GR-2026-0002 (Feb 10) — food & beverage received
      StockMovement.create({ productId: pWater.id,  type: 'receive', qty: 200, stockBefore: 300, stockAfter: 500, storeId: mainWhs.id, refType: 'GoodReceive', refId: gr2.id, refNo: 'GR-2026-0002', organizationId: orgId }, { transaction: t }),
      StockMovement.create({ productId: pCoffee.id, type: 'receive', qty: 30,  stockBefore: 170, stockAfter: 200, storeId: mainWhs.id, refType: 'GoodReceive', refId: gr2.id, refNo: 'GR-2026-0002', organizationId: orgId }, { transaction: t }),
      // SA-2026-0001 (Feb 20) — cycle count correction
      StockMovement.create({ productId: pMouse.id, type: 'adjust', qty: 5, stockBefore: 145, stockAfter: 150, storeId: mainWhs.id, refType: 'StockAdjust', refId: sa1.id, refNo: 'SA-2026-0001', organizationId: orgId }, { transaction: t }),
      // SR-2026-0001 (Mar 20) — transfer to North Branch
      StockMovement.create({ productId: pMouse.id, type: 'transfer_out', qty: -20, stockBefore: 150, stockAfter: 130, storeId: mainWhs.id,    refType: 'StockRequest', refId: sr1.id, refNo: 'SR-2026-0001', organizationId: orgId }, { transaction: t }),
      StockMovement.create({ productId: pMouse.id, type: 'transfer_in',  qty:  20, stockBefore: 0,   stockAfter: 20,  storeId: northBranch.id, refType: 'StockRequest', refId: sr1.id, refNo: 'SR-2026-0001', organizationId: orgId }, { transaction: t }),
      StockMovement.create({ productId: pPen.id,   type: 'transfer_out', qty: -50, stockBefore: 1000, stockAfter: 950, storeId: mainWhs.id,    refType: 'StockRequest', refId: sr1.id, refNo: 'SR-2026-0001', organizationId: orgId }, { transaction: t }),
      StockMovement.create({ productId: pPen.id,   type: 'transfer_in',  qty:  50, stockBefore: 0,    stockAfter: 50,  storeId: northBranch.id, refType: 'StockRequest', refId: sr1.id, refNo: 'SR-2026-0001', organizationId: orgId }, { transaction: t }),
      // SI-2026-0001 (Apr 05) — internal issue
      StockMovement.create({ productId: pPaper.id, type: 'adjust', qty: -5,  stockBefore: 285, stockAfter: 280, storeId: mainWhs.id, refType: 'StockIssue', refId: si1.id, refNo: 'SI-2026-0001', organizationId: orgId }, { transaction: t }),
      StockMovement.create({ productId: pPen.id,   type: 'adjust', qty: -20, stockBefore: 970, stockAfter: 950, storeId: mainWhs.id, refType: 'StockIssue', refId: si1.id, refNo: 'SI-2026-0001', organizationId: orgId }, { transaction: t }),
      // DO-2026-0001 (Apr 17) — Carol's delivery
      StockMovement.create({ productId: pKeyboard.id, type: 'sale', qty: -2, stockBefore: 62, stockAfter: 60, storeId: mainWhs.id, refType: 'DeliveryOrder', refId: do1.id, refNo: 'DO-2026-0001', organizationId: orgId }, { transaction: t }),
      StockMovement.create({ productId: pHub.id,      type: 'sale', qty: -2, stockBefore: 82, stockAfter: 80, storeId: mainWhs.id, refType: 'DeliveryOrder', refId: do1.id, refNo: 'DO-2026-0001', organizationId: orgId }, { transaction: t }),
      // RT-2026-0001 (Mar 10) — customer return
      StockMovement.create({ productId: pKeyboard.id, type: 'return', qty: 1, stockBefore: 59, stockAfter: 60, storeId: mainWhs.id, refType: 'StockReturn', refId: ret1.id, refNo: 'RT-2026-0001', organizationId: orgId }, { transaction: t }),
    ])

    // ── Journal Entries ───────────────────────────────────────────────────────
    const accCash    = coaMap['1110']
    const accBank    = coaMap['1120']
    const accAR      = coaMap['1130']
    const accInv     = coaMap['1140']
    const accAP      = coaMap['2110']
    const accCapital = coaMap['3110']
    const accSales   = coaMap['4110']
    const accCOGS    = coaMap['5110']
    const accSalary  = coaMap['5210']
    const accRent    = coaMap['5220']
    const accUtils   = coaMap['5230']

    // JE-2026-0001: Jan 1 — Opening balance
    const je1 = await Journal.create(
      { refNo: 'JE-2026-0001', date: '2026-01-01',
        description: 'Opening balance — initial share capital injection',
        totalDebit: 50000.00, status: 'posted',
        organizationId: orgId, createdBy: userId },
      { transaction: t },
    )
    await Promise.all([
      JournalLine.create({ journalId: je1.id, lineNo: 1, accountId: accBank.id,    description: 'Bank deposit — share capital', debit: 50000.00, credit: 0,        organizationId: orgId }, { transaction: t }),
      JournalLine.create({ journalId: je1.id, lineNo: 2, accountId: accCapital.id, description: 'Share capital',               debit: 0,        credit: 50000.00, organizationId: orgId }, { transaction: t }),
    ])

    // JE-2026-0002: Jan 15 — Inventory purchase (GR-0001)
    const je2 = await Journal.create(
      { refNo: 'JE-2026-0002', date: '2026-01-15',
        description: 'Inventory purchase — GR-2026-0001 TechSource Global',
        totalDebit: 640.00, status: 'posted',
        organizationId: orgId, createdBy: userId },
      { transaction: t },
    )
    await Promise.all([
      JournalLine.create({ journalId: je2.id, lineNo: 1, accountId: accInv.id,  description: 'Inventory received',   debit: 640.00, credit: 0,      organizationId: orgId }, { transaction: t }),
      JournalLine.create({ journalId: je2.id, lineNo: 2, accountId: accAP.id,   description: 'Payable — TechSource', debit: 0,      credit: 640.00, organizationId: orgId }, { transaction: t }),
    ])

    // JE-2026-0003: Feb 1 — Monthly rent
    const je3 = await Journal.create(
      { refNo: 'JE-2026-0003', date: '2026-02-01',
        description: 'February 2026 — office rent payment',
        totalDebit: 3000.00, status: 'posted',
        organizationId: orgId, createdBy: userId },
      { transaction: t },
    )
    await Promise.all([
      JournalLine.create({ journalId: je3.id, lineNo: 1, accountId: accRent.id, description: 'Office rent Feb', debit: 3000.00, credit: 0,       organizationId: orgId }, { transaction: t }),
      JournalLine.create({ journalId: je3.id, lineNo: 2, accountId: accBank.id, description: 'Bank payment',    debit: 0,       credit: 3000.00, organizationId: orgId }, { transaction: t }),
    ])

    // JE-2026-0004: Apr 14 — Revenue recognition INV-2026-0003 (Carol, paid)
    const je4 = await Journal.create(
      { refNo: 'JE-2026-0004', date: '2026-04-14',
        description: 'Revenue recognition — INV-2026-0003 (Carol Davis)',
        totalDebit: 299.56, status: 'posted',
        organizationId: orgId, createdBy: userId },
      { transaction: t },
    )
    await Promise.all([
      JournalLine.create({ journalId: je4.id, lineNo: 1, accountId: accAR.id,    description: 'AR — Carol Davis',    debit: 299.56, credit: 0,      organizationId: orgId }, { transaction: t }),
      JournalLine.create({ journalId: je4.id, lineNo: 2, accountId: accSales.id, description: 'Product sales',       debit: 0,      credit: 299.56, organizationId: orgId }, { transaction: t }),
    ])

    // JE-2026-0005: Apr 15 — Revenue recognition INV-2026-0001 (Alice, sent)
    const je5 = await Journal.create(
      { refNo: 'JE-2026-0005', date: '2026-04-15',
        description: 'Revenue recognition — INV-2026-0001 (Alice Johnson)',
        totalDebit: 320.89, status: 'posted',
        organizationId: orgId, createdBy: userId },
      { transaction: t },
    )
    await Promise.all([
      JournalLine.create({ journalId: je5.id, lineNo: 1, accountId: accAR.id,    description: 'AR — Alice Johnson', debit: 320.89, credit: 0,      organizationId: orgId }, { transaction: t }),
      JournalLine.create({ journalId: je5.id, lineNo: 2, accountId: accSales.id, description: 'Product sales',      debit: 0,      credit: 320.89, organizationId: orgId }, { transaction: t }),
    ])

    // JE-2026-0006: Apr 25 — Payment received from Carol
    const je6 = await Journal.create(
      { refNo: 'JE-2026-0006', date: '2026-04-25',
        description: 'Payment received — RCP-2026-0001 (Carol Davis)',
        totalDebit: 299.56, status: 'posted',
        organizationId: orgId, createdBy: userId },
      { transaction: t },
    )
    await Promise.all([
      JournalLine.create({ journalId: je6.id, lineNo: 1, accountId: accBank.id, description: 'Bank receipt',     debit: 299.56, credit: 0,      organizationId: orgId }, { transaction: t }),
      JournalLine.create({ journalId: je6.id, lineNo: 2, accountId: accAR.id,   description: 'AR — Carol Davis', debit: 0,      credit: 299.56, organizationId: orgId }, { transaction: t }),
    ])

    // JE-2026-0007: Apr 30 — COGS recognition April sales
    const je7 = await Journal.create(
      { refNo: 'JE-2026-0007', date: '2026-04-30',
        description: 'Cost of goods sold — April sales',
        totalDebit: 141.96, status: 'posted',
        organizationId: orgId, createdBy: userId },
      { transaction: t },
    )
    await Promise.all([
      JournalLine.create({ journalId: je7.id, lineNo: 1, accountId: accCOGS.id, description: 'COGS — April',      debit: 141.96, credit: 0,      organizationId: orgId }, { transaction: t }),
      JournalLine.create({ journalId: je7.id, lineNo: 2, accountId: accInv.id,  description: 'Inventory credit',  debit: 0,      credit: 141.96, organizationId: orgId }, { transaction: t }),
    ])

    // JE-2026-0008: May 1 — Utilities expense
    const je8 = await Journal.create(
      { refNo: 'JE-2026-0008', date: '2026-05-01',
        description: 'May 2026 — utilities payment (electricity, internet)',
        totalDebit: 450.00, status: 'posted',
        organizationId: orgId, createdBy: userId },
      { transaction: t },
    )
    await Promise.all([
      JournalLine.create({ journalId: je8.id, lineNo: 1, accountId: accUtils.id, description: 'Utilities May', debit: 450.00, credit: 0,      organizationId: orgId }, { transaction: t }),
      JournalLine.create({ journalId: je8.id, lineNo: 2, accountId: accBank.id,  description: 'Bank payment',  debit: 0,      credit: 450.00, organizationId: orgId }, { transaction: t }),
    ])

    // JE-2026-0009: May 31 — May payroll (draft)
    const je9 = await Journal.create(
      { refNo: 'JE-2026-0009', date: '2026-05-31',
        description: 'May 2026 payroll — salary expense accrual',
        totalDebit: 5000.00, status: 'draft',
        organizationId: orgId, createdBy: userId },
      { transaction: t },
    )
    await Promise.all([
      JournalLine.create({ journalId: je9.id, lineNo: 1, accountId: accSalary.id, description: 'May salary expense',       debit: 5000.00, credit: 0,       organizationId: orgId }, { transaction: t }),
      JournalLine.create({ journalId: je9.id, lineNo: 2, accountId: accBank.id,   description: 'Bank payment for salaries', debit: 0,       credit: 5000.00, organizationId: orgId }, { transaction: t }),
    ])

    // JE-2026-0010: Jun 1 — June rent (draft)
    const je10 = await Journal.create(
      { refNo: 'JE-2026-0010', date: '2026-06-01',
        description: 'June 2026 — office rent accrual',
        totalDebit: 3000.00, status: 'draft',
        organizationId: orgId, createdBy: userId },
      { transaction: t },
    )
    await Promise.all([
      JournalLine.create({ journalId: je10.id, lineNo: 1, accountId: accRent.id, description: 'Office rent June', debit: 3000.00, credit: 0,       organizationId: orgId }, { transaction: t }),
      JournalLine.create({ journalId: je10.id, lineNo: 2, accountId: accBank.id, description: 'Bank payment',     debit: 0,       credit: 3000.00, organizationId: orgId }, { transaction: t }),
    ])

    await t.commit()
    return { message: 'Demo data seeded successfully' }
  } catch (err) {
    await t.rollback()
    throw err
  }
}

// ── Reset ─────────────────────────────────────────────────────────────────────

async function resetAll() {
  const t = await sequelize.transaction()
  try {
    const opts = { where: {}, transaction: t }

    const {
      SaleItem, SalesOrderItem, Order,
      QuotationItem, Quotation,
      StockIssueItem, StockIssue,
      StockReturnItem, StockReturn,
      StockCountItem, StockCount,
      StockRequestItem, StockRequest,
      StockMovement,
      StockAdjustItem, StockAdjust,
      GoodReceiveItem, GoodReceive,
      StoreStock, ProductStore, ProductVendor,
      Product, ProductCategory,
      Pricing,
      UOMConversion, UOM,
      Store,
      Receipt,
      BillingNoteInvoice: BNInvoice, BillingNote: BN,
      DebitNote: DN, CreditNote: CN,
      ReceivePaymentInvoice: RPInvoice, ReceivePayment: RP,
      JournalLine, Journal,
      InvoiceItem, Invoice,
      DeliveryOrderItem: DOItem, DeliveryOrder: DO,
      PurchaseRequisitionItem: PRItem, PurchaseRequisition: PR,
      PurchaseOrderItem: POItem, PurchaseOrder: PO,
      Customer, CustomerGroup,
      Vendor,
      EmployeeDepartment, Employee, Department,
      MasterDataValue: MDValue, MasterDataCategory: MDCategory,
      ChartOfAccount,
      FiscalYear,
      Currency, ExchangeRate,
    } = require('../../../server/models')

    // Delete in dependency order (leaf → root)
    const ordered = [
      SaleItem, SalesOrderItem, Order,
      QuotationItem, Quotation,
      StockIssueItem, StockIssue,
      StockReturnItem, StockReturn,
      StockCountItem, StockCount,
      StockRequestItem, StockRequest,
      StockMovement,
      StockAdjustItem, StockAdjust,
      GoodReceiveItem, GoodReceive,
      StoreStock, ProductStore, ProductVendor,
      Pricing,
      Product, ProductCategory,
      UOMConversion, UOM,
      Store,
      Receipt,
      BNInvoice, BN,
      DN, CN,
      RPInvoice, RP,
      JournalLine, Journal,
      InvoiceItem, Invoice,
      DOItem, DO,
      PRItem, PR,
      POItem, PO,
      Customer, CustomerGroup,
      Vendor,
      EmployeeDepartment, Employee, Department,
      MDValue, MDCategory,
      ChartOfAccount,
      FiscalYear,
      ExchangeRate, Currency,
    ]

    for (const Model of ordered) {
      await Model.destroy(opts)
    }

    await t.commit()
    return { message: 'All ERP data has been reset' }
  } catch (err) {
    await t.rollback()
    throw err
  }
}

module.exports = { seedDemo, resetAll }
