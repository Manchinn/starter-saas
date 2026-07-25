const crypto = require('crypto')
const fs = require('fs')
const path = require('path')

function assertDirectory(dir, label) {
  if (!fs.existsSync(dir)) throw new Error(`${label} directory does not exist: ${dir}`)
  if (!fs.statSync(dir).isDirectory()) throw new Error(`${label} path is not a directory: ${dir}`)
}

function listEntries(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))
}

function ensureEmptyDirectory(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true })
    return
  }
  if (!fs.statSync(dir).isDirectory()) throw new Error(`Target uploads path is not a directory: ${dir}`)
  if (listEntries(dir).length > 0) throw new Error(`Target uploads directory is not empty: ${dir}`)
}

function fileHash(filePath) {
  return crypto.createHash('sha256').update(fs.readFileSync(filePath)).digest('hex')
}

function inventory(root, relative = '') {
  const current = path.join(root, relative)
  const entries = []
  for (const entry of listEntries(current)) {
    const childRelative = path.join(relative, entry.name)
    const child = path.join(root, childRelative)
    const stat = fs.lstatSync(child)
    if (stat.isSymbolicLink()) throw new Error(`Uploads snapshot contains a symbolic link: ${childRelative}`)
    if (stat.isDirectory()) {
      entries.push(...inventory(root, childRelative))
    } else if (stat.isFile()) {
      entries.push({ path: childRelative.split(path.sep).join('/'), size: stat.size, sha256: fileHash(child) })
    } else {
      throw new Error(`Uploads snapshot contains an unsupported entry: ${childRelative}`)
    }
  }
  return entries
}

function restoreSnapshot(source, target) {
  assertDirectory(source, 'Uploads source')
  ensureEmptyDirectory(target)
  const sourceInventory = inventory(source)

  for (const entry of listEntries(source)) {
    fs.cpSync(path.join(source, entry.name), path.join(target, entry.name), {
      recursive: true,
      force: false,
      errorOnExist: true,
    })
  }

  const targetInventory = inventory(target)
  if (JSON.stringify(sourceInventory) !== JSON.stringify(targetInventory)) {
    throw new Error('Uploads restore verification failed: source and target file inventories differ')
  }
  return sourceInventory
}

function applyOwnership(root, uid, gid) {
  assertDirectory(root, 'Target uploads')
  for (const entry of listEntries(root)) {
    const child = path.join(root, entry.name)
    const stat = fs.lstatSync(child)
    if (stat.isSymbolicLink()) throw new Error(`Target uploads directory contains a symbolic link: ${child}`)
    if (stat.isDirectory()) applyOwnership(child, uid, gid)
    fs.chownSync(child, uid, gid)
  }
  fs.chownSync(root, uid, gid)
}

function relativeUploadsPath(value, label) {
  const pathValue = String(value || '').replace(/\\/g, '/')
  if (pathValue.startsWith('/uploads/')) return pathValue.slice('/uploads/'.length)
  if (pathValue.startsWith('uploads/')) return pathValue.slice('uploads/'.length)
  if (pathValue.startsWith('/')) throw new Error(`Unsafe ${label} path: ${value}`)
  return pathValue
}

function resolveInside(root, value, label) {
  const relative = relativeUploadsPath(value, label)
  const resolved = path.resolve(root, relative)
  if (resolved !== root && !resolved.startsWith(`${root}${path.sep}`)) {
    throw new Error(`Unsafe ${label} path: ${value}`)
  }
  return resolved
}

module.exports = {
  applyOwnership,
  inventory,
  relativeUploadsPath,
  resolveInside,
  restoreSnapshot,
}
