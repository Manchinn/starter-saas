const { Journal, JournalLine, ChartOfAccount } = require('../../../../server/models')
const { Op } = require('sequelize')
const sequelize = require('../../../../server/config/database')
const { getNext } = require('../../settings/services/sequence.service')

const accountAttrs = ['id', 'code', 'name', 'accountType', 'normalBalance']

const lineInclude = {
  model: JournalLine,
  as: 'lines',
  include: [{ model: ChartOfAccount, as: 'account', attributes: accountAttrs }],
  order: [['lineNo', 'ASC']],
}

const nextRefNo = (userId) => getNext('JE', userId)

const list = async ({ page = 1, limit = 20, search = '', status = '', organizationId }) => {
  const offset = (page - 1) * limit
  const where  = { organizationId: organizationId || null, dataFlag: { [Op.ne]: 2 } }
  if (search) where[Op.or] = [{ refNo: { [Op.like]: `%${search}%` } }, { description: { [Op.like]: `%${search}%` } }]
  if (status) where.status = status

  const { count, rows } = await Journal.findAndCountAll({
    where, limit, offset,
    order: [['date', 'DESC'], ['createdAt', 'DESC']],
    distinct: true,
  })
  return { total: count, page, limit, journals: rows }
}

const getById = async (id) => {
  const j = await Journal.findByPk(id, {
    include: [lineInclude],
  })
  if (!j) throw { status: 404, message: 'Journal not found' }
  return j
}

function checkBalance(lines) {
  if (!lines || lines.length < 2) throw { status: 400, message: 'A journal entry requires at least 2 lines' }
  const totalDebit  = lines.reduce((s, l) => s + Number(l.debit  || 0), 0)
  const totalCredit = lines.reduce((s, l) => s + Number(l.credit || 0), 0)
  if (Math.abs(totalDebit - totalCredit) > 0.001) throw { status: 400, message: `Journal is not balanced (debit ${totalDebit}, credit ${totalCredit})` }
  if (totalDebit === 0) throw { status: 400, message: 'Journal must have non-zero amounts' }
  return totalDebit
}

const create = async ({ date, description, lines = [], userId, organizationId }) => {
  if (!date) throw { status: 400, message: 'Date is required' }
  await require('./tax-period.service').assertOpen(date, organizationId)
  const totalDebit = checkBalance(lines)
  const refNo = await nextRefNo(userId)

  const t = await sequelize.transaction()
  try {
    const j = await Journal.create(
      { refNo, date, description: description || null, totalDebit,
        organizationId: organizationId || null, createdBy: userId || null, modifiedBy: userId || null },
      { transaction: t },
    )
    for (let i = 0; i < lines.length; i++) {
      const l = lines[i]
      await JournalLine.create(
        { journalId: j.id, lineNo: i + 1, accountId: l.accountId,
          description: l.description || null,
          debit: Number(l.debit || 0), credit: Number(l.credit || 0),
          organizationId: organizationId || null },
        { transaction: t },
      )
    }
    await t.commit()
    return getById(j.id)
  } catch (err) {
    await t.rollback()
    throw err
  }
}

const update = async (id, { date, description, lines = [], userId }) => {
  const j = await Journal.findByPk(id)
  if (!j)                  throw { status: 404, message: 'Journal not found' }
  if (j.status !== 'draft') throw { status: 400, message: 'Only draft journals can be edited' }

  await require('./tax-period.service').assertOpen(date || j.date, j.organizationId)
  const totalDebit = checkBalance(lines)

  const t = await sequelize.transaction()
  try {
    await JournalLine.destroy({ where: { journalId: id }, transaction: t })
    await j.update({ date, description: description || null, totalDebit, modifiedBy: userId || null }, { transaction: t })
    for (let i = 0; i < lines.length; i++) {
      const l = lines[i]
      await JournalLine.create(
        { journalId: id, lineNo: i + 1, accountId: l.accountId,
          description: l.description || null,
          debit: Number(l.debit || 0), credit: Number(l.credit || 0),
          organizationId: j.organizationId },
        { transaction: t },
      )
    }
    await t.commit()
    return getById(id)
  } catch (err) {
    await t.rollback()
    throw err
  }
}

const post = async (id, userId) => {
  const j = await Journal.findByPk(id, { include: [{ model: JournalLine, as: 'lines' }] })
  if (!j)                  throw { status: 404, message: 'Journal not found' }
  if (j.status !== 'draft') throw { status: 400, message: 'Only draft journals can be posted' }
  await require('./tax-period.service').assertOpen(j.date, j.organizationId)
  checkBalance(j.lines)
  await j.update({ status: 'posted', modifiedBy: userId || null })
  return getById(id)
}

const voidJournal = async (id, userId) => {
  const j = await Journal.findByPk(id)
  if (!j)                   throw { status: 404, message: 'Journal not found' }
  if (j.status === 'voided') throw { status: 400, message: 'Journal is already voided' }
  await j.update({ status: 'voided', modifiedBy: userId || null })
  return getById(id)
}

const remove = async (id) => {
  const j = await Journal.findByPk(id)
  if (!j)                  throw { status: 404, message: 'Journal not found' }
  if (j.status !== 'draft') throw { status: 400, message: 'Only draft journals can be deleted' }
  await j.destroy()
}

module.exports = { list, getById, create, update, post, voidJournal, remove }

