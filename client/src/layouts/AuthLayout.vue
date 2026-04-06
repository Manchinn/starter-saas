<template>
  <div class="min-h-screen bg-gradient-to-br from-primary-900 to-primary-600 flex items-center justify-center p-4">
    <div class="w-full max-w-md">
      <div class="text-center mb-8">
        <h1 class="text-3xl font-bold text-white">Starter SaaS</h1>
        <p class="text-primary-100 mt-1">{{ subtitle }}</p>
      </div>
      <div class="bg-white rounded-2xl shadow-xl p-8">
        <slot />
      </div>
    </div>
  </div>
</template>

<script setup>
defineProps({ subtitle: { type: String, default: '' } })
</script>
