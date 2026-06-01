<!--
  RichText — renders the light-markdown of AI assistant messages WITHOUT v-html.

  parseRich() turns the model's text into a structured block tree; we build that
  tree with h(), so every piece of model text becomes element *children* (which
  Vue escapes) rather than raw HTML. No XSS sink, no markdown dependency.
-->
<script>
import { h } from 'vue'
import { parseRich } from '@/utils/aiText'

function renderSpans(spans) {
  return spans.map((s) => {
    if (s.t === 'b')    return h('strong', { class: 'font-semibold text-[#1C2434]' }, s.v)
    if (s.t === 'code') return h('code', { class: 'px-1 py-0.5 bg-black/5 font-mono text-[12px]' }, s.v)
    return s.v
  })
}

export default {
  name: 'RichText',
  props: { text: { type: String, default: '' } },
  render() {
    const nodes = parseRich(this.text).map((b) => {
      if (b.type === 'heading') return h('p', { class: 'font-semibold text-[#1C2434]' }, renderSpans(b.spans))
      if (b.type === 'ul') return h('ul', { class: 'list-disc pl-4 space-y-0.5' }, b.items.map((it) => h('li', renderSpans(it))))
      if (b.type === 'ol') return h('ol', { class: 'list-decimal pl-4 space-y-0.5' }, b.items.map((it) => h('li', renderSpans(it))))
      return h('p', renderSpans(b.spans))
    })
    return h('div', { class: 'space-y-1.5' }, nodes)
  },
}
</script>
