require('dotenv').config()

module.exports = {
  env: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT) || 3000,
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
    secret: process.env.JWT_SECRET || 'fallback-secret-change-in-production',
    expiresIn: process.env.JWT_EXPIRES_IN || '15m',
    refreshSecret: process.env.JWT_REFRESH_SECRET || 'fallback-refresh-secret',
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
  smtp: {
    host: process.env.SMTP_HOST || '',
    port: parseInt(process.env.SMTP_PORT) || 587,
    secure: process.env.SMTP_SECURE === 'true', // true for 465, false for others
    user: process.env.SMTP_USER || '',
    pass: process.env.SMTP_PASS || '',
    from: process.env.SMTP_FROM || 'no-reply@example.com',
  },
  auth: {
    requireEmailVerification: process.env.REQUIRE_EMAIL_VERIFICATION === 'true',
    passwordResetExpiresMinutes: parseInt(process.env.PASSWORD_RESET_EXPIRES_MINUTES) || 60,
    emailVerificationExpiresHours: parseInt(process.env.EMAIL_VERIFICATION_EXPIRES_HOURS) || 24,
  },
}
