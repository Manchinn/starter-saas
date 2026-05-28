/**
 * HRMS associations — Employee, Department, EmployeeDepartment.
 */
module.exports = function associate({
  User, Employee, Department, EmployeeDepartment,
}) {
  // ── Employee ↔ User (account & organisation) ─────────────────────────────
  Employee.belongsTo(User, { foreignKey: 'userId',         as: 'user' })
  User.hasOne(Employee,    { foreignKey: 'userId',         as: 'employee' })
  Employee.belongsTo(User, { foreignKey: 'organizationId', as: 'organization' })
  User.hasMany(Employee,   { foreignKey: 'organizationId', as: 'employees' })

  // ── Department ↔ Organisation ─────────────────────────────────────────────
  Department.belongsTo(User, { foreignKey: 'organizationId', as: 'organization' })
  User.hasMany(Department,   { foreignKey: 'organizationId', as: 'departments' })

  // ── Employee ↔ Department (many-to-many) ──────────────────────────────────
  Employee.belongsToMany(Department, { through: EmployeeDepartment, foreignKey: 'employeeId',   as: 'departments' })
  Department.belongsToMany(Employee, { through: EmployeeDepartment, foreignKey: 'departmentId', as: 'employees' })
}
