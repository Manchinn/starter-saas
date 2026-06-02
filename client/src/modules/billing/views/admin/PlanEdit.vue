<template>
  <AppLayout>
    <div class="space-y-6">
      <PageHeader :title="t('billing.editPlan')" :subtitle="t('billing.editPlanDesc')" back-to="/admin/billing/plans" />

      <LoadingSpinner v-if="loading" padding="md" />
      <PlanForm v-else ref="formRef" :initial="plan" lock-slug :submit-label="t('common.save')" :saving="saving" @submit="save" />
    </div>
  </AppLayout>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import AppLayout from '@/layouts/AppLayout.vue'
import PageHeader from '@/components/form/PageHeader.vue'
import LoadingSpinner from '@/components/form/LoadingSpinner.vue'
import PlanForm from './PlanForm.vue'
import { useBillingStore } from '@/stores/billing'

const { t } = useI18n()
const route = useRoute()
const router = useRouter()
const store = useBillingStore()
const loading = ref(true)
const saving = ref(false)
const plan = ref({})
const formRef = ref(null)

onMounted(async () => {
  try {
    plan.value = await store.getAdminPlan(route.params.id)
  } finally {
    loading.value = false
  }
})

async function save(payload) {
  saving.value = true
  try {
    await store.updatePlan(route.params.id, payload)
    router.push('/admin/billing/plans')
  } catch (err) {
    formRef.value?.setError(err.response?.data?.message || t('billing.saveFailed'))
  } finally {
    saving.value = false
  }
}
</script>
