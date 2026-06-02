# Migration Fix Summary

## Issue
App crashed on startup: `column "applied_at" of relation "schema_migrations" does not exist`

## Root Cause
`schema_migrations` table existed from old version without `applied_at` column. Migrator only checked table existence, not schema.

## Fix Applied

### 1. Updated `server/core/migrator.js`
- `ensureTrackingTable()` now validates column existence
- Adds missing `applied_at` column with dialect-specific handling:
  - SQLite: nullable + backfill
  - PostgreSQL/MySQL: NOT NULL + CURRENT_TIMESTAMP default

### 2. Added Migration File
- `server/migrations/20231130_000000_fix_schema_migrations_table.js`
- Runs before all existing migrations (timestamp: 20231130)
- Ensures fix persists even if code reverted

## Testing
✓ Created old-style table (no `applied_at`)
✓ Ran migrator
✓ Column added successfully
✓ Existing records preserved
✓ All 27 migrations applied

## Status
**FIXED** - Automatic on next startup, no manual intervention needed

See `docs/fixes/schema-migrations-fix.md` for full details.
