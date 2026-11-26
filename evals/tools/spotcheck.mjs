#!/usr/bin/env node
// Owner visual sign-off (plan "Owner visual sign-off", bar line 4): one local page with the drawn sample
// (per platform one default, the classic, the seed and one hold-out cell), each output in light and dark
// next to the owner's reference screenshots of the same screen type, with the judge medians beside it.
// The owner marks pass / fail with a note per sample. Private: it shows the owner's references.
//   node evals/tools/spotcheck.mjs build            writes private/evals/runs/p4-final/spotcheck.html
//   node evals/tools/spotcheck.mjs serve [--port n] serves it on 127.0.0.1; "Save" writes
//                                                   private/evals/runs/p4-final/spotcheck-verdicts.json
// Opened as a file (no server), "Save" downloads spotcheck-verdicts.json to put next to the page.
import { createServer } from 'node:http';
import { existsSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { basename, dirname, extname, join, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { allCells } from './cells.mjs';
import { parseRefName } from './calibrate.mjs';
import { cellTarget, familyOf, SCREENS } from './pairing.mjs';
import { spotcheckSample } from './phase4.mjs';
import { shotsOfRecord } from './pooled3.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const priv = join(root, 'private');
const runs = join(priv, 'evals', 'runs');
const pageDir = join(runs, 'p4-final');
export const VERDICTS = join(pageDir, 'spotcheck-verdicts.json');
const POOL = join(runs, 'pooled3-p4-step4', 'summary.json');

// Up to two references per theme for a cell: same platform family, closest screen type first.
export function referencesFor(cell, names) {
  const t = cellTarget(cell);
  const want = SCREENS[t.screen] ?? [t.screen];
  const scored = names.map((n) => ({ n, r: parseRefName(n) })).filter((x) => x.r && familyOf(x.r.platform) === t.family)
    .map((x) => ({ ...x, s: (want.indexOf(x.r.screen) >= 0 ? 20 - want.indexOf(x.r.screen) : 0) }))
    .sort((a, b) => b.s - a.s || a.n.localeCompare(b.n));
  return ['light', 'dark'].flatMap((th) => scored.filter((x) => x.r.theme === th).slice(0, 2).map((x) => x.n));
}

const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);

export function buildPage() {
  const cells = Object.fromEntries(allCells().map((c) => [c.cell, c]));
  const sample = spotcheckSample();
  const refNames = readdirSync(join(priv, 'reference-screenshots')).filter((n) => parseRefName(n));
  const pool = existsSync(POOL) ? JSON.parse(readFileSync(POOL, 'utf8')) : { rows: [] };
  const med = (runId, cell) => pool.rows.find((r) => r.runId === runId && r.cell === cell)?.median ?? null;
  const items = [];
  for (const [platform, kinds] of Object.entries(sample)) {
    for (const [kind, id] of Object.entries(kinds)) {
      if (!id) continue;
      const run = kind === 'holdout' ? 'p4-h1' : 'p4-final';
      const { shots } = shotsOfRecord(join(runs, run), id);
      const order = (s) => `${s.theme === 'light' ? 0 : 1}-${s.viewport ?? ''}`;
      items.push({ platform, kind, cell: id, run,
        shots: shots.sort((a, b) => order(a).localeCompare(order(b))).map((s) => ({ src: `../${run}/${id}/shots/${basename(s.file)}`.replace(`../p4-final/`, ''), label: `${s.theme} ${s.viewport ?? ''}` })),
        refs: referencesFor(cells[id], refNames).map((n) => ({ src: `../../../reference-screenshots/${n}`, label: n })),
        final: med(run, id), baseline: kind === 'holdout' ? null : med('baseline-2026-11-17', id) });
    }
  }
  const ITEMS = items.find((i) => i.final)?.final ? Object.keys(items.find((i) => i.final).final) : [];
  const scoreTable = (it) => !it.final ? '<p class="muted">No judge medians found.</p>' : `<table><thead><tr><th scope="col">item</th>${it.baseline ? '<th scope="col">baseline</th>' : ''}<th scope="col">with skill</th></tr></thead><tbody>${
    ITEMS.map((k) => `<tr><th scope="row">${esc(k)}</th>${it.baseline ? `<td>${it.baseline[k] ?? '—'}</td>` : ''}<td class="${(it.final[k] ?? 3) < 2 ? 'low' : ''}">${it.final[k] ?? '—'}</td></tr>`).join('')}</tbody></table>`;
  const figure = (f, ref) => `<figure${ref ? ' class="ref"' : ''}><img loading="lazy" src="${esc(f.src)}" alt="${esc((ref ? 'Reference ' : 'Output ') + f.label)}"><figcaption>${ref ? 'REFERENCE ' : ''}${esc(f.label)}</figcaption></figure>`;
  const html = `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>Spot-check p4-final</title>
<style>
:root{color-scheme:light dark;--bg:#f7f7f8;--fg:#17181a;--muted:#5b5e66;--card:#fff;--line:#d6d8dd;--ref:#0b6b3a;--low:#b3261e;--accent:#3b5bdb}
@media (prefers-color-scheme:dark){:root{--bg:#121316;--fg:#e6e7ea;--muted:#a3a7b0;--card:#1b1c20;--line:#33363d;--ref:#6fd3a0;--low:#ffb4ab;--accent:#9db1ff}}
*{box-sizing:border-box}body{margin:0;font:15px/1.45 system-ui,sans-serif;background:var(--bg);color:var(--fg)}
header{position:sticky;top:0;z-index:2;background:var(--bg);border-bottom:1px solid var(--line);padding:12px 16px;display:flex;flex-wrap:wrap;gap:12px;align-items:center}
header h1{font-size:18px;margin:0;flex:1 1 240px}main{padding:16px;max-width:1600px;margin:0 auto}
.muted{color:var(--muted)}section{background:var(--card);border:1px solid var(--line);border-radius:12px;padding:16px;margin:0 0 20px}
section h2{margin:0 0 4px;font-size:17px}.row{display:flex;gap:12px;overflow-x:auto;padding:8px 0;align-items:flex-start}
figure{margin:0;flex:none}figure img{height:min(560px,70vh);max-width:none;border:1px solid var(--line);border-radius:6px;display:block}
figcaption{font-size:12px;color:var(--muted);margin-top:4px}.ref figcaption{color:var(--ref)}
.grid{display:grid;grid-template-columns:minmax(0,1fr) 260px;gap:16px}@media (max-width:900px){.grid{grid-template-columns:1fr}}
table{border-collapse:collapse;font-size:13px;width:100%}th,td{text-align:left;padding:3px 6px;border-bottom:1px solid var(--line)}td.low{color:var(--low);font-weight:600}
fieldset{border:1px solid var(--line);border-radius:8px;margin:12px 0 0;padding:8px 12px}label{margin-right:16px}textarea{width:100%;min-height:60px;font:inherit;margin-top:8px;background:var(--bg);color:var(--fg);border:1px solid var(--line);border-radius:6px;padding:6px}
button{font:inherit;padding:8px 16px;border-radius:20px;border:0;background:var(--accent);color:#fff;cursor:pointer}@media (prefers-color-scheme:dark){button{color:#10173a}}
#status{min-width:200px}
</style></head><body>
<header><h1>Spot-check: final skill outputs vs. references</h1><span id="progress" class="muted"></span><button type="button" id="save">Save verdicts</button><span id="status" role="status" aria-live="polite" class="muted"></span></header>
<main>
<p class="muted">Bar line 4 (owner visual sign-off). Sample drawn with the seed recorded in step 0: per platform one default cell, the classic cell, the seed cell and one hold-out cell. Green captions are your reference screenshots. Mark each sample pass or fail; where your verdict differs from the judge, the note goes to rubric calibration. Saved to <code>spotcheck-verdicts.json</code> next to this page.</p>
${items.map((it, i) => `<section id="s${i}" data-cell="${esc(it.cell)}">
<h2>${esc(it.platform)} · ${esc(it.kind)} · <code>${esc(it.cell)}</code></h2>
<div class="grid"><div>
<div class="row">${it.shots.map((s) => figure(s, false)).join('')}</div>
<div class="row">${it.refs.map((s) => figure(s, true)).join('')}</div>
</div><aside><h3 class="muted" style="font-size:13px;margin:0 0 6px">Judge medians (three sessions)</h3>${scoreTable(it)}</aside></div>
<fieldset><legend>Verdict</legend>
<label><input type="radio" name="v${i}" value="pass"> pass</label><label><input type="radio" name="v${i}" value="fail"> fail</label>
<textarea aria-label="Note for ${esc(it.cell)}" placeholder="Note (what is wrong, or why it passes)"></textarea></fieldset>
</section>`).join('\n')}
</main>
<script>
const sections=[...document.querySelectorAll('section[data-cell]')];
const served=location.protocol.startsWith('http');
function collect(){const v={};for(const s of sections){const r=s.querySelector('input[type=radio]:checked');v[s.dataset.cell]={verdict:r?r.value:null,note:s.querySelector('textarea').value.trim()};}return v;}
function progress(){const v=collect();const done=Object.values(v).filter(x=>x.verdict).length;document.getElementById('progress').textContent=done+' / '+sections.length+' marked';}
function apply(v){for(const s of sections){const x=v[s.dataset.cell];if(!x)continue;if(x.verdict){const r=s.querySelector('input[value='+x.verdict+']');if(r)r.checked=true;}s.querySelector('textarea').value=x.note||'';}progress();}
const KEY='m3-spotcheck-p4-final';
try{const d=localStorage.getItem(KEY);if(d)apply(JSON.parse(d));}catch(e){}
if(served)fetch('verdicts').then(r=>r.ok?r.json():null).then(d=>{if(d&&d.verdicts)apply(d.verdicts);}).catch(()=>{});
document.addEventListener('input',()=>{progress();try{localStorage.setItem(KEY,JSON.stringify(collect()));}catch(e){}});
document.getElementById('save').addEventListener('click',async()=>{
  const body=JSON.stringify({page:'p4-final/spotcheck.html',savedAt:new Date().toISOString(),verdicts:collect()},null,2);
  const st=document.getElementById('status');
  if(served){try{const r=await fetch('verdicts',{method:'POST',headers:{'content-type':'application/json'},body});st.textContent=r.ok?'Saved to spotcheck-verdicts.json':'Save failed ('+r.status+')';return;}catch(e){st.textContent='Save failed: '+e.message;return;}}
  const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([body],{type:'application/json'}));a.download='spotcheck-verdicts.json';a.click();st.textContent='Downloaded: put spotcheck-verdicts.json next to this page';
});
progress();
</script></body></html>
`;
  writeFileSync(join(pageDir, 'spotcheck.html'), html);
  return { path: join(pageDir, 'spotcheck.html'), items: items.map(({ platform, kind, cell, shots, refs }) => ({ platform, kind, cell, shots: shots.length, refs: refs.length })) };
}

const TYPES = { '.html': 'text/html; charset=utf-8', '.png': 'image/png', '.json': 'application/json', '.jpg': 'image/jpeg', '.webp': 'image/webp' };
export function serve(port = 8737) {
  const base = resolve(priv);
  const server = createServer((req, res) => {
    const url = new URL(req.url, 'http://127.0.0.1');
    if (url.pathname === '/evals/runs/p4-final/verdicts') {
      if (req.method === 'GET') { res.writeHead(existsSync(VERDICTS) ? 200 : 404, { 'content-type': 'application/json' }); res.end(existsSync(VERDICTS) ? readFileSync(VERDICTS) : '{}'); return; }
      if (req.method === 'POST') {
        let body = '';
        req.on('data', (c) => { body += c; if (body.length > 1e6) req.destroy(); });
        req.on('end', () => { try { const j = JSON.parse(body); writeFileSync(VERDICTS, `${JSON.stringify(j, null, 2)}\n`); res.writeHead(200); res.end('ok'); } catch { res.writeHead(400); res.end('bad json'); } });
        return;
      }
    }
    const file = resolve(base, `.${decodeURIComponent(url.pathname)}`);
    if (!file.startsWith(base + sep) || !existsSync(file)) { res.writeHead(404); res.end('not found'); return; }
    res.writeHead(200, { 'content-type': TYPES[extname(file).toLowerCase()] ?? 'application/octet-stream' });
    res.end(readFileSync(file));
  });
  server.listen(port, '127.0.0.1', () => console.log(`spot-check: http://127.0.0.1:${port}/evals/runs/p4-final/spotcheck.html`));
  return server;
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const cmd = process.argv[2];
  if (cmd === 'build') console.log(JSON.stringify(buildPage(), null, 1));
  else if (cmd === 'serve') { buildPage(); const i = process.argv.indexOf('--port'); serve(i > 0 ? Number(process.argv[i + 1]) : 8737); }
  else { console.error('usage: spotcheck.mjs build | serve [--port n]'); process.exit(2); }
}
