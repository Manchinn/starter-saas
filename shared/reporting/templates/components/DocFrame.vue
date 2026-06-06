<template>
  <!-- Shared A4 document shell: white card, optional diagonal status stamp,
       and the padded body that every ERP printable shares. -->
  <article class="relative mx-auto bg-white border border-[#E2E8F0] shadow-card max-w-[186mm] w-full
                  print:border-0 print:shadow-none print:max-w-none print:mx-0
                  overflow-hidden">

    <!-- Diagonal status stamp -->
    <div v-if="stampLabel"
      class="pointer-events-none absolute inset-0 flex items-center justify-center z-10"
      aria-hidden="true">
      <span class="select-none font-black tracking-[0.2em] uppercase border-[6px] px-6 py-2
                   text-[64px] sm:text-[88px] -rotate-[18deg] opacity-[0.12]"
        :class="stampClass">
        {{ stampLabel }}
      </span>
    </div>

    <div class="p-6">
      <slot />
    </div>
  </article>
</template>

<script setup>
defineProps({
  // Optional watermark text shown diagonally across the page (e.g. "Draft").
  stampLabel: { type: String, default: '' },
  // Tailwind colour classes for the stamp text + border.
  stampClass: { type: String, default: 'text-[#1C2434] border-[#1C2434]' },
})
</script>
