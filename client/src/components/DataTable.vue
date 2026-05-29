<template>
  <div>
    <!-- Toolbar: server-side global filter + caller-provided extras -->
    <div
      v-if="searchable || $slots.toolbar"
      class="px-5 py-3 border-b border-[#E2E8F0] flex items-center gap-3"
    >
      <div v-if="searchable" class="relative flex-1 min-w-0">
        <MagnifyingGlassIcon class="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#9BA7B0] pointer-events-none" />
        <input
          ref="searchInputEl"
          v-model="searchInput"
          @input="onSearchInput"
          type="search"
          :placeholder="searchPlaceholder"
          class="input pl-9 w-full"
        />
      </div>
      <slot name="toolbar" />
    </div>

    <!-- Advanced filter panel (collapsible) — parent controls visibility -->
    <slot name="filters" />

    <!-- Active filter chips bar -->
    <slot name="active-filters" />

    <table class="w-full text-sm">
      <thead>
        <tr class="bg-[#F7F9FC] border-b border-[#E2E8F0] text-left">
          <th
            v-for="header in table.getHeaderGroups()[0]?.headers"
            :key="header.id"
            class="px-5 py-3 text-xs font-semibold text-[#637381] uppercase tracking-wide whitespace-nowrap"
            :class="[
              header.column.columnDef.meta?.thClass,
              header.column.getCanSort()
                ? 'cursor-pointer select-none hover:text-[#374151] transition-colors'
                : '',
            ]"
            @click="header.column.getToggleSortingHandler()?.($event)"
          >
            <span class="inline-flex items-center gap-1">
              <FlexRender
                v-if="!header.isPlaceholder"
                :render="header.column.columnDef.header"
                :props="header.getContext()"
              />
              <template v-if="header.column.getCanSort()">
                <ChevronUpIcon
                  v-if="header.column.getIsSorted() === 'asc'"
                  class="w-3 h-3 text-primary-500 flex-shrink-0"
                />
                <ChevronDownIcon
                  v-else-if="header.column.getIsSorted() === 'desc'"
                  class="w-3 h-3 text-primary-500 flex-shrink-0"
                />
                <ChevronUpDownIcon
                  v-else
                  class="w-3 h-3 opacity-25 flex-shrink-0"
                />
              </template>
            </span>
          </th>
        </tr>
      </thead>
      <tbody class="divide-y divide-slate-50">
        <!-- Loading -->
        <tr v-if="loading">
          <td :colspan="columns.length" class="text-center py-16">
            <div class="inline-block w-5 h-5 border-2 border-primary-500 border-t-transparent animate-spin"></div>
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
            v-for="(row, i) in table.getRowModel().rows"
            :key="row.id"
            :class="[
              'hover:bg-[#F7F9FC] transition-colors group',
              i === selectedRowIndex && 'bg-primary-50 ring-1 ring-inset ring-primary-200',
            ]"
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
          class="h-8 w-8 flex items-center justify-center border border-[#E2E8F0]
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
          class="h-8 w-8 flex items-center justify-center border border-[#E2E8F0]
                 text-[#637381] hover:bg-[#F1F5F9] disabled:opacity-40 transition-colors"
        >
          <ChevronRightIcon class="w-4 h-4" />
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, onBeforeUnmount } from 'vue'
import {
  useVueTable, FlexRender, getCoreRowModel, getSortedRowModel,
} from '@tanstack/vue-table'
import {
  ChevronLeftIcon, ChevronRightIcon,
  ChevronUpIcon, ChevronDownIcon, ChevronUpDownIcon,
  MagnifyingGlassIcon,
} from '@heroicons/vue/24/outline'

const props = defineProps({
  columns:           { type: Array,   required: true },
  data:              { type: Array,   default: () => [] },
  loading:           { type: Boolean, default: false },
  total:             { type: Number,  default: 0 },
  page:              { type: Number,  default: 1 },
  pageSize:          { type: Number,  default: 20 },
  initialSorting:    { type: Array,   default: () => [] },
  // Server-side global filter (TanStack docs: https://tanstack.com/table/v8/docs/guide/global-filtering)
  searchable:        { type: Boolean, default: false },
  globalFilter:      { type: String,  default: '' },
  searchPlaceholder: { type: String,  default: 'Search…' },
  searchDebounce:    { type: Number,  default: 350 },
  selectedRowIndex:  { type: Number,  default: -1 },
})

const emit = defineEmits(['update:page', 'update:globalFilter'])

const searchInputEl = ref(null)
defineExpose({ focusSearch: () => searchInputEl.value?.focus() })

const sorting = ref([...props.initialSorting])

// Debounced local mirror of globalFilter — input binds here, emits fire after `searchDebounce`.
const searchInput = ref(props.globalFilter)
let debounceHandle = null

// External reset (e.g. parent clears filters) syncs back into the input.
watch(() => props.globalFilter, v => {
  if (v !== searchInput.value) searchInput.value = v
})

function onSearchInput() {
  clearTimeout(debounceHandle)
  debounceHandle = setTimeout(() => {
    if (searchInput.value === props.globalFilter) return
    emit('update:globalFilter', searchInput.value)
    if (props.page !== 1) emit('update:page', 1)
  }, props.searchDebounce)
}

onBeforeUnmount(() => clearTimeout(debounceHandle))

const table = useVueTable({
  get data()    { return props.data },
  get columns() { return props.columns },
  getCoreRowModel:   getCoreRowModel(),
  getSortedRowModel: getSortedRowModel(),
  state: {
    get sorting()      { return sorting.value },
    get globalFilter() { return props.globalFilter },
  },
  onSortingChange: updater => {
    sorting.value = typeof updater === 'function' ? updater(sorting.value) : updater
  },
  onGlobalFilterChange: updater => {
    const next = typeof updater === 'function' ? updater(props.globalFilter) : updater
    if (next === props.globalFilter) return
    emit('update:globalFilter', next)
    if (props.page !== 1) emit('update:page', 1)
  },
  sortDescFirst:    true,
  manualFiltering:  true,
  manualPagination: true,
  get pageCount() { return Math.ceil(props.total / props.pageSize) },
})
</script>
