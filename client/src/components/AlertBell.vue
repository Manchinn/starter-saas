<template>
  <div class="relative" ref="menuRef">
    <!-- Bell button -->
    <button
      type="button"
      @click="toggle"
      class="relative w-10 h-10 flex items-center justify-center border border-[#E2E8F0]
             bg-white hover:bg-[#F7F9FC] text-[#637381] hover:text-[#1C2434] transition-colors"
      :aria-label="t('erp.alerts.bellTitle')"
    >
      <BellIcon class="w-5 h-5" />
      <span
        v-if="store.hasUnread"
        class="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 bg-red-500 text-white
               text-[10px] font-bold leading-none flex items-center justify-center"
      >
        {{ store.unread > 99 ? '99+' : store.unread }}
      </span>
    </button>

    <!-- Dropdown panel -->
    <Transition
      enter-active-class="transition ease-out duration-100"
      enter-from-class="opacity-0 scale-95 -translate-y-1"
      enter-to-class="opacity-100 scale-100 translate-y-0"
      leave-active-class="transition ease-in duration-75"
      leave-from-class="opacity-100 scale-100 translate-y-0"
      leave-to-class="opacity-0 scale-95 -translate-y-1"
    >
      <div
        v-if="open"
        class="absolute right-0 top-full mt-1.5 w-[360px] max-w-[calc(100vw-1.5rem)]
               bg-white border border-[#E2E8F0] shadow-card-lg z-50 overflow-hidden flex flex-col"
      >
        <!-- Header -->
        <div class="px-4 py-3 border-b border-[#E2E8F0] flex items-center justify-between gap-2">
          <p class="text-[13px] font-semibold text-[#1C2434]">{{ t('erp.alerts.bellTitle') }}</p>
          <button
            v-if="store.hasUnread"
            @click="store.markAllRead()"
            class="text-[12px] font-medium text-primary-600 hover:text-primary-700 transition-colors"
          >
            {{ t('erp.alerts.markAllRead') }}
          </button>
        </div>

        <!-- Filter chips -->
        <div class="px-3 py-2 border-b border-[#E2E8F0] flex items-center gap-1.5">
          <button
            v-for="f in FILTERS" :key="f.key"
            @click="filter = f.key"
            :class="['px-2.5 py-1 text-[12px] font-medium transition-colors',
                     filter === f.key
                       ? 'bg-primary-50 text-primary-600 border border-primary-200'
                       : 'text-[#637381] border border-transparent hover:bg-[#F7F9FC]']"
          >
            {{ t(f.label) }}
          </button>
        </div>

        <!-- List -->
        <div class="overflow-y-auto scrollbar-thin max-h-[360px]">
          <div v-if="store.loading && !filtered.length" class="px-4 py-8 text-center text-[13px] text-[#9BA7B0]">
            {{ t('common.loading') }}
          </div>

          <div v-else-if="!filtered.length" class="px-4 py-10 flex flex-col items-center gap-2 text-center">
            <div class="w-10 h-10 bg-[#F1F5F9] flex items-center justify-center">
              <BellIcon class="w-5 h-5 text-[#9BA7B0]" />
            </div>
            <p class="text-[13px] text-[#637381]">{{ t('erp.alerts.empty') }}</p>
          </div>

          <ul v-else class="divide-y divide-[#F1F5F9]">
            <li
              v-for="a in filtered" :key="a.id"
              class="relative flex gap-3 px-4 py-3 hover:bg-[#F7F9FC] transition-colors cursor-pointer"
              :class="{ 'bg-primary-50/30': !a.isRead }"
              @click="onClick(a)"
            >
              <!-- Severity dot -->
              <span class="mt-1.5 w-2 h-2 flex-shrink-0 rounded-full" :class="SEVERITY[a.severity]?.dot || 'bg-slate-400'" />

              <div class="min-w-0 flex-1">
                <div class="flex items-start gap-2">
                  <p class="text-[13px] font-semibold text-[#1C2434] leading-snug flex-1 truncate">{{ a.title }}</p>
                  <button
                    v-if="canManage"
                    @click.stop="confirmDelete(a)"
                    class="p-0.5 -mr-1 text-[#C0C8D2] hover:text-red-500 transition-colors flex-shrink-0"
                    :title="t('common.delete')"
                  >
                    <TrashIcon class="w-3.5 h-3.5" />
                  </button>
                </div>
                <p v-if="a.body" class="text-[12px] text-[#637381] mt-0.5 line-clamp-2">{{ a.body }}</p>
                <div class="flex items-center gap-2 mt-1">
                  <span class="inline-flex items-center px-1.5 py-0.5 text-[10px] font-medium bg-[#F1F5F9] text-[#637381]">
                    {{ scopeLabel(a) }}
                  </span>
                  <span class="text-[11px] text-[#9BA7B0]">{{ fmtDateTime(a.createdAt) }}</span>
                  <span v-if="!a.isRead" class="ml-auto w-2 h-2 rounded-full bg-primary-500 flex-shrink-0" />
                </div>
              </div>
            </li>
          </ul>
        </div>

        <!-- Footer -->
        <RouterLink
          to="/erp/alerts"
          @click="open = false"
          class="px-4 py-2.5 border-t border-[#E2E8F0] text-center text-[12px] font-medium
                 text-primary-600 hover:bg-[#F7F9FC] transition-colors"
        >
          {{ t('erp.alerts.viewAll') }}
        </RouterLink>
      </div>
    </Transition>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter, RouterLink } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { BellIcon, TrashIcon } from '@heroicons/vue/24/outline'
import { useAlertsStore } from '@/stores/alerts'
import { useAuthStore } from '@/stores/auth'
import { fmtDateTime } from '@/utils/fmt'

const { t } = useI18n()
const router = useRouter()
const store = useAlertsStore()
const auth = useAuthStore()

const open = ref(false)
const menuRef = ref(null)
const filter = ref('all')

const canManage = computed(() => auth.hasPermission('erp.alerts.manage'))

const FILTERS = [
  { key: 'all',        label: 'erp.alerts.filterAll' },
  { key: 'module',     label: 'erp.alerts.filterModule' },
  { key: 'department', label: 'erp.alerts.filterDepartment' },
]

const SEVERITY = {
  info:     { dot: 'bg-blue-500' },
  success:  { dot: 'bg-green-500' },
  warning:  { dot: 'bg-amber-500' },
  critical: { dot: 'bg-red-500' },
}

const filtered = computed(() => {
  if (filter.value === 'all') return store.alerts
  return store.alerts.filter((a) => a.scope === filter.value)
})

function scopeLabel(a) {
  if (a.scope === 'module') return a.moduleSlug || t('erp.alerts.scopeModule')
  if (a.scope === 'department') return a.departmentName || t('erp.alerts.scopeDepartment')
  return t('erp.alerts.scopeGlobal')
}

function toggle() { open.value = !open.value }

function onClick(a) {
  store.markRead(a.id)
  if (a.link) {
    open.value = false
    router.push(a.link)
  }
}

async function confirmDelete(a) {
  if (!confirm(t('erp.alerts.confirmDelete'))) return
  try {
    await store.remove(a.id)
  } catch (err) {
    alert(err.response?.data?.message || 'Delete failed')
  }
}

function onClickOutside(e) {
  if (menuRef.value && !menuRef.value.contains(e.target)) open.value = false
}

onMounted(() => {
  store.start()
  document.addEventListener('mousedown', onClickOutside)
})
onUnmounted(() => {
  // Don't stop the socket here — the bell remounts on every navigation (each
  // page renders its own layout). The socket is torn down on logout instead.
  document.removeEventListener('mousedown', onClickOutside)
})
</script>
