<template>
  <AppLayout>
    <div class="space-y-6">

      <div class="flex items-center gap-3">
        <RouterLink to="/erp/sale-packages" class="text-[#9BA7B0] hover:text-[#637381] transition">
          <ArrowLeftIcon class="w-5 h-5" />
        </RouterLink>
        <h1 class="text-2xl font-bold text-[#1C2434]">{{ t('erp.salePackages.new') }}</h1>
      </div>

      <!-- Header card -->
      <div class="bg-white rounded-2xl border border-[#E2E8F0] p-6 space-y-5">
        <div class="grid grid-cols-2 gap-4">

          <!-- Code -->
          <div>
            <label class="block text-sm font-medium text-[#374151] mb-1">{{ t('erp.salePackages.code') }}</label>
            <input v-if="!autoCode.enabled.value" v-model="form.code" type="text" placeholder="e.g. PKG-001"
              class="w-full px-3 py-2 border rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary-500" />
            <input v-else :value="autoCode.preview.value" type="text" readonly
              class="w-full px-3 py-2 border rounded-lg text-sm bg-[#F7F9FC] text-[#637381] font-mono cursor-not-allowed" />
            <label class="mt-1 flex items-center gap-2 text-xs text-[#637381] cursor-pointer select-none">
              <input type="checkbox" :checked="autoCode.enabled.value" @change="autoCode.toggle" class="rounded" />
              {{ t('erp.common.autoGenerate') }}
            </label>
          </div>

          <!-- Status -->
          <div>
            <label class="block text-sm font-medium text-[#374151] mb-1">{{ t('erp.salePackages.status') }}</label>
            <SearchSelect v-model="form.status" :options="statusOptions" :allow-empty="false" />
          </div>

          <!-- Name -->
          <div class="col-span-2">
            <label class="block text-sm font-medium text-[#374151] mb-1">{{ t('erp.salePackages.name') }} <span class="text-red-500">*</span></label>
            <input v-model="form.name" type="text" :placeholder="t('erp.salePackages.namePh')"
              :class="['w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500', errorOf('name') && 'input-error']" />
            <FieldError name="name" :errors="fieldErrors" />
          </div>

          <!-- Description -->
          <div class="col-span-2">
            <label class="block text-sm font-medium text-[#374151] mb-1">{{ t('erp.salePackages.description') }}</label>
            <textarea v-model="form.description" rows="2" :placeholder="t('erp.salePackages.descriptionPh')"
              class="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none" />
          </div>
        </div>
      </div>

      <!-- Package Items card -->
      <div class="bg-white rounded-2xl border border-[#E2E8F0] p-6 space-y-4">
        <div class="flex items-center justify-between">
          <h2 class="text-base font-semibold text-[#1C2434]">{{ t('erp.salePackages.packageItems') }}</h2>
          <button @click="addLine" type="button"
            class="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium bg-primary-50 text-primary-600 rounded-lg hover:bg-primary-100 transition-colors">
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
                  <button @click="removeItem(idx)" type="button" class="p-1 text-[#9BA7B0] hover:text-red-500 rounded transition-colors">
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
        <div class="flex justify-end gap-3">
          <RouterLink to="/erp/sale-packages" class="px-4 py-2 text-sm border rounded-lg hover:bg-[#F7F9FC] transition">{{ t('common.cancel') }}</RouterLink>
          <button @click="save" :disabled="saving"
            class="px-5 py-2 text-sm bg-primary-500 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 transition">
            {{ saving ? t('erp.common.saving') : t('erp.salePackages.create') }}
          </button>
        </div>
      </div>

    </div>
  </AppLayout>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { RouterLink, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { ArrowLeftIcon, PlusIcon, XMarkIcon } from '@heroicons/vue/24/outline'
import AppLayout from '@/layouts/AppLayout.vue'
import SearchSelect from '@/components/SearchSelect.vue'
import FieldError from '@/components/form/FieldError.vue'
import { useFieldErrors } from '@/composables/useFieldErrors'
import api from '@/api'
import { useAutoCode } from '@/composables/useAutoCode'
import { parseApiError } from '@/utils/apiError'

const { t } = useI18n()
const router  = useRouter()
const autoCode = useAutoCode('PKG')

const form  = ref({ code: '', name: '', description: '', status: 'active', items: [] })
const error  = ref('')
const saving = ref(false)
const { fieldErrors, setFromError, setField, reset: resetErrors, errorOf } = useFieldErrors()

const saleItems = ref([])

const statusOptions = computed(() => [
  { id: 'active',   name: t('common.active')   },
  { id: 'inactive', name: t('common.inactive') },
])

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
    const { data } = await api.get('/erp/sale-items', { params: { limit: 500, status: 'active' } })
    saleItems.value = data.data.items
  } catch { /* picker stays empty */ }
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
  if (!form.value.name.trim()) { setField('name', 'Name is required'); return }
  if (form.value.items.some(i => !i.saleItemId)) { error.value = 'Pick an item for every row, or remove empty rows'; return }
  saving.value = true
  try {
    const payload = {
      name:        form.value.name,
      description: form.value.description || null,
      status:      form.value.status,
      items:       form.value.items.map((i, idx) => ({ saleItemId: i.saleItemId, quantity: i.quantity, unitPrice: i.unitPrice != null && i.unitPrice !== '' ? i.unitPrice : null, sortOrder: idx })),
    }
    if (autoCode.enabled.value) { payload.autoCode = true; payload.code = null }
    else { payload.code = form.value.code || null }
    await api.post('/erp/sale-packages', payload)
    router.push('/erp/sale-packages')
  } catch (err) {
    const had = setFromError(err)
    if (!had) error.value = parseApiError(err, 'Failed to create package')
  } finally {
    saving.value = false
  }
}
</script>
