const { Router, raw } = require('express')
const { authenticate } = require('../../../middleware/auth')
const { requirePermission } = require('../../../middleware/permission')
const { verifyLiffRequest } = require('../line.auth')
const controller = require('../line.controller')

const router = Router()

// Webhook is unauthenticated. Signature verification uses the raw request bytes
// (see server/app.js LARGE_BODY_ROUTES skip + express.raw here), matching billing.
router.post('/webhook', raw({ type: '*/*' }), controller.webhook)
router.get('/liff/:organizationId/config', controller.publicLiffConfig)
router.use('/admin', authenticate, requirePermission('erp.line-integration.manage'))
router.get('/admin/connection', controller.getConnection)
router.put('/admin/connection', controller.saveConnection)
// Rich menu CRUD
router.get('/admin/rich-menus', controller.listRichMenus)
router.post('/admin/rich-menus', controller.createRichMenu)
router.post('/admin/rich-menus/validate', controller.validateRichMenu)
// Static rich menu paths — must be registered before :richMenuId
router.get('/admin/rich-menus/default', controller.getDefaultRichMenu)
router.delete('/admin/rich-menus/default', controller.cancelDefaultRichMenu)
router.get('/admin/rich-menus/aliases', controller.listRichMenuAliases)
router.post('/admin/rich-menus/aliases', controller.createRichMenuAlias)
// Parameterised rich menu id
router.get('/admin/rich-menus/:richMenuId', controller.getRichMenu)
router.delete('/admin/rich-menus/:richMenuId', controller.deleteRichMenu)
// Rich menu image
router.post('/admin/rich-menus/:richMenuId/image', controller.uploadRichMenuImage)
router.get('/admin/rich-menus/:richMenuId/image', controller.downloadRichMenuImage)
// Default rich menu
router.post('/admin/rich-menus/:richMenuId/default', controller.setDefaultRichMenu)
// Per-user rich menu link
router.get('/admin/rich-menus/users/:userId', controller.getRichMenuOfUser)
router.delete('/admin/rich-menus/users/:userId', controller.unlinkRichMenuFromUser)
router.post('/admin/rich-menus/:richMenuId/users/:userId', controller.linkRichMenuToUser)
// Rich menu alias (parameterised)
router.get('/admin/rich-menus/aliases/:aliasId', controller.getRichMenuAlias)
router.put('/admin/rich-menus/aliases/:aliasId', controller.updateRichMenuAlias)
router.delete('/admin/rich-menus/aliases/:aliasId', controller.deleteRichMenuAlias)
// Bulk (user-level, 1-500 users)
router.post('/admin/rich-menus/bulk/link', controller.bulkLinkRichMenu)
router.post('/admin/rich-menus/bulk/unlink', controller.bulkUnlinkRichMenu)
// Batch (menu-level, 1-1000 operations)
router.post('/admin/rich-menus/batch', controller.submitRichMenuBatch)
router.post('/admin/rich-menus/batch/validate', controller.validateRichMenuBatch)
router.get('/admin/rich-menus/batch/:requestId/progress', controller.getRichMenuBatchProgress)
router.get('/liff/:organizationId/catalog', verifyLiffRequest, controller.catalog)
router.post('/liff/:organizationId/orders', verifyLiffRequest, controller.createOrder)
router.get('/liff/:organizationId/orders', verifyLiffRequest, controller.myOrders)

module.exports = router
