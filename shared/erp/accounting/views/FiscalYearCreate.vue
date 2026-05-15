<template>
  <AppLayout>
    <div class="space-y-6 max-w-2xl">

      <!-- Header -->
      <div class="flex items-start gap-4">
        <RouterLink to="/erp/accounting/fiscal-years"
          class="mt-0.5 p-2 rounded-xl text-[#9BA7B0] hover:text-[#1C2434] hover:bg-white border border-transparent
                 hover:border-[#E2E8F0] transition-all flex-shrink-0">
          <ArrowLeftIcon class="w-[18px] h-[18px]" />
        </RouterLink>
        <div class="flex-1 min-w-0">
          <h1 class="text-xl font-bold text-[#1C2434]">{{ t('erp.fiscalYears.new') }}</h1>
          <nav class="flex items-center gap-1.5 mt-1">
            <RouterLink to="/erp/accounting/fiscal-years" class="text-[12px] text-[#9BA7B0] hover:text-[#637381] transition-colors">{{ t('erp.fiscalYears.title') }}</RouterLink>
            <ChevronRightIcon class="w-3 h-3 text-[#CBD5E1]" />
            <span class="text-[12px] text-[#637381]">{{ t('common.create') }}</span>
          </nav>
        </div>
        <div class="flex items-center gap-2.5 flex-shrink-0">
          <RouterLink to="/erp/accounting/fiscal-years" class="btn-secondary">{{ t('common.cancel') }}</RouterLink>
          <button @click="save" :disabled="saving" class="btn-primary gap-2">
            <ArrowPathIcon v-if="saving" class="w-4 h-4 animate-spin" />
            <CheckIcon v-else class="w-4 h-4" />
            {{ saving ? t('erp.common.creating') : t('erp.fiscalYears.createFiscalYear') }}
          </button>
        </div>
      </div>

      <!-- Form -->
      <div class="bg-white rounded-2xl border border-[#E2E8F0] shadow-card overflow-hidden">
        <div class="px-6 py-4 border-b border-[#E2E8F0] flex items-center gap-3">
          <div class="w-8 h-8 rounded-xl bg-indigo-50 flex items-center justify-center flex-shrink-0">
            <CalendarDaysIcon class="w-4 h-4 text-indigo-600" />
          </div>
          <h2 class="text-sm font-semibold text-[#1C2434]">{{ t('erp.fiscalYears.details') }}</h2>
        </div>
        <div class="px-6 py-5 space-y-5">

          <!-- Name -->
          <div>
            <label class="block text-[11px] font-semibold text-[#637381] uppercase tracking-wider mb-1.5">
              {{ t('erp.fiscalYears.colName') }} <span class="text-red-500 normal-case font-normal">*</span>
            </label>
            <input v-model="form.name" type="text" placeholder="e.g. FY2026, 2026"
              :class="['w-full px-3.5 py-2.5 border text-sm transition-colors',
                       'focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400',
                       errors.name ? 'border-red-300 bg-red-50' : 'border-[#E2E8F0] text-[#1C2434]']" />
            <p v-if="errors.name" class="mt-1 text-xs text-red-500">{{ errors.name }}</p>
          </div>

          <!-- Dates -->
          <div class="grid grid-cols-2 gap-5">
            <div>
              <label class="block text-[11px] font-semibold text-[#637381] uppercase tracking-wider mb-1.5">
                {{ t('erp.fiscalYears.colStartDate') }} <span class="text-red-500 normal-case font-normal">*</span>
              </label>
              <input v-model="form.startDate" type="date"
                :class="['w-full px-3.5 py-2.5 border text-sm transition-colors',
                         'focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400',
                         errors.startDate ? 'border-red-300 bg-red-50' : 'border-[#E2E8F0] text-[#1C2434]']" />
              <p v-if="errors.startDate" class="mt-1 text-xs text-red-500">{{ errors.startDate }}</p>
            </div>
            <div>
              <label class="block text-[11px] font-semibold text-[#637381] uppercase tracking-wider mb-1.5">
                {{ t('erp.fiscalYears.colEndDate') }} <span class="text-red-500 normal-case font-normal">*</span>
              </label>
              <input v-model="form.endDate" type="date"
                :class="['w-full px-3.5 py-2.5 border text-sm transition-colors',
                         'focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400',
                         errors.endDate ? 'border-red-300 bg-red-50' : 'border-[#E2E8F0] text-[#1C2434]']" />
              <p v-if="errors.endDate" class="mt-1 text-xs text-red-500">{{ errors.endDate }}</p>
            </div>
          </div>

          <!-- Duration hint -->
          <p v-if="duration" class="text-xs text-[#637381]">
            {{ t('erp.fiscalYears.period') }}: <span class="font-semibold text-[#1C2434]">{{ duration }}</span>
          </p>

          <!-- Notes -->
          <div>
            <label class="block text-[11px] font-semibold text-[#637381] uppercase tracking-wider mb-1.5">{{ t('erp.common.notes') }}</label>
            <textarea v-model="form.notes" rows="2" placeholder="Optional remarks…"
              class="w-full px-3.5 py-2.5 border border-[#E2E8F0] text-sm text-[#1C2434]
                     focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400
                     transition-colors resize-none placeholder-[#CBD5E1]" />
          </div>

        </div>
      </div>

      <!-- Global error -->
      <div v-if="globalError"
        class="flex items-start gap-3 bg-red-50 border border-red-200 text-red-700
               text-sm px-4 py-3.5 rounded-xl">
        <ExclamationCircleIcon class="w-5 h-5 flex-shrink-0 mt-0.5" />
        <span>{{ globalError }}</span>
      </div>

    </div>
  </AppLayout>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import {
  ArrowLeftIcon, ChevronRightIcon, CheckIcon, ArrowPathIcon,
  CalendarDaysIcon, ExclamationCircleIcon,
} from '@heroicons/vue/24/outline'
import AppLayout from '@/layouts/AppLayout.vue'
import api from '@/api'

const { t } = useI18n()
const router      = useRouter()
const saving      = ref(false)
const globalError = ref('')
const errors      = ref({})

const form = ref({
  name:      '',
  startDate: '',
  endDate:   '',
  notes:     '',
})

const duration = computed(() => {
  if (!form.value.startDate || !form.value.endDate) return ''
  const ms = new Date(form.value.endDate) - new Date(form.value.startDate)
  if (ms <= 0) return ''
  const days = Math.round(ms / 86_400_000) + 1
  return `${form.value.startDate} → ${form.value.endDate} (${days} days)`
})

function validate() {
  const e = {}
  if (!form.value.name?.trim())  e.name      = t('erp.fiscalYears.errName')
  if (!form.value.startDate)     e.startDate = t('erp.fiscalYears.errStartDate')
  if (!form.value.endDate)       e.endDate   = t('erp.fiscalYears.errEndDate')
  if (form.value.startDate && form.value.endDate && form.value.startDate >= form.value.endDate)
    e.endDate = t('erp.fiscalYears.errEndAfterStart')
  errors.value = e
  return Object.keys(e).length === 0
}

async function save() {
  globalError.value = ''
  if (!validate()) return
  saving.value = true
  try {
    const { data } = await api.post('/erp/accounting/fiscal-years', {
      name:      form.value.name,
      startDate: form.value.startDate,
      endDate:   form.value.endDate,
      notes:     form.value.notes || undefined,
    })
    router.push(`/erp/accounting/fiscal-years/${data.data.fiscalYear.id}`)
  } catch (err) {
    const d = err.response?.data
    globalError.value = d?.errors?.map(e => e.message).join(', ') || d?.message || t('erp.fiscalYears.errCreate')
  } finally {
    saving.value = false
  }
}
</script>
