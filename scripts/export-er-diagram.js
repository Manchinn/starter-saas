/**
 * export-er-diagram.js — introspect the live Sequelize model registry and emit
 * ER-schema.html: an entity-relationship diagram rendered with Mermaid, grouped
 * and filterable by module (toggling a module re-renders the filtered diagram).
 * Run from the repo root:  node scripts/export-er-diagram.js
 */
const path = require('path')
const fs = require('fs')
const { introspect } = require('./_introspect')

const list = introspect()

function safeType(attr) {
  let t
  try {
    t = attr.type && attr.type.toString ? attr.type.toString() : String(attr.type)
  } catch {
    t = 'UNKNOWN'
  }
  t = t.replace(/'/g, '').replace(/,\s*/g, '_').replace(/\s+/g, '')
  return (t || 'UNKNOWN').slice(0, 40)
}

// ── Entities: name, module, and pre-built attribute rows ──────────────────────
const entities = list.map(({ name, model, module }) => {
  const attrs = model.getAttributes()
  const rows = Object.entries(attrs).map(([field, a]) => {
    const keys = []
    if (a.primaryKey) keys.push('PK')
    if (a.references) keys.push('FK')
    else if (a.unique) keys.push('UK')
    return `    ${safeType(a)} ${a.field || field}${keys.length ? ' ' + keys.join(',') : ''}`
  })
  return { name, module, block: `  ${name} {\n${rows.join('\n')}\n  }` }
})
const moduleByName = Object.fromEntries(entities.map((e) => [e.name, e.module]))

// ── Relationships (deduped) ───────────────────────────────────────────────────
const seen = new Set()
const edges = []
for (const { model } of list) {
  for (const assoc of Object.values(model.associations)) {
    const type = assoc.associationType
    const src = model.name
    const tgt = assoc.target.name
    const fk = assoc.foreignKey || (assoc.options && assoc.options.foreignKey) || ''
    let parent, child, conn, label, key
    if (type === 'BelongsTo') {
      parent = tgt; child = src; conn = '||--o{'; label = fk || assoc.as; key = `1N|${parent}|${child}|${fk}`
    } else if (type === 'HasMany') {
      parent = src; child = tgt; conn = '||--o{'; label = fk || assoc.as; key = `1N|${parent}|${child}|${fk}`
    } else if (type === 'HasOne') {
      parent = src; child = tgt; conn = '||--||'; label = fk || assoc.as; key = `11|${parent}|${child}|${fk}`
    } else if (type === 'BelongsToMany') {
      const through = assoc.through && assoc.through.model ? assoc.through.model.name : ''
      const [a, b] = [src, tgt].sort()
      parent = a; child = b; conn = '}o--o{'; label = through || assoc.as; key = `NN|${a}|${b}|${through}`
    } else {
      continue
    }
    if (seen.has(key)) continue
    seen.add(key)
    const safeLabel = String(label || 'rel').replace(/[^A-Za-z0-9_]/g, '_').slice(0, 40) || 'rel'
    edges.push({ parent, child, conn, label: safeLabel })
  }
}

const modules = [...new Set(entities.map((e) => e.module))].sort((a, b) => a.localeCompare(b))

const PAYLOAD = JSON.stringify({
  entities: entities.map((e) => ({ name: e.name, module: e.module, block: e.block })),
  edges,
  moduleByName,
  modules: modules.map((m) => ({ name: m, count: entities.filter((e) => e.module === m).length })),
})

const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>ER Diagram — starter-saas</title>
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
  <h1>ER Diagram — starter-saas</h1>
  <span class="meta"><b id="ecount">${entities.length}</b> entities · <b id="rcount">${edges.length}</b> relationships</span>
  <div class="toolbar">
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
    er:{ useMaxWidth:false, layoutDirection:'TB', entityPadding:12 } });

  const selected = new Set(DATA.modules.map(m => m.name));
  let pz = null, rid = 0;

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

  function buildSource() {
    const ents = DATA.entities.filter(e => selected.has(e.module));
    const names = new Set(ents.map(e => e.name));
    const eds = DATA.edges.filter(e => names.has(e.parent) && names.has(e.child));
    document.getElementById('ecount').textContent = ents.length;
    document.getElementById('rcount').textContent = eds.length;
    if (!ents.length) return null;
    return 'erDiagram\\n' + ents.map(e => e.block).join('\\n') + '\\n' +
      eds.map(e => '  ' + e.parent + ' ' + e.conn + ' ' + e.child + ' : ' + e.label).join('\\n');
  }

  async function render() {
    const status = document.getElementById('status');
    const src = buildSource();
    const el = document.getElementById('mmd');
    if (!src) { el.innerHTML = ''; status.style.display='block'; status.textContent = 'No modules selected.'; return; }
    status.style.display='block'; status.textContent = 'Rendering…';
    try {
      const { svg, bindFunctions } = await mermaid.render('er' + (++rid), src);
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
  document.getElementById('zin').onclick = () => pz && pz.zoomIn();
  document.getElementById('zout').onclick = () => pz && pz.zoomOut();
  document.getElementById('zreset').onclick = () => { if (pz) { pz.resetZoom(); pz.fit(); pz.center(); } };

  render();
</script>
</body>
</html>`

const outPath = path.resolve(__dirname, '..', 'docs', 'ER-schema.html')
fs.writeFileSync(outPath, html, 'utf8')
console.log(`Wrote ${outPath}`)
console.log(`Entities: ${entities.length}  Modules: ${modules.length}  Relationships: ${edges.length}`)
