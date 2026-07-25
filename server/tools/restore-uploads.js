#!/usr/bin/env node
require('dotenv').config()

const path = require('path')
const log = require('../core/logger').forLabel('uploads-restore')
const { applyOwnership, restoreSnapshot } = require('../core/uploads-snapshot')

const TARGET_ROOT = path.resolve(__dirname, '..', '..', 'uploads')
const RUNTIME_UID = 1000
const RUNTIME_GID = 1000

function parseArgs(argv) {
  const args = {}
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index]
    if (!arg.startsWith('--')) continue
    const key = arg.slice(2)
    const value = argv[index + 1]
    if (!value || value.startsWith('--')) throw new Error(`Missing value for --${key}`)
    args[key] = value
    index += 1
  }
  return args
}

function main() {
  const args = parseArgs(process.argv.slice(2))
  if (!args.source) throw new Error('--source is required')

  const source = path.resolve(args.source)
  const files = restoreSnapshot(source, TARGET_ROOT)
  applyOwnership(TARGET_ROOT, RUNTIME_UID, RUNTIME_GID)

  log.info('Uploads snapshot restored', {
    source,
    target: TARGET_ROOT,
    files: files.length,
  })
}

try {
  main()
} catch (err) {
  log.error('Uploads restore failed', { error: err.message, stack: err.stack })
  process.exitCode = 1
}
