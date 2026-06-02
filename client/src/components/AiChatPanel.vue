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
          <div v-if="!store.messages.length" class="flex flex-col">
            <div class="flex flex-col items-center text-center gap-2 pt-8 pb-5">
              <div class="w-10 h-10 bg-primary-50 flex items-center justify-center">
                <SparklesIcon class="w-5 h-5 text-primary-500" />
              </div>
              <p class="text-sm font-medium text-[#1C2434]">{{ t('aiAgent.chat.empty') }}</p>
              <p class="text-[12px] text-[#9BA7B0] max-w-[240px]">{{ t('aiAgent.chat.emptyHint') }}</p>
            </div>

            <!-- Sample prompts, grouped by module (matches /ai/chat) -->
            <p class="px-1 mb-2 text-[10px] font-semibold text-[#9BA7B0] uppercase tracking-wider">{{ t('aiAgent.chat.samplesTitle') }}</p>
            <div class="space-y-3">
              <div v-for="g in sampleGroups" :key="g.key">
                <p class="px-1 mb-1.5 flex items-center gap-1.5 text-[11px] font-semibold text-[#637381] uppercase tracking-wide">
                  <component :is="g.icon" class="w-3.5 h-3.5 text-primary-400" />
                  {{ g.title }}
                </p>
                <div class="space-y-1">
                  <button v-for="s in g.items" :key="s.key" type="button" @click="useSample(s.text)"
                    :disabled="store.loading"
                    class="w-full text-left px-2.5 py-1.5 text-[12px] text-[#374151] bg-white border border-[#E2E8F0] hover:border-primary-300 hover:bg-primary-50 hover:text-primary-700 transition-colors disabled:opacity-50">
                    {{ s.text }}
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div v-for="m in store.messages" :key="m.id">
            <!-- User -->
            <div v-if="m.role === 'user'" class="flex justify-end">
              <div class="max-w-[85%] px-3 py-2 text-[13px] leading-relaxed whitespace-pre-wrap bg-primary-500 text-white">
                {{ m.content }}
              </div>
            </div>

            <!-- Assistant -->
            <div v-else class="flex gap-2.5">
              <div class="w-6 h-6 bg-primary-50 flex items-center justify-center flex-shrink-0 mt-0.5">
                <SparklesIcon class="w-3.5 h-3.5 text-primary-500" />
              </div>
              <div class="flex-1 min-w-0 space-y-2 pt-0.5">
                <RichText v-if="m.content" :text="m.content" class="text-[13px] leading-relaxed text-[#374151]" />
                <div v-if="m.actions && m.actions.length" class="flex flex-wrap gap-1.5">
                  <button v-for="(a, i) in m.actions" :key="i" @click="runAction(a)"
                    class="inline-flex items-center gap-1.5 px-2.5 py-1 text-[12px] font-medium text-primary-600 bg-white border border-[#E2E8F0] hover:border-primary-300 hover:bg-primary-50 transition-colors">
                    <ArrowTopRightOnSquareIcon class="w-3 h-3" />
                    {{ a.label || a.target }}
                  </button>
                </div>
              </div>
            </div>
          </div>

          <!-- Typing indicator -->
          <div v-if="store.loading" class="flex gap-2.5">
            <div class="w-6 h-6 bg-primary-50 flex items-center justify-center flex-shrink-0">
              <SparklesIcon class="w-3.5 h-3.5 text-primary-500" />
            </div>
            <div class="flex items-center gap-1 h-6">
              <span class="w-1.5 h-1.5 bg-[#CBD5E1] rounded-full animate-bounce" style="animation-delay:0ms" />
              <span class="w-1.5 h-1.5 bg-[#CBD5E1] rounded-full animate-bounce" style="animation-delay:150ms" />
              <span class="w-1.5 h-1.5 bg-[#CBD5E1] rounded-full animate-bounce" style="animation-delay:300ms" />
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
import { ref, computed, watch, nextTick } from 'vue'
import { RouterLink, useRouter, useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import {
  SparklesIcon, XMarkIcon, PaperAirplaneIcon, ArrowTopRightOnSquareIcon,
  ChartBarIcon, UserGroupIcon, CubeIcon, BanknotesIcon,
} from '@heroicons/vue/24/outline'
import { useAiAgentStore } from '@/stores/aiAgent'
import RichText from '@/components/RichText.vue'

const props = defineProps({ modelValue: Boolean })
const emit  = defineEmits(['update:modelValue'])

const { t } = useI18n()
const router = useRouter()
const route  = useRoute()
const store  = useAiAgentStore()

const draft   = ref('')
const scrollEl = ref(null)
const inputEl  = ref(null)

// Clickable starter prompts, grouped by module — mirrors /ai/chat. Each maps to
// a real tool/navigation the agent supports.
const SAMPLE_GROUPS = [
  { key: 'business',   icon: ChartBarIcon,  items: ['execSummary', 'financialSummary', 'inventorySummary'] },
  { key: 'customers',  icon: UserGroupIcon, items: ['listCustomers', 'findCustomer', 'newCustomer'] },
  { key: 'products',   icon: CubeIcon,      items: ['productList', 'newProduct', 'openOrders'] },
  { key: 'accounting', icon: BanknotesIcon, items: ['trialBalance', 'balanceSheet', 'incomeStatement', 'arAging', 'vatReport'] },
]
const sampleGroups = computed(() => SAMPLE_GROUPS.map((g) => ({
  key:   g.key,
  icon:  g.icon,
  title: t(`aiAgent.chat.groups.${g.key}`),
  items: g.items.map((k) => ({ key: k, text: t(`aiAgent.chat.samples.${k}`) })),
})))

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

// Auto-run actions (gated by the autoAction setting inside store.send) navigate
// the page underneath the overlay. Close the panel on any route change so the
// user lands on the destination — matching the full-page /ai/chat experience.
watch(() => route.fullPath, () => { if (props.modelValue) close() })

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

// Fill the composer with a sample prompt and send it immediately.
function useSample(text) {
  if (store.loading) return
  draft.value = text
  onSend()
}

function runAction(a) {
  if (a.type === 'navigate' && a.path) {
    router.push(a.path).catch(() => {})
    close()
  }
}
</script>
