/**
 * Agent orchestration — drives the LLM <-> tool loop.
 *
 * Conversation history is kept in OpenAI message format internally; the
 * provider service converts as needed per backend.
 */
const { AiConversation, AiMessage } = require('../../../server/models')
const settingsSvc = require('./settings.service')
const provider = require('./provider.service')
const toolsRegistry = require('./tools')

const MAX_ITERATIONS = 5
const HISTORY_LIMIT = 20   // prior turns fed back to the model

// Always-on guardrail appended to the system prompt (even when the user has
// customized it). Stops the model from fabricating figures — every numeric /
// business answer must come from a tool result, not the model's imagination.
const DATA_INTEGRITY_DIRECTIVE =
  '\n\nIMPORTANT — data integrity: Base every factual answer only on data returned by a tool. '
  + 'For any request about metrics, counts, money, sales, AR/AP, VAT, inventory, customers, products, '
  + 'orders, or any business figures — including summaries and executive briefings — you MUST call the '
  + 'relevant tool first and report ONLY the values it returns. Never invent, estimate, guess, or use '
  + 'placeholder/example numbers. If a tool returns zero or no data, say so honestly. If no tool covers '
  + 'the question, say you do not have that data rather than making something up.'

// Map the UI locale to a directive appended to the system prompt so the model
// replies in the user's selected language even when tool data is in English.
const LANG_NAMES = { en: 'English', th: 'Thai' }
const langDirective = (lang) => {
  const name = LANG_NAMES[lang]
  return name
    ? `\n\nAlways write your replies to the user in ${name}, regardless of the language of the data or tool results.`
    : ''
}

// ── Conversation persistence ──────────────────────────────────────────────────

const ensureConversation = async (user, conversationId) => {
  const { id: userId, organizationId } = user
  if (conversationId) {
    const conv = await AiConversation.findOne({ where: { id: conversationId, userId, organizationId } })
    if (!conv) throw { status: 404, message: 'Conversation not found' }
    return conv
  }
  return AiConversation.create({ userId, title: 'New chat', organizationId, createdBy: userId, modifiedBy: userId })
}

const titleFrom = (text) => {
  const t = (text || '').trim().replace(/\s+/g, ' ')
  return t.length > 60 ? `${t.slice(0, 57)}…` : (t || 'New chat')
}

// Build the OpenAI-format message list for the model: system + stored history.
const buildBaseMessages = async (settings, conversationId) => {
  const history = await AiMessage.findAll({
    where: { conversationId },
    order: [['createdAt', 'ASC']],
    limit: HISTORY_LIMIT,
  })
  const messages = [{ role: 'system', content: settings.systemPrompt }]
  for (const m of history) {
    messages.push({ role: m.role, content: m.content || '' })
  }
  return messages
}

// ── Main entry ────────────────────────────────────────────────────────────────

const chat = async ({ user, conversationId, content, lang }) => {
  if (!content || !content.trim()) throw { status: 400, message: 'Message is required' }

  const settings = await settingsSvc.getRaw(user.id, user.organizationId)
  if (!settings.enabled) {
    throw { status: 400, message: 'The AI assistant is disabled. Enable it in Settings.' }
  }

  const conv = await ensureConversation(user, conversationId)

  const messages = await buildBaseMessages(settings, conv.id)
  // Reinforce the system prompt (first message): always enforce data integrity,
  // and steer the reply language to the user's UI locale.
  if (messages[0]?.role === 'system') {
    messages[0] = {
      role: 'system',
      content: messages[0].content + DATA_INTEGRITY_DIRECTIVE + langDirective(lang),
    }
  }
  messages.push({ role: 'user', content })

  const actions = []
  let reply = ''

  for (let i = 0; i < MAX_ITERATIONS; i++) {
    const assistant = await provider.chat({
      settings,
      messages,
      tools: toolsRegistry.schemas(),
    })

    const toolCalls = assistant.tool_calls || []

    // Re-append the assistant turn in OpenAI format so the next round has context.
    messages.push({
      role: 'assistant',
      content: assistant.content || '',
      ...(toolCalls.length && {
        tool_calls: toolCalls.map((tc) => ({
          id: tc.id,
          type: 'function',
          function: { name: tc.name, arguments: JSON.stringify(tc.arguments || {}) },
        })),
      }),
    })

    if (!toolCalls.length) {
      reply = assistant.content || ''
      break
    }

    for (const tc of toolCalls) {
      const { content: toolContent, action } = await toolsRegistry.execute(tc.name, tc.arguments, { user })
      if (action) actions.push(action)
      messages.push({ role: 'tool', tool_call_id: tc.id, content: toolContent })
    }

    // Safety: if we hit the cap mid-tool-loop, surface the assistant's last words.
    if (i === MAX_ITERATIONS - 1) {
      reply = assistant.content || 'Done.'
    }
  }

  // Persist the user + assistant turns (transient tool turns are not stored).
  const msgMeta = { conversationId: conv.id, organizationId: user.organizationId, createdBy: user.id, modifiedBy: user.id }
  await AiMessage.create({ ...msgMeta, role: 'user', content })
  const assistantRow = await AiMessage.create({
    ...msgMeta,
    role: 'assistant',
    content: reply,
    actions: actions.length ? JSON.stringify(actions) : null,
  })

  // First user message names the thread.
  if (conv.title === 'New chat') {
    conv.title = titleFrom(content)
    conv.modifiedBy = user.id
    await conv.save()
  }

  return {
    conversationId: conv.id,
    title: conv.title,
    message: { id: assistantRow.id, role: 'assistant', content: reply, actions },
  }
}

// ── Conversation listing ──────────────────────────────────────────────────────

const listConversations = async (user) => {
  const { id: userId, organizationId } = user
  const rows = await AiConversation.findAll({
    where: { userId, organizationId },
    order: [['updatedAt', 'DESC']],
    limit: 50,
  })
  return rows.map((c) => ({ id: c.id, title: c.title, updatedAt: c.updatedAt }))
}

const getConversation = async (user, id) => {
  const { id: userId, organizationId } = user
  const conv = await AiConversation.findOne({ where: { id, userId, organizationId } })
  if (!conv) throw { status: 404, message: 'Conversation not found' }
  const rows = await AiMessage.findAll({ where: { conversationId: id }, order: [['createdAt', 'ASC']] })
  return {
    id: conv.id,
    title: conv.title,
    messages: rows.map((m) => ({
      id: m.id,
      role: m.role,
      content: m.content,
      actions: m.actions ? safeParse(m.actions) : [],
      createdAt: m.createdAt,
    })),
  }
}

const removeConversation = async (user, id) => {
  const { id: userId, organizationId } = user
  const conv = await AiConversation.findOne({ where: { id, userId, organizationId } })
  if (!conv) throw { status: 404, message: 'Conversation not found' }
  await AiMessage.destroy({ where: { conversationId: id } })
  await conv.destroy()
}

const safeParse = (s) => { try { return JSON.parse(s) } catch { return [] } }

module.exports = { chat, listConversations, getConversation, removeConversation }
