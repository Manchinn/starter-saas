const { Currency, ExchangeRate } = require('../../../../server/models')
const { Op } = require('sequelize')
const { findByPkScoped } = require('../../../../server/core/tenant')

// ── Currencies ─────────────────────────────────────────────────────────
const listCurrencies = ({ organizationId } = {}) =>
  Currency.findAll({
    where: { organizationId: organizationId || null, dataFlag: { [Op.ne]: 2 } },
    order: [['isBase', 'DESC'], ['code', 'DESC']],
  })

const getCurrency = async (id, organizationId) => {
  const c = await findByPkScoped(Currency, id, organizationId)
  if (!c) throw { status: 404, message: 'Currency not found' }
  return c
}

const getBaseCurrency = async (organizationId) => {
  return Currency.findOne({
    where: { organizationId: organizationId || null, isBase: true, dataFlag: { [Op.ne]: 2 } },
  })
}

const createCurrency = async ({ code, name, symbol, decimals = 2, isBase = false, userId, organizationId }) => {
  if (!code?.trim()) throw { status: 400, message: 'Currency code is required' }
  if (!name?.trim()) throw { status: 400, message: 'Currency name is required' }

  if (isBase) {
    // Unset existing base in org
    await Currency.update(
      { isBase: false },
      { where: { organizationId: organizationId || null, isBase: true } },
    )
  }
  return Currency.create({
    code: code.trim().toUpperCase(),
    name: name.trim(),
    symbol: symbol || null,
    decimals,
    isBase,
    organizationId: organizationId || null,
    createdBy: userId || null,
    modifiedBy: userId || null,
  })
}

const updateCurrency = async (id, { name, symbol, decimals, isBase, isActive }, userId, organizationId) => {
  const c = await getCurrency(id, organizationId)
  if (isBase && !c.isBase) {
    await Currency.update(
      { isBase: false },
      { where: { organizationId: c.organizationId, isBase: true } },
    )
  }
  await c.update({
    ...(name     !== undefined && { name }),
    ...(symbol   !== undefined && { symbol: symbol || null }),
    ...(decimals !== undefined && { decimals }),
    ...(isBase   !== undefined && { isBase }),
    ...(isActive !== undefined && { isActive }),
    modifiedBy: userId || null,
  })
  return c
}

const removeCurrency = async (id, organizationId) => {
  const c = await getCurrency(id, organizationId)
  if (c.isBase) throw { status: 400, message: 'Cannot delete the base currency' }
  await c.destroy()
}

// ── Exchange Rates ─────────────────────────────────────────────────────
const listRates = ({ currencyCode, organizationId } = {}) => {
  const where = { organizationId: organizationId || null }
  if (currencyCode) where.currencyCode = String(currencyCode).toUpperCase()
  return ExchangeRate.findAll({ where, order: [['asOfDate', 'DESC'], ['createdAt', 'DESC']] })
}

const createRate = async ({ currencyCode, rate, asOfDate, source, notes, userId, organizationId }) => {
  if (!currencyCode?.trim()) throw { status: 400, message: 'Currency code is required' }
  if (rate == null || Number(rate) <= 0) throw { status: 400, message: 'Rate must be greater than 0' }
  if (!asOfDate) throw { status: 400, message: 'As-of date is required' }
  return ExchangeRate.create({
    currencyCode: currencyCode.trim().toUpperCase(),
    rate,
    asOfDate,
    source: source || 'manual',
    notes: notes || null,
    organizationId: organizationId || null,
    createdBy: userId || null,
  })
}

const removeRate = async (id, organizationId) => {
  const r = await findByPkScoped(ExchangeRate, id, organizationId)
  if (!r) throw { status: 404, message: 'Exchange rate not found' }
  await r.destroy()
}

/**
 * Resolve the rate to convert FROM the given currency INTO the org's base.
 * If currencyCode equals the base (or no base is set), returns 1.
 * Otherwise returns the most recent rate <= asOfDate.
 */
const getRateOn = async (currencyCode, asOfDate, organizationId) => {
  if (!currencyCode) return 1
  const upperCode = String(currencyCode).toUpperCase()
  const base = await getBaseCurrency(organizationId)
  if (!base || upperCode === base.code) return 1
  const ref = asOfDate ? new Date(asOfDate) : new Date()
  const found = await ExchangeRate.findOne({
    where: {
      organizationId: organizationId || null,
      currencyCode: upperCode,
      asOfDate: { [Op.lte]: ref },
    },
    order: [['asOfDate', 'DESC']],
  })
  return found ? Number(found.rate) : 1
}

module.exports = {
  listCurrencies, getCurrency, getBaseCurrency, createCurrency, updateCurrency, removeCurrency,
  listRates, createRate, removeRate,
  getRateOn,
}
