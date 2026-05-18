<template>
  <AppLayout>
    <div class="space-y-6">

      <div class="flex items-center gap-3">
        <RouterLink to="/erp/hrms/employees" class="p-1.5 rounded-lg text-[#9BA7B0] hover:text-[#374151] hover:bg-[#F1F5F9] transition-colors">
          <ArrowLeftIcon class="w-5 h-5" />
        </RouterLink>
        <div>
          <h1 class="text-xl font-semibold text-[#1C2434]">{{ t('erp.employees.edit') }}</h1>
          <p v-if="form.employeeCode" class="text-sm text-[#637381] mt-0.5 font-mono">{{ form.employeeCode }}</p>
        </div>
      </div>

      <div v-if="loading" class="bg-white rounded-2xl border border-[#E2E8F0] p-6 text-center text-[#9BA7B0]">Loading…</div>

      <template v-else>

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
                <input v-model="form.employeeCode" type="text" placeholder="e.g. EMP-001"
                  class="w-full px-3 py-2 border rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary-500" />
              </div>

              <div>
                <label class="block text-sm font-medium text-[#374151] mb-1">{{ t('erp.employees.firstName') }} <span class="text-red-500">*</span></label>
                <input v-model="form.firstName" type="text"
                  class="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
              </div>

              <div>
                <label class="block text-sm font-medium text-[#374151] mb-1">{{ t('erp.employees.lastName') }} <span class="text-red-500">*</span></label>
                <input v-model="form.lastName" type="text"
                  class="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
              </div>

              <div class="col-span-2">
                <label class="block text-sm font-medium text-[#374151] mb-1">{{ t('erp.employees.position') }}</label>
                <input v-model="form.position" type="text" placeholder="e.g. Software Engineer"
                  class="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
              </div>

              <div>
                <label class="block text-sm font-medium text-[#374151] mb-1">{{ t('erp.employees.phone') }}</label>
                <input v-model="form.phone" type="text"
                  class="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
              </div>

              <div>
                <label class="block text-sm font-medium text-[#374151] mb-1">{{ t('erp.employees.startDate') }}</label>
                <DateInput v-model="form.startDate"
                  class="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
              </div>

              <div class="col-span-2 grid grid-cols-2 gap-4">
                <div>
                  <label class="block text-sm font-medium text-[#374151] mb-1">{{ t('erp.common.activeFrom') }}</label>
                  <DateInput v-model="form.activeFrom" class="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
                </div>
                <div>
                  <label class="block text-sm font-medium text-[#374151] mb-1">{{ t('erp.common.activeTo') }}</label>
                  <DateInput v-model="form.activeTo" class="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
                </div>
              </div>
              <div class="col-span-2 border-t border-slate-50 pt-3">
                <label class="block text-sm font-medium text-[#374151] mb-1">{{ t('erp.employees.employmentStatus') }}</label>
                <SearchSelect v-model="form.status" :options="EMP_STATUS_OPTIONS" :allow-empty="false" placeholder="— Select —" />
              </div>
            </div>
          </div>

          <!-- Right Column -->
          <div class="space-y-6">
            <!-- User Account -->
            <div class="bg-white rounded-2xl border border-[#E2E8F0] shadow-sm overflow-hidden">
              <div class="px-6 py-4 border-b border-[#E2E8F0]">
                <h2 class="text-sm font-semibold text-[#374151]">{{ t('erp.employees.userAccount') }}</h2>
                <p class="text-xs text-[#9BA7B0] mt-0.5">{{ t('erp.employees.linkedUser') }}</p>
              </div>
              <div class="px-6 py-5">
                <label class="block text-sm font-medium text-[#374151] mb-1">{{ t('erp.employees.user') }}</label>
                <SearchSelect v-model="form.userId" :options="userOptions" placeholder="— None —" />

                <div v-if="selectedUser" class="mt-4 p-3.5 bg-[#F7F9FC] rounded-xl space-y-2 border border-[#E2E8F0]">
                  <div class="flex items-center gap-3">
                    <div class="w-9 h-9 rounded-full bg-primary-100 text-primary-500 flex items-center justify-center font-bold text-sm flex-shrink-0">
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
                      class="text-[10px] uppercase tracking-wider font-bold px-1.5 py-0.5 rounded">
                      {{ selectedUser.isActive ? t('erp.employees.active') : t('erp.employees.inactive') }}
                    </span>
                  </div>
                </div>

                <!-- Department Selection -->
                <div class="pt-6 mt-6 border-t border-[#E2E8F0]">
                  <div class="flex items-center justify-between mb-3">
                    <label class="block text-sm font-medium text-[#374151]">{{ t('erp.employees.deptAssignments') }}</label>
                    <span class="text-[10px] font-bold text-[#9BA7B0] uppercase tracking-widest">{{ form.departmentIds.length }} {{ t('erp.employees.selected') }}</span>
                  </div>
                  <div class="grid grid-cols-1 gap-2 p-3 border border-[#E2E8F0] bg-[#F7F9FC]/50 rounded-xl max-h-56 overflow-y-auto shadow-inner">
                    <label v-for="d in departments" :key="d.id" 
                      class="flex items-center gap-2.5 px-3 py-2 hover:bg-white hover:shadow-sm rounded-lg cursor-pointer transition-all border border-transparent hover:border-[#E2E8F0] group">
                      <input type="checkbox" v-model="form.departmentIds" :value="d.id" class="rounded text-primary-500 focus:ring-primary-500" />
                      <span class="text-xs font-medium text-[#637381] group-hover:text-primary-500 transition-colors truncate" :title="d.name">{{ d.name }}</span>
                    </label>
                  </div>
                  <p v-if="!departments.length" class="text-xs text-[#9BA7B0] mt-2 italic flex items-center gap-1.5 px-1">
                    <InformationCircleIcon class="w-3.5 h-3.5" />
                    No departments configured.
                  </p>
                </div>
              </div>
            </div>
          </div>

        </div>

        <div v-if="error" class="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg">
          <ExclamationCircleIcon class="w-4 h-4 flex-shrink-0" />
          {{ error }}
        </div>

        <div class="flex justify-end gap-3 pt-4">
          <RouterLink to="/erp/hrms/employees" class="px-4 py-2 text-sm font-medium text-[#637381] border border-[#E2E8F0] rounded-lg hover:bg-[#F7F9FC] transition-colors">
            {{ t('common.cancel') }}
          </RouterLink>
          <button @click="save" :disabled="saving"
            class="inline-flex items-center gap-2 px-6 py-2.5 text-sm font-bold bg-primary-500 text-white
                   rounded-xl hover:bg-primary-700 disabled:opacity-50 transition-all shadow-md hover:shadow-lg active:scale-95">
            <CheckIcon v-if="!saving" class="w-4 h-4 shadow-sm" />
            {{ saving ? t('erp.common.saving') : t('common.saveChanges') }}
          </button>
        </div>

      </template>
    </div>
  </AppLayout>
</template>


<script setup>
import { ref, computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter, useRoute } from 'vue-router'
import { ArrowLeftIcon, CheckIcon, ExclamationCircleIcon, InformationCircleIcon } from '@heroicons/vue/24/outline'
import AppLayout from '@/layouts/AppLayout.vue'
import SearchSelect from '@/components/SearchSelect.vue'
import api from '@/api'
import { parseApiError } from '@/utils/apiError'

const { t } = useI18n()
const router  = useRouter()
const route   = useRoute()
const id      = route.params.id
const loading = ref(true)
const saving  = ref(false)
const users   = ref([])
const departments = ref([])
const error   = ref('')

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
  phone:         '',
  startDate:     '',
  status:        'active',
  activeFrom:    '',
  activeTo:      '',
  userId:        '',
})

const selectedUser = computed(() => users.value.find(u => u.id === form.value.userId) || null)

onMounted(async () => {
  try {
    const [empRes, staffRes, deptRes] = await Promise.all([
      api.get(`/erp/hrms/employees/${id}`),
      api.get('/organizations/staff', { params: { limit: 500 } }),
      api.get('/erp/hrms/departments', { params: { limit: 1000 } }),
    ])
    users.value       = staffRes.data.data.staff
    departments.value = deptRes.data.data.departments
    const emp = empRes.data.data.employee
    form.value = {
      employeeCode:  emp.employeeCode || '',
      firstName:     emp.firstName,
      lastName:      emp.lastName,
      position:      emp.position    || '',
      departmentIds: emp.departments?.map(d => d.id) || [],
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
})

async function save() {
  error.value = ''
  if (!form.value.firstName.trim()) { error.value = 'First name is required'; return }
  if (!form.value.lastName.trim())  { error.value = 'Last name is required'; return }

  saving.value = true
  try {
    await api.put(`/erp/hrms/employees/${id}`, { ...form.value })
    router.push('/erp/hrms/employees')
  } catch (err) {
    error.value = parseApiError(err, 'Failed to save')
  } finally {
    saving.value = false
  }
}
</script>
