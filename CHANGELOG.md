# Changelog

All notable changes to Starter SaaS are documented in this file. The project
uses the principles of [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).
Dates are recorded in `YYYY-MM-DD` format. This file is a readable summary;
Git history remains the complete implementation-level record.

## [Unreleased]

### Added

- **PostgreSQL + Docker deployment stack**: `compose.yaml` (db / api / web พร้อม
  one-shot profile `provision`, `transfer`, `uploads`), `Dockerfile.api`,
  `Dockerfile.web`, `nginx.conf` และ `.env.production.example`
  Web publish เฉพาะ loopback (`127.0.0.1:${WEB_PORT}`) — PostgreSQL และ API
  ไม่ publish ออกสู่ host; Nginx เสิร์ฟ SPA และ proxy `/api/`, `/uploads/`,
  `/socket.io/` แบบ same-origin
  ([`1557f93`](https://github.com/Manchinn/starter-saas/commit/1557f93))
- เครื่องมือย้ายระบบใต้ `server/tools/`: `db:provision`, `db:transfer`,
  `db:validate`, `uploads:restore`, `uploads:validate`
  Transfer เป็น non-destructive (ปฏิเสธถ้าตารางปลายทางไม่ว่าง), เรียงตาม
  foreign-key dependency, ปฏิเสธ dependency cycle และตรวจผลด้วย row count /
  primary key / migration record / FK validation
  Uploads restore ปฏิเสธ volume ปลายทางที่ไม่ว่าง แล้วเทียบ SHA-256 inventory
  ต้นทาง-ปลายทางก่อนตั้ง ownership ให้ API runtime user
- **Monitoring stack (Slice 1)**: Uptime Kuma health dashboard, alert-relay →
  LINE Notify forwarding, Loki + Grafana log aggregation via `winston-loki`
  transport (`profile: monitoring`), docs/monitoring-setup.md (issue #7)
- **LINE Rich Menu API passthrough**: CRUD (list, create, get, delete, validate),
  image upload/download (JPEG/PNG via `setRichMenuImage`/`getRichMenuImage`),
  default menu (set, get, cancel), per-user link (link, get, unlink),
  และ rich menu alias (create, list, get, update, delete) สำหรับ `richmenuswitch`
  multi-level navigation — ทั้งหมดเป็น thin wrapper เหนือ `@line/bot-sdk`
  ฝั่ง backend; ไม่มี local persistence (LINE API คือ source of truth) และยัง
  ไม่มี admin UI — batch/bulk อยู่ใน commit เดียวกัน
  ([`9723511`](https://github.com/Manchinn/starter-saas/commit/9723511),
  [issue #9](https://github.com/Manchinn/starter-saas/issues/9), ADR-0003, ADR-0004)
- **LINE Rich Menu batch/bulk operations**: bulk link/unlink สำหรับ 1–500 users
  ต่อ call (`POST /admin/rich-menus/bulk/link|unlink`); batch menu-level
  operations สำหรับ 1–1000 ops ต่อ batch (`POST /admin/rich-menus/batch`,
  `POST /admin/rich-menus/batch/validate`,
  `GET /admin/rich-menus/batch/:requestId/progress`) — `requestId` อ่านจาก
  `x-line-request-id` response header ผ่าน `richMenuBatchWithHttpInfo`;
  validation แยก endpoint ก่อน submit; 65 tests (ADR-0004)
- **Production runbook**: `docs/production-runbook.md` — คู่มือการรัน production
  ครอบคลุม Docker Compose + Cloudflare Tunnel + monitoring ตั้งแต่ startup
  sequence (Docker ก่อน cloudflared), shutdown sequence, health verification,
  troubleshooting และ recovery scenarios พร้อม PowerShell scripts สำหรับ
  start/stop/health-check และ `config/cloudflared-config.example.yml` เป็น
  versioned template สำหรับ tunnel config

### Changed

- แบรนด์ที่ผู้ใช้เห็นตอน runtime เป็น **SaaS** ผ่าน `APP_NAME` / `VITE_APP_NAME`
  พร้อม `BrandMark.vue` เป็น component กลาง — repository/package identity,
  เอกสารย้อนหลัง, คำศัพท์ Redis และ LINE ไม่เปลี่ยน
  ([`6885ab6`](https://github.com/Manchinn/starter-saas/commit/6885ab6))
- API **ไม่แก้ schema ตอน boot** เมื่อ `DB_BOOTSTRAP_ON_START=false` (ค่าเริ่มต้น
  เดิมยังคงพฤติกรรมเก่า) การ sync / migrate / index / seed ย้ายไปที่
  `server/core/database-bootstrap.js` และรันเป็น one-shot job แยก
- Migration tracker (`SchemaMigrations`) quote table/column ตาม dialect แล้ว
  จึงใช้ได้ทั้ง SQLite และ PostgreSQL ที่ fold identifier เป็นตัวพิมพ์เล็ก

### Fixed

- AI Assistant chat ตอบกลับไม่ได้ (`POST /api/ai-agent/chat` คืน **504** โดยไม่มี
  log ฝั่งแอป) — Nginx ใช้ `proxy_read_timeout` ดีฟอลต์ 60 วินาทีบน `location
  /api/` ซึ่งตัดคำขอก่อน agent tool loop (สูงสุด 5 provider round-trip ละ 120s)
  จะตอบเสร็จ ตั้งเป็น `660s` ทั้ง read และ send
- `POST /api/erp/settings/demo-data/seed` ที่ชนข้อมูลเดิมคืน **409 Conflict**
  พร้อมข้อความบอกวิธีแก้ แทน Sequelize `"Validation error"` แบบกว้าง ๆ
  ([`515c6f2`](https://github.com/Manchinn/starter-saas/commit/515c6f2))
- **Rate-limit counters ชนกัน**: หลังจากเปิด Redis-backed rate limiting,
  ทุก limiter ใช้ Redis key `starter:rl:<ip>` ร่วมกันโดยไม่ได้ตั้งใจ —
  global API limiter (max 1500) ดัน counter ของ login limiter (max 10)
  ทำให้ user โดนบล็อกตั้งแต่ login ครั้งแรก แก้โดยแยก prefix ต่อ limiter
  (`rl:api:`, `rl:login:`, `rl:register:` ฯลฯ)
  ([`a75133d`](https://github.com/Manchinn/starter-saas/commit/a75133d))
- **LINE webhook verification คืน 404 `Unknown LINE destination`**:
  `line_connections.botUserId` เก็บค่าผิด — webhook lookup ใช้ฟิลด์ `destination`
  ที่ LINE ส่งมา ซึ่งเป็น **bot user id** (`U` + 32 ตัวอักษร) ไม่ใช่ **basic id**
  (`@xxx`) ที่เห็นในแอป LINE จึงหา connection ไม่เจอทุกครั้ง
  แก้ค่าใน DB ให้ตรงกับที่ LINE ส่ง และเพิ่ม `logger.warn` บน path นี้
  (log `destination` ที่หาไม่เจอ) เพื่อให้ diagnose ครั้งหน้าได้จาก log
  โดยไม่ต้องใส่ debug logging ชั่วคราว

### Ops / hygiene

- Cutover เครื่องนี้จาก SQLite runtime มาเป็น Docker Compose + PostgreSQL 16
  แบบ local-only ที่ `http://127.0.0.1:8080` (ย้าย 792 แถว / 94 ตาราง,
  transfer validator และ uploads validator ผ่าน, เก็บ SQLite และ `uploads/`
  ชุดเดิมไว้เป็น rollback artifact)
  เปิด public ผ่าน **Cloudflare Tunnel** → `https://app.cslogbook.me`
  (TLS auto, ไม่เปิด port, QUIC tunnel พร้อม HSTS/CORS/WAF)
  ยัง**ไม่**รวม multi-replica (Redis ยังปิด — cache / rate limit /
  Socket.IO state เป็น process-local) และ off-host scheduled backup
- `.gitignore` ignore `.env.*` ทั้งหมด ยกเว้น `.env.production.example`
  เพื่อกันไฟล์ secret ของ host หลุดเข้า Git; `.dockerignore` กัน `server/.env`,
  `data/`, `uploads/`, logs และ `.git` ออกจาก build context
- ลดขนาด Docker image `api` จาก **921 MB → 542 MB** (-41%):
  `Dockerfile.api` ติดตั้งเฉพาะ server production dependencies (`npm ci
  --workspace=server`) และ `chown` เฉพาะ writable directories แทนทั้ง `/app`
  ทำให้ node_modules ใน image ลดจาก 247 MB → 169 MB และ runtime memory
  idle ลดจาก 82 MB → 54 MB
- **CI/CD pipeline**: `.github/workflows/ci.yml` — test (122 suites / 1522 tests)
  และ client build (Vite) บน GitHub Actions ทุก push และ pull request ไป main
  ใช้ Node 22 LTS, ubuntu-latest ([`bfd4bd2`](https://github.com/Manchinn/starter-saas/commit/bfd4bd2))
- **Redis service** ใน `compose.yaml` (redis:7-alpine, RDB + AOF persistence)
  + `REDIS_ENABLED=true` — cache, rate limiting และ Socket.IO broadcast
  แชร์ผ่าน Redis; rate limiting ใช้ `rate-limit-redis` store,
  Socket.IO ใช้ `@socket.io/redis-adapter`, nginx sticky session
  (`ip_hash` upstream) สำหรับ `/socket.io/` พร้อม profile `scale`
  สำหรับ start API replica เพิ่ม (api-2)
- **Uptime Kuma public access**: เพิ่ม `monitor.cslogbook.me` ingress rule ใน
  `~/.cloudflared/config.yml` → tunnel ตรงเข้า `127.0.0.1:3001` โดยไม่ต้องผ่าน
  nginx; DNS CNAME `monitor` → `4ef941d7.cfargotunnel.com`
- บันทึกกับดัก deploy 2 ข้อที่เจอตอน debug LINE webhook (ทั้งคู่เป็น
  environment ไม่ใช่ bug ในโค้ด):
  **(1)** `docker compose build api` ใช้ layer cache เดิมจนโค้ดใหม่ไม่เข้า
  container — ยืนยันการแก้โค้ดด้วย `--no-cache` เมื่อ log ที่คาดว่าจะเห็นไม่ขึ้น
  **(2)** nginx cache DNS ของ upstream ตอน start ถ้า `api` ถูก recreate แล้ว IP
  ในเน็ตเวิร์ก Docker เปลี่ยน nginx จะยิงไป IP เดิมและได้ `111: Connection
  refused` (อาการที่ผู้ใช้เห็นคือ login ไม่ผ่าน) — `docker compose restart web`
  ให้ resolve ใหม่

### Docs

- `docs/postgresql-docker-deployment.md`: สถาปัตยกรรม, การตั้งค่าแบบ local-only,
  ข้อกำหนดตอนเปิด TLS/public ภายหลัง, ขั้นตอน provision / transfer / validate /
  restore uploads, rollback boundary, backup และข้อจำกัดด้าน scaling
- `docs/postgresql-docker-deployment.md`: เพิ่มส่วน **Cloudflare Tunnel** —
  สถาปัตยกรรม QUIC tunnel, วิธี setup cloudflared, .env.production values,
  Windows Service สำหรับ 24/7 persistence, nginx timeout notes,
  และขั้นตอนย้ายไป VPS
- `docs/FORK.md`: เพิ่มตาราง Deployment status — stack ปัจจุบัน, public access,
  open issues

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
