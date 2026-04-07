const sequelize = require('../config/database')
const User = require('./User')
const Module = require('./Module')
const UserModule = require('./UserModule')
const RefreshToken = require('./RefreshToken')
const Role = require('./Role')
const Permission = require('./Permission')
const RolePermission = require('./RolePermission')
const RoleModule = require('./RoleModule')
const UserRole = require('./UserRole')
const Item = require('./Item')
const Customer = require('./Customer')
const CustomerGroup = require('./CustomerGroup')
const Product = require('./Product')
const Order = require('./Order')
const OrderItem = require('./OrderItem')
const Pricing = require('./Pricing')
const ProductCategory = require('./ProductCategory')
const Store = require('./Store')
const ProductStore = require('./ProductStore')
const UOM = require('./UOM')
const GoodReceive = require('./GoodReceive')
const GoodReceiveItem = require('./GoodReceiveItem')
const StockAdjust = require('./StockAdjust')
const StockAdjustItem = require('./StockAdjustItem')
const StockMovement = require('./StockMovement')
const StoreStock = require('./StoreStock')
const StockRequest = require('./StockRequest')
const StockRequestItem = require('./StockRequestItem')
const StockCount = require('./StockCount')
const StockCountItem = require('./StockCountItem')
const UOMConversion = require('./UOMConversion')
const Vendor = require('./Vendor')
const ProductVendor = require('./ProductVendor')
const StockReturn = require('./StockReturn')
const StockReturnItem = require('./StockReturnItem')
const Sequence = require('./Sequence')
const StockIssue = require('./StockIssue')
const StockIssueItem = require('./StockIssueItem')

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

// ── Order ↔ OrderItem ───────────────────────────────────────────────────────
Order.hasMany(OrderItem, { foreignKey: 'orderId', as: 'items', onDelete: 'CASCADE' })
OrderItem.belongsTo(Order, { foreignKey: 'orderId', as: 'order' })

// ── OrderItem ↔ Product ─────────────────────────────────────────────────────
OrderItem.belongsTo(Product, { foreignKey: 'productId', as: 'product' })
Product.hasMany(OrderItem, { foreignKey: 'productId', as: 'orderItems' })

// ── OrderItem ↔ Item (master data / stock cut) ──────────────────────────────
OrderItem.belongsTo(Item, { foreignKey: 'itemId', as: 'item' })
Item.hasMany(OrderItem, { foreignKey: 'itemId', as: 'orderItems' })

// ── OrderItem ↔ Pricing ─────────────────────────────────────────────────────
OrderItem.hasMany(Pricing, { foreignKey: 'orderItemId', as: 'pricings' })
Pricing.belongsTo(OrderItem, { foreignKey: 'orderItemId', as: 'orderItem' })

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

module.exports = {
  sequelize,
  User, Module, UserModule, RefreshToken,
  Role, Permission, RolePermission, RoleModule, UserRole,
  Item,
  Customer, CustomerGroup, Product, Order, OrderItem,
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
