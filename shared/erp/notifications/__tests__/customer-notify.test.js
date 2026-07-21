// Customer notify port — default no-op + swappable implementation (issue #2 / ADR-0002).

const {
  notifyCustomer,
  setImplementation,
  resetImplementation,
} = require('../customer-notify')

afterEach(() => {
  resetImplementation()
})

describe('customer-notify — default no-op', () => {
  test('notifyCustomer resolves without an installed adapter', async () => {
    await expect(notifyCustomer({
      organizationId: 'org-1',
      customerId: 'cust-1',
      text: 'hello',
    })).resolves.toBeUndefined()
  })

  test('notifyCustomer tolerates missing args', async () => {
    await expect(notifyCustomer()).resolves.toBeUndefined()
    await expect(notifyCustomer(null)).resolves.toBeUndefined()
  })
})

describe('customer-notify — setImplementation', () => {
  test('forwards calls to the installed adapter', async () => {
    const impl = jest.fn().mockResolvedValue(undefined)
    setImplementation(impl)

    await notifyCustomer({
      organizationId: 'org-1',
      customerId: 'cust-1',
      text: 'Order ORD-1 status: confirmed.',
    })

    expect(impl).toHaveBeenCalledWith({
      organizationId: 'org-1',
      customerId: 'cust-1',
      text: 'Order ORD-1 status: confirmed.',
    })
  })

  test('resetImplementation restores no-op', async () => {
    const impl = jest.fn().mockResolvedValue(undefined)
    setImplementation(impl)
    resetImplementation()

    await notifyCustomer({ organizationId: 'o', customerId: 'c', text: 'x' })
    expect(impl).not.toHaveBeenCalled()
  })

  test('setImplementation(non-function) restores no-op', async () => {
    const impl = jest.fn().mockResolvedValue(undefined)
    setImplementation(impl)
    setImplementation(null)

    await notifyCustomer({ organizationId: 'o', customerId: 'c', text: 'x' })
    expect(impl).not.toHaveBeenCalled()
  })
})
