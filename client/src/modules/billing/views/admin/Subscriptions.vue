<template>
  <AppLayout>
    <main class="space-y-5">
      <header>
        <h1 class="page-title">{{ t('billing.subscriptions') }}</h1>
        <p class="page-subtitle">{{ t('billing.admin') }}</p>
      </header>
      <p v-if="error" class="text-sm text-red-700">{{ error }}</p>
      <section class="table-wrap">
        <table class="w-full text-sm">
          <thead class="bg-[#F7F9FC] text-left text-[#637381]">
            <tr>
              <th class="px-5 py-3">{{ t('billing.organization') }}</th>
              <th class="px-5 py-3">{{ t('billing.plan') }}</th>
              <th class="px-5 py-3">{{ t('billing.status') }}</th>
              <th class="px-5 py-3 text-right">{{ t('billing.actions') }}</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="!store.subscriptions.length">
              <td colspan="4" class="px-5 py-8 text-center text-[#637381]">{{ t('billing.noSubscriptions') }}</td>
            </tr>
            <tr v-for="subscription in store.subscriptions" :key="subscription.id" class="border-t border-[#E2E8F0]">
              <td class="px-5 py-3">
                <RouterLink
                  :to="`/admin/billing/subscriptions/${subscription.organizationId}`"
                  class="font-medium text-[#1C2434] hover:text-primary-600"
                >
                  {{ subscription.organization?.name }}
                </RouterLink>
                <p class="text-xs text-[#637381]">{{ subscription.organization?.email }}</p>
              </td>
              <td class="px-5 py-3">
                <span>{{ subscription.plan?.name || '—' }}</span>
                <span v-if="subscription.suspended" class="ml-2 badge badge-amber">{{ t('billing.suspended') }}</span>
              </td>
              <td class="px-5 py-3">{{ t(`billing.${subscription.status}`) }}</td>
              <td class="px-5 py-3 text-right">
                <RouterLink
                  :to="`/admin/billing/subscriptions/${subscription.organizationId}`"
                  class="text-primary-600 hover:text-primary-700 text-sm font-medium"
                >
                  {{ t('billing.manage') }} →
                </RouterLink>
              </td>
            </tr>
          </tbody>
        </table>
      </section>
    </main>
  </AppLayout>
</template>

<script setup>
import { onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import AppLayout from '@/layouts/AppLayout.vue'
import { useBillingStore } from '@/stores/billing'

const { t } = useI18n()
const store = useBillingStore()
const error = ref('')

onMounted(async () => {
  try {
    error.value = ''
    await store.fetchSubscriptions()
  } catch (err) {
    error.value = err.response?.data?.message || err.message
  }
})
</script>
