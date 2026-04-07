<template>
  <AppLayout>
    <div class="space-y-6 max-w-2xl mx-auto">

      <!-- Header -->
      <div class="flex items-center gap-4">
        <RouterLink to="/admin/roles" class="text-gray-400 hover:text-gray-600 transition">
          ← Back
        </RouterLink>
        <div>
          <h1 class="text-2xl font-bold text-gray-900">Permissions</h1>
          <p v-if="role" class="text-sm text-gray-500 mt-0.5">
            Role: <span class="font-medium" :style="{ color: role.color }">{{ role.name }}</span>
          </p>
        </div>
      </div>

      <div v-if="loading" class="text-center py-12 text-gray-400">Loading…</div>

      <template v-else>
        <div class="bg-white rounded-xl border border-gray-200 divide-y divide-gray-100">
          <div v-for="(perms, group) in grouped" :key="group">
            <div class="px-5 py-3 bg-gray-50 flex items-center justify-between">
              <p class="text-xs font-semibold text-gray-400 uppercase tracking-wider">{{ group }}</p>
              <button @click="toggleGroup(group)" class="text-xs text-primary-600 hover:underline">
                {{ allGroupSelected(group) ? 'Deselect all' : 'Select all' }}
              </button>
            </div>
            <div class="divide-y divide-gray-50">
              <label
                v-for="perm in perms"
                :key="perm.id"
                class="flex items-center gap-3 px-5 py-3 hover:bg-gray-50 cursor-pointer"
              >
                <input type="checkbox" :value="perm.id" v-model="selected" class="rounded w-4 h-4" />
                <div>
                  <span class="text-sm font-medium text-gray-800">{{ perm.name }}</span>
                  <span class="ml-2 text-xs font-mono text-gray-400">{{ perm.slug }}</span>
                </div>
              </label>
            </div>
          </div>
        </div>

        <div v-if="error" class="bg-red-50 text-red-700 text-sm px-4 py-2 rounded-lg">{{ error }}</div>

        <!-- Actions -->
        <div class="flex justify-end gap-3">
          <RouterLink to="/admin/roles" class="px-4 py-2 text-sm border rounded-lg hover:bg-gray-50">Cancel</RouterLink>
          <button
            @click="save"
            :disabled="saving"
            class="px-5 py-2 text-sm bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50"
          >{{ saving ? 'Saving…' : 'Save Permissions' }}</button>
        </div>
      </template>

    </div>
  </AppLayout>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import AppLayout from '@/layouts/AppLayout.vue'
import api from '@/api'
import { usePermissionsStore } from '@/stores/permissions'
import { useRolesStore } from '@/stores/roles'

const route = useRoute()
const router = useRouter()
const permissionsStore = usePermissionsStore()
const rolesStore = useRolesStore()

const role     = ref(null)
const selected = ref([])
const loading  = ref(true)
const saving   = ref(false)
const error    = ref('')

const grouped = computed(() => permissionsStore.grouped)

onMounted(async () => {
  await Promise.all([permissionsStore.fetchAll(), rolesStore.fetchAll()])
  role.value = rolesStore.roles.find(r => r.id === route.params.id)
  if (!role.value) {
    const { data } = await api.get(`/roles/${route.params.id}`)
    role.value = data.data.role
  }
  selected.value = (role.value.permissions || []).map(p => p.id)
  loading.value = false
})

function allGroupSelected(group) {
  const ids = permissionsStore.grouped[group].map(p => p.id)
  return ids.every(id => selected.value.includes(id))
}

function toggleGroup(group) {
  const ids = permissionsStore.grouped[group].map(p => p.id)
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
    router.push('/admin/roles')
  } catch (err) {
    error.value = err.response?.data?.message || 'Save failed'
  } finally {
    saving.value = false
  }
}
</script>
