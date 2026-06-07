<template>
  <AppLayout>
    <div class="space-y-5">

      <PageHeader title="Make Payment" back-to="/erp/billing/make-payments"
        :breadcrumb="[
          { label: 'Make Payments', to: '/erp/billing/make-payments' },
          { label: 'Create' },
        ]">
        <template #badge>
          <StatusPill label="Draft" />
        </template>
        <template #actions>
          <KeyboardShortcuts :shortcuts="shortcuts" width="w-56" />
          <HeaderSaveActions
            cancel-to="/erp/billing/make-payments"
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

        <FormCard title="Payment Information" :icon="BanknotesIcon" icon-color="green" :padded="false">
          <div class="px-6 py-5 grid grid-cols-1 lg:grid-cols-3 gap-x-6 gap-y-5">
            <div class="lg:col-span-2">
              <FieldLabel text="Vendor" required />
              <SearchSelect ref="vendorSelectRef" v-model="form.vendorId" :options="vendors" :invalid="!!errors.vendorId" placeholder="— Select vendor —" @change="onVendorChange">
                <template #option="{ option }">{{ option.name }}<span v-if="option.code" class="text-[#9BA7B0]"> · {{ option.code }}</span></template>
                <template #singleLabel="{ option }">{{ option.name }}<span v-if="option.code" class="text-[#9BA7B0]"> · {{ option.code }}</span></template>
              </SearchSelect>
              <p v-if="errors.vendorId" class="mt-1 text-[11px] text-red-500">{{ errors.vendorId }}</p>
            </div>

            <FormField name="reference" label="Reference" :errors="{}" v-model="form.reference" placeholder="cheque #, transfer ref…" />

            <FormField name="date" label="Date" :errors="errors" required>
              <template #default="{ hasError }">
                <DateInput v-model="form.date" :class="['input', hasError && 'input-error']" />
              </template>
            </FormField>

            <div>
              <FieldLabel text="Payment Method" required />
              <SearchSelect v-model="form.paymentMethod" :options="paymentMethods" track-by="name" label-key="name" placeholder="— Select —" :invalid="!!errors.paymentMethod" />
              <p v-if="errors.paymentMethod" class="mt-1 text-[11px] text-red-500">{{ errors.paymentMethod }}</p>
            </div>

            <div></div>

            <FormField name="notes" label="Notes" :errors="{}" v-model="form.notes" textarea :rows="2" placeholder="Remarks…" wrapper-class="lg:col-span-3" />
          </div>
        </FormCard>

        <FormCard title="Outstanding Bills" :icon="ClipboardDocumentListIcon" icon-color="blue"
          :subtitle="form.billIds.length ? `${form.billIds.length} selected` : ''" :padded="false">

          <EmptyState v-if="!form.vendorId" :icon="BuildingStorefrontIcon" title="Select a vendor first" subtitle="Outstanding bills will appear here" />

          <div v-else-if="loadingBills" class="flex items-center justify-center py-14">
            <div class="w-6 h-6 border-2 border-primary-500 border-t-transparent animate-spin"></div>
          </div>

          <EmptyState v-else-if="!availableBills.length" :icon="ClipboardDocumentListIcon" title="No outstanding bills" subtitle="This vendor has no approved unpaid bills" :error-message="errors.billIds" />

          <div v-else>
            <div class="grid items-center gap-3 px-5 py-2.5 bg-[#F7F9FC] border-b border-[#E2E8F0]"
              style="grid-template-columns: 2rem 1fr 7rem 7rem 8rem 8rem">
              <div class="flex items-center justify-center">
                <input type="checkbox" :checked="allSelected" @change="toggleAll" class="w-4 h-4 border-[#CBD5E1] text-primary-500 cursor-pointer" />
              </div>
              <div class="text-[11px] font-semibold text-[#9BA7B0] uppercase tracking-wider">Bill #</div>
              <div class="text-[11px] font-semibold text-[#9BA7B0] uppercase tracking-wider">Date</div>
              <div class="text-[11px] font-semibold text-[#9BA7B0] uppercase tracking-wider">Due Date</div>
              <div class="text-[11px] font-semibold text-[#9BA7B0] uppercase tracking-wider text-right">Total</div>
              <div class="text-[11px] font-semibold text-[#9BA7B0] uppercase tracking-wider text-right">Balance Due</div>
            </div>

            <div class="divide-y divide-[#E2E8F0]">
              <div v-for="bill in availableBills" :key="bill.id" @click="toggleBill(bill.id)"
                :class="['grid items-center gap-3 px-5 py-3 cursor-pointer transition-colors hover:bg-[#F7F9FC] border-l-2',
                         form.billIds.includes(bill.id) ? 'bg-primary-50/40 border-l-primary-400' : 'border-l-transparent']"
                style="grid-template-columns: 2rem 1fr 7rem 7rem 8rem 8rem">
                <div class="flex items-center justify-center">
                  <input type="checkbox" :checked="form.billIds.includes(bill.id)" @click.stop="toggleBill(bill.id)" class="w-4 h-4 border-[#CBD5E1] text-primary-500 cursor-pointer" />
                </div>
                <span class="font-mono text-[13px] font-medium text-[#1C2434]">{{ bill.billNumber }}</span>
                <span class="text-[12px] text-[#637381]">{{ bill.billDate }}</span>
                <span class="text-[12px] text-[#637381]">{{ bill.dueDate || '—' }}</span>
                <span class="text-[13px] text-[#637381] tabular-nums text-right">{{ fmtMoney(bill.total) }}</span>
                <span class="text-[13px] font-semibold text-[#1C2434] tabular-nums text-right">{{ fmtMoney(bill.balanceDue) }}</span>
              </div>
            </div>

            <div class="grid items-center gap-3 px-5 py-3.5 bg-[#F7F9FC] border-t border-[#E2E8F0]"
              style="grid-template-columns: 2rem 1fr 7rem 7rem 8rem 8rem">
              <div class="col-span-5 text-[11px] font-semibold text-[#9BA7B0] uppercase tracking-wider text-right">Selected total</div>
              <div class="text-[13px] font-bold text-[#1C2434] tabular-nums text-right">{{ fmtMoney(grandTotal) }}</div>
            </div>

            <p v-if="errors.billIds" class="px-5 py-2.5 text-[11px] text-red-600 bg-[#FEE2E2] border-t border-[#FECACA]">{{ errors.billIds }}</p>
          </div>
        </FormCard>

        <ErrorBanner :message="globalError" />
      </div>
    </div>

    <div class="sticky bottom-0 -mx-6 mt-6 px-6 py-3.5 bg-white/95 backdrop-blur border-t border-[#E2E8F0] shadow-[0_-4px_12px_rgba(15,23,42,0.05)] z-20 flex items-center justify-between gap-3">
      <div>
        <p class="text-[10px] font-semibold text-[#9BA7B0] uppercase tracking-wider mb-0.5">Total Payment</p>
        <p class="text-2xl font-extrabold tabular-nums leading-none text-green-600">{{ fmtMoney(grandTotal) }}</p>
      </div>
      <div class="flex items-center gap-2.5">
        <button @click="discard" type="button" class="px-4 py-2.5 text-sm font-medium text-[#637381] hover:text-[#1C2434] transition-colors">Discard</button>
        <button @click="save" :disabled="!canSave || saving" type="button"
          class="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-bold bg-primary-500 text-white hover:bg-primary-600 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
          <ArrowPathIcon v-if="saving" class="w-4 h-4 animate-spin" />
          <CheckIcon v-else class="w-4 h-4" />
          {{ saving ? 'Creating…' : 'Create Payment' }}
        </button>
      </div>
    </div>
  </AppLayout>
</template>

<script setup>
import { ref, computed, onMounted, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import {
  CheckIcon, BanknotesIcon, ArrowPathIcon, ClipboardDocumentListIcon, BuildingStorefrontIcon,
} from '@heroicons/vue/24/outline'
import AppLayout from '@/layouts/AppLayout.vue'
import DateInput from '@/components/DateInput.vue'
import KeyboardShortcuts from '@/components/KeyboardShortcuts.vue'
import { useFormShortcuts } from '@/composables/useShortcuts'
import PageHeader from '@/components/form/PageHeader.vue'
import FormCard from '@/components/form/FormCard.vue'
import FormField from '@/components/form/FormField.vue'
import FieldLabel from '@/components/form/FieldLabel.vue'
import ErrorBanner from '@/components/form/ErrorBanner.vue'
import SearchSelect from '@/components/SearchSelect.vue'
import StatusPill from '@/components/form/StatusPill.vue'
import HeaderSaveActions from '@/components/form/HeaderSaveActions.vue'
import EmptyState from '@/components/form/EmptyState.vue'
import api from '@/api'
import { fmtMoney } from '@/utils/fmt'
import { parseApiError } from '@/utils/apiError'

const router         = useRouter()
const vendorSelectRef = ref(null)
const vendors        = ref([])
const paymentMethods = ref([])
const availableBills = ref([])
const loadingBills   = ref(false)
const saving         = ref(false)
const globalError    = ref('')
const errors         = ref({})

const today = new Date().toISOString().slice(0, 10)
const form  = ref({ vendorId: '', date: today, paymentMethod: '', reference: '', notes: '', billIds: [] })

onMounted(async () => {
  const [vRes, pmRes] = await Promise.all([
    api.get('/erp/vendors', { params: { limit: 200 } }),
    api.get('/erp/master-data/by-name/Payment Methods'),
  ])
  vendors.value = vRes.data.data.vendors || vRes.data.data.items || []
  paymentMethods.value = pmRes.data.data.values
  if (paymentMethods.value.length) form.value.paymentMethod = paymentMethods.value[0].name
  await nextTick()
  vendorSelectRef.value?.focus()
})

async function onVendorChange() {
  form.value.billIds = []
  availableBills.value = []
  if (!form.value.vendorId) return
  loadingBills.value = true
  try {
    const { data } = await api.get('/erp/billing/make-payments/available-bills', { params: { vendorId: form.value.vendorId } })
    availableBills.value = data.data.bills
  } finally {
    loadingBills.value = false
  }
}

function toggleBill(id) {
  const idx = form.value.billIds.indexOf(id)
  if (idx === -1) form.value.billIds.push(id)
  else form.value.billIds.splice(idx, 1)
}

const allSelected = computed(() => availableBills.value.length > 0 && availableBills.value.every(b => form.value.billIds.includes(b.id)))
function toggleAll() {
  form.value.billIds = allSelected.value ? [] : availableBills.value.map(b => b.id)
}

const grandTotal = computed(() =>
  availableBills.value.filter(b => form.value.billIds.includes(b.id)).reduce((s, b) => s + Number(b.balanceDue), 0)
)

const canSave = computed(() => !!form.value.vendorId && !!form.value.date && !!form.value.paymentMethod && form.value.billIds.length > 0)

function validate() {
  const e = {}
  if (!form.value.vendorId)        e.vendorId      = 'Vendor is required'
  if (!form.value.date)            e.date          = 'Date is required'
  if (!form.value.paymentMethod)   e.paymentMethod = 'Payment method is required'
  if (!form.value.billIds.length)  e.billIds       = 'Select at least one bill'
  errors.value = e
  return Object.keys(e).length === 0
}

const { shortcuts } = useFormShortcuts({ save: () => save(), cancel: () => discard(), saveLabel: 'Create payment', cancelLabel: 'Back to list' })

async function save() {
  globalError.value = ''
  if (!validate()) return
  saving.value = true
  try {
    const { data } = await api.post('/erp/billing/make-payments', {
      vendorId:      form.value.vendorId,
      date:          form.value.date,
      paymentMethod: form.value.paymentMethod,
      reference:     form.value.reference || undefined,
      notes:         form.value.notes     || undefined,
      billIds:       form.value.billIds,
    })
    router.push(`/erp/billing/make-payments/${data.data.vendorPayment.id}`)
  } catch (err) {
    globalError.value = parseApiError(err, 'Failed to create payment')
  } finally {
    saving.value = false
  }
}

function discard() { router.push('/erp/billing/make-payments') }
</script>
