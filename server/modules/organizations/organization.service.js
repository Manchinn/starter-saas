const fs = require('fs')
const path = require('path')
const crypto = require('crypto')
const { User, Module, Role, Permission, Employee, HrmsRole, HrmsPermission } = require('../../models')
const { Op } = require('sequelize')
const { resolvePermissions } = require('../../middleware/permission')
const { employeePermissionSlugs } = require('../../../shared/hrms/services/access.service')

// ── Privilege-escalation guards ───────────────────────────────────────────────
// `organizations.edit` is a delegable permission, so without these guards a
// non-admin holding it could mint a system admin (role='admin' ⇒ wildcard '*')
// or assign themselves a role carrying permissions they don't already have.

// `actor` is the authenticated user from the HTTP layer (the only untrusted
// entry point). When it's absent the call is internal/trusted (seeders, tests,
// programmatic setup) and the guards are skipped.

function assertCanSetAdminRole(actor, role) {
  if (!actor) return
  if (role === 'admin' && actor.role !== 'admin') {
    throw { status: 403, message: 'Only system administrators can grant the admin role.' }
  }
}

async function assertCanAssignRoles(actor, roleIds) {
  if (!actor) return
  if (!roleIds || !roleIds.length) return
  if (actor.role === 'admin') return // system admin may assign any role
  const actorPerms = await resolvePermissions(actor)
  if (actorPerms.has('*')) return
  const roles = await Role.findAll({
    where: { id: roleIds },
    include: [{ model: Permission, as: 'permissions', attributes: ['slug'] }],
  })
  for (const role of roles) {
    for (const p of role.permissions || []) {
      if (!actorPerms.has(p.slug)) {
        throw {
          status: 403,
          message: `You cannot assign the "${role.name}" role — it grants permissions you do not have.`,
        }
      }
    }
  }
}

// Logos live in the root uploads/ dir alongside attachments.
// Served publicly from /uploads/logos/* (see server/app.js).
const LOGO_ROOT = path.join(__dirname, '..', '..', '..', 'uploads', 'logos')
const LOGO_MAX_BYTES = 2 * 1024 * 1024 // 2 MB
const LOGO_ALLOWED_MIME = {
  'image/png':  '.png',
  'image/jpeg': '.jpg',
  'image/jpg':  '.jpg',
  'image/gif':  '.gif',
  'image/webp': '.webp',
  'image/svg+xml': '.svg',
}
const ensureDir = (dir) => { if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true }) }

const organizationIncludes = [
  { model: Module, as: 'modules', attributes: ['id', 'slug', 'name', 'icon', 'isActive'] },
  {
    model: Role, as: 'roles', attributes: ['id', 'slug', 'name', 'color'],
    include: [
      { model: Permission, as: 'permissions', attributes: ['id', 'slug', 'name'] },
      { model: Module, as: 'modules', attributes: ['id', 'slug', 'name', 'icon', 'isActive'] },
    ],
  },
  { model: User, as: 'parent',   attributes: ['id', 'name', 'email'] },
  { model: User, as: 'children', attributes: ['id', 'name', 'email', 'isActive'] },
]

const create = async ({ name, email, password, role = 'user', defaultPage = null, roleIds = [], organizationId = null, parentId = null }, actor) => {
  assertCanSetAdminRole(actor, role)
  await assertCanAssignRoles(actor, roleIds)

  const exists = await User.findOne({ where: { email } })
  if (exists) throw { status: 409, message: 'Email already registered' }

  const organization = await User.create({ name, email, password, role, defaultPage, organizationId, parentId: parentId || null })

  if (roleIds.length) {
    const roles = await Role.findAll({ where: { id: roleIds } })
    await organization.setRoles(roles)
  } else {
    // assign default viewer role
    const viewer = await Role.findOne({ where: { slug: 'viewer' } })
    if (viewer) await organization.setRoles([viewer])
  }

  return getById(organization.id)
}

const list = async ({ page = 1, limit = 20, search = '' }) => {
  const offset = (page - 1) * limit
  const where = {
    organizationId: null, // Only top-level organizations
    ...(search && {
      [Op.or]: [
        { name: { [Op.like]: `%${search}%` } },
        { email: { [Op.like]: `%${search}%` } },
      ],
    }),
  }

  const { count, rows } = await User.findAndCountAll({
    where,
    limit,
    offset,
    order: [['createdAt', 'DESC']],
    include: [
      { model: Role, as: 'roles', attributes: ['id', 'slug', 'name', 'color'] },
      { model: User, as: 'parent', attributes: ['id', 'name'] },
    ],
  })

  return { total: count, page, limit, organizations: rows }
}

const getById = async (id) => {
  const organization = await User.findByPk(id, { include: organizationIncludes })
  if (!organization) throw { status: 404, message: 'Organization not found' }
  return organization
}

const update = async (id, data, actor) => {
  const organization = await User.findByPk(id)
  if (!organization) throw { status: 404, message: 'Organization not found' }
  const allowed = [
    'name', 'role', 'isActive', 'defaultPage', 'parentId',
    // Org profile (used on customer-facing documents)
    'companyName', 'address', 'phone', 'taxId', 'website',
  ]
  const patch = Object.fromEntries(Object.entries(data).filter(([k]) => allowed.includes(k)))
  if ('role' in patch) assertCanSetAdminRole(actor, patch.role)
  if ('parentId' in patch) patch.parentId = patch.parentId || null
  await organization.update(patch)
  return User.findByPk(id, { include: [{ model: Role, as: 'roles', attributes: ['id', 'slug', 'name', 'color'] }, { model: User, as: 'parent', attributes: ['id', 'name'] }] })
}

// Logo upload — accepts a base64 string (with or without data-URL prefix).
// Writes the file under server/uploads/logos/{id}{ext}, persists the relative
// path on User.logoPath, and removes any previous logo file on disk so we
// don't accumulate orphans.
const uploadLogo = async (id, { dataBase64, contentType }) => {
  const organization = await User.findByPk(id)
  if (!organization) throw { status: 404, message: 'Organization not found' }
  if (!dataBase64) throw { status: 400, message: 'Logo data is required' }
  const ext = LOGO_ALLOWED_MIME[contentType]
  if (!ext) throw { status: 400, message: `Unsupported logo type "${contentType}"` }

  const cleaned = String(dataBase64).replace(/^data:[^;]+;base64,/, '')
  const buf = Buffer.from(cleaned, 'base64')
  if (buf.length > LOGO_MAX_BYTES) {
    throw { status: 400, message: `Logo exceeds maximum size of ${LOGO_MAX_BYTES / 1024 / 1024} MB` }
  }

  ensureDir(LOGO_ROOT)
  // Random suffix so the browser breaks its cache when the logo changes.
  const filename = `${id}-${crypto.randomBytes(4).toString('hex')}${ext}`
  const fullPath = path.join(LOGO_ROOT, filename)
  fs.writeFileSync(fullPath, buf)

  // Cleanup the old file so we don't accumulate orphans.
  if (organization.logoPath) {
    const old = path.join(LOGO_ROOT, path.basename(organization.logoPath))
    try { if (fs.existsSync(old)) fs.unlinkSync(old) } catch (_) { /* ignore */ }
  }

  const publicPath = `/uploads/logos/${filename}`
  await organization.update({ logoPath: publicPath })
  return User.findByPk(id, { include: [{ model: Role, as: 'roles', attributes: ['id', 'slug', 'name', 'color'] }, { model: User, as: 'parent', attributes: ['id', 'name'] }] })
}

const removeLogo = async (id) => {
  const organization = await User.findByPk(id)
  if (!organization) throw { status: 404, message: 'Organization not found' }
  if (organization.logoPath) {
    const full = path.join(LOGO_ROOT, path.basename(organization.logoPath))
    try { if (fs.existsSync(full)) fs.unlinkSync(full) } catch (_) { /* ignore */ }
  }
  await organization.update({ logoPath: null })
  return User.findByPk(id, { include: [{ model: Role, as: 'roles', attributes: ['id', 'slug', 'name', 'color'] }, { model: User, as: 'parent', attributes: ['id', 'name'] }] })
}

const remove = async (id) => {
  const organization = await User.findByPk(id)
  if (!organization) throw { status: 404, message: 'Organization not found' }
  await organization.destroy()
}

const assignModules = async (organizationId, moduleIds) => {
  const organization = await User.findByPk(organizationId)
  if (!organization) throw { status: 404, message: 'Organization not found' }
  const modules = await Module.findAll({ where: { id: moduleIds } })
  await organization.setModules(modules)
  return getById(organizationId)
}

const assignRoles = async (organizationId, roleIds, actor) => {
  const organization = await User.findByPk(organizationId)
  if (!organization) throw { status: 404, message: 'Organization not found' }
  await assertCanAssignRoles(actor, roleIds)
  const roles = await Role.findAll({ where: { id: roleIds } })
  await organization.setRoles(roles)
  return getById(organizationId)
}

const getUserPermissions = async (organizationId) => {
  const organization = await User.findByPk(organizationId, {
    include: [{
      model: Role, as: 'roles',
      include: [{ model: Permission, as: 'permissions' }],
    }],
  })
  if (!organization) throw { status: 404, message: 'Organization not found' }
  if (organization.role === 'admin') return { isAdmin: true, permissions: ['*'] }
  const perms = [...new Set(organization.roles.flatMap((r) => r.permissions.map((p) => p.slug)))]
  return { isAdmin: false, permissions: perms }
}

// Returns merged list of modules the user can reach:
//   • modules assigned directly to the user
//   • modules granted via the user's global roles
//   • modules the user holds at least one permission in — including permissions
//     granted by HRMS roles attached to their employee record. Without this a
//     staff member could be given functions (e.g. erp.invoices.list) yet see no
//     nav, because the module itself was never explicitly assigned.
const getMyModules = async (organizationId) => {
  const organization = await User.findByPk(organizationId, {
    include: [
      { model: Module, as: 'modules', attributes: ['id', 'slug', 'name', 'icon', 'isActive'] },
      {
        model: Role, as: 'roles',
        include: [
          { model: Module, as: 'modules', attributes: ['id', 'slug', 'name', 'icon', 'isActive'] },
          { model: Permission, as: 'permissions', attributes: ['slug'] },
        ],
      },
    ],
  })
  if (!organization) throw { status: 404, message: 'Organization not found' }

  const seen = new Set()
  const merged = []
  const add = (m) => {
    if (m && !seen.has(m.id)) { seen.add(m.id); merged.push(m) }
  }
  for (const m of [
    ...organization.modules,
    ...organization.roles.flatMap((r) => r.modules),
  ]) add(m)

  // Derive modules from the user's effective permission slugs. A slug is
  // namespaced by its module (e.g. `erp.invoices.list` → `erp`), so the prefix
  // before the first dot is the module slug.
  const permSlugs = new Set()
  for (const r of organization.roles) for (const p of (r.permissions || [])) permSlugs.add(p.slug)
  for (const s of await employeePermissionSlugs(organizationId)) permSlugs.add(s)

  const moduleSlugs = [...new Set([...permSlugs].map((s) => s.split('.')[0]))]
  if (moduleSlugs.length) {
    const permModules = await Module.findAll({
      where: { slug: moduleSlugs, isActive: true },
      attributes: ['id', 'slug', 'name', 'icon', 'isActive'],
    })
    for (const m of permModules) add(m)
  }

  return merged
}

const getStaff = async (organizationId, search = '') => {
  const where = { organizationId }
  if (search) {
    where[Op.or] = [
      { name: { [Op.like]: `%${search}%` } },
      { email: { [Op.like]: `%${search}%` } },
    ]
  }
  return User.findAll({
    where,
    attributes: ['id', 'name', 'email', 'role', 'isActive'],
    order: [['name', 'ASC']],
  })
}

const listAllStaff = async ({ page = 1, limit = 20, search = '', organizationId = null }) => {
  const offset = (page - 1) * limit
  const where = {
    organizationId: organizationId ? organizationId : { [Op.ne]: null }, // Filter by specific org OR all staff
    ...(search && {
      [Op.or]: [
        { name: { [Op.like]: `%${search}%` } },
        { email: { [Op.like]: `%${search}%` } },
      ],
    }),
  }

  const { count, rows } = await User.findAndCountAll({
    where,
    limit,
    offset,
    attributes: ['id', 'name', 'email', 'role', 'isActive', 'organizationId'],
    include: [
      { model: User, as: 'organization', attributes: ['id', 'name'] },
      {
        model: Employee, as: 'employee', attributes: ['id'], required: false,
        include: [{
          model: HrmsRole, as: 'roles', attributes: ['id', 'name', 'color'], through: { attributes: [] },
          include: [{ model: HrmsPermission, as: 'permissions', attributes: ['slug', 'name'], through: { attributes: [] } }],
        }],
      },
    ],
    order: [['createdAt', 'DESC']],
    distinct: true,
  })

  return { total: count, page, limit, staff: rows }
}

const listAll = async () => {
  return User.findAll({
    where: { organizationId: null },
    attributes: ['id', 'name', 'email'],
    order: [['name', 'ASC']],
  })
}

module.exports = { create, list, getById, update, uploadLogo, removeLogo, remove, assignModules, assignRoles, getUserPermissions, getMyModules, getStaff, listAllStaff, listAll }
