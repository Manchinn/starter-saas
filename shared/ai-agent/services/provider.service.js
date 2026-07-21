/**
 * Talks to a local LLM — Ollama or LM Studio — normalized to an OpenAI-style
 * surface ({ messages, tools } in; an assistant message with optional
 * `tool_calls` out). Both providers support OpenAI-style function/tool calling.
 *
 *   Ollama:    POST {baseUrl}/api/chat            (native shape, tools supported)
 *   LM Studio: POST {baseUrl}/v1/chat/completions (OpenAI shape)
 *
 * Uses the global `fetch` (Node 18+). Connection/HTTP failures are wrapped in
 * a friendly { status, message } so callers can surface them without a 500.
 */
const log = require('../../../server/core/logger').forLabel('ai-agent')
const net = require('net')

const TIMEOUT_MS = 120000

const trimSlash = (u) => (u || '').replace(/\/+$/, '')

const metadataHosts = new Set(['metadata.google.internal', 'metadata.google', 'instance-data'])

function isBlockedIp(hostname) {
  if (!net.isIP(hostname)) return false
  if (hostname === '::1' || hostname.startsWith('127.')) return false
  if (hostname.includes(':')) {
    const normalized = hostname.toLowerCase()
    return normalized.startsWith('fe80:') || normalized.startsWith('fc') || normalized.startsWith('fd')
  }
  const [a, b] = hostname.split('.').map(Number)
  return a === 0 || a === 10 || a === 169 && b === 254 || a === 172 && b >= 16 && b <= 31
    || a === 192 && b === 168 || a === 100 && b >= 64 && b <= 127 || a === 198 && (b === 18 || b === 19)
}

function validateBaseUrl(value) {
  let parsed
  try { parsed = new URL(value) } catch {
    throw { status: 400, message: 'LLM base URL must be a valid HTTP(S) URL.' }
  }
  if (!['http:', 'https:'].includes(parsed.protocol) || parsed.username || parsed.password) {
    throw { status: 400, message: 'LLM base URL must be an HTTP(S) URL without credentials.' }
  }
  const hostname = parsed.hostname.toLowerCase().replace(/^\[|\]$/g, '')
  if (metadataHosts.has(hostname) || hostname.endsWith('.internal') || isBlockedIp(hostname)) {
    throw { status: 400, message: 'LLM base URL must not target a private network or cloud metadata service.' }
  }
  return trimSlash(parsed.toString())
}

// LM Studio's OpenAI-compatible server is always rooted at `/v1`. Users often
// paste just `http://localhost:1234` (or copy a non-OpenAI path) — without the
// `/v1` the request hits LM Studio's native REST root, which returns 200 with
// no OpenAI `data`/`choices`, looking like a silent "0 models" success. Append
// `/v1` when no explicit /vN segment is present so it works either way.
const openaiBase = (u) => {
  const b = trimSlash(u)
  return /\/v\d+$/.test(b) ? b : `${b}/v1`
}

async function httpJson(url, options = {}) {
  const ctrl = new AbortController()
  const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS)
  let res
  try {
    res = await fetch(url, { ...options, signal: ctrl.signal })
  } catch (err) {
    log.warn(`LLM request to ${url} failed: ${err.message}`)
    const msg = err.name === 'AbortError'
      ? 'The model took too long to respond.'
      : `Could not reach the LLM at ${url}. Is the server running?`
    throw { status: 502, message: msg }
  } finally {
    clearTimeout(timer)
  }
  const text = await res.text()
  let body = null
  try { body = text ? JSON.parse(text) : null } catch { /* non-JSON */ }
  if (!res.ok) {
    const detail = body?.error?.message || body?.error || text || res.statusText
    throw { status: 502, message: `LLM error (${res.status}): ${detail}` }
  }
  return body
}

// ── Chat ────────────────────────────────────────────────────────────────────
// Returns an assistant message: { role:'assistant', content, tool_calls? }
// where each tool_call is { id, name, arguments(object) }.
async function chat({ settings, messages, tools }) {
  if (settings.provider === 'ollama') {
    const base = validateBaseUrl(settings.baseUrl)
    const data = await httpJson(`${base}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: settings.model,
        messages: toOllamaMessages(messages),
        tools,
        stream: false,
        options: { temperature: settings.temperature },
      }),
    })
    return normalizeOllama(data?.message)
  }

  // LM Studio (OpenAI-compatible)
  const base = openaiBase(validateBaseUrl(settings.baseUrl))
  const headers = { 'Content-Type': 'application/json' }
  if (settings.apiKey) headers.Authorization = `Bearer ${settings.apiKey}`
  const data = await httpJson(`${base}/chat/completions`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      model: settings.model,
      messages,
      tools,
      temperature: settings.temperature,
      stream: false,
    }),
  })
  return normalizeOpenAI(data?.choices?.[0]?.message)
}

// The agent keeps history in OpenAI format (assistant.tool_calls[].function
// .arguments as a JSON string). Ollama wants arguments as an object — convert.
function toOllamaMessages(messages) {
  return messages.map((m) => {
    if (m.role === 'assistant' && Array.isArray(m.tool_calls)) {
      return {
        role: 'assistant',
        content: m.content || '',
        tool_calls: m.tool_calls.map((tc) => ({
          function: {
            name: tc.function?.name,
            arguments: safeParse(tc.function?.arguments),
          },
        })),
      }
    }
    if (m.role === 'tool') {
      return { role: 'tool', content: m.content }
    }
    return m
  })
}

function normalizeOllama(message) {
  if (!message) return { role: 'assistant', content: '' }
  const toolCalls = (message.tool_calls || []).map((tc, i) => ({
    id: tc.id || `call_${i}`,
    name: tc.function?.name,
    // Ollama returns arguments as an object already
    arguments: typeof tc.function?.arguments === 'string'
      ? safeParse(tc.function.arguments)
      : (tc.function?.arguments || {}),
  }))
  return { role: 'assistant', content: message.content || '', tool_calls: toolCalls }
}

function normalizeOpenAI(message) {
  if (!message) return { role: 'assistant', content: '' }
  const toolCalls = (message.tool_calls || []).map((tc, i) => ({
    id: tc.id || `call_${i}`,
    name: tc.function?.name,
    arguments: safeParse(tc.function?.arguments),
  }))
  return { role: 'assistant', content: message.content || '', tool_calls: toolCalls }
}

function safeParse(s) {
  if (s == null) return {}
  if (typeof s === 'object') return s
  try { return JSON.parse(s) } catch { return {} }
}

// ── List models (connection test) ────────────────────────────────────────────
async function listModels({ provider, baseUrl, apiKey }) {
  if (provider === 'ollama') {
    const data = await httpJson(`${validateBaseUrl(baseUrl)}/api/tags`, { method: 'GET' })
    return (data?.models || []).map((m) => m.name).filter(Boolean)
  }
  const headers = {}
  if (apiKey) headers.Authorization = `Bearer ${apiKey}`
  const data = await httpJson(`${openaiBase(validateBaseUrl(baseUrl))}/models`, { method: 'GET', headers })
  return (data?.data || []).map((m) => m.id).filter(Boolean)
}

module.exports = { chat, listModels, validateBaseUrl }
