<template>
  <AppLayout>
    <div class="space-y-6">
      <h1 class="text-2xl font-bold text-gray-900">Dashboard</h1>

      <!-- Stats -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard
          v-for="stat in stats"
          :key="stat.label"
          :label="stat.label"
          :value="stat.value"
          :icon="stat.icon"
          :color="stat.color"
        />
      </div>

      <!-- Welcome -->
      <div class="bg-white rounded-xl border border-gray-200 p-6">
        <h2 class="text-lg font-semibold text-gray-800 mb-2">Welcome back, {{ auth.user?.name }}!</h2>
        <p class="text-gray-500 text-sm">
          You are logged in as <span class="font-medium capitalize">{{ auth.user?.role }}</span>.
          Your session is active and all systems are operational.
        </p>
      </div>
    </div>
  </AppLayout>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import AppLayout from '@/layouts/AppLayout.vue'
import { useAuthStore } from '@/stores/auth'
import { UsersIcon, PuzzlePieceIcon, CheckCircleIcon } from '@heroicons/vue/24/outline'
import api from '@/api'

const auth = useAuthStore()

const rawStats = ref({ totalUsers: 0, totalModules: 0, activeModules: 0 })

const stats = ref([])

const StatCard = {
  props: ['label', 'value', 'icon', 'color'],
  template: `
    <div class="bg-white rounded-xl border border-gray-200 p-6 flex items-center gap-4">
      <div :class="['p-3 rounded-lg', color]">
        <component :is="icon" class="w-6 h-6 text-white" />
      </div>
      <div>
        <p class="text-sm text-gray-500">{{ label }}</p>
        <p class="text-2xl font-bold text-gray-900">{{ value }}</p>
      </div>
    </div>
  `,
}

onMounted(async () => {
  try {
    const { data } = await api.get('/dashboard/stats')
    rawStats.value = data.data
    stats.value = [
      { label: 'Total Users', value: rawStats.value.totalUsers, icon: UsersIcon, color: 'bg-blue-500' },
      { label: 'Total Modules', value: rawStats.value.totalModules, icon: PuzzlePieceIcon, color: 'bg-purple-500' },
      { label: 'Active Modules', value: rawStats.value.activeModules, icon: CheckCircleIcon, color: 'bg-green-500' },
    ]
  } catch {
    // Stats unavailable (non-admin users may not have access)
    stats.value = []
  }
})
</script>
