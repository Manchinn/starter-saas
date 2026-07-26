/**
 * LINE rich menu service boundaries (mocked collaborators).
 *
 * 1. CRUD — list, create, get, delete, validate. Requires active connection.
 *    Missing/inactive connection fails closed with 404/400.
 * 2. Image — upload base64 via setRichMenuImage, download stream via getRichMenuImage.
 * 3. Default — set, get (null when unset), cancel.
 * 4. Per-user — link, get (null when unset), unlink.
 * 5. Alias — create, list, get, update, delete. AliasId format validation.
 *
 * Note: jest resetMocks + clearAllMocks in beforeEach wipe both state and
 * implementations, so every suite must re-arm mocks via armMockClient().
 */

jest.mock('../../../../server/config/config', () => ({
  line: { credentialEncryptionKey: Buffer.alloc(32, 7).toString('base64') },
  db: { dialect: 'sqlite', storage: ':memory:' },
}))

jest.mock('../../../../server/models', () => ({
  LineConnection: { findOne: jest.fn() },
}))

jest.mock('../services/line.crypto', () => ({
  decrypt: jest.fn((v) => v),
}))

// sdk mock — fromChannelAccessToken is the factory; it gets reset each test.
// armMockClient() (called in beforeEach) installs the returned mock object.
jest.mock('@line/bot-sdk', () => ({
  LineBotClient: {
    fromChannelAccessToken: jest.fn(),
  },
}))

const { LineConnection } = require('../../../../server/models')
const sdk = require('@line/bot-sdk')

const {
  listRichMenus,
  getRichMenu,
  createRichMenu,
  validateRichMenuObject,
  deleteRichMenu,
  uploadRichMenuImage,
  downloadRichMenuImage,
  setDefaultRichMenu,
  getDefaultRichMenu,
  cancelDefaultRichMenu,
  linkRichMenuToUser,
  getRichMenuOfUser,
  unlinkRichMenuFromUser,
  createRichMenuAlias,
  listRichMenuAliases,
  getRichMenuAlias,
  updateRichMenuAlias,
  deleteRichMenuAlias,
} = require('../services/line-rich-menu.service')

const ORG_ID = 'org-1'
const RICH_MENU_ID = 'richmenu-test-123'
const USER_ID = 'U_test_user'
const ALIAS_ID = 'menu-alias-1'

const connection = {
  id: 'conn-1',
  organizationId: ORG_ID,
  isActive: true,
  channelAccessTokenEncrypted: 'encrypted-token',
}

const sampleRichMenu = {
  size: { width: 2500, height: 1686 },
  selected: false,
  name: 'Main Menu',
  chatBarText: 'Menu',
  areas: [
    {
      bounds: { x: 0, y: 0, width: 1250, height: 1686 },
      action: { type: 'uri', uri: 'https://example.com' },
    },
    {
      bounds: { x: 1250, y: 0, width: 1250, height: 1686 },
      action: { type: 'postback', data: 'action=help' },
    },
  ],
}

function mockClient() {
  return sdk.LineBotClient.fromChannelAccessToken()
}

/**
 * Install fresh jest mocks for every SDK client method on a new plain object
 * and wire it as the return value of fromChannelAccessToken.
 * Must be called in beforeEach because resetMocks wipes everything each test.
 */
function armMockClient() {
  const mc = {
    getRichMenuList: jest.fn(),
    getRichMenu: jest.fn(),
    createRichMenu: jest.fn(),
    validateRichMenuObject: jest.fn(),
    deleteRichMenu: jest.fn(),
    setRichMenuImage: jest.fn(),
    getRichMenuImage: jest.fn(),
    setDefaultRichMenu: jest.fn(),
    getDefaultRichMenuId: jest.fn(),
    cancelDefaultRichMenu: jest.fn(),
    linkRichMenuIdToUser: jest.fn(),
    getRichMenuIdOfUser: jest.fn(),
    unlinkRichMenuIdFromUser: jest.fn(),
    createRichMenuAlias: jest.fn(),
    getRichMenuAliasList: jest.fn(),
    getRichMenuAlias: jest.fn(),
    updateRichMenuAlias: jest.fn(),
    deleteRichMenuAlias: jest.fn(),
  }
  sdk.LineBotClient.fromChannelAccessToken.mockReturnValue(mc)
  return mc
}

beforeEach(() => {
  LineConnection.findOne.mockResolvedValue(connection)
  armMockClient()
})

// ---- Connection guard tests ----

describe('connection guard', () => {
  test('throws 404 when no connection exists', async () => {
    LineConnection.findOne.mockResolvedValue(null)
    await expect(listRichMenus(ORG_ID)).rejects.toMatchObject({
      status: 404,
      message: expect.stringMatching(/not configured/i),
    })
  })

  test('throws 400 when connection is inactive', async () => {
    LineConnection.findOne.mockResolvedValue({ ...connection, isActive: false })
    await expect(listRichMenus(ORG_ID)).rejects.toMatchObject({
      status: 400,
      message: expect.stringMatching(/inactive/i),
    })
  })
})

// ---- CRUD ----

describe('CRUD', () => {
  test('listRichMenus returns the richmenus array', async () => {
    const menus = [{ richMenuId: 'rm-1', name: 'A' }, { richMenuId: 'rm-2', name: 'B' }]
    mockClient().getRichMenuList = jest.fn().mockResolvedValue({ richmenus: menus })
    const result = await listRichMenus(ORG_ID)
    expect(result).toEqual(menus)
  })

  test('listRichMenus handles empty response', async () => {
    mockClient().getRichMenuList = jest.fn().mockResolvedValue({ richmenus: [] })
    const result = await listRichMenus(ORG_ID)
    expect(result).toEqual([])
  })

  test('getRichMenu returns a single rich menu', async () => {
    mockClient().getRichMenu = jest.fn().mockResolvedValue({ richMenuId: RICH_MENU_ID, name: 'Main' })
    const result = await getRichMenu(ORG_ID, RICH_MENU_ID)
    expect(result.richMenuId).toBe(RICH_MENU_ID)
    expect(mockClient().getRichMenu).toHaveBeenCalledWith(RICH_MENU_ID)
  })

  test('createRichMenu validates and creates', async () => {
    mockClient().createRichMenu = jest.fn().mockResolvedValue({ richMenuId: RICH_MENU_ID })
    const result = await createRichMenu(ORG_ID, sampleRichMenu)
    expect(result.richMenuId).toBe(RICH_MENU_ID)
    expect(mockClient().createRichMenu).toHaveBeenCalledWith(sampleRichMenu)
  })

  test('createRichMenu rejects missing size', async () => {
    await expect(createRichMenu(ORG_ID, { ...sampleRichMenu, size: null }))
      .rejects.toMatchObject({ status: 400, message: expect.stringMatching(/size/) })
    expect(mockClient().createRichMenu).not.toHaveBeenCalled()
  })

  test('createRichMenu rejects empty areas', async () => {
    await expect(createRichMenu(ORG_ID, { ...sampleRichMenu, areas: [] }))
      .rejects.toMatchObject({ status: 400, message: expect.stringMatching(/areas/) })
  })

  test('createRichMenu rejects >20 areas', async () => {
    const areas = Array.from({ length: 21 }, (_, i) => ({
      bounds: { x: i, y: 0, width: 1, height: 1 },
      action: { type: 'message', text: String(i) },
    }))
    await expect(createRichMenu(ORG_ID, { ...sampleRichMenu, areas }))
      .rejects.toMatchObject({ status: 400, message: expect.stringMatching(/20/) })
  })

  test('createRichMenu rejects long chatBarText', async () => {
    await expect(createRichMenu(ORG_ID, { ...sampleRichMenu, chatBarText: 'A'.repeat(15) }))
      .rejects.toMatchObject({ status: 400, message: expect.stringMatching(/chatBarText/) })
  })

  test('createRichMenu rejects long name', async () => {
    await expect(createRichMenu(ORG_ID, { ...sampleRichMenu, name: 'X'.repeat(301) }))
      .rejects.toMatchObject({ status: 400, message: expect.stringMatching(/name/) })
  })

  test('validateRichMenuObject calls SDK validate', async () => {
    mockClient().validateRichMenuObject = jest.fn().mockResolvedValue(undefined)
    const result = await validateRichMenuObject(ORG_ID, sampleRichMenu)
    expect(result).toEqual({ valid: true })
    expect(mockClient().validateRichMenuObject).toHaveBeenCalledWith(sampleRichMenu)
  })

  test('deleteRichMenu calls SDK delete', async () => {
    mockClient().deleteRichMenu = jest.fn().mockResolvedValue(undefined)
    const result = await deleteRichMenu(ORG_ID, RICH_MENU_ID)
    expect(result).toEqual({ deleted: true })
    expect(mockClient().deleteRichMenu).toHaveBeenCalledWith(RICH_MENU_ID)
  })
})

// ---- Image ----

describe('image', () => {
  test('uploadRichMenuImage calls setRichMenuImage with buffer', async () => {
    mockClient().setRichMenuImage = jest.fn().mockResolvedValue(undefined)
    const imageBase64 = Buffer.from('fake-image-data').toString('base64')
    const result = await uploadRichMenuImage(ORG_ID, RICH_MENU_ID, imageBase64, 'image/png')
    expect(result).toEqual({ uploaded: true })
    expect(mockClient().setRichMenuImage).toHaveBeenCalledWith(
      RICH_MENU_ID,
      expect.any(Buffer),
    )
  })

  test('uploadRichMenuImage rejects invalid content type', async () => {
    await expect(uploadRichMenuImage(ORG_ID, RICH_MENU_ID, 'aaa', 'image/gif'))
      .rejects.toMatchObject({ status: 400, message: expect.stringMatching(/contentType/) })
  })

  test('downloadRichMenuImage collects stream into base64', async () => {
    const chunks = [Buffer.from('img-data')]
    const readable = {
      async *[Symbol.asyncIterator]() {
        for (const chunk of chunks) yield chunk
      },
    }
    mockClient().getRichMenuImage = jest.fn().mockResolvedValue(readable)
    const result = await downloadRichMenuImage(ORG_ID, RICH_MENU_ID)
    expect(result.contentType).toBe('image/jpeg')
    expect(result.data).toMatch(/^data:image\/jpeg;base64,/)
  })
})

// ---- Default menu ----

describe('default menu', () => {
  test('setDefaultRichMenu calls SDK', async () => {
    mockClient().setDefaultRichMenu = jest.fn().mockResolvedValue(undefined)
    const result = await setDefaultRichMenu(ORG_ID, RICH_MENU_ID)
    expect(result).toEqual({ default: true })
    expect(mockClient().setDefaultRichMenu).toHaveBeenCalledWith(RICH_MENU_ID)
  })

  test('getDefaultRichMenu returns richMenuId when set', async () => {
    mockClient().getDefaultRichMenuId = jest.fn().mockResolvedValue({ richMenuId: RICH_MENU_ID })
    const result = await getDefaultRichMenu(ORG_ID)
    expect(result).toEqual({ richMenuId: RICH_MENU_ID })
  })

  test('getDefaultRichMenu returns null when not set (404)', async () => {
    const err = new Error('not found')
    err.status = 404
    mockClient().getDefaultRichMenuId = jest.fn().mockRejectedValue(err)
    const result = await getDefaultRichMenu(ORG_ID)
    expect(result).toEqual({ richMenuId: null })
  })

  test('cancelDefaultRichMenu calls SDK', async () => {
    mockClient().cancelDefaultRichMenu = jest.fn().mockResolvedValue(undefined)
    const result = await cancelDefaultRichMenu(ORG_ID)
    expect(result).toEqual({ default: false })
  })
})

// ---- Per-user link ----

describe('per-user link', () => {
  test('linkRichMenuToUser calls SDK', async () => {
    mockClient().linkRichMenuIdToUser = jest.fn().mockResolvedValue(undefined)
    const result = await linkRichMenuToUser(ORG_ID, USER_ID, RICH_MENU_ID)
    expect(result).toEqual({ linked: true })
    expect(mockClient().linkRichMenuIdToUser).toHaveBeenCalledWith(USER_ID, RICH_MENU_ID)
  })

  test('getRichMenuOfUser returns richMenuId when linked', async () => {
    mockClient().getRichMenuIdOfUser = jest.fn().mockResolvedValue({ richMenuId: RICH_MENU_ID })
    const result = await getRichMenuOfUser(ORG_ID, USER_ID)
    expect(result).toEqual({ richMenuId: RICH_MENU_ID })
  })

  test('getRichMenuOfUser returns null when not linked (404)', async () => {
    const err = new Error('not found')
    err.status = 404
    mockClient().getRichMenuIdOfUser = jest.fn().mockRejectedValue(err)
    const result = await getRichMenuOfUser(ORG_ID, USER_ID)
    expect(result).toEqual({ richMenuId: null })
  })

  test('unlinkRichMenuFromUser calls SDK', async () => {
    mockClient().unlinkRichMenuIdFromUser = jest.fn().mockResolvedValue(undefined)
    const result = await unlinkRichMenuFromUser(ORG_ID, USER_ID)
    expect(result).toEqual({ unlinked: true })
    expect(mockClient().unlinkRichMenuIdFromUser).toHaveBeenCalledWith(USER_ID)
  })
})

// ---- Alias ----

describe('alias', () => {
  test('createRichMenuAlias creates alias via SDK', async () => {
    mockClient().createRichMenuAlias = jest.fn().mockResolvedValue(undefined)
    const result = await createRichMenuAlias(ORG_ID, ALIAS_ID, RICH_MENU_ID)
    expect(result).toEqual({ richMenuAliasId: ALIAS_ID, richMenuId: RICH_MENU_ID })
    expect(mockClient().createRichMenuAlias).toHaveBeenCalledWith({
      richMenuAliasId: ALIAS_ID,
      richMenuId: RICH_MENU_ID,
    })
  })

  test('createRichMenuAlias rejects invalid aliasId format', async () => {
    await expect(createRichMenuAlias(ORG_ID, 'INVALID ALIAS!', RICH_MENU_ID))
      .rejects.toMatchObject({ status: 400, message: expect.stringMatching(/aliasId/) })
  })

  test('createRichMenuAlias rejects empty aliasId', async () => {
    await expect(createRichMenuAlias(ORG_ID, '', RICH_MENU_ID))
      .rejects.toMatchObject({ status: 400 })
  })

  test('listRichMenuAliases returns aliases array', async () => {
    const aliases = [
      { richMenuAliasId: 'a1', richMenuId: 'rm-1' },
      { richMenuAliasId: 'a2', richMenuId: 'rm-2' },
    ]
    mockClient().getRichMenuAliasList = jest.fn().mockResolvedValue({ aliases })
    const result = await listRichMenuAliases(ORG_ID)
    expect(result).toEqual(aliases)
  })

  test('getRichMenuAlias returns a single alias', async () => {
    mockClient().getRichMenuAlias = jest.fn().mockResolvedValue({ richMenuAliasId: ALIAS_ID, richMenuId: RICH_MENU_ID })
    const result = await getRichMenuAlias(ORG_ID, ALIAS_ID)
    expect(result.richMenuAliasId).toBe(ALIAS_ID)
  })

  test('updateRichMenuAlias calls SDK with correct args', async () => {
    mockClient().updateRichMenuAlias = jest.fn().mockResolvedValue(undefined)
    const result = await updateRichMenuAlias(ORG_ID, ALIAS_ID, 'rm-new')
    expect(result).toEqual({ richMenuAliasId: ALIAS_ID, richMenuId: 'rm-new' })
    expect(mockClient().updateRichMenuAlias).toHaveBeenCalledWith(ALIAS_ID, { richMenuId: 'rm-new' })
  })

  test('deleteRichMenuAlias calls SDK', async () => {
    mockClient().deleteRichMenuAlias = jest.fn().mockResolvedValue(undefined)
    const result = await deleteRichMenuAlias(ORG_ID, ALIAS_ID)
    expect(result).toEqual({ deleted: true })
    expect(mockClient().deleteRichMenuAlias).toHaveBeenCalledWith(ALIAS_ID)
  })
})
