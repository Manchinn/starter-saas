<template>
  <AppLayout>
    <div class="space-y-6">
      <div class="flex items-center gap-3">
        <RouterLink to="/admin/billing/plans" class="text-[#9BA7B0] hover:text-[#637381] transition">
          <ArrowLeftIcon class="w-5 h-5" />
        </RouterLink>
        <div>
          <h1 class="page-title">{{ t('billing.newPlan') }}</h1>
          <p class="page-subtitle">{{ t('billing.newPlanDesc') }}</p>
        </div>
      </div>
      <PlanForm ref="formRef" :submit-label="t('billing.createPlan')" :saving="saving" @submit="save" />
    </div>
  </AppLayout>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { ArrowLeftIcon } from '@heroicons/vue/24/outline'
import AppLayout from '@/layouts/AppLayout.vue'
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
