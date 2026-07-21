const { LineConnection } = require('../../models')

async function verifyLiffRequest(req, res, next) {
  try {
    const idToken = req.get('x-line-id-token')
    const organizationId = req.params.organizationId || req.body.organizationId
    if (!idToken || !organizationId) throw { status: 401, message: 'LINE ID token and organization are required' }
    const connection = await LineConnection.findOne({ where: { organizationId, isActive: true } })
    if (!connection) throw { status: 404, message: 'LINE ordering is not configured for this organization' }
    const body = new URLSearchParams({ id_token: idToken, client_id: connection.liffChannelId })
    const response = await fetch('https://api.line.me/oauth2/v2.1/verify', { method: 'POST', headers: { 'content-type': 'application/x-www-form-urlencoded' }, body })
    if (!response.ok) throw { status: 401, message: 'Invalid LINE ID token' }
    const profile = await response.json()
    if (!profile.sub) throw { status: 401, message: 'LINE ID token has no user subject' }
    req.line = { connection, profile: { userId: profile.sub, displayName: profile.name, pictureUrl: profile.picture } }
    next()
  } catch (error) {
    res.status(error.status || 401).json({ success: false, message: error.message || 'LINE authentication failed' })
  }
}

module.exports = { verifyLiffRequest }
