const { Journal, JournalLine } = require('../../../../server/models')
const sequelize = require('../../../../server/config/database')
const { getNext } = require('../../settings/sequence.service')
const accounts = require('./account-mapping.service')

/**
 * Auto-post journal entries from source documents (Invoice, Receipt, VendorBill).
 * Each function is idempotent — if a posted journal already exists for the
 * given (sourceType, sourceId), it returns the existing one instead of
 * creating a duplicate.
 *
 * Failures throw {status, message}. Callers should decide whether to roll back.
 */

const findExisting = async (sourceType, sourceId) => {
  return Journal.findOne({
    where: { sourceType, sourceId, status: 'posted' },
  })
}

const postJournal = async ({ sourceType, sourceId, date, description, lines, userId, organizationId }) => {
  const refNo = await getNext('JE', userId)
  const totalDebit = lines.reduce((s, l) => s + Number(l.debit || 0), 0)

  return sequelize.transaction(async (t) => {
    const j = await Journal.create({
      refNo,
      date:           date || new Date().toISOString().slice(0, 10),
      description:    description || null,
      totalDebit,
      status:         'posted',
      sourceType,
      sourceId,
      organizationId: organizationId || null,
      createdBy:      userId || null,
      modifiedBy:     userId || null,
    }, { transaction: t })

    for (let i = 0; i < lines.length; i++) {
      const l = lines[i]
      await JournalLine.create({
        journalId:    j.id,
        lineNo:       i + 1,
        accountId:    l.accountId,
        description:  l.description || null,
        debit:        Number(l.debit  || 0),
        credit:       Number(l.credit || 0),
        organizationId: organizationId || null,
      }, { transaction: t })
    }

    return j
  })
}

// ──────────────────────────────────────────────────────────────────────────────
// Sales: Invoice sent → Dr AR / Cr Revenue / Cr Output Tax
// ──────────────────────────────────────────────────────────────────────────────
const postInvoice = async (invoice, userId) => {
  const orgId = invoice.organizationId || null
  const existing = await findExisting('Invoice', invoice.id)
  if (existing) return existing

  const ar      = await accounts.getByRole('AR',         orgId)
  const revenue = await accounts.getByRole('REVENUE',    orgId)
  const total    = Number(invoice.total    || 0)
  const subtotal = Number(invoice.subtotal || 0)
  const tax      = Number(invoice.tax      || 0)
  if (!total) throw { status: 400, message: 'Invoice total is zero — cannot post journal' }

  const lines = [
    { accountId: ar.id,      debit: total, credit: 0, description: `Invoice ${invoice.invoiceNumber}` },
    { accountId: revenue.id, debit: 0, credit: subtotal, description: `Invoice ${invoice.invoiceNumber}` },
  ]
  if (tax > 0) {
    const outTax = await accounts.getByRole('OUTPUT_TAX', orgId)
    lines.push({ accountId: outTax.id, debit: 0, credit: tax, description: `Output VAT - ${invoice.invoiceNumber}` })
  } else {
    // No tax — bump revenue to total to keep balanced
    lines[1].credit = total
  }

  return postJournal({
    sourceType:    'Invoice',
    sourceId:      invoice.id,
    date:          invoice.invoiceDate,
    description:   `Auto-posted from Invoice ${invoice.invoiceNumber}`,
    lines,
    userId,
    organizationId: orgId,
  })
}

// ──────────────────────────────────────────────────────────────────────────────
// Sales: Receipt confirmed → Dr Cash/Bank / Cr AR
// ──────────────────────────────────────────────────────────────────────────────
const postReceipt = async (receipt, userId) => {
  const orgId = receipt.organizationId || null
  const existing = await findExisting('Receipt', receipt.id)
  if (existing) return existing

  const ar      = await accounts.getByRole('AR', orgId)
  const cashBank = await accounts.accountForPaymentMethod(receipt.paymentMethod, orgId)
  const amount = Number(receipt.amount || 0)
  if (!amount) throw { status: 400, message: 'Receipt amount is zero — cannot post journal' }

  return postJournal({
    sourceType:    'Receipt',
    sourceId:      receipt.id,
    date:          receipt.receiptDate,
    description:   `Auto-posted from Receipt ${receipt.receiptNumber}`,
    lines: [
      { accountId: cashBank.id, debit: amount, credit: 0, description: `Receipt ${receipt.receiptNumber}` },
      { accountId: ar.id,       debit: 0, credit: amount, description: `Receipt ${receipt.receiptNumber}` },
    ],
    userId,
    organizationId: orgId,
  })
}

// ──────────────────────────────────────────────────────────────────────────────
// Purchase: VendorBill approved → Dr Inventory / Dr Input Tax / Cr AP
// ──────────────────────────────────────────────────────────────────────────────
const postVendorBill = async (bill, userId) => {
  const orgId = bill.organizationId || null
  const existing = await findExisting('VendorBill', bill.id)
  if (existing) return existing

  const ap        = await accounts.getByRole('AP',        orgId)
  const inventory = await accounts.getByRole('INVENTORY', orgId)
  const total    = Number(bill.total    || 0)
  const subtotal = Number(bill.subtotal || 0)
  const tax      = Number(bill.tax      || 0)
  if (!total) throw { status: 400, message: 'Bill total is zero — cannot post journal' }

  const lines = [
    { accountId: inventory.id, debit: subtotal, credit: 0, description: `Bill ${bill.billNumber}` },
  ]
  if (tax > 0) {
    const inTax = await accounts.getByRole('INPUT_TAX', orgId)
    lines.push({ accountId: inTax.id, debit: tax, credit: 0, description: `Input VAT - ${bill.billNumber}` })
  } else {
    lines[0].debit = total
  }
  lines.push({ accountId: ap.id, debit: 0, credit: total, description: `Bill ${bill.billNumber}` })

  return postJournal({
    sourceType:    'VendorBill',
    sourceId:      bill.id,
    date:          bill.billDate,
    description:   `Auto-posted from Vendor Bill ${bill.billNumber}`,
    lines,
    userId,
    organizationId: orgId,
  })
}

// ──────────────────────────────────────────────────────────────────────────────
// Purchase: VendorBill marked paid → Dr AP / Cr Cash
// ──────────────────────────────────────────────────────────────────────────────
const postBillPayment = async (bill, userId) => {
  const orgId = bill.organizationId || null
  const existing = await findExisting('VendorBillPayment', bill.id)
  if (existing) return existing

  const ap   = await accounts.getByRole('AP',   orgId)
  const cash = await accounts.getByRole('CASH', orgId)
  const total = Number(bill.total || 0)
  if (!total) throw { status: 400, message: 'Bill total is zero — cannot post payment journal' }

  return postJournal({
    sourceType:    'VendorBillPayment',
    sourceId:      bill.id,
    date:          new Date().toISOString().slice(0, 10),
    description:   `Auto-posted payment for Vendor Bill ${bill.billNumber}`,
    lines: [
      { accountId: ap.id,   debit: total, credit: 0, description: `Payment ${bill.billNumber}` },
      { accountId: cash.id, debit: 0, credit: total, description: `Payment ${bill.billNumber}` },
    ],
    userId,
    organizationId: orgId,
  })
}

// ──────────────────────────────────────────────────────────────────────────────
// Reversal: create a mirror journal with debits/credits swapped.
// Idempotent: the reversal itself uses sourceType `${origSourceType}.reversal`
// so re-running won't duplicate.
// ──────────────────────────────────────────────────────────────────────────────
const reverseFor = async (sourceType, sourceId, userId, reason) => {
  const original = await Journal.findOne({
    where: { sourceType, sourceId, status: 'posted' },
    include: [{ model: JournalLine, as: 'lines' }],
  })
  if (!original) return null // nothing posted to reverse

  const reversalType = `${sourceType}.reversal`
  const already = await Journal.findOne({
    where: { sourceType: reversalType, sourceId, status: 'posted' },
  })
  if (already) return already

  const lines = (original.lines || []).map(l => ({
    accountId:   l.accountId,
    description: `Reversal: ${l.description || ''}`.trim(),
    debit:       Number(l.credit) || 0,
    credit:      Number(l.debit)  || 0,
  }))
  if (!lines.length) return null

  return postJournal({
    sourceType:    reversalType,
    sourceId,
    date:          new Date().toISOString().slice(0, 10),
    description:   `Reversal of ${original.refNo}${reason ? ` — ${reason}` : ''}`,
    lines,
    userId,
    organizationId: original.organizationId,
  })
}

const reverseInvoice    = (invoice, userId, reason = 'invoice cancelled')      => reverseFor('Invoice',           invoice.id, userId, reason)
const reverseReceipt    = (receipt, userId, reason = 'receipt cancelled')      => reverseFor('Receipt',           receipt.id, userId, reason)
const reverseVendorBill = (bill,    userId, reason = 'vendor bill cancelled')  => reverseFor('VendorBill',        bill.id,    userId, reason)
const reverseBillPayment = (bill,   userId, reason = 'bill payment cancelled') => reverseFor('VendorBillPayment', bill.id,    userId, reason)

// Wrap a hook with safe error handling so callers can decide policy
const safeRun = async (fn, context) => {
  try {
    return await fn()
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error(`[auto-journal] ${context} failed:`, err.message || err)
    throw err
  }
}

module.exports = {
  postInvoice:        (inv, uid)         => safeRun(() => postInvoice(inv, uid),               `Invoice ${inv.invoiceNumber}`),
  postReceipt:        (rec, uid)         => safeRun(() => postReceipt(rec, uid),               `Receipt ${rec.receiptNumber}`),
  postVendorBill:     (bill, uid)        => safeRun(() => postVendorBill(bill, uid),           `VendorBill ${bill.billNumber}`),
  postBillPayment:    (bill, uid)        => safeRun(() => postBillPayment(bill, uid),          `BillPayment ${bill.billNumber}`),
  reverseInvoice:     (inv, uid, r)      => safeRun(() => reverseInvoice(inv, uid, r),         `Reverse Invoice ${inv.invoiceNumber}`),
  reverseReceipt:     (rec, uid, r)      => safeRun(() => reverseReceipt(rec, uid, r),         `Reverse Receipt ${rec.receiptNumber}`),
  reverseVendorBill:  (bill, uid, r)     => safeRun(() => reverseVendorBill(bill, uid, r),     `Reverse VendorBill ${bill.billNumber}`),
  reverseBillPayment: (bill, uid, r)     => safeRun(() => reverseBillPayment(bill, uid, r),    `Reverse BillPayment ${bill.billNumber}`),
}
