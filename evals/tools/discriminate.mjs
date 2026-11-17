#!/usr/bin/env node
// Discrimination test (protocol change PC-1, evals/discrimination.md): real reference screens mixed
// with generated ones; a rubric-free judge says which are real Google products. Prepared, not run:
// the CLI refuses to start without --owner-approved.
//   node evals/tools/discriminate.mjs --run-id <id> --owner-approved [--seed <n>]
import { existsSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseRefName } from './calibrate.mjs';

export const CUES = ['design', 'brand', 'content', 'language', 'system-ui', 'rendering', 'other'];
export const WIDTH = { phone: 1080, desktop: 1440 };

export function formFactorOf({ ref, viewport }) {
  if (ref) return parseRefName(ref)?.platform === 'web' ? 'desktop' : 'phone';
  return String(viewport).startsWith('1440') ? 'desktop' : 'phone';
}

function rng(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function shuffle(xs, rand) {
  const a = [...xs];
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rand() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
  return a;
}

// references: owner reference file names. generated: [{cell, file, theme, viewport}].
export function selectMix({ references, generated, seed }) {
  const rand = rng(seed);
  const real = references.map(name => ({ source: 'real', origin: name, file: name, formFactor: formFactorOf({ ref: name }), theme: parseRefName(name).theme }));
  const want = {};
  for (const r of real) want[`${r.formFactor}/${r.theme}`] = (want[`${r.formFactor}/${r.theme}`] ?? 0) + 1;
  const used = new Set();
  const made = [];
  const shortfall = [];
  // Least slack (cells available minus images wanted) first, so the one-image-per-cell rule spends
  // cells where they are needed most.
  const poolOf = b => generated.filter(g => `${formFactorOf(g)}/${g.theme}` === b);
  const slack = b => new Set(poolOf(b).map(g => g.cell)).size - want[b];
  const order = Object.keys(want).sort().sort((x, y) => slack(x) - slack(y));
  for (const bucket of order) {
    const [formFactor, theme] = bucket.split('/');
    const pool = shuffle(poolOf(bucket), rand);
    let n = 0;
    for (const g of pool) {
      if (n === want[bucket]) break;
      if (used.has(g.cell)) continue;
      used.add(g.cell);
      made.push({ source: 'generated', origin: g.cell, cell: g.cell, file: g.file, formFactor, theme });
      n++;
    }
    if (n < want[bucket]) shortfall.push({ bucket, missing: want[bucket] - n });
  }
  const ids = new Set();
  const abc = 'abcdefghijklmnopqrstuvwxyz0123456789';
  const newId = () => { let s; do { s = Array.from({ length: 6 }, () => abc[Math.floor(rand() * abc.length)]).join(''); } while (ids.has(s)); ids.add(s); return s; };
  const items = shuffle([...real, ...made], rand).map(i => ({ id: newId(), ...i }));
  return { seed, items, shortfall };
}

export function discriminationPrompt({ ids, root }) {
  const md = readFileSync(join(root, 'evals', 'discrimination.md'), 'utf8');
  const m = md.match(/````text\r?\n([\s\S]*?)\r?\n````/);
  if (!m) throw new Error('discrimination.md has no prompt block');
  return m[1].replace('{{IDS}}', ids.join(', '));
}

export function validateVerdicts(text, ids) {
  let arr;
  try { const s = String(text); arr = JSON.parse(s.slice(s.indexOf('['), s.lastIndexOf(']') + 1)); } catch { arr = null; }
  if (!Array.isArray(arr)) return { ok: false, problems: ['reply is not a JSON array'], verdicts: null };
  const problems = [];
  const seen = new Set();
  for (const e of arr) {
    if (!ids.includes(e?.id)) problems.push(`unknown id: ${e?.id}`);
    if (seen.has(e?.id)) problems.push(`duplicate ${e?.id}`);
    seen.add(e?.id);
    if (!['real', 'generated'].includes(e?.verdict)) problems.push(`bad verdict for ${e?.id}`);
    if (typeof e?.pReal !== 'number' || !(e.pReal >= 0 && e.pReal <= 1)) problems.push(`bad pReal for ${e?.id}`);
    if (!CUES.includes(e?.cue)) problems.push(`bad cue for ${e?.id}`);
    if (typeof e?.reason !== 'string' || !e.reason.trim()) problems.push(`no reason for ${e?.id}`);
  }
  for (const id of ids) if (!seen.has(id)) problems.push(`missing ${id}`);
  return problems.length ? { ok: false, problems, verdicts: null } : { ok: true, problems: [], verdicts: arr };
}

// truth: id → 'real' | 'generated'.
export function scoreDiscrimination(verdicts, truth) {
  const rate = xs => (xs.length ? xs.filter(v => v.verdict === truth[v.id]).length / xs.length : null);
  const real = verdicts.filter(v => truth[v.id] === 'real');
  const made = verdicts.filter(v => truth[v.id] === 'generated');
  let pairs = 0;
  let wins = 0;
  for (const r of real) for (const g of made) { pairs++; wins += r.pReal > g.pReal ? 1 : r.pReal === g.pReal ? 0.5 : 0; }
  const byCue = {};
  for (const v of verdicts) {
    const c = (byCue[v.cue] ??= { n: 0, correct: 0 });
    c.n++;
    if (v.verdict === truth[v.id]) c.correct++;
  }
  return { n: verdicts.length, accuracy: rate(verdicts), realRecall: rate(real), generatedRecall: rate(made), auc: pairs ? wins / pairs : null, byCue };
}

// Re-renders an image at a fixed width in headless Chromium; the PNG it writes has no metadata.
async function normalize(browser, src, dst, width) {
  const page = await browser.newPage({ viewport: { width, height: 100 }, deviceScaleFactor: 1 });
  await page.setContent(`<html><body style="margin:0"><img id="i" style="display:block;width:${width}px" src="data:image/png;base64,${readFileSync(src).toString('base64')}"></body></html>`);
  await page.waitForFunction(() => document.getElementById('i').complete);
  await page.locator('#i').screenshot({ path: dst });
  await page.close();
}

async function main() {
  const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
  const arg = k => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : null; };
  if (!process.argv.includes('--owner-approved')) {
    console.error('PC-1 is prepared but not approved. Run it only after the owner decides, with --owner-approved.');
    process.exit(2);
  }
  const runId = arg('--run-id');
  const seed = Number(arg('--seed') ?? Date.now() % 2 ** 31);
  const runDir = join(root, 'private', 'evals', 'runs', runId ?? '');
  if (!runId || !existsSync(join(runDir, 'summary.json'))) { console.error('usage: --run-id <finished run with summary.json>'); process.exit(2); }
  const refDir = join(root, 'private', 'reference-screenshots');
  const references = readdirSync(refDir).filter(n => parseRefName(n));
  const generated = [];
  for (const cell of readdirSync(runDir)) {
    const cap = join(runDir, cell, 'capture.json');
    if (!existsSync(cap)) continue;
    for (const s of JSON.parse(readFileSync(cap, 'utf8')).shots ?? []) {
      const file = join(runDir, cell, 'shots', s.file.split(/[\\/]/).pop());
      if (existsSync(file)) generated.push({ cell, file, theme: s.theme, viewport: s.viewport ?? `${s.width}x${s.height}` });
    }
  }
  const mix = selectMix({ references, generated, seed });
  const outId = `pc1-${runId}-${seed}`;
  const judgeDir = join('C:\\m3-eval', 'judge-in', outId);
  rmSync(judgeDir, { recursive: true, force: true });
  mkdirSync(judgeDir, { recursive: true });
  // Playwright reads PLAYWRIGHT_BROWSERS_PATH on first import: the toolchain's Chromium, as in harness/web.
  process.env.PLAYWRIGHT_BROWSERS_PATH = (await import('./toolchain-env.mjs')).withToolchain(process.env).PLAYWRIGHT_BROWSERS_PATH;
  const { chromium } = await import('playwright');
  const browser = await chromium.launch();
  for (const it of mix.items) await normalize(browser, it.source === 'real' ? join(refDir, it.file) : it.file, join(judgeDir, `${it.id}.png`), WIDTH[it.formFactor]);
  await browser.close();
  writeFileSync(join(judgeDir, 'views.json'), JSON.stringify(Object.fromEntries(mix.items.map(i => [i.id, [{ file: `${i.id}.png` }]])), null, 2));
  const priv = join(root, 'private', 'evals', 'runs', outId);
  mkdirSync(priv, { recursive: true });
  writeFileSync(join(priv, 'mapping.json'), JSON.stringify(mix, null, 2));
  const ids = mix.items.map(i => i.id);
  const { runJudgeBatch } = await import('./judge.mjs');
  const { probeBuiltIns } = await import('./isolation.mjs');
  const r = await runJudgeBatch({ judgeDir, ids, root, batchId: outId, builtIns: probeBuiltIns(),
    prompt: discriminationPrompt({ ids, root }), validate: text => { const v = validateVerdicts(text, ids); return { ...v, scores: v.verdicts }; } });
  const truth = Object.fromEntries(mix.items.map(i => [i.id, i.source]));
  const result = r.ok ? scoreDiscrimination(r.scores, truth) : null;
  writeFileSync(join(priv, 'result.json'), JSON.stringify({ runId, seed, shortfall: mix.shortfall, judge: { ok: r.ok, attempts: r.attempts, log: r.log }, result, verdicts: r.scores }, null, 2));
  console.log(JSON.stringify({ ok: r.ok, shortfall: mix.shortfall, result }, null, 1));
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) await main();
