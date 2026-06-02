<template>
  <AppLayout>
    <div class="space-y-6">
      <PageHeader :title="t('billing.newPlan')" :subtitle="t('billing.newPlanDesc')" back-to="/admin/billing/plans" />
      <PlanForm ref="formRef" :submit-label="t('billing.createPlan')" :saving="saving" @submit="save" />
    </div>
  </AppLayout>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import AppLayout from '@/layouts/AppLayout.vue'
import PageHeader from '@/components/form/PageHeader.vue'
import PlanForm from './PlanForm.vue'
import { useBillingStore } from '@/stores/billing'

const { t } = useI18n()
const router = useRouter()
const store = useBillingStore()
const saving = ref(false)
const formRef = ref(null)

async function save(payload) {
  saving.value = true
  try {
    await store.createPlan(payload)
    router.push('/admin/billing/plans')
  } catch (err) {
    formRef.value?.setError(err.response?.data?.message || t('billing.saveFailed'))
  } finally {
    saving.value = false
  }
}
</script>
