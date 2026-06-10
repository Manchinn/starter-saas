<template>
  <div class="min-h-screen bg-slate-50 flex flex-col">
    <!-- Minimal top bar — no module nav / alerts / settings, so a locked tenant's
         shell never fires the API calls those would (all blocked in this mode). -->
    <header class="h-14 flex-shrink-0 bg-white border-b border-slate-200 flex items-center justify-between px-6">
      <div class="flex items-center gap-2.5">
        <div class="w-8 h-8 rounded-lg grid place-items-center flex-shrink-0"
             style="background: linear-gradient(135deg, #465fff 0%, #3641f5 100%);">
          <svg class="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        </div>
        <span class="font-bold text-slate-800">Starter SaaS</span>
      </div>
      <div class="flex items-center gap-4">
        <span class="text-sm text-slate-500 hidden sm:block">{{ auth.user?.name }}</span>
        <button type="button" @click="handleLogout" class="btn-secondary">
          <ArrowRightOnRectangleIcon class="w-4 h-4" />
          {{ t('nav.signOut') }}
        </button>
      </div>
    </header>

    <main class="flex-1 overflow-y-auto p-4 md:p-6">
      <slot />
    </main>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { ArrowRightOnRectangleIcon } from '@heroicons/vue/24/outline'
import { useAuthStore } from '@/stores/auth'

const { t } = useI18n()
const auth = useAuthStore()
const router = useRouter()

async function handleLogout() {
  await auth.logout()
  router.push('/login')
}
</script>
