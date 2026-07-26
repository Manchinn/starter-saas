# Monitoring Setup

Slice 1 — Core monitoring, alerting, and log shipping for Starter SaaS.

## Architecture

```
Uptime Kuma → webhook → alert-relay → LINE Notify (health-down alerts)
     │
     └── monitors: api:3000/api/health (every 60s)

API → winston-loki → Loki → Grafana (log aggregation + dashboards)
```

## Prerequisites

- **LINE Notify token**: Generate at https://notify-bot.line.me/my/ → "Generate token"
  (sticker pack + "Send 1-on-1 message to LINE Notify")
- The token goes in `.env.production`:
  ```
  LINE_NOTIFY_TOKEN=your-token-here
  ```

## Deploy

### 1. Core stack (always on)

```bash
# Rebuild alert-relay with LINE Notify token
docker compose build alert-relay

# Start all services including monitoring
docker compose up -d
```

Verify:
```bash
# Uptime Kuma dashboard
curl http://127.0.0.1:3001

# Alert relay health (just confirms it's listening)
docker compose logs alert-relay
# → [alert-relay] Listening on :3003
```

### 2. Log aggregation (opt-in)

```bash
# Start Loki + Grafana
docker compose --profile monitoring up -d

# Enable Loki transport in API
# Add LOKI_ENABLED=true to .env.production and restart api:
docker compose up -d api
```

Verify:
```bash
# Grafana dashboard
open http://127.0.0.1:3002
# → login: admin / admin (change password after first login)
# → Explore → select "Loki" datasource → query: {service="saas"}
```

## Configure Uptime Kuma (one-time manual setup)

Open `http://127.0.0.1:3001` in your browser. On first visit, create an admin account.

### Add a health monitor

1. Click **Add New Monitor**
2. Monitor Type: **HTTP(s)**
3. Friendly Name: `SaaS API Health`
4. URL: `http://api:3000/api/health`
5. Heartbeat Interval: **60** seconds
6. Retries: **2** (alerts after 2 consecutive failures)
7. Click **Save**

### Add LINE Notify notification

1. Go to **Settings → Notifications** (left sidebar)
2. Click **Setup Notification**
3. Notification Type: **Webhook**
4. Friendly Name: `LINE Notify`
5. URL: `http://alert-relay:3003/notify`
6. Click **Save**

### Link notification to monitor

1. Edit the `SaaS API Health` monitor
2. Under **Notifications**, check **LINE Notify**
3. Click **Save**

## Test alert

```bash
# Kill the API container
docker compose stop api

# Wait up to 2 minutes.
# You should receive a LINE message:
#   🔴 [DOWN] SaaS API Health
#   URL: http://api:3000/api/health
#   Time: 2026-07-26T12:34:56.789Z

docker compose start api
# After 1-2 checks → ✅ [UP] recovery notification
```

## Verify log shipping

1. Open Grafana at `http://127.0.0.1:3002`
2. Go to **Explore** → datasource: **Loki**
3. Query: `{service="saas"} |= "error"` — shows error logs
4. Query: `{service="saas", env="production"}` — all production logs

## Export Grafana dashboards

The Loki datasource is auto-provisioned. To save dashboards for reuse:

1. Create a dashboard in Grafana UI
2. Share → Export → "Export for sharing externally"
3. Save JSON to `config/grafana-dashboards/`
4. Mount in compose to auto-load on restart

## Troubleshooting

| Symptom | Check |
|---------|-------|
| No LINE alert on downtime | `docker compose logs alert-relay` — verify LINE_NOTIFY_TOKEN is set and the relay received the webhook from Uptime Kuma |
| "Connection error" in API logs | Loki container is not running — `docker compose --profile monitoring up -d loki` |
| No logs in Grafana | API doesn't have `LOKI_ENABLED=true` — check `docker compose exec api env \| grep LOKI` |
| Uptime Kuma port not accessible | Confirm the port forward: `docker compose ps uptime-kuma` should show `127.0.0.1:3001→3001` |
