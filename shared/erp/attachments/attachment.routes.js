const express = require('express')
const { authenticate } = require('../../../server/middleware/auth')
const controller = require('./attachment.controller')

const router = express.Router()
router.use(authenticate)

// Allow up to 15 MB JSON body to accommodate base64-encoded files (~10 MB binary)
router.use(express.json({ limit: '15mb' }))

router.get('/',           controller.list)
router.post('/',          controller.create)
router.get('/:id/download', controller.download)
router.delete('/:id',     controller.remove)

module.exports = { mountPath: '/attachments', router }