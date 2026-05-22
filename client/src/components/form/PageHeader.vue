<template>
  <div class="flex items-start gap-4">
    <RouterLink v-if="backTo" :to="backTo"
      class="mt-0.5 p-2 text-[#9BA7B0] hover:text-[#1C2434] hover:bg-white border border-transparent
             hover:border-[#E2E8F0] transition-all flex-shrink-0">
      <ArrowLeftIcon class="w-[18px] h-[18px]" />
    </RouterLink>
    <div class="flex-1 min-w-0">
      <div class="flex items-center gap-2.5">
        <h1 class="text-xl font-bold text-[#1C2434]">{{ title }}</h1>
        <slot name="badge" />
      </div>
      <nav v-if="breadcrumb && breadcrumb.length" class="flex items-center gap-1.5 mt-1">
        <template v-for="(crumb, idx) in breadcrumb" :key="idx">
          <RouterLink v-if="crumb.to" :to="crumb.to"
            class="text-[12px] text-[#9BA7B0] hover:text-[#637381] transition-colors">{{ crumb.label }}</RouterLink>
          <span v-else class="text-[12px] text-[#637381]">{{ crumb.label }}</span>
          <ChevronRightIcon v-if="idx < breadcrumb.length - 1" class="w-3 h-3 text-[#CBD5E1]" />
        </template>
      </nav>
    </div>
    <div v-if="$slots.actions" class="flex items-center gap-2.5 flex-shrink-0">
      <slot name="actions" />
    </div>
  </div>
</template>

<script setup>
import { ArrowLeftIcon, ChevronRightIcon } from '@heroicons/vue/24/outline'

defineProps({
  title:      { type: String, required: true },
  backTo:     { type: [String, Object], default: '' },
  breadcrumb: { type: Array, default: () => [] },
})
</script>
