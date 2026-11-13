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

test('canaryPrompt: names the three protected files', () => {
  const p = canaryPrompt({ repoRoot: String.raw`C:\r`, cfgDir: String.raw`C:\m3-eval\cfg\x\canary` });
  for (const f of [A, B, C]) assert.ok(p.includes(f), f);
});
