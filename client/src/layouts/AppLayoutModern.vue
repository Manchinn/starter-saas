<template>
  <div class="flex flex-col h-screen bg-[#F1F5F9]">

    <!-- ── Topbar ─────────────────────────────────────────────────────────── -->
    <header class="h-[64px] bg-[#1C2434] flex items-center px-6 gap-4 flex-shrink-0 shadow-lg">

      <!-- Logo -->
      <div class="flex items-center gap-2 mr-4 flex-shrink-0">
        <div class="w-6 h-6 bg-white/20 rounded-md flex items-center justify-center flex-shrink-0">
          <svg class="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        </div>
        <span class="text-white text-[15px] font-bold tracking-tight">Starter SaaS</span>
      </div>

      <!-- Horizontal nav — overflow visible so teleported dropdowns aren't clipped -->
      <nav class="flex items-center gap-1 flex-1 overflow-x-auto" style="overflow-y:visible">
        <template v-for="(section, sIdx) in visibleSections" :key="section.label">

          <!-- Group divider — between sections only -->
          <div
            v-if="sIdx > 0"
            class="w-px h-6 bg-white/15 mx-2 flex-shrink-0"
            aria-hidden="true"
          ></div>

          <template v-for="item in section.items" :key="item.label">

            <!-- Flat link -->
            <RouterLink
              v-if="!item.children"
              :to="item.to"
              class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[13px] text-[#DEE4EE]
                     hover:bg-white/[0.08] hover:text-white transition-colors whitespace-nowrap flex-shrink-0"
              active-class="bg-white/[0.15] text-white font-medium"
            >
              <component :is="item.icon" class="w-4 h-4 flex-shrink-0" />
              <span>{{ t(item.label) }}</span>
            </RouterLink>

            <!-- Dropdown group -->
            <div
              v-else
              class="flex-shrink-0"
              @mouseenter="openDropdownAt(item, $event)"
              @mouseleave="scheduleClose"
            >
              <button
                class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[13px] text-[#DEE4EE]
                       hover:bg-white/[0.08] hover:text-white transition-colors whitespace-nowrap"
                :class="{ 'bg-white/[0.15] text-white': openDropdown === item.label || isGroupActive(item) }"
              >
                <component :is="item.icon" class="w-4 h-4 flex-shrink-0" />
                <span>{{ t(item.label) }}</span>
                <ChevronDownIcon class="w-3.5 h-3.5" />
              </button>
            </div>

          </template>
        </template>
      </nav>

      <!-- Right: user info + logout -->
      <div class="flex items-center gap-2.5 flex-shrink-0 ml-auto">
        <div class="hidden sm:flex items-center gap-2.5 pl-2.5 pr-3.5 py-1.5 rounded-xl border border-white/[0.12] bg-white/[0.06]">
          <div class="w-7 h-7 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center
                      text-white text-[11px] font-bold flex-shrink-0">
            {{ userInitial }}
          </div>
          <span class="text-[13px] text-[#DEE4EE] font-medium truncate max-w-28">{{ auth.user?.name }}</span>
        </div>
        <button @click="handleLogout" title="Sign out"
                class="p-2 rounded-xl text-[#DEE4EE] hover:text-white hover:bg-white/[0.10] transition-colors">
          <ArrowRightOnRectangleIcon class="w-4 h-4" />
        </button>
      </div>
    </header>

    <!-- ── Page title bar ─────────────────────────────────────────────────── -->
    <div class="bg-white border-b border-[#E2E8F0] px-6 py-3.5 flex items-center gap-3 flex-shrink-0">
      <h2 class="text-[14px] font-semibold text-[#1C2434] truncate">{{ currentPageTitle }}</h2>
      <div class="ml-auto text-[12px] text-[#637381] truncate max-w-48 hidden sm:block">{{ auth.user?.email }}</div>
    </div>

    <!-- ── Page content ───────────────────────────────────────────────────── -->
    <main class="flex-1 overflow-y-auto p-6 scrollbar-thin">
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
              {{ t(child.label) }}
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
                  <span>{{ t(gc.label) }}</span>
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
            <span>{{ t(child.label) }}</span>
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
import { useI18n } from 'vue-i18n'
import { useAppLayout } from '@/composables/useAppLayout'

const {
  auth,
  navSections,
  userInitial,
  currentPageTitle,
  handleLogout,
} = useAppLayout()

const { t } = useI18n()
const route        = useRoute()
const openDropdown = ref(null)
const dropdownPos  = ref({ top: 0, left: 0 })
let   closeTimer   = null

// Drop empty sections so dividers don't render around nothing
const visibleSections = computed(() =>
  navSections.value.filter((s) => s.items && s.items.length)
)

// Find the item whose dropdown is open so the Teleport can render its children
const activeItem = computed(() => {
  if (!openDropdown.value) return null
  for (const section of visibleSections.value) {
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
