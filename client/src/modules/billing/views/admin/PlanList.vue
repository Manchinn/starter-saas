<template>
  <AppLayout>
    <div class="space-y-5">
      <div class="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
        <div>
          <h1 class="page-title">{{ t('billing.adminPlans') }}</h1>
          <p class="page-subtitle">{{ t('billing.adminPlansDesc') }}</p>
        </div>
        <RouterLink to="/admin/billing/plans/create" class="btn-primary">
          <PlusIcon class="w-4 h-4" />
          {{ t('billing.newPlan') }}
        </RouterLink>
      </div>

      <div class="table-wrap">
        <table class="w-full text-sm">
          <thead class="bg-[#F7F9FC] border-b border-[#E2E8F0]">
            <tr class="text-left">
              <th class="th">{{ t('billing.colPlan') }}</th>
              <th class="th">{{ t('common.slug') }}</th>
              <th class="th text-right">{{ t('billing.price') }}</th>
              <th class="th">{{ t('billing.intervalLabel') }}</th>
              <th class="th">{{ t('billing.visibility') }}</th>
              <th class="th w-32 text-right">{{ t('common.actions') }}</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-50">
            <tr v-if="store.loading">
              <td colspan="6" class="text-center py-14">
                <div class="inline-block w-5 h-5 border-2 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
              </td>
            </tr>
            <tr v-else-if="!store.adminPlans.length">
              <td colspan="6" class="text-center py-14 text-slate-400">{{ t('billing.noPlans') }}</td>
            </tr>
            <tr v-for="p in store.adminPlans" :key="p.id" class="hover:bg-[#F7F9FC]">
              <td class="px-5 py-3 font-medium text-slate-800">{{ p.name }}</td>
              <td class="px-5 py-3 font-mono text-slate-500">{{ p.slug }}</td>
              <td class="px-5 py-3 text-right tabular-nums text-slate-700">{{ price(p.price, p.currency) }}</td>
              <td class="px-5 py-3 text-slate-600">{{ t('billing.interval.' + p.interval) }}</td>
              <td class="px-5 py-3 flex gap-1.5">
                <span :class="['badge', p.isActive ? 'badge-green' : 'badge-gray']">{{ p.isActive ? t('billing.active') : t('billing.inactive') }}</span>
                <span v-if="p.isPublic" class="badge badge-blue">{{ t('billing.public') }}</span>
              </td>
              <td class="px-5 py-3 text-right space-x-2 whitespace-nowrap">
                <RouterLink :to="`/admin/billing/plans/${p.id}/edit`" class="text-primary-600 hover:text-primary-700">
                  <PencilSquareIcon class="w-4 h-4 inline" />
                </RouterLink>
                <button @click="remove(p)" class="text-red-500 hover:text-red-600">
                  <TrashIcon class="w-4 h-4 inline" />
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div v-if="error" class="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded">
        <ExclamationCircleIcon class="w-4 h-4 flex-shrink-0" />
        {{ error }}
      </div>
    </div>
  </AppLayout>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { PlusIcon, PencilSquareIcon, TrashIcon, ExclamationCircleIcon } from '@heroicons/vue/24/outline'
import AppLayout from '@/layouts/AppLayout.vue'
import { useBillingStore } from '@/stores/billing'

const { t } = useI18n()
const store = useBillingStore()
const error = ref('')

onMounted(() => store.fetchAdminPlans())

function price(amount, currency) {
  const n = Number(amount)
  if (n === 0) return t('billing.freePrice')
  return `${n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${currency || ''}`.trim()
}

async function remove(p) {
  error.value = ''
  if (!confirm(t('billing.confirmDeletePlan', { name: p.name }))) return
  try {
    await store.deletePlan(p.id)
  } catch (err) {
    error.value = err.response?.data?.message || t('billing.deleteFailed')
  }
}
</script>
