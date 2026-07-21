<template>
  <AppLayout><main class="space-y-5"><header><h1 class="page-title">{{ t('billing.subscriptions') }}</h1><p class="page-subtitle">{{ t('billing.admin') }}</p></header><p v-if="error" class="text-sm text-red-700">{{ error }}</p><section class="table-wrap"><table class="w-full text-sm"><thead class="bg-[#F7F9FC] text-left text-[#637381]"><tr><th class="px-5 py-3">{{ t('billing.organization') }}</th><th class="px-5 py-3">{{ t('billing.plan') }}</th><th class="px-5 py-3">{{ t('billing.status') }}</th><th class="px-5 py-3 text-right">{{ t('billing.actions') }}</th></tr></thead><tbody><tr v-if="!store.subscriptions.length"><td colspan="4" class="px-5 py-8 text-center text-[#637381]">{{ t('billing.noSubscriptions') }}</td></tr><tr v-for="subscription in store.subscriptions" :key="subscription.id" class="border-t border-[#E2E8F0]"><td class="px-5 py-3"><p class="font-medium text-[#1C2434]">{{ subscription.organization?.name }}</p><p class="text-xs text-[#637381]">{{ subscription.organization?.email }}</p></td><td class="px-5 py-3"><select v-model="drafts[subscription.id].planId"><option v-for="plan in store.adminPlans.filter((p) => p.isActive)" :key="plan.id" :value="plan.id">{{ plan.name }}</option></select></td><td class="px-5 py-3"><select v-model="drafts[subscription.id].status"><option v-for="status in statuses" :key="status" :value="status">{{ t(`billing.${status}`) }}</option></select></td><td class="px-5 py-3 text-right"><button class="text-primary-600 hover:text-primary-700" @click="save(subscription)">{{ t('billing.saveSubscription') }}</button></td></tr></tbody></table></section></main></AppLayout>
</template>
<script setup>
import { onMounted, reactive, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import AppLayout from '@/layouts/AppLayout.vue'
import { useBillingStore } from '@/stores/billing'
const { t } = useI18n(); const store = useBillingStore(); const drafts = reactive({}); const error = ref(''); const statuses = ['trialing', 'active', 'past_due', 'canceled', 'expired']
onMounted(async () => { await Promise.all([store.fetchAdminPlans(), store.fetchSubscriptions()]); for (const item of store.subscriptions) drafts[item.id] = { planId: item.planId, status: item.status } })
async function save(subscription) { try { error.value = ''; await store.setSubscription(subscription.organizationId, drafts[subscription.id]); await store.fetchSubscriptions() } catch (err) { error.value = err.response?.data?.message || err.message } }
</script>
<style scoped>select{border:1px solid #cbd5e1;padding:.4rem .5rem;color:#1c2434}</style>
