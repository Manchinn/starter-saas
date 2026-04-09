<template>
  <AppLayout>
    <div class="space-y-5">

      <div class="flex items-center justify-between gap-4">
        <div>
          <h1 class="text-xl font-semibold text-gray-900">Product Categories</h1>
          <p class="text-sm text-gray-500 mt-0.5">{{ total }} categor{{ total !== 1 ? 'ies' : 'y' }}</p>
        </div>
        <RouterLink to="/erp/product-categories/create"
          class="inline-flex items-center gap-1.5 px-4 py-2 bg-primary-600 text-white text-sm
                 font-medium rounded-lg hover:bg-primary-700 transition-colors shadow-sm">
          <PlusIcon class="w-4 h-4" />
          New Category
        </RouterLink>
      </div>

      <div class="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">

        <div class="px-5 py-3 border-b border-gray-100 flex items-center gap-3">
          <div class="relative flex-1 min-w-48 max-w-64">
            <MagnifyingGlassIcon class="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            <input v-model="search" @input="onSearch" type="search" placeholder="Search categories…"
              class="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-sm bg-gray-50
                     focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-500
                     focus:border-transparent transition-colors" />
          </div>
        </div>

        <table class="w-full text-sm">
          <thead>
            <tr class="bg-gray-50 border-b border-gray-100 text-left">
              <th class="px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Code</th>
              <th class="px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Name</th>
              <th class="px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Parent</th>
              <th class="px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Description</th>
              <th class="px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Status</th>
              <th class="px-5 py-3 w-20"></th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-50">
            <tr v-if="loading">
              <td colspan="6" class="text-center py-16">
                <div class="inline-block w-5 h-5 border-2 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
              </td>
            </tr>
            <tr v-else-if="!categories.length">
              <td colspan="6" class="text-center py-16">
                <div class="flex flex-col items-center gap-2">
                  <div class="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center">
                    <FolderIcon class="w-5 h-5 text-gray-400" />
                  </div>
                  <p class="text-sm text-gray-400 font-medium">No categories found</p>
                </div>
              </td>
            </tr>
            <tr v-for="cat in categories" :key="cat.id" class="hover:bg-gray-50 transition-colors group">
              <td class="px-5 py-3.5 font-mono text-xs text-gray-500">{{ cat.code || '—' }}</td>
              <td class="px-5 py-3.5 font-medium text-gray-900">
                <span v-if="cat.parentId" class="text-gray-300 mr-1">↳</span>{{ cat.name }}
              </td>
              <td class="px-5 py-3.5 text-gray-500">{{ cat.parent?.name || '—' }}</td>
              <td class="px-5 py-3.5 text-gray-500 max-w-xs truncate">{{ cat.description || '—' }}</td>
              <td class="px-5 py-3.5">
                <span :class="cat.status === 'active' ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-500'"
                  class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold capitalize">
                  <span class="w-1.5 h-1.5 rounded-full" :class="cat.status === 'active' ? 'bg-green-500' : 'bg-gray-400'"></span>
                  {{ cat.status }}
                </span>
              </td>
              <td class="px-5 py-3.5">
                <div class="flex items-center justify-end gap-1 transition-opacity">
                  <button @click="openEdit(cat)"
                    class="p-1.5 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded-md transition-colors" title="Edit">
                    <PencilIcon class="w-4 h-4" />
                  </button>
                  <button @click="confirmDelete(cat)"
                    class="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors" title="Delete">
                    <TrashIcon class="w-4 h-4" />
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>

        <div class="flex items-center justify-between px-5 py-3.5 border-t border-gray-100 bg-gray-50/50">
          <span class="text-xs text-gray-500">Showing {{ categories.length ? (page-1)*limit+1 : 0 }}–{{ Math.min(page*limit,total) }} of {{ total }}</span>
          <div class="flex items-center gap-1">
            <button @click="page--" :disabled="page <= 1" class="h-8 w-8 flex items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-100 disabled:opacity-40 transition-colors"><ChevronLeftIcon class="w-4 h-4" /></button>
            <span class="text-xs text-gray-600 font-medium px-2 tabular-nums">{{ page }} / {{ Math.max(1,Math.ceil(total/limit)) }}</span>
            <button @click="page++" :disabled="page*limit>=total" class="h-8 w-8 flex items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-100 disabled:opacity-40 transition-colors"><ChevronRightIcon class="w-4 h-4" /></button>
          </div>
        </div>
      </div>
    </div>

    <!-- Edit Modal -->
    <Teleport to="body">
      <div v-if="modal.open" class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
        <div class="bg-white rounded-xl shadow-xl w-full max-w-md p-6 space-y-4">
          <div class="flex items-center justify-between">
            <h2 class="text-base font-semibold text-gray-900">Edit Category</h2>
            <button @click="modal.open = false" class="p-1 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors">
              <XMarkIcon class="w-5 h-5" />
            </button>
          </div>

          <div class="space-y-4">
            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Code</label>
                <input v-model="form.code" type="text" placeholder="e.g. ELEC"
                  class="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm font-mono
                         focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent" />
              </div>
              <div>
                <label class="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                  Name <span class="text-red-500 normal-case">*</span>
                </label>
                <input v-model="form.name" type="text" placeholder="e.g. Electronics"
                  class="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm
                         focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent" />
              </div>
            </div>
            <div>
              <label class="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Parent Category</label>
              <select v-model="form.parentId"
                class="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white
                       focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent">
                <option value="">— None (top-level) —</option>
                <option v-for="cat in editableParents" :key="cat.id" :value="cat.id">{{ cat.name }}</option>
              </select>
            </div>
            <div>
              <label class="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Description</label>
              <textarea v-model="form.description" rows="2" placeholder="Optional description…"
                class="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm resize-none
                       focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent" />
            </div>
            <div>
              <label class="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Status</label>
              <select v-model="form.status"
                class="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm
                       focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent">
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </div>

          <div v-if="modal.error" class="bg-red-50 border border-red-200 text-red-700 text-sm px-3 py-2 rounded-lg">{{ modal.error }}</div>

          <div class="flex justify-end gap-3 pt-1">
            <button @click="modal.open = false"
              class="px-4 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">Cancel</button>
            <button @click="save" :disabled="modal.saving"
              class="px-5 py-2 text-sm bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 transition-colors">
              {{ modal.saving ? 'Saving…' : 'Save Changes' }}
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
import { PlusIcon, MagnifyingGlassIcon, PencilIcon, TrashIcon, ChevronLeftIcon, ChevronRightIcon, FolderIcon, XMarkIcon } from '@heroicons/vue/24/outline'
import AppLayout from '@/layouts/AppLayout.vue'
import api from '@/api'

const categories    = ref([])
const allCategories = ref([])
const total   = ref(0)
const page    = ref(1)
const limit   = 20
const search  = ref('')
const loading = ref(false)
let searchTimeout = null

const form  = reactive({ name: '', description: '', parentId: '', status: 'active', code: '' })
const modal = reactive({ open: false, id: null, saving: false, error: '' })

const editableParents = computed(() => allCategories.value.filter(c => !c.parentId && c.id !== modal.id))

async function load() {
  loading.value = true
  try {
    const { data } = await api.get('/erp/product-categories', { params: { page: page.value, limit, search: search.value } })
    categories.value = data.data.categories
    total.value = data.data.total
  } finally { loading.value = false }
}

async function loadAll() {
  try {
    const { data } = await api.get('/erp/product-categories/all')
    allCategories.value = data.data.categories
  } catch (err) { console.error('Failed to load categories lookup:', err.message) }
}

function onSearch() { clearTimeout(searchTimeout); searchTimeout = setTimeout(() => { page.value = 1; load() }, 300) }
watch(page, load)
onMounted(() => { load(); loadAll() })

function openEdit(cat) {
  Object.assign(form, { name: cat.name, description: cat.description || '', parentId: cat.parentId || '', status: cat.status, code: cat.code || '' })
  modal.id = cat.id; modal.error = ''; modal.open = true
}

async function save() {
  if (!form.name.trim()) { modal.error = 'Name is required'; return }
  modal.saving = true; modal.error = ''
  try {
    await api.put(`/erp/product-categories/${modal.id}`, { ...form, parentId: form.parentId || null })
    modal.open = false; load(); loadAll()
  } catch (err) { modal.error = err.response?.data?.message || 'Save failed' }
  finally { modal.saving = false }
}

async function confirmDelete(cat) {
  if (!confirm(`Delete "${cat.name}"? This cannot be undone.`)) return
  try { await api.delete(`/erp/product-categories/${cat.id}`); load(); loadAll() }
  catch (err) { alert(err.response?.data?.message || 'Delete failed') }
}
</script>
