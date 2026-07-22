# Changelog

All notable changes to Starter SaaS are documented in this file. The project
uses the principles of [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).
Dates are recorded in `YYYY-MM-DD` format. This file is a readable summary;
Git history remains the complete implementation-level record.

## [Unreleased]

## [1.2.0-line.1] - 2026-07-22

Fork marker for `main` after upstream `v1.2.0` (`4784e41`) plus the LINE port
and architecture deepen on this tree. Package versions are set to
`1.2.0-line.1` so they match this release line (they previously stayed at
`1.0.1` from an older root layout).

### Changed

- เส้นทางยืนยันสต็อก (ปรับสต็อก / เบิก / คืน / รับสินค้า / ยืนยัน-ยกเลิกออเดอร์ขาย)
  เขียนยอดสินค้า / ยอดคลัง / รายการเคลื่อนไหว ผ่าน **Stock ledger** `postDelta`
  ร่วมกันที่ `shared/erp/stock/stock-ledger/` แล้ว
  นับสต็อก (count) และโอนย้าย (transfer) ยังไม่เปลี่ยน ผู้เรียกยังรับผิดชอบ
  ล็อกคลัง ตรวจติดลบ แถวแพ็กเกจ และ `Item.stock` เดิม
  **เปลี่ยนพฤติกรรม:** ถ้า product หายบนเส้นทางตัดสต็อกของออเดอร์
  จะ throw แล้ว rollback ทั้ง transaction (เดิมข้ามเงียบ) — ดู issue #1
  ([`b95488f`](https://github.com/Manchinn/starter-saas/commit/b95488f))
- **Customer notify port** ที่ `shared/erp/notifications/customer-notify.js`:
  ออเดอร์ขาย / รับชำระ เรียก `notifyCustomer` เท่านั้น (default no-op)
  ไม่ผูก `line-notification` โดยตรง — issue #2
- **LINE deepen (ADR-0002):** domain อยู่ใต้ `shared/erp/line-integration`
  (crypto, webhook, LIFF auth/catalog/order, messaging); `server/modules/line`
  เหลือ HTTP + `register` ติดตั้ง LINE เป็น adapter ของ Customer notify
  — issue #3
- หน้า `/erp/settings/line` ใช้ `AppLayout` + `FormCard`/`FormField` ให้สอดคล้อง
  หน้า ERP settings อื่น; sidebar ใช้ `nav.lineIntegration`; i18n อยู่ใต้
  `erp.lineIntegration` และ client i18n path matching รองรับ Windows path

### Docs

- บันทึกผล architecture review ชิ้นแรก: คำศัพท์ Stock ใน `CONTEXT.md`,
  ADR-0001 (Stock ledger write path), และสถานะใน `docs/FORK.md`
- ADR-0002 + คำศัพท์ LINE / Customer notify ใน `CONTEXT.md`;
  อัปเดตสถานะ implement ใน `docs/FORK.md`
- คู่มือผู้ใช้: ภาค 2 ผู้ดูแลองค์กร (ภาษาไทย) ใน `docs/user-guide.html`

### Ops / hygiene

- Align root / server / client `package.json` version to `1.2.0-line.1`
- Ignore local `.zcode/` agent workspace state

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
