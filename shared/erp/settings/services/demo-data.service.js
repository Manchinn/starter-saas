const { getNext } = require('./sequence.service')
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
  TaxPeriod,
} = require('../../../../server/models')
const sequelize = require('../../../../server/config/database')
const { getContent } = require('./demo-data.content')

// ── Seed ─────────────────────────────────────────────────────────────────────

async function seedDemo(userId, orgId, lang = 'en') {
  const C = getContent(lang)

  // The imperative demo seed uses fixed codes. Refuse a repeat seed before it
  // consumes sequence values or writes a partial transaction.
  const existingDemoPricing = await Pricing.findOne({
    where: { code: 'PRC-R001', organizationId: orgId },
  })
  if (existingDemoPricing) {
    throw {
      status: 409,
      message: 'Demo data already exists for this organization. Reset ERP data or remove conflicting records before seeding.',
    }
  }

  // Generate sequence codes before opening the main transaction — getNext uses
  // its own transaction, and SQLite only allows one writer at a time.
  const cgpKeys = ['retail', 'wholesale', 'vip', 'government']
  const cgpCodes = []
  for (const key of cgpKeys) cgpCodes.push(await getNext('CGP', userId))

  const t = await sequelize.transaction()
  try {

    // ── UOMs ────────────────────────────────────────────────────────────────
    const [unit, kg, liter, box] = await Promise.all([
      UOM.create({ name: C.uom.unit,  abbreviation: 'unit', createdBy: userId, organizationId: orgId }, { transaction: t }),
      UOM.create({ name: C.uom.kg,    abbreviation: 'kg',   createdBy: userId, organizationId: orgId }, { transaction: t }),
      UOM.create({ name: C.uom.liter, abbreviation: 'L',    createdBy: userId, organizationId: orgId }, { transaction: t }),
      UOM.create({ name: C.uom.box,   abbreviation: 'box',  createdBy: userId, organizationId: orgId }, { transaction: t }),
    ])

    // ── Currencies & Exchange Rates ────────────────────────────────────────
    await Promise.all([
      Currency.create({ code: 'THB', name: C.currency.THB, symbol: '฿', decimals: 2, isBase: true,  isActive: true, organizationId: orgId, createdBy: userId }, { transaction: t }),
      Currency.create({ code: 'USD', name: C.currency.USD, symbol: '$', decimals: 2, isBase: false, isActive: true, organizationId: orgId, createdBy: userId }, { transaction: t }),
      Currency.create({ code: 'EUR', name: C.currency.EUR, symbol: '€', decimals: 2, isBase: false, isActive: true, organizationId: orgId, createdBy: userId }, { transaction: t }),
    ])
    await Promise.all([
      ExchangeRate.create({ currencyCode: 'USD', rate: 35.50, asOfDate: '2026-01-01', source: 'manual', notes: C.fxNotes.opening, organizationId: orgId, createdBy: userId }, { transaction: t }),
      ExchangeRate.create({ currencyCode: 'USD', rate: 36.20, asOfDate: '2026-05-01', source: 'manual', notes: C.fxNotes.may, organizationId: orgId, createdBy: userId }, { transaction: t }),
      ExchangeRate.create({ currencyCode: 'EUR', rate: 38.40, asOfDate: '2026-01-01', source: 'manual', notes: C.fxNotes.opening, organizationId: orgId, createdBy: userId }, { transaction: t }),
      ExchangeRate.create({ currencyCode: 'EUR', rate: 39.10, asOfDate: '2026-05-01', source: 'manual', notes: C.fxNotes.may, organizationId: orgId, createdBy: userId }, { transaction: t }),
    ])

    // ── Product Categories ───────────────────────────────────────────────────
    const [electronics, food, office] = await Promise.all([
      ProductCategory.create({ code: 'CAT-ELEC', name: C.categories.electronics, createdBy: userId, organizationId: orgId }, { transaction: t }),
      ProductCategory.create({ code: 'CAT-FOOD', name: C.categories.food,        createdBy: userId, organizationId: orgId }, { transaction: t }),
      ProductCategory.create({ code: 'CAT-OFFC', name: C.categories.office,      createdBy: userId, organizationId: orgId }, { transaction: t }),
    ])

    // ── Products ─────────────────────────────────────────────────────────────
    const [pMouse, pHub, pKeyboard, pWater, pCoffee, pPaper, pPen] = await Promise.all([
      Product.create({ name: C.products.mouse,    sku: 'PRD-0001', price: 29.99, cost: 12.00, stock: 150,  sellingUomId: unit.id,  purchasingUomId: box.id, category: electronics.name, createdBy: userId, organizationId: orgId }, { transaction: t }),
      Product.create({ name: C.products.hub,      sku: 'PRD-0002', price: 49.99, cost: 20.00, stock: 80,   sellingUomId: unit.id,  purchasingUomId: box.id, category: electronics.name, createdBy: userId, organizationId: orgId }, { transaction: t }),
      Product.create({ name: C.products.keyboard, sku: 'PRD-0003', price: 89.99, cost: 40.00, stock: 60,   sellingUomId: unit.id,  purchasingUomId: box.id, category: electronics.name, createdBy: userId, organizationId: orgId }, { transaction: t }),
      Product.create({ name: C.products.water,    sku: 'PRD-0004', price: 0.99,  cost: 0.40,  stock: 500,  sellingUomId: liter.id, purchasingUomId: box.id, category: food.name,        createdBy: userId, organizationId: orgId }, { transaction: t }),
      Product.create({ name: C.products.coffee,   sku: 'PRD-0005', price: 14.99, cost: 7.00,  stock: 200,  sellingUomId: kg.id,    purchasingUomId: kg.id,  category: food.name,        createdBy: userId, organizationId: orgId }, { transaction: t }),
      Product.create({ name: C.products.paper,    sku: 'PRD-0006', price: 5.99,  cost: 3.00,  stock: 300,  sellingUomId: box.id,   purchasingUomId: box.id, category: office.name,      createdBy: userId, organizationId: orgId }, { transaction: t }),
      Product.create({ name: C.products.pen,      sku: 'PRD-0007', price: 1.50,  cost: 0.50,  stock: 1000, sellingUomId: unit.id,  purchasingUomId: box.id, category: office.name,      createdBy: userId, organizationId: orgId }, { transaction: t }),
    ])

    // ── Customer Groups ───────────────────────────────────────────────────────
    const [retail, wholesale, vip, government] = await Promise.all(
      cgpKeys.map((key, i) =>
        CustomerGroup.create({
          code: cgpCodes[i],
          name: C.customerGroups[key].name,
          description: C.customerGroups[key].desc,
          status: 'active', organizationId: orgId, createdBy: userId,
        }, { transaction: t })
      )
    )

    // ── Customers ─────────────────────────────────────────────────────────────
    const [cAlice, cBob, cCarol, cDavid, cEva] = await Promise.all([
      Customer.create({ code: 'CUS-0001', name: C.customers.alice.name, email: 'alice@example.com', phone: '555-0101', company: C.customers.alice.company, customerGroupId: retail.id,      organizationId: orgId }, { transaction: t }),
      Customer.create({ code: 'CUS-0002', name: C.customers.bob.name,   email: 'bob@example.com',   phone: '555-0102', company: C.customers.bob.company,   customerGroupId: retail.id,      organizationId: orgId }, { transaction: t }),
      Customer.create({ code: 'CUS-0003', name: C.customers.carol.name, email: 'carol@example.com', phone: '555-0103', company: C.customers.carol.company, customerGroupId: vip.id,         organizationId: orgId }, { transaction: t }),
      Customer.create({ code: 'CUS-0004', name: C.customers.david.name, email: 'david@example.com', phone: '555-0104', company: C.customers.david.company, customerGroupId: government.id,  organizationId: orgId }, { transaction: t }),
      Customer.create({ code: 'CUS-0005', name: C.customers.eva.name,   email: 'eva@example.com',   phone: '555-0105', company: C.customers.eva.company,   customerGroupId: wholesale.id,   organizationId: orgId }, { transaction: t }),
    ])

    // ── Vendors ───────────────────────────────────────────────────────────────
    const supplierType = C.vendorTypes.supplier
    const serviceType  = C.vendorTypes.service
    const [vTech, vFood, vOffice] = await Promise.all([
      Vendor.create({ code: 'VND-0001', name: C.vendors.tech.name,   contactPerson: C.vendors.tech.contact,   email: 'tom@techsource.com',      phone: '555-0201', vendorTypes: [supplierType],                createdBy: userId, organizationId: orgId }, { transaction: t }),
      Vendor.create({ code: 'VND-0002', name: C.vendors.food.name,   contactPerson: C.vendors.food.contact,   email: 'sara@foodlink.com',        phone: '555-0202', vendorTypes: [supplierType],                createdBy: userId, organizationId: orgId }, { transaction: t }),
      Vendor.create({ code: 'VND-0003', name: C.vendors.office.name, contactPerson: C.vendors.office.contact, email: 'james@officeworld.com',    phone: '555-0203', vendorTypes: [supplierType],                createdBy: userId, organizationId: orgId }, { transaction: t }),
      Vendor.create({ code: 'VND-0004', name: C.vendors.clean.name,  contactPerson: C.vendors.clean.contact,  email: 'linda@cleanpro.com',       phone: '555-0204', vendorTypes: [serviceType],                 createdBy: userId, organizationId: orgId }, { transaction: t }),
      Vendor.create({ code: 'VND-0005', name: C.vendors.swift.name,  contactPerson: C.vendors.swift.contact,  email: 'mark@swiftlogistics.com',  phone: '555-0205', vendorTypes: [serviceType],                 createdBy: userId, organizationId: orgId }, { transaction: t }),
      Vendor.create({ code: 'VND-0006', name: C.vendors.uni.name,    contactPerson: C.vendors.uni.contact,    email: 'nora@unitrade.com',        phone: '555-0206', vendorTypes: [supplierType, serviceType],   createdBy: userId, organizationId: orgId }, { transaction: t }),
    ])

    // ── Stores ────────────────────────────────────────────────────────────────
    const [mainWhs, northBranch] = await Promise.all([
      Store.create({ code: 'WHS-0001', name: C.stores.main.name,  address: C.stores.main.address,  createdBy: userId, organizationId: orgId }, { transaction: t }),
      Store.create({ code: 'WHS-0002', name: C.stores.north.name, address: C.stores.north.address, createdBy: userId, organizationId: orgId }, { transaction: t }),
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
      SaleItem.create({ code: 'SI-0001', name: C.products.mouse,    productId: pMouse.id,    status: 'active', createdBy: userId, organizationId: orgId }, { transaction: t }),
      SaleItem.create({ code: 'SI-0002', name: C.products.hub,      productId: pHub.id,      status: 'active', createdBy: userId, organizationId: orgId }, { transaction: t }),
      SaleItem.create({ code: 'SI-0003', name: C.products.keyboard, productId: pKeyboard.id, status: 'active', createdBy: userId, organizationId: orgId }, { transaction: t }),
      SaleItem.create({ code: 'SI-0004', name: C.products.water,    productId: pWater.id,    status: 'active', createdBy: userId, organizationId: orgId }, { transaction: t }),
      SaleItem.create({ code: 'SI-0005', name: C.products.coffee,   productId: pCoffee.id,   status: 'active', createdBy: userId, organizationId: orgId }, { transaction: t }),
      SaleItem.create({ code: 'SI-0006', name: C.products.paper,    productId: pPaper.id,    status: 'active', createdBy: userId, organizationId: orgId }, { transaction: t }),
      SaleItem.create({ code: 'SI-0007', name: C.products.pen,      productId: pPen.id,      status: 'active', createdBy: userId, organizationId: orgId }, { transaction: t }),
    ])

    // ── Price Lists ───────────────────────────────────────────────────────────
    await Promise.all([
      // Retail (standard) prices
      Pricing.create({ code: 'PRC-R001', name: C.pricing['PRC-R001'], saleItemId: siMouse.id,    customerGroupId: retail.id,     unitPrice: 29.99, currency: 'USD', activeFrom: '2026-01-01', status: 'active', createdBy: userId, organizationId: orgId }, { transaction: t }),
      Pricing.create({ code: 'PRC-R002', name: C.pricing['PRC-R002'], saleItemId: siHub.id,      customerGroupId: retail.id,     unitPrice: 49.99, currency: 'USD', activeFrom: '2026-01-01', status: 'active', createdBy: userId, organizationId: orgId }, { transaction: t }),
      Pricing.create({ code: 'PRC-R003', name: C.pricing['PRC-R003'], saleItemId: siKeyboard.id, customerGroupId: retail.id,     unitPrice: 89.99, currency: 'USD', activeFrom: '2026-01-01', status: 'active', createdBy: userId, organizationId: orgId }, { transaction: t }),
      Pricing.create({ code: 'PRC-R004', name: C.pricing['PRC-R004'], saleItemId: siPaper.id,    customerGroupId: retail.id,     unitPrice: 5.99,  currency: 'USD', activeFrom: '2026-01-01', status: 'active', createdBy: userId, organizationId: orgId }, { transaction: t }),
      Pricing.create({ code: 'PRC-R005', name: C.pricing['PRC-R005'], saleItemId: siPen.id,      customerGroupId: retail.id,     unitPrice: 1.50,  currency: 'USD', activeFrom: '2026-01-01', status: 'active', createdBy: userId, organizationId: orgId }, { transaction: t }),
      // Wholesale prices
      Pricing.create({ code: 'PRC-W001', name: C.pricing['PRC-W001'], saleItemId: siMouse.id,    customerGroupId: wholesale.id, unitPrice: 24.99, currency: 'USD', activeFrom: '2026-01-01', status: 'active', createdBy: userId, organizationId: orgId }, { transaction: t }),
      Pricing.create({ code: 'PRC-W002', name: C.pricing['PRC-W002'], saleItemId: siHub.id,      customerGroupId: wholesale.id, unitPrice: 42.99, currency: 'USD', activeFrom: '2026-01-01', status: 'active', createdBy: userId, organizationId: orgId }, { transaction: t }),
      Pricing.create({ code: 'PRC-W003', name: C.pricing['PRC-W003'], saleItemId: siKeyboard.id, customerGroupId: wholesale.id, unitPrice: 74.99, currency: 'USD', activeFrom: '2026-01-01', status: 'active', createdBy: userId, organizationId: orgId }, { transaction: t }),
      Pricing.create({ code: 'PRC-W004', name: C.pricing['PRC-W004'], saleItemId: siPaper.id,    customerGroupId: wholesale.id, unitPrice: 4.50,  currency: 'USD', activeFrom: '2026-01-01', status: 'active', createdBy: userId, organizationId: orgId }, { transaction: t }),
      Pricing.create({ code: 'PRC-W005', name: C.pricing['PRC-W005'], saleItemId: siPen.id,      customerGroupId: wholesale.id, unitPrice: 1.10,  currency: 'USD', activeFrom: '2026-01-01', status: 'active', createdBy: userId, organizationId: orgId }, { transaction: t }),
    ])

    // ── Master Data ───────────────────────────────────────────────────────────
    // Build master-data definitions from the localized content. Slugs, codes and
    // sortOrder stay language-neutral; only the category name/description and the
    // value display names are localized.
    const mdSpec = [
      { key: 'paymentTerms',    slug: `payment-terms-${orgId}`,    codes: ['PT-001', 'PT-002', 'PT-003', 'PT-004', 'PT-005'] },
      { key: 'paymentMethods',  slug: `payment-methods-${orgId}`,  codes: ['PM-001', 'PM-002', 'PM-003', 'PM-004', 'PM-005'] },
      { key: 'shippingMethods', slug: `shipping-methods-${orgId}`, codes: ['SH-001', 'SH-002', 'SH-003', 'SH-004'] },
      { key: 'businessTypes',   slug: `business-types-${orgId}`,   codes: ['BT-001', 'BT-002', 'BT-003', 'BT-004', 'BT-005'] },
      { key: 'taxTypes',        slug: `tax-types-${orgId}`,        codes: ['TX-001', 'TX-002', 'TX-003', 'TX-004'] },
      { key: 'titlePrefix',     slug: `title-prefix-${orgId}`,     codes: ['TL-001', 'TL-002', 'TL-003', 'TL-004', 'TL-005'] },
      { key: 'gender',          slug: `gender-${orgId}`,           codes: ['GD-001', 'GD-002', 'GD-003'] },
      { key: 'leaveTypes',      slug: `leave-types-${orgId}`,      codes: ['LV-001', 'LV-002', 'LV-003', 'LV-004', 'LV-005'] },
      { key: 'accountTypes',    slug: `account-types-${orgId}`,    codes: ['asset', 'liability', 'equity', 'revenue', 'expense'] },
      { key: 'vendorTypes',     slug: `vendor-types-${orgId}`,     codes: ['VT-001', 'VT-002'] },
      { key: 'whtType',         slug: `wht-type-${orgId}`,         codes: ['WHT-001', 'WHT-002', 'WHT-003', 'WHT-004'],
        data: { 'WHT-001': '3', 'WHT-002': '3', 'WHT-003': '5', 'WHT-004': '2' } },
    ]
    const mdDefs = mdSpec.map(({ key, slug, codes, data }) => {
      const md = C.masterData[key]
      return {
        slug, name: md.name, description: md.desc,
        values: codes.map((code, i) => ({ code, name: md.values[code], dataValue: data?.[code] ?? null, sortOrder: i + 1 })),
      }
    })
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
      Department.create({ code: 'DEPT-001', name: C.departments.it.name,      description: C.departments.it.desc,      organizationId: orgId, createdBy: userId }, { transaction: t }),
      Department.create({ code: 'DEPT-002', name: C.departments.sales.name,   description: C.departments.sales.desc,   organizationId: orgId, createdBy: userId }, { transaction: t }),
      Department.create({ code: 'DEPT-003', name: C.departments.hr.name,      description: C.departments.hr.desc,      organizationId: orgId, createdBy: userId }, { transaction: t }),
      Department.create({ code: 'DEPT-004', name: C.departments.finance.name, description: C.departments.finance.desc, organizationId: orgId, createdBy: userId }, { transaction: t }),
      Department.create({ code: 'DEPT-005', name: C.departments.ops.name,     description: C.departments.ops.desc,     organizationId: orgId, createdBy: userId }, { transaction: t }),
    ])

    // ── Employees ─────────────────────────────────────────────────────────────
    const empData = [
      { employeeCode: 'EMP-001', firstName: C.employees.e1.firstName, lastName: C.employees.e1.lastName, position: C.employees.e1.position, startDate: '2022-01-10', dept: deptIT },
      { employeeCode: 'EMP-002', firstName: C.employees.e2.firstName, lastName: C.employees.e2.lastName, position: C.employees.e2.position, startDate: '2021-03-15', dept: deptSales },
      { employeeCode: 'EMP-003', firstName: C.employees.e3.firstName, lastName: C.employees.e3.lastName, position: C.employees.e3.position, startDate: '2022-06-01', dept: deptHR },
      { employeeCode: 'EMP-004', firstName: C.employees.e4.firstName, lastName: C.employees.e4.lastName, position: C.employees.e4.position, startDate: '2020-09-20', dept: deptFinance },
      { employeeCode: 'EMP-005', firstName: C.employees.e5.firstName, lastName: C.employees.e5.lastName, position: C.employees.e5.position, startDate: '2021-11-05', dept: deptOps },
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
    // `cat` = TFRS for NPAEs statement line-item classification (statementCategory).
    // Type-root accounts (1000/2000/3000/4000/5000) are structural and stay null.
    const coaDefs = [
      { code: '1000', name: 'Assets',                  accountType: 'asset',     normalBalance: 'debit',  parentCode: null,   cat: null },
      { code: '1100', name: 'Current Assets',           accountType: 'asset',     normalBalance: 'debit',  parentCode: '1000', cat: 'other_current_assets' },
      { code: '1110', name: 'Cash',                     accountType: 'asset',     normalBalance: 'debit',  parentCode: '1100', cat: 'cash_and_equivalents' },
      { code: '1120', name: 'Bank Account',             accountType: 'asset',     normalBalance: 'debit',  parentCode: '1100', cat: 'cash_and_equivalents' },
      { code: '1130', name: 'Accounts Receivable',      accountType: 'asset',     normalBalance: 'debit',  parentCode: '1100', cat: 'trade_receivables' },
      { code: '1140', name: 'Inventory',                accountType: 'asset',     normalBalance: 'debit',  parentCode: '1100', cat: 'inventories' },
      { code: '1150', name: 'Prepaid Expenses',         accountType: 'asset',     normalBalance: 'debit',  parentCode: '1100', cat: 'other_current_assets' },
      { code: '1160', name: 'Input Tax (VAT)',          accountType: 'asset',     normalBalance: 'debit',  parentCode: '1100', cat: 'other_current_assets' },
      { code: '1170', name: 'Withholding Tax (WHT)',    accountType: 'asset',     normalBalance: 'debit',  parentCode: '1100', cat: 'other_current_assets' },
      // WHT receivable broken down by WHT Type (mirrors the "WHT Type" master data).
      { code: '1171', name: 'WHT – Personal Service (PND.3)',  accountType: 'asset', normalBalance: 'debit', parentCode: '1170', cat: 'other_current_assets' },
      { code: '1172', name: 'WHT – Juristic Service (PND.53)', accountType: 'asset', normalBalance: 'debit', parentCode: '1170', cat: 'other_current_assets' },
      { code: '1173', name: 'WHT – Rental (PND.53)',           accountType: 'asset', normalBalance: 'debit', parentCode: '1170', cat: 'other_current_assets' },
      { code: '1174', name: 'WHT – Advertising (PND.53)',      accountType: 'asset', normalBalance: 'debit', parentCode: '1170', cat: 'other_current_assets' },
      { code: '1200', name: 'Fixed Assets',             accountType: 'asset',     normalBalance: 'debit',  parentCode: '1000', cat: 'property_plant_equipment' },
      { code: '1210', name: 'Property & Equipment',     accountType: 'asset',     normalBalance: 'debit',  parentCode: '1200', cat: 'property_plant_equipment' },
      { code: '1220', name: 'Accumulated Depreciation', accountType: 'asset',     normalBalance: 'credit', parentCode: '1200', cat: 'property_plant_equipment' },
      { code: '2000', name: 'Liabilities',              accountType: 'liability', normalBalance: 'credit', parentCode: null,   cat: null },
      { code: '2100', name: 'Current Liabilities',      accountType: 'liability', normalBalance: 'credit', parentCode: '2000', cat: 'other_current_liabilities' },
      { code: '2110', name: 'Accounts Payable',         accountType: 'liability', normalBalance: 'credit', parentCode: '2100', cat: 'trade_payables' },
      { code: '2120', name: 'Accrued Expenses',         accountType: 'liability', normalBalance: 'credit', parentCode: '2100', cat: 'other_current_liabilities' },
      { code: '2130', name: 'Short-term Loans',         accountType: 'liability', normalBalance: 'credit', parentCode: '2100', cat: 'short_term_borrowings' },
      { code: '2140', name: 'Output Tax (VAT)',         accountType: 'liability', normalBalance: 'credit', parentCode: '2100', cat: 'other_current_liabilities' },
      { code: '2150', name: 'Withholding Tax Payable',  accountType: 'liability', normalBalance: 'credit', parentCode: '2100', cat: 'other_current_liabilities' },
      { code: '2200', name: 'Long-term Liabilities',    accountType: 'liability', normalBalance: 'credit', parentCode: '2000', cat: 'long_term_borrowings' },
      { code: '2210', name: 'Long-term Loans',          accountType: 'liability', normalBalance: 'credit', parentCode: '2200', cat: 'long_term_borrowings' },
      { code: '3000', name: 'Equity',                   accountType: 'equity',    normalBalance: 'credit', parentCode: null,   cat: null },
      { code: '3100', name: "Owner's Equity",           accountType: 'equity',    normalBalance: 'credit', parentCode: '3000', cat: 'owners_capital' },
      { code: '3110', name: 'Share Capital',            accountType: 'equity',    normalBalance: 'credit', parentCode: '3100', cat: 'owners_capital' },
      { code: '3120', name: 'Retained Earnings',        accountType: 'equity',    normalBalance: 'credit', parentCode: '3100', cat: 'retained_earnings' },
      { code: '3130', name: 'Current Year Profit/Loss', accountType: 'equity',    normalBalance: 'credit', parentCode: '3100', cat: 'retained_earnings' },
      { code: '3140', name: "Owner's Drawings",         accountType: 'equity',    normalBalance: 'debit',  parentCode: '3100', cat: 'owners_capital' },
      { code: '4000', name: 'Revenue',                  accountType: 'revenue',   normalBalance: 'credit', parentCode: null,   cat: null },
      { code: '4100', name: 'Sales Revenue',            accountType: 'revenue',   normalBalance: 'credit', parentCode: '4000', cat: 'revenue' },
      { code: '4110', name: 'Product Sales',            accountType: 'revenue',   normalBalance: 'credit', parentCode: '4100', cat: 'revenue' },
      { code: '4120', name: 'Service Revenue',          accountType: 'revenue',   normalBalance: 'credit', parentCode: '4100', cat: 'revenue' },
      { code: '4200', name: 'Other Revenue',            accountType: 'revenue',   normalBalance: 'credit', parentCode: '4000', cat: 'other_income' },
      { code: '4210', name: 'Interest Income',          accountType: 'revenue',   normalBalance: 'credit', parentCode: '4200', cat: 'other_income' },
      { code: '4220', name: 'Other Income',             accountType: 'revenue',   normalBalance: 'credit', parentCode: '4200', cat: 'other_income' },
      { code: '5000', name: 'Expenses',                 accountType: 'expense',   normalBalance: 'debit',  parentCode: null,   cat: null },
      { code: '5100', name: 'Cost of Sales',            accountType: 'expense',   normalBalance: 'debit',  parentCode: '5000', cat: 'cost_of_sales' },
      { code: '5110', name: 'Cost of Goods Sold',       accountType: 'expense',   normalBalance: 'debit',  parentCode: '5100', cat: 'cost_of_sales' },
      { code: '5130', name: 'Inventory Adjustment',     accountType: 'expense',   normalBalance: 'debit',  parentCode: '5100', cat: 'cost_of_sales' },
      { code: '5200', name: 'Operating Expenses',       accountType: 'expense',   normalBalance: 'debit',  parentCode: '5000', cat: 'selling_admin_expenses' },
      { code: '5210', name: 'Salary Expense',           accountType: 'expense',   normalBalance: 'debit',  parentCode: '5200', cat: 'selling_admin_expenses' },
      { code: '5220', name: 'Rent Expense',             accountType: 'expense',   normalBalance: 'debit',  parentCode: '5200', cat: 'selling_admin_expenses' },
      { code: '5230', name: 'Utilities Expense',        accountType: 'expense',   normalBalance: 'debit',  parentCode: '5200', cat: 'selling_admin_expenses' },
      { code: '5240', name: 'Marketing & Advertising',  accountType: 'expense',   normalBalance: 'debit',  parentCode: '5200', cat: 'selling_admin_expenses' },
      { code: '5250', name: 'Depreciation Expense',     accountType: 'expense',   normalBalance: 'debit',  parentCode: '5200', cat: 'selling_admin_expenses' },
      { code: '5300', name: 'Financial Expenses',       accountType: 'expense',   normalBalance: 'debit',  parentCode: '5000', cat: 'finance_costs' },
      { code: '5310', name: 'Interest Expense',         accountType: 'expense',   normalBalance: 'debit',  parentCode: '5300', cat: 'finance_costs' },
      { code: '5320', name: 'Bank Charges',             accountType: 'expense',   normalBalance: 'debit',  parentCode: '5300', cat: 'finance_costs' },
      { code: '5400', name: 'Income Tax Expense',       accountType: 'expense',   normalBalance: 'debit',  parentCode: '5000', cat: 'income_tax_expense' },
    ]
    const coaMap = {}
    for (const def of coaDefs) {
      const parentId = def.parentCode ? coaMap[def.parentCode]?.id || null : null
      const level    = parentId ? (coaMap[def.parentCode]?.level || 1) + 1 : 1
      const acc = await ChartOfAccount.create(
        { code: def.code, name: C.coa[def.code] || def.name, accountType: def.accountType, normalBalance: def.normalBalance,
          statementCategory: def.cat, parentId, level, status: 'active', organizationId: orgId, createdBy: userId },
        { transaction: t },
      )
      coaMap[def.code] = acc
    }

    // ── Fiscal Years ──────────────────────────────────────────────────────────
    await Promise.all([
      FiscalYear.create(
        { name: 'FY2025', startDate: '2025-01-01', endDate: '2025-12-31',
          status: 'closed', notes: C.fiscalYear.fy2025Notes, organizationId: orgId, createdBy: userId },
        { transaction: t },
      ),
      FiscalYear.create(
        { name: 'FY2026', startDate: '2026-01-01', endDate: '2026-12-31',
          status: 'open', organizationId: orgId, createdBy: userId },
        { transaction: t },
      ),
    ])

    // ── Tax Periods (monthly) ────────────────────────────────────────────────
    // Jan-Apr 2026 are closed (filed); May 2026 is open (current); Jun 2026 not yet started
    const months = [
      { key: '2026-01', start: '2026-01-01', end: '2026-01-31', status: 'closed', closedAt: '2026-02-15' },
      { key: '2026-02', start: '2026-02-01', end: '2026-02-28', status: 'closed', closedAt: '2026-03-15' },
      { key: '2026-03', start: '2026-03-01', end: '2026-03-31', status: 'closed', closedAt: '2026-04-15' },
      { key: '2026-04', start: '2026-04-01', end: '2026-04-30', status: 'closed', closedAt: '2026-05-15' },
      { key: '2026-05', start: '2026-05-01', end: '2026-05-31', status: 'open',   closedAt: null },
      { key: '2026-06', start: '2026-06-01', end: '2026-06-30', status: 'open',   closedAt: null },
    ]
    for (const m of months) {
      await TaxPeriod.create({
        name:     C.taxPeriod.months[m.key],
        startDate: m.start, endDate: m.end,
        status:   m.status,
        notes:    m.status === 'closed' ? C.taxPeriod.filed : null,
        closedBy: m.status === 'closed' ? userId : null,
        closedAt: m.closedAt ? new Date(m.closedAt) : null,
        organizationId: orgId, createdBy: userId, modifiedBy: userId,
      }, { transaction: t })
    }

    // ── Quotations ────────────────────────────────────────────────────────────
    const qt1 = await Quotation.create(
      { refNo: 'QT-2026-0001', customerId: cCarol.id,
        quotationDate: '2026-04-10', validUntil: '2026-04-25',
        subtotal: 279.96, taxRate: 7, tax: 19.60, total: 299.56,
        notes: C.notes.qt1, status: 'accepted',
        organizationId: orgId, createdBy: userId },
      { transaction: t },
    )
    await Promise.all([
      QuotationItem.create({ quotationId: qt1.id, productId: pKeyboard.id, productName: C.products.keyboard, qty: 2, unitPrice: 89.99, discount: 0, total: 179.98, organizationId: orgId }, { transaction: t }),
      QuotationItem.create({ quotationId: qt1.id, productId: pHub.id,      productName: C.products.hub,      qty: 2, unitPrice: 49.99, discount: 0, total: 99.98,  organizationId: orgId }, { transaction: t }),
    ])

    const qt2 = await Quotation.create(
      { refNo: 'QT-2026-0002', customerId: cDavid.id,
        quotationDate: '2026-04-22', validUntil: '2026-05-06',
        subtotal: 179.82, taxRate: 7, tax: 12.59, total: 192.41,
        notes: C.notes.qt2, status: 'sent',
        organizationId: orgId, createdBy: userId },
      { transaction: t },
    )
    await Promise.all([
      QuotationItem.create({ quotationId: qt2.id, productId: pMouse.id, productName: C.products.mouse, qty: 3, unitPrice: 29.99, discount: 0, total: 89.97, organizationId: orgId }, { transaction: t }),
      QuotationItem.create({ quotationId: qt2.id, productId: pPaper.id, productName: C.products.paper, qty: 15, unitPrice: 5.99, discount: 0, total: 89.85, organizationId: orgId }, { transaction: t }),
    ])

    const qt3 = await Quotation.create(
      { refNo: 'QT-2026-0003', customerId: cEva.id,
        quotationDate: '2026-05-02', validUntil: '2026-05-16',
        subtotal: 74.99, taxRate: 7, tax: 5.25, total: 80.24,
        notes: C.notes.qt3, status: 'draft',
        organizationId: orgId, createdBy: userId },
      { transaction: t },
    )
    await Promise.all([
      QuotationItem.create({ quotationId: qt3.id, productId: pMouse.id, productName: C.products.mouse, qty: 1, unitPrice: 29.99, discount: 0, total: 29.99, organizationId: orgId }, { transaction: t }),
      QuotationItem.create({ quotationId: qt3.id, productId: pPen.id,   productName: C.products.pen,   qty: 30, unitPrice: 1.50, discount: 0, total: 45.00, organizationId: orgId }, { transaction: t }),
    ])

    // ── Sales Orders ──────────────────────────────────────────────────────────
    const so1 = await Order.create(
      { orderNumber: 'SO-2026-0001', customerId: cCarol.id,
        orderDate: '2026-04-12', status: 'delivered',
        subtotal: 279.96, tax: 19.60, total: 299.56,
        notes: C.notes.so1, organizationId: orgId, createdBy: userId },
      { transaction: t },
    )
    await Promise.all([
      SalesOrderItem.create({ orderId: so1.id, productId: pKeyboard.id, productName: C.products.keyboard, quantity: 2, unitPrice: 89.99, total: 179.98, organizationId: orgId }, { transaction: t }),
      SalesOrderItem.create({ orderId: so1.id, productId: pHub.id,      productName: C.products.hub,      quantity: 2, unitPrice: 49.99, total: 99.98,  organizationId: orgId }, { transaction: t }),
    ])

    const so2 = await Order.create(
      { orderNumber: 'SO-2026-0002', customerId: cBob.id,
        orderDate: '2026-04-28', status: 'confirmed',
        subtotal: 179.96, tax: 12.60, total: 192.56,
        notes: '', organizationId: orgId, createdBy: userId },
      { transaction: t },
    )
    await Promise.all([
      SalesOrderItem.create({ orderId: so2.id, productId: pMouse.id,    productName: C.products.mouse,    quantity: 3, unitPrice: 29.99, total: 89.97, organizationId: orgId }, { transaction: t }),
      SalesOrderItem.create({ orderId: so2.id, productId: pKeyboard.id, productName: C.products.keyboard, quantity: 1, unitPrice: 89.99, total: 89.99, organizationId: orgId }, { transaction: t }),
    ])

    const so3 = await Order.create(
      { orderNumber: 'SO-2026-0003', customerId: cAlice.id,
        orderDate: '2026-05-05', status: 'draft',
        subtotal: 99.98, tax: 7.00, total: 106.98,
        notes: C.notes.so3, organizationId: orgId, createdBy: userId },
      { transaction: t },
    )
    await SalesOrderItem.create(
      { orderId: so3.id, productId: pHub.id, productName: C.products.hub, quantity: 2, unitPrice: 49.99, total: 99.98, organizationId: orgId },
      { transaction: t },
    )

    // ── Delivery Orders ───────────────────────────────────────────────────────
    const do1 = await DeliveryOrder.create(
      { refNo: 'DO-2026-0001', date: '2026-04-14', deliveryDate: '2026-04-17',
        orderId: so1.id, customerId: cCarol.id,
        address: C.notes.do1addr,
        notes: C.notes.do1notes, status: 'delivered',
        organizationId: orgId, createdBy: userId },
      { transaction: t },
    )
    await Promise.all([
      DeliveryOrderItem.create({ deliveryOrderId: do1.id, productId: pKeyboard.id, productName: C.products.keyboard, qty: 2, organizationId: orgId }, { transaction: t }),
      DeliveryOrderItem.create({ deliveryOrderId: do1.id, productId: pHub.id,      productName: C.products.hub,      qty: 2, organizationId: orgId }, { transaction: t }),
    ])

    const do2 = await DeliveryOrder.create(
      { refNo: 'DO-2026-0002', date: '2026-05-05', deliveryDate: null,
        orderId: so2.id, customerId: cBob.id,
        address: C.notes.do2addr,
        notes: '', status: 'confirmed',
        organizationId: orgId, createdBy: userId },
      { transaction: t },
    )
    await Promise.all([
      DeliveryOrderItem.create({ deliveryOrderId: do2.id, productId: pMouse.id,    productName: C.products.mouse,    qty: 3, organizationId: orgId }, { transaction: t }),
      DeliveryOrderItem.create({ deliveryOrderId: do2.id, productId: pKeyboard.id, productName: C.products.keyboard, qty: 1, organizationId: orgId }, { transaction: t }),
    ])

    const do3 = await DeliveryOrder.create(
      { refNo: 'DO-2026-0003', date: '2026-05-08', deliveryDate: null,
        customerId: cAlice.id,
        address: null, notes: C.notes.do3notes, status: 'draft',
        organizationId: orgId, createdBy: userId },
      { transaction: t },
    )
    await DeliveryOrderItem.create(
      { deliveryOrderId: do3.id, productId: pHub.id, productName: C.products.hub, qty: 2, organizationId: orgId },
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
      InvoiceItem.create({ invoiceId: inv1.id, saleItemId: siMouse.id,    itemCode: siMouse.code,    productName: C.products.mouse,      quantity: 3, unitPrice: 29.99, total: 89.97,  organizationId: orgId }, { transaction: t }),
      InvoiceItem.create({ invoiceId: inv1.id, saleItemId: siKeyboard.id, itemCode: siKeyboard.code, productName: C.products.keyboard, quantity: 2, unitPrice: 89.99, total: 179.98, organizationId: orgId }, { transaction: t }),
      InvoiceItem.create({ invoiceId: inv1.id, saleItemId: siPaper.id,    itemCode: siPaper.code,    productName: C.products.paper,       quantity: 5, unitPrice: 5.99,  total: 29.95,  organizationId: orgId }, { transaction: t }),
    ])

    const inv2 = await Invoice.create(
      { invoiceNumber: 'INV-2026-0002', customerId: cAlice.id,
        invoiceDate: '2026-04-28', dueDate: '2026-05-28',
        subtotal: 49.99, tax: 3.50, total: 53.49,
        status: 'sent', organizationId: orgId, createdBy: userId },
      { transaction: t },
    )
    await InvoiceItem.create(
      { invoiceId: inv2.id, saleItemId: siHub.id, itemCode: siHub.code, productName: C.products.hub, quantity: 1, unitPrice: 49.99, total: 49.99, organizationId: orgId },
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
      InvoiceItem.create({ invoiceId: inv3.id, saleItemId: siKeyboard.id, itemCode: siKeyboard.code, productName: C.products.keyboard, quantity: 2, unitPrice: 89.99, total: 179.98, organizationId: orgId }, { transaction: t }),
      InvoiceItem.create({ invoiceId: inv3.id, saleItemId: siHub.id,      itemCode: siHub.code,      productName: C.products.hub,           quantity: 2, unitPrice: 49.99, total: 99.98,  organizationId: orgId }, { transaction: t }),
    ])

    const inv4 = await Invoice.create(
      { invoiceNumber: 'INV-2026-0004', customerId: cBob.id,
        invoiceDate: '2026-05-06', dueDate: '2026-05-21',
        subtotal: 179.96, tax: 12.60, total: 192.56,
        status: 'draft', organizationId: orgId, createdBy: userId },
      { transaction: t },
    )
    await Promise.all([
      InvoiceItem.create({ invoiceId: inv4.id, saleItemId: siMouse.id,    itemCode: siMouse.code,    productName: C.products.mouse,      quantity: 3, unitPrice: 29.99, total: 89.97, organizationId: orgId }, { transaction: t }),
      InvoiceItem.create({ invoiceId: inv4.id, saleItemId: siKeyboard.id, itemCode: siKeyboard.code, productName: C.products.keyboard, quantity: 1, unitPrice: 89.99, total: 89.99, organizationId: orgId }, { transaction: t }),
    ])

    const inv5 = await Invoice.create(
      { invoiceNumber: 'INV-2026-0005', customerId: cDavid.id,
        invoiceDate: '2026-05-02', dueDate: '2026-06-01',
        subtotal: 179.82, tax: 12.59, total: 192.41,
        status: 'sent', organizationId: orgId, createdBy: userId },
      { transaction: t },
    )
    await Promise.all([
      InvoiceItem.create({ invoiceId: inv5.id, saleItemId: siMouse.id, itemCode: siMouse.code, productName: C.products.mouse, quantity: 3, unitPrice: 29.99, total: 89.97, organizationId: orgId }, { transaction: t }),
      InvoiceItem.create({ invoiceId: inv5.id, saleItemId: siPaper.id, itemCode: siPaper.code, productName: C.products.paper,  quantity: 15, unitPrice: 5.99, total: 89.85, organizationId: orgId }, { transaction: t }),
    ])

    // ── Receipts ──────────────────────────────────────────────────────────────
    await Receipt.create(
      { receiptNumber: 'RCT-2026-0001', customerId: cCarol.id, invoiceId: inv3.id,
        receiptDate: '2026-04-25', paymentMethod: 'bank_transfer',
        amount: Number(inv3.total), reference: 'TXN-20260425-001',
        status: 'confirmed', notes: C.notes.rct1,
        organizationId: orgId, createdBy: userId },
      { transaction: t },
    )
    await Receipt.create(
      { receiptNumber: 'RCT-2026-0002', customerId: cAlice.id, invoiceId: inv2.id,
        receiptDate: '2026-05-10', paymentMethod: 'cash',
        amount: Number(inv2.total), reference: null,
        status: 'confirmed', notes: C.notes.rct2,
        organizationId: orgId, createdBy: userId },
      { transaction: t },
    )
    await Receipt.create(
      { receiptNumber: 'RCT-2026-0003', customerId: cBob.id, invoiceId: null,
        receiptDate: '2026-05-08', paymentMethod: 'credit_card',
        amount: 50.00, reference: 'CC-2026-0508',
        status: 'draft', notes: C.notes.rct3,
        organizationId: orgId, createdBy: userId },
      { transaction: t },
    )

    // ── Billing Note ──────────────────────────────────────────────────────────
    const bn1 = await BillingNote.create(
      { refNo: 'BN-2026-0001', date: '2026-05-01', dueDate: '2026-05-31',
        customerId: cAlice.id,
        notes: C.notes.bn1,
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
        paymentMethod: C.rpMethod.bankTransfer, reference: 'TXN-20260425-001',
        amount: Number(inv3.total),
        notes: C.notes.rp1,
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
        paymentMethod: C.rpMethod.cash, reference: null,
        amount: Number(inv2.total),
        notes: C.notes.rp2,
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
        reason: C.notes.dn1,
        amount: 50.00, status: 'issued', organizationId: orgId, createdBy: userId },
      { transaction: t },
    )
    await CreditNote.create(
      { refNo: 'CN-2026-0001', date: '2026-05-07',
        customerId: cCarol.id, invoiceId: inv3.id,
        reason: C.notes.cn1,
        amount: 89.99, status: 'draft', organizationId: orgId, createdBy: userId },
      { transaction: t },
    )

    // ── Purchase Requisitions ─────────────────────────────────────────────────
    const pr1 = await PurchaseRequisition.create(
      { refNo: 'PR-2026-0001', date: '2026-04-28', requestedBy: `${C.employees.e5.firstName} ${C.employees.e5.lastName}`, department: C.departments.ops.name,
        vendorId: vTech.id, notes: C.notes.pr1, status: 'approved',
        organizationId: orgId, createdBy: userId },
      { transaction: t },
    )
    await Promise.all([
      PurchaseRequisitionItem.create({ requisitionId: pr1.id, productId: pMouse.id,    description: C.products.mouse,    qty: 20, unitPrice: 12.00, organizationId: orgId }, { transaction: t }),
      PurchaseRequisitionItem.create({ requisitionId: pr1.id, productId: pHub.id,      description: C.lineDesc.hubBulk, qty: 10, unitPrice: 20.00, organizationId: orgId }, { transaction: t }),
    ])
    const pr2 = await PurchaseRequisition.create(
      { refNo: 'PR-2026-0002', date: '2026-05-02', requestedBy: `${C.employees.e3.firstName} ${C.employees.e3.lastName}`, department: C.departments.hr.name,
        vendorId: null, notes: C.notes.pr2, status: 'draft',
        organizationId: orgId, createdBy: userId },
      { transaction: t },
    )
    await Promise.all([
      PurchaseRequisitionItem.create({ requisitionId: pr2.id, productId: pPaper.id, description: C.products.paper,   qty: 20, unitPrice: 3.00,  organizationId: orgId }, { transaction: t }),
      PurchaseRequisitionItem.create({ requisitionId: pr2.id, productId: pPen.id,   description: C.lineDesc.penBox,  qty: 10, unitPrice: 5.00,  organizationId: orgId }, { transaction: t }),
      PurchaseRequisitionItem.create({ requisitionId: pr2.id, productId: null,       description: C.lineDesc.stapler, qty: 5,  unitPrice: 12.00, organizationId: orgId }, { transaction: t }),
    ])

    // ── Purchase Orders ───────────────────────────────────────────────────────
    const po1 = await PurchaseOrder.create(
      { refNo: 'PO-2026-0001', date: '2026-04-30', deliveryDate: '2026-05-10',
        vendorId: vTech.id, requisitionId: pr1.id,
        notes: C.notes.po1, status: 'confirmed',
        organizationId: orgId, createdBy: userId },
      { transaction: t },
    )
    await Promise.all([
      PurchaseOrderItem.create({ purchaseOrderId: po1.id, productId: pMouse.id, description: C.products.mouse,    qty: 20, unitPrice: 12.00, organizationId: orgId }, { transaction: t }),
      PurchaseOrderItem.create({ purchaseOrderId: po1.id, productId: pHub.id,   description: C.lineDesc.hubBulk, qty: 10, unitPrice: 20.00, organizationId: orgId }, { transaction: t }),
    ])
    const po2 = await PurchaseOrder.create(
      { refNo: 'PO-2026-0002', date: '2026-05-05', deliveryDate: null,
        vendorId: vOffice.id, notes: C.notes.po2, status: 'draft',
        organizationId: orgId, createdBy: userId },
      { transaction: t },
    )
    await Promise.all([
      PurchaseOrderItem.create({ purchaseOrderId: po2.id, productId: pPaper.id, description: C.products.paper, qty: 50, unitPrice: 3.00, organizationId: orgId }, { transaction: t }),
      PurchaseOrderItem.create({ purchaseOrderId: po2.id, productId: pPen.id,   description: C.products.pen,   qty: 200, unitPrice: 0.50, organizationId: orgId }, { transaction: t }),
    ])

    // ── Goods Receive ─────────────────────────────────────────────────────────
    const gr1 = await GoodReceive.create(
      { refNo: 'GR-2026-0001', date: '2026-01-15', supplier: C.vendors.tech.name,
        storeId: mainWhs.id, docType: 'invoice', invoiceNo: 'INV-TS-20260115',
        invoiceDate: '2026-01-15', invoiceNetAmount: 640.00,
        notes: C.notes.gr1, status: 'confirmed',
        organizationId: orgId, createdBy: userId },
      { transaction: t },
    )
    await Promise.all([
      GoodReceiveItem.create({ goodReceiveId: gr1.id, productId: pMouse.id,    qty: 20, cost: 12.00, wac: 12.00, netAmount: 240.00, organizationId: orgId }, { transaction: t }),
      GoodReceiveItem.create({ goodReceiveId: gr1.id, productId: pHub.id,      qty: 10, cost: 20.00, wac: 20.00, netAmount: 200.00, organizationId: orgId }, { transaction: t }),
      GoodReceiveItem.create({ goodReceiveId: gr1.id, productId: pKeyboard.id, qty: 5,  cost: 40.00, wac: 40.00, netAmount: 200.00, organizationId: orgId }, { transaction: t }),
    ])

    const gr2 = await GoodReceive.create(
      { refNo: 'GR-2026-0002', date: '2026-02-10', supplier: C.vendors.food.name,
        storeId: mainWhs.id, docType: 'invoice', invoiceNo: 'INV-FL-20260210',
        invoiceDate: '2026-02-10', invoiceNetAmount: 290.00,
        notes: C.notes.gr2, status: 'confirmed',
        organizationId: orgId, createdBy: userId },
      { transaction: t },
    )
    await Promise.all([
      GoodReceiveItem.create({ goodReceiveId: gr2.id, productId: pWater.id,  qty: 200, cost: 0.40, wac: 0.40, netAmount: 80.00,  organizationId: orgId }, { transaction: t }),
      GoodReceiveItem.create({ goodReceiveId: gr2.id, productId: pCoffee.id, qty: 30,  cost: 7.00, wac: 7.00, netAmount: 210.00, organizationId: orgId }, { transaction: t }),
    ])

    const gr3 = await GoodReceive.create(
      { refNo: 'GR-2026-0003', date: '2026-05-08', supplier: C.vendors.office.name,
        storeId: mainWhs.id, docType: 'invoice', invoiceNo: null,
        notes: C.notes.gr3, status: 'draft',
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
        storeId: mainWhs.id, reason: C.notes.sa1reason,
        notes: C.notes.sa1notes,
        status: 'confirmed', organizationId: orgId, createdBy: userId },
      { transaction: t },
    )
    await StockAdjustItem.create(
      { stockAdjustId: sa1.id, productId: pMouse.id, qty: 5, organizationId: orgId },
      { transaction: t },
    )

    const sa2 = await StockAdjust.create(
      { refNo: 'SA-2026-0002', date: '2026-04-30',
        storeId: northBranch.id, reason: C.notes.sa2reason,
        notes: C.notes.sa2notes,
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
        storeId: mainWhs.id, notes: C.notes.sc1,
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
        storeId: northBranch.id, notes: C.notes.sc2,
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
        notes: C.notes.sr1,
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
        notes: C.notes.sr2,
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
        storeId: mainWhs.id, notes: C.notes.ret1,
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
        storeId: mainWhs.id, reason: C.notes.si1reason,
        notes: C.notes.si1notes,
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
        description: C.journals.je1.desc,
        totalDebit: 50000.00, status: 'posted',
        organizationId: orgId, createdBy: userId },
      { transaction: t },
    )
    await Promise.all([
      JournalLine.create({ journalId: je1.id, lineNo: 1, accountId: accBank.id,    description: C.journals.je1.l1, debit: 50000.00, credit: 0,        organizationId: orgId }, { transaction: t }),
      JournalLine.create({ journalId: je1.id, lineNo: 2, accountId: accCapital.id, description: C.journals.je1.l2, debit: 0,        credit: 50000.00, organizationId: orgId }, { transaction: t }),
    ])

    // JE-2026-0002: Jan 15 — Inventory purchase (GR-0001)
    const je2 = await Journal.create(
      { refNo: 'JE-2026-0002', date: '2026-01-15',
        description: C.journals.je2.desc,
        totalDebit: 640.00, status: 'posted',
        organizationId: orgId, createdBy: userId },
      { transaction: t },
    )
    await Promise.all([
      JournalLine.create({ journalId: je2.id, lineNo: 1, accountId: accInv.id,  description: C.journals.je2.l1, debit: 640.00, credit: 0,      organizationId: orgId }, { transaction: t }),
      JournalLine.create({ journalId: je2.id, lineNo: 2, accountId: accAP.id,   description: C.journals.je2.l2, debit: 0,      credit: 640.00, organizationId: orgId }, { transaction: t }),
    ])

    // JE-2026-0003: Feb 1 — Monthly rent
    const je3 = await Journal.create(
      { refNo: 'JE-2026-0003', date: '2026-02-01',
        description: C.journals.je3.desc,
        totalDebit: 3000.00, status: 'posted',
        organizationId: orgId, createdBy: userId },
      { transaction: t },
    )
    await Promise.all([
      JournalLine.create({ journalId: je3.id, lineNo: 1, accountId: accRent.id, description: C.journals.je3.l1, debit: 3000.00, credit: 0,       organizationId: orgId }, { transaction: t }),
      JournalLine.create({ journalId: je3.id, lineNo: 2, accountId: accBank.id, description: C.journals.je3.l2, debit: 0,       credit: 3000.00, organizationId: orgId }, { transaction: t }),
    ])

    // JE-2026-0004: Apr 14 — Revenue recognition INV-2026-0003 (Carol, paid)
    const je4 = await Journal.create(
      { refNo: 'JE-2026-0004', date: '2026-04-14',
        description: C.journals.je4.desc,
        totalDebit: 299.56, status: 'posted',
        organizationId: orgId, createdBy: userId },
      { transaction: t },
    )
    await Promise.all([
      JournalLine.create({ journalId: je4.id, lineNo: 1, accountId: accAR.id,    description: C.journals.je4.l1, debit: 299.56, credit: 0,      organizationId: orgId }, { transaction: t }),
      JournalLine.create({ journalId: je4.id, lineNo: 2, accountId: accSales.id, description: C.journals.je4.l2, debit: 0,      credit: 299.56, organizationId: orgId }, { transaction: t }),
    ])

    // JE-2026-0005: Apr 15 — Revenue recognition INV-2026-0001 (Alice, sent)
    const je5 = await Journal.create(
      { refNo: 'JE-2026-0005', date: '2026-04-15',
        description: C.journals.je5.desc,
        totalDebit: 320.89, status: 'posted',
        organizationId: orgId, createdBy: userId },
      { transaction: t },
    )
    await Promise.all([
      JournalLine.create({ journalId: je5.id, lineNo: 1, accountId: accAR.id,    description: C.journals.je5.l1, debit: 320.89, credit: 0,      organizationId: orgId }, { transaction: t }),
      JournalLine.create({ journalId: je5.id, lineNo: 2, accountId: accSales.id, description: C.journals.je5.l2, debit: 0,      credit: 320.89, organizationId: orgId }, { transaction: t }),
    ])

    // JE-2026-0006: Apr 25 — Payment received from Carol
    const je6 = await Journal.create(
      { refNo: 'JE-2026-0006', date: '2026-04-25',
        description: C.journals.je6.desc,
        totalDebit: 299.56, status: 'posted',
        organizationId: orgId, createdBy: userId },
      { transaction: t },
    )
    await Promise.all([
      JournalLine.create({ journalId: je6.id, lineNo: 1, accountId: accBank.id, description: C.journals.je6.l1, debit: 299.56, credit: 0,      organizationId: orgId }, { transaction: t }),
      JournalLine.create({ journalId: je6.id, lineNo: 2, accountId: accAR.id,   description: C.journals.je6.l2, debit: 0,      credit: 299.56, organizationId: orgId }, { transaction: t }),
    ])

    // JE-2026-0007: Apr 30 — COGS recognition April sales
    const je7 = await Journal.create(
      { refNo: 'JE-2026-0007', date: '2026-04-30',
        description: C.journals.je7.desc,
        totalDebit: 141.96, status: 'posted',
        organizationId: orgId, createdBy: userId },
      { transaction: t },
    )
    await Promise.all([
      JournalLine.create({ journalId: je7.id, lineNo: 1, accountId: accCOGS.id, description: C.journals.je7.l1, debit: 141.96, credit: 0,      organizationId: orgId }, { transaction: t }),
      JournalLine.create({ journalId: je7.id, lineNo: 2, accountId: accInv.id,  description: C.journals.je7.l2, debit: 0,      credit: 141.96, organizationId: orgId }, { transaction: t }),
    ])

    // JE-2026-0008: May 1 — Utilities expense
    const je8 = await Journal.create(
      { refNo: 'JE-2026-0008', date: '2026-05-01',
        description: C.journals.je8.desc,
        totalDebit: 450.00, status: 'posted',
        organizationId: orgId, createdBy: userId },
      { transaction: t },
    )
    await Promise.all([
      JournalLine.create({ journalId: je8.id, lineNo: 1, accountId: accUtils.id, description: C.journals.je8.l1, debit: 450.00, credit: 0,      organizationId: orgId }, { transaction: t }),
      JournalLine.create({ journalId: je8.id, lineNo: 2, accountId: accBank.id,  description: C.journals.je8.l2, debit: 0,      credit: 450.00, organizationId: orgId }, { transaction: t }),
    ])

    // JE-2026-0009: May 31 — May payroll (draft)
    const je9 = await Journal.create(
      { refNo: 'JE-2026-0009', date: '2026-05-31',
        description: C.journals.je9.desc,
        totalDebit: 5000.00, status: 'draft',
        organizationId: orgId, createdBy: userId },
      { transaction: t },
    )
    await Promise.all([
      JournalLine.create({ journalId: je9.id, lineNo: 1, accountId: accSalary.id, description: C.journals.je9.l1, debit: 5000.00, credit: 0,       organizationId: orgId }, { transaction: t }),
      JournalLine.create({ journalId: je9.id, lineNo: 2, accountId: accBank.id,   description: C.journals.je9.l2, debit: 0,       credit: 5000.00, organizationId: orgId }, { transaction: t }),
    ])

    // JE-2026-0010: Jun 1 — June rent (draft)
    const je10 = await Journal.create(
      { refNo: 'JE-2026-0010', date: '2026-06-01',
        description: C.journals.je10.desc,
        totalDebit: 3000.00, status: 'draft',
        organizationId: orgId, createdBy: userId },
      { transaction: t },
    )
    await Promise.all([
      JournalLine.create({ journalId: je10.id, lineNo: 1, accountId: accRent.id, description: C.journals.je10.l1, debit: 3000.00, credit: 0,       organizationId: orgId }, { transaction: t }),
      JournalLine.create({ journalId: je10.id, lineNo: 2, accountId: accBank.id, description: C.journals.je10.l2, debit: 0,       credit: 3000.00, organizationId: orgId }, { transaction: t }),
    ])

    await t.commit()
    return { message: C.message }
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
      TaxPeriod,
    } = require('../../../../server/models')

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
      TaxPeriod,
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
