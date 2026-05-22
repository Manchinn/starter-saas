<template>
  <AppLayout>
    <div class="space-y-5">

      <PageHeader :title="pageLoading ? t('erp.goodReceive.edit') : (refNo || t('erp.goodReceive.edit'))"
        :back-to="`/erp/good-receive/${route.params.id}`"
        :breadcrumb="[
          { label: t('erp.goodReceive.title'), to: '/erp/good-receive' },
          { label: refNo || '…', to: `/erp/good-receive/${route.params.id}` },
          { label: t('common.edit') },
        ]">
        <template #badge>
          <StatusPill :label="t('erp.common.draft')" />
        </template>
        <template #actions>
          <HeaderSaveActions
            :cancel-to="`/erp/good-receive/${route.params.id}`"
            :cancel-label="t('common.cancel')"
            :saving="saving"
            :saving-label="t('erp.common.saving')"
            :save-label="t('common.saveChanges')"
            :disabled="!canSave"
            :disabled-hint="t('erp.goodReceive.fillRequiredFields')"
            @save="save"
          />
        </template>
      </PageHeader>

      <!-- Loading -->
      <div v-if="pageLoading" class="flex items-center justify-center py-20">
        <div class="w-7 h-7 border-2 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
      </div>

      <!-- Load error -->
      <ErrorBanner v-else-if="loadError" :message="loadError" />

      <div v-else class="space-y-5">

        <!-- Header -->
        <FormCard :title="t('erp.goodReceive.header')" :icon="TruckIcon" icon-color="primary" :padded="false">
          <div class="px-6 py-5 grid grid-cols-1 lg:grid-cols-3 gap-x-6 gap-y-5">
            <div>
              <FieldLabel :text="t('erp.common.date')" required />
              <DateInput v-model="form.date"
                :class="['w-full px-3.5 py-2.5 border text-[13px] transition-all',
                         'focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400',
                         errors.date ? 'border-red-300 bg-red-50/50' : 'border-[#E2E8F0] text-[#1C2434]']" />
              <p v-if="errors.date" class="mt-1 text-[11px] text-red-500">{{ errors.date }}</p>
            </div>

            <div>
              <FieldLabel :text="t('erp.common.store')" required />
              <SearchSelect v-model="form.storeId" :options="stores" :invalid="!!errors.storeId" :placeholder="t('erp.common.selectStore')">
                <template #option="{ option }">{{ option.name }}<span v-if="option.code" class="text-[#9BA7B0]"> ({{ option.code }})</span></template>
                <template #singleLabel="{ option }">{{ option.name }}<span v-if="option.code" class="text-[#9BA7B0]"> ({{ option.code }})</span></template>
              </SearchSelect>
              <p v-if="errors.storeId" class="mt-1 text-[11px] text-red-500">{{ errors.storeId }}</p>
            </div>

            <div>
              <FieldLabel :text="t('erp.goodReceive.supplier')" />
              <input v-model="form.supplier" type="text" placeholder="Supplier name"
                class="w-full px-3.5 py-2.5 border border-[#E2E8F0] text-[13px] text-[#1C2434]
                       focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400
                       transition-all placeholder:text-[#9BA7B0]" />
            </div>

            <div class="lg:col-span-3">
              <FieldLabel :text="t('erp.common.notes')" />
              <input v-model="form.notes" type="text" placeholder="Optional notes"
                class="w-full px-3.5 py-2.5 border border-[#E2E8F0] text-[13px] text-[#1C2434]
                       focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400
                       transition-all placeholder:text-[#9BA7B0]" />
            </div>
          </div>

          <!-- Document type -->
          <div class="px-6 pb-5">
            <label class="block text-[11px] font-semibold text-[#637381] uppercase tracking-wider mb-2.5">
              {{ t('erp.goodReceive.docType') }} <span class="text-red-500 normal-case font-normal">*</span>
            </label>
            <div class="flex items-start gap-6 flex-wrap">
              <div class="flex items-center gap-1 p-1 bg-[#F1F5F9] rounded-lg w-fit flex-shrink-0">
                <button type="button" @click="form.docType = 'invoice'"
                  :class="form.docType === 'invoice' ? 'bg-white shadow text-[#1C2434]' : 'text-[#637381] hover:text-[#374151]'"
                  class="px-4 py-1.5 rounded-md text-sm font-medium transition">
                  {{ t('erp.goodReceive.invoice') }}
                </button>
                <button type="button" @click="form.docType = 'delivery'"
                  :class="form.docType === 'delivery' ? 'bg-white shadow text-[#1C2434]' : 'text-[#637381] hover:text-[#374151]'"
                  class="px-4 py-1.5 rounded-md text-sm font-medium transition">
                  {{ t('erp.goodReceive.delivery') }}
                </button>
              </div>

              <div v-if="form.docType === 'invoice'" class="grid grid-cols-1 sm:grid-cols-3 gap-4 flex-1 min-w-[300px]">
                <div>
                  <FieldLabel :text="t('erp.goodReceive.invoiceNo')" required />
                  <input v-model="form.invoiceNo" type="text" placeholder="e.g. INV-00123"
                    :class="['w-full px-3.5 py-2.5 border text-[13px] transition-all',
                             'focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400',
                             errors.invoiceNo ? 'border-red-300 bg-red-50/50' : 'border-[#E2E8F0] text-[#1C2434]',
                             'placeholder:text-[#CBD5E1]']" />
                  <p v-if="errors.invoiceNo" class="mt-1 text-[11px] text-red-500">{{ errors.invoiceNo }}</p>
                </div>
                <div>
                  <FieldLabel :text="t('erp.goodReceive.invoiceDate')" />
                  <DateInput v-model="form.invoiceDate"
                    class="w-full px-3.5 py-2.5 border border-[#E2E8F0] text-[13px] text-[#1C2434]
                           focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400 transition-all" />
                </div>
                <div>
                  <FieldLabel :text="t('erp.goodReceive.invoiceDiscount')" />
                  <input v-model.number="form.invoiceDiscount" type="number" min="0" step="0.01" placeholder="0.00"
                    class="w-full px-3.5 py-2.5 border border-[#E2E8F0] text-[13px] text-right text-[#1C2434] tabular-nums
                           focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400
                           transition-all placeholder:text-[#CBD5E1]" />
                </div>
              </div>

              <div v-if="form.docType === 'delivery'" class="flex-1 min-w-[200px]">
                <FieldLabel :text="t('erp.goodReceive.deliveryNo')" required />
                <input v-model="form.deliveryNo" type="text" placeholder="e.g. DN-00456"
                  :class="['w-full px-3.5 py-2.5 border text-[13px] transition-all',
                           'focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400',
                           errors.deliveryNo ? 'border-red-300 bg-red-50/50' : 'border-[#E2E8F0] text-[#1C2434]',
                           'placeholder:text-[#CBD5E1]']" />
                <p v-if="errors.deliveryNo" class="mt-1 text-[11px] text-red-500">{{ errors.deliveryNo }}</p>
              </div>
            </div>
          </div>
        </FormCard>

        <!-- Line items -->
        <FormCard :title="t('erp.goodReceive.lineItems')" :icon="ClipboardDocumentListIcon" icon-color="green"
          :subtitle="itemsSubtitle" :padded="false">
          <template #actions>
            <button @click="addRow" type="button"
              :title="`${t('erp.goodReceive.addItem')} (Ctrl+A)`"
              class="inline-flex items-center gap-1.5 px-3.5 py-2 text-[12px] font-semibold
                     text-primary-600 bg-primary-50 hover:bg-primary-100 border border-primary-200
                     rounded-xl transition-colors">
              <PlusIcon class="w-3.5 h-3.5" />
              {{ t('erp.goodReceive.addItem') }}
              <kbd class="hidden sm:inline ml-0.5 px-1.5 py-0.5 rounded bg-white/80 border border-primary-200 font-mono text-[10px] text-primary-700">Ctrl+A</kbd>
            </button>
          </template>

          <EmptyState v-if="!items.length"
            :icon="ClipboardDocumentListIcon"
            :title="t('erp.goodReceive.noItems')"
            :subtitle="t('erp.goodReceive.itemsHint')"
            :action-label="t('erp.goodReceive.addFirstItem')"
            :error-message="errors.items"
            @action="addRow" />

          <div v-else>
            <div class="grid items-center gap-2 px-5 py-2.5 bg-[#F7F9FC] border-b border-[#E2E8F0]
                        text-[11px] font-semibold text-[#9BA7B0] uppercase tracking-wider"
              style="grid-template-columns: 1.8rem 2.5fr 5rem 5rem 5.5rem 6rem 5.5rem 2rem 2rem">
              <div class="text-center">#</div>
              <div>{{ t('erp.common.product') }}</div>
              <div class="text-right">Qty</div>
              <div>UOM</div>
              <div class="text-right">Stock</div>
              <div class="text-right">Cost/Unit</div>
              <div class="text-right">{{ t('erp.goodReceive.netAmount') }}</div>
              <div class="text-center text-[9px]">More</div>
              <div></div>
            </div>

            <div class="divide-y divide-[#E2E8F0]">
              <template v-for="(item, i) in items" :key="i">
                <div class="group grid items-center gap-2 px-5 py-3 hover:bg-[#F7F9FC] transition-colors"
                  style="grid-template-columns: 1.8rem 2.5fr 5rem 5rem 5.5rem 6rem 5.5rem 2rem 2rem">
                  <div class="text-[12px] font-semibold text-[#9BA7B0] text-center select-none">{{ i + 1 }}</div>

                  <SearchSelect v-model="item.productId" :options="products" :invalid="!!errors.items && !item.productId" :placeholder="t('erp.common.selectProduct')">
                    <template #option="{ option }">{{ option.name }}<span v-if="option.sku" class="text-[#9BA7B0]"> [{{ option.sku }}]</span></template>
                    <template #singleLabel="{ option }">{{ option.name }}<span v-if="option.sku" class="text-[#9BA7B0]"> [{{ option.sku }}]</span></template>
                  </SearchSelect>

                  <input v-model.number="item.qty" @input="recalc(item)" type="number" min="0" step="0.01" placeholder="0"
                    class="w-full px-2 py-2 border border-[#E2E8F0] text-[13px] text-right text-[#1C2434] tabular-nums
                           focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400 transition-colors" />

                  <SearchSelect v-model="item.qtyUomId" :options="uoms" placeholder="—" label-key="abbreviation">
                    <template #option="{ option }">{{ option.abbreviation || option.name }}</template>
                    <template #singleLabel="{ option }">{{ option.abbreviation || option.name }}</template>
                  </SearchSelect>

                  <div class="text-right">
                    <div class="font-semibold text-[13px] tabular-nums" :class="convMap[item.qtyUomId] ? 'text-indigo-700' : 'text-[#637381]'">
                      {{ fmtQty(getStockQty(item)) }}
                    </div>
                    <div v-if="convMap[item.qtyUomId]" class="text-[10px] text-indigo-400">
                      {{ convMap[item.qtyUomId].toUomAbbr }}
                    </div>
                    <div v-else class="text-[10px] text-[#CBD5E1]">no conv.</div>
                  </div>

                  <input v-model.number="item.cost" @input="recalc(item)" type="number" min="0" step="0.0001" placeholder="0.0000"
                    class="w-full px-2 py-2 border border-[#E2E8F0] text-[13px] text-right text-[#1C2434] tabular-nums
                           focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400
                           transition-colors placeholder:text-[#CBD5E1]" />

                  <div class="text-[13px] font-semibold text-[#374151] tabular-nums text-right pr-1">
                    {{ fmtMoney(item.netAmount) }}
                  </div>

                  <button type="button" @click="toggleExpand(i)"
                    :class="expanded.has(i) ? 'bg-primary-100 text-primary-500' : 'text-[#9BA7B0] hover:text-[#637381]'"
                    class="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-medium transition mx-auto">
                    {{ expanded.has(i) ? '▲' : '▼' }}
                  </button>

                  <button @click="removeRow(i)" type="button"
                    class="opacity-0 group-hover:opacity-100 w-7 h-7 rounded-lg flex items-center justify-center
                           text-[#CBD5E1] hover:text-red-500 hover:bg-red-50 transition-all flex-shrink-0">
                    <TrashIcon class="w-3.5 h-3.5" />
                  </button>
                </div>

                <div v-if="expanded.has(i)" class="bg-[#F7F9FC] border-t border-[#E2E8F0] px-6 py-4">
                  <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                    <div>
                      <label class="block text-[11px] font-semibold text-[#637381] uppercase tracking-wider mb-1">{{ t('erp.goodReceive.freeQty') }}</label>
                      <input v-model.number="item.freeQty" @input="recalc(item)" type="number" min="0" step="0.01" placeholder="0"
                        class="w-full px-2.5 py-2 border border-[#E2E8F0] text-[13px] text-right bg-white text-[#1C2434] tabular-nums
                               focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400 transition-colors" />
                    </div>
                    <div>
                      <label class="block text-[11px] font-semibold text-[#637381] uppercase tracking-wider mb-1">{{ t('erp.goodReceive.freeUom') }}</label>
                      <SearchSelect v-model="item.freeQtyUomId" :options="uoms" placeholder="—" label-key="abbreviation">
                        <template #option="{ option }">{{ option.abbreviation || option.name }}</template>
                        <template #singleLabel="{ option }">{{ option.abbreviation || option.name }}</template>
                      </SearchSelect>
                    </div>
                    <div>
                      <label class="block text-[11px] font-semibold text-[#637381] uppercase tracking-wider mb-1">{{ t('erp.goodReceive.batchId') }}</label>
                      <input v-model="item.batchId" type="text" placeholder="Optional"
                        class="w-full px-2.5 py-2 border border-[#E2E8F0] text-[13px] bg-white text-[#1C2434]
                               focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400
                               transition-colors placeholder:text-[#CBD5E1]" />
                    </div>
                    <div>
                      <label class="block text-[11px] font-semibold text-[#637381] uppercase tracking-wider mb-1">{{ t('erp.goodReceive.expiryDate') }}</label>
                      <DateInput v-model="item.expiryDate"
                        class="w-full px-2.5 py-2 border border-[#E2E8F0] text-[13px] bg-white text-[#1C2434]
                               focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400 transition-colors" />
                    </div>
                    <div>
                      <label class="block text-[11px] font-semibold text-[#637381] uppercase tracking-wider mb-1">{{ t('erp.goodReceive.discPct') }}</label>
                      <div class="relative">
                        <input v-model.number="item.discountPct" @input="recalc(item)" type="number" min="0" max="100" step="0.01" placeholder="0"
                          class="w-full pl-2.5 pr-7 py-2 border border-[#E2E8F0] text-[13px] text-right bg-white text-[#1C2434] tabular-nums
                                 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400 transition-colors" />
                        <span class="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-[#9BA7B0]">%</span>
                      </div>
                    </div>
                    <div>
                      <label class="block text-[11px] font-semibold text-[#637381] uppercase tracking-wider mb-1">{{ t('erp.goodReceive.discount') }}</label>
                      <input v-model.number="item.discount" @input="recalc(item)" type="number" min="0" step="0.01" placeholder="0.00"
                        class="w-full px-2.5 py-2 border border-[#E2E8F0] text-[13px] text-right bg-white text-[#1C2434] tabular-nums
                               focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400
                               transition-colors placeholder:text-[#CBD5E1]" />
                    </div>
                    <div>
                      <label class="block text-[11px] font-semibold text-[#637381] uppercase tracking-wider mb-1">{{ t('erp.goodReceive.wac') }}</label>
                      <input :value="fmtRate(item.wac)" readonly type="text"
                        class="w-full px-2.5 py-2 border border-[#E2E8F0] bg-blue-50 text-[13px] text-right text-blue-700 font-mono cursor-default" />
                    </div>
                    <div class="col-span-2 sm:col-span-3 lg:col-span-5">
                      <label class="block text-[11px] font-semibold text-[#637381] uppercase tracking-wider mb-1">{{ t('erp.goodReceive.comments') }}</label>
                      <input v-model="item.comments" type="text" placeholder="Optional"
                        class="w-full px-2.5 py-2 border border-[#E2E8F0] text-[13px] bg-white text-[#1C2434]
                               focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400
                               transition-colors placeholder:text-[#CBD5E1]" />
                    </div>
                  </div>
                </div>
              </template>
            </div>

            <div class="grid items-center gap-2 px-5 py-3.5 bg-[#F7F9FC] border-t border-[#E2E8F0]"
              style="grid-template-columns: 1.8rem 2.5fr 5rem 5rem 5.5rem 6rem 5.5rem 2rem 2rem">
              <div class="col-span-6 text-[11px] font-semibold text-[#9BA7B0] uppercase tracking-wider text-right">
                {{ t('erp.goodReceive.totals') }}
              </div>
              <div class="text-[13px] font-bold text-[#1C2434] tabular-nums text-right pr-1">{{ fmtMoney(totalNet) }}</div>
              <div class="col-span-2"></div>
            </div>

            <p v-if="errors.items" class="px-5 py-2.5 text-[11px] text-red-600 bg-[#FEE2E2] border-t border-[#FECACA]">
              {{ errors.items }}
            </p>
          </div>
        </FormCard>

        <ErrorBanner :message="globalError" />

        <!-- Summary + notes -->
        <FormCard :title="t('erp.goodReceive.summary')" :icon="CalculatorIcon" icon-color="slate" :padded="false">
          <div class="px-6 py-5 grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
            <div class="flex flex-col text-left">
              <FieldLabel :text="t('erp.common.notes')" />
              <textarea v-model="form.notes" placeholder="Notes or special instructions…"
                class="flex-1 w-full min-h-[10rem] px-3.5 py-2.5 border border-[#E2E8F0] text-[13px] text-[#1C2434]
                       focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400
                       transition-all resize-none placeholder:text-[#9BA7B0]" />
            </div>
            <dl class="w-full space-y-2.5">
              <div class="flex items-center justify-between text-[13px]">
                <dt class="text-[#637381]">Items</dt>
                <dd class="font-semibold text-[#1C2434] tabular-nums">{{ items.length }}</dd>
              </div>
              <div class="flex items-center justify-between text-[13px]">
                <dt class="text-[#637381]">Gross Amount</dt>
                <dd class="font-semibold text-[#1C2434] tabular-nums">{{ fmtMoney(totalGross) }}</dd>
              </div>
              <div class="flex items-center justify-between text-[13px]">
                <dt class="text-[#637381]">Net Amount</dt>
                <dd class="font-semibold text-[#1C2434] tabular-nums">{{ fmtMoney(totalNet) }}</dd>
              </div>
              <div v-if="form.docType === 'invoice' && Number(form.invoiceDiscount) > 0"
                class="flex items-center justify-between text-[13px]">
                <dt class="text-[#637381]">{{ t('erp.goodReceive.invoiceDiscount') }}</dt>
                <dd class="font-semibold text-red-600 tabular-nums">−{{ fmtMoney(form.invoiceDiscount) }}</dd>
              </div>
              <div class="flex items-center justify-between pt-2.5 border-t border-[#E2E8F0]">
                <dt class="text-[11px] font-semibold text-[#9BA7B0] uppercase tracking-wider">{{ t('erp.goodReceive.netAmount') }}</dt>
                <dd class="text-base font-bold text-[#1C2434] tabular-nums">
                  {{ fmtMoney(form.docType === 'invoice' ? invoiceNetAmount : totalNet) }}
                </dd>
              </div>
            </dl>
          </div>
        </FormCard>

      </div>
    </div>

    <!-- Sticky save bar -->
    <div v-if="!pageLoading && !loadError"
      class="sticky bottom-0 -mx-6 mt-6 px-6 py-3.5 bg-white/95 backdrop-blur border-t border-[#E2E8F0] shadow-[0_-4px_12px_rgba(15,23,42,0.05)] z-20
             flex items-center justify-between gap-3">
      <div class="flex items-center gap-4">
        <div>
          <p class="text-[10px] font-semibold text-[#9BA7B0] uppercase tracking-wider mb-0.5">{{ t('erp.goodReceive.netAmount') }}</p>
          <p class="text-2xl font-extrabold tabular-nums leading-none text-primary-600">
            {{ fmtMoney(form.docType === 'invoice' ? invoiceNetAmount : totalNet) }}
          </p>
        </div>
        <span v-if="draftSavedAt" class="hidden sm:inline-flex items-center gap-1 text-[11px] text-emerald-600">
          <CheckIcon class="w-3.5 h-3.5" />
          {{ t('erp.goodReceive.savedDraft') }} · {{ savedAtRelative }}
        </span>
        <span v-else-if="dirty" class="hidden sm:inline-flex items-center gap-1 text-[11px] text-amber-600">
          <ExclamationTriangleIcon class="w-3.5 h-3.5" />
          {{ t('erp.goodReceive.unsavedChanges') }}
        </span>
      </div>
      <div class="flex items-center gap-2.5">
        <div class="hidden lg:flex items-center gap-3 text-[11px] text-[#9BA7B0] mr-1">
          <span class="flex items-center gap-1" :title="t('erp.goodReceive.saveDraft')">
            <kbd class="px-1.5 py-0.5 rounded border border-[#E2E8F0] bg-[#F7F9FC] font-mono text-[10px]">Ctrl+S</kbd>
            <span>draft</span>
          </span>
          <span class="flex items-center gap-1" :title="t('common.saveChanges')">
            <kbd class="px-1.5 py-0.5 rounded border border-[#E2E8F0] bg-[#F7F9FC] font-mono text-[10px]">Ctrl+Shift+S</kbd>
            <span>save</span>
          </span>
          <span class="flex items-center gap-1" :title="t('erp.goodReceive.addItem')">
            <kbd class="px-1.5 py-0.5 rounded border border-[#E2E8F0] bg-[#F7F9FC] font-mono text-[10px]">Ctrl+A</kbd>
            <span>item</span>
          </span>
        </div>
        <button @click="discard" type="button"
          class="px-4 py-2.5 text-sm font-medium text-[#637381] hover:text-[#1C2434] transition-colors">
          {{ t('erp.goodReceive.discard') }}
        </button>
        <button @click="saveDraft" :disabled="!canSave || savingDraft || saving" type="button"
          :title="!canSave ? t('erp.goodReceive.fillRequiredFields') : `${t('erp.goodReceive.saveDraft')} (Ctrl+S)`"
          class="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold
                 bg-white text-primary-600 border border-primary-200 hover:bg-primary-50 rounded-xl
                 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
          <ArrowPathIcon v-if="savingDraft" class="w-4 h-4 animate-spin" />
          <BookmarkSquareIcon v-else class="w-4 h-4" />
          {{ savingDraft ? t('erp.common.saving') : t('erp.goodReceive.saveDraft') }}
        </button>
        <button @click="save" :disabled="!canSave || saving || savingDraft" type="button"
          :title="!canSave ? t('erp.goodReceive.fillRequiredFields') : `${t('common.saveChanges')} (Ctrl+Shift+S)`"
          class="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-bold
                 bg-primary-500 text-white rounded-xl hover:bg-primary-600 shadow-sm
                 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
          <ArrowPathIcon v-if="saving" class="w-4 h-4 animate-spin" />
          <CheckIcon v-else class="w-4 h-4" />
          {{ saving ? t('erp.common.saving') : t('common.saveChanges') }}
        </button>
      </div>
    </div>

    <Teleport to="body">
      <div v-if="confirmOpen" class="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 px-4">
        <div class="w-full max-w-sm bg-white rounded-2xl shadow-2xl overflow-hidden">
          <div class="px-5 py-4 flex items-start gap-3">
            <div class="w-9 h-9 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0">
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
              class="px-4 py-2 text-sm font-semibold rounded-xl bg-red-500 text-white hover:bg-red-600 shadow-sm">
              {{ confirmOkLabel }}
            </button>
          </div>
        </div>
      </div>
    </Teleport>
  </AppLayout>
</template>

<script setup>
import { ref, reactive, computed, watch, onMounted, onUnmounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute, useRouter, onBeforeRouteLeave } from 'vue-router'
import {
  PlusIcon, TrashIcon, CheckIcon, ArrowPathIcon, ExclamationTriangleIcon,
  TruckIcon, ClipboardDocumentListIcon, CalculatorIcon, BookmarkSquareIcon,
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
import EmptyState from '@/components/form/EmptyState.vue'
import { useFieldErrors } from '@/composables/useFieldErrors'
import api from '@/api'
import { fmtMoney, fmtRate, toFixed } from '@/utils/fmt'
import { parseApiError } from '@/utils/apiError'

const { t } = useI18n()
const route  = useRoute()
const router = useRouter()
const products = ref([])
const stores   = ref([])
const uoms     = ref([])
const convMap  = ref({})
const form     = ref({
  date: '',
  storeId: '', supplier: '', notes: '',
  docType: 'invoice',
  invoiceNo: '', invoiceDate: '', deliveryNo: '',
  invoiceDiscount: 0,
})
const items    = ref([])
const expanded = reactive(new Set())
const errors      = ref({})
const globalError = ref('')
const saving      = ref(false)
const savingDraft = ref(false)
const draftSavedAt = ref(null)
const { setFromError, reset: resetErrors } = useFieldErrors()
const pageLoading = ref(true)
const loadError   = ref('')
const refNo       = ref('')

// Dirty tracking arms after the initial hydrate so loading existing data
// doesn't flag the form as dirty.
const dirty = ref(false)
let dirtyArmed = false
watch([form, items], () => { if (dirtyArmed) dirty.value = true }, { deep: true })

function onBeforeUnload(e) {
  if (!dirty.value) return
  e.preventDefault()
  e.returnValue = t('erp.goodReceive.unsavedChanges')
}
onMounted(() => window.addEventListener('beforeunload', onBeforeUnload))
onUnmounted(() => window.removeEventListener('beforeunload', onBeforeUnload))

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
    title:   t('erp.goodReceive.unsavedChanges'),
    message: t('erp.goodReceive.unsavedChangesHint'),
    okLabel: t('erp.goodReceive.discard'),
  })
})

onMounted(async () => {
  try {
    const [prodRes, storeRes, uomRes, convRes, grRes] = await Promise.all([
      api.get('/erp/item-master', { params: { limit: 200 } }),
      api.get('/erp/good-receive/stores-lookup'),
      api.get('/erp/uom'),
      api.get('/erp/uom-conversion'),
      api.get(`/erp/good-receive/${route.params.id}`),
    ])
    products.value = prodRes.data.data.products
    stores.value   = storeRes.data.data.stores
    uoms.value     = uomRes.data.data.uoms

    const map = {}
    for (const c of convRes.data.data.conversions) {
      map[c.fromUomId] = {
        factor:    parseFloat(c.factor),
        toUomAbbr: c.toUom?.abbreviation || c.toUom?.name || '',
      }
    }
    convMap.value = map

    const gr = grRes.data.data.goodReceive
    // Confirmed GRs can't be edited — bounce back to the detail view rather
    // than render a form the server will reject.
    if (gr.status !== 'draft') {
      router.push(`/erp/good-receive/${route.params.id}`)
      return
    }
    refNo.value = gr.refNo || ''
    form.value = {
      date:            gr.date || '',
      storeId:         gr.storeId || '',
      supplier:        gr.supplier || '',
      notes:           gr.notes || '',
      docType:         gr.docType || 'invoice',
      invoiceNo:       gr.invoiceNo || '',
      invoiceDate:     gr.invoiceDate || '',
      deliveryNo:      gr.deliveryNo || '',
      invoiceDiscount: Number(gr.invoiceDiscount) || 0,
    }
    items.value = (gr.items || []).map(i => ({
      productId:    i.productId,
      qty:          Number(i.qty),
      qtyUomId:     i.qtyUomId || '',
      freeQty:      Number(i.freeQty) || 0,
      freeQtyUomId: i.freeQtyUomId || '',
      batchId:      i.batchId || '',
      expiryDate:   i.expiryDate || '',
      cost:         Number(i.cost) || 0,
      discountPct:  Number(i.discountPct) || 0,
      discount:     Number(i.discount) || 0,
      netAmount:    Number(i.netAmount) || 0,
      wac:          Number(i.wac) || 0,
      comments:     i.comments || '',
    }))
  } catch {
    loadError.value = t('erp.goodReceive.notFound')
  } finally {
    pageLoading.value = false
    // Arm dirty tracking AFTER hydration so the initial load doesn't flag dirty
    setTimeout(() => { dirtyArmed = true }, 0)
  }
})

function newRow() {
  return {
    productId: '', qtyUomId: '', freeQtyUomId: '',
    qty: 1, freeQty: 0,
    batchId: '', expiryDate: '',
    cost: 0, discountPct: 0, discount: 0,
    netAmount: 0, wac: 0,
    comments: '',
  }
}

function recalc(item) {
  const qty     = parseFloat(item.qty)         || 0
  const cost    = parseFloat(item.cost)        || 0
  const freeQty = parseFloat(item.freeQty)     || 0
  const discPct = parseFloat(item.discountPct) || 0
  const discAmt = parseFloat(item.discount)    || 0
  const gross   = qty * cost
  item.netAmount = toFixed(gross * (1 - discPct / 100) - discAmt, 2)
  const totalQty = qty + freeQty
  item.wac = totalQty ? toFixed((qty * cost) / totalQty, 4) : 0
}

function getStockQty(item) {
  const qty         = parseFloat(item.qty)     || 0
  const freeQty     = parseFloat(item.freeQty) || 0
  const qtyFactor     = item.qtyUomId     && convMap.value[item.qtyUomId]     ? convMap.value[item.qtyUomId].factor     : 1
  const freeQtyFactor = item.freeQtyUomId && convMap.value[item.freeQtyUomId] ? convMap.value[item.freeQtyUomId].factor : 1
  return toFixed(qty * qtyFactor + freeQty * freeQtyFactor, 4)
}

function fmtQty(val) {
  const n = parseFloat(val) || 0
  return n % 1 === 0 ? String(n) : n.toFixed(4).replace(/\.?0+$/, '')
}

function toggleExpand(i) {
  expanded.has(i) ? expanded.delete(i) : expanded.add(i)
}

function addRow()      { items.value.push(newRow()) }
function removeRow(i)  { expanded.delete(i); items.value.splice(i, 1) }

const itemsSubtitle = computed(() =>
  items.value.length ? `${items.value.length} item${items.value.length !== 1 ? 's' : ''}` : ''
)
const totalGross = computed(() =>
  items.value.reduce((s, i) => s + (parseFloat(i.qty) || 0) * (parseFloat(i.cost) || 0), 0)
)
const totalNet = computed(() =>
  items.value.reduce((s, i) => s + (parseFloat(i.netAmount) || 0), 0)
)
const invoiceNetAmount = computed(() =>
  Math.max(0, totalNet.value - (parseFloat(form.value.invoiceDiscount) || 0))
)

const canSave = computed(() => {
  if (!form.value.date) return false
  if (!form.value.storeId) return false
  if (!items.value.length) return false
  if (form.value.docType === 'invoice'  && !form.value.invoiceNo?.trim())  return false
  if (form.value.docType === 'delivery' && !form.value.deliveryNo?.trim()) return false
  if (items.value.find(i => !i.productId || !i.qty || i.qty <= 0)) return false
  return true
})

function validate() {
  const e = {}
  if (!form.value.date)    e.date    = 'Date is required'
  if (!form.value.storeId) e.storeId = 'Store is required'
  if (form.value.docType === 'invoice'  && !form.value.invoiceNo?.trim())  e.invoiceNo  = 'Invoice Number is required'
  if (form.value.docType === 'delivery' && !form.value.deliveryNo?.trim()) e.deliveryNo = 'Delivery Number is required'
  if (!items.value.length) e.items = 'Add at least one item'
  else if (items.value.find(i => !i.productId || !i.qty || i.qty <= 0)) {
    e.items = 'All items must have a product and quantity > 0'
  }
  errors.value = e
  return Object.keys(e).length === 0
}

function onPageKeydown(e) {
  if (pageLoading.value || loadError.value) return
  const ctrl  = e.ctrlKey || e.metaKey
  const shift = e.shiftKey
  const key   = e.key.toLowerCase()
  if (confirmOpen.value) {
    if (e.key === 'Escape') { e.preventDefault(); confirmAnswer(false) }
    return
  }
  if      (ctrl && shift && key === 's') { e.preventDefault(); save() }
  else if (ctrl && key === 's')          { e.preventDefault(); saveDraft() }
  else if (ctrl && key === 'a')          { e.preventDefault(); addRow() }
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
      date:             form.value.date,
      storeId:          form.value.storeId,
      supplier:         form.value.supplier,
      notes:            form.value.notes,
      docType:          form.value.docType,
      invoiceNo:        form.value.docType === 'invoice'  ? form.value.invoiceNo        : null,
      invoiceDate:      form.value.docType === 'invoice'  ? form.value.invoiceDate      : null,
      invoiceDiscount:  form.value.docType === 'invoice'  ? (form.value.invoiceDiscount || 0) : 0,
      invoiceNetAmount: form.value.docType === 'invoice'  ? invoiceNetAmount.value       : 0,
      deliveryNo:       form.value.docType === 'delivery' ? form.value.deliveryNo        : null,
      items: items.value.map((i) => ({
        productId:    i.productId,
        qty:          i.qty,
        qtyUomId:     i.qtyUomId     || null,
        freeQty:      i.freeQty      || 0,
        freeQtyUomId: i.freeQtyUomId || null,
        batchId:      i.batchId      || null,
        expiryDate:   i.expiryDate   || null,
        cost:         i.cost         || 0,
        discountPct:  i.discountPct  || 0,
        discount:     i.discount     || 0,
        comments:     i.comments     || null,
      })),
    }
    await api.put(`/erp/good-receive/${route.params.id}`, payload)
    dirty.value = false
    if (redirect) {
      router.push(`/erp/good-receive/${route.params.id}`)
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

// "12s ago" / "2m ago" relative-time hint next to the saved indicator.
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
      title:   t('erp.goodReceive.unsavedChanges'),
      message: t('erp.goodReceive.unsavedChangesHint'),
      okLabel: t('erp.goodReceive.discard'),
    })
    if (!ok) return
  }
  router.push(`/erp/good-receive/${route.params.id}`)
}
</script>
