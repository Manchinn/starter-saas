// Unit tests for attachment.service.
//
// The service touches the filesystem and crypto, so both are mocked. Path
// joins still use the real `path` module — they're pure string ops.

jest.mock('fs', () => ({
  existsSync:  jest.fn(),
  mkdirSync:   jest.fn(),
  writeFileSync: jest.fn(),
  unlinkSync: jest.fn(),
}))

jest.mock('crypto', () => ({
  randomUUID: jest.fn(),
}))

jest.mock('../../../../server/models', () => ({
  Attachment: {
    findAll:  jest.fn(),
    findByPk: jest.fn(),
    create:   jest.fn(),
  },
}))

const fs = require('fs')
const crypto = require('crypto')
const { Op } = require('sequelize')
const { Attachment } = require('../../../../server/models')
const service = require('../attachment.service')

beforeEach(() => {
  // resetMocks: true between tests, so set sensible defaults
  fs.existsSync.mockReturnValue(true)         // dir already exists, no mkdir
  crypto.randomUUID.mockReturnValue('uuid-1') // predictable id
})

describe('attachment.list', () => {
  test('rejects when refType or refId missing', async () => {
    await expect(service.list({ refId: '1' })).rejects.toEqual({ status: 400, message: 'refType and refId are required' })
    await expect(service.list({ refType: 'Invoice' })).rejects.toEqual({ status: 400, message: 'refType and refId are required' })
  })

  test('scopes by refType+refId+org, excludes soft-deleted, newest first', async () => {
    Attachment.findAll.mockResolvedValue([{ id: 'a1' }])
    const out = await service.list({ refType: 'Invoice', refId: 'i1', organizationId: 'o' })
    expect(out).toEqual([{ id: 'a1' }])
    const args = Attachment.findAll.mock.calls[0][0]
    expect(args.where).toMatchObject({ refType: 'Invoice', refId: 'i1', organizationId: 'o' })
    expect(args.where.dataFlag[Op.ne]).toBe(2)
    expect(args.order).toEqual([['createdAt', 'DESC']])
  })

  test('null tenant when organizationId not supplied', async () => {
    Attachment.findAll.mockResolvedValue([])
    await service.list({ refType: 'X', refId: '1' })
    expect(Attachment.findAll.mock.calls[0][0].where.organizationId).toBeNull()
  })
})

describe('attachment.getById', () => {
  test('throws 404 when missing', async () => {
    Attachment.findByPk.mockResolvedValue(null)
    await expect(service.getById('missing')).rejects.toEqual({ status: 404, message: 'Attachment not found' })
  })

  test('returns the row when found', async () => {
    Attachment.findByPk.mockResolvedValue({ id: 'a1' })
    await expect(service.getById('a1')).resolves.toEqual({ id: 'a1' })
  })
})

describe('attachment.create — validation', () => {
  const ok = {
    refType: 'Invoice', refId: 'i1',
    originalName: 'file.png',
    contentType: 'image/png',
    dataBase64: Buffer.from('hello').toString('base64'),
  }

  test('rejects missing refType or refId', async () => {
    await expect(service.create({ ...ok, refType: '' })).rejects.toEqual({ status: 400, message: 'refType and refId are required' })
    await expect(service.create({ ...ok, refId:  '' })).rejects.toEqual({ status: 400, message: 'refType and refId are required' })
  })

  test('rejects missing file name', async () => {
    await expect(service.create({ ...ok, originalName: '' })).rejects.toEqual({ status: 400, message: 'File name is required' })
  })

  test('rejects missing file data', async () => {
    await expect(service.create({ ...ok, dataBase64: '' })).rejects.toEqual({ status: 400, message: 'File data is required' })
  })

  test('rejects unsupported MIME types', async () => {
    await expect(service.create({ ...ok, contentType: 'application/x-zip' }))
      .rejects.toMatchObject({ status: 400, message: expect.stringContaining('Unsupported file type') })
  })

  test.each([
    'image/png', 'image/jpeg', 'image/gif', 'image/webp',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/csv', 'text/plain',
  ])('accepts MIME %s', async (mime) => {
    Attachment.create.mockResolvedValue({ id: 'uuid-1' })
    await service.create({ ...ok, contentType: mime })
    expect(Attachment.create).toHaveBeenCalled()
  })

  test('exposes the canonical MIME allowlist and size limit', () => {
    expect(service.MAX_SIZE_BYTES).toBe(10 * 1024 * 1024)
    expect(service.ALLOWED_MIME.has('image/png')).toBe(true)
    expect(service.ALLOWED_MIME.has('application/x-zip')).toBe(false)
  })

  test('rejects files exceeding 10 MB', async () => {
    // 11 MB of base64-encoded zero bytes
    const big = Buffer.alloc(11 * 1024 * 1024).toString('base64')
    await expect(service.create({ ...ok, dataBase64: big }))
      .rejects.toMatchObject({ status: 400, message: expect.stringContaining('10 MB') })
    expect(fs.writeFileSync).not.toHaveBeenCalled()
  })
})

describe('attachment.create — happy path', () => {
  test('strips data-URL prefix from base64 before decoding', async () => {
    Attachment.create.mockResolvedValue({ id: 'uuid-1' })
    const raw = Buffer.from('hello').toString('base64')
    await service.create({
      refType: 'Invoice', refId: 'i1',
      originalName: 'file.png', contentType: 'image/png',
      dataBase64: `data:image/png;base64,${raw}`,
    })
    // writeFileSync second arg is the decoded buffer — should be the original "hello"
    expect(fs.writeFileSync).toHaveBeenCalled()
    const [, written] = fs.writeFileSync.mock.calls[0]
    expect(written.toString('utf8')).toBe('hello')
  })

  test('uses crypto.randomUUID for the id, year/month sub-dirs, sanitized name', async () => {
    Attachment.create.mockResolvedValue({ id: 'uuid-1' })
    const data = Buffer.from('x').toString('base64')
    await service.create({
      refType: 'Invoice', refId: 'i1',
      originalName: '../etc/passwd?<weird>.png',
      contentType: 'image/png',
      dataBase64: data,
      userId: 'u', organizationId: 'o',
    })
    const args = Attachment.create.mock.calls[0][0]
    expect(args.id).toBe('uuid-1')
    expect(args.refType).toBe('Invoice')
    expect(args.refId).toBe('i1')
    expect(args.uploadedBy).toBe('u')
    expect(args.organizationId).toBe('o')
    expect(args.mimeType).toBe('image/png')
    expect(args.size).toBe(1)
    // Dangerous filename chars get replaced with _ (including < and >)
    expect(args.originalName).toBe('.._etc_passwd__weird_.png')
    // No special chars survive
    expect(args.originalName).not.toMatch(/[/\\?%*:|"<>]/)
  })

  test('creates the storage directory when missing', async () => {
    fs.existsSync.mockReturnValue(false)
    Attachment.create.mockResolvedValue({ id: 'uuid-1' })
    await service.create({
      refType: 'X', refId: '1', originalName: 'a.txt',
      contentType: 'text/plain', dataBase64: Buffer.from('x').toString('base64'),
    })
    expect(fs.mkdirSync).toHaveBeenCalledWith(expect.any(String), { recursive: true })
  })

  test('caps overly long file names at 200 chars', async () => {
    Attachment.create.mockResolvedValue({ id: 'uuid-1' })
    const longName = 'a'.repeat(500) + '.txt'
    await service.create({
      refType: 'X', refId: '1', originalName: longName,
      contentType: 'text/plain', dataBase64: Buffer.from('x').toString('base64'),
    })
    expect(Attachment.create.mock.calls[0][0].originalName.length).toBe(200)
  })
})

describe('attachment.streamFile', () => {
  test('throws 404 when the stored file is missing on disk', () => {
    fs.existsSync.mockReturnValue(false)
    expect(() => service.streamFile({ storedName: '2025/01/uuid-1', mimeType: 'image/png', originalName: 'x.png' }))
      .toThrow(expect.objectContaining({ status: 404, message: 'File missing on disk' }))
  })

  test('returns { path, mimeType, filename } for a present file', () => {
    fs.existsSync.mockReturnValue(true)
    const out = service.streamFile({ storedName: '2025/01/uuid-1', mimeType: 'image/png', originalName: 'x.png' })
    expect(out).toEqual({
      path: expect.stringContaining('uuid-1'),
      mimeType: 'image/png',
      filename: 'x.png',
    })
  })

  test('defaults mimeType to application/octet-stream when unset', () => {
    fs.existsSync.mockReturnValue(true)
    const out = service.streamFile({ storedName: '2025/01/uuid-1', mimeType: null, originalName: 'x' })
    expect(out.mimeType).toBe('application/octet-stream')
  })
})

describe('attachment.remove', () => {
  test('throws 404 when row missing (via getById)', async () => {
    Attachment.findByPk.mockResolvedValue(null)
    await expect(service.remove('missing')).rejects.toEqual({ status: 404, message: 'Attachment not found' })
  })

  test('unlinks the file and destroys the row', async () => {
    const att = { id: 'a1', storedName: '2025/01/uuid-1', destroy: jest.fn().mockResolvedValue() }
    Attachment.findByPk.mockResolvedValue(att)
    fs.existsSync.mockReturnValue(true)
    await service.remove('a1')
    expect(fs.unlinkSync).toHaveBeenCalled()
    expect(att.destroy).toHaveBeenCalled()
  })

  test('still destroys the row when the file is already gone', async () => {
    const att = { id: 'a1', storedName: '2025/01/uuid-1', destroy: jest.fn().mockResolvedValue() }
    Attachment.findByPk.mockResolvedValue(att)
    fs.existsSync.mockReturnValue(false)
    await service.remove('a1')
    expect(fs.unlinkSync).not.toHaveBeenCalled()
    expect(att.destroy).toHaveBeenCalled()
  })

  test('swallows unlink errors and still destroys the row', async () => {
    const att = { id: 'a1', storedName: '2025/01/uuid-1', destroy: jest.fn().mockResolvedValue() }
    Attachment.findByPk.mockResolvedValue(att)
    fs.existsSync.mockReturnValue(true)
    fs.unlinkSync.mockImplementation(() => { throw new Error('EBUSY') })
    await service.remove('a1')
    expect(att.destroy).toHaveBeenCalled()
  })
})
