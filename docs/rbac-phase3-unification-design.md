# RBAC Phase 3 — Unification Design

**Status:** Draft for approval — no code written yet.
**Author:** Claude (with @artapon1)
**Date:** 2026-06-01
**Prereqs:** Phase 1 (server guard hardening, commit `a69fd2b`) and Phase 2 (dedicated vendor/settings slugs, commit `02d4cc4`) are merged.

---

## 1. Problem statement

The project runs **two parallel RBAC systems** with overlapping concepts but no shared model:

| | Platform RBAC | HRMS RBAC |
|---|---|---|
| Role model | `Role` — **global**, `slug` unique globally, no `organizationId` | `HrmsRole` — **org-scoped**, unique `(organizationId, slug)` |
| Permission model | `Permission` — global catalog, `{slug, name, group}` | `HrmsPermission` — global catalog, `{slug, name, group, module}` |
| Role→Perm join | `RolePermission` | `HrmsRolePermission` |
| Assigned to | `User` via `UserRole` | `Employee` via `EmployeeRole` |
| Extra link | `Role`→`Module` via `RoleModule` | — |
| Catalog contents | **only** platform-admin slugs (`dashboard.view`, `users.*`, `roles.*`, `permissions.*`, `modules.*`) | **all** function slugs (`erp.*`, `hrms.*`, `reporting.*`, `ai-agent.*`), auto-derived from each module's `permissions: []` |
| UI | `client/src/modules/admin/views/Role*.vue` (admin-only) | `shared/hrms/views/roles/*` + `.../permissions/*` (org-scoped) |
| Catalog seed | `auth.service.js DEFAULT_PERMISSIONS` (hard-coded) | `shared/hrms/seeds/hrms-permissions.js derive()` (from modules) |

**Effective permission resolution** already merges both (`server/middleware/permission.js resolvePermissions()` and `auth.service resolveSession()`):

```
perms(user) = wildcard '*'                       if user.role === 'admin'
            = platform-role perms (UserRole→Role→Permission)
            ∪ HRMS perms (User→Employee→EmployeeRole→HrmsRole→HrmsPermission)
```

### Pain points
1. **Catalog gap / dead overlap.** `erp.*`/`hrms.*` perms exist *only* in `HrmsPermission`; platform roles literally cannot grant them. So the two "Permission" tables are not two views of one catalog — they are disjoint sets that happen to share a column shape.
2. **Two role editors** with near-identical UI (`Role*.vue` vs `hrms/views/roles/*`), two stores, two services, two i18n surfaces — double maintenance.
3. **Confusing mental model.** "Roles" means different things in two places; new contributors can't tell which to use.
4. **Scoping mismatch.** Platform `Role` is global; `HrmsRole` is per-org. Any true merge must reconcile this.

---

## 2. Goals & non-goals

**Goals**
- One coherent permission catalog and one resolution path.
- One role-management experience per audience (platform-admin vs org).
- No loss of current capability; no security regression.
- A migration that is reversible and shippable in small steps.

**Non-goals**
- Changing what permissions *exist* (Phase 2 already fixed slug coverage).
- Per-record / row-level permissions (out of scope).
- Changing the admin wildcard (`role:'admin'` ⇒ `*`).

---

## 3. Two candidate directions

### Direction A — **Collapse** (true merge into one model set)
Fold `HrmsRole`/`HrmsPermission`/`HrmsRolePermission`/`EmployeeRole` into `Role`/`Permission`/`RolePermission`/`UserRole`.

Requires:
- Add `organizationId` (nullable) to `Role`; change unique index from `slug` → `(organizationId, slug)`. `organizationId = NULL` ⇒ global/system role.
- Merge both permission catalogs into `Permission` (add the `module` column; seed `erp.*`/`hrms.*`/… there too).
- Decide assignment target: keep roles on `User` (`UserRole`) and **drop the Employee→Role link**, OR keep Employee as the assignment surface. (Employees already map 1:1 to a login `User`, so `UserRole` can carry everything; the Employee edit screen would assign the *user's* roles.)
- Rewrite both UIs to a single role editor that is org-aware.
- Data migration to move every `HrmsRole`/grant/assignment across.

**Pros:** genuinely one system; least conceptual debt long-term.
**Cons:** highest risk — touches 4 models, 4 junctions, 2 UIs, the tenant-scoping rules, seeds, and needs a careful data migration with rollback. Largest blast radius; most regression surface.

### Direction B — **Rationalize** (one *function* system, one *platform* system, clean boundary) ✅ recommended
Keep the two models but make the split intentional, documented, and non-overlapping — then delete the dead overlap.

- **HRMS RBAC = the single source of org/function permissions.** It already is, de facto.
- **Platform RBAC = strictly platform-admin capabilities** (managing orgs, users, platform roles, modules) — only ever assigned to staff of the top-level/admin tenant.
- Remove the *illusion* of overlap: the admin `Permission` catalog never pretends to hold `erp.*`; the HRMS catalog never holds `users.*`. Rename surfaces for clarity (e.g. HRMS "Roles" → "Access Roles", admin "Roles" → "Platform Roles").
- Consolidate shared UI: extract one reusable role-editor component used by both, parameterised by catalog source + scope.

**Pros:** low risk, incremental, mostly additive/cosmetic; preserves the working resolution path; can ship piecemeal.
**Cons:** still two model sets under the hood (but with a crisp, documented boundary). Not a literal "single table" merge.

> **Recommendation: Direction B.** It delivers the *user-visible* unification (one place to manage org access, no confusing duplication) and removes the maintenance/clarity pain, without the migration risk of A. We can keep A as a future option; B does not block it. If you specifically want a single physical model set, choose A and we budget for a dedicated branch + migration window.

The rest of this doc plans **Direction B**, with A's migration sketched in Appendix A.

---

## 4. Direction B — detailed plan

### 4.1 Conceptual boundary (the contract)
- `HrmsPermission` is the **function catalog**, owned by modules (auto-derived). Anything a feature gates on lives here.
- `Permission` is the **platform catalog**, hand-seeded, for platform administration only.
- A user's effective set = platform grants (if any) ∪ HRMS grants ∪ wildcard-if-admin. Unchanged.
- New rule to enforce in code review: **feature routes guard on function slugs only** (`erp.*`, `hrms.*`, `reporting.*`, `ai-agent.*`); **platform routes guard on platform slugs only** (`users.*`, `roles.*`, `organizations.*`, `modules.*`).

### 4.2 Workstreams (each independently shippable)

**WS1 — Naming & docs (cosmetic, zero-risk)**
- Rename UI labels/i18n: admin → "Platform Roles / Platform Permissions"; HRMS → "Access Roles / Access Permissions" (final wording TBD with you).
- Add a short `docs/rbac.md` describing the boundary + the route-guard convention from `project_rbac_enforcement` memory.
- No model/route changes.

**WS2 — Backfill the missing platform slugs that guards already reference**
- `organizations.{list,edit,delete}` are used by `requirePermission` but absent from `DEFAULT_PERMISSIONS`. Add them (+ any others found) so a non-admin platform role *could* be granted org management. Pure seed addition.

**WS3 — Shared role-editor component**
- Extract the permission-picker + role form into one component (`client/src/components/rbac/RoleEditor.vue`) parameterised by `{ catalogEndpoint, scope }`.
- Point both admin `RoleEdit/Create/Permissions` and HRMS `RoleEdit/Create/RolePermissions` at it. Delete the duplicated markup.
- Keep both routes/stores; only the view internals converge.

**WS4 — Consistency pass on guards & gates (carries Phase 2 forward)**
- Sweep remaining coarse gates; confirm every feature route guards on a function slug and matches its nav `permission` (the nav drives `getRoutePermission`). Add the few finer create-vs-update splits where they matter (e.g. mirror the existing `*.approve` pattern).

**WS5 — Remove dead overlap**
- Audit for any code path that tries to grant/read `erp.*` via the platform `Permission` table (expect none) and delete it.
- Ensure the admin permission list UI shows only platform slugs and the HRMS one only function slugs (no cross-contamination).

### 4.3 Sequencing
WS1 → WS2 → WS3 → WS4 → WS5. WS1/WS2 are trivial and can land immediately; WS3 is the bulk of the effort; WS4/WS5 are cleanup.

### 4.4 Risk & mitigation
| Risk | Likelihood | Mitigation |
|---|---|---|
| Shared component regresses one of the two editors | Med | Ship behind both existing routes; manual `/run` verify each; keep old components until parity confirmed |
| Renames break i18n keys | Low | Add new keys, keep old as aliases for one release |
| Missing a guard during WS4 sweep | Low | Re-run the audit grep (`requirePermission` count per route file) as a checklist |

### 4.5 Effort estimate (Direction B)
- WS1: ~0.5 day · WS2: ~0.25 day · WS3: ~1.5–2 days · WS4: ~1 day · WS5: ~0.5 day. **Total ≈ 4 days**, all on `main` in small PRs (no migration window needed).

---

## 5. Testing & rollout
- **Unit:** existing 986 server tests must stay green; add tests for WS2 seed additions and any new finer slugs.
- **Manual (`/run` or `/verify`):** for each persona — system admin, org owner, employee-with-Access-Role, employee-without — confirm nav, direct-URL 404 guard, and API 403s behave.
- **Rollout:** each workstream is its own PR; no flag needed for B. Revert = revert the PR.

---

## Appendix A — Direction A migration sketch (if chosen instead)

1. **Schema (migration up):**
   - `ALTER TABLE Roles ADD COLUMN organizationId UUID NULL;`
   - Drop unique(`slug`); add unique(`organizationId`,`slug`).
   - `ALTER TABLE Permissions ADD COLUMN module STRING NOT NULL DEFAULT 'general';`
2. **Catalog merge:** seed `erp.*`/`hrms.*`/`reporting.*`/`ai-agent.*` into `Permission` (reuse `derive()`); dedupe by slug.
3. **Data backfill:**
   - For each `HrmsRole` → insert `Role` (carry `organizationId`, `slug`, `name`, `color`, `isSystem`).
   - For each `HrmsRolePermission` → `RolePermission` against the merged catalog.
   - For each `EmployeeRole` → `UserRole` on the employee's linked `userId` (skip employees without a login user; log them).
4. **Code:** delete HRMS RBAC models/services/routes/stores; repoint employee role assignment to `UserRole`; update `resolvePermissions` to a single path.
5. **Rollback:** keep HRMS tables intact (don't drop) until a full release proves parity; migration `down` re-points reads to HRMS tables.
6. **Risks:** org-scoping the global `Role` affects every existing platform role (they become `organizationId = NULL`); the `RoleModule` link has no HRMS equivalent (decide keep/drop); employees without a `userId` can't hold `UserRole` (need a fallback). Budget a dedicated branch + staging dry-run on a DB copy.

---

## Open questions for @artapon1
1. **Direction A or B?** (Recommend B.)
2. Final naming: "Access Roles" vs "Team Roles" vs keep "HRMS Roles"? "Platform Roles" for admin?
3. For B-WS3, OK to introduce `client/src/components/rbac/` as the shared home?
4. Any appetite for finer create/update gates now (WS4), or defer?
