#!/usr/bin/env node
// Judge calibration (Phase 2 plan, Task 11). The owner's real product screenshots anchor score 3:
// half are shown to the judge as labeled score-3 examples (anchors), half are mixed unlabeled with
// hand-written defect pages (checks). Pass: every applicable item's mean over check references is
// ≥ 2.75 with no reference score below 2, and every defect page scores ≤ its maxScore on its item.
import { ITEMS } from './judge.mjs';

const REF = /^(android|web)-(expressive|classic|current)-(.+)-(light|dark)-(\d+)\.png$/;

export function parseRefName(name) {
  const m = name.match(REF);
  return m ? { platform: m[1], style: m[2], screen: m[3], theme: m[4], n: Number(m[5]) } : null;
}

export function splitReferences(names) {
  const refs = names.filter(n => parseRefName(n)).sort();
  if (refs.length < 12) throw new Error(`need at least 12 reference screenshots, found ${refs.length}`);
  const anchors = [];
  const checks = [];
  for (const platform of ['android', 'web']) {
    const list = refs.filter(n => n.startsWith(`${platform}-`)).sort((a, b) => {
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
};

export function referenceRequest(ref) {
  const what = SCREEN[ref.screen] ?? `A ${ref.screen.replace(/-/g, ' ')} screen`;
  const platform = ref.platform === 'android' ? 'Android' : 'web';
  const style = ref.style === 'classic' ? ' Use the classic Material 3 style, not M3 Expressive.' : '';
  return `${what}. Platform: ${platform}.${style}`;
}

// scores: validated judge entries; mapping: id → { kind: 'reference' | 'defect', name, theme? }
export function evaluateCalibration({ scores, mapping, expected }) {
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
  return { pass: failures.length === 0, failures, referenceMeans, defects };
}

// ---- Orchestration: node evals/tools/calibrate.mjs --round <n> ----
const DEFECT_REQUEST = 'A settings screen for a budgeting app called Pocketbook. Platform: web.';

export async function runCalibrationRound({ root, round, evalRoot = 'C:\m3-eval', judgeOpts = {} }) {
  const { readdirSync, readFileSync, writeFileSync, mkdirSync, rmSync } = await import('node:fs');
  const { join } = await import('node:path');
  const { anonymize, stripPng, newIds } = await import('./anonymize.mjs');
  const { runJudgeBatch } = await import('./judge.mjs');
  const { captureWeb } = await import('../../harness/web/capture.mjs');
  const refDir = join(root, 'private', 'reference-screenshots');
  const { anchors, checks } = splitReferences(readdirSync(refDir));
  const expected = JSON.parse(readFileSync(join(root, 'evals', 'calibration', 'expected.json'), 'utf8'));
  const roundDir = join(evalRoot, 'calibration', `round-${round}`);
  rmSync(roundDir, { recursive: true, force: true });
  const outputs = [];
  for (const name of Object.keys(expected)) {
    const cap = await captureWeb({ projectDir: join(root, 'evals', 'calibration', 'defects', name), kind: 'web-empty', outDir: join(roundDir, 'shots', name) });
    if (!cap.buildOk) throw new Error(`defect page ${name} did not capture: ${cap.reason}`);
    outputs.push({ cell: name, condition: 'defect', repeat: 1, runId: `calibration-${round}`, request: DEFECT_REQUEST, shots: cap.shots });
  }
  for (const n of checks) {
    const ref = parseRefName(n);
    outputs.push({ cell: n, condition: 'reference', repeat: 1, runId: `calibration-${round}`, request: referenceRequest(ref),
      shots: [{ file: join(refDir, n), theme: ref.theme, viewport: ref.platform === 'android' ? 'phone' : 'web' }] });
  }
  const judgeDir = join(roundDir, 'judge');
  const mappingPath = join(root, 'private', 'evals', 'calibration', `round-${round}`, 'mapping.json');
  const { ids } = anonymize({ outputs, judgeDir, mappingPath });
  mkdirSync(join(judgeDir, 'anchors'), { recursive: true });
  const anchorIds = newIds(anchors.length);
  const anchorList = anchors.map((n, i) => {
    const ref = parseRefName(n);
    writeFileSync(join(judgeDir, 'anchors', `${anchorIds[i]}.png`), stripPng(readFileSync(join(refDir, n))));
    return { file: `anchors/${anchorIds[i]}.png`, platform: ref.platform === 'android' ? 'Android' : 'web', screen: ref.screen, theme: ref.theme,
      style: ref.style === 'classic' ? 'classic Material 3' : 'current first-party style', score: 3 };
  });
  writeFileSync(join(judgeDir, 'anchors', 'anchors.json'), JSON.stringify(anchorList, null, 2));
  const scores = [];
  const batches = [];
  for (let i = 0; i < ids.length; i += 12) batches.push(ids.slice(i, i + 12));
  const log = [];
  for (const [b, batch] of batches.entries()) {
    const r = await runJudgeBatch({ judgeDir, ids: batch, root, batchId: `cal${round}-${b + 1}`, requireFrozen: false, ...judgeOpts });
    log.push({ batch: b + 1, ok: r.ok, attempts: r.attempts, log: r.log });
    if (!r.ok) throw new Error(`calibration batch ${b + 1} failed after ${r.attempts} attempts`);
    scores.push(...r.scores);
  }
  const raw = JSON.parse(readFileSync(mappingPath, 'utf8'));
  const mapping = Object.fromEntries(Object.entries(raw).map(([id, m]) => [id, m.condition === 'reference'
    ? { kind: 'reference', name: m.cell, theme: parseRefName(m.cell).theme } : { kind: 'defect', name: m.cell }]));
  const result = evaluateCalibration({ scores, mapping, expected });
  const privDir = join(root, 'private', 'evals', 'calibration', `round-${round}`);
  writeFileSync(join(privDir, 'scores.json'), JSON.stringify({ scores, log, anchors, checks }, null, 2));
  writeFileSync(join(privDir, 'result.json'), JSON.stringify(result, null, 2));
  return { ...result, anchors: anchors.length, checks: checks.length, defects: result.defects, log };
}

export function reportSection(round, r) {
  const lines = [`## Round ${round}: ${r.pass ? 'PASS' : 'FAIL'}`, '',
    `Anchors shown as score-3 examples: ${r.anchors}. Check references: ${r.checks}. Defect pages: ${Object.keys(r.defects).length}.`, '',
    '| item | check-reference mean |', '|---|---|',
    ...Object.entries(r.referenceMeans).map(([k, v]) => `| ${k} | ${v.toFixed(2)} |`), '',
    '| defect page | targeted item | score | caught |', '|---|---|---|---|',
    ...Object.entries(r.defects).map(([k, d]) => `| ${k} | ${d.item} | ${d.score} | ${d.ok ? 'yes' : 'no'} |`), ''];
  if (r.failures.length) lines.push('Failures:', '', ...r.failures.map(f => `- ${f}`), '');
  return lines.join('\n');
}

const { fileURLToPath: __f } = await import('node:url');
if (process.argv[1] && __f(import.meta.url) === process.argv[1]) {
  const { join, dirname } = await import('node:path');
  const { appendFileSync, existsSync, writeFileSync } = await import('node:fs');
  const root = join(dirname(__f(import.meta.url)), '..', '..');
  const round = Number(process.argv[process.argv.indexOf('--round') + 1]);
  if (!Number.isInteger(round) || round < 1 || round > 3) { console.error('usage: calibrate.mjs --round <1-3>'); process.exit(2); }
  const r = await runCalibrationRound({ root, round });
  const report = join(root, 'evals', 'calibration', 'report.md');
  if (!existsSync(report)) writeFileSync(report, '# Judge calibration\n\nScores only; images and the ID mapping stay private.\n\n');
  appendFileSync(report, reportSection(round, r));
  console.log(JSON.stringify({ round, pass: r.pass, failures: r.failures }));
  process.exitCode = r.pass ? 0 : 1;
}
