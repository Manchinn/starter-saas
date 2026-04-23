<template>
  <AppLayout>
    <div class="space-y-6">
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-4">
          <button v-if="organizationId" @click="router.back()" class="p-2 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors">
            <ArrowLeftIcon class="w-5 h-5 text-gray-500" />
          </button>
          <div>
            <h1 class="text-2xl font-bold text-gray-900">{{ organizationId ? 'Organization Staff' : 'Staff Accounts' }}</h1>
            <p class="text-sm text-gray-500 mt-0.5">
              {{ organizationId ? 'Manage user accounts for this specific organization.' : 'Manage user accounts across all organizations.' }}
            </p>
          </div>
        </div>
        <RouterLink :to="organizationId ? `/admin/staff/create?organizationId=${organizationId}` : '/admin/staff/create'"
          class="inline-flex items-center gap-1.5 px-4 py-2 bg-primary-600 text-white text-sm font-medium rounded-lg hover:bg-primary-700 transition-colors shadow-sm">
          <PlusIcon class="w-4 h-4" />
          New Staff Member
        </RouterLink>
      </div>

      <!-- Filters -->
      <div class="flex items-center gap-4 bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
        <div class="relative flex-1 max-w-md">
          <MagnifyingGlassIcon class="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            v-model="search"
            @input="onSearch"
            type="text"
            placeholder="Search staff by name or email…"
            class="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all"
          />
        </div>
      </div>

      <!-- Table -->
      <div class="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div class="overflow-x-auto">
          <table class="w-full text-left border-collapse">
            <thead>
              <tr class="bg-gray-50/50 border-b border-gray-100">
                <th class="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Staff Member</th>
                <th class="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Organization</th>
                <th class="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Role</th>
                <th class="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                <th class="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-100">
              <tr v-if="loading" class="animate-pulse">
                <td colspan="5" class="px-6 py-12 text-center text-gray-400">Loading staff accounts…</td>
              </tr>
              <tr v-else-if="!staff.length">
                <td colspan="5" class="px-6 py-12 text-center text-gray-400">No staff found matches your search.</td>
              </tr>
              <tr v-for="member in staff" :key="member.id" class="hover:bg-gray-50/50 transition-colors">
                <td class="px-6 py-4">
                  <div class="flex items-center gap-3">
                    <div class="w-10 h-10 rounded-full bg-primary-50 text-primary-600 flex items-center justify-center font-bold text-sm">
                      {{ member.name.charAt(0).toUpperCase() }}
                    </div>
                    <div>
                      <p class="font-medium text-gray-900">{{ member.name }}</p>
                      <p class="text-xs text-gray-500">{{ member.email }}</p>
                    </div>
                  </div>
                </td>
                <td class="px-6 py-4">
                  <span class="text-sm text-gray-600 font-medium">
                    {{ member.organization?.name || 'Unknown' }}
                  </span>
                </td>
                <td class="px-6 py-4">
                  <span class="px-2.5 py-1 bg-gray-100 text-gray-600 text-xs font-medium rounded-full capitalize">
                    {{ member.role }}
                  </span>
                </td>
                <td class="px-6 py-4">
                  <span
                    :class="member.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'"
                    class="px-2.5 py-1 text-xs font-medium rounded-full"
                  >
                    {{ member.isActive ? 'Active' : 'Inactive' }}
                  </span>
                </td>
                <td class="px-6 py-4 text-right">
                  <div class="flex items-center justify-end gap-1">
                    <RouterLink :to="`/admin/staff/${member.id}/edit`" class="p-1.5 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors" title="Edit">
                      <PencilIcon class="w-4 h-4" />
                    </RouterLink>
                    <button @click="confirmDelete(member)" class="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Delete">
                      <TrashIcon class="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Pagination -->
        <div class="px-6 py-4 bg-gray-50/30 border-t border-gray-100 flex items-center justify-between">
          <p class="text-xs text-gray-500">Showing {{ staff.length }} of {{ total }} staff members</p>
          <div class="flex items-center gap-2">
            <button
              :disabled="page <= 1"
              @click="page--; load()"
              class="p-1 rounded border border-gray-200 hover:bg-white disabled:opacity-30 transition-colors"
            >
              <ChevronLeftIcon class="w-4 h-4" />
            </button>
            <span class="text-xs font-medium text-gray-600">Page {{ page }}</span>
            <button
              :disabled="page * limit >= total"
              @click="page++; load()"
              class="p-1 rounded border border-gray-200 hover:bg-white disabled:opacity-30 transition-colors"
            >
              <ChevronRightIcon class="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

    </div>
  </AppLayout>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import AppLayout from '@/layouts/AppLayout.vue'
import { MagnifyingGlassIcon, XMarkIcon, ChevronLeftIcon, ChevronRightIcon, ArrowLeftIcon, PlusIcon, TrashIcon, PencilIcon } from '@heroicons/vue/24/outline'
import api from '@/api'

const route          = useRoute()
const router         = useRouter()
const organizationId = computed(() => route.query.organizationId)

const staff          = ref([])
const organizations  = ref([]) // for selection if global
const total          = ref(0)
const loading        = ref(false)
const search         = ref('')
const page           = ref(1)
const limit          = ref(20)

let searchTimer = null

onMounted(async () => {
  load()
})

async function load() {
  loading.value = true
  try {
    const { data } = await api.get('/organizations/all-staff', {
      params: { 
        page: page.value, 
        limit: limit.value, 
        search: search.value,
        organizationId: organizationId.value 
      }
    })
    staff.value = data.data.staff
    total.value = data.data.total
  } catch (err) {
    console.error('Failed to load staff accounts:', err)
  } finally {
    loading.value = false
  }
}

function onSearch() {
  clearTimeout(searchTimer)
  searchTimer = setTimeout(() => {
    page.value = 1
    load()
  }, 400)
}

async function confirmDelete(member) {
  if (!confirm(`Delete staff account for "${member.name}"? This will disable their login access across the platform. This cannot be undone.`)) return
  try {
    await api.delete(`/organizations/${member.id}`)
    load()
  } catch (err) {
    alert(err.response?.data?.message || 'Delete failed')
  }
}
</script>
