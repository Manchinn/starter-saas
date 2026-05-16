<template>
  <AppLayout>
    <div class="space-y-6">

      <div class="flex items-center gap-3">
        <RouterLink to="/erp/purchasing/orders" class="text-[#9BA7B0] hover:text-[#637381] transition">
          <ArrowLeftIcon class="w-5 h-5" />
        </RouterLink>
        <div class="flex-1 min-w-0">
          <h1 class="text-2xl font-bold text-[#1C2434]">{{ po?.refNo }}</h1>
        </div>
        <span v-if="po" :class="['px-3 py-1.5 rounded-full text-xs font-semibold capitalize', statusClass[po.status]]">
          {{ t(`erp.po.status${capitalize(po.status)}`) }}
        </span>
      </div>

      <div v-if="loading" class="py-12 text-center text-[#9BA7B0]">{{ t('common.loading') }}</div>
      <div v-else-if="notFound" class="bg-red-50 text-red-700 text-sm px-4 py-3 rounded-lg">
        {{ t('erp.po.notFound') }}
        <RouterLink to="/erp/purchasing/orders" class="underline ml-1">{{ t('erp.common.backToList') }}</RouterLink>
      </div>

      <template v-else>

        <!-- Header card -->
        <div class="bg-white rounded-2xl border border-[#E2E8F0] p-6">
          <h2 class="text-xs font-semibold text-[#9BA7B0] uppercase tracking-wide mb-4">{{ t('erp.po.details') }}</h2>
          <dl class="grid grid-cols-2 sm:grid-cols-3 gap-4">
            <div>
              <dt class="text-xs text-[#9BA7B0]">{{ t('erp.po.date') }}</dt>
              <dd class="mt-0.5 text-sm font-medium text-[#1C2434]">{{ po.date }}</dd>
            </div>
            <div>
              <dt class="text-xs text-[#9BA7B0]">{{ t('erp.po.deliveryDate') }}</dt>
              <dd class="mt-0.5 text-sm font-medium text-[#1C2434]">{{ po.deliveryDate || '—' }}</dd>
            </div>
            <div>
              <dt class="text-xs text-[#9BA7B0]">{{ t('erp.po.vendor') }}</dt>
              <dd class="mt-0.5 text-sm font-medium text-[#1C2434]">
                {{ po.vendor?.name || '—' }}
                <span v-if="po.vendor?.code" class="ml-1 text-xs text-[#9BA7B0] font-mono">({{ po.vendor.code }})</span>
              </dd>
            </div>
            <div>
              <dt class="text-xs text-[#9BA7B0]">{{ t('erp.po.linkedRequisition') }}</dt>
              <dd class="mt-0.5 text-sm font-medium">
                <RouterLink v-if="po.requisition" :to="`/erp/purchasing/requisitions/${po.requisition.id}`"
                  class="text-primary-600 hover:underline font-mono">{{ po.requisition.refNo }}</RouterLink>
                <span v-else class="text-[#9BA7B0]">—</span>
              </dd>
            </div>
            <div class="col-span-2">
              <dt class="text-xs text-[#9BA7B0]">{{ t('erp.po.notes') }}</dt>
              <dd class="mt-0.5 text-sm text-[#637381]">{{ po.notes || '—' }}</dd>
            </div>
          </dl>
        </div>

        <!-- Items card -->
        <div class="bg-white rounded-2xl border border-[#E2E8F0] p-6">
          <h2 class="text-xs font-semibold text-[#9BA7B0] uppercase tracking-wide mb-4">{{ t('erp.po.items') }}</h2>
          <div class="overflow-x-auto">
            <table class="w-full text-sm">
              <thead>
                <tr class="border-b border-[#E2E8F0]">
                  <th class="text-left text-xs font-medium text-[#637381] pb-2 pr-3">#</th>
                  <th class="text-left text-xs font-medium text-[#637381] pb-2 pr-3">{{ t('erp.po.colItem') }}</th>
                  <th class="text-left text-xs font-medium text-[#637381] pb-2 pr-3">{{ t('erp.po.colDescription') }}</th>
                  <th class="text-right text-xs font-medium text-[#637381] pb-2 pr-3">{{ t('erp.po.colQty') }}</th>
                  <th class="text-right text-xs font-medium text-[#637381] pb-2 pr-3">{{ t('erp.po.colUnitPrice') }}</th>
                  <th class="text-right text-xs font-medium text-[#637381] pb-2">{{ t('erp.po.colSubtotal') }}</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(item, idx) in po.items" :key="item.id" class="border-b border-[#F1F5F9]">
                  <td class="py-2.5 pr-3 text-[#9BA7B0] text-xs">{{ idx + 1 }}</td>
                  <td class="py-2.5 pr-3">
                    <p v-if="item.product" class="font-mono text-xs text-[#9BA7B0]">{{ item.product.sku }}</p>
                    <p class="font-medium text-[#1C2434]">{{ item.product?.name || '—' }}</p>
                  </td>
                  <td class="py-2.5 pr-3 text-[#637381]">{{ item.description || '—' }}</td>
                  <td class="py-2.5 pr-3 text-right font-medium text-[#1C2434]">{{ Number(item.qty).toLocaleString() }}</td>
                  <td class="py-2.5 pr-3 text-right text-[#637381]">
                    {{ Number(item.unitPrice).toLocaleString(undefined, { minimumFractionDigits: 2 }) }}
                  </td>
                  <td class="py-2.5 text-right font-medium text-[#1C2434]">
                    {{ (Number(item.qty) * Number(item.unitPrice)).toLocaleString(undefined, { minimumFractionDigits: 2 }) }}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- Grand total -->
          <div class="flex justify-end mt-4">
            <div class="w-72 space-y-2">
              <div class="flex justify-between text-sm text-[#637381]">
                <span>{{ t('erp.po.totalItems') }}</span>
                <span class="font-medium text-[#1C2434]">{{ po.items.length }}</span>
              </div>
              <div class="flex justify-between text-sm border-t border-[#E2E8F0] pt-2">
                <span class="font-semibold text-[#374151]">{{ t('erp.po.grandTotal') }}</span>
                <span class="font-bold text-[#1C2434]">{{ grandTotal }}</span>
              </div>
            </div>
          </div>
        </div>

        <div v-if="actionError" class="bg-red-50 text-red-700 text-sm px-4 py-2 rounded-lg">{{ actionError }}</div>

        <!-- Action bar -->
        <div class="flex justify-between items-center">
          <!-- Left: delete (draft only) -->
          <div>
            <button v-if="po.status === 'draft'" v-can="'erp.purchasing.delete'" @click="doDelete"
              class="px-4 py-2 text-sm text-red-500 border border-red-200 rounded-lg hover:bg-red-50 transition">
              {{ t('erp.po.delete') }}
            </button>
          </div>

          <!-- Right: workflow actions -->
          <div class="flex gap-3">
            <!-- draft → cancel or confirm -->
            <template v-if="po.status === 'draft'">
              <button v-can="'erp.purchasing.edit'" @click="doCancel" :disabled="acting"
                class="px-4 py-2 text-sm border border-[#E2E8F0] rounded-lg hover:bg-slate-50 transition disabled:opacity-50">
                {{ t('erp.po.cancel') }}
              </button>
              <button v-can="'erp.purchasing.edit'" @click="doConfirm" :disabled="acting"
                class="px-5 py-2 text-sm bg-primary-500 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 transition">
                {{ acting ? t('common.loading') : t('erp.po.confirm') }}
              </button>
            </template>

            <!-- confirmed → cancel or receive -->
            <template v-else-if="po.status === 'confirmed'">
              <button v-can="'erp.stock.edit'" @click="convertToGoodReceive" :disabled="acting || converting"
                class="px-4 py-2 text-sm bg-primary-50 text-primary-600 border border-primary-200 rounded-lg hover:bg-primary-100 transition disabled:opacity-50">
                {{ converting ? t('common.loading') : t('erp.po.createGoodReceive') }}
              </button>
              <button v-can="'erp.purchasing.edit'" @click="doCancel" :disabled="acting"
                class="px-4 py-2 text-sm border border-[#E2E8F0] rounded-lg hover:bg-slate-50 transition disabled:opacity-50">
                {{ t('erp.po.cancel') }}
              </button>
              <button v-can="'erp.purchasing.edit'" @click="doReceive" :disabled="acting"
                class="px-5 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition">
                {{ acting ? t('common.loading') : t('erp.po.markReceived') }}
              </button>
            </template>

            <!-- received → create good receive -->
            <template v-else-if="po.status === 'received'">
              <button v-can="'erp.stock.edit'" @click="convertToGoodReceive" :disabled="acting || converting"
                class="px-5 py-2 text-sm bg-primary-50 text-primary-600 border border-primary-200 rounded-lg hover:bg-primary-100 transition disabled:opacity-50">
                {{ converting ? t('common.loading') : t('erp.po.createGoodReceive') }}
              </button>
            </template>
          </div>
        </div>

        <AttachmentsPanel v-if="po" ref-type="PurchaseOrder" :ref-id="po.id" />
      </template>
    </div>
  </AppLayout>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { ArrowLeftIcon } from '@heroicons/vue/24/outline'
import AppLayout from '@/layouts/AppLayout.vue'
import AttachmentsPanel from '@/components/AttachmentsPanel.vue'
import api from '@/api'

const { t }  = useI18n()
const route  = useRoute()
const router = useRouter()

const po          = ref(null)
const loading     = ref(true)
const notFound    = ref(false)
const acting      = ref(false)
const actionError = ref('')
const converting  = ref(false)

async function convertToGoodReceive() {
  actionError.value = ''
  converting.value = true
  try {
    const { data } = await api.post(`/erp/purchasing/orders/${route.params.id}/create-good-receive`)
    router.push(`/erp/good-receive/${data.data.id}`)
  } catch (err) {
    actionError.value = err.response?.data?.message || 'Failed to create Good Receive'
  } finally { converting.value = false }
}

const statusClass = {
  draft:     'bg-slate-100 text-slate-600',
  confirmed: 'bg-blue-50 text-blue-700',
  received:  'bg-green-50 text-green-700',
  cancelled: 'bg-red-50 text-red-600',
}

const capitalize = s => s.charAt(0).toUpperCase() + s.slice(1)

onMounted(async () => {
  try {
    const { data } = await api.get(`/erp/purchasing/orders/${route.params.id}`)
    po.value = data.data.order
  } catch {
    notFound.value = true
  } finally {
    loading.value = false
  }
})

const grandTotal = computed(() => {
  const sum = (po.value?.items || []).reduce((s, i) => s + Number(i.qty) * Number(i.unitPrice), 0)
  return sum.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
})

async function doAction(endpoint) {
  actionError.value = ''
  acting.value = true
  try {
    const { data } = await api.post(`/erp/purchasing/orders/${route.params.id}/${endpoint}`)
    po.value = data.data.order
  } catch (err) {
    actionError.value = err.response?.data?.message || 'Action failed'
  } finally {
    acting.value = false
  }
}

const doConfirm = () => doAction('confirm')
const doReceive = () => doAction('receive')
const doCancel  = () => doAction('cancel')

async function doDelete() {
  if (!confirm(`Delete "${po.value?.refNo}"? This cannot be undone.`)) return
  try {
    await api.delete(`/erp/purchasing/orders/${route.params.id}`)
    router.push('/erp/purchasing/orders')
  } catch (err) {
    actionError.value = err.response?.data?.message || 'Delete failed'
  }
}
</script>
