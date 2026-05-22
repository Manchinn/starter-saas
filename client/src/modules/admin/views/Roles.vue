<template>
  <AppLayout>
    <div class="space-y-5">

      <!-- Header -->
      <div class="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
        <div>
          <h1 class="page-title">{{ t('roles.title') }}</h1>
          <p class="page-subtitle">{{ t('roles.desc') }}</p>
        </div>
        <RouterLink v-can="'roles.manage'" to="/admin/roles/create" class="btn-primary">
          <PlusIcon class="w-4 h-4" />
          {{ t('roles.new') }}
        </RouterLink>
      </div>

      <!-- KPI strip -->
      <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatPill :label="t('roles.statTotal')"   :value="rolesStore.roles.length" :icon="ShieldCheckIcon" tone="primary" />
        <StatPill :label="t('roles.statSystem')"  :value="systemCount"             :icon="LockClosedIcon"  tone="amber" />
        <StatPill :label="t('roles.statCustom')"  :value="customCount"             :icon="SparklesIcon"    tone="violet" />
        <StatPill :label="t('roles.statAssigned')" :value="totalAssignments"       :icon="UserGroupIcon"   tone="emerald" />
      </div>

      <!-- Table card -->
      <div class="table-wrap">

        <!-- Toolbar -->
        <div class="px-5 py-3 border-b border-[#E2E8F0] flex flex-wrap items-center gap-3">
          <div class="relative flex-1 min-w-48 max-w-72">
            <MagnifyingGlassIcon class="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#9BA7B0] pointer-events-none" />
            <input v-model="search" type="search" :placeholder="t('roles.searchPh')" class="input pl-9" />
          </div>
          <div class="flex items-center gap-1">
            <button
              v-for="f in filters" :key="f.id"
              @click="filter = f.id"
              :class="[
                'px-3 py-1.5 text-xs font-medium border transition-colors',
                filter === f.id
                  ? 'border-primary-500 bg-primary-50 text-primary-700'
                  : 'border-[#E2E8F0] text-[#637381] hover:bg-[#F7F9FC]'
              ]"
            >{{ t(f.labelKey) }}<span class="ml-1.5 text-[#9BA7B0] tabular">{{ f.count }}</span></button>
          </div>
        </div>

        <!-- Table -->
        <table class="w-full text-sm">
          <thead class="bg-[#F7F9FC] border-b border-[#E2E8F0]">
            <tr class="text-left">
              <th class="th">{{ t('roles.colRole') }}</th>
              <th class="th">{{ t('roles.colDescription') }}</th>
              <th class="th text-right">{{ t('roles.colPerms') }}</th>
              <th class="th text-right">{{ t('roles.colMods') }}</th>
              <th class="th text-right">{{ t('roles.colUsers') }}</th>
              <th class="th">{{ t('roles.colType') }}</th>
              <th class="th w-44 text-right">{{ t('common.actions') }}</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-50">
            <tr v-if="rolesStore.loading">
              <td colspan="7" class="text-center py-14">
                <div class="inline-block w-5 h-5 border-2 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
              </td>
            </tr>
            <tr v-else-if="!filtered.length">
              <td colspan="7" class="text-center py-14">
                <div class="flex flex-col items-center gap-2 text-[#9BA7B0]">
                  <ShieldCheckIcon class="w-8 h-8 opacity-40" />
                  <p class="text-sm">{{ t('roles.noFound') }}</p>
                </div>
              </td>
            </tr>
            <tr
              v-for="role in filtered" :key="role.id"
              class="hover:bg-[#F7F9FC]/60 transition-colors cursor-pointer"
              @click="viewRole = role"
            >
              <td class="td">
                <div class="flex items-center gap-3 min-w-0">
                  <span class="w-2.5 h-2.5 rounded-full flex-shrink-0" :style="{ backgroundColor: role.color }" />
                  <div class="min-w-0">
                    <p class="font-semibold text-[#1C2434] text-sm truncate">{{ role.name }}</p>
                    <p class="text-[11px] font-mono text-[#9BA7B0] truncate">{{ role.slug }}</p>
                  </div>
                </div>
              </td>
              <td class="td text-[#637381] text-xs max-w-md">
                <p class="line-clamp-1">{{ role.description || '—' }}</p>
              </td>
              <td class="td text-right tabular text-[#1C2434] font-medium">{{ role.permissionCount ?? role.permissions?.length ?? 0 }}</td>
              <td class="td text-right tabular text-[#1C2434] font-medium">{{ role.moduleCount ?? role.modules?.length ?? 0 }}</td>
              <td class="td text-right tabular text-[#1C2434] font-medium">{{ role.userCount ?? 0 }}</td>
              <td class="td">
                <span v-if="role.isSystem" class="badge badge-amber">
                  <LockClosedIcon class="w-3 h-3" />
                  {{ t('roles.systemBadge') }}
                </span>
                <span v-else class="badge bg-[#F1F5F9] text-[#637381]">{{ t('roles.customBadge') }}</span>
              </td>
              <td class="td" @click.stop>
                <div class="flex items-center justify-end gap-0.5">
                  <RouterLink
                    :to="`/admin/roles/${role.id}/permissions`"
                    class="p-1.5 text-[#9BA7B0] hover:text-primary-600 hover:bg-primary-50 rounded-md transition-colors"
                    :title="t('nav.permissions')"
                  >
                    <KeyIcon class="w-4 h-4" />
                  </RouterLink>
                  <RouterLink
                    :to="`/admin/roles/${role.id}/modules`"
                    class="p-1.5 text-[#9BA7B0] hover:text-violet-600 hover:bg-violet-50 rounded-md transition-colors"
                    :title="t('nav.sections.modules')"
                  >
                    <PuzzlePieceIcon class="w-4 h-4" />
                  </RouterLink>
                  <RouterLink
                    v-can="'roles.manage'"
                    :to="`/admin/roles/${role.id}/edit`"
                    class="p-1.5 text-[#9BA7B0] hover:text-[#374151] hover:bg-[#F1F5F9] rounded-md transition-colors"
                    :title="t('common.edit')"
                  >
                    <PencilIcon class="w-4 h-4" />
                  </RouterLink>
                  <button
                    v-if="!role.isSystem"
                    v-can="'roles.manage'"
                    @click="deleteRole(role)"
                    class="p-1.5 text-[#9BA7B0] hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
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

      <!-- ─ View slide-over ───────────────────────────────────────────── -->
      <Transition name="slide">
        <div v-if="viewRole" class="fixed inset-0 z-50 flex justify-end">
          <div class="absolute inset-0 bg-black/30" @click="viewRole = null" />
          <div class="relative w-full max-w-md bg-white shadow-xl flex flex-col h-full">
            <div class="flex items-center justify-between px-6 py-4 border-b border-[#E2E8F0]">
              <div class="flex items-center gap-2.5">
                <span class="w-2.5 h-2.5 rounded-full" :style="{ backgroundColor: viewRole.color }" />
                <h2 class="text-base font-semibold text-[#1C2434]">{{ viewRole.name }}</h2>
                <span v-if="viewRole.isSystem" class="badge badge-amber">{{ t('roles.systemBadge') }}</span>
              </div>
              <button @click="viewRole = null" class="text-[#9BA7B0] hover:text-[#637381] p-1 rounded-md">
                <XMarkIcon class="w-4 h-4" />
              </button>
            </div>

            <div class="flex-1 overflow-y-auto scrollbar-thin px-6 py-5 space-y-5">
              <div>
                <p class="text-[11px] font-semibold text-[#9BA7B0] uppercase tracking-wider mb-1">{{ t('roles.slugLabel') }}</p>
                <p class="font-mono text-sm text-[#374151]">{{ viewRole.slug }}</p>
              </div>
              <div>
                <p class="text-[11px] font-semibold text-[#9BA7B0] uppercase tracking-wider mb-1">{{ t('roles.colDescription') }}</p>
                <p class="text-sm text-[#374151]">{{ viewRole.description || t('common.noDescription') }}</p>
              </div>

              <div class="grid grid-cols-3 gap-3 pt-2">
                <div class="rounded-xl border border-[#E2E8F0] px-3 py-2.5 text-center">
                  <p class="text-lg font-bold text-[#1C2434] tabular leading-none">{{ viewRole.permissionCount ?? viewRole.permissions?.length ?? 0 }}</p>
                  <p class="text-[10.5px] text-[#637381] uppercase tracking-wider mt-1.5">{{ t('roles.colPerms') }}</p>
                </div>
                <div class="rounded-xl border border-[#E2E8F0] px-3 py-2.5 text-center">
                  <p class="text-lg font-bold text-[#1C2434] tabular leading-none">{{ viewRole.moduleCount ?? viewRole.modules?.length ?? 0 }}</p>
                  <p class="text-[10.5px] text-[#637381] uppercase tracking-wider mt-1.5">{{ t('roles.colMods') }}</p>
                </div>
                <div class="rounded-xl border border-[#E2E8F0] px-3 py-2.5 text-center">
                  <p class="text-lg font-bold text-[#1C2434] tabular leading-none">{{ viewRole.userCount ?? 0 }}</p>
                  <p class="text-[10.5px] text-[#637381] uppercase tracking-wider mt-1.5">{{ t('roles.colUsers') }}</p>
                </div>
              </div>

              <div>
                <p class="text-[11px] font-semibold text-[#9BA7B0] uppercase tracking-wider mb-2">{{ t('roles.permsAssigned') }}</p>
                <div v-if="viewRole.permissions?.length" class="flex flex-wrap gap-1">
                  <span
                    v-for="p in viewRole.permissions" :key="p.id"
                    class="px-1.5 py-0.5 bg-[#F1F5F9] text-[#637381] text-[11px] rounded font-mono"
                  >{{ p.slug }}</span>
                </div>
                <p v-else class="text-xs text-[#9BA7B0] italic">{{ t('roles.noPermsAssigned') }}</p>
              </div>

              <div>
                <p class="text-[11px] font-semibold text-[#9BA7B0] uppercase tracking-wider mb-2">{{ t('roles.modulesAssigned') }}</p>
                <div v-if="viewRole.modules?.length" class="flex flex-wrap gap-1">
                  <span
                    v-for="m in viewRole.modules" :key="m.id"
                    class="px-2 py-0.5 bg-primary-50 text-primary-600 text-[11px] rounded font-medium"
                  >{{ m.name }}</span>
                </div>
                <p v-else class="text-xs text-[#9BA7B0] italic">{{ t('roles.noModulesAssigned') }}</p>
              </div>
            </div>

            <div class="px-6 py-4 border-t border-[#E2E8F0] flex gap-2">
              <RouterLink
                :to="`/admin/roles/${viewRole.id}/permissions`"
                @click="viewRole = null"
                class="btn-secondary flex-1 justify-center"
              >{{ t('nav.permissions') }}</RouterLink>
              <RouterLink
                v-can="'roles.manage'"
                :to="`/admin/roles/${viewRole.id}/edit`"
                @click="viewRole = null"
                class="btn-primary flex-1 justify-center"
              >{{ t('common.edit') }}</RouterLink>
            </div>
          </div>
        </div>
      </Transition>

    </div>
  </AppLayout>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import AppLayout from '@/layouts/AppLayout.vue'
import StatPill from './StatPill.vue'
import {
  PlusIcon, PencilIcon, TrashIcon, MagnifyingGlassIcon, ShieldCheckIcon,
  LockClosedIcon, SparklesIcon, UserGroupIcon, KeyIcon, PuzzlePieceIcon, XMarkIcon,
} from '@heroicons/vue/24/outline'
import { useRolesStore } from '@/stores/roles'

const rolesStore = useRolesStore()
const { t } = useI18n()

const search   = ref('')
const filter   = ref('all')
const viewRole = ref(null)

const systemCount = computed(() => rolesStore.roles.filter(r => r.isSystem).length)
const customCount = computed(() => rolesStore.roles.length - systemCount.value)
const totalAssignments = computed(() => rolesStore.roles.reduce((sum, r) => sum + (r.userCount || 0), 0))

const filters = computed(() => [
  { id: 'all',    labelKey: 'common.all',           count: rolesStore.roles.length },
  { id: 'system', labelKey: 'roles.systemBadge',    count: systemCount.value },
  { id: 'custom', labelKey: 'roles.customBadge',    count: customCount.value },
])

const filtered = computed(() => {
  const q = search.value.trim().toLowerCase()
  return rolesStore.roles.filter((r) => {
    if (filter.value === 'system' && !r.isSystem) return false
    if (filter.value === 'custom' && r.isSystem)  return false
    if (!q) return true
    return r.name.toLowerCase().includes(q) || r.slug.toLowerCase().includes(q) || (r.description || '').toLowerCase().includes(q)
  })
})

onMounted(() => rolesStore.fetchAll())

async function deleteRole(role) {
  if (!confirm(t('roles.confirmDelete', { name: role.name }))) return
  await rolesStore.remove(role.id)
}
</script>

<style scoped>
.slide-enter-active,
.slide-leave-active { transition: transform 0.25s ease; }
.slide-enter-from,
.slide-leave-to { transform: translateX(100%); }
</style>
