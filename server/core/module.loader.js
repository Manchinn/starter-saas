const fs = require('fs')
const path = require('path')
const { Module: ModuleModel } = require('../models')
const log = require('./logger').forLabel('module-loader')

const MODULES_DIR = path.join(__dirname, '..', 'modules')
const SHARED_DIR  = path.join(MODULES_DIR, '..', '..', 'shared')
const loaded = new Map()

// Discover and require every *.module.js without registering routes or touching
// the DB. Safe to call before boot (used by the seeders) — require() is
// side-effect free for a module because route wiring happens lazily inside
// register(), which we don't call here.
const collectDefinitions = () => [MODULES_DIR, SHARED_DIR].flatMap((dir) => {
  if (!fs.existsSync(dir)) return []
  return fs.readdirSync(dir, { recursive: true })
    .filter((f) => f.endsWith('.module.js'))
    .map((f) => require(path.join(dir, f))) // nosemgrep: javascript.lang.security.audit.path-traversal.path-join-resolve-traversal.path-join-resolve-traversal -- fixed module search dirs; names come from readdirSync, not request input
})

const loadAll = async (app) => {
  for (const instance of collectDefinitions()) {
    loaded.set(instance.slug, instance)

    await ModuleModel.upsert({
      slug:        instance.slug,
      name:        instance.name,
      description: instance.description,
      icon:        instance.icon,
      order:       instance.order,
      isCore:      instance.isCore,
      permissions: instance.permissions,
      meta:        instance.meta,
    }, { conflictFields: ['slug'] })

    instance.register(app)
    log.debug(`Loaded module: ${instance.slug}`)
  }

  log.info(`${loaded.size} modules loaded`)
}

// Distinct permission slugs declared by every shared (non-core) module — the
// catalog the "Customer" role is built from.
const sharedModulePermissionSlugs = () =>
  [...new Set(collectDefinitions().filter((m) => !m.isCore).flatMap((m) => m.permissions || []))]

// Build a platform Permission catalog row from a dotted slug. The first segment
// is the module/group, the rest becomes a human label:
//   'erp.customers.list' -> { slug, name: 'Customers List', group: 'erp', … }
const describePermissionSlug = (slug) => {
  const [group, ...rest] = slug.split('.')
  const name = rest.join(' ').replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()) || group
  return { slug, name, group, description: `${slug} — provided by the ${group} module` }
}

const get = (slug) => loaded.get(slug)
const getAll = () => Array.from(loaded.values())

module.exports = { loadAll, get, getAll, collectDefinitions, sharedModulePermissionSlugs, describePermissionSlug }
