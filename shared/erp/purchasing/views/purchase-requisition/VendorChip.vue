<template>
  <div v-if="vendor"
    class="mt-2.5 flex items-center gap-2.5 px-3 py-2 bg-primary-50 border border-primary-100">
    <div class="w-7 h-7 bg-primary-500 flex items-center justify-center flex-shrink-0">
      <span class="text-xs font-bold text-white uppercase">{{ vendor.name?.charAt(0) }}</span>
    </div>
    <div class="min-w-0 flex-1">
      <p class="text-sm font-semibold text-[#1C2434] truncate">{{ vendor.name }}</p>
      <p v-if="vendor.email || vendor.phone" class="text-xs text-[#637381] truncate">
        <span v-if="vendor.email">{{ vendor.email }}</span>
        <span v-if="vendor.email && vendor.phone" class="text-[#CBD5E1]"> · </span>
        <span v-if="vendor.phone">{{ vendor.phone }}</span>
      </p>
    </div>
    <span v-if="vendor.code"
      class="flex-shrink-0 text-[11px] font-mono px-2.5 py-0.5
             bg-white border border-primary-200 text-primary-600">
      {{ vendor.code }}
    </span>
  </div>
</template>

<script setup>
defineProps({
  vendor: { type: Object, default: null },
})
</script>
