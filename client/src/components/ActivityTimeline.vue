<template>
  <div class="bg-white rounded-2xl border border-[#E2E8F0] p-6 space-y-4">
    <div class="flex items-center justify-between">
      <div>
        <h2 class="text-base font-semibold text-[#1C2434]">{{ t('erp.activity.title') }}</h2>
        <p class="text-xs text-[#9BA7B0] mt-0.5">{{ t('erp.activity.subtitle') }}</p>
      </div>
      <button @click="load" :disabled="loading" class="p-1.5 text-[#9BA7B0] hover:text-primary-500 rounded-md disabled:opacity-50" :title="t('common.loading')">
        <ArrowPathIcon class="w-4 h-4" :class="loading && 'animate-spin'" />
      </button>
    </div>

    <div v-if="error" class="bg-red-50 border border-red-200 text-red-700 text-xs px-3 py-2 rounded-lg">{{ error }}</div>

    <div v-if="loading && !logs.length" class="py-6 text-center text-sm text-[#9BA7B0]">{{ t('common.loading') }}</div>

    <div v-else-if="!logs.length"
      class="border-2 border-dashed border-[#E2E8F0] rounded-xl py-8 text-center text-sm text-[#9BA7B0]">
      {{ t('erp.activity.empty') }}
    </div>

    <ol v-else class="relative">
      <li v-for="(l, idx) in logs" :key="l.id" class="relative pl-8 pb-5">
        <span class="absolute left-2.5 top-2 -translate-x-1/2 w-2.5 h-2.5 rounded-full bg-primary-500 ring-2 ring-white shadow"></span>
        <span v-if="idx < logs.length - 1" class="absolute left-2.5 top-4 -translate-x-1/2 w-px h-full bg-[#E2E8F0]"></span>
        <div class="flex items-baseline justify-between gap-2">
          <p class="text-sm font-medium text-[#1C2434]">
            <code class="font-mono text-[11px] bg-[#F1F5F9] text-[#374151] px-1.5 py-0.5 rounded">{{ l.action }}</code>
          </p>
          <time class="text-[11px] text-[#9BA7B0] tabular-nums whitespace-nowrap" :title="l.createdAt">
            {{ fmtRelative(l.createdAt) }}
          </time>
        </div>
        <p v-if="l.userEmail" class="text-xs text-[#637381] mt-0.5">{{ l.userEmail }}</p>
        <p v-if="l.summary" class="text-xs text-[#637381] mt-1 font-mono">{{ summarize(l.summary) }}</p>
      </li>
    </ol>
  </div>
</template>

<script setup>
import { ref, watch, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { ArrowPathIcon } from '@heroicons/vue/24/outline'
import api from '@/api'

const props = defineProps({
  refType: { type: String, required: true },
  refId:   { type: String, required: true },
})

const { t } = useI18n()
const logs    = ref([])
const loading = ref(false)
const error   = ref('')

async function load() {
  if (!props.refId) return
  loading.value = true
  error.value = ''
  try {
    const { data } = await api.get('/erp/audit-log', {
      params: { entityType: props.refType, entityId: props.refId, limit: 50 },
    })
    logs.value = data.data.logs
  } catch (err) {
    error.value = err.response?.data?.message || 'Failed to load activity'
  } finally { loading.value = false }
}

watch(() => props.refId, load)
onMounted(load)

function fmtRelative(iso) {
  if (!iso) return ''
  const d = new Date(iso)
  const diff = (Date.now() - d.getTime()) / 1000
  if (diff < 60)       return 'just now'
  if (diff < 3600)     return `${Math.floor(diff / 60)} min ago`
  if (diff < 86400)    return `${Math.floor(diff / 3600)} hr ago`
  if (diff < 86400 * 7) return `${Math.floor(diff / 86400)}d ago`
  return d.toLocaleDateString()
}

function summarize(s) {
  try { return Object.entries(s).map(([k, v]) => `${k}=${v}`).join(' · ') }
  catch { return JSON.stringify(s) }
}
</script>
