<template>
  <AppLayout>
    <div class="space-y-6">

      <!-- Header -->
      <div class="flex items-start gap-4">
        <RouterLink to="/erp/quotations"
          class="mt-0.5 p-2 rounded-xl text-[#9BA7B0] hover:text-[#1C2434] hover:bg-white
                 border border-transparent hover:border-[#E2E8F0] transition-all flex-shrink-0">
          <ArrowLeftIcon class="w-[18px] h-[18px]" />
        </RouterLink>
        <div class="flex-1 min-w-0">
          <div class="flex items-center gap-2.5 flex-wrap">
            <h1 class="text-xl font-bold text-[#1C2434]">
              {{ loading ? '…' : (q?.refNo || t('erp.quotations.detail')) }}
            </h1>
            <span v-if="q && !loading"
              class="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold capitalize"
              :class="statusBadge(q.status)">
              <span class="w-1.5 h-1.5 rounded-full" :class="statusDot(q.status)"></span>
              {{ t('erp.quotations.' + q.status) }}
            </span>
          </div>
          <nav class="flex items-center gap-1.5 mt-1">
            <RouterLink to="/erp/quotations" class="text-[12px] text-[#9BA7B0] hover:text-[#637381] transition-colors">
              {{ t('erp.quotations.title') }}
            </RouterLink>
            <ChevronRightIcon class="w-3 h-3 text-[#CBD5E1]" />
            <span class="text-[12px] text-[#637381]">{{ q?.refNo || '…' }}</span>
          </nav>
        </div>
      </div>

      <!-- Loading -->
      <div v-if="loading" class="flex items-center justify-center py-20">
        <div class="w-7 h-7 border-2 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
      </div>

      <!-- Not found -->
      <div v-else-if="!q"
        class="flex items-start gap-3 bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3.5 rounded-xl">
        <ExclamationCircleIcon class="w-5 h-5 flex-shrink-0 mt-0.5" />
        <span>{{ t('erp.quotations.notFound') }}
          <RouterLink to="/erp/quotations" class="underline ml-1">{{ t('erp.common.backToList') }}</RouterLink>
        </span>
      </div>

      <template v-else>
        <div class="space-y-5">

          <!-- Workflow stepper card -->
          <div class="bg-white rounded-2xl border border-[#E2E8F0] shadow-card overflow-hidden">
            <div class="px-6 py-4 border-b border-[#E2E8F0] flex items-center gap-2.5">
              <BoltIcon class="w-4 h-4 text-[#9BA7B0]" />
              <h3 class="text-sm font-semibold text-[#1C2434]">Workflow</h3>
              <span class="ml-auto inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold capitalize"
                :class="statusBadge(q.status)">
                <span class="w-1.5 h-1.5 rounded-full" :class="statusDot(q.status)"></span>
                {{ t('erp.quotations.' + q.status) }}
              </span>
            </div>

            <div class="px-8 py-6">
              <!-- Horizontal stepper -->
              <div class="flex items-start">
                <template v-for="(step, i) in FLOW_STEPS" :key="step.key">
                  <div class="flex flex-col items-center flex-shrink-0 w-24">
                    <div class="w-8 h-8 rounded-full flex items-center justify-center ring-2 transition-all"
                      :class="stepNodeClass(step.key)">
                      <CheckIcon v-if="stepState(step.key) === 'completed'" class="w-4 h-4" />
                      <span v-else-if="stepState(step.key) === 'current'" class="w-2.5 h-2.5 rounded-full bg-white"></span>
                      <span v-else class="text-[11px] font-bold">{{ i + 1 }}</span>
                    </div>
                    <p class="mt-2 text-[11px] font-semibold text-center leading-tight" :class="stepLabelClass(step.key)">
                      {{ step.label }}
                    </p>
                  </div>
                  <div v-if="i < FLOW_STEPS.length - 1"
                    class="flex-1 h-0.5 mt-4 mx-1 rounded-full"
                    :class="connectorClass(step.key)">
                  </div>
                </template>

                <!-- Rejected terminal node -->
                <template v-if="q.status === 'rejected'">
                  <div class="flex-1 h-0.5 mt-4 mx-1 rounded-full bg-red-200"></div>
                  <div class="flex flex-col items-center flex-shrink-0 w-24">
                    <div class="w-8 h-8 rounded-full bg-red-100 ring-2 ring-red-200 flex items-center justify-center">
                      <XMarkIcon class="w-4 h-4 text-red-500" />
                    </div>
                    <p class="mt-2 text-[11px] font-semibold text-center text-red-600 leading-tight">
                      {{ t('erp.quotations.rejected') }}
                    </p>
                  </div>
                </template>
              </div>
            </div>
          </div>

            <!-- Info card -->
            <div class="bg-white rounded-2xl border border-[#E2E8F0] shadow-card overflow-hidden">
              <div class="px-6 py-4 border-b border-[#E2E8F0] flex items-center gap-3">
                <div class="w-8 h-8 rounded-xl bg-primary-50 flex items-center justify-center flex-shrink-0">
                  <UserIcon class="w-4 h-4 text-primary-500" />
                </div>
                <h2 class="text-sm font-semibold text-[#1C2434]">{{ t('erp.quotations.quotationInfo') }}</h2>
              </div>

              <!-- View mode -->
              <div v-if="!editMode" class="px-6 py-5">
                <dl class="grid grid-cols-2 gap-x-6 gap-y-4 text-sm">
                  <div>
                    <dt class="text-[11px] font-semibold text-[#637381] uppercase tracking-wider mb-1">
                      {{ t('erp.quotations.customer') }}
                    </dt>
                    <dd class="font-medium text-[#1C2434]">{{ q.customer?.name || '—' }}</dd>
                  </div>
                  <div>
                    <dt class="text-[11px] font-semibold text-[#637381] uppercase tracking-wider mb-1">
                      {{ t('erp.quotations.quotationDate') }}
                    </dt>
                    <dd class="font-medium text-[#1C2434]">{{ q.quotationDate }}</dd>
                  </div>
                  <div>
                    <dt class="text-[11px] font-semibold text-[#637381] uppercase tracking-wider mb-1">
                      {{ t('erp.quotations.validUntil') }}
                    </dt>
                    <dd class="font-medium text-[#1C2434]">{{ q.validUntil || '—' }}</dd>
                  </div>
                  <div>
                    <dt class="text-[11px] font-semibold text-[#637381] uppercase tracking-wider mb-1">
                      {{ t('erp.quotations.taxRate') }}
                    </dt>
                    <dd class="font-medium text-[#1C2434]">{{ q.taxRate }}%</dd>
                  </div>
                  <div v-if="q.notes" class="col-span-2">
                    <dt class="text-[11px] font-semibold text-[#637381] uppercase tracking-wider mb-1">
                      {{ t('erp.quotations.notes') }}
                    </dt>
                    <dd class="font-medium text-[#1C2434] whitespace-pre-wrap">{{ q.notes }}</dd>
                  </div>
                </dl>
              </div>

              <!-- Edit mode -->
              <div v-else class="px-6 py-5">
                <div class="grid grid-cols-2 gap-4">
                  <div class="col-span-2">
                    <label class="block text-[11px] font-semibold text-[#637381] uppercase tracking-wider mb-1.5">
                      {{ t('erp.quotations.customer') }}
                    </label>
                    <SearchSelect v-model="editForm.customerId" :options="customers" :placeholder="`— ${t('erp.quotations.noCustomer')} —`">
                      <template #option="{ option }">{{ option.name }}{{ option.company ? ` (${option.company})` : '' }}</template>
                      <template #singleLabel="{ option }">{{ option.name }}{{ option.company ? ` (${option.company})` : '' }}</template>
                    </SearchSelect>
                  </div>
                  <div>
                    <label class="block text-[11px] font-semibold text-[#637381] uppercase tracking-wider mb-1.5">
                      {{ t('erp.quotations.quotationDate') }}
                    </label>
                    <DateInput v-model="editForm.quotationDate" class="w-full px-3 py-2.5 border border-[#E2E8F0] text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400 transition-colors" />
                  </div>
                  <div>
                    <label class="block text-[11px] font-semibold text-[#637381] uppercase tracking-wider mb-1.5">
                      {{ t('erp.quotations.validUntil') }}
                    </label>
                    <DateInput v-model="editForm.validUntil" class="w-full px-3 py-2.5 border border-[#E2E8F0] text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400 transition-colors" />
                  </div>
                  <div>
                    <label class="block text-[11px] font-semibold text-[#637381] uppercase tracking-wider mb-1.5">
                      {{ t('erp.quotations.taxRate') }}
                    </label>
                    <input v-model.number="editForm.taxRate" type="number" min="0" max="100" step="0.01"
                      class="w-full px-3 py-2.5 border border-[#E2E8F0] text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400 transition-colors" />
                  </div>
                  <div class="col-span-2">
                    <label class="block text-[11px] font-semibold text-[#637381] uppercase tracking-wider mb-1.5">
                      {{ t('erp.quotations.notes') }}
                    </label>
                    <textarea v-model="editForm.notes" rows="2"
                      class="w-full px-3 py-2.5 border border-[#E2E8F0] text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400 transition-colors resize-none" />
                  </div>
                </div>
              </div>
            </div>

            <!-- Line items -->
            <div class="bg-white rounded-2xl border border-[#E2E8F0] shadow-card overflow-hidden">
              <div class="px-6 py-4 border-b border-[#E2E8F0] flex items-center justify-between">
                <div class="flex items-center gap-3">
                  <div class="w-8 h-8 rounded-xl bg-green-50 flex items-center justify-center flex-shrink-0">
                    <ClipboardDocumentListIcon class="w-4 h-4 text-green-600" />
                  </div>
                  <div>
                    <h2 class="text-sm font-semibold text-[#1C2434]">{{ t('erp.quotations.items') }}</h2>
                    <p v-if="(editMode ? editForm.items : q.items)?.length"
                      class="text-[11px] text-[#9BA7B0]">
                      {{ (editMode ? editForm.items : q.items).length }} item{{ (editMode ? editForm.items : q.items).length !== 1 ? 's' : '' }}
                    </p>
                  </div>
                </div>
                <button v-if="editMode" @click="addEditItem" type="button"
                  class="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-primary-500
                         border border-primary-200 rounded-xl hover:bg-primary-50 transition-colors">
                  <PlusIcon class="w-3.5 h-3.5" />
                  {{ t('erp.quotations.addItem') }}
                </button>
              </div>

              <!-- View mode table -->
              <template v-if="!editMode">
                <table class="w-full text-sm">
                  <thead class="bg-[#F7F9FC] border-b border-[#E2E8F0]">
                    <tr>
                      <th class="px-5 py-3 text-left text-[11px] font-semibold text-[#637381] uppercase tracking-wider">
                        {{ t('erp.quotations.colProductName') }}
                      </th>
                      <th class="px-5 py-3 text-right text-[11px] font-semibold text-[#637381] uppercase tracking-wider w-20">
                        {{ t('erp.quotations.colQty') }}
                      </th>
                      <th class="px-5 py-3 text-right text-[11px] font-semibold text-[#637381] uppercase tracking-wider w-28">
                        {{ t('erp.quotations.colUnitPrice') }}
                      </th>
                      <th class="px-5 py-3 text-right text-[11px] font-semibold text-[#637381] uppercase tracking-wider w-20">
                        {{ t('erp.quotations.colDiscount') }}
                      </th>
                      <th class="px-5 py-3 text-right text-[11px] font-semibold text-[#637381] uppercase tracking-wider w-28">
                        {{ t('erp.quotations.colTotal') }}
                      </th>
                    </tr>
                  </thead>
                  <tbody class="divide-y divide-[#E2E8F0]">
                    <tr v-for="item in q.items" :key="item.id" class="hover:bg-[#F7F9FC] transition-colors">
                      <td class="px-5 py-3.5 font-medium text-[#1C2434]">{{ item.productName }}</td>
                      <td class="px-5 py-3.5 text-right text-[#637381] tabular-nums">{{ item.qty }}</td>
                      <td class="px-5 py-3.5 text-right text-[#637381] tabular-nums">{{ fmtAmount(item.unitPrice) }}</td>
                      <td class="px-5 py-3.5 text-right text-[#637381] tabular-nums">{{ item.discount }}%</td>
                      <td class="px-5 py-3.5 text-right font-semibold text-[#1C2434] tabular-nums">
                        {{ fmtAmount(item.total) }}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </template>

              <!-- Edit mode table -->
              <template v-else>
                <div v-if="!editForm.items.length"
                  class="py-12 text-center text-sm text-[#9BA7B0]">
                  {{ t('erp.quotations.noItems') }}
                </div>
                <table v-else class="w-full text-sm">
                  <thead class="bg-[#F7F9FC] border-b border-[#E2E8F0]">
                    <tr>
                      <th class="px-5 py-3 text-left text-[11px] font-semibold text-[#637381] uppercase tracking-wider pr-3">
                        {{ t('erp.quotations.colProductName') }}
                      </th>
                      <th class="px-5 py-3 text-right text-[11px] font-semibold text-[#637381] uppercase tracking-wider w-20 pr-3">
                        {{ t('erp.quotations.colQty') }}
                      </th>
                      <th class="px-5 py-3 text-right text-[11px] font-semibold text-[#637381] uppercase tracking-wider w-28 pr-3">
                        {{ t('erp.quotations.colUnitPrice') }}
                      </th>
                      <th class="px-5 py-3 text-right text-[11px] font-semibold text-[#637381] uppercase tracking-wider w-20 pr-3">
                        {{ t('erp.quotations.colDiscount') }}
                      </th>
                      <th class="px-5 py-3 text-right text-[11px] font-semibold text-[#637381] uppercase tracking-wider w-28">
                        {{ t('erp.quotations.colTotal') }}
                      </th>
                      <th class="px-5 py-3 w-8"></th>
                    </tr>
                  </thead>
                  <tbody class="divide-y divide-[#E2E8F0]">
                    <tr v-for="(item, idx) in editForm.items" :key="idx" class="hover:bg-[#F7F9FC]">
                      <td class="px-3 py-2 pr-2">
                        <input v-model="item.productName" type="text"
                          class="w-full px-2.5 py-1.5 border border-[#E2E8F0] text-sm focus:outline-none focus:ring-1 focus:ring-primary-500/30" />
                      </td>
                      <td class="px-2 py-2">
                        <input v-model.number="item.qty" type="number" min="0.001" step="any" @input="calcItem(item)"
                          class="w-full px-2 py-1.5 border border-[#E2E8F0] text-sm text-right focus:outline-none focus:ring-1 focus:ring-primary-500/30" />
                      </td>
                      <td class="px-2 py-2">
                        <input v-model.number="item.unitPrice" type="number" min="0" step="any" @input="calcItem(item)"
                          class="w-full px-2 py-1.5 border border-[#E2E8F0] text-sm text-right focus:outline-none focus:ring-1 focus:ring-primary-500/30" />
                      </td>
                      <td class="px-2 py-2">
                        <input v-model.number="item.discount" type="number" min="0" max="100" step="any" @input="calcItem(item)"
                          class="w-full px-2 py-1.5 border border-[#E2E8F0] text-sm text-right focus:outline-none focus:ring-1 focus:ring-primary-500/30" />
                      </td>
                      <td class="px-2 py-2 text-right font-semibold text-[#1C2434] tabular-nums">
                        {{ fmtAmount(item.total) }}
                      </td>
                      <td class="px-2 py-2 pl-1">
                        <button @click="editForm.items.splice(idx, 1)" type="button"
                          class="p-1 text-[#CBD5E1] hover:text-red-500 transition-colors rounded-lg">
                          <XMarkIcon class="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </template>

              <!-- Totals -->
              <div class="border-t border-[#E2E8F0] px-5 py-4 space-y-2 bg-[#F7F9FC]">
                <div class="flex justify-between text-sm text-[#637381]">
                  <span>{{ t('erp.quotations.subtotal') }}</span>
                  <span class="font-medium text-[#1C2434] tabular-nums">
                    {{ fmtAmount(editMode ? editTotals.subtotal : q.subtotal) }}
                  </span>
                </div>
                <div class="flex justify-between text-sm text-[#637381]">
                  <span>{{ t('erp.quotations.tax') }} ({{ editMode ? editForm.taxRate : q.taxRate }}%)</span>
                  <span class="font-medium text-[#1C2434] tabular-nums">
                    {{ fmtAmount(editMode ? editTotals.tax : q.tax) }}
                  </span>
                </div>
                <div class="flex justify-between text-base font-bold text-[#1C2434] pt-2.5 border-t border-[#E2E8F0]">
                  <span>{{ t('erp.quotations.total') }}</span>
                  <span class="text-primary-500 tabular-nums">
                    {{ fmtAmount(editMode ? editTotals.total : q.total) }}
                  </span>
                </div>
              </div>
            </div>

          <!-- Summary + Actions card -->
          <div class="bg-white rounded-2xl border border-[#E2E8F0] shadow-card overflow-hidden">
            <div class="px-6 py-4 border-b border-[#E2E8F0] flex items-center gap-2.5">
              <CalculatorIcon class="w-4 h-4 text-[#9BA7B0]" />
              <h2 class="text-sm font-semibold text-[#1C2434]">{{ t('erp.quotations.summary') }}</h2>
            </div>

            <div class="px-6 py-4 grid grid-cols-3 gap-6">
              <div class="flex flex-col gap-0.5">
                <span class="text-[11px] font-semibold text-[#9BA7B0] uppercase tracking-wider">
                  {{ t('erp.quotations.items') }}
                </span>
                <span class="text-sm font-semibold text-[#1C2434]">{{ q.items?.length || 0 }}</span>
              </div>
              <div class="flex flex-col gap-0.5">
                <span class="text-[11px] font-semibold text-[#9BA7B0] uppercase tracking-wider">
                  {{ t('erp.quotations.subtotal') }}
                </span>
                <span class="text-sm font-semibold text-[#1C2434] tabular-nums">
                  {{ fmtAmount(editMode ? editTotals.subtotal : q.subtotal) }}
                </span>
              </div>
              <div class="flex flex-col gap-0.5">
                <span class="text-[11px] font-semibold text-[#9BA7B0] uppercase tracking-wider">
                  {{ t('erp.quotations.tax') }} ({{ editMode ? editForm.taxRate : q.taxRate }}%)
                </span>
                <span class="text-sm font-semibold text-[#1C2434] tabular-nums">
                  {{ fmtAmount(editMode ? editTotals.tax : q.tax) }}
                </span>
              </div>
            </div>

            <!-- Error -->
            <div v-if="actionError || saveError"
              class="mx-6 mb-4 flex items-start gap-2 bg-red-50 border border-red-200 text-red-700 text-xs px-3 py-2.5 rounded-xl">
              <ExclamationCircleIcon class="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span>{{ actionError || saveError }}</span>
            </div>

            <div class="px-6 py-5 bg-[#F7F9FC] border-t border-[#E2E8F0] flex items-center justify-between">
              <div>
                <p class="text-[11px] font-semibold text-[#9BA7B0] uppercase tracking-wider mb-0.5">
                  {{ t('erp.quotations.total') }}
                </p>
                <p class="text-3xl font-extrabold text-primary-500 tabular-nums leading-none">
                  {{ fmtAmount(editMode ? editTotals.total : q.total) }}
                </p>
              </div>

              <!-- Context-aware action buttons -->
              <div class="flex items-center gap-2.5">

                <!-- Edit mode -->
                <template v-if="editMode">
                  <button @click="cancelEdit"
                    class="px-5 py-2.5 text-sm font-medium text-[#637381] hover:text-[#1C2434] transition-colors">
                    {{ t('common.cancel') }}
                  </button>
                  <button @click="saveEdit" :disabled="saving"
                    class="inline-flex items-center gap-2 px-6 py-2.5 text-sm font-bold
                           bg-primary-500 text-white rounded-xl hover:bg-primary-600
                           disabled:opacity-50 transition-colors">
                    <ArrowPathIcon v-if="saving" class="w-4 h-4 animate-spin" />
                    <CheckIcon v-else class="w-4 h-4" />
                    {{ saving ? t('erp.common.saving') : t('common.saveChanges') }}
                  </button>
                </template>

                <!-- Draft -->
                <template v-else-if="q.status === 'draft'">
                  <button @click="startEdit"
                    class="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium
                           border border-[#E2E8F0] text-[#374151] hover:bg-white rounded-xl transition-colors">
                    <PencilIcon class="w-4 h-4" />
                    {{ t('erp.quotations.editQuotation') }}
                  </button>
                  <button @click="doSend" :disabled="acting"
                    class="inline-flex items-center gap-2 px-6 py-2.5 text-sm font-bold
                           bg-blue-600 text-white rounded-xl hover:bg-blue-700
                           disabled:opacity-50 transition-colors">
                    <ArrowPathIcon v-if="acting" class="w-4 h-4 animate-spin" />
                    <template v-else>{{ t('erp.quotations.markSent') }}</template>
                  </button>
                </template>

                <!-- Sent -->
                <template v-else-if="q.status === 'sent'">
                  <button @click="setStatus('draft')" :disabled="acting"
                    class="px-4 py-2.5 text-sm font-medium border border-[#E2E8F0] text-[#637381]
                           hover:bg-white rounded-xl disabled:opacity-50 transition-colors">
                    {{ t('erp.quotations.backToDraft') }}
                  </button>
                  <button @click="setStatus('rejected')" :disabled="acting"
                    class="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold
                           border border-red-200 text-red-600 hover:bg-red-50 rounded-xl
                           disabled:opacity-50 transition-colors">
                    {{ t('erp.quotations.markRejected') }}
                  </button>
                  <button @click="setStatus('accepted')" :disabled="acting"
                    class="inline-flex items-center gap-2 px-6 py-2.5 text-sm font-bold
                           bg-green-600 text-white rounded-xl hover:bg-green-700
                           disabled:opacity-50 transition-colors">
                    <ArrowPathIcon v-if="acting" class="w-4 h-4 animate-spin" />
                    <template v-else>{{ t('erp.quotations.markAccepted') }}</template>
                  </button>
                </template>

                <!-- Accepted -->
                <template v-else-if="q.status === 'accepted'">
                  <button @click="setStatus('draft')" :disabled="acting"
                    class="px-4 py-2.5 text-sm font-medium border border-[#E2E8F0] text-[#637381]
                           hover:bg-white rounded-xl disabled:opacity-50 transition-colors">
                    {{ t('erp.quotations.backToDraft') }}
                  </button>
                  <button @click="doConvert" :disabled="acting"
                    class="inline-flex items-center gap-2 px-6 py-2.5 text-sm font-bold
                           bg-purple-600 text-white rounded-xl hover:bg-purple-700
                           disabled:opacity-50 transition-colors">
                    <ArrowPathIcon v-if="acting" class="w-4 h-4 animate-spin" />
                    <template v-else>
                      <ArrowRightIcon class="w-4 h-4" />
                      {{ t('erp.quotations.convertToOrder') }}
                    </template>
                  </button>
                </template>

                <!-- Converted -->
                <template v-else-if="q.status === 'converted'">
                  <div class="flex items-center gap-2 px-4 py-2.5 bg-purple-50 border border-purple-200 rounded-xl">
                    <CheckCircleIcon class="w-4 h-4 text-purple-600 flex-shrink-0" />
                    <p class="text-sm font-semibold text-purple-800">{{ t('erp.quotations.convertedTitle') }}</p>
                    <RouterLink to="/erp/orders"
                      class="ml-1 inline-flex items-center gap-1 text-sm font-semibold text-purple-700 hover:underline">
                      {{ t('erp.quotations.viewOrders') }}
                      <ArrowRightIcon class="w-3.5 h-3.5" />
                    </RouterLink>
                  </div>
                </template>

                <!-- Rejected -->
                <template v-else-if="q.status === 'rejected'">
                  <button @click="setStatus('draft')" :disabled="acting"
                    class="inline-flex items-center gap-2 px-6 py-2.5 text-sm font-bold
                           border border-[#E2E8F0] text-[#637381] hover:bg-white rounded-xl
                           disabled:opacity-50 transition-colors">
                    {{ t('erp.quotations.backToDraft') }}
                  </button>
                </template>

              </div>
            </div>
          </div>

          <!-- Delete (draft only, not editing) -->
          <div v-if="q.status === 'draft' && !editMode" v-can="'erp.quotations.delete'"
            class="flex justify-end">
            <button @click="confirmDelete"
              class="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-red-500
                     border border-red-200 rounded-xl hover:bg-red-50 transition-colors">
              <TrashIcon class="w-4 h-4" />
              {{ t('erp.quotations.deleteQuotation') }}
            </button>
          </div>

        </div>
      </template>
    </div>
  </AppLayout>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import {
  ArrowLeftIcon, ChevronRightIcon, PlusIcon, XMarkIcon, PencilIcon,
  ArrowRightIcon, CheckIcon, TrashIcon, BoltIcon, ArrowPathIcon,
  ExclamationCircleIcon, UserIcon, ClipboardDocumentListIcon, CheckCircleIcon,
  CalculatorIcon,
} from '@heroicons/vue/24/outline'
import AppLayout from '@/layouts/AppLayout.vue'
import SearchSelect from '@/components/SearchSelect.vue'
import api from '@/api'

const { t }       = useI18n()
const route       = useRoute()
const router      = useRouter()
const q           = ref(null)
const loading     = ref(true)
const acting      = ref(false)
const saving      = ref(false)
const actionError = ref('')
const saveError   = ref('')
const editMode    = ref(false)
const customers   = ref([])

const editForm = ref({
  customerId: '', quotationDate: '', validUntil: '', taxRate: 0, notes: '', items: [],
})

// ── Workflow ──────────────────────────────────────────────
const FLOW_STEPS = [
  { key: 'draft',     label: 'Draft' },
  { key: 'sent',      label: 'Sent' },
  { key: 'accepted',  label: 'Accepted' },
  { key: 'converted', label: 'Converted' },
]

const COMPLETED_BEFORE = {
  draft:     [],
  sent:      ['draft'],
  accepted:  ['draft', 'sent'],
  converted: ['draft', 'sent', 'accepted'],
  rejected:  ['draft', 'sent'],
}

const isTerminal = computed(() => q.value?.status === 'rejected' || q.value?.status === 'converted')

function stepState(key) {
  const cur = q.value?.status
  if (!cur) return 'upcoming'
  if (cur === key) return 'current'
  if (cur === 'rejected' && key === 'accepted') return 'upcoming'
  return (COMPLETED_BEFORE[cur] || []).includes(key) ? 'completed' : 'upcoming'
}
function stepNodeClass(key) {
  const s = stepState(key)
  if (s === 'completed') return 'bg-green-500 text-white ring-green-200'
  if (s === 'current')   return 'bg-primary-500 text-white ring-primary-200'
  return 'bg-white text-[#CBD5E1] ring-[#E2E8F0]'
}
function stepLabelClass(key) {
  const s = stepState(key)
  if (s === 'completed') return 'text-green-700'
  if (s === 'current')   return 'text-primary-600 font-bold'
  return 'text-[#9BA7B0]'
}
function connectorClass(key) {
  const s = stepState(key)
  if (s === 'completed') return 'bg-green-300'
  if (s === 'current')   return 'bg-primary-200'
  return 'bg-[#E2E8F0]'
}

// ── Status badge ──────────────────────────────────────────
const STATUS_BADGE = {
  draft:     'bg-[#F1F5F9] text-[#637381]',
  sent:      'bg-blue-50 text-blue-700',
  accepted:  'bg-green-50 text-green-700',
  rejected:  'bg-red-50 text-red-600',
  converted: 'bg-purple-50 text-purple-700',
}
const STATUS_DOT = {
  draft:     'bg-slate-400',
  sent:      'bg-blue-500',
  accepted:  'bg-green-500',
  rejected:  'bg-red-500',
  converted: 'bg-purple-500',
}
function statusBadge(s) { return STATUS_BADGE[s] || STATUS_BADGE.draft }
function statusDot(s)   { return STATUS_DOT[s]   || STATUS_DOT.draft }

// ── Data ──────────────────────────────────────────────────
async function load() {
  loading.value = true
  try {
    const { data } = await api.get(`/erp/quotations/${route.params.id}`)
    q.value = data.data.quotation
  } catch { q.value = null }
  finally { loading.value = false }
}

onMounted(async () => {
  await load()
  const { data } = await api.get('/erp/customers', { params: { limit: 500 } })
  customers.value = data.data.customers || []
})

// ── Edit mode ─────────────────────────────────────────────
function startEdit() {
  const qv = q.value
  editForm.value = {
    customerId:    qv.customerId    || '',
    quotationDate: qv.quotationDate || '',
    validUntil:    qv.validUntil    || '',
    taxRate:       parseFloat(qv.taxRate) || 0,
    notes:         qv.notes || '',
    items: (qv.items || []).map(i => ({
      productName: i.productName,
      qty:         parseFloat(i.qty),
      unitPrice:   parseFloat(i.unitPrice),
      discount:    parseFloat(i.discount || 0),
      total:       parseFloat(i.total),
      saleItemId:  i.saleItemId || null,
    })),
  }
  editMode.value = true
}

function cancelEdit() { editMode.value = false; saveError.value = '' }

function addEditItem() {
  editForm.value.items.push({ productName: '', qty: 1, unitPrice: 0, discount: 0, total: 0 })
}

function calcItem(item) {
  const disc = parseFloat(item.discount || 0)
  item.total = parseFloat(
    (parseFloat(item.qty || 0) * parseFloat(item.unitPrice || 0) * (1 - disc / 100)).toFixed(2)
  )
}

const editTotals = computed(() => {
  const subtotal = editForm.value.items.reduce((s, i) => s + parseFloat(i.total || 0), 0)
  const rate   = parseFloat(editForm.value.taxRate || 0)
  const tax    = parseFloat((subtotal * rate / 100).toFixed(2))
  const total  = parseFloat((subtotal + tax).toFixed(2))
  return { subtotal, tax, total }
})

async function saveEdit() {
  saveError.value = ''
  if (!editForm.value.items.length) { saveError.value = 'At least one item is required'; return }
  if (editForm.value.items.find(i => !i.productName?.trim())) {
    saveError.value = 'All items must have a product name'; return
  }
  saving.value = true
  try {
    await api.put(`/erp/quotations/${route.params.id}`, {
      customerId:    editForm.value.customerId || null,
      quotationDate: editForm.value.quotationDate,
      validUntil:    editForm.value.validUntil || null,
      taxRate:       editForm.value.taxRate,
      notes:         editForm.value.notes,
      items:         editForm.value.items,
    })
    await load()
    editMode.value = false
  } catch (err) {
    saveError.value = err.response?.data?.message || 'Failed to save'
  } finally {
    saving.value = false
  }
}

// ── Status actions ────────────────────────────────────────
async function setStatus(status) {
  actionError.value = ''
  acting.value = true
  try {
    await api.patch(`/erp/quotations/${route.params.id}/status`, { status })
    await load()
  } catch (err) {
    actionError.value = err.response?.data?.message || 'Failed to update status'
  } finally {
    acting.value = false
  }
}

async function doSend()    { await setStatus('sent') }

async function doConvert() {
  actionError.value = ''
  acting.value = true
  try {
    const { data } = await api.post(`/erp/quotations/${route.params.id}/convert`)
    await load()
    if (data.data.orderId) router.push(`/erp/orders/${data.data.orderId}`)
  } catch (err) {
    actionError.value = err.response?.data?.message || 'Failed to convert'
  } finally {
    acting.value = false
  }
}

async function confirmDelete() {
  if (!confirm(`Delete quotation "${q.value?.refNo}"? This cannot be undone.`)) return
  try {
    await api.delete(`/erp/quotations/${route.params.id}`)
    router.push('/erp/quotations')
  } catch (err) {
    actionError.value = err.response?.data?.message || 'Delete failed'
  }
}

function fmtAmount(v) {
  return Number(v || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}
</script>
