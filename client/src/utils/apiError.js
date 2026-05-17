/**
 * Parse an axios-style error into a human-readable message.
 * Prefers structured `errors[].message` array, then the top-level
 * `message`, then the provided fallback.
 */
export function parseApiError(err, fallback = 'Something went wrong') {
  const d = err?.response?.data
  if (Array.isArray(d?.errors) && d.errors.length) {
    return d.errors.map(e => e.message).filter(Boolean).join(', ')
  }
  return d?.message || err?.message || fallback
}
