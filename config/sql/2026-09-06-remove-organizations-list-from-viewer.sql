-- One-shot data patch for deployments running with DB_BOOTSTRAP_OFF (issue #11).
--
-- Background: the roles seed used to grant the `viewer` role the
-- `organizations.list` permission. Organizations are cross-tenant account
-- rows (every top-level org's profile: email, phone, taxId, provider uid), so
-- any freshly registered account could read the whole platform's org
-- profiles. The seed on main no longer grants it, but DB_BOOTSTRAP_OFF skips
-- seeding at container start, so existing databases keep the stale grant.
--
-- Run ONCE per existing deployment (demo on c46, staging, MakeIt/Supabase)
-- after deploying the code fix. New/fresh installs need nothing.
--
-- Idempotent: deleting a non-existent mapping deletes nothing.
--
-- Verify before/after with:
--   SELECT r.slug AS role, p.slug AS permission
--   FROM "RolePermissions" rp
--   JOIN "Roles" r ON r.id = rp."roleId"
--   JOIN "Permissions" p ON p.id = rp."permissionId"
--   WHERE r.slug = 'viewer' AND p.slug = 'organizations.list';

DELETE FROM "RolePermissions" rp
USING "Roles" r, "Permissions" p
WHERE rp."roleId" = r.id
  AND rp."permissionId" = p.id
  AND r.slug = 'viewer'
  AND p.slug = 'organizations.list';
