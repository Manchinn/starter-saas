const provider = require('../services/provider.service')

const jsonRes = (obj) => ({ ok: true, status: 200, statusText: 'OK', text: async () => JSON.stringify(obj) })

afterEach(() => { jest.restoreAllMocks(); delete global.fetch })

describe('provider.chat — Ollama', () => {
  test('posts to /api/chat with stream:false + temperature, normalizes tool_calls', async () => {
    global.fetch = jest.fn().mockResolvedValue(jsonRes({
      message: { content: 'hi', tool_calls: [{ function: { name: 'navigate', arguments: { target: 'products_list' } } }] },
    }))

    const out = await provider.chat({
      settings: { provider: 'ollama', baseUrl: 'http://host:11434', model: 'llama3.1', temperature: 0.2 },
      messages: [{ role: 'user', content: 'hi' }],
      tools: [],
    })

    const [url, opts] = global.fetch.mock.calls[0]
    expect(url).toBe('http://host:11434/api/chat')
    const body = JSON.parse(opts.body)
    expect(body.stream).toBe(false)
    expect(body.options.temperature).toBe(0.2)

    expect(out.tool_calls).toHaveLength(1)
    expect(out.tool_calls[0].name).toBe('navigate')
    expect(out.tool_calls[0].arguments).toEqual({ target: 'products_list' })
  })

  test('converts OpenAI-format history (string args, tool_call_id) to Ollama shape', async () => {
    global.fetch = jest.fn().mockResolvedValue(jsonRes({ message: { content: 'ok' } }))

    await provider.chat({
      settings: { provider: 'ollama', baseUrl: 'http://host:11434', model: 'm', temperature: 0 },
      messages: [
        { role: 'assistant', content: '', tool_calls: [{ id: 't1', type: 'function', function: { name: 'navigate', arguments: '{"target":"dashboard"}' } }] },
        { role: 'tool', tool_call_id: 't1', content: 'Opened Dashboard.' },
      ],
      tools: [],
    })

    const body = JSON.parse(global.fetch.mock.calls[0][1].body)
    // arguments parsed back to an object for Ollama
    expect(body.messages[0].tool_calls[0].function.arguments).toEqual({ target: 'dashboard' })
    // tool message carries no tool_call_id in Ollama shape
    expect(body.messages[1]).toEqual({ role: 'tool', content: 'Opened Dashboard.' })
  })
})

describe('provider.chat — LM Studio', () => {
  test('posts to /chat/completions with bearer auth, normalizes string tool args', async () => {
    global.fetch = jest.fn().mockResolvedValue(jsonRes({
      choices: [{ message: { content: 'yo', tool_calls: [{ id: 'a', function: { name: 'create_product', arguments: '{"name":"Widget"}' } }] } }],
    }))

    const out = await provider.chat({
      settings: { provider: 'lmstudio', baseUrl: 'http://host:1234/v1', model: 'm', temperature: 0.5, apiKey: 'secret' },
      messages: [],
      tools: [],
    })

    const [url, opts] = global.fetch.mock.calls[0]
    expect(url).toBe('http://host:1234/v1/chat/completions')
    expect(opts.headers.Authorization).toBe('Bearer secret')

    expect(out.tool_calls[0].name).toBe('create_product')
    expect(out.tool_calls[0].arguments).toEqual({ name: 'Widget' })
  })
})

describe('provider.listModels', () => {
  test('Ollama maps /api/tags names', async () => {
    global.fetch = jest.fn().mockResolvedValue(jsonRes({ models: [{ name: 'llama3.1' }, { name: 'qwen2.5' }] }))
    const out = await provider.listModels({ provider: 'ollama', baseUrl: 'http://host:11434' })
    expect(global.fetch.mock.calls[0][0]).toBe('http://host:11434/api/tags')
    expect(out).toEqual(['llama3.1', 'qwen2.5'])
  })

  test('LM Studio maps /models ids', async () => {
    global.fetch = jest.fn().mockResolvedValue(jsonRes({ data: [{ id: 'local-model' }] }))
    const out = await provider.listModels({ provider: 'lmstudio', baseUrl: 'http://host:1234/v1' })
    expect(global.fetch.mock.calls[0][0]).toBe('http://host:1234/v1/models')
    expect(out).toEqual(['local-model'])
  })

  test('wraps connection failures as a friendly 502', async () => {
    global.fetch = jest.fn().mockRejectedValue(new Error('ECONNREFUSED'))
    await expect(provider.listModels({ provider: 'ollama', baseUrl: 'http://host:11434' }))
      .rejects.toMatchObject({ status: 502 })
  })
})
