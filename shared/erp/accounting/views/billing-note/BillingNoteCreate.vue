<template>
  <AppLayout>
    <div class="space-y-6">

      <PageHeader :title="t('erp.billingNotes.new')" back-to="/erp/billing/billing-notes"
        :breadcrumb="[
          { label: t('erp.billingNotes.title'), to: '/erp/billing/billing-notes' },
          { label: t('common.create') },
        ]">
        <template #badge>
          <StatusPill :label="t('erp.common.draft')" />
        </template>
        <template #actions>
          <HeaderSaveActions
            cancel-to="/erp/billing/billing-notes"
            :cancel-label="t('common.cancel')"
            :saving="saving"
            :saving-label="t('erp.common.creating')"
            :save-label="t('erp.billingNotes.create')"
            @save="save"
          />
        </template>
      </PageHeader>

      <div class="space-y-5">

        <!-- Section 1: Billing Note Info -->
        <FormCard :title="t('erp.billingNotes.info')" :icon="DocumentTextIcon" icon-color="primary">
          <div class="grid grid-cols-2 gap-x-6 gap-y-5">

            <!-- Customer -->
            <div class="col-span-2 lg:col-span-1">
              <FieldLabel :text="t('erp.common.customer')" required />
              <SearchSelect v-model="form.customerId" :options="customers" :invalid="!!errors.customerId" placeholder="— Select customer —" @change="onCustomerChange">
                <template #option="{ option }">{{ option.name }}<span v-if="option.company" class="text-[#9BA7B0]"> · {{ option.company }}</span></template>
                <template #singleLabel="{ option }">{{ option.name }}<span v-if="option.company" class="text-[#9BA7B0]"> · {{ option.company }}</span></template>
              </SearchSelect>
              <p v-if="errors.customerId" class="mt-1 text-xs text-red-500">{{ errors.customerId }}</p>
            </div>

            <!-- Date -->
            <div>
              <FieldLabel :text="t('erp.common.date')" required />
              <DateInput v-model="form.date"
                :class="['w-full px-3.5 py-2.5 border text-sm transition-colors',
                         'focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400',
                         errors.date ? 'border-red-300 bg-red-50' : 'border-[#E2E8F0] text-[#1C2434]']" />
              <p v-if="errors.date" class="mt-1 text-xs text-red-500">{{ errors.date }}</p>
            </div>

            <!-- Due Date -->
            <div>
              <FieldLabel :text="t('erp.billingNotes.colDueDate')" />
              <DateInput v-model="form.dueDate"
                class="w-full px-3.5 py-2.5 border border-[#E2E8F0] text-sm text-[#1C2434]
                       focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400 transition-colors" />
            </div>

            <!-- Notes -->
            <div class="col-span-2">
              <FieldLabel :text="t('erp.common.notes')" />
              <textarea v-model="form.notes" rows="2" :placeholder="t('erp.billingNotes.notesPh')"
                class="w-full px-3.5 py-2.5 border border-[#E2E8F0] text-sm text-[#1C2434]
                       focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400
                       transition-colors resize-none placeholder-[#CBD5E1]" />
            </div>

          </div>
        </FormCard>

        <!-- Section 2: Select Invoices -->
        <div class="bg-white rounded-2xl border border-[#E2E8F0] shadow-card overflow-hidden">
          <div class="px-6 py-4 border-b border-[#E2E8F0] flex items-center gap-3">
            <div class="w-8 h-8 rounded-xl bg-blue-50 flex items-center justify-center flex-shrink-0">
              <ClipboardDocumentListIcon class="w-4 h-4 text-blue-600" />
            </div>
            <div>
              <h2 class="text-sm font-semibold text-[#1C2434]">{{ t('erp.billingNotes.selectInvoices') }}</h2>
              <p v-if="form.invoiceIds.length" class="text-[11px] text-[#9BA7B0]">
                {{ form.invoiceIds.length }} {{ t('erp.billingNotes.selected') }}
              </p>
            </div>
          </div>

          <!-- No customer selected -->
          <div v-if="!form.customerId" class="flex flex-col items-center justify-center py-14 text-center">
            <div class="w-14 h-14 bg-[#F1F5F9] rounded-2xl flex items-center justify-center mb-4">
              <UserIcon class="w-7 h-7 text-[#CBD5E1]" />
            </div>
            <p class="text-sm font-semibold text-[#637381]">{{ t('erp.billingNotes.selectCustomerFirst') }}</p>
            <p class="text-xs text-[#9BA7B0] mt-1">{{ t('erp.billingNotes.invoicesWillAppear') }}</p>
          </div>

          <!-- Loading invoices -->
          <div v-else-if="loadingInvoices" class="flex items-center justify-center py-14">
            <div class="w-6 h-6 border-2 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
          </div>

          <!-- No available invoices -->
          <div v-else-if="!availableInvoices.length" class="flex flex-col items-center justify-center py-14 text-center">
            <div class="w-14 h-14 bg-[#F1F5F9] rounded-2xl flex items-center justify-center mb-4">
              <ClipboardDocumentListIcon class="w-7 h-7 text-[#CBD5E1]" />
            </div>
            <p class="text-sm font-semibold text-[#637381]">{{ t('erp.billingNotes.noAvailableInvoices') }}</p>
            <p class="text-xs text-[#9BA7B0] mt-1">{{ t('erp.billingNotes.noUnpaidInvoices') }}</p>
            <p v-if="errors.invoiceIds" class="mt-3 text-xs text-red-500">{{ errors.invoiceIds }}</p>
          </div>

          <!-- Invoice selection table -->
          <div v-else>
            <div class="grid items-center gap-3 px-5 py-2.5 bg-[#F7F9FC] border-b border-[#E2E8F0]
                        text-[11px] font-semibold text-[#9BA7B0] uppercase tracking-wider"
              style="grid-template-columns: 2rem 1fr 6rem 6rem 7rem 5rem">
              <div class="flex items-center justify-center">
                <input type="checkbox" :checked="allSelected" @change="toggleAll"
                  class="w-4 h-4 rounded border-[#CBD5E1] text-primary-500 focus:ring-primary-400 cursor-pointer" />
              </div>
              <div>{{ t('erp.billingNotes.colInvoiceNo') }}</div>
              <div>{{ t('erp.common.date') }}</div>
              <div>{{ t('erp.billingNotes.colDueDate') }}</div>
              <div class="text-right">{{ t('erp.billingNotes.colTotal') }}</div>
              <div>{{ t('common.status') }}</div>
            </div>

            <div class="divide-y divide-[#E2E8F0]">
              <div v-for="inv in availableInvoices" :key="inv.id"
                @click="toggleInvoice(inv.id)"
                :class="['grid items-center gap-3 px-5 py-3 cursor-pointer transition-colors',
                         'hover:bg-[#F7F9FC]',
                         form.invoiceIds.includes(inv.id) ? 'bg-primary-50/40' : '']"
                style="grid-template-columns: 2rem 1fr 6rem 6rem 7rem 5rem">

                <div class="flex items-center justify-center">
                  <input type="checkbox" :checked="form.invoiceIds.includes(inv.id)"
                    @click.stop="toggleInvoice(inv.id)"
                    class="w-4 h-4 rounded border-[#CBD5E1] text-primary-500 focus:ring-primary-400 cursor-pointer" />
                </div>

                <span class="font-mono text-sm font-medium text-[#1C2434]">{{ inv.invoiceNumber }}</span>
                <span class="text-xs text-[#637381]">{{ inv.invoiceDate }}</span>
                <span class="text-xs text-[#637381]">{{ inv.dueDate || '—' }}</span>
                <span class="text-sm font-semibold text-[#1C2434] tabular-nums text-right">{{ fmtMoney(inv.total) }}</span>
                <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold capitalize
                             bg-blue-50 text-blue-700">{{ inv.status }}</span>

              </div>
            </div>

            <p v-if="errors.invoiceIds" class="px-5 py-2 text-xs text-red-500 bg-red-50 border-t border-red-100">
              {{ errors.invoiceIds }}
            </p>
          </div>
        </div>

        <!-- Global error -->
        <ErrorBanner :message="globalError" />

        <!-- Summary + Actions -->
        <div class="bg-white rounded-2xl border border-[#E2E8F0] shadow-card overflow-hidden">
          <div class="px-6 py-4 border-b border-[#E2E8F0] flex items-center gap-2.5">
            <CalculatorIcon class="w-4 h-4 text-[#9BA7B0]" />
            <h2 class="text-sm font-semibold text-[#1C2434]">{{ t('erp.billingNotes.summary') }}</h2>
          </div>

          <div class="px-6 py-4 grid grid-cols-3 gap-6">
            <div class="flex flex-col gap-0.5">
              <span class="text-[11px] font-semibold text-[#9BA7B0] uppercase tracking-wider">{{ t('erp.common.customer') }}</span>
              <span class="text-sm font-semibold text-[#1C2434]">
                {{ customers.find(c => c.id === form.customerId)?.name || '—' }}
              </span>
            </div>
            <div class="flex flex-col gap-0.5">
              <span class="text-[11px] font-semibold text-[#9BA7B0] uppercase tracking-wider">{{ t('erp.billingNotes.selectedInvoices') }}</span>
              <span class="text-sm font-semibold text-[#1C2434]">{{ form.invoiceIds.length }}</span>
            </div>
            <div class="flex flex-col gap-0.5">
              <span class="text-[11px] font-semibold text-[#9BA7B0] uppercase tracking-wider">{{ t('erp.common.date') }}</span>
              <span class="text-sm font-semibold text-[#1C2434]">{{ fmtDate(form.date) || '—' }}</span>
            </div>
          </div>

          <DocFooterBar
            :total-label="t('erp.billingNotes.grandTotal')"
            :total="fmtMoney(grandTotal)"
            discard-to="/erp/billing/billing-notes"
            :discard-label="t('common.discard')"
            :saving="saving"
            :saving-label="t('erp.common.creating')"
            :save-label="t('erp.billingNotes.create')"
            @save="save"
          />
        </div>

      </div>
    </div>
  </AppLayout>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import {
  CheckIcon, DocumentTextIcon, ArrowPathIcon, ClipboardDocumentListIcon, CalculatorIcon, UserIcon,
} from '@heroicons/vue/24/outline'
import AppLayout from '@/layouts/AppLayout.vue'
import DateInput from '@/components/DateInput.vue'
import PageHeader from '@/components/form/PageHeader.vue'
import FormCard from '@/components/form/FormCard.vue'
import FieldLabel from '@/components/form/FieldLabel.vue'
import ErrorBanner from '@/components/form/ErrorBanner.vue'
import SearchSelect from '@/components/SearchSelect.vue'
import StatusPill from '@/components/form/StatusPill.vue'
import HeaderSaveActions from '@/components/form/HeaderSaveActions.vue'
import DocFooterBar from '@/components/form/DocFooterBar.vue'
import api from '@/api'
import { fmtDate } from '@/utils/fmt'
import { fmtMoney } from '@/utils/fmt'
import { parseApiError } from '@/utils/apiError'

const { t } = useI18n()
const router           = useRouter()
const customers        = ref([])
const availableInvoices = ref([])
const loadingInvoices  = ref(false)
const saving           = ref(false)
const globalError      = ref('')
const errors           = ref({})

const today = new Date().toISOString().slice(0, 10)
const form  = ref({
  customerId: '',
  date:       today,
  dueDate:    '',
  notes:      '',
  invoiceIds: [],
})

onMounted(async () => {
  const { data } = await api.get('/erp/customers', { params: { limit: 200 } })
  customers.value = data.data.customers
})

async function onCustomerChange() {
  form.value.invoiceIds = []
  availableInvoices.value = []
  if (!form.value.customerId) return
  loadingInvoices.value = true
  try {
    const { data } = await api.get('/erp/billing/billing-notes/available-invoices', {
      params: { customerId: form.value.customerId },
    })
    availableInvoices.value = data.data.invoices
  } finally {
    loadingInvoices.value = false
  }
}

function toggleInvoice(id) {
  const idx = form.value.invoiceIds.indexOf(id)
  if (idx === -1) form.value.invoiceIds.push(id)
  else form.value.invoiceIds.splice(idx, 1)
}

const allSelected = computed(() =>
  availableInvoices.value.length > 0 &&
  availableInvoices.value.every(inv => form.value.invoiceIds.includes(inv.id))
)

function toggleAll() {
  if (allSelected.value) {
    form.value.invoiceIds = []
  } else {
    form.value.invoiceIds = availableInvoices.value.map(inv => inv.id)
  }
}

const grandTotal = computed(() =>
  availableInvoices.value
    .filter(inv => form.value.invoiceIds.includes(inv.id))
    .reduce((s, inv) => s + Number(inv.total), 0)
)

function validate() {
  const e = {}
  if (!form.value.customerId)      e.customerId  = t('erp.billingNotes.errCustomer')
  if (!form.value.date)            e.date        = t('erp.billingNotes.errDate')
  if (!form.value.invoiceIds.length) e.invoiceIds = t('erp.billingNotes.errInvoices')
  errors.value = e
  return Object.keys(e).length === 0
}

async function save() {
  globalError.value = ''
  if (!validate()) return
  saving.value = true
  try {
    const { data } = await api.post('/erp/billing/billing-notes', {
      customerId: form.value.customerId,
      date:       form.value.date,
      dueDate:    form.value.dueDate || undefined,
      notes:      form.value.notes   || undefined,
      invoiceIds: form.value.invoiceIds,
    })
    router.push(`/erp/billing/billing-notes/${data.data.billingNote.id}`)
  } catch (err) {
    globalError.value = parseApiError(err, t('erp.billingNotes.errCreate'))
  } finally {
    saving.value = false
  }
}
</script>
