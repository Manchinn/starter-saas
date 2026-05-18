<template>
  <AppLayout>
    <div class="space-y-6">

      <div class="flex items-center gap-3">
        <RouterLink to="/erp/accounting/journals"
          class="text-[#9BA7B0] hover:text-[#637381] transition">
          <ArrowLeftIcon class="w-5 h-5" />
        </RouterLink>
        <h1 class="text-2xl font-bold text-[#1C2434]">{{ t('erp.journals.new') }}</h1>
      </div>

      <div class="bg-white rounded-2xl border border-[#E2E8F0] p-6 space-y-5">

        <!-- Header fields -->
        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium text-[#374151] mb-1">{{ t('erp.common.date') }} <span class="text-red-500">*</span></label>
            <DateInput v-model="form.date"
              class="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
          </div>
          <div class="col-span-2">
            <label class="block text-sm font-medium text-[#374151] mb-1">{{ t('erp.journals.colDescription') }}</label>
            <input v-model="form.description" type="text" :placeholder="t('erp.journals.descriptionPh')"
              class="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
          </div>
        </div>

        <!-- Lines -->
        <div>
          <div class="flex items-center justify-between mb-2">
            <label class="block text-sm font-medium text-[#374151]">{{ t('erp.journals.lines') }} <span class="text-red-500">*</span></label>
            <button @click="addLine" type="button"
              class="text-xs text-primary-500 hover:text-primary-700 flex items-center gap-1 transition">
              <PlusIcon class="w-3.5 h-3.5" />
              {{ t('erp.journals.addLine') }}
            </button>
          </div>

          <div class="rounded-xl border border-[#E2E8F0] overflow-hidden">
            <table class="w-full text-sm">
              <thead class="bg-[#F7F9FC] border-b border-[#E2E8F0]">
                <tr>
                  <th class="px-4 py-2.5 text-left text-[11px] font-semibold text-[#637381] uppercase tracking-wider w-8">#</th>
                  <th class="px-4 py-2.5 text-left text-[11px] font-semibold text-[#637381] uppercase tracking-wider">{{ t('erp.journals.colAccount') }}</th>
                  <th class="px-4 py-2.5 text-left text-[11px] font-semibold text-[#637381] uppercase tracking-wider">{{ t('erp.journals.colDescription') }}</th>
                  <th class="px-4 py-2.5 text-right text-[11px] font-semibold text-[#637381] uppercase tracking-wider w-36">{{ t('erp.journals.colDebit') }}</th>
                  <th class="px-4 py-2.5 text-right text-[11px] font-semibold text-[#637381] uppercase tracking-wider w-36">{{ t('erp.journals.colCredit') }}</th>
                  <th class="px-1 py-2.5 w-8"></th>
                </tr>
              </thead>
              <tbody class="divide-y divide-[#E2E8F0]">
                <tr v-for="(line, idx) in form.lines" :key="idx">
                  <td class="px-4 py-2 text-xs text-[#9BA7B0] text-center">{{ idx + 1 }}</td>
                  <td class="px-4 py-2">
                    <SearchSelect v-model="line.accountId" :options="accountGroupedOptions" group-values="items" group-label="label" :placeholder="t('erp.journals.selectAccount')" />
                  </td>
                  <td class="px-4 py-2">
                    <input v-model="line.description" type="text" placeholder="optional"
                      class="w-full px-2 py-1.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
                  </td>
                  <td class="px-4 py-2">
                    <input v-model.number="line.debit" type="number" min="0" step="0.01" placeholder="0.00"
                      @input="clearCredit(idx)"
                      class="w-full px-2 py-1.5 border rounded-lg text-sm text-right focus:outline-none focus:ring-2 focus:ring-primary-500 tabular-nums" />
                  </td>
                  <td class="px-4 py-2">
                    <input v-model.number="line.credit" type="number" min="0" step="0.01" placeholder="0.00"
                      @input="clearDebit(idx)"
                      class="w-full px-2 py-1.5 border rounded-lg text-sm text-right focus:outline-none focus:ring-2 focus:ring-primary-500 tabular-nums" />
                  </td>
                  <td class="px-1 py-2 text-center">
                    <button @click="removeLine(idx)" type="button"
                      class="text-[#CBD5E1] hover:text-red-400 transition rounded p-0.5"
                      :disabled="form.lines.length <= 2" title="Remove line">
                      <XMarkIcon class="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              </tbody>
              <tfoot class="bg-[#F7F9FC] border-t border-[#E2E8F0]">
                <tr>
                  <td colspan="3" class="px-4 py-3 text-xs font-semibold text-[#637381] text-right">{{ t('erp.journals.totals') }}</td>
                  <td class="px-4 py-3 text-right font-bold tabular-nums text-[#1C2434]">{{ fmtNum(totalDebit) }}</td>
                  <td class="px-4 py-3 text-right font-bold tabular-nums text-[#1C2434]">{{ fmtNum(totalCredit) }}</td>
                  <td></td>
                </tr>
                <tr>
                  <td colspan="6" class="px-4 py-2">
                    <span v-if="isBalanced" class="text-xs text-green-600 font-semibold flex items-center gap-1">
                      <CheckCircleIcon class="w-4 h-4" /> {{ t('erp.journals.balanced') }}
                    </span>
                    <span v-else class="text-xs text-red-500 font-semibold flex items-center gap-1">
                      <ExclamationCircleIcon class="w-4 h-4" />
                      {{ t('erp.journals.outOfBalance') }} {{ fmtNum(Math.abs(totalDebit - totalCredit)) }}
                    </span>
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        <div v-if="error" class="bg-red-50 text-red-700 text-sm px-4 py-2 rounded-lg">{{ error }}</div>

        <div class="flex justify-end gap-3 pt-2">
          <RouterLink to="/erp/accounting/journals"
            class="px-4 py-2 text-sm border rounded-lg hover:bg-[#F7F9FC] transition">{{ t('common.cancel') }}</RouterLink>
          <button @click="save" :disabled="saving"
            class="px-5 py-2 text-sm bg-primary-500 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 transition">
            {{ saving ? t('erp.journals.saving') : t('erp.journals.saveDraft') }}
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
import { ArrowLeftIcon, PlusIcon, XMarkIcon, CheckCircleIcon, ExclamationCircleIcon } from '@heroicons/vue/24/outline'
import AppLayout from '@/layouts/AppLayout.vue'
import DateInput from '@/components/DateInput.vue'
import SearchSelect from '@/components/SearchSelect.vue'
import api from '@/api'

const { t } = useI18n()
const router = useRouter()
const accounts = ref([])
const error    = ref('')
const saving   = ref(false)

const today = new Date().toISOString().slice(0, 10)
const form = ref({
  date: today,
  description: '',
  lines: [
    { accountId: '', description: '', debit: 0, credit: 0 },
    { accountId: '', description: '', debit: 0, credit: 0 },
  ],
})

const accountGroups = computed(() => {
  const groups = {}
  for (const acc of accounts.value) {
    if (!groups[acc.accountType]) groups[acc.accountType] = []
    groups[acc.accountType].push(acc)
  }
  return Object.entries(groups)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([type, accs]) => ({ type, accounts: accs.sort((a, b) => a.code.localeCompare(b.code)) }))
})
const accountGroupedOptions = computed(() => accountGroups.value.map(g => ({
  label: g.type,
  items: g.accounts.map(a => ({ ...a, name: `${a.code} — ${a.name}` })),
})))

const totalDebit  = computed(() => form.value.lines.reduce((s, l) => s + Number(l.debit  || 0), 0))
const totalCredit = computed(() => form.value.lines.reduce((s, l) => s + Number(l.credit || 0), 0))
const isBalanced  = computed(() => totalDebit.value > 0 && Math.abs(totalDebit.value - totalCredit.value) < 0.001)

function fmtNum(n) { return Number(n).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) }

function addLine() {
  form.value.lines.push({ accountId: '', description: '', debit: 0, credit: 0 })
}
function removeLine(idx) {
  if (form.value.lines.length > 2) form.value.lines.splice(idx, 1)
}
function clearCredit(idx) { form.value.lines[idx].credit = 0 }
function clearDebit(idx)  { form.value.lines[idx].debit  = 0 }

onMounted(async () => {
  const { data } = await api.get('/erp/accounting/chart-of-accounts', { params: { limit: 500, status: 'active' } })
  accounts.value = data.data.accounts || []
})

async function save() {
  error.value = ''
  if (!form.value.date) { error.value = t('erp.journals.errDate'); return }
  if (form.value.lines.some(l => !l.accountId)) { error.value = t('erp.journals.errAllAccounts'); return }
  if (!isBalanced.value) { error.value = t('erp.journals.errNotBalanced'); return }
  saving.value = true
  try {
    await api.post('/erp/accounting/journals', form.value)
    router.push('/erp/accounting/journals')
  } catch (err) {
    error.value = err.response?.data?.message || t('erp.journals.errCreate')
  } finally {
    saving.value = false
  }
}
</script>
