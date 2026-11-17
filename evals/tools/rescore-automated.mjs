#!/usr/bin/env node
// Re-scores a finished run's automated items with v2 (evals/automated-v2.md) from its recorded code,
// without running the cells again. Cells of the platforms named by --recapture (flutter, compose) are
// captured again with harness v2 from their recorded work folders; web cells reuse the recorded
// runtime results (the web harness did not change). Verify runs again on the recorded work folders.
//   node evals/tools/rescore-automated.mjs --run-id <id> --out evals/runs/<folder> [--recapture flutter,compose]
import { cpSync, existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { join, dirname, isAbsolute } from 'node:path';
import { fileURLToPath } from 'node:url';
import { automatedScores } from './automated.mjs';

// Static checks whose rules did not change from v1 (icon-source gained the vector-icon rule in v2).
const STATIC = ['hardcoded-color', 'off-token-type', 'off-token-radius', 'off-grid-spacing', 'shadow-gradient', 'foreign-styling'];
const round = x => (x === null ? null : Math.round(x * 100) / 100);
const mean = xs => { const v = xs.filter(x => typeof x === 'number'); return v.length ? v.reduce((a, b) => a + b, 0) / v.length : null; };

// rows: [{cell, platform, v1: {item: score}, v2: {item: score}, targetsV1, targetsV2}]
export function compareAutomated(rows) {
  const v1Items = [...new Set(rows.flatMap(r => Object.keys(r.v1)))];
  const v2Items = [...new Set(rows.flatMap(r => Object.keys(r.v2)))];
  const platforms = [...new Set(rows.map(r => r.platform))];
  const means = (rs, key, items) => Object.fromEntries(items.map(it => [it, round(mean(rs.map(r => r[key][it])))]));
  const group = rs => ({ v1: means(rs, 'v1', v1Items), v2: means(rs, 'v2', v2Items) });
  return {
    v1Items, v2Items,
    byPlatform: Object.fromEntries(platforms.map(p => [p, group(rows.filter(r => r.platform === p))])),
    overall: group(rows),
  };
}

// One cell scored with v2 from its verify result: the row and the detail this tool records.
export function scoreCell(cell, saved, cap, ver, captureMs = null) {
  const staticDiff = STATIC.filter(k => (ver.counts[k] ?? 0) !== (saved.ver?.counts?.[k] ?? 0) || ver.uiLines !== saved.ver?.uiLines);
  const usable = Boolean(cap.buildOk && cap.shots?.length);
  const row = {
    cell: cell.cell, platform: cell.platform,
    v1: saved.auto, v2: automatedScores(ver, usable, 'v2'),
    targetsV1: saved.ver?.counts?.['touch-target'] ?? null, targetsV2: ver.counts['touch-target'],
  };
  const detail = { cell: cell.cell, buildOk: cap.buildOk, shots: cap.shots?.length ?? 0, captureMs, countsV1: saved.ver?.counts, countsV2: ver.counts, uiLines: ver.uiLines, staticSameAsV1: staticDiff.length === 0, staticDiff };
  return { row, detail };
}

// The text of the public automated-v2.json.
export function publicJson(runId, rows, detail) {
  return `${JSON.stringify({ runId, ...compareAutomated(rows), cells: rows.map((r, i) => ({ ...r, counts: detail[i].countsV2, uiLines: detail[i].uiLines })) }, null, 2)}\n`;
}

const table = (head, rows) => [`| ${head.join(' | ')} |`, `|${head.map(() => '---').join('|')}|`, ...rows.map(r => `| ${r.join(' | ')} |`)].join('\n');
const fmt = x => (x === null || x === undefined ? '—' : typeof x === 'number' ? x.toFixed(2) : String(x));

export function renderComparison(runId, rows, notes = []) {
  const c = compareAutomated(rows);
  const items = [...new Set([...c.v1Items, ...c.v2Items])];
  const groups = [...Object.keys(c.byPlatform), 'all'];
  const g = k => (k === 'all' ? c.overall : c.byPlatform[k]);
  return [
    `# Automated items: v1 and v2 (run \`${runId}\`)`,
    '',
    'v1 is rubric v1\'s automated table with harness v1, as published in summary.md. v2 is `evals/automated-v2.md` with harness v2: icon source is its own item, Flutter touch targets have the web and Compose scope, the Flutter harness loads the app\'s fonts, and the Compose harness captures with reduced motion. The recorded code was scored again (Flutter and Compose captured again from it); no cell was run again.',
    ...(notes.length ? ['', ...notes.map(n => `- ${n}`)] : []),
    '',
    '## Means by platform',
    '',
    table(['item', ...groups.flatMap(p => [`${p} v1`, `${p} v2`])], items.map(it => [it, ...groups.flatMap(p => [fmt(g(p).v1[it]), fmt(g(p).v2[it])])])),
    '',
    '## Per cell',
    '',
    table(['cell', ...items.flatMap(it => [`${it} v1`, `${it} v2`]), 'touch targets v1', 'touch targets v2'],
      rows.map(r => [r.cell, ...items.flatMap(it => [r.v1[it] ?? '—', r.v2[it] ?? '—']), r.targetsV1, r.targetsV2])),
    '',
  ].join('\n');
}

async function main() {
  const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
  const arg = k => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : null; };
  const runId = arg('--run-id');
  const out = arg('--out');
  const recapture = (arg('--recapture') ?? '').split(',').filter(Boolean);
  if (!runId || !out || recapture.some(p => !['flutter', 'compose'].includes(p))) { console.error('usage: --run-id <id> --out <public folder> [--recapture flutter,compose] [--note <text>]...'); process.exit(2); }
  const priv = join(root, 'private', 'evals', 'runs', runId);
  const cells = JSON.parse(readFileSync(join(root, 'evals', 'cells.json'), 'utf8'));
  const { verify } = await import('../../plugin/skills/material3/scripts/verify/index.mjs');
  const { captureFlutter } = await import('../../harness/flutter/capture.mjs');
  const { captureCompose } = await import('../../harness/compose/capture.mjs');
  const { stopGradle } = await import('./pipeline.mjs');
  const rows = [];
  const detail = [];
  for (const cell of cells) {
    const recPath = join(priv, cell.cell, 'record.json');
    if (!existsSync(recPath)) { console.error(`no record for ${cell.cell}`); process.exit(2); }
    const saved = JSON.parse(readFileSync(recPath, 'utf8'));
    const workDir = saved.rec.workDir;
    if (!existsSync(workDir ?? '')) { console.error(`work folder gone for ${cell.cell}: ${workDir}`); process.exit(2); }
    // A harness v2 capture recorded earlier (<cell>/v2/capture.json) is used without capturing again.
    const v2cap = join(priv, cell.cell, 'v2', 'capture.json');
    let cap = existsSync(v2cap) ? JSON.parse(readFileSync(v2cap, 'utf8')) : saved.cap;
    let captureMs = null;
    if (recapture.includes(cell.platform)) {
      const shotDir = join('C:\\m3-eval', 'shots', `${runId}-v2`, cell.cell);
      rmSync(shotDir, { recursive: true, force: true });
      const t0 = Date.now();
      if (cell.platform === 'compose') stopGradle(workDir);
      cap = cell.platform === 'flutter' ? await captureFlutter({ projectDir: workDir, outDir: shotDir }) : await captureCompose({ projectDir: workDir, outDir: shotDir });
      if (cell.platform === 'compose') stopGradle(workDir);
      captureMs = Date.now() - t0;
      cap.shots = cap.shots.map(s => ({ ...s, file: isAbsolute(s.file) ? s.file : join(shotDir, s.file) }));
      const dest = join(priv, cell.cell, 'v2');
      rmSync(dest, { recursive: true, force: true });
      mkdirSync(dest, { recursive: true });
      cpSync(shotDir, join(dest, 'shots'), { recursive: true });
      writeFileSync(join(dest, 'capture.json'), JSON.stringify({ ...cap, raw: undefined, harness: 'v2' }, null, 2));
      console.log(cell.cell, 'recaptured', cap.buildOk, 'shots', cap.shots.length, 'targets', cap.runtime.targets.length, `${Math.round(captureMs / 1000)}s`);
    }
    const ver = await verify({ projectDir: workDir, platform: cell.platform, runtime: cap.runtime });
    const scored = scoreCell(cell, saved, cap, ver, captureMs);
    const { staticDiff } = scored.detail;
    rows.push(scored.row);
    detail.push(scored.detail);
    if (staticDiff.length) console.warn(`static counts differ from v1 for ${cell.cell}: ${staticDiff.join(', ')}`);
  }
  writeFileSync(join(priv, 'automated-v2.json'), JSON.stringify({ runId, at: new Date().toISOString(), recapture, rows, detail }, null, 2));
  const notes = process.argv.flatMap((a, i) => (a === '--note' ? [process.argv[i + 1]] : []));
  mkdirSync(join(root, out), { recursive: true });
  writeFileSync(join(root, out, 'automated-v2.json'), publicJson(runId, rows, detail));
  writeFileSync(join(root, out, 'automated-v2.md'), renderComparison(runId, rows, notes));
  console.log(`wrote ${out}/automated-v2.json and automated-v2.md; static counts identical to v1 in ${detail.filter(d => d.staticSameAsV1).length}/${detail.length} cells`);
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) await main();
