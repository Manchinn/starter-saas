<template>
  <AppLayout>
    <div class="space-y-6">
      <div class="flex items-center justify-between">
        <h1 class="text-2xl font-bold text-gray-900">Permissions</h1>
        <button @click="openCreate" class="px-4 py-2 bg-primary-600 text-white text-sm rounded-lg hover:bg-primary-700 transition">
          + New Permission
        </button>
      </div>

      <!-- Grouped by category -->
      <div v-for="(perms, group) in permissionsStore.grouped" :key="group" class="space-y-2">
        <h2 class="text-xs font-semibold text-gray-400 uppercase tracking-wider">{{ group }}</h2>
        <div class="bg-white border border-gray-200 rounded-xl overflow-hidden">
          <table class="w-full text-sm">
            <thead class="bg-gray-50 border-b border-gray-100">
              <tr>
                <th class="text-left px-5 py-3 font-medium text-gray-600">Name</th>
                <th class="text-left px-5 py-3 font-medium text-gray-600">Slug</th>
                <th class="text-left px-5 py-3 font-medium text-gray-600">Description</th>
                <th class="px-5 py-3"></th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-50">
              <tr v-for="perm in perms" :key="perm.id" class="hover:bg-gray-50 transition">
                <td class="px-5 py-3 font-medium text-gray-900">{{ perm.name }}</td>
                <td class="px-5 py-3 font-mono text-xs text-gray-500">{{ perm.slug }}</td>
                <td class="px-5 py-3 text-gray-500 text-xs">{{ perm.description || '—' }}</td>
                <td class="px-5 py-3 text-right space-x-2">
                  <button @click="openEdit(perm)" class="text-xs text-primary-600 hover:underline">Edit</button>
                  <button @click="deletePerm(perm)" class="text-xs text-red-500 hover:underline">Delete</button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <p v-if="!permissionsStore.permissions.length && !permissionsStore.loading" class="text-gray-400 text-sm">
        No permissions defined yet.
      </p>

      <!-- Create / Edit Modal -->
      <div v-if="modal" class="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
        <div class="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 space-y-4">
          <h2 class="text-lg font-semibold">{{ modal.id ? 'Edit Permission' : 'New Permission' }}</h2>
          <div>
            <label class="text-sm font-medium text-gray-700">Name *</label>
            <input v-model="modal.name" class="w-full mt-1 px-3 py-2 border rounded-lg text-sm" />
          </div>
          <div v-if="!modal.id">
            <label class="text-sm font-medium text-gray-700">Slug * <span class="text-gray-400 font-normal">(e.g. posts.create)</span></label>
            <input v-model="modal.slug" class="w-full mt-1 px-3 py-2 border rounded-lg text-sm font-mono" placeholder="resource.action" />
          </div>
          <div>
            <label class="text-sm font-medium text-gray-700">Group</label>
            <input v-model="modal.group" class="w-full mt-1 px-3 py-2 border rounded-lg text-sm" placeholder="general" />
          </div>
          <div>
            <label class="text-sm font-medium text-gray-700">Description</label>
            <input v-model="modal.description" class="w-full mt-1 px-3 py-2 border rounded-lg text-sm" />
          </div>
          <div v-if="modalError" class="text-sm text-red-600">{{ modalError }}</div>
          <div class="flex justify-end gap-3">
            <button @click="modal = null" class="px-4 py-2 text-sm border rounded-lg hover:bg-gray-50">Cancel</button>
            <button @click="saveModal" class="px-4 py-2 text-sm bg-primary-600 text-white rounded-lg hover:bg-primary-700">Save</button>
          </div>
        </div>
      </div>
    </div>
  </AppLayout>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import AppLayout from '@/layouts/AppLayout.vue'
import { usePermissionsStore } from '@/stores/permissions'

const permissionsStore = usePermissionsStore()
const modal = ref(null)
const modalError = ref('')

onMounted(() => permissionsStore.fetchAll())

function openCreate() {
  modal.value = { name: '', slug: '', group: 'general', description: '' }
  modalError.value = ''
}

function openEdit(perm) {
  modal.value = { ...perm }
  modalError.value = ''
}

async function saveModal() {
  modalError.value = ''
  try {
    if (modal.value.id) {
      await permissionsStore.update(modal.value.id, modal.value)
    } else {
      await permissionsStore.create(modal.value)
    }
    modal.value = null
  } catch (err) {
    modalError.value = err.response?.data?.message || 'Save failed'
  }
}

async function deletePerm(perm) {
  if (!confirm(`Delete permission "${perm.slug}"?`)) return
  await permissionsStore.remove(perm.id)
}
</script>
