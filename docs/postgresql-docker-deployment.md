# PostgreSQL Docker Deployment

This deployment runs one PostgreSQL-backed API replica and a static web container. It publishes only the web container to `127.0.0.1:8080` by default. An external reverse proxy or ingress can terminate TLS and forward requests to that loopback endpoint when public access is needed.

## Scope and constraints

- The active SQLite source is `data/database.sqlite`. Do not use `server/data/database.sqlite`; it is not selected by the application configuration.
- `uploads/` contains organization logos and ERP attachments. Back up and transfer it with the database.
- PostgreSQL and the API are private Docker-network services. Do not publish port `5432` or `3000`.
- Configuration is immutable. Production values come from a host-protected `.env.production` file or Docker secrets, not `server/.env` and not the installer/settings configuration screens.
- This stack is one API replica. Socket.IO, cache fallback, and rate limiting are process-local while Redis is disabled.

## Host configuration

Create `.env.production` next to `compose.yaml` from `.env.production.example`. Keep it outside Git and restrict access to the deployment operator.

Set a unique password for PostgreSQL and independent long random values for `JWT_SECRET` and `JWT_REFRESH_SECRET`. For local-only Docker access, set `CLIENT_URL=http://127.0.0.1:8080`, `COOKIE_SECURE=false`, and `TRUST_PROXY=0`. When an external TLS proxy is introduced, use the exact public HTTPS origin, set `COOKIE_SECURE=true`, configure `TRUST_PROXY` for the trusted hop, and forward `Host`, `X-Forwarded-For`, and `X-Forwarded-Proto`.

For Nginx, point the TLS virtual host at `http://127.0.0.1:8080`. For a load balancer or ingress, set `WEB_PORT` to an unused loopback port and route traffic to it. Do not enable the Node HTTPS listener; TLS ends at the external proxy.

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
