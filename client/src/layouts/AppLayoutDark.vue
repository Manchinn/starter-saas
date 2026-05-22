<template>
  <div class="flex h-screen bg-[#111827] overflow-hidden">

    <!-- ── Mobile backdrop ────────────────────────────────────────────────── -->
    <Transition
      enter-active-class="transition-opacity duration-200"
      enter-from-class="opacity-0" enter-to-class="opacity-100"
      leave-active-class="transition-opacity duration-150"
      leave-from-class="opacity-100" leave-to-class="opacity-0"
    >
      <div
        v-if="sidebarOpen"
        class="md:hidden fixed inset-0 bg-black/50 z-30"
        @click="sidebarOpen = false"
      />
    </Transition>

    <!-- ── Sidebar ─────────────────────────────────────────────────────────── -->
    <aside
      class="w-[260px] bg-[#1C2434] flex flex-col flex-shrink-0
             fixed inset-y-0 left-0 z-40 transform transition-transform duration-200 ease-out
             md:relative md:translate-x-0 md:transition-none"
      :class="sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'"
    >

      <!-- Logo -->
      <div class="h-[64px] flex items-center px-6 flex-shrink-0 border-b border-white/[0.07] gap-3">
        <div class="flex items-center gap-3 flex-1 min-w-0">
          <div class="w-8 h-8 bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center flex-shrink-0 shadow-md">
            <svg class="w-[15px] h-[15px] text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5"
                    d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <span class="text-[15px] font-bold text-white tracking-tight truncate">Starter SaaS</span>
        </div>
        <button
          type="button"
          class="md:hidden p-2 -mr-2 text-[#DEE4EE] hover:bg-white/[0.10] transition-colors"
          @click="sidebarOpen = false"
          aria-label="Close navigation"
        >
          <XMarkIcon class="w-5 h-5" />
        </button>
      </div>

      <!-- Nav -->
      <nav class="flex-1 overflow-y-auto scrollbar-dark py-4 px-4">
        <template v-for="(section, si) in navSections" :key="section.label">

          <div v-if="si > 0" class="mx-1 my-3 h-px bg-white/[0.07]" />

          <p class="section-label">{{ t(section.label) }}</p>

          <ul class="space-y-0.5 mt-1">
            <template v-for="item in section.items" :key="item.label">

              <!-- Leaf item -->
              <li v-if="!item.children">
                <RouterLink
                  :to="item.to"
                  class="dark-nav-item"
                  active-class="dark-nav-item-active"
                >
                  <component :is="item.icon" class="w-[16px] h-[16px] flex-shrink-0 opacity-60" />
                  <span class="truncate">{{ t(item.label) }}</span>
                </RouterLink>
              </li>

              <!-- Group item -->
              <li v-else>
                <button
                  @click="toggleGroup(item.label)"
                  class="dark-nav-item w-full"
                  :class="{ 'bg-white/[0.04] text-white': openGroups.has(item.label) }"
                >
                  <component :is="item.icon" class="w-[18px] h-[18px] flex-shrink-0" />
                  <span class="flex-1 text-left truncate">{{ t(item.label) }}</span>
                  <ChevronDownIcon
                    class="w-3.5 h-3.5 text-[#8D9BB4] transition-transform duration-200 flex-shrink-0"
                    :class="{ 'rotate-180': openGroups.has(item.label) }"
                  />
                </button>

                <ul v-if="openGroups.has(item.label)" class="mt-0.5 ml-3 pl-3 border-l border-white/[0.07] space-y-0.5">
                  <template v-for="child in item.children" :key="child.label || child.to">

                    <!-- Nested group -->
                    <li v-if="child.children">
                      <button
                        @click="toggleGroup(item.label + ':' + child.label)"
                        class="dark-nav-item-sm w-full"
                      >
                        <component :is="child.icon" class="w-[15px] h-[15px] flex-shrink-0" />
                        <span class="flex-1 text-left truncate">{{ t(child.label) }}</span>
                        <ChevronDownIcon
                          class="w-3 h-3 text-[#8D9BB4] transition-transform duration-200"
                          :class="{ 'rotate-180': openGroups.has(item.label + ':' + child.label) }"
                        />
                      </button>
                      <ul
                        v-if="openGroups.has(item.label + ':' + child.label)"
                        class="mt-0.5 ml-2.5 pl-2.5 border-l border-white/[0.07] space-y-0.5"
                      >
                        <li v-for="grandchild in child.children" :key="grandchild.to">
                          <RouterLink
                            :to="grandchild.to"
                            class="dark-nav-item-sm"
                            active-class="!text-white font-medium"
                          >
                            <component v-if="grandchild.icon" :is="grandchild.icon" class="w-3.5 h-3.5 flex-shrink-0" />
                            <span class="truncate">{{ t(grandchild.label) }}</span>
                          </RouterLink>
                        </li>
                      </ul>
                    </li>

                    <!-- Nested leaf -->
                    <li v-else>
                      <RouterLink
                        :to="child.to"
                        class="dark-nav-item-sm"
                        active-class="!text-white !bg-white/[0.08] font-medium"
                      >
                        <component :is="child.icon" class="w-[15px] h-[15px] flex-shrink-0" />
                        <span class="truncate">{{ t(child.label) }}</span>
                      </RouterLink>
                    </li>

                  </template>
                </ul>
              </li>

            </template>
          </ul>

        </template>
      </nav>

      <!-- User strip -->
      <div class="border-t border-white/[0.07] p-3 flex-shrink-0">
        <div class="flex items-center gap-3 px-2 py-2.5 group cursor-default
                    hover:bg-white/[0.06] transition-colors duration-150">
          <div class="w-9 h-9 bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center
                      text-white text-[13px] font-bold flex-shrink-0 select-none">
            {{ userInitial }}
          </div>
          <div class="flex-1 min-w-0">
            <p class="text-[13px] font-semibold text-white truncate leading-[1.3]">{{ auth.user?.name }}</p>
            <p class="text-[11.5px] text-[#8D9BB4] capitalize leading-[1.3]">{{ auth.user?.role }}</p>
          </div>
          <button
            @click="handleLogout"
            title="Sign out"
            class="p-1.5 text-[#8D9BB4] hover:text-white hover:bg-white/[0.10]
                   opacity-0 group-hover:opacity-100 transition-all duration-150"
          >
            <ArrowRightOnRectangleIcon class="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>

    <!-- ── Main area ───────────────────────────────────────────────────────── -->
    <div class="flex-1 flex flex-col overflow-hidden">

      <!-- Topbar -->
      <header class="h-[64px] bg-[#24303F] border-b border-white/[0.07] flex items-center px-3 sm:px-4 md:px-6 gap-2 sm:gap-4 flex-shrink-0">
        <button
          type="button"
          class="md:hidden p-2 -ml-1 text-[#DEE4EE] hover:bg-white/[0.10] transition-colors flex-shrink-0"
          @click="sidebarOpen = true"
          aria-label="Open navigation"
        >
          <Bars3Icon class="w-6 h-6" />
        </button>
        <div class="flex-1 min-w-0">
          <h2 class="text-[14px] font-semibold text-[#DEE4EE] truncate">{{ currentPageTitle }}</h2>
        </div>
        <div class="flex items-center gap-2.5 p-1 sm:pl-2.5 sm:pr-3.5 sm:py-1.5 border border-transparent sm:border-white/[0.08] bg-transparent sm:bg-white/[0.05]">
          <div class="w-8 h-8 bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center
                      text-white text-[12px] font-bold flex-shrink-0">
            {{ userInitial }}
          </div>
          <div class="hidden lg:block min-w-0">
            <p class="text-[13px] font-semibold text-white truncate max-w-32 leading-tight">{{ auth.user?.name }}</p>
            <p class="text-[11px] text-[#8D9BB4] capitalize leading-tight">{{ auth.user?.role }}</p>
          </div>
        </div>
      </header>

      <!-- Content -->
      <main class="flex-1 overflow-y-auto p-4 md:p-6 scrollbar-dark">
        <slot />
      </main>

    </div>
  </div>
</template>

<script setup>
import { ref, watch, onMounted, onUnmounted } from 'vue'
import { useRoute } from 'vue-router'
import {
  ChevronDownIcon, ArrowRightOnRectangleIcon,
  Bars3Icon, XMarkIcon,
} from '@heroicons/vue/24/outline'
import { useI18n } from 'vue-i18n'
import { useAppLayout } from '@/composables/useAppLayout'

const {
  auth,
  navSections,
  openGroups,
  toggleGroup,
  userInitial,
  currentPageTitle,
  handleLogout,
} = useAppLayout()

const { t } = useI18n()
const route = useRoute()

const sidebarOpen = ref(false)

watch(() => route.path, () => { sidebarOpen.value = false })

watch(sidebarOpen, (open) => {
  if (typeof document === 'undefined') return
  const isMobile = typeof window !== 'undefined' && window.matchMedia('(max-width: 767px)').matches
  document.body.style.overflow = open && isMobile ? 'hidden' : ''
})

function onKeydown(e) {
  if (e.key === 'Escape' && sidebarOpen.value) sidebarOpen.value = false
}
onMounted(() => window.addEventListener('keydown', onKeydown))
onUnmounted(() => {
  window.removeEventListener('keydown', onKeydown)
  if (typeof document !== 'undefined') document.body.style.overflow = ''
})
</script>

<style scoped>
.dark-nav-item {
  @apply flex items-center gap-3 px-3 py-2.5 text-[13.5px] text-[#DEE4EE]
         hover:bg-white/[0.06] hover:text-white transition-colors duration-100 w-full;
}
.dark-nav-item-active {
  @apply !bg-primary-500/20 !text-white font-semibold;
}
.dark-nav-item-sm {
  @apply flex items-center gap-2.5 px-3 py-2 text-[13px] text-[#9BA7B8]
         hover:bg-white/[0.05] hover:text-[#DEE4EE] transition-colors duration-100 w-full;
}
</style>
