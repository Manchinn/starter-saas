const path = require('path')
const fs = require('fs')
const winston = require('winston')
const DailyRotateFile = require('winston-daily-rotate-file')

const projectRoot = path.resolve(__dirname, '..', '..')
const logsDir = process.env.LOG_DIR
  ? path.resolve(process.env.LOG_DIR)
  : path.join(projectRoot, 'logs')

// Ensure the logs directory exists before any transport tries to open a file.
fs.mkdirSync(logsDir, { recursive: true })

const isProduction = process.env.NODE_ENV === 'production'
const level = process.env.LOG_LEVEL || (isProduction ? 'info' : 'debug')

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
const transports = [
  new winston.transports.Console({ format: consoleFormat, level }),
  new DailyRotateFile({
    dirname:        logsDir,
    filename:       'app-%DATE%.log',
    datePattern:    'YYYY-MM-DD',
    maxSize:        '20m',
    maxFiles:       '14d',
    zippedArchive:  true,
    level,
    format:         fileFormat,
  }),
  new DailyRotateFile({
    dirname:        logsDir,
    filename:       'error-%DATE%.log',
    datePattern:    'YYYY-MM-DD',
    maxSize:        '20m',
    maxFiles:       '30d',
    zippedArchive:  true,
    level:          'error',
    format:         fileFormat,
  }),
]

const logger = winston.createLogger({
  level,
  defaultMeta: { service: 'starter-saas' },
  transports,
  exitOnError: false,
})

// Catch unhandled exceptions and rejections (file only — don't change process behaviour)
logger.exceptions.handle(new DailyRotateFile({
  dirname:        logsDir,
  filename:       'exceptions-%DATE%.log',
  datePattern:    'YYYY-MM-DD',
  maxSize:        '20m',
  maxFiles:       '60d',
  zippedArchive:  true,
  format:         fileFormat,
}))

logger.rejections.handle(new DailyRotateFile({
  dirname:        logsDir,
  filename:       'rejections-%DATE%.log',
  datePattern:    'YYYY-MM-DD',
  maxSize:        '20m',
  maxFiles:       '60d',
  zippedArchive:  true,
  format:         fileFormat,
}))

/**
 * Return a child logger bound to a label (component/module name).
 * Usage: const log = require('./logger').forLabel('AutoJournal')
 *        log.info('posted', { invoiceId })
 */
logger.forLabel = (label) => logger.child({ label })

logger.info(`Logger initialised — writing to ${logsDir} at level "${level}"`, { label: 'logger' })

module.exports = logger
