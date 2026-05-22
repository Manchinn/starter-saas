import { ref } from 'vue'

/**
 * Per-form field-error state.
 *
 * Wires Axios 422 responses ({ errors: [{ field, message }, ...] }) into a
 * field-keyed object that `<FormField>` / `<FieldError>` read from.
 *
 * Usage:
 *   const { fieldErrors, setFromError, clearField, reset, errorOf, hasErrors } = useFieldErrors()
 *   try { await api.post(...) }
 *   catch (err) { setFromError(err) }
 */
export function useFieldErrors() {
  const fieldErrors = ref({})

  function setFromError(err) {
    const list = err?.response?.data?.errors
    if (!Array.isArray(list)) {
      fieldErrors.value = {}
      return false
    }
    const next = {}
    for (const item of list) {
      if (item && item.field && !next[item.field]) next[item.field] = item.message
    }
    fieldErrors.value = next
    return Object.keys(next).length > 0
  }

  function clearField(name) {
    if (!name || !fieldErrors.value[name]) return
    const { [name]: _, ...rest } = fieldErrors.value
    fieldErrors.value = rest
  }

  // Set one field's error message manually (e.g. from a client-side
  // pre-check before the request goes out).
  function setField(name, message) {
    if (!name) return
    fieldErrors.value = { ...fieldErrors.value, [name]: message }
  }

  // Apply multiple client-side rules at once. Pass an object whose keys
  // are field names and values are the message (or '' / false / null to
  // skip). Returns true if at least one error was set.
  function setMany(map) {
    const next = { ...fieldErrors.value }
    let added = false
    for (const [name, message] of Object.entries(map || {})) {
      if (message) {
        next[name] = message
        added = true
      }
    }
    fieldErrors.value = next
    return added
  }

  function reset() {
    fieldErrors.value = {}
  }

  function errorOf(name) {
    return fieldErrors.value[name] || ''
  }

  function hasErrors() {
    return Object.keys(fieldErrors.value).length > 0
  }

  return { fieldErrors, setFromError, setField, setMany, clearField, reset, errorOf, hasErrors }
}
