<template>
  <div class="flex h-screen bg-white">

    <!-- ── Sidebar ─────────────────────────────────────────────────────────── -->
    <aside class="w-56 bg-gray-900 flex flex-col flex-shrink-0">

      <!-- Logo -->
      <div class="flex items-center h-14 px-5 flex-shrink-0" style="border-bottom:1px solid #1f2937">
        <span class="text-base font-bold text-white tracking-tight">Starter SaaS</span>
      </div>

      <!-- Nav sections -->
      <nav class="flex-1 overflow-y-auto py-2">
        <template v-for="(section, si) in navSections" :key="section.label">

          <div v-if="si > 0" class="mx-3 my-2" style="border-top:1px solid #1f2937" />

          <p class="px-4 pb-1 pt-2 text-[9px] font-bold tracking-widest uppercase select-none" style="color:#4b5563">
            {{ section.label }}
          </p>

          <ul class="space-y-px px-2">
            <template v-for="item in section.items" :key="item.label">

              <li v-if="!item.children">
                <RouterLink
                  :to="item.to"
                  class="flex items-center gap-2.5 px-3 py-2 rounded text-sm transition-colors"
                  style="color:#9ca3af"
                  active-class="!bg-gray-700 !text-white font-medium"
                  @mouseenter="e => { if(!e.currentTarget.classList.contains('router-link-active')) e.currentTarget.style.color='#e5e7eb' }"
                  @mouseleave="e => { if(!e.currentTarget.classList.contains('router-link-active')) e.currentTarget.style.color='#9ca3af' }"
                >
                  <component :is="item.icon" class="w-4 h-4 flex-shrink-0" />
                  <span>{{ item.label }}</span>
                </RouterLink>
              </li>

              <li v-else>
                <button
                  @click="toggleGroup(item.label)"
                  class="w-full flex items-center gap-2.5 px-3 py-2 rounded text-sm transition-colors"
                  style="color:#9ca3af"
                  @mouseenter="e => e.currentTarget.style.color='#e5e7eb'"
                  @mouseleave="e => e.currentTarget.style.color='#9ca3af'"
                >
                  <component :is="item.icon" class="w-4 h-4 flex-shrink-0" />
                  <span class="flex-1 text-left">{{ item.label }}</span>
                  <ChevronDownIcon
                    class="w-3.5 h-3.5 transition-transform duration-150"
                    :class="{ 'rotate-180': openGroups.has(item.label) }"
                  />
                </button>

                <ul
                  v-if="openGroups.has(item.label)"
                  class="mt-px ml-3 pl-2.5 space-y-px"
                  style="border-left:1px solid #1f2937"
                >
                  <template v-for="child in item.children" :key="child.label || child.to">

                    <li v-if="child.children">
                      <button
                        @click="toggleGroup(item.label + ':' + child.label)"
                        class="w-full flex items-center gap-2 px-2.5 py-1.5 rounded text-sm transition-colors"
                        style="color:#6b7280"
                        @mouseenter="e => e.currentTarget.style.color='#e5e7eb'"
                        @mouseleave="e => e.currentTarget.style.color='#6b7280'"
                      >
                        <component :is="child.icon" class="w-3.5 h-3.5 flex-shrink-0" />
                        <span class="flex-1 text-left">{{ child.label }}</span>
                        <ChevronDownIcon
                          class="w-3 h-3 transition-transform duration-150"
                          :class="{ 'rotate-180': openGroups.has(item.label + ':' + child.label) }"
                        />
                      </button>
                      <ul
                        v-if="openGroups.has(item.label + ':' + child.label)"
                        class="mt-px ml-2 pl-2.5 space-y-px"
                        style="border-left:1px solid #1f2937"
                      >
                        <li v-for="grandchild in child.children" :key="grandchild.to">
                          <RouterLink
                            :to="grandchild.to"
                            class="flex items-center gap-2 px-2.5 py-1.5 rounded text-sm transition-colors"
                            style="color:#6b7280"
                            active-class="!text-white font-medium"
                          >
                            <component v-if="grandchild.icon" :is="grandchild.icon" class="w-3.5 h-3.5 flex-shrink-0" />
                            <span>{{ grandchild.label }}</span>
                          </RouterLink>
                        </li>
                      </ul>
                    </li>

                    <li v-else>
                      <RouterLink
                        :to="child.to"
                        class="flex items-center gap-2 px-2.5 py-1.5 rounded text-sm transition-colors"
                        style="color:#6b7280"
                        active-class="!text-white font-medium"
                      >
                        <component :is="child.icon" class="w-3.5 h-3.5 flex-shrink-0" />
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
      <div class="p-3 flex-shrink-0" style="border-top:1px solid #1f2937">
        <div class="flex items-center gap-2.5">
          <div class="w-7 h-7 rounded-full bg-gray-600 flex items-center justify-center
                      text-white text-xs font-bold flex-shrink-0">
            {{ userInitial }}
          </div>
          <div class="flex-1 min-w-0">
            <p class="text-xs font-medium text-gray-200 truncate">{{ auth.user?.name }}</p>
            <p class="text-[10px] capitalize" style="color:#6b7280">{{ auth.user?.role }}</p>
          </div>
          <button @click="handleLogout" title="Logout"
                  class="transition-colors" style="color:#6b7280"
                  @mouseenter="e => e.currentTarget.style.color='#ef4444'"
                  @mouseleave="e => e.currentTarget.style.color='#6b7280'">
            <ArrowRightOnRectangleIcon class="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>

    <!-- ── Main area ───────────────────────────────────────────────────────── -->
    <div class="flex-1 flex flex-col overflow-hidden">

      <header class="h-14 bg-white border-b border-gray-100 flex items-center px-6 gap-4 flex-shrink-0">
        <h2 class="text-base font-semibold text-gray-700">{{ currentPageTitle }}</h2>
        <div class="ml-auto text-xs text-gray-400">{{ auth.user?.email }}</div>
      </header>

      <main class="flex-1 overflow-y-auto p-6 bg-gray-50">
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
