// LINE Customer notify adapter — maps org/customer → LINE push when a mapping exists.

jest.mock('../../../../server/models', () => ({
  LineUserMapping: { findOne: jest.fn() },
  LineConnection: {},
}))

jest.mock('../services/line-message.service', () => ({
  pushText: jest.fn(),
}))

const { LineUserMapping } = require('../../../../server/models')
const { pushText } = require('../services/line-message.service')
const { notifyCustomer } = require('../services/line-notification.service')
const {
  setImplementation,
  resetImplementation,
  notifyCustomer: portNotify,
} = require('../../notifications/customer-notify')

afterEach(() => {
  resetImplementation()
  jest.clearAllMocks()
})

describe('line-notification.notifyCustomer', () => {
  test('no-ops without organizationId or customerId', async () => {
    await notifyCustomer({ organizationId: null, customerId: 'c', text: 'hi' })
    await notifyCustomer({ organizationId: 'o', customerId: null, text: 'hi' })
    expect(LineUserMapping.findOne).not.toHaveBeenCalled()
  })

  test('no-ops when no LINE user mapping exists', async () => {
    LineUserMapping.findOne.mockResolvedValue(null)
    await notifyCustomer({ organizationId: 'o', customerId: 'c', text: 'hi' })
    expect(pushText).not.toHaveBeenCalled()
  })

  test('pushes text when mapping + connection exist', async () => {
    const connection = { id: 'conn', isActive: true }
    LineUserMapping.findOne.mockResolvedValue({
      lineUserId: 'U1',
      connection,
    })
    await notifyCustomer({ organizationId: 'o', customerId: 'c', text: 'Order done' })
    expect(pushText).toHaveBeenCalledWith(connection, 'U1', 'Order done')
  })

  test('swallows pushText errors (best-effort)', async () => {
    LineUserMapping.findOne.mockResolvedValue({
      lineUserId: 'U1',
      connection: { id: 'conn' },
    })
    pushText.mockRejectedValue(new Error('LINE down'))
    await expect(notifyCustomer({
      organizationId: 'o',
      customerId: 'c',
      text: 'x',
    })).resolves.toBeUndefined()
  })
})

describe('LINE adapter via Customer notify port', () => {
  test('setImplementation routes port calls to LINE notifyCustomer', async () => {
    const connection = { id: 'conn', isActive: true }
    LineUserMapping.findOne.mockResolvedValue({ lineUserId: 'U1', connection })
    setImplementation(notifyCustomer)

    await portNotify({
      organizationId: 'org-1',
      customerId: 'cust-1',
      text: 'Order ORD-1 status: confirmed.',
    })

    expect(pushText).toHaveBeenCalledWith(
      connection,
      'U1',
      'Order ORD-1 status: confirmed.',
    )
  })
})
