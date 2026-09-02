/**
 * Add `provider` / `providerUid` to Users so a LINE (or other OAuth) login can be
 * linked to a platform User. A regular credential login simply leaves both null.
 *
 * The boot-time sync() creates these columns on a fresh database; this migration is
 * what upgrades an existing installation, so it is written against the idempotent
 * migrator helpers (addColumn / addIndex skip work that is already done).
 */
module.exports = {
  async up({ addColumn, addIndex, DataTypes }) {
    await addColumn('Users', 'provider', {
      type: DataTypes.STRING,
      allowNull: true,
      comment: 'Auth Provider — e.g. "line" for LINE login. Null = local credential login.',
    })
    await addColumn('Users', 'providerUid', {
      type: DataTypes.STRING,
      allowNull: true,
      comment: 'Auth Provider UID — the LINE `sub` claim, unique per provider.',
    })
    // LINE logins resolve the platform User via (provider, providerUid). UNIQUE so a
    // concurrent find-or-create can never double-book the same LINE identity; Postgres
    // treats NULLs as distinct, so this is safe for users who are not LINE-linked.
    await addIndex('Users', ['provider', 'providerUid'], { name: 'idx_users_provider_uid', unique: true })
  },

  async down({ removeColumn }) {
    await removeColumn('Users', 'providerUid')
    await removeColumn('Users', 'provider')
  },
}
