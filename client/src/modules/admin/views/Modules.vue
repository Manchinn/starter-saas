<template>
  <AppLayout>
    <div class="space-y-6">

      <!-- Header -->
      <div class="flex items-center justify-between">
        <div>
          <h1 class="page-title">{{ t('mods.coreTitle') }}</h1>
          <p class="page-subtitle">{{ t('mods.coreDesc') }}</p>
        </div>
      </div>

      <div v-if="modulesStore.loading" class="text-center py-12 text-[#9BA7B0]">
        <div class="inline-block w-5 h-5 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div
          v-for="mod in coreModules"
          :key="mod.id"
          class="card p-5 space-y-3 hover:shadow-card-md hover:-translate-y-px transition-all duration-200"
        >
          <div class="flex items-start justify-between gap-2">
            <div>
              <div class="flex items-center gap-2">
                <p class="font-semibold text-[#1C2434]">{{ mod.name }}</p>
                <span class="badge badge-amber">Core</span>
              </div>
              <p class="text-xs text-[#9BA7B0] font-mono mt-0.5">{{ mod.slug }}</p>
            </div>
            <span class="badge badge-green flex-shrink-0">
              <span class="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
              {{ t('common.active') }}
            </span>
          </div>

          <p class="text-sm text-[#637381] line-clamp-2">{{ mod.description || t('common.noDescription') }}</p>

          <div class="flex items-center justify-between pt-1 border-t border-[#E2E8F0]">
            <span class="text-xs text-[#9BA7B0]">{{ t('common.order') }}: {{ mod.order }}</span>
            <RouterLink :to="`/admin/modules/${mod.id}/edit`"
                    class="text-xs px-2.5 py-1 border border-[#E2E8F0] text-[#637381] hover:bg-[#F7F9FC] transition-colors">
              {{ t('common.edit') }}
            </RouterLink>
          </div>
        </div>

        <div v-if="!modulesStore.loading && !coreModules.length"
             class="col-span-3 text-center py-12 text-[#9BA7B0]">
          {{ t('mods.noFound') }}
        </div>
      </div>

    </div>
  </AppLayout>
</template>

<script setup>
import { computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import AppLayout from '@/layouts/AppLayout.vue'
import { useModulesStore } from '@/stores/modules'

const modulesStore = useModulesStore()
const { t } = useI18n()

const coreModules = computed(() =>
  modulesStore.modules.filter((m) => m.isCore).sort((a, b) => a.order - b.order)
)

onMounted(() => modulesStore.fetchAll())
</script>
