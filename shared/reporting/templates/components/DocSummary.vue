<template>
  <!-- Bottom band: free-form left column (amount-in-words + terms/notes) next
       to the fixed-width totals box on the right. -->
  <div class="flex items-stretch border-x border-t border-b border-[#1C2434]">
    <div class="flex-1 min-w-0 flex flex-col">
      <div v-if="totalInWords" class="border-b border-[#1C2434] px-3 py-2 text-center">
        <p class="text-[12px] font-semibold text-[#1C2434] italic">({{ totalInWords }})</p>
      </div>
      <slot name="notes" />
    </div>
    <div class="w-[241px] flex-shrink-0 border-l border-[#1C2434] text-[12px]">
      <slot name="totals" />
    </div>
  </div>
</template>

<script setup>
defineProps({
  // Optional amount-in-words line rendered above the notes slot.
  totalInWords: { type: String, default: '' },
})
</script>
