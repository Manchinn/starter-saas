<template>
  <AppLayout>
    <div class="space-y-6">

      <PageHeader :title="t('erp.salePackages.new')" back-to="/erp/sale-packages"
        :breadcrumb="[
          { label: t('erp.salePackages.title'), to: '/erp/sale-packages' },
          { label: t('common.create') },
        ]">
        <template #actions>
          <KeyboardShortcuts :shortcuts="pageShortcuts" width="w-48" />
          <HeaderSaveActions
            cancel-to="/erp/sale-packages"
            :cancel-label="t('common.cancel')"
            :saving="saving"
            :saving-label="t('erp.common.creating')"
            :save-label="t('erp.salePackages.create')"
            @save="save"
          />
        </template>
      </PageHeader>

      <!-- Header info -->
      <FormCard :title="t('erp.salePackages.new')" :icon="CubeIcon" icon-color="primary">
        <div class="grid grid-cols-2 gap-4">

          <FormField name="code" :label="t('erp.salePackages.code')" :errors="fieldErrors">
            <template #default="{ id }">
              <input v-if="!autoCode.enabled.value" :id="id" v-model="form.code" type="text"
                placeholder="e.g. PKG-001" class="input font-mono" />
              <input v-else :id="id" :value="autoCode.preview.value" type="text" readonly
                class="input bg-[#F7F9FC] text-[#637381] font-mono cursor-not-allowed" />
              <label class="mt-1 flex items-center gap-2 text-xs text-[#637381] cursor-pointer select-none">
                <input type="checkbox" :checked="autoCode.enabled.value" @change="autoCode.toggle" />
                {{ t('erp.common.autoGenerate') }}
              </label>
            </template>
          </FormField>

          <div>
            <FieldLabel :text="t('erp.salePackages.status')" />
            <SearchSelect v-model="form.status" :options="statusOptions" :allow-empty="false" />
          </div>

          <FormField name="name" :label="t('erp.salePackages.name')" :errors="fieldErrors"
            v-model="form.name" :placeholder="t('erp.salePackages.namePh')" required
            wrapper-class="col-span-2" />

          <FormField name="description" :label="t('erp.salePackages.description')" :errors="fieldErrors"
            v-model="form.description" textarea :rows="2" :placeholder="t('erp.salePackages.descriptionPh')"
            wrapper-class="col-span-2" />

        </div>
      </FormCard>

      <!-- Package Items -->
      <FormCard :title="t('erp.salePackages.packageItems')" :icon="ShoppingBagIcon" icon-color="green" :padded="false">
        <template #actions>
          <button @click="addLine" type="button"
            class="inline-flex items-center gap-1.5 px-3.5 py-2 text-[12px] font-semibold
                   text-primary-600 bg-primary-50 hover:bg-primary-100 border border-primary-200 transition-colors">
            <PlusIcon class="w-3.5 h-3.5" />
            {{ t('erp.salePackages.addItem') }}
          </button>
        </template>

        <div v-if="form.items.length" class="overflow-visible">
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

        <div v-else class="px-6 py-10 text-center text-sm text-[#9BA7B0] border-t border-[#E2E8F0]">
          {{ t('erp.salePackages.noItems') }}
        </div>
      </FormCard>

      <ErrorBanner :message="error" />

    </div>
  </AppLayout>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { PlusIcon, XMarkIcon, CubeIcon, ShoppingBagIcon } from '@heroicons/vue/24/outline'
import AppLayout from '@/layouts/AppLayout.vue'
import SearchSelect from '@/components/SearchSelect.vue'
import KeyboardShortcuts from '@/components/KeyboardShortcuts.vue'
import PageHeader from '@/components/form/PageHeader.vue'
import FormCard from '@/components/form/FormCard.vue'
import FormField from '@/components/form/FormField.vue'
import FieldLabel from '@/components/form/FieldLabel.vue'
import ErrorBanner from '@/components/form/ErrorBanner.vue'
import HeaderSaveActions from '@/components/form/HeaderSaveActions.vue'
import { useFieldErrors } from '@/composables/useFieldErrors'
import api from '@/api'
import { useAutoCode } from '@/composables/useAutoCode'
import { parseApiError } from '@/utils/apiError'

const { t } = useI18n()
const router  = useRouter()
const autoCode = useAutoCode('PKG')

const pageShortcuts = [
  { key: 'Ctrl+S', label: 'Save' },
  { key: 'Escape', label: 'Back to list' },
]

const form  = ref({ code: '', name: '', description: '', status: 'active', items: [] })
const error  = ref('')
const saving = ref(false)
const { fieldErrors, setFromError, setField, reset: resetErrors } = useFieldErrors()

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

function onPageKeydown(e) {
  if (e.key === 'Escape' && !e.ctrlKey && !e.metaKey) { router.push('/erp/sale-packages'); return }
  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') { e.preventDefault(); save() }
}
onMounted(() => document.addEventListener('keydown', onPageKeydown))
onUnmounted(() => document.removeEventListener('keydown', onPageKeydown))

async function save() {
  error.value = ''
  resetErrors()
  if (!form.value.name.trim()) { setField('name', t('common.errors.required', { field: t('erp.salePackages.name') })); return }
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
