/**
 * Boot-time data seeders (idempotent). Schema changes belong in module
 * migrations/ folders run by ./migrator — this file only seeds rows.
 */
const log = require('./logger').forLabel('seed')

// ── Sequence number seed data ─────────────────────────────────────────────────
const SEQUENCE_SEEDS = [
  { code: 'GR',  name: 'Good Receive',     format: 'GR{YY}{MM}{####}',  initialValue: 1, runningValue: 1, reseedPeriod: 'M', maxValue: 9999 },
  { code: 'ADJ', name: 'Stock Adjustment', format: 'ADJ{YY}{MM}{####}', initialValue: 1, runningValue: 1, reseedPeriod: 'M', maxValue: 9999 },
  { code: 'CNT', name: 'Stock Count',      format: 'SC{YY}{MM}{####}',  initialValue: 1, runningValue: 1, reseedPeriod: 'M', maxValue: 9999 },
  { code: 'STR', name: 'Stock Transfer',   format: 'RQ{YY}{MM}{####}',  initialValue: 1, runningValue: 1, reseedPeriod: 'M', maxValue: 9999 },
  { code: 'RTN', name: 'Stock Return',     format: 'RTN{YY}{MM}{####}', initialValue: 1, runningValue: 1, reseedPeriod: 'M', maxValue: 9999 },
  { code: 'ISS', name: 'Stock Issue',      format: 'ISS{YY}{MM}{####}', initialValue: 1, runningValue: 1, reseedPeriod: 'M', maxValue: 9999 },
  { code: 'DEP', name: 'Department Code',  format: 'DEP{####}',         initialValue: 1, runningValue: 1, reseedPeriod: 'F', maxValue: 99999 },
]

async function seedSequences() {
  // Lazy-require to avoid circular deps at module load time.
  const { Sequence, User } = require('../models')

  // Drop old global (userId: null) sequences — replaced by per-user ones.
  await Sequence.destroy({ where: { userId: null } })

  const users = await User.findAll({ attributes: ['id'] })
  let total = 0
  for (const user of users) {
    const existing = await Sequence.count({ where: { userId: user.id } })
    if (existing > 0) continue
    for (const seed of SEQUENCE_SEEDS) {
      await Sequence.create({ ...seed, userId: user.id, runningValue: seed.initialValue })
    }
    total++
  }
  if (total > 0) log.info(`Seeded sequences for ${total} user(s)`)
  else log.debug('Per-user sequences already present — skipped')
}

// ── HRMS permission catalog ───────────────────────────────────────────────────
// Idempotent (findOrCreate by slug). Mirrors the CLI core seed so the HRMS
// roles/permissions UI has a populated catalog on first boot.
async function seedHrmsPermissions() {
  const models = require('../models')
  const seed = require('../../shared/hrms/seeds/hrms-permissions')
  await seed.run({ models, set: () => {} })
  log.debug('HRMS permission catalog ensured')
}

// ── Billing plan catalog ───────────────────────────────────────────────────────
// Idempotent (findOrCreate by slug). Reuses the module seed so the default plans
// exist on first boot and getDefaultPlan() always resolves.
async function seedBillingPlans() {
  const models = require('../models')
  const seed = require('../modules/billing/seeds/plans')
  await seed.run({ models, log, set: () => {} })
  log.debug('Billing plan catalog ensured')
}

module.exports = { seedSequences, seedHrmsPermissions, seedBillingPlans, SEQUENCE_SEEDS }
