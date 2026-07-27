# Production Runbook

คู่มือการรัน production stack (`starter-saas`) บน Windows แบบ 24/7 ครอบคลุม Docker Compose + Cloudflare Tunnel + monitoring ตั้งแต่เริ่มต้นระบบจนถึง troubleshooting

**ก่อนเริ่ม:** อ่าน `docs/postgresql-docker-deployment.md` สำหรับการ setup ครั้งแรก (provision PostgreSQL, โอนข้อมูลจาก SQLite, ตั้งค่า Cloudflare Tunnel)

---

## สารบัญ

- [Prerequisites](#prerequisites)
- [Architecture overview](#architecture-overview)
- [Startup sequence](#startup-sequence)
- [Shutdown sequence](#shutdown-sequence)
- [Health verification](#health-verification)
- [Daily operations](#daily-operations)
- [Troubleshooting](#troubleshooting)
- [Recovery scenarios](#recovery-scenarios)

---

## Prerequisites

### 1. Docker Desktop — auto-start on Windows boot

ต้องให้ Docker Engine เริ่มก่อน cloudflared ไม่งั้น tunnel จะชี้ไปที่ `127.0.0.1:8080` ที่ยังไม่มีอะไรฟัง → Cloudflare 502

```
Docker Desktop → Settings (⚙️) → General
  ✅ Start Docker Desktop when you sign in to your computer
```

ตรวจสอบว่า Docker เริ่มตอน boot:

```powershell
# หลังรีบูต
docker ps
# ควรเห็น containers วิ่งอยู่
```

### 2. cloudflared — ติดตั้งและลงทะเบียนเป็น Windows Service

```bash
# ติดตั้ง (ถ้ายังไม่มี)
winget install Cloudflare.cloudflared

# สร้าง tunnel (ครั้งแรก)
cloudflared tunnel login
cloudflared tunnel create starter-saas
cloudflared tunnel route dns starter-saas app.cslogbook.me
cloudflared tunnel route dns starter-saas monitor.cslogbook.me
```

คัดลอก config จาก `config/cloudflared-config.example.yml` ไปที่ `~/.cloudflared/config.yml` แก้ `<tunnel-id>` เป็นค่า tunnel ID จริง

ลงทะเบียนเป็น Windows Service (start อัตโนมัติตอน boot):

```bash
cloudflared service install
```

จัดการ service:

```bash
sc query cloudflared    # เช็คสถานะ
sc start cloudflared    # เริ่ม
sc stop cloudflared     # หยุด
```

### 3. `.env.production`

ต้องมีไฟล์ `.env.production` ใน root ของ repo (gitignored แล้ว — `git status` ต้องไม่เห็น) สร้างจาก `.env.production.example`:

```bash
cp .env.production.example .env.production
# แก้ไขค่าใน .env.production:
#   - POSTGRES_PASSWORD (ห้ามใช้ค่า default)
#   - JWT_SECRET, JWT_REFRESH_SECRET (random ยาว ๆ)
#   - CLIENT_URL=https://app.cslogbook.me
#   - COOKIE_SECURE=auto
#   - TRUST_PROXY=1
```

---

## Architecture overview

```
                          Docker Compose (internal network)
                          ┌──────────────────────────────────┐
                          │  db (PostgreSQL 16, :5432)       │
                          │  redis (Redis 7, :6379)          │
                          │  api (Express, :3000)            │
                          │  web (Nginx, 127.0.0.1:8080)     │
                          │  alert-relay (:3003)             │
                          │  uptime-kuma (127.0.0.1:3001)    │
                          │  [loki + grafana — opt-in]       │
                          └──────────────────────────────────┘
                                       │
                                127.0.0.1:8080
                                       │
                              ┌────────┴────────┐
                              │   cloudflared   │  ← Windows Service
                              │   (QUIC tunnel) │
                              └────────┬────────┘
                                       │
                              Cloudflare Edge
                              (TLS, WAF, DDoS)
                                       │
                         ┌─────────────┴─────────────┐
                         │                           │
                 app.cslogbook.me          monitor.cslogbook.me
```

**กฎเหล็ก:**
- PostgreSQL (`5432`) และ API (`3000`) **ห้าม** publish ออกจาก Docker network — `web` เท่านั้นที่ bind `127.0.0.1:8080`
- cloudflared เป็น outbound-only — ไม่ต้องเปิด port ที่ firewall
- TLS จบที่ Cloudflare — Nginx ใน Docker รับแต่ HTTP

---

## Startup sequence

> **สำคัญ: Docker ต้องพร้อมก่อน cloudflared**

### Step 1: Start Docker stack

```bash
cd C:\Users\chinn\web-projects\starter-saas
docker compose --env-file .env.production up -d
```

รอให้ทุก service healthy:

```bash
docker compose ps
```

Expected output — ทุก container สถานะ `healthy` หรือ `running` (ยกเว้น one-shot jobs):

```
NAME                   STATUS
starter-saas-db-1      healthy
starter-saas-redis-1   healthy
starter-saas-api-1     healthy
starter-saas-web-1     healthy
starter-saas-alert-relay-1  running
starter-saas-uptime-kuma-1  running
```

> ถ้า `api` ยัง `health: starting` — รออีก 20-30 วินาที (db bootstrap + migration อาจใช้เวลา)

### Step 2: Verify internal health

```bash
curl http://127.0.0.1:8080/api/health
# → {"status":"ok"}
```

ถ้าไม่ตอบ `ok` → ดู [Troubleshooting](#troubleshooting)

### Step 3: Start Cloudflare Tunnel

```bash
sc start cloudflared
```

ตรวจสอบว่า tunnel ขึ้น:

```bash
sc query cloudflared
# STATE: 4 RUNNING
```

### Step 4: Verify external health

```bash
curl https://app.cslogbook.me/api/health
# → {"status":"ok"}
```

ถ้า Cloudflare 502 → tunnel อาจจะขึ้นก่อน Docker → `sc stop cloudflared` แล้ว `sc start cloudflared` ใหม่

### All-in-one startup script (PowerShell)

```powershell
# start-prod.ps1 — รันจาก repo root
Set-Location C:\Users\chinn\web-projects\starter-saas

Write-Host "[1/4] Starting Docker stack..." -ForegroundColor Cyan
docker compose --env-file .env.production up -d

Write-Host "[2/4] Waiting for API healthy..." -ForegroundColor Cyan
do {
  Start-Sleep -Seconds 5
  $health = try { (Invoke-WebRequest -Uri http://127.0.0.1:8080/api/health -UseBasicParsing).Content } catch { $null }
} while ($health -notmatch '"status":"ok"')
Write-Host "  API healthy" -ForegroundColor Green

Write-Host "[3/4] Starting Cloudflare Tunnel..." -ForegroundColor Cyan
sc start cloudflared | Out-Null
Start-Sleep -Seconds 3

Write-Host "[4/4] Verifying external health..." -ForegroundColor Cyan
$ext = try { (Invoke-WebRequest -Uri https://app.cslogbook.me/api/health -UseBasicParsing).Content } catch { $null }
if ($ext -match '"status":"ok"') {
  Write-Host "  External healthy — production is live" -ForegroundColor Green
} else {
  Write-Host "  WARNING: External check failed. Tunnel may need restart." -ForegroundColor Yellow
  Write-Host "  Run: sc stop cloudflared; sc start cloudflared" -ForegroundColor Yellow
}
```

---

## Shutdown sequence

> **สำคัญ: หยุด tunnel ก่อน Docker** — กลับด้านกับ startup

### Step 1: Stop Cloudflare Tunnel

```bash
sc stop cloudflared
```

### Step 2: Stop Docker stack

```bash
docker compose down
```

### All-in-one shutdown script (PowerShell)

```powershell
# stop-prod.ps1
Write-Host "[1/2] Stopping Cloudflare Tunnel..." -ForegroundColor Cyan
sc stop cloudflared
Start-Sleep -Seconds 2

Write-Host "[2/2] Stopping Docker stack..." -ForegroundColor Cyan
Set-Location C:\Users\chinn\web-projects\starter-saas
docker compose down
Write-Host "Production stack is down" -ForegroundColor Green
```

---

## Health verification

### Quick check (ทุกชั้น)

```bash
# 1. Docker containers
docker compose ps

# 2. Internal health
curl http://127.0.0.1:8080/api/health

# 3. Tunnel status
sc query cloudflared

# 4. External health
curl https://app.cslogbook.me/api/health
```

### health-check script (PowerShell)

```powershell
# health-check.ps1
$ok = 0; $fail = 0

Write-Host "=== Production Health Check ===" -ForegroundColor Cyan

# Docker containers
$containers = docker compose ps --format json 2>$null | ConvertFrom-Json
if ($containers) {
  $unhealthy = $containers | Where-Object { $_.Health -eq 'unhealthy' -or ($_.State -ne 'running' -and $_.State -notmatch 'exited') }
  if ($unhealthy) { Write-Host " FAIL Docker: unhealthy containers found" -ForegroundColor Red; $fail++ }
  else { Write-Host " PASS Docker: all containers healthy" -ForegroundColor Green; $ok++ }
} else { Write-Host " FAIL Docker: no containers running" -ForegroundColor Red; $fail++ }

# Internal API
$internal = try { (Invoke-WebRequest -Uri http://127.0.0.1:8080/api/health -UseBasicParsing -TimeoutSec 10).Content } catch { $null }
if ($internal -match '"status":"ok"') { Write-Host " PASS Internal API" -ForegroundColor Green; $ok++ }
else { Write-Host " FAIL Internal API" -ForegroundColor Red; $fail++ }

# cloudflared service
$tunnel = sc query cloudflared 2>$null
if ($tunnel -match 'RUNNING') { Write-Host " PASS Cloudflare Tunnel" -ForegroundColor Green; $ok++ }
else { Write-Host " FAIL Cloudflare Tunnel" -ForegroundColor Red; $fail++ }

# External API
$external = try { (Invoke-WebRequest -Uri https://app.cslogbook.me/api/health -UseBasicParsing -TimeoutSec 15).Content } catch { $null }
if ($external -match '"status":"ok"') { Write-Host " PASS External API" -ForegroundColor Green; $ok++ }
else { Write-Host " FAIL External API" -ForegroundColor Red; $fail++ }

Write-Host "`nResult: $ok passed, $fail failed" -ForegroundColor $(if ($fail -eq 0) { 'Green' } else { 'Red' })
```

---

## Daily operations

### ดู logs

```bash
# ทุก service
docker compose logs --tail=50

# เฉพาะ API
docker compose logs --tail=100 -f api

# เฉพาะ errors
docker compose logs api | grep -i error

# cloudflared
cloudflared tunnel info starter-saas
```

### Restart เฉพาะ service

```bash
# API อย่างเดียว (db กับ web ไม่กระทบ)
docker compose restart api

# หลัง restart api — nginx อาจ cache IP เก่า ต้อง restart web ด้วย
docker compose restart web

# tunnel
sc stop cloudflared
sc start cloudflared
```

### ดู resource usage

```bash
docker stats --no-stream
```

### Backup (manual — จนกว่า issue #5 จะทำ automation)

```bash
# PostgreSQL dump
docker compose exec -T db pg_dump -U "$POSTGRES_USER" "$POSTGRES_DB" | gzip > "backup-$(date +%F).sql.gz"

# Uploads (ต้อง backup พร้อม database)
tar -czf "uploads-$(date +%F).tar.gz" -C /path/to/backup uploads/
```

เก็บ backup ไว้นอกเครื่อง (cloud storage, external drive)

---

## Troubleshooting

### Cloudflare 502 Bad Gateway

**สาเหตุที่เป็นไปได้ (เรียงตามความถี่):**

| สาเหตุ | วิธีเช็ค | วิธีแก้ |
|--------|---------|--------|
| tunnel ขึ้นก่อน Docker | `curl http://127.0.0.1:8080/api/health` ได้ `ok` → tunnel แค่เริ่มผิดจังหวะ | `sc stop cloudflared && sc start cloudflared` |
| Docker stack ไม่ได้รัน | `docker compose ps` ไม่มี containers | `docker compose up -d` |
| `web` container ล้ม | `docker compose ps web` สถานะ `unhealthy` หรือ `restarting` | `docker compose logs web` ดูสาเหตุ |
| `api` container ล้ม | `docker compose ps api` — ไม่ healthy | `docker compose logs api` |
| `config.yml` เพี้ยน | `cloudflared tunnel info starter-saas` — tunnel status `inactive` | เช็ค `~/.cloudflared/config.yml` เทียบกับ `config/cloudflared-config.example.yml` |
| cloudflared service หยุด | `sc query cloudflared` — STATE: STOPPED | `sc start cloudflared` |

### Cloudflare 504 Gateway Timeout

Cloudflare timeout 100 วินาที ถ้า API ใช้เวลานาน (เช่น AI agent tool loop):

- `nginx.conf` ตั้ง `proxy_read_timeout` ไว้สูงแล้ว (660s สำหรับ `/api/`) — stream ที่ active อยู่จะไม่โดน timeout
- ถ้ายังเจอ 504 → API อาจค้างโดยไม่ส่ง response เลย → `docker compose logs api` หา root cause

### API health check ล้ม แต่ containers ขึ้นหมด

```bash
# เช็ค API logs
docker compose logs --tail=30 api

# เช็คว่า db connect ได้
docker compose exec api node -e "
  const { buildSequelize } = require('./server/config/database');
  const s = buildSequelize(); s.authenticate().then(() => { console.log('DB OK'); s.close(); }).catch(e => { console.error(e); s.close(); });
"
```

### Docker ไม่ start ตอน Windows boot

1. เปิด Docker Desktop → Settings → General → ✅ "Start Docker Desktop when you sign in"
2. ถ้า Docker Desktop crash ตอน start → `%APPDATA%\Docker\log.txt` ดูสาเหตุ
3. Workaround: ตั้ง Task Scheduler ให้รัน `docker compose up -d` หลัง login

### SSL / certificate error ที่ client

- Cloudflare จัดการ TLS ให้อัตโนมัติ — client ต้องเห็น certificate ของ Cloudflare ไม่ใช่ self-signed
- ถ้า curl ได้ `SSL certificate problem` → แสดงว่า DNS ยังไม่ชี้ไป Cloudflare หรือ tunnel ยังไม่ up

### Tunnel config กับของจริงไม่ตรงกัน

- `config/cloudflared-config.example.yml` คือ template — config จริงที่ใช้อยู่อยู่ที่ `~/.cloudflared/config.yml`
- ถ้าแก้ไข template ใน repo แล้ว → อย่าลืมอัปเดต `~/.cloudflared/config.yml` บนเครื่องด้วย
- หลังแก้ config → `sc stop cloudflared && sc start cloudflared`

---

## Recovery scenarios

### เครื่องรีบูตไม่ตั้งใจ (ไฟดับ, Windows Update)

สิ่งที่ควรเกิดขึ้นอัตโนมัติ:
1. Docker Desktop auto-starts → `restart: unless-stopped` ดึง containers กลับมา
2. cloudflared Windows Service auto-starts

สิ่งที่อาจพัง:
- cloudflared ขึ้นก่อน Docker → 502 → `sc stop cloudflared && sc start cloudflared`
- Docker Desktop ใช้เวลา start นาน → tunnel ขึ้นก่อน → เหมือนข้างบน

**After reboot checklist:**
```bash
docker compose ps                    # ทุก container healthy?
curl http://127.0.0.1:8080/api/health  # internal ok?
sc query cloudflared                 # tunnel running?
curl https://app.cslogbook.me/api/health  # external ok?
```

### ข้อมูล PostgreSQL เสีย

1. หยุด API: `docker compose stop api`
2. Restore จาก backup ล่าสุด: `gunzip backup-YYYY-MM-DD.sql.gz | docker compose exec -T db psql -U "$POSTGRES_USER" "$POSTGRES_DB"`
3. Restore uploads (ต้องตรง version กับ database)
4. `docker compose start api`

### Docker Compose project reset (เริ่มจากศูนย์ — ข้อมูลหาย)

**ทำเฉพาะตอน testing/rehearsal — ห้ามทำบน production โดยไม่มี backup:**

```bash
docker compose down -v           # ลบ volumes ด้วย
docker compose up -d db          # สร้าง DB เปล่า
docker compose --profile provision run --rm db-provision  # สร้าง schema
docker compose up -d             # เริ่มทั้งหมด
```
