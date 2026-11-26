// The two cell sets: the eval matrix (evals/cells.json) and the development set (evals/dev/cells.json).
// The hold-out set (Phase 4 step 3) is named here but its request files are never read here.
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const evalsDir = join(dirname(fileURLToPath(import.meta.url)), '..');

export const evalCells = () => JSON.parse(readFileSync(join(evalsDir, 'cells.json'), 'utf8'));
export const devCells = () => JSON.parse(readFileSync(join(evalsDir, 'dev', 'cells.json'), 'utf8'));

// Hold-out (plan step 3): 2 requests x 3 platforms, default style, the same fixtures as the Sonnet check.
// Cell names use neutral request names, so no path or prompt a session sees says "hold-out" (the
// isolation audit fails a transcript naming it). Request name -> file in evals/holdout/.
export const HOLDOUT_FILES = { booking: 'holdout-1', chat: 'holdout-2' };
const HOLDOUT_FIXTURES = { web: 'web-empty', flutter: 'flutter-material_ui', compose: 'compose-1.5' };
export const holdoutCells = () => Object.keys(HOLDOUT_FILES).flatMap(request => Object.entries(HOLDOUT_FIXTURES)
  .map(([platform, fixture]) => ({ cell: `${request}.${platform}.${fixture}.default`, request, platform, fixture, variant: 'default', set: 'holdout' })));

// Every cell a recorded run can hold (Phase 4 pooled judging).
export const allCells = () => [...evalCells(), ...devCells(), ...holdoutCells()];
