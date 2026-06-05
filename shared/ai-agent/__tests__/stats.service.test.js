jest.mock('../../../server/models', () => ({
  AiConversation: { findAll: jest.fn() },
  AiMessage: { findAll: jest.fn() },
}))

const { AiConversation, AiMessage } = require('../../../server/models')
const stats = require('../services/stats.service')

const USER = { id: 'u1', organizationId: 'o1' }
const todayIso = new Date().toISOString()

beforeEach(() => jest.clearAllMocks())

describe('stats.tokenStats', () => {
  test('returns a zeroed shape with a dense daily series when there are no conversations', async () => {
    AiConversation.findAll.mockResolvedValue([])

    const out = await stats.tokenStats(USER)

    expect(out.totals.totalTokens).toBe(0)
    expect(out.byModel).toEqual([])
    expect(out.topConversations).toEqual([])
    expect(out.daily).toHaveLength(14)
    expect(AiMessage.findAll).not.toHaveBeenCalled()
  })

  test('aggregates totals, per-model and top conversations from assistant usage rows', async () => {
    AiConversation.findAll.mockResolvedValue([
      { id: 'c1', title: 'Sales chat', updatedAt: todayIso },
      { id: 'c2', title: 'Inventory chat', updatedAt: todayIso },
    ])
    AiMessage.findAll.mockResolvedValue([
      { conversationId: 'c1', model: 'llama3.1', promptTokens: 100, completionTokens: 20, totalTokens: 120, createdAt: todayIso },
      { conversationId: 'c1', model: 'llama3.1', promptTokens: 200, completionTokens: 30, totalTokens: 230, createdAt: todayIso },
      { conversationId: 'c2', model: 'qwen2.5',  promptTokens: 50,  completionTokens: 10, totalTokens: 60,  createdAt: todayIso },
    ])

    const out = await stats.tokenStats(USER)

    expect(out.totals).toMatchObject({ totalTokens: 410, promptTokens: 350, completionTokens: 60, messages: 3, conversations: 2 })
    expect(out.today.totalTokens).toBe(410)

    // Models sorted by usage desc.
    expect(out.byModel.map((m) => m.model)).toEqual(['llama3.1', 'qwen2.5'])
    expect(out.byModel[0]).toMatchObject({ totalTokens: 350, messages: 2 })

    // Top conversation is c1 (350 > 60), titled and message-counted.
    expect(out.topConversations[0]).toMatchObject({ id: 'c1', title: 'Sales chat', totalTokens: 350, messages: 2 })

    // The query is scoped to usage-bearing assistant turns in the user's convs.
    const where = AiMessage.findAll.mock.calls[0][0].where
    expect(where.role).toBe('assistant')

    // Today's bucket in the daily series carries the full total.
    expect(out.daily[out.daily.length - 1].totalTokens).toBe(410)
  })
})
