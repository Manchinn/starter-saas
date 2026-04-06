/**
 * BaseModule — every feature module extends this class.
 *
 * Each module lives in server/modules/<slug>/<slug>.module.js and must:
 *  1. extend BaseModule
 *  2. call super({ slug, name, ... }) in its constructor
 *  3. implement register(app) to mount its router
 */
class BaseModule {
  constructor({ slug, name, description = '', icon = 'cube', order = 0, isCore = false, permissions = [], meta = {} }) {
    if (!slug) throw new Error('Module must have a slug')
    this.slug = slug
    this.name = name
    this.description = description
    this.icon = icon
    this.order = order
    this.isCore = isCore
    this.permissions = permissions
    this.meta = meta
  }

  /**
   * Mount the module's router on the Express app.
   * @param {import('express').Application} app
   */
  register(app) {
    throw new Error(`Module "${this.slug}" must implement register(app)`)
  }
}

module.exports = BaseModule
