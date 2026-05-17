<template>
  <AppLayout>
    <div class="space-y-6">

      <PageHeader :title="t('erp.deliveryOrders.new')" back-to="/erp/delivery-orders"
        :breadcrumb="[
          { label: t('erp.deliveryOrders.title'), to: '/erp/delivery-orders' },
          { label: t('common.create') },
        ]">
        <template #badge>
          <StatusPill :label="t('erp.common.draft')" />
        </template>
        <template #actions>
          <HeaderSaveActions
            cancel-to="/erp/delivery-orders"
            :cancel-label="t('common.cancel')"
            :saving="saving"
            :saving-label="t('erp.common.creating')"
            :save-label="t('erp.deliveryOrders.create')"
            @save="save"
          />
        </template>
      </PageHeader>

      <div class="space-y-5">

        <!-- Section 1: Delivery Info -->
        <FormCard :title="t('erp.deliveryOrders.info')" :icon="TruckIcon" icon-color="primary">
          <div class="grid grid-cols-2 gap-x-6 gap-y-5">

              <!-- Customer -->
              <div class="col-span-2 lg:col-span-1">
                <FieldLabel :text="t('erp.common.customer')" required />
                <SearchSelect v-model="form.customerId" :options="customers" :invalid="!!errors.customerId" placeholder="— Select customer —">
                  <template #option="{ option }">{{ option.name }}<span v-if="option.company" class="text-[#9BA7B0]"> · {{ option.company }}</span></template>
                  <template #singleLabel="{ option }">{{ option.name }}<span v-if="option.company" class="text-[#9BA7B0]"> · {{ option.company }}</span></template>
                </SearchSelect>
                <p v-if="errors.customerId" class="mt-1 text-xs text-red-500">{{ errors.customerId }}</p>
              </div>

              <!-- Date -->
              <div>
                <FieldLabel :text="t('erp.common.date')" required />
                <input v-model="form.date" type="date"
                  :class="['w-full px-3.5 py-2.5 border text-sm transition-colors',
                           'focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400',
                           errors.date ? 'border-red-300 bg-red-50' : 'border-[#E2E8F0] text-[#1C2434]']" />
                <p v-if="errors.date" class="mt-1 text-xs text-red-500">{{ errors.date }}</p>
              </div>

              <!-- Delivery Date -->
              <div>
                <FieldLabel :text="t('erp.deliveryOrders.deliveryDate')" />
                <input v-model="form.deliveryDate" type="date"
                  class="w-full px-3.5 py-2.5 border border-[#E2E8F0] text-sm text-[#1C2434]
                         focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400 transition-colors" />
              </div>

              <!-- Reference Sales Order -->
              <div>
                <FieldLabel :text="t('erp.deliveryOrders.referenceSO')" />
                <SearchSelect v-model="form.orderId" :options="orders" label-key="orderNumber" placeholder="— None —" />
              </div>

              <!-- Delivery Address -->
              <div class="col-span-2">
                <FieldLabel :text="t('erp.deliveryOrders.deliveryAddress')" />
                <textarea v-model="form.address" rows="2" placeholder="Street, city, postal code…"
                  class="w-full px-3.5 py-2.5 border border-[#E2E8F0] text-sm text-[#1C2434]
                         focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400
                         transition-colors resize-none placeholder-[#CBD5E1]" />
              </div>

              <!-- Notes -->
              <div class="col-span-2">
                <FieldLabel :text="t('erp.common.notes')" />
                <textarea v-model="form.notes" rows="2" placeholder="Handling instructions or remarks…"
                  class="w-full px-3.5 py-2.5 border border-[#E2E8F0] text-sm text-[#1C2434]
                         focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400
                         transition-colors resize-none placeholder-[#CBD5E1]" />
              </div>

          </div>
        </FormCard>

        <!-- Section 2: Items -->
        <FormCard :title="t('erp.common.items')" :icon="ClipboardDocumentListIcon" icon-color="green"
          :subtitle="items.length ? `${items.length} item${items.length !== 1 ? 's' : ''}` : ''"
          :padded="false">
          <template #actions>
            <button @click="addItem" type="button"
              class="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-primary-500
                     bg-primary-50 hover:bg-primary-100 border border-primary-200 rounded-lg transition-colors">
              <PlusIcon class="w-3.5 h-3.5" />
              {{ t('erp.common.addItem') }}
            </button>
          </template>

          <!-- Empty state -->
          <div v-if="!items.length" class="flex flex-col items-center justify-center py-16 text-center">
            <div class="w-14 h-14 bg-[#F1F5F9] rounded-2xl flex items-center justify-center mb-4">
              <ClipboardDocumentListIcon class="w-7 h-7 text-[#CBD5E1]" />
            </div>
            <p class="text-sm font-semibold text-[#637381]">{{ t('erp.common.noItems') }}</p>
            <p class="text-xs text-[#9BA7B0] mt-1 mb-4">{{ t('erp.deliveryOrders.noItemsHint') }}</p>
            <button @click="addItem" type="button"
              class="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-primary-500
                     bg-primary-50 hover:bg-primary-100 border border-primary-200 rounded-lg transition-colors">
              <PlusIcon class="w-4 h-4" />
              {{ t('erp.common.addFirstItem') }}
            </button>
            <p v-if="errors.items" class="mt-3 text-xs text-red-500">{{ errors.items }}</p>
          </div>

          <!-- Items grid -->
          <div v-else>
            <div class="grid items-center gap-3 px-5 py-2.5 bg-[#F7F9FC] border-b border-[#E2E8F0]
                        text-[11px] font-semibold text-[#9BA7B0] uppercase tracking-wider"
              style="grid-template-columns: 1.8rem 3fr 4fr 5rem 2rem">
              <div class="text-center">#</div>
              <div>{{ t('erp.deliveryOrders.colProduct') }}</div>
              <div>{{ t('erp.deliveryOrders.colNotes') }}</div>
              <div class="text-right">{{ t('erp.deliveryOrders.colQty') }}</div>
              <div></div>
            </div>

            <div class="divide-y divide-[#E2E8F0]">
              <div v-for="(item, idx) in items" :key="idx"
                class="group grid items-center gap-3 px-5 py-3 hover:bg-[#F7F9FC] transition-colors"
                style="grid-template-columns: 1.8rem 3fr 4fr 5rem 2rem">

                <div class="text-xs font-semibold text-[#CBD5E1] text-center">{{ idx + 1 }}</div>

                <div class="space-y-1">
                  <SearchSelect v-model="item.productId" :options="products" placeholder="— Free text —" @change="onProductChange(item)">
                    <template #option="{ option }">{{ option.sku }} — {{ option.name }}</template>
                    <template #singleLabel="{ option }">{{ option.sku }} — {{ option.name }}</template>
                  </SearchSelect>
                  <input v-model="item.productName" type="text" placeholder="Product name *"
                    :class="['w-full px-2.5 py-2 border text-sm text-[#1C2434] transition-colors',
                             'focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400',
                             !item.productName?.trim() && errors.items ? 'border-red-300 bg-red-50' : 'border-[#E2E8F0]']" />
                </div>

                <input v-model="item.notes" type="text" placeholder="Notes…"
                  class="w-full px-2.5 py-2 border border-[#E2E8F0] text-sm text-[#637381]
                         focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400
                         transition-colors placeholder-[#CBD5E1]" />

                <input v-model.number="item.qty" type="number" min="0.001" step="any"
                  class="w-full px-2 py-2 border border-[#E2E8F0] text-sm text-right text-[#1C2434] tabular-nums
                         focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400 transition-colors" />

                <button @click="removeItem(idx)" type="button"
                  class="opacity-0 group-hover:opacity-100 w-7 h-7 rounded-lg flex items-center justify-center
                         text-[#CBD5E1] hover:text-red-500 hover:bg-red-50 transition-all flex-shrink-0">
                  <TrashIcon class="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            <div class="grid items-center gap-3 px-5 py-3.5 bg-[#F7F9FC] border-t border-[#E2E8F0]"
              style="grid-template-columns: 1.8rem 3fr 4fr 5rem 2rem">
              <div class="col-span-3 text-[11px] font-semibold text-[#9BA7B0] uppercase tracking-wider text-right">
                {{ t('erp.deliveryOrders.totalItems') }}
              </div>
              <div class="text-sm font-bold text-[#1C2434] tabular-nums text-right">{{ items.length }}</div>
              <div></div>
            </div>

            <p v-if="errors.items" class="px-5 py-2 text-xs text-red-500 bg-red-50 border-t border-red-100">
              {{ errors.items }}
            </p>
          </div>
        </FormCard>

        <ErrorBanner :message="globalError" />

        <!-- Summary + Actions -->
        <FormCard :title="t('erp.deliveryOrders.deliverySummary')" :icon="CalculatorIcon" icon-color="slate" :padded="false">
          <div class="px-6 py-4 grid grid-cols-3 gap-6">
            <div class="flex flex-col gap-0.5">
              <span class="text-[11px] font-semibold text-[#9BA7B0] uppercase tracking-wider">{{ t('erp.common.customer') }}</span>
              <span class="text-sm font-semibold text-[#1C2434]">
                {{ customers.find(c => c.id === form.customerId)?.name || '—' }}
              </span>
            </div>
            <div class="flex flex-col gap-0.5">
              <span class="text-[11px] font-semibold text-[#9BA7B0] uppercase tracking-wider">{{ t('erp.common.items') }}</span>
              <span class="text-sm font-semibold text-[#1C2434]">{{ items.length }}</span>
            </div>
            <div class="flex flex-col gap-0.5">
              <span class="text-[11px] font-semibold text-[#9BA7B0] uppercase tracking-wider">{{ t('erp.deliveryOrders.deliveryDate') }}</span>
              <span class="text-sm font-semibold text-[#1C2434]">{{ form.deliveryDate || '—' }}</span>
            </div>
          </div>

          <div class="px-6 py-5 bg-[#F7F9FC] border-t border-[#E2E8F0] flex items-center justify-between">
            <div>
              <p class="text-[11px] font-semibold text-[#9BA7B0] uppercase tracking-wider mb-0.5">{{ t('erp.deliveryOrders.totalItems') }}</p>
              <p class="text-3xl font-extrabold text-primary-500 tabular-nums leading-none">{{ items.length }}</p>
            </div>
            <div class="flex items-center gap-3">
              <RouterLink to="/erp/delivery-orders"
                class="px-5 py-2.5 text-sm font-medium text-[#637381] hover:text-[#1C2434] transition-colors">
                {{ t('common.discard') }}
              </RouterLink>
              <button @click="save" :disabled="saving"
                class="inline-flex items-center gap-2 px-6 py-2.5 text-sm font-bold
                       bg-primary-500 text-white rounded-xl hover:bg-primary-600 shadow-sm
                       disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
                <ArrowPathIcon v-if="saving" class="w-4 h-4 animate-spin" />
                <CheckIcon v-else class="w-4 h-4" />
                {{ saving ? t('erp.common.creating') : t('erp.deliveryOrders.create') }}
              </button>
            </div>
          </div>
        </FormCard>

      </div>
    </div>
  </AppLayout>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import {
  PlusIcon, TrashIcon,
  CheckIcon, ArrowPathIcon,
  TruckIcon, ClipboardDocumentListIcon, CalculatorIcon,
} from '@heroicons/vue/24/outline'
import AppLayout from '@/layouts/AppLayout.vue'
import SearchSelect from '@/components/SearchSelect.vue'
import PageHeader from '@/components/form/PageHeader.vue'
import FormCard from '@/components/form/FormCard.vue'
import FieldLabel from '@/components/form/FieldLabel.vue'
import ErrorBanner from '@/components/form/ErrorBanner.vue'
import StatusPill from '@/components/form/StatusPill.vue'
import HeaderSaveActions from '@/components/form/HeaderSaveActions.vue'
import api from '@/api'
import { parseApiError } from '@/utils/apiError'

const { t } = useI18n()
const router      = useRouter()
const customers   = ref([])
const orders      = ref([])
const products    = ref([])
const items       = ref([])
const saving      = ref(false)
const globalError = ref('')
const errors      = ref({})

const today = new Date().toISOString().slice(0, 10)
const form  = ref({ customerId: '', date: today, deliveryDate: '', orderId: '', address: '', notes: '' })

onMounted(async () => {
  const [cRes, oRes, pRes] = await Promise.allSettled([
    api.get('/erp/customers',   { params: { limit: 200 } }),
    api.get('/erp/orders',      { params: { limit: 500, status: 'confirmed' } }),
    api.get('/erp/item-master', { params: { limit: 500 } }),
  ])
  if (cRes.status === 'fulfilled') customers.value = cRes.value.data.data.customers || []
  if (oRes.status === 'fulfilled') orders.value    = oRes.value.data.data.orders    || []
  if (pRes.status === 'fulfilled') products.value  = pRes.value.data.data.products  || []
})

function addItem() {
  items.value.push({ productId: '', productName: '', qty: 1, notes: '' })
}

function removeItem(idx) {
  items.value.splice(idx, 1)
}

function onProductChange(item) {
  const p = products.value.find(p => p.id === item.productId)
  if (p) item.productName = p.name
}

function validate() {
  const e = {}
  if (!form.value.customerId) e.customerId = t('erp.deliveryOrders.customerRequired')
  if (!form.value.date)       e.date       = t('erp.deliveryOrders.dateRequired')
  if (!items.value.length) {
    e.items = 'Add at least one item'
  } else {
    for (const item of items.value) {
      if (!item.productName?.trim())       { e.items = 'All items need a product name'; break }
      if (!item.qty || item.qty <= 0)      { e.items = t('erp.deliveryOrders.dateRequired'); break }
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
    const { data } = await api.post('/erp/delivery-orders', {
      ...form.value,
      orderId:      form.value.orderId      || null,
      deliveryDate: form.value.deliveryDate || null,
      items: items.value,
    })
    router.push(`/erp/delivery-orders/${data.data.deliveryOrder.id}`)
  } catch (err) {
    globalError.value = parseApiError(err, 'Failed to create delivery order')
  } finally {
    saving.value = false
  }
}
</script>
