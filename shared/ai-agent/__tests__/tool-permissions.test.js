// Unit tests for the AI-agent tool→permission map and its gate. Pure functions,
// no DB/model deps — verifies the gate mirrors REST RBAC and fails closed.

const { requiredPermission, isAllowed, TOOL_PERMISSIONS } = require('../services/tool-permissions')

describe('ai-agent tool-permissions', () => {
  test('maps mutating tools to the same permission their REST route requires', () => {
    expect(requiredPermission('delete_customer')).toBe('erp.customers.delete')
    expect(requiredPermission('create_product')).toBe('erp.products.edit')
    expect(requiredPermission('update_pricing')).toBe('erp.pricing.manage')
    expect(requiredPermission('list_customers')).toBe('erp.customers.list')
  })

  test('returns null for tools with no extra requirement (e.g. navigate)', () => {
    expect(requiredPermission('navigate')).toBeNull()
    expect(requiredPermission('executive_summary')).toBeNull()
  })

  test('a tool with no requirement is always allowed, even with no permissions', () => {
    expect(isAllowed(undefined, 'navigate')).toBe(true)
    expect(isAllowed([], 'navigate')).toBe(true)
  })

  test('wildcard (system admin) clears every gate', () => {
    expect(isAllowed(['*'], 'delete_customer')).toBe(true)
    expect(isAllowed(new Set(['*']), 'delete_customer')).toBe(true)
  })

  test('grants only when the caller holds the exact required permission', () => {
    expect(isAllowed(['erp.customers.delete'], 'delete_customer')).toBe(true)
    expect(isAllowed(['erp.customers.list'], 'delete_customer')).toBe(false)
    expect(isAllowed(['erp.customers.edit'], 'create_customer')).toBe(true)
  })

  test('fails closed when a mapped tool is called with no permission context', () => {
    expect(isAllowed(undefined, 'delete_customer')).toBe(false)
    expect(isAllowed(null, 'create_product')).toBe(false)
  })

  test('accepts a Set as the permission container', () => {
    expect(isAllowed(new Set(['erp.products.list']), 'list_products')).toBe(true)
    expect(isAllowed(new Set(['erp.products.list']), 'delete_product')).toBe(false)
  })

  test('every mapped slug is a non-empty erp.* permission string', () => {
    for (const [tool, slug] of Object.entries(TOOL_PERMISSIONS)) {
      expect(typeof slug).toBe('string')
      expect(slug).toMatch(/^erp\.[a-z-]+\.[a-z]+$/)
      expect(tool).toMatch(/^[a-z_]+$/)
    }
  })
})
