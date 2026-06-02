require('dotenv').config()
const crypto = require('crypto')

// Never ship a known, hardcoded signing secret. In production a missing secret
// is fatal (fail-fast on boot); in dev/test we generate an ephemeral random one
// per process so tokens are never signed with a guessable constant. Restarting
// the dev server invalidates existing tokens, which is fine for local work.
function resolveSecret(name, value) {
  if (value) return value
  if ((process.env.NODE_ENV || 'development') === 'production') {
    throw new Error(`${name} environment variable is required in production`)
  }
  return crypto.randomBytes(48).toString('hex')
}

// Express "trust proxy" setting. Accepts true/false, a hop count, or a
// subnet/IP string (passed through to Express). Empty → false (no proxy).
function parseTrustProxy(value) {
  if (value === undefined || value === '') return false
  if (value === 'true') return true
  if (value === 'false') return false
  const n = Number(value)
  return Number.isNaN(n) ? value : n
}

module.exports = {
  env: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT) || 3000,
  // HTTPS is served alongside HTTP when enabled (the app listens on both).
  // Point KEY/CERT at PEM files; see .env.example for generating a dev cert.
  https: {
    enabled:      process.env.HTTPS_ENABLED === 'true',
    port:         parseInt(process.env.HTTPS_PORT, 10) || 3443,
    keyPath:      process.env.HTTPS_KEY_PATH  || '',
    certPath:     process.env.HTTPS_CERT_PATH || '',
    // Redirect plain-HTTP requests to the HTTPS port (only when HTTPS is on).
    redirectHttp: process.env.HTTPS_REDIRECT === 'true',
  },
  // Cookie Secure flag: 'auto' mirrors the request scheme (Secure over https,
  // not over http) so both schemes work; 'true'/'false' force it either way.
  cookieSecure: (process.env.COOKIE_SECURE || 'auto').toLowerCase(),
  // Needed for req.secure / x-forwarded-proto to be trusted behind a proxy.
  trustProxy: parseTrustProxy(process.env.TRUST_PROXY),
  db: {
    // Supported Sequelize dialects: sqlite | postgres | mysql | mariadb | mssql
    dialect:  process.env.DB_DIALECT  || 'sqlite',
    // sqlite-only
    storage:  process.env.DB_STORAGE  || './data/database.sqlite',
    // shared by non-sqlite dialects
    host:     process.env.DB_HOST     || 'localhost',
    port:     process.env.DB_PORT ? parseInt(process.env.DB_PORT, 10) : undefined,
    database: process.env.DB_NAME     || '',
    username: process.env.DB_USER     || '',
    password: process.env.DB_PASSWORD || '',
    logging:  process.env.NODE_ENV === 'development' ? console.log : false,
  },
  jwt: {
    secret: resolveSecret('JWT_SECRET', process.env.JWT_SECRET),
    expiresIn: process.env.JWT_EXPIRES_IN || '15m',
    refreshSecret: resolveSecret('JWT_REFRESH_SECRET', process.env.JWT_REFRESH_SECRET),
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  },
  redis: {
    // When disabled the cache transparently falls back to an in-process store,
    // so callers use the same API regardless of whether Redis is configured.
    enabled:   process.env.REDIS_ENABLED === 'true',
    host:      process.env.REDIS_HOST     || '127.0.0.1',
    port:      parseInt(process.env.REDIS_PORT, 10) || 6379,
    password:  process.env.REDIS_PASSWORD || '',
    db:        parseInt(process.env.REDIS_DB, 10) || 0,
    keyPrefix: process.env.REDIS_KEY_PREFIX || 'starter:',
    // Default expiry (seconds) applied when a caller omits a TTL.
    ttl:       parseInt(process.env.REDIS_TTL, 10) || 3600,
  },
  clientUrl: process.env.CLIENT_URL || 'http://localhost:5173',
  appName: process.env.APP_NAME || 'Starter SaaS',
  // A live getter (not a snapshot) so SMTP settings edited at runtime via the
  // Settings → Email Setting tab — which rewrites .env and process.env — are
  // reflected immediately by the mailer without a server restart.
  get smtp() {
    return {
      host: process.env.SMTP_HOST || '',
      port: parseInt(process.env.SMTP_PORT) || 587,
      secure: process.env.SMTP_SECURE === 'true', // true for 465, false for others
      user: process.env.SMTP_USER || '',
      pass: process.env.SMTP_PASS || '',
      from: process.env.SMTP_FROM || 'no-reply@example.com',
    }
  },
  auth: {
    requireEmailVerification: process.env.REQUIRE_EMAIL_VERIFICATION === 'true',
    passwordResetExpiresMinutes: parseInt(process.env.PASSWORD_RESET_EXPIRES_MINUTES) || 60,
    emailVerificationExpiresHours: parseInt(process.env.EMAIL_VERIFICATION_EXPIRES_HOURS) || 24,
  },
  ai: {
    // Context window (num_ctx) Ollama loads the model with. The agent sends all
    // tool schemas on every call, so the fixed prompt (system + tools) is large
    // and grows as modules add tools; Ollama's small default (2048/4096) makes
    // it overflow with "n_keep >= n_ctx". With the full ERP tool set the fixed
    // prompt is ~8.5k tokens (even with prompt compression on), so 16384 leaves
    // room for the tools, history, and the reply — raise it further if you add
    // many more tools or want longer histories.
    //
    // NOTE: this only applies to Ollama. LM Studio's context length is fixed when
    // the model is loaded (set it in LM Studio's UI / server tab); num_ctx is not
    // sent to it, so a model loaded at 4096 there will still overflow.
    numCtx: parseInt(process.env.AI_NUM_CTX) || 16384,
  },
  billing: {
    // Active billing provider. `manual` (default) means plans are assigned by an
    // admin/owner with no external gateway; `stripe` activates the (scaffolded)
    // gateway adapter, which is inert until the keys below are also set.
    provider: process.env.BILLING_PROVIDER || 'manual',
    // Plan slug new organizations land on automatically (see organizations
    // service). Falls back to the lowest-priced active plan when absent.
    defaultPlanSlug: process.env.BILLING_DEFAULT_PLAN || 'free',
    currency: process.env.BILLING_CURRENCY || 'USD',
    stripe: {
      secretKey:      process.env.STRIPE_SECRET_KEY || '',
      webhookSecret:  process.env.STRIPE_WEBHOOK_SECRET || '',
    },
  },
}
