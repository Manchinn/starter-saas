<template>
  <AppLayout>
    <div class="space-y-6">

      <PageHeader :title="t('erp.purchasing.new')" back-to="/erp/purchasing/requisitions"
        :breadcrumb="[
          { label: t('erp.purchasing.title'), to: '/erp/purchasing/requisitions' },
          { label: t('common.create') },
        ]">
        <template #badge>
          <StatusPill :label="t('erp.purchasing.statusDraft')" />
        </template>
        <template #actions>
          <HeaderSaveActions
            cancel-to="/erp/purchasing/requisitions"
            :cancel-label="t('common.cancel')"
            :saving="saving"
            :saving-label="t('erp.common.creating')"
            :save-label="t('erp.purchasing.create')"
            @save="save"
          />
        </template>
      </PageHeader>

      <!-- Sections -->
      <div class="space-y-5">

        <!-- Section 1: Requisition Info -->
        <FormCard :title="t('erp.purchasing.details')" :icon="ClipboardDocumentListIcon" icon-color="primary">
          <div class="grid grid-cols-2 gap-x-6 gap-y-5">

              <!-- Date -->
              <div>
                <FieldLabel :text="t('erp.purchasing.date')" required />
                <DateInput v-model="form.date"
                  :class="['w-full px-3.5 py-2.5 border text-sm transition-colors',
                           'focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400',
                           errors.date ? 'border-red-300 bg-red-50' : 'border-[#E2E8F0] text-[#1C2434]']" />
                <p v-if="errors.date" class="mt-1 text-xs text-red-500">{{ errors.date }}</p>
              </div>

              <!-- Requested By -->
              <div>
                <FieldLabel :text="t('erp.purchasing.requestedBy')" />
                <input v-model="form.requestedBy" type="text"
                  :placeholder="t('erp.purchasing.requestedByPh')"
                  class="w-full px-3.5 py-2.5 border border-[#E2E8F0] text-sm text-[#1C2434]
                         focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400
                         transition-colors placeholder-[#CBD5E1]" />
              </div>

              <!-- Department -->
              <div>
                <FieldLabel :text="t('erp.purchasing.department')" />
                <input v-model="form.department" type="text"
                  :placeholder="t('erp.purchasing.departmentPh')"
                  class="w-full px-3.5 py-2.5 border border-[#E2E8F0] text-sm text-[#1C2434]
                         focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400
                         transition-colors placeholder-[#CBD5E1]" />
              </div>

              <!-- Vendor -->
              <div>
                <FieldLabel :text="t('erp.purchasing.vendor')" />
                <SearchSelect v-model="form.vendorId" :options="vendors" :placeholder="`— ${t('erp.purchasing.noVendor')} —`" />
              </div>

              <!-- Notes -->
              <div class="col-span-2">
                <FieldLabel :text="t('erp.purchasing.notes')" />
                <textarea v-model="form.notes" rows="2"
                  :placeholder="t('erp.purchasing.notesPh')"
                  class="w-full px-3.5 py-2.5 border border-[#E2E8F0] text-sm text-[#1C2434]
                         focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400
                         transition-colors resize-none placeholder-[#CBD5E1]" />
              </div>

          </div>
        </FormCard>

        <!-- Section 2: Requested Items -->
        <FormCard :title="t('erp.purchasing.items')" :icon="ShoppingBagIcon" icon-color="amber"
          :subtitle="items.length ? `${items.length} ${items.length !== 1 ? t('erp.purchasing.itemsCount') : t('erp.purchasing.itemCount')}` : ''"
          :padded="false">
          <template #actions>
            <button @click="addItem" type="button"
              class="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-primary-500
                     bg-primary-50 hover:bg-primary-100 border border-primary-200 rounded-lg transition-colors">
              <PlusIcon class="w-3.5 h-3.5" />
              {{ t('erp.purchasing.addItem') }}
            </button>
          </template>

          <!-- Empty state -->
          <EmptyState v-if="!items.length"
            :icon="ShoppingBagIcon"
            :title="t('erp.purchasing.noItemsYet')"
            :subtitle="t('erp.purchasing.noItemsHint')"
            :action-label="t('erp.purchasing.addFirstItem')"
            :error-message="errors.items"
            @action="addItem" />

          <!-- Items grid -->
          <div v-else>
            <div class="grid items-center gap-3 px-5 py-2.5 bg-[#F7F9FC] border-b border-[#E2E8F0]
                        text-[11px] font-semibold text-[#9BA7B0] uppercase tracking-wider"
              style="grid-template-columns: 1.8rem 3fr 3fr 5rem 7rem 5.5rem 2rem">
              <div class="text-center">#</div>
              <div>{{ t('erp.purchasing.colItem') }}</div>
              <div>{{ t('erp.purchasing.colDescription') }}</div>
              <div class="text-right">{{ t('erp.purchasing.colQty') }}</div>
              <div class="text-right">{{ t('erp.purchasing.colUnitPrice') }}</div>
              <div class="text-right">{{ t('erp.purchasing.colEstimated') }}</div>
              <div></div>
            </div>

            <div class="divide-y divide-[#E2E8F0]">
              <div v-for="(item, idx) in items" :key="idx"
                class="group grid items-center gap-3 px-5 py-3 hover:bg-[#F7F9FC] transition-colors"
                style="grid-template-columns: 1.8rem 3fr 3fr 5rem 7rem 5.5rem 2rem">

                <div class="text-xs font-semibold text-[#CBD5E1] text-center">{{ idx + 1 }}</div>

                <SearchSelect v-model="item.productId" :options="products" :placeholder="`— ${t('erp.purchasing.freeText')} —`" @change="onProductChange(item)">
                  <template #option="{ option }">{{ option.sku }} — {{ option.name }}</template>
                  <template #singleLabel="{ option }">{{ option.sku }} — {{ option.name }}</template>
                </SearchSelect>

                <input v-model="item.description" type="text"
                  :placeholder="t('erp.purchasing.descriptionPh')"
                  class="w-full px-2.5 py-2 border border-[#E2E8F0] text-sm text-[#637381]
                         focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400
                         transition-colors placeholder-[#CBD5E1]" />

                <input v-model.number="item.qty" type="number" min="0.0001" step="any"
                  class="w-full px-2 py-2 border border-[#E2E8F0] text-sm text-right text-[#1C2434] tabular-nums
                         focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400 transition-colors" />

                <input v-model.number="item.unitPrice" type="number" min="0" step="any" placeholder="0.00"
                  class="w-full px-2.5 py-2 border border-[#E2E8F0] text-sm text-right text-[#1C2434] tabular-nums
                         focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400
                         transition-colors placeholder-[#CBD5E1]" />

                <div class="text-sm font-semibold text-[#374151] tabular-nums text-right pr-1">
                  {{ lineEstimate(item) }}
                </div>

                <button @click="removeItem(idx)" type="button"
                  class="opacity-0 group-hover:opacity-100 w-7 h-7 rounded-lg flex items-center justify-center
                         text-[#CBD5E1] hover:text-red-500 hover:bg-red-50 transition-all flex-shrink-0">
                  <TrashIcon class="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            <div class="grid items-center gap-3 px-5 py-3.5 bg-[#F7F9FC] border-t border-[#E2E8F0]"
              style="grid-template-columns: 1.8rem 3fr 3fr 5rem 7rem 5.5rem 2rem">
              <div class="col-span-5 text-[11px] font-semibold text-[#9BA7B0] uppercase tracking-wider text-right">
                {{ t('erp.purchasing.estimatedTotal') }}
              </div>
              <div class="text-sm font-bold text-[#1C2434] tabular-nums text-right">{{ estimatedTotal }}</div>
              <div></div>
            </div>

            <p v-if="errors.items" class="px-5 py-2 text-xs text-red-500 bg-red-50 border-t border-red-100">
              {{ errors.items }}
            </p>
          </div>
        </FormCard>

        <ErrorBanner :message="globalError" />

        <!-- Summary + Actions -->
        <FormCard :title="t('erp.purchasing.summary')" :icon="CalculatorIcon" icon-color="slate" :padded="false">
          <div class="px-6 py-4 grid grid-cols-3 gap-6">
            <div class="flex flex-col gap-0.5">
              <span class="text-[11px] font-semibold text-[#9BA7B0] uppercase tracking-wider">{{ t('erp.purchasing.summaryItems') }}</span>
              <span class="text-sm font-semibold text-[#1C2434]">{{ items.length }}</span>
            </div>
            <div class="flex flex-col gap-0.5">
              <span class="text-[11px] font-semibold text-[#9BA7B0] uppercase tracking-wider">{{ t('erp.purchasing.summaryQty') }}</span>
              <span class="text-sm font-semibold text-[#1C2434] tabular-nums">{{ totalQty }}</span>
            </div>
            <div class="flex flex-col gap-0.5">
              <span class="text-[11px] font-semibold text-[#9BA7B0] uppercase tracking-wider">{{ t('erp.purchasing.summaryEstimate') }}</span>
              <span class="text-sm font-semibold text-[#1C2434] tabular-nums">{{ estimatedTotal }}</span>
            </div>
          </div>

          <DocFooterBar
            :total-label="t('erp.purchasing.estimatedTotal')"
            :total="estimatedTotal"
            discard-to="/erp/purchasing/requisitions"
            :discard-label="t('common.cancel')"
            :saving="saving"
            :saving-label="t('erp.common.creating')"
            :save-label="t('erp.purchasing.create')"
            @save="save"
          />
        </FormCard>

      </div>
    </div>
  </AppLayout>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import {
  PlusIcon, TrashIcon,
  CheckIcon, ArrowPathIcon,
  ClipboardDocumentListIcon, ShoppingBagIcon, CalculatorIcon,
} from '@heroicons/vue/24/outline'
import AppLayout from '@/layouts/AppLayout.vue'
import DateInput from '@/components/DateInput.vue'
import SearchSelect from '@/components/SearchSelect.vue'
import PageHeader from '@/components/form/PageHeader.vue'
import FormCard from '@/components/form/FormCard.vue'
import FieldLabel from '@/components/form/FieldLabel.vue'
import ErrorBanner from '@/components/form/ErrorBanner.vue'
import StatusPill from '@/components/form/StatusPill.vue'
import HeaderSaveActions from '@/components/form/HeaderSaveActions.vue'
import EmptyState from '@/components/form/EmptyState.vue'
import DocFooterBar from '@/components/form/DocFooterBar.vue'
import api from '@/api'
import { parseApiError } from '@/utils/apiError'

const { t }  = useI18n()
const router = useRouter()

const form        = ref({ date: new Date().toISOString().slice(0, 10), requestedBy: '', department: '', vendorId: '', notes: '' })
const items       = ref([])
const vendors     = ref([])
const products    = ref([])
const saving      = ref(false)
const globalError = ref('')
const errors      = ref({})

onMounted(async () => {
  const [vRes, pRes] = await Promise.allSettled([
    api.get('/erp/vendors',    { params: { limit: 500 } }),
    api.get('/erp/item-master', { params: { limit: 500 } }),
  ])
  if (vRes.status === 'fulfilled') vendors.value  = vRes.value.data.data.vendors  || []
  if (pRes.status === 'fulfilled') products.value = pRes.value.data.data.products || []
})

function addItem() {
  items.value.push({ productId: '', description: '', qty: 1, unitPrice: null, notes: '' })
}

function removeItem(idx) {
  items.value.splice(idx, 1)
}

function onProductChange(item) {
  const p = products.value.find(p => p.id === item.productId)
  if (p) {
    item.description = p.name
    if (p.cost != null) item.unitPrice = Number(p.cost)
  }
}

function lineEstimate(item) {
  const val = (Number(item.qty) || 0) * (Number(item.unitPrice) || 0)
  return val > 0 ? val.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '—'
}

const totalQty = computed(() => items.value.reduce((s, i) => s + (Number(i.qty) || 0), 0))

const estimatedTotal = computed(() => {
  const sum = items.value.reduce((s, i) => s + (Number(i.qty) || 0) * (Number(i.unitPrice) || 0), 0)
  if (sum === 0) return '—'
  return sum.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
})

function validate() {
  const e = {}
  if (!form.value.date) e.date = t('erp.purchasing.dateRequired')
  if (!items.value.length) {
    e.items = t('erp.purchasing.itemsRequired')
  } else {
    for (const item of items.value) {
      if (!item.productId && !item.description) { e.items = t('erp.purchasing.itemNeedsDesc'); break }
      if (!item.qty || item.qty <= 0)           { e.items = t('erp.purchasing.itemQtyInvalid'); break }
    }
  }
  errors.value = e
  return Object.keys(e).length === 0
}

async function save() {
  globalError.value = ''
  if (!validate()) return
  saving.value = true
  try {
    await api.post('/erp/purchasing/requisitions', {
      ...form.value,
      vendorId: form.value.vendorId || null,
      items: items.value,
    })
    router.push('/erp/purchasing/requisitions')
  } catch (err) {
    globalError.value = parseApiError(err, 'Failed to create')
  } finally {
    saving.value = false
  }
}
</script>
