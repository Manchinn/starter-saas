# LINE Rich Menu Batch & Bulk Operations

Rich menu CRUD (ADR-0003) added per-menu and per-user single operations. When
managing many users or transitioning cohorts between menus, individual API calls
are too slow. LINE's batch/bulk endpoints solve this: bulk link/unlink targets
1–500 users per call, and batch operations target all users of a given menu.

We add **bulk** (user-level) and **batch** (menu-level) endpoints to the
existing rich menu passthrough service. All use the same
`LineBotClient.fromChannelAccessToken` factory and `erp.line-integration.manage`
permission.

## Status

accepted and implemented (issue #9)

## Considered options

- Add to the same ADR-0003 — rejected: ADR-0003 already accepted; a separate
  decision keeps each record small and self-contained.
- Per-user bulk only (skip batch) — rejected: batch is the only way to
  transition all users from one menu to another without a user-ID inventory.
- Retry/idempotency layer on top of batch — deferred: `resumeRequestKey` already
  provides idempotent retry; a polling wrapper is sufficient for now.
- Merge batch response-header handling into the existing client wrapper —
  accepted as implemented: `richMenuBatch` return value does not include the
  `requestId` needed for progress polling — we use `*WithHttpInfo` to read it
  from `x-line-request-id` response header.

## Consequences

- Bulk endpoints accept `richMenuId` + `userIds[]` (1–500) and `userIds[]` only
  for unlink.
- Batch endpoint accepts `operations[]` (max 1000) with three operation types:
  `link` (from → to), `unlink` (from), `unlinkAll`.
- `resumeRequestKey` is optional and must match `^[a-zA-Z0-9_-]{1,100}$`.
- Batch progress returns `phase` (`ongoing` / `succeeded` / `failed`) +
  `acceptedTime` / `completedTime` ISO strings.
- All routes inherit `authenticate` + `requirePermission('erp.line-integration.manage')`.
- Do not add retry/queue logic without a new decision.
