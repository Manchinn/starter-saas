const {
  UOM, ProductCategory, Product,
  CustomerGroup, Customer,
  Vendor, Store,
} = require('../../../server/models')
const sequelize = require('../../../server/config/database')

// ── Seed ─────────────────────────────────────────────────────────────────────

async function seedDemo(userId) {
  const t = await sequelize.transaction()
  try {
    // UOMs
    const [unit, kg, liter, box] = await Promise.all([
      UOM.create({ name: 'Unit',   abbreviation: 'unit', createdBy: userId }, { transaction: t }),
      UOM.create({ name: 'Kilogram', abbreviation: 'kg', createdBy: userId }, { transaction: t }),
      UOM.create({ name: 'Liter',  abbreviation: 'L',   createdBy: userId }, { transaction: t }),
      UOM.create({ name: 'Box',    abbreviation: 'box', createdBy: userId }, { transaction: t }),
    ])

    // Categories
    const [electronics, food, office] = await Promise.all([
      ProductCategory.create({ code: 'CAT-ELEC', name: 'Electronics',    createdBy: userId }, { transaction: t }),
      ProductCategory.create({ code: 'CAT-FOOD', name: 'Food & Beverage', createdBy: userId }, { transaction: t }),
      ProductCategory.create({ code: 'CAT-OFFC', name: 'Office Supplies', createdBy: userId }, { transaction: t }),
    ])

    // Products
    await Promise.all([
      Product.create({ name: 'Wireless Mouse',   sku: 'PRD-0001', price: 29.99, cost: 12.00, stock: 150, sellingUomId: unit.id,  purchasingUomId: box.id,   category: electronics.name, createdBy: userId }, { transaction: t }),
      Product.create({ name: 'USB-C Hub',        sku: 'PRD-0002', price: 49.99, cost: 20.00, stock: 80,  sellingUomId: unit.id,  purchasingUomId: box.id,   category: electronics.name, createdBy: userId }, { transaction: t }),
      Product.create({ name: 'Mechanical Keyboard', sku: 'PRD-0003', price: 89.99, cost: 40.00, stock: 60, sellingUomId: unit.id, purchasingUomId: box.id,   category: electronics.name, createdBy: userId }, { transaction: t }),
      Product.create({ name: 'Mineral Water 1L', sku: 'PRD-0004', price: 0.99,  cost: 0.40,  stock: 500, sellingUomId: liter.id, purchasingUomId: box.id,   category: food.name,        createdBy: userId }, { transaction: t }),
      Product.create({ name: 'Arabica Coffee',   sku: 'PRD-0005', price: 14.99, cost: 7.00,  stock: 200, sellingUomId: kg.id,    purchasingUomId: kg.id,    category: food.name,        createdBy: userId }, { transaction: t }),
      Product.create({ name: 'A4 Paper Ream',    sku: 'PRD-0006', price: 5.99,  cost: 3.00,  stock: 300, sellingUomId: box.id,  purchasingUomId: box.id,   category: office.name,      createdBy: userId }, { transaction: t }),
      Product.create({ name: 'Ballpoint Pen',    sku: 'PRD-0007', price: 1.50,  cost: 0.50,  stock: 1000, sellingUomId: unit.id, purchasingUomId: box.id,  category: office.name,      createdBy: userId }, { transaction: t }),
    ])

    // Customer Groups
    const [retail, wholesale] = await Promise.all([
      CustomerGroup.create({ name: 'Retail',    description: 'Walk-in customers'     }, { transaction: t }),
      CustomerGroup.create({ name: 'Wholesale', description: 'Bulk-buy distributors' }, { transaction: t }),
    ])

    // Customers
    await Promise.all([
      Customer.create({ code: 'CUS-0001', name: 'Alice Johnson',  email: 'alice@example.com',  phone: '555-0101', company: 'Alice Co.',    customerGroupId: retail.id    }, { transaction: t }),
      Customer.create({ code: 'CUS-0002', name: 'Bob Smith',      email: 'bob@example.com',    phone: '555-0102', company: 'Smith Ltd.',    customerGroupId: retail.id    }, { transaction: t }),
      Customer.create({ code: 'CUS-0003', name: 'Carol Davis',    email: 'carol@example.com',  phone: '555-0103', company: 'Davis Corp.',   customerGroupId: wholesale.id }, { transaction: t }),
      Customer.create({ code: 'CUS-0004', name: 'David Lee',      email: 'david@example.com',  phone: '555-0104', company: 'Lee Group.',    customerGroupId: wholesale.id }, { transaction: t }),
      Customer.create({ code: 'CUS-0005', name: 'Eva Martinez',   email: 'eva@example.com',    phone: '555-0105', company: 'Martinez Inc.', customerGroupId: retail.id    }, { transaction: t }),
    ])

    // Vendors
    await Promise.all([
      Vendor.create({ code: 'VND-0001', name: 'TechSource Global',   contactPerson: 'Tom Wu',    email: 'tom@techsource.com',    phone: '555-0201', vendorTypes: ['supplier'],                       createdBy: userId }, { transaction: t }),
      Vendor.create({ code: 'VND-0002', name: 'FoodLink Supplies',   contactPerson: 'Sara Kim',  email: 'sara@foodlink.com',     phone: '555-0202', vendorTypes: ['supplier'],                       createdBy: userId }, { transaction: t }),
      Vendor.create({ code: 'VND-0003', name: 'OfficeWorld Dist.',   contactPerson: 'James Park', email: 'james@officeworld.com', phone: '555-0203', vendorTypes: ['supplier'],                      createdBy: userId }, { transaction: t }),
      Vendor.create({ code: 'VND-0004', name: 'CleanPro Services',   contactPerson: 'Linda Ho',  email: 'linda@cleanpro.com',    phone: '555-0204', vendorTypes: ['service_provider'],               createdBy: userId }, { transaction: t }),
      Vendor.create({ code: 'VND-0005', name: 'SwiftLogistics Co.',  contactPerson: 'Mark Tan',  email: 'mark@swiftlogistics.com', phone: '555-0205', vendorTypes: ['service_provider'],             createdBy: userId }, { transaction: t }),
      Vendor.create({ code: 'VND-0006', name: 'UniTrade Partners',   contactPerson: 'Nora Lim',  email: 'nora@unitrade.com',     phone: '555-0206', vendorTypes: ['supplier', 'service_provider'],   createdBy: userId }, { transaction: t }),
    ])

    // Stores
    await Promise.all([
      Store.create({ code: 'WHS-0001', name: 'Main Warehouse', address: '100 Industrial Rd, City', createdBy: userId }, { transaction: t }),
      Store.create({ code: 'WHS-0002', name: 'North Branch',   address: '45 North Ave, City',       createdBy: userId }, { transaction: t }),
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

    // Delete in dependency order (leaf → root)
    const {
      SaleItem, SalesOrderItem, Order,
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
      Customer, CustomerGroup,
      Vendor,
      EmployeeDepartment, Employee, Department,
    } = require('../../../server/models')

    const ordered = [
      SaleItem, SalesOrderItem, Order,
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
      Customer, CustomerGroup,
      Vendor,
      EmployeeDepartment, Employee, Department,
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
