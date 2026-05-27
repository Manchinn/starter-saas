// Unit tests for sequence.service.
//
// The crown jewel is applyFormat + needsReset + getNext. We exercise them
// via observable outputs (the ref number emitted, the runningValue
// persisted, the reset side-effects). getNext is wrapped in a transaction —
// we stub that as a passthrough that returns an object with commit/rollback.

jest.mock('../../../../server/models', () => ({
  Sequence: {
    findAll:        jest.fn(),
    findOne:        jest.fn(),
    findByPk:       jest.fn(),
    findOrCreate:   jest.fn(),
    create:         jest.fn(),
    bulkCreate:     jest.fn(),
  },
}))

jest.mock('../../../../server/config/database', () => ({ transaction: jest.fn() }))

const { Sequence } = require('../../../../server/models')
const sequelize = require('../../../../server/config/database')
const service = require('../services/sequence.service')

beforeEach(() => {
  // resetMocks: true wipes implementations; re-bind transaction passthrough.
  sequelize.transaction.mockImplementation(async () => ({
    commit:   jest.fn().mockResolvedValue(),
    rollback: jest.fn().mockResolvedValue(),
  }))
})

describe('sequence.getNext — format engine', () => {
  test('applies {####} zero-padding and the current YY/MM tokens', async () => {
    Sequence.findOne.mockResolvedValue({ id: 'q1' })
    Sequence.findOrCreate.mockResolvedValue([{
      runningValue: 7, initialValue: 1, maxValue: 9999,
      format: 'QT{YY}{MM}{####}', reseedPeriod: 'M', lastResetDate: null,
      update: jest.fn().mockResolvedValue(),
    }])
    const out = await service.getNext('QT', 'u')
    const now = new Date()
    const yy = String(now.getFullYear()).slice(2)
    const mm = String(now.getMonth() + 1).padStart(2, '0')
    expect(out).toBe(`QT${yy}${mm}0007`)
  })

  test('{YYYY} and {DD} tokens are honoured', async () => {
    Sequence.findOne.mockResolvedValue({ id: 'q1' })
    const row = { runningValue: 1, initialValue: 1, maxValue: 99, format: 'X{YYYY}{DD}{##}', reseedPeriod: 'F', lastResetDate: null, update: jest.fn().mockResolvedValue() }
    Sequence.findOrCreate.mockResolvedValue([row])
    const out = await service.getNext('FOO', 'u')
    const yyyy = String(new Date().getFullYear())
    const dd   = String(new Date().getDate()).padStart(2, '0')
    expect(out).toBe(`X${yyyy}${dd}01`)
  })
})

describe('sequence.getNext — guards', () => {
  test('rejects unknown code when no DB row exists either', async () => {
    Sequence.findOne.mockResolvedValue(null)
    await expect(service.getNext('NONSENSE', 'u'))
      .rejects.toMatchObject({ status: 500, message: expect.stringContaining("'NONSENSE'") })
  })

  test('rejects when runningValue exceeds maxValue', async () => {
    Sequence.findOne.mockResolvedValue({ id: 'q1' })
    const row = { runningValue: 10000, initialValue: 1, maxValue: 9999, format: 'X{####}', reseedPeriod: 'F', lastResetDate: null, update: jest.fn() }
    Sequence.findOrCreate.mockResolvedValue([row])
    await expect(service.getNext('QT', 'u'))
      .rejects.toMatchObject({ status: 500, message: expect.stringContaining('maximum value') })
  })

  test('increments runningValue and persists', async () => {
    Sequence.findOne.mockResolvedValue({ id: 'q1' })
    const row = { runningValue: 5, initialValue: 1, maxValue: 9999, format: 'X{####}', reseedPeriod: 'F', lastResetDate: null, update: jest.fn().mockResolvedValue() }
    Sequence.findOrCreate.mockResolvedValue([row])
    await service.getNext('QT', 'u')
    // update() is called with (patch, { transaction }) — first arg only
    expect(row.update.mock.calls[0][0]).toEqual(expect.objectContaining({ runningValue: 6 }))
  })

  test('monthly reseed: detects month change and resets to initialValue', async () => {
    Sequence.findOne.mockResolvedValue({ id: 'q1' })
    // Last reset was a year ago → month differs → triggers reset.
    const lastYear = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000)
    const row = {
      runningValue: 50, initialValue: 1, maxValue: 9999,
      format: 'X{####}', reseedPeriod: 'M',
      lastResetDate: lastYear,
      update: jest.fn().mockResolvedValue(),
    }
    Sequence.findOrCreate.mockResolvedValue([row])
    const out = await service.getNext('QT', 'u')
    // Reset → runningValue used = initialValue (1)
    expect(out).toBe('X0001')
    const patch = row.update.mock.calls[0][0]
    expect(patch.runningValue).toBe(2)             // 1 + 1
    expect(patch.lastResetDate).toMatch(/\d{4}-\d{2}-\d{2}/)
  })

  test('fixed (reseedPeriod F) never resets even with an old lastResetDate', async () => {
    Sequence.findOne.mockResolvedValue({ id: 'q1' })
    const lastYear = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000)
    const row = {
      runningValue: 50, initialValue: 1, maxValue: 9999,
      format: 'X{####}', reseedPeriod: 'F',
      lastResetDate: lastYear,
      update: jest.fn().mockResolvedValue(),
    }
    Sequence.findOrCreate.mockResolvedValue([row])
    const out = await service.getNext('CUS', 'u')
    expect(out).toBe('X0050') // no reset → uses runningValue=50
    expect(row.update.mock.calls[0][0]).toEqual({ runningValue: 51 })
  })
})

describe('sequence.getPreview', () => {
  test('returns the next ref WITHOUT incrementing', async () => {
    const row = { runningValue: 42, initialValue: 1, maxValue: 9999, format: 'X{####}', reseedPeriod: 'F', lastResetDate: null }
    Sequence.findOrCreate.mockResolvedValue([row])
    const out = await service.getPreview('CUS', 'u')
    expect(out).toBe('X0042')
    // Importantly: the row's update is not called
    expect(Sequence.findOrCreate.mock.calls[0][0].where).toEqual({ code: 'CUS', userId: 'u' })
  })
})

describe('sequence.create / update / remove', () => {
  test('create normalises code to uppercase and rejects duplicates per user', async () => {
    Sequence.findOne.mockResolvedValue({ id: 'dup' })
    await expect(service.create({ code: 'cus', name: 'x', format: 'X{####}' }, 'u'))
      .rejects.toMatchObject({ status: 400, message: expect.stringContaining("'CUS'") })
    expect(Sequence.findOne).toHaveBeenCalledWith({ where: { code: 'CUS', userId: 'u' } })
  })

  test('create rejects missing code / name / format', async () => {
    await expect(service.create({ name: 'x', format: 'X{####}' }))
      .rejects.toEqual({ status: 400, message: 'Code is required' })
    await expect(service.create({ code: 'X', format: 'X{####}' }))
      .rejects.toEqual({ status: 400, message: 'Name is required' })
    await expect(service.create({ code: 'X', name: 'x' }))
      .rejects.toEqual({ status: 400, message: 'Format is required' })
  })

  test('create defaults reseedPeriod to F, maxValue to 99999, runningValue to initialValue', async () => {
    Sequence.findOne.mockResolvedValue(null)
    Sequence.create.mockResolvedValue({ runningValue: 1, format: 'X{####}', toJSON: () => ({ id: 'new' }) })
    await service.create({ code: 'X', name: 'X', format: 'X{####}', initialValue: 5 }, 'u')
    const payload = Sequence.create.mock.calls[0][0]
    expect(payload.code).toBe('X')
    expect(payload.initialValue).toBe(5)
    expect(payload.runningValue).toBe(5)
    expect(payload.reseedPeriod).toBe('F')
    expect(payload.maxValue).toBe(99999)
  })

  test('update only patches supplied fields, parses ints, trims strings', async () => {
    const seq = {
      runningValue: 5, format: 'X{####}', initialValue: 1,
      update: jest.fn().mockResolvedValue(),
      toJSON: () => ({ id: 's1' }),
    }
    Sequence.findByPk.mockResolvedValue(seq)
    await service.update('s1', { name: '  Renamed ', runningValue: '99' })
    const patch = seq.update.mock.calls[0][0]
    expect(patch.name).toBe('Renamed')
    expect(patch.runningValue).toBe(99)
    expect(patch).not.toHaveProperty('format')
    expect(patch).not.toHaveProperty('maxValue')
  })

  test('resetSequence resets runningValue and stamps lastResetDate', async () => {
    const seq = {
      runningValue: 99, initialValue: 1, format: 'X{####}',
      update: jest.fn().mockResolvedValue(),
      toJSON: () => ({ id: 's1' }),
    }
    Sequence.findByPk.mockResolvedValue(seq)
    await service.resetSequence('s1')
    const patch = seq.update.mock.calls[0][0]
    expect(patch.runningValue).toBe(1)
    expect(patch.lastResetDate).toMatch(/^\d{4}-\d{2}-\d{2}$/)
  })

  test('remove refuses built-in sequence codes', async () => {
    Sequence.findByPk.mockResolvedValue({ id: 's1', code: 'CUS' }) // CUS is a built-in
    await expect(service.remove('s1'))
      .rejects.toEqual({ status: 400, message: 'Built-in sequences cannot be deleted' })
  })

  test('remove destroys a custom sequence', async () => {
    const seq = { code: 'CUSTOM-X', destroy: jest.fn().mockResolvedValue() }
    Sequence.findByPk.mockResolvedValue(seq)
    await service.remove('s1')
    expect(seq.destroy).toHaveBeenCalled()
  })
})

describe('sequence.seedDefaultsForUser', () => {
  test('requires userId', async () => {
    await expect(service.seedDefaultsForUser(null))
      .rejects.toEqual({ status: 400, message: 'userId is required to seed sequences' })
  })

  test('returns seeded: false when nothing new to add', async () => {
    // Pretend every default already exists.
    Sequence.findAll.mockResolvedValue(
      Object.keys({
        QT: 1, GR: 1, ADJ: 1, CNT: 1, STR: 1, RTN: 1, ISS: 1, DO: 1, PR: 1, PO: 1,
        JE: 1, RCP: 1, BN: 1, DN: 1, CN: 1, BILL: 1,
        CUS: 1, CGP: 1, EMP: 1, DEP: 1, VND: 1, PRD: 1, CAT: 1, WHS: 1, PRC: 1,
        OI: 1, SI: 1, PKG: 1,
      }).map(code => ({ code })),
    )
    const out = await service.seedDefaultsForUser('u')
    expect(out.seeded).toBe(false)
    expect(out.added).toBe(0)
    expect(out.total).toBe(28) // total defaults
  })

  test('bulk-creates only the missing codes', async () => {
    Sequence.findAll.mockResolvedValue([{ code: 'QT' }, { code: 'GR' }])
    sequelize.transaction.mockImplementation(async (cb) => cb('tx'))
    const out = await service.seedDefaultsForUser('u')
    expect(out.seeded).toBe(true)
    expect(out.added).toBeGreaterThan(0)
    const created = Sequence.bulkCreate.mock.calls[0][0]
    expect(created.find(r => r.code === 'QT')).toBeUndefined()
    expect(created.find(r => r.code === 'CUS')).toBeDefined()
  })
})
