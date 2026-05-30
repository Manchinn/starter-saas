// Minimal, safe rich text for AI assistant messages.
//
// The local LLM often replies with light markdown (bold labels, bullet lists,
// short headings) — especially for summaries. We render a small whitelist so
// those look structured and professional, WITHOUT pulling in a markdown
// dependency and without ever injecting raw model HTML: the input is
// HTML-escaped first, then only our own tags are added back.

const escapeHtml = (s) =>
  String(s == null ? '' : s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')

// Inline spans: **bold** and `code`. Operates on already-escaped text.
const inline = (s) =>
  s
    .replace(/\*\*(.+?)\*\*/g, '<strong class="font-semibold text-[#1C2434]">$1</strong>')
    .replace(/`([^`]+?)`/g, '<code class="px-1 py-0.5 bg-black/5 font-mono text-[12px]">$1</code>')

// Render to a safe HTML string. Block grammar handled line-by-line:
//   #..###### heading → emphasized line
//   -, *, •           → unordered list
//   1.                → ordered list
//   blank line        → block separator
//   anything else     → paragraph
export function renderRich(text) {
  const lines = escapeHtml(text).split('\n')
  let html = ''
  let list = null // 'ul' | 'ol' | null
  const closeList = () => { if (list) { html += `</${list}>`; list = null } }

  for (const raw of lines) {
    const line = raw.trim()
    if (!line) { closeList(); continue }

    const heading = line.match(/^#{1,6}\s+(.*)$/)
    const bullet  = line.match(/^[-*•]\s+(.*)$/)
    const ordered = line.match(/^\d+\.\s+(.*)$/)

    if (heading) {
      closeList()
      html += `<p class="font-semibold text-[#1C2434]">${inline(heading[1])}</p>`
    } else if (bullet) {
      if (list !== 'ul') { closeList(); html += '<ul class="list-disc pl-4 space-y-0.5">'; list = 'ul' }
      html += `<li>${inline(bullet[1])}</li>`
    } else if (ordered) {
      if (list !== 'ol') { closeList(); html += '<ol class="list-decimal pl-4 space-y-0.5">'; list = 'ol' }
      html += `<li>${inline(ordered[1])}</li>`
    } else {
      closeList()
      html += `<p>${inline(line)}</p>`
    }
  }
  closeList()
  return html
}
