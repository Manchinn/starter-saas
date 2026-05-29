<template>
  <AppLayout>
    <div class="space-y-5">

      <!-- Page header -->
      <div class="flex items-center justify-between gap-4">
        <div>
          <h1 class="text-xl font-semibold text-[#1C2434]">{{ t('erp.alerts.title') }}</h1>
          <p class="text-sm text-[#637381] mt-0.5">
            <template v-if="!loading">{{ total.toLocaleString() }}</template>
            <template v-else>{{ t('common.loading') }}</template>
          </p>
        </div>
        <AppButton v-can="'erp.alerts.manage'" to="/erp/alerts/create" variant="primary">
          <PlusIcon class="w-4 h-4" />
          {{ t('erp.alerts.new') }}
        </AppButton>
      </div>

      <!-- Table card -->
      <div class="bg-white border border-[#E2E8F0] shadow-sm overflow-hidden">

        <!-- Toolbar -->
        <div class="px-4 py-3 border-b border-[#E2E8F0] flex flex-wrap items-center gap-3">
          <div class="relative flex-1 min-w-[180px]">
            <MagnifyingGlassIcon class="w-4 h-4 text-[#9BA7B0] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              v-model="search" @input="onSearch"
              :placeholder="t('erp.alerts.searchPh')"
              class="w-full pl-9 pr-3 py-2 text-sm border border-[#E2E8F0] focus:border-primary-400 focus:outline-none"
            />
          </div>
          <div class="flex items-center gap-1.5">
            <button
              v-for="opt in scopeFilters" :key="opt.key"
              @click="setScope(opt.key)"
              :class="['px-3 py-1.5 text-[13px] font-medium border transition-colors',
                       scope === opt.key
                         ? 'bg-primary-50 border-primary-200 text-primary-600'
                         : 'bg-white border-[#E2E8F0] text-[#637381] hover:bg-slate-50']"
            >
              {{ t(opt.label) }}
            </button>
          </div>
        </div>

        <table class="w-full text-sm">
          <thead>
            <tr class="bg-[#F8FAFC] text-left text-[12px] font-semibold text-[#637381] uppercase tracking-wide">
              <th class="px-4 py-2.5">{{ t('erp.alerts.colTitle') }}</th>
              <th class="px-4 py-2.5">{{ t('erp.alerts.colScope') }}</th>
              <th class="px-4 py-2.5">{{ t('erp.alerts.colSeverity') }}</th>
              <th class="px-4 py-2.5">{{ t('erp.alerts.colSource') }}</th>
              <th class="px-4 py-2.5">{{ t('erp.alerts.colCreated') }}</th>
              <th class="px-4 py-2.5 w-20"></th>
            </tr>
          </thead>
          <tbody class="divide-y divide-[#F1F5F9]">
            <tr v-if="loading">
              <td colspan="6" class="px-4 py-10 text-center text-[#9BA7B0]">{{ t('common.loading') }}</td>
            </tr>
            <tr v-else-if="!alerts.length">
              <td colspan="6" class="px-4 py-10 text-center text-[#637381]">{{ t('erp.alerts.noFound') }}</td>
            </tr>
            <tr v-for="a in alerts" :key="a.id" class="hover:bg-[#F7F9FC] transition-colors">
              <td class="px-4 py-3">
                <p class="font-medium text-[#1C2434]">{{ a.title }}</p>
                <p v-if="a.body" class="text-xs text-[#9BA7B0] mt-0.5 line-clamp-1">{{ a.body }}</p>
              </td>
              <td class="px-4 py-3">
                <span class="inline-flex items-center px-2 py-0.5 bg-[#F1F5F9] text-[#637381] text-xs font-medium">
                  {{ scopeLabel(a) }}
                </span>
              </td>
              <td class="px-4 py-3">
                <span :class="['inline-flex items-center gap-1.5 px-2 py-0.5 text-xs font-semibold', SEVERITY[a.severity]?.chip || 'bg-slate-100 text-slate-600']">
                  <span class="w-1.5 h-1.5 rounded-full" :class="SEVERITY[a.severity]?.dot || 'bg-slate-400'" />
                  {{ t('erp.alerts.sev' + cap(a.severity)) }}
                </span>
              </td>
              <td class="px-4 py-3">
                <span class="text-xs text-[#637381]">{{ a.source === 'system' ? t('erp.alerts.srcSystem') : t('erp.alerts.srcManual') }}</span>
              </td>
              <td class="px-4 py-3 text-[#637381] text-xs">{{ fmtDateTime(a.createdAt) }}</td>
              <td class="px-4 py-3">
                <div class="flex items-center justify-end gap-1">
                  <RouterLink
                    v-can="'erp.alerts.manage'"
                    :to="`/erp/alerts/${a.id}/edit`"
                    class="p-1.5 text-[#9BA7B0] hover:text-primary-500 hover:bg-primary-50 transition-colors"
                    :title="t('common.edit')"
                  >
                    <PencilIcon class="w-4 h-4" />
                  </RouterLink>
                  <button
                    v-can="'erp.alerts.manage'"
                    @click="confirmDelete(a)"
                    class="p-1.5 text-[#9BA7B0] hover:text-red-600 hover:bg-red-50 transition-colors"
                    :title="t('common.delete')"
                  >
                    <TrashIcon class="w-4 h-4" />
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>

        <!-- Pagination -->
        <div v-if="totalPages > 1" class="px-4 py-3 border-t border-[#E2E8F0] flex items-center justify-between">
          <span class="text-xs text-[#637381]">{{ t('common.showing') }} {{ page }} / {{ totalPages }}</span>
          <div class="flex items-center gap-1.5">
            <button :disabled="page <= 1" @click="page--; fetch()"
              class="px-3 py-1.5 text-sm border border-[#E2E8F0] disabled:opacity-40 hover:bg-slate-50 transition-colors">‹</button>
            <button :disabled="page >= totalPages" @click="page++; fetch()"
              class="px-3 py-1.5 text-sm border border-[#E2E8F0] disabled:opacity-40 hover:bg-slate-50 transition-colors">›</button>
          </div>
        </div>
      </div>
    </div>
  </AppLayout>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { RouterLink } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { PlusIcon, PencilIcon, TrashIcon, MagnifyingGlassIcon } from '@heroicons/vue/24/outline'
import AppLayout from '@/layouts/AppLayout.vue'
import AppButton from '@/components/AppButton.vue'
import api from '@/api'
import { fmtDateTime } from '@/utils/fmt'

const { t } = useI18n()

const alerts  = ref([])
const total   = ref(0)
const page    = ref(1)
const limit   = 20
const search  = ref('')
const scope   = ref('')
const loading = ref(false)

const scopeFilters = [
  { key: '',           label: 'common.all' },
  { key: 'global',     label: 'erp.alerts.scopeGlobal' },
  { key: 'module',     label: 'erp.alerts.scopeModule' },
  { key: 'department', label: 'erp.alerts.scopeDepartment' },
]

const SEVERITY = {
  info:     { dot: 'bg-blue-500',  chip: 'bg-blue-50 text-blue-700' },
  success:  { dot: 'bg-green-500', chip: 'bg-green-50 text-green-700' },
  warning:  { dot: 'bg-amber-500', chip: 'bg-amber-50 text-amber-700' },
  critical: { dot: 'bg-red-500',   chip: 'bg-red-50 text-red-700' },
}

const totalPages = computed(() => Math.ceil(total.value / limit))
const cap = (s) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : '')

function scopeLabel(a) {
  if (a.scope === 'module') return a.moduleSlug || t('erp.alerts.scopeModule')
  if (a.scope === 'department') return a.departmentName || t('erp.alerts.scopeDepartment')
  return t('erp.alerts.scopeGlobal')
}

let searchTimer = null
function onSearch() {
  clearTimeout(searchTimer)
  searchTimer = setTimeout(() => { page.value = 1; fetch() }, 300)
}
function setScope(s) { scope.value = s; page.value = 1; fetch() }

async function fetch() {
  loading.value = true
  try {
    const { data } = await api.get('/erp/alerts', {
      params: { page: page.value, limit, search: search.value || undefined, scope: scope.value || undefined },
    })
    alerts.value = data.data.alerts
    total.value  = data.data.total
  } finally {
    loading.value = false
  }
}

async function confirmDelete(a) {
  if (!confirm(t('erp.alerts.confirmDelete'))) return
  try {
    await api.delete(`/erp/alerts/${a.id}`)
    fetch()
  } catch (err) {
    alert(err.response?.data?.message || 'Delete failed')
  }
}

onMounted(fetch)
</script>
