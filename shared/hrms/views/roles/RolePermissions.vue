<template>
  <AppLayout>
    <div class="space-y-6">

      <div class="flex items-center gap-3">
        <RouterLink to="/hrms/roles" class="btn-secondary px-2.5 py-2">
          <ArrowLeftIcon class="w-4 h-4" />
        </RouterLink>
        <div>
          <h1 class="page-title">{{ t('hrms.roles.managePerms') }}</h1>
          <p v-if="role" class="text-sm text-[#637381] mt-0.5">
            {{ t('hrms.perms.roleLabel') }}
            <span class="font-semibold" :style="{ color: role.color }">{{ role.name }}</span>
          </p>
        </div>
      </div>

      <div v-if="loading" class="card p-12 text-center text-[#9BA7B0] text-sm animate-pulse">
        {{ t('common.loading') }}
      </div>

      <template v-else>
        <div class="table-wrap overflow-hidden">
          <div v-for="(perms, group) in grouped" :key="group">
            <div class="px-5 py-3 bg-[#F7F9FC] border-b border-[#E2E8F0] flex items-center justify-between">
              <p class="text-[11px] font-bold text-[#9BA7B0] uppercase tracking-widest">{{ group }}</p>
              <button @click="toggleGroup(group)" class="text-xs font-medium text-primary-500 hover:text-primary-800 transition-colors">
                {{ allGroupSelected(group) ? t('hrms.perms.deselectAll') : t('hrms.perms.selectAll') }}
              </button>
            </div>
            <div class="divide-y divide-slate-50">
              <label v-for="perm in perms" :key="perm.id" class="flex items-center gap-3 px-5 py-3 hover:bg-[#F7F9FC] cursor-pointer">
                <input type="checkbox" :value="perm.id" v-model="selected" class="border-[#CBD5E1] w-4 h-4 accent-primary-500" />
                <div>
                  <span class="text-sm font-medium text-[#1C2434]">{{ perm.name }}</span>
                  <span class="ml-2 text-xs font-mono text-[#9BA7B0] bg-[#F1F5F9] px-1.5 py-0.5">{{ perm.slug }}</span>
                </div>
              </label>
            </div>
          </div>
        </div>

        <div v-if="error" class="px-4 py-3 bg-red-50 border border-red-100 text-red-700 text-sm">{{ error }}</div>

        <div class="flex justify-end gap-3">
          <RouterLink to="/hrms/roles" class="btn-secondary">{{ t('common.cancel') }}</RouterLink>
          <button @click="save" :disabled="saving" class="btn-primary">
            {{ saving ? t('common.saving') : t('hrms.perms.savePerms') }}
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
import api from '@/api'
import { useHrmsPermissionsStore } from '@/stores/hrmsPermissions'
import { useHrmsRolesStore } from '@/stores/hrmsRoles'

const route = useRoute()
const router = useRouter()
const permsStore = useHrmsPermissionsStore()
const rolesStore = useHrmsRolesStore()
const { t } = useI18n()

const role     = ref(null)
const selected = ref([])
const loading  = ref(true)
const saving   = ref(false)
const error    = ref('')

const grouped = computed(() => permsStore.grouped)

onMounted(async () => {
  await Promise.all([permsStore.fetchAll(), rolesStore.fetchAll()])
  role.value = rolesStore.roles.find(r => r.id === route.params.id)
  if (!role.value) {
    const { data } = await api.get(`/hrms/roles/${route.params.id}`)
    role.value = data.data.role
  }
  selected.value = (role.value.permissions || []).map(p => p.id)
  loading.value = false
})

function allGroupSelected(group) {
  const ids = permsStore.grouped[group].map(p => p.id)
  return ids.every(id => selected.value.includes(id))
}

function toggleGroup(group) {
  const ids = permsStore.grouped[group].map(p => p.id)
  if (allGroupSelected(group)) {
    selected.value = selected.value.filter(id => !ids.includes(id))
  } else {
    const toAdd = ids.filter(id => !selected.value.includes(id))
    selected.value = [...selected.value, ...toAdd]
  }
}

async function save() {
  error.value = ''
  saving.value = true
  try {
    await rolesStore.assignPermissions(route.params.id, selected.value)
    router.push('/hrms/roles')
  } catch (err) {
    error.value = err.response?.data?.message || t('hrms.perms.saveFailed')
  } finally {
    saving.value = false
  }
}
</script>
