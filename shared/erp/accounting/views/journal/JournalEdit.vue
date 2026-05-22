<template>
  <AppLayout>
    <div class="space-y-5">

      <PageHeader :title="pageLoading ? t('erp.journals.edit') : (journalRefNo || t('erp.journals.edit'))"
        :back-to="`/erp/accounting/journals/${route.params.id}`"
        :breadcrumb="[
          { label: t('erp.journals.title'), to: '/erp/accounting/journals' },
          { label: journalRefNo || '…', to: `/erp/accounting/journals/${route.params.id}` },
          { label: t('common.edit') },
        ]">
        <template #badge>
          <StatusPill :label="t('erp.common.draft')" />
        </template>
        <template #actions>
          <HeaderSaveActions
            :cancel-to="`/erp/accounting/journals/${route.params.id}`"
            :cancel-label="t('common.cancel')"
            :saving="saving"
            :saving-label="t('erp.common.saving')"
            :save-label="t('common.saveChanges')"
            :disabled="!canSave"
            :disabled-hint="t('erp.journals.balanceRequired')"
            @save="save"
          />
        </template>
      </PageHeader>

      <!-- Loading -->
      <div v-if="pageLoading" class="flex items-center justify-center py-20">
        <div class="w-7 h-7 border-2 border-primary-500 border-t-transparent animate-spin"></div>
      </div>

      <!-- Not found / non-draft -->
      <ErrorBanner v-else-if="loadError" :message="loadError" />

      <div v-else class="space-y-5">

        <!-- Entry Info -->
        <FormCard :title="t('erp.journals.edit')" :icon="DocumentTextIcon" icon-color="primary" :padded="false">
          <div class="px-6 py-5 grid grid-cols-1 lg:grid-cols-3 gap-x-6 gap-y-5">
            <div>
              <FieldLabel :text="t('erp.common.date')" required />
              <DateInput v-model="form.date"
                :class="['w-full px-3.5 py-2.5 border text-[13px] transition-all',
                         'focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400',
                         errors.date ? 'border-red-300 bg-red-50/50' : 'border-[#E2E8F0] text-[#1C2434]',
                         errorOf('date') && 'input-error']" />
              <p v-if="errors.date" class="mt-1 text-[11px] text-red-500">{{ errors.date }}</p>
              <FieldError name="date" :errors="fieldErrors" />
            </div>
            <div class="lg:col-span-2">
              <FieldLabel :text="t('erp.journals.colDescription')" />
              <input v-model="form.description" type="text" :placeholder="t('erp.journals.descriptionPh')"
                class="w-full px-3.5 py-2.5 border border-[#E2E8F0] text-[13px] text-[#1C2434]
                       focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400
                       transition-all placeholder:text-[#9BA7B0]" />
            </div>
          </div>
        </FormCard>

        <!-- Lines -->
        <FormCard :title="t('erp.journals.journalLines')" :icon="TableCellsIcon" icon-color="green"
          :subtitle="linesSubtitle" :padded="false">
          <template #actions>
            <button @click="addLine" type="button"
              :title="`${t('erp.journals.addLine')} (Ctrl+L)`"
              class="inline-flex items-center gap-1.5 px-3.5 py-2 text-[12px] font-semibold
                     text-primary-600 bg-primary-50 hover:bg-primary-100 border border-primary-200
                     transition-colors">
              <PlusIcon class="w-3.5 h-3.5" />
              {{ t('erp.journals.addLine') }}
              <kbd class="hidden sm:inline ml-0.5 px-1.5 py-0.5 bg-white/80 border border-primary-200 font-mono text-[10px] text-primary-700">Ctrl+L</kbd>
            </button>
          </template>

          <div>
            <div class="grid items-center gap-3 px-5 py-2.5 bg-[#F7F9FC] border-b border-[#E2E8F0]"
              style="grid-template-columns: 1.8rem 2.5fr 2fr 6rem 6rem 2rem">
              <div class="text-[11px] font-semibold text-[#9BA7B0] uppercase tracking-wider text-center">#</div>
              <div class="text-[11px] font-semibold text-[#9BA7B0] uppercase tracking-wider">{{ t('erp.journals.colAccount') }}</div>
              <div class="text-[11px] font-semibold text-[#9BA7B0] uppercase tracking-wider">{{ t('erp.journals.colDescription') }}</div>
              <div class="text-[11px] font-semibold text-[#9BA7B0] uppercase tracking-wider text-right">{{ t('erp.journals.colDebit') }}</div>
              <div class="text-[11px] font-semibold text-[#9BA7B0] uppercase tracking-wider text-right">{{ t('erp.journals.colCredit') }}</div>
              <div></div>
            </div>

            <div class="divide-y divide-[#E2E8F0]">
              <div v-for="(line, idx) in form.lines" :key="idx"
                class="grid items-center gap-3 px-5 py-3 transition-colors group hover:bg-[#F7F9FC]"
                style="grid-template-columns: 1.8rem 2.5fr 2fr 6rem 6rem 2rem">
                <div class="text-[12px] font-semibold text-[#9BA7B0] text-center select-none">{{ idx + 1 }}</div>

                <SearchSelect v-model="line.accountId" :options="accountGroupedOptions"
                  group-values="items" group-label="label"
                  :invalid="!!errors.lines && !line.accountId"
                  :placeholder="t('erp.journals.selectAccount')" />

                <input v-model="line.description" type="text" placeholder="optional"
                  class="w-full px-2.5 py-2 border border-[#E2E8F0] text-[13px] text-[#1C2434]
                         focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400
                         transition-all placeholder:text-[#CBD5E1]" />

                <input v-model.number="line.debit" type="number" min="0" step="0.01" placeholder="0.00"
                  @input="clearCredit(idx)"
                  class="w-full px-2 py-2 border border-[#E2E8F0] text-[13px] text-right
                         text-[#1C2434] tabular-nums focus:outline-none focus:ring-2
                         focus:ring-primary-500/20 focus:border-primary-400 transition-all placeholder:text-[#CBD5E1]" />

                <input v-model.number="line.credit" type="number" min="0" step="0.01" placeholder="0.00"
                  @input="clearDebit(idx)"
                  class="w-full px-2 py-2 border border-[#E2E8F0] text-[13px] text-right
                         text-[#1C2434] tabular-nums focus:outline-none focus:ring-2
                         focus:ring-primary-500/20 focus:border-primary-400 transition-all placeholder:text-[#CBD5E1]" />

                <button @click="removeLine(idx)" type="button"
                  :disabled="form.lines.length <= 2"
                  class="w-7 h-7 flex items-center justify-center flex-shrink-0
                         text-[#CBD5E1] hover:text-red-500 hover:bg-red-50 transition-colors
                         opacity-0 group-hover:opacity-100 disabled:opacity-30 disabled:hover:bg-transparent">
                  <TrashIcon class="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            <div class="grid items-center gap-3 px-5 py-3.5 bg-[#F7F9FC] border-t border-[#E2E8F0]"
              style="grid-template-columns: 1.8rem 2.5fr 2fr 6rem 6rem 2rem">
              <div class="col-span-3 text-[11px] font-semibold text-[#9BA7B0] uppercase tracking-wider text-right">
                {{ t('erp.journals.totals') }}
              </div>
              <div class="text-[13px] font-bold text-[#1C2434] tabular-nums text-right">{{ fmtNum(totalDebit) }}</div>
              <div class="text-[13px] font-bold text-[#1C2434] tabular-nums text-right">{{ fmtNum(totalCredit) }}</div>
              <div></div>
            </div>

            <div class="px-5 py-2.5 border-t border-[#E2E8F0]">
              <p v-if="isBalanced" class="text-[12px] text-green-600 font-semibold flex items-center gap-1.5">
                <CheckCircleIcon class="w-4 h-4" /> {{ t('erp.journals.balanced') }}
              </p>
              <p v-else class="text-[12px] text-red-500 font-semibold flex items-center gap-1.5">
                <ExclamationCircleIcon class="w-4 h-4" />
                {{ t('erp.journals.outOfBalance') }} {{ fmtNum(Math.abs(totalDebit - totalCredit)) }}
              </p>
            </div>

            <p v-if="errors.lines" class="px-5 py-2.5 text-[11px] text-red-600 bg-[#FEE2E2] border-t border-[#FECACA]">
              {{ errors.lines }}
            </p>
          </div>
        </FormCard>

        <ErrorBanner :message="globalError" />
      </div>
    </div>

    <!-- Sticky save bar -->
    <div v-if="!pageLoading && !loadError" class="sticky bottom-0 -mx-6 mt-6 px-6 py-3.5 bg-white/95 backdrop-blur border-t border-[#E2E8F0] shadow-[0_-4px_12px_rgba(15,23,42,0.05)] z-20
                flex items-center justify-between gap-3">
      <div class="flex items-center gap-4">
        <div>
          <p class="text-[10px] font-semibold text-[#9BA7B0] uppercase tracking-wider mb-0.5">{{ t('erp.journals.totalDebitCredit') }}</p>
          <p class="text-2xl font-extrabold tabular-nums leading-none"
            :class="isBalanced ? 'text-primary-600' : 'text-red-500'">{{ fmtNum(totalDebit) }}</p>
        </div>
      </div>
      <div class="flex items-center gap-2.5">
        <RouterLink :to="`/erp/accounting/journals/${route.params.id}`"
          class="px-4 py-2.5 text-sm font-medium text-[#637381] hover:text-[#1C2434] transition-colors">
          {{ t('common.cancel') }}
        </RouterLink>
        <button @click="save" :disabled="!canSave || saving" type="button"
          :title="!canSave ? t('erp.journals.balanceRequired') : `${t('common.saveChanges')} (Ctrl+S)`"
          class="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-bold
                 bg-primary-500 text-white hover:bg-primary-600 shadow-sm
                 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
          <ArrowPathIcon v-if="saving" class="w-4 h-4 animate-spin" />
          <CheckIcon v-else class="w-4 h-4" />
          {{ saving ? t('erp.common.saving') : t('common.saveChanges') }}
        </button>
      </div>
    </div>
  </AppLayout>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import {
  PlusIcon, TrashIcon, CheckIcon, ArrowPathIcon,
  CheckCircleIcon, ExclamationCircleIcon,
  DocumentTextIcon, TableCellsIcon,
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
import FieldError from '@/components/form/FieldError.vue'
import { useFieldErrors } from '@/composables/useFieldErrors'
import api from '@/api'
import { parseApiError } from '@/utils/apiError'

const { t }    = useI18n()
const route    = useRoute()
const router   = useRouter()
const accounts    = ref([])
const errors      = ref({})
const globalError = ref('')
const saving      = ref(false)
const { fieldErrors, setFromError, reset: resetErrors, errorOf } = useFieldErrors()
const pageLoading = ref(true)
const loadError   = ref('')
const journalRefNo = ref('')

const form = ref({ date: '', description: '', lines: [] })

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
const linesSubtitle = computed(() => `${form.value.lines.length} ${t('erp.journals.lines')}`)

function fmtNum(n) { return Number(n).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) }

function addLine() { form.value.lines.push({ accountId: '', description: '', debit: 0, credit: 0 }) }
function removeLine(idx) { if (form.value.lines.length > 2) form.value.lines.splice(idx, 1) }
function clearCredit(idx) { form.value.lines[idx].credit = 0 }
function clearDebit(idx)  { form.value.lines[idx].debit  = 0 }

const canSave = computed(() => {
  if (!form.value.date) return false
  if (form.value.lines.length < 2) return false
  if (form.value.lines.some(l => !l.accountId)) return false
  return isBalanced.value
})

function validate() {
  const e = {}
  if (!form.value.date) e.date = t('erp.journals.dateRequired')
  if (form.value.lines.some(l => !l.accountId)) e.lines = t('erp.journals.accountRequired')
  else if (!isBalanced.value) e.lines = t('erp.journals.balanceRequired')
  errors.value = e
  return Object.keys(e).length === 0
}

onMounted(async () => {
  try {
    const [accRes, jRes] = await Promise.all([
      api.get('/erp/accounting/chart-of-accounts', { params: { limit: 500, status: 'active' } }),
      api.get(`/erp/accounting/journals/${route.params.id}`),
    ])
    accounts.value = accRes.data.data.accounts || []
    const j = jRes.data.data.journal
    // Posted/voided journals are immutable — bounce back to the detail view
    // rather than rendering a form the server will reject anyway.
    if (j.status !== 'draft') {
      router.push(`/erp/accounting/journals/${route.params.id}`)
      return
    }
    journalRefNo.value = j.refNo || ''
    form.value = {
      date: j.date,
      description: j.description || '',
      lines: (j.lines || []).map(l => ({
        accountId: l.accountId,
        description: l.description || '',
        debit: Number(l.debit),
        credit: Number(l.credit),
      })),
    }
  } catch {
    loadError.value = t('erp.journals.notFound')
  } finally {
    pageLoading.value = false
  }
})

function onPageKeydown(e) {
  if (pageLoading.value || loadError.value) return
  const ctrl = e.ctrlKey || e.metaKey
  const key  = e.key.toLowerCase()
  if (ctrl && key === 's') { e.preventDefault(); save() }
  else if (ctrl && key === 'l') { e.preventDefault(); addLine() }
}
onMounted(() => document.addEventListener('keydown', onPageKeydown))
onUnmounted(() => document.removeEventListener('keydown', onPageKeydown))

async function save() {
  globalError.value = ''
  resetErrors()
  if (!validate()) return
  saving.value = true
  try {
    await api.put(`/erp/accounting/journals/${route.params.id}`, form.value)
    router.push(`/erp/accounting/journals/${route.params.id}`)
  } catch (err) {
    const had = setFromError(err)
    if (!had) globalError.value = parseApiError(err, 'Failed to save journal entry')
  } finally {
    saving.value = false
  }
}
</script>
