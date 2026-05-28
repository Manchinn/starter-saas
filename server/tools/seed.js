#!/usr/bin/env node
/**
 * Seed CLI (data lives in per-module seeds/ folders, run by ../core/seeder).
 *
 *   node tools/seed.js                reset DB, then run core + demo seeds
 *   node tools/seed.js core           run core (reference) seeds only, no reset
 *   node tools/seed.js demo           run core + demo seeds (no reset, additive)
 *   node tools/seed.js --no-reset     full seed without dropping tables
 *   node tools/seed.js --only <name>  run a single seed (exact or unique substring), no reset
 *
 * Tiers: core = idempotent reference data (permissions, roles, master data);
 * demo = sample data (users, ERP catalog & transactions). demo always runs
 * core first so cross-module references resolve.
 */
require('dotenv').config()
const { sequelize } = require('../models')
const seeder = require('../core/seeder')
const log = require('../core/logger').forLabel('seed-cli')

async function main() {
  const args = process.argv.slice(2)
  await sequelize.authenticate()

  // --only <name>: run a single seed, no reset, no tier logic.
  const onlyIdx = args.indexOf('--only')
  if (onlyIdx !== -1) {
    const only = args[onlyIdx + 1]
    if (!only) throw new Error('--only requires a seed name')
    await seeder.run(sequelize, { only })
    return
  }

  const tier = args.find((a) => !a.startsWith('-')) // positional: core | demo | all
  const coreOnly = tier === 'core'
  const tiers = coreOnly ? ['core'] : ['core', 'demo']
  // Full demo seed resets by default (fresh dev DB); core-only never resets.
  const reset = !coreOnly && !args.includes('--no-reset')

  await seeder.run(sequelize, { tiers, reset })

  if (tiers.includes('demo')) {
    log.info('Demo accounts:')
    log.info('  Admin:     admin@example.com / Admin1234!')
    log.info('  Demo user: user@example.com  / User1234!')
  }
}

main()
  .catch((err) => { log.error('Seeding failed', { error: err.message, stack: err.stack }); process.exitCode = 1 })
  .finally(() => sequelize.close())
