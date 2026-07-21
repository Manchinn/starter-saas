# Fork status (Manchinn/starter-saas)

**Last updated:** 2026-07-22

## What `main` is

```
main  =  artapon/starter-saas (upstream)  +  LINE LIFF order port
```

As of commit `a19d32f` (and the three LINE commits behind it), local/fork
`main` is rebased onto upstream `4784e41` (`release/v1.2.0` merge) with only
the LINE integration re-applied and documented.

| Remote   | URL                                      | Role                                      |
|----------|------------------------------------------|-------------------------------------------|
| `origin` | `https://github.com/Manchinn/starter-saas.git` | This fork; `main` tracks `origin/main` |
| `upstream` | `https://github.com/artapon/starter-saas.git` | Source of product base                 |

## What we are **not** continuing on this tree

Work that lived on the **pre-rebase / legacy fork main** is **out of scope**
for ongoing development on current `main`. Do not re-port or resume these as
default next steps:

| Legacy area | Why it is closed on this tree |
|-------------|-------------------------------|
| HRMS fork-only path (staff management layered on old main, separate from upstream’s model) | Upstream `main` already carries tenant staff / employees direction; fork-only HRMS path is abandoned |
| Staff offboarding / access-role audit history as built on old main | Same — do not revive on the old design |
| Org-admin employee drill-down as layered on old main | Same |
| Deferred **billing payment workflow** backlog from the old tree | Upstream billing foundation is present; old deferred payment-slice notes do not drive this branch |
| Old `BACKLOG.md` product queue from pre-rebase main | File is gone with the rebase; do not reconstruct that queue as binding |

Historical git branches on `origin` (e.g. `backup/manchinn-main-e8d2b8d`,
`codex/hrms-staff-offboarding`, `codex/upstream-subscription-billing`) may
still exist for archaeology. They are **not** the product direction of
`main`.

## What *is* in scope on `main`

1. **Upstream product** — stay close to `artapon/starter-saas`; prefer selective
   follow of upstream over large private divergences.
2. **LINE stack** — organization channel settings, credential encryption,
   webhook HMAC, LIFF order creation, notifications (see
   `shared/erp/line-integration`, `server/modules/line`, and `CHANGELOG.md`
   entry `2026-07-22`).
3. **New product slices** decided explicitly on this base (not implied by
   pre-rebase memory or old backlog items).

## Memory note

Earlier 12oo notes that describe pre-rebase handoffs (HRMS handoff at
`e8e5168`, org-admin drill-down, billing deferred on old main) are
**historical**. They do not authorize reopening that work on current `main`.
