jest.mock('../../../../server/models', () => ({
  Pricing: { findOne: jest.fn() },
}))

jest.mock('../../../../server/config/database', () => ({ transaction: jest.fn() }))
jest.mock('../services/sequence.service', () => ({ getNext: jest.fn() }))

const { Pricing } = require('../../../../server/models')
const sequelize = require('../../../../server/config/database')
const { getNext } = require('../services/sequence.service')
const { seedDemo } = require('../services/demo-data.service')

describe('demo-data.seedDemo — existing demo data', () => {
  test('rejects an existing organization before consuming sequences or opening a transaction', async () => {
    Pricing.findOne.mockResolvedValue({ id: 'pricing-1' })

    await expect(seedDemo('user-1', 'org-1')).rejects.toEqual({
      status: 409,
      message: 'Demo data already exists for this organization. Reset ERP data or remove conflicting records before seeding.',
    })

    expect(Pricing.findOne).toHaveBeenCalledWith({
      where: { code: 'PRC-R001', organizationId: 'org-1' },
    })
    expect(getNext).not.toHaveBeenCalled()
    expect(sequelize.transaction).not.toHaveBeenCalled()
  })
})
