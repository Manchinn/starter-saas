# PostgreSQL Docker Deployment

> **Production operators:** สำหรับการรันระบบวันต่อวัน (startup, shutdown, health check, troubleshooting) ดู [`docs/production-runbook.md`](production-runbook.md)

This deployment runs one PostgreSQL-backed API replica and a static web container. It publishes only the web container to `127.0.0.1:8080` by default. For public access, use either **Cloudflare Tunnel** (no open ports, free TLS, works without a VPS) or a traditional reverse proxy (Nginx/Caddy with Let's Encrypt on a VPS). Both terminate TLS externally and forward requests to the loopback endpoint.

## Scope and constraints

- The active SQLite source is `data/database.sqlite`. Do not use `server/data/database.sqlite`; it is not selected by the application configuration.
- `uploads/` contains organization logos and ERP attachments. Back up and transfer it with the database.
- PostgreSQL and the API are private Docker-network services. Do not publish port `5432` or `3000`.
- Configuration is immutable. Production values come from a host-protected `.env.production` file or Docker secrets, not `server/.env` and not the installer/settings configuration screens.
- This stack is one API replica by default. Redis is enabled for shared cache, rate limiting, and Socket.IO scaling. Add a second replica with `--profile scale`.

## Host configuration

Create `.env.production` next to `compose.yaml` from `.env.production.example`. Keep it outside Git and restrict access to the deployment operator.

Set a unique password for PostgreSQL and independent long random values for `JWT_SECRET` and `JWT_REFRESH_SECRET`. For local-only Docker access, set `CLIENT_URL=http://127.0.0.1:8080`, `COOKIE_SECURE=false`, and `TRUST_PROXY=0`.

**Cloudflare Tunnel (recommended):** Set `CLIENT_URL=https://app.<your-domain>`, `COOKIE_SECURE=auto`, and `TRUST_PROXY=1`. The `auto` mode mirrors the `X-Forwarded-Proto` header that cloudflared injects. See the Cloudflare Tunnel section below.

**Traditional reverse proxy (Nginx/Caddy on VPS):** Use the exact public HTTPS origin for `CLIENT_URL`, set `COOKIE_SECURE=true`, configure `TRUST_PROXY` for the trusted hop count, and forward `Host`, `X-Forwarded-For`, and `X-Forwarded-Proto`.

For Nginx, point the TLS virtual host at `http://127.0.0.1:8080`. For a load balancer or ingress, set `WEB_PORT` to an unused loopback port and route traffic to it. Do not enable the Node HTTPS listener; TLS ends at the external proxy.

## Cloudflare Tunnel (public access without a VPS)

Cloudflare Tunnel (`cloudflared`) creates an outbound-only QUIC tunnel from your machine to Cloudflare's edge. No firewall ports need to be opened, and TLS is auto-terminated at Cloudflare with a free certificate. This is the simplest way to deploy publicly when you don't have (or want) a VPS.

### How it works

```
Browser → https://app.cslogbook.me → Cloudflare Edge (TLS, WAF)
       → QUIC tunnel → cloudflared on host → http://127.0.0.1:8080
       → nginx (Docker) → SPA / API
```

- **No open ports**: cloudflared initiates all connections outbound.
- **Free TLS**: Cloudflare issues and renews certificates automatically.
- **WAF + DDoS protection**: Cloudflare's edge filters traffic before it reaches your machine.
- **HSTS**: Enabled by Cloudflare with a single toggle; no nginx config needed.

### Prerequisites

- A domain on Cloudflare (DNS must be managed by Cloudflare).
- `cloudflared` installed on the host machine: `winget install Cloudflare.cloudflared` (Windows) or `brew install cloudflared` (macOS).

### Setup

**1. Authenticate and create the tunnel:**

```bash
cloudflared tunnel login
cloudflared tunnel create starter-saas
```

This creates a tunnel ID and a credentials JSON file at `~/.cloudflared/<tunnel-id>.json`.

**2. Route DNS to the tunnel:**

```bash
cloudflared tunnel route dns starter-saas app.cslogbook.me
```

This creates a `CNAME app.cslogbook.me → <tunnel-id>.cfargotunnel.com`.

**3. Create `~/.cloudflared/config.yml`:**

Copy the template from `config/cloudflared-config.example.yml` and replace `<tunnel-id>` with the UUID from step 1. The template includes ingress rules for both `app.cslogbook.me` and `monitor.cslogbook.me`.

**4. Update `.env.production`:**

```
CLIENT_URL=https://app.cslogbook.me
COOKIE_SECURE=auto
TRUST_PROXY=1
```

`COOKIE_SECURE=auto` mirrors the `X-Forwarded-Proto: https` header that cloudflared injects, so cookies get the `Secure` flag without hardcoding.

**5. Run the tunnel:**

```bash
cloudflared tunnel run starter-saas
```

Verify: `curl https://app.cslogbook.me/api/health` → `{"status":"ok"}`.

### Run as a Windows Service (24/7 persistence)

On Windows, install cloudflared as a service so the tunnel starts on boot and survives logouts:

```bash
cloudflared service install
```

This creates a Windows Service that runs the tunnel from `C:\Users\<user>\.cloudflared\config.yml`. Manage it with:

```bash
# Check status
sc query cloudflared

# Start / stop
sc start cloudflared
sc stop cloudflared
```

### Nginx timeout notes

The Docker nginx reverse proxy sits behind cloudflared and must have generous timeouts for AI agent tool loops and file uploads. The bundled `nginx.conf` already configures:

| Location     | `proxy_read_timeout` | `proxy_send_timeout` | Reason                     |
|-------------|---------------------|---------------------|----------------------------|
| `/api/`     | 660s                | 660s                | AI agent tool loop (5 rounds × 120s) |
| `/uploads/` | 300s                | 300s                | Large file uploads/downloads |
| `/socket.io/` | 3600s              | 3600s               | Long-lived WebSocket connections |

Cloudflare's own timeout is 100s for HTTP. The 660s API timeout works because the agent stream keeps the connection active — Cloudflare resets its idle timer on each byte. If you encounter 524 errors from Cloudflare, consider enabling [Cloudflare's proxy read timeout increase (Enterprise)](https://developers.cloudflare.com/support/network/using-cloudflare-with-your- origin-server/#timeouts) or implementing keepalive pings in the AI agent stream.

### Moving to a VPS later

The Cloudflare Tunnel setup is fully portable. To move to a VPS:

1. Copy the Docker Compose project and data volumes to the VPS.
2. Install cloudflared on the VPS.
3. Copy `~/.cloudflared/` (config + credentials) to the VPS.
4. Start the tunnel — DNS updates are instant (CNAME record unchanged).

The stack itself never knows whether cloudflared runs locally or on a VPS.

## Fresh PostgreSQL environment

Build the images and start PostgreSQL only:

```bash
docker compose --env-file .env.production build
docker compose --env-file .env.production up -d db
```

Run the one-shot schema provisioner:

```bash
docker compose --env-file .env.production --profile provision run --rm db-provision
```

`db-provision` prepares the schema, applies migrations and performance indexes, then exits. It does not add demo data. Once a new environment is provisioned, start the API and web services:

```bash
docker compose --env-file .env.production up -d api web
```

Check state and logs:

```bash
docker compose ps
docker compose logs --follow db-provision api
docker compose exec web wget -q -O - http://localhost/api/health
```

The expected health response has `status: "ok"`.

## Rehearse a SQLite transfer

Do not perform the first transfer against live data. Create an isolated staging directory containing a copy of `data/database.sqlite` and a copy of `uploads/`, then provision an empty PostgreSQL volume.

Run the transfer profile using the migration source mounted read-only into the one-shot container:

```bash
SQLITE_SOURCE_DIR=/absolute/path/to/staging-copy \
  docker compose --env-file .env.production --profile transfer run --rm db-transfer
```

`SQLITE_SOURCE_DIR` must contain the copied `database.sqlite`. The transfer refuses a non-empty target, a target missing source tables, an unresolved foreign-key dependency cycle, or source columns missing from the target schema.

Validate before starting the API:

```bash
SQLITE_SOURCE_DIR=/absolute/path/to/staging-copy \
  docker compose --env-file .env.production --profile transfer run --rm db-validate
```

The validator compares each table's row count and primary-key values and verifies that `SchemaMigrations` is populated and PostgreSQL has no unvalidated foreign keys. Run application smoke tests through the proxy after validation: login, SPA route refresh, logo retrieval, attachment upload/download, a representative ERP write/post action, audit search, Socket.IO connection, and `/api/health`.

## Production cutover

1. Schedule a write freeze and stop the existing API process.
2. Let the audit buffer flush, then create immutable backups of `data/database.sqlite` and `uploads/` together. Store the backup outside the host.
3. Run the final transfer to a freshly provisioned PostgreSQL database and run the validator. Do not start the PostgreSQL API before validation succeeds.
4. Restore the corresponding `uploads/` snapshot into the empty Docker `uploads_data` volume and validate all attachment/logo references:

   ```bash
   UPLOADS_SOURCE_DIR=/absolute/path/to/final-snapshot \
     docker compose --env-file .env.production --profile uploads run --rm uploads-restore
   docker compose --env-file .env.production --profile uploads run --rm uploads-validate
   ```

   `UPLOADS_SOURCE_DIR` must contain the final snapshot's `uploads/` directory. The restore job refuses a populated volume, copies files with a source-to-target SHA-256 inventory comparison, and assigns ownership to the API container user. The validation job verifies every attachment record and organization logo path resolves to a file in the volume.
5. Start one API instance and run the smoke tests through the loopback URL or, after it is configured, the external proxy.
6. Monitor API logs and health for at least 15 minutes before lifting the write freeze.

Before PostgreSQL accepts writes, rollback is stopping the Docker stack and restarting the preserved SQLite deployment with its original configuration. After PostgreSQL accepts new writes, do not switch back to SQLite blindly: it would discard PostgreSQL-only writes. Restore PostgreSQL or reconcile data instead.

## Backup and recovery

Back up PostgreSQL and uploads together every day. A database-only backup cannot restore attachment metadata and files consistently.

Example database backup:

```bash
docker compose exec -T db pg_dump -U "$POSTGRES_USER" "$POSTGRES_DB" | gzip > "postgres-$(date +%F).sql.gz"
```

Archive the `uploads_data` volume in the same backup run, retain restore instructions, and periodically test a recovery in an isolated environment.

## Scaling follow-up

Do not increase API replicas yet. First add a Socket.IO Redis adapter, shared cache/rate-limit stores, WebSocket sticky routing or a WebSocket-only policy, external object storage for uploads, and PostgreSQL TLS configuration if the database leaves the private Docker network.
