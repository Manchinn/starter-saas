<template>
  <AppLayout>
    <div class="space-y-5">

      <!-- Header -->
      <div class="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
        <div>
          <h1 class="page-title">{{ t('perms.title') }}</h1>
          <p class="page-subtitle">{{ t('perms.desc') }}</p>
        </div>
        <RouterLink v-can="'permissions.manage'" to="/admin/permissions/create" class="btn-primary">
          <PlusIcon class="w-4 h-4" />
          {{ t('perms.new') }}
        </RouterLink>
      </div>

      <!-- KPI strip -->
      <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatPill :label="t('perms.statTotal')"   :value="permissionsStore.permissions.length" :icon="KeyIcon"           tone="primary" />
        <StatPill :label="t('perms.statGroups')"  :value="groupNames.length"                   :icon="Squares2X2Icon"    tone="violet" />
        <StatPill :label="t('perms.statInUse')"   :value="inUseCount"                          :icon="CheckCircleIcon"   tone="emerald" />
        <StatPill :label="t('perms.statUnused')"  :value="unusedCount"                         :icon="ExclamationCircleIcon" tone="amber" />
      </div>

      <!-- Toolbar -->
      <div class="bg-white rounded-2xl border border-[#E2E8F0] shadow-card p-4 flex flex-wrap items-center gap-3">
        <div class="relative flex-1 min-w-48 max-w-72">
          <MagnifyingGlassIcon class="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#9BA7B0] pointer-events-none" />
          <input v-model="search" type="search" :placeholder="t('perms.searchPh')" class="input pl-9" />
        </div>

        <div class="flex items-center gap-1 flex-wrap">
          <button
            @click="activeGroup = ''"
            :class="chipClass('')"
          >{{ t('common.all') }} <span class="ml-1.5 text-[#9BA7B0] tabular">{{ permissionsStore.permissions.length }}</span></button>
          <button
            v-for="g in groupNames" :key="g"
            @click="activeGroup = g"
            :class="chipClass(g)"
          >{{ g }} <span class="ml-1.5 text-[#9BA7B0] tabular">{{ groupedAll[g]?.length || 0 }}</span></button>
        </div>

        <div class="ml-auto flex items-center gap-1 border border-[#E2E8F0] p-0.5">
          <button
            v-for="m in ['grouped', 'flat']" :key="m"
            @click="viewMode = m"
            :class="[
              'px-3 py-1 text-xs font-medium transition-colors',
              viewMode === m ? 'bg-primary-50 text-primary-700' : 'text-[#637381] hover:bg-[#F7F9FC]'
            ]"
          >{{ t(`perms.view.${m}`) }}</button>
        </div>
      </div>

      <!-- Loading -->
      <div v-if="permissionsStore.loading" class="text-center py-14">
        <div class="inline-block w-5 h-5 border-2 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
      </div>

      <!-- Empty -->
      <div v-else-if="!filtered.length"
           class="text-center py-16 bg-white border border-[#E2E8F0] rounded-2xl text-[#9BA7B0]">
        <KeyIcon class="w-10 h-10 mx-auto mb-3 opacity-30" />
        <p class="text-sm font-medium">{{ t('perms.noFound') }}</p>
      </div>

      <!-- Flat view -->
      <div v-else-if="viewMode === 'flat'" class="table-wrap">
        <table class="w-full text-sm">
          <thead class="bg-[#F7F9FC] border-b border-[#E2E8F0]">
            <tr class="text-left">
              <th class="th">{{ t('perms.colName') }}</th>
              <th class="th">{{ t('perms.colSlug') }}</th>
              <th class="th">{{ t('perms.groupLabel') }}</th>
              <th class="th">{{ t('perms.colDesc') }}</th>
              <th class="th text-right">{{ t('perms.colInRoles') }}</th>
              <th class="th w-24 text-right">{{ t('common.actions') }}</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-50">
            <tr v-for="p in filtered" :key="p.id" class="hover:bg-[#F7F9FC]/60 transition-colors">
              <td class="td font-semibold text-[#1C2434]">{{ p.name }}</td>
              <td class="td">
                <span class="font-mono text-xs text-[#637381] bg-[#F1F5F9] px-1.5 py-0.5 rounded">{{ p.slug }}</span>
              </td>
              <td class="td">
                <span class="text-xs text-[#637381]">{{ p.group }}</span>
              </td>
              <td class="td text-[#637381] text-xs max-w-md">
                <p class="line-clamp-1">{{ p.description || '—' }}</p>
              </td>
              <td class="td text-right">
                <span :class="(p.roleCount || 0) > 0 ? 'badge bg-emerald-50 text-emerald-700' : 'badge bg-[#F1F5F9] text-[#9BA7B0]'">
                  {{ p.roleCount || 0 }}
                </span>
              </td>
              <td class="td">
                <div class="flex items-center justify-end gap-0.5">
                  <RouterLink
                    v-can="'permissions.manage'"
                    :to="`/admin/permissions/${p.id}/edit`"
                    class="p-1.5 text-[#9BA7B0] hover:text-primary-500 hover:bg-primary-50 transition-colors"
                    :title="t('common.edit')"
                  >
                    <PencilIcon class="w-4 h-4" />
                  </RouterLink>
                  <button
                    v-can="'permissions.manage'"
                    @click="deletePerm(p)"
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
      </div>

      <!-- Grouped view -->
      <div v-else class="space-y-4">
        <div
          v-for="group in displayedGroups" :key="group"
          class="bg-white rounded-2xl border border-[#E2E8F0] shadow-card overflow-hidden"
        >
          <header class="px-5 py-3 border-b border-[#E2E8F0] flex items-center justify-between gap-3 bg-[#F7F9FC]">
            <div class="flex items-center gap-3 min-w-0">
              <div class="w-1 h-4 rounded-full bg-primary-500"></div>
              <h3 class="text-[13px] font-semibold text-[#1C2434] uppercase tracking-wide truncate">{{ group }}</h3>
              <span class="text-xs text-[#9BA7B0] tabular">· {{ t('perms.permCount', { n: filteredGrouped[group].length }) }}</span>
            </div>
          </header>
          <table class="w-full text-sm">
            <thead class="border-b border-[#E2E8F0]">
              <tr class="text-left">
                <th class="th">{{ t('perms.colName') }}</th>
                <th class="th">{{ t('perms.colSlug') }}</th>
                <th class="th">{{ t('perms.colDesc') }}</th>
                <th class="th text-right">{{ t('perms.colInRoles') }}</th>
                <th class="th w-24 text-right">{{ t('common.actions') }}</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-50">
              <tr v-for="p in filteredGrouped[group]" :key="p.id" class="hover:bg-[#F7F9FC]/60 transition-colors">
                <td class="td font-semibold text-[#1C2434]">{{ p.name }}</td>
                <td class="td">
                  <span class="font-mono text-xs text-[#637381] bg-[#F1F5F9] px-1.5 py-0.5 rounded">{{ p.slug }}</span>
                </td>
                <td class="td text-[#637381] text-xs max-w-md">
                  <p class="line-clamp-1">{{ p.description || '—' }}</p>
                </td>
                <td class="td text-right">
                  <span :class="(p.roleCount || 0) > 0 ? 'badge bg-emerald-50 text-emerald-700' : 'badge bg-[#F1F5F9] text-[#9BA7B0]'">
                    {{ p.roleCount || 0 }}
                  </span>
                </td>
                <td class="td">
                  <div class="flex items-center justify-end gap-0.5">
                    <RouterLink
                      v-can="'permissions.manage'"
                      :to="`/admin/permissions/${p.id}/edit`"
                      class="p-1.5 text-[#9BA7B0] hover:text-primary-500 hover:bg-primary-50 transition-colors"
                    >
                      <PencilIcon class="w-4 h-4" />
                    </RouterLink>
                    <button
                      v-can="'permissions.manage'"
                      @click="deletePerm(p)"
                      class="p-1.5 text-[#9BA7B0] hover:text-red-600 hover:bg-red-50 transition-colors"
                    >
                      <TrashIcon class="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

    </div>
  </AppLayout>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import AppLayout from '@/layouts/AppLayout.vue'
import StatPill from './StatPill.vue'
import {
  PlusIcon, PencilIcon, TrashIcon, MagnifyingGlassIcon,
  KeyIcon, Squares2X2Icon, CheckCircleIcon, ExclamationCircleIcon,
} from '@heroicons/vue/24/outline'
import { usePermissionsStore } from '@/stores/permissions'

const permissionsStore = usePermissionsStore()
const { t } = useI18n()

const search      = ref('')
const activeGroup = ref('')
const viewMode    = ref('grouped') // 'grouped' | 'flat'

const groupedAll = computed(() => {
  const out = {}
  for (const p of permissionsStore.permissions) {
    const g = p.group || 'general'
    if (!out[g]) out[g] = []
    out[g].push(p)
  }
  return out
})
const groupNames = computed(() => Object.keys(groupedAll.value).sort())

const inUseCount  = computed(() => permissionsStore.permissions.filter(p => (p.roleCount || 0) > 0).length)
const unusedCount = computed(() => permissionsStore.permissions.length - inUseCount.value)

const filtered = computed(() => {
  const q = search.value.trim().toLowerCase()
  return permissionsStore.permissions.filter((p) => {
    if (activeGroup.value && p.group !== activeGroup.value) return false
    if (!q) return true
    return p.name.toLowerCase().includes(q)
        || p.slug.toLowerCase().includes(q)
        || (p.description || '').toLowerCase().includes(q)
        || (p.group || '').toLowerCase().includes(q)
  })
})

const filteredGrouped = computed(() => {
  const out = {}
  for (const p of filtered.value) {
    const g = p.group || 'general'
    if (!out[g]) out[g] = []
    out[g].push(p)
  }
  return out
})
const displayedGroups = computed(() => Object.keys(filteredGrouped.value).sort())

function chipClass(group) {
  const active = activeGroup.value === group
  return [
    'px-3 py-1.5 text-xs font-medium border transition-colors',
    active
      ? 'border-primary-500 bg-primary-50 text-primary-700'
      : 'border-[#E2E8F0] text-[#637381] hover:bg-[#F7F9FC]',
  ]
}

onMounted(() => permissionsStore.fetchAll())

async function deletePerm(perm) {
  if (!confirm(t('perms.confirmDelete', { slug: perm.slug }))) return
  await permissionsStore.remove(perm.id)
}
</script>
