<template>
  <AppLayout>
    <div class="space-y-6">

      <div class="flex items-center justify-between gap-3">
        <div class="flex items-center gap-3">
          <RouterLink to="/erp/customers" class="text-[#9BA7B0] hover:text-[#637381] transition">
            <ArrowLeftIcon class="w-5 h-5" />
          </RouterLink>
          <h1 class="text-2xl font-bold text-[#1C2434]">{{ t('erp.customers.new') }}</h1>
        </div>

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
      </div>

      <div class="bg-white border border-[#E2E8F0] p-6 space-y-5">

        <div class="grid grid-cols-2 gap-4">
          <div>
            <FormField name="code" :label="t('erp.customers.customerCode')" :errors="fieldErrors">
              <template #default="{ id }">
                <input v-if="!autoCode.enabled.value" :id="id" ref="codeInputRef" v-model="form.code" type="text" placeholder="e.g. CUS-001" class="input" />
                <input v-else :id="id" :value="autoCode.preview.value" type="text" readonly class="input bg-[#F7F9FC] text-[#637381] font-mono cursor-not-allowed" />
              </template>
            </FormField>
            <label class="mt-1 flex items-center gap-2 text-xs text-[#637381] cursor-pointer select-none">
              <input type="checkbox" :checked="autoCode.enabled.value" @change="autoCode.toggle" />
              {{ t('erp.common.autoGenerate') }}
            </label>
          </div>
          <FormField v-model="form.name" name="name" :label="t('erp.customers.name')" :placeholder="t('erp.customers.name')" required :errors="fieldErrors" wrapper-class="col-span-2 sm:col-span-1" />
          <FormField v-model="form.company" name="company" :label="t('erp.customers.company')" :placeholder="t('erp.customers.company')" :errors="fieldErrors" wrapper-class="col-span-2 sm:col-span-1" />
          <FormField v-model="form.email" name="email" type="email" :label="t('erp.customers.email')" :placeholder="t('erp.customers.email')" :errors="fieldErrors" wrapper-class="col-span-2 sm:col-span-1" />
          <FormField v-model="form.phone" name="phone" :label="t('erp.customers.phone')" :placeholder="t('erp.customers.phone')" :errors="fieldErrors" wrapper-class="col-span-2 sm:col-span-1" />
          <FormField v-model="form.address" name="address" textarea :rows="2" :label="t('erp.customers.address')" :placeholder="t('erp.customers.address')" :errors="fieldErrors" wrapper-class="col-span-2" />
          <FormField v-model="form.notes" name="notes" textarea :rows="3" :label="t('erp.customers.notes')" :placeholder="t('erp.customers.notes')" :errors="fieldErrors" wrapper-class="col-span-2" />
          <div class="grid grid-cols-2 gap-4">
            <DateInputWithLabel v-model="form.activeFrom" :label="t('erp.common.activeFrom')" />
            <DateInputWithLabel v-model="form.activeTo" :label="t('erp.common.activeTo')" />
          </div>
          <SearchSelectWithLabel v-model="form.status" :label="t('erp.customers.status')" :options="STATUS_OPTIONS" :allow-empty="false" />
          <SearchSelectWithLabel v-model="form.customerGroupId" :label="t('erp.customers.group')" :options="groups" placeholder="— None —" />
        </div>

        <div v-if="error" class="bg-red-50 text-red-700 text-sm px-4 py-2">{{ error }}</div>

        <div class="flex justify-end gap-3 pt-2">
          <AppButton to="/erp/customers" variant="secondary">{{ t('common.cancel') }}</AppButton>
          <AppButton @click="save" :loading="saving">
            {{ saving ? t('erp.common.creating') : t('erp.customers.create') }}
          </AppButton>
        </div>

      </div>
    </div>
  </AppLayout>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { RouterLink, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { ArrowLeftIcon } from '@heroicons/vue/24/outline'
import AppLayout from '@/layouts/AppLayout.vue'
import AppButton from '@/components/AppButton.vue'
import DateInputWithLabel from '@/components/DateInputWithLabel.vue'
import SearchSelectWithLabel from '@/components/SearchSelectWithLabel.vue'
import FormField from '@/components/form/FormField.vue'
import { useFieldErrors } from '@/composables/useFieldErrors'
import api from '@/api'
import { useAutoCode } from '@/composables/useAutoCode'
import { parseApiError } from '@/utils/apiError'

const { t } = useI18n()
const STATUS_OPTIONS = computed(() => [
  { id: 'active',   name: t('common.active') },
  { id: 'inactive', name: t('common.inactive') },
])
const router   = useRouter()
const form     = ref({ code: '', name: '', company: '', email: '', phone: '', address: '', notes: '', status: 'active', activeFrom: '', activeTo: '', customerGroupId: '' })
const groups   = ref([])
const error    = ref('')
const saving   = ref(false)
const autoCode = useAutoCode('CUS')
const { fieldErrors, setFromError, setField, reset: resetErrors } = useFieldErrors()

const showShortcuts = ref(false)
const shortcutsRef  = ref(null)
const codeInputRef  = ref(null)

const SHORTCUTS = [
  { key: 'Ctrl+S', label: 'Save' },
  { key: 'Escape',     label: 'Cancel / back' },
]

function onClickOutsideShortcuts(e) {
  if (shortcutsRef.value && !shortcutsRef.value.contains(e.target)) {
    showShortcuts.value = false
  }
}

function onKeydown(e) {
  if (e.key === 'Escape') {
    router.push('/erp/customers')
  } else if (e.ctrlKey && e.key === 's') {
    e.preventDefault()
    save()
  }
}

onMounted(async () => {
  const { data } = await api.get('/erp/customer-groups/all')
  groups.value = data.data.groups
  window.addEventListener('keydown', onKeydown)
  document.addEventListener('mousedown', onClickOutsideShortcuts)
  if (!autoCode.enabled.value) codeInputRef.value?.focus()
})
onUnmounted(() => {
  window.removeEventListener('keydown', onKeydown)
  document.removeEventListener('mousedown', onClickOutsideShortcuts)
})

async function save() {
  error.value = ''
  resetErrors()
  if (!form.value.name.trim()) { setField('name', t('common.errors.required', { field: t('erp.customers.name') })); return }
  saving.value = true
  try {
    const payload = { ...form.value, customerGroupId: form.value.customerGroupId || null }
    if (autoCode.enabled.value) { payload.autoCode = true; payload.code = null }
    await api.post('/erp/customers', payload)
    router.push('/erp/customers')
  } catch (err) {
    const had = setFromError(err)
    if (!had) error.value = parseApiError(err, 'Failed to create customer')
  } finally {
    saving.value = false
  }
}
</script>
