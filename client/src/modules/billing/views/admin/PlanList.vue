<template>
  <AppLayout>
    <main class="space-y-5">
      <header class="flex flex-wrap items-end justify-between gap-3"><div><h1 class="page-title">{{ t('billing.plans') }}</h1><p class="page-subtitle">{{ t('billing.admin') }}</p></div><button class="btn-primary" @click="beginCreate">{{ t('billing.newPlan') }}</button></header>
      <section v-if="editing" class="table-wrap p-6">
        <div class="mb-5 flex items-center justify-between"><h2 class="text-base font-semibold text-[#1C2434]">{{ editing.id ? t('billing.editPlan') : t('billing.newPlan') }}</h2><button class="text-sm text-[#637381] hover:text-[#1C2434]" @click="editing = null">Close</button></div>
        <form class="grid grid-cols-1 gap-4 md:grid-cols-2" @submit.prevent="save">
          <label class="field"><span>{{ t('billing.slug') }}</span><input v-model.trim="editing.slug" required :disabled="!!editing.id" /></label>
          <label class="field"><span>{{ t('billing.name') }}</span><input v-model.trim="editing.name" required /></label>
          <label class="field md:col-span-2"><span>{{ t('billing.description') }}</span><input v-model.trim="editing.description" /></label>
          <label class="field"><span>{{ t('billing.price') }}</span><input v-model.number="editing.price" type="number" min="0" step="0.01" /></label>
          <label class="field"><span>{{ t('billing.currency') }}</span><input v-model.trim="editing.currency" maxlength="8" /></label>
          <label class="field"><span>{{ t('billing.interval') }}</span><select v-model="editing.interval"><option value="month">{{ t('billing.monthly') }}</option><option value="year">{{ t('billing.yearly') }}</option></select></label>
          <label class="field"><span>{{ t('billing.trialDays') }}</span><input v-model.number="editing.trialDays" type="number" min="0" /></label>
          <label class="field"><span>{{ t('billing.features') }}</span><textarea v-model="editing.featuresText" rows="5" /></label>
          <label class="field"><span>{{ t('billing.limits') }}</span><textarea v-model="editing.limitsText" rows="5" /></label>
          <div class="flex items-center gap-6 text-sm text-[#374151]"><label class="flex items-center gap-2"><input v-model="editing.isActive" type="checkbox" />{{ t('billing.enabled') }}</label><label class="flex items-center gap-2"><input v-model="editing.isPublic" type="checkbox" />{{ t('billing.public') }}</label></div>
          <p v-if="error" class="md:col-span-2 text-sm text-red-700">{{ error }}</p><div class="flex gap-3 md:col-span-2"><button class="btn-primary" :disabled="saving">{{ t('billing.savePlan') }}</button><button type="button" class="btn-secondary" @click="editing = null">Cancel</button></div>
        </form>
      </section>
      <section class="table-wrap"><table class="w-full text-sm"><thead class="bg-[#F7F9FC] text-left text-[#637381]"><tr><th class="px-5 py-3">{{ t('billing.plan') }}</th><th class="px-5 py-3">{{ t('billing.price') }}</th><th class="px-5 py-3">{{ t('billing.interval') }}</th><th class="px-5 py-3">{{ t('billing.status') }}</th><th class="px-5 py-3 text-right">{{ t('billing.actions') }}</th></tr></thead><tbody><tr v-if="!store.adminPlans.length"><td colspan="5" class="px-5 py-8 text-center text-[#637381]">{{ t('billing.noPlan') }}</td></tr><tr v-for="plan in store.adminPlans" :key="plan.id" class="border-t border-[#E2E8F0]"><td class="px-5 py-3"><p class="font-medium text-[#1C2434]">{{ plan.name }}</p><p class="text-xs text-[#637381]">{{ plan.slug }}</p></td><td class="px-5 py-3">{{ price(plan) }}</td><td class="px-5 py-3">{{ plan.interval }}</td><td class="px-5 py-3">{{ plan.isActive ? t('billing.active') : t('billing.expired') }}</td><td class="px-5 py-3 text-right"><button class="mr-3 text-primary-600 hover:text-primary-700" @click="beginEdit(plan)">Edit</button><button class="text-red-700 hover:text-red-800" @click="remove(plan)">{{ t('billing.deletePlan') }}</button></td></tr></tbody></table></section>
    </main>
  </AppLayout>
</template>
<script setup>
import { onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import AppLayout from '@/layouts/AppLayout.vue'
import { useBillingStore } from '@/stores/billing'
const { t } = useI18n(); const store = useBillingStore(); const editing = ref(null); const saving = ref(false); const error = ref('')
onMounted(() => store.fetchAdminPlans())
const blank = () => ({ slug: '', name: '', description: '', price: 0, currency: 'USD', interval: 'month', trialDays: 0, featuresText: '{}', limitsText: '{}', isActive: true, isPublic: true })
const beginCreate = () => { error.value = ''; editing.value = blank() }
const beginEdit = (plan) => { error.value = ''; editing.value = { ...plan, featuresText: JSON.stringify(plan.features || {}, null, 2), limitsText: JSON.stringify(plan.limits || {}, null, 2) } }
const price = (plan) => Number(plan.price || 0) === 0 ? '0' : `${Number(plan.price).toLocaleString()} ${plan.currency}`
async function save() { try { saving.value = true; error.value = ''; const { featuresText, limitsText, ...data } = editing.value; const payload = { ...data, features: JSON.parse(featuresText || '{}'), limits: JSON.parse(limitsText || '{}') }; if (data.id) await store.updatePlan(data.id, payload); else await store.createPlan(payload); editing.value = null; await store.fetchAdminPlans() } catch (err) { error.value = err.response?.data?.message || err.message || 'Unable to save plan' } finally { saving.value = false } }
async function remove(plan) { if (!confirm(t('billing.confirmDelete', { name: plan.name }))) return; try { await store.deletePlan(plan.id); await store.fetchAdminPlans() } catch (err) { error.value = err.response?.data?.message || err.message } }
</script>
<style scoped>.field{display:grid;gap:.375rem;font-size:.875rem;color:#374151}.field input,.field select,.field textarea{width:100%;border:1px solid #cbd5e1;padding:.55rem .65rem;color:#1c2434}.btn-secondary{border:1px solid #cbd5e1;padding:.55rem .9rem;font-size:.875rem;color:#374151}</style>
