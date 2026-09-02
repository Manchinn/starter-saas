<template>
  <div class="w-full space-y-5">
    <!-- Roles -->
    <div class="space-y-2">
      <p class="text-[13px] font-semibold text-[#1C2434]">{{ t('auth.rolesLabel') }}</p>
      <div class="flex flex-wrap gap-1.5">
        <span
          v-if="isAdmin"
          class="px-2.5 py-1 text-[12px] font-medium text-white whitespace-nowrap"
          style="background-color: #6366f1"
        >{{ t('auth.systemAdmin') }}</span>
        <span
          v-for="r in roles" :key="r.id"
          class="px-2.5 py-1 text-[12px] font-medium text-white whitespace-nowrap"
          :style="{ backgroundColor: r.color || '#6366f1' }"
        >{{ r.name }}</span>
        <span v-if="!isAdmin && !roles.length" class="text-[13px] text-[#9BA7B0]">
          {{ t('auth.noRoles') }}
        </span>
      </div>
    </div>

    <!-- Permissions -->
    <div class="space-y-2">
      <p class="text-[13px] font-semibold text-[#1C2434]">{{ t('auth.permissionsLabel') }}</p>
      <p v-if="allAccess" class="text-[13px] text-[#637381]">{{ t('auth.allPermissions') }}</p>
      <div v-else-if="permissions.length" class="flex flex-wrap gap-1.5">
        <span
          v-for="p in permissions" :key="p"
          class="px-2 py-0.5 text-[11px] font-mono bg-[#F1F5F9] text-[#475569] border border-[#E2E8F0]"
        >{{ p }}</span>
      </div>
      <span v-else class="text-[13px] text-[#9BA7B0]">{{ t('auth.noPermissions') }}</span>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { storeToRefs } from 'pinia'
import { useI18n } from 'vue-i18n'
import { useAuthStore } from '@/stores/auth'

const { t } = useI18n()
const auth = useAuthStore()
const { roles, permissions, isAdmin } = storeToRefs(auth)

const allAccess = computed(() => permissions.value.includes('*'))
</script>
