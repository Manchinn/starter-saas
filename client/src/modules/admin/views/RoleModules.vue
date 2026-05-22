<template>
  <AppLayout>
    <div class="space-y-6">

      <!-- Header -->
      <div class="flex items-center gap-3">
        <RouterLink to="/admin/roles" class="btn-secondary px-2.5 py-2">
          <ArrowLeftIcon class="w-4 h-4" />
        </RouterLink>
        <div>
          <h1 class="page-title">{{ t('roles.assignModules') }}</h1>
          <p v-if="role" class="text-sm text-[#637381] mt-0.5">
            {{ t('perms.roleLabel') }}
            <span class="font-semibold" :style="{ color: role.color }">{{ role.name }}</span>
          </p>
        </div>
      </div>

      <div v-if="loading" class="card p-12 text-center text-[#9BA7B0] text-sm animate-pulse">
        {{ t('common.loading') }}
      </div>

      <template v-else>
        <p class="text-sm text-[#637381]">{{ t('roles.assignModulesDesc') }}</p>

        <div class="table-wrap overflow-hidden">
          <div class="px-5 py-3 bg-[#F7F9FC] border-b border-[#E2E8F0] flex items-center justify-between">
            <p class="text-[11px] font-bold text-[#9BA7B0] uppercase tracking-widest">
              {{ t('nav.sections.modules') }}
            </p>
            <button @click="toggleAll"
                    class="text-xs font-medium text-primary-500 hover:text-primary-800 transition-colors">
              {{ allSelected ? t('perms.deselectAll') : t('perms.selectAll') }}
            </button>
          </div>

          <div class="divide-y divide-slate-50">
            <label
              v-for="mod in modulesStore.modules"
              :key="mod.id"
              class="flex items-center gap-3 px-5 py-3 hover:bg-[#F7F9FC] cursor-pointer"
              :class="{ 'opacity-40': !mod.isActive }"
            >
              <input type="checkbox" :value="mod.id" v-model="selected"
                     class="border-[#CBD5E1] w-4 h-4 accent-primary-500" :disabled="!mod.isActive" />
              <div class="flex-1 min-w-0">
                <span class="text-sm font-medium text-[#1C2434]">{{ mod.name }}</span>
                <span class="ml-2 text-xs font-mono text-[#9BA7B0] bg-[#F1F5F9] px-1.5 py-0.5 rounded">{{ mod.slug }}</span>
              </div>
              <span v-if="!mod.isActive" class="badge badge-gray">{{ t('roles.inactiveBadge') }}</span>
            </label>

            <div v-if="!modulesStore.modules.length" class="px-5 py-8 text-sm text-[#9BA7B0] text-center">
              {{ t('roles.noModules') }}
            </div>
          </div>
        </div>

        <div v-if="error"
             class="px-4 py-3 bg-red-50 border border-red-100 text-red-700 text-sm">
          {{ error }}
        </div>

        <div class="flex justify-end gap-3">
          <RouterLink to="/admin/roles" class="btn-secondary">{{ t('common.cancel') }}</RouterLink>
          <button @click="save" :disabled="saving" class="btn-primary">
            {{ saving ? t('common.saving') : t('roles.saveModules') }}
          </button>
        </div>
      </template>

    </div>
  </AppLayout>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import AppLayout from '@/layouts/AppLayout.vue'
import { ArrowLeftIcon } from '@heroicons/vue/24/outline'
import { useRolesStore } from '@/stores/roles'
import { useModulesStore } from '@/stores/modules'

const route = useRoute()
const router = useRouter()
const rolesStore = useRolesStore()
const modulesStore = useModulesStore()
const { t } = useI18n()

const role     = ref(null)
const selected = ref([])
const loading  = ref(true)
const saving   = ref(false)
const error    = ref('')

const activeModules = computed(() => modulesStore.modules.filter(m => m.isActive))
const allSelected   = computed(() =>
  activeModules.value.length > 0 &&
  activeModules.value.every(m => selected.value.includes(m.id))
)

function toggleAll() {
  const ids = activeModules.value.map(m => m.id)
  if (allSelected.value) {
    selected.value = selected.value.filter(id => !ids.includes(id))
  } else {
    const toAdd = ids.filter(id => !selected.value.includes(id))
    selected.value = [...selected.value, ...toAdd]
  }
}

onMounted(async () => {
  await Promise.all([rolesStore.fetchAll(), modulesStore.fetchAll()])
  role.value = rolesStore.roles.find(r => String(r.id) === route.params.id)
  selected.value = (role.value?.modules || []).map(m => m.id)
  loading.value = false
})

async function save() {
  error.value = ''
  saving.value = true
  try {
    await rolesStore.assignModules(route.params.id, selected.value)
    router.push('/admin/roles')
  } catch (err) {
    error.value = err.response?.data?.message || t('roles.saveFailed')
  } finally {
    saving.value = false
  }
}
</script>
