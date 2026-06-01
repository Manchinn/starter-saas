/**
 * export-data-flow.js — introspect the live Sequelize model registry and emit
 * data-flow.html: a Level-1 Data Flow Diagram (DFD) covering all modules.
 *
 * DFD elements:
 *   • External entity  — the Client (API consumer / browser).
 *   • Process          — one per module (its API + controllers).
 *   • Data store       — one per module (its tables; model names listed inside).
 *   • Data flows       — Client → Process (requests); Process ⇄ Store (CRUD);
 *                        Store → Process across modules (a module reading data
 *                        owned by another, derived from cross-module FK
 *                        associations, aggregated + bold).
 *
 * Module = swimlane subgraph, so it reads per-module and filters by module.
 * Run from the repo root:  node scripts/export-data-flow.js
 */
const path = require('path')
const fs = require('fs')
const { introspect } = require('./_introspect')

const list = introspect()
const moduleByName = Object.fromEntries(list.map(({ name, module }) => [name, module]))

// ── Module data stores: the models that live in each module ───────────────────
const modules = {}
for (const { name, module } of list) {
  ;(modules[module] = modules[module] || { name: module, models: [] }).models.push(name)
}

// ── Cross-module data flows from FK associations (parent provides → child reads) ─
// Deduped to one logical edge per association, then aggregated by module pair.
const seen = new Set()
const pairCount = {} // "Provider|Consumer" -> count
for (const { model } of list) {
  for (const assoc of Object.values(model.associations)) {
    const type = assoc.associationType
    const src = model.name
    const tgt = assoc.target.name
    const fk = assoc.foreignKey || (assoc.options && assoc.options.foreignKey) || ''
    let provider, consumer, key
    if (type === 'BelongsTo') {
      provider = tgt; consumer = src; key = `1N|${tgt}|${src}|${fk}` // child(src) holds FK, reads parent(tgt)
    } else if (type === 'HasMany' || type === 'HasOne') {
      provider = src; consumer = tgt; key = `1N|${src}|${tgt}|${fk}` // child(tgt) holds FK, reads parent(src)
    } else if (type === 'BelongsToMany') {
      const through = assoc.through && assoc.through.model ? assoc.through.model.name : ''
      const [a, b] = [src, tgt].sort()
      provider = a; consumer = b; key = `NN|${a}|${b}|${through}`
    } else {
      continue
    }
    if (seen.has(key)) continue
    seen.add(key)
    const pm = moduleByName[provider]
    const cm = moduleByName[consumer]
    if (!pm || !cm || pm === cm) continue // only cross-module data flows
    const pk = `${pm}|${cm}`
    pairCount[pk] = (pairCount[pk] || 0) + 1
  }
}

const flows = Object.entries(pairCount).map(([k, count]) => {
  const [from, to] = k.split('|')
  return { from, to, count }
})

const moduleList = Object.values(modules).sort((a, b) => a.name.localeCompare(b.name))

const PAYLOAD = JSON.stringify({
  modules: moduleList.map((m) => ({ name: m.name, models: m.models.sort(), count: m.models.length })),
  flows,
})

const totalModels = list.length
const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Data Flow — starter-saas</title>
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
  .store-models { font-size:10px; color:#64748b; }
  #status { position:absolute; top:16px; left:16px; padding:8px 14px; background:#fff; border:1px solid var(--slate-200);
    border-radius:8px; font-size:13px; color:var(--slate-500); box-shadow:0 1px 3px rgba(15,23,42,.08); }
  #err { color:#b91c1c; font-family:ui-monospace,monospace; font-size:12px; white-space:pre-wrap; }
</style>
</head>
<body>
<header>
  <h1>Data Flow (DFD) — starter-saas</h1>
  <span class="meta"><b>${moduleList.length}</b> modules · <b>${totalModels}</b> data stores · <b id="fcount">${flows.length}</b> cross-module flows</span>
  <div class="toolbar">
    <button id="dir">Layout: ⬌</button>
    <button id="lbl" class="on">Labels</button>
    <button id="mdl" class="on">Tables</button>
    <button id="zin">+</button><button id="zout">−</button><button id="zreset">fit</button>
  </div>
</header>
<div class="filters">
  <span class="lbl">Modules</span>
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
    flowchart:{ useMaxWidth:false, htmlLabels:true, nodeSpacing:34, rankSpacing:75, padding:10 } });

  const selected = new Set(DATA.modules.map(m => m.name));
  let pz = null, rid = 0, dir = 'LR', showLabels = true, showModels = true;

  const lid = {}; let lseq = 0;
  const laneId = (name) => lid[name] || (lid[name] = 'L' + (lseq++));
  const procId = (name) => 'P' + laneId(name);
  const storeId = (name) => 'S' + laneId(name);

  const LANE_FILL = ['#eef2ff','#ecfeff','#f0fdf4','#fef9c3','#fef2f2','#faf5ff','#fff7ed','#f0f9ff','#f5f3ff','#fdf2f8'];
  const MAX_MODELS = 8;

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

  function storeLabel(m) {
    let h = '<b>' + esc(m.name) + '</b> data';
    if (showModels && m.models.length) {
      const shown = m.models.slice(0, MAX_MODELS).map(esc).join(' · ');
      const extra = m.models.length > MAX_MODELS ? ' · +' + (m.models.length - MAX_MODELS) + ' more' : '';
      h += '<br/><span class=&quot;store-models&quot;>' + shown + extra + '</span>';
    }
    return h;
  }

  function buildSource() {
    const mods = DATA.modules.filter(m => selected.has(m.name));
    const names = new Set(mods.map(m => m.name));
    const fl = DATA.flows.filter(f => names.has(f.from) && names.has(f.to));
    document.getElementById('fcount').textContent = fl.length;
    if (!mods.length) return null;

    const top = dir;
    const inner = dir === 'LR' ? 'TB' : 'LR';
    let s = 'flowchart ' + top + '\\n';
    // External entity.
    s += '  client[/"🧑 Client"/]\\n';

    // One swimlane per module: a Process and its Data Store.
    for (const m of mods) {
      const ln = laneId(m.name);
      s += '  subgraph G' + ln + '["' + esc(m.name) + '"]\\n    direction ' + inner + '\\n';
      s += '    ' + procId(m.name) + '(["' + esc(m.name) + ' API"])\\n';
      s += '    ' + storeId(m.name) + '[("' + storeLabel(m) + '")]\\n';
      s += '    ' + procId(m.name) + ' -->|read/write| ' + storeId(m.name) + '\\n';
      s += '  end\\n';
    }

    // Client → each process (requests).
    for (const m of mods) s += '  client --> ' + procId(m.name) + '\\n';

    // Cross-module data flows: provider store → consumer process (bold).
    for (const f of fl) {
      const lab = showLabels ? '|' + f.count + (f.count > 1 ? ' refs' : ' ref') + '|' : '';
      s += '  ' + storeId(f.from) + ' ==>' + lab + ' ' + procId(f.to) + '\\n';
    }

    // Styling: client entity + lane fills.
    s += '  style client fill:#0f172a,color:#fff,stroke:#0f172a\\n';
    mods.forEach((m, i) => {
      s += '  style G' + laneId(m.name) + ' fill:' + LANE_FILL[i % LANE_FILL.length] + ',stroke:#cbd5e1,stroke-width:1px,color:#334155\\n';
    });
    return s;
  }

  async function render() {
    const status = document.getElementById('status');
    const src = buildSource();
    const el = document.getElementById('mmd');
    if (!src) { el.innerHTML = ''; status.style.display='block'; status.textContent = 'No modules selected.'; return; }
    status.style.display='block'; status.textContent = 'Rendering…';
    try {
      const { svg, bindFunctions } = await mermaid.render('df' + (++rid), src);
      el.innerHTML = svg;
      bindFunctions && bindFunctions(el);
      const svgEl = el.querySelector('svg');
      svgEl.style.width='100%'; svgEl.style.height='100%';
      if (pz) { try { pz.destroy(); } catch {} }
      pz = svgPanZoom(svgEl, { zoomEnabled:true, controlIconsEnabled:false, fit:true, center:true,
        minZoom:0.04, maxZoom:40, zoomScaleSensitivity:0.4 });
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
  document.getElementById('dir').onclick = (ev) => { dir = dir === 'LR' ? 'TB' : 'LR';
    ev.currentTarget.textContent = 'Layout: ' + (dir === 'LR' ? '⬌' : '⬍'); render(); };
  document.getElementById('lbl').onclick = (ev) => { showLabels = !showLabels;
    ev.currentTarget.classList.toggle('on', showLabels); render(); };
  document.getElementById('mdl').onclick = (ev) => { showModels = !showModels;
    ev.currentTarget.classList.toggle('on', showModels); render(); };
  document.getElementById('zin').onclick = () => pz && pz.zoomIn();
  document.getElementById('zout').onclick = () => pz && pz.zoomOut();
  document.getElementById('zreset').onclick = () => { if (pz) { pz.resetZoom(); pz.fit(); pz.center(); } };

  render();
</script>
</body>
</html>`

const outPath = path.resolve(__dirname, '..', 'docs', 'data-flow.html')
fs.writeFileSync(outPath, html, 'utf8')
console.log(`Wrote ${outPath}`)
console.log(`Modules: ${moduleList.length}  Data stores (models): ${totalModels}  Cross-module flows: ${flows.length}`)
