const { Sequence } = require('../../../../server/models')
const { Op } = require('sequelize')
const sequelize = require('../../../../server/config/database')

// ── Default sequences seeded on first use ────────────────────────────────────
const DEFAULTS = {
  // Transaction documents — monthly-reset, date-stamped ref numbers
  QT:  { name: 'Quotation',             format: 'QT{YY}{MM}{####}',  initialValue: 1, maxValue: 9999,  reseedPeriod: 'M' },
  GR:  { name: 'Good Receive',          format: 'GR{YY}{MM}{####}',  initialValue: 1, maxValue: 9999,  reseedPeriod: 'M' },
  ADJ: { name: 'Stock Adjustment',      format: 'ADJ{YY}{MM}{####}', initialValue: 1, maxValue: 9999,  reseedPeriod: 'M' },
  CNT: { name: 'Stock Count',           format: 'SC{YY}{MM}{####}',  initialValue: 1, maxValue: 9999,  reseedPeriod: 'M' },
  STR: { name: 'Stock Transfer',        format: 'RQ{YY}{MM}{####}',  initialValue: 1, maxValue: 9999,  reseedPeriod: 'M' },
  RTN: { name: 'Stock Return',          format: 'RTN{YY}{MM}{####}', initialValue: 1, maxValue: 9999,  reseedPeriod: 'M' },
  ISS: { name: 'Stock Issue',           format: 'ISS{YY}{MM}{####}', initialValue: 1, maxValue: 9999,  reseedPeriod: 'M' },
  DO:  { name: 'Delivery Order',        format: 'DO{YY}{MM}{####}',  initialValue: 1, maxValue: 9999,  reseedPeriod: 'M' },
  PR:  { name: 'Purchase Requisition',  format: 'PR{YY}{MM}{####}',  initialValue: 1, maxValue: 9999,  reseedPeriod: 'M' },
  PO:  { name: 'Purchase Order',        format: 'PO{YY}{MM}{####}',  initialValue: 1, maxValue: 9999,  reseedPeriod: 'M' },
  JE:  { name: 'Journal Entry',         format: 'JE{YY}{MM}{####}',  initialValue: 1, maxValue: 9999,  reseedPeriod: 'M' },
  RCP: { name: 'Receive Payment',       format: 'RCP{YY}{MM}{####}', initialValue: 1, maxValue: 9999,  reseedPeriod: 'M' },
  PMT: { name: 'Vendor Payment',        format: 'PMT{YY}{MM}{####}', initialValue: 1, maxValue: 9999,  reseedPeriod: 'M' },
  BN:  { name: 'Billing Note',          format: 'BN{YY}{MM}{####}',  initialValue: 1, maxValue: 9999,  reseedPeriod: 'M' },
  DN:  { name: 'Debit Note',            format: 'DN{YY}{MM}{####}',  initialValue: 1, maxValue: 9999,  reseedPeriod: 'M' },
  CN:  { name: 'Credit Note',           format: 'CN{YY}{MM}{####}',  initialValue: 1, maxValue: 9999,  reseedPeriod: 'M' },
  BILL:{ name: 'Vendor Bill',           format: 'BILL{YY}{MM}{####}', initialValue: 1, maxValue: 9999,  reseedPeriod: 'M' },
  // Entity / master-data codes — fixed (never reset)
  CUS: { name: 'Customer Code',         format: 'CUS{####}',         initialValue: 1, maxValue: 99999, reseedPeriod: 'F' },
  CGP: { name: 'Customer Group Code',   format: 'CGP{####}',         initialValue: 1, maxValue: 99999, reseedPeriod: 'F' },
  EMP: { name: 'Employee Code',         format: 'EMP{####}',         initialValue: 1, maxValue: 99999, reseedPeriod: 'F' },
  DEP: { name: 'Department Code',       format: 'DEP{####}',         initialValue: 1, maxValue: 99999, reseedPeriod: 'F' },
  VND: { name: 'Vendor Code',           format: 'VND{####}',         initialValue: 1, maxValue: 99999, reseedPeriod: 'F' },
  PRD: { name: 'Product Code / SKU',    format: 'PRD{####}',         initialValue: 1, maxValue: 99999, reseedPeriod: 'F' },
  CAT: { name: 'Category Code',         format: 'CAT{####}',         initialValue: 1, maxValue: 99999, reseedPeriod: 'F' },
  WHS: { name: 'Store / Warehouse Code',format: 'WHS{####}',         initialValue: 1, maxValue: 99999, reseedPeriod: 'F' },
  PRC: { name: 'Price List Code',       format: 'PRC{####}',         initialValue: 1, maxValue: 99999, reseedPeriod: 'F' },
  OI:  { name: 'Order Item Code',       format: 'OI{####}',          initialValue: 1, maxValue: 99999, reseedPeriod: 'F' },
  SI:  { name: 'Sale Item Code',        format: 'SI{####}',          initialValue: 1, maxValue: 99999, reseedPeriod: 'F' },
  PKG: { name: 'Sale Package Code',     format: 'PKG{####}',         initialValue: 1, maxValue: 99999, reseedPeriod: 'F' },
}

// ── Format engine ─────────────────────────────────────────────────────────────
function applyFormat(format, running) {
  const now  = new Date()
  const YYYY = now.getFullYear().toString()
  const YY   = YYYY.slice(2)
  const MM   = String(now.getMonth() + 1).padStart(2, '0')
  const DD   = String(now.getDate()).padStart(2, '0')

  return format
    .replace(/\{(#+)\}/g, (_, hashes) => String(running).padStart(hashes.length, '0'))
    .replace(/\{YYYY\}/g, YYYY)
    .replace(/\{YY\}/g, YY)
    .replace(/\{MM\}/g, MM)
    .replace(/\{DD\}/g, DD)
}

// ── Reset detection ───────────────────────────────────────────────────────────
function needsReset(seq) {
  if (seq.reseedPeriod === 'F') return false
  const now  = new Date()
  const last = seq.lastResetDate ? new Date(seq.lastResetDate) : null
  if (!last) return false
  if (seq.reseedPeriod === 'D') {
    return now.toISOString().slice(0, 10) !== seq.lastResetDate
  }
  if (seq.reseedPeriod === 'M') {
    return now.getFullYear() !== last.getFullYear() || now.getMonth() !== last.getMonth()
  }
  if (seq.reseedPeriod === 'Y') {
    return now.getFullYear() !== last.getFullYear()
  }
  return false
}

// ── Core: get next ref no (atomic) ───────────────────────────────────────────
const getNext = async (code, userId) => {
  const t = await sequelize.transaction()
  try {
    const def = DEFAULTS[code]
    const where = userId ? { code, userId } : { code, userId: null }
    const existing = await Sequence.findOne({ where, transaction: t })
    if (!existing && !def) {
      await t.rollback()
      throw { status: 500, message: `Sequence code '${code}' is not defined. Add it to DEFAULTS in sequence.service.js or create it in Settings → Sequence Numbers first.` }
    }
    const [seq] = await Sequence.findOrCreate({
      where,
      defaults: { ...(def || {}), code, userId: userId || null, runningValue: (def && def.initialValue) || 1 },
      transaction: t,
    })

    const reset       = needsReset(seq)
    const runningValue = reset ? seq.initialValue : seq.runningValue

    if (runningValue > seq.maxValue) {
      await t.rollback()
      throw { status: 500, message: `Sequence '${code}' has reached its maximum value (${seq.maxValue}). Please update it in Settings → Sequence Numbers.` }
    }

    const refNo = applyFormat(seq.format, runningValue)

    await seq.update({
      runningValue: runningValue + 1,
      ...(reset ? { lastResetDate: new Date().toISOString().slice(0, 10) } : {}),
    }, { transaction: t })

    await t.commit()
    return refNo
  } catch (err) {
    await t.rollback()
    throw err
  }
}

// ── Preview: what would the next ref look like (read-only) ───────────────────
const preview = (seq) => applyFormat(seq.format, seq.runningValue)

// ── getPreview: fetch next code for an entity sequence without consuming it ──
const getPreview = async (code, userId) => {
  const def = DEFAULTS[code] || {}
  const where = userId ? { code, userId } : { code, userId: null }
  const [seq] = await Sequence.findOrCreate({
    where,
    defaults: { ...def, code, userId: userId || null, runningValue: def.initialValue || 1 },
  })
  const reset = needsReset(seq)
  const runningValue = reset ? seq.initialValue : seq.runningValue
  return applyFormat(seq.format, runningValue)
}

// ── CRUD ──────────────────────────────────────────────────────────────────────
const list = async (userId) => {
  const where = userId ? { userId } : { userId: null }
  const rows = await Sequence.findAll({ where, order: [['code', 'DESC']] })
  return rows.map(s => ({ ...s.toJSON(), preview: preview(s) }))
}

const getById = async (id) => {
  const seq = await Sequence.findByPk(id)
  if (!seq) throw { status: 404, message: 'Sequence not found' }
  return { ...seq.toJSON(), preview: preview(seq) }
}

const create = async ({ code, name, initialValue, runningValue, reseedPeriod, maxValue, format }, userId) => {
  if (!code?.trim()) throw { status: 400, message: 'Code is required' }
  if (!name?.trim()) throw { status: 400, message: 'Name is required' }
  if (!format?.trim()) throw { status: 400, message: 'Format is required' }
  const normalizedCode = code.trim().toUpperCase()
  const exists = await Sequence.findOne({ where: { code: normalizedCode, userId: userId || null } })
  if (exists) throw { status: 400, message: `Sequence code '${normalizedCode}' already exists for this organization` }

  const iv = parseInt(initialValue) || 1
  const seq = await Sequence.create({
    code:         normalizedCode,
    userId:       userId || null,
    name:         name.trim(),
    initialValue: iv,
    runningValue: parseInt(runningValue) || iv,
    reseedPeriod: reseedPeriod || 'F',
    maxValue:     parseInt(maxValue) || 99999,
    format:       format.trim(),
  })
  return { ...seq.toJSON(), preview: preview(seq) }
}

const update = async (id, { name, initialValue, runningValue, reseedPeriod, maxValue, format }) => {
  const seq = await Sequence.findByPk(id)
  if (!seq) throw { status: 404, message: 'Sequence not found' }

  await seq.update({
    ...(name         !== undefined ? { name: name.trim() }                   : {}),
    ...(initialValue !== undefined ? { initialValue: parseInt(initialValue) } : {}),
    ...(runningValue !== undefined ? { runningValue: parseInt(runningValue) } : {}),
    ...(reseedPeriod !== undefined ? { reseedPeriod }                         : {}),
    ...(maxValue     !== undefined ? { maxValue: parseInt(maxValue) }         : {}),
    ...(format       !== undefined ? { format: format.trim() }                : {}),
  })
  return { ...seq.toJSON(), preview: preview(seq) }
}

const resetSequence = async (id) => {
  const seq = await Sequence.findByPk(id)
  if (!seq) throw { status: 404, message: 'Sequence not found' }
  await seq.update({ runningValue: seq.initialValue, lastResetDate: new Date().toISOString().slice(0, 10) })
  return { ...seq.toJSON(), preview: preview(seq) }
}

const remove = async (id) => {
  const seq = await Sequence.findByPk(id)
  if (!seq) throw { status: 404, message: 'Sequence not found' }
  if (DEFAULTS[seq.code]) throw { status: 400, message: 'Built-in sequences cannot be deleted' }
  await seq.destroy()
}

// ── Seed defaults for a specific user (idempotent — tops up missing codes) ───
// Returns { seeded, added, skipped, total } where `added` are codes inserted
// this call and `skipped` are codes that already existed. Safe to call any
// number of times; new codes added to DEFAULTS will be backfilled on next run.
const seedDefaultsForUser = async (userId) => {
  if (!userId) throw { status: 400, message: 'userId is required to seed sequences' }

  const existingRows = await Sequence.findAll({
    where: { userId },
    attributes: ['code'],
  })
  const existingCodes = new Set(existingRows.map(r => r.code))

  const toCreate = Object.entries(DEFAULTS)
    .filter(([code]) => !existingCodes.has(code))
    .map(([code, def]) => ({
      code,
      userId,
      name:         def.name,
      initialValue: def.initialValue,
      runningValue: def.initialValue,
      reseedPeriod: def.reseedPeriod,
      maxValue:     def.maxValue,
      format:       def.format,
    }))

  if (toCreate.length === 0) {
    return { seeded: false, added: 0, skipped: existingCodes.size, total: existingCodes.size }
  }

  await sequelize.transaction(async (t) => {
    await Sequence.bulkCreate(toCreate, { transaction: t, ignoreDuplicates: true })
  })

  return {
    seeded:  true,
    added:   toCreate.length,
    skipped: existingCodes.size,
    total:   existingCodes.size + toCreate.length,
  }
}

module.exports = { getNext, getPreview, list, getById, create, update, resetSequence, remove, seedDefaultsForUser }
