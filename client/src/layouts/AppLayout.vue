<template>
  <component :is="templateStore.current.layout">
    <slot />
  </component>
</template>

<script setup>
import { useTemplateStore } from '@/stores/template'

const templateStore = useTemplateStore()
</script>
