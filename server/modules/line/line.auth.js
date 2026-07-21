const { verifyLiffIdToken } = require('../../../shared/erp/line-integration/services/line-liff-auth.service')

async function verifyLiffRequest(req, res, next) {
  try {
    const idToken = req.get('x-line-id-token')
    const organizationId = req.params.organizationId || req.body.organizationId
    const { connection, profile } = await verifyLiffIdToken({ idToken, organizationId })
    req.line = { connection, profile }
    next()
  } catch (error) {
    res.status(error.status || 401).json({ success: false, message: error.message || 'LINE authentication failed' })
  }
}

module.exports = { verifyLiffRequest }
