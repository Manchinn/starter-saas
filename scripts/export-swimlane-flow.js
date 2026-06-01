/**
 * export-swimlane-flow.js — introspect the live Sequelize model registry and emit
 * swimlane-flow.html: a Mermaid flowchart where every module is its own swimlane
 * (subgraph). Entities are nodes inside their module's lane and associations are
 * the flows between them — flows that cross a module boundary are drawn bold so the
 * lanes read clearly. Lanes are filterable by module and the diagram pans/zooms.
 * Run from the repo root:  node scripts/export-swimlane-flow.js
 */
const path = require('path')
const fs = require('fs')
const { introspect } = require('./_introspect')

const list = introspect()

// name -> module, used to classify each edge as intra- or cross-lane.
const moduleByName = Object.fromEntries(list.map(({ name, module }) => [name, module]))

// ── Nodes: one per entity, tagged with its module (lane) ──────────────────────
const nodes = list.map(({ name, module }) => ({ name, module }))

// ── Flows (deduped) — direction always parent -> child ────────────────────────
const seen = new Set()
const edges = []
for (const { model } of list) {
  for (const assoc of Object.values(model.associations)) {
    const type = assoc.associationType
    const src = model.name
    const tgt = assoc.target.name
    const fk = assoc.foreignKey || (assoc.options && assoc.options.foreignKey) || ''
    let from, to, label, key
    if (type === 'BelongsTo') {
      from = tgt; to = src; label = fk || assoc.as; key = `1N|${tgt}|${src}|${fk}`
    } else if (type === 'HasMany') {
      from = src; to = tgt; label = fk || assoc.as; key = `1N|${src}|${tgt}|${fk}`
    } else if (type === 'HasOne') {
      from = src; to = tgt; label = fk || assoc.as; key = `11|${src}|${tgt}|${fk}`
    } else if (type === 'BelongsToMany') {
      const through = assoc.through && assoc.through.model ? assoc.through.model.name : ''
      const [a, b] = [src, tgt].sort()
      from = a; to = b; label = through || assoc.as; key = `NN|${a}|${b}|${through}`
    } else {
      continue
    }
    if (seen.has(key)) continue
    seen.add(key)
    const cleanLabel = String(label || '').replace(/[^A-Za-z0-9_]/g, '_').slice(0, 30)
    const cross = moduleByName[from] !== moduleByName[to]
    edges.push({ from, to, label: cleanLabel, cross })
  }
}

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
<title>Swimlane Flow — starter-saas</title>
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
  #status { position:absolute; top:16px; left:16px; padding:8px 14px; background:#fff; border:1px solid var(--slate-200);
    border-radius:8px; font-size:13px; color:var(--slate-500); box-shadow:0 1px 3px rgba(15,23,42,.08); }
  #err { color:#b91c1c; font-family:ui-monospace,monospace; font-size:12px; white-space:pre-wrap; }
</style>
</head>
<body>
<header>
  <h1>Swimlane Flow — starter-saas</h1>
  <span class="meta"><b id="ncount">${nodes.length}</b> entities · <b id="fcount">${edges.length}</b> flows · <b>${modules.length}</b> lanes</span>
  <div class="toolbar">
    <button id="dir">Lanes: ⬌</button>
    <button id="lbl">Labels</button>
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
    flowchart:{ useMaxWidth:false, htmlLabels:true, nodeSpacing:30, rankSpacing:55, padding:8 } });

  const selected = new Set(DATA.modules.map(m => m.name));
  let pz = null, rid = 0, laneDir = 'LR', showLabels = false;

  // Stable, mermaid-safe id per entity name.
  const ids = {}; let seq = 0;
  const idOf = (name) => ids[name] || (ids[name] = 'n' + (seq++));
  // Stable, mermaid-safe id per module (lane).
  const lid = {}; let lseq = 0;
  const laneId = (name) => lid[name] || (lid[name] = 'L' + (lseq++));

  // Per-lane fill colours (lane index -> pastel).
  const LANE_FILL = ['#eef2ff','#ecfeff','#f0fdf4','#fef9c3','#fef2f2','#faf5ff','#fff7ed','#f0f9ff','#f5f3ff','#fdf2f8'];

  // build chips
  const chipsEl = document.getElementById('chips');
  for (const m of DATA.modules) {
    const b = document.createElement('button');
    b.className = 'chip active'; b.dataset.mod = m.name;
    b.innerHTML = m.name + ' <i>' + m.count + '</i>';
    b.onclick = () => { if (selected.has(m.name)) { selected.delete(m.name); b.classList.remove('active'); }
      else { selected.add(m.name); b.classList.add('active'); } render(); };
    chipsEl.appendChild(b);
  }

  function esc(s){ return String(s).replace(/"/g,'&quot;'); }

  function buildSource() {
    const visMods = DATA.modules.filter(m => selected.has(m.name)).map(m => m.name);
    const nodes = DATA.nodes.filter(n => selected.has(n.module));
    const names = new Set(nodes.map(n => n.name));
    const eds = DATA.edges.filter(e => names.has(e.from) && names.has(e.to));
    document.getElementById('ncount').textContent = nodes.length;
    document.getElementById('fcount').textContent = eds.length;
    if (!nodes.length) return null;

    // Top-level direction: lanes laid out, each lane stacks its nodes the other way.
    const top = laneDir === 'LR' ? 'LR' : 'TB';
    const inner = laneDir === 'LR' ? 'TB' : 'LR';
    let s = 'flowchart ' + top + '\\n';

    // One subgraph (lane) per module.
    for (const mod of visMods) {
      const ln = laneId(mod);
      s += '  subgraph ' + ln + '["' + esc(mod) + '"]\\n    direction ' + inner + '\\n';
      for (const n of nodes.filter(x => x.module === mod)) {
        s += '    ' + idOf(n.name) + '["' + esc(n.name) + '"]\\n';
      }
      s += '  end\\n';
    }

    // Flows: bold (==>) when crossing a lane, thin (-->) within a lane.
    for (const e of eds) {
      const arrow = e.cross ? '==>' : '-->';
      const lab = showLabels && e.label ? '|' + esc(e.label) + '|' : '';
      s += '  ' + idOf(e.from) + ' ' + arrow + lab + ' ' + idOf(e.to) + '\\n';
    }

    // Lane styling.
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
      const { svg, bindFunctions } = await mermaid.render('fl' + (++rid), src);
      el.innerHTML = svg;
      bindFunctions && bindFunctions(el);
      const svgEl = el.querySelector('svg');
      svgEl.style.width='100%'; svgEl.style.height='100%';
      if (pz) { try { pz.destroy(); } catch {} }
      pz = svgPanZoom(svgEl, { zoomEnabled:true, controlIconsEnabled:false, fit:true, center:true,
        minZoom:0.03, maxZoom:40, zoomScaleSensitivity:0.4 });
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

const outPath = path.resolve(__dirname, '..', 'docs', 'swimlane-flow.html')
fs.writeFileSync(outPath, html, 'utf8')
console.log(`Wrote ${outPath}`)
console.log(`Entities: ${nodes.length}  Lanes: ${modules.length}  Flows: ${edges.length} (cross-lane: ${edges.filter((e) => e.cross).length})`)
