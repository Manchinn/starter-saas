<template>
  <AppLayout>
    <div class="space-y-6">

      <div class="flex items-center gap-3">
        <RouterLink to="/erp/purchasing/requisitions" class="text-[#9BA7B0] hover:text-[#637381] transition">
          <ArrowLeftIcon class="w-5 h-5" />
        </RouterLink>
        <div class="flex-1 min-w-0">
          <h1 class="text-2xl font-bold text-[#1C2434]">{{ req?.refNo }}</h1>
        </div>
        <span v-if="req" :class="['px-3 py-1.5 rounded-full text-xs font-semibold capitalize', statusClass[req.status]]">
          {{ t(`erp.purchasing.status${capitalize(req.status)}`) }}
        </span>
      </div>

      <div v-if="loading" class="py-12 text-center text-[#9BA7B0]">{{ t('common.loading') }}</div>
      <div v-else-if="notFound" class="bg-red-50 text-red-700 text-sm px-4 py-3 rounded-lg">
        {{ t('erp.purchasing.notFound') }}
        <RouterLink to="/erp/purchasing/requisitions" class="underline ml-1">{{ t('erp.common.backToList') }}</RouterLink>
      </div>

      <template v-else>

        <!-- Header card -->
        <div class="bg-white rounded-2xl border border-[#E2E8F0] p-6">
          <h2 class="text-xs font-semibold text-[#9BA7B0] uppercase tracking-wide mb-4">{{ t('erp.purchasing.details') }}</h2>
          <dl class="grid grid-cols-2 sm:grid-cols-3 gap-4">
            <div>
              <dt class="text-xs text-[#9BA7B0]">{{ t('erp.purchasing.date') }}</dt>
              <dd class="mt-0.5 text-sm font-medium text-[#1C2434]">{{ req.date }}</dd>
            </div>
            <div>
              <dt class="text-xs text-[#9BA7B0]">{{ t('erp.purchasing.requestedBy') }}</dt>
              <dd class="mt-0.5 text-sm font-medium text-[#1C2434]">{{ req.requestedBy || '—' }}</dd>
            </div>
            <div>
              <dt class="text-xs text-[#9BA7B0]">{{ t('erp.purchasing.department') }}</dt>
              <dd class="mt-0.5 text-sm font-medium text-[#1C2434]">{{ req.department || '—' }}</dd>
            </div>
            <div>
              <dt class="text-xs text-[#9BA7B0]">{{ t('erp.purchasing.vendor') }}</dt>
              <dd class="mt-0.5 text-sm font-medium text-[#1C2434]">{{ req.vendor?.name || '—' }}</dd>
            </div>
            <div class="col-span-2">
              <dt class="text-xs text-[#9BA7B0]">{{ t('erp.purchasing.notes') }}</dt>
              <dd class="mt-0.5 text-sm text-[#637381]">{{ req.notes || '—' }}</dd>
            </div>
          </dl>
        </div>

        <!-- Items card -->
        <div class="bg-white rounded-2xl border border-[#E2E8F0] p-6">
          <h2 class="text-xs font-semibold text-[#9BA7B0] uppercase tracking-wide mb-4">{{ t('erp.purchasing.items') }}</h2>
          <div class="overflow-x-auto">
            <table class="w-full text-sm">
              <thead>
                <tr class="border-b border-[#E2E8F0]">
                  <th class="text-left text-xs font-medium text-[#637381] pb-2 pr-3">#</th>
                  <th class="text-left text-xs font-medium text-[#637381] pb-2 pr-3">{{ t('erp.purchasing.colItem') }}</th>
                  <th class="text-left text-xs font-medium text-[#637381] pb-2 pr-3">{{ t('erp.purchasing.colDescription') }}</th>
                  <th class="text-right text-xs font-medium text-[#637381] pb-2 pr-3">{{ t('erp.purchasing.colQty') }}</th>
                  <th class="text-right text-xs font-medium text-[#637381] pb-2 pr-3">{{ t('erp.purchasing.colUnitPrice') }}</th>
                  <th class="text-right text-xs font-medium text-[#637381] pb-2">{{ t('erp.purchasing.colSubtotal') }}</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(item, idx) in req.items" :key="item.id" class="border-b border-[#F1F5F9]">
                  <td class="py-2.5 pr-3 text-[#9BA7B0] text-xs">{{ idx + 1 }}</td>
                  <td class="py-2.5 pr-3">
                    <p v-if="item.product" class="font-mono text-xs text-[#9BA7B0]">{{ item.product.sku }}</p>
                    <p class="font-medium text-[#1C2434]">{{ item.product?.name || '—' }}</p>
                  </td>
                  <td class="py-2.5 pr-3 text-[#637381]">{{ item.description || '—' }}</td>
                  <td class="py-2.5 pr-3 text-right font-medium text-[#1C2434]">{{ Number(item.qty).toLocaleString() }}</td>
                  <td class="py-2.5 pr-0 text-right text-[#637381]">
                    {{ item.unitPrice != null ? Number(item.unitPrice).toLocaleString(undefined, { minimumFractionDigits: 2 }) : '—' }}
                  </td>
                  <td class="py-2.5 text-right font-medium text-[#1C2434]">
                    {{ item.unitPrice != null ? (Number(item.qty) * Number(item.unitPrice)).toLocaleString(undefined, { minimumFractionDigits: 2 }) : '—' }}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <div class="flex justify-end mt-4">
            <div class="w-64 space-y-1">
              <div class="flex justify-between text-sm text-[#637381]">
                <span>{{ t('erp.purchasing.totalQty') }}</span>
                <span class="font-medium text-[#1C2434]">{{ totalQty }}</span>
              </div>
              <div v-if="hasPrice" class="flex justify-between text-sm border-t border-[#E2E8F0] pt-1 mt-1">
                <span class="font-semibold text-[#374151]">{{ t('erp.purchasing.estimatedTotal') }}</span>
                <span class="font-bold text-[#1C2434]">{{ estimatedTotal }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Linked Purchase Orders -->
        <div class="bg-white rounded-2xl border border-[#E2E8F0] p-6">
          <div class="flex items-center justify-between mb-4">
            <h2 class="text-xs font-semibold text-[#9BA7B0] uppercase tracking-wide">Linked Purchase Orders</h2>
            <button
              v-if="req.status === 'approved'"
              v-can="'erp.purchasing.edit'"
              @click="convertToOrder" :disabled="converting"
              class="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-primary-500
                     bg-primary-50 hover:bg-primary-100 border border-primary-200 rounded-lg transition-colors disabled:opacity-50">
              <PlusIcon class="w-3.5 h-3.5" />
              {{ converting ? t('common.loading') : t('erp.purchasing.createOrder') }}
            </button>
          </div>

          <div v-if="linkedOrders.length" class="space-y-2">
            <div v-for="order in linkedOrders" :key="order.id"
              class="flex items-center justify-between py-3 px-4 bg-[#F7F9FC] rounded-xl border border-[#E2E8F0]">
              <div class="flex items-center gap-4">
                <RouterLink :to="`/erp/purchasing/orders/${order.id}`"
                  class="font-mono text-sm font-semibold text-primary-600 hover:underline">
                  {{ order.refNo }}
                </RouterLink>
                <span class="text-sm text-[#637381]">{{ order.vendor?.name || '—' }}</span>
                <span class="text-xs text-[#9BA7B0]">{{ order.date }}</span>
              </div>
              <span :class="['px-2.5 py-0.5 rounded-full text-xs font-semibold capitalize', poStatusClass[order.status]]">
                {{ order.status }}
              </span>
            </div>
          </div>
          <div v-else class="py-8 text-center">
            <div class="w-10 h-10 bg-[#F1F5F9] rounded-xl flex items-center justify-center mx-auto mb-3">
              <DocumentTextIcon class="w-5 h-5 text-[#CBD5E1]" />
            </div>
            <p class="text-sm text-[#9BA7B0]">No purchase orders created from this requisition yet</p>
            <button
              v-if="req.status === 'approved'"
              v-can="'erp.purchasing.edit'"
              @click="convertToOrder" :disabled="converting"
              class="inline-flex items-center gap-1.5 mt-3 px-4 py-2 text-sm font-semibold text-primary-500
                     bg-primary-50 hover:bg-primary-100 border border-primary-200 rounded-lg transition-colors disabled:opacity-50">
              <PlusIcon class="w-4 h-4" />
              {{ converting ? t('common.loading') : t('erp.purchasing.createOrder') }}
            </button>
          </div>
        </div>

        <div v-if="actionError" class="bg-red-50 text-red-700 text-sm px-4 py-2 rounded-lg">{{ actionError }}</div>

        <!-- Actions (draft only) -->
        <div v-if="req.status === 'draft'" class="flex justify-between items-center">
          <button v-can="'erp.purchasing.delete'" @click="confirmDelete"
            class="px-4 py-2 text-sm text-red-500 border border-red-200 rounded-lg hover:bg-red-50 transition">
            {{ t('erp.purchasing.delete') }}
          </button>
          <div class="flex gap-3">
            <button v-can="'erp.purchasing.edit'" @click="doReject" :disabled="acting"
              class="px-4 py-2 text-sm border border-[#E2E8F0] rounded-lg hover:bg-slate-50 transition disabled:opacity-50">
              {{ acting ? t('common.loading') : t('erp.purchasing.reject') }}
            </button>
            <button v-can="'erp.purchasing.edit'" @click="doApprove" :disabled="acting"
              class="px-5 py-2 text-sm bg-primary-500 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 transition">
              {{ acting ? t('common.loading') : t('erp.purchasing.approve') }}
            </button>
          </div>
        </div>

      </template>
    </div>
  </AppLayout>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter, RouterLink } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { ArrowLeftIcon, PlusIcon, DocumentTextIcon } from '@heroicons/vue/24/outline'
import AppLayout from '@/layouts/AppLayout.vue'
import api from '@/api'

const { t }    = useI18n()
const route    = useRoute()
const router   = useRouter()

const req          = ref(null)
const linkedOrders = ref([])
const loading      = ref(true)
const notFound     = ref(false)
const acting       = ref(false)
const actionError  = ref('')
const converting   = ref(false)

async function convertToOrder() {
  actionError.value = ''
  converting.value = true
  try {
    const { data } = await api.post(`/erp/purchasing/requisitions/${route.params.id}/create-order`)
    router.push(`/erp/purchasing/orders/${data.data.id}`)
  } catch (err) {
    actionError.value = err.response?.data?.message || 'Failed to create purchase order'
  } finally { converting.value = false }
}

const statusClass = {
  draft:    'bg-slate-100 text-slate-600',
  approved: 'bg-green-50 text-green-700',
  rejected: 'bg-red-50 text-red-600',
}

const poStatusClass = {
  draft:     'bg-slate-100 text-slate-600',
  confirmed: 'bg-blue-50 text-blue-700',
  received:  'bg-green-50 text-green-700',
  cancelled: 'bg-red-50 text-red-600',
}

const capitalize = s => s.charAt(0).toUpperCase() + s.slice(1)

onMounted(async () => {
  try {
    const [reqRes, ordersRes] = await Promise.allSettled([
      api.get(`/erp/purchasing/requisitions/${route.params.id}`),
      api.get(`/erp/purchasing/requisitions/${route.params.id}/orders`),
    ])
    if (reqRes.status === 'fulfilled') req.value = reqRes.value.data.data.requisition
    else notFound.value = true
    if (ordersRes.status === 'fulfilled') linkedOrders.value = ordersRes.value.data.data.orders
  } finally {
    loading.value = false
  }
})

const totalQty = computed(() => (req.value?.items || []).reduce((s, i) => s + Number(i.qty), 0).toLocaleString())
const hasPrice = computed(() => (req.value?.items || []).some(i => i.unitPrice != null))
const estimatedTotal = computed(() => {
  const sum = (req.value?.items || []).reduce((s, i) => s + Number(i.qty) * (Number(i.unitPrice) || 0), 0)
  return sum.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
})

async function doApprove() {
  actionError.value = ''
  acting.value = true
  try {
    const { data } = await api.post(`/erp/purchasing/requisitions/${route.params.id}/approve`)
    req.value = data.data.requisition
  } catch (err) {
    actionError.value = err.response?.data?.message || 'Action failed'
  } finally {
    acting.value = false
  }
}

async function doReject() {
  actionError.value = ''
  acting.value = true
  try {
    const { data } = await api.post(`/erp/purchasing/requisitions/${route.params.id}/reject`)
    req.value = data.data.requisition
  } catch (err) {
    actionError.value = err.response?.data?.message || 'Action failed'
  } finally {
    acting.value = false
  }
}

async function confirmDelete() {
  if (!confirm(`Delete "${req.value?.refNo}"? This cannot be undone.`)) return
  try {
    await api.delete(`/erp/purchasing/requisitions/${route.params.id}`)
    router.push('/erp/purchasing/requisitions')
  } catch (err) {
    actionError.value = err.response?.data?.message || 'Delete failed'
  }
}
</script>
