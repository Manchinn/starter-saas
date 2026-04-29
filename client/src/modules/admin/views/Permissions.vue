<template>
  <AppLayout>
    <div class="space-y-6">

      <!-- Header -->
      <div class="flex items-center justify-between">
        <div>
          <h1 class="page-title">{{ t('perms.title') }}</h1>
        </div>
        <RouterLink to="/admin/permissions/create" class="btn-primary">
          <PlusIcon class="w-4 h-4" />
          {{ t('perms.new') }}
        </RouterLink>
      </div>

      <!-- Grouped by category -->
      <div v-for="(perms, group) in permissionsStore.grouped" :key="group" class="space-y-2">
        <p class="section-label pl-1">{{ group }}</p>
        <div class="table-wrap">
          <table class="w-full text-sm">
            <thead>
              <tr>
                <th class="th">{{ t('perms.colName') }}</th>
                <th class="th">{{ t('perms.colSlug') }}</th>
                <th class="th">{{ t('perms.colDesc') }}</th>
                <th class="th w-20"></th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-50">
              <tr v-for="perm in perms" :key="perm.id" class="hover:bg-[#F7F9FC]/60 transition-colors">
                <td class="td font-semibold text-[#1C2434]">{{ perm.name }}</td>
                <td class="td">
                  <span class="font-mono text-xs text-[#637381] bg-[#F1F5F9] px-1.5 py-0.5 rounded">{{ perm.slug }}</span>
                </td>
                <td class="td text-[#637381] text-xs">{{ perm.description || '—' }}</td>
                <td class="td">
                  <div class="flex items-center justify-end gap-0.5">
                    <RouterLink :to="`/admin/permissions/${perm.id}/edit`"
                            class="p-1.5 text-[#9BA7B0] hover:text-primary-500 hover:bg-primary-50 rounded-md transition-colors">
                      <PencilIcon class="w-4 h-4" />
                    </RouterLink>
                    <button @click="deletePerm(perm)"
                            class="p-1.5 text-[#9BA7B0] hover:text-red-600 hover:bg-red-50 rounded-md transition-colors">
                      <TrashIcon class="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div v-if="!permissionsStore.permissions.length && !permissionsStore.loading"
           class="text-center py-16 text-[#9BA7B0]">
        <ShieldCheckIcon class="w-10 h-10 mx-auto mb-3 opacity-30" />
        <p class="text-sm font-medium">{{ t('perms.noFound') }}</p>
      </div>

    </div>
  </AppLayout>
</template>

<script setup>
import { onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import AppLayout from '@/layouts/AppLayout.vue'
import { PlusIcon, PencilIcon, TrashIcon, ShieldCheckIcon } from '@heroicons/vue/24/outline'
import { usePermissionsStore } from '@/stores/permissions'

const permissionsStore = usePermissionsStore()
const { t } = useI18n()

onMounted(() => permissionsStore.fetchAll())

async function deletePerm(perm) {
  if (!confirm(t('perms.confirmDelete', { slug: perm.slug }))) return
  await permissionsStore.remove(perm.id)
}
</script>
