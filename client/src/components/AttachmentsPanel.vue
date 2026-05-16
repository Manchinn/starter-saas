<template>
  <div class="bg-white rounded-2xl border border-[#E2E8F0] p-6 space-y-4">
    <div class="flex items-center justify-between">
      <div>
        <h2 class="text-base font-semibold text-[#1C2434]">{{ t('erp.attachments.title') }}</h2>
        <p class="text-xs text-[#9BA7B0] mt-0.5">{{ t('erp.attachments.subtitle') }}</p>
      </div>
      <label class="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium bg-primary-50 text-primary-600 rounded-lg hover:bg-primary-100 transition cursor-pointer">
        <ArrowUpTrayIcon class="w-4 h-4" />
        {{ uploading ? t('common.loading') : t('erp.attachments.upload') }}
        <input type="file" class="hidden" @change="onFile" :disabled="uploading" />
      </label>
    </div>

    <div v-if="error" class="bg-red-50 border border-red-200 text-red-700 text-xs px-3 py-2 rounded-lg">{{ error }}</div>

    <div v-if="loading" class="py-6 text-center text-sm text-[#9BA7B0]">{{ t('common.loading') }}</div>

    <div v-else-if="!items.length"
      class="border-2 border-dashed border-[#E2E8F0] rounded-xl py-8 text-center text-sm text-[#9BA7B0]">
      {{ t('erp.attachments.empty') }}
    </div>

    <ul v-else class="divide-y divide-[#F1F5F9]">
      <li v-for="a in items" :key="a.id" class="flex items-center gap-3 py-2.5">
        <div class="w-9 h-9 bg-[#F7F9FC] border border-[#E2E8F0] rounded-lg flex items-center justify-center text-[#637381]">
          <DocumentIcon class="w-4 h-4" />
        </div>
        <div class="flex-1 min-w-0">
          <p class="text-sm font-medium text-[#1C2434] truncate">{{ a.originalName }}</p>
          <p class="text-[11px] text-[#9BA7B0]">{{ fmtBytes(a.size) }} · {{ a.mimeType || '—' }}</p>
        </div>
        <button @click="download(a)" class="p-1.5 text-[#9BA7B0] hover:text-primary-600 transition rounded-md">
          <ArrowDownTrayIcon class="w-4 h-4" />
        </button>
        <button @click="remove(a)" class="p-1.5 text-[#9BA7B0] hover:text-red-500 transition rounded-md">
          <TrashIcon class="w-4 h-4" />
        </button>
      </li>
    </ul>
  </div>
</template>

<script setup>
import { ref, watch, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { ArrowUpTrayIcon, ArrowDownTrayIcon, DocumentIcon, TrashIcon } from '@heroicons/vue/24/outline'
import api from '@/api'

const props = defineProps({
  refType: { type: String, required: true },
  refId:   { type: String, required: true },
})

const { t } = useI18n()
const items     = ref([])
const loading   = ref(false)
const uploading = ref(false)
const error     = ref('')

const fmtBytes = (n) => {
  const b = Number(n || 0)
  if (b < 1024) return `${b} B`
  if (b < 1024 * 1024) return `${(b / 1024).toFixed(1)} KB`
  return `${(b / 1024 / 1024).toFixed(1)} MB`
}

async function load() {
  if (!props.refId) return
  loading.value = true
  error.value = ''
  try {
    const { data } = await api.get('/erp/attachments', { params: { refType: props.refType, refId: props.refId } })
    items.value = data.data.attachments
  } catch (err) {
    error.value = err.response?.data?.message || 'Failed to load attachments'
  } finally { loading.value = false }
}

watch(() => props.refId, load)
onMounted(load)

function readAsBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload  = () => resolve(reader.result)
    reader.onerror = () => reject(reader.error)
    reader.readAsDataURL(file)
  })
}

async function onFile(event) {
  const file = event.target.files?.[0]
  if (!file) return
  uploading.value = true
  error.value = ''
  try {
    const dataUrl = await readAsBase64(file)
    await api.post('/erp/attachments', {
      refType: props.refType,
      refId:   props.refId,
      originalName: file.name,
      contentType:  file.type || 'application/octet-stream',
      dataBase64:   dataUrl,
    })
    event.target.value = ''
    await load()
  } catch (err) {
    error.value = err.response?.data?.message || 'Upload failed'
  } finally { uploading.value = false }
}

async function download(a) {
  try {
    const res = await api.get(`/erp/attachments/${a.id}/download`, { responseType: 'blob' })
    const url = URL.createObjectURL(res.data)
    const link = document.createElement('a')
    link.href = url
    link.download = a.originalName
    link.click()
    URL.revokeObjectURL(url)
  } catch (err) {
    error.value = err.response?.data?.message || 'Download failed'
  }
}

async function remove(a) {
  if (!confirm(`Delete "${a.originalName}"?`)) return
  try {
    await api.delete(`/erp/attachments/${a.id}`)
    await load()
  } catch (err) {
    error.value = err.response?.data?.message || 'Delete failed'
  }
}
</script>
