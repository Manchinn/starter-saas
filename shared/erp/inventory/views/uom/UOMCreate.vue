<template>
  <AppLayout>
    <div class="space-y-6">

      <PageHeader :title="t('erp.uom.new')" back-to="/erp/uom">
        <template #actions>
          <!-- Keyboard shortcuts popover -->
          <div class="relative" ref="shortcutsRef">
            <button @click="showShortcuts = !showShortcuts"
              class="h-8 px-2 flex items-center gap-1 border border-[#E2E8F0] text-[#9BA7B0] hover:text-[#374151] hover:bg-[#F7F9FC] transition-colors text-sm font-semibold"
              title="Keyboard shortcuts">
              <span>?</span>
              <span class="text-xs font-medium">Shortcuts</span>
            </button>
            <Transition
              enter-active-class="transition-all duration-150 ease-out"
              enter-from-class="opacity-0 translate-y-1"
              enter-to-class="opacity-100 translate-y-0"
              leave-active-class="transition-all duration-100 ease-in"
              leave-from-class="opacity-100 translate-y-0"
              leave-to-class="opacity-0 translate-y-1">
              <div v-if="showShortcuts"
                class="absolute right-0 top-10 z-50 w-56 bg-white border border-[#E2E8F0] shadow-lg p-4 space-y-2">
                <p class="text-xs font-semibold text-[#374151] uppercase tracking-wide mb-3">Keyboard Shortcuts</p>
                <div v-for="s in SHORTCUTS" :key="s.key" class="flex items-center justify-between gap-3">
                  <span class="text-xs text-[#637381]">{{ s.label }}</span>
                  <kbd class="inline-flex items-center px-1.5 py-0.5 border border-[#E2E8F0] bg-[#F7F9FC] text-[10px] font-mono text-[#374151] whitespace-nowrap">{{ s.key }}</kbd>
                </div>
              </div>
            </Transition>
          </div>
        </template>
      </PageHeader>

      <div class="bg-white border border-[#E2E8F0] p-6 space-y-5">
        <div class="grid grid-cols-2 gap-4">
          <FormField v-model="form.abbreviation" name="abbreviation" :label="t('erp.uom.code')"
            placeholder="e.g. kg" required :errors="fieldErrors" input-class="font-mono"
            wrapper-class="col-span-2 sm:col-span-1" />
          <FormField v-model="form.name" name="name" :label="t('erp.uom.name')"
            placeholder="e.g. Kilogram" required :errors="fieldErrors"
            wrapper-class="col-span-2 sm:col-span-1" />
          <FormField v-model="form.description" name="description" :label="t('erp.uom.description')"
            textarea :rows="2" placeholder="Optional description…" :errors="fieldErrors"
            wrapper-class="col-span-2" />
          <div class="grid grid-cols-2 gap-4">
            <div>
              <FieldLabel :text="t('erp.common.activeFrom')" />
              <DateInput v-model="form.activeFrom" class="input text-sm" />
            </div>
            <div>
              <FieldLabel :text="t('erp.common.activeTo')" />
              <DateInput v-model="form.activeTo" class="input text-sm" />
            </div>
          </div>
          <div>
            <FieldLabel :text="t('erp.uom.status')" />
            <SearchSelect v-model="form.status" :options="statusOptions" :allow-empty="false" />
          </div>
        </div>

        <ErrorBanner :message="error" />

        <div class="flex justify-end gap-3 pt-2">
          <HeaderSaveActions cancel-to="/erp/uom" :cancel-label="t('common.cancel')"
            :save-label="t('erp.uom.create')" :saving-label="t('erp.common.creating')"
            :saving="saving" @save="save" />
        </div>
      </div>

    </div>
  </AppLayout>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import AppLayout from '@/layouts/AppLayout.vue'
import SearchSelect from '@/components/SearchSelect.vue'
import PageHeader from '@/components/form/PageHeader.vue'
import FieldLabel from '@/components/form/FieldLabel.vue'
import FormField from '@/components/form/FormField.vue'
import ErrorBanner from '@/components/form/ErrorBanner.vue'
import HeaderSaveActions from '@/components/form/HeaderSaveActions.vue'
import { useFieldErrors } from '@/composables/useFieldErrors'
import api from '@/api'
import { parseApiError } from '@/utils/apiError'

const { t } = useI18n()

const statusOptions = computed(() => [
  { id: 'active',   name: t('common.active')   },
  { id: 'inactive', name: t('common.inactive') },
])
const router = useRouter()
const form   = ref({ name: '', abbreviation: '', description: '', status: 'active', activeFrom: '', activeTo: '' })
const error  = ref('')
const saving = ref(false)
const { fieldErrors, setFromError, setField, reset: resetErrors } = useFieldErrors()

const showShortcuts = ref(false)
const shortcutsRef  = ref(null)

const SHORTCUTS = [
  { key: 'Ctrl+S', label: 'Save' },
  { key: 'Escape', label: 'Cancel / back' },
]

function onClickOutsideShortcuts(e) {
  if (shortcutsRef.value && !shortcutsRef.value.contains(e.target)) {
    showShortcuts.value = false
  }
}

function onKeydown(e) {
  if (e.key === 'Escape') {
    router.push('/erp/uom')
  } else if (e.ctrlKey && e.key === 's') {
    e.preventDefault()
    save()
  }
}

onMounted(() => {
  window.addEventListener('keydown', onKeydown)
  document.addEventListener('mousedown', onClickOutsideShortcuts)
})
onUnmounted(() => {
  window.removeEventListener('keydown', onKeydown)
  document.removeEventListener('mousedown', onClickOutsideShortcuts)
})

async function save() {
  error.value = ''
  resetErrors()
  if (!form.value.name.trim()) { setField('name', t('common.errors.required', { field: t('erp.uom.name') })); return }
  if (!form.value.abbreviation.trim()) { setField('abbreviation', t('common.errors.required', { field: t('erp.uom.code') })); return }
  saving.value = true
  try {
    await api.post('/erp/uom', form.value)
    router.push('/erp/uom')
  } catch (err) {
    const had = setFromError(err)
    if (!had) error.value = parseApiError(err, 'Failed to create UOM')
  } finally {
    saving.value = false
  }
}
</script>
