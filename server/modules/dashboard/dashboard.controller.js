const { ok, fail, serverError } = require('../../core/response')
const { User, Module, Role, RefreshToken } = require('../../models')
const { Op } = require('sequelize')

// 30-day vs prior-30-day growth as a percent. Returns null when prior bucket is 0
// so the UI can hide the trend chip instead of showing "+Infinity%".
function growthPct(current, previous) {
  if (!previous) return current > 0 ? null : 0
  return Math.round(((current - previous) / previous) * 1000) / 10
}

function adminOnly(req, res) {
  if (req.user?.role !== 'admin') {
    fail(res, 'Admin access required', 403)
    return false
  }
  return true
}

module.exports = {
  async stats(req, res) {
    try {
      if (!adminOnly(req, res)) return
      const now = new Date()
      const d30 = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
      const d60 = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000)

      const [
        totalOrganizations, orgsLast30, orgsPrev30,
        totalStaff, staffLast30, staffPrev30,
        activeSessions, sessionsLast30,
        enabledModules, totalModules,
      ] = await Promise.all([
        User.count({ where: { organizationId: null } }),
        User.count({ where: { organizationId: null, createdAt: { [Op.gte]: d30 } } }),
        User.count({ where: { organizationId: null, createdAt: { [Op.gte]: d60, [Op.lt]: d30 } } }),

        User.count({ where: { organizationId: { [Op.ne]: null } } }),
        User.count({ where: { organizationId: { [Op.ne]: null }, createdAt: { [Op.gte]: d30 } } }),
        User.count({ where: { organizationId: { [Op.ne]: null }, createdAt: { [Op.gte]: d60, [Op.lt]: d30 } } }),

        RefreshToken.count({ where: { isRevoked: false, expiresAt: { [Op.gt]: now } } }),
        RefreshToken.count({ where: { lastUsedAt: { [Op.gte]: d30 } } }),

        Module.count({ where: { isActive: true } }),
        Module.count(),
      ])

      return ok(res, {
        totalOrganizations,
        totalStaff,
        activeSessions,
        enabledModules,
        totalModules,
        trends: {
          organizations: growthPct(orgsLast30, orgsPrev30),
          staff:         growthPct(staffLast30, staffPrev30),
          sessions:      sessionsLast30,
        },
      })
    } catch (err) {
      return serverError(res)
    }
  },

  async organizations(req, res) {
    try {
      if (!adminOnly(req, res)) return
      const limit = Math.min(+req.query.limit || 10, 50)
      const orgs = await User.findAll({
        where: { organizationId: null },
        attributes: ['id', 'name', 'email', 'isActive', 'createdAt', 'lastLoginAt'],
        order: [['createdAt', 'DESC']],
        limit,
        include: [
          { model: Role, as: 'roles', attributes: ['id', 'slug', 'name', 'color'] },
          { model: Module, as: 'modules', attributes: ['id'] },
          { model: User, as: 'staff', attributes: ['id'] },
        ],
      })

      const rows = orgs.map((o) => {
        const json = o.toJSON()
        return {
          id:           json.id,
          name:         json.name,
          email:        json.email,
          isActive:     json.isActive,
          createdAt:    json.createdAt,
          lastLoginAt:  json.lastLoginAt,
          staffCount:   json.staff?.length || 0,
          roleCount:    json.roles?.length || 0,
          modulesCount: json.modules?.length || 0,
          roles:        json.roles || [],
        }
      })

      return ok(res, { organizations: rows })
    } catch (err) {
      return serverError(res)
    }
  },

  async recentSignIns(req, res) {
    try {
      if (!adminOnly(req, res)) return
      const limit = Math.min(+req.query.limit || 8, 50)
      const tokens = await RefreshToken.findAll({
        where: {
          isRevoked: false,
          lastUsedAt: { [Op.ne]: null },
        },
        order: [['lastUsedAt', 'DESC']],
        limit,
        attributes: ['id', 'userId', 'deviceLabel', 'userAgent', 'ip', 'lastUsedAt'],
        include: [{ model: User, as: 'user', attributes: ['id', 'name', 'email', 'organizationId'] }],
      })

      return ok(res, {
        sessions: tokens.map((t) => ({
          id:          t.id,
          deviceLabel: t.deviceLabel,
          ip:          t.ip,
          lastUsedAt:  t.lastUsedAt,
          user:        t.user ? { id: t.user.id, name: t.user.name, email: t.user.email, isOrganization: !t.user.organizationId } : null,
        })),
      })
    } catch (err) {
      return serverError(res)
    }
  },

  async moduleUsage(req, res) {
    try {
      if (!adminOnly(req, res)) return

      const totalOrgs = await User.count({ where: { organizationId: null } })

      const modules = await Module.findAll({
        attributes: ['id', 'slug', 'name', 'icon', 'isActive', 'isCore'],
        order: [['order', 'ASC'], ['name', 'ASC']],
        include: [{
          model: User, as: 'users',
          attributes: ['id'],
          through: { attributes: [] },
          where: { organizationId: null },
          required: false,
        }],
      })

      const rows = modules.map((m) => {
        const json = m.toJSON()
        const assignedOrgCount = json.users?.length || 0
        return {
          id:               json.id,
          slug:             json.slug,
          name:             json.name,
          icon:             json.icon,
          isActive:         json.isActive,
          isCore:           json.isCore,
          assignedOrgCount,
          pct:              totalOrgs ? Math.round((assignedOrgCount / totalOrgs) * 100) : 0,
        }
      })

      return ok(res, { totalOrgs, modules: rows })
    } catch (err) {
      return serverError(res)
    }
  },
}
