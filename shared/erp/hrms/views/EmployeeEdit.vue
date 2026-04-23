<template>
  <AppLayout>
    <div class="space-y-6">

      <div class="flex items-center gap-3">
        <RouterLink to="/erp/hrms/employees" class="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors">
          <ArrowLeftIcon class="w-5 h-5" />
        </RouterLink>
        <div>
          <h1 class="text-xl font-semibold text-gray-900">Edit Employee</h1>
          <p v-if="form.employeeCode" class="text-sm text-gray-500 mt-0.5 font-mono">{{ form.employeeCode }}</p>
        </div>
      </div>

      <div v-if="loading" class="bg-white rounded-xl border border-gray-200 p-6 text-center text-gray-400">Loading…</div>

      <template v-else>
        
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
                <input v-model="form.employeeCode" type="text" placeholder="e.g. EMP-001"
                  class="w-full px-3 py-2 border rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary-500" />
              </div>

              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">First Name <span class="text-red-500">*</span></label>
                <input v-model="form.firstName" type="text"
                  class="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
              </div>

              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Last Name <span class="text-red-500">*</span></label>
                <input v-model="form.lastName" type="text"
                  class="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
              </div>

              <div class="col-span-2">
                <label class="block text-sm font-medium text-gray-700 mb-1">Position</label>
                <input v-model="form.position" type="text" placeholder="e.g. Software Engineer"
                  class="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
              </div>

              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                <input v-model="form.phone" type="text"
                  class="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
              </div>

              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                <input v-model="form.startDate" type="date"
                  class="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
              </div>

              <div class="col-span-2 border-t border-gray-50 pt-3">
                <label class="block text-sm font-medium text-gray-700 mb-1">Employment Status</label>
                <select v-model="form.status" class="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500">
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="terminated">Terminated</option>
                </select>
              </div>
            </div>
          </div>

          <!-- Right Column -->
          <div class="space-y-6">
            <!-- User Account -->
            <div class="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
              <div class="px-6 py-4 border-b border-gray-100">
                <h2 class="text-sm font-semibold text-gray-700">User Account</h2>
                <p class="text-xs text-gray-400 mt-0.5">Linked system user</p>
              </div>
              <div class="px-6 py-5">
                <label class="block text-sm font-medium text-gray-700 mb-1">User</label>
                <select v-model="form.userId"
                  class="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white
                        focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent">
                  <option value="">— None —</option>
                  <option v-for="u in users" :key="u.id" :value="u.id">
                    {{ u.name }} · {{ u.email }}
                  </option>
                </select>

                <div v-if="selectedUser" class="mt-4 p-3.5 bg-gray-50 rounded-xl space-y-2 border border-gray-100">
                  <div class="flex items-center gap-3">
                    <div class="w-9 h-9 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center font-bold text-sm flex-shrink-0">
                      {{ selectedUser.name.charAt(0).toUpperCase() }}
                    </div>
                    <div>
                      <p class="text-sm font-bold text-gray-900 leading-tight">{{ selectedUser.name }}</p>
                      <p class="text-xs text-gray-500">{{ selectedUser.email }}</p>
                    </div>
                  </div>
                  <div class="flex items-center gap-4 pt-1">
                    <span class="text-xs text-gray-500 flex items-center gap-1">
                      Role: <span class="font-semibold text-gray-700 capitalize">{{ selectedUser.role }}</span>
                    </span>
                    <span :class="selectedUser.isActive ? 'text-green-600 bg-green-50' : 'text-red-600 bg-red-50'" 
                      class="text-[10px] uppercase tracking-wider font-bold px-1.5 py-0.5 rounded">
                      {{ selectedUser.isActive ? 'Active' : 'Inactive' }}
                    </span>
                  </div>
                </div>

                <!-- Department Selection -->
                <div class="pt-6 mt-6 border-t border-gray-100">
                  <div class="flex items-center justify-between mb-3">
                    <label class="block text-sm font-medium text-gray-700">Department Assignments</label>
                    <span class="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{{ form.departmentIds.length }} Selected</span>
                  </div>
                  <div class="grid grid-cols-1 gap-2 p-3 border border-gray-100 bg-gray-50/30 rounded-xl max-h-56 overflow-y-auto shadow-inner">
                    <label v-for="d in departments" :key="d.id" 
                      class="flex items-center gap-2.5 px-3 py-2 hover:bg-white hover:shadow-sm rounded-lg cursor-pointer transition-all border border-transparent hover:border-gray-100 group">
                      <input type="checkbox" v-model="form.departmentIds" :value="d.id" class="rounded text-primary-600 focus:ring-primary-500" />
                      <span class="text-xs font-medium text-gray-600 group-hover:text-primary-700 transition-colors truncate" :title="d.name">{{ d.name }}</span>
                    </label>
                  </div>
                  <p v-if="!departments.length" class="text-xs text-gray-400 mt-2 italic flex items-center gap-1.5 px-1">
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
          <RouterLink to="/erp/hrms/employees" class="px-4 py-2 text-sm font-medium text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
            Cancel
          </RouterLink>
          <button @click="save" :disabled="saving"
            class="inline-flex items-center gap-2 px-6 py-2.5 text-sm font-bold bg-primary-600 text-white
                   rounded-xl hover:bg-primary-700 disabled:opacity-50 transition-all shadow-md hover:shadow-lg active:scale-95">
            <CheckIcon v-if="!saving" class="w-4 h-4 shadow-sm" />
            {{ saving ? 'Saving Changes…' : 'Save Changes' }}
          </button>
        </div>

      </template>
    </div>
  </AppLayout>
</template>


<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ArrowLeftIcon, CheckIcon, ExclamationCircleIcon, InformationCircleIcon } from '@heroicons/vue/24/outline'
import AppLayout from '@/layouts/AppLayout.vue'
import api from '@/api'

const router  = useRouter()
const route   = useRoute()
const id      = route.params.id
const loading = ref(true)
const saving  = ref(false)
const users   = ref([])
const departments = ref([])
const error   = ref('')

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
})

const selectedUser = computed(() => users.value.find(u => u.id === form.value.userId) || null)

onMounted(async () => {
  try {
    const [empRes, staffRes, deptRes] = await Promise.all([
      api.get(`/erp/hrms/employees/${id}`),
      api.get('/organizations/staff', { params: { limit: 500 } }),
      api.get('/erp/hrms/departments', { params: { limit: 1000 } })
    ])
    users.value = staffRes.data.data.staff
    departments.value = deptRes.data.data.departments
    const emp   = empRes.data.data.employee
    form.value = {
      employeeCode: emp.employeeCode || '',
      firstName:    emp.firstName,
      lastName:     emp.lastName,
      position:     emp.position    || '',
      departmentIds: emp.departments?.map(d => d.id) || [],
      phone:        emp.phone       || '',
      startDate:    emp.startDate   || '',
      status:       emp.status,
      userId:       emp.userId      || '',
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
    const d = err.response?.data
    error.value = d?.errors?.map(e => e.message).join(', ') || d?.message || 'Failed to save'
  } finally {
    saving.value = false
  }
}
</script>
