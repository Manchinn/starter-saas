import { ref, computed, unref, onMounted, onUnmounted } from 'vue'

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
  { key: 'Esc',    label: 'Cancel / back' },
]

// True while focus sits in a text-editing surface, so single-letter shortcuts
// (e.g. `e` to edit) don't fire while the user is typing.
function isTyping() {
  const el = document.activeElement
  if (!el) return false
  const tag = el.tagName?.toLowerCase()
  return tag === 'input' || tag === 'textarea' || tag === 'select' || el.isContentEditable
}

// Match a keydown event against a combo string like 'ctrl+shift+a', 'alt+c', 'delete'.
// 'ctrl'/'cmd'/'meta' all match ctrlKey OR metaKey (cross-platform). The final
// token is the key itself, compared case-insensitively against e.key.
function matchCombo(e, combo) {
  const parts     = combo.toLowerCase().split('+')
  const key       = parts[parts.length - 1]
  const wantCtrl  = parts.includes('ctrl') || parts.includes('cmd') || parts.includes('meta')
  const wantShift = parts.includes('shift')
  const wantAlt   = parts.includes('alt')
  const ctrl      = e.ctrlKey || e.metaKey
  return ctrl === wantCtrl
      && e.shiftKey === wantShift
      && e.altKey === wantAlt
      && e.key.toLowerCase() === key
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
 * Keyboard shortcuts for create/edit form pages.
 *
 * Default: Ctrl/Cmd+S saves, Escape cancels. Pass `saveDraft` to get the two-tier
 * scheme used by document forms (Ctrl+S = save draft, Ctrl+Shift+S = save/post).
 * Pass `extra` for page-specific combos (e.g. Ctrl+A add item, Alt+C new customer).
 * Registers/cleans up the global keydown listener itself.
 *
 * @param {object}   o
 * @param {()=>void} o.save               Primary save (Ctrl+S, or Ctrl+Shift+S when saveDraft set).
 * @param {()=>void} o.cancel             Escape handler.
 * @param {()=>void} [o.saveDraft]        When set, Ctrl+S triggers this and Ctrl+Shift+S triggers save.
 * @param {Array<{combo:string, handler:()=>void, hint?:{key:string,label:string}}>} [o.extra]
 * @param {()=>boolean} [o.enabled]       Master guard; shortcuts are ignored while it returns false.
 * @param {string}   [o.saveLabel]        Hint label for save.
 * @param {string}   [o.draftLabel]       Hint label for save draft.
 * @param {string}   [o.cancelLabel]      Hint label for cancel.
 * @returns {{ shortcuts: Array }}
 */
export function useFormShortcuts({
  save, cancel, saveDraft,
  extra = [],
  enabled = () => true,
  saveLabel = 'Save', draftLabel = 'Save draft', cancelLabel = 'Cancel / back',
}) {
  function onKeydown(e) {
    if (!enabled()) return

    for (const x of extra) {
      if (matchCombo(e, x.combo)) { e.preventDefault(); x.handler?.(); return }
    }

    const ctrl = e.ctrlKey || e.metaKey
    const key  = e.key.toLowerCase()

    if (ctrl && key === 's') {
      e.preventDefault()
      if (saveDraft) { e.shiftKey ? save?.() : saveDraft() }
      else           { save?.() }
    } else if (e.key === 'Escape' && !ctrl && !e.shiftKey) {
      cancel?.()
    }
  }

  onMounted(() => window.addEventListener('keydown', onKeydown))
  onUnmounted(() => window.removeEventListener('keydown', onKeydown))

  const shortcuts = []
  if (saveDraft) {
    shortcuts.push({ key: 'Ctrl+S',       label: draftLabel })
    shortcuts.push({ key: 'Ctrl+Shift+S', label: saveLabel })
  } else {
    shortcuts.push({ key: 'Ctrl+S', label: saveLabel })
  }
  for (const x of extra) if (x.hint) shortcuts.push(x.hint)
  shortcuts.push({ key: 'Esc', label: cancelLabel })

  return { shortcuts }
}

/**
 * Keyboard shortcuts for detail/view pages: Esc/Backspace back, `e` edit,
 * Ctrl/Cmd+P print, Delete remove. All handlers are optional — only the ones you
 * pass are bound and shown in the popover. Registers/cleans up the listener itself.
 *
 * @param {object}   o
 * @param {()=>void} [o.back]             Escape / Backspace.
 * @param {()=>void} [o.edit]             `e` (only when canEdit() is true).
 * @param {()=>void} [o.print]            Ctrl/Cmd+P.
 * @param {()=>void} [o.remove]           Delete.
 * @param {()=>boolean} [o.canEdit]       Gates the edit binding + its hint.
 * @param {()=>boolean} [o.canRemove]     Gates the delete binding + its hint.
 * @param {()=>boolean} [o.enabled]       Master guard (e.g. !loading && record loaded).
 * @param {Array<{combo:string, handler:()=>void, hint?:{key:string,label:string}}>} [o.extra]
 * @param {string}   [o.editLabel]        Hint label for edit.
 * @param {string}   [o.backLabel]        Hint label for back.
 * @param {string}   [o.removeLabel]      Hint label for delete.
 * @returns {{ shortcuts: import('vue').ComputedRef<Array> }}
 */
export function useDetailShortcuts({
  back, edit, print, remove,
  canEdit = () => true,
  canRemove = () => true,
  enabled = () => true,
  extra = [],
  editLabel = 'Edit', backLabel = 'Back to list', removeLabel = 'Delete',
}) {
  function onKeydown(e) {
    if (isTyping() || !enabled()) return

    for (const x of extra) {
      if (matchCombo(e, x.combo)) { e.preventDefault(); x.handler?.(); return }
    }

    const ctrl = e.ctrlKey || e.metaKey

    if (print && ctrl && e.key.toLowerCase() === 'p') { e.preventDefault(); print(); return }
    if (ctrl || e.altKey) return  // leave other modified combos to the browser

    if (edit && canEdit() && e.key.toLowerCase() === 'e') { e.preventDefault(); edit(); return }
    if (back && (e.key === 'Escape' || e.key === 'Backspace')) { e.preventDefault(); back(); return }
    if (remove && canRemove() && e.key === 'Delete') { e.preventDefault(); remove(); return }
  }

  onMounted(() => window.addEventListener('keydown', onKeydown))
  onUnmounted(() => window.removeEventListener('keydown', onKeydown))

  const shortcuts = computed(() => {
    const list = []
    if (edit && canEdit()) list.push({ key: 'E',      label: editLabel })
    if (print)             list.push({ key: 'Ctrl+P', label: 'Print' })
    for (const x of extra) if (x.hint) list.push(x.hint)
    if (back)                  list.push({ key: 'Esc', label: backLabel })
    if (remove && canRemove()) list.push({ key: 'Del', label: removeLabel })
    return list
  })

  return { shortcuts }
}
