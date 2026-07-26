/**
 * Alert Relay — receives Uptime Kuma webhook and forwards to LINE Notify.
 *
 * Runs as a standalone container (no shared deps with API) so alerts fire
 * even when the API container is down.
 *
 * Uptime Kuma webhook payload (simplified):
 *   { "msg": "Monitor ... is down", "monitor": {...}, "heartbeat": {...} }
 *
 * LINE Notify API: POST https://notify-api.line.me/api/notify
 *   Authorization: Bearer <LINE_NOTIFY_TOKEN>
 *   message: <string> (max 1000 chars)
 */

const http = require('http')
const https = require('https')

const PORT = parseInt(process.env.PORT || '3003', 10)
const LINE_NOTIFY_TOKEN = process.env.LINE_NOTIFY_TOKEN
const LINE_NOTIFY_URL = 'https://notify-api.line.me/api/notify'

if (!LINE_NOTIFY_TOKEN) {
  console.warn('[alert-relay] LINE_NOTIFY_TOKEN not set — alerts will be logged but not forwarded')
}

function sendLineNotify(message) {
  if (!LINE_NOTIFY_TOKEN) {
    console.log(`[alert-relay] (dry run) Would send: ${message.replace(/\n/g, ' | ')}`)
    return Promise.resolve({ status: 0, body: 'LINE_NOTIFY_TOKEN not configured' })
  }
  const data = new URLSearchParams({ message: message.substring(0, 1000) })
  const options = {
    hostname: 'notify-api.line.me',
    path: '/api/notify',
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${LINE_NOTIFY_TOKEN}`,
      'Content-Type': 'application/x-www-form-urlencoded',
      'Content-Length': Buffer.byteLength(data.toString()),
    },
  }

  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let body = ''
      res.on('data', (chunk) => { body += chunk })
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve({ status: res.statusCode, body })
        } else {
          reject(new Error(`LINE Notify ${res.statusCode}: ${body}`))
        }
      })
    })
    req.on('error', reject)
    req.write(data.toString())
    req.end()
  })
}

function parseUptimeKumaPayload(payload) {
  // Uptime Kuma sends various formats; we extract the most useful bits
  const monitor = payload.monitor || {}
  const heartbeat = payload.heartbeat || {}

  const name = monitor.name || 'Unknown Monitor'
  const url = monitor.url || 'N/A'
  const status = heartbeat.status || payload.status || 'unknown'
  const time = heartbeat.time || new Date().toISOString()

  let emoji = '⚠️'
  if (status === 1 || status === 'up') emoji = '✅'
  else if (status === 0 || status === 'down') emoji = '🔴'

  return `${emoji} [${status === 1 || status === 'up' ? 'UP' : 'DOWN'}] ${name}\nURL: ${url}\nTime: ${time}`
}

const server = http.createServer(async (req, res) => {
  if (req.method !== 'POST' || req.url !== '/notify') {
    res.writeHead(404)
    return res.end('Not found')
  }

  let body = ''
  req.on('data', (chunk) => { body += chunk })
  req.on('end', async () => {
    try {
      const payload = JSON.parse(body)
      const message = parseUptimeKumaPayload(payload)

      console.log(`[alert-relay] Forwarding: ${message.replace(/\n/g, ' | ')}`)
      await sendLineNotify(message)

      res.writeHead(200, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify({ ok: true }))
    } catch (err) {
      console.error('[alert-relay] Error:', err.message)
      res.writeHead(500, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify({ ok: false, error: err.message }))
    }
  })
})

server.listen(PORT, () => {
  console.log(`[alert-relay] Listening on :${PORT}`)
})

process.on('SIGTERM', () => {
  console.log('[alert-relay] Shutting down...')
  server.close(() => process.exit(0))
})