const fs = require('fs')
const path = require('path')
const defineModule = require('../../server/core/module')

const API_PREFIX = '/api/hrms'

const findRouteFiles = (dir) => {
  const out = []
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name) // nosemgrep: javascript.lang.security.audit.path-traversal.path-join-resolve-traversal.path-join-resolve-traversal -- fixed __dirname base; names come from readdirSync, not request input
    if (entry.isDirectory()) out.push(...findRouteFiles(full))
    else if (entry.isFile() && entry.name.endsWith('.routes.js')) out.push(full)
  }
  return out
}

module.exports = defineModule({
  slug: 'hrms',
  name: 'HRMS',
  description: 'Human resources — employees and departments',
  icon: 'user-group',
  order: 35,
  isCore: false,
  permissions: [
    'hrms.employees.list', 'hrms.employees.edit', 'hrms.employees.delete',
    'hrms.departments.list', 'hrms.departments.edit', 'hrms.departments.delete',
    'hrms.roles.list', 'hrms.roles.manage',
  ],
  meta: { mountPath: API_PREFIX },
  register(app) {
    const seen = new Map()
    for (const file of findRouteFiles(__dirname)) {
      const mod = require(file)
      const { mountPath, router } = mod || {}
      if (!mountPath || typeof router !== 'function') {
        throw new Error(`HRMS route file ${path.relative(__dirname, file)} must export { mountPath, router }`)
      }
      if (seen.has(mountPath)) {
        throw new Error(`HRMS mount path conflict at ${mountPath}: ${seen.get(mountPath)} vs ${path.relative(__dirname, file)}`)
      }
      seen.set(mountPath, path.relative(__dirname, file))
      app.use(`${API_PREFIX}${mountPath}`, router)
    }
  },
})
