import { computed, reactive, watchEffect, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useAuthStore } from '@/stores/auth'
import { useModulesStore } from '@/stores/modules'
import { usePermission } from '@/composables/usePermission'
import { getNavSections } from '@/core/ModuleRegistry'

export function useAppLayout() {
  const auth         = useAuthStore()
  const modulesStore = useModulesStore()
  const { can }      = usePermission()
  const router       = useRouter()
  const route        = useRoute()
  const { t, te }    = useI18n()

  onMounted(async () => {
    if (auth.isAdmin) {
      await modulesStore.fetchAll()
    } else {
      await modulesStore.fetchMyModules()
    }
  })

  const userModuleSlugs = computed(() => {
    if (auth.isAdmin) {
      return modulesStore.modules.filter((m) => m.isActive).map((m) => m.slug)
    }
    return modulesStore.userModules.filter((m) => m.isActive).map((m) => m.slug)
  })

  const navSections = computed(() =>
    getNavSections(userModuleSlugs.value, auth.isAdmin, can)
  )

  const openGroups = reactive(new Set())

  watchEffect(() => {
    for (const section of navSections.value) {
      for (const item of section.items) {
        if (!item.children) continue
        for (const child of item.children) {
          if (child.children) {
            if (child.children.some((gc) => route.path.startsWith(gc.to))) {
              openGroups.add(item.label)
              openGroups.add(item.label + ':' + child.label)
            }
          } else if (child.to && route.path.startsWith(child.to)) {
            openGroups.add(item.label)
          }
        }
      }
    }
  })

  function toggleGroup(label) {
    openGroups.has(label) ? openGroups.delete(label) : openGroups.add(label)
  }

  const userInitial      = computed(() => auth.user?.name?.charAt(0).toUpperCase() || '?')
  const currentPageTitle = computed(() => {
    const title = route.meta?.title
    if (!title) return t('nav.dashboard')
    return te(title) ? t(title) : title
  })

  async function handleLogout() {
    await auth.logout()
    router.push('/login')
  }

  return {
    auth,
    route,
    navSections,
    openGroups,
    toggleGroup,
    userInitial,
    currentPageTitle,
    handleLogout,
  }
}
