// The two cell sets: the eval matrix (evals/cells.json) and the development set (evals/dev/cells.json).
// The hold-out set is not read here.
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const evalsDir = join(dirname(fileURLToPath(import.meta.url)), '..');

export const evalCells = () => JSON.parse(readFileSync(join(evalsDir, 'cells.json'), 'utf8'));
export const devCells = () => JSON.parse(readFileSync(join(evalsDir, 'dev', 'cells.json'), 'utf8'));
