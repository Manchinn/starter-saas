import { computed } from 'vue'
import { useAuthStore } from '@/stores/auth'

/**
 * Composable for permission / role checks in setup() or <script setup>.
 *
 * Usage:
 *   const { can, hasRole, canAny, canAll } = usePermission()
 *   if (can('users.edit')) { ... }
 */
export function usePermission() {
  const auth = useAuthStore()

  /** True if the user has the given permission slug (admins always pass). */
  const can = (slug) => auth.hasPermission(slug)

  /** Reactive computed version — use in templates or watchEffect. */
  const canRef = (slug) => computed(() => auth.hasPermission(slug))

  /** True if user holds a role with this slug. */
  const hasRole = (slug) => auth.hasRole(slug)

  /** True if user has ANY of the provided permission slugs. */
  const canAny = (...slugs) => slugs.some((s) => auth.hasPermission(s))

  /** True if user has ALL of the provided permission slugs. */
  const canAll = (...slugs) => slugs.every((s) => auth.hasPermission(s))

  return { can, canRef, hasRole, canAny, canAll }
}
