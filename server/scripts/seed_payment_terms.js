const path = require('path')
process.chdir(path.resolve(__dirname, '..'))
require('dotenv').config()
const { sequelize, MasterDataCategory, MasterDataValue, User } = require('../models')

// Seed the "Payment Terms" master-data category + default values for every
// organization. Idempotent — skips any (orgId, slug) pair that already exists
// and skips any (categoryId, code) pair that's already there.
const DEFAULTS = [
  { code: 'cod',     name: 'COD (Cash on Delivery)', sortOrder: 10 },
  { code: 'prepaid', name: 'Prepaid',                sortOrder: 20 },
  { code: 'net7',    name: 'Net 7',                  sortOrder: 30 },
  { code: 'net15',   name: 'Net 15',                 sortOrder: 40 },
  { code: 'net30',   name: 'Net 30',                 sortOrder: 50 },
  { code: 'net60',   name: 'Net 60',                 sortOrder: 60 },
  { code: 'net90',   name: 'Net 90',                 sortOrder: 70 },
]

async function seedForOrg(orgId) {
  // The slug column has a *global* uniqueness constraint, not per-org, so we
  // first look up by slug alone and only create if no row exists at all.
  // Multi-org installs share a single payment-terms category until the schema
  // is relaxed to UNIQUE(slug, organizationId).
  let category = await MasterDataCategory.findOne({ where: { slug: 'payment-terms' } })
  if (!category) {
    category = await MasterDataCategory.create({
      slug:        'payment-terms',
      name:        'Payment Terms',
      description: 'Customer / vendor payment terms used on orders, invoices, and bills.',
      isSystem:    true,
      isActive:    true,
      organizationId: orgId,
    })
  }

  const existing = await MasterDataValue.findAll({
    where: { categoryId: category.id },
    attributes: ['code'],
  })
  const haveCodes = new Set(existing.map(v => v.code))

  let added = 0
  for (const v of DEFAULTS) {
    if (haveCodes.has(v.code)) continue
    await MasterDataValue.create({
      categoryId: category.id,
      code:       v.code,
      name:       v.name,
      sortOrder:  v.sortOrder,
      isActive:   true,
      organizationId: orgId,
    })
    added++
  }
  return { categoryId: category.id, added }
}

async function main() {
  try {
    await sequelize.authenticate()
    console.log('[Seed] DB connected.')

    // Resolve every "org context" — the request handler computes orgId as
    // `user.organizationId || user.id`, so each user maps to one effective
    // org bucket. The slug is globally unique, so the *first* org seen gets
    // ownership; the rest reuse the same category.
    const users = await User.findAll({ attributes: ['id', 'organizationId'] })
    const orgIds = []
    const seen = new Set()
    for (const u of users) {
      const oid = u.organizationId || u.id
      if (seen.has(oid)) continue
      seen.add(oid)
      orgIds.push(oid)
    }

    // Pull the existing category (if any) and re-home it to the first org so
    // /erp/master-data/payment-terms returns a match for that org's requests.
    if (orgIds.length) {
      const primary = orgIds[0]
      let existing = await MasterDataCategory.findOne({ where: { slug: 'payment-terms' } })
      if (existing && existing.organizationId !== primary) {
        await existing.update({ organizationId: primary })
        console.log(`[Seed] Re-homed existing category to orgId=${primary}`)
      }
    }

    for (const orgId of orgIds) {
      const { added } = await seedForOrg(orgId)
      console.log(`[Seed] orgId=${orgId ?? 'null'}: ${added} value(s) added`)
    }
    console.log('[Seed] Success.')
    process.exit(0)
  } catch (err) {
    console.error('[Seed] Failed:', err)
    process.exit(1)
  }
}

main()
