<template>
  <div>
    <table class="w-full text-sm">
      <thead>
        <tr class="bg-[#F7F9FC] border-b border-[#E2E8F0] text-left">
          <th
            v-for="header in table.getHeaderGroups()[0]?.headers"
            :key="header.id"
            class="px-5 py-3 text-xs font-semibold text-[#637381] uppercase tracking-wide"
            :class="header.column.columnDef.meta?.thClass"
          >
            <FlexRender
              v-if="!header.isPlaceholder"
              :render="header.column.columnDef.header"
              :props="header.getContext()"
            />
          </th>
        </tr>
      </thead>
      <tbody class="divide-y divide-slate-50">
        <!-- Loading -->
        <tr v-if="loading">
          <td :colspan="columns.length" class="text-center py-16">
            <div class="inline-block w-5 h-5 border-2 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
          </td>
        </tr>

        <!-- Empty -->
        <tr v-else-if="!data.length">
          <td :colspan="columns.length" class="py-16">
            <slot name="empty">
              <p class="text-center text-sm text-[#9BA7B0] font-medium">No records found</p>
            </slot>
          </td>
        </tr>

        <!-- Rows -->
        <template v-else>
          <tr
            v-for="row in table.getRowModel().rows"
            :key="row.id"
            class="hover:bg-[#F7F9FC] transition-colors group"
          >
            <td
              v-for="cell in row.getVisibleCells()"
              :key="cell.id"
              class="px-5 py-3.5"
              :class="cell.column.columnDef.meta?.tdClass"
            >
              <FlexRender :render="cell.column.columnDef.cell" :props="cell.getContext()" />
            </td>
          </tr>
        </template>
      </tbody>
    </table>

    <!-- Pagination -->
    <div class="flex items-center justify-between px-5 py-3.5 border-t border-[#E2E8F0] bg-[#F7F9FC]/80">
      <span class="text-xs text-[#637381]">
        Showing {{ data.length ? (page - 1) * pageSize + 1 : 0 }}–{{ Math.min(page * pageSize, total) }} of {{ total }}
      </span>
      <div class="flex items-center gap-1">
        <button
          @click="$emit('update:page', page - 1)"
          :disabled="page <= 1"
          class="h-8 w-8 flex items-center justify-center rounded-lg border border-[#E2E8F0]
                 text-[#637381] hover:bg-[#F1F5F9] disabled:opacity-40 transition-colors"
        >
          <ChevronLeftIcon class="w-4 h-4" />
        </button>
        <span class="text-xs text-[#637381] font-medium px-2 tabular-nums">
          {{ page }} / {{ Math.max(1, Math.ceil(total / pageSize)) }}
        </span>
        <button
          @click="$emit('update:page', page + 1)"
          :disabled="page * pageSize >= total"
          class="h-8 w-8 flex items-center justify-center rounded-lg border border-[#E2E8F0]
                 text-[#637381] hover:bg-[#F1F5F9] disabled:opacity-40 transition-colors"
        >
          <ChevronRightIcon class="w-4 h-4" />
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { useVueTable, FlexRender, getCoreRowModel } from '@tanstack/vue-table'
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/vue/24/outline'

const props = defineProps({
  columns:  { type: Array,   required: true },
  data:     { type: Array,   default: () => [] },
  loading:  { type: Boolean, default: false },
  total:    { type: Number,  default: 0 },
  page:     { type: Number,  default: 1 },
  pageSize: { type: Number,  default: 20 },
})

defineEmits(['update:page'])

const table = useVueTable({
  get data()    { return props.data },
  get columns() { return props.columns },
  getCoreRowModel: getCoreRowModel(),
  manualPagination: true,
  get pageCount() { return Math.ceil(props.total / props.pageSize) },
})
</script>
