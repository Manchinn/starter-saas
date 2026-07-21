const { LineUserMapping, Customer } = require('../../../../server/models')
const customerService = require('../../customers/services/customer.service')

async function ensureCustomer(connection, profile) {
  let mapping = await LineUserMapping.findOne({
    where: { organizationId: connection.organizationId, lineUserId: profile.userId },
    include: [{ model: Customer, as: 'customer' }],
  })
  if (!mapping) {
    const customer = await customerService.create({
      name: profile.displayName || 'LINE Customer',
      notes: `Linked LINE user: ${profile.userId}`,
      userId: connection.organizationId,
      organizationId: connection.organizationId,
    })
    mapping = await LineUserMapping.create({
      organizationId: connection.organizationId,
      lineConnectionId: connection.id,
      customerId: customer.id,
      lineUserId: profile.userId,
      displayName: profile.displayName || null,
      pictureUrl: profile.pictureUrl || null,
    })
    mapping.customer = customer
  } else {
    await mapping.update({ displayName: profile.displayName || mapping.displayName, pictureUrl: profile.pictureUrl || mapping.pictureUrl })
  }
  return mapping
}

module.exports = { ensureCustomer }
