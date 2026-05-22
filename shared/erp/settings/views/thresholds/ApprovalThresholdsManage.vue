<template>
  <AppLayout>
    <div class="space-y-5">
      <div class="flex items-center justify-between gap-4">
        <div>
          <h1 class="text-xl font-semibold text-[#1C2434]">{{ t('erp.thresholds.title') }}</h1>
          <p class="text-sm text-[#637381] mt-0.5">{{ t('erp.thresholds.subtitle') }}</p>
        </div>
        <button @click="addRow"
          class="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-semibold bg-primary-500 text-white hover:bg-primary-700 transition">
          <PlusIcon class="w-4 h-4" />
          {{ t('erp.thresholds.addRule') }}
        </button>
      </div>

      <div class="bg-white rounded-2xl border border-[#E2E8F0] shadow-sm overflow-hidden">
        <table class="w-full text-sm">
          <thead class="bg-[#F7F9FC] border-b border-[#E2E8F0] text-left">
            <tr>
              <th class="px-4 py-2.5 font-medium text-[#637381] w-44">{{ t('erp.thresholds.colDocType') }}</th>
              <th class="px-4 py-2.5 font-medium text-[#637381] w-40 text-right">
                {{ t('erp.thresholds.colAmount') }} <span class="text-[10px] font-normal text-[#9BA7B0]">{{ t('erp.thresholds.colAmountHint') }}</span>
              </th>
              <th class="px-4 py-2.5 font-medium text-[#637381]">{{ t('erp.thresholds.colPermission') }}</th>
              <th class="px-4 py-2.5 font-medium text-[#637381]">{{ t('erp.thresholds.colNotes') }}</th>
              <th class="px-4 py-2.5 w-32"></th>
            </tr>
          </thead>
          <tbody class="divide-y divide-[#E2E8F0]">
            <tr v-if="loading">
              <td colspan="5" class="py-8 text-center text-[#9BA7B0]">{{ t('common.loading') }}</td>
            </tr>
            <tr v-else-if="!rows.length && !drafts.length">
              <td colspan="5" class="py-8 text-center text-[#9BA7B0]">{{ t('erp.thresholds.noRules') }}</td>
            </tr>
            <tr v-for="(r, i) in [...rows, ...drafts]" :key="r.id || `draft-${i}`" class="hover:bg-[#F7F9FC]">
              <td class="px-4 py-2">
                <SearchSelect v-model="r.docType" :options="docTypeOptions" :disabled="!isDraft(r)" :allow-empty="false" />
              </td>
              <td class="px-4 py-2">
                <input v-model.number="r.amount" type="number" min="0" step="0.01"
                  class="w-full px-2 py-1.5 border text-sm text-right focus:outline-none focus:ring-1 focus:ring-primary-500" />
              </td>
              <td class="px-4 py-2">
                <SearchSelect v-model="r.requiredPermission" :options="permissionOptions" :allow-empty="false" />
              </td>
              <td class="px-4 py-2">
                <input v-model="r.notes" type="text" :placeholder="t('erp.thresholds.notesPh')"
                  class="w-full px-2 py-1.5 border text-sm focus:outline-none focus:ring-1 focus:ring-primary-500" />
              </td>
              <td class="px-4 py-2 text-right">
                <div class="flex items-center justify-end gap-1">
                  <button @click="save(r)" :disabled="r._saving"
                    class="px-2.5 py-1 text-xs font-semibold bg-primary-500 text-white hover:bg-primary-700 disabled:opacity-50 transition">
                    {{ r._saving ? '…' : (isDraft(r) ? t('common.create') : t('common.save')) }}
                  </button>
                  <button @click="remove(r)" :disabled="r._saving"
                    class="p-1 text-[#9BA7B0] hover:text-red-500 transition">
                    <TrashIcon class="w-4 h-4" />
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div v-if="error" class="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-2">{{ error }}</div>
    </div>
  </AppLayout>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { PlusIcon, TrashIcon } from '@heroicons/vue/24/outline'
import AppLayout from '@/layouts/AppLayout.vue'
import SearchSelect from '@/components/SearchSelect.vue'
import api from '@/api'

const { t } = useI18n()
const rows    = ref([])
const drafts  = ref([])
const loading = ref(false)
const error   = ref('')

const docTypeOptions = computed(() => [
  { id: 'purchase_order', name: t('erp.thresholds.docPO')   },
  { id: 'vendor_bill',    name: t('erp.thresholds.docBill') },
])
const permissionOptions = computed(() => [
  { id: 'erp.purchasing.approve', name: t('erp.thresholds.permPurchasingApprove') },
  { id: 'erp.bills.approve',      name: t('erp.thresholds.permBillsApprove')      },
])

const isDraft = (r) => !r.id

async function load() {
  loading.value = true
  try {
    const { data } = await api.get('/erp/settings/approval-thresholds')
    rows.value = data.data.thresholds
  } finally { loading.value = false }
}
onMounted(load)

function addRow() {
  drafts.value.push({ docType: 'purchase_order', amount: 0, requiredPermission: 'erp.purchasing.approve', notes: '' })
}

async function save(r) {
  error.value = ''
  r._saving = true
  try {
    if (isDraft(r)) {
      await api.post('/erp/settings/approval-thresholds', {
        docType: r.docType, amount: r.amount, requiredPermission: r.requiredPermission, notes: r.notes || null,
      })
    } else {
      await api.put(`/erp/settings/approval-thresholds/${r.id}`, {
        amount: r.amount, requiredPermission: r.requiredPermission, notes: r.notes || null,
      })
    }
    drafts.value = []
    await load()
  } catch (err) {
    error.value = err.response?.data?.message || t('erp.thresholds.saveFailed')
  } finally { r._saving = false }
}

async function remove(r) {
  if (isDraft(r)) {
    drafts.value = drafts.value.filter(d => d !== r)
    return
  }
  if (!confirm(t('erp.thresholds.deleteConfirm'))) return
  try {
    await api.delete(`/erp/settings/approval-thresholds/${r.id}`)
    await load()
  } catch (err) {
    error.value = err.response?.data?.message || t('erp.thresholds.deleteFailed')
  }
}
</script>
