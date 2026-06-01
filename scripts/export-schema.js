/**
 * export-schema.js — introspect the live Sequelize model registry and emit
 * a self-contained schema.html documenting every table, its columns, and the
 * relations between them — grouped and filterable by module.
 * Run from the repo root:  node scripts/export-schema.js
 */
const path = require('path')
const fs = require('fs')
const { introspect } = require('./_introspect')

const ASSOC_LABEL = {
  BelongsTo: 'belongsTo (N:1)',
  HasMany: 'hasMany (1:N)',
  HasOne: 'hasOne (1:1)',
  BelongsToMany: 'belongsToMany (M:N)',
}

function esc(s) {
  return String(s == null ? '' : s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

const list = introspect()

function attrType(attr) {
  try {
    return attr.type && attr.type.toString ? attr.type.toString() : String(attr.type)
  } catch {
    return String(attr.type)
  }
}

function columnsOf(model) {
  return Object.entries(model.getAttributes()).map(([field, a]) => {
    const flags = []
    if (a.primaryKey) flags.push('PK')
    if (a.references) flags.push('FK')
    if (a.unique) flags.push('UNIQUE')
    if (a.allowNull === false) flags.push('NOT NULL')
    if (a.autoIncrement) flags.push('AUTO')
    let def = a.defaultValue
    if (def && typeof def === 'object') def = def.constructor ? def.constructor.name : String(def)
    const ref = a.references ? `${a.references.model}.${a.references.key || 'id'}` : ''
    return {
      field: a.field || field, type: attrType(a), flags,
      default: def === undefined ? '' : def, ref, comment: a.comment || '',
    }
  })
}

function relationsOf(model) {
  return Object.entries(model.associations).map(([as, assoc]) => ({
    type: ASSOC_LABEL[assoc.associationType] || assoc.associationType,
    target: assoc.target.name, as,
    fk: assoc.foreignKey || (assoc.options && assoc.options.foreignKey) || '',
    through: assoc.through && assoc.through.model ? assoc.through.model.name : '',
  }))
}

const data = list.map(({ name, model, module }) => ({
  name, module, table: model.tableName,
  columns: columnsOf(model), relations: relationsOf(model),
}))

// ── Group by module ───────────────────────────────────────────────────────────
const modules = [...new Set(data.map((d) => d.module))]
  .sort((a, b) => a.localeCompare(b))
const byModule = modules.map((mod) => ({ mod, items: data.filter((d) => d.module === mod) }))
const modId = (m) => 'mod-' + m.replace(/[^A-Za-z0-9]+/g, '-')

// ── Render ────────────────────────────────────────────────────────────────────
const flagBadge = (f) => `<span class="flag flag-${f.replace(/\s+/g, '-').toLowerCase()}">${esc(f)}</span>`

const chipsHtml = modules.map((m) =>
  `<button class="chip active" data-mod="${esc(m)}">${esc(m)}<i>${data.filter((d) => d.module === m).length}</i></button>`
).join('\n')

const tocHtml = byModule.map(({ mod, items }) => `
    <div class="toc-group" data-mod-group="${esc(mod)}">
      <h4>${esc(mod)} <span>${items.length}</span></h4>
      ${items.map((d) => `<a href="#${esc(d.name)}" data-name="${esc(d.name).toLowerCase()}">${esc(d.name)}<small>${esc(d.table)}</small></a>`).join('\n      ')}
    </div>`).join('\n')

const sectionsHtml = byModule.map(({ mod, items }) => `
    <div class="module-block" data-mod-block="${esc(mod)}">
      <h2 class="module-head" id="${modId(mod)}">${esc(mod)} <span>${items.length} table${items.length > 1 ? 's' : ''}</span></h2>
${items.map((d) => {
  const colRows = d.columns.map((c) => `
          <tr>
            <td class="col-name">${esc(c.field)}</td>
            <td class="col-type">${esc(c.type)}</td>
            <td class="col-flags">${c.flags.map(flagBadge).join(' ')}</td>
            <td class="col-ref">${c.ref ? `<a href="#${esc(c.ref.split('.')[0])}">${esc(c.ref)}</a>` : ''}</td>
            <td class="col-default">${esc(c.default)}</td>
            <td class="col-comment">${esc(c.comment)}</td>
          </tr>`).join('')
  const relRows = d.relations.length
    ? d.relations.map((r) => `
          <tr>
            <td class="rel-type">${esc(r.type)}</td>
            <td><a href="#${esc(r.target)}">${esc(r.target)}</a></td>
            <td class="rel-as">${esc(r.as)}</td>
            <td class="rel-fk">${esc(r.fk)}</td>
            <td class="rel-through">${r.through ? `<a href="#${esc(r.through)}">${esc(r.through)}</a>` : ''}</td>
          </tr>`).join('')
    : `<tr><td colspan="5" class="empty">— no associations —</td></tr>`
  return `
      <section class="model" id="${esc(d.name)}" data-name="${esc(d.name).toLowerCase()}" data-mod="${esc(d.module)}">
        <h3 class="model-head">${esc(d.name)} <span class="tablename">${esc(d.table)}</span> <span class="modtag">${esc(d.module)}</span></h3>
        <h5>Columns <span class="count">${d.columns.length}</span></h5>
        <table class="cols">
          <thead><tr><th>Column</th><th>Type</th><th>Constraints</th><th>References</th><th>Default</th><th>Comment</th></tr></thead>
          <tbody>${colRows}
          </tbody>
        </table>
        <h5>Relations <span class="count">${d.relations.length}</span></h5>
        <table class="rels">
          <thead><tr><th>Kind</th><th>Target</th><th>As</th><th>Foreign Key</th><th>Through</th></tr></thead>
          <tbody>${relRows}
          </tbody>
        </table>
        <a class="totop" href="#top">↑ top</a>
      </section>`
}).join('\n')}
    </div>`).join('\n')

const totalCols = data.reduce((n, d) => n + d.columns.length, 0)
const totalRels = data.reduce((n, d) => n + d.relations.length, 0)

const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Database Schema — starter-saas</title>
<style>
  :root { --indigo:#4f46e5; --indigo-d:#3730a3; --slate-50:#f8fafc; --slate-100:#f1f5f9;
    --slate-200:#e2e8f0; --slate-300:#cbd5e1; --slate-500:#64748b; --slate-700:#334155;
    --slate-900:#0f172a; --sky:#0284c7; }
  * { box-sizing:border-box; }
  body { margin:0; font-family:Inter,system-ui,-apple-system,Segoe UI,Roboto,sans-serif;
    color:var(--slate-900); background:var(--slate-50); line-height:1.5; }
  header { background:var(--indigo); color:#fff; padding:24px 32px; }
  header h1 { margin:0 0 6px; font-size:24px; }
  header p { margin:0; opacity:.85; font-size:14px; }
  .stats { display:flex; gap:20px; margin-top:14px; }
  .stat { background:rgba(255,255,255,.15); padding:8px 16px; border-radius:8px; }
  .stat b { display:block; font-size:22px; } .stat span { font-size:12px; opacity:.85; }
  .controls { position:sticky; top:0; z-index:5; background:#fff; border-bottom:1px solid var(--slate-200);
    padding:12px 32px; display:flex; flex-direction:column; gap:10px; }
  .controls .row1 { display:flex; gap:12px; align-items:center; flex-wrap:wrap; }
  #search { flex:1; min-width:220px; padding:8px 12px; border:1px solid var(--slate-300); border-radius:8px; font-size:14px; }
  .ctl-btn { padding:6px 12px; border:1px solid var(--slate-300); background:var(--slate-50); border-radius:8px;
    font-size:13px; cursor:pointer; color:var(--slate-700); }
  .ctl-btn:hover { background:var(--slate-100); }
  .chips { display:flex; flex-wrap:wrap; gap:6px; }
  .chip { display:inline-flex; align-items:center; gap:6px; padding:4px 10px; border-radius:999px;
    border:1px solid var(--slate-300); background:#fff; color:var(--slate-500); font-size:12px; cursor:pointer; }
  .chip i { font-style:normal; background:var(--slate-100); border-radius:999px; padding:0 6px; font-size:11px; }
  .chip.active { background:var(--indigo); border-color:var(--indigo); color:#fff; }
  .chip.active i { background:rgba(255,255,255,.25); color:#fff; }
  .layout { display:grid; grid-template-columns:280px 1fr; align-items:start; }
  nav { position:sticky; top:118px; max-height:calc(100vh - 118px); overflow:auto; padding:16px 12px;
    border-right:1px solid var(--slate-200); background:#fff; }
  .toc-group h4 { margin:14px 0 6px; font-size:11px; text-transform:uppercase; letter-spacing:.05em;
    color:var(--indigo-d); display:flex; justify-content:space-between; }
  .toc-group h4 span { color:var(--slate-300); }
  nav a { display:flex; justify-content:space-between; align-items:center; gap:8px; padding:4px 10px;
    border-radius:6px; color:var(--slate-700); text-decoration:none; font-size:13px; }
  nav a:hover { background:var(--slate-100); color:var(--indigo-d); }
  nav a small { color:var(--slate-300); font-size:11px; font-family:ui-monospace,monospace; }
  main { padding:20px 32px 80px; max-width:1100px; }
  .module-head { font-size:20px; color:var(--indigo-d); border-bottom:2px solid var(--slate-200);
    padding-bottom:8px; margin:28px 0 16px; scroll-margin-top:128px; }
  .module-head span { font-size:13px; color:var(--slate-500); font-weight:500; }
  .model { background:#fff; border:1px solid var(--slate-200); border-radius:12px; padding:18px 20px;
    margin-bottom:20px; box-shadow:0 1px 2px rgba(15,23,42,.04); scroll-margin-top:128px; }
  .model-head { margin:0 0 12px; font-size:18px; display:flex; align-items:center; gap:10px; flex-wrap:wrap; }
  .tablename { font-family:ui-monospace,monospace; font-size:12px; color:var(--slate-500);
    background:var(--slate-100); padding:2px 8px; border-radius:6px; font-weight:500; }
  .modtag { font-size:11px; color:var(--indigo); background:#eef2ff; padding:2px 8px; border-radius:6px; margin-left:auto; }
  .model h5 { font-size:12px; text-transform:uppercase; letter-spacing:.04em; color:var(--slate-500);
    margin:16px 0 8px; display:flex; align-items:center; gap:8px; }
  .count { background:var(--slate-100); color:var(--slate-700); border-radius:10px; padding:0 8px; font-size:11px; font-weight:600; }
  table { width:100%; border-collapse:collapse; font-size:13px; }
  th { text-align:left; font-weight:600; color:var(--slate-500); font-size:11px; text-transform:uppercase;
    letter-spacing:.03em; padding:6px 10px; border-bottom:2px solid var(--slate-200); }
  td { padding:6px 10px; border-bottom:1px solid var(--slate-100); vertical-align:top; }
  tr:last-child td { border-bottom:none; }
  .col-name { font-family:ui-monospace,monospace; font-weight:600; }
  .col-type { font-family:ui-monospace,monospace; color:var(--sky); font-size:12px; }
  .col-comment { color:var(--slate-500); font-size:12px; max-width:280px; }
  .col-default, .col-ref, .rel-fk, .rel-as, .rel-through { font-family:ui-monospace,monospace; font-size:12px; color:var(--slate-700); }
  a { color:var(--indigo); text-decoration:none; } a:hover { text-decoration:underline; }
  .flag { display:inline-block; font-size:10px; font-weight:700; padding:1px 6px; border-radius:5px; margin:1px 0; }
  .flag-pk { background:#fef3c7; color:#92400e; } .flag-fk { background:#dbeafe; color:#1e40af; }
  .flag-unique { background:#ede9fe; color:#5b21b6; } .flag-not-null { background:#fee2e2; color:#991b1b; }
  .flag-auto { background:#dcfce7; color:#166534; }
  .rel-type { font-weight:600; color:var(--indigo-d); white-space:nowrap; }
  .empty { color:var(--slate-300); text-align:center; font-style:italic; }
  .totop { display:inline-block; margin-top:10px; font-size:12px; color:var(--slate-500); }
  .hidden { display:none !important; }
  #nomatch { display:none; padding:40px; text-align:center; color:var(--slate-500); }
  @media (max-width:860px){ .layout{ grid-template-columns:1fr; } nav{ position:static; max-height:none; } }
</style>
</head>
<body>
<a id="top"></a>
<header>
  <h1>Database Schema — starter-saas</h1>
  <p>Sequelize model registry · grouped by module · generated ${new Date().toISOString().slice(0, 19).replace('T', ' ')} UTC</p>
  <div class="stats">
    <div class="stat"><b>${data.length}</b><span>Tables</span></div>
    <div class="stat"><b>${modules.length}</b><span>Modules</span></div>
    <div class="stat"><b>${totalCols}</b><span>Columns</span></div>
    <div class="stat"><b>${totalRels}</b><span>Relations</span></div>
  </div>
</header>
<div class="controls">
  <div class="row1">
    <input id="search" type="search" placeholder="Filter tables by name…" autocomplete="off">
    <button class="ctl-btn" id="all">Select all</button>
    <button class="ctl-btn" id="none">Clear</button>
  </div>
  <div class="chips">${chipsHtml}</div>
</div>
<div class="layout">
  <nav id="toc">${tocHtml}
  </nav>
  <main>
${sectionsHtml}
    <div id="nomatch">No tables match the current filter.</div>
  </main>
</div>
<script>
  const chips = [...document.querySelectorAll('.chip')];
  const search = document.getElementById('search');
  const models = [...document.querySelectorAll('.model')];
  const tocLinks = [...document.querySelectorAll('#toc a')];
  const tocGroups = [...document.querySelectorAll('.toc-group')];
  const blocks = [...document.querySelectorAll('.module-block')];

  function activeMods() { return new Set(chips.filter(c => c.classList.contains('active')).map(c => c.dataset.mod)); }

  function apply() {
    const mods = activeMods();
    const q = search.value.trim().toLowerCase();
    let any = false;
    for (const el of models) {
      const ok = mods.has(el.dataset.mod) && (!q || el.dataset.name.includes(q));
      el.classList.toggle('hidden', !ok);
      if (ok) any = true;
    }
    for (const a of tocLinks) {
      const ok = !a.closest('.toc-group').classList.contains('mod-off') && (!q || a.dataset.name.includes(q));
      a.classList.toggle('hidden', !ok);
    }
    for (const b of blocks) b.classList.toggle('hidden', !mods.has(b.dataset.modBlock) ||
      ![...b.querySelectorAll('.model')].some(m => !m.classList.contains('hidden')));
    for (const g of tocGroups) {
      g.classList.toggle('mod-off', !mods.has(g.dataset.modGroup));
      const vis = [...g.querySelectorAll('a')].some(a => !a.classList.contains('hidden'));
      g.classList.toggle('hidden', !mods.has(g.dataset.modGroup) || !vis);
    }
    document.getElementById('nomatch').style.display = any ? 'none' : 'block';
  }

  chips.forEach(c => c.addEventListener('click', () => { c.classList.toggle('active'); apply(); }));
  document.getElementById('all').onclick = () => { chips.forEach(c => c.classList.add('active')); apply(); };
  document.getElementById('none').onclick = () => { chips.forEach(c => c.classList.remove('active')); apply(); };
  search.addEventListener('input', apply);
  apply();
</script>
</body>
</html>`

const outPath = path.resolve(__dirname, '..', 'schema.html')
fs.writeFileSync(outPath, html, 'utf8')
console.log(`Wrote ${outPath}`)
console.log(`Tables: ${data.length}  Modules: ${modules.length}  Columns: ${totalCols}  Relations: ${totalRels}`)
