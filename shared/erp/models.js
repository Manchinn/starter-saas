/**
 * ERP model registry — auto-loaded.
 *
 *  • Every `**\/*.model.js` is required and registered by its Sequelize
 *    model name (Model.name) into a flat registry.
 *  • Every `**\/*Associations.js` is required and invoked with the registry,
 *    wiring intra-ERP associations.
 *
 * Cross-domain associations that reference core server models (e.g. User)
 * live in association files listed in CROSS_DOMAIN_ASSOCIATIONS and are
 * invoked by server/models/index.js after the merge.
 */

const fs = require('fs')
const path = require('path')

const ROOT = __dirname

// Association files that depend on core (non-ERP) models — skipped here,
// invoked by server/models/index.js after the full registry is built.
const CROSS_DOMAIN_ASSOCIATIONS = new Set([])

const findFiles = (dir, suffix) => {
  const out = []
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name) // nosemgrep: javascript.lang.security.audit.path-traversal.path-join-resolve-traversal.path-join-resolve-traversal -- fixed __dirname base; names come from readdirSync, not request input
    if (entry.isDirectory()) out.push(...findFiles(full, suffix))
    else if (entry.isFile() && entry.name.endsWith(suffix)) out.push(full)
  }
  return out
}

const erpModels = {}
for (const file of findFiles(ROOT, '.model.js')) {
  const M = require(file)
  if (!M || !M.name) {
    throw new Error(`ERP model ${path.relative(ROOT, file)} must export a Sequelize model`)
  }
  if (erpModels[M.name]) {
    throw new Error(`ERP model name conflict on "${M.name}": ${path.relative(ROOT, file)}`)
  }
  erpModels[M.name] = M
}

for (const file of findFiles(ROOT, '.association.js')) {
  if (CROSS_DOMAIN_ASSOCIATIONS.has(path.basename(file))) continue
  const associate = require(file)
  if (typeof associate !== 'function') {
    throw new Error(`ERP association ${path.relative(ROOT, file)} must export a function`)
  }
  associate(erpModels)
}

module.exports = erpModels
