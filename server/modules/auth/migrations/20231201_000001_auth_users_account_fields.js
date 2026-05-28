// User account fields: org hierarchy, default landing page, email verification
// and password reset (with lookup indexes on the token columns).
const COLUMNS = {
  defaultPage:                'TEXT',
  parentId:                   'TEXT',
  emailVerifiedAt:            'DATETIME',
  emailVerificationToken:     'TEXT',
  emailVerificationExpiresAt: 'DATETIME',
  passwordResetToken:         'TEXT',
  passwordResetExpiresAt:     'DATETIME',
}

const INDEXES = [
  { name: 'idx_users_password_reset_token',      fields: ['passwordResetToken'] },
  { name: 'idx_users_email_verification_token',  fields: ['emailVerificationToken'] },
]

const typeFor = (ctx, sql) => (sql === 'DATETIME' ? { type: ctx.DataTypes.DATE } : { type: ctx.DataTypes.TEXT })

module.exports = {
  async up(ctx) {
    for (const [col, sql] of Object.entries(COLUMNS)) {
      await ctx.addColumn('Users', col, typeFor(ctx, sql))
    }
    for (const { name, fields } of INDEXES) await ctx.addIndex('Users', fields, { name })
  },
  async down(ctx) {
    for (const { name } of INDEXES) await ctx.removeIndex('Users', name)
    for (const col of Object.keys(COLUMNS)) await ctx.removeColumn('Users', col)
  },
}
