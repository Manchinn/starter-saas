const { schemas, execute } = require('../services/tools')

describe('AI tool registry RBAC', () => {
  test('only advertises server tools covered by the caller permissions', () => {
    const names = schemas({ permissions: new Set(['erp.products.list']) }).map((tool) => tool.function.name)
    expect(names).toContain('list_products')
    expect(names).toContain('get_product')
    expect(names).not.toContain('create_product')
    expect(names).not.toContain('delete_customer')
    expect(names).toContain('navigate')
  })

  test('rejects a stale unauthorized tool call before running its handler', async () => {
    const result = await execute('delete_product', { search: 'Widget' }, {
      user: { id: 'u1', organizationId: 'o1' },
      permissions: new Set(['erp.products.list']),
    })
    expect(result).toEqual({ content: 'Error: you do not have permission to use delete_product.' })
  })
})
