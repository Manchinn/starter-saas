<template>
  <AppLayout>
    <div class="space-y-5">

      <!-- Header -->
      <div class="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
        <div>
          <h1 class="page-title">{{ t('hrms.perms.title') }}</h1>
          <p class="page-subtitle">{{ t('hrms.perms.desc') }}</p>
        </div>
      </div>

      <!-- KPI strip -->
      <div class="grid grid-cols-2 lg:grid-cols-3 gap-4">
        <StatPill :label="t('hrms.perms.statTotal')"  :value="store.permissions.length" :icon="KeyIcon"          tone="primary" />
        <StatPill :label="t('hrms.perms.statInUse')"  :value="inUseCount"               :icon="ShieldCheckIcon"  tone="emerald" />
        <StatPill :label="t('hrms.perms.statUnused')" :value="unusedCount"              :icon="MinusCircleIcon"  tone="amber" />
      </div>

      <!-- Toolbar -->
      <div class="table-wrap">
        <div class="px-5 py-3 border-b border-[#E2E8F0]">
          <div class="relative flex-1 min-w-48 max-w-72">
            <MagnifyingGlassIcon class="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#9BA7B0] pointer-events-none" />
            <input v-model="search" type="search" :placeholder="t('hrms.perms.searchPh')" class="input pl-9" />
          </div>
        </div>

        <div v-if="store.loading" class="text-center py-14">
          <div class="inline-block w-5 h-5 border-2 border-primary-500 border-t-transparent animate-spin"></div>
        </div>

        <div v-else-if="!Object.keys(filteredGroups).length" class="text-center py-14">
          <div class="flex flex-col items-center gap-2 text-[#9BA7B0]">
            <KeyIcon class="w-8 h-8 opacity-40" />
            <p class="text-sm">{{ t('hrms.perms.noFound') }}</p>
          </div>
        </div>

        <template v-else>
          <div v-for="(perms, group) in filteredGroups" :key="group">
            <div class="px-5 py-3 bg-[#F7F9FC] border-b border-[#E2E8F0] flex items-center justify-between">
              <p class="text-[11px] font-bold text-[#9BA7B0] uppercase tracking-widest">{{ group }}</p>
              <span class="text-[11px] text-[#9BA7B0] tabular">{{ perms.length }}</span>
            </div>
            <div class="divide-y divide-slate-50">
              <div v-for="perm in perms" :key="perm.id" class="flex items-center gap-3 px-5 py-3">
                <div class="flex-1 min-w-0">
                  <span class="text-sm font-medium text-[#1C2434]">{{ perm.name }}</span>
                  <span class="ml-2 text-xs font-mono text-[#9BA7B0] bg-[#F1F5F9] px-1.5 py-0.5">{{ perm.slug }}</span>
                </div>
                <span class="badge badge-gray uppercase text-[10px]">{{ perm.module }}</span>
                <span class="text-xs text-[#637381] tabular w-20 text-right">
                  {{ perm.roleCount || 0 }} {{ t('hrms.perms.colRoles').toLowerCase() }}
                </span>
              </div>
            </div>
          </div>
        </template>
      </div>

    </div>
  </AppLayout>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import AppLayout from '@/layouts/AppLayout.vue'
import StatPill from '@/modules/admin/views/StatPill.vue'
import { KeyIcon, ShieldCheckIcon, MinusCircleIcon, MagnifyingGlassIcon } from '@heroicons/vue/24/outline'
import { useHrmsPermissionsStore } from '@/stores/hrmsPermissions'

const store = useHrmsPermissionsStore()
const { t } = useI18n()

const search = ref('')

const inUseCount  = computed(() => store.permissions.filter(p => (p.roleCount || 0) > 0).length)
const unusedCount = computed(() => store.permissions.length - inUseCount.value)

const filteredGroups = computed(() => {
  const q = search.value.trim().toLowerCase()
  const out = {}
  for (const [group, perms] of Object.entries(store.grouped)) {
    const matched = q
      ? perms.filter(p => p.name.toLowerCase().includes(q) || p.slug.toLowerCase().includes(q) || group.toLowerCase().includes(q))
      : perms
    if (matched.length) out[group] = matched
  }
  return out
})

onMounted(() => store.fetchAll())
</script>
