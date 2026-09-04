# คู่มือ Deploy MakeIt (quotation pilot) → Vercel + Supabase

> ขอบเขต: pilot ฟีเจอร์ใบเสนอราคา (Quotation) ให้ผู้ใช้นำร่อง ~10 คน
> Stack ใน repo นี้: Vue 3 + Vite (`client/`), Express (`server/app.js`), Sequelize, Postgres 16 (Supabase)
> เอกสารนี้อ้างอิงไฟล์จริงใน repo ทั้งหมด — ตรวจสอบ path ทุกจุดก่อนแก้ไข

---

## สารบัญ

1. [ภาพรวมสถาปัตยกรรมบน Vercel](#1-ภาพรวมสถาปัตยกรรมบน-vercel)
2. [สร้าง Supabase project + ค่า connection](#2-สร้าง-supabase-project--ค่า-connection)
3. [รัน migration/bootstrap จากเครื่อง local ยิงเข้า Supabase](#3-รัน-migrationbootstrap-จากเครื่อง-local-ยิงเข้า-supabase)
4. [ตัวแปรแวดล้อม (Environment Variables)](#4-ตัวแปรแวดล้อม-environment-variables)
5. [ตั้งค่า Vercel: 2 projects](#5-ตั้งค่า-vercel-2-projects)
6. [Security checklist](#6-security-checklist)
7. [ข้อจำกัดที่ทราบของ pilot](#7-ข้อจำกัดที่ทราบของ-pilot)
8. [ตรวจสอบหลัง deploy](#8-ตรวจสอบหลัง-deploy)

---

## 1. ภาพรวมสถาปัตยกรรมบน Vercel

- **Project A — client (SPA)**: สร้างจาก `client/` (Vite build, output `dist/`) — เสิร์ฟหน้าเว็บ MakeIt
- **Project B — API**: โค้ด Express ที่ repo root → `server/app.js`

> ✅ **พร้อม deploy แล้ว:** `api/index.js` (serverless wrapper ที่ await bootstrap ก่อนจ่าย request) และ `module.exports = app / .ready` ใน `server/app.js` มีใน repo แล้ว พร้อม gate `REALTIME_ENABLED` (ปิด Socket.IO บน serverless ด้วย env) — `vercel.json` ที่ root ก็เตรียม rewrite ให้แล้ว ดู env เพิ่มในขั้น 4.1 และข้อจำกัดในหัวข้อ 7

---

## 2. สร้าง Supabase project + ค่า connection

### 2.1 สร้าง project

1. ไปที่ https://supabase.com → **New project**
2. ตั้งชื่อ เช่น `makeit-pilot`, ตั้งรหัสผ่าน DB (เก็บไว้ใช้ในขั้น 2.2), Region เลือกใกล้ผู้ใช้ (เช่น Singapore)
3. Plan: Free (เพียงพอสำหรับ pilot ~10 users)

### 2.2 Connection ที่ต้องใช้ — แยก 2 แบบ

Supabase ให้ connection string จากหน้า **Project Settings → Database → Connection string**:

| ใช้ทำอะไร | โหมด | Port | จุดสังเกต |
|---|---|---|---|
| **App runtime** (API บน Vercel) | **Transaction pooler** | **6543** | มี pgbouncer, ใช้ `pgbouncer=true` ใน connection string |
| **One-time migration** (รันจาก local) | **Session pooler หรือ Direct** | **5432** | รองรับ session/prepared statement เต็มรูปแบบ |

รูปแบบ host ของ pooler: `aws-0-<region>.pooler.supabase.com`, user จะเป็น `postgres.<project-ref>`

### 2.3 ข้อควรระวัง: Sequelize + pgbouncer (transaction pooler)

- Transaction pooler **ไม่รองรับ session-level feature** เช่น prepared statement แบบตั้งชื่อ, `SET` ค้างต่อ connection
- Sequelize (v6 ใน repo: `server/package.json` → `"sequelize": "^6.37.8"`) ผ่าน driver `pg` (`"pg": "^8.21.0"`) ต้อง **แนบ `?pgbouncer=true` ต่อท้าย connection string** เสมอเมื่อใช้ port 6543
- `server/config/database.js` สร้าง Sequelize instance จาก `DB_HOST/DB_PORT/DB_NAME/DB_USER/DB_PASSWORD` แยกกัน (ไม่ใช่ URL เดียว) — **ใน config นี้ไม่มีช่องทางตั้ง `sslmode`/`ssl` ผ่าน env** (ดู `buildSequelize()` — `dialectOptions` มีแค่สำหรับ mssql) ซึ่ง Supabase ต้องการ TLS
  - 👉 **ทางแก้ที่ไม่ต้องแก้โค้ด:** ใช้ `DB_HOST` = pooler hostname ของ Supabase (`aws-0-<region>.pooler.supabase.com`) — endpoint pooler รองรับ TLS โดยตรง ถ้ายิงแล้วเจอ error เรื่อง SSL (`no pg_hba.conf entry ... no encryption`) ต้องเพิ่ม `dialectOptions: { ssl: { require: true, rejectUnauthorized: false } }` ที่ `server/config/database.js` (เป็นการแก้โค้ด 1 จุด — แจ้งทีมก่อนทำ)
- Pool ของ Sequelize ถูก fix ไว้ในโค้ดที่ `pool: { max: 10, ... }` (`server/config/database.js`) — สำหรับ pilot 10 users บน transaction pooler ถือว่าโอเค แต่ถ้าเจอ connection ล้น ให้ลด `max` ลง

---

## 3. รัน migration/bootstrap จากเครื่อง local ยิงเข้า Supabase

### 3.1 สคริปต์ที่ repo มีอยู่จริง (จาก `server/package.json`)

| Script | คำสั่งจริง | ทำอะไร |
|---|---|---|
| `db:provision` | `node tools/provision.js` | bootstrap ครบชุด (sync schema + migrations + perf indexes; เพิ่ม `--seed` เพื่อ seed ข้อมูลพื้นฐาน) — ดู `server/tools/provision.js` → `server/core/database-bootstrap.js` |
| `migrate` / `migrate:up` | `node tools/migrate.js up` | รัน migration ขึ้น (ไม่ sync schema เต็ม) |
| `migrate:status` | `node tools/migrate.js status` | ดูสถานะ migration |
| `migrate:down` | `node tools/migrate.js down` | rollback migration |
| `seed` / `seed:core` | `node tools/seed.js` / `node tools/seed.js core` | seed ข้อมูล |

> แนะนำสำหรับ pilot: ใช้ **`db:provision --seed`** ครั้งเดียว (มันเรียก `sequelize.sync()` + `migrator.up()` + `applyPerfIndexes()` + seeds ผ่าน `server/core/database-bootstrap.js`) จบใน step เดียว

### 3.2 ขั้นตอนรันจาก local

สร้างไฟล์ `server/.env` (local เท่านั้น — **ห้าม commit**):

```env
DB_DIALECT=postgres
DB_HOST=aws-0-<region>.pooler.supabase.com
DB_PORT=5432
DB_NAME=postgres
DB_USER=postgres.<project-ref>
DB_PASSWORD=<รหัสผ่าน Supabase>
NODE_ENV=development
```

> ใช้ port **5432** (session/direct) สำหรับ migration เพราะ `sequelize.sync()` กับ migration อาจมี session state

จาก repo root:

```bash
npm install
npm --workspace=server install
npm --workspace=server run db:provision -- --seed
# ตรวจสถานะ
npm --workspace=server run migrate:status
```

### 3.3 อย่าลืม: ปิด bootstrap ตอน runtime

`server/config/config.js` มี flag `DB_BOOTSTRAP_ON_START` (default = เปิด → จะ `provisionDatabase()` ทุกครั้งที่ boot ตาม `server/app.js` ฟังก์ชัน `bootstrap()`)
👉 ตอน deploy บน Vercel ตั้ง `DB_BOOTSTRAP_ON_START=false` เสมอ เพื่อไม่ให้ serverless instance แต่ละตัวพยายาม sync/migrate ตอน cold start

---

## 4. ตัวแปรแวดล้อม (Environment Variables)

### 4.1 Project API (Vercel — repo root)

อ้างชื่อจริงจาก `server/config/config.js`:

| Variable | ค่าที่แนะนำ | หมายเหตุ |
|---|---|---|
| `NODE_ENV` | `production` | ทำให้ `resolveSecret()` บังคับมี `JWT_SECRET`/`JWT_REFRESH_SECRET` (fail-fast) |
| `DB_DIALECT` | `postgres` | default เป็น sqlite ถ้าไม่ตั้ง |
| `DB_HOST` | `aws-0-<region>.pooler.supabase.com` | pooler host |
| `DB_PORT` | `6543` | transaction pooler |
| `DB_NAME` | `postgres` | |
| `DB_USER` | `postgres.<project-ref>` | รูปแบบ user ของ pooler |
| `DB_PASSWORD` | (จาก Supabase) | |
| `DB_BOOTSTRAP_ON_START` | `false` | ปิด sync/migrate ตอน boot — migrate เสร็จแล้วจากขั้น 3 |
| `JWT_SECRET` | (สุ่ม ≥32 bytes) | จำเป็นเมื่อ NODE_ENV=production |
| `JWT_REFRESH_SECRET` | (สุ่ม ≥32 bytes, ต่างจาก JWT_SECRET) | จำเป็นเมื่อ NODE_ENV=production |
| `CLIENT_URL` | `https://<client-domain>.vercel.app` | ใช้เป็น CORS origin ใน `server/app.js` (`cors({ origin: config.clientUrl, credentials: true })`) — ต้องเป็น origin เป๊ะ ไม่มี `/` ท้าย |
| `REDIS_ENABLED` | `false` | cache จะ fallback เป็น in-process Map อัตโนมัติ ตาม `server/config/redis.js` |
| `REALTIME_ENABLED` | `false` | ปิด Socket.IO (gate อยู่ใน `server/app.js`, default ON เฉพาะ local) |
| `COOKIE_SECURE` | `true` | force Secure flag บน refresh cookie (default คือ `auto`) |
| `TRUST_PROXY` | `1` | Vercel อยู่หลัง proxy 1 hop → ให้ `req.secure`/X-Forwarded-Proto เชื่อถือได้ |
| `DB_SSL` | `true` | **บังคับ TLS ไป Supabase** — flag นี้เพิ่มใหม่ใน `server/config/config.js` + `database.js` (ไม่ตั้ง = ไม่เข้ารหัส, Supabase จะปฏิเสธ connection จากภายนอก) |
| `APP_NAME` | `MakeIt` | ใช้ใน email/subject (default ในโค้ดก็เป็น MakeIt อยู่แล้ว) |
| `PORT` | `3000` | Vercel จะ inject เองเมื่อรันผ่าน function — ไม่ต้องตั้งถ้าไม่จำเป็น |

> ไม่ต้องตั้ง: `HTTPS_*` (TLS จัดการโดย Vercel), `REDIS_*` (ปิดแล้ว), `LINE_*`, `SMTP_*`, `BILLING_*` (ใช้ default ของ pilot)

### 4.2 Project client (Vercel — rootDirectory = `client/`)

อ้างชื่อจริงจาก `client/.env.example` และ `client/src/config/brand.js` / `client/vite.config.js`:

| Variable | ค่าที่แนะนำ | หมายเหตุ |
|---|---|---|
| `VITE_APP_NAME` | `MakeIt` | ใช้ใน `client/src/config/brand.js` (`import.meta.env.VITE_APP_NAME`) และแทน `%APP_NAME%` ใน `index.html` ผ่าน `client/vite.config.js` |
| `VITE_LIFF_ORG_ID` | (UUID ของ organization ใน DB) | ใช้เฉพาะถ้าเปิดใช้ LINE LIFF ordering — pilot ถ้าไม่ใช้ LINE ให้ข้าม |

> ✅ **API URL ของ client — เรียบร้อยแล้ว:** `client/src/api/index.js` ใช้ `baseURL: '/api'` แบบ **relative path** และ `client/vercel.json` มี rewrite `/api/*` → `https://makeit-api.vercel.app/api/*` พร้อม SPA fallback `/(.*) → /index.html` ในไฟล์เดียวกันแล้ว — ถ้าตั้งชื่อ API project ไม่ใช่ `makeit-api` ให้แก้ destination ใน `client/vercel.json` ให้ตรงก่อน deploy

---

## 5. ตั้งค่า Vercel: 2 projects

### 5.1 Project client

1. Vercel Dashboard → **Add New → Project** → เลือก repo `starter-saas`
2. **Root Directory**: `client`
3. Framework Preset: **Vite** (Build: `npm run build`, Output: `dist` — Vercel detect เองจาก `client/package.json`)
4. ใส่ env vars จากขั้น 4.2 → Deploy

### 5.2 Project API

1. Vercel → **Add New → Project** → repo เดียวกัน แต่ตั้งชื่อ project ใหม่ (เช่น `makeit-api`)
2. **Root Directory**: เว้นว่าง (repo root) — build/start จาก `server/` (workspace)
3. ✅ entrypoint serverless พร้อมแล้ว — `api/index.js` + `vercel.json` (root) มีใน repo (ดูหัวข้อ 1) ใส่ env ตามขั้น 4.1 แล้ว Deploy ได้เลย
4. ใส่ env vars จากขั้น 4.1 → Deploy

### 5.3 เชื่อมสองฝั่ง

1. หลัง deploy API สำเร็จ ได้ domain เช่น `https://makeit-api.vercel.app`
2. ✅ rewrite `/api/*` มีใน `client/vercel.json` แล้ว (ชี้ `makeit-api.vercel.app`) — ตรวจว่าชื่อ project ตรงกัน แล้ว push เพื่อ redeploy client
3. อัปเดต `CLIENT_URL` ของ API ให้เป็น domain จริงของ client (origin เป๊ะ ๆ)
4. Redeploy ทั้งสอง project

---

## 6. Security checklist

ตาม `AGENTS.md` ของ repo (ห้ามมี secrets ใน git, แยก context สินค้า/โค้ด):

- [ ] **ไม่มี secret ใน git** — `JWT_SECRET`, `JWT_REFRESH_SECRET`, `DB_PASSWORD` ใส่ผ่าน Vercel env vars / local `.env` เท่านั้น (`.env.example` เป็นตัวอย่างเท่านั้น ไม่ใส่ค่าจริง)
- [ ] **`CLIENT_URL` = origin เป๊ะ** — รูปแบบ `https://<domain>` ไม่มี `/` ท้าย, ไม่มี wildcard, ตรงกับ domain ของ client project บน Vercel (CORS ใน `server/app.js` ใช้ค่านี้ตรง ๆ + `credentials: true`)
- [ ] **`COOKIE_SECURE=true`** — refresh cookie ใช้ `Secure` flag บน HTTPS เสมอ
- [ ] **`TRUST_PROXY=1`** — เพื่อให้ Express อ่าน `X-Forwarded-Proto` จาก Vercel ถูกต้อง (เชื่อได้ว่า request เป็น HTTPS)
- [ ] **Secrets สุ่มใหม่** ไม่ใช้ค่าตัวอย่างใน `.env.example` — สุ่มด้วย `node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"`
- [ ] **Supabase RLS ไม่เกี่ยว** — app ต่อผ่าน user `postgres` โดยตรง (ORM) ไม่ใช่ anon key ของ Supabase → ไม่เปิดเผย Supabase anon/service key ใน client เด็ดขาด
- [ ] **Local `.env` อยู่ใน `.gitignore`** ก่อนรัน migration (เช็คว่า `git status` ไม่เห็น `.env`)

---

## 7. ข้อจำกัดที่ทราบของ pilot

| ข้อจำกัด | เหตุผล |
|---|---|
| **ไม่มี realtime** | Socket.IO ปิดผ่าน `REALTIME_ENABLED=false` (gate อยู่ที่ `server/app.js`) — บน Vercel serverless ไม่รองรับ WebSocket ถาวรอยู่แล้ว |
| **ไม่มี Redis / rate-limit แบบ shared** | `REDIS_ENABLED=false` → `server/config/redis.js` ใช้ in-process Map; rate limiter ต่อ instance ของ serverless function ไม่รวมกันทั้ง deployment — พอสำหรับ pilot 10 คน |
| **ไม่มี logo upload** | การอัปโหลดไฟล์ลง disk (`uploads/`) ทำงานบน filesystem ชั่วคราวของ serverless ไม่ได้ — อยู่นอก scope ของ pilot |
| **Supabase Free tier pause** | Supabase จะ pause project อัตโนมัติเมื่อไม่มี activity 7 วัน → pilot ที่ใช้งานเบา ๆ ต้องแอคทีฟทุกสัปดาห์ หรืออัปเกรด plan ก่อนใช้จริง |
| **ไม่มี realtime** | Socket.IO ถูกปิดบน serverless ด้วย `REALTIME_ENABLED=false` (ไม่มี WebSocket ถาวรบน Vercel Functions) — ข้อมูลอัปเดตผ่าน refresh ปกติ |
| **Cold start + DB connect ต่อ request** | ทุก serverless instance จะเปิด connection ใหม่เข้า pgbouncer (pool max 10 ต่อ instance ตาม `server/config/database.js`) — ควรลด `max` ลงเหลือ ~3–5 ถ้า scale ขึ้น |

---

## 8. ตรวจสอบหลัง deploy

1. **API health**: เปิด `https://<api-domain>/api/health` → ต้องได้ `{"status":"ok","env":"production",...}` (endpoint อยู่ที่ `server/app.js`)
2. **Client โหลดได้** และชื่อแบรนด์แสดงเป็น "MakeIt" (จาก `VITE_APP_NAME`)
3. **Login ได้** — ตรวจว่า refresh cookie มี `Secure` flag (DevTools → Application → Cookies)
4. **สร้าง Quotation ได้** จริงใน DB (ดูตาราง quotation ใน Supabase Table Editor)
5. **CORS ไม่ error** — ถ้า console มี CORS error แสดงว่า `CLIENT_URL` ไม่ตรง origin จริง
6. `npm --workspace=server run migrate:status` จาก local (ใช้ `.env` ชุด Supabase) เพื่อยืนยัน migration ครบ

---

*อ้างอิงไฟล์ใน repo: `server/app.js`, `server/config/config.js`, `server/config/database.js`, `server/config/redis.js`, `server/core/database-bootstrap.js`, `server/core/realtime.js`, `server/tools/provision.js`, `server/tools/migrate.js`, `server/package.json`, `server/models/index.js`, `client/.env.example`, `client/vite.config.js`, `client/vercel.json`, `client/src/api/index.js`, `client/src/config/brand.js`, `.env.example`, `AGENTS.md`*
