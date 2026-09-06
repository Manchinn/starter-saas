<template>
  <div class="template-glass flex h-screen overflow-hidden">
    <!-- ── Mobile backdrop ───────────────────────────────────────────────────── -->
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

    <!-- ── Sidebar (light glass, no scrollbar jamb) ──────────────────────────── -->
    <aside
      class="glass-surface w-[260px] flex flex-col flex-shrink-0 border-r border-white/60
             fixed inset-y-0 left-0 z-40 transform transition-transform duration-200 ease-out
             md:relative md:translate-x-0 md:transition-none"
      :class="sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'"
    >
      <!-- Logo -->
      <div class="h-[64px] flex items-center px-6 border-b border-black/[0.05] flex-shrink-0 gap-3">
        <BrandMark
          class="flex-1 min-w-0"
          mark-class="w-8 h-8 shadow-md flex-shrink-0"
          name-class="text-[15px] font-bold text-[#1C2434] tracking-tight truncate"
        />
        <button
          type="button"
          class="md:hidden p-2 -mr-2 text-[#637381] hover:bg-black/[0.05] transition-colors"
          @click="sidebarOpen = false"
          aria-label="Close navigation"
        >
          <XMarkIcon class="w-5 h-5" />
        </button>
      </div>

      <!-- Nav -->
      <nav class="flex-1 overflow-y-auto scrollbar-thin py-4 px-4">
        <template v-for="(section, si) in navSections" :key="section.label">

          <div v-if="si > 0" class="mx-1 my-3 h-px bg-black/[0.06]" />

          <p class="section-label">{{ t(section.label) }}</p>

          <ul class="space-y-0.5 mt-1">
            <template v-for="item in section.items" :key="item.label">

              <!-- Leaf item -->
              <li v-if="!item.children">
                <RouterLink
                  :to="item.to"
                  class="nav-item"
                  active-class="nav-item-active"
                >
                  <component :is="item.icon" class="w-[18px] h-[18px] flex-shrink-0" />
                  <span class="truncate">{{ t(item.label) }}</span>
                </RouterLink>
              </li>

              <!-- Group item -->
              <li v-else>
                <button
                  @click="toggleGroup(item.label)"
                  class="nav-item w-full"
                  :class="{ 'nav-item-open': openGroups.has(item.label) }"
                >
                  <component :is="item.icon" class="w-[18px] h-[18px] flex-shrink-0" />
                  <span class="flex-1 text-left truncate">{{ t(item.label) }}</span>
                  <ChevronDownIcon
                    class="w-3.5 h-3.5 text-[#5E6E82] transition-transform duration-200 flex-shrink-0"
                    :class="{ 'rotate-180': openGroups.has(item.label) }"
                  />
                </button>

                <ul v-if="openGroups.has(item.label)" class="mt-0.5 ml-3 pl-3 border-l border-black/[0.07] space-y-0.5">
                  <template v-for="child in item.children" :key="child.label || child.to">

                    <!-- Nested group -->
                    <li v-if="child.children">
                      <button
                        @click="toggleGroup(item.label + ':' + child.label)"
                        class="nav-item-sm w-full"
                      >
                        <component :is="child.icon" class="w-[15px] h-[15px] flex-shrink-0" />
                        <span class="flex-1 text-left truncate">{{ t(child.label) }}</span>
                        <ChevronDownIcon
                          class="w-3 h-3 text-[#5E6E82] transition-transform duration-200"
                          :class="{ 'rotate-180': openGroups.has(item.label + ':' + child.label) }"
                        />
                      </button>
                      <ul
                        v-if="openGroups.has(item.label + ':' + child.label)"
                        class="mt-0.5 ml-2.5 pl-2.5 border-l border-black/[0.07] space-y-0.5"
                      >
                        <li v-for="grandchild in child.children" :key="grandchild.to">
                          <RouterLink
                            :to="grandchild.to"
                            class="nav-item-sm"
                            active-class="!text-[#C24A1E] font-semibold"
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
                        class="nav-item-sm"
                        active-class="!text-[#C24A1E] font-semibold bg-primary-50/[0.6]"
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
      <div class="border-t border-black/[0.05] p-3 flex-shrink-0">
        <div class="flex items-center gap-3 px-2 py-2.5 group cursor-default
                    hover:bg-black/[0.04] transition-colors duration-150">
          <div class="w-9 h-9 bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center
                      text-white text-[13px] font-bold flex-shrink-0 select-none">
            {{ userInitial }}
          </div>
          <div class="flex-1 min-w-0">
            <p class="text-[13px] font-semibold text-[#1C2434] truncate leading-[1.3]">{{ auth.user?.name }}</p>
            <p class="text-[11.5px] text-[#5B6B7C] capitalize leading-[1.3]">{{ auth.user?.role }}</p>
          </div>
          <button
            @click="handleLogout"
            title="Sign out"
            aria-label="Sign out"
            class="p-1.5 text-[#6B7A8D] hover:text-[#1C2434] hover:bg-black/[0.05] transition-all duration-150"
          >
            <ArrowRightOnRectangleIcon class="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>

    <!-- ── Main area ──────────────────────────────────────────────────────────── -->
    <div class="flex-1 flex flex-col overflow-hidden">

      <!-- Topbar (glass, sticky blur) -->
      <header class="glass-topbar h-[64px] border-b border-white/60 flex items-center px-3 sm:px-4 md:px-6 gap-2 sm:gap-4 flex-shrink-0">
        <button
          type="button"
          class="md:hidden p-2 -ml-1 text-[#637381] hover:bg-black/[0.05] transition-colors flex-shrink-0"
          @click="sidebarOpen = true"
          aria-label="Open navigation"
        >
          <Bars3Icon class="w-6 h-6" />
        </button>
        <div class="flex-1 min-w-0">
          <h2 class="flex items-center gap-2 text-[14px] font-semibold text-[#1C2434] truncate">
            <span class="w-1.5 h-1.5 rounded-full bg-primary-500 flex-shrink-0" aria-hidden="true" />
            <span class="truncate">{{ currentPageTitle }}</span>
          </h2>
        </div>

        <div class="flex items-center gap-1.5 sm:gap-2.5">
          <!-- AI Chat button -->
          <button type="button" @click="chatOpen = true"
            :aria-expanded="chatOpen"
            aria-label="AI chat"
            class="w-10 h-10 flex items-center justify-center border border-white/70
                   bg-white/55 hover:bg-white/85 text-[#637381] hover:text-[#1C2434] transition-colors"
            :title="`${t('aiAgent.chat.title')} (Shift+A)`">
            <SparklesIcon class="w-5 h-5" />
          </button>

          <!-- Language switcher -->
          <div class="relative" ref="langMenuRef">
            <button
              @click="langOpen = !langOpen; $nextTick(() => $el.blur()); $nextTick(() => document.getElementById('glass-lang-menu')?.querySelector('[role=menuitem]')?.focus())"
              aria-haspopup="menu"
              :aria-expanded="langOpen"
              aria-controls="glass-lang-menu"
              class="flex items-center gap-1.5 h-10 px-2.5 sm:px-3 text-[13px] font-medium text-[#637381]
                     border border-white/70 bg-white/55 hover:bg-white/85 transition-colors select-none"
            >
              <span>{{ currentLangLabel }}</span>
              <ChevronDownIcon class="w-3.5 h-3.5 text-[#5E6E82] transition-transform duration-150"
                              :class="{ 'rotate-180': langOpen }" />
            </button>

            <Transition
              enter-active-class="transition ease-out duration-100"
              enter-from-class="opacity-0 scale-95 -translate-y-1"
              enter-to-class="opacity-100 scale-100 translate-y-0"
              leave-active-class="transition ease-in duration-75"
              leave-from-class="opacity-100 scale-100 translate-y-0"
              leave-to-class="opacity-0 scale-95 -translate-y-1"
            >
              <div
                v-if="langOpen"
                id="glass-lang-menu"
                role="menu"
                aria-label="Language"
                @keydown="onLangMenuKeydown"
                class="absolute right-0 top-full mt-1.5 w-44 bg-white/92 backdrop-blur-xl border border-white/70 shadow-card-lg z-50 overflow-hidden"
              >
                <div class="p-1.5">
                  <button
                    v-for="opt in langOptions"
                    :key="opt.code"
                    role="menuitem"
                    @click="setLang(opt.code)"
                    class="w-full flex items-center gap-2.5 px-3 py-2 text-[13px] text-left
                           hover:bg-black/[0.04] transition-colors"
                    :class="locale === opt.code ? 'text-primary-600 font-semibold' : 'text-[#1C2434]'"
                  >
                    <span class="text-base leading-none">{{ opt.flag }}</span>
                    <span class="flex-1">{{ opt.label }}</span>
                    <span v-if="locale === opt.code"
                      class="w-1.5 h-1.5 bg-primary-500 flex-shrink-0" />
                  </button>
                </div>
              </div>
            </Transition>
          </div>

          <!-- Notification bell -->
          <AlertBell class="hidden sm:block" />

          <!-- User avatar / dropdown -->
          <div class="relative" ref="userMenuRef">
            <button
              type="button"
              @click="userOpen = !userOpen; $nextTick(() => document.getElementById('glass-user-menu')?.querySelector('[role=menuitem]')?.focus())"
              aria-haspopup="menu"
              :aria-expanded="userOpen"
              aria-controls="glass-user-menu"
              class="flex items-center gap-2.5 h-10 sm:pl-2.5 sm:pr-3.5 border border-transparent sm:border-white/70 bg-transparent sm:bg-white/55
                     hover:bg-white/85 transition-colors"
            >
              <div class="w-8 h-8 bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center
                          text-white text-[12px] font-bold flex-shrink-0">
                {{ userInitial }}
              </div>
              <div class="hidden lg:block min-w-0 text-left">
                <p class="text-[13px] font-semibold text-[#1C2434] truncate max-w-32 leading-tight">{{ auth.user?.name }}</p>
                <p class="text-[11px] text-[#637381] capitalize leading-tight">{{ auth.user?.role }}</p>
              </div>
              <ChevronDownIcon class="hidden lg:block w-3.5 h-3.5 text-[#5E6E82] transition-transform"
                               :class="{ 'rotate-180': userOpen }" />
            </button>

            <Transition
              enter-active-class="transition ease-out duration-100"
              enter-from-class="opacity-0 scale-95 -translate-y-1"
              enter-to-class="opacity-100 scale-100 translate-y-0"
              leave-active-class="transition ease-in duration-75"
              leave-from-class="opacity-100 scale-100 translate-y-0"
              leave-to-class="opacity-0 scale-95 -translate-y-1"
            >
              <div v-if="userOpen"
                   id="glass-user-menu"
                   role="menu"
                   aria-label="Account"
                   @keydown="onLangMenuKeydown"
                   class="absolute right-0 top-full mt-1.5 w-56 bg-white/92 backdrop-blur-xl border border-white/70 shadow-card-lg z-50 overflow-hidden">
                <div class="px-4 py-3 border-b border-black/[0.05]">
                  <p class="text-[13px] font-semibold text-[#1C2434] truncate">{{ auth.user?.name }}</p>
                  <p class="text-[11.5px] text-[#637381] truncate">{{ auth.user?.email }}</p>
                </div>
                <div class="p-1.5">
                  <RouterLink role="menuitem" to="/profile/general" @click="userOpen = false"
                    class="flex items-center gap-2.5 px-3 py-2 text-[13px] text-[#1C2434] hover:bg-black/[0.04] transition-colors">
                    <UserCircleIcon class="w-4 h-4 text-[#637381]" />
                    <span>{{ t('nav.profile') }}</span>
                  </RouterLink>
                  <RouterLink role="menuitem" to="/profile/sessions" @click="userOpen = false"
                    class="flex items-center gap-2.5 px-3 py-2 text-[13px] text-[#1C2434] hover:bg-black/[0.04] transition-colors">
                    <ComputerDesktopIcon class="w-4 h-4 text-[#637381]" />
                    <span>{{ t('profile.tabSessions') }}</span>
                  </RouterLink>
                  <RouterLink role="menuitem" to="/billing" @click="userOpen = false"
                    class="flex items-center gap-2.5 px-3 py-2 text-[13px] text-[#1C2434] hover:bg-black/[0.04] transition-colors">
                    <CreditCardIcon class="w-4 h-4 text-[#637381]" />
                    <span>{{ t('billing.nav') }}</span>
                  </RouterLink>
                </div>
                <div class="p-1.5 border-t border-black/[0.05]">
                  <button type="button" role="menuitem" @click="handleLogout"
                    class="w-full flex items-center gap-2.5 px-3 py-2 text-[13px] text-[#B91C1C] hover:bg-red-50 transition-colors">
                    <ArrowRightOnRectangleIcon class="w-4 h-4" />
                    <span>{{ t('nav.signOut') }}</span>
                  </button>
                </div>
              </div>
            </Transition>
          </div>
        </div>
      </header>

      <!-- Impersonation banner -->
      <div v-if="auth.impersonating" class="flex-shrink-0 bg-amber-400 px-4 md:px-6 py-2 flex items-center gap-3">
        <UserCircleIcon class="w-4 h-4 text-amber-900 flex-shrink-0" />
        <p class="text-[13px] font-semibold text-amber-900 flex-1 leading-none">
          Viewing as <span class="font-bold">{{ auth.user?.name }}</span> ({{ auth.user?.email }})
        </p>
        <button @click="handleReturnToAdmin"
          class="text-[12px] font-bold text-amber-900 bg-amber-900/15 hover:bg-amber-900/25 px-3 py-1 transition-colors flex-shrink-0">
          Return to Admin
        </button>
      </div>

      <!-- Content -->
      <main class="flex-1 overflow-y-auto p-4 md:p-6 scrollbar-thin">
        <slot />
      </main>

    </div>
  </div>

  <!-- AI Chat slide-over -->
  <AiChatPanel v-model="chatOpen" />
</template>

<script setup>
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import {
  ChevronDownIcon, ArrowRightOnRectangleIcon,
  UserCircleIcon, ComputerDesktopIcon, CreditCardIcon, Bars3Icon, XMarkIcon, SparklesIcon,
} from '@heroicons/vue/24/outline'
import { useI18n } from 'vue-i18n'
import { useRouter, useRoute } from 'vue-router'
import { useAppLayout } from '@/composables/useAppLayout'
import AlertBell from '@/components/AlertBell.vue'
import BrandMark from '@/components/BrandMark.vue'
import AiChatPanel from '@/components/AiChatPanel.vue'

const {
  auth,
  navSections,
  openGroups,
  toggleGroup,
  userInitial,
  currentPageTitle,
  handleLogout,
} = useAppLayout()

const router = useRouter()
const route  = useRoute()

// ── Mobile sidebar state ────────────────────────────────────────────────
const sidebarOpen = ref(false)

// ── AI Chat panel ────────────────────────────────────────────────────────
const chatOpen = ref(false)

watch(() => route.path, () => { sidebarOpen.value = false })

watch(sidebarOpen, (open) => {
  if (typeof document === 'undefined') return
  // Only lock when sidebar is opened as overlay (mobile). On md+ it's static.
  const isMobile = typeof window !== 'undefined' && window.matchMedia('(max-width: 767px)').matches
  document.body.style.overflow = open && isMobile ? 'hidden' : ''
})

async function handleReturnToAdmin() {
  await auth.returnToAdmin()
  router.push('/admin/organizations')
}

const { locale, t } = useI18n()

const langOpen    = ref(false)
const langMenuRef = ref(null)

const userOpen    = ref(false)
const userMenuRef = ref(null)

const langOptions = [
  { code: 'en', flag: '🇺🇸', label: 'English' },
  { code: 'th', flag: '🇹🇭', label: 'ภาษาไทย' },
]

const currentLangLabel = computed(() =>
  langOptions.find(o => o.code === locale.value)?.flag + ' ' +
  (locale.value === 'th' ? 'TH' : 'EN')
)

function setLang(code) {
  locale.value = code
  localStorage.setItem('app-lang', code)
  langOpen.value = false
}

// Focus the first menuitem when a menu opens; keyboard users can actually
// reach the items (critique P1: focus never moved into menus).
function onLangMenuKeydown(e) {
  const items = [...e.currentTarget.querySelectorAll('[role="menuitem"]')]
  const idx = items.indexOf(document.activeElement)
  if (e.key === 'ArrowDown') { e.preventDefault(); items[idx + 1] || items[0]?.focus() }
  else if (e.key === 'ArrowUp') { e.preventDefault(); items[idx - 1] || items[items.length - 1]?.focus() }
  else if (e.key === 'Home') { e.preventDefault(); items[0]?.focus() }
  else if (e.key === 'End') { e.preventDefault(); items[items.length - 1]?.focus() }
  else if (e.key === 'Tab') { langOpen.value = false }
}

function onClickOutside(e) {
  if (langMenuRef.value && !langMenuRef.value.contains(e.target)) {
    langOpen.value = false
  }
  if (userMenuRef.value && !userMenuRef.value.contains(e.target)) {
    userOpen.value = false
  }
}

function onKeydown(e) {
  if (e.key === 'Escape') {
    if (langOpen.value) {
      langOpen.value = false
      langMenuRef.value?.querySelector('[aria-haspopup="menu"]')?.focus()
      return
    }
    if (userOpen.value) {
      userOpen.value = false
      userMenuRef.value?.querySelector('[aria-haspopup="menu"]')?.focus()
      return
    }
  }
  if (e.key === 'Escape' && sidebarOpen.value) sidebarOpen.value = false

  // Shift+A toggles the AI panel — ignored while typing so it doesn't hijack
  // a capital "A" in an input, textarea, select, or contenteditable.
  if (e.shiftKey && !e.ctrlKey && !e.metaKey && !e.altKey && e.key.toLowerCase() === 'a') {
    const el = e.target
    const typing = el && (
      el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' ||
      el.tagName === 'SELECT' || el.isContentEditable
    )
    if (typing) return
    e.preventDefault()
    chatOpen.value = !chatOpen.value
  }
}

onMounted(() => {
  document.addEventListener('mousedown', onClickOutside)
  window.addEventListener('keydown', onKeydown)
})
onUnmounted(() => {
  document.removeEventListener('mousedown', onClickOutside)
  window.removeEventListener('keydown', onKeydown)
  if (typeof document !== 'undefined') document.body.style.overflow = ''
})
</script>

<style scoped>
/* Glass surfaces — warm light glass, low blur so scrolling stays cheap */
.glass-surface {
  background: linear-gradient(160deg, rgba(255,255,255,0.78), rgba(255,255,255,0.52));
  backdrop-filter: blur(18px) saturate(1.15);
  -webkit-backdrop-filter: blur(18px) saturate(1.15);
}
.glass-topbar {
  background: linear-gradient(160deg, rgba(255,255,255,0.66), rgba(255,255,255,0.40));
  backdrop-filter: blur(18px) saturate(1.15);
  -webkit-backdrop-filter: blur(18px) saturate(1.15);
}

.nav-item {
  @apply flex items-center gap-3 px-3 py-2.5 text-[13.5px] text-[#4A5568]
         hover:bg-white/70 hover:text-[#1C2434] transition-colors duration-100 w-full;
}
.nav-item-active {
  @apply !bg-gradient-to-r !from-primary-50 !to-white/70 !text-[#C24A1E] font-semibold;
  box-shadow: inset 3px 0 0 #E8632F, 0 1px 6px rgba(28, 25, 23, 0.06);
}
.nav-item-open {
  @apply bg-white/50 text-[#1C2434];
}
.nav-item-sm {
  @apply flex items-center gap-2.5 px-3 py-2 text-[13px] text-[#637381]
         hover:bg-white/60 hover:text-[#1C2434] transition-colors duration-100 w-full;
}
</style>
