<template>
  <AppLayout>
    <div class="space-y-6">
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-2xl font-bold text-gray-900">Core Modules</h1>
          <p class="text-sm text-gray-500 mt-0.5">Built-in modules — cannot be disabled or deleted.</p>
        </div>
      </div>

      <div v-if="modulesStore.loading" class="text-center py-12 text-gray-400">Loading…</div>

      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div
          v-for="mod in coreModules"
          :key="mod.id"
          class="bg-white border border-gray-200 rounded-xl p-5 space-y-3"
        >
          <div class="flex items-start justify-between gap-2">
            <div>
              <div class="flex items-center gap-2">
                <p class="font-semibold text-gray-900">{{ mod.name }}</p>
                <span class="px-2 py-0.5 bg-yellow-100 text-yellow-700 text-xs rounded-full">Core</span>
              </div>
              <p class="text-xs text-gray-400 font-mono mt-0.5">{{ mod.slug }}</p>
            </div>
            <span class="px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded-full flex-shrink-0">Active</span>
          </div>

          <p class="text-sm text-gray-500 line-clamp-2">{{ mod.description || 'No description.' }}</p>

          <div class="flex items-center justify-between pt-1">
            <span class="text-xs text-gray-400">Order: {{ mod.order }}</span>
            <button
              @click="openEdit(mod)"
              class="text-xs px-3 py-1 border rounded hover:bg-gray-50 transition"
            >Edit</button>
          </div>
        </div>

        <div v-if="!modulesStore.loading && !coreModules.length"
          class="col-span-3 text-center py-12 text-gray-400">
          No core modules found.
        </div>
      </div>

      <!-- Edit Modal -->
      <div v-if="modal" class="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
        <div class="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 space-y-4">
          <h2 class="text-lg font-semibold">Edit Core Module</h2>
          <div>
            <label class="text-sm font-medium text-gray-700">Name</label>
            <input v-model="modal.name" class="w-full mt-1 px-3 py-2 border rounded-lg text-sm" />
          </div>
          <div>
            <label class="text-sm font-medium text-gray-700">Description</label>
            <textarea v-model="modal.description" rows="2" class="w-full mt-1 px-3 py-2 border rounded-lg text-sm resize-none" />
          </div>
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="text-sm font-medium text-gray-700">Icon</label>
              <input v-model="modal.icon" class="w-full mt-1 px-3 py-2 border rounded-lg text-sm" />
            </div>
            <div>
              <label class="text-sm font-medium text-gray-700">Order</label>
              <input v-model.number="modal.order" type="number" class="w-full mt-1 px-3 py-2 border rounded-lg text-sm" />
            </div>
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
import { ref, computed, onMounted } from 'vue'
import AppLayout from '@/layouts/AppLayout.vue'
import { useModulesStore } from '@/stores/modules'

const modulesStore = useModulesStore()
const modal = ref(null)
const modalError = ref('')

const coreModules = computed(() =>
  modulesStore.modules.filter((m) => m.isCore).sort((a, b) => a.order - b.order)
)

onMounted(() => modulesStore.fetchAll())

function openEdit(mod) {
  modal.value = { ...mod }
  modalError.value = ''
}

async function saveModal() {
  modalError.value = ''
  try {
    await modulesStore.update(modal.value.id, modal.value)
    modal.value = null
  } catch (err) {
    modalError.value = err.response?.data?.message || 'Save failed'
  }
}
</script>
