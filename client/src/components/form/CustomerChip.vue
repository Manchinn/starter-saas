<template>
  <div v-if="customer"
    class="mt-2.5 flex items-center gap-2.5 px-3 py-2 bg-primary-50 border border-primary-100">
    <div class="w-7 h-7 bg-primary-500 flex items-center justify-center flex-shrink-0">
      <span class="text-xs font-bold text-white uppercase">{{ customer.name?.charAt(0) }}</span>
    </div>
    <div class="min-w-0 flex-1">
      <p class="text-sm font-semibold text-[#1C2434] truncate">{{ customer.name }}</p>
      <p v-if="customer.company" class="text-xs text-[#637381] truncate">{{ customer.company }}</p>
    </div>
    <span v-if="customer.group"
      class="flex-shrink-0 text-[11px] font-semibold px-2.5 py-0.5
             bg-white border border-primary-200 text-primary-600">
      {{ customer.group.name }}
    </span>
  </div>
</template>

<script setup>
defineProps({
  customer: { type: Object, default: null },
})
</script>
