import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readsDenied, canaryPrompt } from '../canary.mjs';

const result = denials => JSON.stringify({ type: 'result', is_error: false, permission_denials: denials });
const deny = p => ({ tool_name: 'Read', tool_use_id: 'x', tool_input: { file_path: p } });
const A = String.raw`C:\r\knowledge\README.md`;
const B = String.raw`C:\r\private\README.md`;
const C = String.raw`C:\m3-eval\cfg\x\canary\settings.json`;

test('readsDenied: all three denied passes; a missing denial fails', () => {
  assert.equal(readsDenied([result([deny(A), deny(B), deny(C)])], [A, B, C]).ok, true);
  const r = readsDenied([result([deny(A), deny(B)])], [A, B, C]);
  assert.equal(r.ok, false);
  assert.deepEqual(r.missing, [C]);
  assert.equal(readsDenied([], [A]).ok, false, 'no result event');
});

test('canaryPrompt: names the three protected files', { skip: process.platform !== 'win32' && 'Windows-only runner' }, () => {
  const p = canaryPrompt({ repoRoot: String.raw`C:\r`, cfgDir: String.raw`C:\m3-eval\cfg\x\canary` });
  for (const f of [A, B, C]) assert.ok(p.includes(f), f);
});

// ---- Skill-run canary (Phase 3, Task 2) ----

test('skillCanaryPrompt: a /material3 call that names the three protected files and the skill file', { skip: process.platform !== 'win32' && 'Windows-only runner' }, async () => {
  const { skillCanaryPrompt } = await import('../canary.mjs');
  const cfg = String.raw`C:\m3-eval\cfg\x\canary`;
  const p = skillCanaryPrompt({ repoRoot: String.raw`C:\r`, cfgDir: cfg });
  assert.ok(p.startsWith('/material3 '));
  for (const f of [A, B, C, String.raw`C:\m3-eval\cfg\x\canary\skills\material3\SKILL.md`]) assert.ok(p.includes(f), f);
});

test('extraNames and finalReply: what a skill canary checks', async () => {
  const { extraNames, finalReply, readSucceeded } = await import('../canary.mjs');
  assert.deepEqual(extraNames({ skills: ['debug', 'material3'], slash_commands: ['debug', 'material3', 'clear'] }, ['debug', 'clear']), ['material3']);
  assert.deepEqual(extraNames({ skills: ['debug'], slash_commands: [] }, ['debug']), []);
  const res = text => JSON.stringify({ type: 'result', is_error: false, result: text });
  assert.equal(finalReply([res(' OK\n')]), 'OK');
  assert.equal(finalReply(['x']), null);
  const use = (id, p) => JSON.stringify({ type: 'assistant', message: { content: [{ type: 'tool_use', id, name: 'Read', input: { file_path: p } }] } });
  const out = (id, isError, content) => JSON.stringify({ type: 'user', message: { content: [{ type: 'tool_result', tool_use_id: id, is_error: isError, content }] } });
  const S = String.raw`C:\m3-eval\cfg\x\canary\skills\material3\SKILL.md`;
  assert.equal(readSucceeded([use('1', S), out('1', false, '1\t---')], S), true);
  assert.equal(readSucceeded([use('1', S), out('1', true, 'Permission denied')], S), false);
  assert.equal(readSucceeded([use('1', A), out('1', false, 'x')], S), false);
});
