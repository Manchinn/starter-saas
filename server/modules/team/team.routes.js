const { Router } = require('express')
const controller = require('./team.controller')
const { authenticate } = require('../../middleware/auth')
const { validate } = require('../../middleware/validate')
const { writeLimiter } = require('../../middleware/rate-limit')
const { requireTeamManager } = require('./team.middleware')
const { createRules, updateRules, passwordRules, rolesRules } = require('./team.validators')

const router = Router()

router.use(authenticate)
router.use(requireTeamManager)

router.get('/',           (req, res) => controller.list(req, res))
router.get('/roles',      (req, res) => controller.assignableRoles(req, res))
router.get('/:id',        (req, res) => controller.getById(req, res))
router.post('/',          writeLimiter, createRules,   validate, (req, res) => controller.create(req, res))
router.put('/:id',        writeLimiter, updateRules,   validate, (req, res) => controller.update(req, res))
router.post('/:id/password', writeLimiter, passwordRules, validate, (req, res) => controller.setPassword(req, res))
router.put('/:id/roles',  writeLimiter, rolesRules,    validate, (req, res) => controller.assignRoles(req, res))
router.delete('/:id',     writeLimiter, (req, res) => controller.remove(req, res))

module.exports = router
