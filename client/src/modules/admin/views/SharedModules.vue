<template>
  <AppLayout>
    <div class="space-y-6">
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-2xl font-bold text-gray-900">Shared Modules</h1>
          <p class="text-sm text-gray-500 mt-0.5">Extension modules — can be enabled, disabled, or removed.</p>
        </div>
        <button
          v-if="auth.isAdmin"
          @click="openCreate"
          class="px-4 py-2 bg-primary-600 text-white text-sm font-medium rounded-lg hover:bg-primary-700 transition"
        >
          + New Module
        </button>
      </div>

      <div v-if="modulesStore.loading" class="text-center py-12 text-gray-400">Loading…</div>

      <!-- Empty state -->
      <div
        v-else-if="!sharedModules.length"
        class="bg-white border-2 border-dashed border-gray-200 rounded-xl p-12 text-center"
      >
        <PuzzlePieceIcon class="w-10 h-10 text-gray-300 mx-auto mb-3" />
        <p class="font-medium text-gray-500">No shared modules yet</p>
        <p class="text-sm text-gray-400 mt-1">Add extension modules to extend your SaaS application.</p>
        <button
          v-if="auth.isAdmin"
          @click="openCreate"
          class="mt-4 px-4 py-2 bg-primary-600 text-white text-sm rounded-lg hover:bg-primary-700 transition"
        >
          + New Module
        </button>
      </div>

      <!-- Grid -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div
          v-for="mod in sharedModules"
          :key="mod.id"
          class="bg-white border border-gray-200 rounded-xl p-5 space-y-3 hover:shadow-sm transition"
        >
          <div class="flex items-start justify-between gap-2">
            <div>
              <p class="font-semibold text-gray-900">{{ mod.name }}</p>
              <p class="text-xs text-gray-400 font-mono mt-0.5">{{ mod.slug }}</p>
            </div>
            <span
              :class="mod.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'"
              class="px-2 py-0.5 text-xs rounded-full flex-shrink-0"
            >{{ mod.isActive ? 'Active' : 'Inactive' }}</span>
          </div>

          <p class="text-sm text-gray-500 line-clamp-2">{{ mod.description || 'No description.' }}</p>

          <div class="flex items-center justify-between pt-1">
            <span class="text-xs text-gray-400">Order: {{ mod.order }}</span>
            <div v-if="auth.isAdmin" class="flex gap-2">
              <button
                @click="toggleModule(mod)"
                class="text-xs px-3 py-1 border rounded hover:bg-gray-50 transition"
              >{{ mod.isActive ? 'Disable' : 'Enable' }}</button>
              <button
                @click="openEdit(mod)"
                class="text-xs px-3 py-1 border rounded hover:bg-gray-50 transition"
              >Edit</button>
              <button
                @click="deleteModule(mod)"
                class="text-xs px-3 py-1 border border-red-200 text-red-500 rounded hover:bg-red-50 transition"
              >Delete</button>
            </div>
          </div>
        </div>
      </div>

      <!-- Create / Edit Modal -->
      <div v-if="modal" class="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
        <div class="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 space-y-4">
          <h2 class="text-lg font-semibold">{{ modal.id ? 'Edit Module' : 'New Shared Module' }}</h2>

          <div>
            <label class="text-sm font-medium text-gray-700">Name *</label>
            <input v-model="modal.name" class="w-full mt-1 px-3 py-2 border rounded-lg text-sm" placeholder="My Module" />
          </div>

          <div v-if="!modal.id">
            <label class="text-sm font-medium text-gray-700">
              Slug * <span class="text-gray-400 font-normal">(lowercase, hyphens)</span>
            </label>
            <input
              v-model="modal.slug"
              class="w-full mt-1 px-3 py-2 border rounded-lg text-sm font-mono"
              placeholder="my-module"
            />
          </div>

          <div>
            <label class="text-sm font-medium text-gray-700">Description</label>
            <textarea
              v-model="modal.description"
              rows="2"
              class="w-full mt-1 px-3 py-2 border rounded-lg text-sm resize-none"
            />
          </div>

          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="text-sm font-medium text-gray-700">Icon</label>
              <input v-model="modal.icon" class="w-full mt-1 px-3 py-2 border rounded-lg text-sm" placeholder="cube" />
            </div>
            <div>
              <label class="text-sm font-medium text-gray-700">Order</label>
              <input v-model.number="modal.order" type="number" class="w-full mt-1 px-3 py-2 border rounded-lg text-sm" />
            </div>
          </div>

          <div v-if="modalError" class="text-sm text-red-600">{{ modalError }}</div>

          <div class="flex justify-end gap-3">
            <button @click="modal = null" class="px-4 py-2 text-sm border rounded-lg hover:bg-gray-50">Cancel</button>
            <button
              @click="saveModal"
              class="px-4 py-2 text-sm bg-primary-600 text-white rounded-lg hover:bg-primary-700"
            >{{ modal.id ? 'Save Changes' : 'Create Module' }}</button>
          </div>
        </div>
      </div>
    </div>
  </AppLayout>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import AppLayout from '@/layouts/AppLayout.vue'
import { PuzzlePieceIcon } from '@heroicons/vue/24/outline'
import { useModulesStore } from '@/stores/modules'
import { useAuthStore } from '@/stores/auth'

const modulesStore = useModulesStore()
const auth = useAuthStore()
const modal = ref(null)
const modalError = ref('')

const sharedModules = computed(() => {
  const all = modulesStore.modules.filter((m) => !m.isCore)
  // Admins see every shared module; regular users see only their assigned ones
  if (auth.isAdmin) return all.sort((a, b) => a.order - b.order)
  const assigned = new Set(modulesStore.userModules.map((m) => m.id))
  return all.filter((m) => assigned.has(m.id)).sort((a, b) => a.order - b.order)
})

onMounted(async () => {
  await modulesStore.fetchAll()
  if (!auth.isAdmin) await modulesStore.fetchMyModules()
})

function openCreate() {
  modal.value = { name: '', slug: '', description: '', icon: 'cube', order: 100 }
  modalError.value = ''
}

function openEdit(mod) {
  modal.value = { ...mod }
  modalError.value = ''
}

async function saveModal() {
  modalError.value = ''
  try {
    if (modal.value.id) {
      await modulesStore.update(modal.value.id, modal.value)
    } else {
      await modulesStore.create(modal.value)
    }
    modal.value = null
  } catch (err) {
    modalError.value = err.response?.data?.message || 'Save failed'
  }
}

async function toggleModule(mod) {
  try {
    await modulesStore.toggle(mod.id)
  } catch (err) {
    alert(err.response?.data?.message || 'Failed to toggle module')
  }
}

async function deleteModule(mod) {
  if (!confirm(`Delete module "${mod.name}"?`)) return
  try {
    await modulesStore.remove(mod.id)
  } catch (err) {
    alert(err.response?.data?.message || 'Failed to delete module')
  }
}
</script>
