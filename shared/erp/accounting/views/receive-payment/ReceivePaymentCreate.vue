<template>
  <AppLayout>
    <div class="space-y-5">

      <PageHeader title="Receive Payment" back-to="/erp/billing/receive-payments"
        :breadcrumb="[
          { label: 'Receive Payments', to: '/erp/billing/receive-payments' },
          { label: 'Create' },
        ]">
        <template #badge>
          <StatusPill label="Draft" />
        </template>
        <template #actions>
          <KeyboardShortcuts :shortcuts="shortcuts" width="w-56" />
          <HeaderSaveActions
            cancel-to="/erp/billing/receive-payments"
            cancel-label="Cancel"
            :saving="saving"
            saving-label="Creating…"
            save-label="Create Payment"
            :disabled="!canSave"
            disabled-hint="Fill in the required fields first"
            @save="save"
          />
        </template>
      </PageHeader>

      <div class="space-y-5">

        <!-- Customer & Payment Info -->
        <FormCard title="Payment Information" :icon="BanknotesIcon" icon-color="green" :padded="false">
          <div class="px-6 py-5 grid grid-cols-1 lg:grid-cols-3 gap-x-6 gap-y-5">

            <!-- Customer -->
            <div class="lg:col-span-2">
              <FieldLabel text="Customer" required />
              <SearchSelect ref="customerSelectRef" v-model="form.customerId" :options="customers" :invalid="!!mergedErrors.customerId" placeholder="— Select customer —" @change="onCustomerChange">
                <template #option="{ option }">{{ option.name }}<span v-if="option.company" class="text-[#9BA7B0]"> · {{ option.company }}</span></template>
                <template #singleLabel="{ option }">{{ option.name }}<span v-if="option.company" class="text-[#9BA7B0]"> · {{ option.company }}</span></template>
              </SearchSelect>
              <p v-if="errors.customerId" class="mt-1 text-[11px] text-red-500">{{ errors.customerId }}</p>
              <FieldError name="customerId" :errors="mergedErrors" />
              <CustomerChip :customer="selectedCustomer" />
            </div>

            <!-- Reference -->
            <FormField name="reference" label="Reference" :errors="mergedErrors"
              v-model="form.reference" placeholder="Optional reference number"
              hint="cheque #, transfer ref…" />

            <!-- Date -->
            <FormField name="date" label="Date" :errors="mergedErrors" required>
              <template #default="{ hasError }">
                <DateInput v-model="form.date" :class="['input', hasError && 'input-error']" />
              </template>
            </FormField>

            <!-- Payment Method -->
            <div>
              <FieldLabel text="Payment Method" required />
              <SearchSelect v-model="form.paymentMethod" :options="paymentMethods" track-by="name" label-key="name" placeholder="— Select —" :invalid="!!mergedErrors.paymentMethod" />
              <FieldError name="paymentMethod" :errors="mergedErrors" />
            </div>

            <!-- spacer to push notes to its own row on lg -->
            <div></div>

            <!-- Notes -->
            <FormField name="notes" label="Notes" :errors="mergedErrors"
              v-model="form.notes" textarea :rows="2" placeholder="Remarks…"
              wrapper-class="lg:col-span-3" />

          </div>
        </FormCard>

        <!-- Outstanding Invoices -->
        <FormCard title="Outstanding Invoices" :icon="ClipboardDocumentListIcon" icon-color="blue"
          :subtitle="form.invoiceIds.length ? `${form.invoiceIds.length} selected` : ''"
          :padded="false">

          <!-- No customer -->
          <EmptyState v-if="!form.customerId"
            :icon="UserIcon"
            title="Select a customer first"
            subtitle="Outstanding invoices will appear here" />

          <!-- Loading -->
          <div v-else-if="loadingInvoices" class="flex items-center justify-center py-14">
            <div class="w-6 h-6 border-2 border-primary-500 border-t-transparent animate-spin"></div>
          </div>

          <!-- No invoices -->
          <EmptyState v-else-if="!availableInvoices.length"
            :icon="ClipboardDocumentListIcon"
            title="No outstanding invoices"
            subtitle="This customer has no unpaid invoices"
            :error-message="errors.invoiceIds" />

          <!-- Invoice table -->
          <div v-else>
            <div class="grid items-center gap-3 px-5 py-2.5 bg-[#F7F9FC] border-b border-[#E2E8F0]"
              style="grid-template-columns: 2rem 1fr 7rem 7rem 8rem 5.5rem">
              <div class="flex items-center justify-center">
                <input type="checkbox" :checked="allSelected" @change="toggleAll"
                  class="w-4 h-4 border-[#CBD5E1] text-primary-500 focus:ring-primary-400 cursor-pointer" />
              </div>
              <div class="text-[11px] font-semibold text-[#9BA7B0] uppercase tracking-wider">Invoice #</div>
              <div class="text-[11px] font-semibold text-[#9BA7B0] uppercase tracking-wider">Date</div>
              <div class="text-[11px] font-semibold text-[#9BA7B0] uppercase tracking-wider">Due Date</div>
              <div class="text-[11px] font-semibold text-[#9BA7B0] uppercase tracking-wider text-right">Total</div>
              <div class="text-[11px] font-semibold text-[#9BA7B0] uppercase tracking-wider">Status</div>
            </div>

            <div class="divide-y divide-[#E2E8F0]">
              <div v-for="inv in availableInvoices" :key="inv.id"
                @click="toggleInvoice(inv.id)"
                :class="['grid items-center gap-3 px-5 py-3 cursor-pointer transition-colors hover:bg-[#F7F9FC] border-l-2',
                         form.invoiceIds.includes(inv.id) ? 'bg-primary-50/40 border-l-primary-400' : 'border-l-transparent']"
                style="grid-template-columns: 2rem 1fr 7rem 7rem 8rem 5.5rem">
                <div class="flex items-center justify-center">
                  <input type="checkbox" :checked="form.invoiceIds.includes(inv.id)"
                    @click.stop="toggleInvoice(inv.id)"
                    class="w-4 h-4 border-[#CBD5E1] text-primary-500 focus:ring-primary-400 cursor-pointer" />
                </div>
                <span class="font-mono text-[13px] font-medium text-[#1C2434]">{{ inv.invoiceNumber }}</span>
                <span class="text-[12px] text-[#637381]">{{ inv.invoiceDate }}</span>
                <span class="text-[12px] text-[#637381]">{{ inv.dueDate || '—' }}</span>
                <span class="text-[13px] font-semibold text-[#1C2434] tabular-nums text-right">{{ fmtMoney(inv.total) }}</span>
                <span class="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-semibold capitalize
                             bg-blue-50 text-blue-700 w-fit">{{ inv.status }}</span>
              </div>
            </div>

            <!-- Footer total -->
            <div class="grid items-center gap-3 px-5 py-3.5 bg-[#F7F9FC] border-t border-[#E2E8F0]"
              style="grid-template-columns: 2rem 1fr 7rem 7rem 8rem 5.5rem">
              <div class="col-span-4 text-[11px] font-semibold text-[#9BA7B0] uppercase tracking-wider text-right">
                Selected total
              </div>
              <div class="text-[13px] font-bold text-[#1C2434] tabular-nums text-right">{{ fmtMoney(grandTotal) }}</div>
              <div></div>
            </div>

            <p v-if="errors.invoiceIds" class="px-5 py-2.5 text-[11px] text-red-600 bg-[#FEE2E2] border-t border-[#FECACA]">
              {{ errors.invoiceIds }}
            </p>
          </div>
        </FormCard>

        <ErrorBanner :message="globalError" />

        <!-- Summary -->
        <FormCard title="Summary" :icon="CalculatorIcon" icon-color="slate" :padded="false">
          <div class="px-6 py-5 grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
            <div class="flex flex-col text-left">
              <FieldLabel text="Customer" />
              <p class="text-[13px] font-semibold text-[#1C2434] truncate">
                {{ selectedCustomer?.name || '—' }}
                <span v-if="selectedCustomer?.company" class="text-[#9BA7B0] font-normal"> · {{ selectedCustomer.company }}</span>
              </p>
            </div>
            <dl class="w-full space-y-2.5">
              <div class="flex items-center justify-between text-[13px]">
                <dt class="text-[#637381]">Invoices selected</dt>
                <dd class="font-semibold text-[#1C2434] tabular-nums">{{ form.invoiceIds.length }}</dd>
              </div>
              <div class="flex items-center justify-between text-[13px]">
                <dt class="text-[#637381]">Payment method</dt>
                <dd class="font-semibold text-[#1C2434]">{{ form.paymentMethod || '—' }}</dd>
              </div>
              <div class="flex items-center justify-between pt-2.5 border-t border-[#E2E8F0]">
                <dt class="text-[11px] font-semibold text-[#9BA7B0] uppercase tracking-wider">Total payment</dt>
                <dd class="text-base font-bold text-green-600 tabular-nums">{{ fmtMoney(grandTotal) }}</dd>
              </div>
            </dl>
          </div>
        </FormCard>

      </div>
    </div>

    <!-- Sticky save bar -->
    <div class="sticky bottom-0 -mx-6 mt-6 px-6 py-3.5 bg-white/95 backdrop-blur border-t border-[#E2E8F0] shadow-[0_-4px_12px_rgba(15,23,42,0.05)] z-20
                flex items-center justify-between gap-3">
      <div class="flex items-center gap-4">
        <div>
          <p class="text-[10px] font-semibold text-[#9BA7B0] uppercase tracking-wider mb-0.5">Total Payment</p>
          <p class="text-2xl font-extrabold tabular-nums leading-none text-green-600">{{ fmtMoney(grandTotal) }}</p>
        </div>
        <span v-if="dirty" class="hidden sm:inline-flex items-center gap-1 text-[11px] text-amber-600">
          <ExclamationTriangleIcon class="w-3.5 h-3.5" />
          You have unsaved changes
        </span>
      </div>
      <div class="flex items-center gap-2.5">
        <div class="hidden lg:flex items-center gap-3 text-[11px] text-[#9BA7B0] mr-1">
          <span class="flex items-center gap-1">
            <kbd class="px-1.5 py-0.5 border border-[#E2E8F0] bg-[#F7F9FC] font-mono text-[10px]">Ctrl+S</kbd>
            <span>save</span>
          </span>
          <span class="flex items-center gap-1">
            <kbd class="px-1.5 py-0.5 border border-[#E2E8F0] bg-[#F7F9FC] font-mono text-[10px]">Esc</kbd>
            <span>back</span>
          </span>
        </div>
        <button @click="discard" type="button"
          class="px-4 py-2.5 text-sm font-medium text-[#637381] hover:text-[#1C2434] transition-colors">
          Discard
        </button>
        <button @click="save" :disabled="!canSave || saving" type="button"
          :title="!canSave ? 'Fill in the required fields first' : 'Create Payment (Ctrl+S)'"
          class="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-bold
                 bg-primary-500 text-white hover:bg-primary-600 shadow-sm
                 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
          <ArrowPathIcon v-if="saving" class="w-4 h-4 animate-spin" />
          <CheckIcon v-else class="w-4 h-4" />
          {{ saving ? 'Creating…' : 'Create Payment' }}
        </button>
      </div>
    </div>

    <!-- Confirm dialog (Discard guard) -->
    <Teleport to="body">
      <div v-if="confirmOpen" class="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 px-4">
        <div class="w-full max-w-sm bg-white shadow-2xl overflow-hidden">
          <div class="px-5 py-4 flex items-start gap-3">
            <div class="w-9 h-9 bg-amber-100 flex items-center justify-center flex-shrink-0">
              <ExclamationTriangleIcon class="w-5 h-5 text-amber-600" />
            </div>
            <div class="flex-1 min-w-0">
              <p class="text-sm font-semibold text-[#1C2434]">You have unsaved changes</p>
              <p class="mt-1 text-[12px] text-[#637381] leading-snug">Leave this page and discard your changes?</p>
            </div>
          </div>
          <div class="px-5 py-3 bg-[#F7F9FC] flex items-center justify-end gap-2">
            <button type="button" @click="confirmAnswer(false)"
              class="px-4 py-2 text-sm font-medium text-[#637381] hover:text-[#1C2434]">Cancel</button>
            <button type="button" @click="confirmAnswer(true)"
              class="px-4 py-2 text-sm font-semibold bg-red-500 text-white hover:bg-red-600 shadow-sm">
              Discard
            </button>
          </div>
        </div>
      </div>
    </Teleport>
  </AppLayout>
</template>

<script setup>
import { ref, computed, watch, onMounted, onUnmounted, nextTick } from 'vue'
import { useRouter, onBeforeRouteLeave } from 'vue-router'
import {
  CheckIcon, BanknotesIcon, ArrowPathIcon, ClipboardDocumentListIcon, CalculatorIcon, UserIcon,
  ExclamationTriangleIcon,
} from '@heroicons/vue/24/outline'
import AppLayout from '@/layouts/AppLayout.vue'
import DateInput from '@/components/DateInput.vue'
import KeyboardShortcuts from '@/components/KeyboardShortcuts.vue'
import { useFormShortcuts } from '@/composables/useShortcuts'
import PageHeader from '@/components/form/PageHeader.vue'
import FormCard from '@/components/form/FormCard.vue'
import FormField from '@/components/form/FormField.vue'
import FieldLabel from '@/components/form/FieldLabel.vue'
import FieldError from '@/components/form/FieldError.vue'
import ErrorBanner from '@/components/form/ErrorBanner.vue'
import SearchSelect from '@/components/SearchSelect.vue'
import StatusPill from '@/components/form/StatusPill.vue'
import HeaderSaveActions from '@/components/form/HeaderSaveActions.vue'
import CustomerChip from '@/components/form/CustomerChip.vue'
import EmptyState from '@/components/form/EmptyState.vue'
import { useFieldErrors } from '@/composables/useFieldErrors'
import api from '@/api'
import { fmtMoney } from '@/utils/fmt'
import { parseApiError } from '@/utils/apiError'

const router            = useRouter()
const customerSelectRef = ref(null)
const customers         = ref([])
const paymentMethods    = ref([])
const availableInvoices = ref([])
const loadingInvoices   = ref(false)
const saving            = ref(false)
const globalError       = ref('')
const errors            = ref({})
const { fieldErrors, setFromError, reset: resetErrors } = useFieldErrors()

const mergedErrors = computed(() => ({ ...errors.value, ...fieldErrors.value }))

const today = new Date().toISOString().slice(0, 10)
const form  = ref({
  customerId:    '',
  date:          today,
  paymentMethod: '',
  reference:     '',
  notes:         '',
  invoiceIds:    [],
})

// Dirty tracking — arm the watcher after the initial defaults settle so
// they don't immediately mark the form as dirty.
const dirty = ref(false)
let dirtyArmed = false
watch(form, () => { if (dirtyArmed) dirty.value = true }, { deep: true })
onMounted(() => { setTimeout(() => { dirtyArmed = true }, 0) })

function onBeforeUnload(e) {
  if (!dirty.value) return
  e.preventDefault()
  e.returnValue = 'You have unsaved changes'
}
onMounted(() => window.addEventListener('beforeunload', onBeforeUnload))
onUnmounted(() => window.removeEventListener('beforeunload', onBeforeUnload))

// Discard / unsaved-changes confirm modal
const confirmOpen = ref(false)
let confirmResolver = null
function confirmAsync() {
  confirmOpen.value = true
  return new Promise(resolve => { confirmResolver = resolve })
}
function confirmAnswer(ok) {
  confirmOpen.value = false
  if (confirmResolver) { confirmResolver(ok); confirmResolver = null }
}

onBeforeRouteLeave(async () => {
  if (!dirty.value) return true
  return await confirmAsync()
})

const selectedCustomer = computed(() =>
  form.value.customerId ? customers.value.find(c => c.id === form.value.customerId) : null
)

onMounted(async () => {
  const [custRes, pmRes] = await Promise.all([
    api.get('/erp/customers', { params: { limit: 200 } }),
    api.get('/erp/master-data/by-name/Payment Methods'),
  ])
  customers.value      = custRes.data.data.customers
  paymentMethods.value = pmRes.data.data.values
  if (paymentMethods.value.length) form.value.paymentMethod = paymentMethods.value[0].name
  await nextTick()
  customerSelectRef.value?.focus()
})

async function onCustomerChange() {
  form.value.invoiceIds = []
  availableInvoices.value = []
  if (!form.value.customerId) return
  loadingInvoices.value = true
  try {
    const { data } = await api.get('/erp/billing/receive-payments/available-invoices', {
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
  if (allSelected.value) form.value.invoiceIds = []
  else form.value.invoiceIds = availableInvoices.value.map(inv => inv.id)
}

const grandTotal = computed(() =>
  availableInvoices.value
    .filter(inv => form.value.invoiceIds.includes(inv.id))
    .reduce((s, inv) => s + Number(inv.total), 0)
)

const canSave = computed(() =>
  !!form.value.customerId && !!form.value.date && !!form.value.paymentMethod && form.value.invoiceIds.length > 0
)

function validate() {
  const e = {}
  if (!form.value.customerId)         e.customerId    = 'Customer is required'
  if (!form.value.date)               e.date          = 'Date is required'
  if (!form.value.paymentMethod)      e.paymentMethod = 'Payment method is required'
  if (!form.value.invoiceIds.length)  e.invoiceIds    = 'Select at least one invoice'
  errors.value = e
  return Object.keys(e).length === 0
}

const { shortcuts } = useFormShortcuts({
  save: () => save(),
  cancel: () => discard(),
  saveLabel: 'Create payment',
  cancelLabel: 'Back to list',
})

async function save() {
  globalError.value = ''
  resetErrors()
  if (!validate()) return
  saving.value = true
  try {
    const { data } = await api.post('/erp/billing/receive-payments', {
      customerId:    form.value.customerId,
      date:          form.value.date,
      paymentMethod: form.value.paymentMethod,
      reference:     form.value.reference || undefined,
      notes:         form.value.notes     || undefined,
      invoiceIds:    form.value.invoiceIds,
    })
    dirty.value = false
    router.push(`/erp/billing/receive-payments/${data.data.receivePayment.id}`)
  } catch (err) {
    const had = setFromError(err)
    if (!had) globalError.value = parseApiError(err, 'Failed to create payment')
  } finally {
    saving.value = false
  }
}

async function discard() {
  if (dirty.value) {
    const ok = await confirmAsync()
    if (!ok) return
  }
  router.push('/erp/billing/receive-payments')
}
</script>
