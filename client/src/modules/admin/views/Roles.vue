<template>
  <AppLayout>
    <div class="space-y-5">

      <!-- Header -->
      <div class="flex items-center justify-between">
        <div>
          <h1 class="page-title">{{ t('roles.title') }}</h1>
          <p class="page-subtitle">{{ t('roles.desc') }}</p>
        </div>
        <RouterLink to="/admin/roles/create" class="btn-primary">
          <PlusIcon class="w-4 h-4" />
          {{ t('roles.new') }}
        </RouterLink>
      </div>

      <!-- Roles grid -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div
          v-for="role in rolesStore.roles"
          :key="role.id"
          class="card p-5 space-y-3.5 hover:shadow-card-md transition-all duration-200"
        >
          <!-- Card header -->
          <div class="flex items-start justify-between gap-3">
            <div class="flex items-center gap-2.5">
              <span class="w-2.5 h-2.5 rounded-full flex-shrink-0 mt-0.5" :style="{ backgroundColor: role.color }" />
              <div>
                <p class="font-semibold text-[#1C2434] text-sm">{{ role.name }}</p>
                <p class="text-xs font-mono text-[#9BA7B0]">{{ role.slug }}</p>
              </div>
            </div>
            <div class="flex items-center gap-1 flex-wrap justify-end">
              <span v-if="role.isSystem" class="badge badge-amber">{{ t('roles.systemBadge') }}</span>
              <RouterLink :to="`/admin/roles/${role.id}/edit`"
                      class="text-xs px-2.5 py-1 border border-[#E2E8F0] rounded-lg text-[#637381] hover:bg-[#F7F9FC] transition-colors">
                {{ t('common.edit') }}
              </RouterLink>
              <RouterLink :to="`/admin/roles/${role.id}/permissions`"
                          class="text-xs px-2.5 py-1 border border-primary-200 text-primary-500 rounded-lg hover:bg-primary-50 transition-colors">
                {{ t('nav.permissions') }}
              </RouterLink>
              <RouterLink :to="`/admin/roles/${role.id}/modules`"
                      class="text-xs px-2.5 py-1 border border-violet-200 text-violet-600 rounded-lg hover:bg-violet-50 transition-colors">
                {{ t('nav.sections.modules') }}
              </RouterLink>
              <button v-if="!role.isSystem" @click="deleteRole(role)"
                      class="text-xs px-2.5 py-1 border border-red-200 text-red-500 rounded-lg hover:bg-red-50 transition-colors">
                {{ t('common.delete') }}
              </button>
            </div>
          </div>

          <p class="text-sm text-[#637381]">{{ role.description || t('common.noDescription') }}</p>

          <!-- Permission badges -->
          <div class="flex flex-wrap gap-1">
            <span
              v-for="perm in role.permissions"
              :key="perm.id"
              class="px-1.5 py-0.5 bg-[#F1F5F9] text-[#637381] text-xs rounded font-mono"
            >{{ perm.slug }}</span>
            <span v-if="!role.permissions?.length" class="text-xs text-[#9BA7B0] italic">{{ t('roles.noPermsAssigned') }}</span>
          </div>

          <!-- Module badges -->
          <div v-if="role.modules?.length" class="flex flex-wrap gap-1 pt-1 border-t border-[#E2E8F0]">
            <span class="text-xs text-[#9BA7B0] mr-1">{{ t('roles.modulesLabel') }}</span>
            <span
              v-for="mod in role.modules"
              :key="mod.id"
              class="px-2 py-0.5 bg-primary-50 text-primary-500 text-xs rounded font-medium"
            >{{ mod.name }}</span>
          </div>
        </div>
      </div>

    </div>
  </AppLayout>
</template>

<script setup>
import { onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import AppLayout from '@/layouts/AppLayout.vue'
import { PlusIcon } from '@heroicons/vue/24/outline'
import { useRolesStore } from '@/stores/roles'

const rolesStore = useRolesStore()
const { t } = useI18n()

onMounted(() => rolesStore.fetchAll())

async function deleteRole(role) {
  if (!confirm(t('roles.confirmDelete', { name: role.name }))) return
  await rolesStore.remove(role.id)
}
</script>
