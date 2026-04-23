/**
 * Core associations — auth, roles, permissions, platform users.
 * Receives the fully-populated `models` object from server/models/index.js.
 */
module.exports = function associate({
  User, Module, UserModule,
  RefreshToken,
  Role, Permission, RolePermission,
  RoleModule, UserRole,
}) {
  // ── User self-referential (org hierarchy) ───────────────────────────────────
  User.belongsTo(User, { foreignKey: 'organizationId', as: 'organization' })
  User.hasMany(User,   { foreignKey: 'organizationId', as: 'staff' })

  // ── User ↔ Module ───────────────────────────────────────────────────────────
  User.belongsToMany(Module, { through: UserModule, foreignKey: 'userId',   as: 'modules' })
  Module.belongsToMany(User, { through: UserModule, foreignKey: 'moduleId', as: 'users' })

  // ── User ↔ RefreshToken ─────────────────────────────────────────────────────
  User.hasMany(RefreshToken,    { foreignKey: 'userId', as: 'refreshTokens', onDelete: 'CASCADE' })
  RefreshToken.belongsTo(User,  { foreignKey: 'userId', as: 'user' })

  // ── Role ↔ Permission ───────────────────────────────────────────────────────
  Role.belongsToMany(Permission, { through: RolePermission, foreignKey: 'roleId',       as: 'permissions' })
  Permission.belongsToMany(Role, { through: RolePermission, foreignKey: 'permissionId', as: 'roles' })

  // ── Role ↔ Module ───────────────────────────────────────────────────────────
  Role.belongsToMany(Module, { through: RoleModule, foreignKey: 'roleId',   as: 'modules' })
  Module.belongsToMany(Role, { through: RoleModule, foreignKey: 'moduleId', as: 'roles' })

  // ── User ↔ Role ─────────────────────────────────────────────────────────────
  User.belongsToMany(Role, { through: UserRole, foreignKey: 'userId',  as: 'roles' })
  Role.belongsToMany(User, { through: UserRole, foreignKey: 'roleId',  as: 'users' })
}
