jest.mock('../../../../server/models', () => ({
  ChartOfAccount: {
    findOne: jest.fn(),
  },
}))

const { ChartOfAccount } = require('../../../../server/models')
const service = require('../services/account-mapping.service')

beforeEach(() => {
  service.clearCache()
})

describe('account-mapping.ROLE_TO_CODE', () => {
  test('maps standard roles to the canonical seeded codes', () => {
    expect(service.ROLE_TO_CODE).toMatchObject({
      AR:         '1130',
      AP:         '2110',
      CASH:       '1110',
      BANK:       '1120',
      REVENUE:    '4110',
      INVENTORY:  '1140',
      OUTPUT_TAX: '2140',
      INPUT_TAX:  '1160',
      COGS:       '5110',
    })
  })
})

describe('account-mapping.getByCode', () => {
  test('caches by org+code so repeat lookups skip the DB', async () => {
    ChartOfAccount.findOne.mockResolvedValue({ id: 'a', code: '1130' })
    const first  = await service.getByCode('1130', 'org-1')
    const second = await service.getByCode('1130', 'org-1')
    expect(first).toBe(second)
    expect(ChartOfAccount.findOne).toHaveBeenCalledTimes(1)
  })

  test('orgs do not share cached accounts', async () => {
    ChartOfAccount.findOne
      .mockResolvedValueOnce({ id: 'a1' })
      .mockResolvedValueOnce({ id: 'a2' })
    const a = await service.getByCode('1130', 'org-1')
    const b = await service.getByCode('1130', 'org-2')
    expect(a.id).toBe('a1')
    expect(b.id).toBe('a2')
  })

  test('returns null (without caching) when the account is missing', async () => {
    ChartOfAccount.findOne.mockResolvedValue(null)
    const out = await service.getByCode('9999', 'o')
    expect(out).toBeNull()
    await service.getByCode('9999', 'o')
    expect(ChartOfAccount.findOne).toHaveBeenCalledTimes(2)
  })
})

describe('account-mapping.getByRole', () => {
  test('throws on unknown role', async () => {
    await expect(service.getByRole('NONSENSE', 'o')).rejects.toThrow('Unknown account role: NONSENSE')
  })

  test('throws a 400 when the chart-of-accounts entry is missing', async () => {
    ChartOfAccount.findOne.mockResolvedValue(null)
    await expect(service.getByRole('AR', 'o')).rejects.toMatchObject({
      status: 400,
      message: expect.stringContaining('1130'),
    })
  })

  test('returns the seeded account when present', async () => {
    ChartOfAccount.findOne.mockResolvedValue({ id: 'ar', code: '1130' })
    await expect(service.getByRole('AR', 'o')).resolves.toEqual({ id: 'ar', code: '1130' })
  })
})

describe('account-mapping.accountForPaymentMethod', () => {
  test.each([
    ['bank_transfer', 'BANK'],
    ['cheque',        'BANK'],
    ['credit_card',   'BANK'],
    ['cash',          'CASH'],
    ['other',         'CASH'],
    [undefined,       'CASH'],
  ])('payment method %s → %s account', async (method, role) => {
    const expected = { id: role.toLowerCase(), code: service.ROLE_TO_CODE[role] }
    ChartOfAccount.findOne.mockResolvedValue(expected)
    const out = await service.accountForPaymentMethod(method, 'o')
    const args = ChartOfAccount.findOne.mock.calls[0][0]
    expect(args.where.code).toBe(service.ROLE_TO_CODE[role])
    expect(out).toEqual(expected)
  })
})
