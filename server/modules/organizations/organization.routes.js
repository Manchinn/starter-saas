const { Router, json } = require('express')
const controller = require('./organization.controller')
const { authenticate } = require('../../middleware/auth')
const { requirePermission } = require('../../middleware/permission')
const { validate } = require('../../middleware/validate')
const { createRules } = require('./organization.validators')

const router = Router()

router.use(authenticate)

// Self — any authenticated user
router.get('/my-modules', (req, res) => controller.myModules(req, res))
router.get('/my-permissions', (req, res) => controller.myPermissions(req, res))
router.get('/staff', (req, res) => controller.listStaff(req, res))
router.get('/all-staff', requirePermission('organizations.list'), (req, res) => controller.listAllStaff(req, res))

// All organizations flat list (for select dropdowns)
router.get('/all', requirePermission('organizations.list'), (req, res) => controller.listAll(req, res))

// Permission-guarded
router.post('/', requirePermission('organizations.edit'), createRules, validate, (req, res) => controller.create(req, res))

router.get('/', requirePermission('organizations.list'), (req, res) => controller.list(req, res))
router.get('/:id', requirePermission('organizations.list'), (req, res) => controller.getById(req, res))
router.put('/:id', requirePermission('organizations.edit'), (req, res) => controller.update(req, res))
router.delete('/:id', requirePermission('organizations.delete'), (req, res) => controller.remove(req, res))
router.put('/:id/modules', requirePermission('organizations.edit'), (req, res) => controller.assignModules(req, res))
router.put('/:id/roles', requirePermission('organizations.edit'), (req, res) => controller.assignRoles(req, res))
// Logo is sent as a base64 image; the global parser skips this path (see
// server/app.js) so it gets a higher per-route cap. The service rejects the
// decoded image over 2 MB; 3 MB of JSON leaves room for base64 inflation.
router.post('/:id/logo', requirePermission('organizations.edit'), json({ limit: '3mb' }), (req, res) => controller.uploadLogo(req, res))
router.delete('/:id/logo', requirePermission('organizations.edit'), (req, res) => controller.removeLogo(req, res))

module.exports = router
