<template>
  <!-- Empty rows that keep the goods area tall like a pre-printed form.
       Rendered inside a <tbody>; one bordered cell per table column. -->
  <tr v-for="n in count" :key="'filler-' + n" class="h-[26px]">
    <td v-for="c in cols" :key="c" class="border-x border-[#1C2434]"></td>
  </tr>
</template>

<script setup>
defineProps({
  // Number of filler rows to render.
  count: { type: Number, required: true },
  // Number of columns in the parent table (cells per row).
  cols:  { type: Number, required: true },
})
</script>
