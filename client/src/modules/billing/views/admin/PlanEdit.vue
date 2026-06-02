<template>
  <AppLayout>
    <div class="space-y-6">
      <div class="flex items-center gap-3">
        <RouterLink to="/admin/billing/plans" class="text-[#9BA7B0] hover:text-[#637381] transition">
          <ArrowLeftIcon class="w-5 h-5" />
        </RouterLink>
        <div>
          <h1 class="page-title">{{ t('billing.editPlan') }}</h1>
          <p class="page-subtitle">{{ t('billing.editPlanDesc') }}</p>
        </div>
      </div>

      <div v-if="loading" class="card p-10 flex justify-center">
        <div class="w-5 h-5 border-2 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
      <PlanForm v-else ref="formRef" :initial="plan" lock-slug :submit-label="t('common.save')" :saving="saving" @submit="save" />
    </div>
  </AppLayout>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { ArrowLeftIcon } from '@heroicons/vue/24/outline'
import AppLayout from '@/layouts/AppLayout.vue'
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
