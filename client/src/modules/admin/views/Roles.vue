<template>
  <AppLayout>
    <div class="space-y-6">
      <div class="flex items-center justify-between">
        <h1 class="text-2xl font-bold text-gray-900">Roles</h1>
        <button @click="openCreate" class="px-4 py-2 bg-primary-600 text-white text-sm rounded-lg hover:bg-primary-700 transition">
          + New Role
        </button>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div
          v-for="role in rolesStore.roles"
          :key="role.id"
          class="bg-white border border-gray-200 rounded-xl p-5 space-y-4"
        >
          <!-- Header -->
          <div class="flex items-start justify-between gap-3">
            <div class="flex items-center gap-3">
              <span class="w-3 h-3 rounded-full flex-shrink-0" :style="{ backgroundColor: role.color }" />
              <div>
                <p class="font-semibold text-gray-900">{{ role.name }}</p>
                <p class="text-xs font-mono text-gray-400">{{ role.slug }}</p>
              </div>
            </div>
            <div class="flex items-center gap-2 flex-wrap justify-end">
              <span v-if="role.isSystem" class="px-2 py-0.5 bg-yellow-100 text-yellow-700 text-xs rounded-full">System</span>
              <button @click="openEdit(role)" class="text-xs px-3 py-1 border rounded hover:bg-gray-50">Edit</button>
              <RouterLink :to="`/admin/roles/${role.id}/permissions`" class="text-xs px-3 py-1 border border-primary-200 text-primary-600 rounded hover:bg-primary-50">Permissions</RouterLink>
              <button @click="openModules(role)" class="text-xs px-3 py-1 border border-indigo-200 text-indigo-600 rounded hover:bg-indigo-50">Modules</button>
              <button v-if="!role.isSystem" @click="deleteRole(role)" class="text-xs px-3 py-1 border border-red-200 text-red-500 rounded hover:bg-red-50">Delete</button>
            </div>
          </div>

          <p class="text-sm text-gray-500">{{ role.description || 'No description.' }}</p>

          <!-- Permission badges -->
          <div class="flex flex-wrap gap-1">
            <span
              v-for="perm in role.permissions"
              :key="perm.id"
              class="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded font-mono"
            >{{ perm.slug }}</span>
            <span v-if="!role.permissions?.length" class="text-xs text-gray-400 italic">No permissions assigned</span>
          </div>

          <!-- Module badges -->
          <div v-if="role.modules?.length" class="flex flex-wrap gap-1 pt-1 border-t border-gray-100">
            <span class="text-xs text-gray-400 mr-1">Modules:</span>
            <span
              v-for="mod in role.modules"
              :key="mod.id"
              class="px-2 py-0.5 bg-indigo-50 text-indigo-700 text-xs rounded font-medium"
            >{{ mod.name }}</span>
          </div>
        </div>
      </div>

      <!-- Create / Edit Role Modal -->
      <div v-if="roleModal" class="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
        <div class="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 space-y-4">
          <h2 class="text-lg font-semibold">{{ roleModal.id ? 'Edit Role' : 'New Role' }}</h2>
          <div>
            <label class="text-sm font-medium text-gray-700">Name *</label>
            <input v-model="roleModal.name" class="w-full mt-1 px-3 py-2 border rounded-lg text-sm" />
          </div>
          <div v-if="!roleModal.id">
            <label class="text-sm font-medium text-gray-700">Slug * <span class="text-gray-400 font-normal">(lowercase, hyphens)</span></label>
            <input v-model="roleModal.slug" class="w-full mt-1 px-3 py-2 border rounded-lg text-sm font-mono" placeholder="my-role" />
          </div>
          <div>
            <label class="text-sm font-medium text-gray-700">Description</label>
            <textarea v-model="roleModal.description" rows="2" class="w-full mt-1 px-3 py-2 border rounded-lg text-sm resize-none" />
          </div>
          <div>
            <label class="text-sm font-medium text-gray-700">Color</label>
            <div class="flex items-center gap-3 mt-1">
              <input type="color" v-model="roleModal.color" class="h-9 w-16 border rounded cursor-pointer" />
              <span class="text-sm font-mono text-gray-500">{{ roleModal.color }}</span>
            </div>
          </div>
          <div v-if="roleModalError" class="text-sm text-red-600">{{ roleModalError }}</div>
          <div class="flex justify-end gap-3">
            <button @click="roleModal = null" class="px-4 py-2 text-sm border rounded-lg hover:bg-gray-50">Cancel</button>
            <button @click="saveRole" class="px-4 py-2 text-sm bg-primary-600 text-white rounded-lg hover:bg-primary-700">Save</button>
          </div>
        </div>
      </div>

      <!-- Assign Modules Modal -->
      <div v-if="modulesModal" class="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
        <div class="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 space-y-4 max-h-[80vh] flex flex-col">
          <h2 class="text-lg font-semibold">Modules — {{ modulesModal.role.name }}</h2>
          <p class="text-sm text-gray-500">Users with this role will automatically have access to the selected modules.</p>
          <div class="flex-1 overflow-y-auto space-y-1">
            <label
              v-for="mod in modulesStore.modules"
              :key="mod.id"
              class="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-gray-50 cursor-pointer"
              :class="{ 'opacity-50': !mod.isActive }"
            >
              <input type="checkbox" :value="mod.id" v-model="modulesModal.selected" class="rounded" :disabled="!mod.isActive" />
              <div class="flex-1 min-w-0">
                <p class="text-sm font-medium text-gray-800">{{ mod.name }}</p>
                <p class="text-xs font-mono text-gray-400">{{ mod.slug }}</p>
              </div>
              <span v-if="!mod.isActive" class="text-xs text-gray-400 italic">inactive</span>
            </label>
            <div v-if="!modulesStore.modules.length" class="text-sm text-gray-400 text-center py-4">No modules available.</div>
          </div>
          <div v-if="modulesModalError" class="text-sm text-red-600">{{ modulesModalError }}</div>
          <div class="flex justify-end gap-3 pt-2 border-t">
            <button @click="modulesModal = null" class="px-4 py-2 text-sm border rounded-lg hover:bg-gray-50">Cancel</button>
            <button @click="saveModules" class="px-4 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">Save</button>
          </div>
        </div>
      </div>
    </div>
  </AppLayout>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import AppLayout from '@/layouts/AppLayout.vue'
import { useRolesStore } from '@/stores/roles'
import { useModulesStore } from '@/stores/modules'

const rolesStore = useRolesStore()
const modulesStore = useModulesStore()

const roleModal = ref(null)
const roleModalError = ref('')
const modulesModal = ref(null)
const modulesModalError = ref('')

onMounted(async () => {
  await Promise.all([rolesStore.fetchAll(), modulesStore.fetchAll()])
})

function openCreate() {
  roleModal.value = { name: '', slug: '', description: '', color: '#6366f1' }
  roleModalError.value = ''
}

function openEdit(role) {
  roleModal.value = { ...role }
  roleModalError.value = ''
}

async function saveRole() {
  roleModalError.value = ''
  try {
    if (roleModal.value.id) {
      await rolesStore.update(roleModal.value.id, roleModal.value)
    } else {
      await rolesStore.create(roleModal.value)
    }
    roleModal.value = null
  } catch (err) {
    roleModalError.value = err.response?.data?.message || 'Save failed'
  }
}

async function deleteRole(role) {
  if (!confirm(`Delete role "${role.name}"?`)) return
  await rolesStore.remove(role.id)
}

function openModules(role) {
  modulesModal.value = {
    role,
    selected: (role.modules || []).map((m) => m.id),
  }
  modulesModalError.value = ''
}

async function saveModules() {
  modulesModalError.value = ''
  try {
    await rolesStore.assignModules(modulesModal.value.role.id, modulesModal.value.selected)
    modulesModal.value = null
  } catch (err) {
    modulesModalError.value = err.response?.data?.message || 'Save failed'
  }
}
</script>
