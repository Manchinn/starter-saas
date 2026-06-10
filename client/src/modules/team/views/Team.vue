<template>
  <AppLayout>
    <div class="space-y-5">

      <!-- Header -->
      <div class="flex items-center justify-between gap-4">
        <div>
          <h1 class="page-title">{{ t('team.title') }}</h1>
          <p class="page-subtitle">{{ t('team.desc') }}</p>
        </div>
        <RouterLink to="/team/create" class="btn-primary">
          <PlusIcon class="w-4 h-4" />
          {{ t('team.new') }}
        </RouterLink>
      </div>

      <!-- Table -->
      <div class="table-wrap">
        <div class="px-5 py-3 border-b border-[#E2E8F0] flex items-center gap-3">
          <div class="relative flex-1 min-w-48 max-w-64">
            <MagnifyingGlassIcon class="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#9BA7B0] pointer-events-none" />
            <input v-model="search" @input="onSearch" type="search" :placeholder="t('team.searchPh')" class="input pl-9" />
          </div>
        </div>

        <table class="w-full text-left">
          <thead class="bg-[#F7F9FC] border-b border-[#E2E8F0]">
            <tr>
              <th class="th">{{ t('team.colMember') }}</th>
              <th class="th">{{ t('team.colRoles') }}</th>
              <th class="th">{{ t('team.colStatus') }}</th>
              <th class="th">{{ t('team.colLastLogin') }}</th>
              <th class="th text-right">{{ t('team.colActions') }}</th>
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
                  <p class="text-sm font-medium">{{ t('team.noFound') }}</p>
                  <p class="text-xs">{{ t('team.noFoundDesc') }}</p>
                </div>
              </td>
            </tr>
            <tr v-for="member in staff" :key="member.id" class="hover:bg-[#F7F9FC]/60 transition-colors">
              <td class="td">
                <div class="flex items-center gap-3">
                  <div class="w-8 h-8 bg-primary-100 text-primary-500 flex items-center justify-center font-bold text-xs flex-shrink-0">
                    {{ member.name.charAt(0).toUpperCase() }}
                  </div>
                  <div>
                    <p class="font-semibold text-[#1C2434] text-sm leading-tight">{{ member.name }}</p>
                    <p class="text-xs text-[#9BA7B0] mt-0.5">{{ member.email }}</p>
                  </div>
                </div>
              </td>
              <td class="td">
                <div v-if="member.roles?.length" class="flex flex-wrap items-center gap-1">
                  <span v-for="r in member.roles" :key="r.id"
                        class="inline-block px-2 py-0.5 text-[11px] font-medium text-white whitespace-nowrap"
                        :style="{ backgroundColor: r.color || '#6366f1' }">{{ r.name }}</span>
                </div>
                <span v-else class="text-sm text-[#9BA7B0]">—</span>
              </td>
              <td class="td">
                <span :class="member.isActive ? 'badge-green' : 'badge-red'" class="badge">
                  <span class="w-1.5 h-1.5" :class="member.isActive ? 'bg-emerald-500' : 'bg-red-500'"></span>
                  {{ member.isActive ? t('common.active') : t('common.inactive') }}
                </span>
              </td>
              <td class="td">
                <span class="text-sm text-[#637381]">
                  {{ member.lastLoginAt ? formatDate(member.lastLoginAt) : t('team.neverLoggedIn') }}
                </span>
              </td>
              <td class="td text-right">
                <div class="flex items-center justify-end gap-0.5">
                  <RouterLink :to="`/team/${member.id}/edit`"
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
      </div>

    </div>
  </AppLayout>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import AppLayout from '@/layouts/AppLayout.vue'
import { MagnifyingGlassIcon, PlusIcon, TrashIcon, PencilIcon, UsersIcon } from '@heroicons/vue/24/outline'
import api from '@/api'

const { t } = useI18n()

const staff   = ref([])
const loading = ref(false)
const search  = ref('')
let searchTimer = null

onMounted(() => load())

async function load() {
  loading.value = true
  try {
    const { data } = await api.get('/team', { params: { search: search.value } })
    staff.value = data.data.staff
  } catch (err) {
    console.error('Failed to load staff accounts:', err)
  } finally {
    loading.value = false
  }
}

function onSearch() {
  clearTimeout(searchTimer)
  searchTimer = setTimeout(load, 400)
}

function formatDate(iso) {
  try { return new Date(iso).toLocaleString() } catch { return iso }
}

async function confirmDelete(member) {
  if (!confirm(t('team.confirmDelete', { name: member.name }))) return
  try {
    await api.delete(`/team/${member.id}`)
    load()
  } catch (err) {
    alert(err.response?.data?.message || t('team.deleteFailed'))
  }
}
</script>
