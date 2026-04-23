const ok = (res, data = null, message = 'Success', statusCode = 200) =>
  res.status(statusCode).json({ success: true, message, data })

const created = (res, data = null, message = 'Created') => ok(res, data, message, 201)

const fail = (res, message = 'An error occurred', statusCode = 400, errors = null) => {
  const body = { success: false, message }
  if (errors) body.errors = errors
  return res.status(statusCode).json(body)
}

const notFound    = (res, message = 'Not found')             => fail(res, message, 404)
const unauthorized = (res, message = 'Unauthorized')          => fail(res, message, 401)
const forbidden   = (res, message = 'Forbidden')             => fail(res, message, 403)
const serverError = (res, message = 'Internal server error') => fail(res, message, 500)
const noContent   = (res)                                    => res.status(204).end()

module.exports = { ok, created, fail, notFound, unauthorized, forbidden, serverError, noContent }
