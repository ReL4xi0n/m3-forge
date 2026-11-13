// The rubric and judge freeze (Phase 2 plan, Task 11). Hashes are over LF-normalized bytes, so a
// checkout with CRLF line endings does not change them.
import { existsSync, readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { join } from 'node:path';

export const FROZEN_FILES = { rubric: 'evals/rubric.md', judge: 'evals/judge.md' };

export const hashText = buf => createHash('sha256').update(Buffer.from(buf.toString('utf8').replace(/\r\n/g, '\n'), 'utf8')).digest('hex');

export function checkFrozen(root) {
  const f = join(root, 'evals', 'frozen.json');
  if (!existsSync(f)) return { ok: false, problems: ['evals/frozen.json is missing: rubric and judge are not frozen'] };
  const frozen = JSON.parse(readFileSync(f, 'utf8'));
  const problems = [];
  for (const [k, rel] of Object.entries(FROZEN_FILES)) {
    const p = join(root, rel);
    if (!existsSync(p)) { problems.push(`${rel} is missing`); continue; }
    if (hashText(readFileSync(p)) !== frozen[k]) problems.push(`${rel} differs from its frozen hash`);
  }
  return { ok: problems.length === 0, problems, frozen };
}
