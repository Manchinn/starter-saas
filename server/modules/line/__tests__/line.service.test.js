/**
 * LINE service boundaries (mocked collaborators).
 *
 * 1. Webhook — unauthenticated. Must resolve the bot destination, verify the
 *    raw-body HMAC signature against the decrypted channel secret, then map
 *    follow/message users. Bad payload / unknown bot / bad signature fail closed.
 * 2. createLiffOrder — LIFF client is untrusted. Price/stock/store come from the
 *    server; invalid items and insufficient stock are rejected; confirm failure
 *    rolls back the draft order; pushText outages do not fail checkout.
 */

jest.mock('../../../config/config', () => ({
  line: { credentialEncryptionKey: Buffer.alloc(32, 7).toString('base64') },
  db: { dialect: 'sqlite', storage: ':memory:' },
}))

jest.mock('../../../models', () => ({
  LineConnection: { findOne: jest.fn() },
  LineUserMapping: {},
}))

jest.mock('../../../../shared/erp/line-integration/services/line-user.service', () => ({
  ensureCustomer: jest.fn(),
}))

jest.mock('../../../../shared/erp/line-integration/services/line-message.service', () => ({
  pushText: jest.fn(),
}))

jest.mock('../../../../shared/erp/orders/services/order.service', () => ({
  create: jest.fn(),
  updateStatus: jest.fn(),
  remove: jest.fn(),
}))

jest.mock('../../../../shared/erp/products/services/product.service', () => ({
  getById: jest.fn(),
  listStoreStocks: jest.fn(),
}))

const crypto = require('crypto')
const { LineConnection } = require('../../../models')
const { ensureCustomer } = require('../../../../shared/erp/line-integration/services/line-user.service')
const { pushText } = require('../../../../shared/erp/line-integration/services/line-message.service')
const orders = require('../../../../shared/erp/orders/services/order.service')
const productService = require('../../../../shared/erp/products/services/product.service')
const { encrypt } = require('../line.crypto')
const { handleWebhook, createLiffOrder } = require('../line.service')

const CHANNEL_SECRET = 'line-channel-secret-for-tests'
const BOT_USER_ID = 'U_destination_bot'
const STORE_ID = 'store-1'
const ORG_ID = 'org-1'
const PRODUCT_ID = 'prod-1'

const connection = {
  id: 'conn-1',
  organizationId: ORG_ID,
  botUserId: BOT_USER_ID,
  defaultStoreId: STORE_ID,
  isActive: true,
  channelSecretEncrypted: encrypt(CHANNEL_SECRET),
  channelAccessTokenEncrypted: encrypt('token'),
}

const signedReq = (payload, { secret = CHANNEL_SECRET, signature, raw } = {}) => {
  const bodyStr = typeof payload === 'string' ? payload : JSON.stringify(payload)
  const rawBody = raw !== undefined ? raw : Buffer.from(bodyStr, 'utf8')
  const sig = signature !== undefined
    ? signature
    : crypto.createHmac('sha256', secret).update(rawBody).digest('base64')
  return {
    body: rawBody,
    get: (h) => (String(h).toLowerCase() === 'x-line-signature' ? sig : undefined),
  }
}

beforeEach(() => {
  jest.clearAllMocks()
  LineConnection.findOne.mockResolvedValue(connection)
  ensureCustomer.mockResolvedValue({ customerId: 'cust-1', lineUserId: 'U_user' })
  pushText.mockResolvedValue(undefined)
})

describe('handleWebhook — signature and destination', () => {
  test('rejects invalid JSON with 400 before looking up a connection', async () => {
    const req = signedReq('not-json{')
    await expect(handleWebhook(req)).rejects.toMatchObject({ status: 400 })
    expect(LineConnection.findOne).not.toHaveBeenCalled()
  })

  test('rejects an unknown bot destination with 404', async () => {
    LineConnection.findOne.mockResolvedValue(null)
    const req = signedReq({ destination: 'U_unknown', events: [] })
    await expect(handleWebhook(req)).rejects.toMatchObject({ status: 404 })
  })

  test('rejects a missing signature with 401', async () => {
    const req = signedReq({ destination: BOT_USER_ID, events: [] }, { signature: null })
    await expect(handleWebhook(req)).rejects.toMatchObject({ status: 401 })
  })

  test('rejects a tampered signature with 401 and does not map users', async () => {
    const req = signedReq(
      { destination: BOT_USER_ID, events: [{ type: 'follow', source: { type: 'user', userId: 'U1' } }] },
      { signature: 'not-a-real-signature' },
    )
    await expect(handleWebhook(req)).rejects.toMatchObject({ status: 401 })
    expect(ensureCustomer).not.toHaveBeenCalled()
  })

  test('accepts a valid signature and maps follow events', async () => {
    const payload = {
      destination: BOT_USER_ID,
      events: [
        { type: 'follow', source: { type: 'user', userId: 'U_follow' } },
        { type: 'message', source: { type: 'user', userId: 'U_msg' } },
        { type: 'follow', source: { type: 'group', groupId: 'G1' } }, // ignored
      ],
    }
    await handleWebhook(signedReq(payload))
    expect(LineConnection.findOne).toHaveBeenCalledWith({
      where: { botUserId: BOT_USER_ID, isActive: true },
    })
    expect(ensureCustomer).toHaveBeenCalledTimes(2)
    expect(ensureCustomer).toHaveBeenCalledWith(connection, { userId: 'U_follow', displayName: 'U_follow' })
    expect(ensureCustomer).toHaveBeenCalledWith(connection, { userId: 'U_msg', displayName: 'U_msg' })
  })
})

describe('createLiffOrder — untrusted client payload', () => {
  const profile = { userId: 'U_buyer', displayName: 'Buyer' }
  const activeProduct = {
    id: PRODUCT_ID,
    name: 'Widget',
    status: 'active',
    stock: 10,
    price: 99.5,
  }

  beforeEach(() => {
    productService.getById.mockResolvedValue(activeProduct)
    productService.listStoreStocks.mockResolvedValue({
      storeStocks: [{ storeId: STORE_ID, stock: 5 }],
    })
    orders.create.mockResolvedValue({ id: 'ord-draft', orderNumber: 'ORD-1' })
    orders.updateStatus.mockResolvedValue({
      id: 'ord-draft',
      orderNumber: 'ORD-1',
      status: 'confirmed',
      total: 199,
    })
  })

  test('rejects an empty cart', async () => {
    await expect(createLiffOrder({ connection, profile, items: [] }))
      .rejects.toMatchObject({ status: 400 })
    expect(orders.create).not.toHaveBeenCalled()
  })

  test('rejects non-integer or non-positive quantities', async () => {
    await expect(createLiffOrder({
      connection,
      profile,
      items: [{ productId: PRODUCT_ID, quantity: 1.5 }],
    })).rejects.toMatchObject({ status: 400 })

    await expect(createLiffOrder({
      connection,
      profile,
      items: [{ productId: PRODUCT_ID, quantity: 0 }],
    })).rejects.toMatchObject({ status: 400 })

    expect(productService.getById).not.toHaveBeenCalled()
  })

  test('rejects when product stock is insufficient', async () => {
    productService.getById.mockResolvedValue({ ...activeProduct, stock: 1 })
    await expect(createLiffOrder({
      connection,
      profile,
      items: [{ productId: PRODUCT_ID, quantity: 2 }],
    })).rejects.toMatchObject({ status: 400, message: expect.stringMatching(/insufficient stock/i) })
    expect(orders.create).not.toHaveBeenCalled()
  })

  test('rejects when store stock is insufficient', async () => {
    productService.listStoreStocks.mockResolvedValue({
      storeStocks: [{ storeId: STORE_ID, stock: 1 }],
    })
    await expect(createLiffOrder({
      connection,
      profile,
      items: [{ productId: PRODUCT_ID, quantity: 2 }],
    })).rejects.toMatchObject({ status: 400, message: expect.stringMatching(/configured store/i) })
    expect(orders.create).not.toHaveBeenCalled()
  })

  test('creates a draft, confirms it, ignores client unit prices, and notifies LINE', async () => {
    const confirmed = await createLiffOrder({
      connection,
      profile,
      notes: 'from LIFF',
      items: [
        // Client-supplied price/name must not win over server product fields.
        { productId: PRODUCT_ID, quantity: 2, unitPrice: 1, productName: 'HAX' },
        { productId: PRODUCT_ID, quantity: 1 }, // merged qty 3
      ],
    })

    expect(ensureCustomer).toHaveBeenCalledWith(connection, profile)
    expect(orders.create).toHaveBeenCalledWith(expect.objectContaining({
      customerId: 'cust-1',
      organizationId: ORG_ID,
      notes: 'from LIFF',
      items: [{
        productId: PRODUCT_ID,
        productName: 'Widget',
        quantity: 3,
        unitPrice: 99.5,
        storeId: STORE_ID,
      }],
    }))
    expect(orders.updateStatus).toHaveBeenCalledWith('ord-draft', 'confirmed', ORG_ID, ORG_ID)
    expect(pushText).toHaveBeenCalledWith(
      connection,
      'U_buyer',
      expect.stringContaining('ORD-1'),
    )
    expect(confirmed.status).toBe('confirmed')
  })

  test('removes the draft when confirmation fails', async () => {
    orders.updateStatus.mockRejectedValue({ status: 400, message: 'stock race' })
    await expect(createLiffOrder({
      connection,
      profile,
      items: [{ productId: PRODUCT_ID, quantity: 1 }],
    })).rejects.toMatchObject({ message: 'stock race' })
    expect(orders.remove).toHaveBeenCalledWith('ord-draft', ORG_ID)
  })

  test('still returns the confirmed order when pushText fails', async () => {
    pushText.mockRejectedValue(new Error('LINE down'))
    const confirmed = await createLiffOrder({
      connection,
      profile,
      items: [{ productId: PRODUCT_ID, quantity: 1 }],
    })
    expect(confirmed.orderNumber).toBe('ORD-1')
  })
})
