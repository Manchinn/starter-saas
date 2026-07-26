/**
 * Server line-rich-menu.service re-exports shared implementation — smoke that
 * require path works. Full behaviour coverage lives under
 * shared/erp/line-integration/__tests__/line-rich-menu.service.test.js.
 */
const service = require('../../../../shared/erp/line-integration/services/line-rich-menu.service')

describe('server line-rich-menu.service re-export', () => {
  test('exports all rich menu functions', () => {
    expect(typeof service.listRichMenus).toBe('function')
    expect(typeof service.getRichMenu).toBe('function')
    expect(typeof service.createRichMenu).toBe('function')
    expect(typeof service.validateRichMenuObject).toBe('function')
    expect(typeof service.deleteRichMenu).toBe('function')
    expect(typeof service.uploadRichMenuImage).toBe('function')
    expect(typeof service.downloadRichMenuImage).toBe('function')
    expect(typeof service.setDefaultRichMenu).toBe('function')
    expect(typeof service.getDefaultRichMenu).toBe('function')
    expect(typeof service.cancelDefaultRichMenu).toBe('function')
    expect(typeof service.linkRichMenuToUser).toBe('function')
    expect(typeof service.getRichMenuOfUser).toBe('function')
    expect(typeof service.unlinkRichMenuFromUser).toBe('function')
    expect(typeof service.createRichMenuAlias).toBe('function')
    expect(typeof service.listRichMenuAliases).toBe('function')
    expect(typeof service.getRichMenuAlias).toBe('function')
    expect(typeof service.updateRichMenuAlias).toBe('function')
    expect(typeof service.deleteRichMenuAlias).toBe('function')
  })
})
