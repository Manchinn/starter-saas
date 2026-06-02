const { AiSetting } = require('../../../server/models')

// Provider presets used when a user first opens settings or switches provider.
const PRESETS = {
  ollama:   { baseUrl: 'http://localhost:11434',     model: 'llama3.1' },
  lmstudio: { baseUrl: 'http://localhost:1234/v1',   model: 'local-model' },
}

const DEFAULT_SYSTEM_PROMPT = [
  'You are an in-app assistant for an ERP web application.',
  'You can take actions on the user\'s behalf by calling the provided tools:',
  '- To open or show a page, call the `navigate` tool.',
  '- To create or list products/customers, call the matching tool.',
  '- For accounting, use the read-only tools to look up accounts (`list_accounts`) and',
  '  journal entries (`list_journals`, `get_journal`), and to run financial reports:',
  '  `trial_balance_report`, `general_ledger_report`, `balance_sheet`, `income_statement`,',
  '  `ar_aging_report`, `list_tax_periods` and `vat_report`. You cannot post or edit journals —',
  '  for that, navigate the user to the relevant accounting page.',
  'Prefer calling a tool over describing how to do something manually.',
  'When the user asks to "open", "show", "go to" or "list" something, navigate there.',
  'Report financial figures only from a tool result — never estimate or invent numbers.',
  'Keep replies short and confirm what you did.',
].join('\n')

const PUBLIC_FIELDS = ['provider', 'baseUrl', 'model', 'temperature', 'systemPrompt', 'enabled', 'autoAction']

const defaults = () => ({
  provider:     'ollama',
  baseUrl:      PRESETS.ollama.baseUrl,
  model:        PRESETS.ollama.model,
  apiKey:       '',
  temperature:  0.3,
  systemPrompt: DEFAULT_SYSTEM_PROMPT,
  enabled:      true,
  autoAction:   true,
})

// Full settings incl. apiKey — for server-side LLM calls only.
const getRaw = async (userId, organizationId) => {
  const where = organizationId ? { userId, organizationId } : { userId }
  const row = await AiSetting.findOne({ where })
  if (!row) return { ...defaults(), userId, organizationId }
  return {
    userId,
    organizationId,
    provider:     row.provider,
    baseUrl:      row.baseUrl,
    model:        row.model,
    apiKey:       row.apiKey || '',
    temperature:  row.temperature,
    systemPrompt: row.systemPrompt || DEFAULT_SYSTEM_PROMPT,
    enabled:      row.enabled,
    autoAction:   row.autoAction,
  }
}

// Client-facing view — never leaks the apiKey, just whether one is set.
const get = async (userId, organizationId) => {
  const raw = await getRaw(userId, organizationId)
  const out = {}
  for (const f of PUBLIC_FIELDS) out[f] = raw[f]
  out.hasApiKey = !!raw.apiKey
  return out
}

const save = async (userId, organizationId, patch = {}) => {
  const current = await getRaw(userId, organizationId)
  const next = { ...current }

  for (const f of ['provider', 'baseUrl', 'model', 'systemPrompt']) {
    if (patch[f] !== undefined) next[f] = patch[f]
  }
  if (patch.temperature !== undefined) next.temperature = Number(patch.temperature)
  if (patch.enabled !== undefined) next.enabled = !!patch.enabled
  if (patch.autoAction !== undefined) next.autoAction = !!patch.autoAction
  // apiKey: only overwrite when a non-undefined value is sent (empty string clears it)
  if (patch.apiKey !== undefined) next.apiKey = patch.apiKey

  await AiSetting.upsert({
    userId,
    organizationId,
    createdBy:    userId,
    modifiedBy:   userId,
    provider:     next.provider,
    baseUrl:      next.baseUrl,
    model:        next.model,
    apiKey:       next.apiKey || null,
    temperature:  next.temperature,
    systemPrompt: next.systemPrompt,
    enabled:      next.enabled,
    autoAction:   next.autoAction,
  })
  return get(userId, organizationId)
}

module.exports = { get, getRaw, save, defaults, PRESETS, DEFAULT_SYSTEM_PROMPT }
