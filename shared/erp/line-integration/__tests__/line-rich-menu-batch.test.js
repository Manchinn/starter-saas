/**
 * LINE rich menu batch/bulk service boundaries (mocked collaborators).
 *
 * 1. Bulk link/unlink — user-level, 1-500 userIds per call.
 * 2. Batch submit — menu-level ops (link/unlink/unlinkAll), returns requestId from header.
 * 3. Batch validate — same shape as submit, no side effects.
 * 4. Batch progress — poll phase/acceptedTime/completedTime by requestId.
 *
 * Note: jest resetMocks wipes implementations each test; armMockClient() in
 * beforeEach re-wires fromChannelAccessToken for every suite.
 */

jest.mock('../../../../server/config/config', () => ({
  line: { credentialEncryptionKey: Buffer.alloc(32, 7).toString('base64') },
  db: { dialect: 'sqlite', storage: ':memory:' },
}))

jest.mock('../../../../server/models', () => ({
  LineConnection: { findOne: jest.fn() },
}))

jest.mock('../services/line.crypto', () => ({
  decrypt: jest.fn((v) => v),
}))

jest.mock('@line/bot-sdk', () => ({
  LineBotClient: {
    fromChannelAccessToken: jest.fn(),
  },
}))

const { LineConnection } = require('../../../../server/models')
const sdk = require('@line/bot-sdk')

const {
  bulkLinkRichMenu,
  bulkUnlinkRichMenu,
  submitRichMenuBatch,
  validateRichMenuBatchRequest,
  getRichMenuBatchProgress,
} = require('../services/line-rich-menu.service')

const ORG_ID = 'org-1'
const RICH_MENU_ID = 'richmenu-test-123'
const REQUEST_ID = 'req-abc-123'

const connection = {
  id: 'conn-1',
  organizationId: ORG_ID,
  isActive: true,
  channelAccessTokenEncrypted: 'encrypted-token',
}

function mockClient() {
  return sdk.LineBotClient.fromChannelAccessToken()
}

function armMockClient() {
  const mc = {
    linkRichMenuIdToUsers: jest.fn(),
    unlinkRichMenuIdFromUsers: jest.fn(),
    richMenuBatchWithHttpInfo: jest.fn(),
    validateRichMenuBatchRequest: jest.fn(),
    getRichMenuBatchProgress: jest.fn(),
  }
  sdk.LineBotClient.fromChannelAccessToken.mockReturnValue(mc)
  return mc
}

beforeEach(() => {
  LineConnection.findOne.mockResolvedValue(connection)
  armMockClient()
})

// ---- helpers ----

function makeUserIds(n) {
  return Array.from({ length: n }, (_, i) => `U${String(i).padStart(4, '0')}`)
}

const validBatchRequest = {
  operations: [
    { type: 'link', from: RICH_MENU_ID, to: 'richmenu-target-456' },
  ],
}

const validBatchWithKey = {
  ...validBatchRequest,
  resumeRequestKey: 'resume-key-001',
}

// ---- bulkLinkRichMenu ----

describe('bulkLinkRichMenu', () => {
  test('calls linkRichMenuIdToUsers and returns count', async () => {
    const userIds = makeUserIds(3)
    mockClient().linkRichMenuIdToUsers = jest.fn().mockResolvedValue({})
    const result = await bulkLinkRichMenu(ORG_ID, RICH_MENU_ID, userIds)
    expect(mockClient().linkRichMenuIdToUsers).toHaveBeenCalledWith({ richMenuId: RICH_MENU_ID, userIds })
    expect(result).toEqual({ linked: true, count: 3 })
  })

  test('accepts exactly 500 userIds', async () => {
    const userIds = makeUserIds(500)
    mockClient().linkRichMenuIdToUsers = jest.fn().mockResolvedValue({})
    const result = await bulkLinkRichMenu(ORG_ID, RICH_MENU_ID, userIds)
    expect(result.count).toBe(500)
  })

  test('rejects empty userIds array', async () => {
    await expect(bulkLinkRichMenu(ORG_ID, RICH_MENU_ID, [])).rejects.toMatchObject({
      status: 400,
      message: expect.stringMatching(/non-empty/i),
    })
  })

  test('rejects userIds exceeding 500', async () => {
    await expect(bulkLinkRichMenu(ORG_ID, RICH_MENU_ID, makeUserIds(501))).rejects.toMatchObject({
      status: 400,
      message: expect.stringMatching(/500/),
    })
  })

  test('rejects non-array userIds', async () => {
    await expect(bulkLinkRichMenu(ORG_ID, RICH_MENU_ID, 'U123')).rejects.toMatchObject({
      status: 400,
    })
  })

  test('propagates SDK error', async () => {
    mockClient().linkRichMenuIdToUsers = jest.fn().mockRejectedValue({ status: 429, message: 'Rate limit' })
    await expect(bulkLinkRichMenu(ORG_ID, RICH_MENU_ID, makeUserIds(1))).rejects.toMatchObject({ status: 429 })
  })

  test('throws 404 when no connection exists', async () => {
    LineConnection.findOne.mockResolvedValue(null)
    await expect(bulkLinkRichMenu(ORG_ID, RICH_MENU_ID, makeUserIds(1))).rejects.toMatchObject({ status: 404 })
  })
})

// ---- bulkUnlinkRichMenu ----

describe('bulkUnlinkRichMenu', () => {
  test('calls unlinkRichMenuIdFromUsers and returns count', async () => {
    const userIds = makeUserIds(2)
    mockClient().unlinkRichMenuIdFromUsers = jest.fn().mockResolvedValue({})
    const result = await bulkUnlinkRichMenu(ORG_ID, userIds)
    expect(mockClient().unlinkRichMenuIdFromUsers).toHaveBeenCalledWith({ userIds })
    expect(result).toEqual({ unlinked: true, count: 2 })
  })

  test('accepts exactly 500 userIds', async () => {
    const userIds = makeUserIds(500)
    mockClient().unlinkRichMenuIdFromUsers = jest.fn().mockResolvedValue({})
    const result = await bulkUnlinkRichMenu(ORG_ID, userIds)
    expect(result.count).toBe(500)
  })

  test('rejects empty userIds array', async () => {
    await expect(bulkUnlinkRichMenu(ORG_ID, [])).rejects.toMatchObject({
      status: 400,
      message: expect.stringMatching(/non-empty/i),
    })
  })

  test('rejects userIds exceeding 500', async () => {
    await expect(bulkUnlinkRichMenu(ORG_ID, makeUserIds(501))).rejects.toMatchObject({
      status: 400,
      message: expect.stringMatching(/500/),
    })
  })

  test('propagates SDK error', async () => {
    mockClient().unlinkRichMenuIdFromUsers = jest.fn().mockRejectedValue({ status: 500, message: 'Internal' })
    await expect(bulkUnlinkRichMenu(ORG_ID, makeUserIds(1))).rejects.toMatchObject({ status: 500 })
  })
})

// ---- submitRichMenuBatch ----

describe('submitRichMenuBatch', () => {
  function makeHttpResponse(headers = {}) {
    return {
      httpResponse: { headers: { get: (k) => headers[k] ?? null } },
      body: {},
    }
  }

  test('returns requestId from x-line-request-id header', async () => {
    mockClient().richMenuBatchWithHttpInfo = jest.fn().mockResolvedValue(
      makeHttpResponse({ 'x-line-request-id': REQUEST_ID }),
    )
    const result = await submitRichMenuBatch(ORG_ID, validBatchRequest)
    expect(result).toEqual({ requestId: REQUEST_ID })
  })

  test('returns null requestId when header absent', async () => {
    mockClient().richMenuBatchWithHttpInfo = jest.fn().mockResolvedValue(makeHttpResponse())
    const result = await submitRichMenuBatch(ORG_ID, validBatchRequest)
    expect(result).toEqual({ requestId: null })
  })

  test('passes full batchRequest to SDK', async () => {
    mockClient().richMenuBatchWithHttpInfo = jest.fn().mockResolvedValue(
      makeHttpResponse({ 'x-line-request-id': REQUEST_ID }),
    )
    await submitRichMenuBatch(ORG_ID, validBatchWithKey)
    expect(mockClient().richMenuBatchWithHttpInfo).toHaveBeenCalledWith(validBatchWithKey)
  })

  test('rejects empty operations array', async () => {
    await expect(submitRichMenuBatch(ORG_ID, { operations: [] })).rejects.toMatchObject({
      status: 400,
      message: expect.stringMatching(/operations/i),
    })
  })

  test('rejects operations exceeding 1000', async () => {
    const ops = Array.from({ length: 1001 }, () => ({ type: 'link', from: 'a', to: 'b' }))
    await expect(submitRichMenuBatch(ORG_ID, { operations: ops })).rejects.toMatchObject({
      status: 400,
      message: expect.stringMatching(/1000/),
    })
  })

  test('rejects link op without from/to', async () => {
    await expect(submitRichMenuBatch(ORG_ID, { operations: [{ type: 'link', from: 'a' }] })).rejects.toMatchObject({
      status: 400,
      message: expect.stringMatching(/to/i),
    })
  })

  test('rejects unlink op without from', async () => {
    await expect(submitRichMenuBatch(ORG_ID, { operations: [{ type: 'unlink' }] })).rejects.toMatchObject({
      status: 400,
      message: expect.stringMatching(/from/i),
    })
  })

  test('rejects unknown op type', async () => {
    await expect(submitRichMenuBatch(ORG_ID, { operations: [{ type: 'replace', from: 'a', to: 'b' }] })).rejects.toMatchObject({
      status: 400,
      message: expect.stringMatching(/type/i),
    })
  })

  test('rejects unlinkAll mixed with other types', async () => {
    const ops = [
      { type: 'unlinkAll' },
      { type: 'link', from: 'a', to: 'b' },
    ]
    await expect(submitRichMenuBatch(ORG_ID, { operations: ops })).rejects.toMatchObject({
      status: 400,
      message: expect.stringMatching(/unlinkAll/i),
    })
  })

  test('rejects invalid resumeRequestKey', async () => {
    const bad = { operations: [{ type: 'unlinkAll' }], resumeRequestKey: 'bad key!' }
    await expect(submitRichMenuBatch(ORG_ID, bad)).rejects.toMatchObject({ status: 400 })
  })

  test('accepts valid resumeRequestKey', async () => {
    mockClient().richMenuBatchWithHttpInfo = jest.fn().mockResolvedValue(
      makeHttpResponse({ 'x-line-request-id': REQUEST_ID }),
    )
    const result = await submitRichMenuBatch(ORG_ID, { operations: [{ type: 'unlinkAll' }], resumeRequestKey: 'valid-key_01' })
    expect(result).toEqual({ requestId: REQUEST_ID })
  })

  test('propagates SDK error', async () => {
    mockClient().richMenuBatchWithHttpInfo = jest.fn().mockRejectedValue({ status: 400, message: 'Bad request' })
    await expect(submitRichMenuBatch(ORG_ID, validBatchRequest)).rejects.toMatchObject({ status: 400 })
  })
})

// ---- validateRichMenuBatchRequest ----

describe('validateRichMenuBatchRequest', () => {
  test('returns { valid: true } on success', async () => {
    mockClient().validateRichMenuBatchRequest = jest.fn().mockResolvedValue({})
    const result = await validateRichMenuBatchRequest(ORG_ID, validBatchRequest)
    expect(result).toEqual({ valid: true })
  })

  test('passes batchRequest to SDK', async () => {
    mockClient().validateRichMenuBatchRequest = jest.fn().mockResolvedValue({})
    await validateRichMenuBatchRequest(ORG_ID, validBatchRequest)
    expect(mockClient().validateRichMenuBatchRequest).toHaveBeenCalledWith(validBatchRequest)
  })

  test('rejects invalid ops before calling SDK', async () => {
    await expect(validateRichMenuBatchRequest(ORG_ID, { operations: [] })).rejects.toMatchObject({ status: 400 })
    expect(mockClient().validateRichMenuBatchRequest).not.toHaveBeenCalled()
  })

  test('propagates SDK validation error', async () => {
    mockClient().validateRichMenuBatchRequest = jest.fn().mockRejectedValue({ status: 400, message: 'Invalid' })
    await expect(validateRichMenuBatchRequest(ORG_ID, validBatchRequest)).rejects.toMatchObject({ status: 400 })
  })
})

// ---- getRichMenuBatchProgress ----

describe('getRichMenuBatchProgress', () => {
  test('returns phase and acceptedTime', async () => {
    mockClient().getRichMenuBatchProgress = jest.fn().mockResolvedValue({
      phase: 'succeeded',
      acceptedTime: '2026-07-26T21:00:00Z',
      completedTime: '2026-07-26T21:01:00Z',
    })
    const result = await getRichMenuBatchProgress(ORG_ID, REQUEST_ID)
    expect(result).toEqual({
      phase: 'succeeded',
      acceptedTime: '2026-07-26T21:00:00Z',
      completedTime: '2026-07-26T21:01:00Z',
    })
  })

  test('returns null completedTime when not yet finished', async () => {
    mockClient().getRichMenuBatchProgress = jest.fn().mockResolvedValue({
      phase: 'running',
      acceptedTime: '2026-07-26T21:00:00Z',
    })
    const result = await getRichMenuBatchProgress(ORG_ID, REQUEST_ID)
    expect(result.completedTime).toBeNull()
    expect(result.phase).toBe('running')
  })

  test('passes requestId to SDK', async () => {
    mockClient().getRichMenuBatchProgress = jest.fn().mockResolvedValue({
      phase: 'succeeded',
      acceptedTime: '2026-07-26T21:00:00Z',
    })
    await getRichMenuBatchProgress(ORG_ID, REQUEST_ID)
    expect(mockClient().getRichMenuBatchProgress).toHaveBeenCalledWith(REQUEST_ID)
  })

  test('propagates SDK error (e.g. requestId not found)', async () => {
    mockClient().getRichMenuBatchProgress = jest.fn().mockRejectedValue({ status: 404, message: 'Not found' })
    await expect(getRichMenuBatchProgress(ORG_ID, REQUEST_ID)).rejects.toMatchObject({ status: 404 })
  })

  test('throws 404 when no connection exists', async () => {
    LineConnection.findOne.mockResolvedValue(null)
    await expect(getRichMenuBatchProgress(ORG_ID, REQUEST_ID)).rejects.toMatchObject({ status: 404 })
  })
})
