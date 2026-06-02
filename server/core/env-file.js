/**
 * Read / write helpers for the server's `.env` file.
 *
 * `dotenv` is loaded from process.cwd() by app.js, and npm runs the workspace
 * scripts with cwd = server/. So .env lives at server/.env (not the repo root).
 *
 * Comments are not preserved on write — for the handful of operator-driven
 * config screens that rewrite specific keys, a clean key=value rewrite is fine;
 * existing keys not in the update are kept.
 */
const fs = require('fs')
const path = require('path')

const SERVER_ROOT = path.resolve(__dirname, '..')
const ENV_PATH = path.join(SERVER_ROOT, '.env')

// Parse the current .env into a key→value map.
function readEnv() {
  if (!fs.existsSync(ENV_PATH)) return {}
  const text = fs.readFileSync(ENV_PATH, 'utf8')
  const map = {}
  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.trim()
    if (!line || line.startsWith('#')) continue
    const eq = line.indexOf('=')
    if (eq === -1) continue
    const k = line.slice(0, eq).trim()
    let v = line.slice(eq + 1).trim()
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
      v = v.slice(1, -1)
    }
    map[k] = v
  }
  return map
}

// Serialise a key→value map back to .env, quoting values with whitespace or
// special characters.
function writeEnv(map) {
  const lines = Object.entries(map).map(([k, v]) => {
    const needsQuote = v && /[\s#"']/.test(v)
    const value = needsQuote ? `"${String(v).replace(/"/g, '\\"')}"` : (v ?? '')
    return `${k}=${value}`
  })
  fs.writeFileSync(ENV_PATH, lines.join('\n') + '\n', 'utf8')
}

// Merge `updates` into the existing .env and persist. Returns the merged map.
function updateEnv(updates) {
  const env = readEnv()
  Object.assign(env, updates)
  writeEnv(env)
  return env
}

module.exports = { ENV_PATH, readEnv, writeEnv, updateEnv }
