#!/usr/bin/env node
// Freezes rubric v1 and the judge after a passing calibration (Phase 2 plan, Task 11).
// Refuses unless calibration passed and no request output exists yet (only canary runs).
//   node evals/tools/freeze.mjs
import { existsSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { hashText, FROZEN_FILES } from './frozen.mjs';
import { splitReferences } from './calibrate.mjs';

export function outputsSoFar(root, evalRoot = 'C:\\m3-eval') {
  const found = [];
  const runs = join(root, 'private', 'evals', 'runs');
  if (existsSync(runs)) for (const d of readdirSync(runs)) if (!d.startsWith('canary-')) found.push(`private/evals/runs/${d}`);
  const work = join(evalRoot, 'work');
  if (existsSync(work)) for (const d of readdirSync(work)) if (!d.startsWith('canary-')) found.push(`${work}\\${d}`);
  return found;
}

export function freezeRecord(root) {
  const report = readFileSync(join(root, 'evals', 'calibration', 'report.md'), 'utf8');
  const rounds = [...report.matchAll(/^## Round (\d+): (PASS|FAIL)$/gm)].map(m => ({ round: Number(m[1]), result: m[2] }));
  if (!rounds.length || rounds[rounds.length - 1].result !== 'PASS') throw new Error('the last calibration round did not pass');
  const refDir = join(root, 'private', 'reference-screenshots');
  const { anchors } = splitReferences(readdirSync(refDir));
  return {
    rubric: hashText(readFileSync(join(root, FROZEN_FILES.rubric))),
    judge: hashText(readFileSync(join(root, FROZEN_FILES.judge))),
    anchorSet: anchors.map(n => createHash('sha256').update(readFileSync(join(refDir, n))).digest('hex')),
    calibrationRounds: rounds,
    frozenOn: new Date().toISOString().slice(0, 10),
  };
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
  const existing = outputsSoFar(root);
  if (existing.length) { console.error(`refusing to freeze: request outputs already exist:\n${existing.join('\n')}`); process.exit(1); }
  const rec = freezeRecord(root);
  writeFileSync(join(root, 'evals', 'frozen.json'), JSON.stringify(rec, null, 2) + '\n');
  console.log(`frozen: rubric ${rec.rubric.slice(0, 12)}, judge ${rec.judge.slice(0, 12)}, ${rec.anchorSet.length} anchors, ${rec.calibrationRounds.length} round(s)`);
}
