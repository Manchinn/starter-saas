const svc = require('../services/currency.service')

const orgFrom = req => req.user?.organizationId || req.user?.id
const handleErr = (err, res, next) => {
  if (err.status) return res.status(err.status).json({ message: err.message })
  next(err)
}

// Currencies
const listCurrencies = async (req, res, next) => {
  try { res.json({ data: { currencies: await svc.listCurrencies({ organizationId: orgFrom(req) }) } }) }
  catch (err) { handleErr(err, res, next) }
}
const createCurrency = async (req, res, next) => {
  try { res.status(201).json({ data: { currency: await svc.createCurrency({ ...req.body, userId: req.user?.id, organizationId: orgFrom(req) }) } }) }
  catch (err) { handleErr(err, res, next) }
}
const updateCurrency = async (req, res, next) => {
  try { res.json({ data: { currency: await svc.updateCurrency(req.params.id, req.body, req.user?.id, orgFrom(req)) } }) }
  catch (err) { handleErr(err, res, next) }
}
const removeCurrency = async (req, res, next) => {
  try { await svc.removeCurrency(req.params.id, orgFrom(req)); res.json({ data: { message: 'Deleted' } }) }
  catch (err) { handleErr(err, res, next) }
}

// Rates
const listRates = async (req, res, next) => {
  try { res.json({ data: { rates: await svc.listRates({ currencyCode: req.query.currencyCode, organizationId: orgFrom(req) }) } }) }
  catch (err) { handleErr(err, res, next) }
}
const createRate = async (req, res, next) => {
  try { res.status(201).json({ data: { rate: await svc.createRate({ ...req.body, userId: req.user?.id, organizationId: orgFrom(req) }) } }) }
  catch (err) { handleErr(err, res, next) }
}
const removeRate = async (req, res, next) => {
  try { await svc.removeRate(req.params.id, orgFrom(req)); res.json({ data: { message: 'Deleted' } }) }
  catch (err) { handleErr(err, res, next) }
}

module.exports = {
  listCurrencies, createCurrency, updateCurrency, removeCurrency,
  listRates, createRate, removeRate,
}
