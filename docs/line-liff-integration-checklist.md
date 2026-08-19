# LINE LIFF Integration Checklist — starter-saas

> สร้างเมื่อ: 2026-08-19 · อัปเดตล่าสุด: 2026-08-19 (route `/line-liff`, tunnel routing, Phase 0/1 confirmed)
> หลักการ: แก้ที่ local (`C:\Users\chinn\web-projects\starter-saas`) → push fork → c46 pull + redeploy → verify
> ข้อตกลงตอนนี้: **ยังไม่แตะ rich menu** — โฟกัส LIFF ก่อน

---

## สถานะปัจจุบัน (verified 2026-08-19)

| ส่วน | สถานะ |
| --- | --- |
| Backend LIFF routes (`/api/line/liff/:organizationId/*`) | ✅ มีแล้ว (config/catalog/orders) |
| `verifyLiffIdToken` service | ✅ มีแล้ว |
| `LineConnection` model + migration | ✅ มีแล้ว (เก็บ secret เป็น AES-GCM ciphertext) |
| Admin API ตั้งค่า connection | ✅ มีแล้ว (`GET/PUT /api/line/admin/connection`) |
| Client dep `@line/liff` | ✅ มีแล้ว (`client/package.json` `^2.29.1`) |
| LIFF app ใน LINE Console | ✅ สร้างแล้ว — LIFF ID `2010854084-v7SPSvSZ`, endpoint `https://app.cslogbook.me/line-liff` |
| Cloudflared tunnel routing `/line-liff*` + `/api/*` → c46 web | ✅ ทำแล้ว 2026-08-19 |
| Client หน้า LIFF / route | ❌ **ยังไม่มี** — ต้องเขียน (Phase 2) |
| `LineConnection` record ใน DB | ❌ ยังไม่ได้ seed (Phase 1) |

**API base ทั้งหมด**: `/api/line` (mount ใน `server/modules/line/line.module.js`, nginx proxy `/api/` → `api:3000`)

| Route | Auth | หมายเหตุ |
| --- | --- | --- |
| `GET /api/line/liff/:organizationId/config` | public | คืน `{ organizationId, liffId }` |
| `GET /api/line/liff/:organizationId/catalog` | `x-line-id-token` | รายการสินค้า |
| `POST /api/line/liff/:organizationId/orders` | `x-line-id-token` | body `{ items, notes }` |
| `GET /api/line/liff/:organizationId/orders` | `x-line-id-token` | order ของ user |
| `PUT /api/line/admin/connection` | JWT + `erp.line-integration.manage` | save LineConnection |
| `GET /api/line/admin/connection` | JWT + permission | ดูค่า connection |

`verifyLiffRequest` (`server/modules/line/line.auth.js`): อ่าน header `x-line-id-token` → `verifyLiffIdToken` → ใช้ `connection.liffChannelId` เป็น `client_id` ยิง `POST https://api.line.me/oauth2/v2.1/verify` → attach `req.line = { connection, profile: { userId, displayName, pictureUrl } }`

---

## Phase 0 — LINE Developers Console ✅ ทำแล้ว

- LIFF ID: `2010854084-v7SPSvSZ`
- Endpoint URL: `https://app.cslogbook.me/line-liff` (ผ่าน cloudflared tunnel — ดู `docs/production-runbook.md`)
- Bot link: เปิด
- ต้องใช้ค่า: Channel ID (=liffChannelId), Channel Secret, Channel Access Token — ไว้ seed connection (Phase 1)

## Phase 1 — Seed LineConnection ผ่าน admin API (ทำบน c46)

> secret ถูก encrypt ด้วย `LINE_CREDENTIAL_ENCRYPTION_KEY` (`server/modules/line/line.crypto.js`) — ต้องรันบน env ที่มี key นี้ (c46 `.env.production` มีแล้ว)

1. หา `organizationId`: login admin → ดูใน dashboard/DB
2. เรียก (หลัง login เอา JWT มา):
```bash
curl -X PUT http://127.0.0.1:8081/api/line/admin/connection \
  -H "Authorization: Bearer ***" \
  -H "Content-Type: application/json" \
  -d '{
    "organizationId": "<org-uuid>",
    "messagingChannelId": "<channel-id>",
    "botUserId": "@807jvhju",
    "liffId": "2010854084-v7SPSvSZ",
    "liffChannelId": "<channel-id>",
    "defaultStoreId": null,
    "channelSecret": "<channel-secret>",
    "channelAccessToken": "<channel-access-token>"
  }'
```
3. ตรวจ:
```bash
curl -s http://127.0.0.1:8081/api/line/liff/<org-uuid>/config
# ต้องได้: {"organizationId":"<org-uuid>","liffId":"2010854084-v7SPSvSZ"}
```
4. ถ้า 404 "LINE ordering is not configured" → record ยังไม่เข้า / `isActive` ไม่ true

## Phase 2 — Client: สร้างหน้า LIFF (Vue 3 + Vite)

สร้าง module ใหม่ `client/src/modules/line/` — ModuleRegistry auto-register

**`client/src/modules/line/index.js`:**
```js
export default {
  slug: 'line',
  order: 93,
  routes: [
    {
      path: '/line-liff',
      name: 'line-liff',
      component: () => import('./views/LiffOrdering.vue'),
      meta: { title: 'line.liffTitle' },
    },
  ],
}
```
⚠️ route เป็น `/line-liff` (ไม่ใช่ `/liff/:orgId`) — endpoint LINE Console ผูกไว้ที่ `/line-liff` แล้ว

**`client/src/modules/line/views/LiffOrdering.vue`** — flow หลัก:
1. `orgId` ใช้จาก env `VITE_LIFF_ORG_ID` (single-org deployment) — อยู่ใน `.env.production.example`
2. `onMounted`: `api.get(\`/line/liff/${orgId}/config\`)` → `{ liffId }`
3. `await liff.init({ liffId })`
4. `if (!liff.isLoggedIn()) { liff.login(); return }`
5. `const idToken = liff.getIDToken()`
6. เรียก API โดยส่ง token ใน header:
```js
api.get(`/line/liff/${orgId}/catalog`, {
  headers: { 'x-line-id-token': idToken },
})
api.post(`/line/liff/${orgId}/orders`, { items, notes }, {
  headers: { 'x-line-id-token': idToken },
})
```
7. UI: รายการสินค้าจาก catalog, ปุ่มสั่ง order, list order ของตัวเอง
8. ดู pattern จาก `client/src/modules/billing/`

## Phase 3 — ทดสอบ local

1. `cd client && npm run dev`
2. เปิด `/line-liff` ในเบราว์เซอร์ปกติ → LIFF API จะ error นอก LINE — อย่างน้อยเช็ค config fetch + UI render
3. ทดสอบจริงต้องเปิดใน LINE app (Phase 6)

## Phase 4 — Commit + push

```bash
git add docs/line-liff-integration-checklist.md client/src/modules/line/ .env.production.example
git commit -m "feat(line): add LIFF ordering client module, route /line-liff"
git push origin main
```
⚠️ ห้าม push `.env*` — ใช้ `.env.production.example` เท่านั้น

## Phase 5 — Deploy บน c46

1. SSH: `ssh c46-ts` (= `admin2@100.89.73.34:22`) — **ห้ามใช้ `ssh c46`**
2. **จัดการของค้างก่อน pull**: `git status` — ถ้ามี stash ให้ pop ก่อน (stash@{0}: `Dockerfile.api`, `rate-limit.js`, `system.service.js`)
3. ```bash
   cd /home/admin2/starter-saas
   git pull origin main
   docker compose --env-file .env.production up -d --build api web
   ```
4. Verify:
   - `docker compose --env-file .env.production ps` → ทุกตัว healthy
   - `curl -s -o /dev/null -w "%{http_code}" http://127.0.0.1:8081/dashboard` → 200
   - `curl -s http://127.0.0.1:8081/api/line/liff/<org-uuid>/config` → มี `liffId`
   - tailscale serve `:8444 → 127.0.0.1:8081` ยังอยู่ (ห้าม Funnel)

## Phase 6 — Verify ด้วย LINE จริง

1. เปิด LIFF URL ใน LINE app (bot link / rich menu / QR)
2. login → เห็น catalog
3. สั่ง order → เช็ค order ใน DB + log
4. ตรวจ network tab: header `x-line-id-token` ถูกส่งไหม, response 401/404 อะไร

---

## Pitfalls

- **`x-line-id-token` ต้องเป็น ID token จาก `liff.getIDToken()`** — ไม่ใช่ access token
- **LIFF endpoint ต้อง HTTPS สาธารณะ** — ผ่าน cloudflared tunnel (เช็ค `docs/production-runbook.md`)
- `liffChannelId` = Channel ID (client_id) ผิดตัวเดียว 401 ตลอด
- Secret ต้อง encrypt ด้วย `LINE_CREDENTIAL_ENCRYPTION_KEY` เดียวกับ env ที่รัน
- `verifyLiffRequest` อ่าน `organizationId` จาก `req.params` — อย่าส่งแค่ header
- **ห้ามเปิดพอร์ตสาธารณะ** บน c46 / **ห้ามใช้ `ssh c46`** / **อย่าแตะ rich menu** ตอนนี้
- ห้าม push secret ขึ้น repo — ใช้ admin API ตั้งค่า connection แทน
- webhook ของ OA ยังเป็นของ Hermes bot (`/line/webhook` → 8646) — LIFF ordering ไม่ต้องพึ่ง webhook

## Reference

- Backend: `server/modules/line/` (routes, controller, service, auth)
- Shared service: `shared/erp/line-integration/services/line-liff-auth.service.js`, `line-connection.service.js`
- Model: `shared/erp/line-integration/models/line-connection.model.js` (table `line_connections`)
- Migration: `shared/erp/line-integration/migrations/20260721_000001_line_integration.js`
- Module mount: `server/modules/line/line.module.js` (`mountPath: '/api/line'`)
- Client registry: `client/src/core/ModuleRegistry.js`
- Deploy runbook: `docs/production-runbook.md`