const { Employee, HrmsRole, HrmsPermission } = require('../../../server/models')

/**
 * Effective HRMS permission slugs for a login User.
 *
 * Resolves: User → linked Employee → attached HRMS roles → their permissions.
 * Returns a (possibly empty) array of permission slugs. Used to fold HRMS-role
 * grants into the user's overall permission set (middleware + session resolve).
 */
const employeePermissionSlugs = async (userId) => {
  if (!userId) return []
  const employee = await Employee.findOne({
    where: { userId },
    include: [{
      model: HrmsRole, as: 'roles', attributes: ['id'], through: { attributes: [] },
      include: [{ model: HrmsPermission, as: 'permissions', attributes: ['slug'], through: { attributes: [] } }],
    }],
  })
  if (!employee || !employee.roles) return []
  const slugs = []
  for (const role of employee.roles) {
    for (const perm of (role.permissions || [])) slugs.push(perm.slug)
  }
  return slugs
}

module.exports = { employeePermissionSlugs }
