/**
 * add-field-labels.js — add/update `comment` on every Sequelize field in every
 * *.model.js file with the format  "English Label (ป้ายภาษาไทย)".
 *
 * Rules:
 *   - If a field already has a comment, the label is PREPENDED: "Label (ไทย) — existing note"
 *   - If no comment exists, `comment: 'Label (Thai)'` is injected after the last
 *     property of the field definition (before the closing brace on the same line
 *     or inline).
 *   - Fields without a mapping are left untouched.
 *
 * Run from repo root:  node scripts/add-field-labels.js
 */
const path = require('path')
const fs = require('fs')
const { glob } = require('glob')   // already a dep via various packages
// fall back to a simple recursive walk when glob is unavailable
const globSync = (() => {
  try { return require('glob').globSync } catch {}
  function walk(dir, out = []) {
    for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
      const f = path.join(dir, e.name) // nosemgrep: javascript.lang.security.audit.path-traversal.path-join-resolve-traversal.path-join-resolve-traversal -- build-time script over a fixed dir; names come from readdirSync, not request input
      if (e.isDirectory() && e.name !== 'node_modules') walk(f, out)
      else if (e.isFile() && e.name.endsWith('.model.js')) out.push(f)
    }
    return out
  }
  return (pattern, opts) => walk(opts.cwd || '.').map(f => path.relative(opts.cwd || '.', f))
})()

// ── Comprehensive field → { en, th } label map ────────────────────────────────
// camelCase keys; entries cover every field seen across all 85 models.
const LABELS = {
  // ── Primary key / universal ──────────────────────────────────────────────────
  id:                   { en: 'ID',                       th: 'รหัส' },

  // ── Audit / common ───────────────────────────────────────────────────────────
  organizationId:       { en: 'Organization',             th: 'องค์กร' },
  dataFlag:             { en: 'Data Flag',                th: 'แฟล็กข้อมูล' },
  createdBy:            { en: 'Created By',               th: 'สร้างโดย' },
  modifiedBy:           { en: 'Modified By',              th: 'แก้ไขโดย' },
  createdAt:            { en: 'Created At',               th: 'วันที่สร้าง' },
  updatedAt:            { en: 'Updated At',               th: 'วันที่แก้ไข' },

  // ── Common document fields ────────────────────────────────────────────────────
  code:                 { en: 'Code',                     th: 'รหัส' },
  name:                 { en: 'Name',                     th: 'ชื่อ' },
  description:          { en: 'Description',              th: 'คำอธิบาย' },
  notes:                { en: 'Notes',                    th: 'หมายเหตุ' },
  status:               { en: 'Status',                   th: 'สถานะ' },
  date:                 { en: 'Date',                     th: 'วันที่' },
  refNo:                { en: 'Reference No.',            th: 'เลขอ้างอิง' },
  referenceNumber:      { en: 'Reference Number',         th: 'เลขที่อ้างอิง' },
  source:               { en: 'Source',                   th: 'ที่มา' },
  sourceType:           { en: 'Source Type',              th: 'ประเภทที่มา' },
  sourceId:             { en: 'Source ID',                th: 'รหัสที่มา' },
  reason:               { en: 'Reason',                   th: 'เหตุผล' },
  type:                 { en: 'Type',                     th: 'ประเภท' },
  category:             { en: 'Category',                 th: 'หมวดหมู่' },
  activeFrom:           { en: 'Active From',              th: 'วันที่เริ่มใช้งาน' },
  activeTo:             { en: 'Active To',                th: 'วันที่สิ้นสุด' },
  isActive:             { en: 'Active',                   th: 'ใช้งาน' },
  enabled:              { en: 'Enabled',                  th: 'เปิดใช้งาน' },

  // ── Financial / amounts ───────────────────────────────────────────────────────
  subtotal:             { en: 'Subtotal',                 th: 'ยอดก่อนภาษี' },
  tax:                  { en: 'Tax',                      th: 'ภาษี' },
  taxRate:              { en: 'Tax Rate (%)',              th: 'อัตราภาษี (%)' },
  total:                { en: 'Total',                    th: 'ยอดรวม' },
  grandTotal:           { en: 'Grand Total',              th: 'ยอดรวมทั้งสิ้น' },
  amount:               { en: 'Amount',                   th: 'จำนวนเงิน' },
  amountPaid:           { en: 'Amount Paid',              th: 'จำนวนเงินที่ชำระ' },
  balanceDue:           { en: 'Balance Due',              th: 'ยอดคงค้าง' },
  currency:             { en: 'Currency',                 th: 'สกุลเงิน' },
  exchangeRate:         { en: 'Exchange Rate',            th: 'อัตราแลกเปลี่ยน' },
  discountType:         { en: 'Discount Type',            th: 'ประเภทส่วนลด' },
  discountValue:        { en: 'Discount Value',           th: 'มูลค่าส่วนลด' },
  discountAmount:       { en: 'Discount Amount',          th: 'จำนวนส่วนลด' },
  paymentTerms:         { en: 'Payment Terms',            th: 'เงื่อนไขการชำระเงิน' },
  paymentMethod:        { en: 'Payment Method',           th: 'วิธีการชำระ' },
  price:                { en: 'Price',                    th: 'ราคา' },
  unitPrice:            { en: 'Unit Price',               th: 'ราคาต่อหน่วย' },
  cost:                 { en: 'Cost',                     th: 'ต้นทุน' },
  totalDebit:           { en: 'Total Debit',              th: 'เดบิตรวม' },
  totalCredit:          { en: 'Total Credit',             th: 'เครดิตรวม' },
  debit:                { en: 'Debit',                    th: 'เดบิต' },
  credit:               { en: 'Credit',                   th: 'เครดิต' },
  normalBalance:        { en: 'Normal Balance',           th: 'ยอดปกติ' },

  // ── Dates ─────────────────────────────────────────────────────────────────────
  orderDate:            { en: 'Order Date',               th: 'วันที่สั่ง' },
  invoiceDate:          { en: 'Invoice Date',             th: 'วันที่ใบแจ้งหนี้' },
  dueDate:              { en: 'Due Date',                 th: 'วันครบกำหนด' },
  deliveryDate:         { en: 'Delivery Date',            th: 'วันที่กำหนดส่ง' },
  expectedDeliveryDate: { en: 'Expected Delivery Date',   th: 'วันที่ส่งที่คาดหวัง' },
  startDate:            { en: 'Start Date',               th: 'วันที่เริ่มต้น' },
  endDate:              { en: 'End Date',                 th: 'วันที่สิ้นสุด' },
  expiryDate:           { en: 'Expiry Date',              th: 'วันหมดอายุ' },
  lastLoginAt:          { en: 'Last Login At',            th: 'เข้าสู่ระบบล่าสุด' },
  emailVerifiedAt:      { en: 'Email Verified At',        th: 'ยืนยันอีเมลเมื่อ' },
  billDate:             { en: 'Bill Date',                th: 'วันที่บิล' },

  // ── FK / relation IDs ─────────────────────────────────────────────────────────
  userId:               { en: 'User',                     th: 'ผู้ใช้' },
  customerId:           { en: 'Customer',                 th: 'ลูกค้า' },
  vendorId:             { en: 'Vendor',                   th: 'ผู้ขาย' },
  orderId:              { en: 'Sales Order',              th: 'ใบสั่งขาย' },
  deliveryOrderId:      { en: 'Delivery Order',           th: 'ใบส่งสินค้า' },
  invoiceId:            { en: 'Invoice',                  th: 'ใบแจ้งหนี้' },
  productId:            { en: 'Product',                  th: 'สินค้า' },
  itemId:               { en: 'Item',                     th: 'รายการสินค้า' },
  storeId:              { en: 'Store / Warehouse',        th: 'คลังสินค้า' },
  uomId:                { en: 'Unit of Measure',          th: 'หน่วยนับ' },
  sellingUomId:         { en: 'Selling UOM',              th: 'หน่วยนับขาย' },
  purchasingUomId:      { en: 'Purchasing UOM',           th: 'หน่วยนับซื้อ' },
  fromUomId:            { en: 'From UOM',                 th: 'จากหน่วย' },
  toUomId:              { en: 'To UOM',                   th: 'ถึงหน่วย' },
  categoryId:           { en: 'Category',                 th: 'หมวดหมู่' },
  parentId:             { en: 'Parent',                   th: 'ลำดับชั้นเหนือ' },
  pricingId:            { en: 'Pricing Rule',             th: 'กฎราคา' },
  salespersonId:        { en: 'Salesperson',              th: 'พนักงานขาย' },
  requisitionId:        { en: 'Purchase Requisition',     th: 'ใบขอซื้อ' },
  purchaseOrderId:      { en: 'Purchase Order',           th: 'ใบสั่งซื้อ' },
  goodReceiveId:        { en: 'Good Receive',             th: 'ใบรับสินค้า' },
  billingNoteId:        { en: 'Billing Note',             th: 'ใบแจ้งยอด' },
  receivePaymentId:     { en: 'Receive Payment',          th: 'รายการรับชำระ' },
  journalId:            { en: 'Journal Entry',            th: 'รายการสมุดบัญชี' },
  accountId:            { en: 'Account',                  th: 'บัญชี' },
  fiscalYearId:         { en: 'Fiscal Year',              th: 'ปีงบประมาณ' },
  taxPeriodId:          { en: 'Tax Period',               th: 'งวดภาษี' },
  conversationId:       { en: 'Conversation',             th: 'การสนทนา' },
  employeeId:           { en: 'Employee',                 th: 'พนักงาน' },
  departmentId:         { en: 'Department',               th: 'แผนก' },
  moduleId:             { en: 'Module',                   th: 'โมดูล' },
  roleId:               { en: 'Role',                     th: 'บทบาท' },
  permissionId:         { en: 'Permission',               th: 'สิทธิ์' },
  customerGroupId:      { en: 'Customer Group',           th: 'กลุ่มลูกค้า' },
  stockRequestId:       { en: 'Stock Request',            th: 'ใบขอเบิกสต็อก' },
  stockIssueId:         { en: 'Stock Issue',              th: 'ใบเบิกสต็อก' },
  stockReturnId:        { en: 'Stock Return',             th: 'ใบคืนสต็อก' },
  stockAdjustId:        { en: 'Stock Adjustment',         th: 'ใบปรับสต็อก' },
  stockCountId:         { en: 'Stock Count',              th: 'ใบนับสต็อก' },
  packageId:            { en: 'Package',                  th: 'แพ็กเกจ' },

  // ── Address / contact ────────────────────────────────────────────────────────
  email:                { en: 'Email',                    th: 'อีเมล' },
  phone:                { en: 'Phone',                    th: 'โทรศัพท์' },
  address:              { en: 'Address',                  th: 'ที่อยู่' },
  shippingAddress:      { en: 'Shipping Address',         th: 'ที่อยู่จัดส่ง' },
  billingAddress:       { en: 'Billing Address',          th: 'ที่อยู่ใบกำกับ' },
  website:              { en: 'Website',                  th: 'เว็บไซต์' },
  taxId:                { en: 'Tax ID',                   th: 'เลขผู้เสียภาษี' },
  companyName:          { en: 'Company Name',             th: 'ชื่อบริษัท' },

  // ── Product / inventory ───────────────────────────────────────────────────────
  sku:                  { en: 'SKU',                      th: 'SKU' },
  barcode:              { en: 'Barcode',                  th: 'บาร์โค้ด' },
  stock:                { en: 'Stock',                    th: 'สต็อก' },
  quantity:             { en: 'Quantity',                 th: 'จำนวน' },
  qty:                  { en: 'Quantity',                 th: 'จำนวน' },
  reorderPoint:         { en: 'Reorder Point',            th: 'จุดสั่งซื้อใหม่' },
  reorderQty:           { en: 'Reorder Qty',              th: 'จำนวนสั่งซื้อใหม่' },
  unit:                 { en: 'Unit',                     th: 'หน่วย' },
  conversionFactor:     { en: 'Conversion Factor',        th: 'อัตราแปลงหน่วย' },
  batchId:              { en: 'Batch / Lot',              th: 'ล็อต / แบตช์' },
  serialNumber:         { en: 'Serial Number',            th: 'หมายเลขซีเรียล' },
  onHand:               { en: 'On Hand',                  th: 'สต็อกคงเหลือ' },
  reserved:             { en: 'Reserved',                 th: 'จองแล้ว' },
  available:            { en: 'Available',                th: 'พร้อมใช้งาน' },
  movementType:         { en: 'Movement Type',            th: 'ประเภทการเคลื่อนไหว' },
  balanceBefore:        { en: 'Balance Before',           th: 'ยอดก่อนหน้า' },
  balanceAfter:         { en: 'Balance After',            th: 'ยอดหลัง' },
  systemCount:          { en: 'System Count',             th: 'ยอดตามระบบ' },
  physicalCount:        { en: 'Physical Count',           th: 'ยอดนับจริง' },
  variance:             { en: 'Variance',                 th: 'ผลต่าง' },

  // ── Document numbers ──────────────────────────────────────────────────────────
  orderNumber:          { en: 'Order Number',             th: 'เลขที่ใบสั่งขาย' },
  invoiceNumber:        { en: 'Invoice Number',           th: 'เลขที่ใบแจ้งหนี้' },
  quotationNumber:      { en: 'Quotation Number',         th: 'เลขที่ใบเสนอราคา' },
  receiptNumber:        { en: 'Receipt Number',           th: 'เลขที่ใบเสร็จ' },
  billNumber:           { en: 'Bill Number',              th: 'เลขที่บิล' },
  vendorInvoiceNo:      { en: 'Vendor Invoice No.',       th: 'เลขที่ใบกำกับผู้ขาย' },

  // ── User / auth ───────────────────────────────────────────────────────────────
  role:                 { en: 'Role',                     th: 'บทบาท' },
  password:             { en: 'Password',                 th: 'รหัสผ่าน' },
  slug:                 { en: 'Slug',                     th: 'สลัก' },
  color:                { en: 'Color',                    th: 'สี' },
  isSystem:             { en: 'System Role',              th: 'บทบาทระบบ' },
  defaultPage:          { en: 'Default Page',             th: 'หน้าเริ่มต้น' },
  logoPath:             { en: 'Logo',                     th: 'โลโก้' },
  emailVerificationToken: { en: 'Email Verification Token', th: 'โทเค็นยืนยันอีเมล' },
  emailVerificationExpiresAt: { en: 'Email Verification Expires At', th: 'โทเค็นยืนยันหมดอายุ' },
  passwordResetToken:   { en: 'Password Reset Token',     th: 'โทเค็นรีเซ็ตรหัสผ่าน' },
  passwordResetExpiresAt: { en: 'Password Reset Expires At', th: 'โทเค็นรีเซ็ตหมดอายุ' },
  token:                { en: 'Token',                    th: 'โทเค็น' },
  expiresAt:            { en: 'Expires At',               th: 'หมดอายุเมื่อ' },
  userAgent:            { en: 'User Agent',               th: 'User Agent' },
  ipAddress:            { en: 'IP Address',               th: 'ที่อยู่ IP' },
  lastUsedAt:           { en: 'Last Used At',             th: 'ใช้งานล่าสุด' },
  revoked:              { en: 'Revoked',                  th: 'ถูกเพิกถอน' },

  // ── Module / permission ───────────────────────────────────────────────────────
  key:                  { en: 'Key',                      th: 'คีย์' },
  label:                { en: 'Label',                    th: 'ป้ายกำกับ' },
  icon:                 { en: 'Icon',                     th: 'ไอคอน' },
  order:                { en: 'Order',                    th: 'ลำดับ' },
  path:                 { en: 'Path',                     th: 'เส้นทาง' },
  component:            { en: 'Component',                th: 'คอมโพเนนต์' },
  meta:                 { en: 'Meta',                     th: 'ข้อมูลเพิ่มเติม' },
  permissions:          { en: 'Permissions',              th: 'สิทธิ์' },
  group:                { en: 'Group',                    th: 'กลุ่ม' },
  module:               { en: 'Module',                   th: 'โมดูล' },

  // ── Alert ─────────────────────────────────────────────────────────────────────
  title:                { en: 'Title',                    th: 'หัวข้อ' },
  content:              { en: 'Content',                  th: 'เนื้อหา' },
  scope:                { en: 'Scope',                    th: 'ขอบเขต' },
  targetId:             { en: 'Target ID',                th: 'รหัสเป้าหมาย' },
  alertId:              { en: 'Alert',                    th: 'การแจ้งเตือน' },
  readAt:               { en: 'Read At',                  th: 'อ่านเมื่อ' },

  // ── Attachment / audit ───────────────────────────────────────────────────────
  fileName:             { en: 'File Name',                th: 'ชื่อไฟล์' },
  filePath:             { en: 'File Path',                th: 'ที่อยู่ไฟล์' },
  fileSize:             { en: 'File Size',                th: 'ขนาดไฟล์' },
  mimeType:             { en: 'MIME Type',                th: 'ประเภทไฟล์' },
  action:               { en: 'Action',                   th: 'การกระทำ' },
  changes:              { en: 'Changes',                  th: 'การเปลี่ยนแปลง' },
  entityType:           { en: 'Entity Type',              th: 'ประเภทเอนทิตี' },
  entityId:             { en: 'Entity ID',                th: 'รหัสเอนทิตี' },

  // ── HRMS ─────────────────────────────────────────────────────────────────────
  employeeCode:         { en: 'Employee Code',            th: 'รหัสพนักงาน' },
  firstName:            { en: 'First Name',               th: 'ชื่อ' },
  lastName:             { en: 'Last Name',                th: 'นามสกุล' },
  position:             { en: 'Position',                 th: 'ตำแหน่ง' },

  // ── Sequence / settings ───────────────────────────────────────────────────────
  prefix:               { en: 'Prefix',                   th: 'คำนำหน้า' },
  suffix:               { en: 'Suffix',                   th: 'คำต่อท้าย' },
  nextNumber:           { en: 'Next Number',              th: 'เลขถัดไป' },
  padding:              { en: 'Padding',                  th: 'ความยาวตัวเลข' },
  resetCycle:           { en: 'Reset Cycle',              th: 'รอบรีเซ็ต' },
  template:             { en: 'Template',                 th: 'รูปแบบ' },
  value:                { en: 'Value',                    th: 'ค่า' },
  dataType:             { en: 'Data Type',                th: 'ประเภทข้อมูล' },
  symbol:               { en: 'Symbol',                   th: 'สัญลักษณ์' },
  decimalPlaces:        { en: 'Decimal Places',           th: 'ตำแหน่งทศนิยม' },
  isDefault:            { en: 'Default',                  th: 'ค่าเริ่มต้น' },
  rate:                 { en: 'Rate',                     th: 'อัตรา' },
  effectiveDate:        { en: 'Effective Date',           th: 'วันที่มีผล' },
  approvalThreshold:    { en: 'Approval Threshold',       th: 'เกณฑ์อนุมัติ' },
  minAmount:            { en: 'Min Amount',               th: 'จำนวนขั้นต่ำ' },
  maxAmount:            { en: 'Max Amount',               th: 'จำนวนสูงสุด' },
  accountType:          { en: 'Account Type',             th: 'ประเภทบัญชี' },
  statementCategory:    { en: 'Statement Category',       th: 'หมวดในงบการเงิน' },
  parentAccountId:      { en: 'Parent Account',           th: 'บัญชีแม่' },

  // ── AI Agent ──────────────────────────────────────────────────────────────────
  provider:             { en: 'Provider',                 th: 'ผู้ให้บริการ' },
  baseUrl:              { en: 'Base URL',                 th: 'Base URL' },
  model:                { en: 'Model',                    th: 'โมเดล' },
  apiKey:               { en: 'API Key',                  th: 'API Key' },
  temperature:          { en: 'Temperature',              th: 'Temperature' },
  systemPrompt:         { en: 'System Prompt',            th: 'System Prompt' },
  autoAction:           { en: 'Auto Action',              th: 'ทำงานอัตโนมัติ' },
  actions:              { en: 'Actions',                  th: 'การกระทำ' },

  // ── Sale package ─────────────────────────────────────────────────────────────
  packageName:          { en: 'Package Name',             th: 'ชื่อแพ็กเกจ' },
  lineNumber:           { en: 'Line Number',              th: 'ลำดับบรรทัด' },
  lineTotal:            { en: 'Line Total',               th: 'รวมบรรทัด' },
  requestedBy:          { en: 'Requested By',             th: 'ผู้ขอ' },
  department:           { en: 'Department',               th: 'แผนก' },
  estimatedUnitPrice:   { en: 'Estimated Unit Price',     th: 'ราคาโดยประมาณต่อหน่วย' },
  estimatedTotal:       { en: 'Estimated Total',          th: 'รวมโดยประมาณ' },
  vendorInvoiceNumber:  { en: 'Vendor Invoice No.',       th: 'เลขที่ใบกำกับผู้ขาย' },
  pricingRuleId:        { en: 'Pricing Rule',             th: 'กฎราคา' },
  discountPct:          { en: 'Discount (%)',             th: 'ส่วนลด (%)' },
  minQty:               { en: 'Min Qty',                  th: 'จำนวนขั้นต่ำ' },
  maxQty:               { en: 'Max Qty',                  th: 'จำนวนสูงสุด' },
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function labelFor(field) {
  return LABELS[field] || null
}

// Inject or update `comment:` inside a field block.
// Strategy: work on the raw source text, find each "fieldName: {" definition block,
// and either append or update the comment property.
function processSource(src) {
  // Match field property definitions: leading whitespace, identifier, colon, {
  // We process them one by one to avoid regex catastrophe on deeply-nested objects.
  // The pattern captures: indent + fieldName + ": {" ... "}" (non-greedy up to next },)
  // We use a line-by-line state machine instead for reliability.

  const lines = src.split('\n')
  const out = []
  let i = 0

  while (i < lines.length) {
    const line = lines[i]

    // Detect "  fieldName: {" or "  fieldName: { ... }," on same line.
    const m = line.match(/^(\s+)(\w+):\s*\{(.*)/)
    if (!m) { out.push(line); i++; continue }

    const [, indent, field, rest] = m
    const lbl = labelFor(field)

    // No label for this field — leave it unchanged.
    if (!lbl) { out.push(line); i++; continue }

    const labelStr = `${lbl.en} (${lbl.th})`

    // ── Inline single-line field: net closing braces in `rest` >= 1,
    //    meaning the opening { is balanced on this same line (possibly
    //    followed by a trailing // comment or whitespace).
    const openInRest  = (rest.match(/\{/g) || []).length
    const closeInRest = (rest.match(/\}/g) || []).length
    if (closeInRest > openInRest) {
      const newLine = processInlineLine(line, field, labelStr, lbl)
      out.push(newLine)
      i++
      continue
    }

    // ── Multi-line field block: collect until the closing "  },"
    const blockLines = [line]
    let j = i + 1
    let depth = 1
    while (j < lines.length && depth > 0) {
      const bl = lines[j]
      depth += (bl.match(/\{/g) || []).length
      depth -= (bl.match(/\}/g) || []).length
      blockLines.push(bl)
      j++
    }

    const processedBlock = processBlock(blockLines, field, labelStr, lbl, indent)
    out.push(...processedBlock)
    i = j
  }

  return out.join('\n')
}

// Handle inline single-line field: "  field: { type: X, comment: 'Y' },"
// The line may end with a trailing // inline comment.
function processInlineLine(line, field, labelStr, lbl) {
  const existing = line.match(/comment:\s*'([^']*)'/)
  if (existing) {
    const old = existing[1]
    if (old.startsWith(lbl.en + ' (')) return line // already labeled
    const merged = `${labelStr} — ${old}`
    return line.replace(/comment:\s*'[^']*'/, `comment: '${merged}'`)
  }
  // Inject comment: find last `}` (before any trailing // comment) and insert before it.
  // Strategy: split on the first `//` that is NOT inside a string.
  const trailingComment = line.match(/(,?\s*\/\/.*)$/)
  const tail = trailingComment ? trailingComment[0] : ''
  const core = tail ? line.slice(0, line.lastIndexOf(tail)) : line
  // Insert `, comment: 'label'` before the closing `},` or `}`
  const injected = core.replace(/(},?\s*)$/, `, comment: '${labelStr}'$1`)
  return injected + tail
}

// Handle multi-line field block
function processBlock(blockLines, field, labelStr, lbl, indent) {
  // Check if comment already exists
  const existingIdx = blockLines.findIndex(l => /comment:/.test(l))
  if (existingIdx !== -1) {
    const l = blockLines[existingIdx]
    const m = l.match(/comment:\s*'([^']*)'/)
    if (!m) return blockLines
    const old = m[1]
    if (old.startsWith(lbl.en + ' (')) return blockLines // already labeled
    const merged = `${labelStr} — ${old}`
    blockLines[existingIdx] = l.replace(/comment:\s*'[^']*'/, `comment: '${merged}'`)
    return blockLines
  }

  // Find last property line (before closing brace) and insert comment after it.
  // The closing brace line looks like "  }," or "  }"
  const closingIdx = blockLines.length - 1  // last line of block
  // Find the last non-closing line with content.
  let insertAfter = closingIdx - 1
  while (insertAfter > 0 && /^\s*$/.test(blockLines[insertAfter])) insertAfter--

  // Add trailing comma to existing last property if missing, then insert comment line.
  const propLine = blockLines[insertAfter]
  if (propLine && !/,\s*$/.test(propLine) && !/\/\//.test(propLine)) {
    blockLines[insertAfter] = propLine.replace(/(\s*)$/, ',$1')
  }
  const commentLine = `${indent}  comment: '${labelStr}',`
  blockLines.splice(insertAfter + 1, 0, commentLine)
  return blockLines
}

// ── Main ──────────────────────────────────────────────────────────────────────
const ROOT = path.resolve(__dirname, '..')
let modelFiles

function walkModels(dir, out = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (e.name === 'node_modules') continue
    const full = path.join(dir, e.name) // nosemgrep: javascript.lang.security.audit.path-traversal.path-join-resolve-traversal.path-join-resolve-traversal -- build-time script over a fixed dir; names come from readdirSync, not request input
    if (e.isDirectory()) walkModels(full, out)
    else if (e.isFile() && e.name.endsWith('.model.js')) out.push(full)
  }
  return out
}
modelFiles = walkModels(ROOT)

let updated = 0
let skipped = 0

for (const file of modelFiles) {
  const orig = fs.readFileSync(file, 'utf8')
  // Normalize CRLF → LF for processing; restore the original line ending after.
  const hasCRLF = orig.includes('\r\n')
  const normalised = hasCRLF ? orig.replace(/\r\n/g, '\n') : orig
  const processedLF = processSource(normalised)
  const processed = hasCRLF ? processedLF.replace(/\n/g, '\r\n') : processedLF
  if (processed !== orig) {
    fs.writeFileSync(file, processed, 'utf8')
    updated++
    console.log('  updated:', path.relative(ROOT, file))
  } else {
    skipped++
  }
}

console.log(`\nDone — ${updated} files updated, ${skipped} files unchanged.`)
