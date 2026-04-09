<template>
  <div class="flex h-screen" style="background:#0f172a">

    <!-- ── Sidebar ─────────────────────────────────────────────────────────── -->
    <aside class="w-64 flex flex-col flex-shrink-0" style="background:#1e293b;border-right:1px solid #334155">

      <!-- Logo -->
      <div class="flex items-center h-16 px-6 flex-shrink-0" style="border-bottom:1px solid #334155">
        <span class="text-xl font-bold text-white">Starter SaaS</span>
      </div>

      <!-- Nav sections -->
      <nav class="flex-1 overflow-y-auto py-3">
        <template v-for="(section, si) in navSections" :key="section.label">

          <div v-if="si > 0" class="mx-4 my-2" style="border-top:1px solid #334155" />

          <p class="px-5 pb-1 pt-2 text-[10px] font-semibold tracking-widest uppercase select-none" style="color:#64748b">
            {{ section.label }}
          </p>

          <ul class="space-y-0.5 px-3">
            <template v-for="item in section.items" :key="item.label">

              <li v-if="!item.children">
                <RouterLink
                  :to="item.to"
                  class="flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors"
                  style="color:#94a3b8"
                  active-class="!text-white font-medium"
                  :style-active="{ background: '#334155' }"
                  @mouseenter="e => e.currentTarget.style.background='#334155'"
                  @mouseleave="e => { if (!e.currentTarget.classList.contains('router-link-active')) e.currentTarget.style.background='' }"
                >
                  <component :is="item.icon" class="w-5 h-5 flex-shrink-0" />
                  <span>{{ item.label }}</span>
                </RouterLink>
              </li>

              <li v-else>
                <button
                  @click="toggleGroup(item.label)"
                  class="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors"
                  style="color:#94a3b8"
                  @mouseenter="e => e.currentTarget.style.background='#334155'"
                  @mouseleave="e => e.currentTarget.style.background=''"
                >
                  <component :is="item.icon" class="w-5 h-5 flex-shrink-0" />
                  <span class="flex-1 text-left">{{ item.label }}</span>
                  <ChevronDownIcon
                    class="w-4 h-4 transition-transform duration-150"
                    :class="{ 'rotate-180': openGroups.has(item.label) }"
                  />
                </button>

                <ul
                  v-if="openGroups.has(item.label)"
                  class="mt-0.5 ml-4 pl-3 space-y-0.5"
                  style="border-left:1px solid #334155"
                >
                  <template v-for="child in item.children" :key="child.label || child.to">

                    <li v-if="child.children">
                      <button
                        @click="toggleGroup(item.label + ':' + child.label)"
                        class="w-full flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition-colors"
                        style="color:#64748b"
                        @mouseenter="e => e.currentTarget.style.background='#334155'"
                        @mouseleave="e => e.currentTarget.style.background=''"
                      >
                        <component :is="child.icon" class="w-4 h-4 flex-shrink-0" />
                        <span class="flex-1 text-left">{{ child.label }}</span>
                        <ChevronDownIcon
                          class="w-3.5 h-3.5 transition-transform duration-150"
                          :class="{ 'rotate-180': openGroups.has(item.label + ':' + child.label) }"
                        />
                      </button>
                      <ul
                        v-if="openGroups.has(item.label + ':' + child.label)"
                        class="mt-0.5 ml-3 pl-3 space-y-0.5"
                        style="border-left:1px solid #334155"
                      >
                        <li v-for="grandchild in child.children" :key="grandchild.to">
                          <RouterLink
                            :to="grandchild.to"
                            class="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition-colors"
                            style="color:#64748b"
                            active-class="!text-blue-400 font-medium"
                          >
                            <component v-if="grandchild.icon" :is="grandchild.icon" class="w-4 h-4 flex-shrink-0" />
                            <span>{{ grandchild.label }}</span>
                          </RouterLink>
                        </li>
                      </ul>
                    </li>

                    <li v-else>
                      <RouterLink
                        :to="child.to"
                        class="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition-colors"
                        style="color:#64748b"
                        active-class="!text-blue-400 font-medium"
                      >
                        <component :is="child.icon" class="w-4 h-4 flex-shrink-0" />
                        <span>{{ child.label }}</span>
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
      <div class="p-4 flex-shrink-0" style="border-top:1px solid #334155">
        <div class="flex items-center gap-3">
          <div class="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center
                      text-white text-sm font-bold flex-shrink-0">
            {{ userInitial }}
          </div>
          <div class="flex-1 min-w-0">
            <p class="text-sm font-medium text-white truncate">{{ auth.user?.name }}</p>
            <p class="text-xs capitalize" style="color:#64748b">{{ auth.user?.role }}</p>
          </div>
          <button @click="handleLogout" title="Logout" class="transition-colors" style="color:#64748b"
                  @mouseenter="e => e.currentTarget.style.color='#ef4444'"
                  @mouseleave="e => e.currentTarget.style.color='#64748b'">
            <ArrowRightOnRectangleIcon class="w-5 h-5" />
          </button>
        </div>
      </div>
    </aside>

    <!-- ── Main area ───────────────────────────────────────────────────────── -->
    <div class="flex-1 flex flex-col overflow-hidden">

      <header class="h-16 flex items-center px-6 gap-4 flex-shrink-0"
              style="background:#1e293b;border-bottom:1px solid #334155">
        <h2 class="text-lg font-semibold text-white">{{ currentPageTitle }}</h2>
        <div class="ml-auto text-sm" style="color:#64748b">{{ auth.user?.email }}</div>
      </header>

      <main class="flex-1 overflow-y-auto p-6">
        <slot />
      </main>

    </div>
  </div>
</template>

<script setup>
import { ChevronDownIcon, ArrowRightOnRectangleIcon } from '@heroicons/vue/24/outline'
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
</script>
