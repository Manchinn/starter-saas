<template>
  <div class="relative" ref="rootRef">
    <button @click="open = !open"
      class="h-8 px-2 flex items-center gap-1 border border-[#E2E8F0] text-[#9BA7B0] hover:text-[#374151] hover:bg-[#F7F9FC] transition-colors text-sm font-semibold"
      title="Keyboard shortcuts">
      <span>?</span>
      <span class="text-xs font-medium">Shortcuts</span>
    </button>
    <Transition
      enter-active-class="transition-all duration-150 ease-out"
      enter-from-class="opacity-0 translate-y-1"
      enter-to-class="opacity-100 translate-y-0"
      leave-active-class="transition-all duration-100 ease-in"
      leave-from-class="opacity-100 translate-y-0"
      leave-to-class="opacity-0 translate-y-1">
      <div v-if="open"
        :class="['absolute right-0 top-10 z-50 bg-white border border-[#E2E8F0] shadow-lg p-4 space-y-2', width]">
        <p class="text-xs font-semibold text-[#374151] uppercase tracking-wide mb-3">Keyboard Shortcuts</p>
        <div v-for="s in shortcuts" :key="s.key" class="flex items-center justify-between gap-3">
          <span class="text-xs text-[#637381]">{{ s.label }}</span>
          <kbd class="inline-flex items-center px-1.5 py-0.5 border border-[#E2E8F0] bg-[#F7F9FC] text-[10px] font-mono text-[#374151] whitespace-nowrap">{{ s.key }}</kbd>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'

defineProps({
  // Array of { key, label } describing the page's active shortcuts.
  shortcuts: { type: Array, required: true },
  // Tailwind width class for the popover panel (list pages use w-64, forms w-56).
  width:     { type: String, default: 'w-64' },
})

const open    = ref(false)
const rootRef = ref(null)

function onClickOutside(e) {
  if (rootRef.value && !rootRef.value.contains(e.target)) open.value = false
}

onMounted(() => document.addEventListener('mousedown', onClickOutside))
onUnmounted(() => document.removeEventListener('mousedown', onClickOutside))
</script>
