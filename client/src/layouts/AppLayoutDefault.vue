<template>
  <div class="flex h-screen bg-gray-50">

    <!-- ── Sidebar ─────────────────────────────────────────────────────────── -->
    <aside class="w-64 bg-white border-r border-gray-200 flex flex-col">

      <!-- Logo -->
      <div class="flex items-center h-16 px-6 border-b border-gray-200 flex-shrink-0">
        <span class="text-xl font-bold text-primary-700">Starter SaaS</span>
      </div>

      <!-- Nav sections -->
      <nav class="flex-1 overflow-y-auto py-3">
        <template v-for="(section, si) in navSections" :key="section.label">

          <div v-if="si > 0" class="mx-4 my-2 border-t border-gray-100" />

          <p class="px-5 pb-1 pt-2 text-[10px] font-semibold tracking-widest text-gray-400 uppercase select-none">
            {{ section.label }}
          </p>

          <ul class="space-y-0.5 px-3">
            <template v-for="item in section.items" :key="item.label">

              <li v-if="!item.children">
                <RouterLink
                  :to="item.to"
                  class="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-gray-600
                         hover:bg-primary-50 hover:text-primary-700 transition-colors"
                  active-class="bg-primary-50 text-primary-700 font-medium"
                >
                  <component :is="item.icon" class="w-5 h-5 flex-shrink-0" />
                  <span>{{ item.label }}</span>
                </RouterLink>
              </li>

              <li v-else>
                <button
                  @click="toggleGroup(item.label)"
                  class="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-gray-600
                         hover:bg-gray-50 transition-colors"
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
                  class="mt-0.5 ml-4 pl-3 border-l border-gray-100 space-y-0.5"
                >
                  <template v-for="child in item.children" :key="child.label || child.to">

                    <li v-if="child.children">
                      <button
                        @click="toggleGroup(item.label + ':' + child.label)"
                        class="w-full flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm text-gray-500
                               hover:bg-gray-50 transition-colors"
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
                        class="mt-0.5 ml-3 pl-3 border-l border-gray-100 space-y-0.5"
                      >
                        <li v-for="grandchild in child.children" :key="grandchild.to">
                          <RouterLink
                            :to="grandchild.to"
                            class="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm text-gray-400
                                   hover:bg-primary-50 hover:text-primary-700 transition-colors"
                            active-class="text-primary-700 font-medium"
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
                        class="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm text-gray-500
                               hover:bg-primary-50 hover:text-primary-700 transition-colors"
                        active-class="text-primary-700 font-medium"
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
      <div class="border-t border-gray-200 p-4 flex-shrink-0">
        <div class="flex items-center gap-3">
          <div class="w-8 h-8 rounded-full bg-primary-500 flex items-center justify-center
                      text-white text-sm font-bold flex-shrink-0">
            {{ userInitial }}
          </div>
          <div class="flex-1 min-w-0">
            <p class="text-sm font-medium text-gray-900 truncate">{{ auth.user?.name }}</p>
            <p class="text-xs text-gray-500 capitalize">{{ auth.user?.role }}</p>
          </div>
          <button @click="handleLogout" title="Logout"
                  class="text-gray-400 hover:text-red-500 transition-colors">
            <ArrowRightOnRectangleIcon class="w-5 h-5" />
          </button>
        </div>
      </div>
    </aside>

    <!-- ── Main area ───────────────────────────────────────────────────────── -->
    <div class="flex-1 flex flex-col overflow-hidden">

      <header class="h-16 bg-white border-b border-gray-200 flex items-center px-6 gap-4 flex-shrink-0">
        <h2 class="text-lg font-semibold text-gray-800">{{ currentPageTitle }}</h2>
        <div class="ml-auto text-sm text-gray-500">{{ auth.user?.email }}</div>
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
