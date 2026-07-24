const path = require('path')
const fs = require('fs')
const winston = require('winston')

const projectRoot = path.resolve(__dirname, '..', '..')
const logsDir = process.env.LOG_DIR
  ? path.resolve(process.env.LOG_DIR)
  : path.join(projectRoot, 'logs')

// Ensure the logs directory exists before any transport tries to open a file.
fs.mkdirSync(logsDir, { recursive: true })

const isProduction = process.env.NODE_ENV === 'production'
const level = process.env.LOG_LEVEL || (isProduction ? 'info' : 'debug')

const MAX_SIZE = 20 * 1024 * 1024 // 20 MB per file before rotating

// ── Formats ──────────────────────────────────────────────────────────────────
const consoleFormat = winston.format.combine(
  winston.format.colorize({ all: true }),
  winston.format.timestamp({ format: 'HH:mm:ss' }),
  winston.format.printf(({ timestamp, level: lvl, message, label, ...meta }) => {
    const tag = label ? `[${label}] ` : ''
    const extra = Object.keys(meta).length && !meta.stack ? ' ' + JSON.stringify(meta) : ''
    const stack = meta.stack ? `\n${meta.stack}` : ''
    return `${timestamp} ${lvl} ${tag}${message}${extra}${stack}`
  }),
)

const fileFormat = winston.format.combine(
  winston.format.timestamp(),
  winston.format.errors({ stack: true }),
  winston.format.json(),
)

// ── Transports ───────────────────────────────────────────────────────────────
// Size-based rotation via winston's built-in File transport. `tailable` keeps
// the newest entries in the base filename and shifts older ones to app1.log,
// app2.log, … — no audit manifest files are written.
const transports = [
  new winston.transports.Console({ format: consoleFormat, level }),
  new winston.transports.File({
    filename: path.join(logsDir, 'app.log'),
    maxsize:  MAX_SIZE,
    maxFiles: 14,
    tailable: true,
    level,
    format:   fileFormat,
  }),
  new winston.transports.File({
    filename: path.join(logsDir, 'error.log'),
    maxsize:  MAX_SIZE,
    maxFiles: 30,
    tailable: true,
    level:    'error',
    format:   fileFormat,
  }),
]

const logger = winston.createLogger({
  level,
  defaultMeta: { service: 'saas' },
  transports,
  exitOnError: false,
})

// Catch unhandled exceptions and rejections (file only — don't change process behaviour)
logger.exceptions.handle(new winston.transports.File({
  filename: path.join(logsDir, 'exceptions.log'),
  maxsize:  MAX_SIZE,
  maxFiles: 5,
  tailable: true,
  format:   fileFormat,
}))

logger.rejections.handle(new winston.transports.File({
  filename: path.join(logsDir, 'rejections.log'),
  maxsize:  MAX_SIZE,
  maxFiles: 5,
  tailable: true,
  format:   fileFormat,
}))

/**
 * Return a child logger bound to a label (component/module name).
 * Usage: const log = require('./logger').forLabel('AutoJournal')
 *        log.info('posted', { invoiceId })
 */
logger.forLabel = (label) => logger.child({ label })

logger.info(`Logger initialised — writing to ${logsDir} at level "${level}"`, { label: 'logger' })

module.exports = logger
