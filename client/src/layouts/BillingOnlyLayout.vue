<template>
  <div class="min-h-screen bg-slate-50 flex flex-col">
    <!-- Minimal top bar — no module nav / alerts / settings, so a locked tenant's
         shell never fires the API calls those would (all blocked in this mode). -->
    <header class="h-14 flex-shrink-0 bg-white border-b border-slate-200 flex items-center justify-between px-6">
      <BrandMark
        mark-class="w-8 h-8 rounded-lg flex-shrink-0"
        name-class="font-bold text-slate-800"
      />
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
import BrandMark from '@/components/BrandMark.vue'

const { t } = useI18n()
const auth = useAuthStore()
const router = useRouter()

async function handleLogout() {
  await auth.logout()
  router.push('/login')
}
</script>
