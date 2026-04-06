import { useAuthStore } from '@/stores/auth'

/**
 * v-can directive — hides the element if the user lacks the permission.
 *
 * Usage:
 *   <button v-can="'users.delete'">Delete</button>
 *   <button v-can.any="['users.edit', 'users.delete']">Manage</button>
 *   <button v-can.all="['roles.manage', 'permissions.manage']">Full admin</button>
 */
export const vCan = {
  mounted(el, binding) {
    applyPermission(el, binding)
  },
  updated(el, binding) {
    applyPermission(el, binding)
  },
}

function applyPermission(el, binding) {
  const auth = useAuthStore()
  const value = binding.value
  let allowed = false

  if (binding.modifiers.any && Array.isArray(value)) {
    allowed = value.some((s) => auth.hasPermission(s))
  } else if (binding.modifiers.all && Array.isArray(value)) {
    allowed = value.every((s) => auth.hasPermission(s))
  } else {
    allowed = auth.hasPermission(typeof value === 'string' ? value : String(value))
  }

  if (!allowed) {
    el.style.display = 'none'
  } else {
    el.style.display = ''
  }
}
