#!/usr/bin/env node
require('dotenv').config()

const fs = require('fs')
const path = require('path')
const { QueryTypes } = require('sequelize')
const sequelize = require('../config/database')
const log = require('../core/logger').forLabel('uploads-validate')
const { resolveInside } = require('../core/uploads-snapshot')

const UPLOADS_ROOT = path.resolve(__dirname, '..', '..', 'uploads')

function missingFiles(rows, column, prefix, label) {
  const missing = []
  for (const row of rows) {
    if (!row[column]) continue
    const fullPath = resolveInside(UPLOADS_ROOT, path.join(prefix, row[column]), label)
    if (!fs.existsSync(fullPath) || !fs.statSync(fullPath).isFile()) {
      missing.push(`${row.id}: ${path.join(prefix, row[column])}`)
    }
  }
  return missing
}

async function main() {
  if (sequelize.getDialect() !== 'postgres') {
    throw new Error('DB_DIALECT must be postgres for uploads validation')
  }

  await sequelize.authenticate()
  try {
    const [attachments, logos] = await Promise.all([
      sequelize.query('SELECT id, "storedName" FROM attachments', { type: QueryTypes.SELECT }),
      sequelize.query('SELECT id, "logoPath" FROM "Users" WHERE "logoPath" IS NOT NULL', { type: QueryTypes.SELECT }),
    ])

    const missingAttachments = missingFiles(attachments, 'storedName', 'attachments', 'attachment')
    const missingLogos = missingFiles(logos, 'logoPath', '', 'logo')
    const failures = [
      ...missingAttachments.map((value) => `attachment file missing: ${value}`),
      ...missingLogos.map((value) => `logo file missing: ${value}`),
    ]

    if (failures.length > 0) {
      throw new Error(`Uploads validation failed:\n- ${failures.join('\n- ')}`)
    }

    log.info('Uploads validation passed', {
      attachments: attachments.length,
      logos: logos.length,
      uploadsRoot: UPLOADS_ROOT,
    })
  } finally {
    await sequelize.close()
  }
}

main().catch((err) => {
  log.error('Uploads validation failed', { error: err.message, stack: err.stack })
  process.exitCode = 1
})
