class BaseController {
  /**
   * Send a success response.
   */
  ok(res, data = null, message = 'Success', statusCode = 200) {
    return res.status(statusCode).json({ success: true, message, data })
  }

  /**
   * Send a created response.
   */
  created(res, data = null, message = 'Created') {
    return this.ok(res, data, message, 201)
  }

  /**
   * Send an error response.
   */
  fail(res, message = 'An error occurred', statusCode = 400, errors = null) {
    const body = { success: false, message }
    if (errors) body.errors = errors
    return res.status(statusCode).json(body)
  }

  notFound(res, message = 'Not found') {
    return this.fail(res, message, 404)
  }

  unauthorized(res, message = 'Unauthorized') {
    return this.fail(res, message, 401)
  }

  forbidden(res, message = 'Forbidden') {
    return this.fail(res, message, 403)
  }

  serverError(res, message = 'Internal server error') {
    return this.fail(res, message, 500)
  }
}

module.exports = BaseController
