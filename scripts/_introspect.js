/**
 * _introspect.js — shared helper for the schema exporters.
 * Loads the live Sequelize model registry, then maps every model to the
 * module it belongs to (derived from the source file that defined it via
 * require.cache). Returns an enriched, sorted model list.
 */
const path = require('path')

function cap(s) {
  return s.replace(/(^|[-_])(\w)/g, (_, __, c) => ' ' + c.toUpperCase()).trim()
}

// Derive a human module label from a model's source file path.
function moduleLabel(file) {
  const p = file.replace(/\\/g, '/')
  let m
  if (/\/server\/models\//.test(p)) return 'Core / Auth'
  if ((m = p.match(/\/shared\/erp\/([^/]+)\//))) return 'ERP / ' + cap(m[1])
  if (/\/shared\/hrms\//.test(p)) return 'HRMS'
  if (/\/shared\/ai-agent\//.test(p)) return 'AI Agent'
  return 'Other'
}

function introspect() {
  // Loading the registry wires all associations as a side effect and
  // populates require.cache with every .model.js file.
  const models = require(path.resolve(__dirname, '..', 'server', 'models', 'index'))

  // name -> module, from each model file's direct export.
  const moduleByName = {}
  for (const file of Object.keys(require.cache)) {
    if (!/\.model\.js$/i.test(file)) continue
    const exp = require.cache[file].exports
    if (exp && exp.tableName && typeof exp.getAttributes === 'function' && exp.name) {
      moduleByName[exp.name] = moduleLabel(file)
    }
  }

  const list = Object.entries(models)
    .filter(([, m]) => m && m.tableName && typeof m.getAttributes === 'function')
    .map(([name, model]) => ({ name, model, module: moduleByName[name] || 'Other' }))
    .sort((a, b) =>
      a.module.localeCompare(b.module) || a.name.localeCompare(b.name))

  return list
}

module.exports = { introspect, moduleLabel }
