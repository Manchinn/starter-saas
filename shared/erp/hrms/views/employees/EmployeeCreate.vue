<template>
  <AppLayout>
    <div class="space-y-6">

      <div class="flex items-center gap-3">
        <RouterLink to="/erp/hrms/employees" class="p-1.5 text-[#9BA7B0] hover:text-[#374151] hover:bg-[#F1F5F9] transition-colors">
          <ArrowLeftIcon class="w-5 h-5" />
        </RouterLink>
        <div>
          <h1 class="text-xl font-semibold text-[#1C2434]">{{ t('erp.employees.new') }}</h1>
          <p class="text-sm text-[#637381] mt-0.5">Link an existing user account to an employee record</p>
        </div>
      </div>

      <!-- Two-column layout -->
      <div class="grid grid-cols-2 gap-6 items-start">

        <!-- Left: Employee Information -->
        <div class="bg-white rounded-2xl border border-[#E2E8F0] shadow-sm overflow-hidden">
          <div class="px-6 py-4 border-b border-[#E2E8F0]">
            <h2 class="text-sm font-semibold text-[#374151]">{{ t('erp.employees.employeeInfo') }}</h2>
          </div>
          <div class="px-6 py-5 grid grid-cols-2 gap-4">

            <div class="col-span-2">
              <label class="block text-sm font-medium text-[#374151] mb-1">{{ t('erp.employees.employeeCode') }}</label>
              <input v-if="!autoCode.enabled.value" v-model="form.employeeCode" type="text" placeholder="e.g. EMP-001"
                class="w-full px-3 py-2 border text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary-500" />
              <input v-else :value="autoCode.preview.value" type="text" readonly
                class="w-full px-3 py-2 border text-sm bg-[#F7F9FC] text-[#637381] font-mono cursor-not-allowed" />
              <label class="mt-1 flex items-center gap-2 text-xs text-[#637381] cursor-pointer select-none">
                <input type="checkbox" :checked="autoCode.enabled.value" @change="autoCode.toggle" class="rounded" />
                {{ t('erp.common.autoGenerate') }}
              </label>
            </div>

            <div>
              <label class="block text-sm font-medium text-[#374151] mb-1">{{ t('erp.employees.firstName') }} <span class="text-red-500">*</span></label>
              <input v-model="form.firstName" type="text" placeholder="First name"
                :class="['w-full px-3 py-2 border text-sm focus:outline-none focus:ring-2 focus:ring-primary-500', errorOf('firstName') && 'input-error']" />
              <FieldError name="firstName" :errors="fieldErrors" />
            </div>

            <div>
              <label class="block text-sm font-medium text-[#374151] mb-1">{{ t('erp.employees.lastName') }} <span class="text-red-500">*</span></label>
              <input v-model="form.lastName" type="text" placeholder="Last name"
                :class="['w-full px-3 py-2 border text-sm focus:outline-none focus:ring-2 focus:ring-primary-500', errorOf('lastName') && 'input-error']" />
              <FieldError name="lastName" :errors="fieldErrors" />
            </div>

            <div>
              <label class="block text-sm font-medium text-[#374151] mb-1">{{ t('erp.employees.position') }}</label>
              <input v-model="form.position" type="text" placeholder="e.g. Software Engineer"
                class="w-full px-3 py-2 border text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
            </div>



            <div>
              <label class="block text-sm font-medium text-[#374151] mb-1">{{ t('erp.employees.phone') }}</label>
              <input v-model="form.phone" type="text" placeholder="+1 555 000 0000"
                class="w-full px-3 py-2 border text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
            </div>

            <div>
              <label class="block text-sm font-medium text-[#374151] mb-1">{{ t('erp.employees.startDate') }}</label>
              <DateInput v-model="form.startDate"
                class="w-full px-3 py-2 border text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
            </div>

            <div class="grid grid-cols-2 gap-4 col-span-2">
              <div>
                <label class="block text-sm font-medium text-[#374151] mb-1">{{ t('erp.common.activeFrom') }}</label>
                <DateInput v-model="form.activeFrom" class="w-full px-3 py-2 border text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
              </div>
              <div>
                <label class="block text-sm font-medium text-[#374151] mb-1">{{ t('erp.common.activeTo') }}</label>
                <DateInput v-model="form.activeTo" class="w-full px-3 py-2 border text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
              </div>
            </div>
            <div>
              <label class="block text-sm font-medium text-[#374151] mb-1">{{ t('erp.employees.status') }}</label>
              <SearchSelect v-model="form.status" :options="EMP_STATUS_OPTIONS" :allow-empty="false" placeholder="— Select —" />
            </div>

          </div>
        </div>

        <!-- Right: Login Credentials (Optional) -->
        <div class="bg-white rounded-2xl border border-[#E2E8F0] shadow-sm overflow-hidden">
          <div class="px-6 py-4 border-b border-[#E2E8F0]">
            <h2 class="text-sm font-semibold text-[#374151]">{{ t('erp.employees.loginCredentials') }}</h2>
          </div>

          <div class="px-6 py-5 space-y-4">
            <label class="flex items-center gap-2 cursor-pointer select-none mb-2">
              <input type="checkbox" v-model="createAccount" class="rounded text-primary-500 focus:ring-primary-500" />
              <span class="text-sm font-medium text-[#374151]">{{ t('erp.employees.createLogin') }}</span>
            </label>

            <div v-if="createAccount" class="space-y-4 pt-4 border-t border-slate-50">
              <div>
                <label class="block text-sm font-medium text-[#374151] mb-1">{{ t('erp.employees.emailUsername') }} <span class="text-red-500">*</span></label>
                <input v-model="form.email" type="email" placeholder="employee@company.com"
                  :class="['w-full px-3 py-2 border text-sm focus:outline-none focus:ring-2 focus:ring-primary-500', errorOf('email') && 'input-error']" />
                <FieldError name="email" :errors="fieldErrors" />
              </div>
              <div>
                <label class="block text-sm font-medium text-[#374151] mb-1">{{ t('erp.employees.password') }} <span class="text-red-500">*</span></label>
                <div class="relative">
                  <input v-model="form.password" :type="showPassword ? 'text' : 'password'" placeholder="Min 8 characters"
                    :class="['w-full px-3 py-2 border text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 pr-10', errorOf('password') && 'input-error']" />
                  <button type="button" @click="showPassword = !showPassword"
                    class="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#9BA7B0] hover:text-[#637381]">
                    <EyeSlashIcon v-if="showPassword" class="w-4 h-4" />
                    <EyeIcon v-else class="w-4 h-4" />
                  </button>
                </div>
                <FieldError name="password" :errors="fieldErrors" />
              </div>
              <p class="text-xs text-[#637381] italic">
                A system user account will be created and linked to this employee.
              </p>
            </div>
            <div v-else class="text-xs text-[#9BA7B0] py-2">
              This employee record will not have a login account associated with it.
            </div>

            <!-- Moved Department Selection here -->
            <div class="pt-6 border-t border-[#E2E8F0]">
              <label class="block text-sm font-medium text-[#374151] mb-3">{{ t('erp.employees.deptAssignments') }}</label>
              <div class="grid grid-cols-2 gap-2 p-3 border border-[#E2E8F0] bg-[#F7F9FC]/80 rounded-xl max-h-48 overflow-y-auto">
                <label v-for="d in departments" :key="d.id" class="flex items-center gap-2 px-2 py-1.5 hover:bg-white cursor-pointer transition-colors">
                  <input type="checkbox" v-model="form.departmentIds" :value="d.id" class="rounded text-primary-500 focus:ring-primary-500" />
                  <span class="text-xs font-medium text-[#374151] truncate" :title="d.name">{{ d.name }}</span>
                </label>
              </div>
              <p v-if="!departments.length" class="text-xs text-[#9BA7B0] mt-2 italic flex items-center gap-1.5">
                <InformationCircleIcon class="w-3.5 h-3.5" />
                No departments configured.
              </p>
            </div>
          </div>
        </div>

      </div>

      <div v-if="error" class="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3">
        <ExclamationCircleIcon class="w-4 h-4 flex-shrink-0" />
        {{ error }}
      </div>

      <div class="flex justify-end gap-3">
        <RouterLink to="/erp/hrms/employees" class="px-4 py-2 text-sm border border-[#E2E8F0] hover:bg-[#F7F9FC] transition-colors">
          {{ t('common.cancel') }}
        </RouterLink>
        <button @click="save" :disabled="saving"
          class="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold bg-primary-500 text-white
                 rounded-xl hover:bg-primary-700 disabled:opacity-50 transition-colors shadow-sm">
          <CheckIcon v-if="!saving" class="w-4 h-4" />
          {{ saving ? t('erp.common.creating') : t('erp.employees.create') }}
        </button>
      </div>

    </div>
  </AppLayout>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import { ArrowLeftIcon, CheckIcon, ExclamationCircleIcon, EyeIcon, EyeSlashIcon, InformationCircleIcon } from '@heroicons/vue/24/outline'
import AppLayout from '@/layouts/AppLayout.vue'
import SearchSelect from '@/components/SearchSelect.vue'
import FieldError from '@/components/form/FieldError.vue'
import { useFieldErrors } from '@/composables/useFieldErrors'
import api from '@/api'
import { useAutoCode } from '@/composables/useAutoCode'
import { parseApiError } from '@/utils/apiError'

const { t } = useI18n()

const EMP_STATUS_OPTIONS = computed(() => [
  { id: 'active',     name: t('erp.employees.active') },
  { id: 'inactive',   name: t('erp.employees.inactive') },
  { id: 'terminated', name: t('erp.employees.terminated') },
])
const router        = useRouter()
const autoCode      = useAutoCode('EMP')
const users         = ref([])
const departments   = ref([])
const error         = ref('')
const saving        = ref(false)
const createAccount = ref(false)
const showPassword  = ref(false)
const { fieldErrors, setFromError, setField, reset: resetErrors, errorOf } = useFieldErrors()

const form = ref({
  employeeCode:  '',
  firstName:     '',
  lastName:      '',
  position:      '',
  departmentIds: [],
  phone:         '',
  startDate:     '',
  status:        'active',
  activeFrom:    '',
  activeTo:      '',
  userId:        '',
  email:         '',
  password:      '',
})

const selectedUser = computed(() => users.value.find(u => u.id === form.value.userId) || null)

onMounted(async () => {
  try {
    const [staffRes, deptRes] = await Promise.all([
      api.get('/organizations/staff', { params: { limit: 500 } }),
      api.get('/erp/hrms/departments', { params: { limit: 1000 } }),
    ])
    users.value       = staffRes.data.data.staff
    departments.value = deptRes.data.data.departments
  } catch (err) {
    console.error('Failed to load initial data:', err)
  }
})

async function save() {
  error.value = ''
  resetErrors()
  if (!form.value.firstName.trim()) { setField('firstName', t('common.errors.required', { field: t('erp.employees.firstName') })); return }
  if (!form.value.lastName.trim())  { setField('lastName',  t('common.errors.required', { field: t('erp.employees.lastName') })); return }

  if (createAccount.value) {
    if (!form.value.email.trim())  { setField('email',    t('common.errors.required', { field: t('erp.employees.emailUsername') })); return }
    if (!form.value.password)      { setField('password', t('common.errors.required', { field: t('erp.employees.password') })); return }
    if (form.value.password.length < 8) { setField('password', t('common.errors.minLength', { field: t('erp.employees.password'), n: 8 })); return }
  }

  saving.value = true
  try {
    const payload = {
      ...form.value,
      credentialMode: createAccount.value ? 'new' : 'existing'
    }
    if (autoCode.enabled.value) { payload.autoCode = true; payload.employeeCode = null }
    await api.post('/erp/hrms/employees', payload)
    router.push('/erp/hrms/employees')
  } catch (err) {
    const had = setFromError(err)
    if (!had) error.value = parseApiError(err, 'Failed to create employee')
  } finally {
    saving.value = false
  }
}
</script>
