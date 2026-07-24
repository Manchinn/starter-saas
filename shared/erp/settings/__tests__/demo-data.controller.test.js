jest.mock('../services/demo-data.service', () => ({
  seedDemo: jest.fn(),
  resetAll: jest.fn(),
}))

jest.mock('../services/sequence.service', () => ({ seedDefaultsForUser: jest.fn() }))

const service = require('../services/demo-data.service')
const controller = require('../controllers/demo-data.controller')

const makeRes = () => {
  const res = { statusCode: null, body: null }
  res.status = jest.fn((statusCode) => { res.statusCode = statusCode; return res })
  res.json = jest.fn((body) => { res.body = body; return res })
  return res
}

describe('demo-data controller — seed conflicts', () => {
  test('returns the service conflict status and message', async () => {
    service.seedDemo.mockRejectedValue({
      status: 409,
      message: 'Demo data already exists for this organization. Reset ERP data or remove conflicting records before seeding.',
    })
    const res = makeRes()

    await controller.seed({ user: { id: 'user-1', organizationId: 'org-1' }, body: {} }, res)

    expect(res.statusCode).toBe(409)
    expect(res.body).toEqual({
      success: false,
      message: 'Demo data already exists for this organization. Reset ERP data or remove conflicting records before seeding.',
    })
  })

  test('maps database uniqueness errors to an actionable conflict', async () => {
    service.seedDemo.mockRejectedValue({
      name: 'SequelizeUniqueConstraintError',
      message: 'Validation error',
    })
    const res = makeRes()

    await controller.seed({ user: { id: 'user-1', organizationId: 'org-1' }, body: {} }, res)

    expect(res.statusCode).toBe(409)
    expect(res.body).toEqual({
      success: false,
      message: 'Demo data conflicts with existing records. Reset ERP data or remove conflicting records before seeding.',
    })
  })
})
