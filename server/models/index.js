const sequelize = require('../config/database')

// ── Core (auth / platform) ───────────────────────────────────────────────────
const User = require('./User')
const Module = require('./Module')
const UserModule = require('./UserModule')
const RefreshToken = require('./RefreshToken')
const Role = require('./Role')
const Permission = require('./Permission')
const RolePermission = require('./RolePermission')
const RoleModule = require('./RoleModule')
const UserRole = require('./UserRole')

// ── ERP: Customers ───────────────────────────────────────────────────────────
const Customer = require('../../shared/erp/customers/models/Customer')
const CustomerGroup = require('../../shared/erp/customers/models/CustomerGroup')

// ── ERP: Products ────────────────────────────────────────────────────────────
const Item = require('../../shared/erp/products/models/Item')
const Product = require('../../shared/erp/products/models/Product')
const ProductCategory = require('../../shared/erp/products/models/ProductCategory')
const ProductStore = require('../../shared/erp/products/models/ProductStore')
const ProductVendor = require('../../shared/erp/products/models/ProductVendor')

// ── ERP: Orders ──────────────────────────────────────────────────────────────
const Order = require('../../shared/erp/orders/models/Order')
const SalesOrderItem = require('../../shared/erp/orders/models/SalesOrderItem')

// ── ERP: Pricing ─────────────────────────────────────────────────────────────
const Pricing = require('../../shared/erp/pricing/models/Pricing')

// ── ERP: Inventory ───────────────────────────────────────────────────────────
const Store = require('../../shared/erp/inventory/models/Store')
const StoreStock = require('../../shared/erp/inventory/models/StoreStock')
const UOM = require('../../shared/erp/inventory/models/UOM')
const UOMConversion = require('../../shared/erp/inventory/models/UOMConversion')

// ── ERP: Vendors ─────────────────────────────────────────────────────────────
const Vendor = require('../../shared/erp/vendors/models/Vendor')

// ── ERP: Stock ───────────────────────────────────────────────────────────────
const GoodReceive = require('../../shared/erp/stock/good-receive/models/GoodReceive')
const GoodReceiveItem = require('../../shared/erp/stock/good-receive/models/GoodReceiveItem')
const StockAdjust = require('../../shared/erp/stock/stock-adjust/models/StockAdjust')
const StockAdjustItem = require('../../shared/erp/stock/stock-adjust/models/StockAdjustItem')
const StockMovement = require('../../shared/erp/stock/stock-movement/models/StockMovement')
const StockRequest = require('../../shared/erp/stock/stock-request/models/StockRequest')
const StockRequestItem = require('../../shared/erp/stock/stock-request/models/StockRequestItem')
const StockCount = require('../../shared/erp/stock/stock-count/models/StockCount')
const StockCountItem = require('../../shared/erp/stock/stock-count/models/StockCountItem')
const StockReturn = require('../../shared/erp/stock/stock-return/models/StockReturn')
const StockReturnItem = require('../../shared/erp/stock/stock-return/models/StockReturnItem')
const StockIssue = require('../../shared/erp/stock/stock-issue/models/StockIssue')
const StockIssueItem = require('../../shared/erp/stock/stock-issue/models/StockIssueItem')

// ── ERP: Sale ────────────────────────────────────────────────────────────────
const SaleItem = require('../../shared/erp/sale/models/SaleItem')

// ── ERP: Settings ────────────────────────────────────────────────────────────
const Sequence = require('../../shared/erp/settings/models/Sequence')

// ── User ↔ Module ───────────────────────────────────────────────────────────
User.belongsToMany(Module, { through: UserModule, foreignKey: 'userId', as: 'modules' })
Module.belongsToMany(User, { through: UserModule, foreignKey: 'moduleId', as: 'users' })

// ── User ↔ RefreshToken ─────────────────────────────────────────────────────
User.hasMany(RefreshToken, { foreignKey: 'userId', as: 'refreshTokens', onDelete: 'CASCADE' })
RefreshToken.belongsTo(User, { foreignKey: 'userId', as: 'user' })

// ── Role ↔ Permission ───────────────────────────────────────────────────────
Role.belongsToMany(Permission, { through: RolePermission, foreignKey: 'roleId', as: 'permissions' })
Permission.belongsToMany(Role, { through: RolePermission, foreignKey: 'permissionId', as: 'roles' })

// ── Role ↔ Module ───────────────────────────────────────────────────────────
Role.belongsToMany(Module, { through: RoleModule, foreignKey: 'roleId', as: 'modules' })
Module.belongsToMany(Role, { through: RoleModule, foreignKey: 'moduleId', as: 'roles' })

// ── User ↔ Role ─────────────────────────────────────────────────────────────
User.belongsToMany(Role, { through: UserRole, foreignKey: 'userId', as: 'roles' })
Role.belongsToMany(User, { through: UserRole, foreignKey: 'roleId', as: 'users' })

// ── CustomerGroup ↔ Customer ─────────────────────────────────────────────────
CustomerGroup.hasMany(Customer, { foreignKey: 'customerGroupId', as: 'customers' })
Customer.belongsTo(CustomerGroup, { foreignKey: 'customerGroupId', as: 'group' })

// ── Order ↔ Customer ────────────────────────────────────────────────────────
Order.belongsTo(Customer, { foreignKey: 'customerId', as: 'customer' })
Customer.hasMany(Order, { foreignKey: 'customerId', as: 'orders' })

// ── Order ↔ SalesOrderItem ───────────────────────────────────────────────────────
Order.hasMany(SalesOrderItem, { foreignKey: 'orderId', as: 'items', onDelete: 'CASCADE' })
SalesOrderItem.belongsTo(Order, { foreignKey: 'orderId', as: 'order' })

// ── SalesOrderItem ↔ Product ─────────────────────────────────────────────────────
SalesOrderItem.belongsTo(Product, { foreignKey: 'productId', as: 'product' })
Product.hasMany(SalesOrderItem, { foreignKey: 'productId', as: 'orderItems' })

// ── SalesOrderItem ↔ Item (master data / stock cut) ──────────────────────────────
SalesOrderItem.belongsTo(Item, { foreignKey: 'itemId', as: 'item' })
Item.hasMany(SalesOrderItem, { foreignKey: 'itemId', as: 'orderItems' })

// ── CustomerGroup ↔ Pricing ──────────────────────────────────────────────────
CustomerGroup.hasMany(Pricing, { foreignKey: 'customerGroupId', as: 'pricings' })
Pricing.belongsTo(CustomerGroup, { foreignKey: 'customerGroupId', as: 'customerGroup' })

// ── ProductCategory self-referential ────────────────────────────────────────
ProductCategory.belongsTo(ProductCategory, { foreignKey: 'parentId', as: 'parent' })
ProductCategory.hasMany(ProductCategory, { foreignKey: 'parentId', as: 'children' })

// ── Product ↔ UOM ───────────────────────────────────────────────────────────
Product.belongsTo(UOM, { foreignKey: 'sellingUomId',    as: 'sellingUom' })
Product.belongsTo(UOM, { foreignKey: 'purchasingUomId', as: 'purchasingUom' })

// ── Product ↔ Store (many-to-many) ──────────────────────────────────────────
Product.belongsToMany(Store, { through: ProductStore, foreignKey: 'productId', as: 'stores' })
Store.belongsToMany(Product, { through: ProductStore, foreignKey: 'storeId', as: 'products' })

// ── GoodReceive ↔ GoodReceiveItem ────────────────────────────────────────────
GoodReceive.hasMany(GoodReceiveItem, { foreignKey: 'goodReceiveId', as: 'items', onDelete: 'CASCADE' })
GoodReceiveItem.belongsTo(GoodReceive, { foreignKey: 'goodReceiveId', as: 'goodReceive' })
GoodReceiveItem.belongsTo(Product, { foreignKey: 'productId', as: 'product' })
Product.hasMany(GoodReceiveItem, { foreignKey: 'productId', as: 'goodReceiveItems' })

// ── StockAdjust ↔ StockAdjustItem ────────────────────────────────────────────
StockAdjust.hasMany(StockAdjustItem, { foreignKey: 'stockAdjustId', as: 'items', onDelete: 'CASCADE' })
StockAdjustItem.belongsTo(StockAdjust, { foreignKey: 'stockAdjustId', as: 'stockAdjust' })
StockAdjustItem.belongsTo(Product, { foreignKey: 'productId', as: 'product' })
Product.hasMany(StockAdjustItem, { foreignKey: 'productId', as: 'stockAdjustItems' })

// ── StockMovement ↔ Product / Store ─────────────────────────────────────────
StockMovement.belongsTo(Product, { foreignKey: 'productId', as: 'product' })
Product.hasMany(StockMovement, { foreignKey: 'productId', as: 'stockMovements' })
StockMovement.belongsTo(Store, { foreignKey: 'storeId', as: 'store' })

// ── StoreStock ↔ Product / Store ─────────────────────────────────────────────
StoreStock.belongsTo(Product, { foreignKey: 'productId', as: 'product' })
StoreStock.belongsTo(Store,   { foreignKey: 'storeId',   as: 'store' })
Product.hasMany(StoreStock, { foreignKey: 'productId', as: 'storeStocks' })
Store.hasMany(StoreStock,   { foreignKey: 'storeId',   as: 'storeStocks' })

// ── GoodReceive ↔ Store ───────────────────────────────────────────────────────
GoodReceive.belongsTo(Store, { foreignKey: 'storeId', as: 'store' })

// ── GoodReceiveItem ↔ UOM ────────────────────────────────────────────────────
GoodReceiveItem.belongsTo(UOM, { foreignKey: 'qtyUomId',     as: 'qtyUom' })
GoodReceiveItem.belongsTo(UOM, { foreignKey: 'freeQtyUomId', as: 'freeQtyUom' })

// ── StockAdjust ↔ Store ───────────────────────────────────────────────────────
StockAdjust.belongsTo(Store, { foreignKey: 'storeId', as: 'store' })

// ── StockRequest ↔ Store (from / to) ─────────────────────────────────────────
StockRequest.belongsTo(Store, { foreignKey: 'fromStoreId', as: 'fromStore' })
StockRequest.belongsTo(Store, { foreignKey: 'toStoreId',   as: 'toStore' })
StockRequest.hasMany(StockRequestItem, { foreignKey: 'stockRequestId', as: 'items', onDelete: 'CASCADE' })
StockRequestItem.belongsTo(StockRequest, { foreignKey: 'stockRequestId', as: 'stockRequest' })
StockRequestItem.belongsTo(Product, { foreignKey: 'productId', as: 'product' })
Product.hasMany(StockRequestItem, { foreignKey: 'productId', as: 'stockRequestItems' })

// ── StockCount ↔ Store / Items ────────────────────────────────────────────────
StockCount.belongsTo(Store, { foreignKey: 'storeId', as: 'store' })
StockCount.hasMany(StockCountItem, { foreignKey: 'stockCountId', as: 'items', onDelete: 'CASCADE' })
StockCountItem.belongsTo(StockCount, { foreignKey: 'stockCountId', as: 'stockCount' })
StockCountItem.belongsTo(Product, { foreignKey: 'productId', as: 'product' })

// ── UOMConversion ↔ UOM ──────────────────────────────────────────────────────
UOMConversion.belongsTo(UOM, { foreignKey: 'fromUomId', as: 'fromUom' })
UOMConversion.belongsTo(UOM, { foreignKey: 'toUomId',   as: 'toUom' })

// ── Product ↔ Vendor (many-to-many) ─────────────────────────────────────────
Product.belongsToMany(Vendor, { through: ProductVendor, foreignKey: 'productId', as: 'vendors' })
Vendor.belongsToMany(Product, { through: ProductVendor, foreignKey: 'vendorId',  as: 'products' })

// ── StockIssue ↔ Store / Items ───────────────────────────────────────────────
StockIssue.belongsTo(Store, { foreignKey: 'storeId', as: 'store' })
StockIssue.hasMany(StockIssueItem, { foreignKey: 'stockIssueId', as: 'items', onDelete: 'CASCADE' })
StockIssueItem.belongsTo(StockIssue, { foreignKey: 'stockIssueId', as: 'stockIssue' })
StockIssueItem.belongsTo(Product, { foreignKey: 'productId', as: 'product' })
Product.hasMany(StockIssueItem, { foreignKey: 'productId', as: 'stockIssueItems' })

// ── StockReturn ↔ Store / Customer / Vendor / Items ─────────────────────────
StockReturn.belongsTo(Store,    { foreignKey: 'storeId',    as: 'store' })
StockReturn.belongsTo(Customer, { foreignKey: 'customerId', as: 'customer' })
StockReturn.belongsTo(Vendor,   { foreignKey: 'vendorId',   as: 'vendor' })
StockReturn.hasMany(StockReturnItem, { foreignKey: 'stockReturnId', as: 'items', onDelete: 'CASCADE' })
StockReturnItem.belongsTo(StockReturn, { foreignKey: 'stockReturnId', as: 'stockReturn' })
StockReturnItem.belongsTo(Product, { foreignKey: 'productId', as: 'product' })

// ── SalesOrderItem ↔ Store ───────────────────────────────────────────────────
SalesOrderItem.belongsTo(Store, { foreignKey: 'storeId', as: 'store' })
Store.hasMany(SalesOrderItem, { foreignKey: 'storeId', as: 'orderItems' })

// ── SalesOrderItem ↔ SaleItem ────────────────────────────────────────────────
SalesOrderItem.belongsTo(SaleItem, { foreignKey: 'saleItemId', as: 'saleItem' })
SaleItem.hasMany(SalesOrderItem, { foreignKey: 'saleItemId', as: 'orderItems' })

// ── SaleItem ↔ Product ───────────────────────────────────────────────────────
SaleItem.belongsTo(Product, { foreignKey: 'productId', as: 'product' })
Product.hasMany(SaleItem, { foreignKey: 'productId', as: 'saleItems' })

// ── Pricing ↔ SaleItem (price list linked to a sale item catalog entry) ──────
Pricing.belongsTo(SaleItem, { foreignKey: 'saleItemId', as: 'saleItem' })
SaleItem.hasMany(Pricing, { foreignKey: 'saleItemId', as: 'pricings' })

module.exports = {
  sequelize,
  User, Module, UserModule, RefreshToken,
  Role, Permission, RolePermission, RoleModule, UserRole,
  Item,
  Customer, CustomerGroup, Product, Order, SalesOrderItem,
  SaleItem,
  Pricing,
  ProductCategory,
  Store, ProductStore,
  UOM,
  GoodReceive, GoodReceiveItem,
  StockAdjust, StockAdjustItem,
  StockMovement,
  StoreStock,
  StockRequest, StockRequestItem,
  StockCount, StockCountItem,
  UOMConversion,
  Vendor, ProductVendor,
  StockReturn, StockReturnItem,
  StockIssue, StockIssueItem,
  Sequence,
}
