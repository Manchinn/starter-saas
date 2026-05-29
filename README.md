# Starter SaaS

A multi-tenant ERP/SaaS starter built as an npm-workspaces monorepo: an Express + Sequelize REST API and a Vue 3 single-page app, sharing a modular (HMVC) ERP layer. It ships with a guided install wizard, JWT auth, per-organization data isolation, and a full set of ERP modules (sales, purchasing, inventory, accounting, HRMS).

## Tech stack

- **Backend:** Node.js, Express, Sequelize ORM, JWT (access + refresh), bcrypt, express-validator, Winston logging
- **Database:** SQLite by default; also supports PostgreSQL, MySQL, MariaDB, and SQL Server (selectable at install time)
- **Cache:** optional Redis (ioredis) with a transparent in-memory fallback
- **Frontend:** Vue 3, Vite, Pinia, Vue Router, Vue I18n, Tailwind CSS, Axios
- **i18n:** English and Thai, split per module and auto-merged; supports CE/BE calendars and configurable currency formatting

## Repository layout

```
starter-saas/
├── server/        Express API — bootstrap, core (auth, modules, migrator, tenant), server-only modules
│   ├── modules/   auth, organizations, permissions, roles, profile, system, dashboard
│   ├── core/      module loader, migrator, multi-tenant scoping helpers, logger
│   └── config/    database + app config (env-driven)
├── client/        Vue 3 SPA (Vite)
│   └── src/modules/   auth (incl. install wizard), dashboard, profile, admin
├── shared/        HMVC business modules consumed by the server
│   ├── erp/       products, pricing, customers, vendors, quotations, orders, invoices,
│   │              receipts, purchasing, inventory/stock, accounting, settings, …
│   └── hrms/      departments, employees
└── package.json   workspace root
```

## ERP module structure

Each ERP feature under `shared/erp/` is a self-contained HMVC module that bundles its
backend (controllers/services/models/routes/migrations) and frontend (Vue views + i18n)
together. Using `products` as a concrete example:

```
shared/erp/products/
├── controllers/        Thin HTTP handlers — read req, call service, shape response
│   ├── product.controller.js
│   └── product-category.controller.js
├── services/           Business logic: transactions, validation, org-scoped queries
│   ├── product.service.js
│   └── product-category.service.js
├── routes/             Express routers; each exports { mountPath, router }
│   ├── product.routes.js            → mountPath: '/item-master'
│   └── product-category.routes.js   → mountPath: '/product-categories'
├── models/             Sequelize models + association wiring
│   ├── product.model.js
│   ├── product-category.model.js
│   └── product.association.js
├── migrations/         Schema migrations (run automatically on boot)
├── seeds/              Optional seed data
├── validators/         express-validator rule sets
├── views/              Vue 3 SPA pages (lists + dedicated create/edit pages)
│   ├── products/        ProductsList.vue, ProductCreate.vue, ProductEdit.vue
│   └── categories/      ProductCategoriesList.vue, …Create.vue, …Edit.vue
├── i18n/               Per-module locale messages
│   ├── en.js
│   └── th.js
├── __tests__/          Jest unit tests for services
└── index.js            Client entry: exports `routes` + `navChildren` for the SPA
```

How the pieces get wired up automatically:

- **Backend routes** — `shared/erp/erp.module.js` recursively discovers every `*.routes.js`
  file and mounts its router under the `/api/erp` prefix (so `product.routes.js` with
  `mountPath: '/item-master'` is served at `/api/erp/item-master`). Routes are protected by
  the `authenticate` middleware and per-action permissions.
- **Frontend routes & nav** — `shared/erp/index.js` eager-loads each submodule's `index.js`
  via `import.meta.glob`, flat-merges their `routes`, and assembles the ERP navigation tree
  from their `navChildren`.
- **Multi-tenancy** — services scope every read/update/delete to the caller's organization
  using the helpers in `server/core/tenant.js`, so one org can never reach another's records.

To add a new ERP module, create a folder under `shared/erp/<feature>/` following the same
layout — no central registry edits are needed; the route/nav auto-discovery picks it up.

## Prerequisites

- Node.js 18+ and npm 9+
- (Optional) PostgreSQL / MySQL / MariaDB / SQL Server if you don't want SQLite
- (Optional) Redis if you want a shared cache

## Getting started

```bash
# 1. Install dependencies for the root, server, and client workspaces
npm run install:all

# 2. Start the API and the SPA together (API on :3000, SPA on :5173)
npm run dev
```

Then open the SPA and complete the **install wizard** at `/install`. The wizard lets you:

- choose the default workspace language (English / ภาษาไทย),
- pick and test the database connection (SQLite path, or a relational DB),
- optionally enable and test Redis,
- create the first admin account,
- optionally seed default reference sequences and a full set of **demo data** (seeded in the language you selected).

After install you'll be signed in and redirected to the dashboard.

> The API runs migrations and base seeds automatically on boot, so a fresh database is provisioned the first time the server starts.

## Configuration

The server reads configuration from environment variables (a `server/.env` file is loaded via dotenv). Common variables:

| Variable | Default | Purpose |
|---|---|---|
| `PORT` | `3000` | API port |
| `NODE_ENV` | `development` | `production` requires the JWT secrets below |
| `DB_DIALECT` | `sqlite` | `sqlite` \| `postgres` \| `mysql` \| `mariadb` \| `mssql` |
| `DB_STORAGE` | `./data/database.sqlite` | SQLite file path (relative paths anchor to the repo root) |
| `DB_HOST` / `DB_PORT` / `DB_NAME` / `DB_USER` / `DB_PASSWORD` | — | Relational DB connection |
| `JWT_SECRET` / `JWT_REFRESH_SECRET` | random in dev | Token signing secrets (required in production) |
| `REDIS_ENABLED` | `false` | Enable Redis cache (`REDIS_HOST`, `REDIS_PORT`, `REDIS_PASSWORD`, `REDIS_DB`) |
| `CLIENT_URL` | `http://localhost:5173` | Allowed CORS origin |
| `SMTP_*` | — | Outgoing mail for email verification / password reset |

Most of these can also be set through the install wizard, which writes them and restarts the API when needed.

## Scripts

**Root**

| Command | Description |
|---|---|
| `npm run dev` | Run API and SPA concurrently |
| `npm run dev:server` / `npm run dev:client` | Run one side only |
| `npm run build` | Build the SPA for production |
| `npm run install:all` | Install dependencies across all workspaces |

**Server** (run inside `server/`)

| Command | Description |
|---|---|
| `npm run dev` | API with nodemon |
| `npm start` | API with node |
| `npm run migrate` / `migrate:status` / `migrate:down` | Database migrations |
| `npm run seed` / `seed:core` | Run seeders |
| `npm test` | Unit tests (Jest) |

## Testing

Unit tests use Jest and live next to the code they cover (`**/__tests__/*.test.js`). Run them from the `server/` directory so the project Jest config (`server/jest.config.js`) is picked up:

```bash
cd server
npm test                 # all suites
npx jest shared/erp/...  # a subset
```

## Internationalization

Locale messages are split per module (e.g. `client/src/modules/*/i18n/{en,th}.js` and `shared/erp/*/i18n/{en,th}.js`) and merged automatically at build time. The active language is stored client-side and chosen during install; demo data is seeded in the selected language.

## License

Private/internal project. Add a license here if you intend to distribute it.
