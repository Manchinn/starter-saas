const fs = require('fs')
const os = require('os')
const path = require('path')
const {
  inventory,
  relativeUploadsPath,
  resolveInside,
  restoreSnapshot,
} = require('../uploads-snapshot')

function tempDir() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'saas-uploads-'))
}

describe('uploads snapshot helpers', () => {
  test('restores files and verifies their content inventory', () => {
    const root = tempDir()
    const source = path.join(root, 'source')
    const target = path.join(root, 'target')
    fs.mkdirSync(path.join(source, 'attachments', '2026', '07'), { recursive: true })
    fs.mkdirSync(path.join(source, 'logos'), { recursive: true })
    fs.writeFileSync(path.join(source, 'attachments', '2026', '07', 'file-id'), 'attachment')
    fs.writeFileSync(path.join(source, 'logos', 'logo.png'), 'logo')

    const files = restoreSnapshot(source, target)

    expect(files).toHaveLength(2)
    expect(inventory(target)).toEqual(files)
    expect(fs.readFileSync(path.join(target, 'logos', 'logo.png'), 'utf8')).toBe('logo')
  })

  test('refuses to overwrite a populated target directory', () => {
    const root = tempDir()
    const source = path.join(root, 'source')
    const target = path.join(root, 'target')
    fs.mkdirSync(source)
    fs.mkdirSync(target)
    fs.writeFileSync(path.join(target, 'existing'), 'data')

    expect(() => restoreSnapshot(source, target)).toThrow('Target uploads directory is not empty')
  })

  test('keeps file lookups inside the uploads root', () => {
    const root = tempDir()
    expect(resolveInside(root, 'attachments/2026/07/file-id', 'attachment'))
      .toBe(path.join(root, 'attachments', '2026', '07', 'file-id'))
    expect(resolveInside(root, '/uploads/logos/logo.png', 'logo'))
      .toBe(path.join(root, 'logos', 'logo.png'))
    expect(relativeUploadsPath('uploads/logos/logo.png', 'logo')).toBe('logos/logo.png')
    expect(() => resolveInside(root, '../outside', 'attachment')).toThrow('Unsafe attachment path')
    expect(() => resolveInside(root, '/outside', 'attachment')).toThrow('Unsafe attachment path')
  })
})
