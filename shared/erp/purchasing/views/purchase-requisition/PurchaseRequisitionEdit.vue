<template>
  <AppLayout>
    <div class="space-y-5">

      <PageHeader :title="loading ? t('erp.purchasing.edit') : (req?.refNo || t('erp.purchasing.edit'))"
        :back-to="`/erp/purchasing/requisitions/${route.params.id}`"
        :breadcrumb="[
          { label: t('erp.purchasing.title'), to: '/erp/purchasing/requisitions' },
          { label: req?.refNo || '…', to: `/erp/purchasing/requisitions/${route.params.id}` },
          { label: t('common.edit') },
        ]">
        <template #badge>
          <StatusPill :label="t('erp.purchasing.statusDraft')" />
        </template>
        <template #actions>
          <HeaderSaveActions
            :cancel-to="`/erp/purchasing/requisitions/${route.params.id}`"
            :cancel-label="t('common.cancel')"
            :saving="saving"
            :saving-label="t('erp.common.saving')"
            :save-label="t('common.saveChanges')"
            :disabled="!canSave"
            :disabled-hint="t('erp.purchasing.fillRequiredFields')"
            @save="save"
          />
        </template>
      </PageHeader>

      <!-- Loading -->
      <div v-if="loading" class="flex items-center justify-center py-20">
        <div class="w-7 h-7 border-2 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
      </div>

      <!-- Not found / not draft -->
      <ErrorBanner v-else-if="loadError" :message="loadError" />

      <div v-else class="space-y-5">

        <!-- Requisition Info -->
        <FormCard :title="t('erp.purchasing.requisitionInfo')" :icon="ClipboardDocumentListIcon" icon-color="primary" :padded="false">
          <div class="px-6 py-5 grid grid-cols-1 lg:grid-cols-3 gap-x-6 gap-y-5">

            <!-- Vendor -->
            <div class="lg:col-span-2">
              <FieldLabel :text="t('erp.purchasing.vendor')" />
              <div class="flex gap-2 items-start">
                <div class="flex-1 min-w-0 vendor-field">
                  <SearchSelect v-model="form.vendorId" :options="vendors" :placeholder="`— ${t('erp.purchasing.noVendor')} —`">
                    <template #option="{ option }">{{ option.name }}<span v-if="option.code" class="text-[#9BA7B0]"> · {{ option.code }}</span></template>
                    <template #singleLabel="{ option }">{{ option.name }}<span v-if="option.code" class="text-[#9BA7B0]"> · {{ option.code }}</span></template>
                  </SearchSelect>
                </div>
                <button type="button" @click="openVendorCreate"
                  :title="`${t('erp.purchasing.newVendor')} (Alt+V)`"
                  class="px-3 py-2.5 text-[12px] font-semibold rounded-xl border border-primary-200
                         text-primary-600 bg-primary-50 hover:bg-primary-100 transition-colors flex-shrink-0 inline-flex items-center gap-1.5">
                  <PlusIcon class="w-3.5 h-3.5" />
                  {{ t('erp.purchasing.newVendor') }}
                  <kbd class="hidden lg:inline px-1.5 py-0.5 rounded bg-white/80 border border-primary-200 font-mono text-[10px] text-primary-700">Alt+V</kbd>
                </button>
              </div>
              <VendorChip :vendor="selectedVendor" />
            </div>

            <!-- Date -->
            <div>
              <FieldLabel :text="t('erp.purchasing.date')" required />
              <DateInput v-model="form.date"
                :class="['w-full px-3.5 py-2.5 border text-[13px] transition-all',
                         'focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400',
                         errors.date ? 'border-red-300 bg-red-50/50' : 'border-[#E2E8F0] text-[#1C2434]',
                         errorOf('date') && 'input-error']" />
              <p v-if="errors.date" class="mt-1 text-[11px] text-red-500">{{ errors.date }}</p>
              <FieldError name="date" :errors="fieldErrors" />
            </div>

            <!-- Requested By -->
            <div>
              <FieldLabel :text="t('erp.purchasing.requestedBy')" />
              <input v-model="form.requestedBy" type="text" :placeholder="t('erp.purchasing.requestedByPh')"
                class="w-full px-3.5 py-2.5 border border-[#E2E8F0] text-[13px] text-[#1C2434]
                       focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400
                       transition-all placeholder:text-[#9BA7B0]" />
            </div>

            <!-- Department -->
            <div>
              <FieldLabel :text="t('erp.purchasing.department')" />
              <input v-model="form.department" type="text" :placeholder="t('erp.purchasing.departmentPh')"
                class="w-full px-3.5 py-2.5 border border-[#E2E8F0] text-[13px] text-[#1C2434]
                       focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400
                       transition-all placeholder:text-[#9BA7B0]" />
            </div>

            <!-- Currency -->
            <div>
              <FieldLabel :text="t('erp.common.currency')" />
              <CurrencySelector v-model="form.currency" v-model:exchangeRate="form.exchangeRate" :as-of-date="form.date" />
            </div>

          </div>
        </FormCard>

        <!-- Line items -->
        <FormCard :title="t('erp.purchasing.items')" :icon="ShoppingBagIcon" icon-color="amber"
          :subtitle="itemsSubtitle" :padded="false">
          <template #actions>
            <button @click="openBulkPicker" type="button"
              :title="`${t('erp.purchasing.addItem')} (Ctrl+A)`"
              class="inline-flex items-center gap-1.5 px-3.5 py-2 text-[12px] font-semibold
                     text-primary-600 bg-primary-50 hover:bg-primary-100 border border-primary-200
                     rounded-xl transition-colors">
              <PlusIcon class="w-3.5 h-3.5" />
              {{ t('erp.purchasing.addItem') }}
              <kbd class="hidden sm:inline ml-0.5 px-1.5 py-0.5 rounded bg-white/80 border border-primary-200 font-mono text-[10px] text-primary-700">Ctrl+A</kbd>
            </button>
          </template>

          <EmptyState v-if="!form.items.length"
            :icon="ShoppingBagIcon"
            :title="t('erp.purchasing.noItemsYet')"
            :subtitle="t('erp.purchasing.noItemsHintShort')"
            :action-label="t('erp.purchasing.addFirstItem')"
            :error-message="errors.items"
            @action="openBulkPicker" />

          <div v-else>
            <div class="grid items-center gap-3 px-5 py-2.5 bg-[#F7F9FC] border-b border-[#E2E8F0]"
              style="grid-template-columns: 1.8rem 2.6fr 2.4fr 5rem 7rem 6rem 1.5rem 2rem">
              <div class="text-[11px] font-semibold text-[#9BA7B0] uppercase tracking-wider text-center">#</div>
              <div class="text-[11px] font-semibold text-[#9BA7B0] uppercase tracking-wider">{{ t('erp.purchasing.colItem') }}</div>
              <div class="text-[11px] font-semibold text-[#9BA7B0] uppercase tracking-wider">{{ t('erp.purchasing.colDescription') }}</div>
              <div class="text-[11px] font-semibold text-[#9BA7B0] uppercase tracking-wider text-right">{{ t('erp.purchasing.colQty') }}</div>
              <div class="text-[11px] font-semibold text-[#9BA7B0] uppercase tracking-wider text-right">{{ t('erp.purchasing.colUnitPrice') }}</div>
              <div class="text-[11px] font-semibold text-[#9BA7B0] uppercase tracking-wider text-right">{{ t('erp.purchasing.colEstimated') }}</div>
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
                  :title="t('erp.purchasing.dragToReorder')"
                  class="text-[12px] font-semibold text-center select-none flex items-center justify-center
                         cursor-grab active:cursor-grabbing rounded hover:bg-[#E2E8F0]/60 h-7
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

                <input v-model="line.description" type="text" :placeholder="t('erp.purchasing.descriptionPh')"
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
                  {{ lineEstimate(line) }}
                </div>

                <div class="flex items-center justify-center relative" data-dup-popover>
                  <button v-if="isDuplicate(line)" type="button"
                    tabindex="-1"
                    @click="toggleDupPopover(line)"
                    :aria-label="t('erp.purchasing.duplicateItemWarning')"
                    class="flex items-center justify-center w-5 h-5 rounded hover:bg-amber-100 text-amber-500 transition-colors">
                    <ExclamationTriangleIcon class="w-4 h-4" />
                  </button>
                  <div v-if="openDupKey === line.key"
                    class="absolute z-20 right-full top-1/2 -translate-y-1/2 mr-2 w-56
                           bg-amber-50 border border-amber-200 shadow-lg p-2.5
                           text-[12px] text-amber-800 leading-snug">
                    <div class="flex items-start gap-1.5">
                      <ExclamationTriangleIcon class="w-3.5 h-3.5 text-amber-500 flex-shrink-0 mt-0.5" />
                      <span>{{ t('erp.purchasing.duplicateItemWarning') }}</span>
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
                {{ t('erp.purchasing.estimatedTotal') }}
              </div>
              <div class="text-[13px] font-bold text-[#1C2434] tabular-nums text-right">{{ estimatedTotal }}</div>
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
        <FormCard :title="t('erp.purchasing.summary')" :icon="CalculatorIcon" icon-color="slate" :padded="false">
          <div class="px-6 py-5 grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
            <div class="flex flex-col text-left">
              <FieldLabel :text="t('erp.purchasing.notes')" />
              <textarea v-model="form.notes" :placeholder="t('erp.purchasing.notesPh')"
                class="flex-1 w-full min-h-[10rem] px-3.5 py-2.5 border border-[#E2E8F0] text-[13px] text-[#1C2434]
                       focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400
                       transition-all resize-none placeholder:text-[#9BA7B0]" />
            </div>
            <dl class="w-full space-y-2.5">
              <div class="flex items-center justify-between text-[13px]">
                <dt class="text-[#637381]">{{ t('erp.purchasing.summaryItems') }}</dt>
                <dd class="font-semibold text-[#1C2434] tabular-nums">{{ form.items.length }}</dd>
              </div>
              <div class="flex items-center justify-between text-[13px]">
                <dt class="text-[#637381]">{{ t('erp.purchasing.totalQty') }}</dt>
                <dd class="font-semibold text-[#1C2434] tabular-nums">{{ totalQty }}</dd>
              </div>
              <div class="flex items-center justify-between pt-2.5 border-t border-[#E2E8F0]">
                <dt class="text-[11px] font-semibold text-[#9BA7B0] uppercase tracking-wider">{{ t('erp.purchasing.estimatedTotal') }}</dt>
                <dd class="text-base font-bold text-[#1C2434] tabular-nums">{{ estimatedTotal }}</dd>
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
          <p class="text-[10px] font-semibold text-[#9BA7B0] uppercase tracking-wider mb-0.5">{{ t('erp.purchasing.estimatedTotal') }}</p>
          <p class="text-2xl font-extrabold tabular-nums leading-none text-primary-600">{{ estimatedTotal }}</p>
        </div>
        <span v-if="draftSavedAt" class="hidden sm:inline-flex items-center gap-1 text-[11px] text-emerald-600">
          <CheckIcon class="w-3.5 h-3.5" />
          {{ t('erp.purchasing.savedDraft') }} · {{ savedAtRelative }}
        </span>
        <span v-else-if="dirty" class="hidden sm:inline-flex items-center gap-1 text-[11px] text-amber-600">
          <ExclamationTriangleIcon class="w-3.5 h-3.5" />
          {{ t('erp.purchasing.unsavedChanges') }}
        </span>
      </div>
      <div class="flex items-center gap-2.5">
        <div class="hidden lg:flex items-center gap-3 text-[11px] text-[#9BA7B0] mr-1">
          <span class="flex items-center gap-1" :title="t('erp.purchasing.saveDraft')">
            <kbd class="px-1.5 py-0.5 rounded border border-[#E2E8F0] bg-[#F7F9FC] font-mono text-[10px]">Ctrl+S</kbd>
            <span>draft</span>
          </span>
          <span class="flex items-center gap-1" :title="t('common.saveChanges')">
            <kbd class="px-1.5 py-0.5 rounded border border-[#E2E8F0] bg-[#F7F9FC] font-mono text-[10px]">Ctrl+Shift+S</kbd>
            <span>save</span>
          </span>
          <span class="flex items-center gap-1" :title="t('erp.purchasing.addItem')">
            <kbd class="px-1.5 py-0.5 rounded border border-[#E2E8F0] bg-[#F7F9FC] font-mono text-[10px]">Ctrl+A</kbd>
            <span>item</span>
          </span>
        </div>
        <button @click="discard" type="button"
          class="px-4 py-2.5 text-sm font-medium text-[#637381] hover:text-[#1C2434] transition-colors">
          {{ t('erp.purchasing.discard') }}
        </button>
        <button @click="saveDraft" :disabled="!canSave || savingDraft || saving" type="button"
          :title="!canSave ? t('erp.purchasing.fillRequiredFields') : `${t('erp.purchasing.saveDraft')} (Ctrl+S)`"
          class="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold
                 bg-white text-primary-600 border border-primary-200 hover:bg-primary-50 rounded-xl
                 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
          <ArrowPathIcon v-if="savingDraft" class="w-4 h-4 animate-spin" />
          <BookmarkSquareIcon v-else class="w-4 h-4" />
          {{ savingDraft ? t('erp.common.saving') : t('erp.purchasing.saveDraft') }}
        </button>
        <button @click="save" :disabled="!canSave || saving || savingDraft" type="button"
          :title="!canSave ? t('erp.purchasing.fillRequiredFields') : `${t('common.saveChanges')} (Ctrl+Shift+S)`"
          class="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-bold
                 bg-primary-500 text-white rounded-xl hover:bg-primary-600 shadow-sm
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

    <!-- Inline vendor create slide-over -->
    <Teleport to="body">
      <div v-if="vendorCreateOpen" class="fixed inset-0 z-50 flex">
        <div class="flex-1 bg-black/30" @click="closeVendorCreate"></div>
        <div class="w-full max-w-md bg-white shadow-2xl overflow-y-auto flex flex-col">
          <div class="px-6 py-4 border-b border-[#E2E8F0] flex items-center justify-between">
            <h3 class="text-base font-semibold text-[#1C2434]">{{ t('erp.purchasing.newVendor') }}</h3>
            <button @click="closeVendorCreate" type="button"
              class="w-8 h-8 hover:bg-[#F1F5F9] text-[#637381] flex items-center justify-center">
              <XMarkIcon class="w-4 h-4" />
            </button>
          </div>
          <div class="flex-1 px-6 py-5 space-y-4">
            <div>
              <FieldLabel :text="t('erp.vendors.name')" required />
              <input v-model="newVendor.name" type="text" placeholder="Vendor name"
                ref="newVendorNameRef"
                class="w-full px-3.5 py-2.5 border border-[#E2E8F0] text-[13px] text-[#1C2434]
                       focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400" />
            </div>
            <div>
              <FieldLabel :text="t('erp.vendors.code')" />
              <input v-model="newVendor.code" type="text"
                class="w-full px-3.5 py-2.5 border border-[#E2E8F0] text-[13px] text-[#1C2434]
                       focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400" />
            </div>
            <div class="grid grid-cols-2 gap-4">
              <div>
                <FieldLabel :text="t('erp.vendors.email')" />
                <input v-model="newVendor.email" type="email"
                  class="w-full px-3.5 py-2.5 border border-[#E2E8F0] text-[13px] text-[#1C2434]
                         focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400" />
              </div>
              <div>
                <FieldLabel :text="t('erp.vendors.phone')" />
                <input v-model="newVendor.phone" type="text"
                  class="w-full px-3.5 py-2.5 border border-[#E2E8F0] text-[13px] text-[#1C2434]
                         focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400" />
              </div>
            </div>
            <div>
              <FieldLabel :text="t('erp.vendors.address')" />
              <textarea v-model="newVendor.address" rows="3"
                class="w-full px-3.5 py-2.5 border border-[#E2E8F0] text-[13px] text-[#1C2434]
                       focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400 resize-none" />
            </div>
            <p v-if="newVendorError" class="text-[12px] text-red-600">{{ newVendorError }}</p>
          </div>
          <div class="px-6 py-4 border-t border-[#E2E8F0] flex items-center justify-end gap-2">
            <button @click="closeVendorCreate" type="button"
              class="px-4 py-2 text-sm text-[#637381] hover:text-[#1C2434]">{{ t('common.cancel') }}</button>
            <button @click="saveVendor" :disabled="newVendorSaving" type="button"
              class="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-semibold bg-primary-500 text-white rounded-xl hover:bg-primary-600 disabled:opacity-50">
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
import { useI18n } from 'vue-i18n'
import { useRoute, useRouter, onBeforeRouteLeave } from 'vue-router'
import {
  PlusIcon, TrashIcon, XMarkIcon,
  CheckIcon, ArrowPathIcon, ExclamationTriangleIcon,
  ClipboardDocumentListIcon, ShoppingBagIcon, CalculatorIcon,
  BookmarkSquareIcon, Bars3Icon,
} from '@heroicons/vue/24/outline'
import AppLayout from '@/layouts/AppLayout.vue'
import DateInput from '@/components/DateInput.vue'
import SearchSelect from '@/components/SearchSelect.vue'
import SearchSelectPopup from '@/components/SearchSelectPopup.vue'
import CurrencySelector from '@/components/CurrencySelector.vue'
import PageHeader from '@/components/form/PageHeader.vue'
import FormCard from '@/components/form/FormCard.vue'
import FieldLabel from '@/components/form/FieldLabel.vue'
import ErrorBanner from '@/components/form/ErrorBanner.vue'
import StatusPill from '@/components/form/StatusPill.vue'
import HeaderSaveActions from '@/components/form/HeaderSaveActions.vue'
import EmptyState from '@/components/form/EmptyState.vue'
import VendorChip from './VendorChip.vue'
import FieldError from '@/components/form/FieldError.vue'
import { useFieldErrors } from '@/composables/useFieldErrors'
import api from '@/api'
import { fmtMoney } from '@/utils/fmt'
import { parseApiError } from '@/utils/apiError'

const { t }     = useI18n()
const route     = useRoute()
const router    = useRouter()

const req         = ref(null)
const vendors     = ref([])
const products    = ref([])
const loading     = ref(true)
const loadError   = ref('')
const saving      = ref(false)
const savingDraft = ref(false)
const draftSavedAt = ref(null)
const globalError = ref('')
const errors      = ref({})
const { fieldErrors, setFromError, reset: resetErrors, errorOf } = useFieldErrors()

const form = ref({
  date: '', requestedBy: '', department: '', vendorId: '', notes: '',
  currency: '', exchangeRate: 1, items: [],
})

// Dirty tracking arms after load so the parse doesn't trip it.
const dirty = ref(false)
let dirtyArmed = false
watch(form, () => { if (dirtyArmed) dirty.value = true }, { deep: true })

function onBeforeUnload(e) {
  if (!dirty.value) return
  e.preventDefault()
  e.returnValue = t('erp.purchasing.unsavedChanges')
}
onMounted(() => window.addEventListener('beforeunload', onBeforeUnload))
onUnmounted(() => window.removeEventListener('beforeunload', onBeforeUnload))

// ── Custom confirm modal ────────────────────────────────────────────────
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
    title:   t('erp.purchasing.unsavedChanges'),
    message: t('erp.purchasing.unsavedChangesHint'),
    okLabel: t('erp.purchasing.discard'),
  })
})

const selectedVendor = computed(() =>
  form.value.vendorId ? vendors.value.find(v => v.id === form.value.vendorId) : null
)

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

// ── Load ───────────────────────────────────────────────────────────────
onMounted(async () => {
  const id = route.params.id
  const [reqRes, vRes, pRes] = await Promise.allSettled([
    api.get(`/erp/purchasing/requisitions/${id}`),
    api.get('/erp/vendors',     { params: { limit: 500 } }),
    api.get('/erp/item-master', { params: { limit: 500 } }),
  ])
  if (vRes.status === 'fulfilled') vendors.value  = vRes.value.data.data.vendors  || []
  if (pRes.status === 'fulfilled') {
    const list = pRes.value.data.data.products || []
    products.value = list.map(p => ({ ...p, code: p.sku }))
  }

  if (reqRes.status !== 'fulfilled') {
    loadError.value = parseApiError(reqRes.reason, 'Failed to load requisition')
    loading.value = false
    return
  }

  const r = reqRes.value.data.data.requisition
  if (r.status !== 'draft') {
    router.replace(`/erp/purchasing/requisitions/${id}`)
    return
  }
  req.value = r
  form.value = {
    date:         r.date         || '',
    requestedBy:  r.requestedBy  || '',
    department:   r.department   || '',
    vendorId:     r.vendorId     || '',
    notes:        r.notes        || '',
    currency:     r.currency     || '',
    exchangeRate: r.exchangeRate != null ? Number(r.exchangeRate) : 1,
    items: (r.items || []).map(it => ({
      key:         newKey(),
      productId:   it.productId || '',
      description: it.description || '',
      qty:         Number(it.qty) || 1,
      unitPrice:   it.unitPrice != null ? Number(it.unitPrice) : null,
      notes:       it.notes || '',
    })),
  }
  loading.value = false
  await nextTick()
  dirtyArmed = true
})

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
    unitPrice:   p.cost != null ? Number(p.cost) : null,
    notes:       '',
  }
}

function removeItem(idx) { form.value.items.splice(idx, 1) }

function onProductChange(line) {
  const p = products.value.find(p => p.id === line.productId)
  if (!p) return
  if (!line.description?.trim()) line.description = p.name
  if ((line.unitPrice == null || line.unitPrice === '') && p.cost != null) {
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

function lineEstimate(item) {
  const val = (Number(item.qty) || 0) * (Number(item.unitPrice) || 0)
  return val > 0 ? fmtMoney(val) : '—'
}

const itemsSubtitle = computed(() =>
  form.value.items.length
    ? `${form.value.items.length} ${form.value.items.length !== 1 ? t('erp.purchasing.itemsCount') : t('erp.purchasing.itemCount')}`
    : ''
)
const totalQty          = computed(() => form.value.items.reduce((s, i) => s + (Number(i.qty) || 0), 0))
const estimatedTotalRaw = computed(() => form.value.items.reduce((s, i) => s + (Number(i.qty) || 0) * (Number(i.unitPrice) || 0), 0))
const estimatedTotal    = computed(() => estimatedTotalRaw.value === 0 ? '—' : fmtMoney(estimatedTotalRaw.value))

const canSave = computed(() => {
  if (!form.value.date) return false
  if (!form.value.items.length) return false
  for (const item of form.value.items) {
    if (!item.productId && !item.description?.trim()) return false
    if (!item.qty || item.qty <= 0) return false
  }
  return true
})

function validate() {
  const e = {}
  if (!form.value.date) e.date = t('erp.purchasing.dateRequired')
  if (!form.value.items.length) {
    e.items = t('erp.purchasing.itemsRequired')
  } else {
    for (const item of form.value.items) {
      if (!item.productId && !item.description?.trim()) { e.items = t('erp.purchasing.itemNeedsDesc'); break }
      if (!item.qty || item.qty <= 0)                    { e.items = t('erp.purchasing.itemQtyInvalid'); break }
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

// `redirect` controls whether we navigate back to the detail page after save.
// Save Changes → redirect; Save Draft → stay on edit page with "saved" indicator.
async function save({ redirect = true } = {}) {
  globalError.value = ''
  resetErrors()
  if (!validate()) return
  if (redirect) saving.value = true
  else          savingDraft.value = true
  try {
    const payload = {
      date:         form.value.date,
      requestedBy:  form.value.requestedBy || null,
      department:   form.value.department  || null,
      vendorId:     form.value.vendorId    || null,
      notes:        form.value.notes       || null,
      currency:     form.value.currency    || null,
      exchangeRate: form.value.exchangeRate,
      items: form.value.items.map(({ productId, description, qty, unitPrice, notes }) => ({
        productId:   productId || null,
        description: description || null,
        qty:         Number(qty) || 0,
        unitPrice:   unitPrice == null || unitPrice === '' ? null : Number(unitPrice),
        notes:       notes || null,
      })),
    }
    await api.put(`/erp/purchasing/requisitions/${route.params.id}`, payload)
    dirty.value = false
    if (redirect) {
      router.push(`/erp/purchasing/requisitions/${route.params.id}`)
    } else {
      draftSavedAt.value = new Date()
    }
  } catch (err) {
    const had = setFromError(err)
    if (!had) globalError.value = parseApiError(err, 'Failed to update requisition')
  } finally {
    saving.value = false
    savingDraft.value = false
  }
}

function saveDraft() { save({ redirect: false }) }

async function discard() {
  if (dirty.value) {
    const ok = await confirmAsync({
      title:   t('erp.purchasing.unsavedChanges'),
      message: t('erp.purchasing.unsavedChangesHint'),
      okLabel: t('erp.purchasing.discard'),
    })
    if (!ok) return
  }
  router.push(`/erp/purchasing/requisitions/${route.params.id}`)
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
.vendor-field :deep(.multiselect),
.vendor-field :deep(.multiselect__tags),
.vendor-field :deep(.multiselect__select) {
  cursor: default;
}
</style>
