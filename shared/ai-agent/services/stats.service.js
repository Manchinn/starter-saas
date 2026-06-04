/**
 * Token-usage analytics for the AI dashboard.
 *
 * Usage is recorded per assistant message (see agent.service). We scope to the
 * caller's own conversations within their org, fetch the (bounded) set of
 * usage-bearing assistant turns, and aggregate in JS so the result is portable
 * across SQLite / MySQL without dialect-specific date functions.
 */
const { Op } = require('sequelize')
const { AiConversation, AiMessage } = require('../../../server/models')

const DAILY_WINDOW = 14   // days of history in the daily series
const TOP_CONVERSATIONS = 5

// Local-time YYYY-MM-DD key for a date (en-CA renders ISO-style).
const dayKey = (d) => new Date(d).toLocaleDateString('en-CA')

const tokenStats = async (user) => {
  const { id: userId, organizationId } = user

  // The user's conversations (scoped to org) — also gives us titles for the
  // top-conversations breakdown.
  const convs = await AiConversation.findAll({
    where: { userId, organizationId },
    attributes: ['id', 'title', 'updatedAt'],
  })
  const convById = new Map(convs.map((c) => [c.id, c]))
  const convIds = convs.map((c) => c.id)

  const empty = {
    totals: { totalTokens: 0, promptTokens: 0, completionTokens: 0, messages: 0, conversations: 0 },
    today: { totalTokens: 0, messages: 0 },
    daily: buildDailySeries([]),
    byModel: [],
    topConversations: [],
  }
  if (!convIds.length) return empty

  // Only assistant turns that actually recorded usage.
  const rows = await AiMessage.findAll({
    where: {
      conversationId: { [Op.in]: convIds },
      role: 'assistant',
      totalTokens: { [Op.gt]: 0 },
    },
    attributes: ['conversationId', 'model', 'promptTokens', 'completionTokens', 'totalTokens', 'createdAt'],
    order: [['createdAt', 'ASC']],
  })

  const totals = { totalTokens: 0, promptTokens: 0, completionTokens: 0, messages: 0, conversations: convs.length }
  const today = { totalTokens: 0, messages: 0 }
  const todayKey = dayKey(new Date())
  const byDay = new Map()
  const byModel = new Map()
  const byConv = new Map()

  for (const r of rows) {
    const total = r.totalTokens || 0
    const prompt = r.promptTokens || 0
    const completion = r.completionTokens || 0

    totals.totalTokens += total
    totals.promptTokens += prompt
    totals.completionTokens += completion
    totals.messages += 1

    const k = dayKey(r.createdAt)
    if (k === todayKey) { today.totalTokens += total; today.messages += 1 }

    const day = byDay.get(k) || { date: k, promptTokens: 0, completionTokens: 0, totalTokens: 0 }
    day.promptTokens += prompt
    day.completionTokens += completion
    day.totalTokens += total
    byDay.set(k, day)

    const modelName = r.model || 'unknown'
    const m = byModel.get(modelName) || { model: modelName, totalTokens: 0, messages: 0 }
    m.totalTokens += total
    m.messages += 1
    byModel.set(modelName, m)

    const c = byConv.get(r.conversationId) || { totalTokens: 0, messages: 0 }
    c.totalTokens += total
    c.messages += 1
    byConv.set(r.conversationId, c)
  }

  const topConversations = [...byConv.entries()]
    .map(([id, agg]) => ({
      id,
      title: convById.get(id)?.title || 'Untitled',
      updatedAt: convById.get(id)?.updatedAt,
      totalTokens: agg.totalTokens,
      messages: agg.messages,
    }))
    .sort((a, b) => b.totalTokens - a.totalTokens)
    .slice(0, TOP_CONVERSATIONS)

  return {
    totals,
    today,
    daily: buildDailySeries(byDay),
    byModel: [...byModel.values()].sort((a, b) => b.totalTokens - a.totalTokens),
    topConversations,
  }
}

// Dense DAILY_WINDOW-day series ending today; missing days are zero-filled so
// the chart has no gaps.
function buildDailySeries(byDay) {
  const out = []
  const now = new Date()
  for (let i = DAILY_WINDOW - 1; i >= 0; i--) {
    const d = new Date(now)
    d.setDate(now.getDate() - i)
    const k = dayKey(d)
    const found = byDay.get ? byDay.get(k) : null
    out.push(found || { date: k, promptTokens: 0, completionTokens: 0, totalTokens: 0 })
  }
  return out
}

module.exports = { tokenStats }
