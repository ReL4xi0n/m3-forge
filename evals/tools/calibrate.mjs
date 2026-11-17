#!/usr/bin/env node
// Judge calibration (Phase 2 plan, Task 11). The owner's real product screenshots anchor score 3:
// half are shown to the judge as labeled score-3 examples (anchors), half are mixed unlabeled with
// hand-written defect pages (checks). Pass: every applicable item's mean over check references is
// ≥ 2.75 with no reference score below 2, and every defect page scores ≤ its maxScore on its item.
import { ITEMS } from './judge.mjs';

// <platform>-<style>-<screen>-<theme>-<n>.png; platform android | web | webmobile; style is a free label
// (the owner used "m3" and "google"); only "classic" changes the request text.
const REF = /^(android|webmobile|web)-([a-z0-9]+)-(.+)-(light|dark)-(\d+)\.png$/;

export function parseRefName(name) {
  const m = name.match(REF);
  return m ? { platform: m[1], style: m[2], screen: m[3], theme: m[4], n: Number(m[5]) } : null;
}

const side = ref => (ref.platform === 'android' ? 'android' : 'web');

export function splitReferences(names) {
  const refs = names.filter(n => parseRefName(n)).sort();
  if (refs.length < 12) throw new Error(`need at least 12 reference screenshots, found ${refs.length}`);
  const anchors = [];
  const checks = [];
  for (const platform of ['android', 'web']) {
    const list = refs.filter(n => side(parseRefName(n)) === platform).sort((a, b) => {
      const x = parseRefName(a); const y = parseRefName(b);
      return x.screen.localeCompare(y.screen) || x.theme.localeCompare(y.theme) || x.style.localeCompare(y.style) || x.n - y.n;
    });
    list.forEach((n, i) => (i % 2 === 0 ? anchors : checks).push(n));
  }
  return { anchors: anchors.sort(), checks: checks.sort() };
}

const SCREEN = {
  landing: 'A landing page', settings: 'A settings screen', dashboard: 'A dashboard screen',
  'product-detail': 'A product detail page', onboarding: 'An onboarding form', empty: 'An empty state screen',
  error: 'An error state screen', main: 'A main app screen', list: 'A list screen',
  detail: 'A product detail page', form: 'A form screen', signup: 'A sign-up form', app: 'A main app screen',
};

export function referenceRequest(ref) {
  const what = SCREEN[ref.screen] ?? `A ${ref.screen.replace(/-/g, ' ')} screen`;
  const platform = { android: 'Android', web: 'web', webmobile: 'web (mobile width)' }[ref.platform];
  const style = ref.style === 'classic' ? ' Use the classic Material 3 style, not M3 Expressive.' : '';
  return `${what}. Platform: ${platform}.${style}`;
}

// scores: validated judge entries; mapping: id → { kind: 'reference' | 'defect' | 'middle', name, theme? }
// middle (judge v2, owner decision 2026-11-17): every listed item of a "clean but generic" page must
// score within [min, max].
export function evaluateCalibration({ scores, mapping, expected, middle = {} }) {
  const failures = [];
  const byId = {};
  for (const s of scores) (byId[s.id] ??= {})[s.item] = s.score;
  const referenceMeans = {};
  for (const item of ITEMS) {
    const vals = Object.entries(mapping)
      .filter(([, m]) => m.kind === 'reference' && (item !== 'dark-mode' || m.theme === 'dark'))
      .map(([id]) => byId[id]?.[item]).filter(v => v !== undefined);
    if (!vals.length) continue;
    const mean = vals.reduce((a, b) => a + b, 0) / vals.length;
    referenceMeans[item] = mean;
    if (mean < 2.75) failures.push(`reference mean for ${item} is ${mean.toFixed(2)} (< 2.75)`);
    const low = vals.filter(v => v < 2).length;
    if (low) failures.push(`${low} reference score(s) below 2 on ${item}`);
  }
  const defects = {};
  for (const [id, m] of Object.entries(mapping)) {
    if (m.kind !== 'defect') continue;
    const e = expected[m.name];
    if (!e) { failures.push(`no expectation for defect ${m.name}`); continue; }
    const score = byId[id]?.[e.item];
    const ok = score !== undefined && score <= e.maxScore;
    defects[m.name] = { item: e.item, score, ok };
    if (!ok) failures.push(`defect ${m.name}: ${e.item} scored ${score} (> ${e.maxScore})`);
  }
  const middles = {};
  for (const [id, m] of Object.entries(mapping)) {
    if (m.kind !== 'middle') continue;
    const e = middle[m.name];
    if (!e) { failures.push(`no expectation for middle page ${m.name}`); continue; }
    const items = Object.fromEntries(e.items.map(item => [item, byId[id]?.[item]]));
    const bad = Object.entries(items).filter(([, s]) => s === undefined || s < e.min || s > e.max);
    middles[m.name] = { items, min: e.min, max: e.max, ok: bad.length === 0 };
    for (const [item, s] of bad) failures.push(`middle ${m.name}: ${item} scored ${s} (outside ${e.min}-${e.max})`);
  }
  return { pass: failures.length === 0, failures, referenceMeans, defects, middles };
}

// ---- Orchestration: node evals/tools/calibrate.mjs --round <n> ----
const DEFECT_REQUEST = 'A settings screen for a budgeting app called Pocketbook. Platform: web.';

// String.raw: in a plain string '\m' is just 'm', and 'C:m3-eval' is a folder under the current directory.
export const DEFAULT_EVAL_ROOT = String.raw`C:\m3-eval`;

// version 'v1': rubric v1 / judge v1, defect pages only. version 'v2' (protocol change PC-2): rubric
// v2 / judge v2 with side-by-side anchor pairs (pairs.json) and the middle-band pages.
export async function runCalibrationRound({ root, round, evalRoot = DEFAULT_EVAL_ROOT, judgeOpts = {}, version = 'v1' }) {
  const { readdirSync, readFileSync, writeFileSync, mkdirSync, rmSync, existsSync } = await import('node:fs');
  const { join, isAbsolute } = await import('node:path');
  const { anonymize, stripPng, newIds } = await import('./anonymize.mjs');
  const { runJudgeBatch } = await import('./judge.mjs');
  const { pairAnchors, familyOf } = await import('./pairing.mjs');
  const { captureWeb } = await import('../../harness/web/capture.mjs');
  const refDir = join(root, 'private', 'reference-screenshots');
  const { anchors, checks } = splitReferences(readdirSync(refDir));
  const cal = join(root, 'evals', 'calibration');
  const expected = JSON.parse(readFileSync(join(cal, 'expected.json'), 'utf8'));
  const middle = version === 'v2' ? JSON.parse(readFileSync(join(cal, 'expected-middle.json'), 'utf8')) : {};
  const tag = version === 'v1' ? `round-${round}` : `${version}-round-${round}`;
  const roundDir = join(evalRoot, 'calibration', tag);
  rmSync(roundDir, { recursive: true, force: true });
  const outputs = [];
  const pages = [...Object.keys(expected).map(n => ['defect', 'defects', n]), ...Object.keys(middle).map(n => ['middle', 'middle', n])];
  for (const [condition, folder, name] of pages) {
    const shotDir = join(roundDir, 'shots', name);
    const cap = await captureWeb({ projectDir: join(cal, folder, name), kind: 'web-empty', outDir: shotDir });
    if (!cap.buildOk) throw new Error(`${condition} page ${name} did not capture: ${cap.reason}`);
    outputs.push({ cell: name, condition, repeat: 1, runId: `calibration-${tag}`, request: DEFECT_REQUEST,
      shots: cap.shots.map(s => ({ ...s, file: isAbsolute(s.file) ? s.file : join(shotDir, s.file) })) });
  }
  for (const n of checks) {
    const ref = parseRefName(n);
    outputs.push({ cell: n, condition: 'reference', repeat: 1, runId: `calibration-${tag}`, request: referenceRequest(ref),
      shots: [{ file: join(refDir, n), theme: ref.theme, viewport: { android: 'phone', web: 'desktop web', webmobile: 'mobile web' }[ref.platform] }] });
  }
  const judgeDir = join(roundDir, 'judge');
  const privDir = join(root, 'private', 'evals', 'calibration', ...(version === 'v1' ? [] : [version]), `round-${round}`);
  const mappingPath = join(privDir, 'mapping.json');
  const { ids } = anonymize({ outputs, judgeDir, mappingPath });
  mkdirSync(join(judgeDir, 'anchors'), { recursive: true });
  const anchorIds = newIds(anchors.length);
  const anchorList = anchors.map((n, i) => {
    const ref = parseRefName(n);
    writeFileSync(join(judgeDir, 'anchors', `${anchorIds[i]}.png`), stripPng(readFileSync(join(refDir, n))));
    return { file: `anchors/${anchorIds[i]}.png`, platform: { android: 'Android', web: 'desktop web', webmobile: 'mobile web' }[ref.platform], screen: ref.screen, theme: ref.theme,
      style: ref.style === 'classic' ? 'classic Material 3' : 'current first-party style', score: 3 };
  });
  writeFileSync(join(judgeDir, 'anchors', 'anchors.json'), JSON.stringify(anchorList, null, 2));
  const raw = JSON.parse(readFileSync(mappingPath, 'utf8'));
  if (version === 'v2') {
    const named = anchors.map((n, i) => ({ name: n, file: anchorList[i].file }));
    const pairs = Object.fromEntries(Object.entries(raw).map(([id, m]) => {
      const ref = m.condition === 'reference' ? parseRefName(m.cell) : null;
      const target = ref
        ? { family: familyOf(ref.platform), screen: ref.screen, formFactors: [ref.platform === 'web' ? 'desktop' : 'phone'] }
        : { family: 'web', screen: 'settings', formFactors: ['phone', 'desktop'] };
      return [id, pairAnchors(target, named)];
    }));
    writeFileSync(join(judgeDir, 'pairs.json'), JSON.stringify(pairs, null, 2));
  }
  const scores = [];
  const batches = [];
  for (let i = 0; i < ids.length; i += 12) batches.push(ids.slice(i, i + 12));
  const log = [];
  for (const [b, batch] of batches.entries()) {
    const r = await runJudgeBatch({ judgeDir, ids: batch, root, batchId: `cal${version === 'v1' ? '' : version}${round}-${b + 1}`, requireFrozen: false, version, ...judgeOpts });
    log.push({ batch: b + 1, ok: r.ok, attempts: r.attempts, log: r.log });
    if (!r.ok) throw new Error(`calibration batch ${b + 1} failed after ${r.attempts} attempts`);
    scores.push(...r.scores);
  }
  const mapping = Object.fromEntries(Object.entries(raw).map(([id, m]) => [id, m.condition === 'reference'
    ? { kind: 'reference', name: m.cell, theme: parseRefName(m.cell).theme } : { kind: m.condition, name: m.cell }]));
  const result = evaluateCalibration({ scores, mapping, expected, middle });
  if (!existsSync(privDir)) mkdirSync(privDir, { recursive: true });
  writeFileSync(join(privDir, 'scores.json'), JSON.stringify({ scores, log, anchors, checks }, null, 2));
  writeFileSync(join(privDir, 'result.json'), JSON.stringify(result, null, 2));
  return { ...result, anchors: anchors.length, checks: checks.length, defects: result.defects, log };
}

export function reportSection(round, r) {
  const middles = Object.entries(r.middles ?? {});
  const lines = [`## Round ${round}: ${r.pass ? 'PASS' : 'FAIL'}`, '',
    `Anchors shown as score-3 examples: ${r.anchors}. Check references: ${r.checks}. Defect pages: ${Object.keys(r.defects).length}.${middles.length ? ` Middle-band pages: ${middles.length}.` : ''}`, '',
    '| item | check-reference mean |', '|---|---|',
    ...Object.entries(r.referenceMeans).map(([k, v]) => `| ${k} | ${v.toFixed(2)} |`), '',
    '| defect page | targeted item | score | caught |', '|---|---|---|---|',
    ...Object.entries(r.defects).map(([k, d]) => `| ${k} | ${d.item} | ${d.score} | ${d.ok ? 'yes' : 'no'} |`), ''];
  if (middles.length) {
    lines.push('| middle-band page | item scores (expected 1-2) | in range |', '|---|---|---|',
      ...middles.map(([k, m]) => `| ${k} | ${Object.entries(m.items).map(([i, s]) => `${i} ${s}`).join(', ')} | ${m.ok ? 'yes' : 'no'} |`), '');
  }
  if (r.failures.length) lines.push('Failures:', '', ...r.failures.map(f => `- ${f}`), '');
  return lines.join('\n');
}

const { fileURLToPath: __f } = await import('node:url');
if (process.argv[1] && __f(import.meta.url) === process.argv[1]) {
  const { join, dirname } = await import('node:path');
  const { appendFileSync, existsSync, writeFileSync } = await import('node:fs');
  const root = join(dirname(__f(import.meta.url)), '..', '..');
  const round = Number(process.argv[process.argv.indexOf('--round') + 1]);
  const vi = process.argv.indexOf('--version');
  const version = vi > 0 ? process.argv[vi + 1] : 'v1';
  if (!Number.isInteger(round) || round < 1 || round > 3 || !['v1', 'v2'].includes(version)) { console.error('usage: calibrate.mjs --round <1-3> [--version v1|v2]'); process.exit(2); }
  const r = await runCalibrationRound({ root, round, version });
  const report = join(root, 'evals', 'calibration', version === 'v1' ? 'report.md' : `report-${version}.md`);
  if (!existsSync(report)) writeFileSync(report, `# Judge calibration${version === 'v1' ? '' : ` (${version})`}\n\nScores only; images and the ID mapping stay private.\n\n`);
  appendFileSync(report, reportSection(round, r));
  console.log(JSON.stringify({ round, version, pass: r.pass, failures: r.failures }));
  process.exitCode = r.pass ? 0 : 1;
}
