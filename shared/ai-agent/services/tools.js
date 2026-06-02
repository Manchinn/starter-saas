/**
 * Tool registry for the AI agent.
 *
 * Each tool: { name, description, kind, parameters, handler }
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
    const full = path.join(dir, entry.name) // nosemgrep: javascript.lang.security.audit.path-traversal.path-join-resolve-traversal.path-join-resolve-traversal -- fixed ERP dir; names come from readdirSync, not request input
    if (entry.name === 'ai-tools') {
      const idx = path.join(full, 'index.js') // nosemgrep: javascript.lang.security.audit.path-traversal.path-join-resolve-traversal.path-join-resolve-traversal -- joins a discovered dir with a constant filename, not request input
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

// Drop per-property `description` fields from a JSON-schema params object —
// keeps type/enum/required so the model can still call the tool, just leaner.
const stripParamDescriptions = (params) => {
  if (!params || typeof params !== 'object' || !params.properties) return params
  const properties = {}
  for (const [key, spec] of Object.entries(params.properties)) {
    const { description, ...rest } = spec || {}
    properties[key] = rest
  }
  return { ...params, properties }
}

// First sentence/line of a description — enough signal for the model to pick a
// tool without the full prose.
const shortDesc = (d) => (d || '').split(/(?<=\.)\s|\n/)[0].trim()

// OpenAI-style tool schema array sent to the LLM. `compact` drops parameter
// descriptions and shortens tool descriptions to fit small context windows
// (prompt compression).
const schemas = ({ compact = false } = {}) => tools.map((t) => ({
  type: 'function',
  function: {
    name: t.name,
    description: compact ? shortDesc(t.description) : t.description,
    parameters: compact ? stripParamDescriptions(t.parameters) : t.parameters,
  },
}))

// Execute a tool by name. Returns { content, action? } where content is a
// string the model can read. Tool failures are returned as content (not thrown)
// so the agent can apologize/recover instead of 500-ing.
const execute = async (name, args, ctx) => {
  const tool = byName.get(name)
  if (!tool) return { content: `Error: no such tool "${name}".` }
  try {
    const { result, action } = await tool.handler(args || {}, ctx)
    const content = typeof result === 'string' ? result : JSON.stringify(result)
    return { content, action }
  } catch (err) {
    return { content: `Error running ${name}: ${err.message || 'failed'}` }
  }
}

module.exports = { tools, schemas, execute, NAV_TARGETS }
