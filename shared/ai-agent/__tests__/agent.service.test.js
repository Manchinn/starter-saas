jest.mock('../../../server/models', () => ({
  AiConversation: { findOne: jest.fn(), create: jest.fn(), findAll: jest.fn(), destroy: jest.fn() },
  AiMessage: { findAll: jest.fn(), create: jest.fn(), destroy: jest.fn() },
}))
jest.mock('../services/settings.service')
jest.mock('../services/provider.service')
// ERP services the tools lazily require — mock at the resolved module path.
jest.mock('../../erp/products/services/product.service', () => ({ create: jest.fn(), list: jest.fn() }))
jest.mock('../../erp/customers/services/customer.service', () => ({ create: jest.fn(), list: jest.fn() }))

const { AiConversation, AiMessage } = require('../../../server/models')
const settingsSvc = require('../services/settings.service')
const provider = require('../services/provider.service')
const productSvc = require('../../erp/products/services/product.service')
const agent = require('../services/agent.service')

// Permissions are resolved at the controller and threaded into the agent so
// tool execution enforces RBAC; '*' (system admin) clears every tool gate.
const USER = { id: 'u1', organizationId: 'o1', permissions: ['*'] }

beforeEach(() => {
  jest.clearAllMocks()
  settingsSvc.getRaw.mockResolvedValue({ enabled: true, systemPrompt: 'sys', provider: 'ollama' })
  AiMessage.findAll.mockResolvedValue([])
  AiConversation.create.mockResolvedValue({ id: 'c1', title: 'New chat', save: jest.fn() })
  AiMessage.create.mockImplementation(async (row) => ({ id: 'm-' + row.role, ...row }))
})

describe('agent.chat — tool loop', () => {
  test('executes a server tool (create_product) and feeds the result back to the model', async () => {
    productSvc.create.mockResolvedValue({ id: 'p1', name: 'Widget', sku: 'PRD-1' })

    provider.chat
      // round 1: model asks to create a product
      .mockResolvedValueOnce({ role: 'assistant', content: '', tool_calls: [
        { id: 't1', name: 'create_product', arguments: { name: 'Widget' } },
      ] })
      // round 2: model produces the final answer
      .mockResolvedValueOnce({ role: 'assistant', content: 'Created Widget.', tool_calls: [] })

    const res = await agent.chat({ user: USER, conversationId: null, content: 'add a product called Widget' })

    // tool ran with the org-scoped user context
    expect(productSvc.create).toHaveBeenCalledWith(expect.objectContaining({
      name: 'Widget', userId: 'u1', organizationId: 'o1',
    }))
    // model was called twice (tool round + final round)
    expect(provider.chat).toHaveBeenCalledTimes(2)
    // the second call's messages include the tool result fed back
    const secondCallMessages = provider.chat.mock.calls[1][0].messages
    const toolMsg = secondCallMessages.find((m) => m.role === 'tool')
    expect(toolMsg).toBeTruthy()
    expect(toolMsg.content).toContain('Widget')

    // final reply + a client action surfaced to the UI
    expect(res.message.content).toBe('Created Widget.')
    expect(res.message.actions.some((a) => a.type === 'navigate')).toBe(true)
  })

  test('a tool the caller lacks permission for is refused — no service call, told to the model', async () => {
    const LIMITED = { id: 'u2', organizationId: 'o1', permissions: ['erp.products.list'] }
    provider.chat
      .mockResolvedValueOnce({ role: 'assistant', content: '', tool_calls: [
        { id: 't1', name: 'create_product', arguments: { name: 'Widget' } },
      ] })
      .mockResolvedValueOnce({ role: 'assistant', content: 'You are not allowed to do that.', tool_calls: [] })

    const res = await agent.chat({ user: LIMITED, conversationId: null, content: 'add a product called Widget' })

    // the underlying service is never reached
    expect(productSvc.create).not.toHaveBeenCalled()
    // the denial is fed back to the model as the tool result
    const toolMsg = provider.chat.mock.calls[1][0].messages.find((m) => m.role === 'tool')
    expect(toolMsg.content).toMatch(/permission denied/i)
    expect(toolMsg.content).toContain('erp.products.edit')
    expect(res.message.content).toBe('You are not allowed to do that.')
  })

  test('navigate is a client tool — produces an action, writes no data', async () => {
    provider.chat
      .mockResolvedValueOnce({ role: 'assistant', content: '', tool_calls: [
        { id: 't1', name: 'navigate', arguments: { target: 'products_list' } },
      ] })
      .mockResolvedValueOnce({ role: 'assistant', content: 'Opened it.', tool_calls: [] })

    const res = await agent.chat({ user: USER, conversationId: null, content: 'open the product list' })

    expect(productSvc.create).not.toHaveBeenCalled()
    expect(res.message.actions).toEqual([
      expect.objectContaining({ type: 'navigate', target: 'products_list', path: '/erp/item-master' }),
    ])
  })

  test('lang steers the reply language via a system-prompt directive', async () => {
    provider.chat.mockResolvedValueOnce({ role: 'assistant', content: 'สวัสดี', tool_calls: [] })

    await agent.chat({ user: USER, conversationId: null, content: 'hi', lang: 'th' })

    const sys = provider.chat.mock.calls[0][0].messages.find((m) => m.role === 'system')
    expect(sys.content).toContain('Thai')
  })

  test('keeps the base system prompt and adds no language directive when lang is absent', async () => {
    provider.chat.mockResolvedValueOnce({ role: 'assistant', content: 'hi', tool_calls: [] })

    await agent.chat({ user: USER, conversationId: null, content: 'hi' })

    const sys = provider.chat.mock.calls[0][0].messages.find((m) => m.role === 'system')
    expect(sys.content).toMatch(/^sys/)
    expect(sys.content).not.toContain('Thai')
    expect(sys.content).not.toContain('English')
  })

  test('always appends the data-integrity guardrail (anti-hallucination)', async () => {
    provider.chat.mockResolvedValueOnce({ role: 'assistant', content: 'hi', tool_calls: [] })

    await agent.chat({ user: USER, conversationId: null, content: 'how are sales?' })

    const sys = provider.chat.mock.calls[0][0].messages.find((m) => m.role === 'system')
    expect(sys.content).toMatch(/data integrity/i)
    expect(sys.content).toMatch(/only the values it returns/i)
  })

  test('sums provider token usage across the tool loop and persists it on the assistant turn', async () => {
    productSvc.create.mockResolvedValue({ id: 'p1', name: 'Widget' })
    provider.chat
      .mockResolvedValueOnce({ role: 'assistant', content: '', model: 'llama3.1',
        tool_calls: [{ id: 't1', name: 'create_product', arguments: { name: 'Widget' } }],
        usage: { promptTokens: 100, completionTokens: 20 } })
      .mockResolvedValueOnce({ role: 'assistant', content: 'Created Widget.', tool_calls: [],
        model: 'llama3.1', usage: { promptTokens: 150, completionTokens: 30 } })

    await agent.chat({ user: USER, content: 'add a product called Widget' })

    const assistantRow = AiMessage.create.mock.calls.map((c) => c[0]).find((r) => r.role === 'assistant')
    expect(assistantRow).toMatchObject({
      model: 'llama3.1',
      promptTokens: 250,
      completionTokens: 50,
      totalTokens: 300,
    })
  })

  test('leaves token fields null when the provider reports no usage', async () => {
    provider.chat.mockResolvedValueOnce({ role: 'assistant', content: 'hi', tool_calls: [] })

    await agent.chat({ user: USER, content: 'hi' })

    const assistantRow = AiMessage.create.mock.calls.map((c) => c[0]).find((r) => r.role === 'assistant')
    expect(assistantRow).toMatchObject({ totalTokens: null, promptTokens: null, model: null })
  })

  test('rejects when the assistant is disabled', async () => {
    settingsSvc.getRaw.mockResolvedValue({ enabled: false, systemPrompt: 'sys' })
    await expect(agent.chat({ user: USER, content: 'hi' })).rejects.toMatchObject({ status: 400 })
    expect(provider.chat).not.toHaveBeenCalled()
  })

  test('a failing tool is reported back to the model, not thrown', async () => {
    productSvc.create.mockRejectedValue({ message: 'SKU already exists' })
    provider.chat
      .mockResolvedValueOnce({ role: 'assistant', content: '', tool_calls: [
        { id: 't1', name: 'create_product', arguments: { name: 'Dup' } },
      ] })
      .mockResolvedValueOnce({ role: 'assistant', content: 'Sorry, that SKU exists.', tool_calls: [] })

    const res = await agent.chat({ user: USER, content: 'add Dup' })
    const toolMsg = provider.chat.mock.calls[1][0].messages.find((m) => m.role === 'tool')
    expect(toolMsg.content).toContain('SKU already exists')
    expect(res.message.content).toBe('Sorry, that SKU exists.')
  })
})

describe('conversation ownership — cross-user/org isolation (IDOR)', () => {
  const OTHER = { id: 'intruder', organizationId: 'o1' }

  test('chat against an unowned conversationId is rejected 404 before any model call', async () => {
    AiConversation.findOne.mockResolvedValue(null) // not found under this user+org
    await expect(agent.chat({ user: OTHER, conversationId: 'someone-elses', content: 'hi' }))
      .rejects.toMatchObject({ status: 404, message: 'Conversation not found' })
    // the lookup is scoped to the caller's identity, and no LLM round-trip happens
    expect(AiConversation.findOne).toHaveBeenCalledWith({
      where: { id: 'someone-elses', userId: 'intruder', organizationId: 'o1' },
    })
    expect(provider.chat).not.toHaveBeenCalled()
  })

  test('getConversation scopes by user+org and 404s on a foreign id', async () => {
    AiConversation.findOne.mockResolvedValue(null)
    await expect(agent.getConversation(OTHER, 'foreign')).rejects.toMatchObject({ status: 404 })
    expect(AiConversation.findOne).toHaveBeenCalledWith({
      where: { id: 'foreign', userId: 'intruder', organizationId: 'o1' },
    })
    expect(AiMessage.findAll).not.toHaveBeenCalled()
  })

  test('removeConversation 404s on a foreign id and deletes nothing', async () => {
    AiConversation.findOne.mockResolvedValue(null)
    await expect(agent.removeConversation(OTHER, 'foreign')).rejects.toMatchObject({ status: 404 })
    expect(AiMessage.destroy).not.toHaveBeenCalled()
    expect(AiConversation.destroy).not.toHaveBeenCalled()
  })
})

describe('removeAllConversations', () => {
  test('deletes every conversation and its messages, scoped to the user/org', async () => {
    AiConversation.findAll.mockResolvedValue([{ id: 'c1' }, { id: 'c2' }])

    const out = await agent.removeAllConversations(USER)

    expect(AiMessage.destroy).toHaveBeenCalledWith({ where: { conversationId: ['c1', 'c2'] } })
    expect(AiConversation.destroy).toHaveBeenCalledWith({ where: { userId: 'u1', organizationId: 'o1' } })
    expect(out).toEqual({ deleted: 2 })
  })

  test('is a no-op when there is no history', async () => {
    AiConversation.findAll.mockResolvedValue([])

    const out = await agent.removeAllConversations(USER)

    expect(out).toEqual({ deleted: 0 })
    expect(AiMessage.destroy).not.toHaveBeenCalled()
    expect(AiConversation.destroy).not.toHaveBeenCalled()
  })
})
