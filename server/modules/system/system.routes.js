const { Router } = require('express')
const controller = require('./system.controller')

const router = Router()

router.get('/db/status',        (req, res) => controller.dbStatus(req, res))
router.post('/db/test',         (req, res) => controller.testDb(req, res))
router.post('/db/configure',    (req, res) => controller.configureDb(req, res))

router.get('/redis/status',     (req, res) => controller.redisStatus(req, res))
router.post('/redis/test',      (req, res) => controller.testRedis(req, res))
router.post('/redis/configure', (req, res) => controller.configureRedis(req, res))

module.exports = router
