<template>
  <AppLayout>
    <div class="space-y-6">

      <div class="flex items-center justify-between gap-4">
        <h1 class="text-2xl font-bold text-gray-900">UOM Conversions</h1>
        <button @click="openCreate"
          class="px-4 py-2 bg-primary-600 text-white text-sm font-medium rounded-lg hover:bg-primary-700 transition">
          + New Conversion
        </button>
      </div>

      <div class="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table class="w-full text-sm">
          <thead class="bg-gray-50 border-b border-gray-200 text-left">
            <tr>
              <th class="px-5 py-3 font-medium text-gray-600">From UOM</th>
              <th class="px-5 py-3 font-medium text-gray-600 text-center">→</th>
              <th class="px-5 py-3 font-medium text-gray-600">To UOM</th>
              <th class="px-5 py-3 font-medium text-gray-600 text-right">Factor</th>
              <th class="px-5 py-3 font-medium text-gray-600">Notes</th>
              <th class="px-5 py-3 font-medium text-gray-600 text-right">Actions</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-100">
            <tr v-if="loading">
              <td colspan="6" class="text-center py-12 text-gray-400">Loading…</td>
            </tr>
            <tr v-else-if="!conversions.length">
              <td colspan="6" class="text-center py-12 text-gray-400">No conversions defined yet.</td>
            </tr>
            <tr v-for="c in conversions" :key="c.id" class="hover:bg-gray-50 transition">
              <td class="px-5 py-3">
                <span class="font-medium text-gray-900">{{ c.fromUom?.name }}</span>
                <span class="ml-1 text-xs text-gray-400 font-mono">({{ c.fromUom?.abbreviation }})</span>
              </td>
              <td class="px-5 py-3 text-center text-gray-400">→</td>
              <td class="px-5 py-3">
                <span class="font-medium text-gray-900">{{ c.toUom?.name }}</span>
                <span class="ml-1 text-xs text-gray-400 font-mono">({{ c.toUom?.abbreviation }})</span>
              </td>
              <td class="px-5 py-3 text-right font-mono font-semibold text-primary-700">{{ Number(c.factor) }}</td>
              <td class="px-5 py-3 text-gray-500 text-xs max-w-xs truncate">{{ c.notes || '—' }}</td>
              <td class="px-5 py-3 text-right whitespace-nowrap">
                <button @click="openEdit(c)" class="text-primary-600 hover:underline text-xs mr-3">Edit</button>
                <button @click="confirmDelete(c)" class="text-red-500 hover:underline text-xs">Delete</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

    </div>

    <!-- Create / Edit Modal -->
    <Teleport to="body">
      <div v-if="modal.open" class="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
        <div class="bg-white rounded-xl shadow-xl w-full max-w-md p-6 space-y-5">
          <div class="flex items-center justify-between">
            <h2 class="text-base font-semibold text-gray-900">{{ modal.isEdit ? 'Edit' : 'New' }} UOM Conversion</h2>
            <button @click="modal.open = false" class="text-gray-400 hover:text-gray-600 text-lg leading-none">&times;</button>
          </div>

          <div class="space-y-4">
            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">From UOM <span class="text-red-500">*</span></label>
                <select v-model="form.fromUomId" class="w-full px-3 py-2 border rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary-500">
                  <option value="">— Select —</option>
                  <option v-for="u in uoms" :key="u.id" :value="u.id">{{ u.name }} ({{ u.abbreviation }})</option>
                </select>
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">To UOM <span class="text-red-500">*</span></label>
                <select v-model="form.toUomId" class="w-full px-3 py-2 border rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary-500">
                  <option value="">— Select —</option>
                  <option v-for="u in uoms" :key="u.id" :value="u.id">{{ u.name }} ({{ u.abbreviation }})</option>
                </select>
              </div>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">
                Conversion Factor <span class="text-red-500">*</span>
                <span class="ml-1 font-normal text-xs text-gray-400">(1 {{ fromUomLabel }} = <strong>{{ form.factor || '?' }}</strong> {{ toUomLabel }})</span>
              </label>
              <input v-model.number="form.factor" type="number" min="0.000001" step="any" placeholder="e.g. 12"
                class="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Notes</label>
              <input v-model="form.notes" type="text" placeholder="Optional"
                class="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
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
import { ref, reactive, computed, onMounted } from 'vue'
import AppLayout from '@/layouts/AppLayout.vue'
import api from '@/api'

const conversions = ref([])
const uoms        = ref([])
const loading     = ref(false)

const form  = reactive({ fromUomId: '', toUomId: '', factor: '', notes: '' })
const modal = reactive({ open: false, isEdit: false, id: null, saving: false, error: '' })

const fromUomLabel = computed(() => uoms.value.find(u => u.id === form.fromUomId)?.abbreviation || 'from')
const toUomLabel   = computed(() => uoms.value.find(u => u.id === form.toUomId)?.abbreviation   || 'to')

async function load() {
  loading.value = true
  try {
    const { data } = await api.get('/erp/uom-conversion')
    conversions.value = data.data.conversions
  } finally {
    loading.value = false
  }
}

async function loadUoms() {
  const { data } = await api.get('/erp/uom', { params: { limit: 200 } })
  uoms.value = data.data.uoms.filter(u => u.status === 'active')
}

onMounted(() => { load(); loadUoms() })

function openCreate() {
  Object.assign(form, { fromUomId: '', toUomId: '', factor: '', notes: '' })
  modal.isEdit = false
  modal.id     = null
  modal.error  = ''
  modal.open   = true
}

function openEdit(c) {
  Object.assign(form, {
    fromUomId: c.fromUomId,
    toUomId:   c.toUomId,
    factor:    Number(c.factor),
    notes:     c.notes || '',
  })
  modal.isEdit = true
  modal.id     = c.id
  modal.error  = ''
  modal.open   = true
}

async function save() {
  if (!form.fromUomId) { modal.error = 'From UOM is required'; return }
  if (!form.toUomId)   { modal.error = 'To UOM is required'; return }
  if (!form.factor || form.factor <= 0) { modal.error = 'Factor must be greater than 0'; return }
  modal.saving = true
  modal.error  = ''
  try {
    if (modal.isEdit) {
      await api.put(`/erp/uom-conversion/${modal.id}`, form)
    } else {
      await api.post('/erp/uom-conversion', form)
    }
    modal.open = false
    load()
  } catch (err) {
    modal.error = err.response?.data?.message || 'Save failed'
  } finally {
    modal.saving = false
  }
}

async function confirmDelete(c) {
  if (!confirm(`Delete conversion "${c.fromUom?.abbreviation} → ${c.toUom?.abbreviation}"?`)) return
  try {
    await api.delete(`/erp/uom-conversion/${c.id}`)
    load()
  } catch (err) {
    alert(err.response?.data?.message || 'Delete failed')
  }
}
</script>
