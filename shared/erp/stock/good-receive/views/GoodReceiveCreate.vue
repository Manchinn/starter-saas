<template>
  <AppLayout>
    <div class="space-y-6">

      <!-- Page Header -->
      <div class="flex items-start gap-4">
        <RouterLink to="/erp/good-receive"
          class="mt-0.5 p-2 rounded-xl text-[#9BA7B0] hover:text-[#1C2434] hover:bg-white border border-transparent
                 hover:border-[#E2E8F0] transition-all flex-shrink-0">
          <ArrowLeftIcon class="w-[18px] h-[18px]" />
        </RouterLink>
        <div class="flex-1 min-w-0">
          <div class="flex items-center gap-2.5">
            <h1 class="text-xl font-bold text-[#1C2434]">{{ t('erp.goodReceive.new') }}</h1>
            <span class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold
                         bg-amber-50 text-amber-600 border border-amber-200">
              <span class="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
              Draft
            </span>
          </div>
          <nav class="flex items-center gap-1.5 mt-1">
            <RouterLink to="/erp/good-receive" class="text-[12px] text-[#9BA7B0] hover:text-[#637381] transition-colors">
              {{ t('erp.goodReceive.title') }}
            </RouterLink>
            <ChevronRightIcon class="w-3 h-3 text-[#CBD5E1]" />
            <span class="text-[12px] text-[#637381]">{{ t('erp.goodReceive.new') }}</span>
          </nav>
        </div>
        <div class="flex items-center gap-2.5 flex-shrink-0">
          <RouterLink to="/erp/good-receive" class="btn-secondary">{{ t('common.cancel') }}</RouterLink>
          <button @click="save" :disabled="saving" class="btn-primary gap-2">
            <ArrowPathIcon v-if="saving" class="w-4 h-4 animate-spin" />
            <CheckIcon v-else class="w-4 h-4" />
            {{ saving ? t('erp.common.saving') : t('erp.common.saveDraft') }}
          </button>
        </div>
      </div>

      <div class="space-y-5">

        <!-- Section 1: GR Info -->
        <div class="bg-white rounded-2xl border border-[#E2E8F0] shadow-card overflow-hidden">
          <div class="px-6 py-4 border-b border-[#E2E8F0] flex items-center gap-3">
            <div class="w-8 h-8 rounded-xl bg-primary-50 flex items-center justify-center flex-shrink-0">
              <TruckIcon class="w-4 h-4 text-primary-500" />
            </div>
            <h2 class="text-sm font-semibold text-[#1C2434]">{{ t('erp.common.header') }}</h2>
          </div>
          <div class="px-6 py-5 space-y-5">

            <div class="grid grid-cols-2 gap-x-6 gap-y-5">

              <!-- Date -->
              <div>
                <label class="block text-[11px] font-semibold text-[#637381] uppercase tracking-wider mb-1.5">
                  {{ t('erp.common.date') }} <span class="text-red-500 normal-case font-normal">*</span>
                </label>
                <DateInput v-model="form.date" class="w-full px-3.5 py-2.5 border border-[#E2E8F0] text-sm text-[#1C2434]
                         focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400 transition-colors" />
              </div>

              <!-- Store -->
              <div>
                <label class="block text-[11px] font-semibold text-[#637381] uppercase tracking-wider mb-1.5">
                  {{ t('erp.common.store') }} <span class="text-red-500 normal-case font-normal">*</span>
                </label>
                <select v-model="form.storeId"
                  class="w-full px-3.5 py-2.5 border border-[#E2E8F0] text-sm bg-white text-[#1C2434]
                         focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400 transition-colors">
                  <option value="">{{ t('erp.common.selectStore') }}</option>
                  <option v-for="s in stores" :key="s.id" :value="s.id">{{ s.name }}{{ s.code ? ` (${s.code})` : '' }}</option>
                </select>
              </div>

              <!-- Supplier -->
              <div>
                <label class="block text-[11px] font-semibold text-[#637381] uppercase tracking-wider mb-1.5">
                  {{ t('erp.goodReceive.supplier') }}
                </label>
                <input v-model="form.supplier" type="text" placeholder="Supplier name"
                  class="w-full px-3.5 py-2.5 border border-[#E2E8F0] text-sm text-[#1C2434]
                         focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400
                         transition-colors placeholder-[#CBD5E1]" />
              </div>

              <!-- Notes -->
              <div>
                <label class="block text-[11px] font-semibold text-[#637381] uppercase tracking-wider mb-1.5">
                  {{ t('erp.common.notes') }}
                </label>
                <input v-model="form.notes" type="text" placeholder="Optional notes"
                  class="w-full px-3.5 py-2.5 border border-[#E2E8F0] text-sm text-[#1C2434]
                         focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400
                         transition-colors placeholder-[#CBD5E1]" />
              </div>

            </div>

            <!-- Document Type -->
            <div class="pt-4 border-t border-[#E2E8F0]">
              <label class="block text-[11px] font-semibold text-[#637381] uppercase tracking-wider mb-2.5">
                {{ t('erp.goodReceive.docType') }} <span class="text-red-500 normal-case font-normal">*</span>
              </label>
              <div class="flex items-start gap-6">
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

                <!-- Invoice fields -->
                <div v-if="form.docType === 'invoice'" class="grid grid-cols-3 gap-4 flex-1">
                  <div>
                    <label class="block text-[11px] font-semibold text-[#637381] uppercase tracking-wider mb-1.5">
                      {{ t('erp.goodReceive.invoiceNo') }} <span class="text-red-500 normal-case font-normal">*</span>
                    </label>
                    <input v-model="form.invoiceNo" type="text" placeholder="e.g. INV-00123"
                      class="w-full px-3.5 py-2.5 border border-[#E2E8F0] text-sm text-[#1C2434]
                             focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400
                             transition-colors placeholder-[#CBD5E1]" />
                  </div>
                  <div>
                    <label class="block text-[11px] font-semibold text-[#637381] uppercase tracking-wider mb-1.5">
                      {{ t('erp.goodReceive.invoiceDate') }}
                    </label>
                    <DateInput v-model="form.invoiceDate" class="w-full px-3.5 py-2.5 border border-[#E2E8F0] text-sm text-[#1C2434]
                             focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400 transition-colors" />
                  </div>
                  <div>
                    <label class="block text-[11px] font-semibold text-[#637381] uppercase tracking-wider mb-1.5">
                      {{ t('erp.goodReceive.invoiceDiscount') }}
                    </label>
                    <input v-model.number="form.invoiceDiscount" type="number" min="0" step="0.01" placeholder="0.00"
                      class="w-full px-3.5 py-2.5 border border-[#E2E8F0] text-sm text-right text-[#1C2434]
                             focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400
                             transition-colors placeholder-[#CBD5E1]" />
                  </div>
                </div>

                <!-- Delivery field -->
                <div v-if="form.docType === 'delivery'" class="flex-1">
                  <label class="block text-[11px] font-semibold text-[#637381] uppercase tracking-wider mb-1.5">
                    {{ t('erp.goodReceive.deliveryNo') }} <span class="text-red-500 normal-case font-normal">*</span>
                  </label>
                  <input v-model="form.deliveryNo" type="text" placeholder="e.g. DN-00456"
                    class="w-full px-3.5 py-2.5 border border-[#E2E8F0] text-sm text-[#1C2434]
                           focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400
                           transition-colors placeholder-[#CBD5E1]" />
                </div>
              </div>
            </div>

          </div>
        </div>

        <!-- Section 2: Items -->
        <div class="bg-white rounded-2xl border border-[#E2E8F0] shadow-card overflow-hidden">
          <div class="px-6 py-4 border-b border-[#E2E8F0] flex items-center justify-between">
            <div class="flex items-center gap-3">
              <div class="w-8 h-8 rounded-xl bg-green-50 flex items-center justify-center flex-shrink-0">
                <ClipboardDocumentListIcon class="w-4 h-4 text-green-600" />
              </div>
              <div>
                <h2 class="text-sm font-semibold text-[#1C2434]">{{ t('erp.common.items') }}</h2>
                <p v-if="items.length" class="text-[11px] text-[#9BA7B0]">
                  {{ items.length }} item{{ items.length !== 1 ? 's' : '' }}
                </p>
              </div>
            </div>
            <button @click="addRow" type="button"
              class="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-primary-500
                     bg-primary-50 hover:bg-primary-100 border border-primary-200 rounded-lg transition-colors">
              <PlusIcon class="w-3.5 h-3.5" />
              {{ t('erp.common.addItem') }}
            </button>
          </div>

          <!-- Empty state -->
          <div v-if="!items.length" class="flex flex-col items-center justify-center py-16 text-center">
            <div class="w-14 h-14 bg-[#F1F5F9] rounded-2xl flex items-center justify-center mb-4">
              <ClipboardDocumentListIcon class="w-7 h-7 text-[#CBD5E1]" />
            </div>
            <p class="text-sm font-semibold text-[#637381]">{{ t('erp.common.noItems') }}</p>
            <p class="text-xs text-[#9BA7B0] mt-1 mb-4">Add received products to this goods receive document.</p>
            <button @click="addRow" type="button"
              class="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-primary-500
                     bg-primary-50 hover:bg-primary-100 border border-primary-200 rounded-lg transition-colors">
              <PlusIcon class="w-4 h-4" />
              {{ t('erp.common.addItem') }}
            </button>
          </div>

          <!-- Items table -->
          <div v-else>
            <div class="grid items-center gap-2 px-5 py-2.5 bg-[#F7F9FC] border-b border-[#E2E8F0]
                        text-[11px] font-semibold text-[#9BA7B0] uppercase tracking-wider"
              style="grid-template-columns: 2.5fr 5rem 6rem 6rem 5.5rem 6rem 2rem 2rem">
              <div>{{ t('erp.common.product') }}</div>
              <div class="text-right">Qty</div>
              <div>UOM</div>
              <div class="text-right">Stock Qty</div>
              <div class="text-right">Cost/Unit</div>
              <div class="text-right">{{ t('erp.goodReceive.netAmount') }}</div>
              <div class="text-center text-[9px]">More</div>
              <div></div>
            </div>

            <div class="divide-y divide-[#E2E8F0]">
              <template v-for="(item, i) in items" :key="i">
                <!-- Primary row -->
                <div class="group grid items-center gap-2 px-5 py-3 hover:bg-[#F7F9FC] transition-colors"
                  style="grid-template-columns: 2.5fr 5rem 6rem 6rem 5.5rem 6rem 2rem 2rem">

                  <select v-model="item.productId"
                    class="w-full px-2.5 py-2 border border-[#E2E8F0] text-sm bg-white text-[#1C2434]
                           focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400 transition-colors">
                    <option value="">{{ t('erp.common.selectProduct') }}</option>
                    <option v-for="p in products" :key="p.id" :value="p.id">{{ p.name }}{{ p.sku ? ` [${p.sku}]` : '' }}</option>
                  </select>

                  <input v-model.number="item.qty" @input="recalc(item)" type="number" min="0" step="0.01" placeholder="0"
                    class="w-full px-2 py-2 border border-[#E2E8F0] text-sm text-right text-[#1C2434] tabular-nums
                           focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400 transition-colors" />

                  <select v-model="item.qtyUomId"
                    class="w-full px-2.5 py-2 border border-[#E2E8F0] text-sm bg-white text-[#1C2434]
                           focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400 transition-colors">
                    <option value="">—</option>
                    <option v-for="u in uoms" :key="u.id" :value="u.id">{{ u.abbreviation || u.name }}</option>
                  </select>

                  <div class="text-right">
                    <div class="font-semibold text-sm tabular-nums" :class="convMap[item.qtyUomId] ? 'text-indigo-700' : 'text-[#637381]'">
                      {{ fmtQty(getStockQty(item)) }}
                    </div>
                    <div v-if="convMap[item.qtyUomId]" class="text-[10px] text-indigo-400">
                      {{ convMap[item.qtyUomId].toUomAbbr }}
                    </div>
                    <div v-else class="text-[10px] text-[#CBD5E1]">no conv.</div>
                  </div>

                  <input v-model.number="item.cost" @input="recalc(item)" type="number" min="0" step="0.0001" placeholder="0.0000"
                    class="w-full px-2 py-2 border border-[#E2E8F0] text-sm text-right text-[#1C2434] tabular-nums
                           focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400
                           transition-colors placeholder-[#CBD5E1]" />

                  <div class="text-sm font-semibold text-[#374151] tabular-nums text-right pr-1">
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

                <!-- Expanded detail row -->
                <div v-if="expanded.has(i)" class="bg-[#F7F9FC] border-t border-[#E2E8F0] px-6 py-4">
                  <div class="grid grid-cols-6 gap-3">
                    <div>
                      <label class="block text-[11px] font-semibold text-[#637381] uppercase tracking-wider mb-1">{{ t('erp.goodReceive.freeQty') }}</label>
                      <input v-model.number="item.freeQty" @input="recalc(item)" type="number" min="0" step="0.01" placeholder="0"
                        class="w-full px-2.5 py-2 border border-[#E2E8F0] text-sm text-right bg-white text-[#1C2434]
                               focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400 transition-colors" />
                    </div>
                    <div>
                      <label class="block text-[11px] font-semibold text-[#637381] uppercase tracking-wider mb-1">{{ t('erp.goodReceive.freeUom') }}</label>
                      <select v-model="item.freeQtyUomId"
                        class="w-full px-2.5 py-2 border border-[#E2E8F0] text-sm bg-white text-[#1C2434]
                               focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400 transition-colors">
                        <option value="">—</option>
                        <option v-for="u in uoms" :key="u.id" :value="u.id">{{ u.abbreviation || u.name }}</option>
                      </select>
                    </div>
                    <div>
                      <label class="block text-[11px] font-semibold text-[#637381] uppercase tracking-wider mb-1">{{ t('erp.goodReceive.batchId') }}</label>
                      <input v-model="item.batchId" type="text" placeholder="Optional"
                        class="w-full px-2.5 py-2 border border-[#E2E8F0] text-sm bg-white text-[#1C2434]
                               focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400
                               transition-colors placeholder-[#CBD5E1]" />
                    </div>
                    <div>
                      <label class="block text-[11px] font-semibold text-[#637381] uppercase tracking-wider mb-1">{{ t('erp.goodReceive.expiryDate') }}</label>
                      <DateInput v-model="item.expiryDate" class="w-full px-2.5 py-2 border border-[#E2E8F0] text-sm bg-white text-[#1C2434]
                               focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400 transition-colors" />
                    </div>
                    <div>
                      <label class="block text-[11px] font-semibold text-[#637381] uppercase tracking-wider mb-1">{{ t('erp.goodReceive.discPct') }}</label>
                      <div class="relative">
                        <input v-model.number="item.discountPct" @input="recalc(item)" type="number" min="0" max="100" step="0.01" placeholder="0"
                          class="w-full pl-2.5 pr-7 py-2 border border-[#E2E8F0] text-sm text-right bg-white text-[#1C2434]
                                 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400 transition-colors" />
                        <span class="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-[#9BA7B0]">%</span>
                      </div>
                    </div>
                    <div>
                      <label class="block text-[11px] font-semibold text-[#637381] uppercase tracking-wider mb-1">{{ t('erp.goodReceive.discount') }}</label>
                      <input v-model.number="item.discount" @input="recalc(item)" type="number" min="0" step="0.01" placeholder="0.00"
                        class="w-full px-2.5 py-2 border border-[#E2E8F0] text-sm text-right bg-white text-[#1C2434]
                               focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400
                               transition-colors placeholder-[#CBD5E1]" />
                    </div>
                    <div>
                      <label class="block text-[11px] font-semibold text-[#637381] uppercase tracking-wider mb-1">{{ t('erp.goodReceive.wac') }}</label>
                      <input :value="fmtRate(item.wac)" readonly type="text"
                        class="w-full px-2.5 py-2 border border-[#E2E8F0] bg-blue-50 text-sm text-right text-blue-700 font-mono cursor-default" />
                    </div>
                    <div class="col-span-5">
                      <label class="block text-[11px] font-semibold text-[#637381] uppercase tracking-wider mb-1">{{ t('erp.goodReceive.comments') }}</label>
                      <input v-model="item.comments" type="text" placeholder="Optional"
                        class="w-full px-2.5 py-2 border border-[#E2E8F0] text-sm bg-white text-[#1C2434]
                               focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400
                               transition-colors placeholder-[#CBD5E1]" />
                    </div>
                  </div>
                </div>
              </template>
            </div>

            <!-- Totals row -->
            <div class="grid items-center gap-2 px-5 py-3.5 bg-[#F7F9FC] border-t border-[#E2E8F0]"
              style="grid-template-columns: 2.5fr 5rem 6rem 6rem 5.5rem 6rem 2rem 2rem">
              <div class="col-span-5 text-[11px] font-semibold text-[#9BA7B0] uppercase tracking-wider text-right">
                {{ t('erp.goodReceive.totals') }}
              </div>
              <div class="text-sm font-bold text-[#1C2434] tabular-nums text-right pr-1">{{ fmtMoney(totalNet) }}</div>
              <div class="col-span-2"></div>
            </div>
          </div>
        </div>

        <!-- Global error -->
        <div v-if="error"
          class="flex items-start gap-3 bg-red-50 border border-red-200 text-red-700
                 text-sm px-4 py-3.5 rounded-xl">
          <ExclamationCircleIcon class="w-5 h-5 flex-shrink-0 mt-0.5" />
          <span>{{ error }}</span>
        </div>

        <!-- Summary card -->
        <div class="bg-white rounded-2xl border border-[#E2E8F0] shadow-card overflow-hidden">
          <div class="px-6 py-4 border-b border-[#E2E8F0] flex items-center gap-2.5">
            <CalculatorIcon class="w-4 h-4 text-[#9BA7B0]" />
            <h2 class="text-sm font-semibold text-[#1C2434]">{{ t('erp.common.summary') }}</h2>
          </div>

          <div class="px-6 py-4 grid grid-cols-4 gap-6">
            <div class="flex flex-col gap-0.5">
              <span class="text-[11px] font-semibold text-[#9BA7B0] uppercase tracking-wider">{{ t('erp.common.items') }}</span>
              <span class="text-sm font-semibold text-[#1C2434]">{{ items.length }}</span>
            </div>
            <div class="flex flex-col gap-0.5">
              <span class="text-[11px] font-semibold text-[#9BA7B0] uppercase tracking-wider">Gross Amount</span>
              <span class="text-sm font-semibold text-[#1C2434] tabular-nums">{{ fmtMoney(totalGross) }}</span>
            </div>
            <div class="flex flex-col gap-0.5">
              <span class="text-[11px] font-semibold text-[#9BA7B0] uppercase tracking-wider">Net Amount</span>
              <span class="text-sm font-semibold text-[#1C2434] tabular-nums">{{ fmtMoney(totalNet) }}</span>
            </div>
            <div v-if="form.docType === 'invoice'" class="flex flex-col gap-0.5">
              <span class="text-[11px] font-semibold text-[#9BA7B0] uppercase tracking-wider">{{ t('erp.goodReceive.netAmount') }}</span>
              <span class="text-sm font-semibold text-green-700 tabular-nums">{{ fmtMoney(invoiceNetAmount) }}</span>
            </div>
          </div>

          <div class="px-6 py-5 bg-[#F7F9FC] border-t border-[#E2E8F0] flex items-center justify-between">
            <div>
              <p class="text-[11px] font-semibold text-[#9BA7B0] uppercase tracking-wider mb-0.5">Total Net Amount</p>
              <p class="text-3xl font-extrabold text-primary-500 tabular-nums leading-none">{{ fmtMoney(totalNet) }}</p>
            </div>
            <div class="flex items-center gap-3">
              <RouterLink to="/erp/good-receive"
                class="px-5 py-2.5 text-sm font-medium text-[#637381] hover:text-[#1C2434] transition-colors">
                {{ t('common.cancel') }}
              </RouterLink>
              <button @click="save" :disabled="saving"
                class="inline-flex items-center gap-2 px-6 py-2.5 text-sm font-bold
                       bg-primary-500 text-white rounded-xl hover:bg-primary-600 shadow-sm
                       disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
                <ArrowPathIcon v-if="saving" class="w-4 h-4 animate-spin" />
                <CheckIcon v-else class="w-4 h-4" />
                {{ saving ? t('erp.common.saving') : t('erp.common.saveDraft') }}
              </button>
            </div>
          </div>
        </div>

      </div>
    </div>
  </AppLayout>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import {
  ArrowLeftIcon, ChevronRightIcon, PlusIcon, TrashIcon,
  CheckIcon, ExclamationCircleIcon, ArrowPathIcon,
  TruckIcon, ClipboardDocumentListIcon, CalculatorIcon,
} from '@heroicons/vue/24/outline'
import AppLayout from '@/layouts/AppLayout.vue'
import api from '@/api'
import { fmtMoney, fmtRate, toFixed } from '@/utils/fmt'

const { t } = useI18n()
const router   = useRouter()
const products = ref([])
const stores   = ref([])
const uoms     = ref([])
const convMap  = ref({})
const form     = ref({
  date: new Date().toISOString().slice(0, 10),
  storeId: '', supplier: '', notes: '',
  docType: 'invoice',
  invoiceNo: '', invoiceDate: '', deliveryNo: '',
  invoiceDiscount: 0,
})
const items    = ref([])
const expanded = reactive(new Set())
const error    = ref('')
const saving   = ref(false)

onMounted(async () => {
  try {
    const [prodRes, storeRes, uomRes, convRes] = await Promise.all([
      api.get('/erp/item-master', { params: { limit: 200 } }),
      api.get('/erp/good-receive/stores-lookup'),
      api.get('/erp/uom'),
      api.get('/erp/uom-conversion'),
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
  } catch (err) {
    console.error('Failed to load lookups:', err.message)
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

const totalGross = computed(() =>
  items.value.reduce((s, i) => s + (parseFloat(i.qty) || 0) * (parseFloat(i.cost) || 0), 0)
)
const totalNet = computed(() =>
  items.value.reduce((s, i) => s + (parseFloat(i.netAmount) || 0), 0)
)
const invoiceNetAmount = computed(() =>
  Math.max(0, totalNet.value - (parseFloat(form.value.invoiceDiscount) || 0))
)

async function save() {
  error.value = ''
  if (!form.value.date)    { error.value = 'Date is required'; return }
  if (!form.value.storeId) { error.value = 'Store is required'; return }
  if (form.value.docType === 'invoice'  && !form.value.invoiceNo.trim())  { error.value = 'Invoice Number is required'; return }
  if (form.value.docType === 'delivery' && !form.value.deliveryNo.trim()) { error.value = 'Delivery Number is required'; return }
  if (!items.value.length) { error.value = 'Add at least one item'; return }
  if (items.value.find(i => !i.productId || !i.qty || i.qty <= 0)) {
    error.value = 'All items must have a product and quantity > 0'; return
  }
  saving.value = true
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
    const { data } = await api.post('/erp/good-receive', payload)
    router.push(`/erp/good-receive/${data.data.goodReceive.id}`)
  } catch (err) {
    error.value = err.response?.data?.message || 'Failed to save'
  } finally {
    saving.value = false
  }
}
</script>
