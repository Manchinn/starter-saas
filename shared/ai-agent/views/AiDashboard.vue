<template>
  <AppLayout>
    <div class="space-y-6">

      <!-- Heading -->
      <div class="flex items-start justify-between gap-4">
        <div>
          <h1 class="text-xl font-semibold text-[#1C2434]">{{ t('aiAgent.dashboard.title') }}</h1>
          <p class="text-sm text-[#637381] mt-0.5">{{ t('aiAgent.dashboard.subtitle') }}</p>
        </div>
        <div class="flex items-center gap-2 flex-shrink-0">
          <RouterLink to="/ai/chat" class="btn-secondary">
            <ChatBubbleLeftRightIcon class="w-4 h-4" />
            <span class="hidden sm:inline">{{ t('aiAgent.dashboard.backToChat') }}</span>
          </RouterLink>
          <button type="button" @click="load" :disabled="loading" class="btn-secondary">
            <ArrowPathIcon :class="['w-4 h-4', loading && 'animate-spin']" />
            <span class="hidden sm:inline">{{ t('aiAgent.dashboard.refresh') }}</span>
          </button>
        </div>
      </div>

      <!-- Loading -->
      <div v-if="loading && !stats" class="flex items-center justify-center py-24">
        <span class="block w-7 h-7 border-2 border-[#E2E8F0] border-t-primary-500 rounded-full animate-spin"></span>
      </div>

      <!-- Empty -->
      <div v-else-if="stats && !stats.totals.totalTokens"
        class="bg-white border border-[#E2E8F0] shadow-sm flex flex-col items-center justify-center text-center gap-3 py-20 px-6">
        <div class="w-12 h-12 bg-primary-50 flex items-center justify-center">
          <ChartBarIcon class="w-6 h-6 text-primary-500" />
        </div>
        <p class="text-sm font-medium text-[#1C2434]">{{ t('aiAgent.dashboard.empty') }}</p>
        <p class="text-[13px] text-[#9BA7B0] max-w-md">{{ t('aiAgent.dashboard.emptyHint') }}</p>
        <RouterLink to="/ai/chat" class="btn-primary mt-1">
          <ChatBubbleLeftRightIcon class="w-4 h-4" /> {{ t('aiAgent.dashboard.startChat') }}
        </RouterLink>
      </div>

      <template v-else-if="stats">
        <!-- Summary cards -->
        <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div v-for="c in cards" :key="c.key" class="bg-white border border-[#E2E8F0] shadow-sm p-4">
            <div class="flex items-center gap-2 text-[#637381]">
              <component :is="c.icon" class="w-4 h-4 text-primary-500" />
              <span class="text-[12px] font-medium uppercase tracking-wide">{{ c.label }}</span>
            </div>
            <p class="mt-2 text-2xl font-semibold text-[#1C2434]">{{ c.value }}</p>
            <p v-if="c.sub" class="text-[12px] text-[#9BA7B0] mt-0.5">{{ c.sub }}</p>
          </div>
        </div>

        <!-- Daily usage chart -->
        <div class="bg-white border border-[#E2E8F0] shadow-sm">
          <div class="px-5 py-3.5 border-b border-[#E2E8F0]">
            <h2 class="text-sm font-semibold text-[#1C2434]">{{ t('aiAgent.dashboard.dailyTitle') }}</h2>
          </div>
          <div class="px-5 py-5">
            <p v-if="!maxDaily" class="text-center text-[13px] text-[#9BA7B0] py-8">
              {{ t('aiAgent.dashboard.dailyEmpty') }}
            </p>
            <div v-else class="flex items-end gap-1.5 h-44">
              <div v-for="d in stats.daily" :key="d.date"
                class="flex-1 flex flex-col items-center justify-end h-full group relative">
                <!-- Tooltip -->
                <div class="absolute -top-1 left-1/2 -translate-x-1/2 -translate-y-full z-10 hidden group-hover:block
                            whitespace-nowrap bg-[#1C2434] text-white text-[11px] px-2 py-1 rounded shadow-lg">
                  {{ fmt(d.totalTokens) }} {{ t('aiAgent.dashboard.tokensLabel') }}
                  <span class="block text-[#C0C8D2]">{{ formatDay(d.date) }}</span>
                </div>
                <div class="w-full bg-primary-500/90 hover:bg-primary-500 transition-colors"
                  :style="{ height: barHeight(d.totalTokens) }"></div>
              </div>
            </div>
            <div class="flex items-center justify-between mt-2 text-[11px] text-[#9BA7B0]">
              <span>{{ formatDay(stats.daily[0].date) }}</span>
              <span>{{ formatDay(stats.daily[stats.daily.length - 1].date) }}</span>
            </div>
          </div>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <!-- By model -->
          <div class="bg-white border border-[#E2E8F0] shadow-sm">
            <div class="px-5 py-3.5 border-b border-[#E2E8F0]">
              <h2 class="text-sm font-semibold text-[#1C2434]">{{ t('aiAgent.dashboard.byModelTitle') }}</h2>
            </div>
            <div class="p-5 space-y-3">
              <p v-if="!stats.byModel.length" class="text-[13px] text-[#9BA7B0] text-center py-4">
                {{ t('aiAgent.dashboard.noModels') }}
              </p>
              <div v-for="m in stats.byModel" :key="m.model">
                <div class="flex items-center justify-between text-[13px] mb-1">
                  <span class="font-medium text-[#1C2434] truncate pr-2">{{ m.model }}</span>
                  <span class="text-[#637381] flex-shrink-0">{{ fmt(m.totalTokens) }}</span>
                </div>
                <div class="h-2 bg-[#F1F5F9] overflow-hidden">
                  <div class="h-full bg-primary-500" :style="{ width: modelPct(m.totalTokens) }"></div>
                </div>
              </div>
            </div>
          </div>

          <!-- Top conversations -->
          <div class="bg-white border border-[#E2E8F0] shadow-sm">
            <div class="px-5 py-3.5 border-b border-[#E2E8F0]">
              <h2 class="text-sm font-semibold text-[#1C2434]">{{ t('aiAgent.dashboard.topConvTitle') }}</h2>
            </div>
            <div class="divide-y divide-[#F1F5F9]">
              <p v-if="!stats.topConversations.length" class="text-[13px] text-[#9BA7B0] text-center py-6">
                {{ t('aiAgent.dashboard.noConv') }}
              </p>
              <RouterLink v-for="c in stats.topConversations" :key="c.id"
                :to="`/ai/chat?c=${c.id}`"
                class="flex items-center justify-between gap-3 px-5 py-3 hover:bg-[#F7F9FC] transition-colors">
                <div class="min-w-0">
                  <p class="text-[13px] font-medium text-[#1C2434] truncate">{{ c.title }}</p>
                  <p class="text-[12px] text-[#9BA7B0]">{{ c.messages }} {{ t('aiAgent.dashboard.repliesLabel') }}</p>
                </div>
                <span class="text-[13px] font-semibold text-primary-600 flex-shrink-0">{{ fmt(c.totalTokens) }}</span>
              </RouterLink>
            </div>
          </div>
        </div>
      </template>
    </div>
  </AppLayout>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { RouterLink } from 'vue-router'
import { useI18n } from 'vue-i18n'
import {
  ChartBarIcon, ChatBubbleLeftRightIcon, ArrowPathIcon,
  CpuChipIcon, ArrowDownTrayIcon, ArrowUpTrayIcon, CalendarDaysIcon,
} from '@heroicons/vue/24/outline'
import AppLayout from '@/layouts/AppLayout.vue'
import { useAiAgentStore } from '@/stores/aiAgent'

const { t } = useI18n()
const store = useAiAgentStore()

const stats = ref(null)
const loading = ref(false)

async function load() {
  loading.value = true
  try {
    stats.value = await store.loadTokenStats()
  } finally {
    loading.value = false
  }
}
onMounted(load)

// Compact number formatting (1.2k, 3.4M) — token counts grow fast.
function fmt(n) {
  const v = Number(n) || 0
  if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}M`
  if (v >= 1_000) return `${(v / 1_000).toFixed(1)}k`
  return String(v)
}

const cards = computed(() => {
  const s = stats.value
  if (!s) return []
  const avg = s.totals.messages ? Math.round(s.totals.totalTokens / s.totals.messages) : 0
  return [
    { key: 'total',  icon: CpuChipIcon,       label: t('aiAgent.dashboard.totalTokens'),  value: fmt(s.totals.totalTokens), sub: `${fmt(avg)} ${t('aiAgent.dashboard.perReply')}` },
    { key: 'today',  icon: CalendarDaysIcon,  label: t('aiAgent.dashboard.todayTokens'),  value: fmt(s.today.totalTokens), sub: `${s.today.messages} ${t('aiAgent.dashboard.messages')}` },
    { key: 'prompt', icon: ArrowUpTrayIcon,   label: t('aiAgent.dashboard.promptTokens'), value: fmt(s.totals.promptTokens) },
    { key: 'compl',  icon: ArrowDownTrayIcon, label: t('aiAgent.dashboard.completionTokens'), value: fmt(s.totals.completionTokens) },
  ]
})

const maxDaily = computed(() => Math.max(0, ...(stats.value?.daily || []).map((d) => d.totalTokens)))
function barHeight(v) {
  if (!maxDaily.value) return '0%'
  // Floor visible bars at 4% so a non-zero day is always perceptible.
  const pct = (Number(v) || 0) / maxDaily.value * 100
  return v > 0 ? `${Math.max(4, pct)}%` : '0%'
}

const maxModel = computed(() => Math.max(0, ...(stats.value?.byModel || []).map((m) => m.totalTokens)))
function modelPct(v) {
  if (!maxModel.value) return '0%'
  return `${Math.max(2, (Number(v) || 0) / maxModel.value * 100)}%`
}

function formatDay(iso) {
  const d = new Date(`${iso}T00:00:00`)
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}
</script>
