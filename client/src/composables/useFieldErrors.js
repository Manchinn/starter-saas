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

  function reset() {
    fieldErrors.value = {}
  }

  function errorOf(name) {
    return fieldErrors.value[name] || ''
  }

  function hasErrors() {
    return Object.keys(fieldErrors.value).length > 0
  }

  return { fieldErrors, setFromError, clearField, reset, errorOf, hasErrors }
}
