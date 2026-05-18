<template>
  <AppLayout>
    <div class="space-y-6">

      <!-- Header -->
      <div class="flex items-center gap-3">
        <RouterLink to="/erp/uom-conversion" class="text-[#9BA7B0] hover:text-[#637381] transition">
          <ArrowLeftIcon class="w-5 h-5" />
        </RouterLink>
        <div>
          <h1 class="text-xl font-semibold text-[#1C2434]">{{ t('erp.uomConversion.newTitle') }}</h1>
          <p class="text-sm text-[#637381] mt-0.5">{{ t('erp.uomConversion.newDesc') }}</p>
        </div>
      </div>

      <!-- Form card -->
      <div class="bg-white rounded-2xl border border-[#E2E8F0] shadow-sm overflow-hidden">
        <div class="px-6 py-4 border-b border-[#E2E8F0]">
          <h2 class="text-sm font-semibold text-[#374151]">{{ t('erp.uomConversion.conversionDetails') }}</h2>
        </div>
        <div class="px-6 py-5 space-y-5">

          <div class="grid grid-cols-2 gap-5">

            <!-- From UOM -->
            <div>
              <label class="block text-xs font-semibold text-[#637381] uppercase tracking-wide mb-1.5">
                {{ t('erp.uomConversion.fromUom') }} <span class="text-red-500">*</span>
              </label>
              <SearchSelect v-model="form.fromUomId" :options="uomOptions" :placeholder="`— ${t('erp.uomConversion.selectUom')} —`" />
            </div>

            <!-- To UOM -->
            <div>
              <label class="block text-xs font-semibold text-[#637381] uppercase tracking-wide mb-1.5">
                {{ t('erp.uomConversion.toUom') }} <span class="text-red-500">*</span>
              </label>
              <SearchSelect v-model="form.toUomId" :options="uomOptions" :placeholder="`— ${t('erp.uomConversion.selectUom')} —`" />
            </div>

          </div>

          <!-- Factor -->
          <div class="max-w-xs">
            <label class="block text-xs font-semibold text-[#637381] uppercase tracking-wide mb-1.5">
              {{ t('erp.uomConversion.factor') }} <span class="text-red-500">*</span>
            </label>
            <input v-model.number="form.factor" type="number" min="0.000001" step="any" placeholder="e.g. 12"
              class="w-full px-3 py-2 border border-[#E2E8F0] rounded-lg text-sm
                     focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent" />
            <p class="mt-1.5 text-xs text-[#9BA7B0]">
              1 <span class="font-semibold text-[#374151]">{{ fromUomLabel }}</span>
              =
              <span class="font-semibold text-primary-500">{{ form.factor || '?' }}</span>
              <span class="font-semibold text-[#374151]">{{ toUomLabel }}</span>
            </p>
          </div>

          <!-- Notes -->
          <div>
            <label class="block text-xs font-semibold text-[#637381] uppercase tracking-wide mb-1.5">{{ t('erp.uomConversion.notes') }}</label>
            <input v-model="form.notes" type="text" :placeholder="t('erp.uomConversion.notesPlaceholder')"
              class="w-full px-3 py-2 border border-[#E2E8F0] rounded-lg text-sm
                     focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent" />
          </div>

        </div>
      </div>

      <!-- Error -->
      <div v-if="error" class="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg">
        <ExclamationCircleIcon class="w-4 h-4 flex-shrink-0" />
        {{ error }}
      </div>

      <!-- Actions -->
      <div class="flex justify-end gap-3">
        <RouterLink to="/erp/uom-conversion"
          class="px-4 py-2.5 text-sm border border-[#E2E8F0] rounded-xl hover:bg-[#F7F9FC] transition text-[#637381]">
          {{ t('common.cancel') }}
        </RouterLink>
        <button @click="save" :disabled="saving"
          class="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold
                 bg-primary-500 text-white rounded-xl hover:bg-primary-700
                 disabled:opacity-50 transition shadow-sm">
          {{ saving ? t('erp.common.saving') : t('erp.uomConversion.create') }}
        </button>
      </div>

    </div>
  </AppLayout>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { ArrowLeftIcon, ExclamationCircleIcon } from '@heroicons/vue/24/outline'
import AppLayout from '@/layouts/AppLayout.vue'
import SearchSelect from '@/components/SearchSelect.vue'
import api from '@/api'

const { t } = useI18n()
const router = useRouter()

const uoms   = ref([])
const error  = ref('')
const saving = ref(false)

const form = reactive({ fromUomId: '', toUomId: '', factor: '', notes: '' })

const uomOptions   = computed(() => uoms.value.map(u => ({ id: u.id, name: `${u.name} (${u.abbreviation})` })))
const fromUomLabel = computed(() => uoms.value.find(u => u.id === form.fromUomId)?.abbreviation || '…')
const toUomLabel   = computed(() => uoms.value.find(u => u.id === form.toUomId)?.abbreviation   || '…')

onMounted(async () => {
  const { data } = await api.get('/erp/uom', { params: { limit: 200 } })
  uoms.value = data.data.uoms.filter(u => u.status === 'active')
})

async function save() {
  error.value = ''
  if (!form.fromUomId)                  { error.value = 'From UOM is required'; return }
  if (!form.toUomId)                    { error.value = 'To UOM is required'; return }
  if (!form.factor || form.factor <= 0) { error.value = 'Factor must be greater than 0'; return }
  saving.value = true
  try {
    await api.post('/erp/uom-conversion', { ...form })
    router.push('/erp/uom-conversion')
  } catch (err) {
    error.value = err.response?.data?.message || 'Failed to create conversion'
  } finally {
    saving.value = false
  }
}
</script>
