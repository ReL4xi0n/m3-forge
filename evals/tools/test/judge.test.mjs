import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';
import { ITEMS, validateScores, judgePrompt, runJudgeBatch } from '../judge.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..', '..');
const ids = ['aaaaaa', 'bbbbbb'];
const full = () => ids.flatMap(id => ITEMS.map(item => ({ id, item, score: 2, reason: 'ok' })));

test('validateScores: accepts a complete array, also inside a code fence', () => {
  assert.equal(validateScores(JSON.stringify(full()), ids).ok, true);
  assert.equal(validateScores('```json\n' + JSON.stringify(full()) + '\n```', ids).ok, true);
});

test('validateScores: rejects malformed, missing, duplicate, out-of-range and unknown entries', () => {
  assert.equal(validateScores('not json', ids).ok, false);
  assert.equal(validateScores(JSON.stringify(full().slice(1)), ids).ok, false, 'missing item');
  assert.equal(validateScores(JSON.stringify([...full(), full()[0]]), ids).ok, false, 'duplicate');
  const bad = full(); bad[0].score = 4;
  assert.equal(validateScores(JSON.stringify(bad), ids).ok, false, 'range');
  const frac = full(); frac[0].score = 2.5;
  assert.equal(validateScores(JSON.stringify(frac), ids).ok, false, 'integer');
  const noReason = full(); noReason[0].reason = '';
  assert.equal(validateScores(JSON.stringify(noReason), ids).ok, false, 'reason');
  assert.equal(validateScores(JSON.stringify([...full(), { id: 'zzzzzz', item: ITEMS[0], score: 1, reason: 'x' }]), ids).ok, false, 'unknown id');
});

test('judgePrompt: inserts the batch ids and the rubric; names no condition', () => {
  const p = judgePrompt({ ids, root });
  assert.match(p, /IDs in this batch: aaaaaa, bbbbbb/);
  assert.match(p, /## Judged items/);
  assert.doesNotMatch(p.toLowerCase(), /\bskill\b|baseline/);
  assert.doesNotMatch(p, /\{\{/);
});

function fakeJudge(dir, replies) {
  const state = join(dir, 'n.txt');
  writeFileSync(state, '0');
  const f = join(dir, 'fake-judge.mjs');
  writeFileSync(f, `import { readFileSync, writeFileSync } from 'node:fs';
const replies = ${JSON.stringify(replies)};
const n = Number(readFileSync(${JSON.stringify(state)}, 'utf8')); writeFileSync(${JSON.stringify(state)}, String(n + 1));
const init = { type: 'system', subtype: 'init', cwd: process.cwd(), tools: ['Read'], mcp_servers: [], plugins: [], skills: [], slash_commands: [], memory_paths: { auto: process.env.CLAUDE_CONFIG_DIR + '/p' } };
console.log(JSON.stringify(init));
console.log(JSON.stringify({ type: 'result', is_error: false, result: replies[Math.min(n, replies.length - 1)], duration_ms: 5, total_cost_usd: 0.01, usage: {} }));
`);
  return [process.execPath, f];
}

function judgeDir() {
  const base = mkdtempSync(join(tmpdir(), 'm3judge-'));
  const d = join(base, 'judge');
  mkdirSync(join(d, 'anchors'), { recursive: true });
  for (const id of ids) writeFileSync(join(d, `${id}_1.png`), 'png');
  writeFileSync(join(d, 'views.json'), JSON.stringify(Object.fromEntries(ids.map(id => [id, [{ file: `${id}_1.png`, theme: 'light', viewport: '412x915' }]]))));
  writeFileSync(join(d, 'requests.json'), JSON.stringify(Object.fromEntries(ids.map(id => [id, 'Build a settings screen.']))));
  writeFileSync(join(d, 'anchors', 'anchors.json'), '[]');
  const token = join(base, 'token');
  writeFileSync(token, 'x'.repeat(20));
  return { base, d, token };
}

test('runJudgeBatch: an invalid reply is re-run with a fresh session; valid on the second try', async () => {
  const { base, d, token } = judgeDir();
  const r = await runJudgeBatch({ judgeDir: d, ids, root, evalRoot: join(base, 'eval'), batchId: 'b1', tokenFile: token,
    claudeCmd: fakeJudge(base, ['sorry', JSON.stringify(full())]), requireFrozen: false, requireSecretsAcl: false, skipPreflightAncestors: true });
  assert.equal(r.ok, true);
  assert.equal(r.attempts, 2);
  assert.equal(r.scores.length, ids.length * ITEMS.length);
});

test('runJudgeBatch: three invalid replies mark the batch failed; scores are never filled in', async () => {
  const { base, d, token } = judgeDir();
  const r = await runJudgeBatch({ judgeDir: d, ids, root, evalRoot: join(base, 'eval'), batchId: 'b2', tokenFile: token,
    claudeCmd: fakeJudge(base, ['nope']), requireFrozen: false, requireSecretsAcl: false, skipPreflightAncestors: true });
  assert.equal(r.ok, false);
  assert.equal(r.attempts, 3);
  assert.equal(r.scores, null);
});
