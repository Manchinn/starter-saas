<template>
  <div class="flex flex-col h-screen bg-gray-50">

    <!-- ── Topbar ─────────────────────────────────────────────────────────── -->
    <header class="h-14 bg-primary-700 flex items-center px-6 gap-4 flex-shrink-0 shadow-md">

      <!-- Logo -->
      <span class="text-white text-lg font-bold mr-4 flex-shrink-0">Starter SaaS</span>

      <!-- Horizontal nav — overflow visible so teleported dropdowns aren't clipped -->
      <nav class="flex items-center gap-1 flex-1 overflow-x-auto" style="overflow-y:visible">
        <template v-for="section in navSections" :key="section.label">
          <template v-for="item in section.items" :key="item.label">

            <!-- Flat link -->
            <RouterLink
              v-if="!item.children"
              :to="item.to"
              class="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm text-primary-200
                     hover:bg-primary-600 hover:text-white transition-colors whitespace-nowrap flex-shrink-0"
              active-class="bg-primary-800 text-white font-medium"
            >
              <component :is="item.icon" class="w-4 h-4 flex-shrink-0" />
              <span>{{ item.label }}</span>
            </RouterLink>

            <!-- Dropdown group -->
            <div
              v-else
              class="flex-shrink-0"
              @mouseenter="openDropdownAt(item, $event)"
              @mouseleave="scheduleClose"
            >
              <button
                class="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm text-primary-200
                       hover:bg-primary-600 hover:text-white transition-colors whitespace-nowrap"
                :class="{ 'bg-primary-800 text-white': openDropdown === item.label || isGroupActive(item) }"
              >
                <component :is="item.icon" class="w-4 h-4 flex-shrink-0" />
                <span>{{ item.label }}</span>
                <ChevronDownIcon class="w-3.5 h-3.5" />
              </button>
            </div>

          </template>
        </template>
      </nav>

      <!-- Right: user info + logout -->
      <div class="flex items-center gap-3 flex-shrink-0 ml-auto">
        <div class="w-7 h-7 rounded-full bg-primary-500 flex items-center justify-center
                    text-white text-xs font-bold border-2 border-primary-400">
          {{ userInitial }}
        </div>
        <span class="text-sm text-primary-200 hidden sm:block">{{ auth.user?.name }}</span>
        <button @click="handleLogout" title="Logout"
                class="text-primary-300 hover:text-white transition-colors">
          <ArrowRightOnRectangleIcon class="w-5 h-5" />
        </button>
      </div>
    </header>

    <!-- ── Page title bar ─────────────────────────────────────────────────── -->
    <div class="bg-white border-b border-gray-200 px-6 py-3 flex items-center gap-3 flex-shrink-0">
      <h2 class="text-base font-semibold text-gray-800">{{ currentPageTitle }}</h2>
      <div class="ml-auto text-xs text-gray-400">{{ auth.user?.email }}</div>
    </div>

    <!-- ── Page content ───────────────────────────────────────────────────── -->
    <main class="flex-1 overflow-y-auto p-6">
      <slot />
    </main>

    <!-- ── Dropdown portal — rendered at body level to escape overflow clipping ── -->
    <Teleport to="body">
      <div
        v-if="openDropdown && activeItem"
        :style="{
          position: 'fixed',
          top: dropdownPos.top + 'px',
          left: dropdownPos.left + 'px',
          zIndex: 9999,
        }"
        class="w-56 bg-white rounded-lg shadow-xl border border-gray-200 py-1"
        @mouseenter="cancelClose"
        @mouseleave="scheduleClose"
      >
        <template v-for="child in activeItem.children" :key="child.label || child.to">

          <!-- Sub-group header -->
          <div v-if="child.children" class="px-3 pt-3 pb-1">
            <p class="text-[10px] font-semibold tracking-widest text-gray-400 uppercase">
              {{ child.label }}
            </p>
            <ul class="mt-1 space-y-0.5">
              <li v-for="gc in child.children" :key="gc.to">
                <RouterLink
                  :to="gc.to"
                  class="flex items-center gap-2 px-2 py-1.5 rounded text-sm text-gray-600
                         hover:bg-primary-50 hover:text-primary-700 transition-colors"
                  active-class="text-primary-700 font-medium bg-primary-50"
                  @click="openDropdown = null"
                >
                  <component v-if="gc.icon" :is="gc.icon" class="w-4 h-4 flex-shrink-0" />
                  <span>{{ gc.label }}</span>
                </RouterLink>
              </li>
            </ul>
          </div>

          <!-- Flat child -->
          <RouterLink
            v-else
            :to="child.to"
            class="flex items-center gap-2 px-3 py-2 text-sm text-gray-600
                   hover:bg-primary-50 hover:text-primary-700 transition-colors"
            active-class="text-primary-700 font-medium bg-primary-50"
            @click="openDropdown = null"
          >
            <component :is="child.icon" class="w-4 h-4 flex-shrink-0" />
            <span>{{ child.label }}</span>
          </RouterLink>

        </template>
      </div>
    </Teleport>

  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRoute } from 'vue-router'
import { ChevronDownIcon, ArrowRightOnRectangleIcon } from '@heroicons/vue/24/outline'
import { useAppLayout } from '@/composables/useAppLayout'

const {
  auth,
  navSections,
  userInitial,
  currentPageTitle,
  handleLogout,
} = useAppLayout()

const route        = useRoute()
const openDropdown = ref(null)
const dropdownPos  = ref({ top: 0, left: 0 })
let   closeTimer   = null

// Find the item whose dropdown is open so the Teleport can render its children
const activeItem = computed(() => {
  if (!openDropdown.value) return null
  for (const section of navSections.value) {
    const found = section.items.find((i) => i.label === openDropdown.value)
    if (found) return found
  }
  return null
})

function openDropdownAt(item, event) {
  cancelClose()
  const rect = event.currentTarget.getBoundingClientRect()
  dropdownPos.value = { top: rect.bottom + 4, left: rect.left }
  openDropdown.value = item.label
}

function scheduleClose() {
  closeTimer = setTimeout(() => { openDropdown.value = null }, 120)
}

function cancelClose() {
  if (closeTimer) {
    clearTimeout(closeTimer)
    closeTimer = null
  }
}

function isGroupActive(item) {
  if (!item.children) return false
  return item.children.some((child) => {
    if (child.to) return route.path.startsWith(child.to)
    if (child.children) return child.children.some((gc) => route.path.startsWith(gc.to))
    return false
  })
}
</script>
