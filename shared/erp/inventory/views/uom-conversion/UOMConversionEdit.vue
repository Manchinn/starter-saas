<template>
  <AppLayout>
    <div class="space-y-6">

      <div class="flex items-center gap-3">
        <RouterLink to="/erp/uom-conversion" class="text-[#9BA7B0] hover:text-[#637381] transition">
          <ArrowLeftIcon class="w-5 h-5" />
        </RouterLink>
        <div>
          <h1 class="text-xl font-semibold text-[#1C2434]">{{ t('erp.uomConversion.editTitle') }}</h1>
          <p class="text-sm text-[#637381] mt-0.5">{{ t('erp.uomConversion.editDesc') }}</p>
        </div>
      </div>

      <div v-if="loading" class="text-center py-12 text-[#9BA7B0]">
        <div class="inline-block w-5 h-5 border-2 border-primary-500 border-t-transparent animate-spin" />
      </div>

      <template v-else>

        <div class="bg-white border border-[#E2E8F0] shadow-sm overflow-hidden">
          <div class="px-6 py-4 border-b border-[#E2E8F0]">
            <h2 class="text-sm font-semibold text-[#374151]">{{ t('erp.uomConversion.conversionDetails') }}</h2>
          </div>
          <div class="px-6 py-5 space-y-5">

            <div class="grid grid-cols-2 gap-5">
              <div>
                <label class="block text-xs font-semibold text-[#637381] uppercase tracking-wide mb-1.5">
                  {{ t('erp.uomConversion.fromUom') }} <span class="text-red-500">*</span>
                </label>
                <SearchSelect v-model="form.fromUomId" :options="uomOptions" :invalid="!!errorOf('fromUomId')" :placeholder="`— ${t('erp.uomConversion.selectUom')} —`" />
                <FieldError name="fromUomId" :errors="fieldErrors" />
              </div>
              <div>
                <label class="block text-xs font-semibold text-[#637381] uppercase tracking-wide mb-1.5">
                  {{ t('erp.uomConversion.toUom') }} <span class="text-red-500">*</span>
                </label>
                <SearchSelect v-model="form.toUomId" :options="uomOptions" :invalid="!!errorOf('toUomId')" :placeholder="`— ${t('erp.uomConversion.selectUom')} —`" />
                <FieldError name="toUomId" :errors="fieldErrors" />
              </div>
            </div>

            <div class="max-w-xs">
              <label class="block text-xs font-semibold text-[#637381] uppercase tracking-wide mb-1.5">
                {{ t('erp.uomConversion.factor') }} <span class="text-red-500">*</span>
              </label>
              <input v-model.number="form.factor" type="number" min="0.000001" step="any" placeholder="e.g. 12"
                :class="['w-full px-3 py-2 border border-[#E2E8F0] text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent', errorOf('factor') && 'input-error']" />
              <FieldError name="factor" :errors="fieldErrors" />
              <p class="mt-1.5 text-xs text-[#9BA7B0]">
                1 <span class="font-semibold text-[#374151]">{{ fromUomLabel }}</span>
                =
                <span class="font-semibold text-primary-500">{{ form.factor || '?' }}</span>
                <span class="font-semibold text-[#374151]">{{ toUomLabel }}</span>
              </p>
            </div>

            <div>
              <label class="block text-xs font-semibold text-[#637381] uppercase tracking-wide mb-1.5">
                {{ t('erp.uomConversion.notes') }}
              </label>
              <input v-model="form.notes" type="text" :placeholder="t('erp.uomConversion.notesPlaceholder')"
                class="w-full px-3 py-2 border border-[#E2E8F0] text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent" />
            </div>

          </div>
        </div>

        <div v-if="error"
          class="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3">
          <ExclamationCircleIcon class="w-4 h-4 flex-shrink-0" />
          {{ error }}
        </div>

        <div class="flex justify-end gap-3">
          <RouterLink to="/erp/uom-conversion"
            class="px-4 py-2.5 text-sm border border-[#E2E8F0] hover:bg-[#F7F9FC] transition text-[#637381]">
            {{ t('common.cancel') }}
          </RouterLink>
          <button @click="save" :disabled="saving"
            class="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold bg-primary-500 text-white hover:bg-primary-700 disabled:opacity-50 transition shadow-sm">
            {{ saving ? t('erp.common.saving') : t('common.saveChanges') }}
          </button>
        </div>

      </template>
    </div>
  </AppLayout>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { ArrowLeftIcon, ExclamationCircleIcon } from '@heroicons/vue/24/outline'
import AppLayout from '@/layouts/AppLayout.vue'
import SearchSelect from '@/components/SearchSelect.vue'
import FieldError from '@/components/form/FieldError.vue'
import { useFieldErrors } from '@/composables/useFieldErrors'
import api from '@/api'
import { parseApiError } from '@/utils/apiError'

const { t }  = useI18n()
const route  = useRoute()
const router = useRouter()

const uoms    = ref([])
const loading = ref(true)
const saving  = ref(false)
const error   = ref('')
const { fieldErrors, setFromError, setField, reset: resetErrors, errorOf } = useFieldErrors()

const form = ref({ fromUomId: '', toUomId: '', factor: '', notes: '' })

const uomOptions   = computed(() => uoms.value.map(u => ({ id: u.id, name: `${u.name} (${u.abbreviation})` })))
const fromUomLabel = computed(() => uoms.value.find(u => u.id === form.value.fromUomId)?.abbreviation || '…')
const toUomLabel   = computed(() => uoms.value.find(u => u.id === form.value.toUomId)?.abbreviation   || '…')

onMounted(async () => {
  try {
    const [convRes, uomRes] = await Promise.all([
      api.get('/erp/uom-conversion'),
      api.get('/erp/uom', { params: { limit: 200 } }),
    ])
    uoms.value = uomRes.data.data.uoms.filter(u => u.status === 'active')
    const c = convRes.data.data.conversions.find(c => String(c.id) === route.params.id)
    if (!c) { router.push('/erp/uom-conversion'); return }
    form.value = { fromUomId: c.fromUomId, toUomId: c.toUomId, factor: Number(c.factor), notes: c.notes || '' }
  } catch {
    router.push('/erp/uom-conversion')
  } finally {
    loading.value = false
  }
})

async function save() {
  error.value = ''
  resetErrors()
  if (!form.value.fromUomId)                        { setField('fromUomId', t('common.errors.required', { field: t('erp.uomConversion.fromUom') })); return }
  if (!form.value.toUomId)                          { setField('toUomId',   t('common.errors.required', { field: t('erp.uomConversion.toUom') })); return }
  if (!form.value.factor || form.value.factor <= 0) { setField('factor',    t('common.errors.mustBeGreaterThan', { field: t('erp.uomConversion.factor'), min: 0 })); return }
  saving.value = true
  try {
    await api.put(`/erp/uom-conversion/${route.params.id}`, form.value)
    router.push('/erp/uom-conversion')
  } catch (err) {
    const had = setFromError(err)
    if (!had) error.value = parseApiError(err, 'Failed to save')
  } finally {
    saving.value = false
  }
}
</script>
