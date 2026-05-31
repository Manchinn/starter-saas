<template>
  <AppLayout>
    <div class="space-y-5">

      <PageHeader :title="t('erp.po.new')" back-to="/erp/purchasing/orders"
        :breadcrumb="[
          { label: t('erp.po.title'), to: '/erp/purchasing/orders' },
          { label: t('common.create') },
        ]">
        <template #badge>
          <StatusPill :label="t('erp.po.statusDraft')" />
        </template>
        <template #actions>
          <HeaderSaveActions
            cancel-to="/erp/purchasing/orders"
            :cancel-label="t('common.cancel')"
            :saving="saving"
            :saving-label="t('erp.common.creating')"
            :save-label="t('erp.po.create')"
            :disabled="!canSave"
            :disabled-hint="t('erp.po.fillRequiredFields')"
            @save="save"
          />
        </template>
      </PageHeader>

      <!-- PR source banner -->
      <div v-if="fromPR"
        class="flex items-center gap-3 px-4 py-3 bg-primary-50 border border-primary-200 text-sm">
        <ClipboardDocumentCheckIcon class="w-4 h-4 text-primary-500 flex-shrink-0" />
        <span class="text-primary-700">
          Imported from requisition
          <RouterLink :to="`/erp/purchasing/requisitions/${fromPR.id}`"
            class="font-semibold underline hover:text-primary-900">{{ fromPR.refNo }}</RouterLink>
          — review and adjust before saving.
        </span>
      </div>

      <div class="space-y-5">

        <!-- Order Info -->
        <FormCard :title="t('erp.po.orderInfo')" :icon="DocumentTextIcon" icon-color="primary" :padded="false">
          <div class="px-6 py-5 grid grid-cols-1 lg:grid-cols-3 gap-x-6 gap-y-5">

            <!-- Vendor -->
            <div class="lg:col-span-2">
              <FieldLabel :text="t('erp.po.vendor')" required />
              <div class="flex gap-2 items-start">
                <div ref="vendorFieldRef" class="flex-1 min-w-0">
                  <SearchSelect v-model="form.vendorId" :options="vendors" :invalid="!!mergedErrors.vendorId"
                    :placeholder="`— ${t('erp.po.selectVendor')} —`">
                    <template #option="{ option }">{{ option.name }}<span v-if="option.code" class="text-[#9BA7B0]"> · {{ option.code }}</span></template>
                    <template #singleLabel="{ option }">{{ option.name }}<span v-if="option.code" class="text-[#9BA7B0]"> · {{ option.code }}</span></template>
                  </SearchSelect>
                </div>
                <button type="button" @click="openVendorCreate"
                  :title="`${t('erp.po.newVendor')} (Alt+V)`"
                  class="px-3 py-2.5 text-[12px] font-semibold border border-primary-200
                         text-primary-600 bg-primary-50 hover:bg-primary-100 transition-colors flex-shrink-0 inline-flex items-center gap-1.5">
                  <PlusIcon class="w-3.5 h-3.5" />
                  {{ t('erp.po.newVendor') }}
                  <kbd class="hidden lg:inline px-1.5 py-0.5 bg-white/80 border border-primary-200 font-mono text-[10px] text-primary-700">Alt+V</kbd>
                </button>
              </div>
              <FieldError name="vendorId" :errors="mergedErrors" />
              <VendorChip :vendor="selectedVendor" />
            </div>

            <!-- Linked Requisition -->
            <div>
              <FieldLabel :text="t('erp.po.linkedRequisition')" />
              <SearchSelect v-model="form.requisitionId" :options="requisitions" label-key="refNo"
                :placeholder="`— ${t('erp.po.noRequisition')} —`" />
            </div>

            <!-- Order Date -->
            <FormField name="date" :label="t('erp.po.date')" :errors="mergedErrors" required>
              <template #default="{ hasError }">
                <DateInput v-model="form.date" :class="['input', hasError && 'input-error']" />
              </template>
            </FormField>

            <!-- Delivery Date -->
            <FormField name="deliveryDate" :label="t('erp.po.deliveryDate')" :errors="mergedErrors">
              <template #default>
                <DateInput v-model="form.deliveryDate" class="input" />
              </template>
            </FormField>

            <!-- Currency -->
            <div>
              <FieldLabel :text="t('erp.common.currency')" />
              <CurrencySelector v-model="form.currency" v-model:exchangeRate="form.exchangeRate" :as-of-date="form.date" />
            </div>

          </div>
        </FormCard>

        <!-- Line items -->
        <FormCard :title="t('erp.po.items')" :icon="ClipboardDocumentListIcon" icon-color="amber"
          :subtitle="itemsSubtitle" :padded="false">
          <template #actions>
            <button @click="openBulkPicker" type="button"
              :title="`${t('erp.po.addItem')} (Ctrl+A)`"
              class="inline-flex items-center gap-1.5 px-3.5 py-2 text-[12px] font-semibold
                     text-primary-600 bg-primary-50 hover:bg-primary-100 border border-primary-200
                     transition-colors">
              <PlusIcon class="w-3.5 h-3.5" />
              {{ t('erp.po.addItem') }}
              <kbd class="hidden sm:inline ml-0.5 px-1.5 py-0.5 bg-white/80 border border-primary-200 font-mono text-[10px] text-primary-700">Ctrl+A</kbd>
            </button>
          </template>

          <EmptyState v-if="!form.items.length"
            :icon="ClipboardDocumentListIcon"
            :title="t('erp.po.noItemsYet')"
            :subtitle="t('erp.po.noItemsHint')"
            :action-label="t('erp.po.addFirstItem')"
            :error-message="errors.items"
            @action="openBulkPicker" />

          <div v-else>
            <div class="grid items-center gap-3 px-5 py-2.5 bg-[#F7F9FC] border-b border-[#E2E8F0]"
              style="grid-template-columns: 1.8rem 2.6fr 2.4fr 5rem 7rem 6rem 1.5rem 2rem">
              <div class="text-[11px] font-semibold text-[#9BA7B0] uppercase tracking-wider text-center">#</div>
              <div class="text-[11px] font-semibold text-[#9BA7B0] uppercase tracking-wider">{{ t('erp.po.colItem') }}</div>
              <div class="text-[11px] font-semibold text-[#9BA7B0] uppercase tracking-wider">{{ t('erp.po.colDescription') }}</div>
              <div class="text-[11px] font-semibold text-[#9BA7B0] uppercase tracking-wider text-right">{{ t('erp.po.colQty') }}</div>
              <div class="text-[11px] font-semibold text-[#9BA7B0] uppercase tracking-wider text-right">{{ t('erp.po.colUnitPrice') }}</div>
              <div class="text-[11px] font-semibold text-[#9BA7B0] uppercase tracking-wider text-right">{{ t('erp.po.colSubtotal') }}</div>
              <div></div>
              <div></div>
            </div>

            <div class="divide-y divide-[#E2E8F0]">
              <div v-for="(line, idx) in form.items" :key="line.key || idx"
                :data-line-key="line.key"
                class="grid items-center gap-3 px-5 py-3 transition-colors group border-l-2"
                :class="[
                  'border-l-transparent hover:bg-[#F7F9FC]',
                  dragFromIdx === idx ? 'opacity-40' : '',
                  dragOverIdx === idx && dragFromIdx !== idx ? 'border-t-2 border-t-primary-500' : '',
                ]"
                style="grid-template-columns: 1.8rem 2.6fr 2.4fr 5rem 7rem 6rem 1.5rem 2rem"
                @dragover="onDragOver($event, idx)"
                @drop="onDrop(idx)"
                @dragleave="onDragLeave(idx)">

                <div draggable="true"
                  @dragstart="onDragStart($event, idx)"
                  @dragend="onDragEnd"
                  :title="t('erp.po.dragToReorder')"
                  class="text-[12px] font-semibold text-center select-none flex items-center justify-center
                         cursor-grab active:cursor-grabbing hover:bg-[#E2E8F0]/60 h-7
                         text-[#CBD5E1] group-hover:text-[#637381]">
                  <Bars3Icon class="w-4 h-4 hidden group-hover:block" />
                  <span class="group-hover:hidden">{{ idx + 1 }}</span>
                </div>

                <SearchSelectPopup
                  v-model="line.productId"
                  :options="products"
                  placeholder="— Item —"
                  search-placeholder="Search by SKU or name…"
                  @change="onProductChange(line)"
                />

                <input v-model="line.description" type="text" :placeholder="t('erp.po.descriptionPh')"
                  class="w-full px-2.5 py-2 border border-[#E2E8F0] text-[13px] text-[#1C2434]
                         focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400
                         transition-all placeholder:text-[#CBD5E1]" />

                <input v-model.number="line.qty" type="number" min="0.0001" step="any"
                  class="w-full px-2 py-2 border border-[#E2E8F0] text-[13px] text-right
                         text-[#1C2434] tabular-nums focus:outline-none focus:ring-2
                         focus:ring-primary-500/20 focus:border-primary-400 transition-all" />

                <input v-model.number="line.unitPrice" type="number" min="0" step="any" placeholder="0.00"
                  class="w-full px-2.5 py-2 border border-[#E2E8F0] text-[13px] text-right
                         text-[#1C2434] tabular-nums focus:outline-none focus:ring-2
                         focus:ring-primary-500/20 focus:border-primary-400 transition-all placeholder:text-[#CBD5E1]" />

                <div class="text-[13px] font-semibold text-[#1C2434] tabular-nums text-right">
                  {{ lineTotal(line) }}
                </div>

                <div class="flex items-center justify-center relative" data-dup-popover>
                  <button v-if="isDuplicate(line)" type="button"
                    tabindex="-1"
                    @click="toggleDupPopover(line)"
                    :aria-label="t('erp.po.duplicateItemWarning')"
                    class="flex items-center justify-center w-5 h-5 hover:bg-amber-100 text-amber-500 transition-colors">
                    <ExclamationTriangleIcon class="w-4 h-4" />
                  </button>
                  <div v-if="openDupKey === line.key"
                    class="absolute z-20 right-full top-1/2 -translate-y-1/2 mr-2 w-56
                           bg-amber-50 border border-amber-200 shadow-lg p-2.5
                           text-[12px] text-amber-800 leading-snug">
                    <div class="flex items-start gap-1.5">
                      <ExclamationTriangleIcon class="w-3.5 h-3.5 text-amber-500 flex-shrink-0 mt-0.5" />
                      <span>{{ t('erp.po.duplicateItemWarning') }}</span>
                    </div>
                  </div>
                </div>

                <button @click="removeItem(idx)" type="button"
                  class="w-7 h-7 flex items-center justify-center flex-shrink-0
                         text-[#CBD5E1] hover:text-red-500 hover:bg-red-50 transition-colors
                         opacity-0 group-hover:opacity-100">
                  <TrashIcon class="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            <div class="grid items-center gap-3 px-5 py-3.5 bg-[#F7F9FC] border-t border-[#E2E8F0]"
              style="grid-template-columns: 1.8rem 2.6fr 2.4fr 5rem 7rem 6rem 1.5rem 2rem">
              <div class="col-span-5 text-[11px] font-semibold text-[#9BA7B0] uppercase tracking-wider text-right">
                {{ t('erp.po.subtotalLabel') }}
              </div>
              <div class="text-[13px] font-bold text-[#1C2434] tabular-nums text-right">{{ grandTotalFmt }}</div>
              <div></div>
              <div></div>
            </div>

            <p v-if="errors.items" class="px-5 py-2.5 text-[11px] text-red-600 bg-[#FEE2E2] border-t border-[#FECACA]">
              {{ errors.items }}
            </p>
          </div>

          <SearchSelectPopup
            ref="bulkPickerRef"
            :model-value="''"
            :options="products"
            multiple
            hide-trigger
            search-placeholder="Search by SKU or name…"
            @submit="onBulkAdd"
          />
        </FormCard>

        <ErrorBanner :message="globalError" />

        <!-- Notes + summary -->
        <FormCard :title="t('erp.po.summary')" :icon="CalculatorIcon" icon-color="slate" :padded="false">
          <div class="px-6 py-5 grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
            <FormField name="notes" :label="t('erp.po.notes')" :errors="mergedErrors"
              v-model="form.notes" textarea :placeholder="t('erp.po.notesPh')"
              wrapper-class="flex flex-col text-left" input-class="flex-1 min-h-[10rem]" />
            <dl class="w-full space-y-2.5">
              <div class="flex items-center justify-between text-[13px]">
                <dt class="text-[#637381]">{{ t('erp.po.summaryItems') }}</dt>
                <dd class="font-semibold text-[#1C2434] tabular-nums">{{ form.items.length }}</dd>
              </div>
              <div class="flex items-center justify-between text-[13px]">
                <dt class="text-[#637381]">{{ t('erp.po.totalItems') }}</dt>
                <dd class="font-semibold text-[#1C2434] tabular-nums">{{ totalQty }}</dd>
              </div>
              <div class="flex items-center justify-between text-[13px]">
                <dt class="text-[#637381]">{{ t('erp.po.summaryVendor') }}</dt>
                <dd class="font-semibold text-[#1C2434] truncate max-w-[60%] text-right">
                  {{ selectedVendor?.name || '—' }}
                </dd>
              </div>
              <div class="flex items-center justify-between pt-2.5 border-t border-[#E2E8F0]">
                <dt class="text-[11px] font-semibold text-[#9BA7B0] uppercase tracking-wider">{{ t('erp.po.grandTotal') }}</dt>
                <dd class="text-base font-bold text-[#1C2434] tabular-nums">{{ grandTotalFmt }}</dd>
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
          <p class="text-[10px] font-semibold text-[#9BA7B0] uppercase tracking-wider mb-0.5">{{ t('erp.po.grandTotal') }}</p>
          <p class="text-2xl font-extrabold tabular-nums leading-none text-primary-600">{{ grandTotalFmt }}</p>
        </div>
        <span v-if="draftSavedAt" class="hidden sm:inline-flex items-center gap-1 text-[11px] text-emerald-600">
          <CheckIcon class="w-3.5 h-3.5" />
          {{ t('erp.po.savedDraft') }} · {{ savedAtRelative }}
        </span>
        <span v-else-if="dirty" class="hidden sm:inline-flex items-center gap-1 text-[11px] text-amber-600">
          <ExclamationTriangleIcon class="w-3.5 h-3.5" />
          {{ t('erp.po.unsavedChanges') }}
        </span>
      </div>
      <div class="flex items-center gap-2.5">
        <div class="hidden lg:flex items-center gap-3 text-[11px] text-[#9BA7B0] mr-1">
          <span class="flex items-center gap-1" :title="t('erp.po.saveDraft')">
            <kbd class="px-1.5 py-0.5 border border-[#E2E8F0] bg-[#F7F9FC] font-mono text-[10px]">Ctrl+S</kbd>
            <span>draft</span>
          </span>
          <span class="flex items-center gap-1" :title="t('erp.po.create')">
            <kbd class="px-1.5 py-0.5 border border-[#E2E8F0] bg-[#F7F9FC] font-mono text-[10px]">Ctrl+Shift+S</kbd>
            <span>save</span>
          </span>
          <span class="flex items-center gap-1" :title="t('erp.po.addItem')">
            <kbd class="px-1.5 py-0.5 border border-[#E2E8F0] bg-[#F7F9FC] font-mono text-[10px]">Ctrl+A</kbd>
            <span>item</span>
          </span>
        </div>
        <button @click="discard" type="button"
          class="px-4 py-2.5 text-sm font-medium text-[#637381] hover:text-[#1C2434] transition-colors">
          {{ t('erp.po.discard') }}
        </button>
        <button @click="saveDraft" :disabled="!canSave || savingDraft || saving" type="button"
          :title="!canSave ? t('erp.po.fillRequiredFields') : `${t('erp.po.saveDraft')} (Ctrl+S)`"
          class="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold
                 bg-white text-primary-600 border border-primary-200 hover:bg-primary-50
                 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
          <ArrowPathIcon v-if="savingDraft" class="w-4 h-4 animate-spin" />
          <BookmarkSquareIcon v-else class="w-4 h-4" />
          {{ savingDraft ? t('erp.common.saving') : t('erp.po.saveDraft') }}
        </button>
        <button @click="save" :disabled="!canSave || saving || savingDraft" type="button"
          :title="!canSave ? t('erp.po.fillRequiredFields') : `${t('erp.po.create')} (Ctrl+Shift+S)`"
          class="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-bold
                 bg-primary-500 text-white hover:bg-primary-600 shadow-sm
                 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
          <ArrowPathIcon v-if="saving" class="w-4 h-4 animate-spin" />
          <CheckIcon v-else class="w-4 h-4" />
          {{ saving ? t('erp.common.creating') : t('erp.po.create') }}
        </button>
      </div>
    </div>

    <!-- Confirm dialog -->
    <Teleport to="body">
      <div v-if="confirmOpen" class="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 px-4">
        <div class="w-full max-w-sm bg-white shadow-2xl overflow-hidden">
          <div class="px-5 py-4 flex items-start gap-3">
            <div class="w-9 h-9 bg-amber-100 flex items-center justify-center flex-shrink-0">
              <ExclamationTriangleIcon class="w-5 h-5 text-amber-600" />
            </div>
            <div class="flex-1 min-w-0">
              <p class="text-sm font-semibold text-[#1C2434]">{{ confirmTitle }}</p>
              <p v-if="confirmMessage" class="mt-1 text-[12px] text-[#637381] leading-snug">{{ confirmMessage }}</p>
            </div>
          </div>
          <div class="px-5 py-3 bg-[#F7F9FC] flex items-center justify-end gap-2">
            <button type="button" @click="confirmAnswer(false)"
              class="px-4 py-2 text-sm font-medium text-[#637381] hover:text-[#1C2434]">{{ t('common.cancel') }}</button>
            <button type="button" @click="confirmAnswer(true)"
              class="px-4 py-2 text-sm font-semibold bg-red-500 text-white hover:bg-red-600 shadow-sm">
              {{ confirmOkLabel }}
            </button>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- Inline vendor create slide-over -->
    <Teleport to="body">
      <div v-if="vendorCreateOpen" class="fixed inset-0 z-50 flex">
        <div class="flex-1 bg-black/30" @click="closeVendorCreate"></div>
        <div class="w-full max-w-md bg-white shadow-2xl overflow-y-auto flex flex-col">
          <div class="px-6 py-4 border-b border-[#E2E8F0] flex items-center justify-between">
            <h3 class="text-base font-semibold text-[#1C2434]">{{ t('erp.po.newVendor') }}</h3>
            <button @click="closeVendorCreate" type="button"
              class="w-8 h-8 hover:bg-[#F1F5F9] text-[#637381] flex items-center justify-center">
              <XMarkIcon class="w-4 h-4" />
            </button>
          </div>
          <div class="flex-1 px-6 py-5 space-y-4">
            <FormField name="vendorName" :label="t('erp.vendors.name')" :errors="{}" required>
              <template #default="{ id }">
                <input :id="id" v-model="newVendor.name" ref="newVendorNameRef" type="text"
                  placeholder="Vendor name" class="input" />
              </template>
            </FormField>
            <FormField name="vendorCode" :label="t('erp.vendors.code')" :errors="{}"
              v-model="newVendor.code" />
            <div class="grid grid-cols-2 gap-4">
              <FormField name="vendorEmail" :label="t('erp.vendors.email')" :errors="{}"
                v-model="newVendor.email" type="email" />
              <FormField name="vendorPhone" :label="t('erp.vendors.phone')" :errors="{}"
                v-model="newVendor.phone" />
            </div>
            <FormField name="vendorAddress" :label="t('erp.vendors.address')" :errors="{}"
              v-model="newVendor.address" textarea :rows="3" input-class="resize-none" />
            <p v-if="newVendorError" class="text-[12px] text-red-600">{{ newVendorError }}</p>
          </div>
          <div class="px-6 py-4 border-t border-[#E2E8F0] flex items-center justify-end gap-2">
            <button @click="closeVendorCreate" type="button"
              class="px-4 py-2 text-sm text-[#637381] hover:text-[#1C2434]">{{ t('common.cancel') }}</button>
            <button @click="saveVendor" :disabled="newVendorSaving" type="button"
              class="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-semibold bg-primary-500 text-white hover:bg-primary-600 disabled:opacity-50">
              <ArrowPathIcon v-if="newVendorSaving" class="w-4 h-4 animate-spin" />
              <CheckIcon v-else class="w-4 h-4" />
              {{ newVendorSaving ? t('erp.common.creating') : t('common.save') }}
            </button>
          </div>
        </div>
      </div>
    </Teleport>
  </AppLayout>
</template>

<script setup>
import { ref, computed, watch, nextTick, onMounted, onUnmounted } from 'vue'
import { useRouter, useRoute, RouterLink, onBeforeRouteLeave } from 'vue-router'
import { useI18n } from 'vue-i18n'
import {
  PlusIcon, TrashIcon, XMarkIcon,
  CheckIcon, ArrowPathIcon,
  DocumentTextIcon, ClipboardDocumentListIcon, CalculatorIcon,
  ClipboardDocumentCheckIcon, ExclamationTriangleIcon,
  BookmarkSquareIcon, Bars3Icon,
} from '@heroicons/vue/24/outline'
import AppLayout from '@/layouts/AppLayout.vue'
import DateInput from '@/components/DateInput.vue'
import CurrencySelector from '@/components/CurrencySelector.vue'
import SearchSelect from '@/components/SearchSelect.vue'
import SearchSelectPopup from '@/components/SearchSelectPopup.vue'
import PageHeader from '@/components/form/PageHeader.vue'
import FormCard from '@/components/form/FormCard.vue'
import FormField from '@/components/form/FormField.vue'
import FieldLabel from '@/components/form/FieldLabel.vue'
import FieldError from '@/components/form/FieldError.vue'
import ErrorBanner from '@/components/form/ErrorBanner.vue'
import StatusPill from '@/components/form/StatusPill.vue'
import HeaderSaveActions from '@/components/form/HeaderSaveActions.vue'
import EmptyState from '@/components/form/EmptyState.vue'
import VendorChip from '../purchase-requisition/VendorChip.vue'
import { useFieldErrors } from '@/composables/useFieldErrors'
import api from '@/api'
import { fmtMoney } from '@/utils/fmt'
import { parseApiError } from '@/utils/apiError'

const { t }  = useI18n()
const router = useRouter()
const route  = useRoute()

const today = new Date().toISOString().slice(0, 10)
const form = ref({
  date: today, deliveryDate: '', vendorId: '', requisitionId: '',
  currency: '', exchangeRate: 1, notes: '',
  items: [],
})
const vendors      = ref([])
const products     = ref([])
const requisitions = ref([])
const fromPR       = ref(null)
const saving       = ref(false)
const savingDraft  = ref(false)
const draftSavedAt = ref(null)
const globalError  = ref('')
const errors       = ref({})
const { fieldErrors, setFromError, reset: resetErrors } = useFieldErrors()

const mergedErrors = computed(() => ({ ...errors.value, ...fieldErrors.value }))

// Once a draft has been saved-without-redirect we have a PO id, so subsequent
// saves PUT instead of POST and the page silently switches to edit mode.
const createdId = ref('')

// Dirty tracking arms after the first render so default values don't trip
// the unsaved-changes guard.
const dirty = ref(false)
let dirtyArmed = false
watch(form, () => { if (dirtyArmed) dirty.value = true }, { deep: true })
onMounted(() => { setTimeout(() => { dirtyArmed = true }, 0) })

function onBeforeUnload(e) {
  if (!dirty.value) return
  e.preventDefault()
  e.returnValue = t('erp.po.unsavedChanges')
}
onMounted(() => window.addEventListener('beforeunload', onBeforeUnload))
onUnmounted(() => window.removeEventListener('beforeunload', onBeforeUnload))

// ── Custom confirm modal (replaces window.confirm) ──────────────────────
const confirmOpen    = ref(false)
const confirmTitle   = ref('')
const confirmMessage = ref('')
const confirmOkLabel = ref('OK')
let confirmResolver  = null
function confirmAsync({ title, message, okLabel } = {}) {
  confirmTitle.value   = title   || ''
  confirmMessage.value = message || ''
  confirmOkLabel.value = okLabel || 'OK'
  confirmOpen.value    = true
  return new Promise(resolve => { confirmResolver = resolve })
}
function confirmAnswer(ok) {
  confirmOpen.value = false
  if (confirmResolver) { confirmResolver(ok); confirmResolver = null }
}

onBeforeRouteLeave(async () => {
  if (!dirty.value) return true
  return await confirmAsync({
    title:   t('erp.po.unsavedChanges'),
    message: t('erp.po.unsavedChangesHint'),
    okLabel: t('erp.po.discard'),
  })
})

const selectedVendor = computed(() =>
  form.value.vendorId ? vendors.value.find(v => v.id === form.value.vendorId) : null
)

const vendorFieldRef = ref(null)
onMounted(() => {
  setTimeout(() => {
    const root = vendorFieldRef.value?.querySelector('.multiselect')
    root?.focus()
  }, 100)
})

onMounted(async () => {
  const [vRes, pRes, rRes] = await Promise.allSettled([
    api.get('/erp/vendors',                  { params: { limit: 500 } }),
    api.get('/erp/item-master',              { params: { limit: 500 } }),
    api.get('/erp/purchasing/requisitions',  { params: { limit: 200, status: 'approved' } }),
  ])
  if (vRes.status === 'fulfilled') vendors.value      = vRes.value.data.data.vendors      || []
  if (pRes.status === 'fulfilled') {
    const list = pRes.value.data.data.products || []
    products.value = list.map(p => ({ ...p, code: p.sku }))
  }
  if (rRes.status === 'fulfilled') requisitions.value = rRes.value.data.data.requisitions || []

  // Pre-fill from an approved PR if ?from=:id was supplied.
  if (route.query.from) {
    try {
      const { data } = await api.get(`/erp/purchasing/requisitions/${route.query.from}`)
      const pr = data.data.requisition
      fromPR.value            = pr
      form.value.requisitionId = pr.id
      if (pr.vendorId) form.value.vendorId = pr.vendorId
      form.value.items = (pr.items || []).map(i => ({
        key:         newKey(),
        productId:   i.productId   || '',
        description: i.description || (i.product?.name ? i.product.name : ''),
        qty:         Number(i.qty) || 1,
        unitPrice:   i.unitPrice != null ? Number(i.unitPrice) : 0,
        notes:       i.notes || '',
      }))
    } catch { /* silent — user can fill manually */ }
  }
})

// ── Inline vendor create ───────────────────────────────────────────────
const vendorCreateOpen = ref(false)
const newVendor        = ref({ name: '', code: '', email: '', phone: '', address: '' })
const newVendorError   = ref('')
const newVendorSaving  = ref(false)
const newVendorNameRef = ref(null)

function openVendorCreate() {
  newVendor.value = { name: '', code: '', email: '', phone: '', address: '' }
  newVendorError.value = ''
  vendorCreateOpen.value = true
  setTimeout(() => newVendorNameRef.value?.focus(), 50)
}
function closeVendorCreate() { vendorCreateOpen.value = false }
async function saveVendor() {
  newVendorError.value = ''
  if (!newVendor.value.name?.trim()) {
    newVendorError.value = 'Name is required'
    return
  }
  newVendorSaving.value = true
  try {
    const { data } = await api.post('/erp/vendors', { ...newVendor.value, status: 'active' })
    const created = data.data?.vendor || data.data
    if (created?.id) {
      vendors.value = [created, ...vendors.value]
      form.value.vendorId = created.id
    }
    vendorCreateOpen.value = false
  } catch (err) {
    newVendorError.value = parseApiError(err, 'Failed to create vendor')
  } finally {
    newVendorSaving.value = false
  }
}

// ── Items ──────────────────────────────────────────────────────────────
let _localKeyCounter = 0
function newKey() {
  return (typeof crypto !== 'undefined' && crypto.randomUUID)
    ? crypto.randomUUID()
    : `k${Date.now()}-${++_localKeyCounter}`
}

function makeLineFromProduct(p) {
  return {
    key:         newKey(),
    productId:   p.id,
    description: p.name,
    qty:         1,
    unitPrice:   p.cost != null ? Number(p.cost) : 0,
    notes:       '',
  }
}

function removeItem(idx) { form.value.items.splice(idx, 1) }

function onProductChange(line) {
  const p = products.value.find(p => p.id === line.productId)
  if (!p) return
  if (!line.description?.trim()) line.description = p.name
  if ((line.unitPrice == null || line.unitPrice === '' || line.unitPrice === 0) && p.cost != null) {
    line.unitPrice = Number(p.cost)
  }
}

const bulkPickerRef = ref(null)
function openBulkPicker() { bulkPickerRef.value?.open() }
async function onBulkAdd(objects) {
  if (!objects?.length) return
  const newLines = objects.map(makeLineFromProduct)
  form.value.items.push(...newLines)
  await nextTick()
  const first = newLines[0]
  if (!first) return
  const row = document.querySelector(`[data-line-key="${first.key}"]`)
  const qty = row?.querySelector('input[type="number"]')
  qty?.focus()
  qty?.select?.()
}

// ── Duplicate indicator ────────────────────────────────────────────────
const openDupKey = ref('')
function toggleDupPopover(line) {
  openDupKey.value = openDupKey.value === line.key ? '' : line.key
}
function onDocClickClosePopover(e) {
  if (!openDupKey.value) return
  if (e.target.closest('[data-dup-popover]')) return
  openDupKey.value = ''
}
onMounted(() => document.addEventListener('mousedown', onDocClickClosePopover))
onUnmounted(() => document.removeEventListener('mousedown', onDocClickClosePopover))

const duplicateProductIds = computed(() => {
  const counts = new Map()
  for (const it of form.value.items) {
    const id = it.productId
    if (!id) continue
    counts.set(id, (counts.get(id) || 0) + 1)
  }
  const dupes = new Set()
  for (const [id, n] of counts) if (n > 1) dupes.add(id)
  return dupes
})
function isDuplicate(line) {
  return !!line.productId && duplicateProductIds.value.has(line.productId)
}

// ── Drag-and-drop ──────────────────────────────────────────────────────
const dragFromIdx = ref(null)
const dragOverIdx = ref(null)
function onDragStart(e, idx) {
  dragFromIdx.value = idx
  e.dataTransfer.effectAllowed = 'move'
  e.dataTransfer.setData('text/plain', String(idx))
}
function onDragOver(e, idx) {
  if (dragFromIdx.value === null) return
  e.preventDefault()
  e.dataTransfer.dropEffect = 'move'
  dragOverIdx.value = idx
}
function onDragLeave(idx) {
  if (dragOverIdx.value === idx) dragOverIdx.value = null
}
function onDrop(idx) {
  const from = dragFromIdx.value
  if (from === null || from === idx) { onDragEnd(); return }
  const [moved] = form.value.items.splice(from, 1)
  const insertAt = from < idx ? idx - 1 : idx
  form.value.items.splice(insertAt, 0, moved)
  onDragEnd()
}
function onDragEnd() {
  dragFromIdx.value = null
  dragOverIdx.value = null
}

function lineTotal(item) {
  const val = (Number(item.qty) || 0) * (Number(item.unitPrice) || 0)
  return fmtMoney(val)
}

const itemsSubtitle = computed(() =>
  form.value.items.length
    ? `${form.value.items.length} ${form.value.items.length !== 1 ? t('erp.po.itemsCount') : t('erp.po.itemCount')}`
    : ''
)
const totalQty       = computed(() => form.value.items.reduce((s, i) => s + (Number(i.qty) || 0), 0))
const grandTotal     = computed(() => form.value.items.reduce((s, i) => s + (Number(i.qty) || 0) * (Number(i.unitPrice) || 0), 0))
const grandTotalFmt  = computed(() => fmtMoney(grandTotal.value))

const canSave = computed(() => {
  if (!form.value.vendorId || !form.value.date) return false
  if (!form.value.items.length) return false
  for (const item of form.value.items) {
    if (!item.productId && !item.description?.trim()) return false
    if (!item.qty || item.qty <= 0) return false
  }
  return true
})

function validate() {
  const e = {}
  if (!form.value.vendorId) e.vendorId = t('erp.po.vendorRequired')
  if (!form.value.date)     e.date     = t('erp.po.dateRequired')
  if (!form.value.items.length) {
    e.items = t('erp.po.itemsRequired')
  } else {
    for (const item of form.value.items) {
      if (!item.productId && !item.description?.trim()) { e.items = t('erp.po.itemNeedsDesc');  break }
      if (!item.qty || item.qty <= 0)                    { e.items = t('erp.po.itemQtyInvalid'); break }
    }
  }
  errors.value = e
  return Object.keys(e).length === 0
}

function onPageKeydown(e) {
  const ctrl  = e.ctrlKey || e.metaKey
  const shift = e.shiftKey
  const alt   = e.altKey
  const key   = e.key.toLowerCase()
  if (vendorCreateOpen.value) {
    if (e.key === 'Escape') { e.preventDefault(); closeVendorCreate() }
    return
  }
  if (confirmOpen.value) {
    if (e.key === 'Escape') { e.preventDefault(); confirmAnswer(false) }
    return
  }
  if      (ctrl && shift && key === 's') { e.preventDefault(); save() }
  else if (ctrl && key === 's')          { e.preventDefault(); saveDraft() }
  else if (ctrl && key === 'a')          { e.preventDefault(); openBulkPicker() }
  else if (alt  && key === 'v')          { e.preventDefault(); openVendorCreate() }
}
onMounted(() => document.addEventListener('keydown', onPageKeydown))
onUnmounted(() => document.removeEventListener('keydown', onPageKeydown))

async function save({ redirect = true } = {}) {
  globalError.value = ''
  resetErrors()
  if (!validate()) return
  if (redirect) saving.value = true
  else          savingDraft.value = true
  try {
    const payload = {
      date:          form.value.date,
      deliveryDate:  form.value.deliveryDate  || null,
      vendorId:      form.value.vendorId      || null,
      requisitionId: form.value.requisitionId || null,
      notes:         form.value.notes         || null,
      currency:      form.value.currency      || null,
      exchangeRate:  form.value.exchangeRate,
      items: form.value.items.map(({ productId, description, qty, unitPrice, notes }) => ({
        productId:   productId || null,
        description: description || null,
        qty:         Number(qty) || 0,
        unitPrice:   unitPrice == null || unitPrice === '' ? 0 : Number(unitPrice),
        notes:       notes || null,
      })),
    }
    let data
    if (createdId.value) {
      ({ data } = await api.put(`/erp/purchasing/orders/${createdId.value}`, payload))
    } else {
      ({ data } = await api.post('/erp/purchasing/orders', payload))
      createdId.value = data.data.order.id
    }
    dirty.value = false
    if (redirect) {
      router.push(`/erp/purchasing/orders/${data.data.order.id}`)
    } else {
      draftSavedAt.value = new Date()
    }
  } catch (err) {
    const had = setFromError(err)
    if (!had) globalError.value = parseApiError(err, 'Failed to save')
  } finally {
    saving.value = false
    savingDraft.value = false
  }
}

function saveDraft() { save({ redirect: false }) }

const _now = ref(Date.now())
onMounted(() => { const id = setInterval(() => { _now.value = Date.now() }, 15000); onUnmounted(() => clearInterval(id)) })
const savedAtRelative = computed(() => {
  if (!draftSavedAt.value) return ''
  const secs = Math.max(0, Math.round((_now.value - draftSavedAt.value.getTime()) / 1000))
  if (secs < 60)   return `${secs}s ago`
  if (secs < 3600) return `${Math.round(secs / 60)}m ago`
  return `${Math.round(secs / 3600)}h ago`
})

async function discard() {
  if (dirty.value) {
    const ok = await confirmAsync({
      title:   t('erp.po.unsavedChanges'),
      message: t('erp.po.unsavedChangesHint'),
      okLabel: t('erp.po.discard'),
    })
    if (!ok) return
  }
  router.push('/erp/purchasing/orders')
}
</script>
