import { ref, unref, onMounted, onUnmounted } from 'vue'

// Build the hint list shown in the list-page shortcuts popover. Kept here so the
// displayed hints and the bound key handlers stay in sync (single source of truth).
function listHints(newLabel, openLabel) {
  return [
    { key: '↑ / ↓',   label: 'Move row selection' },
    { key: '← / →',   label: 'Previous / next page' },
    { key: 'Enter',    label: openLabel },
    { key: 'Shift+S',  label: 'Focus search' },
    { key: 'Shift+C',  label: newLabel },
    { key: 'Shift+D',  label: 'Delete selected row' },
  ]
}

export const FORM_SHORTCUTS = [
  { key: 'Ctrl+S', label: 'Save' },
  { key: 'Escape', label: 'Cancel / back' },
]

function isTyping() {
  const tag = document.activeElement?.tagName?.toLowerCase()
  return tag === 'input' || tag === 'textarea' || tag === 'select'
}

/**
 * Keyboard navigation for list/table pages.
 *
 * Owns `selectedIndex` (bind it to DataTable's :selected-row-index and reset it to
 * -1 after each fetch). Registers/cleans up the global keydown listener itself.
 *
 * @param {object}   o
 * @param {Ref|ComputedRef<Array>} o.rows        Current page's rows.
 * @param {Ref<number>}            o.page         Current page (mutated by ← / →).
 * @param {Ref|ComputedRef<number>} o.totalPages  Total page count.
 * @param {(row:any)=>void} [o.open]              Enter on a selected row.
 * @param {()=>void}        [o.create]            Shift+C.
 * @param {(row:any)=>void} [o.remove]            Shift+D on a selected row.
 * @param {()=>void}        [o.focusSearch]       Shift+S.
 * @param {string}          [o.newLabel]          Label for the Shift+C hint.
 * @param {string}          [o.openLabel]         Label for the Enter hint.
 * @returns {{ selectedIndex: Ref<number>, shortcuts: Array }}
 */
export function useListShortcuts({
  rows, page, totalPages,
  open, create, remove, focusSearch,
  newLabel = 'New', openLabel = 'Open selected row',
}) {
  const selectedIndex = ref(-1)

  function onKeydown(e) {
    if (isTyping()) return

    const list  = unref(rows) || []
    const pages = unref(totalPages) || 1

    if (e.key === 'ArrowDown') {
      e.preventDefault()
      selectedIndex.value = Math.min(selectedIndex.value + 1, list.length - 1)
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      selectedIndex.value = Math.max(selectedIndex.value - 1, 0)
    } else if (e.key === 'ArrowRight' && page.value < pages) {
      e.preventDefault()
      page.value++
    } else if (e.key === 'ArrowLeft' && page.value > 1) {
      e.preventDefault()
      page.value--
    } else if (e.key === 'Enter' && selectedIndex.value >= 0) {
      const row = list[selectedIndex.value]
      if (row) open?.(row)
    } else if (e.shiftKey && e.key === 'C') {
      e.preventDefault()
      create?.()
    } else if (e.shiftKey && e.key === 'S') {
      e.preventDefault()
      focusSearch?.()
    } else if (e.shiftKey && e.key === 'D') {
      e.preventDefault()
      const row = list[selectedIndex.value]
      if (row) remove?.(row)
    }
  }

  onMounted(() => window.addEventListener('keydown', onKeydown))
  onUnmounted(() => window.removeEventListener('keydown', onKeydown))

  return { selectedIndex, shortcuts: listHints(newLabel, openLabel) }
}

/**
 * Keyboard shortcuts for create/edit form pages: Ctrl+S to save, Escape to cancel.
 * Registers/cleans up the global keydown listener itself.
 *
 * @param {object}   o
 * @param {()=>void} o.save    Ctrl+S handler.
 * @param {()=>void} o.cancel  Escape handler.
 * @returns {{ shortcuts: Array }}
 */
export function useFormShortcuts({ save, cancel }) {
  function onKeydown(e) {
    if (e.key === 'Escape') {
      cancel?.()
    } else if (e.ctrlKey && e.key === 's') {
      e.preventDefault()
      save?.()
    }
  }

  onMounted(() => window.addEventListener('keydown', onKeydown))
  onUnmounted(() => window.removeEventListener('keydown', onKeydown))

  return { shortcuts: FORM_SHORTCUTS }
}
