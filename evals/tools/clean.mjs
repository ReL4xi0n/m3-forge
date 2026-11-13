#!/usr/bin/env node
// Removes the eval work root (C:\m3-eval) or one run inside it. Never touches anything else.
//   clean.mjs            remove C:\m3-eval entirely
//   clean.mjs <run-id>   remove work, cfg and logs of one run
import { rmSync, existsSync } from 'node:fs';
import { join, resolve } from 'node:path';

export const EVAL_ROOT = 'C:\\m3-eval';

export function cleanTargets(runId, evalRoot = EVAL_ROOT) {
  if (runId && !/^[A-Za-z0-9._-]+$/.test(runId)) throw new Error(`bad run id: ${runId}`);
  const targets = runId ? ['work', 'cfg', 'logs'].map(d => join(evalRoot, d, runId)) : [evalRoot];
  for (const t of targets) {
    if (!resolve(t).toLowerCase().startsWith(resolve(evalRoot).toLowerCase())) throw new Error(`refusing to delete ${t}`);
  }
  return targets;
}

if (process.argv[1] && resolve(process.argv[1]).toLowerCase().endsWith('clean.mjs')) {
  for (const t of cleanTargets(process.argv[2])) {
    if (existsSync(t)) { rmSync(t, { recursive: true, force: true }); console.log(`removed ${t}`); }
  }
}
