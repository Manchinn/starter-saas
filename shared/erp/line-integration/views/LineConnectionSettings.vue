<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import api from '@/api'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()
const saving = ref(false)
const message = ref('')
const form = reactive({ messagingChannelId: '', botUserId: '', liffId: '', liffChannelId: '', defaultStoreId: '', channelSecret: '', channelAccessToken: '', isActive: true })
const webhookUrl = computed(() => `${window.location.origin.replace(/:5173$/, ':3000')}/api/line/webhook`)

onMounted(async () => {
  const { data } = await api.get('/line/admin/connection')
  if (data.data.connection) Object.assign(form, data.data.connection)
})

async function save() {
  saving.value = true
  message.value = ''
  try {
    const { data } = await api.put('/line/admin/connection', form)
    Object.assign(form, data.data.connection, { channelSecret: '', channelAccessToken: '' })
    message.value = 'Saved'
  } catch (error) {
    message.value = error.response?.data?.message || error.message
  } finally { saving.value = false }
}
</script>

<template>
  <main class="max-w-3xl space-y-6">
    <div>
      <h1 class="text-2xl font-semibold text-slate-900">{{ t('lineIntegration.title') }}</h1>
      <p class="mt-1 text-sm text-slate-600">{{ t('lineIntegration.webhook') }}: <code>{{ webhookUrl }}</code></p>
    </div>
    <form class="grid gap-4 rounded border border-slate-200 bg-white p-6" @submit.prevent="save">
      <label class="grid gap-1 text-sm">Messaging API channel ID<input v-model.trim="form.messagingChannelId" required class="rounded border border-slate-300 px-3 py-2"></label>
      <label class="grid gap-1 text-sm">Bot user ID<input v-model.trim="form.botUserId" required class="rounded border border-slate-300 px-3 py-2"></label>
      <label class="grid gap-1 text-sm">LIFF ID<input v-model.trim="form.liffId" required class="rounded border border-slate-300 px-3 py-2"></label>
      <label class="grid gap-1 text-sm">LINE Login channel ID<input v-model.trim="form.liffChannelId" required class="rounded border border-slate-300 px-3 py-2"></label>
      <label class="grid gap-1 text-sm">Default store ID<input v-model.trim="form.defaultStoreId" required class="rounded border border-slate-300 px-3 py-2"></label>
      <label class="grid gap-1 text-sm">{{ t('lineIntegration.channelSecret') }}<input v-model="form.channelSecret" type="password" :required="!form.hasChannelSecret" autocomplete="new-password" class="rounded border border-slate-300 px-3 py-2"></label>
      <label class="grid gap-1 text-sm">{{ t('lineIntegration.channelAccessToken') }}<input v-model="form.channelAccessToken" type="password" :required="!form.hasChannelAccessToken" autocomplete="new-password" class="rounded border border-slate-300 px-3 py-2"></label>
      <label class="flex items-center gap-2 text-sm"><input v-model="form.isActive" type="checkbox"> Enable LIFF ordering</label>
      <p v-if="message" class="text-sm text-slate-600">{{ message }}</p>
      <div><button type="submit" :disabled="saving" class="rounded bg-emerald-700 px-4 py-2 text-sm font-medium text-white disabled:opacity-50">{{ saving ? 'Saving...' : t('lineIntegration.save') }}</button></div>
    </form>
  </main>
</template>
