<template>
  <AppLayout>
    <div class="space-y-6">

      <PageHeader :title="t('erp.employees.edit')" :back-to="employeesListPath"
        :breadcrumb="[
          { label: t('erp.employees.title'), to: employeesListPath },
          { label: t('erp.employees.edit') },
        ]">
        <template #actions>
          <HeaderSaveActions
            :cancel-to="employeesListPath"
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
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">

          <!-- Left: Employee Information -->
          <FormCard :title="t('erp.employees.employeeInfo')" :icon="IdentificationIcon" icon-color="primary">
            <div class="grid grid-cols-2 gap-4">

              <FormField name="employeeCode" :label="t('erp.employees.employeeCode')" :errors="fieldErrors"
                v-model="form.employeeCode" placeholder="e.g. EMP-001"
                input-class="font-mono" wrapper-class="col-span-2" />

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
              <p class="text-xs text-[#9BA7B0] -mt-1 mb-3">{{ t('erp.employees.linkedUser') }}</p>

              <FieldLabel :text="t('erp.employees.user')" />
              <SearchSelect v-model="form.userId" :options="userOptions" placeholder="— None —" />

              <div v-if="selectedUser" class="mt-4 p-3.5 bg-[#F7F9FC] space-y-2 border border-[#E2E8F0]">
                <div class="flex items-center gap-3">
                  <div class="w-9 h-9 bg-primary-100 text-primary-500 flex items-center justify-center font-bold text-sm flex-shrink-0">
                    {{ selectedUser.name.charAt(0).toUpperCase() }}
                  </div>
                  <div>
                    <p class="text-sm font-bold text-[#1C2434] leading-tight">{{ selectedUser.name }}</p>
                    <p class="text-xs text-[#637381]">{{ selectedUser.email }}</p>
                  </div>
                </div>
                <div class="flex items-center gap-4 pt-1">
                  <span class="text-xs text-[#637381] flex items-center gap-1">
                    Role: <span class="font-semibold text-[#374151] capitalize">{{ selectedUser.role }}</span>
                  </span>
                  <span :class="selectedUser.isActive ? 'text-green-600 bg-green-50' : 'text-red-600 bg-red-50'"
                    class="text-[10px] uppercase tracking-wider font-bold px-1.5 py-0.5">
                    {{ selectedUser.isActive ? t('erp.employees.active') : t('erp.employees.inactive') }}
                  </span>
                </div>
              </div>

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

              <div v-if="form.userId" class="pt-5 mt-5 border-t border-[#E2E8F0]">
                <div class="flex items-center justify-between mb-2">
                  <FieldLabel :text="t('erp.employees.roleAssignments')" />
                  <span class="text-[10px] font-bold text-[#9BA7B0] uppercase tracking-widest">
                    {{ form.roleIds.length }} {{ t('erp.employees.selected') }}
                  </span>
                </div>
                <p class="text-xs text-[#637381] mb-2">{{ t('erp.employees.roleHint') }}</p>
                <div class="grid grid-cols-1 gap-2 p-3 border border-[#E2E8F0] bg-[#F7F9FC]/50 max-h-56 overflow-y-auto shadow-inner">
                  <label v-for="role in roles" :key="role.id" class="flex items-center gap-2.5 px-3 py-2 hover:bg-white hover:shadow-sm cursor-pointer transition-all border border-transparent hover:border-[#E2E8F0] group">
                    <input type="checkbox" v-model="form.roleIds" :value="role.id" class="text-primary-500 focus:ring-primary-500" />
                    <span class="w-2 h-2 flex-shrink-0" :style="{ backgroundColor: role.color }" />
                    <span class="text-xs font-medium text-[#637381] group-hover:text-primary-500 transition-colors truncate" :title="role.name">{{ role.name }}</span>
                  </label>
                </div>
                <p v-if="!roles.length" class="text-xs text-[#9BA7B0] mt-2 italic">{{ t('erp.employees.noAssignableRoles') }}</p>
              </div>
            </FormCard>

            <FormCard :title="t('erp.employees.accessManagement')" :icon="ShieldCheckIcon" icon-color="red">
              <div class="flex items-center justify-between gap-4">
                <div class="min-w-0">
                  <p class="text-sm font-semibold text-[#1C2434] truncate">
                    {{ selectedUser?.email || t('erp.employees.noLinkedAccount') }}
                  </p>
                  <p v-if="selectedUser" class="mt-1 text-xs text-[#637381]">
                    {{ selectedUser.isActive ? t('erp.employees.active') : t('erp.employees.inactive') }}
                  </p>
                </div>
                <button
                  v-if="selectedUser?.isActive"
                  v-can="'hrms.employees.edit'"
                  type="button"
                  :disabled="offboarding"
                  class="inline-flex h-9 flex-shrink-0 items-center gap-2 border border-red-300 px-3 text-xs font-semibold text-red-700 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                  @click="offboardEmployee"
                >
                  <UserMinusIcon class="h-4 w-4" />
                  {{ offboarding ? t('erp.employees.offboarding') : t('erp.employees.offboard') }}
                </button>
              </div>

              <div class="mt-5 border-t border-[#E2E8F0] pt-4">
                <p class="mb-3 text-xs font-bold uppercase text-[#637381]">{{ t('erp.employees.accessHistory') }}</p>
                <div v-if="accessLogs.length" class="space-y-3">
                  <div v-for="log in accessLogs" :key="log.id" class="border-l-2 border-[#D8E0EA] pl-3">
                    <div class="flex items-start justify-between gap-3">
                      <p class="text-xs font-semibold text-[#1C2434]">{{ accessActionLabel(log.action) }}</p>
                      <time class="flex-shrink-0 text-[11px] text-[#9BA7B0]">{{ formatTimestamp(log.createdAt) }}</time>
                    </div>
                    <p class="mt-1 truncate text-[11px] text-[#637381]">{{ log.userEmail || '-' }}</p>
                  </div>
                </div>
                <p v-else class="text-xs text-[#9BA7B0]">{{ t('erp.employees.noAccessHistory') }}</p>
              </div>
            </FormCard>
          </div>

        </div>

        <p v-if="success" class="border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">{{ success }}</p>
        <ErrorBanner :message="error" />

      </template>
    </div>
  </AppLayout>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter, useRoute } from 'vue-router'
import { IdentificationIcon, UserCircleIcon, InformationCircleIcon, ShieldCheckIcon, UserMinusIcon } from '@heroicons/vue/24/outline'
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
import { parseApiError } from '@/utils/apiError'

const { t } = useI18n()
const router  = useRouter()
const route   = useRoute()
const id      = route.params.id
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
const loading = ref(true)
const saving  = ref(false)
const users   = ref([])
const departments = ref([])
const roles   = ref([])
const accessLogs = ref([])
const error   = ref('')
const success = ref('')
const offboarding = ref(false)
const { fieldErrors, setFromError, setField, reset: resetErrors } = useFieldErrors()

const EMP_STATUS_OPTIONS = computed(() => [
  { id: 'active',     name: t('erp.employees.active') },
  { id: 'inactive',   name: t('erp.employees.inactive') },
  { id: 'terminated', name: t('erp.employees.terminated') },
])

const userOptions = computed(() =>
  users.value.map(u => ({ id: u.id, name: `${u.name} · ${u.email}` }))
)

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
})

const selectedUser = computed(() => users.value.find(u => u.id === form.value.userId) || null)

async function load() {
  loading.value = true
  try {
    const staffRequest = organizationId.value
      ? api.get('/organizations/all-staff', { params: { organizationId: organizationId.value, limit: 500 } })
      : api.get('/organizations/staff', { params: { limit: 500 } })

    const [empRes, staffRes, deptRes, rolesRes, historyRes] = await Promise.all([
      api.get(`/hrms/employees/${id}`, { params: orgParams() }),
      staffRequest,
      api.get('/hrms/departments', { params: orgParams({ limit: 1000 }) }),
      api.get('/hrms/employees/role-options'),
      api.get(`/hrms/employees/${id}/access-history`, { params: orgParams({ limit: 20 }) }),
    ])
    users.value       = staffRes.data.data.staff
    departments.value = deptRes.data.data.departments
    roles.value       = rolesRes.data.data.roles
    accessLogs.value  = historyRes.data.data.logs
    const emp = empRes.data.data.employee
    form.value = {
      employeeCode:  emp.employeeCode || '',
      firstName:     emp.firstName,
      lastName:      emp.lastName,
      position:      emp.position    || '',
      departmentIds: emp.departments?.map(d => d.id) || [],
      roleIds:       emp.user?.roles?.map(role => role.id) || [],
      phone:         emp.phone       || '',
      startDate:     emp.startDate   || '',
      status:        emp.status,
      activeFrom:    emp.activeFrom  || '',
      activeTo:      emp.activeTo    || '',
      userId:        emp.userId      || '',
    }
  } catch (err) {
    error.value = err.response?.data?.message || 'Failed to load employee'
  } finally {
    loading.value = false
  }
}

onMounted(load)

function accessActionLabel(action) {
  if (action === 'hrms.employee.access.offboarded') return t('erp.employees.accountOffboarded')
  if (action === 'hrms.employee.access.account_linked') return t('erp.employees.accountLinked')
  if (action === 'hrms.employee.access.roles_changed') return t('erp.employees.rolesChanged')
  return action
}

function formatTimestamp(value) {
  return value ? new Date(value).toLocaleString() : '-'
}

async function offboardEmployee() {
  if (!confirm(t('erp.employees.offboardConfirm'))) return
  error.value = ''
  success.value = ''
  offboarding.value = true
  try {
    await api.post(`/hrms/employees/${id}/offboard`, {
      activeTo: new Date().toISOString().slice(0, 10),
      ...(organizationId.value ? { organizationId: organizationId.value } : {}),
    })
    success.value = t('erp.employees.offboardSuccess')
    await load()
  } catch (err) {
    error.value = parseApiError(err, 'Failed to offboard employee')
  } finally {
    offboarding.value = false
  }
}

async function save() {
  error.value = ''
  resetErrors()
  if (!form.value.firstName.trim()) { setField('firstName', t('common.errors.required', { field: t('erp.employees.firstName') })); return }
  if (!form.value.lastName.trim())  { setField('lastName',  t('common.errors.required', { field: t('erp.employees.lastName') })); return }

  saving.value = true
  try {
    await api.put(`/hrms/employees/${id}`, {
      ...form.value,
      ...(organizationId.value ? { organizationId: organizationId.value } : {}),
    })
    router.push(employeesListPath.value)
  } catch (err) {
    const had = setFromError(err)
    if (!had) error.value = parseApiError(err, 'Failed to save')
  } finally {
    saving.value = false
  }
}
</script>
