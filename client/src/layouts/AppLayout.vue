<template>
  <component :is="templateStore.current.layout">
    <UnverifiedEmailBanner />
    <slot />
  </component>
</template>

<script setup>
import { useTemplateStore } from '@/stores/template'
import UnverifiedEmailBanner from '@/components/UnverifiedEmailBanner.vue'

const templateStore = useTemplateStore()
</script>
