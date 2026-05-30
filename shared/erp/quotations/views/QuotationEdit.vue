<template>
  <AppLayout>
    <div class="space-y-5">

      <PageHeader :title="loading ? t('erp.quotations.editQuotation') : (quotation?.refNo || t('erp.quotations.editQuotation'))"
        :back-to="`/erp/quotations/${route.params.id}`"
        :breadcrumb="[
          { label: t('erp.quotations.title'), to: '/erp/quotations' },
          { label: quotation?.refNo || '…', to: `/erp/quotations/${route.params.id}` },
          { label: t('common.edit') },
        ]">
        <template #badge>
          <StatusPill :label="t('erp.quotations.draft')" />
        </template>
        <template #actions>
          <HeaderSaveActions
            :cancel-to="`/erp/quotations/${route.params.id}`"
            :cancel-label="t('common.cancel')"
            :saving="saving"
            :saving-label="t('erp.common.saving')"
            :save-label="t('common.saveChanges')"
            :disabled="!canSave"
            :disabled-hint="t('erp.quotations.fillRequiredFields')"
            @save="save"
          />
        </template>
      </PageHeader>

      <div v-if="loading" class="flex items-center justify-center py-20">
        <div class="w-7 h-7 border-2 border-primary-500 border-t-transparent animate-spin"></div>
      </div>

      <ErrorBanner v-else-if="loadError" :message="loadError" />

      <div v-else class="space-y-5">

        <!-- Customer & Quotation Info -->
        <FormCard :title="t('erp.quotations.quotationInfo')" :icon="UserIcon" icon-color="primary" :padded="false">
          <div class="px-6 py-5 grid grid-cols-1 lg:grid-cols-3 gap-x-6 gap-y-5">

            <div class="lg:col-span-2">
              <FieldLabel :text="t('erp.quotations.customer')" />
              <div class="flex gap-2 items-start">
                <div class="flex-1 min-w-0 customer-field">
                  <SearchSelect v-model="form.customerId" :options="customers" :placeholder="`— ${t('erp.quotations.noCustomer')} —`">
                    <template #option="{ option }">{{ option.name }}<span v-if="option.company" class="text-[#9BA7B0]"> · {{ option.company }}</span></template>
                    <template #singleLabel="{ option }">{{ option.name }}<span v-if="option.company" class="text-[#9BA7B0]"> · {{ option.company }}</span></template>
                  </SearchSelect>
                </div>
                <button type="button" @click="openCustomerCreate"
                  :title="`${t('erp.quotations.newCustomer')} (Alt+C)`"
                  class="px-3 py-2.5 text-[12px] font-semibold border border-primary-200
                         text-primary-600 bg-primary-50 hover:bg-primary-100 transition-colors flex-shrink-0 inline-flex items-center gap-1.5">
                  <PlusIcon class="w-3.5 h-3.5" />
                  {{ t('erp.quotations.newCustomer') }}
                </button>
              </div>
              <CustomerChip :customer="selectedCustomer" />
            </div>

            <FormField name="referenceNumber" :label="t('erp.quotations.referenceNumber')" :errors="errors"
              v-model="form.referenceNumber" placeholder="e.g. PO-2025-001" />

            <FormField name="quotationDate" :label="t('erp.quotations.quotationDate')" :errors="errors" required>
              <template #default="{ hasError }">
                <DateInput v-model="form.quotationDate" :class="['input', hasError && 'input-error']" />
              </template>
            </FormField>

            <FormField name="validUntil" :label="t('erp.quotations.validUntil')" :errors="errors">
              <template #default>
                <DateInput v-model="form.validUntil" class="input" />
              </template>
            </FormField>

            <div>
              <FieldLabel :text="t('erp.common.currency')" />
              <CurrencySelector v-model="form.currency" v-model:exchangeRate="form.exchangeRate" :as-of-date="form.quotationDate" />
            </div>

            <FormField name="paymentTerms" :label="t('erp.quotations.paymentTerms')" :errors="errors">
              <template #default="{ id }">
                <select :id="id" v-model="form.paymentTerms" class="input">
                  <option value="">—</option>
                  <option v-for="opt in paymentTerms" :key="opt.id" :value="opt.code || opt.name">{{ opt.name }}</option>
                </select>
              </template>
            </FormField>

            <div>
              <FieldLabel :text="t('erp.quotations.salesperson')" />
              <SearchSelect v-model="form.salespersonId" :options="staff" placeholder="— Salesperson —">
                <template #option="{ option }">{{ option.name }}<span v-if="option.email" class="text-[#9BA7B0]"> · {{ option.email }}</span></template>
                <template #singleLabel="{ option }">{{ option.name }}</template>
              </SearchSelect>
            </div>

          </div>
        </FormCard>

        <!-- Addresses -->
        <FormCard :title="t('erp.quotations.addresses')" :icon="MapPinIcon" icon-color="primary" :padded="false">
          <template #actions>
            <button type="button" @click="syncAddressesFromCustomer"
              :disabled="!selectedCustomer?.address"
              class="inline-flex items-center gap-1.5 px-3.5 py-2 text-[12px] font-semibold
                     text-primary-600 bg-primary-50 hover:bg-primary-100 border border-primary-200
                     transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
              <ArrowPathIcon class="w-3.5 h-3.5" />
              {{ t('erp.quotations.useCustomerAddress') }}
            </button>
          </template>
          <div class="px-6 py-5 grid grid-cols-1 lg:grid-cols-2 gap-6">
            <FormField name="shippingAddress" :label="t('erp.quotations.shippingAddress')" :errors="errors"
              v-model="form.shippingAddress" textarea :rows="3" input-class="resize-none" />
            <div>
              <div class="flex items-center justify-between">
                <FieldLabel :text="t('erp.quotations.billingAddress')" />
                <label class="flex items-center gap-1.5 text-[11px] text-[#637381] cursor-pointer select-none">
                  <input type="checkbox" v-model="billingSameAsShipping" class="" />
                  {{ t('erp.quotations.sameAsShipping') }}
                </label>
              </div>
              <textarea v-model="form.billingAddress" rows="3"
                :disabled="billingSameAsShipping"
                class="w-full px-3.5 py-2.5 border border-[#E2E8F0] text-[13px] text-[#1C2434]
                       focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400
                       transition-all resize-none disabled:bg-[#F7F9FC] disabled:text-[#9BA7B0]" />
            </div>
          </div>
        </FormCard>

        <!-- Line Items -->
        <FormCard :title="t('erp.quotations.items')" :icon="ClipboardDocumentListIcon" icon-color="green"
          :subtitle="itemsSubtitle" :padded="false">
          <template #actions>
            <button @click="openBulkPicker" type="button"
              :title="`${t('erp.quotations.addItem')} (Ctrl+A)`"
              class="inline-flex items-center gap-1.5 px-3.5 py-2 text-[12px] font-semibold
                     text-primary-600 bg-primary-50 hover:bg-primary-100 border border-primary-200
                     transition-colors">
              <PlusIcon class="w-3.5 h-3.5" />
              {{ t('erp.quotations.addItem') }}
            </button>
          </template>

          <EmptyState v-if="!form.items.length"
            :icon="ClipboardDocumentListIcon"
            :title="t('erp.quotations.noItems')"
            :subtitle="t('erp.quotations.addItemsDesc')"
            :action-label="t('erp.quotations.addFirstItem')"
            :error-message="errors.items"
            @action="openBulkPicker" />

          <div v-else>
            <div class="grid items-center gap-3 px-5 py-2.5 bg-[#F7F9FC] border-b border-[#E2E8F0]"
              style="grid-template-columns: 1.8rem 2.5fr 1.4fr 2fr 4.5rem 6rem 4.5rem 5.5rem 5.5rem 1.5rem 2rem">
              <div class="text-[11px] font-semibold text-[#9BA7B0] uppercase tracking-wider text-center">#</div>
              <div class="text-[11px] font-semibold text-[#9BA7B0] uppercase tracking-wider">{{ t('erp.quotations.saleItem') }}</div>
              <div class="text-[11px] font-semibold text-[#9BA7B0] uppercase tracking-wider">{{ t('erp.quotations.store') }}</div>
              <div class="text-[11px] font-semibold text-[#9BA7B0] uppercase tracking-wider">{{ t('erp.quotations.description') }}</div>
              <div class="text-[11px] font-semibold text-[#9BA7B0] uppercase tracking-wider text-right">{{ t('erp.quotations.colQty') }}</div>
              <div class="text-[11px] font-semibold text-[#9BA7B0] uppercase tracking-wider text-right">{{ t('erp.quotations.colUnitPrice') }}</div>
              <div class="text-[11px] font-semibold text-[#9BA7B0] uppercase tracking-wider text-right">{{ t('erp.quotations.tax') }} %</div>
              <div class="text-[11px] font-semibold text-[#9BA7B0] uppercase tracking-wider text-right">{{ t('erp.quotations.tax') }}</div>
              <div class="text-[11px] font-semibold text-[#9BA7B0] uppercase tracking-wider text-right">{{ t('erp.quotations.amount') }}</div>
              <div></div>
              <div></div>
            </div>

            <div class="divide-y divide-[#E2E8F0]">
              <div v-for="(line, idx) in form.items" :key="line.key || idx"
                v-show="isRowVisible(line)"
                :data-line-key="line.key"
                class="grid items-center gap-3 px-5 py-3 transition-colors group border-l-2"
                :class="[
                  line.isPackage ? 'bg-primary-50/40 border-l-primary-400'
                    : (line.parentKey ? 'bg-[#F7F9FC]/60 hover:bg-[#F1F5F9] border-l-primary-200' : 'border-l-transparent hover:bg-[#F7F9FC]'),
                  dragFromIdx === topLevelStart(idx) ? 'opacity-40' : '',
                  dragOverIdx === topLevelStart(idx) && dragFromIdx !== topLevelStart(idx) ? 'border-t-2 border-t-primary-500' : '',
                ]"
                style="grid-template-columns: 1.8rem 2.5fr 1.4fr 2fr 4.5rem 6rem 4.5rem 5.5rem 5.5rem 1.5rem 2rem"
                @dragover="onDragOver($event, idx)"
                @drop="onDrop(idx)"
                @dragleave="onDragLeave(idx)">

                <div v-if="!line.parentKey"
                  draggable="true"
                  @dragstart="onDragStart($event, idx)"
                  @dragend="onDragEnd"
                  class="text-[12px] font-semibold text-center select-none flex items-center justify-center
                         cursor-grab active:cursor-grabbing hover:bg-[#E2E8F0]/60 h-7
                         text-[#CBD5E1] group-hover:text-[#637381]">
                  <Bars3Icon class="w-4 h-4 hidden group-hover:block" />
                  <span class="group-hover:hidden">{{ idx + 1 }}</span>
                </div>
                <div v-else class="text-[11px] text-[#CBD5E1] text-center select-none">↳</div>

                <div v-if="line.isPackage" class="flex items-center gap-1.5 text-[13px] font-semibold text-primary-700">
                  <button type="button" @click="toggleCollapse(line.key)"
                    class="flex items-center justify-center w-5 h-5 hover:bg-primary-100 text-primary-600 flex-shrink-0">
                    <ChevronRightIcon v-if="isCollapsed(line.key)" class="w-3.5 h-3.5" />
                    <ChevronDownIcon  v-else                       class="w-3.5 h-3.5" />
                  </button>
                  <CubeIcon class="w-4 h-4 flex-shrink-0" />
                  <span class="truncate">{{ line.productName }}</span>
                  <span class="text-[11px] font-normal text-[#9BA7B0]">· {{ t('erp.quotations.salePackage') }}</span>
                </div>
                <div v-else-if="line.parentKey" class="text-[12px] text-[#9BA7B0] truncate pl-2">
                  {{ t('erp.quotations.packageItem') }}
                </div>
                <SearchSelectPopup
                  v-else
                  v-model="line.saleItemId"
                  :options="groupedItemOptions"
                  group-values="items"
                  group-label="label"
                  placeholder="— Item —"
                  search-placeholder="Search by code or name…"
                  @change="onPickerChange(line, idx)"
                />

                <div>
                  <SearchSelect v-if="!line.isPackage && line.hasProduct" v-model="line.storeId" :options="stores" :invalid="line.hasProduct && !line.storeId" placeholder="— Store —" />
                  <div v-else class="flex items-center justify-center h-9">
                    <span class="text-[12px] text-[#CBD5E1]">—</span>
                  </div>
                </div>

                <div v-if="line.parentKey" class="flex items-center gap-2 pl-5 text-[13px] text-[#374151] truncate">
                  <span class="truncate">{{ line.productName }}</span>
                  <span class="text-[11px] font-semibold text-[#9BA7B0] tabular-nums flex-shrink-0">× {{ line.quantity }}</span>
                </div>
                <div v-else-if="line.isPackage" class="text-[12px] text-[#637381] italic">
                  {{ childrenOf(line.key).length }} item{{ childrenOf(line.key).length !== 1 ? 's' : '' }}
                </div>
                <input v-else v-model="line.productName" type="text" placeholder="Description…"
                  class="w-full px-2.5 py-2 border border-[#E2E8F0] text-[13px] text-[#1C2434]
                         focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400
                         transition-all placeholder:text-[#CBD5E1]" />

                <template v-if="line.parentKey">
                  <div></div><div></div><div></div><div></div><div></div>
                </template>
                <template v-else>
                  <input v-model.number="line.quantity" type="number" min="1"
                    class="w-full px-2 py-2 border border-[#E2E8F0] text-[13px] text-right
                           text-[#1C2434] tabular-nums focus:outline-none focus:ring-2
                           focus:ring-primary-500/20 focus:border-primary-400 transition-all" />

                  <input v-model.number="line.unitPrice" type="number" min="0" step="0.01" placeholder="0.00"
                    class="w-full px-2.5 py-2 border border-[#E2E8F0] text-[13px] text-right
                           text-[#1C2434] tabular-nums focus:outline-none focus:ring-2
                           focus:ring-primary-500/20 focus:border-primary-400 transition-all placeholder:text-[#CBD5E1]" />

                  <input v-model.number="line.taxRate" type="number" min="0" max="100" step="0.01" placeholder="0"
                    class="w-full px-2 py-2 border border-[#E2E8F0] text-[13px] text-right
                           text-[#1C2434] tabular-nums focus:outline-none focus:ring-2
                           focus:ring-primary-500/20 focus:border-primary-400 transition-all placeholder:text-[#CBD5E1]" />

                  <div class="text-[13px] text-[#637381] tabular-nums text-right">
                    {{ fmtMoney(lineTax(line)) }}
                  </div>

                  <div class="text-[13px] tabular-nums text-right"
                    :class="line.isPackage ? 'font-bold text-primary-700' : 'font-semibold text-[#1C2434]'">
                    {{ fmtMoney((line.quantity || 0) * (line.unitPrice || 0)) }}
                  </div>
                </template>

                <div></div>

                <button @click="removeLine(idx)" type="button"
                  class="w-7 h-7 flex items-center justify-center flex-shrink-0
                         text-[#CBD5E1] hover:text-red-500 hover:bg-red-50 transition-colors
                         opacity-0 group-hover:opacity-100">
                  <TrashIcon class="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            <div class="grid items-center gap-3 px-5 py-3.5 bg-[#F7F9FC] border-t border-[#E2E8F0]"
              style="grid-template-columns: 1.8rem 2.5fr 1.4fr 2fr 4.5rem 6rem 4.5rem 5.5rem 5.5rem 1.5rem 2rem">
              <div class="col-span-7 text-[11px] font-semibold text-[#9BA7B0] uppercase tracking-wider text-right">
                {{ t('erp.quotations.subtotal') }}
              </div>
              <div class="text-[13px] font-semibold text-[#637381] tabular-nums text-right">{{ fmtMoney(taxAmount) }}</div>
              <div class="text-[13px] font-bold text-[#1C2434] tabular-nums text-right">{{ fmtMoney(subtotal) }}</div>
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
            :options="groupedItemOptions"
            group-values="items"
            group-label="label"
            multiple
            hide-trigger
            search-placeholder="Search by code or name…"
            @submit="onBulkAdd"
          />
        </FormCard>

        <ErrorBanner :message="globalError" />

        <FormCard :title="t('erp.quotations.summary')" :icon="CalculatorIcon" icon-color="slate" :padded="false">
          <div class="px-6 py-5 grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
            <FormField name="notes" :label="t('erp.quotations.notes')" :errors="errors"
              v-model="form.notes" textarea wrapper-class="flex flex-col text-left"
              input-class="flex-1 min-h-[10rem]" />
            <dl class="w-full space-y-2.5">
              <div class="flex items-center justify-between text-[13px]">
                <dt class="text-[#637381]">{{ t('erp.quotations.subtotal') }}</dt>
                <dd class="font-semibold text-[#1C2434] tabular-nums">{{ fmtMoney(subtotal) }}</dd>
              </div>
              <div class="flex items-center justify-between text-[13px]">
                <dt class="text-[#637381]">{{ t('erp.quotations.tax') }}</dt>
                <dd class="font-semibold text-[#1C2434] tabular-nums">{{ fmtMoney(taxAmount) }}</dd>
              </div>
              <div class="flex items-center justify-between text-[13px] gap-3">
                <dt class="text-[#637381] flex-shrink-0">{{ t('erp.quotations.discount') }}</dt>
                <div class="flex items-center gap-1.5">
                  <select v-model="form.discountType"
                    class="px-2 py-1.5 border border-[#E2E8F0] text-[12px] bg-white
                           focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400">
                    <option value="">—</option>
                    <option value="percent">%</option>
                    <option value="fixed">{{ form.currency || '฿' }}</option>
                  </select>
                  <input v-model.number="form.discountValue" type="number" min="0" step="0.01" placeholder="0"
                    :disabled="!form.discountType"
                    class="w-20 px-2 py-1.5 border border-[#E2E8F0] text-[12px] text-right tabular-nums
                           focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400
                           disabled:bg-[#F7F9FC] disabled:text-[#9BA7B0]" />
                  <span class="text-[13px] font-semibold text-red-600 tabular-nums w-20 text-right">−{{ fmtMoney(discountAmount) }}</span>
                </div>
              </div>
              <div class="flex items-center justify-between pt-2.5 border-t border-[#E2E8F0]">
                <dt class="text-[11px] font-semibold text-[#9BA7B0] uppercase tracking-wider">{{ t('erp.quotations.total') }}</dt>
                <dd class="text-base font-bold text-[#1C2434] tabular-nums">{{ fmtMoney(grandTotal) }}</dd>
              </div>
            </dl>
          </div>
        </FormCard>

      </div>
    </div>

    <!-- Sticky save bar -->
    <div v-if="!loading && !loadError" class="sticky bottom-0 -mx-6 mt-6 px-6 py-3.5 bg-white/95 backdrop-blur border-t border-[#E2E8F0] shadow-[0_-4px_12px_rgba(15,23,42,0.05)] z-20
                flex items-center justify-between gap-3">
      <div class="flex items-center gap-4">
        <div>
          <p class="text-[10px] font-semibold text-[#9BA7B0] uppercase tracking-wider mb-0.5">{{ t('erp.quotations.total') }}</p>
          <p class="text-2xl font-extrabold tabular-nums leading-none text-primary-600">{{ fmtMoney(grandTotal) }}</p>
        </div>
        <span v-if="draftSavedAt" class="hidden sm:inline-flex items-center gap-1 text-[11px] text-emerald-600">
          <CheckIcon class="w-3.5 h-3.5" />
          {{ t('erp.quotations.savedDraft') }} · {{ savedAtRelative }}
        </span>
        <span v-else-if="dirty" class="hidden sm:inline-flex items-center gap-1 text-[11px] text-amber-600">
          <ExclamationTriangleIcon class="w-3.5 h-3.5" />
          {{ t('erp.quotations.unsavedChanges') }}
        </span>
      </div>
      <div class="flex items-center gap-2.5">
        <button @click="discard" type="button"
          class="px-4 py-2.5 text-sm font-medium text-[#637381] hover:text-[#1C2434] transition-colors">
          {{ t('erp.quotations.discard') }}
        </button>
        <button @click="saveDraft" :disabled="!canSave || savingDraft || saving" type="button"
          class="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold
                 bg-white text-primary-600 border border-primary-200 hover:bg-primary-50
                 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
          <ArrowPathIcon v-if="savingDraft" class="w-4 h-4 animate-spin" />
          <BookmarkSquareIcon v-else class="w-4 h-4" />
          {{ savingDraft ? t('erp.common.saving') : t('erp.quotations.saveDraft') }}
        </button>
        <button @click="save" :disabled="!canSave || saving || savingDraft" type="button"
          class="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-bold
                 bg-primary-500 text-white hover:bg-primary-600 shadow-sm
                 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
          <ArrowPathIcon v-if="saving" class="w-4 h-4 animate-spin" />
          <CheckIcon v-else class="w-4 h-4" />
          {{ saving ? t('erp.common.saving') : t('common.saveChanges') }}
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

    <!-- Inline customer create slide-over -->
    <Teleport to="body">
      <div v-if="customerCreateOpen" class="fixed inset-0 z-50 flex">
        <div class="flex-1 bg-black/30" @click="closeCustomerCreate"></div>
        <div class="w-full max-w-md bg-white shadow-2xl overflow-y-auto flex flex-col">
          <div class="px-6 py-4 border-b border-[#E2E8F0] flex items-center justify-between">
            <h3 class="text-base font-semibold text-[#1C2434]">{{ t('erp.quotations.newCustomer') }}</h3>
            <button @click="closeCustomerCreate" type="button"
              class="w-8 h-8 hover:bg-[#F1F5F9] text-[#637381] flex items-center justify-center">
              <XMarkIcon class="w-4 h-4" />
            </button>
          </div>
          <div class="flex-1 px-6 py-5 space-y-4">
            <FormField name="customerName" :label="t('erp.customers.name')" :errors="{}" required>
              <template #default="{ id }">
                <input :id="id" v-model="newCustomer.name" ref="newCustomerNameRef" type="text"
                  placeholder="Customer name" class="input" />
              </template>
            </FormField>
            <FormField name="customerCompany" :label="t('erp.customers.company')" :errors="{}"
              v-model="newCustomer.company" />
            <div class="grid grid-cols-2 gap-4">
              <FormField name="customerEmail" :label="t('erp.customers.email')" :errors="{}"
                v-model="newCustomer.email" type="email" />
              <FormField name="customerPhone" :label="t('erp.customers.phone')" :errors="{}"
                v-model="newCustomer.phone" />
            </div>
            <FormField name="customerAddress" :label="t('erp.customers.address')" :errors="{}"
              v-model="newCustomer.address" textarea :rows="3" input-class="resize-none" />
            <p v-if="newCustomerError" class="text-[12px] text-red-600">{{ newCustomerError }}</p>
          </div>
          <div class="px-6 py-4 border-t border-[#E2E8F0] flex items-center justify-end gap-2">
            <button @click="closeCustomerCreate" type="button"
              class="px-4 py-2 text-sm text-[#637381] hover:text-[#1C2434]">{{ t('common.cancel') }}</button>
            <button @click="saveCustomer" :disabled="newCustomerSaving" type="button"
              class="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-semibold bg-primary-500 text-white hover:bg-primary-600 disabled:opacity-50">
              <ArrowPathIcon v-if="newCustomerSaving" class="w-4 h-4 animate-spin" />
              <CheckIcon v-else class="w-4 h-4" />
              {{ newCustomerSaving ? t('erp.common.creating') : t('common.save') }}
            </button>
          </div>
        </div>
      </div>
    </Teleport>
  </AppLayout>
</template>

<script setup>
import { ref, computed, watch, nextTick, onMounted, onUnmounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute, useRouter, onBeforeRouteLeave } from 'vue-router'
import {
  PlusIcon, TrashIcon, XMarkIcon, CheckIcon,
  ArrowPathIcon, UserIcon, ClipboardDocumentListIcon,
  CalculatorIcon, ExclamationTriangleIcon,
  Bars3Icon, CubeIcon, ChevronDownIcon, ChevronRightIcon,
  MapPinIcon, BookmarkSquareIcon,
} from '@heroicons/vue/24/outline'
import AppLayout from '@/layouts/AppLayout.vue'
import CurrencySelector from '@/components/CurrencySelector.vue'
import SearchSelect from '@/components/SearchSelect.vue'
import SearchSelectPopup from '@/components/SearchSelectPopup.vue'
import PageHeader from '@/components/form/PageHeader.vue'
import FormCard from '@/components/form/FormCard.vue'
import FormField from '@/components/form/FormField.vue'
import FieldLabel from '@/components/form/FieldLabel.vue'
import ErrorBanner from '@/components/form/ErrorBanner.vue'
import StatusPill from '@/components/form/StatusPill.vue'
import HeaderSaveActions from '@/components/form/HeaderSaveActions.vue'
import CustomerChip from '@/components/form/CustomerChip.vue'
import EmptyState from '@/components/form/EmptyState.vue'
import { useFieldErrors } from '@/composables/useFieldErrors'
import api from '@/api'
import { fmtMoney, toFixed } from '@/utils/fmt'
import { parseApiError } from '@/utils/apiError'
import { useSettingsStore } from '@/stores/settings'

const { t }    = useI18n()
const route    = useRoute()
const router   = useRouter()
const settings = useSettingsStore()

const quotation    = ref(null)
const customers    = ref([])
const saleItems    = ref([])
const salePackages = ref([])
const stores       = ref([])
const staff        = ref([])
const loading      = ref(true)
const loadError    = ref('')
const billingSameAsShipping = ref(false)

const paymentTerms = ref([])
const globalError  = ref('')
const saving       = ref(false)
const savingDraft  = ref(false)
const draftSavedAt = ref(null)
const errors       = ref({})
const { setFromError, reset: resetErrors } = useFieldErrors()

const customerCreateOpen = ref(false)
const newCustomer        = ref({ name: '', company: '', email: '', phone: '', address: '' })
const newCustomerError   = ref('')
const newCustomerSaving  = ref(false)
const newCustomerNameRef = ref(null)

const form = ref({
  customerId: '', quotationDate: '', validUntil: '',
  currency: '', exchangeRate: 1, notes: '', items: [],
  referenceNumber: '', paymentTerms: '', salespersonId: '',
  shippingAddress: '', billingAddress: '',
  discountType: '', discountValue: 0,
})

const dirty = ref(false)
let dirtyArmed = false
watch(form, () => { if (dirtyArmed) dirty.value = true }, { deep: true })

function onBeforeUnload(e) {
  if (!dirty.value) return
  e.preventDefault()
  e.returnValue = t('erp.quotations.unsavedChanges')
}
onMounted(() => window.addEventListener('beforeunload', onBeforeUnload))
onUnmounted(() => window.removeEventListener('beforeunload', onBeforeUnload))

const confirmOpen     = ref(false)
const confirmTitle    = ref('')
const confirmMessage  = ref('')
const confirmOkLabel  = ref('OK')
let confirmResolver   = null
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
    title:   t('erp.quotations.unsavedChanges'),
    message: t('erp.quotations.unsavedChangesHint'),
    okLabel: t('erp.quotations.discard'),
  })
})

const selectedCustomer = computed(() =>
  form.value.customerId ? customers.value.find(c => c.id === form.value.customerId) : null
)

const groupedItemOptions = computed(() => {
  const groups = [{ label: t('erp.quotations.saleItems'), items: saleItems.value }]
  if (salePackages.value.length) {
    groups.push({
      label: t('erp.quotations.salePackages'),
      items: salePackages.value.map(p => ({ ...p, name: `📦 ${p.name}` })),
    })
  }
  return groups
})

let _localKeyCounter = 0
function newKey() {
  return (typeof crypto !== 'undefined' && crypto.randomUUID)
    ? crypto.randomUUID()
    : `k${Date.now()}-${++_localKeyCounter}`
}

onMounted(async () => {
  const id = route.params.id
  const [quotationRes, customersRes, saleItemsRes, salePackagesRes, storesRes, staffRes, paymentTermsRes] = await Promise.allSettled([
    api.get(`/erp/quotations/${id}`),
    api.get('/erp/customers',     { params: { limit: 200 } }),
    api.get('/erp/sale-items',    { params: { limit: 500, status: 'active' } }),
    api.get('/erp/sale-packages', { params: { limit: 200, status: 'active' } }),
    api.get('/erp/stores',        { params: { limit: 200 } }),
    api.get('/organizations/staff'),
    api.get('/erp/master-data/payment-terms'),
  ])
  if (customersRes.status    === 'fulfilled') customers.value    = customersRes.value.data.data.customers
  if (saleItemsRes.status    === 'fulfilled') saleItems.value    = saleItemsRes.value.data.data.items
  if (salePackagesRes.status === 'fulfilled') salePackages.value = salePackagesRes.value.data.data.items
  if (storesRes.status       === 'fulfilled') stores.value       = storesRes.value.data.data.stores
  if (staffRes.status        === 'fulfilled') staff.value        = staffRes.value.data.data.staff
  if (paymentTermsRes.status === 'fulfilled') paymentTerms.value = paymentTermsRes.value.data.data.values || []

  if (quotationRes.status !== 'fulfilled') {
    loadError.value = parseApiError(quotationRes.reason, 'Failed to load quotation')
    loading.value = false
    return
  }

  const q = quotationRes.value.data.data.quotation
  if (q.status !== 'draft') {
    router.replace(`/erp/quotations/${id}`)
    return
  }
  quotation.value = q

  const idToKey = new Map()
  for (const it of q.items || []) idToKey.set(it.id, newKey())

  billingSameAsShipping.value = !!q.shippingAddress && q.shippingAddress === q.billingAddress

  form.value = {
    customerId:    q.customerId    || '',
    quotationDate: q.quotationDate || '',
    validUntil:    q.validUntil    || '',
    currency:      q.currency      || '',
    exchangeRate:  q.exchangeRate != null ? Number(q.exchangeRate) : 1,
    notes:         q.notes         || '',
    referenceNumber: q.referenceNumber || '',
    paymentTerms:    q.paymentTerms    || '',
    salespersonId:   q.salespersonId   || '',
    shippingAddress: q.shippingAddress || '',
    billingAddress:  q.billingAddress  || '',
    discountType:    q.discountType    || '',
    discountValue:   Number(q.discountValue) || 0,
    items: (q.items || []).map(it => {
      const si = saleItems.value.find(s => s.id === it.saleItemId)
      const hasProduct = !!(it.productId || si?.productId)
      const isPackage = !!it.salePackageId && !it.parentItemId
      return {
        key:           idToKey.get(it.id),
        parentKey:     it.parentItemId ? (idToKey.get(it.parentItemId) || '') : '',
        isPackage,
        salePackageId: it.salePackageId || '',
        saleItemId:    it.saleItemId    || '',
        storeId:       it.storeId       || '',
        hasProduct:    isPackage ? false : hasProduct,
        productName:   it.productName || '',
        quantity:      Number(it.quantity) || 1,
        unitPrice:     it.unitPrice != null ? Number(it.unitPrice) : 0,
        taxRate:       it.taxRate   != null ? Number(it.taxRate)   : 0,
      }
    }),
  }
  loading.value = false
  await nextTick()
  dirtyArmed = true
})

watch(() => form.value.customerId, (id) => {
  const c = customers.value.find(x => x.id === id)
  if (!c) return
  if (!form.value.shippingAddress && c.address) form.value.shippingAddress = c.address
})

watch(billingSameAsShipping, (on) => {
  if (on) form.value.billingAddress = form.value.shippingAddress
})
watch(() => form.value.shippingAddress, (v) => {
  if (billingSameAsShipping.value) form.value.billingAddress = v
})

function syncAddressesFromCustomer() {
  const c = selectedCustomer.value
  if (!c?.address) return
  form.value.shippingAddress = c.address
  if (billingSameAsShipping.value) form.value.billingAddress = c.address
}

function openCustomerCreate() {
  newCustomer.value = { name: '', company: '', email: '', phone: '', address: '' }
  newCustomerError.value = ''
  customerCreateOpen.value = true
  setTimeout(() => newCustomerNameRef.value?.focus(), 50)
}
function closeCustomerCreate() {
  customerCreateOpen.value = false
}
async function saveCustomer() {
  newCustomerError.value = ''
  if (!newCustomer.value.name?.trim()) { newCustomerError.value = 'Name is required'; return }
  newCustomerSaving.value = true
  try {
    const { data } = await api.post('/erp/customers', { ...newCustomer.value, status: 'active' })
    const c = data.data?.customer || data.data
    if (c?.id) {
      customers.value = [c, ...customers.value]
      form.value.customerId = c.id
    }
    customerCreateOpen.value = false
  } catch (err) {
    newCustomerError.value = parseApiError(err, 'Failed to create customer')
  } finally {
    newCustomerSaving.value = false
  }
}

function onPageKeydown(e) {
  const ctrl  = e.ctrlKey || e.metaKey
  const shift = e.shiftKey
  const alt   = e.altKey
  const key   = e.key.toLowerCase()
  if (customerCreateOpen.value) {
    if (e.key === 'Escape') { e.preventDefault(); closeCustomerCreate() }
    return
  }
  if      (ctrl && shift && key === 's') { e.preventDefault(); save() }
  else if (ctrl && key === 's')          { e.preventDefault(); saveDraft() }
  else if (ctrl && key === 'a')          { e.preventDefault(); openBulkPicker() }
  else if (alt  && key === 'i')          { e.preventDefault(); openBulkPicker() }
  else if (alt  && key === 'c')          { e.preventDefault(); openCustomerCreate() }
}
onMounted(() => document.addEventListener('keydown', onPageKeydown))
onUnmounted(() => document.removeEventListener('keydown', onPageKeydown))

function defaultTaxRate() {
  for (let i = form.value.items.length - 1; i >= 0; i--) {
    if (form.value.items[i].isPackage) continue
    return Number(form.value.items[i].taxRate) || 0
  }
  return Number(settings.tax?.rate) || 0
}

function removeLine(idx) {
  const line = form.value.items[idx]
  if (line.isPackage) {
    form.value.items = form.value.items.filter(it => it.key !== line.key && it.parentKey !== line.key)
  } else {
    form.value.items.splice(idx, 1)
  }
}

function childrenOf(parentKey) {
  return form.value.items.filter(it => it.parentKey === parentKey)
}

const collapsedPackages = ref(new Set())
function isCollapsed(key) { return collapsedPackages.value.has(key) }
function toggleCollapse(key) {
  const next = new Set(collapsedPackages.value)
  if (next.has(key)) next.delete(key)
  else               next.add(key)
  collapsedPackages.value = next
}
function isRowVisible(line) {
  return !(line.parentKey && isCollapsed(line.parentKey))
}

const dragFromIdx = ref(null)
const dragOverIdx = ref(null)
function topLevelStart(idx) {
  const line = form.value.items[idx]
  if (!line || !line.parentKey) return idx
  return form.value.items.findIndex(it => it.key === line.parentKey)
}
function groupSpan(startIdx) {
  const start = form.value.items[startIdx]
  if (!start || !start.isPackage) return 1
  let n = 1
  for (let i = startIdx + 1; i < form.value.items.length; i++) {
    if (form.value.items[i].parentKey === start.key) n++
    else break
  }
  return n
}
function onDragStart(e, idx) {
  const top = topLevelStart(idx)
  dragFromIdx.value = top
  e.dataTransfer.effectAllowed = 'move'
  e.dataTransfer.setData('text/plain', String(top))
}
function onDragOver(e, idx) {
  if (dragFromIdx.value === null) return
  e.preventDefault()
  e.dataTransfer.dropEffect = 'move'
  dragOverIdx.value = topLevelStart(idx)
}
function onDragLeave(idx) {
  if (dragOverIdx.value === topLevelStart(idx)) dragOverIdx.value = null
}
function onDrop(idx) {
  const from = dragFromIdx.value
  const to   = topLevelStart(idx)
  if (from === null || from === to) { onDragEnd(); return }
  const fromSpan   = groupSpan(from)
  const targetSpan = groupSpan(to)
  const moved = form.value.items.splice(from, fromSpan)
  const insertAt = from < to ? (to - fromSpan) + targetSpan : to
  form.value.items.splice(insertAt, 0, ...moved)
  onDragEnd()
}
function onDragEnd() {
  dragFromIdx.value = null
  dragOverIdx.value = null
}

function getBestPricing(si, customerGroupId) {
  const pricings = si.pricings || []
  if (!pricings.length) return null
  if (customerGroupId) {
    const match = pricings.find(p => p.customerGroupId === customerGroupId)
    if (match) return match
  }
  return pricings.find(p => !p.customerGroupId) || pricings[0]
}

function applyPricing(line) {
  if (!line.saleItemId) return
  const si = saleItems.value.find(s => s.id === line.saleItemId)
  if (!si) return
  const customer = customers.value.find(c => c.id === form.value.customerId)
  const pricing = getBestPricing(si, customer?.customerGroupId)
  if (pricing) line.unitPrice = Number(pricing.unitPrice)
}

function onSaleItemChange(line) {
  const si = saleItems.value.find(s => s.id === line.saleItemId)
  if (!si) { line.productName = ''; line.unitPrice = 0; line.hasProduct = false; line.storeId = ''; return }
  line.productName = si.name
  line.hasProduct  = !!si.productId
  if (!line.hasProduct) line.storeId = ''
  applyPricing(line)
}

async function onPickerChange(line, idx) {
  const id = line.saleItemId
  if (!id) { onSaleItemChange(line); return }
  if (saleItems.value.some(s => s.id === id)) { onSaleItemChange(line); return }
  if (salePackages.value.some(p => p.id === id)) {
    await expandPackageInto(idx, id)
  }
}

async function linesFromPackage(packageId) {
  try {
    const { data } = await api.get(`/erp/sale-packages/${packageId}`)
    const pkg = data.data.package
    const customer = customers.value.find(c => c.id === form.value.customerId)
    const parentKey = newKey()
    let parentPrice = 0
    const children = (pkg.packageItems || []).map(pi => {
      const si = pi.saleItem || saleItems.value.find(s => s.id === pi.saleItemId) || {}
      const hasProduct = !!(si.productId || saleItems.value.find(s => s.id === pi.saleItemId)?.productId)
      let resolved = pi.unitPrice != null ? Number(pi.unitPrice) : 0
      if (!resolved) {
        const siFull = saleItems.value.find(s => s.id === pi.saleItemId)
        const pricing = siFull ? getBestPricing(siFull, customer?.customerGroupId) : null
        if (pricing) resolved = Number(pricing.unitPrice)
      }
      const childQty = Number(pi.quantity) || 1
      parentPrice += childQty * resolved
      return {
        key: newKey(), parentKey,
        isPackage: false, salePackageId: '',
        saleItemId: pi.saleItemId, storeId: '',
        hasProduct, productName: si.name || 'Item',
        quantity: childQty, unitPrice: 0, taxRate: 0,
      }
    })
    const parent = {
      key: parentKey, parentKey: '',
      isPackage: true, salePackageId: pkg.id,
      saleItemId: '', storeId: '',
      hasProduct: false, productName: pkg.name,
      quantity: 1, unitPrice: parentPrice,
      taxRate: Number(settings.tax?.rate) || 0,
    }
    return [parent, ...children]
  } catch {
    return []
  }
}

async function expandPackageInto(idx, packageId) {
  const lines = await linesFromPackage(packageId)
  if (lines.length) form.value.items.splice(idx, 1, ...lines)
  else              form.value.items.splice(idx, 1)
}

const bulkPickerRef = ref(null)
function openBulkPicker() { bulkPickerRef.value?.open() }

function makeLineFromSaleItem(si, parentKey = '') {
  const customer = customers.value.find(c => c.id === form.value.customerId)
  const pricing  = getBestPricing(si, customer?.customerGroupId)
  return {
    key: newKey(), parentKey,
    isPackage: false, salePackageId: '',
    saleItemId: si.id, storeId: '',
    hasProduct: !!si.productId,
    productName: si.name,
    quantity: 1,
    unitPrice: pricing ? Number(pricing.unitPrice) : 0,
    taxRate: defaultTaxRate(),
  }
}

async function onBulkAdd(objects) {
  const newLines = []
  for (const obj of objects) {
    if (saleItems.value.some(s => s.id === obj.id)) {
      newLines.push(makeLineFromSaleItem(obj))
    } else if (salePackages.value.some(p => p.id === obj.id)) {
      const lines = await linesFromPackage(obj.id)
      newLines.push(...lines)
    }
  }
  if (!newLines.length) return
  form.value.items.push(...newLines)
  await nextTick()
  const firstPriced = newLines.find(l => !l.parentKey)
  if (!firstPriced) return
  const row = document.querySelector(`[data-line-key="${firstPriced.key}"]`)
  const qty = row?.querySelector('input[type="number"]')
  qty?.focus()
  qty?.select?.()
}

watch(() => form.value.customerId, () => {
  for (const line of form.value.items) applyPricing(line)
})

function lineTax(line) {
  if (line.parentKey) return 0
  return (line.quantity || 0) * (line.unitPrice || 0) * ((line.taxRate || 0) / 100)
}
const itemsSubtitle = computed(() => {
  const standalone = form.value.items.filter(i => !i.parentKey && !i.isPackage).length
  const packages   = form.value.items.filter(i =>  i.isPackage).length
  if (!standalone && !packages) return 'No items yet'
  const parts = []
  if (standalone) parts.push(`${standalone} item${standalone !== 1 ? 's' : ''}`)
  if (packages)   parts.push(`${packages} package${packages !== 1 ? 's' : ''}`)
  return parts.join(' · ')
})
const subtotal   = computed(() => form.value.items.reduce((s, i) => i.parentKey ? s : s + (i.quantity || 0) * (i.unitPrice || 0), 0))
const taxAmount  = computed(() => toFixed(form.value.items.reduce((s, i) => s + lineTax(i), 0), 2))
const discountAmount = computed(() => {
  const gross = subtotal.value + Number(taxAmount.value)
  const v = Number(form.value.discountValue) || 0
  if (form.value.discountType === 'percent') return toFixed(gross * v / 100, 2)
  if (form.value.discountType === 'fixed')   return toFixed(Math.min(v, gross), 2)
  return 0
})
const grandTotal = computed(() => subtotal.value + Number(taxAmount.value) - Number(discountAmount.value))

const canSave = computed(() => {
  if (!form.value.quotationDate) return false
  if (!form.value.items.filter(i => !i.parentKey).length) return false
  for (const item of form.value.items) {
    if (item.isPackage) {
      if (!item.quantity || item.quantity < 1) return false
      continue
    }
    if (!item.productName?.trim()) return false
    if (item.hasProduct && !item.storeId) return false
    if (!item.quantity || item.quantity < 1) return false
  }
  return true
})

function validate() {
  const e = {}
  if (!form.value.quotationDate) e.quotationDate = 'Quotation date is required'
  const pricedCount = form.value.items.filter(i => !i.parentKey).length
  if (!pricedCount) e.items = 'Add at least one item'
  for (const item of form.value.items) {
    if (item.isPackage) {
      if (!item.quantity || item.quantity < 1) { e.items = 'Package quantity must be at least 1'; break }
      continue
    }
    if (!item.productName?.trim())        { e.items = 'All items need a description'; break }
    if (item.hasProduct && !item.storeId) { e.items = 'Select a store for product items'; break }
    if (!item.quantity || item.quantity < 1) { e.items = 'All items need a valid quantity'; break }
  }
  errors.value = e
  return Object.keys(e).length === 0
}

async function save({ redirect = true } = {}) {
  globalError.value = ''
  resetErrors()
  if (!validate()) return
  if (redirect) saving.value = true
  else          savingDraft.value = true
  try {
    const payload = {
      customerId:    form.value.customerId   || null,
      quotationDate: form.value.quotationDate,
      validUntil:    form.value.validUntil   || null,
      currency:      form.value.currency     || null,
      exchangeRate:  form.value.exchangeRate,
      notes:         form.value.notes,
      referenceNumber: form.value.referenceNumber || null,
      paymentTerms:    form.value.paymentTerms    || null,
      salespersonId:   form.value.salespersonId   || null,
      shippingAddress: form.value.shippingAddress || null,
      billingAddress:  form.value.billingAddress  || null,
      discountType:    form.value.discountType    || null,
      discountValue:   Number(form.value.discountValue) || 0,
      items: form.value.items.map(({ key, parentKey, salePackageId, saleItemId, storeId, productName, quantity, unitPrice, taxRate }) => ({
        key, parentKey: parentKey || '',
        salePackageId: salePackageId || null,
        saleItemId:    saleItemId    || null,
        storeId:       storeId       || null,
        productName, quantity, unitPrice,
        taxRate: Number(taxRate) || 0,
      })),
    }
    await api.put(`/erp/quotations/${route.params.id}`, payload)
    dirty.value = false
    if (redirect) {
      router.push(`/erp/quotations/${route.params.id}`)
    } else {
      draftSavedAt.value = new Date()
    }
  } catch (err) {
    const had = setFromError(err)
    if (!had) globalError.value = parseApiError(err, 'Failed to update quotation')
  } finally {
    saving.value = false
    savingDraft.value = false
  }
}

function saveDraft() { save({ redirect: false }) }

async function discard() {
  if (dirty.value) {
    const ok = await confirmAsync({
      title:   t('erp.quotations.unsavedChanges'),
      message: t('erp.quotations.unsavedChangesHint'),
      okLabel: t('erp.quotations.discard'),
    })
    if (!ok) return
  }
  router.push(`/erp/quotations/${route.params.id}`)
}

const _now = ref(Date.now())
onMounted(() => { const id = setInterval(() => { _now.value = Date.now() }, 15000); onUnmounted(() => clearInterval(id)) })
const savedAtRelative = computed(() => {
  if (!draftSavedAt.value) return ''
  const secs = Math.max(0, Math.round((_now.value - draftSavedAt.value.getTime()) / 1000))
  if (secs < 60)   return `${secs}s ago`
  if (secs < 3600) return `${Math.round(secs / 60)}m ago`
  return `${Math.round(secs / 3600)}h ago`
})
</script>

<style scoped>
.customer-field :deep(.multiselect),
.customer-field :deep(.multiselect__tags),
.customer-field :deep(.multiselect__select) {
  cursor: default;
}
</style>
