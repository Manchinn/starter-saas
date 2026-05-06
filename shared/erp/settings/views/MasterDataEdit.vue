<template>
  <AppLayout>
    <div class="space-y-6">

      <!-- Page Header -->
      <div class="flex items-start gap-4">
        <RouterLink to="/erp/settings/master-data"
          class="mt-0.5 p-2 rounded-xl text-[#9BA7B0] hover:text-[#1C2434] hover:bg-white border border-transparent
                 hover:border-[#E2E8F0] transition-all flex-shrink-0">
          <ArrowLeftIcon class="w-[18px] h-[18px]" />
        </RouterLink>
        <div class="flex-1 min-w-0">
          <div class="flex items-center gap-2.5">
            <h1 class="text-xl font-bold text-[#1C2434]">{{ t('erp.masterData.editTitle') }}</h1>
            <span v-if="category?.isSystem"
              class="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold
                     bg-amber-50 text-amber-600 border border-amber-200">
              {{ t('erp.masterData.systemBadge') }}
            </span>
          </div>
          <nav v-if="category" class="flex items-center gap-1.5 mt-1">
            <RouterLink to="/erp/settings/master-data" class="text-[12px] text-[#9BA7B0] hover:text-[#637381] transition-colors">
              {{ t('erp.masterData.title') }}
            </RouterLink>
            <ChevronRightIcon class="w-3 h-3 text-[#CBD5E1]" />
            <span class="text-[12px] text-[#637381] font-mono">{{ category.slug }}</span>
          </nav>
        </div>
        <div class="flex items-center gap-2.5 flex-shrink-0">
          <RouterLink to="/erp/settings/master-data" class="btn-secondary">{{ t('common.cancel') }}</RouterLink>
          <button @click="saveCategory" :disabled="savingCat" class="btn-primary gap-2">
            <ArrowPathIcon v-if="savingCat" class="w-4 h-4 animate-spin" />
            <CheckIcon v-else class="w-4 h-4" />
            {{ savingCat ? t('common.saving') : t('common.saveChanges') }}
          </button>
        </div>
      </div>

      <!-- Loading -->
      <div v-if="loading" class="bg-white rounded-2xl border border-[#E2E8F0] p-12 text-center text-[#9BA7B0] text-sm animate-pulse">
        {{ t('common.loading') }}
      </div>

      <template v-else-if="category">

        <!-- Category Details card -->
        <div class="bg-white rounded-2xl border border-[#E2E8F0] shadow-card overflow-hidden">
          <div class="px-6 py-4 border-b border-[#E2E8F0] flex items-center gap-3">
            <div class="w-8 h-8 rounded-xl bg-primary-50 flex items-center justify-center flex-shrink-0">
              <CircleStackIcon class="w-4 h-4 text-primary-500" />
            </div>
            <div>
              <h2 class="text-sm font-semibold text-[#1C2434]">{{ t('erp.masterData.categoryDetails') }}</h2>
              <p class="text-xs font-mono text-[#9BA7B0] mt-0.5">{{ category.slug }}</p>
            </div>
          </div>
          <div class="px-6 py-5 space-y-5">

            <div class="grid grid-cols-2 gap-x-6 gap-y-5">
              <!-- Name -->
              <div>
                <label class="block text-[11px] font-semibold text-[#637381] uppercase tracking-wider mb-1.5">
                  {{ t('common.name') }} <span class="text-red-500 normal-case font-normal">*</span>
                </label>
                <input v-model="catForm.name" type="text"
                  class="w-full px-3.5 py-2.5 border border-[#E2E8F0] text-sm text-[#1C2434]
                         focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400 transition-colors" />
              </div>

              <!-- Description -->
              <div>
                <label class="block text-[11px] font-semibold text-[#637381] uppercase tracking-wider mb-1.5">
                  {{ t('common.description') }}
                </label>
                <input v-model="catForm.description" type="text" :placeholder="t('erp.masterData.descPh')"
                  class="w-full px-3.5 py-2.5 border border-[#E2E8F0] text-sm text-[#1C2434]
                         focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400 transition-colors" />
              </div>
            </div>

            <div v-if="catError"
              class="flex items-start gap-3 bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-xl">
              <ExclamationCircleIcon class="w-4 h-4 flex-shrink-0 mt-0.5" />
              {{ catError }}
            </div>

          </div>
        </div>

        <!-- Values card -->
        <div class="bg-white rounded-2xl border border-[#E2E8F0] shadow-card overflow-hidden">
          <div class="px-6 py-4 border-b border-[#E2E8F0] flex items-center justify-between">
            <div class="flex items-center gap-3">
              <div class="w-8 h-8 rounded-xl bg-blue-50 flex items-center justify-center flex-shrink-0">
                <ListBulletIcon class="w-4 h-4 text-blue-500" />
              </div>
              <div>
                <h2 class="text-sm font-semibold text-[#1C2434]">{{ t('erp.masterData.valuesTitle') }}</h2>
                <p class="text-[11px] text-[#9BA7B0]">{{ t('erp.masterData.valuesDesc') }}</p>
              </div>
            </div>
            <button v-if="!editRow" @click="startAdd"
              class="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-primary-500
                     bg-primary-50 hover:bg-primary-100 border border-primary-200 rounded-lg transition-colors">
              <PlusIcon class="w-3.5 h-3.5" />
              {{ t('erp.masterData.addValue') }}
            </button>
          </div>

          <!-- Values table -->
          <div class="overflow-x-auto">
            <table class="w-full text-sm">
              <thead>
                <tr class="bg-[#F7F9FC] border-b border-[#E2E8F0]">
                  <th class="px-4 py-3 text-left text-[11px] font-semibold text-[#9BA7B0] uppercase tracking-wider w-28">
                    {{ t('erp.masterData.colCode') }}
                  </th>
                  <th class="px-4 py-3 text-left text-[11px] font-semibold text-[#9BA7B0] uppercase tracking-wider">
                    {{ t('erp.masterData.colName') }}
                  </th>
                  <th class="px-4 py-3 text-left text-[11px] font-semibold text-[#9BA7B0] uppercase tracking-wider">
                    {{ t('common.description') }}
                  </th>
                  <th class="px-4 py-3 text-center text-[11px] font-semibold text-[#9BA7B0] uppercase tracking-wider w-24">
                    {{ t('erp.masterData.colSort') }}
                  </th>
                  <th class="px-4 py-3 text-center text-[11px] font-semibold text-[#9BA7B0] uppercase tracking-wider w-16">
                    {{ t('erp.masterData.colActive') }}
                  </th>
                  <th class="px-4 py-3 w-28"></th>
                </tr>
              </thead>
              <tbody class="divide-y divide-[#F1F5F9]">

                <!-- Empty state -->
                <tr v-if="!values.length && !editRow">
                  <td colspan="6" class="px-4 py-10 text-center text-sm text-[#9BA7B0]">
                    {{ t('erp.masterData.noValues') }}
                  </td>
                </tr>

                <!-- Existing value rows -->
                <template v-for="v in values" :key="v.id">
                  <!-- Edit mode -->
                  <tr v-if="editRow?.id === v.id" class="bg-primary-50/30">
                    <td class="px-3 py-2">
                      <input v-model="editRow.code" type="text" placeholder="CODE"
                        class="w-full px-2.5 py-2 border border-primary-300 text-xs font-mono text-[#1C2434] rounded-lg
                               focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400 transition-colors" />
                    </td>
                    <td class="px-3 py-2">
                      <input v-model="editRow.name" type="text" :placeholder="t('common.name')"
                        class="w-full px-2.5 py-2 border border-primary-300 text-sm text-[#1C2434] rounded-lg
                               focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400 transition-colors" />
                    </td>
                    <td class="px-3 py-2">
                      <input v-model="editRow.description" type="text" :placeholder="t('common.description')"
                        class="w-full px-2.5 py-2 border border-primary-300 text-sm text-[#637381] rounded-lg
                               focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400 transition-colors" />
                    </td>
                    <td class="px-3 py-2">
                      <input v-model.number="editRow.sortOrder" type="number" min="0" step="1"
                        class="w-full px-2.5 py-2 border border-primary-300 text-sm text-right text-[#1C2434] rounded-lg
                               focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400 transition-colors" />
                    </td>
                    <td class="px-3 py-2 text-center">
                      <input type="checkbox" v-model="editRow.isActive" class="rounded border-[#CBD5E1] w-4 h-4 accent-primary-500" />
                    </td>
                    <td class="px-3 py-2">
                      <div class="flex items-center justify-end gap-1">
                        <button @click="saveRow" :disabled="savingRow"
                          class="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-white bg-primary-500
                                 hover:bg-primary-600 rounded-lg transition-colors disabled:opacity-50">
                          <CheckIcon class="w-3 h-3" />
                          {{ t('common.save') }}
                        </button>
                        <button @click="cancelEdit"
                          class="px-2.5 py-1.5 text-xs font-medium text-[#637381] hover:text-[#1C2434] border border-[#E2E8F0]
                                 rounded-lg hover:bg-[#F7F9FC] transition-colors">
                          {{ t('common.cancel') }}
                        </button>
                      </div>
                    </td>
                  </tr>
                  <!-- View mode -->
                  <tr v-else class="hover:bg-[#F7F9FC] transition-colors group">
                    <td class="px-4 py-3 font-mono text-xs text-[#637381]">{{ v.code || '—' }}</td>
                    <td class="px-4 py-3 font-medium text-[#1C2434]">{{ v.name }}</td>
                    <td class="px-4 py-3 text-sm text-[#9BA7B0] max-w-xs truncate">{{ v.description || '—' }}</td>
                    <td class="px-4 py-3 text-center text-sm text-[#637381] tabular-nums">{{ v.sortOrder ?? 0 }}</td>
                    <td class="px-4 py-3 text-center">
                      <span :class="v.isActive !== false ? 'bg-green-50 text-green-700' : 'bg-[#F1F5F9] text-[#9BA7B0]'"
                        class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold">
                        <span class="w-1.5 h-1.5 rounded-full" :class="v.isActive !== false ? 'bg-green-500' : 'bg-slate-400'"></span>
                        {{ v.isActive !== false ? t('common.active') : t('common.inactive') }}
                      </span>
                    </td>
                    <td class="px-4 py-3">
                      <div class="flex items-center justify-end gap-1">
                        <button @click="startEdit(v)" :disabled="!!editRow"
                          class="p-1.5 text-[#9BA7B0] hover:text-primary-500 hover:bg-primary-50 rounded-md transition-colors
                                 disabled:opacity-30 disabled:cursor-not-allowed">
                          <PencilIcon class="w-3.5 h-3.5" />
                        </button>
                        <button @click="deleteValue(v)" :disabled="!!editRow"
                          class="p-1.5 text-[#9BA7B0] hover:text-red-500 hover:bg-red-50 rounded-md transition-colors
                                 disabled:opacity-30 disabled:cursor-not-allowed">
                          <TrashIcon class="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                </template>

                <!-- New value row (add mode) -->
                <tr v-if="editRow?.id === 'new'" class="bg-primary-50/30">
                  <td class="px-3 py-2">
                    <input v-model="editRow.code" type="text" placeholder="CODE"
                      class="w-full px-2.5 py-2 border border-primary-300 text-xs font-mono text-[#1C2434] rounded-lg
                             focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400 transition-colors" />
                  </td>
                  <td class="px-3 py-2">
                    <input v-model="editRow.name" type="text" :placeholder="t('common.name')" ref="newNameInput"
                      class="w-full px-2.5 py-2 border border-primary-300 text-sm text-[#1C2434] rounded-lg
                             focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400 transition-colors" />
                  </td>
                  <td class="px-3 py-2">
                    <input v-model="editRow.description" type="text" :placeholder="t('common.description')"
                      class="w-full px-2.5 py-2 border border-primary-300 text-sm text-[#637381] rounded-lg
                             focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400 transition-colors" />
                  </td>
                  <td class="px-3 py-2">
                    <input v-model.number="editRow.sortOrder" type="number" min="0" step="1"
                      class="w-full px-2.5 py-2 border border-primary-300 text-sm text-right text-[#1C2434] rounded-lg
                             focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400 transition-colors" />
                  </td>
                  <td class="px-3 py-2 text-center">
                    <input type="checkbox" v-model="editRow.isActive" class="rounded border-[#CBD5E1] w-4 h-4 accent-primary-500" />
                  </td>
                  <td class="px-3 py-2">
                    <div class="flex items-center justify-end gap-1">
                      <button @click="saveRow" :disabled="savingRow"
                        class="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-white bg-primary-500
                               hover:bg-primary-600 rounded-lg transition-colors disabled:opacity-50">
                        <CheckIcon class="w-3 h-3" />
                        {{ t('common.save') }}
                      </button>
                      <button @click="cancelEdit"
                        class="px-2.5 py-1.5 text-xs font-medium text-[#637381] hover:text-[#1C2434] border border-[#E2E8F0]
                               rounded-lg hover:bg-[#F7F9FC] transition-colors">
                        {{ t('common.cancel') }}
                      </button>
                    </div>
                  </td>
                </tr>

              </tbody>
            </table>
          </div>

          <!-- Row error -->
          <div v-if="rowError"
            class="mx-4 mb-4 flex items-start gap-3 bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-xl">
            <ExclamationCircleIcon class="w-4 h-4 flex-shrink-0 mt-0.5" />
            {{ rowError }}
          </div>

          <!-- Add value footer (when not already editing) -->
          <div v-if="!editRow" class="px-4 py-3 border-t border-[#F1F5F9]">
            <button @click="startAdd"
              class="inline-flex items-center gap-1.5 text-sm font-medium text-[#9BA7B0] hover:text-primary-500 transition-colors">
              <PlusIcon class="w-4 h-4" />
              {{ t('erp.masterData.addValue') }}
            </button>
          </div>
        </div>

      </template>
    </div>
  </AppLayout>
</template>

<script setup>
import { ref, nextTick, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import {
  ArrowLeftIcon, ChevronRightIcon, CircleStackIcon, ListBulletIcon,
  PlusIcon, PencilIcon, TrashIcon, CheckIcon, ArrowPathIcon, ExclamationCircleIcon,
} from '@heroicons/vue/24/outline'
import AppLayout from '@/layouts/AppLayout.vue'
import api from '@/api'
import { useMasterDataStore } from '@/stores/masterData'

const route  = useRoute()
const router = useRouter()
const store  = useMasterDataStore()
const { t }  = useI18n()

const category   = ref(null)
const values     = ref([])
const loading    = ref(true)
const catForm    = ref({ name: '', description: '' })
const catError   = ref('')
const savingCat  = ref(false)

const editRow    = ref(null)  // null | { id: string|'new', code, name, description, sortOrder, isActive }
const savingRow  = ref(false)
const rowError   = ref('')
const newNameInput = ref(null)

onMounted(async () => {
  try {
    const { data } = await api.get(`/erp/master-data/categories/${route.params.id}`)
    category.value = data.data.category
    values.value   = data.data.values || []
    catForm.value  = { name: category.value.name, description: category.value.description || '' }
  } finally {
    loading.value = false
  }
})

async function saveCategory() {
  catError.value = ''
  if (!catForm.value.name.trim()) { catError.value = t('erp.masterData.nameRequired'); return }
  savingCat.value = true
  try {
    await store.updateCategory(route.params.id, catForm.value)
    category.value = { ...category.value, ...catForm.value }
  } catch (err) {
    catError.value = err.response?.data?.message || t('erp.masterData.saveFailed')
  } finally {
    savingCat.value = false
  }
}

function startEdit(v) {
  rowError.value = ''
  editRow.value = { id: v.id, code: v.code || '', name: v.name, description: v.description || '', sortOrder: v.sortOrder ?? 0, isActive: v.isActive !== false }
}

function startAdd() {
  rowError.value = ''
  const nextSort = values.value.length ? Math.max(...values.value.map(v => v.sortOrder ?? 0)) + 10 : 10
  editRow.value = { id: 'new', code: '', name: '', description: '', sortOrder: nextSort, isActive: true }
  nextTick(() => newNameInput.value?.focus())
}

function cancelEdit() {
  editRow.value  = null
  rowError.value = ''
}

async function saveRow() {
  rowError.value = ''
  if (!editRow.value.name.trim()) { rowError.value = t('erp.masterData.nameRequired'); return }
  if (editRow.value.code?.trim()) {
    const isDuplicate = values.value.some(v =>
      v.id !== editRow.value.id &&
      v.code?.trim().toLowerCase() === editRow.value.code.trim().toLowerCase()
    )
    if (isDuplicate) { rowError.value = t('erp.masterData.codeDuplicate'); return }
  }
  savingRow.value = true
  try {
    if (editRow.value.id === 'new') {
      const { data } = await api.post(`/erp/master-data/categories/${route.params.id}/values`, {
        code:        editRow.value.code     || null,
        name:        editRow.value.name,
        description: editRow.value.description || null,
        sortOrder:   editRow.value.sortOrder ?? 0,
        isActive:    editRow.value.isActive,
      })
      values.value.push(data.data.value)
    } else {
      const { data } = await api.put(`/erp/master-data/values/${editRow.value.id}`, {
        code:        editRow.value.code     || null,
        name:        editRow.value.name,
        description: editRow.value.description || null,
        sortOrder:   editRow.value.sortOrder ?? 0,
        isActive:    editRow.value.isActive,
      })
      const idx = values.value.findIndex(v => v.id === editRow.value.id)
      if (idx !== -1) values.value[idx] = data.data.value
    }
    store.clearCache(category.value?.slug)
    editRow.value = null
  } catch (err) {
    rowError.value = err.response?.data?.message || t('erp.masterData.saveFailed')
  } finally {
    savingRow.value = false
  }
}

async function deleteValue(v) {
  if (!confirm(t('erp.masterData.confirmDeleteValue', { name: v.name }))) return
  try {
    await api.delete(`/erp/master-data/values/${v.id}`)
    values.value = values.value.filter(x => x.id !== v.id)
    store.clearCache(category.value?.slug)
  } catch (err) {
    rowError.value = err.response?.data?.message || t('erp.masterData.saveFailed')
  }
}
</script>
