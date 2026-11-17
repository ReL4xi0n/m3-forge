// Ruling R8: a skill run reads the skill's files, and the transcript audit fails a run whose tool
// results contain one of its keywords. So no file of the shipped skill folder (name or content,
// binary files included) may contain them. The audit's own check is used, with its default keywords.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { auditTranscript } from '../../../evals/tools/isolation.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..', '..');
const skill = join(root, 'plugin', 'skills', 'material3');

// TODO(Task 10): SKILL.md is rewritten in Task 10; remove this exception there.
const ALLOWED_UNTIL_TASK_10 = new Set(['SKILL.md']);

function* files(dir) {
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, e.name);
    if (e.isDirectory()) yield* files(p);
    else if (e.isFile()) yield p;
  }
}

const keywordHits = text => auditTranscript(
  [{ message: { content: [{ type: 'tool_result', content: text }] } }],
  { workDir: root, repoRoot: '' },
).hits.filter(h => h.why.startsWith('keyword ')).map(h => h.why.slice('keyword '.length));

test('the audit check flags each of its keywords (the scan below uses it)', () => {
  assert.deepEqual(keywordHits('x m3-forge x'), ['m3-forge']);
  assert.deepEqual(keywordHits('HOLDOUT'), ['holdout']);
  assert.deepEqual(keywordHits('a/reference-screenshots/b'), ['reference-screenshots']);
  assert.deepEqual(keywordHits('material3 skill asset: assets/web/tokens.css'), []);
});

test('no file of the shipped skill folder contains an audit keyword in its path or content', () => {
  const found = [];
  for (const file of files(skill)) {
    const rel = relative(skill, file).split('\\').join('/');
    if (ALLOWED_UNTIL_TASK_10.has(rel)) continue;
    const hits = new Set([...keywordHits(rel), ...keywordHits(readFileSync(file).toString('latin1'))]);
    for (const k of hits) found.push(`${rel}: ${k}`);
  }
  assert.deepEqual(found, []);
});
