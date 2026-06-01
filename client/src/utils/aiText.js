// Minimal, safe rich text for AI assistant messages.
//
// The local LLM often replies with light markdown (bold labels, bullet lists,
// short headings) — especially for summaries. We parse a small whitelist into a
// structured block tree which <RichText> renders with real Vue elements, so the
// model's text is interpolated (auto-escaped) and never injected as raw HTML.
//
// Block:
//   { type: 'heading', spans }            #..###### heading → emphasized line
//   { type: 'ul' | 'ol', items: spans[] } -, *, • / 1. → list
//   { type: 'para', spans }               anything else → paragraph
// Span (inline): { t: 'text' | 'b' | 'code', v: string }

// Inline tokenizer: **bold** and `code`; everything else is plain text.
function parseInline(s) {
  const spans = []
  const re = /\*\*(.+?)\*\*|`([^`]+?)`/g
  let last = 0
  let m
  while ((m = re.exec(s)) !== null) {
    if (m.index > last) spans.push({ t: 'text', v: s.slice(last, m.index) })
    if (m[1] !== undefined) spans.push({ t: 'b', v: m[1] })
    else spans.push({ t: 'code', v: m[2] })
    last = re.lastIndex
  }
  if (last < s.length) spans.push({ t: 'text', v: s.slice(last) })
  return spans
}

export function parseRich(text) {
  const lines = String(text == null ? '' : text).split('\n')
  const blocks = []
  let list = null // { type: 'ul' | 'ol', items: [] }
  const closeList = () => { if (list) { blocks.push(list); list = null } }

  for (const raw of lines) {
    const line = raw.trim()
    if (!line) { closeList(); continue }

    const heading = line.match(/^#{1,6}\s+(.*)$/)
    const bullet  = line.match(/^[-*•]\s+(.*)$/)
    const ordered = line.match(/^\d+\.\s+(.*)$/)

    if (heading) {
      closeList()
      blocks.push({ type: 'heading', spans: parseInline(heading[1]) })
    } else if (bullet) {
      if (!list || list.type !== 'ul') { closeList(); list = { type: 'ul', items: [] } }
      list.items.push(parseInline(bullet[1]))
    } else if (ordered) {
      if (!list || list.type !== 'ol') { closeList(); list = { type: 'ol', items: [] } }
      list.items.push(parseInline(ordered[1]))
    } else {
      closeList()
      blocks.push({ type: 'para', spans: parseInline(line) })
    }
  }
  closeList()
  return blocks
}
