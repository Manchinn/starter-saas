<template>
  <AppLayout>
    <div class="space-y-5">

      <!-- Header -->
      <div class="flex items-center justify-between gap-4">
        <div class="flex items-center gap-3">
          <button v-if="organizationId" @click="router.back()" class="btn-secondary px-2.5 py-2">
            <ArrowLeftIcon class="w-4 h-4" />
          </button>
          <div>
            <h1 class="page-title">
              {{ organizationId ? t('staff.titleOrg') : t('staff.title') }}
            </h1>
            <p class="page-subtitle">
              {{ organizationId ? t('staff.descOrg') : t('staff.desc') }}
            </p>
          </div>
        </div>
        <RouterLink
          :to="organizationId ? `/admin/staff/create?organizationId=${organizationId}` : '/admin/staff/create'"
          class="btn-primary"
        >
          <PlusIcon class="w-4 h-4" />
          {{ t('staff.new') }}
        </RouterLink>
      </div>

      <!-- Table -->
      <div class="table-wrap">

        <!-- Toolbar -->
        <div class="px-5 py-3 border-b border-[#E2E8F0] flex items-center gap-3">
          <div class="relative flex-1 min-w-48 max-w-64">
            <MagnifyingGlassIcon class="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#9BA7B0] pointer-events-none" />
            <input
              v-model="search"
              @input="onSearch"
              type="search"
              :placeholder="t('staff.searchPh')"
              class="input pl-9"
            />
          </div>
        </div>

        <table class="w-full text-left">
          <thead class="bg-[#F7F9FC] border-b border-[#E2E8F0]">
            <tr>
              <th class="th">{{ t('staff.colMember') }}</th>
              <th class="th">{{ t('staff.colOrg') }}</th>
              <th class="th">{{ t('staff.colRole') }}</th>
              <th class="th">{{ t('staff.colStatus') }}</th>
              <th class="th text-right">{{ t('staff.colActions') }}</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-50">
            <tr v-if="loading">
              <td colspan="5" class="px-5 py-14 text-center">
                <div class="inline-block w-5 h-5 border-2 border-primary-500 border-t-transparent animate-spin" />
              </td>
            </tr>
            <tr v-else-if="!staff.length">
              <td colspan="5" class="px-5 py-14 text-center">
                <div class="flex flex-col items-center gap-2 text-[#9BA7B0]">
                  <UsersIcon class="w-8 h-8 opacity-40" />
                  <p class="text-sm font-medium">{{ t('staff.noFound') }}</p>
                </div>
              </td>
            </tr>
            <tr v-for="member in staff" :key="member.id"
                class="hover:bg-[#F7F9FC]/60 transition-colors">
              <td class="td">
                <div class="flex items-center gap-3">
                  <div class="w-8 h-8 bg-primary-100 text-primary-500
                              flex items-center justify-center font-bold text-xs flex-shrink-0">
                    {{ member.name.charAt(0).toUpperCase() }}
                  </div>
                  <div>
                    <p class="font-semibold text-[#1C2434] text-sm leading-tight">{{ member.name }}</p>
                    <p class="text-xs text-[#9BA7B0] mt-0.5">{{ member.email }}</p>
                  </div>
                </div>
              </td>
              <td class="td">
                <span class="text-sm text-[#637381]">{{ member.organization?.name || '—' }}</span>
              </td>
              <td class="td">
                <div class="space-y-1.5">
                  <span class="badge badge-gray capitalize">{{ member.role }}</span>
                  <div v-if="member.employee?.roles?.length" class="flex flex-wrap items-center gap-1">
                    <span
                      v-for="r in member.employee.roles" :key="r.id"
                      class="inline-block px-2 py-0.5 text-[11px] font-medium text-white whitespace-nowrap"
                      :style="{ backgroundColor: r.color || '#6366f1' }"
                    >{{ r.name }}</span>
                    <span
                      v-if="permNames(member).length"
                      class="text-[11px] text-[#9BA7B0] whitespace-nowrap cursor-help"
                      :title="permNames(member).join(', ')"
                    >· {{ permNames(member).length }} {{ t('staff.permissions') }}</span>
                  </div>
                </div>
              </td>
              <td class="td">
                <span :class="member.isActive ? 'badge-green' : 'badge-red'" class="badge">
                  <span class="w-1.5 h-1.5"
                        :class="member.isActive ? 'bg-emerald-500' : 'bg-red-500'"></span>
                  {{ member.isActive ? t('common.active') : t('common.inactive') }}
                </span>
              </td>
              <td class="td text-right">
                <div class="flex items-center justify-end gap-0.5">
                  <RouterLink :to="`/admin/staff/${member.id}/edit`"
                              class="p-1.5 text-[#9BA7B0] hover:text-primary-500 hover:bg-primary-50 transition-colors"
                              :title="t('common.edit')">
                    <PencilIcon class="w-4 h-4" />
                  </RouterLink>
                  <button @click="confirmDelete(member)"
                          class="p-1.5 text-[#9BA7B0] hover:text-red-600 hover:bg-red-50 transition-colors"
                          :title="t('common.delete')">
                    <TrashIcon class="w-4 h-4" />
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>

        <!-- Pagination -->
        <div class="px-5 py-3.5 border-t border-[#E2E8F0] bg-[#F7F9FC]/60 flex items-center justify-between">
          <p class="text-xs text-[#637381]">
            {{ t('common.showing') }} {{ staff.length ? (page - 1) * limit + 1 : 0 }}–{{ Math.min(page * limit, total) }} {{ t('common.of') }} {{ total }}
          </p>
          <div class="flex items-center gap-1.5">
            <button
              :disabled="page <= 1"
              @click="page--; load()"
              class="h-7 w-7 flex items-center justify-center border border-[#E2E8F0]
                     text-[#637381] hover:bg-white disabled:opacity-30 transition-colors"
            >
              <ChevronLeftIcon class="w-3.5 h-3.5" />
            </button>
            <span class="text-xs font-medium text-[#637381] px-1 tabular">
              {{ page }} / {{ Math.max(1, Math.ceil(total / limit)) }}
            </span>
            <button
              :disabled="page * limit >= total"
              @click="page++; load()"
              class="h-7 w-7 flex items-center justify-center border border-[#E2E8F0]
                     text-[#637381] hover:bg-white disabled:opacity-30 transition-colors"
            >
              <ChevronRightIcon class="w-3.5 h-3.5" />
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
import { useI18n } from 'vue-i18n'
import AppLayout from '@/layouts/AppLayout.vue'
import {
  MagnifyingGlassIcon, ChevronLeftIcon, ChevronRightIcon,
  ArrowLeftIcon, PlusIcon, TrashIcon, PencilIcon, UsersIcon,
} from '@heroicons/vue/24/outline'
import api from '@/api'

const route          = useRoute()
const router         = useRouter()
const { t }          = useI18n()
const organizationId = computed(() => route.query.organizationId)

const staff   = ref([])
const total   = ref(0)
const loading = ref(false)
const search  = ref('')
const page    = ref(1)
const limit   = ref(20)

let searchTimer = null

onMounted(() => load())

async function load() {
  loading.value = true
  try {
    const { data } = await api.get('/organizations/all-staff', {
      params: { page: page.value, limit: limit.value, search: search.value, organizationId: organizationId.value },
    })
    staff.value = data.data.staff
    total.value = data.data.total
  } catch (err) {
    console.error('Failed to load staff accounts:', err)
  } finally {
    loading.value = false
  }
}

// Distinct permission display-names resolved from a staff member's HRMS roles.
function permNames(member) {
  const map = new Map()
  for (const r of member.employee?.roles || []) {
    for (const p of (r.permissions || [])) map.set(p.slug, p.name || p.slug)
  }
  return [...map.values()]
}

function onSearch() {
  clearTimeout(searchTimer)
  searchTimer = setTimeout(() => { page.value = 1; load() }, 400)
}

async function confirmDelete(member) {
  if (!confirm(t('staff.confirmDelete', { name: member.name }))) return
  try {
    await api.delete(`/organizations/${member.id}`)
    load()
  } catch (err) {
    alert(err.response?.data?.message || t('staff.deleteFailed'))
  }
}
</script>
