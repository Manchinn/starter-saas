<template>
  <AppLayout>
    <div class="space-y-6">

      <!-- Page header -->
      <div class="flex items-start justify-between">
        <div>
          <h1 class="page-title">{{ t('dashboard.title') }}</h1>
          <p class="page-subtitle">
            {{ t('dashboard.welcomeBack') }}
            <span class="font-semibold text-[#1C2434]">{{ auth.user?.name }}</span>
          </p>
        </div>
        <span class="badge badge-green">
          <span class="w-1.5 h-1.5 rounded-full bg-[#22C55E] animate-pulse"></span>
          {{ t('dashboard.systemsOk') }}
        </span>
      </div>

      <!-- Stats grid -->
      <div v-if="stats.length" class="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div
          v-for="stat in stats"
          :key="stat.labelKey"
          class="bg-white rounded-2xl border border-[#E2E8F0] shadow-card p-6"
        >
          <div class="flex items-center justify-between mb-4">
            <div :class="['w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0', stat.bg]">
              <component :is="stat.icon" :class="['w-6 h-6', stat.iconColor]" />
            </div>
            <span class="badge badge-green text-[11px]">
              <ArrowTrendingUpIcon class="w-3 h-3" />
              +{{ stat.trend }}%
            </span>
          </div>
          <p class="text-3xl font-bold text-[#1C2434] tabular">{{ stat.value }}</p>
          <p class="text-[13px] font-medium text-[#637381] mt-1">{{ t(stat.labelKey) }}</p>
        </div>
      </div>

      <!-- Session info card -->
      <div class="card overflow-hidden">
        <div class="px-6 py-4 border-b border-[#E2E8F0] flex items-center gap-3">
          <div class="w-1 h-4 rounded-full bg-primary-500"></div>
          <h3 class="text-[14px] font-semibold text-[#1C2434]">{{ t('dashboard.sessionDetails') }}</h3>
        </div>
        <div class="p-6">
          <div class="grid grid-cols-2 md:grid-cols-4 gap-x-6 gap-y-6">
            <div>
              <p class="text-[11px] font-semibold text-[#637381] uppercase tracking-wider mb-2">{{ t('dashboard.account') }}</p>
              <p class="text-[14px] font-semibold text-[#1C2434]">{{ auth.user?.name }}</p>
            </div>
            <div>
              <p class="text-[11px] font-semibold text-[#637381] uppercase tracking-wider mb-2">{{ t('dashboard.email') }}</p>
              <p class="text-[14px] text-[#1C2434] truncate">{{ auth.user?.email }}</p>
            </div>
            <div>
              <p class="text-[11px] font-semibold text-[#637381] uppercase tracking-wider mb-2">{{ t('dashboard.role') }}</p>
              <span class="inline-flex items-center px-2.5 py-1 rounded-lg bg-[#F1F5F9] text-[12px] font-semibold text-[#1C2434] capitalize">
                {{ auth.user?.role }}
              </span>
            </div>
            <div>
              <p class="text-[11px] font-semibold text-[#637381] uppercase tracking-wider mb-2">{{ t('dashboard.status') }}</p>
              <span class="badge badge-green">
                <span class="w-1.5 h-1.5 rounded-full bg-[#22C55E]"></span>
                {{ t('common.active') }}
              </span>
            </div>
          </div>
        </div>
      </div>

    </div>
  </AppLayout>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import AppLayout from '@/layouts/AppLayout.vue'
import { useAuthStore } from '@/stores/auth'
import { UsersIcon, PuzzlePieceIcon, CheckCircleIcon, ArrowTrendingUpIcon } from '@heroicons/vue/24/outline'
import api from '@/api'

const auth  = useAuthStore()
const { t } = useI18n()
const stats = ref([])

onMounted(async () => {
  try {
    const { data } = await api.get('/dashboard/stats')
    const raw = data.data
    stats.value = [
      { labelKey: 'dashboard.totalUsers',    value: raw.totalUsers,    icon: UsersIcon,       bg: 'bg-primary-50',  iconColor: 'text-primary-500', trend: 12 },
      { labelKey: 'dashboard.totalModules',  value: raw.totalModules,  icon: PuzzlePieceIcon, bg: 'bg-violet-50',   iconColor: 'text-violet-500',  trend: 8  },
      { labelKey: 'dashboard.activeModules', value: raw.activeModules, icon: CheckCircleIcon, bg: 'bg-[#DCFCE7]',   iconColor: 'text-[#15803D]',   trend: 5  },
    ]
  } catch {
    // Stats unavailable for non-admin users
  }
})
</script>
