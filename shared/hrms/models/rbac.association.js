/**
 * HRMS RBAC associations — HrmsRole, HrmsPermission, Employee.
 *
 * Pure HRMS-domain (no core `User`), so it's auto-invoked by hrms/models.js.
 */
module.exports = function associate({
  Employee, HrmsRole, HrmsPermission, HrmsRolePermission, EmployeeRole,
}) {
  // ── Role ↔ Permission (many-to-many) ──────────────────────────────────────
  HrmsRole.belongsToMany(HrmsPermission, {
    through: HrmsRolePermission, foreignKey: 'hrmsRoleId', otherKey: 'hrmsPermissionId', as: 'permissions',
  })
  HrmsPermission.belongsToMany(HrmsRole, {
    through: HrmsRolePermission, foreignKey: 'hrmsPermissionId', otherKey: 'hrmsRoleId', as: 'roles',
  })

  // ── Employee ↔ Role (many-to-many) ────────────────────────────────────────
  Employee.belongsToMany(HrmsRole, {
    through: EmployeeRole, foreignKey: 'employeeId', otherKey: 'hrmsRoleId', as: 'roles',
  })
  HrmsRole.belongsToMany(Employee, {
    through: EmployeeRole, foreignKey: 'hrmsRoleId', otherKey: 'employeeId', as: 'employees',
  })
}
