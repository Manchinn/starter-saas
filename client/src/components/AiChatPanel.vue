<template>
  <Teleport to="body">
    <div v-if="modelValue" class="fixed inset-0 z-50 flex" @keydown.esc="close">
      <!-- Overlay -->
      <div class="flex-1 bg-black/30" @click="close" />

      <!-- Panel -->
      <div class="w-full max-w-md bg-white shadow-2xl flex flex-col">

        <!-- Header -->
        <div class="px-4 py-3 border-b border-[#E2E8F0] flex items-center gap-2 flex-shrink-0">
          <SparklesIcon class="w-4 h-4 text-primary-500 flex-shrink-0" />
          <span class="flex-1 text-sm font-semibold text-[#1C2434]">{{ t('aiAgent.chat.title') }}</span>
          <RouterLink to="/ai/chat" @click="close"
            class="text-xs text-primary-600 hover:underline mr-1 flex-shrink-0">
            {{ t('nav.openFullPage') }}
          </RouterLink>
          <button type="button" @click="close"
            class="w-8 h-8 hover:bg-[#F1F5F9] text-[#637381] flex items-center justify-center flex-shrink-0">
            <XMarkIcon class="w-4 h-4" />
          </button>
        </div>

        <!-- Messages -->
        <div ref="scrollEl" class="flex-1 overflow-y-auto scrollbar-thin px-4 py-4 space-y-3">
          <div v-if="!store.messages.length"
            class="h-full flex flex-col items-center justify-center text-center gap-2 py-12">
            <div class="w-10 h-10 bg-primary-50 flex items-center justify-center">
              <SparklesIcon class="w-5 h-5 text-primary-500" />
            </div>
            <p class="text-sm font-medium text-[#1C2434]">{{ t('aiAgent.chat.empty') }}</p>
            <p class="text-[12px] text-[#9BA7B0] max-w-[220px]">{{ t('aiAgent.chat.emptyHint') }}</p>
          </div>

          <div v-for="m in store.messages" :key="m.id"
            :class="['flex', m.role === 'user' ? 'justify-end' : 'justify-start']">
            <div :class="['max-w-[85%] px-3 py-2 text-[13px] leading-relaxed whitespace-pre-wrap',
              m.role === 'user' ? 'bg-primary-500 text-white' : 'bg-[#F1F5F9] text-[#1C2434]']">
              <p v-if="m.content">{{ m.content }}</p>
              <div v-if="m.actions && m.actions.length" class="mt-2 flex flex-wrap gap-1">
                <button v-for="(a, i) in m.actions" :key="i" @click="runAction(a)"
                  class="inline-flex items-center gap-1 px-2 py-1 text-[11px] font-medium bg-white/90 text-primary-700 border border-primary-200 hover:bg-white">
                  <ArrowTopRightOnSquareIcon class="w-3 h-3" />
                  {{ a.label || a.target }}
                </button>
              </div>
            </div>
          </div>

          <div v-if="store.loading" class="flex justify-start">
            <div class="bg-[#F1F5F9] text-[#9BA7B0] px-3 py-2 text-[13px]">
              {{ t('aiAgent.chat.thinking') }}
            </div>
          </div>
        </div>

        <!-- Composer -->
        <form @submit.prevent="onSend" class="border-t border-[#E2E8F0] p-3 flex items-end gap-2 flex-shrink-0">
          <textarea v-model="draft" rows="1" ref="inputEl"
            @keydown.enter.exact.prevent="onSend"
            :placeholder="t('aiAgent.chat.placeholder')"
            class="input flex-1 resize-none max-h-28" />
          <button type="submit" :disabled="store.loading || !draft.trim()"
            class="btn-primary h-10 px-3 flex-shrink-0">
            <PaperAirplaneIcon class="w-4 h-4" />
          </button>
        </form>

      </div>
    </div>
  </Teleport>
</template>

<script setup>
import { ref, watch, nextTick } from 'vue'
import { RouterLink, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import {
  SparklesIcon, XMarkIcon, PaperAirplaneIcon, ArrowTopRightOnSquareIcon,
} from '@heroicons/vue/24/outline'
import { useAiAgentStore } from '@/stores/aiAgent'

const props = defineProps({ modelValue: Boolean })
const emit  = defineEmits(['update:modelValue'])

const { t } = useI18n()
const router = useRouter()
const store  = useAiAgentStore()

const draft   = ref('')
const scrollEl = ref(null)
const inputEl  = ref(null)

function close() { emit('update:modelValue', false) }

function scrollToBottom() {
  nextTick(() => {
    if (scrollEl.value) scrollEl.value.scrollTop = scrollEl.value.scrollHeight
  })
}

watch(() => props.modelValue, (open) => {
  if (open) {
    store.newConversation()
    store.loadConversations()
    nextTick(() => inputEl.value?.focus())
  }
})

watch(() => store.messages.length, scrollToBottom)
watch(() => store.loading, scrollToBottom)

async function onSend() {
  const text = draft.value.trim()
  if (!text || store.loading) return
  draft.value = ''
  try {
    await store.send(text)
  } catch (e) {
    store.messages.push({
      id: `err-${Date.now()}`, role: 'assistant',
      content: e.response?.data?.message || t('aiAgent.errors.sendFailed'), actions: [],
    })
  }
}

function runAction(a) {
  if (a.type === 'navigate' && a.path) {
    router.push(a.path).catch(() => {})
    close()
  }
}
</script>
