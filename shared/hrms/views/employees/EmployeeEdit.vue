<template>
  <AppLayout>
    <div class="space-y-6">

      <PageHeader :title="t('erp.employees.edit')" :back-to="listTo"
        :breadcrumb="[
          { label: t('erp.employees.title'), to: listTo },
          { label: t('erp.employees.edit') },
        ]">
        <template #actions>
          <KeyboardShortcuts :shortcuts="shortcuts" width="w-48" />
          <HeaderSaveActions
            :cancel-to="listTo"
            :cancel-label="t('common.cancel')"
            :saving="saving"
            :saving-label="t('erp.common.saving')"
            :save-label="t('common.saveChanges')"
            @save="save"
          />
        </template>
      </PageHeader>

      <div v-if="loading" class="text-[#9BA7B0] py-12 text-center">{{ t('common.loading') }}</div>

      <template v-else>

        <!-- Two-column layout -->
        <div class="grid grid-cols-2 gap-6 items-start">

          <!-- Left: Employee Information -->
          <FormCard :title="t('erp.employees.employeeInfo')" :icon="IdentificationIcon" icon-color="primary">
            <div class="grid grid-cols-2 gap-4">

              <FormField name="employeeCode" :label="t('erp.employees.employeeCode')" :errors="fieldErrors"
                wrapper-class="col-span-2">
                <template #default="{ id, errorClass }">
                  <input :id="id" ref="codeInputRef" v-model="form.employeeCode" type="text"
                    placeholder="e.g. EMP-001" :class="['input font-mono', errorClass]" />
                </template>
              </FormField>

              <FormField name="firstName" :label="t('erp.employees.firstName')" :errors="fieldErrors"
                v-model="form.firstName" required />

              <FormField name="lastName" :label="t('erp.employees.lastName')" :errors="fieldErrors"
                v-model="form.lastName" required />

              <FormField name="position" :label="t('erp.employees.position')" :errors="fieldErrors"
                v-model="form.position" placeholder="e.g. Software Engineer"
                wrapper-class="col-span-2" />

              <FormField name="phone" :label="t('erp.employees.phone')" :errors="fieldErrors"
                v-model="form.phone" />

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

              <div class="col-span-2">
                <FieldLabel :text="t('erp.employees.employmentStatus')" />
                <SearchSelect v-model="form.status" :options="EMP_STATUS_OPTIONS" :allow-empty="false" placeholder="— Select —" />
              </div>

            </div>
          </FormCard>

          <!-- Right: User Account + Departments -->
          <div class="space-y-6">
            <FormCard :title="t('erp.employees.userAccount')" :icon="UserCircleIcon" icon-color="green">
              <p class="text-xs text-[#9BA7B0] -mt-1 mb-3">{{ t('erp.employees.accountHint') }}</p>

              <!-- Existing login → edit it inline -->
              <template v-if="account.hasUser">
                <FormField name="email" :label="t('erp.employees.emailUsername')" :errors="fieldErrors"
                  v-model="account.email" type="email" />

                <div class="mt-4">
                  <FieldLabel :text="t('erp.employees.loginStatus')" />
                  <SearchSelect v-model="account.isActive" :options="ACCOUNT_STATUS_OPTIONS" :allow-empty="false" />
                </div>

                <div class="mt-4 pt-4 border-t border-[#E2E8F0]">
                  <FieldLabel :text="t('erp.employees.resetPassword')" />
                  <FormField name="newPassword" :errors="fieldErrors"
                    v-model="account.newPassword" type="password" :placeholder="t('erp.employees.resetPasswordPh')" />
                  <p class="text-xs text-[#9BA7B0] mt-1">{{ t('erp.employees.resetPasswordHint') }}</p>
                </div>
              </template>

              <!-- No login yet → optionally create one -->
              <template v-else>
                <label class="flex items-center gap-2 cursor-pointer select-none">
                  <input type="checkbox" v-model="account.create" class="text-primary-500 focus:ring-primary-500" />
                  <span class="text-sm font-medium text-[#374151]">{{ t('erp.employees.createLogin') }}</span>
                </label>
                <div v-if="account.create" class="space-y-4 pt-4 mt-2 border-t border-slate-50">
                  <FormField name="email" :label="t('erp.employees.emailUsername')" :errors="fieldErrors"
                    v-model="account.email" type="email" placeholder="employee@company.com" required />
                  <FormField name="password" :label="t('erp.employees.password')" :errors="fieldErrors"
                    v-model="account.password" type="password" placeholder="Min 8 characters" required />
                </div>
                <p v-else class="text-xs text-[#9BA7B0] py-2">{{ t('erp.employees.loginNoneHint') }}</p>
              </template>

              <!-- Department Assignments -->
              <div class="pt-5 mt-5 border-t border-[#E2E8F0]">
                <div class="flex items-center justify-between mb-2">
                  <FieldLabel :text="t('erp.employees.deptAssignments')" />
                  <span class="text-[10px] font-bold text-[#9BA7B0] uppercase tracking-widest">
                    {{ form.departmentIds.length }} {{ t('erp.employees.selected') }}
                  </span>
                </div>
                <div class="grid grid-cols-1 gap-2 p-3 border border-[#E2E8F0] bg-[#F7F9FC]/50 max-h-56 overflow-y-auto shadow-inner">
                  <label v-for="d in departments" :key="d.id"
                    class="flex items-center gap-2.5 px-3 py-2 hover:bg-white hover:shadow-sm cursor-pointer transition-all border border-transparent hover:border-[#E2E8F0] group">
                    <input type="checkbox" v-model="form.departmentIds" :value="d.id" class="text-primary-500 focus:ring-primary-500" />
                    <span class="text-xs font-medium text-[#637381] group-hover:text-primary-500 transition-colors truncate" :title="d.name">{{ d.name }}</span>
                  </label>
                </div>
                <p v-if="!departments.length" class="text-xs text-[#9BA7B0] mt-2 italic flex items-center gap-1.5 px-1">
                  <InformationCircleIcon class="w-3.5 h-3.5" />
                  No departments configured.
                </p>
              </div>

              <!-- Role Assignments -->
              <div class="pt-5 mt-5 border-t border-[#E2E8F0]">
                <div class="flex items-center justify-between mb-2">
                  <FieldLabel :text="t('hrms.empRoles.label')" />
                  <span class="text-[10px] font-bold text-[#9BA7B0] uppercase tracking-widest">
                    {{ form.roleIds.length }} {{ t('hrms.empRoles.selected') }}
                  </span>
                </div>
                <p class="text-xs text-[#9BA7B0] mb-2">{{ t('hrms.empRoles.hint') }}</p>
                <div class="grid grid-cols-1 gap-2 p-3 border border-[#E2E8F0] bg-[#F7F9FC]/50 max-h-56 overflow-y-auto shadow-inner">
                  <label v-for="r in roles" :key="r.id"
                    class="flex items-center gap-2.5 px-3 py-2 hover:bg-white hover:shadow-sm cursor-pointer transition-all border border-transparent hover:border-[#E2E8F0] group">
                    <input type="checkbox" v-model="form.roleIds" :value="r.id" class="text-primary-500 focus:ring-primary-500" />
                    <span class="w-2 h-2 flex-shrink-0" :style="{ backgroundColor: r.color }" />
                    <span class="text-xs font-medium text-[#637381] group-hover:text-primary-500 transition-colors truncate" :title="r.name">{{ r.name }}</span>
                  </label>
                </div>
                <p v-if="!roles.length" class="text-xs text-[#9BA7B0] mt-2 italic flex items-center gap-1.5 px-1">
                  <InformationCircleIcon class="w-3.5 h-3.5" />
                  {{ t('hrms.empRoles.none') }}
                </p>
              </div>
            </FormCard>
          </div>

        </div>

        <ErrorBanner :message="error" />

      </template>
    </div>
  </AppLayout>
</template>

<script setup>
import { ref, computed, onMounted, nextTick } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter, useRoute } from 'vue-router'
import { IdentificationIcon, UserCircleIcon, InformationCircleIcon } from '@heroicons/vue/24/outline'
import AppLayout from '@/layouts/AppLayout.vue'
import DateInput from '@/components/DateInput.vue'
import SearchSelect from '@/components/SearchSelect.vue'
import KeyboardShortcuts from '@/components/KeyboardShortcuts.vue'
import { useFormShortcuts } from '@/composables/useShortcuts'
import PageHeader from '@/components/form/PageHeader.vue'
import FormCard from '@/components/form/FormCard.vue'
import FormField from '@/components/form/FormField.vue'
import FieldLabel from '@/components/form/FieldLabel.vue'
import ErrorBanner from '@/components/form/ErrorBanner.vue'
import HeaderSaveActions from '@/components/form/HeaderSaveActions.vue'
import { useFieldErrors } from '@/composables/useFieldErrors'
import api from '@/api'
import { parseApiError } from '@/utils/apiError'

const { t } = useI18n()
const router       = useRouter()
const route        = useRoute()
const id           = route.params.id
const codeInputRef = ref(null)

// Admin org-scope (carried from the Organizations drill-in); threaded into the
// fetch/update so the right org's record is targeted, and back to the list.
const orgId  = computed(() => route.query.organizationId || '')
const listTo = computed(() => orgId.value ? `/hrms/employees?organizationId=${orgId.value}` : '/hrms/employees')

const { shortcuts } = useFormShortcuts({
  save: () => save(),
  cancel: () => router.push(listTo.value),
  cancelLabel: 'Back to list',
})
const loading = ref(true)
const saving  = ref(false)
const departments = ref([])
const roles   = ref([])
const error   = ref('')
const { fieldErrors, setFromError, setField, reset: resetErrors } = useFieldErrors()

const EMP_STATUS_OPTIONS = computed(() => [
  { id: 'active',     name: t('erp.employees.active') },
  { id: 'inactive',   name: t('erp.employees.inactive') },
  { id: 'terminated', name: t('erp.employees.terminated') },
])

const ACCOUNT_STATUS_OPTIONS = computed(() => [
  { id: true,  name: t('erp.employees.active') },
  { id: false, name: t('erp.employees.inactive') },
])

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
})

// Inline login-account state (no linking to an existing account).
const account = ref({
  hasUser:     false,
  create:      false,
  email:       '',
  isActive:    true,
  password:    '',
  newPassword: '',
})

onMounted(async () => {
  try {
    const [empRes, deptRes, rolesRes] = await Promise.all([
      api.get(`/hrms/employees/${id}`, { params: { organizationId: orgId.value || undefined } }),
      api.get('/hrms/departments', { params: { limit: 1000 } }),
      api.get('/hrms/roles'),
    ])
    departments.value = deptRes.data.data.departments
    roles.value       = rolesRes.data.data.roles
    const emp = empRes.data.data.employee
    form.value = {
      employeeCode:  emp.employeeCode || '',
      firstName:     emp.firstName,
      lastName:      emp.lastName,
      position:      emp.position    || '',
      departmentIds: emp.departments?.map(d => d.id) || [],
      roleIds:       emp.roles?.map(r => r.id) || [],
      phone:         emp.phone       || '',
      startDate:     emp.startDate   || '',
      status:        emp.status,
      activeFrom:    emp.activeFrom  || '',
      activeTo:      emp.activeTo    || '',
    }
    if (emp.user) {
      account.value.hasUser  = true
      account.value.email    = emp.user.email
      account.value.isActive = emp.user.isActive
    }
  } catch (err) {
    error.value = err.response?.data?.message || 'Failed to load employee'
  } finally {
    loading.value = false
    await nextTick()
    codeInputRef.value?.focus()
  }
})

// Build the `account` slice of the payload, or null when there's nothing to do.
function accountPayload() {
  const a = account.value
  if (a.hasUser) {
    return { email: a.email, isActive: a.isActive, newPassword: a.newPassword || undefined }
  }
  if (a.create) {
    return { create: true, email: a.email, password: a.password }
  }
  return null
}

async function save() {
  error.value = ''
  resetErrors()
  if (!form.value.firstName.trim()) { setField('firstName', t('common.errors.required', { field: t('erp.employees.firstName') })); return }
  if (!form.value.lastName.trim())  { setField('lastName',  t('common.errors.required', { field: t('erp.employees.lastName') })); return }
  if (!account.value.hasUser && account.value.create) {
    if (!account.value.email.trim()) { setField('email', t('common.errors.required', { field: t('erp.employees.emailUsername') })); return }
    if (!account.value.password || account.value.password.length < 8) { setField('password', t('common.errors.minLength', { field: t('erp.employees.password'), n: 8 })); return }
  }

  saving.value = true
  try {
    const payload = { ...form.value, account: accountPayload() }
    if (orgId.value) payload.organizationId = orgId.value
    await api.put(`/hrms/employees/${id}`, payload)
    router.push(listTo.value)
  } catch (err) {
    const had = setFromError(err)
    if (!had) error.value = parseApiError(err, 'Failed to save')
  } finally {
    saving.value = false
  }
}
</script>
