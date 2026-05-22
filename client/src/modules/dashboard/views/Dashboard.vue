<template>
  <AppLayout>
    <div class="space-y-6">

      <!-- ─ Page header ──────────────────────────────────────────────────── -->
      <div class="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
        <div>
          <h1 class="page-title">{{ t('dashboard.title') }}</h1>
          <p class="page-subtitle">
            {{ t('dashboard.welcomeBack') }}
            <span class="font-semibold text-[#1C2434]">{{ auth.user?.name }}</span>
            <span v-if="auth.user?.lastLoginAt" class="text-[#9BA7B0]">
              · {{ t('dashboard.lastSeen') }} {{ formatRelative(auth.user.lastLoginAt) }}
            </span>
          </p>
        </div>
        <div class="flex items-center gap-2">
          <span class="badge badge-green">
            <span class="w-1.5 h-1.5 rounded-full bg-[#22C55E] animate-pulse"></span>
            {{ t('dashboard.systemsOk') }}
          </span>
          <RouterLink to="/admin/organizations/create" class="btn-primary text-[12.5px]">
            <PlusIcon class="w-4 h-4" />
            {{ t('dashboard.newOrg') }}
          </RouterLink>
        </div>
      </div>

      <!-- ─ KPI row ──────────────────────────────────────────────────────── -->
      <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          v-for="k in kpis"
          :key="k.labelKey"
          :label="t(k.labelKey)"
          :value="k.value"
          :icon="k.icon"
          :tone="k.tone"
          :trend="k.trend"
          :trend-label="k.trendLabel ? t(k.trendLabel) : ''"
          :loading="loadingStats"
        />
      </div>

      <!-- ─ Two-column main: Organizations + Recent sign-ins ─────────────── -->
      <div class="grid grid-cols-1 xl:grid-cols-3 gap-5">

        <!-- Organizations ── 2-col -->
        <section class="card overflow-hidden xl:col-span-2">
          <header class="px-5 py-4 border-b border-[#E2E8F0] flex items-center justify-between gap-3">
            <div class="flex items-center gap-3 min-w-0">
              <div class="w-1 h-4 rounded-full bg-primary-500 flex-shrink-0"></div>
              <h3 class="text-[14px] font-semibold text-[#1C2434] truncate">{{ t('dashboard.orgsTitle') }}</h3>
              <span class="text-[12px] text-[#9BA7B0] tabular">· {{ t('dashboard.orgsCount', { n: totalOrgs }) }}</span>
            </div>
            <RouterLink to="/admin/organizations" class="text-[12.5px] font-medium text-primary-600 hover:text-primary-700 flex items-center gap-1 whitespace-nowrap">
              {{ t('dashboard.seeAll') }}
              <ArrowRightIcon class="w-3.5 h-3.5" />
            </RouterLink>
          </header>

          <div class="overflow-x-auto">
            <table class="w-full text-sm">
              <thead class="bg-[#F7F9FC] border-b border-[#E2E8F0]">
                <tr class="text-left">
                  <th class="th">{{ t('dashboard.colOrg') }}</th>
                  <th class="th text-right">{{ t('dashboard.colStaff') }}</th>
                  <th class="th">{{ t('dashboard.colRoles') }}</th>
                  <th class="th">{{ t('dashboard.colStatus') }}</th>
                  <th class="th">{{ t('dashboard.colCreated') }}</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-50">
                <tr v-if="loadingOrgs">
                  <td colspan="5" class="text-center py-12">
                    <div class="inline-block w-5 h-5 border-2 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
                  </td>
                </tr>
                <tr v-else-if="!organizations.length">
                  <td colspan="5" class="text-center py-12">
                    <div class="flex flex-col items-center gap-2 text-[#9BA7B0]">
                      <BuildingOffice2Icon class="w-8 h-8 opacity-40" />
                      <p class="text-sm">{{ t('dashboard.noOrgs') }}</p>
                    </div>
                  </td>
                </tr>
                <tr
                  v-for="o in organizations" :key="o.id"
                  class="hover:bg-[#F7F9FC]/60 transition-colors cursor-pointer"
                  @click="goToOrg(o.id)"
                >
                  <td class="td">
                    <div class="flex items-center gap-3 min-w-0">
                      <div class="w-8 h-8 bg-primary-100 text-primary-600 flex items-center justify-center font-bold text-xs flex-shrink-0">
                        {{ o.name.charAt(0).toUpperCase() }}
                      </div>
                      <div class="min-w-0">
                        <p class="font-semibold text-[#1C2434] leading-tight truncate">{{ o.name }}</p>
                        <p class="text-[#9BA7B0] text-xs mt-0.5 truncate">{{ o.email }}</p>
                      </div>
                    </div>
                  </td>
                  <td class="td text-right tabular text-[#1C2434] font-medium">{{ o.staffCount }}</td>
                  <td class="td">
                    <div class="flex flex-wrap gap-1">
                      <span
                        v-for="r in o.roles.slice(0, 3)" :key="r.id"
                        class="px-2 py-0.5 rounded-full text-[11px] font-medium text-white whitespace-nowrap"
                        :style="{ backgroundColor: r.color }"
                      >{{ r.name }}</span>
                      <span v-if="o.roles.length > 3" class="px-2 py-0.5 rounded-full text-[11px] font-medium bg-[#F1F5F9] text-[#637381]">+{{ o.roles.length - 3 }}</span>
                      <span v-if="!o.roles.length" class="text-[#9BA7B0] text-xs">—</span>
                    </div>
                  </td>
                  <td class="td">
                    <span :class="o.isActive ? 'badge-green' : 'badge-red'" class="badge">
                      <span class="w-1.5 h-1.5 rounded-full" :class="o.isActive ? 'bg-emerald-500' : 'bg-red-500'"></span>
                      {{ o.isActive ? t('common.active') : t('common.inactive') }}
                    </span>
                  </td>
                  <td class="td text-xs text-[#637381] tabular whitespace-nowrap">{{ formatRelative(o.createdAt) }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        <!-- Recent sign-ins -->
        <section class="card overflow-hidden">
          <header class="px-5 py-4 border-b border-[#E2E8F0] flex items-center justify-between gap-3">
            <div class="flex items-center gap-3">
              <div class="w-1 h-4 rounded-full bg-violet-500"></div>
              <h3 class="text-[14px] font-semibold text-[#1C2434]">{{ t('dashboard.signInsTitle') }}</h3>
            </div>
            <span class="text-[11px] text-[#9BA7B0]">{{ t('dashboard.last7d') }}</span>
          </header>
          <div class="px-2 py-2">
            <div v-if="loadingSignIns" class="px-3 py-8 text-center text-[#9BA7B0] text-sm">
              <div class="inline-block w-5 h-5 border-2 border-violet-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
            <div v-else-if="!signIns.length" class="px-3 py-10 text-center text-[#9BA7B0]">
              <ComputerDesktopIcon class="w-7 h-7 mx-auto opacity-40" />
              <p class="text-sm mt-2">{{ t('dashboard.noSignIns') }}</p>
            </div>
            <ul v-else class="divide-y divide-slate-50">
              <li v-for="s in signIns" :key="s.id" class="flex items-center gap-3 px-3 py-2.5">
                <div class="w-8 h-8 bg-violet-50 text-violet-600 flex items-center justify-center flex-shrink-0">
                  <ComputerDesktopIcon class="w-4 h-4" />
                </div>
                <div class="flex-1 min-w-0">
                  <p class="text-[13px] font-semibold text-[#1C2434] truncate">{{ s.user?.name || t('dashboard.unknownUser') }}</p>
                  <p class="text-[11.5px] text-[#637381] truncate">{{ s.deviceLabel || t('dashboard.unknownDevice') }}<span v-if="s.ip"> · {{ s.ip }}</span></p>
                </div>
                <span class="text-[11px] text-[#9BA7B0] whitespace-nowrap tabular">{{ formatRelative(s.lastUsedAt) }}</span>
              </li>
            </ul>
          </div>
        </section>

      </div>

      <!-- ─ Module usage ──────────────────────────────────────────────── -->
      <section class="card overflow-hidden">
        <header class="px-5 py-4 border-b border-[#E2E8F0] flex items-center justify-between gap-3">
          <div class="flex items-center gap-3">
            <div class="w-1 h-4 rounded-full bg-emerald-500"></div>
            <h3 class="text-[14px] font-semibold text-[#1C2434]">{{ t('dashboard.moduleUsageTitle') }}</h3>
            <span class="text-[12px] text-[#9BA7B0]">· {{ t('dashboard.orgAdoption', { n: moduleTotalOrgs }) }}</span>
          </div>
          <RouterLink to="/admin/modules" class="text-[12.5px] font-medium text-primary-600 hover:text-primary-700 flex items-center gap-1">
            {{ t('dashboard.manage') }}
            <ArrowRightIcon class="w-3.5 h-3.5" />
          </RouterLink>
        </header>
        <div class="p-5">
          <div v-if="loadingModules" class="py-8 text-center text-[#9BA7B0]">
            <div class="inline-block w-5 h-5 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
          <div v-else-if="!moduleUsage.length" class="py-10 text-center text-[#9BA7B0]">
            <PuzzlePieceIcon class="w-7 h-7 mx-auto opacity-40" />
            <p class="text-sm mt-2">{{ t('dashboard.noModules') }}</p>
          </div>
          <div v-else class="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
            <div v-for="m in moduleUsage" :key="m.id" class="space-y-1.5">
              <div class="flex items-center justify-between gap-3 text-[13px]">
                <div class="flex items-center gap-2 min-w-0">
                  <span class="font-semibold text-[#1C2434] truncate">{{ m.name }}</span>
                  <span v-if="m.isCore" class="px-1.5 py-0.5 rounded text-[10px] font-medium bg-primary-50 text-primary-600">CORE</span>
                  <span v-if="!m.isActive" class="px-1.5 py-0.5 rounded text-[10px] font-medium bg-[#F1F5F9] text-[#9BA7B0]">{{ t('common.inactive') }}</span>
                </div>
                <span class="text-[12px] text-[#637381] tabular whitespace-nowrap">{{ m.assignedOrgCount }} / {{ moduleTotalOrgs }} · {{ m.pct }}%</span>
              </div>
              <div class="h-1.5 w-full bg-[#F1F5F9] rounded-full overflow-hidden">
                <div
                  class="h-full rounded-full transition-all"
                  :class="m.pct >= 70 ? 'bg-emerald-500' : m.pct >= 30 ? 'bg-primary-500' : 'bg-[#CBD5E1]'"
                  :style="{ width: `${m.pct}%` }"
                ></div>
              </div>
            </div>
          </div>
        </div>
      </section>

    </div>
  </AppLayout>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import KpiCard from './KpiCard.vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import {
  BuildingOffice2Icon, UserGroupIcon, ComputerDesktopIcon, PuzzlePieceIcon,
  PlusIcon, ArrowRightIcon,
} from '@heroicons/vue/24/outline'
import AppLayout from '@/layouts/AppLayout.vue'
import { useAuthStore } from '@/stores/auth'
import api from '@/api'
import { fmtDate } from '@/utils/fmt'

const auth   = useAuthStore()
const router = useRouter()
const { t, locale } = useI18n()

// ── State ─────────────────────────────────────────────────────────────────────

const stats         = ref({ totalOrganizations: 0, totalStaff: 0, activeSessions: 0, enabledModules: 0, totalModules: 0, trends: { organizations: null, staff: null, sessions: 0 } })
const organizations = ref([])
const signIns       = ref([])
const moduleUsage   = ref([])
const moduleTotalOrgs = ref(0)

const loadingStats   = ref(true)
const loadingOrgs    = ref(true)
const loadingSignIns = ref(true)
const loadingModules = ref(true)

const totalOrgs = computed(() => stats.value.totalOrganizations)

// ── KPI cards ─────────────────────────────────────────────────────────────────

const kpis = computed(() => [
  {
    labelKey: 'dashboard.kpiOrgs',
    value:    stats.value.totalOrganizations,
    icon:     BuildingOffice2Icon,
    tone:     'primary',
    trend:    stats.value.trends?.organizations,
    trendLabel: 'dashboard.vs30d',
  },
  {
    labelKey: 'dashboard.kpiStaff',
    value:    stats.value.totalStaff,
    icon:     UserGroupIcon,
    tone:     'violet',
    trend:    stats.value.trends?.staff,
    trendLabel: 'dashboard.vs30d',
  },
  {
    labelKey: 'dashboard.kpiSessions',
    value:    stats.value.activeSessions,
    icon:     ComputerDesktopIcon,
    tone:     'emerald',
    trend:    null,
    trendLabel: '',
  },
  {
    labelKey: 'dashboard.kpiModules',
    value:    `${stats.value.enabledModules} / ${stats.value.totalModules}`,
    icon:     PuzzlePieceIcon,
    tone:     'amber',
    trend:    null,
    trendLabel: '',
  },
])

// ── Data fetching ─────────────────────────────────────────────────────────────

async function loadStats() {
  try {
    const { data } = await api.get('/dashboard/stats')
    stats.value = data.data
  } catch {} finally { loadingStats.value = false }
}
async function loadOrgs() {
  try {
    const { data } = await api.get('/dashboard/organizations', { params: { limit: 10 } })
    organizations.value = data.data.organizations
  } catch {} finally { loadingOrgs.value = false }
}
async function loadSignIns() {
  try {
    const { data } = await api.get('/dashboard/recent-sign-ins', { params: { limit: 8 } })
    signIns.value = data.data.sessions
  } catch {} finally { loadingSignIns.value = false }
}
async function loadModuleUsage() {
  try {
    const { data } = await api.get('/dashboard/module-usage')
    moduleUsage.value     = data.data.modules
    moduleTotalOrgs.value = data.data.totalOrgs
  } catch {} finally { loadingModules.value = false }
}

onMounted(() => {
  loadStats(); loadOrgs(); loadSignIns(); loadModuleUsage()
})

// ── Helpers ───────────────────────────────────────────────────────────────────

function goToOrg(id) { router.push(`/admin/organizations/${id}/edit`) }

function formatRelative(d) {
  if (!d) return ''
  const date = new Date(d)
  const diff = Date.now() - date.getTime()
  const mins  = Math.floor(diff / 60_000)
  const hours = Math.floor(diff / 3_600_000)
  const days  = Math.floor(diff / 86_400_000)
  if (mins < 1)  return t('dashboard.justNow')
  if (mins < 60) return t('dashboard.minAgo', { n: mins })
  if (hours < 24) return t('dashboard.hourAgo', { n: hours })
  if (days < 7)   return t('dashboard.dayAgo', { n: days })
  return fmtDate(date)
}
</script>
