# LINE LIFF Integration Checklist — starter-saas

> สร้างเมื่อ: 2026-08-19 · ตรวจสถานะโค้ดจริงบน c46 (`admin2@100.89.73.34`) + clone `Manchinn/starter-saas@main`
> อ้างอิง workflow: `2026-08-19-starter-saas-line-development-and-deployment-workflow` (12oo)
> หลักการ: แก้ที่ local (`C:\Users\chinn\web-projects\starter-saas`) → push fork → c46 pull + redeploy → verify
> ข้อตกลงตอนนี้: **ยังไม่แตะ rich menu** (deploy ไปแล้ว 2 ตัว — `XiaoPao main menu v2 (2026-08-19)` เป็น default) โฟกัส LIFF ก่อน

---

## สถานะปัจจุบัน (verified 2026-08-19)

| ส่วน | สถานะ |
| --- | --- |
| Backend LIFF routes (`/api/line/liff/:organizationId/*`) | ✅ มีแล้ว (config/catalog/orders) |
| `verifyLiffIdToken` service | ✅ มีแล้ว (`shared/erp/line-integration/services/line-liff-auth.service.js`) |
| `LineConnection` model + migration | ✅ มีแล้ว (เก็บ secret เป็น AES-GCM ciphertext) |
| Admin API ตั้งค่า connection | ✅ มีแล้ว (`GET/PUT /api/line/admin/connection`) |
| Client dep `@line/liff` | ✅ มีแล้ว (`client/package.json` `^2.29.1`) |
| Client หน้า LIFF / route | ❌ **ยังไม่มี** — ต้องเขียน |
| LIFF app ใน LINE Console | ❌ ต้องไปสร้าง |
| `LineConnection` record ใน DB | ❌ ต้อง insert ผ่าน admin API |
| Public URL สำหรับ LIFF endpoint | ⚠️ ต้องยืนยัน (webhook ใช้ `app.cslogbook.me` ผ่าน cloudflared) |

**API base ทั้งหมด**: `/api/line` (mount ใน `server/modules/line/line.module.js`, nginx proxy `/api/` → `api:3000`)

| Route | Auth | หมายเหตุ |
| --- | --- | --- |
| `GET /api/line/liff/:organizationId/config` | public | คืน `{ organizationId, liffId }` — เอาไว้ให้ client เรียกก่อน `liff.init` |
| `GET /api/line/liff/:organizationId/catalog` | `x-line-id-token` | รายการสินค้า |
| `POST /api/line/liff/:organizationId/orders` | `x-line-id-token` | body `{ items, notes }` |
| `GET /api/line/liff/:organizationId/orders` | `x-line-id-token` | order ของ user |
| `PUT /api/line/admin/connection` | JWT + permission `erp.line-integration.manage` | save LineConnection |
| `GET /api/line/admin/connection` | JWT + permission | ดูค่า connection |

`verifyLiffRequest` (`server/modules/line/line.auth.js`): อ่าน header `x-line-id-token` → `verifyLiffIdToken` → ใช้ `connection.liffChannelId` เป็น `client_id` ยิง `POST https://api.line.me/oauth2/v2.1/verify` → attach `req.line = { connection, profile: { userId, displayName, pictureUrl } }`

---

## Phase 0 — LINE Developers Console (ทำที่มือ, ก่อนเขียนโค้ด)

1. เปิด https://developers.line.biz → เลือก Provider ของ OA `@807jvhju` (Hermes Assistant)
2. **สร้าง LIFF app** (ใน Messaging API channel หรือ LINE Login channel):
   - LIFF app name: เช่น `starter-saas ordering`
   - Size: `full`
   - **Endpoint URL**: ต้องเป็น HTTPS ที่ LINE server เข้าถึงได้จากนอก — ใช้ public domain เดียวกับ webhook (`https://app.cslogbook.me/liff`) ⚠️ tailscale serve อย่างเดียว LINE เข้าไม่ถึง (ต้อง cloudflared tunnel — เช็ค `docs/production-runbook.md` + cloudflared config บน c46 ว่า forward path ยังไง)
   - Scopes: อย่างน้อย `profile` (openid เป็น default)
   - Bot link: เปิด (จะได้เปิดจากแชทบอทได้)
3. บันทึกค่าเหล่านี้ (ห้ามแปะลง git):
   - **LIFF ID** (รูปแบบ `2001234567-xxxx`)
   - **Channel ID** (Messaging API channel — ใช้เป็น `liffChannelId` ด้วย)
   - **Channel Secret** (Messaging API tab)
   - **Channel Access Token** (ออก long-lived ใน Messaging API tab)
4. ยืนยัน webhook `https://app.cslogbook.me/line/webhook` ยัง active (อย่าไปแก้)

## Phase 1 — Seed LineConnection ผ่าน admin API (ทำบน c46 หรือ local ที่มี `LINE_CREDENTIAL_ENCRYPTION_KEY`)

> secret ถูก encrypt ด้วย `LINE_CREDENTIAL_ENCRYPTION_KEY` (`server/modules/line/line.crypto.js`) — ต้องรันบน env ที่มี key นี้ (c46 `.env.production` มีแล้ว)

1. หา `organizationId`: login admin → ดูใน dashboard/DB (`organizations` table) หรือจากฝั่ง ERP
2. เรียก (หลัง login เอา JWT มา):
```bash
curl -X PUT http://127.0.0.1:8081/api/line/admin/connection \
  -H "Authorization: Bearer ***" \
  -H "Content-Type: application/json" \
  -d '{
    "organizationId": "<org-uuid>",
    "messagingChannelId": "<channel-id>",
    "botUserId": "@807jvhju",
    "liffId": "<liff-id>",
    "liffChannelId": "<channel-id>",
    "defaultStoreId": null,
    "channelSecret": "<channel-secret>",
    "channelAccessToken": "<channel-access-token>"
  }'
```
3. ตรวจ:
```bash
curl -s http://127.0.0.1:8081/api/line/liff/<org-uuid>/config
# ต้องได้: {"organizationId":"<org-uuid>","liffId":"<liff-id>"}
```
4. ถ้า 404 "LINE ordering is not configured" → record ยังไม่เข้า / `isActive` ไม่ true

## Phase 2 — Client: สร้างหน้า LIFF (Vue 3 + Vite)

สร้าง module ใหม่ `client/src/modules/line/` — ModuleRegistry auto-register (`import.meta.glob('../modules/**/index.js')`) แค่มี `index.js` default export `{ slug, routes }`

**`client/src/modules/line/index.js`:**
```js
export default {
  slug: 'line',
  order: 93,
  routes: [
    {
      path: '/liff/:organizationId',
      name: 'line-liff',
      component: () => import('./views/LiffOrdering.vue'),
      meta: { title: 'line.liffTitle' },
    },
  ],
}
```

**`client/src/modules/line/views/LiffOrdering.vue`** — flow หลัก:
1. `onMounted`: `api.get(\`/line/liff/${organizationId}/config\`)` → `{ liffId }`
2. `await liff.init({ liffId })`
3. `if (!liff.isLoggedIn()) { liff.login(); return }` (LINE จะ redirect กลับมา)
4. `const idToken = liff.getIDToken()`
5. เรียก API โดยส่ง token ใน header:
```js
api.get(`/line/liff/${organizationId}/catalog`, {
  headers: { 'x-line-id-token': idToken },
})
api.post(`/line/liff/${organizationId}/orders`, { items, notes }, {
  headers: { 'x-line-id-token': idToken },
})
```
6. UI: รายการสินค้าจาก catalog, ปุ่มสั่ง order, list order ของตัวเอง
7. อย่าลืม i18n ถ้า module อื่นใช้ pattern เดิม

ดู pattern จาก `client/src/modules/billing/index.js` + `views/Billing.vue`

## Phase 3 — ทดสอบ local

1. `cd C:\Users\chinn\web-projects\starter-saas\client && npm run dev` (vite)
2. เปิดหน้า `/liff/<org-uuid>` ในเบราว์เซอร์ปกติ → ยังไงก็ได้ (LIFF API จะ error นอก LINE) — อย่างน้อยเช็คว่า config fetch ผ่าน + UI render
3. ทดสอบจริงต้องเปิดใน LINE app (Phase 5)

## Phase 4 — Commit + push

```bash
git add docs/line-liff-integration-checklist.md client/src/modules/line/
git commit -m "feat(line): add LIFF ordering client module (issue #<n>, ADR ref)"
git push origin main
```
⚠️ ห้าม push ไฟล์ `.env*` — ถ้ามี key ใหม่ให้ลง `.env.example` / `.env.production.example` เท่านั้น

## Phase 5 — Deploy บน c46

1. SSH: `ssh c46-ts` (= `admin2@100.89.73.34:22`) — **ห้ามใช้ `ssh c46`** (NAT เก่า connection refused)
2. **จัดการของค้าง 3 ไฟล์ก่อน pull** (verified 2026-08-19):
   - `Dockerfile.api`, `server/middleware/rate-limit.js`, `server/modules/system/system.service.js`
   - stash หรือ commit แยก — ห้ามทับ/ห้าม discard ถ้าไม่ชัวร์
3. ```bash
   cd /home/admin2/starter-saas
   git stash  # หรือ commit ของค้างก่อน
   git pull origin main
   docker compose --env-file .env.production up -d --build api web
   ```
4. Verify:
   - `docker compose --env-file .env.production ps` → ทุกตัว healthy (api, web, redis, db)
   - `curl -s -o /dev/null -w "%{http_code}" http://127.0.0.1:8081/dashboard` → 200
   - `curl -s http://127.0.0.1:8081/api/line/liff/<org-uuid>/config` → มี `liffId`
   - tailscale serve `:8444 → 127.0.0.1:8081` ยังอยู่ (ห้ามเปิด Funnel/พอร์ตสาธารณะใหม่)

## Phase 6 — Verify ด้วย LINE จริง

1. เปิด LIFF URL ใน LINE app (bot link / rich menu / QR ของ LIFF)
2. login → เห็น catalog
3. สั่ง order → เช็ค order ใน DB + log (`server/modules/line/`)
4. ตรวจ network tab: header `x-line-id-token` ถูกส่งไหม, response 401/404 อะไร

---

## Pitfalls (เจอแล้ว/ควรระวัง)

- **`x-line-id-token` ต้องเป็น ID token จาก `liff.getIDToken()`** — ไม่ใช่ access token ของ LINE
- **LIFF endpoint ต้องเป็น HTTPS สาธารณะ** — tailscale serve อย่างเดียว LINE เข้าไม่ถึง; ต้องผ่าน cloudflared tunnel เดียวกับ webhook (เช็ค `docs/production-runbook.md`, commit `695955d`)
- `liffChannelId` = Channel ID (ใช้เป็น `client_id` ตอน verify) — ผิดตัวเดียว login หลุด 401 ตลอด
- Secret ต้อง encrypt ด้วย key เดียวกับ env ที่รัน (`LINE_CREDENTIAL_ENCRYPTION_KEY`) — ถ้า key ต่างกัน decrypt ไม่ได้
- `verifyLiffRequest` อ่าน `organizationId` จาก `req.params` (path) หรือ `req.body` — อย่าส่งแค่ header
- **ห้ามเปิดพอร์ตสาธารณะ** บน c46 / **ห้ามใช้ `ssh c46`** / **อย่าแตะ rich menu** ตอนนี้
- ห้าม push secret ขึ้น repo — ใช้ admin API ตั้งค่า connection แทน

## Reference

- Backend: `server/modules/line/` (routes, controller, service, auth)
- Shared service: `shared/erp/line-integration/services/line-liff-auth.service.js`, `line-connection.service.js`
- Model: `shared/erp/line-integration/models/line-connection.model.js` (table `line_connections`)
- Migration: `shared/erp/line-integration/migrations/20260721_000001_line_integration.js`
- Module mount: `server/modules/line/line.module.js` (`mountPath: '/api/line'`)
- Client registry: `client/src/core/ModuleRegistry.js`
- Deploy runbook: `docs/production-runbook.md`