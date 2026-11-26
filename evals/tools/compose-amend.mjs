#!/usr/bin/env node
// Compose harness v3 amendment (owner, 2026-11-26, ruling P24): ATF results count as enabled only when the
// node and every ancestor are enabled, so the label of a disabled Button is no longer a contrast finding
// (spec §9). For consistency every recorded Compose capture of record is captured again from its recorded
// code (no cell runs again): baseline (<cell>/compose-v3), final, hold-out and Sonnet (<cell>/). The
// pictures are compared byte for byte with the capture of record; identical pictures keep their judge v2
// scores, so the judge does not run again (a mismatch exits with code 3). Old and new finding counts are
// written next to each other.
//   node evals/tools/compose-amend.mjs --runs baseline-2026-11-17,p4-final,p4-h1,p4-sonnet --out evals/runs/p4-compose-amend
import { createHash } from 'node:crypto';
import { copyFileSync, cpSync, existsSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { freemem } from 'node:os';
import { dirname, isAbsolute, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { allCells } from './cells.mjs';
import { stopGradle } from './pipeline.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const arg = (k) => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : null; };
const sha = (f) => createHash('sha256').update(readFileSync(f)).digest('hex');
const total = (ver) => Object.values({ ...(ver?.counts ?? {}), ...(ver?.unscored ?? {}) }).reduce((a, n) => a + n, 0);

// The capture of record of a Compose cell: compose-v3/ when present (baseline), else the cell folder.
export const captureDirOf = (priv, cell) => (existsSync(join(priv, cell, 'compose-v3', 'capture.json')) ? join(priv, cell, 'compose-v3') : join(priv, cell));

async function waitMemory(gb, log) {
  while (freemem() / 2 ** 30 < gb) { log(`memory ${(freemem() / 2 ** 30).toFixed(2)} GB < ${gb}; re-check in 60 s`); await new Promise((r) => setTimeout(r, 60_000)); }
}

async function main() {
  const runs = (arg('--runs') ?? '').split(',').filter(Boolean);
  const out = arg('--out');
  if (!runs.length) { console.error('usage: compose-amend.mjs --runs a,b [--out <public folder>]'); process.exit(2); }
  const log = (...a) => console.log(new Date().toISOString().slice(11, 19), ...a);
  const { verify } = await import('../../plugin/skills/material3/scripts/verify/index.mjs');
  const { captureCompose } = await import('../../harness/compose/capture.mjs');
  const rows = [];
  for (const runId of runs) {
    const priv = join(root, 'private', 'evals', 'runs', runId);
    for (const cell of allCells().filter((c) => c.platform === 'compose' && existsSync(join(priv, c.cell, 'record.json')))) {
      const record = JSON.parse(readFileSync(join(priv, cell.cell, 'record.json'), 'utf8'));
      const workDir = record.rec.workDir;
      if (!existsSync(workDir ?? '')) throw new Error(`work folder gone for ${runId} ${cell.cell}`);
      const dir = captureDirOf(priv, cell.cell);
      const old = JSON.parse(readFileSync(join(dir, 'capture.json'), 'utf8'));
      // booking.compose was re-captured with the fix already (P23); its pre-fix counts are in the record.
      const before = record.recaptured && runId === 'p4-h1' ? { contrast: 2, total: 2, note: 'pre-fix capture of 2026-11-26 (P23)' } : null;
      const oldVer = await verify({ projectDir: workDir, platform: 'compose', runtime: old.runtime });
      await waitMemory(1.5, log);
      const shotDir = join('C:\\m3-eval', 'shots', `amend-${runId}`, cell.cell);
      rmSync(shotDir, { recursive: true, force: true });
      stopGradle(workDir);
      const t0 = Date.now();
      const cap = await captureCompose({ projectDir: workDir, outDir: shotDir, version: 'v3' });
      stopGradle(workDir);
      cap.shots = cap.shots.map((s) => ({ ...s, file: isAbsolute(s.file) ? s.file : join(shotDir, s.file) }));
      const same = cap.shots.length > 0 && cap.shots.length === (old.shots ?? []).length
        && cap.shots.every((s) => { const o = join(dir, 'shots', s.file.split(/[\\/]/).pop()); return existsSync(o) && sha(o) === sha(s.file); });
      const ver = await verify({ projectDir: workDir, platform: 'compose', runtime: cap.runtime });
      if (same && cap.buildOk) {
        copyFileSync(join(dir, 'capture.json'), join(dir, 'capture.pre-amend.json'));
        if (existsSync(join(dir, 'verify.json'))) copyFileSync(join(dir, 'verify.json'), join(dir, 'verify.pre-amend.json'));
        for (const f of readdirSync(shotDir)) if (f.startsWith('atf-')) copyFileSync(join(shotDir, f), join(dir, 'shots', f));
        const shots = cap.shots.map((s) => ({ ...s, file: join(dir, 'shots', s.file.split(/[\\/]/).pop()) }));
        writeFileSync(join(dir, 'capture.json'), JSON.stringify({ ...old, runtime: cap.runtime, shots, amended: { at: new Date().toISOString(), change: 'disabled-ancestor contrast filter (P24)' } }, null, 2));
        writeFileSync(join(dir, 'verify.json'), JSON.stringify(ver, null, 2));
        if (dir === join(priv, cell.cell)) {
          record.cap = { ...record.cap, runtime: cap.runtime };
          record.ver = { ...(record.ver ?? {}), counts: ver.counts };
          record.amended = { at: new Date().toISOString(), change: 'disabled-ancestor contrast filter (P24)' };
          writeFileSync(join(priv, cell.cell, 'record.json'), JSON.stringify(record, null, 2));
        }
      }
      const row = { runId, cell: cell.cell, buildOk: cap.buildOk, picturesIdentical: same,
        contrast: { before: before?.contrast ?? oldVer.counts.contrast, after: ver.counts.contrast },
        targets: { before: oldVer.counts['touch-target'], after: ver.counts['touch-target'] },
        total: { before: before?.total ?? total(oldVer), after: total(ver) }, note: before?.note };
      rows.push(row);
      log(runId, cell.cell, 'build', cap.buildOk, 'contrast', row.contrast.before, '->', row.contrast.after, 'targets', row.targets.before, '->', row.targets.after, 'identical', same, `${Math.round((Date.now() - t0) / 1000)}s`);
      rmSync(shotDir, { recursive: true, force: true });
    }
  }
  const dest = join(root, 'private', 'evals', 'runs', 'p4-compose-amend.json');
  writeFileSync(dest, JSON.stringify({ at: new Date().toISOString(), rows }, null, 2));
  if (out) {
    const md = [
      '# Compose harness v3 amendment: disabled-ancestor contrast filter',
      '',
      'Ruling P24 (owner-accepted 2026-11-26). ATF reports the unmerged `Text` child of a disabled `Button` as an enabled `TextView`; the harness now counts an ATF result as enabled only when the node and every ancestor are enabled, so the label of a disabled button is no longer a contrast finding (spec §9: contrast excludes disabled elements). Every Compose capture of record was captured again from its recorded code (no cell ran again). Pictures are compared byte for byte with the capture of record; identical pictures keep their judge v2 scores, so the judge did not run again.',
      '',
      `Pictures identical: ${rows.filter((r) => r.picturesIdentical).length}/${rows.length}.`,
      '',
      '| run | cell | contrast before → after | touch-target before → after | all findings before → after | pictures identical |',
      '|---|---|---|---|---|---|',
      ...rows.map((r) => `| ${r.runId} | ${r.cell} | ${r.contrast.before} → ${r.contrast.after} | ${r.targets.before} → ${r.targets.after} | ${r.total.before} → ${r.total.after}${r.note ? ` (${r.note})` : ''} | ${r.picturesIdentical ? 'yes' : 'NO'} |`),
      '',
      ...runs.map((run) => { const rs = rows.filter((r) => r.runId === run); return `- ${run}: ${rs.length} cells, findings ${rs.reduce((a, r) => a + r.total.before, 0)} → ${rs.reduce((a, r) => a + r.total.after, 0)}`; }),
      '',
    ].join('\n');
    mkdirSync(join(root, out), { recursive: true });
    writeFileSync(join(root, out, 'compose-amend.md'), md);
    writeFileSync(join(root, out, 'compose-amend.json'), `${JSON.stringify({ rows }, null, 2)}\n`);
    log(`wrote ${out}/compose-amend.md`);
  }
  if (rows.some((r) => !r.picturesIdentical || !r.buildOk)) { console.error('pictures differ or a build failed: the capture of record was kept for those cells'); process.exitCode = 3; }
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) await main();
