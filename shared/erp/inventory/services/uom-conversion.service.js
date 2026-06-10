const { UOMConversion, UOM } = require('../../../../server/models')
const { Op } = require('sequelize')
const { findByPkScoped } = require('../../../../server/core/tenant')

const uomInclude = [
  { model: UOM, as: 'fromUom', attributes: ['id', 'name', 'abbreviation'] },
  { model: UOM, as: 'toUom',   attributes: ['id', 'name', 'abbreviation'] },
]

const list = async ({ createdBy, organizationId } = {}) => {
  const where = { dataFlag: { [Op.ne]: 2 } }
  if (organizationId) where.organizationId = organizationId
  else if (createdBy) where.createdBy = createdBy
  const rows = await UOMConversion.findAll({
    where,
    include: uomInclude,
    order: [['createdAt', 'DESC']],
  })
  return rows
}

const create = async ({ fromUomId, toUomId, factor, notes, createdBy, organizationId }) => {
  if (!fromUomId) throw { status: 400, message: 'From UOM is required' }
  if (!toUomId)   throw { status: 400, message: 'To UOM is required' }
  if (fromUomId === toUomId) throw { status: 400, message: 'From and To UOM must be different' }
  if (!factor || parseFloat(factor) <= 0) throw { status: 400, message: 'Factor must be greater than 0' }
  const conv = await UOMConversion.create({ fromUomId, toUomId, factor: parseFloat(factor), notes: notes || null, organizationId: organizationId || null, createdBy: createdBy || null })
  return UOMConversion.findByPk(conv.id, { include: uomInclude })
}

const update = async (id, { fromUomId, toUomId, factor, notes }, userId, organizationId) => {
  const conv = await findByPkScoped(UOMConversion, id, organizationId)
  if (!conv) throw { status: 404, message: 'Conversion not found' }
  if (fromUomId === toUomId) throw { status: 400, message: 'From and To UOM must be different' }
  if (factor !== undefined && parseFloat(factor) <= 0) throw { status: 400, message: 'Factor must be greater than 0' }
  await conv.update({
    ...(fromUomId !== undefined && { fromUomId }),
    ...(toUomId   !== undefined && { toUomId }),
    ...(factor    !== undefined && { factor: parseFloat(factor) }),
    ...(notes     !== undefined && { notes: notes || null }),
    modifiedBy: userId || null,
  })
  return UOMConversion.findByPk(id, { include: uomInclude })
}

const remove = async (id, organizationId) => {
  const conv = await findByPkScoped(UOMConversion, id, organizationId)
  if (!conv) throw { status: 404, message: 'Conversion not found' }
  await conv.destroy()
}

module.exports = { list, create, update, remove }
