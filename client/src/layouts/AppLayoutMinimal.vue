<template>
  <div class="flex h-screen bg-[#F1F5F9] overflow-hidden">

    <!-- ── Sidebar ─────────────────────────────────────────────────────────── -->
    <aside class="w-[220px] bg-[#1C2434] flex flex-col flex-shrink-0">

      <!-- Logo -->
      <div class="h-[64px] flex items-center px-5 flex-shrink-0 border-b border-white/[0.07]">
        <div class="flex items-center gap-2.5">
          <div class="w-7 h-7 bg-gradient-to-br from-primary-400 to-primary-600 rounded-lg flex items-center justify-center flex-shrink-0">
            <svg class="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <span class="text-[14px] font-bold text-white tracking-tight">Starter SaaS</span>
        </div>
      </div>

      <!-- Nav sections -->
      <nav class="flex-1 overflow-y-auto py-3 px-3 scrollbar-dark">
        <template v-for="(section, si) in navSections" :key="section.label">

          <div v-if="si > 0" class="mx-1 my-2.5 h-px bg-white/[0.07]" />

          <p class="section-label">{{ t(section.label) }}</p>

          <ul class="space-y-0.5 mt-1">
            <template v-for="item in section.items" :key="item.label">

              <li v-if="!item.children">
                <RouterLink
                  :to="item.to"
                  class="min-nav-item"
                  active-class="min-nav-item-active"
                >
                  <component :is="item.icon" class="w-4 h-4 flex-shrink-0" />
                  <span class="truncate">{{ t(item.label) }}</span>
                </RouterLink>
              </li>

              <li v-else>
                <button
                  @click="toggleGroup(item.label)"
                  class="min-nav-item w-full"
                >
                  <component :is="item.icon" class="w-4 h-4 flex-shrink-0" />
                  <span class="flex-1 text-left truncate">{{ t(item.label) }}</span>
                  <ChevronDownIcon
                    class="w-3.5 h-3.5 text-[#8D9BB4] transition-transform duration-150"
                    :class="{ 'rotate-180': openGroups.has(item.label) }"
                  />
                </button>

                <ul
                  v-if="openGroups.has(item.label)"
                  class="mt-0.5 ml-3 pl-2.5 space-y-0.5 border-l border-white/[0.07]"
                >
                  <template v-for="child in item.children" :key="child.label || child.to">

                    <li v-if="child.children">
                      <button
                        @click="toggleGroup(item.label + ':' + child.label)"
                        class="min-nav-item-sm w-full"
                      >
                        <component :is="child.icon" class="w-3.5 h-3.5 flex-shrink-0" />
                        <span class="flex-1 text-left truncate">{{ t(child.label) }}</span>
                        <ChevronDownIcon
                          class="w-3 h-3 text-[#8D9BB4] transition-transform duration-150"
                          :class="{ 'rotate-180': openGroups.has(item.label + ':' + child.label) }"
                        />
                      </button>
                      <ul
                        v-if="openGroups.has(item.label + ':' + child.label)"
                        class="mt-0.5 ml-2 pl-2.5 space-y-0.5 border-l border-white/[0.07]"
                      >
                        <li v-for="grandchild in child.children" :key="grandchild.to">
                          <RouterLink
                            :to="grandchild.to"
                            class="min-nav-item-sm"
                            active-class="!text-white font-medium"
                          >
                            <component v-if="grandchild.icon" :is="grandchild.icon" class="w-3.5 h-3.5 flex-shrink-0" />
                            <span class="truncate">{{ t(grandchild.label) }}</span>
                          </RouterLink>
                        </li>
                      </ul>
                    </li>

                    <li v-else>
                      <RouterLink
                        :to="child.to"
                        class="min-nav-item-sm"
                        active-class="!text-white !bg-white/[0.08] font-medium"
                      >
                        <component :is="child.icon" class="w-3.5 h-3.5 flex-shrink-0" />
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
      <div class="p-3 flex-shrink-0 border-t border-white/[0.07]">
        <div class="flex items-center gap-2.5 group cursor-default px-2 py-2 rounded-xl hover:bg-white/[0.06] transition-colors">
          <div class="w-8 h-8 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center
                      text-white text-[12px] font-bold flex-shrink-0">
            {{ userInitial }}
          </div>
          <div class="flex-1 min-w-0">
            <p class="text-[12.5px] font-semibold text-white truncate leading-tight">{{ auth.user?.name }}</p>
            <p class="text-[11px] capitalize text-[#8D9BB4] leading-tight">{{ auth.user?.role }}</p>
          </div>
          <button @click="handleLogout" title="Sign out"
                  class="text-[#8D9BB4] hover:text-white transition-colors opacity-0 group-hover:opacity-100 p-1">
            <ArrowRightOnRectangleIcon class="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>

    <!-- ── Main area ───────────────────────────────────────────────────────── -->
    <div class="flex-1 flex flex-col overflow-hidden">

      <header class="h-[64px] bg-white border-b border-[#E2E8F0] flex items-center px-6 gap-4 flex-shrink-0">
        <h2 class="text-[14px] font-semibold text-[#1C2434] truncate">{{ currentPageTitle }}</h2>
        <div class="ml-auto text-[12px] text-[#637381] truncate max-w-48">{{ auth.user?.email }}</div>
      </header>

      <main class="flex-1 overflow-y-auto p-6 scrollbar-thin">
        <slot />
      </main>

    </div>
  </div>
</template>

<script setup>
import { ChevronDownIcon, ArrowRightOnRectangleIcon } from '@heroicons/vue/24/outline'
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
</script>

<style scoped>
.min-nav-item {
  @apply flex items-center gap-2.5 px-3 py-2 rounded-xl text-[13px] text-[#DEE4EE]
         hover:bg-white/[0.06] hover:text-white transition-colors duration-100 w-full;
}
.min-nav-item-active {
  @apply !bg-primary-500/20 !text-white font-semibold;
}
.min-nav-item-sm {
  @apply flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-[12.5px] text-[#9BA7B8]
         hover:bg-white/[0.05] hover:text-[#DEE4EE] transition-colors duration-100 w-full;
}
</style>
