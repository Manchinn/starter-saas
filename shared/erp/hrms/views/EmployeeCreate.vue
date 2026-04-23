<template>
  <AppLayout>
    <div class="space-y-6">

      <div class="flex items-center gap-3">
        <RouterLink to="/erp/hrms/employees" class="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors">
          <ArrowLeftIcon class="w-5 h-5" />
        </RouterLink>
        <div>
          <h1 class="text-xl font-semibold text-gray-900">New Employee</h1>
          <p class="text-sm text-gray-500 mt-0.5">Link an existing user account to an employee record</p>
        </div>
      </div>

      <!-- Two-column layout -->
      <div class="grid grid-cols-2 gap-6 items-start">

        <!-- Left: Employee Information -->
        <div class="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div class="px-6 py-4 border-b border-gray-100">
            <h2 class="text-sm font-semibold text-gray-700">Employee Information</h2>
          </div>
          <div class="px-6 py-5 grid grid-cols-2 gap-4">

            <div class="col-span-2">
              <label class="block text-sm font-medium text-gray-700 mb-1">Employee Code</label>
              <input v-if="!autoCode.enabled.value" v-model="form.employeeCode" type="text" placeholder="e.g. EMP-001"
                class="w-full px-3 py-2 border rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary-500" />
              <input v-else :value="autoCode.preview.value" type="text" readonly
                class="w-full px-3 py-2 border rounded-lg text-sm bg-gray-50 text-gray-500 font-mono cursor-not-allowed" />
              <label class="mt-1 flex items-center gap-2 text-xs text-gray-500 cursor-pointer select-none">
                <input type="checkbox" :checked="autoCode.enabled.value" @change="autoCode.toggle" class="rounded" />
                Auto-generate
              </label>
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">First Name <span class="text-red-500">*</span></label>
              <input v-model="form.firstName" type="text" placeholder="First name"
                class="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Last Name <span class="text-red-500">*</span></label>
              <input v-model="form.lastName" type="text" placeholder="Last name"
                class="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Position</label>
              <input v-model="form.position" type="text" placeholder="e.g. Software Engineer"
                class="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
            </div>



            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Phone</label>
              <input v-model="form.phone" type="text" placeholder="+1 555 000 0000"
                class="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
              <input v-model="form.startDate" type="date"
                class="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select v-model="form.status" class="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500">
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="terminated">Terminated</option>
              </select>
            </div>

          </div>
        </div>

        <!-- Right: Login Credentials (Optional) -->
        <div class="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div class="px-6 py-4 border-b border-gray-100">
            <h2 class="text-sm font-semibold text-gray-700">Login Credentials</h2>
          </div>

          <div class="px-6 py-5 space-y-4">
            <label class="flex items-center gap-2 cursor-pointer select-none mb-2">
              <input type="checkbox" v-model="createAccount" class="rounded text-primary-600 focus:ring-primary-500" />
              <span class="text-sm font-medium text-gray-700">Create login account for this employee</span>
            </label>

            <div v-if="createAccount" class="space-y-4 pt-4 border-t border-gray-50">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Email / Username <span class="text-red-500">*</span></label>
                <input v-model="form.email" type="email" placeholder="employee@company.com"
                  class="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Password <span class="text-red-500">*</span></label>
                <div class="relative">
                  <input v-model="form.password" :type="showPassword ? 'text' : 'password'" placeholder="Min 8 characters"
                    class="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 pr-10" />
                  <button type="button" @click="showPassword = !showPassword"
                    class="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                    <EyeSlashIcon v-if="showPassword" class="w-4 h-4" />
                    <EyeIcon v-else class="w-4 h-4" />
                  </button>
                </div>
              </div>
              <p class="text-xs text-gray-500 italic">
                A system user account will be created and linked to this employee.
              </p>
            </div>
            <div v-else class="text-xs text-gray-400 py-2">
              This employee record will not have a login account associated with it.
            </div>

            <!-- Moved Department Selection here -->
            <div class="pt-6 border-t border-gray-100">
              <label class="block text-sm font-medium text-gray-700 mb-3">Department Assignments</label>
              <div class="grid grid-cols-2 gap-2 p-3 border border-gray-100 bg-gray-50/50 rounded-xl max-h-48 overflow-y-auto">
                <label v-for="d in departments" :key="d.id" class="flex items-center gap-2 px-2 py-1.5 hover:bg-white rounded-lg cursor-pointer transition-colors">
                  <input type="checkbox" v-model="form.departmentIds" :value="d.id" class="rounded text-primary-600 focus:ring-primary-500" />
                  <span class="text-xs font-medium text-gray-700 truncate" :title="d.name">{{ d.name }}</span>
                </label>
              </div>
              <p v-if="!departments.length" class="text-xs text-gray-400 mt-2 italic flex items-center gap-1.5">
                <InformationCircleIcon class="w-3.5 h-3.5" />
                No departments configured.
              </p>
            </div>
          </div>
        </div>

      </div>

      <div v-if="error" class="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg">
        <ExclamationCircleIcon class="w-4 h-4 flex-shrink-0" />
        {{ error }}
      </div>

      <div class="flex justify-end gap-3">
        <RouterLink to="/erp/hrms/employees" class="px-4 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
          Cancel
        </RouterLink>
        <button @click="save" :disabled="saving"
          class="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold bg-primary-600 text-white
                 rounded-xl hover:bg-primary-700 disabled:opacity-50 transition-colors shadow-sm">
          <CheckIcon v-if="!saving" class="w-4 h-4" />
          {{ saving ? 'Creating…' : 'Create Employee' }}
        </button>
      </div>

    </div>
  </AppLayout>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ArrowLeftIcon, CheckIcon, ExclamationCircleIcon, EyeIcon, EyeSlashIcon, InformationCircleIcon } from '@heroicons/vue/24/outline'
import AppLayout from '@/layouts/AppLayout.vue'
import api from '@/api'
import { useAutoCode } from '@/composables/useAutoCode'

const router         = useRouter()
const autoCode       = useAutoCode('EMP')
const users          = ref([])
const departments    = ref([])
const error          = ref('')
const saving         = ref(false)
const createAccount  = ref(false)
const showPassword   = ref(false)

const form = ref({
  employeeCode: '',
  firstName:    '',
  lastName:     '',
  position:     '',
  departmentIds: [],
  phone:        '',
  startDate:    '',
  status:       'active',
  userId:       '',
  email:        '',
  password:     '',
})

const selectedUser = computed(() => users.value.find(u => u.id === form.value.userId) || null)

onMounted(async () => {
  try {
    const [staffRes, deptRes] = await Promise.all([
      api.get('/organizations/staff', { params: { limit: 500 } }),
      api.get('/erp/hrms/departments', { params: { limit: 1000 } })
    ])
    users.value = staffRes.data.data.staff
    departments.value = deptRes.data.data.departments
  } catch (err) {
    console.error('Failed to load initial data:', err)
  }
})

async function save() {
  error.value = ''
  if (!form.value.firstName.trim()) { error.value = 'First name is required'; return }
  if (!form.value.lastName.trim())  { error.value = 'Last name is required'; return }

  if (createAccount.value) {
    if (!form.value.email.trim())  { error.value = 'Email is required'; return }
    if (!form.value.password)      { error.value = 'Password is required'; return }
    if (form.value.password.length < 8) { error.value = 'Password must be at least 8 characters'; return }
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
    const d = err.response?.data
    error.value = d?.errors?.map(e => e.message).join(', ') || d?.message || 'Failed to create employee'
  } finally {
    saving.value = false
  }
}
</script>
