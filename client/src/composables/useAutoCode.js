import { ref } from 'vue'
import api from '@/api'

export function useAutoCode(seqCode) {
  const enabled = ref(false)
  const preview = ref('')
  const loading = ref(false)

  async function enable() {
    enabled.value = true
    loading.value = true
    try {
      const { data } = await api.get(`/erp/sequences/preview/${seqCode}`)
      preview.value = data.data.preview
    } catch {
      preview.value = '(auto)'
    } finally {
      loading.value = false
    }
  }

  function disable() {
    enabled.value = false
    preview.value = ''
  }

  async function toggle() {
    if (enabled.value) disable()
    else await enable()
  }

  return { enabled, preview, loading, toggle }
}
