// Backfill audit_logs.organizationId for rows written before audit.service.log
// resolved the org from the acting user. Best-effort and idempotent — only
// touches rows where organizationId is still NULL.
module.exports = {
  async up(ctx) {
    await ctx.rawSafe(`
      UPDATE audit_logs
      SET "organizationId" = (
        SELECT COALESCE(u."organizationId", u.id) FROM "Users" u WHERE u.id = audit_logs."userId"
      )
      WHERE "organizationId" IS NULL AND "userId" IS NOT NULL
    `)
  },
  // Pure data backfill — nothing to reverse.
  async down() {},
}
