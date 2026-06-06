// Global system master-data categories + values (org-independent reference data).
const MASTER_DATA_SEED = [
  {
    slug: 'payment-terms', name: 'Payment Terms',
    description: 'Customer / vendor payment terms used on orders, invoices, and bills.', isSystem: true,
    values: [
      { code: 'cod',     name: 'COD (Cash on Delivery)', sortOrder: 10 },
      { code: 'prepaid', name: 'Prepaid',                sortOrder: 20 },
      { code: 'net7',    name: 'Net 7',                  sortOrder: 30 },
      { code: 'net15',   name: 'Net 15',                 sortOrder: 40 },
      { code: 'net30',   name: 'Net 30',                 sortOrder: 50 },
      { code: 'net60',   name: 'Net 60',                 sortOrder: 60 },
      { code: 'net90',   name: 'Net 90',                 sortOrder: 70 },
    ],
  },
  {
    slug: 'payment-methods', name: 'Payment Methods',
    description: 'Available payment methods for receipts', isSystem: true,
    values: [
      { code: 'cash',          name: 'Cash',          sortOrder: 10 },
      { code: 'credit_card',   name: 'Credit Card',   sortOrder: 20 },
      { code: 'bank_transfer', name: 'Bank Transfer', sortOrder: 30 },
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
      { code: 'active',   name: 'Active',   sortOrder: 10 },
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
      { code: 'active',   name: 'Active',   sortOrder: 10 },
      { code: 'inactive', name: 'Inactive', sortOrder: 20 },
    ],
  },
  {
    slug: 'product-category-statuses', name: 'Product Category Statuses',
    description: 'Status options for product categories', isSystem: true,
    values: [
      { code: 'active',   name: 'Active',   sortOrder: 10 },
      { code: 'inactive', name: 'Inactive', sortOrder: 20 },
    ],
  },
  {
    slug: 'pricing-statuses', name: 'Pricing Statuses',
    description: 'Status options for price lists', isSystem: true,
    values: [
      { code: 'active',   name: 'Active',   sortOrder: 10 },
      { code: 'inactive', name: 'Inactive', sortOrder: 20 },
    ],
  },
  {
    slug: 'sale-item-statuses', name: 'Sale Item Statuses',
    description: 'Status options for sale items', isSystem: true,
    values: [
      { code: 'active',   name: 'Active',   sortOrder: 10 },
      { code: 'inactive', name: 'Inactive', sortOrder: 20 },
    ],
  },
  {
    slug: 'wht-type', name: 'WHT Type',
    description: 'Withholding tax types; dataValue holds the rate (%).', isSystem: true,
    values: [
      { code: 'pnd3-service',  name: 'ค่าบริการบุคคลธรรมดา (ภงด.3)', dataValue: '3', sortOrder: 10 },
      { code: 'pnd53-service', name: 'ค่าบริการนิติบุคคล (ภงด.53)',  dataValue: '3', sortOrder: 20 },
      { code: 'pnd53-rental',  name: 'ค่าเช่า (ภงด.53)',             dataValue: '5', sortOrder: 30 },
      { code: 'pnd53-advert',  name: 'ค่าโฆษณา (ภงด.53)',            dataValue: '2', sortOrder: 40 },
    ],
  },
]

module.exports = {
  name: 'master-data',
  tier: 'core',
  order: 30,
  async run(ctx) {
    const { MasterDataCategory, MasterDataValue } = ctx.models
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
  },
}
