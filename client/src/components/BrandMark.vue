<template>
  <div :class="['inline-flex items-center', gapClass]">
    <img
      :src="brand.logoMarkUrl"
      :alt="showName ? '' : brand.name"
      width="64"
      height="64"
      :class="markClass"
    />
    <span v-if="showName" translate="no" :class="nameClass">{{ brand.name }}</span>
  </div>
</template>

<script setup>
import { brand } from '@/config/brand'

defineProps({
  showName: { type: Boolean, default: true },
  gapClass: { type: String, default: 'gap-3' },
  markClass: { type: String, default: 'w-8 h-8' },
  nameClass: { type: String, default: 'text-[15px] font-bold tracking-tight' },
})
</script>
