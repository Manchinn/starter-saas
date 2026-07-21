/**
 * Tool registry for the AI agent.
 *
 * Each tool: { name, description, kind, permissions, parameters, handler }
 *   kind 'server' — runs on the backend (mutates/reads data), result fed to the model
 *   kind 'client' — produces a client action (e.g. SPA navigation) for the browser
 *
 * Handlers are async (args, ctx) where ctx = { user: { id, organizationId } }.
 * A handler may return:
 *   { result, action }   — `result` (string|object) is summarized back to the
 *                          model; `action` is forwarded to the client to run.
 *
 * Module tools are auto-loaded from any shared/erp/<module>/ai-tools/index.js.
 * To add tools for a new module, create that file and export an array of tool definitions.
 */

const fs   = require('fs')
const path = require('path')

const ERP_DIR = path.join(__dirname, '../../erp')

const findAiToolFiles = (dir) => {
  const out = []
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue
    const full = path.join(dir, entry.name)
    if (entry.name === 'ai-tools') {
      const idx = path.join(full, 'index.js')
      if (fs.existsSync(idx)) out.push(idx)
    } else {
      out.push(...findAiToolFiles(full))
    }
  }
  return out
}

// Auto-load tools and navTargets from every shared/erp/<module>/ai-tools/index.js.
const NAV_TARGETS = {}
const moduleTools = []
for (const file of findAiToolFiles(ERP_DIR)) {
  const mod = require(file)
  moduleTools.push(...(mod.tools || []))
  Object.assign(NAV_TARGETS, mod.navTargets || {})
}

const tools = [
  {
    name: 'navigate',
    kind: 'client',
    description: 'Open a page in the app. Use when the user wants to go to, open, show or view a section.',
    parameters: {
      type: 'object',
      properties: {
        target: {
          type: 'string',
          enum: Object.keys(NAV_TARGETS),
          description: 'Which page to open.',
        },
      },
      required: ['target'],
    },
    async handler(args) {
      const target = NAV_TARGETS[args.target]
      if (!target) {
        return { result: `Unknown page "${args.target}". Valid pages: ${Object.keys(NAV_TARGETS).join(', ')}.` }
      }
      return {
        result: `Opened ${target.label}.`,
        action: { type: 'navigate', target: args.target, path: target.path, label: target.label },
      }
    },
  },

  ...moduleTools,
]

const byName = new Map(tools.map((t) => [t.name, t]))

const isAllowed = (tool, permissions) => !tool.permissions?.length
  || permissions?.has('*') || tool.permissions.some((permission) => permissions?.has(permission))

// Only advertise tools the caller may use. Execute repeats this check because
// a model may still call a tool from stale conversation context.
const schemas = (ctx = {}) => tools.filter((t) => isAllowed(t, ctx.permissions)).map((t) => ({
  type: 'function',
  function: { name: t.name, description: t.description, parameters: t.parameters },
}))

// Execute a tool by name. Returns { content, action? } where content is a
// string the model can read. Tool failures are returned as content (not thrown)
// so the agent can apologize/recover instead of 500-ing.
const execute = async (name, args, ctx) => {
  const tool = byName.get(name)
  if (!tool) return { content: `Error: no such tool "${name}".` }
  if (!isAllowed(tool, ctx.permissions)) {
    return { content: `Error: you do not have permission to use ${name}.` }
  }
  try {
    const { result, action } = await tool.handler(args || {}, ctx)
    const content = typeof result === 'string' ? result : JSON.stringify(result)
    return { content, action }
  } catch (err) {
    return { content: `Error running ${name}: ${err.message || 'failed'}` }
  }
}

module.exports = { tools, schemas, execute, NAV_TARGETS, isAllowed }
