const defineModule = ({
  slug,
  name,
  description = '',
  icon = 'cube',
  order = 0,
  isCore = false,
  permissions = [],
  meta = {},
  register,
}) => {
  if (!slug) throw new Error('Module must have a slug')
  if (typeof register !== 'function') throw new Error(`Module "${slug}" must implement register(app)`)
  return { slug, name, description, icon, order, isCore, permissions, meta, register }
}

module.exports = defineModule
