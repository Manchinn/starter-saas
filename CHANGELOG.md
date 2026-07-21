# Changelog

All notable changes to Starter SaaS are documented in this file. The project
uses the principles of [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).
Dates are recorded in `YYYY-MM-DD` format. This file is a readable summary;
Git history remains the complete implementation-level record.

## [Unreleased]

### Added

- Subscription and billing foundation: organization-scoped plans,
  subscriptions, platform billing history, usage counters, default plans, and
  billing dashboards for users and administrators.
- Plan-aware staff-seat and monthly-invoice quota enforcement, including a
  permission-protected administration API for catalog and subscription changes.
- HRMS Staff Management: employee login accounts can be created or linked with
  centrally managed roles; role assignment is constrained by the manager's own
  permissions, and employee/department APIs now enforce their module permissions.
- HRMS staff offboarding: managers can terminate an employee's access in one
  action, deactivating the login, revoking active sessions, removing roles, and
  retaining an organization-scoped access history on the employee record.
- Organization-admin employee drill-down: platform admins can open an
  organization's HR employee list, create/edit/offboard with explicit org scope,
  and navigate from Organizations to `/hrms/employees?organizationId=…` while
  non-admins remain locked to their own organization.
- Billing-only access mode for inactive subscriptions: tenants whose plan is
  canceled, expired, past_due, or suspended can still sign in, but are confined
  to `/billing` (minimal shell) until they re-subscribe; platform admins remain
  exempt. Server gate allows `/api/billing/*` and `/api/auth/*` only.

### Changed

- New organizations receive the default subscription automatically; manual
  paid-plan changes remain administrator-only until a request/approval and
  payment-provider flow is introduced.
- Tenant self-service plan selection via `POST /billing/subscribe` and the
  `/billing/plans` page so locked orgs can restore access without admin help.

### Security

- Hardened organization logo uploads and static delivery by rejecting SVGs and
  serving logos with restrictive browser security headers.
- Prevented newline injection when the install wizard writes `server/.env`.
- Restricted AI provider base URLs to safe HTTP(S) targets, including guards
  for cloud metadata and private/link-local addresses while retaining MaxPlus
  and local LM Studio support.
- Added API rate limits, bounded pagination parameters, and per-tool RBAC for
  AI actions using the existing ERP permission slugs.
- Auth flow rate limits: `/refresh`, token routes (`reset-password`,
  `verify-email`), and `/login-as` are throttled; shared auth limiters live in
  `server/middleware/security.js` with the global API budgets.
- Pagination sanitize drops invalid `page`/`limit`, caps out-of-range values,
  and uses the last repeated query param; global API/write budgets are tunable
  via `RATE_LIMIT_API_MAX` / `RATE_LIMIT_WRITE_MAX`.
- Dashboard AI summary tools (`executive_summary`, `financial_summary`,
  `inventory_summary`) require `erp.products.list`, matching GET `/dashboard/stats`.

### Fixed

- Restored AI Assistant access after RBAC hardening by resolving permissions
  from the authenticated user while retaining the tenant-scoped tool context.

## [2026-07-21]

### Added

- LINE LIFF order integration: organization-scoped LINE channel settings,
  encrypted credentials, signed webhooks, customer mapping, catalog and cart,
  order creation, order-status history, and LINE order/payment notifications.
  ([`781d9cc`](https://github.com/Manchinn/starter-saas/commit/781d9cc))

## [2026-06-02]

### Added

- Docker development/production support, deployment scripts, and CI/CD
  workflows. ([`3c03cd2`](https://github.com/Manchinn/starter-saas/commit/3c03cd2),
  [`a3ea60f`](https://github.com/Manchinn/starter-saas/commit/a3ea60f))

### Fixed

- Database-migration compatibility and concurrency protections for supported
  database engines. ([`ef55ee7`](https://github.com/Manchinn/starter-saas/commit/ef55ee7),
  [`16e1fd6`](https://github.com/Manchinn/starter-saas/commit/16e1fd6),
  [`4cdf42e`](https://github.com/Manchinn/starter-saas/commit/4cdf42e))
- Redis health reporting, container healthcheck timing, and graceful process
  shutdown. ([`aaa7224`](https://github.com/Manchinn/starter-saas/commit/aaa7224),
  [`8ae1ef9`](https://github.com/Manchinn/starter-saas/commit/8ae1ef9),
  [`586886a`](https://github.com/Manchinn/starter-saas/commit/586886a))

## [2026-05-30]

### Added

- AI Assistant tools for dashboard, customers, and products, including sample
  prompts, selected-language responses, and configurable automatic actions.
  ([`f1a27cc`](https://github.com/Manchinn/starter-saas/commit/f1a27cc),
  [`73cfe34`](https://github.com/Manchinn/starter-saas/commit/73cfe34),
  [`3ac8676`](https://github.com/Manchinn/starter-saas/commit/3ac8676))

### Fixed

- AI Assistant answers are grounded in live tool data instead of fabricated
  figures. ([`a7722a3`](https://github.com/Manchinn/starter-saas/commit/a7722a3))

## [2026-05-28]

### Added

- Organization-level data isolation across ERP sales, purchasing, inventory,
  accounting, customer, and vendor workflows.
  ([`17a649a`](https://github.com/Manchinn/starter-saas/commit/17a649a),
  [`29f0591`](https://github.com/Manchinn/starter-saas/commit/29f0591))
- Redis cache support and a redesigned installation wizard.
  ([`5753a5c`](https://github.com/Manchinn/starter-saas/commit/5753a5c),
  [`280d1bf`](https://github.com/Manchinn/starter-saas/commit/280d1bf))

### Fixed

- Authorization hardening for privilege escalation and insecure direct object
  reference risks. ([`2a142af`](https://github.com/Manchinn/starter-saas/commit/2a142af))

## [2026-05-15]

### Added

- Core ERP document chains: Order to Delivery Order to Invoice to Receipt, and
  Purchase Requisition to Purchase Order to Goods Receipt to Vendor Bill.
  ([`4b4f50e`](https://github.com/Manchinn/starter-saas/commit/4b4f50e),
  [`d4ad48e`](https://github.com/Manchinn/starter-saas/commit/d4ad48e))
- Automatic accounting journals, inventory reorder points, and batch tracking.
  ([`d792945`](https://github.com/Manchinn/starter-saas/commit/d792945),
  [`c15fe87`](https://github.com/Manchinn/starter-saas/commit/c15fe87))

## [2026-04-06]

### Added

- Initial Starter SaaS project. ([`2c0476a`](https://github.com/Manchinn/starter-saas/commit/2c0476a))

## Updating This File

- Add user-visible changes to the `Unreleased` section in the same change set.
- Use `Added`, `Changed`, `Deprecated`, `Removed`, `Fixed`, or `Security` as
  appropriate.
- When releasing, rename `Unreleased` to the release date and create a new
  empty `Unreleased` section above it.
