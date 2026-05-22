<template>
  <AppLayout>
    <div class="w-full space-y-5">
      <div>
        <h1 class="page-title">{{ t('profile.title') }}</h1>
        <p class="page-subtitle">{{ t('profile.subtitle') }}</p>
      </div>

      <ProfileTabs>
        <div class="flex items-start justify-between gap-4 mb-5">
          <div class="space-y-1">
            <h2 class="text-[15px] font-semibold text-[#1C2434]">{{ t('profile.sessionsTitle') }}</h2>
            <p class="text-[13px] text-[#637381]">{{ t('profile.sessionsDesc') }}</p>
          </div>
          <button
            type="button"
            :disabled="!hasOthers || revokingAll"
            @click="revokeAllOthers"
            class="btn-secondary text-[12.5px] whitespace-nowrap"
          >
            {{ revokingAll ? t('profile.revoking') : t('profile.revokeOthers') }}
          </button>
        </div>

        <div v-if="loading" class="text-sm text-[#9BA7B0] py-6 text-center animate-pulse">
          {{ t('common.loading') }}
        </div>
        <div v-else-if="!sessions.length" class="text-sm text-[#9BA7B0] py-6 text-center">
          {{ t('profile.sessionsEmpty') }}
        </div>

        <ul v-else class="divide-y divide-[#E2E8F0] -mx-2">
          <li
            v-for="s in sessions"
            :key="s.id"
            class="flex items-center gap-4 px-2 py-4"
          >
            <div class="w-10 h-10 bg-primary-50 text-primary-600 flex items-center justify-center flex-shrink-0">
              <ComputerDesktopIcon class="w-5 h-5" />
            </div>
            <div class="flex-1 min-w-0">
              <div class="flex items-center gap-2">
                <p class="text-[14px] font-semibold text-[#1C2434] truncate">{{ s.deviceLabel }}</p>
                <span v-if="s.isCurrent" class="badge-green">{{ t('profile.currentSession') }}</span>
              </div>
              <p class="text-[12.5px] text-[#637381] mt-0.5">
                <span v-if="s.ip">{{ t('profile.ipAddress') }} {{ s.ip }} · </span>
                <span>{{ t('profile.lastUsed') }} {{ formatDate(s.lastUsedAt) }}</span>
              </p>
              <p class="text-[11.5px] text-[#9BA7B0] mt-0.5 truncate">
                {{ s.userAgent || '—' }}
              </p>
            </div>
            <button
              v-if="!s.isCurrent"
              type="button"
              :disabled="revokingId === s.id"
              @click="revoke(s.id)"
              class="btn-danger text-[12.5px] px-3 py-1.5 flex-shrink-0"
            >
              {{ revokingId === s.id ? t('profile.revoking') : t('profile.revoke') }}
            </button>
          </li>
        </ul>

        <div v-if="error" class="mt-4 px-4 py-3 bg-red-50 border border-red-100 text-red-700 text-sm">
          {{ error }}
        </div>
        <div v-if="toast" class="mt-4 px-4 py-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm">
          {{ toast }}
        </div>
      </ProfileTabs>
    </div>
  </AppLayout>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { ComputerDesktopIcon } from '@heroicons/vue/24/outline'
import AppLayout from '@/layouts/AppLayout.vue'
import ProfileTabs from './ProfileTabs.vue'
import api from '@/api'
import { fmtDateTime } from '@/utils/fmt'

const { t, locale } = useI18n()

const sessions   = ref([])
const loading    = ref(true)
const error      = ref('')
const toast      = ref('')
const revokingId = ref(null)
const revokingAll = ref(false)

const hasOthers = computed(() => sessions.value.some((s) => !s.isCurrent))

function currentRefreshToken() {
  return localStorage.getItem('refreshToken') ?? sessionStorage.getItem('refreshToken') ?? ''
}

function authHeaders() {
  return { headers: { 'X-Refresh-Token': currentRefreshToken() } }
}

function formatDate(d) {
  if (!d) return t('profile.never')
  return fmtDateTime(d)
}

async function load() {
  loading.value = true
  error.value = ''
  try {
    const { data } = await api.get('/profile/sessions', authHeaders())
    sessions.value = data.data.sessions || []
  } catch (err) {
    error.value = err.response?.data?.message || t('profile.revokeFailed')
  } finally {
    loading.value = false
  }
}

async function revoke(id) {
  if (!window.confirm(t('profile.revokeConfirm'))) return
  revokingId.value = id
  toast.value = ''
  try {
    await api.delete(`/profile/sessions/${id}`, authHeaders())
    sessions.value = sessions.value.filter((s) => s.id !== id)
    toast.value = t('profile.revokedToast')
  } catch (err) {
    error.value = err.response?.data?.message || t('profile.revokeFailed')
  } finally {
    revokingId.value = null
  }
}

async function revokeAllOthers() {
  revokingAll.value = true
  toast.value = ''
  try {
    const { data } = await api.delete('/profile/sessions', authHeaders())
    toast.value = data.message
    await load()
  } catch (err) {
    error.value = err.response?.data?.message || t('profile.revokeFailed')
  } finally {
    revokingAll.value = false
  }
}

onMounted(load)
</script>
