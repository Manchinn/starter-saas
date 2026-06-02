// Verifies the tool-schema serializer, including the `compact` mode used by
// prompt compression (drops parameter descriptions + shortens tool descriptions
// to fit small context windows).
const registry = require('../services/tools')

describe('tools.schemas', () => {
  test('full mode keeps tool + parameter descriptions', () => {
    const navFull = registry.schemas().find((s) => s.function.name === 'navigate')
    expect(navFull.function.parameters.properties.target.description).toBeTruthy()
  })

  test('compact mode strips parameter descriptions but keeps enum/required', () => {
    const navCompact = registry.schemas({ compact: true }).find((s) => s.function.name === 'navigate')
    const target = navCompact.function.parameters.properties.target
    expect(target.description).toBeUndefined()
    expect(Array.isArray(target.enum)).toBe(true)            // valid targets preserved
    expect(navCompact.function.parameters.required).toEqual(['target'])
  })

  test('compact mode produces a strictly smaller payload', () => {
    const full = JSON.stringify(registry.schemas())
    const compact = JSON.stringify(registry.schemas({ compact: true }))
    expect(compact.length).toBeLessThan(full.length)
  })
})
