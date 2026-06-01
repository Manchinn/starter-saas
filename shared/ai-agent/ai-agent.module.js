const fs = require('fs')
const path = require('path')
const defineModule = require('../../server/core/module')

const API_PREFIX = '/api/ai-agent'

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
  slug: 'ai-agent',
  name: 'AI Assistant',
  description: 'In-app AI agent — chat with a local LLM (Ollama / LM Studio) that can act on your data',
  icon: 'sparkles',
  order: 45,
  isCore: false,
  permissions: [
    'ai-agent.use',
    'ai-agent.settings',
  ],
  meta: { mountPath: API_PREFIX },
  register(app) {
    const seen = new Map()
    for (const file of findRouteFiles(__dirname)) {
      const mod = require(file)
      const { mountPath, router } = mod || {}
      if (!mountPath || typeof router !== 'function') {
        throw new Error(`AI Agent route file ${path.relative(__dirname, file)} must export { mountPath, router }`)
      }
      if (seen.has(mountPath)) {
        throw new Error(`AI Agent mount path conflict at ${mountPath}: ${seen.get(mountPath)} vs ${path.relative(__dirname, file)}`)
      }
      seen.set(mountPath, path.relative(__dirname, file))
      app.use(`${API_PREFIX}${mountPath}`, router)
    }
  },
})
