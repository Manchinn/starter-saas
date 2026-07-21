<template>
  <AppLayout>
    <div class="space-y-6">

      <PageHeader :title="t('erp.employees.new')" :back-to="employeesListPath"
        :breadcrumb="[
          { label: t('erp.employees.title'), to: employeesListPath },
          { label: t('common.create') },
        ]">
        <template #actions>
          <HeaderSaveActions
            :cancel-to="employeesListPath"
            :cancel-label="t('common.cancel')"
            :saving="saving"
            :saving-label="t('erp.common.creating')"
            :save-label="t('erp.employees.create')"
            @save="save"
          />
        </template>
      </PageHeader>

      <!-- Two-column layout -->
      <div class="grid grid-cols-2 gap-6 items-start">

        <!-- Left: Employee Information -->
        <FormCard :title="t('erp.employees.employeeInfo')" :icon="IdentificationIcon" icon-color="primary">
          <div class="grid grid-cols-2 gap-4">

            <FormField name="employeeCode" :label="t('erp.employees.employeeCode')" :errors="fieldErrors"
              wrapper-class="col-span-2">
              <template #default="{ id }">
                <input v-if="!autoCode.enabled.value" :id="id" v-model="form.employeeCode" type="text"
                  placeholder="e.g. EMP-001" class="input font-mono" />
                <input v-else :id="id" :value="autoCode.preview.value" type="text" readonly
                  class="input bg-[#F7F9FC] text-[#637381] font-mono cursor-not-allowed" />
                <label class="mt-1 flex items-center gap-2 text-xs text-[#637381] cursor-pointer select-none">
                  <input type="checkbox" :checked="autoCode.enabled.value" @change="autoCode.toggle" />
                  {{ t('erp.common.autoGenerate') }}
                </label>
              </template>
            </FormField>

            <FormField name="firstName" :label="t('erp.employees.firstName')" :errors="fieldErrors"
              v-model="form.firstName" placeholder="First name" required />

            <FormField name="lastName" :label="t('erp.employees.lastName')" :errors="fieldErrors"
              v-model="form.lastName" placeholder="Last name" required />

            <FormField name="position" :label="t('erp.employees.position')" :errors="fieldErrors"
              v-model="form.position" placeholder="e.g. Software Engineer" />

            <FormField name="phone" :label="t('erp.employees.phone')" :errors="fieldErrors"
              v-model="form.phone" placeholder="+1 555 000 0000" />

            <FormField name="startDate" :label="t('erp.employees.startDate')" :errors="fieldErrors">
              <template #default>
                <DateInput v-model="form.startDate" class="input" />
              </template>
            </FormField>

            <div class="col-span-2 grid grid-cols-2 gap-4">
              <FormField name="activeFrom" :label="t('erp.common.activeFrom')" :errors="fieldErrors">
                <template #default>
                  <DateInput v-model="form.activeFrom" class="input" />
                </template>
              </FormField>
              <FormField name="activeTo" :label="t('erp.common.activeTo')" :errors="fieldErrors">
                <template #default>
                  <DateInput v-model="form.activeTo" class="input" />
                </template>
              </FormField>
            </div>

            <div>
              <FieldLabel :text="t('erp.employees.status')" />
              <SearchSelect v-model="form.status" :options="EMP_STATUS_OPTIONS" :allow-empty="false" placeholder="— Select —" />
            </div>

          </div>
        </FormCard>

        <!-- Right: Login Credentials + Departments -->
        <FormCard :title="t('erp.employees.loginCredentials')" :icon="KeyIcon" icon-color="green">
          <div class="space-y-4">

            <label class="flex items-center gap-2 cursor-pointer select-none">
              <input type="checkbox" v-model="createAccount" class="text-primary-500 focus:ring-primary-500" />
              <span class="text-sm font-medium text-[#374151]">{{ t('erp.employees.createLogin') }}</span>
            </label>

            <div v-if="createAccount" class="space-y-4 pt-4 border-t border-slate-50">
              <FormField name="email" :label="t('erp.employees.emailUsername')" :errors="fieldErrors"
                v-model="form.email" type="email" placeholder="employee@company.com" required />

              <FormField name="password" :label="t('erp.employees.password')" :errors="fieldErrors"
                v-model="form.password" :type="showPassword ? 'text' : 'password'"
                placeholder="Min 8 characters" required>
                <template #suffix>
                  <button type="button" @click="showPassword = !showPassword"
                    class="text-[#9BA7B0] hover:text-[#637381]">
                    <EyeSlashIcon v-if="showPassword" class="w-4 h-4" />
                    <EyeIcon v-else class="w-4 h-4" />
                  </button>
                </template>
              </FormField>

              <p class="text-xs text-[#637381] italic">
                A system user account will be created and linked to this employee.
              </p>
            </div>

            <div v-else class="text-xs text-[#9BA7B0] py-2">
              This employee record will not have a login account associated with it.
            </div>

            <div v-if="createAccount" class="pt-4 border-t border-[#E2E8F0]">
              <div class="flex items-center justify-between mb-2">
                <FieldLabel :text="t('erp.employees.roleAssignments')" />
                <span class="text-[10px] font-bold text-[#9BA7B0] uppercase tracking-widest">
                  {{ form.roleIds.length }} {{ t('erp.employees.selected') }}
                </span>
              </div>
              <p class="text-xs text-[#637381] mb-2">{{ t('erp.employees.roleHint') }}</p>
              <div class="grid grid-cols-1 gap-2 p-3 border border-[#E2E8F0] bg-[#F7F9FC]/80 max-h-48 overflow-y-auto">
                <label v-for="role in roles" :key="role.id" class="flex items-center gap-2 px-2 py-1.5 hover:bg-white cursor-pointer transition-colors">
                  <input type="checkbox" v-model="form.roleIds" :value="role.id" class="text-primary-500 focus:ring-primary-500" />
                  <span class="w-2 h-2 flex-shrink-0" :style="{ backgroundColor: role.color }" />
                  <span class="text-xs font-medium text-[#374151] truncate" :title="role.name">{{ role.name }}</span>
                </label>
              </div>
              <p v-if="!roles.length" class="text-xs text-[#9BA7B0] mt-2 italic">{{ t('erp.employees.noAssignableRoles') }}</p>
            </div>

            <!-- Department Assignments -->
            <div class="pt-4 border-t border-[#E2E8F0]">
              <FieldLabel :text="t('erp.employees.deptAssignments')" />
              <div class="mt-2 grid grid-cols-2 gap-2 p-3 border border-[#E2E8F0] bg-[#F7F9FC]/80 max-h-48 overflow-y-auto">
                <label v-for="d in departments" :key="d.id" class="flex items-center gap-2 px-2 py-1.5 hover:bg-white cursor-pointer transition-colors">
                  <input type="checkbox" v-model="form.departmentIds" :value="d.id" class="text-primary-500 focus:ring-primary-500" />
                  <span class="text-xs font-medium text-[#374151] truncate" :title="d.name">{{ d.name }}</span>
                </label>
              </div>
              <p v-if="!departments.length" class="text-xs text-[#9BA7B0] mt-2 italic flex items-center gap-1.5">
                <InformationCircleIcon class="w-3.5 h-3.5" />
                No departments configured.
              </p>
            </div>

          </div>
        </FormCard>

      </div>

      <ErrorBanner :message="error" />

    </div>
  </AppLayout>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter, useRoute } from 'vue-router'
import { IdentificationIcon, KeyIcon, EyeIcon, EyeSlashIcon, InformationCircleIcon } from '@heroicons/vue/24/outline'
import AppLayout from '@/layouts/AppLayout.vue'
import DateInput from '@/components/DateInput.vue'
import SearchSelect from '@/components/SearchSelect.vue'
import PageHeader from '@/components/form/PageHeader.vue'
import FormCard from '@/components/form/FormCard.vue'
import FormField from '@/components/form/FormField.vue'
import FieldLabel from '@/components/form/FieldLabel.vue'
import ErrorBanner from '@/components/form/ErrorBanner.vue'
import HeaderSaveActions from '@/components/form/HeaderSaveActions.vue'
import { useFieldErrors } from '@/composables/useFieldErrors'
import api from '@/api'
import { useAutoCode } from '@/composables/useAutoCode'
import { parseApiError } from '@/utils/apiError'

const { t } = useI18n()
const route = useRoute()
const organizationId = computed(() => route.query.organizationId || '')
const employeesListPath = computed(() => (
  organizationId.value
    ? `/hrms/employees?organizationId=${encodeURIComponent(organizationId.value)}`
    : '/hrms/employees'
))

function orgParams(extra = {}) {
  return {
    ...extra,
    ...(organizationId.value ? { organizationId: organizationId.value } : {}),
  }
}

const EMP_STATUS_OPTIONS = computed(() => [
  { id: 'active',     name: t('erp.employees.active') },
  { id: 'inactive',   name: t('erp.employees.inactive') },
  { id: 'terminated', name: t('erp.employees.terminated') },
])

const router        = useRouter()
const autoCode      = useAutoCode('EMP')
const departments   = ref([])
const roles         = ref([])
const error         = ref('')
const saving        = ref(false)
const createAccount = ref(false)
const showPassword  = ref(false)
const { fieldErrors, setFromError, setField, reset: resetErrors } = useFieldErrors()

const form = ref({
  employeeCode:  '',
  firstName:     '',
  lastName:      '',
  position:      '',
  departmentIds: [],
  roleIds:       [],
  phone:         '',
  startDate:     '',
  status:        'active',
  activeFrom:    '',
  activeTo:      '',
  userId:        '',
  email:         '',
  password:      '',
})

onMounted(async () => {
  try {
    const [deptRes, rolesRes] = await Promise.all([
      api.get('/hrms/departments', { params: orgParams({ limit: 1000 }) }),
      api.get('/hrms/employees/role-options'),
    ])
    departments.value = deptRes.data.data.departments
    roles.value       = rolesRes.data.data.roles
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
      credentialMode: createAccount.value ? 'new' : 'existing',
      ...(organizationId.value ? { organizationId: organizationId.value } : {}),
    }
    if (autoCode.enabled.value) { payload.autoCode = true; payload.employeeCode = null }
    await api.post('/hrms/employees', payload)
    router.push(employeesListPath.value)
  } catch (err) {
    const had = setFromError(err)
    if (!had) error.value = parseApiError(err, 'Failed to create employee')
  } finally {
    saving.value = false
  }
}
</script>
