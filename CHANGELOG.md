# Changelog

All notable changes to Starter SaaS are documented in this file. The project
uses the principles of [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).
Dates are recorded in `YYYY-MM-DD` format. This file is a readable summary;
Git history remains the complete implementation-level record.

## [Unreleased]

## [2026-07-22]

Fork `main` rebased onto upstream `artapon/starter-saas` (`4784e41`) and
re-applied the LINE LIFF ordering stack on the upstream architecture.

### Added

- LINE LIFF order integration on the upstream base: organization-scoped channel
  settings, AES-256-GCM credential encryption (`LINE_CREDENTIAL_ENCRYPTION_KEY`),
  Messaging API webhook with raw-body HMAC signature checks, LIFF customer
  mapping, catalog/cart order creation, and best-effort LINE notifications on
  order status changes and receive-payment confirm.
  ([`1b72d8e`](https://github.com/Manchinn/starter-saas/commit/1b72d8e))
- Unit coverage for webhook fail-closed paths (bad JSON, unknown bot,
  missing/tampered signature) and `createLiffOrder` guards (stock, client price
  ignored, draft rollback, push-failure tolerance).
  ([`50d5cbb`](https://github.com/Manchinn/starter-saas/commit/50d5cbb))

### Fixed

- Create the LINE Messaging API client with
  `LineBotClient.fromChannelAccessToken` so `@line/bot-sdk` v11 wires
  push delegates correctly.
  ([`f618a66`](https://github.com/Manchinn/starter-saas/commit/f618a66))

### Docs / fork policy

- Documented that **`main` = upstream base + LINE port only**. Pre-rebase
  legacy fork work is **not** continued on this tree (HRMS fork-only path,
  offboarding/drill-down as previously layered on the old main, deferred
  billing payment workflow from the old backlog, etc.). Historical branches
  remain on the remote for reference only.
  See [docs/FORK.md](docs/FORK.md).
