const { LineConnection } = require('../../../../server/models')

/**
 * Verify a LIFF ID token against LINE OAuth for the org's active connection.
 * Returns { connection, profile } for the HTTP adapter to attach to the request.
 */
async function verifyLiffIdToken({ idToken, organizationId }) {
  if (!idToken || !organizationId) throw { status: 401, message: 'LINE ID token and organization are required' }
  const connection = await LineConnection.findOne({ where: { organizationId, isActive: true } })
  if (!connection) throw { status: 404, message: 'LINE ordering is not configured for this organization' }
  const body = new URLSearchParams({ id_token: idToken, client_id: connection.liffChannelId })
  const response = await fetch('https://api.line.me/oauth2/v2.1/verify', {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body,
  })
  if (!response.ok) throw { status: 401, message: 'Invalid LINE ID token' }
  const profile = await response.json()
  if (!profile.sub) throw { status: 401, message: 'LINE ID token has no user subject' }
  return {
    connection,
    profile: { userId: profile.sub, displayName: profile.name, pictureUrl: profile.picture },
  }
}

module.exports = { verifyLiffIdToken }
