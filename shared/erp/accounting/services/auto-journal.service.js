const { Journal, JournalLine } = require('../../../../server/models')
const sequelize = require('../../../../server/config/database')
const { getNext } = require('../../settings/services/sequence.service')
const accounts = require('./account-mapping.service')
const logger = require('../../../../server/core/logger').forLabel('auto-journal')

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

// Translate a doc-currency amount into the org's base currency.
// rate is the snapshotted FX rate that says "1 unit of doc currency = rate base units".
// Defaults to 1 (no translation) for base-currency or legacy docs.
const toBase = (amount, rate) => {
  const a = Number(amount) || 0
  const r = Number(rate)   || 1
  return Math.round((a * r) * 100) / 100 // 2-decimal rounding
}

// Build a human-friendly FX context string, e.g. "USD 100.00 @ 35.5000".
// Returns empty string when no translation occurred.
const fxContext = (amount, currency, rate) => {
  const r = Number(rate) || 1
  if (!currency || r === 1) return ''
  const fmt = (n) => Number(n).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  const rateFmt = Number(r).toLocaleString(undefined, { maximumFractionDigits: 4 })
  return ` (${currency} ${fmt(amount)} @ ${rateFmt})`
}

const postJournal = async ({ sourceType, sourceId, date, description, lines, userId, organizationId }) => {
  await require('./tax-period.service').assertOpen(date || new Date(), organizationId)
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
  const rate     = Number(invoice.exchangeRate) || 1
  const totalDoc    = Number(invoice.total          || 0)
  const subtotalDoc = Number(invoice.subtotal       || 0)
  const taxDoc      = Number(invoice.tax            || 0)
  const discountDoc = Number(invoice.discountAmount || 0)
  if (!totalDoc) throw { status: 400, message: 'Invoice total is zero — cannot post journal' }
  // Net revenue = gross subtotal minus the order-level discount, so AR (debit)
  // = revenue + tax (credit) keeps the journal balanced when a discount applies.
  const netSubtotalDoc = subtotalDoc - discountDoc
  const total    = toBase(totalDoc, rate)
  const subtotal = toBase(netSubtotalDoc, rate)
  const tax      = toBase(taxDoc, rate)
  const fx       = fxContext(totalDoc, invoice.currency, rate)

  const lines = [
    { accountId: ar.id,      debit: total, credit: 0, description: `Invoice ${invoice.invoiceNumber}${fx}` },
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
    description:   `Auto-posted from Invoice ${invoice.invoiceNumber}${fx}`,
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
  const rate      = Number(receipt.exchangeRate) || 1
  const amountDoc = Number(receipt.amount || 0)
  if (!amountDoc) throw { status: 400, message: 'Receipt amount is zero — cannot post journal' }
  const amount = toBase(amountDoc, rate)
  const fx     = fxContext(amountDoc, receipt.currency, rate)

  return postJournal({
    sourceType:    'Receipt',
    sourceId:      receipt.id,
    date:          receipt.receiptDate,
    description:   `Auto-posted from Receipt ${receipt.receiptNumber}${fx}`,
    lines: [
      { accountId: cashBank.id, debit: amount, credit: 0, description: `Receipt ${receipt.receiptNumber}${fx}` },
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
  const rate        = Number(bill.exchangeRate) || 1
  const totalDoc    = Number(bill.total    || 0)
  const subtotalDoc = Number(bill.subtotal || 0)
  const taxDoc      = Number(bill.tax      || 0)
  if (!totalDoc) throw { status: 400, message: 'Bill total is zero — cannot post journal' }
  const total    = toBase(totalDoc, rate)
  const subtotal = toBase(subtotalDoc, rate)
  const tax      = toBase(taxDoc, rate)
  const fx       = fxContext(totalDoc, bill.currency, rate)

  const lines = [
    { accountId: inventory.id, debit: subtotal, credit: 0, description: `Bill ${bill.billNumber}` },
  ]
  if (tax > 0) {
    const inTax = await accounts.getByRole('INPUT_TAX', orgId)
    lines.push({ accountId: inTax.id, debit: tax, credit: 0, description: `Input VAT - ${bill.billNumber}` })
  } else {
    lines[0].debit = total
  }
  lines.push({ accountId: ap.id, debit: 0, credit: total, description: `Bill ${bill.billNumber}${fx}` })

  return postJournal({
    sourceType:    'VendorBill',
    sourceId:      bill.id,
    date:          bill.billDate,
    description:   `Auto-posted from Vendor Bill ${bill.billNumber}${fx}`,
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
  const rate     = Number(bill.exchangeRate) || 1
  const totalDoc = Number(bill.total || 0)
  if (!totalDoc) throw { status: 400, message: 'Bill total is zero — cannot post payment journal' }
  const total = toBase(totalDoc, rate)
  const fx    = fxContext(totalDoc, bill.currency, rate)

  return postJournal({
    sourceType:    'VendorBillPayment',
    sourceId:      bill.id,
    date:          new Date().toISOString().slice(0, 10),
    description:   `Auto-posted payment for Vendor Bill ${bill.billNumber}${fx}`,
    lines: [
      { accountId: ap.id,   debit: total, credit: 0, description: `Payment ${bill.billNumber}` },
      { accountId: cash.id, debit: 0, credit: total, description: `Payment ${bill.billNumber}${fx}` },
    ],
    userId,
    organizationId: orgId,
  })
}

// ──────────────────────────────────────────────────────────────────────────────
// Sales: ReceivePayment confirmed → Dr Cash/Bank / Cr AR (multi-invoice allocator)
// Mirrors postReceipt but the source doc carries its own ref number + payment
// method, and the total is the sum of per-invoice allocation lines.
// ──────────────────────────────────────────────────────────────────────────────
const postReceivePayment = async (rp, userId) => {
  const orgId = rp.organizationId || null
  const existing = await findExisting('ReceivePayment', rp.id)
  if (existing) return existing

  const ar       = await accounts.getByRole('AR', orgId)
  const cashBank = await accounts.accountForPaymentMethod(rp.paymentMethod, orgId)
  const rate      = Number(rp.exchangeRate) || 1
  const amountDoc = Number(rp.amount || 0)
  if (!amountDoc) throw { status: 400, message: 'Receive Payment amount is zero — cannot post journal' }
  const amount = toBase(amountDoc, rate)
  const fx     = fxContext(amountDoc, rp.currency, rate)

  return postJournal({
    sourceType:    'ReceivePayment',
    sourceId:      rp.id,
    date:          rp.date,
    description:   `Auto-posted from Receive Payment ${rp.refNo}${fx}`,
    lines: [
      { accountId: cashBank.id, debit: amount, credit: 0, description: `Receive Payment ${rp.refNo}${fx}` },
      { accountId: ar.id,       debit: 0, credit: amount, description: `Receive Payment ${rp.refNo}` },
    ],
    userId,
    organizationId: orgId,
  })
}

// ──────────────────────────────────────────────────────────────────────────────
// Sales: CreditNote issued → Dr Revenue (+ Output Tax) / Cr AR
// Treated as an AR reduction (CN against an invoice). If the CN has no linked
// invoice, the AR contra is still booked — the customer's overall balance drops.
// ──────────────────────────────────────────────────────────────────────────────
const postCreditNote = async (cn, userId) => {
  const orgId = cn.organizationId || null
  const existing = await findExisting('CreditNote', cn.id)
  if (existing) return existing

  const ar       = await accounts.getByRole('AR',      orgId)
  const revenue  = await accounts.getByRole('REVENUE', orgId)
  const total    = Number(cn.amount || 0)
  if (!total) throw { status: 400, message: 'Credit Note amount is zero — cannot post journal' }

  // If the CN row carries explicit tax breakdown, split it. Otherwise treat
  // the full amount as a sales reduction (no tax adjustment).
  const taxAmount      = Number(cn.tax || 0)
  const subtotalAmount = taxAmount > 0 ? Math.max(0, total - taxAmount) : total

  const lines = [
    { accountId: revenue.id, debit: subtotalAmount, credit: 0, description: `Credit Note ${cn.refNo} — ${cn.reason || ''}`.trim() },
  ]
  if (taxAmount > 0) {
    const outTax = await accounts.getByRole('OUTPUT_TAX', orgId)
    lines.push({ accountId: outTax.id, debit: taxAmount, credit: 0, description: `Output VAT reversal — ${cn.refNo}` })
  }
  lines.push({ accountId: ar.id, debit: 0, credit: total, description: `Credit Note ${cn.refNo}` })

  return postJournal({
    sourceType:    'CreditNote',
    sourceId:      cn.id,
    date:          cn.date,
    description:   `Auto-posted from Credit Note ${cn.refNo}`,
    lines,
    userId,
    organizationId: orgId,
  })
}

// ──────────────────────────────────────────────────────────────────────────────
// Sales: DebitNote issued → Dr AR / Cr Revenue (+ Output Tax)
// Mirror of CreditNote: a new charge added to the customer's balance.
// ──────────────────────────────────────────────────────────────────────────────
const postDebitNote = async (dn, userId) => {
  const orgId = dn.organizationId || null
  const existing = await findExisting('DebitNote', dn.id)
  if (existing) return existing

  const ar      = await accounts.getByRole('AR',      orgId)
  const revenue = await accounts.getByRole('REVENUE', orgId)
  const total   = Number(dn.amount || 0)
  if (!total) throw { status: 400, message: 'Debit Note amount is zero — cannot post journal' }

  const taxAmount      = Number(dn.tax || 0)
  const subtotalAmount = taxAmount > 0 ? Math.max(0, total - taxAmount) : total

  const lines = [
    { accountId: ar.id, debit: total, credit: 0, description: `Debit Note ${dn.refNo}` },
    { accountId: revenue.id, debit: 0, credit: subtotalAmount, description: `Debit Note ${dn.refNo} — ${dn.reason || ''}`.trim() },
  ]
  if (taxAmount > 0) {
    const outTax = await accounts.getByRole('OUTPUT_TAX', orgId)
    lines.push({ accountId: outTax.id, debit: 0, credit: taxAmount, description: `Output VAT — ${dn.refNo}` })
  }

  return postJournal({
    sourceType:    'DebitNote',
    sourceId:      dn.id,
    date:          dn.date,
    description:   `Auto-posted from Debit Note ${dn.refNo}`,
    lines,
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

const reverseInvoice        = (invoice, userId, reason = 'invoice cancelled')         => reverseFor('Invoice',           invoice.id, userId, reason)
const reverseReceipt        = (receipt, userId, reason = 'receipt cancelled')         => reverseFor('Receipt',           receipt.id, userId, reason)
const reverseReceivePayment = (rp,      userId, reason = 'receive payment cancelled') => reverseFor('ReceivePayment',    rp.id,      userId, reason)
const reverseCreditNote     = (cn,      userId, reason = 'credit note cancelled')     => reverseFor('CreditNote',        cn.id,      userId, reason)
const reverseDebitNote      = (dn,      userId, reason = 'debit note cancelled')      => reverseFor('DebitNote',         dn.id,      userId, reason)
const reverseVendorBill     = (bill,    userId, reason = 'vendor bill cancelled')     => reverseFor('VendorBill',        bill.id,    userId, reason)
const reverseBillPayment    = (bill,    userId, reason = 'bill payment cancelled')    => reverseFor('VendorBillPayment', bill.id,    userId, reason)

// Wrap a hook with safe error handling so callers can decide policy
const safeRun = async (fn, context) => {
  try {
    return await fn()
  } catch (err) {
    logger.error(`${context} failed`, { error: err.message || String(err), stack: err.stack })
    throw err
  }
}

module.exports = {
  postInvoice:           (inv, uid)      => safeRun(() => postInvoice(inv, uid),                  `Invoice ${inv.invoiceNumber}`),
  postReceipt:           (rec, uid)      => safeRun(() => postReceipt(rec, uid),                  `Receipt ${rec.receiptNumber}`),
  postReceivePayment:    (rp,  uid)      => safeRun(() => postReceivePayment(rp, uid),            `ReceivePayment ${rp.refNo}`),
  postCreditNote:        (cn,  uid)      => safeRun(() => postCreditNote(cn, uid),                `CreditNote ${cn.refNo}`),
  postDebitNote:         (dn,  uid)      => safeRun(() => postDebitNote(dn, uid),                 `DebitNote ${dn.refNo}`),
  postVendorBill:        (bill, uid)     => safeRun(() => postVendorBill(bill, uid),              `VendorBill ${bill.billNumber}`),
  postBillPayment:       (bill, uid)     => safeRun(() => postBillPayment(bill, uid),             `BillPayment ${bill.billNumber}`),
  reverseInvoice:        (inv, uid, r)   => safeRun(() => reverseInvoice(inv, uid, r),            `Reverse Invoice ${inv.invoiceNumber}`),
  reverseReceipt:        (rec, uid, r)   => safeRun(() => reverseReceipt(rec, uid, r),            `Reverse Receipt ${rec.receiptNumber}`),
  reverseReceivePayment: (rp,  uid, r)   => safeRun(() => reverseReceivePayment(rp, uid, r),      `Reverse ReceivePayment ${rp.refNo}`),
  reverseCreditNote:     (cn,  uid, r)   => safeRun(() => reverseCreditNote(cn, uid, r),          `Reverse CreditNote ${cn.refNo}`),
  reverseDebitNote:      (dn,  uid, r)   => safeRun(() => reverseDebitNote(dn, uid, r),           `Reverse DebitNote ${dn.refNo}`),
  reverseVendorBill:     (bill, uid, r)  => safeRun(() => reverseVendorBill(bill, uid, r),        `Reverse VendorBill ${bill.billNumber}`),
  reverseBillPayment:    (bill, uid, r)  => safeRun(() => reverseBillPayment(bill, uid, r),       `Reverse BillPayment ${bill.billNumber}`),
}
