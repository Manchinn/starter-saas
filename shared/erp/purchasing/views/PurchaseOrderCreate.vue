<template>
  <AppLayout>
    <div class="space-y-6">

      <PageHeader :title="t('erp.po.new')" back-to="/erp/purchasing/orders"
        :breadcrumb="[
          { label: t('erp.po.title'), to: '/erp/purchasing/orders' },
          { label: t('common.create') },
        ]">
        <template #badge>
          <StatusPill :label="t('erp.po.statusDraft')" />
        </template>
        <template #actions>
          <HeaderSaveActions
            cancel-to="/erp/purchasing/orders"
            :cancel-label="t('common.cancel')"
            :saving="saving"
            :saving-label="t('erp.common.creating')"
            :save-label="t('erp.po.create')"
            @save="save"
          />
        </template>
      </PageHeader>

      <!-- PR source banner -->
      <div v-if="fromPR"
        class="flex items-center gap-3 px-4 py-3 bg-primary-50 border border-primary-200 rounded-xl text-sm">
        <ClipboardDocumentCheckIcon class="w-4 h-4 text-primary-500 flex-shrink-0" />
        <span class="text-primary-700">
          Imported from requisition
          <RouterLink :to="`/erp/purchasing/requisitions/${fromPR.id}`"
            class="font-semibold underline hover:text-primary-900">{{ fromPR.refNo }}</RouterLink>
          — review and adjust before saving.
        </span>
      </div>

      <div class="space-y-5">

        <!-- Section 1: Order Info -->
        <FormCard :title="t('erp.po.details')" :icon="DocumentTextIcon" icon-color="primary">
          <div class="grid grid-cols-2 gap-x-6 gap-y-5">

              <!-- Vendor -->
              <div class="col-span-2 lg:col-span-1">
                <FieldLabel :text="t('erp.po.vendor')" required />
                <SearchSelect v-model="form.vendorId" :options="vendors" :invalid="!!errors.vendorId" :placeholder="`— ${t('erp.po.selectVendor')} —`" />
                <p v-if="errors.vendorId" class="mt-1 text-xs text-red-500">{{ errors.vendorId }}</p>
              </div>

              <!-- Order Date -->
              <div>
                <FieldLabel :text="t('erp.po.date')" required />
                <DateInput v-model="form.date"
                  :class="['w-full px-3.5 py-2.5 border text-sm transition-colors',
                           'focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400',
                           errors.date ? 'border-red-300 bg-red-50' : 'border-[#E2E8F0] text-[#1C2434]']" />
                <p v-if="errors.date" class="mt-1 text-xs text-red-500">{{ errors.date }}</p>
              </div>

              <!-- Delivery Date -->
              <div>
                <FieldLabel :text="t('erp.po.deliveryDate')" />
                <DateInput v-model="form.deliveryDate"
                  class="w-full px-3.5 py-2.5 border border-[#E2E8F0] text-sm text-[#1C2434]
                         focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400 transition-colors" />
              </div>

              <!-- Currency -->
              <div>
                <FieldLabel :text="t('erp.common.currency')" />
                <CurrencySelector v-model="form.currency" v-model:exchangeRate="form.exchangeRate" :as-of-date="form.date" />
              </div>

              <!-- Linked Requisition -->
              <div>
                <FieldLabel :text="t('erp.po.linkedRequisition')" />
                <SearchSelect v-model="form.requisitionId" :options="requisitions" label-key="refNo" :placeholder="`— ${t('erp.po.noRequisition')} —`" />
              </div>

              <!-- Notes -->
              <div class="col-span-2">
                <FieldLabel :text="t('erp.po.notes')" />
                <textarea v-model="form.notes" rows="2"
                  :placeholder="t('erp.po.notesPh')"
                  class="w-full px-3.5 py-2.5 border border-[#E2E8F0] text-sm text-[#1C2434]
                         focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400
                         transition-colors resize-none placeholder-[#CBD5E1]" />
              </div>

          </div>
        </FormCard>

        <!-- Section 2: Line Items -->
        <FormCard :title="t('erp.po.items')" :icon="ClipboardDocumentListIcon" icon-color="green"
          :subtitle="items.length ? `${items.length} ${items.length !== 1 ? t('erp.po.itemsCount') : t('erp.po.itemCount')}` : ''"
          :padded="false">
          <template #actions>
            <button @click="addItem" type="button"
              class="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-primary-500
                     bg-primary-50 hover:bg-primary-100 border border-primary-200 rounded-lg transition-colors">
              <PlusIcon class="w-3.5 h-3.5" />
              {{ t('erp.po.addItem') }}
            </button>
          </template>

          <EmptyState v-if="!items.length"
            :icon="ClipboardDocumentListIcon"
            :title="t('erp.po.noItemsYet')"
            :subtitle="t('erp.po.noItemsHint')"
            :action-label="t('erp.po.addFirstItem')"
            :error-message="errors.items"
            @action="addItem" />

          <!-- Items grid -->
          <div v-else>
            <div class="grid items-center gap-3 px-5 py-2.5 bg-[#F7F9FC] border-b border-[#E2E8F0]
                        text-[11px] font-semibold text-[#9BA7B0] uppercase tracking-wider"
              style="grid-template-columns: 1.8rem 3fr 4fr 5rem 7rem 5.5rem 2rem">
              <div class="text-center">#</div>
              <div>{{ t('erp.po.colItem') }}</div>
              <div>{{ t('erp.po.colDescription') }}</div>
              <div class="text-right">{{ t('erp.po.colQty') }}</div>
              <div class="text-right">{{ t('erp.po.colUnitPrice') }}</div>
              <div class="text-right">{{ t('erp.po.colSubtotal') }}</div>
              <div></div>
            </div>

            <div class="divide-y divide-[#E2E8F0]">
              <div v-for="(item, idx) in items" :key="idx"
                class="group grid items-center gap-3 px-5 py-3 hover:bg-[#F7F9FC] transition-colors"
                style="grid-template-columns: 1.8rem 3fr 4fr 5rem 7rem 5.5rem 2rem">

                <div class="text-xs font-semibold text-[#CBD5E1] text-center">{{ idx + 1 }}</div>

                <SearchSelect v-model="item.productId" :options="products" :placeholder="`— ${t('erp.po.freeText')} —`" @change="onProductChange(item)">
                  <template #option="{ option }">{{ option.sku }} — {{ option.name }}</template>
                  <template #singleLabel="{ option }">{{ option.sku }} — {{ option.name }}</template>
                </SearchSelect>

                <input v-model="item.description" type="text"
                  :placeholder="t('erp.po.descriptionPh')"
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
                  {{ lineTotal(item) }}
                </div>

                <button @click="removeItem(idx)" type="button"
                  class="opacity-0 group-hover:opacity-100 w-7 h-7 rounded-lg flex items-center justify-center
                         text-[#CBD5E1] hover:text-red-500 hover:bg-red-50 transition-all flex-shrink-0">
                  <TrashIcon class="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            <div class="grid items-center gap-3 px-5 py-3.5 bg-[#F7F9FC] border-t border-[#E2E8F0]"
              style="grid-template-columns: 1.8rem 3fr 4fr 5rem 7rem 5.5rem 2rem">
              <div class="col-span-5 text-[11px] font-semibold text-[#9BA7B0] uppercase tracking-wider text-right">
                {{ t('erp.po.subtotalLabel') }}
              </div>
              <div class="text-sm font-bold text-[#1C2434] tabular-nums text-right">{{ grandTotalFmt }}</div>
              <div></div>
            </div>

            <p v-if="errors.items" class="px-5 py-2 text-xs text-red-500 bg-red-50 border-t border-red-100">
              {{ errors.items }}
            </p>
          </div>
        </FormCard>

        <ErrorBanner :message="globalError" />

        <!-- Summary + Actions -->
        <FormCard :title="t('erp.po.summary')" :icon="CalculatorIcon" icon-color="slate" :padded="false">
          <div class="px-6 py-4 grid grid-cols-3 gap-6">
            <div class="flex flex-col gap-0.5">
              <span class="text-[11px] font-semibold text-[#9BA7B0] uppercase tracking-wider">{{ t('erp.po.summaryItems') }}</span>
              <span class="text-sm font-semibold text-[#1C2434]">{{ items.length }}</span>
            </div>
            <div class="flex flex-col gap-0.5">
              <span class="text-[11px] font-semibold text-[#9BA7B0] uppercase tracking-wider">{{ t('erp.po.summaryLines') }}</span>
              <span class="text-sm font-semibold text-[#1C2434] tabular-nums">{{ grandTotalFmt }}</span>
            </div>
            <div class="flex flex-col gap-0.5">
              <span class="text-[11px] font-semibold text-[#9BA7B0] uppercase tracking-wider">{{ t('erp.po.summaryVendor') }}</span>
              <span class="text-sm font-semibold text-[#1C2434]">
                {{ vendors.find(v => v.id === form.vendorId)?.name || '—' }}
              </span>
            </div>
          </div>

          <DocFooterBar
            :total-label="t('erp.po.grandTotal')"
            :total="grandTotalFmt"
            discard-to="/erp/purchasing/orders"
            :discard-label="t('common.cancel')"
            :saving="saving"
            :saving-label="t('erp.common.creating')"
            :save-label="t('erp.po.create')"
            @save="save"
          />
        </FormCard>

      </div>
    </div>
  </AppLayout>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import {
  PlusIcon, TrashIcon,
  CheckIcon, ArrowPathIcon,
  DocumentTextIcon, ClipboardDocumentListIcon, CalculatorIcon,
  ClipboardDocumentCheckIcon,
} from '@heroicons/vue/24/outline'
import AppLayout from '@/layouts/AppLayout.vue'
import DateInput from '@/components/DateInput.vue'
import CurrencySelector from '@/components/CurrencySelector.vue'
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
const route  = useRoute()

const form         = ref({ date: new Date().toISOString().slice(0, 10), deliveryDate: '', vendorId: '', requisitionId: '', currency: '', exchangeRate: 1, notes: '' })
const items        = ref([])
const vendors      = ref([])
const products     = ref([])
const requisitions = ref([])
const fromPR       = ref(null)
const saving       = ref(false)
const globalError  = ref('')
const errors       = ref({})

onMounted(async () => {
  const [vRes, pRes, rRes] = await Promise.allSettled([
    api.get('/erp/vendors',                  { params: { limit: 500 } }),
    api.get('/erp/item-master',              { params: { limit: 500 } }),
    api.get('/erp/purchasing/requisitions',  { params: { limit: 200, status: 'approved' } }),
  ])
  if (vRes.status === 'fulfilled') vendors.value      = vRes.value.data.data.vendors      || []
  if (pRes.status === 'fulfilled') products.value     = pRes.value.data.data.products     || []
  if (rRes.status === 'fulfilled') requisitions.value = rRes.value.data.data.requisitions || []

  if (route.query.from) {
    try {
      const { data } = await api.get(`/erp/purchasing/requisitions/${route.query.from}`)
      const pr = data.data.requisition
      fromPR.value            = pr
      form.value.requisitionId = pr.id
      if (pr.vendorId) form.value.vendorId = pr.vendorId
      items.value = (pr.items || []).map(i => ({
        productId:   i.productId   || '',
        description: i.description || (i.product?.name ? i.product.name : ''),
        qty:         Number(i.qty) || 1,
        unitPrice:   i.unitPrice != null ? Number(i.unitPrice) : 0,
        notes:       i.notes || '',
      }))
    } catch { /* silent — user can fill manually */ }
  }
})

function addItem() {
  items.value.push({ productId: '', description: '', qty: 1, unitPrice: 0, notes: '' })
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

function lineTotal(item) {
  const val = (Number(item.qty) || 0) * (Number(item.unitPrice) || 0)
  return val.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

const grandTotal    = computed(() => items.value.reduce((s, i) => s + (Number(i.qty) || 0) * (Number(i.unitPrice) || 0), 0))
const grandTotalFmt = computed(() => grandTotal.value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }))

function validate() {
  const e = {}
  if (!form.value.vendorId) e.vendorId = t('erp.po.vendorRequired')
  if (!form.value.date)     e.date     = t('erp.po.dateRequired')
  if (!items.value.length) {
    e.items = t('erp.po.itemsRequired')
  } else {
    for (const item of items.value) {
      if (!item.productId && !item.description) { e.items = t('erp.po.itemNeedsDesc');  break }
      if (!item.qty || item.qty <= 0)           { e.items = t('erp.po.itemQtyInvalid'); break }
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
    await api.post('/erp/purchasing/orders', {
      ...form.value,
      vendorId:      form.value.vendorId      || null,
      requisitionId: form.value.requisitionId || null,
      deliveryDate:  form.value.deliveryDate  || null,
      items: items.value,
    })
    router.push('/erp/purchasing/orders')
  } catch (err) {
    globalError.value = parseApiError(err, 'Failed to create')
  } finally {
    saving.value = false
  }
}
</script>
