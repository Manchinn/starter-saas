const { HrmsPermission, HrmsRole } = require('../../../server/models')

// Read-only catalog. Permissions are system-defined (seeded from modules), so
// there is no create/update/delete here — roles simply reference them.
const list = async () => {
  const perms = await HrmsPermission.findAll({
    order: [['group', 'ASC'], ['name', 'ASC']],
    include: [{ model: HrmsRole, as: 'roles', attributes: ['id'], through: { attributes: [] } }],
  })
  return perms.map((p) => {
    const json = p.toJSON()
    json.roleCount = json.roles?.length || 0
    delete json.roles
    return json
  })
}

module.exports = { list }
