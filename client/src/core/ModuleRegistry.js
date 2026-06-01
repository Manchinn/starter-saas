/**
 * Client-side Module Registry — mirrors the server-side ModuleLoader.
 *
 * Each frontend module lives in src/modules/<slug>/index.js and must export
 * a default object with at minimum: { slug, routes }
 *
 * Optional fields:
 *   isCore       {boolean} – true → "Core" section, false → "Modules" section
 *   adminOnly    {boolean} – navItem hidden from non-admin users
 *   order        {number}  – sort order within section
 *   navItem      {object}  – shown to all authenticated users
 *   adminNavItem {object}  – shown only to admins (injected into Core section)
 */

// Local modules: src/modules/<slug>/index.js
const localModuleFiles  = import.meta.glob('../modules/**/index.js', { eager: true })
// Shared modules: every top-level folder under shared/ that exposes an index.js
// is auto-registered by its folder name — drop in a folder, no edit here needed.
// Single-segment `*` (not `**`) so submodule indexes like
// shared/erp/dashboard/index.js aren't picked up as top-level modules; the
// parent (e.g. shared/erp/index.js) aggregates those itself.
const sharedModuleFiles = import.meta.glob('../../../shared/*/index.js', { eager: true })
const moduleFiles = { ...localModuleFiles, ...sharedModuleFiles }

const registry = []
for (const path in moduleFiles) {
  const mod = moduleFiles[path]
  if (mod?.default) registry.push(mod.default)
}

// ── Routes ────────────────────────────────────────────────────────────────────

export function getModuleRoutes() {
  return registry.flatMap((m) => m.routes || [])
}

// ── Route permission guard ──────────────────────────────────────────────────
// Flattened [{ to, permission }] derived from every module's nav tree. Lets the
// router block direct-URL access to pages a user can't see in the sidebar,
// mirroring the per-item `permission` gating used by getNavSections.
let _permIndex = null

function collectPermEntries(node, out) {
  if (!node) return
  if (Array.isArray(node)) { for (const n of node) collectPermEntries(n, out); return }
  if (node.to && node.permission) out.push({ to: node.to, permission: node.permission })
  if (node.children) collectPermEntries(node.children, out)
}

function permIndex() {
  if (_permIndex) return _permIndex
  const out = []
  for (const mod of registry) {
    collectPermEntries(mod.navItem, out)
    collectPermEntries(mod.adminNavItem, out)
  }
  // Longest `to` first so the most specific entry wins (e.g. /erp/customers/create
  // resolves against /erp/customers, not a shorter ancestor).
  _permIndex = out.sort((a, b) => b.to.length - a.to.length)
  return _permIndex
}

/**
 * Permission slug required to view `path`, or null if the page is unguarded.
 * Matches the closest nav entry whose `to` equals or is a path-segment prefix
 * of `path` (so list permissions also cover their /create and /:id/edit pages).
 */
export function getRoutePermission(path) {
  for (const { to, permission } of permIndex()) {
    if (path === to || path.startsWith(to + '/')) return permission
  }
  return null
}

// ── Nav helpers ───────────────────────────────────────────────────────────────

function filterChildren(item, can) {
  if (!item.children) return item
  const children = item.children.filter((c) => !c.permission || can(c.permission))
  return children.length ? { ...item, children } : null
}

/**
 * Returns sidebar sections:
 *   [{ label: 'Modules', items: [...] }, { label: 'Core', items: [...] }]
 *
 * "Modules" section — navItems where isCore === false (extension modules)
 * "Core"    section — navItems where isCore === true + adminNavItems (admin only)
 *
 * @param {string[]|null} userModuleSlugs  null = admin (no filter)
 * @param {boolean}       isAdmin
 * @param {Function}      can(slug)        from usePermission
 */
export function getNavSections(userModuleSlugs = null, isAdmin = false, can = () => true) {
  const sorted = [...registry].sort((a, b) => (a.order || 0) - (b.order || 0))

  const sharedItems = []
  const coreItems   = []

  for (const mod of sorted) {
    // navItem — respect module-level visibility
    if (mod.navItem) {
      const item = mod.navItem
      const hasUserModules = userModuleSlugs && userModuleSlugs.length > 0

      const visible =
        !mod.adminOnly &&
        // Core modules always show; shared modules must appear in the active slugs list
        (mod.isCore || !userModuleSlugs || userModuleSlugs.includes(mod.slug)) &&
        // showIfHasUserModules: only render when the user has ≥1 active module
        (!item.showIfHasUserModules || !userModuleSlugs || hasUserModules)

      if (visible) {
        const entry = filterChildren(item, can)
        if (entry) (mod.isCore ? coreItems : sharedItems).push(entry)
      }
    }

    // adminNavItem — only for admins, always in Core section
    if (mod.adminNavItem && isAdmin) {
      const entry = filterChildren(mod.adminNavItem, can)
      if (entry) coreItems.push(entry)
    }
  }

  const sections = []
  if (sharedItems.length) sections.push({ label: 'nav.sections.modules', items: sharedItems })
  if (coreItems.length && isAdmin) sections.push({ label: 'nav.sections.core', items: coreItems })
  return sections
}

// Kept for backward compatibility
export function getNavItems(userModuleSlugs = null, isAdmin = false) {
  return getNavSections(userModuleSlugs, isAdmin).flatMap((s) => s.items)
}

export default registry
