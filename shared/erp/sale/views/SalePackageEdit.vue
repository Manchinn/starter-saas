<template>
  <AppLayout>
    <div class="space-y-6">

      <div class="flex items-center gap-3">
        <RouterLink to="/erp/sale-packages" class="text-[#9BA7B0] hover:text-[#637381] transition">
          <ArrowLeftIcon class="w-5 h-5" />
        </RouterLink>
        <h1 class="text-2xl font-bold text-[#1C2434]">{{ t('erp.salePackages.edit') }}</h1>
      </div>

      <div v-if="loading" class="bg-white rounded-2xl border border-[#E2E8F0] p-6 text-center text-[#9BA7B0]">{{ t('common.loading') }}</div>

      <template v-else>

        <!-- Header card -->
        <div class="bg-white rounded-2xl border border-[#E2E8F0] p-6 space-y-5">
          <div class="grid grid-cols-2 gap-4">

            <!-- Code -->
            <div>
              <label class="block text-sm font-medium text-[#374151] mb-1">{{ t('erp.salePackages.code') }}</label>
              <input v-model="form.code" type="text" placeholder="e.g. PKG-001"
                class="w-full px-3 py-2 border rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary-500" />
            </div>

            <!-- Status -->
            <div>
              <label class="block text-sm font-medium text-[#374151] mb-1">{{ t('erp.salePackages.status') }}</label>
              <select v-model="form.status" class="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500">
                <option value="active">{{ t('common.active') }}</option>
                <option value="inactive">{{ t('common.inactive') }}</option>
              </select>
            </div>

            <!-- Name -->
            <div class="col-span-2">
              <label class="block text-sm font-medium text-[#374151] mb-1">{{ t('erp.salePackages.name') }} <span class="text-red-500">*</span></label>
              <input v-model="form.name" type="text"
                class="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
            </div>

            <!-- Description -->
            <div class="col-span-2">
              <label class="block text-sm font-medium text-[#374151] mb-1">{{ t('erp.salePackages.description') }}</label>
              <textarea v-model="form.description" rows="2"
                class="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none" />
            </div>
          </div>
        </div>

        <!-- Package Items card -->
        <div class="bg-white rounded-2xl border border-[#E2E8F0] p-6 space-y-4">
          <div class="flex items-center justify-between">
            <h2 class="text-base font-semibold text-[#1C2434]">{{ t('erp.salePackages.packageItems') }}</h2>
            <button @click="showItemPicker = true"
              class="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium bg-primary-50 text-primary-600 rounded-lg hover:bg-primary-100 transition-colors">
              <PlusIcon class="w-4 h-4" />
              {{ t('erp.salePackages.addItem') }}
            </button>
          </div>

          <!-- Items table -->
          <div v-if="form.items.length" class="border border-[#E2E8F0] rounded-xl overflow-hidden">
            <table class="w-full text-sm">
              <thead class="bg-[#F7F9FC]">
                <tr>
                  <th class="text-left px-4 py-2.5 text-xs font-medium text-[#637381]">{{ t('erp.salePackages.colSaleItem') }}</th>
                  <th class="text-left px-4 py-2.5 text-xs font-medium text-[#637381]">{{ t('erp.saleItems.code') }}</th>
                  <th class="w-28 px-4 py-2.5 text-xs font-medium text-[#637381] text-center">{{ t('erp.salePackages.colQty') }}</th>
                  <th class="w-36 px-4 py-2.5 text-xs font-medium text-[#637381]">{{ t('erp.salePackages.colUnitPrice') }}</th>
                  <th class="w-32 px-4 py-2.5 text-xs font-medium text-[#637381] text-right">{{ t('erp.salePackages.colLineTotal') }}</th>
                  <th class="w-10"></th>
                </tr>
              </thead>
              <tbody class="divide-y divide-[#E2E8F0]">
                <tr v-for="(item, idx) in form.items" :key="item.saleItemId" class="hover:bg-[#F7F9FC]/60">
                  <td class="px-4 py-2.5 font-medium text-[#1C2434]">{{ item.name }}</td>
                  <td class="px-4 py-2.5 font-mono text-xs text-[#637381]">{{ item.code || '—' }}</td>
                  <td class="px-4 py-2.5">
                    <input v-model.number="item.quantity" type="number" min="0.01" step="0.01"
                      class="w-full px-2 py-1 border rounded-lg text-sm text-center focus:outline-none focus:ring-2 focus:ring-primary-500" />
                  </td>
                  <td class="px-4 py-2.5">
                    <input v-model.number="item.unitPrice" type="number" min="0" step="0.01"
                      :placeholder="t('erp.salePackages.pricePh')"
                      class="w-full px-2 py-1 border rounded-lg text-sm text-right focus:outline-none focus:ring-2 focus:ring-primary-500" />
                  </td>
                  <td class="px-4 py-2.5 text-right text-[#1C2434] font-medium tabular-nums">
                    <span v-if="item.unitPrice != null && item.unitPrice !== ''">
                      {{ formatNumber(item.quantity * item.unitPrice) }}
                    </span>
                    <span v-else class="text-[#CBD5E1]">—</span>
                  </td>
                  <td class="px-2 py-2.5 text-center">
                    <button @click="removeItem(idx)" class="p-1 text-[#9BA7B0] hover:text-red-500 rounded transition-colors">
                      <XMarkIcon class="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              </tbody>
              <tfoot class="bg-[#F7F9FC] border-t border-[#E2E8F0]">
                <tr>
                  <td colspan="4" class="px-4 py-3 text-sm font-semibold text-[#374151] text-right">{{ t('erp.salePackages.totalPrice') }}</td>
                  <td class="px-4 py-3 text-right font-bold text-[#1C2434] tabular-nums">{{ formatNumber(totalPrice) }}</td>
                  <td></td>
                </tr>
              </tfoot>
            </table>
          </div>

          <div v-else class="border-2 border-dashed border-[#E2E8F0] rounded-xl py-8 text-center text-sm text-[#9BA7B0]">
            {{ t('erp.salePackages.noItems') }}
          </div>
        </div>

        <!-- Footer -->
        <div class="bg-white rounded-2xl border border-[#E2E8F0] px-6 py-4">
          <div v-if="error" class="mb-3 bg-red-50 text-red-700 text-sm px-4 py-2 rounded-lg">{{ error }}</div>
          <div class="flex items-center justify-between">
            <button @click="confirmDelete"
              class="px-4 py-2 text-sm text-red-600 border border-red-200 rounded-lg hover:bg-red-50 transition-colors">
              {{ t('common.delete') }}
            </button>
            <div class="flex gap-3">
              <RouterLink to="/erp/sale-packages" class="px-4 py-2 text-sm border rounded-lg hover:bg-[#F7F9FC] transition">{{ t('common.cancel') }}</RouterLink>
              <button @click="save" :disabled="saving"
                class="px-5 py-2 text-sm bg-primary-500 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 transition">
                {{ saving ? t('erp.common.saving') : t('common.saveChanges') }}
              </button>
            </div>
          </div>
        </div>

      </template>
    </div>

    <!-- Sale Item Picker modal -->
    <Teleport to="body">
      <div v-if="showItemPicker" class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
        <div class="bg-white rounded-xl shadow-xl w-full max-w-lg flex flex-col" style="max-height: 80vh">
          <div class="flex items-center justify-between px-5 py-4 border-b border-[#E2E8F0]">
            <h3 class="font-semibold text-[#1C2434]">{{ t('erp.salePackages.pickItem') }}</h3>
            <button @click="showItemPicker = false" class="text-[#9BA7B0] hover:text-[#637381]">
              <XMarkIcon class="w-5 h-5" />
            </button>
          </div>
          <div class="px-5 py-3 border-b border-[#E2E8F0]">
            <div class="relative">
              <MagnifyingGlassIcon class="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#9BA7B0] pointer-events-none" />
              <input v-model="pickerSearch" @input="onPickerSearch" type="search" :placeholder="t('erp.saleItems.searchPh')"
                class="input pl-9 w-full text-sm" />
            </div>
          </div>
          <div class="overflow-y-auto flex-1">
            <div v-if="pickerLoading" class="py-8 text-center text-sm text-[#9BA7B0]">{{ t('common.loading') }}</div>
            <div v-else-if="!pickerItems.length" class="py-8 text-center text-sm text-[#9BA7B0]">{{ t('erp.saleItems.noFound') }}</div>
            <ul v-else class="divide-y divide-[#F1F5F9]">
              <li v-for="si in pickerItems" :key="si.id"
                class="flex items-center justify-between px-5 py-3 hover:bg-[#F7F9FC] cursor-pointer"
                @click="addItem(si)">
                <div>
                  <p class="text-sm font-medium text-[#1C2434]">{{ si.name }}</p>
                  <p class="text-xs text-[#9BA7B0] font-mono">
                    <span v-if="si.code">{{ si.code }}</span>
                    <span v-if="si.code && si.pricings?.length"> · </span>
                    <span v-if="si.pricings?.length">{{ formatNumber(si.pricings[0].unitPrice) }}</span>
                  </p>
                </div>
                <span v-if="isAdded(si.id)"
                  class="text-xs font-medium text-primary-600 bg-primary-50 px-2 py-0.5 rounded-full">
                  {{ t('erp.salePackages.added') }}
                </span>
                <PlusCircleIcon v-else class="w-5 h-5 text-[#9BA7B0]" />
              </li>
            </ul>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- Delete confirm modal -->
    <Teleport to="body">
      <div v-if="deleteModal.open" class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
        <div class="bg-white rounded-xl shadow-xl w-full max-w-sm p-6 space-y-4">
          <h2 class="text-base font-semibold text-[#1C2434]">{{ t('erp.salePackages.deleteTitle') }}</h2>
          <p class="text-sm text-[#637381]">Delete <span class="font-semibold">{{ form.name }}</span>? This cannot be undone.</p>
          <div v-if="deleteModal.error" class="bg-red-50 border border-red-200 text-red-700 text-sm px-3 py-2 rounded-lg">{{ deleteModal.error }}</div>
          <div class="flex justify-end gap-3">
            <button @click="deleteModal.open = false" class="px-4 py-2 text-sm border border-[#E2E8F0] rounded-lg hover:bg-[#F7F9FC] transition-colors">{{ t('common.cancel') }}</button>
            <button @click="doDelete" :disabled="deleteModal.saving"
              class="px-5 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors">
              {{ deleteModal.saving ? 'Deleting…' : t('common.delete') }}
            </button>
          </div>
        </div>
      </div>
    </Teleport>
  </AppLayout>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { RouterLink, useRouter, useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { ArrowLeftIcon, PlusIcon, PlusCircleIcon, XMarkIcon, MagnifyingGlassIcon } from '@heroicons/vue/24/outline'
import AppLayout from '@/layouts/AppLayout.vue'
import api from '@/api'
import { parseApiError } from '@/utils/apiError'

const { t } = useI18n()
const router = useRouter()
const route  = useRoute()
const id     = route.params.id

const form    = ref({ code: '', name: '', description: '', status: 'active', items: [] })
const loading = ref(true)
const saving  = ref(false)
const error   = ref('')

const deleteModal    = reactive({ open: false, saving: false, error: '' })
const showItemPicker = ref(false)
const pickerSearch   = ref('')
const pickerItems    = ref([])
const pickerLoading  = ref(false)
let   pickerTimeout  = null

const totalPrice = computed(() =>
  form.value.items.reduce((sum, i) => {
    const p = parseFloat(i.unitPrice)
    return sum + (isNaN(p) ? 0 : parseFloat(i.quantity || 0) * p)
  }, 0)
)

function formatNumber(n) {
  return Number(n).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

onMounted(async () => {
  try {
    const { data } = await api.get(`/erp/sale-packages/${id}`)
    const pkg = data.data.package
    form.value = {
      code:        pkg.code || '',
      name:        pkg.name,
      description: pkg.description || '',
      status:      pkg.status,
      items:       (pkg.packageItems || []).map(pi => ({
        saleItemId: pi.saleItemId,
        name:       pi.saleItem?.name || '',
        code:       pi.saleItem?.code || '',
        quantity:   parseFloat(pi.quantity) || 1,
        unitPrice:  pi.unitPrice != null ? parseFloat(pi.unitPrice) : null,
        sortOrder:  pi.sortOrder,
      })),
    }
  } catch (err) {
    error.value = err.response?.data?.message || 'Failed to load package'
  } finally {
    loading.value = false
  }
  loadPickerItems()
})

async function loadPickerItems() {
  pickerLoading.value = true
  try {
    const { data } = await api.get('/erp/sale-items', { params: { limit: 50, search: pickerSearch.value, status: 'active' } })
    pickerItems.value = data.data.items
  } finally { pickerLoading.value = false }
}

function onPickerSearch() { clearTimeout(pickerTimeout); pickerTimeout = setTimeout(loadPickerItems, 250) }
function isAdded(sid)     { return form.value.items.some(i => i.saleItemId === sid) }
function addItem(si)      { if (isAdded(si.id)) return; const defaultPrice = si.pricings?.[0]?.unitPrice ?? null; form.value.items.push({ saleItemId: si.id, name: si.name, code: si.code, quantity: 1, unitPrice: defaultPrice, sortOrder: form.value.items.length }) }
function removeItem(idx)  { form.value.items.splice(idx, 1) }

async function save() {
  error.value = ''
  if (!form.value.name.trim()) { error.value = 'Name is required'; return }
  saving.value = true
  try {
    await api.put(`/erp/sale-packages/${id}`, {
      code:        form.value.code || null,
      name:        form.value.name,
      description: form.value.description || null,
      status:      form.value.status,
      items:       form.value.items.map((i, idx) => ({ saleItemId: i.saleItemId, quantity: i.quantity, unitPrice: i.unitPrice != null && i.unitPrice !== '' ? i.unitPrice : null, sortOrder: idx })),
    })
    router.push('/erp/sale-packages')
  } catch (err) {
    error.value = parseApiError(err, 'Failed to save')
  } finally { saving.value = false }
}

function confirmDelete() { deleteModal.error = ''; deleteModal.open = true }

async function doDelete() {
  deleteModal.saving = true; deleteModal.error = ''
  try { await api.delete(`/erp/sale-packages/${id}`); router.push('/erp/sale-packages') }
  catch (err) { deleteModal.error = err.response?.data?.message || 'Delete failed' }
  finally { deleteModal.saving = false }
}
</script>
