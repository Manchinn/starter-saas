const { ok, created, fail, serverError } = require('../../../server/core/response')
const { orgIdOf } = require('../../../server/core/tenant')
const agent = require('../services/agent.service')

const ctxUser = (req) => ({ id: req.user.id, organizationId: orgIdOf(req) })

module.exports = {
  async send(req, res) {
    try {
      const result = await agent.chat({
        user: ctxUser(req),
        permissionUser: req.user,
        conversationId: req.body.conversationId || null,
        content: req.body.content,
        lang: req.body.lang,
      })
      return ok(res, result)
    } catch (err) {
      return fail(res, err.message || 'Chat failed', err.status || 500)
    }
  },

  async conversations(req, res) {
    try {
      return ok(res, await agent.listConversations(req.user.id))
    } catch (err) {
      return serverError(res)
    }
  },

  async conversation(req, res) {
    try {
      return ok(res, await agent.getConversation(req.user.id, req.params.id))
    } catch (err) {
      return fail(res, err.message, err.status || 404)
    }
  },

  async remove(req, res) {
    try {
      await agent.removeConversation(req.user.id, req.params.id)
      return ok(res, null, 'Conversation deleted')
    } catch (err) {
      return fail(res, err.message, err.status || 404)
    }
  },
}
