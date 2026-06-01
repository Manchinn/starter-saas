/**
 * export-swimlane-process.js — derive the app's business workflows from the
 * Express route files and emit swimlane-process.html: a BPMN-style swimlane
 * PROCESS diagram. Each module is a swimlane (lane); the documents that move a
 * process forward are the steps; the cross-document "create-X / convert"
 * endpoints are the flows between steps (bold when they cross a lane). Each
 * step also lists its lifecycle actions (approve, issue, post, …).
 *
 * Everything is discovered statically from *.routes.js — no DB, no server boot —
 * so the diagram stays in sync with the real endpoints. Run from the repo root:
 *   node scripts/export-swimlane-process.js
 */
const path = require('path')
const fs = require('fs')

const ROOT = path.resolve(__dirname, '..')

function cap(s) {
  return s.replace(/(^|[-_])(\w)/g, (_, __, c) => ' ' + c.toUpperCase()).trim()
}

// Human module (lane) label from a route file's path.
function moduleLabel(file) {
  const p = file.replace(/\\/g, '/')
  let m
  if ((m = p.match(/\/shared\/erp\/([^/]+)\//))) return 'ERP / ' + cap(m[1])
  if (/\/shared\/hrms\//.test(p)) return 'HRMS'
  if (/\/shared\/ai-agent\//.test(p)) return 'AI Agent'
  if (/\/shared\/reporting\//.test(p)) return 'Reporting'
  if ((m = p.match(/\/server\/modules\/([^/]+)\//))) return 'Core / ' + cap(m[1])
  return 'Other'
}

// Recursively collect *.routes.js files (skipping vendor/build dirs).
function walk(dir, out = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (e.name === 'node_modules' || e.name === '.git' || e.name === 'dist') continue
    const fp = path.join(dir, e.name)
    if (e.isDirectory()) walk(fp, out)
    else if (/\.routes\.js$/.test(e.name)) out.push(fp)
  }
  return out
}

const routeFiles = [
  ...walk(path.join(ROOT, 'shared')),
  ...walk(path.join(ROOT, 'server', 'modules')),
]

// Lifecycle actions = intra-document state changes (not new documents).
const LIFECYCLE = new Set([
  'approve', 'reject', 'issue', 'post', 'void', 'send', 'pay', 'confirm',
  'cancel', 'close', 'reopen', 'receive', 'status', 'submit', 'unpost',
])
// Aliases: target slug found in a create-X path -> canonical document slug.
const ALIAS = { bill: 'vendor-bill', payment: 'receive-payment' }

// ── Pass 1: build the document registry + collect raw transitions ─────────────
const docs = {} // slug -> { slug, label, module, file, actions:Set }
const rawTransitions = [] // { sourceSlug, targetSlug, label }

const ROUTE_RE = /router\.(get|post|put|patch|delete)\(\s*['"]([^'"]+)['"]([^\n]*)/g

for (const file of routeFiles) {
  const text = fs.readFileSync(file, 'utf8')
  const base = path.basename(file).replace(/\.routes\.js$/, '')
  const slug = base
  const doc = (docs[slug] = docs[slug] || {
    slug,
    label: cap(base),
    module: moduleLabel(file),
    file: path.relative(ROOT, file).replace(/\\/g, '/'),
    actions: new Set(),
  })

  let m
  ROUTE_RE.lastIndex = 0
  while ((m = ROUTE_RE.exec(text))) {
    const method = m[1]
    const routePath = m[2]
    if (method === 'get' || method === 'delete') continue

    // The trailing action segment, e.g. /:id/create-invoice -> "create-invoice".
    const seg = (routePath.match(/\/([a-z][a-z-]*)\/?$/) || [])[1] || ''
    const handler = (m[3].match(/(?:controller|c)\.(\w+)/) || [])[1] || ''

    // Document-creating transition?
    const createMatch = seg.match(/^create-(.+)$/)
    if (createMatch) {
      rawTransitions.push({ sourceSlug: slug, targetSlug: createMatch[1], label: seg.replace(/-/g, ' ') })
      continue
    }
    if (seg === 'convert' || /^convertTo/.test(handler)) {
      // convertToOrder / convertToInvoice … -> target slug from handler.
      const tgt = (handler.match(/^convertTo(\w+)/) || [])[1]
      const targetSlug = tgt ? tgt.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase() : 'order'
      rawTransitions.push({ sourceSlug: slug, targetSlug, label: 'convert' })
      continue
    }

    // Otherwise: a lifecycle action on this document.
    const action = LIFECYCLE.has(seg) ? seg : LIFECYCLE.has(handler) ? handler : ''
    if (action) doc.actions.add(action)
    else if (/^generate-/.test(seg)) doc.actions.add(seg.replace(/-/g, ' '))
  }
}

// Resolve a raw target slug to a real document, handling aliases + the
// ambiguous "order" (sales Order vs purchase-order, decided by the source).
function resolveTarget(sourceSlug, rawSlug) {
  let t = ALIAS[rawSlug] || rawSlug
  if (t === 'order' && /purchase|requisition/.test(sourceSlug)) t = 'purchase-order'
  if (docs[t]) return t
  // Fall back: a document whose slug ends with the requested slug.
  const hit = Object.keys(docs).find((s) => s === t || s.endsWith('-' + rawSlug))
  return hit || t
}

// ── Pass 2: build deduped workflow edges ──────────────────────────────────────
const seen = new Set()
const edges = []
for (const tr of rawTransitions) {
  const target = resolveTarget(tr.sourceSlug, tr.targetSlug)
  if (!docs[tr.sourceSlug] || !docs[target] || tr.sourceSlug === target) continue
  const key = `${tr.sourceSlug}->${target}`
  if (seen.has(key)) continue
  seen.add(key)
  const cross = docs[tr.sourceSlug].module !== docs[target].module
  edges.push({ from: tr.sourceSlug, to: target, label: tr.label, cross })
}

// Participating documents = anything touched by a workflow edge.
const involved = new Set()
edges.forEach((e) => { involved.add(e.from); involved.add(e.to) })
const hasIncoming = new Set(edges.map((e) => e.to))

const nodes = [...involved]
  .map((slug) => ({
    slug,
    label: docs[slug].label,
    module: docs[slug].module,
    actions: [...docs[slug].actions],
    isRoot: !hasIncoming.has(slug),
  }))
  .sort((a, b) => a.module.localeCompare(b.module) || a.label.localeCompare(b.label))

const modules = [...new Set(nodes.map((n) => n.module))].sort((a, b) => a.localeCompare(b))

const PAYLOAD = JSON.stringify({
  nodes,
  edges,
  modules: modules.map((m) => ({ name: m, count: nodes.filter((n) => n.module === m).length })),
})

const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Swimlane Process — starter-saas</title>
<style>
  :root { --indigo:#4f46e5; --indigo-d:#3730a3; --slate-50:#f8fafc; --slate-100:#f1f5f9;
    --slate-200:#e2e8f0; --slate-300:#cbd5e1; --slate-500:#64748b; --slate-700:#334155; --slate-900:#0f172a; }
  * { box-sizing:border-box; }
  html,body { margin:0; height:100%; font-family:Inter,system-ui,-apple-system,Segoe UI,Roboto,sans-serif; color:var(--slate-900); background:var(--slate-50); }
  header { background:var(--indigo); color:#fff; padding:12px 20px; display:flex; align-items:center; gap:16px; flex-wrap:wrap; }
  header h1 { margin:0; font-size:17px; }
  header .meta { font-size:13px; opacity:.85; }
  .toolbar { display:flex; gap:6px; margin-left:auto; }
  .toolbar button { background:rgba(255,255,255,.15); color:#fff; border:1px solid rgba(255,255,255,.3);
    border-radius:6px; padding:4px 12px; font-size:13px; cursor:pointer; }
  .toolbar button:hover { background:rgba(255,255,255,.28); }
  .toolbar button.on { background:#fff; color:var(--indigo); }
  .filters { background:#fff; border-bottom:1px solid var(--slate-200); padding:10px 20px; display:flex;
    gap:8px; align-items:center; flex-wrap:wrap; }
  .filters .lbl { font-size:11px; text-transform:uppercase; letter-spacing:.05em; color:var(--slate-500); margin-right:4px; }
  .chip { display:inline-flex; align-items:center; gap:6px; padding:4px 10px; border-radius:999px;
    border:1px solid var(--slate-300); background:#fff; color:var(--slate-500); font-size:12px; cursor:pointer; }
  .chip i { font-style:normal; background:var(--slate-100); border-radius:999px; padding:0 6px; font-size:11px; }
  .chip.active { background:var(--indigo); border-color:var(--indigo); color:#fff; }
  .chip.active i { background:rgba(255,255,255,.25); color:#fff; }
  .mini { padding:3px 9px; border:1px solid var(--slate-300); background:var(--slate-50); border-radius:6px;
    font-size:12px; cursor:pointer; color:var(--slate-700); }
  .mini:hover { background:var(--slate-100); }
  #wrap { width:100%; height:calc(100vh - 53px - 49px); overflow:hidden; position:relative; background:
    radial-gradient(circle, var(--slate-200) 1px, transparent 1px) 0 0 / 22px 22px, var(--slate-50); }
  .mermaid { width:100%; height:100%; } .mermaid svg { max-width:none !important; }
  .step-actions { font-size:10px; color:#64748b; }
  .step-root { font-size:10px; color:#16a34a; font-weight:600; }
  #status { position:absolute; top:16px; left:16px; padding:8px 14px; background:#fff; border:1px solid var(--slate-200);
    border-radius:8px; font-size:13px; color:var(--slate-500); box-shadow:0 1px 3px rgba(15,23,42,.08); }
  #err { color:#b91c1c; font-family:ui-monospace,monospace; font-size:12px; white-space:pre-wrap; }
</style>
</head>
<body>
<header>
  <h1>Swimlane Process — starter-saas</h1>
  <span class="meta"><b id="ncount">${nodes.length}</b> steps · <b id="fcount">${edges.length}</b> flows · <b>${modules.length}</b> lanes</span>
  <div class="toolbar">
    <button id="dir">Lanes: ⬌</button>
    <button id="lbl" class="on">Labels</button>
    <button id="zin">+</button><button id="zout">−</button><button id="zreset">fit</button>
  </div>
</header>
<div class="filters">
  <span class="lbl">Lanes</span>
  <button class="mini" id="all">All</button>
  <button class="mini" id="none">None</button>
  <span id="chips"></span>
</div>
<div id="wrap">
  <div id="status">Rendering…</div>
  <div class="mermaid" id="mmd"></div>
</div>

<script id="data" type="application/json">${PAYLOAD.replace(/</g, '\\u003c')}</script>
<script type="module">
  import mermaid from 'https://cdn.jsdelivr.net/npm/mermaid@10/dist/mermaid.esm.min.mjs';
  import svgPanZoom from 'https://cdn.jsdelivr.net/npm/svg-pan-zoom@3.6.1/+esm';

  const DATA = JSON.parse(document.getElementById('data').textContent);
  mermaid.initialize({ startOnLoad:false, theme:'neutral', securityLevel:'loose', maxTextSize:5_000_000,
    flowchart:{ useMaxWidth:false, htmlLabels:true, nodeSpacing:36, rankSpacing:70, padding:10 } });

  const selected = new Set(DATA.modules.map(m => m.name));
  let pz = null, rid = 0, laneDir = 'LR', showLabels = true;

  const ids = {}; let seq = 0;
  const idOf = (slug) => ids[slug] || (ids[slug] = 'n' + (seq++));
  const lid = {}; let lseq = 0;
  const laneId = (name) => lid[name] || (lid[name] = 'L' + (lseq++));

  const LANE_FILL = ['#eef2ff','#ecfeff','#f0fdf4','#fef9c3','#fef2f2','#faf5ff','#fff7ed','#f0f9ff','#f5f3ff','#fdf2f8'];

  const chipsEl = document.getElementById('chips');
  for (const m of DATA.modules) {
    const b = document.createElement('button');
    b.className = 'chip active'; b.dataset.mod = m.name;
    b.innerHTML = m.name + ' <i>' + m.count + '</i>';
    b.onclick = () => { if (selected.has(m.name)) { selected.delete(m.name); b.classList.remove('active'); }
      else { selected.add(m.name); b.classList.add('active'); } render(); };
    chipsEl.appendChild(b);
  }

  function esc(s){ return String(s).replace(/"/g,'&quot;').replace(/</g,'&lt;'); }

  function nodeLabel(n) {
    let h = '<b>' + esc(n.label) + '</b>';
    if (n.isRoot) h += '<br/><span class=&quot;step-root&quot;>▶ start</span>';
    if (n.actions.length) h += '<br/><span class=&quot;step-actions&quot;>' + n.actions.map(esc).join(' · ') + '</span>';
    return h;
  }

  function buildSource() {
    const visMods = DATA.modules.filter(m => selected.has(m.name)).map(m => m.name);
    const nodes = DATA.nodes.filter(n => selected.has(n.module));
    const slugs = new Set(nodes.map(n => n.slug));
    const eds = DATA.edges.filter(e => slugs.has(e.from) && slugs.has(e.to));
    document.getElementById('ncount').textContent = nodes.length;
    document.getElementById('fcount').textContent = eds.length;
    if (!nodes.length) return null;

    const top = laneDir === 'LR' ? 'LR' : 'TB';
    const inner = laneDir === 'LR' ? 'TB' : 'LR';
    let s = 'flowchart ' + top + '\\n';

    for (const mod of visMods) {
      s += '  subgraph ' + laneId(mod) + '["' + esc(mod) + '"]\\n    direction ' + inner + '\\n';
      for (const n of nodes.filter(x => x.module === mod)) {
        s += '    ' + idOf(n.slug) + '("' + nodeLabel(n) + '")\\n';
      }
      s += '  end\\n';
    }

    for (const e of eds) {
      const arrow = e.cross ? '==>' : '-->';
      const lab = showLabels && e.label ? '|' + esc(e.label) + '|' : '';
      s += '  ' + idOf(e.from) + ' ' + arrow + lab + ' ' + idOf(e.to) + '\\n';
    }

    visMods.forEach((mod, i) => {
      const fill = LANE_FILL[i % LANE_FILL.length];
      s += '  style ' + laneId(mod) + ' fill:' + fill + ',stroke:#cbd5e1,stroke-width:1px,color:#334155\\n';
    });
    return s;
  }

  async function render() {
    const status = document.getElementById('status');
    const src = buildSource();
    const el = document.getElementById('mmd');
    if (!src) { el.innerHTML = ''; status.style.display='block'; status.textContent = 'No lanes selected.'; return; }
    status.style.display='block'; status.textContent = 'Rendering…';
    try {
      const { svg, bindFunctions } = await mermaid.render('pr' + (++rid), src);
      el.innerHTML = svg;
      bindFunctions && bindFunctions(el);
      const svgEl = el.querySelector('svg');
      svgEl.style.width='100%'; svgEl.style.height='100%';
      if (pz) { try { pz.destroy(); } catch {} }
      pz = svgPanZoom(svgEl, { zoomEnabled:true, controlIconsEnabled:false, fit:true, center:true,
        minZoom:0.05, maxZoom:40, zoomScaleSensitivity:0.4 });
      status.style.display='none';
    } catch (e) {
      status.style.display='block';
      status.innerHTML = '<span id="err">Render failed:\\n' + ((e && e.message) || e) + '</span>';
    }
  }

  document.getElementById('all').onclick = () => { DATA.modules.forEach(m => selected.add(m.name));
    document.querySelectorAll('.chip').forEach(c => c.classList.add('active')); render(); };
  document.getElementById('none').onclick = () => { selected.clear();
    document.querySelectorAll('.chip').forEach(c => c.classList.remove('active')); render(); };
  document.getElementById('dir').onclick = (ev) => { laneDir = laneDir === 'LR' ? 'TB' : 'LR';
    ev.currentTarget.textContent = 'Lanes: ' + (laneDir === 'LR' ? '⬌' : '⬍'); render(); };
  document.getElementById('lbl').onclick = (ev) => { showLabels = !showLabels;
    ev.currentTarget.classList.toggle('on', showLabels); render(); };
  document.getElementById('zin').onclick = () => pz && pz.zoomIn();
  document.getElementById('zout').onclick = () => pz && pz.zoomOut();
  document.getElementById('zreset').onclick = () => { if (pz) { pz.resetZoom(); pz.fit(); pz.center(); } };

  render();
</script>
</body>
</html>`

const outPath = path.resolve(ROOT, 'docs', 'swimlane-process.html')
fs.writeFileSync(outPath, html, 'utf8')
console.log(`Wrote ${outPath}`)
console.log(`Process steps: ${nodes.length}  Lanes: ${modules.length}  Flows: ${edges.length} (cross-lane: ${edges.filter((e) => e.cross).length})`)
for (const e of edges) {
  console.log(`  ${docs[e.from].label}  --[${e.label}]-->  ${docs[e.to].label}${e.cross ? '  (cross-lane)' : ''}`)
}
