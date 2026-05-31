<template>
  <AppLayout>
    <div class="space-y-5">

      <!-- Header -->
      <div class="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
        <div>
          <h1 class="page-title">{{ t('hrms.roles.title') }}</h1>
          <p class="page-subtitle">{{ t('hrms.roles.desc') }}</p>
        </div>
        <RouterLink v-can="'hrms.roles.manage'" to="/hrms/roles/create" class="btn-primary">
          <PlusIcon class="w-4 h-4" />
          {{ t('hrms.roles.new') }}
        </RouterLink>
      </div>

      <!-- KPI strip -->
      <div class="grid grid-cols-2 lg:grid-cols-3 gap-4">
        <StatPill :label="t('hrms.roles.statTotal')"    :value="store.roles.length" :icon="ShieldCheckIcon" tone="primary" />
        <StatPill :label="t('hrms.roles.statCustom')"   :value="customCount"        :icon="SparklesIcon"    tone="violet" />
        <StatPill :label="t('hrms.roles.statAssigned')" :value="totalAssignments"   :icon="UserGroupIcon"   tone="emerald" />
      </div>

      <!-- Table card -->
      <div class="table-wrap">
        <div class="px-5 py-3 border-b border-[#E2E8F0] flex flex-wrap items-center gap-3">
          <div class="relative flex-1 min-w-48 max-w-72">
            <MagnifyingGlassIcon class="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#9BA7B0] pointer-events-none" />
            <input v-model="search" type="search" :placeholder="t('hrms.roles.searchPh')" class="input pl-9" />
          </div>
        </div>

        <table class="w-full text-sm">
          <thead class="bg-[#F7F9FC] border-b border-[#E2E8F0]">
            <tr class="text-left">
              <th class="th">{{ t('hrms.roles.colRole') }}</th>
              <th class="th">{{ t('hrms.roles.colDescription') }}</th>
              <th class="th text-right">{{ t('hrms.roles.colPerms') }}</th>
              <th class="th text-right">{{ t('hrms.roles.colEmployees') }}</th>
              <th class="th w-36 text-right">{{ t('common.actions') }}</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-50">
            <tr v-if="store.loading">
              <td colspan="5" class="text-center py-14">
                <div class="inline-block w-5 h-5 border-2 border-primary-500 border-t-transparent animate-spin"></div>
              </td>
            </tr>
            <tr v-else-if="!filtered.length">
              <td colspan="5" class="text-center py-14">
                <div class="flex flex-col items-center gap-2 text-[#9BA7B0]">
                  <ShieldCheckIcon class="w-8 h-8 opacity-40" />
                  <p class="text-sm">{{ t('hrms.roles.noFound') }}</p>
                </div>
              </td>
            </tr>
            <tr v-for="role in filtered" :key="role.id" class="hover:bg-[#F7F9FC]/60 transition-colors">
              <td class="td">
                <div class="flex items-center gap-3 min-w-0">
                  <span class="w-2.5 h-2.5 flex-shrink-0" :style="{ backgroundColor: role.color }" />
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
              <td class="td text-right tabular text-[#1C2434] font-medium">{{ role.employeeCount ?? 0 }}</td>
              <td class="td">
                <div class="flex items-center justify-end gap-0.5">
                  <RouterLink
                    :to="`/hrms/roles/${role.id}/permissions`"
                    class="p-1.5 text-[#9BA7B0] hover:text-primary-600 hover:bg-primary-50 transition-colors"
                    :title="t('hrms.roles.managePerms')"
                  >
                    <KeyIcon class="w-4 h-4" />
                  </RouterLink>
                  <RouterLink
                    v-can="'hrms.roles.manage'"
                    :to="`/hrms/roles/${role.id}/edit`"
                    class="p-1.5 text-[#9BA7B0] hover:text-[#374151] hover:bg-[#F1F5F9] transition-colors"
                    :title="t('common.edit')"
                  >
                    <PencilIcon class="w-4 h-4" />
                  </RouterLink>
                  <button
                    v-if="!role.isSystem"
                    v-can="'hrms.roles.manage'"
                    @click="deleteRole(role)"
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

    </div>
  </AppLayout>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import AppLayout from '@/layouts/AppLayout.vue'
import StatPill from '@/modules/admin/views/StatPill.vue'
import {
  PlusIcon, PencilIcon, TrashIcon, MagnifyingGlassIcon, ShieldCheckIcon,
  SparklesIcon, UserGroupIcon, KeyIcon,
} from '@heroicons/vue/24/outline'
import { useHrmsRolesStore } from '@/stores/hrmsRoles'

const store = useHrmsRolesStore()
const { t } = useI18n()

const search = ref('')

const customCount = computed(() => store.roles.filter(r => !r.isSystem).length)
const totalAssignments = computed(() => store.roles.reduce((sum, r) => sum + (r.employeeCount || 0), 0))

const filtered = computed(() => {
  const q = search.value.trim().toLowerCase()
  return store.roles.filter((r) => {
    if (!q) return true
    return r.name.toLowerCase().includes(q) || r.slug.toLowerCase().includes(q) || (r.description || '').toLowerCase().includes(q)
  })
})

onMounted(() => store.fetchAll())

async function deleteRole(role) {
  if (!confirm(t('hrms.roles.confirmDelete', { name: role.name }))) return
  await store.remove(role.id)
}
</script>
