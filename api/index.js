/**
 * Vercel Functions entrypoint for the Express API.
 *
 * server/app.js builds the Express app and (outside serverless mode) starts
 * its own HTTP listener. In serverless mode (Vercel sets VERCEL=1) it skips
 * the listener, Socket.IO and background timers, and exports the app plus a
 * `ready` promise that resolves once DB/cache/module bootstrap has finished.
 *
 * Every request is awaited on `ready` first — the app mounts its module
 * routes and 404/error handlers asynchronously, so handling a request before
 * bootstrap completes would hang.
 */
const serverApp = require('../server/app')

// Sequelize loads dialect drivers via dynamic require(), which Vercel's file
// tracer cannot see — pin them here so pg ships inside the lambda bundle.
require('pg')
require('pg-hstore')

const app = serverApp
const ready = serverApp.ready

module.exports = async function handler(req, res) {
  await ready
  return app(req, res)
}
