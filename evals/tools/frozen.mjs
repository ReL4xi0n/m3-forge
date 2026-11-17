// The rubric and judge freeze (Phase 2 plan, Task 11). Hashes are over LF-normalized bytes, so a
// checkout with CRLF line endings does not change them.
import { existsSync, readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { join } from 'node:path';

export const FROZEN_FILES = { rubric: 'evals/rubric.md', judge: 'evals/judge.md' };
// Rubric v2 / judge v2 (protocol change PC-2) are frozen in their own file; v1 stays as it was.
export const VERSIONS = {
  v1: { file: 'evals/frozen.json', files: FROZEN_FILES },
  v2: { file: 'evals/frozen-v2.json', files: { rubric: 'evals/rubric-v2.md', judge: 'evals/judge-v2.md', automated: 'evals/automated-v2.md' } },
};

export const hashText = buf => createHash('sha256').update(Buffer.from(buf.toString('utf8').replace(/\r\n/g, '\n'), 'utf8')).digest('hex');

export function checkFrozen(root, version = 'v1') {
  const v = VERSIONS[version];
  if (!v) return { ok: false, problems: [`unknown rubric version ${version}`] };
  const f = join(root, ...v.file.split('/'));
  if (!existsSync(f)) return { ok: false, problems: [`${v.file} is missing: rubric and judge ${version} are not frozen`] };
  const frozen = JSON.parse(readFileSync(f, 'utf8'));
  const problems = [];
  for (const [k, rel] of Object.entries(v.files)) {
    const p = join(root, rel);
    if (!existsSync(p)) { problems.push(`${rel} is missing`); continue; }
    if (hashText(readFileSync(p)) !== frozen[k]) problems.push(`${rel} differs from its frozen hash`);
  }
  return { ok: problems.length === 0, problems, frozen };
}
