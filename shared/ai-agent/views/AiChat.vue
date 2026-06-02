<template>
  <AppLayout>
    <div class="flex flex-col h-full overflow-hidden">

      <!-- Heading -->
      <div class="flex items-center justify-between mb-4">
        <div>
          <h1 class="text-xl font-semibold text-[#1C2434]">{{ t('aiAgent.chat.title') }}</h1>
          <p class="text-sm text-[#637381] mt-0.5">{{ t('aiAgent.chat.subtitle') }}</p>
        </div>
        <RouterLink to="/ai/settings" class="btn-secondary">
          <Cog6ToothIcon class="w-4 h-4" />
        </RouterLink>
      </div>

      <div class="flex flex-1 min-h-0 border border-[#E2E8F0] bg-white" style="max-height: 650px">

        <!-- Conversation list -->
        <aside class="w-60 flex-shrink-0 border-r border-[#E2E8F0] flex flex-col">
          <button @click="store.newConversation()"
            class="m-3 btn-primary justify-center">
            <PlusIcon class="w-4 h-4" /> {{ t('aiAgent.chat.newChat') }}
          </button>
          <div class="flex-1 overflow-y-auto scrollbar-thin">
            <p v-if="!store.conversations.length" class="px-4 py-6 text-center text-[13px] text-[#9BA7B0]">
              {{ t('aiAgent.chat.noConversations') }}
            </p>
            <ul v-else class="px-2 pb-2 space-y-0.5">
              <li v-for="c in store.conversations" :key="c.id">
                <button @click="store.openConversation(c.id)"
                  :class="['group w-full flex items-center gap-2 px-3 py-2 text-left text-[13px] transition-colors',
                    c.id === store.conversationId ? 'bg-primary-50 text-primary-700' : 'text-[#374151] hover:bg-[#F7F9FC]']">
                  <ChatBubbleLeftRightIcon class="w-4 h-4 flex-shrink-0 text-[#9BA7B0]" />
                  <span class="flex-1 truncate">{{ c.title }}</span>
                  <TrashIcon @click.stop="confirmDelete(c)"
                    class="w-3.5 h-3.5 flex-shrink-0 text-[#C0C8D2] opacity-0 group-hover:opacity-100 hover:text-red-500" />
                </button>
              </li>
            </ul>
          </div>
        </aside>

        <!-- Thread -->
        <section class="flex-1 flex flex-col min-w-0">
          <!-- Messages -->
          <div ref="scrollEl" class="flex-1 overflow-y-auto scrollbar-thin px-5 py-5 space-y-4">
            <div v-if="!store.messages.length" class="h-full flex flex-col items-center justify-center text-center gap-2">
              <div class="w-12 h-12 bg-primary-50 flex items-center justify-center">
                <SparklesIcon class="w-6 h-6 text-primary-500" />
              </div>
              <p class="text-sm font-medium text-[#1C2434]">{{ t('aiAgent.chat.empty') }}</p>
              <p class="text-[13px] text-[#9BA7B0] max-w-xs">{{ t('aiAgent.chat.emptyHint') }}</p>

              <!-- Sample prompts: shown here only on narrow screens; on desktop
                   they live in the right rail (grouped by module). -->
              <div class="lg:hidden w-full mt-4">
                <p class="text-[11px] font-semibold text-[#9BA7B0] uppercase tracking-wider">{{ t('aiAgent.chat.samplesTitle') }}</p>
                <div class="flex flex-wrap items-center justify-center gap-2 max-w-md mx-auto mt-2">
                  <button v-for="s in allSamples" :key="s.key" type="button" @click="useSample(s.text)"
                    :disabled="store.loading"
                    class="inline-flex items-center gap-1.5 px-3 py-1.5 text-[12px] text-[#374151] bg-white border border-[#E2E8F0] hover:border-primary-300 hover:bg-primary-50 hover:text-primary-700 transition-colors disabled:opacity-50">
                    <SparklesIcon class="w-3 h-3 text-primary-400" />
                    {{ s.text }}
                  </button>
                </div>
              </div>
            </div>

            <div v-for="m in store.messages" :key="m.id">
              <!-- User -->
              <div v-if="m.role === 'user'" class="flex justify-end">
                <div class="max-w-[80%] px-4 py-2.5 text-[13px] leading-relaxed whitespace-pre-wrap bg-primary-500 text-white">
                  {{ m.content }}
                </div>
              </div>

              <!-- Assistant -->
              <div v-else class="flex gap-3">
                <div class="w-7 h-7 bg-primary-50 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <SparklesIcon class="w-4 h-4 text-primary-500" />
                </div>
                <div class="flex-1 min-w-0 space-y-2 pt-0.5">
                  <RichText v-if="m.content" :text="m.content" class="text-[13px] leading-relaxed text-[#374151]" />
                  <!-- Action chips -->
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
            <div v-if="store.loading" class="flex gap-3">
              <div class="w-7 h-7 bg-primary-50 flex items-center justify-center flex-shrink-0">
                <SparklesIcon class="w-4 h-4 text-primary-500" />
              </div>
              <div class="flex items-center gap-1 h-7">
                <span class="w-1.5 h-1.5 bg-[#CBD5E1] rounded-full animate-bounce" style="animation-delay:0ms" />
                <span class="w-1.5 h-1.5 bg-[#CBD5E1] rounded-full animate-bounce" style="animation-delay:150ms" />
                <span class="w-1.5 h-1.5 bg-[#CBD5E1] rounded-full animate-bounce" style="animation-delay:300ms" />
              </div>
            </div>
          </div>

          <!-- Composer -->
          <form @submit.prevent="onSend" class="border-t border-[#E2E8F0] p-3 flex items-end gap-2">
            <textarea v-model="draft" rows="1" ref="inputEl"
              @keydown.enter.exact.prevent="onSend"
              :placeholder="t('aiAgent.chat.placeholder')"
              class="input flex-1 resize-none max-h-32"></textarea>
            <button type="submit" :disabled="store.loading || !draft.trim()"
              class="btn-primary h-10 px-4">
              <PaperAirplaneIcon class="w-4 h-4" />
            </button>
          </form>
        </section>

        <!-- Sample prompts, grouped by module (desktop) -->
        <aside class="hidden lg:flex w-64 flex-shrink-0 border-l border-[#E2E8F0] flex-col">
          <div class="px-4 py-3 border-b border-[#E2E8F0]">
            <p class="text-[11px] font-semibold text-[#9BA7B0] uppercase tracking-wider">{{ t('aiAgent.chat.samplesTitle') }}</p>
          </div>
          <div class="flex-1 overflow-y-auto scrollbar-thin px-3 py-3 space-y-4">
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
        </aside>
      </div>
    </div>
  </AppLayout>
</template>

<script setup>
import { ref, computed, onMounted, nextTick, watch } from 'vue'
import { RouterLink, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import {
  SparklesIcon, PlusIcon, TrashIcon, PaperAirplaneIcon, Cog6ToothIcon,
  ChatBubbleLeftRightIcon, ArrowTopRightOnSquareIcon,
  ChartBarIcon, UserGroupIcon, CubeIcon, BanknotesIcon,
} from '@heroicons/vue/24/outline'
import AppLayout from '@/layouts/AppLayout.vue'
import { useAiAgentStore } from '@/stores/aiAgent'
import RichText from '@/components/RichText.vue'

const { t } = useI18n()
const router = useRouter()
const store = useAiAgentStore()

const draft = ref('')
const scrollEl = ref(null)
const inputEl = ref(null)

// Clickable starter prompts, grouped by module. Each maps to a real
// tool/navigation the agent supports. The desktop right rail renders the
// groups; narrow screens get a flattened set in the empty state.
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
const allSamples = computed(() => sampleGroups.value.flatMap((g) => g.items))

onMounted(() => {
  store.newConversation()
  store.loadConversations()
})

function scrollToBottom() {
  nextTick(() => {
    if (scrollEl.value) scrollEl.value.scrollTop = scrollEl.value.scrollHeight
  })
}
watch(() => store.messages.length, scrollToBottom)
watch(() => store.loading, scrollToBottom)

async function onSend() {
  const text = draft.value.trim()
  if (!text || store.loading) return
  draft.value = ''
  try {
    await store.send(text)
  } catch (e) {
    // Surface as an assistant-style error bubble.
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
  if (a.type === 'navigate' && a.path) router.push(a.path).catch(() => {})
}

async function confirmDelete(c) {
  if (!confirm(t('aiAgent.chat.confirmDelete'))) return
  await store.removeConversation(c.id)
}
</script>
