<template>
  <AppLayout>
    <div class="space-y-6">

      <!-- Header -->
      <div class="flex items-center justify-between gap-4">
        <div>
          <h1 class="text-xl font-bold text-[#1C2434] tracking-tight">{{ $t('org.title') }}</h1>
          <p class="text-sm text-[#637381] mt-0.5">{{ $t('org.subtitle', { n: total }) }}</p>
        </div>
        <RouterLink v-can="'organizations.edit'" to="/admin/organizations/create" class="btn-primary">
          <PlusIcon class="w-4 h-4" />
          {{ $t('org.new') }}
        </RouterLink>
      </div>

      <!-- Table -->
      <div class="table-wrap">

        <!-- Search bar -->
        <div class="px-5 py-3 border-b border-[#E2E8F0] flex items-center gap-3">
          <div class="relative flex-1 min-w-48 max-w-64">
            <MagnifyingGlassIcon class="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#9BA7B0] pointer-events-none" />
            <input v-model="search" @input="onSearch" type="search"
              :placeholder="$t('org.searchPlaceholder')" class="input pl-9" />
          </div>
        </div>

        <table class="w-full text-sm">
          <thead class="bg-[#F7F9FC] border-b border-[#E2E8F0]">
            <tr class="text-left">
              <th class="th">{{ $t('org.colOrg') }}</th>
              <th class="th">{{ $t('org.colParent') }}</th>
              <th class="th">{{ $t('org.colSystemRole') }}</th>
              <th class="th">{{ $t('org.colAssignedRoles') }}</th>
              <th class="th">{{ $t('org.colStatus') }}</th>
              <th class="th">{{ $t('org.colJoined') }}</th>
              <th class="th">{{ $t('org.colLastLogin') }}</th>
              <th class="th w-36"></th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-50">
            <tr v-if="loading">
              <td colspan="8" class="text-center py-14">
                <div class="inline-block w-5 h-5 border-2 border-primary-500 border-t-transparent animate-spin"></div>
              </td>
            </tr>
            <tr v-else-if="!organizations.length">
              <td colspan="8" class="text-center py-14">
                <div class="flex flex-col items-center gap-2 text-[#9BA7B0]">
                  <BuildingOffice2Icon class="w-8 h-8 opacity-40" />
                  <p class="text-sm font-medium">{{ $t('org.noFound') }}</p>
                </div>
              </td>
            </tr>
            <tr v-for="u in organizations" :key="u.id" class="hover:bg-[#F7F9FC]/60 transition-colors">

              <!-- Organization -->
              <td class="td">
                <div class="flex items-center gap-3">
                  <div class="w-8 h-8 bg-primary-100 text-primary-500 flex items-center justify-center font-bold text-xs flex-shrink-0">
                    {{ u.name.charAt(0).toUpperCase() }}
                  </div>
                  <div>
                    <p class="font-semibold text-[#1C2434] leading-tight">{{ u.name }}</p>
                    <p class="text-[#9BA7B0] text-xs mt-0.5">{{ u.email }}</p>
                  </div>
                </div>
              </td>

              <!-- Parent org -->
              <td class="td">
                <span v-if="u.parent" class="text-xs text-[#637381]">{{ u.parent.name }}</span>
                <span v-else class="text-xs text-[#9BA7B0]">—</span>
              </td>

              <!-- System role -->
              <td class="td">
                <span :class="systemRoleBadge(u.role)" class="badge capitalize">{{ u.role }}</span>
              </td>

              <!-- Assigned roles -->
              <td class="td">
                <div class="flex flex-wrap gap-1">
                  <span v-for="r in u.roles" :key="r.id"
                    class="px-2 py-0.5 text-xs font-medium text-white"
                    :style="{ backgroundColor: r.color }">{{ r.name }}</span>
                  <span v-if="!u.roles?.length" class="text-[#9BA7B0] text-xs">—</span>
                </div>
              </td>

              <!-- Status -->
              <td class="td">
                <span :class="u.isActive ? 'badge-green' : 'badge-red'" class="badge">
                  <span class="w-1.5 h-1.5" :class="u.isActive ? 'bg-emerald-500' : 'bg-red-500'"></span>
                  {{ u.isActive ? $t('common.active') : $t('common.inactive') }}
                </span>
              </td>

              <!-- Joined -->
              <td class="td text-[#637381] text-xs tabular">{{ fmtDate(u.createdAt) }}</td>

              <!-- Last login -->
              <td class="td text-[#637381] text-xs tabular">{{ u.lastLoginAt ? fmtDate(u.lastLoginAt) : '—' }}</td>

              <!-- Actions -->
              <td class="td">
                <div class="flex items-center justify-end gap-0.5">
                  <button @click="openView(u)" class="p-1.5 text-[#9BA7B0] hover:text-[#374151] hover:bg-[#F1F5F9] transition-colors" :title="$t('common.edit')">
                    <EyeIcon class="w-4 h-4" />
                  </button>
                  <RouterLink v-can="'organizations.edit'" :to="`/admin/organizations/${u.id}/edit`" class="p-1.5 text-[#9BA7B0] hover:text-primary-500 hover:bg-primary-50 transition-colors" :title="$t('common.edit')">
                    <PencilIcon class="w-4 h-4" />
                  </RouterLink>
                  <RouterLink :to="`/admin/staff?organizationId=${u.id}`" class="p-1.5 text-[#9BA7B0] hover:text-violet-600 hover:bg-violet-50 transition-colors" :title="$t('org.viewStaff')">
                    <UserGroupIcon class="w-4 h-4" />
                  </RouterLink>
                  <RouterLink :to="`/hrms/employees?organizationId=${u.id}`" class="p-1.5 text-[#9BA7B0] hover:text-sky-600 hover:bg-sky-50 transition-colors" :title="$t('org.viewEmployees')">
                    <IdentificationIcon class="w-4 h-4" />
                  </RouterLink>
                  <button @click="seedSequences(u)" :disabled="seedingId === u.id" class="p-1.5 text-[#9BA7B0] hover:text-amber-600 hover:bg-amber-50 transition-colors disabled:opacity-40">
                    <CpuChipIcon class="w-4 h-4" />
                  </button>
                  <button @click="loginAs(u)" :disabled="loggingInAsId === u.id"
                    class="p-1.5 text-[#9BA7B0] hover:text-emerald-600 hover:bg-emerald-50 transition-colors disabled:opacity-40"
                    :title="$t('org.loginAs')">
                    <ArrowRightEndOnRectangleIcon class="w-4 h-4" />
                  </button>
                  <button v-can="'organizations.delete'" @click="confirmDelete(u)" class="p-1.5 text-[#9BA7B0] hover:text-red-600 hover:bg-red-50 transition-colors" :title="$t('common.delete')">
                    <TrashIcon class="w-4 h-4" />
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>

        <!-- Pagination -->
        <div class="flex items-center justify-between px-5 py-3.5 border-t border-[#E2E8F0] bg-[#F7F9FC]/60">
          <span class="text-xs text-[#637381]">
            {{ $t('common.showing') }}
            {{ organizations.length ? (page-1)*limit+1 : 0 }}–{{ Math.min(page*limit,total) }}
            {{ $t('common.of') }} {{ total }}
          </span>
          <div class="flex items-center gap-1.5">
            <button @click="page--" :disabled="page <= 1"
              class="h-7 w-7 flex items-center justify-center border border-[#E2E8F0] text-[#637381] hover:bg-[#F1F5F9] disabled:opacity-40 transition-colors">
              <ChevronLeftIcon class="w-3.5 h-3.5" />
            </button>
            <span class="text-xs text-[#637381] font-medium px-1 tabular">{{ page }} / {{ Math.max(1, Math.ceil(total / limit)) }}</span>
            <button @click="page++" :disabled="page * limit >= total"
              class="h-7 w-7 flex items-center justify-center border border-[#E2E8F0] text-[#637381] hover:bg-[#F1F5F9] disabled:opacity-40 transition-colors">
              <ChevronRightIcon class="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      <!-- ── View Slide-over ────────────────────────────────────────────────── -->
      <Transition name="slide">
        <div v-if="viewOrganization" class="fixed inset-0 z-50 flex justify-end">
          <div class="absolute inset-0 bg-black/30" @click="viewOrganization = null" />
          <div class="relative w-full max-w-md bg-white shadow-xl flex flex-col h-full">
            <div class="flex items-center justify-between px-6 py-4 border-b border-[#E2E8F0]">
              <h2 class="text-base font-semibold text-[#1C2434]">{{ $t('org.details') }}</h2>
              <button @click="viewOrganization = null" class="text-[#9BA7B0] hover:text-[#637381] p-1 transition-colors">
                <XMarkIcon class="w-4 h-4" />
              </button>
            </div>

            <div class="flex-1 overflow-y-auto scrollbar-thin px-6 py-5 space-y-5">
              <div class="flex items-center gap-4">
                <div class="w-12 h-12 bg-primary-100 text-primary-500 flex items-center justify-center text-xl font-bold flex-shrink-0">
                  {{ viewOrganization.name.charAt(0).toUpperCase() }}
                </div>
                <div>
                  <p class="font-semibold text-[#1C2434]">{{ viewOrganization.name }}</p>
                  <p class="text-sm text-[#637381]">{{ viewOrganization.email }}</p>
                </div>
              </div>

              <dl class="grid grid-cols-2 gap-4">
                <div>
                  <dt class="text-[11px] font-semibold text-[#9BA7B0] uppercase tracking-wider">{{ $t('org.colSystemRole') }}</dt>
                  <dd class="mt-1.5">
                    <span :class="systemRoleBadge(viewOrganization.role)" class="badge capitalize">{{ viewOrganization.role }}</span>
                  </dd>
                </div>
                <div>
                  <dt class="text-[11px] font-semibold text-[#9BA7B0] uppercase tracking-wider">{{ $t('org.colStatus') }}</dt>
                  <dd class="mt-1.5">
                    <span :class="viewOrganization.isActive ? 'badge-green' : 'badge-red'" class="badge">
                      <span class="w-1.5 h-1.5" :class="viewOrganization.isActive ? 'bg-emerald-500' : 'bg-red-500'"></span>
                      {{ viewOrganization.isActive ? $t('common.active') : $t('common.inactive') }}
                    </span>
                  </dd>
                </div>
                <div>
                  <dt class="text-[11px] font-semibold text-[#9BA7B0] uppercase tracking-wider">{{ $t('org.colJoined') }}</dt>
                  <dd class="mt-1.5 text-sm text-[#374151]">{{ fmtDateTime(viewOrganization.createdAt) }}</dd>
                </div>
                <div>
                  <dt class="text-[11px] font-semibold text-[#9BA7B0] uppercase tracking-wider">{{ $t('org.colLastLogin') }}</dt>
                  <dd class="mt-1.5 text-sm text-[#374151]">{{ viewOrganization.lastLoginAt ? fmtDateTime(viewOrganization.lastLoginAt) : $t('common.never') }}</dd>
                </div>
              </dl>

              <!-- Parent org -->
              <div v-if="viewOrganization.parent || viewOrganization.children?.length" class="col-span-2">
                <div v-if="viewOrganization.parent" class="mb-3">
                  <dt class="text-[11px] font-semibold text-[#9BA7B0] uppercase tracking-wider mb-1">{{ $t('org.parentOrg') }}</dt>
                  <dd class="text-sm text-[#374151]">{{ viewOrganization.parent.name }}</dd>
                </div>
                <div v-if="viewOrganization.children?.length">
                  <dt class="text-[11px] font-semibold text-[#9BA7B0] uppercase tracking-wider mb-1.5">{{ $t('org.childOrgs') }}</dt>
                  <dd class="flex flex-wrap gap-1.5">
                    <span v-for="c in viewOrganization.children" :key="c.id"
                      class="px-2 py-0.5 bg-[#F1F5F9] text-[#374151] text-xs font-medium">{{ c.name }}</span>
                  </dd>
                </div>
              </div>

              <div>
                <p class="text-[11px] font-semibold text-[#9BA7B0] uppercase tracking-wider mb-3">{{ $t('org.rolesPermissions') }}</p>
                <div v-if="!viewOrganization.roles?.length" class="text-sm text-[#9BA7B0] italic">{{ $t('org.noRolesAssigned') }}</div>
                <div v-for="role in viewOrganization.roles" :key="role.id" class="mb-3">
                  <div class="flex items-center gap-2 mb-1.5">
                    <span class="w-2.5 h-2.5 flex-shrink-0" :style="{ backgroundColor: role.color }" />
                    <span class="font-medium text-[#1C2434] text-sm">{{ role.name }}</span>
                  </div>
                  <div class="flex flex-wrap gap-1 pl-4">
                    <span v-for="perm in role.permissions" :key="perm.id"
                      class="px-1.5 py-0.5 bg-[#F1F5F9] text-[#637381] text-xs font-mono">{{ perm.slug }}</span>
                    <span v-if="!role.permissions?.length" class="text-xs text-[#9BA7B0] italic">{{ $t('org.noPermissions') }}</span>
                  </div>
                </div>
              </div>
            </div>

            <div class="px-6 py-4 border-t border-[#E2E8F0] flex flex-wrap gap-2">
              <button @click="loginAs(viewOrganization)" :disabled="loggingInAsId === viewOrganization.id"
                class="btn-secondary flex items-center gap-1.5 disabled:opacity-40">
                <ArrowRightEndOnRectangleIcon class="w-4 h-4" />
                {{ $t('org.loginAs') }}
              </button>
              <RouterLink
                :to="`/admin/staff?organizationId=${viewOrganization.id}`"
                @click="viewOrganization = null"
                class="btn-secondary flex items-center gap-1.5"
              >
                <UserGroupIcon class="w-4 h-4" />
                {{ $t('org.viewStaff') }}
              </RouterLink>
              <RouterLink
                :to="`/hrms/employees?organizationId=${viewOrganization.id}`"
                @click="viewOrganization = null"
                class="btn-secondary flex items-center gap-1.5"
              >
                <IdentificationIcon class="w-4 h-4" />
                {{ $t('org.viewEmployees') }}
              </RouterLink>
              <RouterLink
                v-can="'organizations.edit'"
                :to="`/admin/organizations/${viewOrganization.id}/edit`"
                @click="viewOrganization = null"
                class="btn-primary flex-1 text-center min-w-[8rem]"
              >{{ $t('org.edit') }}</RouterLink>
              <button @click="viewOrganization = null" class="btn-secondary">{{ $t('common.close') }}</button>
            </div>
          </div>
        </div>
      </Transition>

    </div>
  </AppLayout>
</template>

<script setup>
import { ref, watch, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import {
  PlusIcon, MagnifyingGlassIcon, EyeIcon, PencilIcon, TrashIcon,
  ChevronLeftIcon, ChevronRightIcon, BuildingOffice2Icon, CpuChipIcon, UserGroupIcon, XMarkIcon,
  ArrowRightEndOnRectangleIcon, IdentificationIcon,
} from '@heroicons/vue/24/outline'
import AppLayout from '@/layouts/AppLayout.vue'
import api from '@/api'
import { useAuthStore } from '@/stores/auth'
import { fmtDate, fmtDateTime } from '@/utils/fmt'

const { t } = useI18n()
const router = useRouter()
const auth   = useAuthStore()

// ── State ─────────────────────────────────────────────────────────────────────

const organizations = ref([])
const total         = ref(0)
const page          = ref(1)
const limit         = 20
const search        = ref('')
const loading       = ref(false)

const viewOrganization = ref(null)
const seedingId        = ref(null)
const loggingInAsId    = ref(null)

let searchTimeout = null

// ── Data fetching ─────────────────────────────────────────────────────────────

async function fetchOrganizations() {
  loading.value = true
  try {
    const { data } = await api.get('/organizations', { params: { page: page.value, limit, search: search.value } })
    organizations.value = data.data.organizations
    total.value         = data.data.total
  } finally {
    loading.value = false
  }
}

function onSearch() {
  clearTimeout(searchTimeout)
  searchTimeout = setTimeout(() => { page.value = 1; fetchOrganizations() }, 350)
}

watch(page, fetchOrganizations)
onMounted(fetchOrganizations)

// ── View ──────────────────────────────────────────────────────────────────────

async function openView(row) {
  const { data } = await api.get(`/organizations/${row.id}`)
  viewOrganization.value = data.data.organization
}

// ── Seed Sequences ────────────────────────────────────────────────────────────

async function seedSequences(u) {
  seedingId.value = u.id
  try {
    const { data } = await api.post(`/erp/sequences/seed-defaults/${u.id}`)
    if (data.data.seeded) {
      alert(t('org.seedSeeded', { count: data.data.count, name: u.name }))
    } else {
      alert(t('org.seedExists', { count: data.data.count, name: u.name }))
    }
  } catch (err) {
    alert(err.response?.data?.message || t('org.seedFailed'))
  } finally {
    seedingId.value = null
  }
}

// ── Login As ──────────────────────────────────────────────────────────────────

async function loginAs(u) {
  loggingInAsId.value = u.id
  try {
    await auth.loginAs(u.id)
    router.push('/dashboard')
  } catch (err) {
    alert(err.response?.data?.message || t('org.loginAsFailed'))
  } finally {
    loggingInAsId.value = null
  }
}

// ── Delete ────────────────────────────────────────────────────────────────────

async function confirmDelete(u) {
  if (!confirm(t('org.confirmDelete', { name: u.name, email: u.email }))) return
  try {
    await api.delete(`/organizations/${u.id}`)
    fetchOrganizations()
  } catch (err) {
    alert(err.response?.data?.message || t('org.deleteFailed'))
  }
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function systemRoleBadge(role) {
  return role === 'admin' ? 'badge-purple' : 'badge-blue'
}

</script>

<style scoped>
.slide-enter-active,
.slide-leave-active {
  transition: transform 0.25s ease;
}
.slide-enter-from,
.slide-leave-to {
  transform: translateX(100%);
}
</style>
