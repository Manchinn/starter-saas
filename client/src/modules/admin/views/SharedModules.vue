<template>
  <AppLayout>
    <div class="space-y-6">

      <!-- Header -->
      <div class="flex items-center justify-between">
        <div>
          <h1 class="page-title">{{ t('mods.sharedTitle') }}</h1>
          <p class="page-subtitle">{{ t('mods.sharedDesc') }}</p>
        </div>
        <RouterLink v-if="auth.isAdmin" to="/admin/shared-modules/create" class="btn-primary">
          <PlusIcon class="w-4 h-4" />
          {{ t('mods.newShared') }}
        </RouterLink>
      </div>

      <div v-if="modulesStore.loading" class="text-center py-12 text-[#9BA7B0]">
        <div class="inline-block w-5 h-5 border-2 border-primary-500 border-t-transparent animate-spin" />
      </div>

      <!-- Empty state -->
      <div
        v-else-if="!sharedModules.length"
        class="bg-white border-2 border-dashed border-[#E2E8F0] p-12 text-center"
      >
        <div class="w-12 h-12 bg-[#F1F5F9] flex items-center justify-center mx-auto mb-4">
          <PuzzlePieceIcon class="w-6 h-6 text-[#9BA7B0]" />
        </div>
        <p class="font-semibold text-[#637381]">{{ t('mods.noShared') }}</p>
        <p class="text-sm text-[#9BA7B0] mt-1">{{ t('mods.noSharedDesc') }}</p>
        <RouterLink v-if="auth.isAdmin" to="/admin/shared-modules/create" class="btn-primary mt-5">
          <PlusIcon class="w-4 h-4" />
          {{ t('mods.newShared') }}
        </RouterLink>
      </div>

      <!-- Grid -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div
          v-for="mod in sharedModules"
          :key="mod.id"
          class="card p-5 space-y-3 hover:shadow-card-md hover:-translate-y-px transition-all duration-200"
        >
          <div class="flex items-start justify-between gap-2">
            <div>
              <p class="font-semibold text-[#1C2434]">{{ mod.name }}</p>
              <p class="text-xs text-[#9BA7B0] font-mono mt-0.5">{{ mod.slug }}</p>
            </div>
            <span :class="mod.isActive ? 'badge-green' : 'badge-gray'" class="badge flex-shrink-0">
              <span class="w-1.5 h-1.5"
                    :class="mod.isActive ? 'bg-emerald-500' : 'bg-slate-400'"></span>
              {{ mod.isActive ? t('common.active') : t('common.inactive') }}
            </span>
          </div>

          <p class="text-sm text-[#637381] line-clamp-2">{{ mod.description || t('common.noDescription') }}</p>

          <div class="flex items-center justify-between pt-1 border-t border-[#E2E8F0]">
            <span class="text-xs text-[#9BA7B0]">{{ t('common.order') }}: {{ mod.order }}</span>
            <div v-if="auth.isAdmin" class="flex items-center gap-1">
              <button
                @click="toggleModule(mod)"
                class="text-xs px-2.5 py-1 border border-[#E2E8F0] text-[#637381] hover:bg-[#F7F9FC] transition-colors"
              >{{ mod.isActive ? t('common.disable') : t('common.enable') }}</button>
              <RouterLink
                :to="`/admin/shared-modules/${mod.id}/edit`"
                class="text-xs px-2.5 py-1 border border-[#E2E8F0] text-[#637381] hover:bg-[#F7F9FC] transition-colors"
              >{{ t('common.edit') }}</RouterLink>
              <button
                @click="deleteModule(mod)"
                class="text-xs px-2.5 py-1 border border-red-200 text-red-500 hover:bg-red-50 transition-colors"
              >{{ t('common.delete') }}</button>
            </div>
          </div>
        </div>
      </div>

    </div>
  </AppLayout>
</template>

<script setup>
import { computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import AppLayout from '@/layouts/AppLayout.vue'
import { PlusIcon, PuzzlePieceIcon } from '@heroicons/vue/24/outline'
import { useModulesStore } from '@/stores/modules'
import { useAuthStore } from '@/stores/auth'

const modulesStore = useModulesStore()
const auth = useAuthStore()
const { t } = useI18n()

const sharedModules = computed(() => {
  const all = modulesStore.modules.filter((m) => !m.isCore)
  if (auth.isAdmin) return all.sort((a, b) => a.order - b.order)
  const assigned = new Set(modulesStore.userModules.map((m) => m.id))
  return all.filter((m) => assigned.has(m.id)).sort((a, b) => a.order - b.order)
})

onMounted(async () => {
  await modulesStore.fetchAll()
  if (!auth.isAdmin) await modulesStore.fetchMyModules()
})

async function toggleModule(mod) {
  try {
    await modulesStore.toggle(mod.id)
  } catch (err) {
    alert(err.response?.data?.message || t('mods.toggleFailed'))
  }
}

async function deleteModule(mod) {
  if (!confirm(t('mods.confirmDelete', { name: mod.name }))) return
  try {
    await modulesStore.remove(mod.id)
  } catch (err) {
    alert(err.response?.data?.message || t('mods.deleteFailed'))
  }
}
</script>
