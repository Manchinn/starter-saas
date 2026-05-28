// Unit tests for modules/module.service — CRUD over the Module model. The
// notable rules are the isCore guards: core modules can't be deactivated,
// toggled off, or deleted.

jest.mock('../../../models', () => ({
  Module: { findAll: jest.fn(), findByPk: jest.fn(), findOne: jest.fn(), create: jest.fn() },
}))

const { Module } = require('../../../models')
const service = require('../module.service')

describe('module.list', () => {
  test('orders by order then name', async () => {
    Module.findAll.mockResolvedValue([])
    await service.list()
    expect(Module.findAll.mock.calls[0][0].order).toEqual([['order', 'ASC'], ['name', 'ASC']])
  })
})

describe('module.getById', () => {
  test('throws 404 when missing', async () => {
    Module.findByPk.mockResolvedValue(null)
    await expect(service.getById('x')).rejects.toEqual({ status: 404, message: 'Module not found' })
  })
})

describe('module.create', () => {
  test('rejects a duplicate slug', async () => {
    Module.findOne.mockResolvedValue({ id: 'm1' })
    await expect(service.create({ slug: 'dup' })).rejects.toEqual({ status: 409, message: 'Module slug already exists' })
  })

  test('creates when the slug is free', async () => {
    Module.findOne.mockResolvedValue(null)
    Module.create.mockResolvedValue({ id: 'm1' })
    const data = { slug: 'new', name: 'New' }
    await service.create(data)
    expect(Module.create).toHaveBeenCalledWith(data)
  })
})

describe('module.update', () => {
  test('throws 404 when missing', async () => {
    Module.findByPk.mockResolvedValue(null)
    await expect(service.update('x', {})).rejects.toEqual({ status: 404, message: 'Module not found' })
  })

  test('refuses to deactivate a core module', async () => {
    Module.findByPk.mockResolvedValue({ isCore: true })
    await expect(service.update('m1', { isActive: false }))
      .rejects.toEqual({ status: 400, message: 'Core modules cannot be deactivated' })
  })

  test('persists only the allowed fields', async () => {
    const mod = { isCore: false, update: jest.fn().mockResolvedValue() }
    Module.findByPk.mockResolvedValue(mod)
    await service.update('m1', { name: 'X', order: 2, slug: 'hack', isCore: true })
    expect(mod.update).toHaveBeenCalledWith({ name: 'X', order: 2 })
  })
})

describe('module.toggle', () => {
  test('throws 404 when missing', async () => {
    Module.findByPk.mockResolvedValue(null)
    await expect(service.toggle('x')).rejects.toEqual({ status: 404, message: 'Module not found' })
  })

  test('refuses to toggle a core module', async () => {
    Module.findByPk.mockResolvedValue({ isCore: true })
    await expect(service.toggle('m1')).rejects.toEqual({ status: 400, message: 'Core modules cannot be toggled' })
  })

  test('flips isActive on a non-core module', async () => {
    const mod = { isCore: false, isActive: true, update: jest.fn().mockResolvedValue() }
    Module.findByPk.mockResolvedValue(mod)
    await service.toggle('m1')
    expect(mod.update).toHaveBeenCalledWith({ isActive: false })
  })
})

describe('module.remove', () => {
  test('throws 404 when missing', async () => {
    Module.findByPk.mockResolvedValue(null)
    await expect(service.remove('x')).rejects.toEqual({ status: 404, message: 'Module not found' })
  })

  test('refuses to delete a core module', async () => {
    Module.findByPk.mockResolvedValue({ isCore: true })
    await expect(service.remove('m1')).rejects.toEqual({ status: 400, message: 'Core modules cannot be deleted' })
  })

  test('destroys a non-core module', async () => {
    const mod = { isCore: false, destroy: jest.fn().mockResolvedValue() }
    Module.findByPk.mockResolvedValue(mod)
    await service.remove('m1')
    expect(mod.destroy).toHaveBeenCalled()
  })
})
