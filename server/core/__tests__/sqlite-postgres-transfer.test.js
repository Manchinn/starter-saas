const {
  parseArgs,
  requireSourcePath,
  topologicalOrder,
  normalizeValue,
} = require('../sqlite-postgres-transfer')

describe('sqlite-postgres transfer helpers', () => {
  test('requires an explicit SQLite source path', () => {
    expect(() => requireSourcePath({})).toThrow('--source')
    expect(() => requireSourcePath({ source: '--batch-size' })).toThrow('--source')
    expect(requireSourcePath({ source: 'data/database.sqlite' })).toBe('data/database.sqlite')
  })

  test('parses named CLI arguments', () => {
    expect(parseArgs(['--source', 'data/database.sqlite', '--batch-size=250'])).toEqual({
      source: 'data/database.sqlite',
      'batch-size': '250',
    })
  })

  test('normalizes JSON values as JSON text for PostgreSQL binds', () => {
    expect(normalizeValue('["auth.login", "auth.register"]', { type: 'JSONB', field: 'permissions' }))
      .toBe('["auth.login","auth.register"]')
    expect(() => normalizeValue('{not-json}', { type: 'JSON', field: 'meta' }))
      .toThrow('Invalid JSON value for target column meta')
  })

  test('orders parent tables before dependent tables', () => {
    const dependencies = new Map([
      ['OrderItems', new Set(['Orders', 'Products'])],
      ['Orders', new Set(['Customers'])],
      ['Products', new Set()],
      ['Customers', new Set()],
    ])

    const order = topologicalOrder(dependencies)
    expect(order.indexOf('Customers')).toBeLessThan(order.indexOf('Orders'))
    expect(order.indexOf('Orders')).toBeLessThan(order.indexOf('OrderItems'))
    expect(order.indexOf('Products')).toBeLessThan(order.indexOf('OrderItems'))
  })

  test('rejects foreign-key dependency cycles', () => {
    const dependencies = new Map([
      ['Users', new Set(['Organizations'])],
      ['Organizations', new Set(['Users'])],
    ])

    expect(() => topologicalOrder(dependencies)).toThrow('Foreign-key dependency cycle')
  })
})
