<template>
  <AppLayout>
    <div class="space-y-6">

      <div class="flex items-center justify-between gap-4">
        <h1 class="text-2xl font-bold text-gray-900">Product Categories</h1>
        <RouterLink to="/erp/product-categories/create"
          class="px-4 py-2 bg-primary-600 text-white text-sm font-medium rounded-lg hover:bg-primary-700 transition whitespace-nowrap">
          + New Category
        </RouterLink>
      </div>

      <div class="flex items-center gap-3">
        <input v-model="search" @input="onSearch" type="search" placeholder="Search categories…"
          class="px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 w-64" />
      </div>

      <div class="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table class="w-full text-sm">
          <thead class="bg-gray-50 border-b border-gray-200 text-left">
            <tr>
              <th class="px-5 py-3 font-medium text-gray-600">Name</th>
              <th class="px-5 py-3 font-medium text-gray-600">Parent</th>
              <th class="px-5 py-3 font-medium text-gray-600">Description</th>
              <th class="px-5 py-3 font-medium text-gray-600">Status</th>
              <th class="px-5 py-3 font-medium text-gray-600 text-right">Actions</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-100">
            <tr v-if="loading">
              <td colspan="5" class="text-center py-12 text-gray-400">Loading…</td>
            </tr>
            <tr v-else-if="!categories.length">
              <td colspan="5" class="text-center py-12 text-gray-400">No categories found.</td>
            </tr>
            <tr v-for="cat in categories" :key="cat.id" class="hover:bg-gray-50 transition">
              <td class="px-5 py-3 font-medium text-gray-900">
                <span v-if="cat.parentId" class="text-gray-400 mr-1">↳</span>{{ cat.name }}
              </td>
              <td class="px-5 py-3 text-gray-500">{{ cat.parent?.name || '—' }}</td>
              <td class="px-5 py-3 text-gray-500 max-w-xs truncate">{{ cat.description || '—' }}</td>
              <td class="px-5 py-3">
                <span :class="cat.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'"
                  class="px-2 py-0.5 rounded-full text-xs font-medium capitalize">
                  {{ cat.status }}
                </span>
              </td>
              <td class="px-5 py-3 text-right">
                <div class="flex items-center justify-end gap-2">
                  <button @click="openEdit(cat)" class="text-xs px-3 py-1 border rounded hover:bg-gray-50">Edit</button>
                  <button @click="confirmDelete(cat)" class="text-xs px-3 py-1 border border-red-200 text-red-500 rounded hover:bg-red-50">Delete</button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>

        <div class="flex items-center justify-between px-5 py-3 border-t border-gray-100 text-sm text-gray-500">
          <span>{{ total }} categor{{ total !== 1 ? 'ies' : 'y' }}</span>
          <div class="flex items-center gap-1">
            <button @click="page--" :disabled="page <= 1" class="px-3 py-1 border rounded-lg text-xs disabled:opacity-40 hover:bg-gray-50">Prev</button>
            <span class="px-3 py-1 text-xs">{{ page }} / {{ Math.max(1, Math.ceil(total / limit)) }}</span>
            <button @click="page++" :disabled="page * limit >= total" class="px-3 py-1 border rounded-lg text-xs disabled:opacity-40 hover:bg-gray-50">Next</button>
          </div>
        </div>
      </div>
    </div>

    <!-- Edit Modal -->
    <Teleport to="body">
      <div v-if="modal.open" class="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
        <div class="bg-white rounded-xl shadow-xl w-full max-w-md p-6 space-y-4">
          <div class="flex items-center justify-between">
            <h2 class="text-base font-semibold text-gray-900">Edit Category</h2>
            <button @click="modal.open = false" class="text-gray-400 hover:text-gray-600 text-lg leading-none">&times;</button>
          </div>

          <div class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Name <span class="text-red-500">*</span></label>
              <input v-model="form.name" type="text" placeholder="e.g. Electronics"
                class="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Parent Category</label>
              <select v-model="form.parentId" class="w-full px-3 py-2 border rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary-500">
                <option value="">— None (top-level) —</option>
                <option v-for="cat in editableParents" :key="cat.id" :value="cat.id">{{ cat.name }}</option>
              </select>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea v-model="form.description" rows="2" placeholder="Optional description…"
                class="w-full px-3 py-2 border rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary-500" />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select v-model="form.status" class="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500">
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </div>

          <div v-if="modal.error" class="bg-red-50 text-red-700 text-sm px-3 py-2 rounded-lg">{{ modal.error }}</div>

          <div class="flex justify-end gap-3 pt-1">
            <button @click="modal.open = false" class="px-4 py-2 text-sm border rounded-lg hover:bg-gray-50 transition">Cancel</button>
            <button @click="save" :disabled="modal.saving"
              class="px-5 py-2 text-sm bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 transition">
              {{ modal.saving ? 'Saving…' : 'Save' }}
            </button>
          </div>
        </div>
      </div>
    </Teleport>
  </AppLayout>
</template>

<script setup>
import { ref, reactive, computed, watch, onMounted } from 'vue'
import { RouterLink } from 'vue-router'
import AppLayout from '@/layouts/AppLayout.vue'
import api from '@/api'

const categories = ref([])
const allCategories = ref([])
const total = ref(0)
const page = ref(1)
const limit = 20
const search = ref('')
const loading = ref(false)
let searchTimeout = null

const form = reactive({ name: '', description: '', parentId: '', status: 'active' })
const modal = reactive({ open: false, id: null, saving: false, error: '' })

// For edit: only top-level cats that are not the one being edited
const editableParents = computed(() =>
  allCategories.value.filter(c => !c.parentId && c.id !== modal.id)
)

async function load() {
  loading.value = true
  try {
    const { data } = await api.get('/erp/product-categories', {
      params: { page: page.value, limit, search: search.value },
    })
    categories.value = data.data.categories
    total.value = data.data.total
  } finally {
    loading.value = false
  }
}

async function loadAll() {
  try {
    const { data } = await api.get('/erp/product-categories/all')
    allCategories.value = data.data.categories
  } catch (err) {
    console.error('Failed to load categories lookup:', err.message)
  }
}

function onSearch() {
  clearTimeout(searchTimeout)
  searchTimeout = setTimeout(() => { page.value = 1; load() }, 300)
}

watch(page, load)
onMounted(() => { load(); loadAll() })

function openEdit(cat) {
  Object.assign(form, {
    name: cat.name,
    description: cat.description || '',
    parentId: cat.parentId || '',
    status: cat.status,
  })
  modal.id = cat.id
  modal.error = ''
  modal.open = true
}

async function save() {
  if (!form.name.trim()) { modal.error = 'Name is required'; return }
  modal.saving = true
  modal.error = ''
  try {
    await api.put(`/erp/product-categories/${modal.id}`, {
      ...form,
      parentId: form.parentId || null,
    })
    modal.open = false
    load()
    loadAll()
  } catch (err) {
    modal.error = err.response?.data?.message || 'Save failed'
  } finally {
    modal.saving = false
  }
}

async function confirmDelete(cat) {
  if (!confirm(`Delete "${cat.name}"? This cannot be undone.`)) return
  try {
    await api.delete(`/erp/product-categories/${cat.id}`)
    load()
    loadAll()
  } catch (err) {
    alert(err.response?.data?.message || 'Delete failed')
  }
}
</script>
