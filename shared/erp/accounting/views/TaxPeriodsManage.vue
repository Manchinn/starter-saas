<template>
  <AppLayout>
    <div class="space-y-5">
      <div class="flex items-center justify-between gap-4">
        <div>
          <h1 class="text-xl font-semibold text-[#1C2434]">{{ t('erp.taxPeriods.title') }}</h1>
          <p class="text-sm text-[#637381] mt-0.5">{{ t('erp.taxPeriods.subtitle') }}</p>
        </div>
        <button @click="addDraft" class="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium bg-primary-500 text-white rounded-lg hover:bg-primary-700 transition">
          <PlusIcon class="w-4 h-4" /> {{ t('erp.taxPeriods.addPeriod') }}
        </button>
      </div>

      <div class="bg-white rounded-2xl border border-[#E2E8F0] shadow-sm overflow-hidden">
        <table class="w-full text-sm">
          <thead class="bg-[#F7F9FC] text-left">
            <tr>
              <th class="px-4 py-2.5 font-medium text-[#637381]">{{ t('erp.taxPeriods.colName') }}</th>
              <th class="px-4 py-2.5 font-medium text-[#637381] w-40">{{ t('erp.taxPeriods.colStart') }}</th>
              <th class="px-4 py-2.5 font-medium text-[#637381] w-40">{{ t('erp.taxPeriods.colEnd') }}</th>
              <th class="px-4 py-2.5 font-medium text-[#637381] w-32 text-center">{{ t('erp.taxPeriods.colStatus') }}</th>
              <th class="px-4 py-2.5 font-medium text-[#637381]">{{ t('erp.taxPeriods.colNotes') }}</th>
              <th class="px-4 py-2.5 w-44"></th>
            </tr>
          </thead>
          <tbody class="divide-y divide-[#E2E8F0]">
            <tr v-if="loading"><td colspan="6" class="py-8 text-center text-[#9BA7B0]">{{ t('common.loading') }}</td></tr>
            <tr v-else-if="!periods.length && !drafts.length"><td colspan="6" class="py-8 text-center text-[#9BA7B0]">{{ t('erp.taxPeriods.noPeriods') }}</td></tr>
            <tr v-for="(p, i) in [...periods, ...drafts]" :key="p.id || `draft-${i}`" class="hover:bg-[#F7F9FC]">
              <td class="px-4 py-2"><input v-model="p.name" :disabled="p.status === 'closed' && !isDraft(p)" type="text" :placeholder="t('erp.taxPeriods.namePh')" class="w-full px-2 py-1.5 border rounded-lg text-sm disabled:bg-[#F7F9FC]" /></td>
              <td class="px-4 py-2"><DateInput v-model="p.startDate" :disabled="p.status === 'closed' && !isDraft(p)" class="w-full px-2 py-1.5 border rounded-lg text-sm disabled:bg-[#F7F9FC]" /></td>
              <td class="px-4 py-2"><DateInput v-model="p.endDate" :disabled="p.status === 'closed' && !isDraft(p)" class="w-full px-2 py-1.5 border rounded-lg text-sm disabled:bg-[#F7F9FC]" /></td>
              <td class="px-4 py-2 text-center">
                <span :class="['inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold capitalize',
                  p.status === 'closed' ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700']">
                  <span class="w-1.5 h-1.5 rounded-full mr-1.5" :class="p.status === 'closed' ? 'bg-red-500' : 'bg-green-500'" />
                  {{ p.status || 'open' }}
                </span>
              </td>
              <td class="px-4 py-2"><input v-model="p.notes" :disabled="p.status === 'closed' && !isDraft(p)" type="text" :placeholder="t('erp.taxPeriods.notesPh')" class="w-full px-2 py-1.5 border rounded-lg text-sm disabled:bg-[#F7F9FC]" /></td>
              <td class="px-4 py-2 text-right">
                <div class="flex items-center justify-end gap-1">
                  <RouterLink v-if="!isDraft(p)" :to="`/erp/accounting/tax-periods/${p.id}/vat-report`"
                    class="px-2 py-1 text-xs font-semibold bg-slate-50 text-slate-700 border border-[#E2E8F0] rounded-md hover:bg-slate-100" :title="t('erp.taxPeriods.viewReport')">
                    <DocumentChartBarIcon class="w-4 h-4 inline" />
                  </RouterLink>
                  <button v-if="isDraft(p) || p.status !== 'closed'" @click="save(p)" :disabled="p._saving" class="px-2.5 py-1 text-xs font-semibold bg-primary-500 text-white rounded-md hover:bg-primary-700 disabled:opacity-50">{{ p._saving ? '…' : (isDraft(p) ? t('common.create') : t('common.save')) }}</button>
                  <button v-if="!isDraft(p) && p.status === 'open'" @click="close(p)" :disabled="p._saving" class="px-2.5 py-1 text-xs font-semibold bg-red-50 text-red-600 border border-red-200 rounded-md hover:bg-red-100 disabled:opacity-50">{{ t('erp.taxPeriods.closeBtn') }}</button>
                  <button v-if="!isDraft(p) && p.status === 'closed'" @click="reopen(p)" :disabled="p._saving" class="px-2.5 py-1 text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200 rounded-md hover:bg-amber-100 disabled:opacity-50">{{ t('erp.taxPeriods.reopenBtn') }}</button>
                  <button v-if="isDraft(p) || p.status === 'open'" @click="remove(p)" class="p-1 text-[#9BA7B0] hover:text-red-500 rounded"><TrashIcon class="w-4 h-4" /></button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div v-if="error" class="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-2 rounded-lg">{{ error }}</div>
    </div>
  </AppLayout>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { PlusIcon, TrashIcon, DocumentChartBarIcon } from '@heroicons/vue/24/outline'
import { RouterLink } from 'vue-router'
import AppLayout from '@/layouts/AppLayout.vue'
import DateInput from '@/components/DateInput.vue'
import api from '@/api'

const { t } = useI18n()
const periods = ref([])
const drafts  = ref([])
const loading = ref(false)
const error   = ref('')

const isDraft = (r) => !r.id

async function load() {
  loading.value = true
  try {
    const { data } = await api.get('/erp/accounting/tax-periods')
    periods.value = data.data.periods
  } finally { loading.value = false }
}
onMounted(load)

function addDraft() { drafts.value.push({ name: '', startDate: '', endDate: '', notes: '', status: 'open' }) }

async function save(p) {
  error.value = ''
  p._saving = true
  try {
    if (isDraft(p)) {
      await api.post('/erp/accounting/tax-periods', { name: p.name, startDate: p.startDate, endDate: p.endDate, notes: p.notes || null })
    } else {
      await api.put(`/erp/accounting/tax-periods/${p.id}`, { name: p.name, startDate: p.startDate, endDate: p.endDate, notes: p.notes || null })
    }
    drafts.value = []
    await load()
  } catch (err) { error.value = err.response?.data?.message || 'Save failed' }
  finally { p._saving = false }
}

async function close(p) {
  if (!confirm(`Close "${p.name}"? Transactions in this period will be locked.`)) return
  p._saving = true
  try { await api.post(`/erp/accounting/tax-periods/${p.id}/close`); await load() }
  catch (err) { error.value = err.response?.data?.message || 'Close failed' }
  finally { p._saving = false }
}

async function reopen(p) {
  if (!confirm(`Re-open "${p.name}"? Transactions in this period will become editable again.`)) return
  p._saving = true
  try { await api.post(`/erp/accounting/tax-periods/${p.id}/reopen`); await load() }
  catch (err) { error.value = err.response?.data?.message || 'Reopen failed' }
  finally { p._saving = false }
}

async function remove(p) {
  if (isDraft(p)) { drafts.value = drafts.value.filter(d => d !== p); return }
  if (!confirm(`Delete "${p.name}"?`)) return
  try { await api.delete(`/erp/accounting/tax-periods/${p.id}`); await load() }
  catch (err) { error.value = err.response?.data?.message || 'Delete failed' }
}
</script>
