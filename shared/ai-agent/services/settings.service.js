const { AiSetting } = require('../../../server/models')

// Provider presets used when a user first opens settings or switches provider.
const PRESETS = {
  ollama:   { baseUrl: 'http://localhost:11434',     model: 'llama3.1' },
  lmstudio: { baseUrl: 'http://localhost:1234/v1',   model: 'local-model' },
}

const DEFAULT_SYSTEM_PROMPT = [
  'You are an in-app assistant for an ERP web application.',
  'Prefer calling a tool over explaining how to do something manually; to open a page use the `navigate` tool.',
  'Report financial figures only from a tool result — never invent numbers. You cannot post or edit journals.',
  'Keep replies short and confirm what you did.',
].join('\n')

const PUBLIC_FIELDS = ['provider', 'baseUrl', 'model', 'temperature', 'systemPrompt', 'enabled', 'autoAction', 'maxTokens', 'thinkingModel', 'promptCompression']

const defaults = () => ({
  provider:     'ollama',
  baseUrl:      PRESETS.ollama.baseUrl,
  model:        PRESETS.ollama.model,
  apiKey:       '',
  temperature:  0.3,
  systemPrompt: DEFAULT_SYSTEM_PROMPT,
  enabled:      true,
  autoAction:   true,
  maxTokens:        null,   // null = unlimited
  thinkingModel:    false,
  promptCompression:false,
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
    maxTokens:        row.maxTokens ?? null,
    thinkingModel:    !!row.thinkingModel,
    promptCompression:!!row.promptCompression,
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
  if (patch.thinkingModel !== undefined) next.thinkingModel = !!patch.thinkingModel
  if (patch.promptCompression !== undefined) next.promptCompression = !!patch.promptCompression
  // maxTokens: null/'' (or any non-positive) ⇒ unlimited (stored as null).
  if (patch.maxTokens !== undefined) {
    const n = Number(patch.maxTokens)
    next.maxTokens = patch.maxTokens === null || patch.maxTokens === '' || !Number.isFinite(n) || n <= 0
      ? null
      : Math.floor(n)
  }
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
    maxTokens:        next.maxTokens,
    thinkingModel:    next.thinkingModel,
    promptCompression:next.promptCompression,
  })
  return get(userId, organizationId)
}

module.exports = { get, getRaw, save, defaults, PRESETS, DEFAULT_SYSTEM_PROMPT }
