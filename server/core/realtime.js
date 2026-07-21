const { Server } = require('socket.io')
const jwt = require('jsonwebtoken')
const config = require('../config/config')
const log = require('./logger').forLabel('realtime')

let io = null

const roomOrg   = (orgId)         => `org:${orgId}`
const roomAdmin = (orgId)         => `orgadmin:${orgId}`
const roomDept  = (deptId)        => `dept:${deptId}`
const roomMod   = (orgId, slug)   => `mod:${orgId}:${slug}`
const roomUser  = (userId)        => `user:${userId}`

const orgKeyOf = (user) => user.organizationId || user.id

// Attach Socket.IO to the HTTP server. Sockets authenticate with the JWT access
// token (same secret as the REST API) and join scoped rooms so realtime alerts
// reach exactly the eligible recipients.
const init = (server) => {
  io = new Server(server, {
    cors: { origin: config.clientUrl, credentials: true },
  })

  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token
      if (!token) return next(new Error('Authentication required'))
      const decoded = jwt.verify(token, config.jwt.secret)
      const { User } = require('../models')
      const user = await User.findByPk(decoded.id)
      if (!user || !user.isActive) return next(new Error('Invalid account'))
      socket.user = user
      next()
    } catch (err) {
      next(new Error('Authentication failed'))
    }
  })

  io.on('connection', async (socket) => {
    const user = socket.user
    const orgId = orgKeyOf(user)
    socket.join(roomUser(user.id))
    socket.join(roomOrg(orgId))
    if (user.role === 'admin') socket.join(roomAdmin(orgId))

    // Join the user's department + module rooms so scoped alerts reach them.
    try {
      const svc = require('../../shared/erp/alert/services/alert.service')
      const deptIds = await svc.getUserDepartmentIds(user.id)
      deptIds.forEach((id) => socket.join(roomDept(id)))
      if (user.role !== 'admin') {
        const slugs = await svc.getUserModuleSlugs(user.id)
        slugs.forEach((slug) => socket.join(roomMod(orgId, slug)))
      }
    } catch (err) {
      log.error('failed to join scoped rooms', { error: err.message })
    }
  })

  log.info('Socket.IO initialised')
  return io
}

// Which rooms should receive an alert, given its scope.
const targetRooms = (alert) => {
  const orgId = alert.organizationId
  if (alert.scope === 'department') return [roomDept(alert.departmentId), roomAdmin(orgId)]
  if (alert.scope === 'module')     return [roomMod(orgId, alert.moduleSlug), roomAdmin(orgId)]
  return [roomOrg(orgId)] // global — admins are already in the org room
}

// Notify eligible clients that their alert feed changed. `reason` is one of
// 'new' | 'update' | 'remove'. Clients refetch through the permission-checked
// endpoint, so the payload is only a hint (used for an optional toast).
const emitAlertsChanged = (alert, reason = 'new') => {
  if (!io) return
  const plain = alert?.get ? alert.get({ plain: true }) : alert
  if (!plain?.organizationId) return
  const payload = {
    reason,
    alert: { id: plain.id, title: plain.title, severity: plain.severity, scope: plain.scope },
  }
  for (const room of targetRooms(plain)) io.to(room).emit('alerts:changed', payload)
}

const getIO = () => io

const disconnectUser = (userId) => {
  if (!io || !userId) return false
  io.in(roomUser(userId)).disconnectSockets(true)
  return true
}

module.exports = { init, emitAlertsChanged, disconnectUser, getIO }
