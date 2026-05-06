require('dotenv').config()
const {
  sequelize, User, Module, Role, Permission, MasterDataCategory, MasterDataValue,
  // ERP
  UOM, Store, ProductCategory, Product, ProductStore, ProductVendor,
  Vendor, CustomerGroup, Customer,
  Department, Employee,
  SaleItem, Pricing,
} = require('../models')

const DEFAULT_PERMISSIONS = [
  // Dashboard
  { name: 'View Dashboard', slug: 'dashboard.view', group: 'dashboard', description: 'Access the dashboard' },
  // Organizations
  { name: 'List Organizations', slug: 'organizations.list', group: 'organizations', description: 'View list of organizations' },
  { name: 'Edit Organizations', slug: 'organizations.edit', group: 'organizations', description: 'Edit organization details' },
  { name: 'Delete Organizations', slug: 'organizations.delete', group: 'organizations', description: 'Delete organizations' },
  // Modules
  { name: 'List Modules', slug: 'modules.list', group: 'modules', description: 'View modules' },
  { name: 'Manage Modules', slug: 'modules.manage', group: 'modules', description: 'Create/edit/toggle modules' },
  // Roles
  { name: 'List Roles', slug: 'roles.list', group: 'roles', description: 'View roles and their permissions' },
  { name: 'Manage Roles', slug: 'roles.manage', group: 'roles', description: 'Create/edit/delete roles' },
  // Permissions
  { name: 'List Permissions', slug: 'permissions.list', group: 'permissions', description: 'View permissions' },
  { name: 'Manage Permissions', slug: 'permissions.manage', group: 'permissions', description: 'Create/edit/delete permissions' },
]

const DEFAULT_ROLES = [
  {
    name: 'Super Admin',
    slug: 'super-admin',
    description: 'Full access to everything',
    color: '#7c3aed',
    isSystem: true,
    permissionSlugs: DEFAULT_PERMISSIONS.map((p) => p.slug),
  },
  {
    name: 'Manager',
    slug: 'manager',
    description: 'Can manage organizations and view modules',
    color: '#2563eb',
    isSystem: false,
    permissionSlugs: ['dashboard.view', 'organizations.list', 'organizations.edit', 'modules.list', 'roles.list', 'permissions.list'],
  },
  {
    name: 'Viewer',
    slug: 'viewer',
    description: 'Read-only access',
    color: '#16a34a',
    isSystem: false,
    permissionSlugs: ['dashboard.view', 'organizations.list', 'modules.list'],
  },
]

const MASTER_DATA_SEED = [
  {
    slug: 'payment-methods', name: 'Payment Methods',
    description: 'Available payment methods for receipts', isSystem: true,
    values: [
      { code: 'cash',          name: 'Cash',          sortOrder: 10 },
      { code: 'credit_card',   name: 'Credit Card',   sortOrder: 20 },
      { code: 'bank_transfer', name: 'Bank Transfer',  sortOrder: 30 },
      { code: 'check',         name: 'Check',         sortOrder: 40 },
    ],
  },
  {
    slug: 'adjustment-reasons', name: 'Stock Adjustment Reasons',
    description: 'Reasons for stock adjustments', isSystem: true,
    values: [
      { code: 'damaged',    name: 'Damaged',    sortOrder: 10 },
      { code: 'expired',    name: 'Expired',    sortOrder: 20 },
      { code: 'miscounted', name: 'Miscounted', sortOrder: 30 },
      { code: 'returned',   name: 'Returned',   sortOrder: 40 },
      { code: 'other',      name: 'Other',      sortOrder: 50 },
    ],
  },
  {
    slug: 'issue-reasons', name: 'Stock Issue Reasons',
    description: 'Reasons for issuing stock out of warehouse', isSystem: true,
    values: [
      { code: 'internal_use', name: 'Internal Use', sortOrder: 10 },
      { code: 'transfer',     name: 'Transfer',     sortOrder: 20 },
      { code: 'damaged',      name: 'Damaged',      sortOrder: 30 },
      { code: 'expired',      name: 'Expired',      sortOrder: 40 },
      { code: 'other',        name: 'Other',        sortOrder: 50 },
    ],
  },
  {
    slug: 'return-reasons', name: 'Stock Return Reasons',
    description: 'Reasons for returning stock', isSystem: true,
    values: [
      { code: 'wrong_item', name: 'Wrong Item',   sortOrder: 10 },
      { code: 'damaged',    name: 'Damaged',      sortOrder: 20 },
      { code: 'expired',    name: 'Expired',      sortOrder: 30 },
      { code: 'excess',     name: 'Excess Stock', sortOrder: 40 },
      { code: 'other',      name: 'Other',        sortOrder: 50 },
    ],
  },
  {
    slug: 'vendor-statuses', name: 'Vendor Statuses',
    description: 'Status options for vendors', isSystem: true,
    values: [
      { code: 'active', name: 'Active', sortOrder: 10 },
      { code: 'inactive', name: 'Inactive', sortOrder: 20 },
    ],
  },
  {
    slug: 'employee-statuses', name: 'Employee Statuses',
    description: 'Employment status options', isSystem: true,
    values: [
      { code: 'active',     name: 'Active',     sortOrder: 10 },
      { code: 'inactive',   name: 'Inactive',   sortOrder: 20 },
      { code: 'terminated', name: 'Terminated', sortOrder: 30 },
    ],
  },
  {
    slug: 'product-statuses', name: 'Product Statuses',
    description: 'Status options for products', isSystem: true,
    values: [
      { code: 'active', name: 'Active', sortOrder: 10 },
      { code: 'inactive', name: 'Inactive', sortOrder: 20 },
    ],
  },
  {
    slug: 'product-category-statuses', name: 'Product Category Statuses',
    description: 'Status options for product categories', isSystem: true,
    values: [
      { code: 'active', name: 'Active', sortOrder: 10 },
      { code: 'inactive', name: 'Inactive', sortOrder: 20 },
    ],
  },
  {
    slug: 'pricing-statuses', name: 'Pricing Statuses',
    description: 'Status options for price lists', isSystem: true,
    values: [
      { code: 'active', name: 'Active', sortOrder: 10 },
      { code: 'inactive', name: 'Inactive', sortOrder: 20 },
    ],
  },
  {
    slug: 'sale-item-statuses', name: 'Sale Item Statuses',
    description: 'Status options for sale items', isSystem: true,
    values: [
      { code: 'active', name: 'Active', sortOrder: 10 },
      { code: 'inactive', name: 'Inactive', sortOrder: 20 },
    ],
  },
]

async function seedErpDemo(orgId, userId) {
  // ── UOM ──────────────────────────────────────────────────────────────────────
  const uoms = await UOM.bulkCreate([
    { name: 'Piece',     abbreviation: 'pcs',  description: 'Single unit',          status: 'active', organizationId: orgId, createdBy: userId },
    { name: 'Box',       abbreviation: 'box',  description: '12 pieces per box',    status: 'active', organizationId: orgId, createdBy: userId },
    { name: 'Kilogram',  abbreviation: 'kg',   description: 'Weight in kilograms',  status: 'active', organizationId: orgId, createdBy: userId },
    { name: 'Litre',     abbreviation: 'L',    description: 'Volume in litres',     status: 'active', organizationId: orgId, createdBy: userId },
    { name: 'Metre',     abbreviation: 'm',    description: 'Length in metres',     status: 'active', organizationId: orgId, createdBy: userId },
    { name: 'Pack',      abbreviation: 'pk',   description: 'Packaged bundle',      status: 'active', organizationId: orgId, createdBy: userId },
  ])
  const uomMap = Object.fromEntries(uoms.map(u => [u.abbreviation, u]))
  console.log(`  Created ${uoms.length} UOMs.`)

  // ── Stores ───────────────────────────────────────────────────────────────────
  const stores = await Store.bulkCreate([
    { name: 'Main Warehouse',  code: 'WH-MAIN', address: '123 Industrial Rd, Bangkok', phone: '02-111-0001', status: 'active', organizationId: orgId, createdBy: userId },
    { name: 'North Branch',    code: 'WH-NORTH', address: '45 Northern Ave, Chiang Mai', phone: '053-222-0002', status: 'active', organizationId: orgId, createdBy: userId },
    { name: 'South Outlet',    code: 'WH-SOUTH', address: '78 Coast Rd, Phuket',        phone: '076-333-0003', status: 'active', organizationId: orgId, createdBy: userId },
  ])
  console.log(`  Created ${stores.length} stores.`)

  // ── Product Categories ───────────────────────────────────────────────────────
  const categories = await ProductCategory.bulkCreate([
    { code: 'ELEC', name: 'Electronics',    description: 'Electronic devices and accessories', status: 'active', organizationId: orgId, createdBy: userId },
    { code: 'FURN', name: 'Furniture',      description: 'Office and home furniture',           status: 'active', organizationId: orgId, createdBy: userId },
    { code: 'STAT', name: 'Stationery',     description: 'Office stationery supplies',          status: 'active', organizationId: orgId, createdBy: userId },
    { code: 'CHEM', name: 'Chemicals',      description: 'Cleaning and chemical products',      status: 'active', organizationId: orgId, createdBy: userId },
    { code: 'FOOD', name: 'Food & Beverage', description: 'Consumable food items',              status: 'active', organizationId: orgId, createdBy: userId },
  ])
  const catMap = Object.fromEntries(categories.map(c => [c.code, c]))
  console.log(`  Created ${categories.length} product categories.`)

  // ── Vendors ──────────────────────────────────────────────────────────────────
  const vendors = await Vendor.bulkCreate([
    { code: 'VND-001', name: 'TechSupply Co.',      contactPerson: 'Somchai K.',  email: 'somchai@techsupply.th',  phone: '02-500-1001', vendorTypes: JSON.stringify(['electronics','hardware']), status: 'active', organizationId: orgId, createdBy: userId },
    { code: 'VND-002', name: 'Office World Ltd.',   contactPerson: 'Nipa S.',     email: 'nipa@officeworld.th',    phone: '02-500-2002', vendorTypes: JSON.stringify(['furniture','stationery']), status: 'active', organizationId: orgId, createdBy: userId },
    { code: 'VND-003', name: 'Clean Pro Supplies',  contactPerson: 'Wanchai T.',  email: 'wanchai@cleanpro.th',   phone: '038-300-3003', vendorTypes: JSON.stringify(['chemicals','cleaning']),   status: 'active', organizationId: orgId, createdBy: userId },
    { code: 'VND-004', name: 'Fresh Foods Import',  contactPerson: 'Malee P.',    email: 'malee@freshfoods.th',   phone: '02-400-4004', vendorTypes: JSON.stringify(['food','beverage']),         status: 'active', organizationId: orgId, createdBy: userId },
  ])
  console.log(`  Created ${vendors.length} vendors.`)

  // ── Products ─────────────────────────────────────────────────────────────────
  const products = await Product.bulkCreate([
    { name: 'Laptop 15"',          sku: 'ELEC-001', category: 'Electronics', price: 35000, cost: 28000, stock: 50,  unit: 'pcs', sellingUomId: uomMap['pcs'].id, purchasingUomId: uomMap['pcs'].id, categoryId: catMap['ELEC'].id, status: 'active', organizationId: orgId, createdBy: userId },
    { name: 'Wireless Mouse',      sku: 'ELEC-002', category: 'Electronics', price:  890,  cost:   450, stock: 200, unit: 'pcs', sellingUomId: uomMap['pcs'].id, purchasingUomId: uomMap['box'].id, categoryId: catMap['ELEC'].id, status: 'active', organizationId: orgId, createdBy: userId },
    { name: 'Mechanical Keyboard', sku: 'ELEC-003', category: 'Electronics', price: 2500,  cost:  1600, stock: 80,  unit: 'pcs', sellingUomId: uomMap['pcs'].id, purchasingUomId: uomMap['pcs'].id, categoryId: catMap['ELEC'].id, status: 'active', organizationId: orgId, createdBy: userId },
    { name: 'Office Desk 120cm',   sku: 'FURN-001', category: 'Furniture',   price: 4500,  cost:  2800, stock: 30,  unit: 'pcs', sellingUomId: uomMap['pcs'].id, purchasingUomId: uomMap['pcs'].id, categoryId: catMap['FURN'].id, status: 'active', organizationId: orgId, createdBy: userId },
    { name: 'Ergonomic Chair',     sku: 'FURN-002', category: 'Furniture',   price: 6800,  cost:  4200, stock: 25,  unit: 'pcs', sellingUomId: uomMap['pcs'].id, purchasingUomId: uomMap['pcs'].id, categoryId: catMap['FURN'].id, status: 'active', organizationId: orgId, createdBy: userId },
    { name: 'A4 Paper (500 sheets)',sku: 'STAT-001', category: 'Stationery', price:  120,  cost:    85, stock: 500, unit: 'pk',  sellingUomId: uomMap['pk'].id,  purchasingUomId: uomMap['box'].id, categoryId: catMap['STAT'].id, status: 'active', organizationId: orgId, createdBy: userId },
    { name: 'Ballpoint Pen Set',   sku: 'STAT-002', category: 'Stationery', price:   45,  cost:    22, stock: 300, unit: 'pk',  sellingUomId: uomMap['pk'].id,  purchasingUomId: uomMap['box'].id, categoryId: catMap['STAT'].id, status: 'active', organizationId: orgId, createdBy: userId },
    { name: 'Floor Cleaner 1L',    sku: 'CHEM-001', category: 'Chemicals',  price:   85,  cost:    48, stock: 150, unit: 'L',   sellingUomId: uomMap['L'].id,   purchasingUomId: uomMap['L'].id,   categoryId: catMap['CHEM'].id, status: 'active', organizationId: orgId, createdBy: userId },
    { name: 'Hand Sanitizer 500ml',sku: 'CHEM-002', category: 'Chemicals',  price:   65,  cost:    35, stock: 200, unit: 'pcs', sellingUomId: uomMap['pcs'].id, purchasingUomId: uomMap['box'].id, categoryId: catMap['CHEM'].id, status: 'active', organizationId: orgId, createdBy: userId },
    { name: 'Instant Coffee 200g', sku: 'FOOD-001', category: 'Food',       price:  180,  cost:   110, stock: 120, unit: 'kg',  sellingUomId: uomMap['kg'].id,  purchasingUomId: uomMap['box'].id, categoryId: catMap['FOOD'].id, status: 'active', organizationId: orgId, createdBy: userId },
  ])
  console.log(`  Created ${products.length} products.`)

  // Link products to stores
  const storeLinks = []
  for (const p of products) {
    storeLinks.push({ productId: p.id, storeId: stores[0].id, organizationId: orgId }) // all in main warehouse
  }
  for (const p of products.slice(0, 5)) {
    storeLinks.push({ productId: p.id, storeId: stores[1].id, organizationId: orgId }) // first 5 in north
  }
  await ProductStore.bulkCreate(storeLinks, { ignoreDuplicates: true })

  // Link products to vendors
  const vendorLinks = []
  for (const p of products.slice(0, 3)) vendorLinks.push({ productId: p.id, vendorId: vendors[0].id })
  for (const p of products.slice(3, 5)) vendorLinks.push({ productId: p.id, vendorId: vendors[1].id })
  for (const p of products.slice(5, 7)) vendorLinks.push({ productId: p.id, vendorId: vendors[1].id })
  for (const p of products.slice(7, 9)) vendorLinks.push({ productId: p.id, vendorId: vendors[2].id })
  for (const p of products.slice(9))    vendorLinks.push({ productId: p.id, vendorId: vendors[3].id })
  await ProductVendor.bulkCreate(vendorLinks, { ignoreDuplicates: true })
  console.log(`  Linked products to stores and vendors.`)

  // ── Customer Groups ──────────────────────────────────────────────────────────
  const groups = await CustomerGroup.bulkCreate([
    { name: 'Retail',      description: 'Walk-in retail customers', status: 'active', organizationId: orgId, createdBy: userId },
    { name: 'Wholesale',   description: 'Bulk purchase accounts',   status: 'active', organizationId: orgId, createdBy: userId },
    { name: 'VIP',         description: 'High-value accounts',      status: 'active', organizationId: orgId, createdBy: userId },
    { name: 'Government',  description: 'Government agencies',      status: 'active', organizationId: orgId, createdBy: userId },
  ])
  console.log(`  Created ${groups.length} customer groups.`)

  // ── Customers ────────────────────────────────────────────────────────────────
  await Customer.bulkCreate([
    { code: 'CUS-001', name: 'Bright Future Co., Ltd.',  company: 'Bright Future Co., Ltd.',  email: 'purchase@brightfuture.th',  phone: '02-111-2001', status: 'active', customerGroupId: groups[1].id, organizationId: orgId, createdBy: userId },
    { code: 'CUS-002', name: 'Sunrise Trading',          company: 'Sunrise Trading',           email: 'order@sunrisetrading.th',   phone: '02-111-2002', status: 'active', customerGroupId: groups[1].id, organizationId: orgId, createdBy: userId },
    { code: 'CUS-003', name: 'Metro Hospital',           company: 'Metro Hospital',            email: 'procurement@metrohospital.th', phone: '02-111-2003', status: 'active', customerGroupId: groups[3].id, organizationId: orgId, createdBy: userId },
    { code: 'CUS-004', name: 'Somchai Rattana',          company: '',                          email: 'somchai.r@gmail.com',       phone: '089-111-0004', status: 'active', customerGroupId: groups[0].id, organizationId: orgId, createdBy: userId },
    { code: 'CUS-005', name: 'Nipa Enterprises',         company: 'Nipa Enterprises',          email: 'nipa@nipaent.th',           phone: '02-222-0005', status: 'active', customerGroupId: groups[2].id, organizationId: orgId, createdBy: userId },
    { code: 'CUS-006', name: 'Bangkok City School',      company: 'Bangkok City School',       email: 'admin@bangkokcityschool.th', phone: '02-333-0006', status: 'active', customerGroupId: groups[3].id, organizationId: orgId, createdBy: userId },
    { code: 'CUS-007', name: 'Malee Supansa',            company: '',                          email: 'malee.s@hotmail.com',       phone: '081-444-0007', status: 'active', customerGroupId: groups[0].id, organizationId: orgId, createdBy: userId },
    { code: 'CUS-008', name: 'Global Tech Solutions',    company: 'Global Tech Solutions',     email: 'buy@globaltech.th',         phone: '02-555-0008', status: 'active', customerGroupId: groups[2].id, organizationId: orgId, createdBy: userId },
  ])
  console.log(`  Created 8 customers.`)

  // ── Sale Items ───────────────────────────────────────────────────────────────
  const saleItems = await SaleItem.bulkCreate(
    products.map((p, i) => ({
      code: `SI-${String(i + 1).padStart(3, '0')}`,
      name: p.name,
      productId: p.id,
      status: 'active',
      organizationId: orgId,
      createdBy: userId,
    }))
  )
  console.log(`  Created ${saleItems.length} sale items.`)

  // ── Pricing ──────────────────────────────────────────────────────────────────
  const pricingRows = []
  for (const [idx, si] of saleItems.entries()) {
    const product = products[idx]
    // Standard retail price
    pricingRows.push({ code: `PRC-R${String(idx+1).padStart(3,'0')}`, name: `${product.name} - Retail`,    unitPrice: product.price,                   saleItemId: si.id, customerGroupId: groups[0].id, status: 'active', organizationId: orgId, createdBy: userId })
    // Wholesale price (10% discount)
    pricingRows.push({ code: `PRC-W${String(idx+1).padStart(3,'0')}`, name: `${product.name} - Wholesale`, unitPrice: Math.round(product.price * 0.9), saleItemId: si.id, customerGroupId: groups[1].id, status: 'active', organizationId: orgId, createdBy: userId })
  }
  await Pricing.bulkCreate(pricingRows)
  console.log(`  Created ${pricingRows.length} pricing records.`)

  // ── Departments ──────────────────────────────────────────────────────────────
  const departments = await Department.bulkCreate([
    { code: 'IT',   name: 'Information Technology', description: 'IT infrastructure and software',  isActive: true, organizationId: orgId, createdBy: userId },
    { code: 'HR',   name: 'Human Resources',         description: 'Recruitment and HR operations',   isActive: true, organizationId: orgId, createdBy: userId },
    { code: 'FIN',  name: 'Finance',                 description: 'Finance and accounting',          isActive: true, organizationId: orgId, createdBy: userId },
    { code: 'SALE', name: 'Sales',                   description: 'Sales and business development',  isActive: true, organizationId: orgId, createdBy: userId },
    { code: 'WH',   name: 'Warehouse',               description: 'Warehouse and logistics',         isActive: true, organizationId: orgId, createdBy: userId },
  ])
  console.log(`  Created ${departments.length} departments.`)

  // ── Employees ────────────────────────────────────────────────────────────────
  await Employee.bulkCreate([
    { employeeCode: 'EMP-001', firstName: 'Somchai',  lastName: 'Kittipong',  position: 'IT Manager',        phone: '081-100-0001', startDate: '2020-01-15', status: 'active', organizationId: orgId, createdBy: userId },
    { employeeCode: 'EMP-002', firstName: 'Nipa',     lastName: 'Sriwan',     position: 'HR Specialist',     phone: '082-100-0002', startDate: '2019-06-01', status: 'active', organizationId: orgId, createdBy: userId },
    { employeeCode: 'EMP-003', firstName: 'Wanchai',  lastName: 'Thongsuk',   position: 'Finance Officer',   phone: '083-100-0003', startDate: '2021-03-10', status: 'active', organizationId: orgId, createdBy: userId },
    { employeeCode: 'EMP-004', firstName: 'Malee',    lastName: 'Phongphan',  position: 'Sales Executive',   phone: '084-100-0004', startDate: '2022-07-20', status: 'active', organizationId: orgId, createdBy: userId },
    { employeeCode: 'EMP-005', firstName: 'Prawit',   lastName: 'Suksai',     position: 'Warehouse Staff',   phone: '085-100-0005', startDate: '2021-11-05', status: 'active', organizationId: orgId, createdBy: userId },
    { employeeCode: 'EMP-006', firstName: 'Supawit',  lastName: 'Nakorn',     position: 'Sales Manager',     phone: '086-100-0006', startDate: '2018-04-01', status: 'active', organizationId: orgId, createdBy: userId },
    { employeeCode: 'EMP-007', firstName: 'Kannika',  lastName: 'Buranee',    position: 'Accountant',        phone: '087-100-0007', startDate: '2023-01-09', status: 'active', organizationId: orgId, createdBy: userId },
    { employeeCode: 'EMP-008', firstName: 'Arthit',   lastName: 'Wongkham',   position: 'IT Developer',      phone: '088-100-0008', startDate: '2022-09-15', status: 'active', organizationId: orgId, createdBy: userId },
  ])
  console.log(`  Created 8 employees.`)
}

async function seed() {
  await sequelize.sync({ force: true })
  console.log('Database synced.\n')

  // ── Permissions ──────────────────────────────────────────────────────────────
  const createdPerms = {}
  for (const p of DEFAULT_PERMISSIONS) {
    const perm = await Permission.create(p)
    createdPerms[p.slug] = perm
  }
  console.log(`Created ${Object.keys(createdPerms).length} permissions.`)

  // ── Roles ────────────────────────────────────────────────────────────────────
  const createdRoles = {}
  for (const r of DEFAULT_ROLES) {
    const { permissionSlugs, ...roleData } = r
    const role = await Role.create(roleData)
    const perms = permissionSlugs.map((s) => createdPerms[s]).filter(Boolean)
    await role.setPermissions(perms)
    createdRoles[r.slug] = role
  }
  console.log(`Created ${Object.keys(createdRoles).length} roles.`)

  // ── Admin user ───────────────────────────────────────────────────────────────
  const admin = await User.create({
    name: 'Admin',
    email: 'admin@example.com',
    password: 'Admin1234!',
    role: 'admin',
  })
  await admin.setRoles([createdRoles['super-admin']])
  console.log('Admin created:', admin.email)

  // ── Demo user ────────────────────────────────────────────────────────────────
  const demo = await User.create({
    name: 'Demo User',
    email: 'user@example.com',
    password: 'User1234!',
    role: 'user',
  })
  await demo.setRoles([createdRoles['viewer']])
  console.log('Demo user created:', demo.email)

  // ── Assign all modules to admin ──────────────────────────────────────────────
  const allModules = await Module.findAll()
  if (allModules.length) {
    await admin.setModules(allModules)
    console.log(`Assigned ${allModules.length} modules to admin.`)
  }

  // ── Master Data ──────────────────────────────────────────────────────────────
  for (const cat of MASTER_DATA_SEED) {
    const { values, ...catData } = cat
    const [category] = await MasterDataCategory.findOrCreate({ where: { slug: catData.slug }, defaults: catData })
    for (const v of values) {
      await MasterDataValue.findOrCreate({
        where: { categoryId: category.id, code: v.code },
        defaults: { ...v, categoryId: category.id, isActive: true },
      })
    }
  }
  console.log(`Seeded ${MASTER_DATA_SEED.length} master data categories.`)

  // ── ERP Demo Data ────────────────────────────────────────────────────────────
  console.log('\nSeeding ERP demo data...')
  const orgId = admin.id  // admin user ID acts as the organization scope
  await seedErpDemo(orgId, admin.id)

  console.log('\nSeed complete.\n')
  console.log('  Admin:     admin@example.com / Admin1234!')
  console.log('  Demo user: user@example.com  / User1234!')
  process.exit(0)
}

seed().catch((err) => {
  console.error(err)
  process.exit(1)
})
