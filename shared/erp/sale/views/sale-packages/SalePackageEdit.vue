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
                class="w-full px-3 py-2 border text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary-500" />
            </div>

            <!-- Status -->
            <div>
              <label class="block text-sm font-medium text-[#374151] mb-1">{{ t('erp.salePackages.status') }}</label>
              <SearchSelect v-model="form.status" :options="statusOptions" :allow-empty="false" />
            </div>

            <!-- Name -->
            <div class="col-span-2">
              <label class="block text-sm font-medium text-[#374151] mb-1">{{ t('erp.salePackages.name') }} <span class="text-red-500">*</span></label>
              <input v-model="form.name" type="text"
                :class="['w-full px-3 py-2 border text-sm focus:outline-none focus:ring-2 focus:ring-primary-500', errorOf('name') && 'input-error']" />
              <FieldError name="name" :errors="fieldErrors" />
            </div>

            <!-- Description -->
            <div class="col-span-2">
              <label class="block text-sm font-medium text-[#374151] mb-1">{{ t('erp.salePackages.description') }}</label>
              <textarea v-model="form.description" rows="2"
                class="w-full px-3 py-2 border text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none" />
            </div>
          </div>
        </div>

        <!-- Package Items card -->
        <div class="bg-white rounded-2xl border border-[#E2E8F0] p-6 space-y-4">
          <div class="flex items-center justify-between">
            <h2 class="text-base font-semibold text-[#1C2434]">{{ t('erp.salePackages.packageItems') }}</h2>
            <button @click="addLine" type="button"
              class="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium bg-primary-50 text-primary-600 hover:bg-primary-100 transition-colors">
              <PlusIcon class="w-4 h-4" />
              {{ t('erp.salePackages.addItem') }}
            </button>
          </div>

          <!-- Items table -->
          <div v-if="form.items.length" class="border border-[#E2E8F0] rounded-xl overflow-visible">
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
                <tr v-for="(item, idx) in form.items" :key="idx" class="hover:bg-[#F7F9FC]/60">
                  <td class="px-4 py-2.5">
                    <SearchSelect v-model="item.saleItemId" :options="availableItemsFor(item)" placeholder="— Item —" @change="onSaleItemChange(item)">
                      <template #option="{ option }">
                        <span class="font-medium">{{ option.name }}</span>
                        <span v-if="option.code" class="text-[#9BA7B0] font-mono text-xs ml-2">{{ option.code }}</span>
                      </template>
                    </SearchSelect>
                  </td>
                  <td class="px-4 py-2.5 font-mono text-xs text-[#637381]">{{ item.code || '—' }}</td>
                  <td class="px-4 py-2.5">
                    <input v-model.number="item.quantity" type="number" min="0.01" step="0.01"
                      class="w-full px-2 py-1 border text-sm text-center focus:outline-none focus:ring-2 focus:ring-primary-500" />
                  </td>
                  <td class="px-4 py-2.5">
                    <input v-model.number="item.unitPrice" type="number" min="0" step="0.01"
                      :placeholder="t('erp.salePackages.pricePh')"
                      class="w-full px-2 py-1 border text-sm text-right focus:outline-none focus:ring-2 focus:ring-primary-500" />
                  </td>
                  <td class="px-4 py-2.5 text-right text-[#1C2434] font-medium tabular-nums">
                    <span v-if="item.unitPrice != null && item.unitPrice !== ''">
                      {{ formatNumber(item.quantity * item.unitPrice) }}
                    </span>
                    <span v-else class="text-[#CBD5E1]">—</span>
                  </td>
                  <td class="px-2 py-2.5 text-center">
                    <button @click="removeItem(idx)" type="button" class="p-1 text-[#9BA7B0] hover:text-red-500 transition-colors">
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
          <div v-if="error" class="mb-3 bg-red-50 text-red-700 text-sm px-4 py-2">{{ error }}</div>
          <div class="flex items-center justify-between">
            <button @click="confirmDelete"
              class="px-4 py-2 text-sm text-red-600 border border-red-200 hover:bg-red-50 transition-colors">
              {{ t('common.delete') }}
            </button>
            <div class="flex gap-3">
              <RouterLink to="/erp/sale-packages" class="px-4 py-2 text-sm border hover:bg-[#F7F9FC] transition">{{ t('common.cancel') }}</RouterLink>
              <button @click="save" :disabled="saving"
                class="px-5 py-2 text-sm bg-primary-500 text-white hover:bg-primary-700 disabled:opacity-50 transition">
                {{ saving ? t('erp.common.saving') : t('common.saveChanges') }}
              </button>
            </div>
          </div>
        </div>

      </template>
    </div>

    <!-- Delete confirm modal -->
    <Teleport to="body">
      <div v-if="deleteModal.open" class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
        <div class="bg-white rounded-xl shadow-xl w-full max-w-sm p-6 space-y-4">
          <h2 class="text-base font-semibold text-[#1C2434]">{{ t('erp.salePackages.deleteTitle') }}</h2>
          <p class="text-sm text-[#637381]">Delete <span class="font-semibold">{{ form.name }}</span>? This cannot be undone.</p>
          <div v-if="deleteModal.error" class="bg-red-50 border border-red-200 text-red-700 text-sm px-3 py-2">{{ deleteModal.error }}</div>
          <div class="flex justify-end gap-3">
            <button @click="deleteModal.open = false" class="px-4 py-2 text-sm border border-[#E2E8F0] hover:bg-[#F7F9FC] transition-colors">{{ t('common.cancel') }}</button>
            <button @click="doDelete" :disabled="deleteModal.saving"
              class="px-5 py-2 text-sm bg-red-600 text-white hover:bg-red-700 disabled:opacity-50 transition-colors">
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
import { ArrowLeftIcon, PlusIcon, XMarkIcon } from '@heroicons/vue/24/outline'
import AppLayout from '@/layouts/AppLayout.vue'
import SearchSelect from '@/components/SearchSelect.vue'
import FieldError from '@/components/form/FieldError.vue'
import { useFieldErrors } from '@/composables/useFieldErrors'
import api from '@/api'
import { parseApiError } from '@/utils/apiError'

const { t } = useI18n()
const router = useRouter()
const route  = useRoute()
const id     = route.params.id

const form    = ref({ code: '', name: '', description: '', status: 'active', items: [] })
const loading = ref(true)
const saving  = ref(false)
const { fieldErrors, setFromError, setField, reset: resetErrors, errorOf } = useFieldErrors()

const statusOptions = computed(() => [
  { id: 'active',   name: t('common.active')   },
  { id: 'inactive', name: t('common.inactive') },
])
const error   = ref('')

const deleteModal = reactive({ open: false, saving: false, error: '' })
const saleItems   = ref([])

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
    const [pkgRes, itemsRes] = await Promise.allSettled([
      api.get(`/erp/sale-packages/${id}`),
      api.get('/erp/sale-items', { params: { limit: 500, status: 'active' } }),
    ])
    if (itemsRes.status === 'fulfilled') saleItems.value = itemsRes.value.data.data.items
    if (pkgRes.status === 'fulfilled') {
      const pkg = pkgRes.value.data.data.package
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
    } else {
      error.value = pkgRes.reason?.response?.data?.message || 'Failed to load package'
    }
  } finally {
    loading.value = false
  }
})

function addLine() {
  form.value.items.push({ saleItemId: '', name: '', code: '', quantity: 1, unitPrice: null, sortOrder: form.value.items.length })
}

function availableItemsFor(currentItem) {
  const usedIds = new Set(form.value.items.filter(i => i !== currentItem && i.saleItemId).map(i => i.saleItemId))
  return saleItems.value.filter(s => !usedIds.has(s.id))
}

function onSaleItemChange(item) {
  const si = saleItems.value.find(s => s.id === item.saleItemId)
  if (!si) { item.name = ''; item.code = ''; item.unitPrice = null; return }
  item.name      = si.name
  item.code      = si.code
  item.unitPrice = si.pricings?.[0]?.unitPrice ?? null
}

function removeItem(idx) { form.value.items.splice(idx, 1) }

async function save() {
  error.value = ''
  resetErrors()
  if (!form.value.name.trim()) { setField('name', t('common.errors.required', { field: t('erp.salePackages.name') })); return }
  if (form.value.items.some(i => !i.saleItemId)) { error.value = 'Pick an item for every row, or remove empty rows'; return }
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
    const had = setFromError(err)
    if (!had) error.value = parseApiError(err, 'Failed to save')
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
